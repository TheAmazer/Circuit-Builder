// agentTools.js
//
// The agent's entire view of, and grip on, the circuit board.
//
// Two design decisions worth keeping:
//
// 1. The model never chooses coordinates. Spatial layout is the weakest part
//    of LLM output — hand-placed x/y produces overlapping, tangled boards. It
//    describes a *graph*; `layoutCircuit()` here assigns positions by
//    topological depth. Component placement is our problem, not the model's.
//
// 2. `run_truth_table` is the point of the whole exercise. NodeCraft has a
//    deterministic simulator, so the agent can verify its own work instead of
//    guessing. Without it this is a plausible-circuit generator; with it, the
//    loop is build → test → fix.

let api = null;

export function initAgentTools(config) {
    api = config;
}

/* --- Pacing ---------------------------------------------------------------
   Tool calls are batched so a build costs four model turns rather than
   nineteen. That is a network concern; visually it made a whole circuit
   appear in a single frame, which reads as a glitch rather than as work.

   These delays are local and cost no API calls, so the build stays four turns
   while the user actually sees it being assembled. The per-item delay shrinks
   as the batch grows, so a six-gate circuit feels deliberate and a fifty-gate
   one does not become a slideshow. */

const PLACE_DELAY_MS = 150;
const WIRE_DELAY_MS = 120;
const MAX_SEQUENCE_MS = 2600; // whole-batch ceiling

function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Per-item delay for a batch of `count`, honouring the OS reduced-motion setting.
function stepDelay(count, base) {
    if (prefersReducedMotion()) return 0;
    return Math.max(0, Math.min(base, MAX_SEQUENCE_MS / Math.max(count, 1)));
}

const wait = ms => (ms > 0 ? new Promise(r => setTimeout(r, ms)) : Promise.resolve());

/* Draws the wire on rather than popping it in. Uses the path's own length so
   the stroke reveals from source to destination at a constant speed. */
function animateWire(pathEl) {
    if (!pathEl || prefersReducedMotion()) return;
    let length = 0;
    try { length = pathEl.getTotalLength(); } catch { return; }
    if (!length) return;

    pathEl.style.strokeDasharray = `${length}`;
    pathEl.style.strokeDashoffset = `${length}`;
    // Force layout so the transition has a start value to animate from.
    pathEl.getBoundingClientRect();
    pathEl.style.transition = 'stroke-dashoffset 260ms cubic-bezier(0.22, 1, 0.36, 1)';
    pathEl.style.strokeDashoffset = '0';

    // Clear the inline dash once drawn, otherwise it fights the existing
    // flowing-signal animation on active wires.
    setTimeout(() => {
        pathEl.style.transition = '';
        pathEl.style.strokeDasharray = '';
        pathEl.style.strokeDashoffset = '';
    }, 320);
}

// Brief highlight so the eye lands on whatever the agent just touched.
function flagAgentTouch(el) {
    if (!el || prefersReducedMotion()) return;
    el.classList.add('agent-touched');
    setTimeout(() => el.classList.remove('agent-touched'), 700);
}

/* --- Layout ---------------------------------------------------------------
   Longest-path layering: a node sits one column right of its deepest input.
   Cheap, stable, and produces left-to-right signal flow, which is how people
   read circuits. */

const COL_WIDTH = 260;
const ROW_HEIGHT = 130;
const ORIGIN_X = 120;
const ORIGIN_Y = 120;

