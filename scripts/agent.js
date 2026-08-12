// agent.js
//
// The agent loop runs here, in the browser, not on the server. The circuit
// lives in this tab and the tools mutate it directly, so keeping the loop
// client-side means no state has to be shipped anywhere and no serverless
// timeout applies — each model turn is its own short request to /api/agent.

import { toolDeclarations, executeTool } from './agentTools.js';

let api = null;
let getAccessToken = null;

// A run is many model turns; this bounds a pathological loop. The server
// enforces its own limit independently.
const MAX_TURNS = 16;

// Generous, because a large model on free capacity is genuinely slow rather
// than broken — but bounded, so a queued request eventually reports back
// instead of leaving the UI on "Thinking…" indefinitely.
const TURN_TIMEOUT_MS = 90_000;

let running = false;

/* --- System prompt --------------------------------------------------------
   The component catalog is injected rather than described, so the model can't
   invent a part that doesn't exist. It is stable across every request, which
   also makes it the cacheable prefix if the provider supports that. */

function buildSystemPrompt() {
    const catalog = Object.entries(api.componentDefinitions)
        .filter(([type]) => !type.startsWith('Composite:'))
        .map(([type, def]) => `${type} (${def.inputs} in, ${def.outputs} out)`)
        .join(', ');

    return [
        'You are the built-in assistant for NodeCraft, a visual logic-circuit simulator.',
        'You help people build, understand and fix digital circuits on their board.',
        '',
        'Available component types: ' + catalog,
        '',
        'How to work:',
        '- Call get_circuit before answering anything about the current board. Never assume what is on it.',
        '- To build a circuit: add every component in ONE add_components call, then create every wire in ONE connect call, then run_truth_table to check it. Batching matters — one call per component wastes the request budget and may hit a rate limit.',
        '- Treat run_truth_table as the test. Compare its output against what the user actually asked for. If it is wrong, fix the circuit and test again rather than reporting success.',
        '- Switches are the inputs and Lights are the outputs. A circuit the user wants to interact with needs both.',
        '- Never pick positions for components; the board lays itself out.',
        '',
        'How to reply:',
        '- Lead with the outcome. The user watched the components appear, so do not narrate every step you took.',
        '- Be brief and concrete. Two or three sentences is usually right.',
        '- If you could not do something, say so plainly and say why.',
        '- Explain circuits in plain language a learner would follow. Avoid jargon unless the user used it first.'
    ].join('\n');
}

/* --- Transport ----------------------------------------------------------- */

async function callModel(messages) {
    // Send whatever session we have and let the server decide. The proxy is the
    // authority on auth; short-circuiting here would also block the localhost
    // anon path used for development.
    const token = await getAccessToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    /* Free-tier capacity for large models queues under load, and a queued
       request can hang indefinitely — without this the UI sits on "Thinking…"
       forever with no way to tell stuck from slow. */
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TURN_TIMEOUT_MS);

    let res;
    try {
        res = await fetch('/api/agent', {
            method: 'POST',
            headers,
            body: JSON.stringify({ system: buildSystemPrompt(), messages, tools: toolDeclarations }),
            signal: controller.signal
        });
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error(`The model did not respond within ${TURN_TIMEOUT_MS / 1000}s. Free-tier capacity for large models can queue — try again, or switch to a smaller model.`);
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.error || `Request failed (${res.status}).`);
        err.status = res.status;
        err.retryAfter = data.retryAfter || null;
        throw err;
    }
    return data;
}

/* Free-tier quotas are per-minute, and a build is several turns, so hitting one
   mid-run is routine rather than exceptional. Wait out the provider's own
   retryDelay instead of losing the run. */
const MAX_RATE_LIMIT_RETRIES = 2;

async function callModelWithBackoff(messages, status) {
    for (let attempt = 0; ; attempt++) {
        try {
            return await callModel(messages);
        } catch (err) {
            const canRetry = err.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES;
            if (!canRetry) throw err;

            const wait = err.retryAfter || 30;
            for (let left = wait; left > 0; left--) {
                status(`Rate limited — resuming in ${left}s…`);
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
}

/* --- The loop ------------------------------------------------------------ */

export async function runAgent(prompt, { onStatus } = {}) {
    if (running) return { error: 'The assistant is already working.' };
    if (!prompt || !prompt.trim()) return { error: 'Type what you would like help with.' };

    running = true;
    const status = onStatus || (() => {});

    // The whole run collapses into one undo step, the same way grouping does —
    // a user who dislikes the result presses Ctrl+Z once, not thirty times.
    api.setSuppressHistory(true);

    const messages = [{ role: 'user', text: prompt.trim() }];

    try {
        for (let turn = 0; turn < MAX_TURNS; turn++) {
            status(turn === 0 ? 'Thinking…' : 'Working…');
            const reply = await callModelWithBackoff(messages, status);

            if (!reply.toolCalls || reply.toolCalls.length === 0) {
                return { text: reply.text || 'Done.' };
            }

            messages.push({ role: 'assistant', text: reply.text, toolCalls: reply.toolCalls });

            const results = [];
            for (const call of reply.toolCalls) {
                status(describeTool(call.name));
                const result = await executeTool(call.name, call.args);
                results.push({ id: call.id, name: call.name, result });
            }
            messages.push({ role: 'user', toolResults: results });
        }

        return { text: 'I stopped after too many steps. Try asking for something smaller.' };
    } catch (err) {
        return { error: err.message };
    } finally {
        api.setSuppressHistory(false);
        api.saveState();
        api.drawMinimap();
        running = false;
    }
}

function describeTool(name) {
    switch (name) {
        case 'get_circuit': return 'Reading the board…';
        case 'add_components': return 'Placing components…';
        case 'connect': return 'Wiring…';
        case 'delete_component': return 'Removing a component…';
        case 'configure_component': return 'Adjusting settings…';
        case 'run_truth_table': return 'Testing the circuit…';
        default: return 'Working…';
    }
}

/* --- UI ------------------------------------------------------------------ */

export function initAgent(config) {
    api = config;
    getAccessToken = config.getAccessToken;

    const bar = document.getElementById('agent-bar');
    const input = document.getElementById('agent-input');
    const submit = document.getElementById('agent-submit');
    const output = document.getElementById('agent-output');
    const toggle = document.getElementById('agent-toggle-btn');

    if (!bar || !input || !submit) return;

    const setOutput = (text, kind) => {
        if (!output) return;
        output.className = `agent-output ${kind || ''}`.trim();
        output.innerText = text || '';
        output.classList.toggle('visible', Boolean(text));
    };

    const openBar = () => {
        bar.classList.add('visible');
        input.focus();
    };
    const closeBar = () => {
        bar.classList.remove('visible');
        setOutput('');
    };

    if (toggle) {
        toggle.addEventListener('click', () => {
            if (bar.classList.contains('visible')) closeBar();
            else openBar();
        });
    }

    const send = async () => {
        const prompt = input.value;
        if (!prompt.trim()) return;

        submit.disabled = true;
        input.disabled = true;
        setOutput('Thinking…', 'working');

        const result = await runAgent(prompt, { onStatus: s => setOutput(s, 'working') });

        submit.disabled = false;
        input.disabled = false;

        if (result.error) {
            setOutput(result.error, 'error');
        } else {
            setOutput(result.text, '');
            input.value = '';
        }
        input.focus();
    };

    submit.addEventListener('click', send);
    input.addEventListener('keydown', e => {
        e.stopPropagation(); // keep circuit hotkeys out of the prompt field
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
        if (e.key === 'Escape') closeBar();
    });
}
