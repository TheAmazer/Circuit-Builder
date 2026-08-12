/* tools/dev-server.mjs — local development only.
 *
 * `serve` can't run the /api function, so nothing exercised the agent end to
 * end. This serves the static site AND mounts the real api/agent.js handler,
 * adapting Node's req/res to the Vercel shape the handler expects.
 *
 * It runs the actual handler — not a mock — so a green result here means the
 * deployed function should behave the same.
 *
 *   node tools/dev-server.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 4321);

/* --- Load .env.local ----------------------------------------------------- */
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!match) continue;
        const value = match[2].replace(/^["']|["']$/g, '');
        if (!process.env[match[1]]) process.env[match[1]] = value;
    }
    console.log('Loaded .env.local');
} else {
    console.warn('No .env.local found — /api/agent will report a missing key.');
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.mp4': 'video/mp4',
    '.ico': 'image/x-icon'
};

function readBody(req) {
    return new Promise(resolve => {
        let raw = '';
        req.on('data', c => { raw += c; });
        req.on('end', () => {
            try { resolve(raw ? JSON.parse(raw) : {}); }
            catch { resolve({}); }
        });
    });
}

/* Minimal shim of the Vercel response helpers the handler uses. */
function adaptResponse(res) {
    res.status = code => { res.statusCode = code; return res; };
    res.json = payload => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(payload));
        return res;
    };
    return res;
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/api/agent') {
        try {
            const { default: handler } = await import(
                `../api/agent.js?v=${Date.now()}` // cache-bust so edits apply without a restart
            );
            req.body = await readBody(req);
            return handler(req, adaptResponse(res));
        } catch (err) {
            console.error('Handler crashed:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Handler crashed: ' + err.message }));
        }
    }

    // Static files.
    let filePath = path.join(ROOT, decodeURIComponent(url.pathname));
    if (url.pathname === '/' || url.pathname === '') filePath = path.join(ROOT, 'index.html');

    // Refuse anything that escapes the project root.
    if (!filePath.startsWith(ROOT)) {
        res.statusCode = 403;
        return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.statusCode = 404;
            return res.end('Not found');
        }
        res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store');
        res.end(data);
    });
});

server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${PORT} is already in use — another dev server is running.`);
        console.error(`Stop it, or start this one on a different port:\n`);
        console.error(`  PORT=4322 node tools/dev-server.mjs\n`);
        process.exit(1);
    }
    throw err;
});

server.listen(PORT, () => {
    const key = process.env.AGENT_API_KEY || '';
    console.log(`NodeCraft dev server  →  http://localhost:${PORT}`);
    console.log(`Provider: ${process.env.AGENT_PROVIDER || 'gemini (default)'}`);
    console.log(`Model:    ${process.env.AGENT_MODEL || '(provider default)'}`);
    // Enough of the key to tell one provider's from another's, without printing it.
    console.log(`Key:      ${key ? `loaded (${key.slice(0, 6)}…${key.slice(-4)}, ${key.length} chars)` : 'MISSING'}`);
    console.log(`Auth:     ${process.env.AGENT_REQUIRE_AUTH === '1' ? 'sign-in required' : 'open (no sign-in needed)'}`);
});