function layoutCircuit() {
    const nodes = api.getNodes();
    const connections = api.getConnections();
    if (nodes.length === 0) return;

    const incoming = new Map(nodes.map(n => [n.id, []]));
    connections.forEach(c => {
        if (incoming.has(c.destNode)) incoming.get(c.destNode).push(c.sourceNode);
    });

    const depth = new Map();
    const resolve = (id, seen) => {
        if (depth.has(id)) return depth.get(id);
        // Feedback loops are legal here (flip-flops), so guard the recursion.
        if (seen.has(id)) return 0;
        seen.add(id);
        const parents = incoming.get(id) || [];
        const d = parents.length === 0
            ? 0
            : Math.max(...parents.map(p => resolve(p, seen) + 1));
        depth.set(id, d);
        return d;
    };
    nodes.forEach(n => resolve(n.id, new Set()));

    const columns = new Map();
    nodes.forEach(n => {
        const d = depth.get(n.id) || 0;
        if (!columns.has(d)) columns.set(d, []);
        columns.get(d).push(n);
    });

    columns.forEach((column, d) => {
        column.forEach((node, row) => {
            const x = ORIGIN_X + d * COL_WIDTH;
            const y = ORIGIN_Y + row * ROW_HEIGHT;
            node.el.style.left = `${x}px`;
            node.el.style.top = `${y}px`;
            node.x = x;
            node.y = y;
        });
    });

    api.updateConnections();
    api.drawMinimap();
}

/* --- Truth table ----------------------------------------------------------
   Sweeps every combination of the board's Switches and records what the
   Lights, Dials and Bar Graphs read. Restores the original switch positions
   afterwards so running it is non-destructive. */

const MAX_SWEEP_INPUTS = 10; // 2^10 = 1024 rows; beyond this it is unreadable anyway

function readOutputs(outputs) {
    return outputs.map(n => {
        if (n.type === 'Light') {
            const el = n.el.querySelector('.light-indicator');
            return { id: n.id, label: n.config.label || 'Light', value: el && el.classList.contains('on') ? 1 : 0 };
        }
        const display = n.el.querySelector('.dial-display');
        return {
            id: n.id,
            label: n.config.label || n.type,
            value: display ? display.innerText : String(n.outputValue ?? 0)
        };
    });
}

function runTruthTable() {
    const nodes = api.getNodes();
    const switches = nodes.filter(n => n.type === 'Switch');
    const outputs = nodes.filter(n => ['Light', 'Dial', 'Bar Graph'].includes(n.type));

    if (switches.length === 0) return { error: 'No Switch components on the board, so there are no inputs to sweep.' };
    if (outputs.length === 0) return { error: 'No Light, Dial or Bar Graph on the board, so there is nothing to measure.' };
    if (switches.length > MAX_SWEEP_INPUTS) {
        return { error: `${switches.length} switches would need ${2 ** switches.length} rows. Reduce to ${MAX_SWEEP_INPUTS} or fewer.` };
    }

    const original = switches.map(n => n.el.querySelector('.toggle-switch').classList.contains('on'));
    const rows = [];

    for (let combo = 0; combo < (1 << switches.length); combo++) {
        switches.forEach((n, i) => {
            const on = Boolean(combo & (1 << i));
            const toggle = n.el.querySelector('.toggle-switch');
            toggle.classList.toggle('on', on);
        });
        api.updateSimulation();
        rows.push({
            inputs: switches.map((n, i) => ({
                label: n.config.label || `Switch ${i + 1}`,
                value: (combo & (1 << i)) ? 1 : 0
            })),
            outputs: readOutputs(outputs)
        });
    }

    // Restore.
    switches.forEach((n, i) => n.el.querySelector('.toggle-switch').classList.toggle('on', original[i]));
    api.updateSimulation();

    return {
        inputs: switches.map((n, i) => n.config.label || `Switch ${i + 1}`),
        outputs: outputs.map(n => n.config.label || n.type),
        rows
    };
}

/* --- Tool declarations ---------------------------------------------------
   Descriptions are prescriptive about *when* to call, not just what the tool
   does — that is what drives correct tool selection. */

