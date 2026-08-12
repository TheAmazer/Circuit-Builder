/* api/agent.js — Vercel serverless function
 *
 * Thin, stateless proxy between the browser and the LLM provider.
 *
 * Why a proxy at all: NodeCraft is a static site, so an API key shipped to the
 * client is readable by anyone. The key lives only in Vercel's environment.
 *
 * Why stateless: the agent loop runs in the *browser*, because that is where
 * the circuit lives and where the tools mutate state. Each call here handles
 * exactly one model turn, so a long agent run is many short requests rather
 * than one long-lived function — no serverless timeout to fight.
 *
 * Required environment variables (Vercel → Settings → Environment Variables):
 *   AGENT_API_KEY   the provider key (Gemini, Grok, …)
 *   AGENT_PROVIDER  optional, defaults to "gemini"
 *   AGENT_MODEL     optional, overrides the provider's default model
 *   AGENT_REQUIRE_AUTH  optional, "1" to require a signed-in Supabase session
 */

const SUPABASE_URL = 'https://zlgmzogvpoafnfgstqna.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ216b2d2cG9hZm5mZ3N0cW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjU0NjUsImV4cCI6MjA4NjcwMTQ2NX0.SREmeECeBtplGtvyRnqfbecgCZJHZPUIeSHby3TXC9k';

/* Bounds one browser-side agent run. The client also caps its loop; this is the
   server-side backstop so a bug or a crafted client can't spin indefinitely.

   Anonymous callers get a tighter budget than signed-in ones. A build is about
   four turns, so the anon allowance still covers a couple of circuits a minute
   while making sustained scripted abuse expensive. */
const MAX_TURNS_PER_MINUTE = 40;
const MAX_ANON_TURNS_PER_MINUTE = 12;

/* --- Naive per-user rate limit -------------------------------------------
   In-memory, so it resets on cold start and isn't shared across regions. It is
   a cost guard against a runaway loop, not a security control. Move to a
   Supabase table or Upstash if this ever needs to be authoritative. */
const recentTurns = new Map();

function overRateLimit(key, ceiling) {
    const now = Date.now();
    const windowStart = now - 60_000;
    const hits = (recentTurns.get(key) || []).filter(t => t > windowStart);
    hits.push(now);
    recentTurns.set(key, hits);

    // Opportunistic cleanup so the map can't grow without bound.
    if (recentTurns.size > 500) {
        for (const [entryKey, times] of recentTurns) {
            if (!times.some(t => t > windowStart)) recentTurns.delete(entryKey);
        }
    }
    return hits.length > ceiling;
}

/* Rate-limit key. A signed-in user is identified by id; an anonymous caller by
   forwarded IP, which is the only stable handle available. `x-forwarded-for`
   is a client-settable header, so this is a cost guard against runaway loops
   and casual abuse, not a security control — a determined caller can rotate
   it. If this endpoint ever needs real protection, the answer is the auth gate
   below, not a better IP heuristic. */
function callerKey(req, user) {
    if (user) return `user:${user.id}`;
    const forwarded = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return `anon:${forwarded || req.socket?.remoteAddress || 'unknown'}`;
}

/* --- Auth ---------------------------------------------------------------
   The agent is sign-in gated. Rather than verifying the JWT signature here
   (which needs the project's JWT secret), we ask Supabase who the token
   belongs to. One extra round trip, no secret to hold, and it honours
   revocation immediately. */
async function resolveUser(accessToken) {
    if (!accessToken) return null;
    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!res.ok) return null;
        const user = await res.json();
        return user && user.id ? user : null;
    } catch {
        return null;
    }
}

/* --- Provider adapters ---------------------------------------------------
   Each adapter converts NodeCraft's neutral request shape into the provider's
   wire format and back. The neutral shape is:

     request  { system, messages: [{role, text?, toolCalls?, toolResults?}], tools }
     response { text, toolCalls: [{id, name, args}], finishReason }

   Adding a provider means adding one entry here — nothing else changes. */