export const toolDeclarations = [
    {
        name: 'get_circuit',
        description: 'Read the current circuit: every component with its id, type and settings, plus every wire. Call this first, before any analysis or edit, so you are working from the real board rather than assumptions.',
        parameters: { type: 'object', properties: {} }
    },
    {
        name: 'list_component_types',
        description: 'List every component type that can be placed, with its input and output pin counts. Call this before adding components so you only use types that actually exist.',
        parameters: { type: 'object', properties: {} }
    },
    /* Batched deliberately. One model turn per component would make a six-gate
       circuit ~19 round trips, which burns free-tier rate limits and is slow.
       These take a whole list, so a build is a handful of turns. */
    {
        name: 'add_components',
        description: 'Place components on the board in one step and return their new ids, in the same order. Always add every component you need in a single call rather than calling this repeatedly. Do not specify positions — the board lays itself out.',
        parameters: {
            type: 'object',
            properties: {
                components: {
                    type: 'array',
                    description: 'Every component to place.',
                    items: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', description: 'Exact component type, e.g. "AND", "XOR", "Switch", "Light".' },
                            label: { type: 'string', description: 'Optional name shown on the component, e.g. "A" or "Carry".' }
                        },
                        required: ['type']
                    }
                }
            },
            required: ['components']
        }
    },
    {
        name: 'connect',
        description: 'Wire outputs to inputs. Pass every wire you need in one call rather than calling this repeatedly. Pin indexes are zero-based, counted top to bottom. Boolean outputs can only drive boolean inputs.',
        parameters: {
            type: 'object',
            properties: {
                wires: {
                    type: 'array',
                    description: 'Every wire to create.',
                    items: {
                        type: 'object',
                        properties: {
                            sourceId: { type: 'string', description: 'Component id the signal comes from.' },
                            sourcePin: { type: 'number', description: 'Zero-based output pin index.' },
                            destId: { type: 'string', description: 'Component id the signal goes to.' },
                            destPin: { type: 'number', description: 'Zero-based input pin index.' }
                        },
                        required: ['sourceId', 'sourcePin', 'destId', 'destPin']
                    }
                }
            },
            required: ['wires']
        }
    },
    {
        name: 'delete_component',
        description: 'Remove one component and every wire attached to it. Use when correcting a circuit that has the wrong part.',
        parameters: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id']
        }
    },
    {
        name: 'configure_component',
        description: 'Change a setting on a component — a Constant\'s value, a Threshold\'s range, a Function\'s formula, a Clock\'s period, or any component\'s label.',
        parameters: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                key: { type: 'string', description: 'Setting name, e.g. "value", "min", "max", "formula", "period", "label".' },
                value: { type: 'string', description: 'New value. Numbers are parsed automatically.' }
            },
            required: ['id', 'key', 'value']
        }
    },
    {
        name: 'run_truth_table',
        description: 'Sweep every combination of the board\'s Switches and report what each Light and Dial reads. This is how you verify a circuit actually behaves as intended — always run it after building or correcting one, and compare the result against what the user asked for before telling them it is done.',
        parameters: { type: 'object', properties: {} }
    }
];

/* --- Executors ----------------------------------------------------------- */

const executors = {
    get_circuit() {
        const nodes = api.getNodes();
        return {
            components: nodes.map(n => ({
                id: n.id,
                type: n.type,
                label: n.config.label || null,
                settings: n.config,
                inputs: api.componentDefinitions[n.type]?.inputs ?? 0,
                outputs: api.componentDefinitions[n.type]?.outputs ?? 0
            })),
            wires: api.getConnections().map(c => ({
                sourceId: c.sourceNode, sourcePin: Number(c.sourceIndex),
                destId: c.destNode, destPin: Number(c.destIndex)
            }))
        };
    },

    list_component_types() {
        return Object.entries(api.componentDefinitions)
            .filter(([type]) => !type.startsWith('Composite:'))
            .map(([type, def]) => ({ type, inputs: def.inputs, outputs: def.outputs }));
    },

    /* Both batch tools report per-item outcomes rather than failing the whole
       call on one bad entry — the model can then fix just the broken item
       instead of redoing everything, which keeps the turn count down. */

    async add_components({ components }) {
        if (!Array.isArray(components) || components.length === 0) {
            return { error: 'Pass a non-empty "components" array.' };
        }

        const placed = [];
        const errors = [];
        const delay = stepDelay(components.length, PLACE_DELAY_MS);

        for (let i = 0; i < components.length; i++) {
            const { type, label } = components[i] || {};
            if (!api.componentDefinitions[type]) {
                errors.push(`#${i}: "${type}" is not a component type. Call list_component_types for valid names.`);
                continue;
            }

            const el = api.createNode(type, 0, 0);
            const node = api.getNodes()[api.getNodes().length - 1];
            if (label) {
                node.config.label = label;
                const header = el.querySelector('.node-header span');
                if (header) header.innerText = label;
            }
            placed.push({ id: node.id, type, label: label || null });

            // Re-layout after every placement so components visibly settle into
            // their columns as the circuit takes shape, rather than jumping once
            // at the end.
            layoutCircuit();
            flagAgentTouch(el);
            await wait(delay);
        }

        api.updateSimulation();
        return errors.length ? { placed, errors } : { placed };
    },

    async connect({ wires }) {
        if (!Array.isArray(wires) || wires.length === 0) {
            return { error: 'Pass a non-empty "wires" array.' };
        }

        let connected = 0;
        const errors = [];
        const delay = stepDelay(wires.length, WIRE_DELAY_MS);

        for (let i = 0; i < wires.length; i++) {
            const { sourceId, sourcePin, destId, destPin } = wires[i] || {};
            const source = api.getNodes().find(n => n.id === sourceId);
            const dest = api.getNodes().find(n => n.id === destId);
            if (!source) { errors.push(`#${i}: no component with id "${sourceId}".`); continue; }
            if (!dest) { errors.push(`#${i}: no component with id "${destId}".`); continue; }

            const sp = source.el.querySelector(`.outputs .pin[data-index="${sourcePin}"]`);
            const dp = dest.el.querySelector(`.inputs .pin[data-index="${destPin}"]`);
            if (!sp) { errors.push(`#${i}: ${source.type} has no output pin ${sourcePin}.`); continue; }
            if (!dp) { errors.push(`#${i}: ${dest.type} has no input pin ${destPin}.`); continue; }

            // Mirror the type safety the UI enforces, so the agent gets the same
            // explanation a user would rather than a silently dropped wire.
            const sourceKind = sp.classList.contains('num') ? 'number' : 'boolean';
            const destKind = dp.classList.contains('num') ? 'number' : 'boolean';
            if (sourceKind !== destKind) {
                errors.push(`#${i}: cannot wire a ${sourceKind} output into a ${destKind} input.`);
                continue;
            }

            api.createConnection(sp, dp);
            connected++;

            // createConnection appends the new path last.
            const conns = api.getConnections();
            animateWire(conns[conns.length - 1]?.pathEl);
            flagAgentTouch(dest.el);

            // Show the signal propagate as each wire lands, rather than the
            // whole circuit lighting up at the end.
            api.updateSimulation();
            await wait(delay);
        }

        api.updateSimulation();
        return errors.length ? { connected, errors } : { connected };
    },

    delete_component({ id }) {
        const removed = api.deleteNodeById(id);
        if (!removed) return { error: `No component with id "${id}".` };
        layoutCircuit();
        api.updateSimulation();
        return { ok: true };
    },

    configure_component({ id, key, value }) {
        const node = api.getNodes().find(n => n.id === id);
        if (!node) return { error: `No component with id "${id}".` };

        if (key === 'label') {
            node.config.label = String(value);
            const header = node.el.querySelector('.node-header span');
            if (header) header.innerText = String(value);
        } else {
            const num = parseFloat(value);
            node.config[key] = Number.isNaN(num) ? value : num;
        }
        api.updateSimulation();
        return { ok: true, settings: node.config };
    },

    run_truth_table: runTruthTable
};

// Runs one tool call and always resolves — a thrown tool is reported back to
// the model as an error result so it can recover, rather than killing the run.
export async function executeTool(name, args) {
    const fn = executors[name];
    if (!fn) return { error: `Unknown tool "${name}".` };
    try {
        return await fn(args || {});
    } catch (err) {
        console.error(`Agent tool "${name}" failed`, err);
        return { error: `${name} failed: ${err.message}` };
    }
}

export function relayoutCircuit() { layoutCircuit(); }