const providers = {
    /* Google Gemini — REST, v1beta generateContent.
       Docs: ai.google.dev/api/generate-content */
    gemini: {
        // Alias rather than a pinned id: Google retires specific versions (2.0-flash
        // and the 2.5 line both 404 for new keys), and an alias tracks the current one.
        defaultModel: 'gemini-flash-latest',

        buildRequest({ system, messages, tools, model, apiKey }) {
            const contents = messages.map(m => {
                if (m.toolResults) {
                    // Gemini expects tool output as functionResponse parts on a
                    // 'user' turn, one per call, matched by function name.
                    return {
                        role: 'user',
                        parts: m.toolResults.map(r => ({
                            functionResponse: {
                                name: r.name,
                                response: { result: r.result }
                            }
                        }))
                    };
                }
                if (m.toolCalls) {
                    return {
                        role: 'model',
                        parts: m.toolCalls.map(c => {
                            const part = { functionCall: { name: c.name, args: c.args || {} } };
                            // Gemini 3.x attaches a thoughtSignature to each function
                            // call and rejects the next turn with a 400 unless it is
                            // echoed back unchanged. It is opaque — carry it, don't
                            // read it. Only shows up on turn 2+, so a single-call
                            // test will never catch a missing one.
                            if (c.signature) part.thoughtSignature = c.signature;
                            return part;
                        })
                    };
                }
                return {
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.text || '' }]
                };
            });

            const body = { contents };
            if (system) body.systemInstruction = { parts: [{ text: system }] };
            if (tools && tools.length) {
                body.tools = [{
                    functionDeclarations: tools.map(t => ({
                        name: t.name,
                        description: t.description,
                        parameters: t.parameters
                    }))
                }];
            }

            return {
                url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body
            };
        },

        parseResponse(data) {
            const candidate = (data.candidates && data.candidates[0]) || {};
            const parts = (candidate.content && candidate.content.parts) || [];

            const text = parts.filter(p => p.text).map(p => p.text).join('');
            const toolCalls = parts
                .filter(p => p.functionCall)
                .map((p, i) => ({
                    id: `${p.functionCall.name}-${i}`,
                    name: p.functionCall.name,
                    args: p.functionCall.args || {},
                    // Round-tripped verbatim on the next turn; see buildRequest.
                    signature: p.thoughtSignature || null
                }));

            return { text, toolCalls, finishReason: candidate.finishReason || null };
        }
    },

    /* OpenRouter — OpenAI-compatible, and offers free models that support tool
       calling. Uses the same wire format as Grok below; only the endpoint and
       a couple of courtesy headers differ, so it delegates its request
       building rather than duplicating it. */
    openrouter: {
        // Free and tool-calling capable. Swap via AGENT_MODEL — see
        // openrouter.ai/models?max_price=0 for the current free list.
        // Tested against the agent loop: gpt-oss-20b places components then abandons
        // the task without wiring or verifying. Nemotron completes the full
        // get_circuit -> add_components -> connect -> run_truth_table sequence.
        defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',

        buildRequest(args) {
            const built = providers.grok.buildRequest(args);
            built.url = 'https://openrouter.ai/api/v1/chat/completions';
            // OpenRouter attributes traffic by these; harmless if omitted.
            built.headers['HTTP-Referer'] = 'https://circuitbuilder-omega.vercel.app';
            built.headers['X-Title'] = 'NodeCraft';
            return built;
        },

        parseResponse(data) {
            return providers.grok.parseResponse(data);
        }
    },

    /* xAI Grok — OpenAI-compatible chat completions. Included so the swap is a
       one-line env change if the Gemini quota runs out. */
    grok: {
        defaultModel: 'grok-2-latest',

        buildRequest({ system, messages, tools, model, apiKey }) {
            const chat = [];
            if (system) chat.push({ role: 'system', content: system });

            messages.forEach(m => {
                if (m.toolResults) {
                    m.toolResults.forEach(r => chat.push({
                        role: 'tool',
                        tool_call_id: r.id,
                        content: typeof r.result === 'string' ? r.result : JSON.stringify(r.result)
                    }));
                } else if (m.toolCalls) {
                    chat.push({
                        role: 'assistant',
                        content: m.text || null,
                        tool_calls: m.toolCalls.map(c => ({
                            id: c.id,
                            type: 'function',
                            function: { name: c.name, arguments: JSON.stringify(c.args || {}) }
                        }))
                    });
                } else {
                    chat.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text || '' });
                }
            });

            const body = { model, messages: chat };
            if (tools && tools.length) {
                body.tools = tools.map(t => ({
                    type: 'function',
                    function: { name: t.name, description: t.description, parameters: t.parameters }
                }));
            }

            return {
                url: 'https://api.x.ai/v1/chat/completions',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body
            };
        },

        parseResponse(data) {
            const choice = (data.choices && data.choices[0]) || {};
            const message = choice.message || {};
            const toolCalls = (message.tool_calls || []).map(c => {
                let args = {};
                try { args = JSON.parse(c.function.arguments || '{}'); } catch { /* malformed args */ }
                return { id: c.id, name: c.function.name, args };
            });
            return { text: message.content || '', toolCalls, finishReason: choice.finish_reason || null };
        }
    }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.AGENT_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Agent is not configured: AGENT_API_KEY is unset.' });
    }

    const providerName = process.env.AGENT_PROVIDER || 'gemini';
    const provider = providers[providerName];
    if (!provider) {
        return res.status(500).json({ error: `Unknown AGENT_PROVIDER "${providerName}".` });
    }

    /* Sign-in gate — currently OPEN.
       The assistant is deliberately usable without an account while the project
       is being shown around. The gate is intact, not removed: set
       AGENT_REQUIRE_AUTH=1 to turn it back on, and every signed-in caller is
       still resolved and identified below so the switch is a config change
       rather than a code change.

       Consequence while this is off: the endpoint spends your provider key on
       behalf of anyone who finds it. The rate limits are the only thing
       standing between a script and your quota. */
    const requireAuth = process.env.AGENT_REQUIRE_AUTH === '1';

    // Resolved even when the gate is open: a signed-in caller gets the higher
    // rate-limit budget and a stable key that isn't spoofable.
    const authHeader = req.headers.authorization || '';
    const user = await resolveUser(authHeader.replace(/^Bearer\s+/i, ''));

    if (requireAuth && !user) {
        return res.status(401).json({ error: 'Sign in to use the assistant.' });
    }

    const ceiling = user ? MAX_TURNS_PER_MINUTE : MAX_ANON_TURNS_PER_MINUTE;
    if (overRateLimit(callerKey(req, user), ceiling)) {
        return res.status(429).json({
            error: user
                ? 'Too many requests. Give the assistant a moment.'
                : 'Too many requests. Sign in for a higher limit, or try again shortly.'
        });
    }

    const { system, messages, tools } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages must be a non-empty array.' });
    }

    const model = process.env.AGENT_MODEL || provider.defaultModel;

    try {
        const built = provider.buildRequest({ system, messages, tools, model, apiKey });
        const upstream = await fetch(built.url, {
            method: 'POST',
            headers: built.headers,
            body: JSON.stringify(built.body)
        });

        const raw = await upstream.text();
        if (!upstream.ok) {
            // Surface the provider's own message — it is usually specific
            // (quota, bad model id) — but never echo the request back.
            console.error('Provider error', upstream.status, raw.slice(0, 500));

            // Gemini returns a RetryInfo block on 429 saying how long to wait.
            // Pass it through so the client can back off by the real amount
            // instead of guessing.
            let retryAfter = null;
            if (upstream.status === 429) {
                const match = raw.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
                retryAfter = match ? Math.ceil(parseFloat(match[1])) : 30;
            }

            return res.status(upstream.status === 429 ? 429 : 502).json({
                error: upstream.status === 429
                    ? `Rate limited by the provider. Retrying in ${retryAfter}s.`
                    : `Provider returned ${upstream.status}.`,
                retryAfter,
                detail: raw.slice(0, 300)
            });
        }

        const parsed = provider.parseResponse(JSON.parse(raw));
        return res.status(200).json({ ...parsed, model, provider: providerName });
    } catch (err) {
        console.error('Agent proxy failure', err);
        return res.status(500).json({ error: 'Agent request failed.' });
    }
}
