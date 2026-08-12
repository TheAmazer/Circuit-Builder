// simulation.js

/* A composite instance's node type is `Composite:<definitionId>`. Encoding the
   identity in the type means createNode, the save format and the component
   menu all work unchanged — a composite is just another component type whose
   pin counts happen to come from a user-built definition. */
export const COMPOSITE_PREFIX = 'Composite:';
export function isComposite(type) { return typeof type === 'string' && type.startsWith(COMPOSITE_PREFIX); }
export function compositeIdOf(type) { return type.slice(COMPOSITE_PREFIX.length); }

// Guards against a composite that (directly or indirectly) contains itself.
// Reaching this limit yields zeros rather than blowing the stack.
const MAX_NEST_DEPTH = 8;

/* Composite definitions live in script.js, which owns persistence and the UI.
   simulation.js only needs to look them up, so the registry is injected. */
let compositeDefs = new Map();
export function setCompositeRegistry(map) { compositeDefs = map; }
export function getCompositeDef(id) { return compositeDefs.get(id); }

function toBool(v) { return (typeof v === 'number' ? v > 0 : v) === true; }

/* --- Tick identity ---------------------------------------------------------
   updateSimulation settles combinational logic by re-evaluating every node up
   to 20 times per call. Time-based components (Timer, Delay, Debounce, Clock)
   must advance once per *tick*, not once per settle pass, or they run up to
   20x too fast. `null` means an event-driven refresh (a switch toggled, a wire
   changed) where no simulated time passes at all.
   --------------------------------------------------------------------------- */
let currentTickId = null;

// True at most once per node per tick; false during event-driven refreshes.
function advancesThisTick(n) {
    if (currentTickId === null) return false;
    if (!n.memory) return false;
    if (n.memory.lastTickId === currentTickId) return false;
    n.memory.lastTickId = currentTickId;
    return true;
}

/* Builds the per-instance runtime for a composite: a private copy of the
   definition's inner nodes, each with its own memory. Two instances of the
   same definition must not share flip-flop or counter state. */
function instantiateInner(def) {
    return {
        nodes: def.nodes.map(nd => ({
            id: nd.id,
            type: nd.type,
            config: JSON.parse(JSON.stringify(nd.config || {})),
            memory: {},
            // Inner Switches have no DOM, so their state lives in config.
            isOn: !!nd.isOn
        })),
        connections: def.connections.map(c => ({ ...c })),
        state: {}
    };
}

/* Runs one evaluation of a composite's inner circuit and returns its output
   port values. Mirrors the fixpoint loop in updateSimulation, minus anything
   that touches the DOM. */
function evaluateComposite(node, s, depth) {
    const def = compositeDefs.get(compositeIdOf(node.type));
    if (!def) return [];

    if (depth >= MAX_NEST_DEPTH) {
        // Recursive definition; fail safe instead of recursing forever.
        return def.outputs.map(() => 0);
    }

    if (!node.memory.inner) node.memory.inner = instantiateInner(def);
    const inner = node.memory.inner;

    const state = {};
    inner.nodes.forEach(n => {
        state[n.id] = { type: n.type, inputVals: {}, outputVals: {} };
        if (n.memory && n.memory.state !== undefined) state[n.id].internalState = n.memory.state;
        // Inner sources read from data rather than the DOM.
        if (n.type === 'Switch') state[n.id].outputVals[0] = !!n.isOn;
        if (n.type === 'Lever') state[n.id].outputVals[0] = n.config.value || 0;
    });

    // Drive the definition's input ports from this instance's incoming pins.
    def.inputs.forEach((port, idx) => {
        const target = state[port.nodeId];
        if (target) target.inputVals[port.pinIndex] = s.inputVals[idx] !== undefined ? s.inputVals[idx] : 0;
    });

    for (let pass = 0; pass < 20; pass++) {
        let changed = false;

        inner.connections.forEach(conn => {
            const src = state[conn.sourceNode];
            const dst = state[conn.destNode];
            if (!src || !dst) return;
            const val = src.outputVals[conn.sourceIndex];
            if (dst.inputVals[conn.destIndex] !== val) {
                dst.inputVals[conn.destIndex] = val;
                changed = true;
            }
        });

        // Re-apply port inputs each pass; an inner wire must not overwrite them.
        def.inputs.forEach((port, idx) => {
            const target = state[port.nodeId];
            if (!target) return;
            const v = s.inputVals[idx] !== undefined ? s.inputVals[idx] : 0;
            if (target.inputVals[port.pinIndex] !== v) {
                target.inputVals[port.pinIndex] = v;
                changed = true;
            }
        });

        inner.nodes.forEach(n => {
            const ns = state[n.id];
            const result = evaluateGate(n, ns, depth + 1);

            if (Array.isArray(result)) {
                result.forEach((v, i) => {
                    if (ns.outputVals[i] !== v) { ns.outputVals[i] = v; changed = true; }
                });
            } else if (n.type !== 'Switch' && n.type !== 'Lever' && n.type !== 'Light' && n.type !== 'Dial') {
                if (ns.outputVals[0] !== result) { ns.outputVals[0] = result; changed = true; }
            }
        });

        if (!changed) break;
    }

    // Persist sequential state back onto this instance.
    inner.nodes.forEach(n => {
        if (state[n.id].internalState !== undefined) n.memory.state = state[n.id].internalState;
        if (n.type.includes('Flip-Flop') || n.type === 'Memory Register') {
            let clkIdx = 1;
            if (n.type === 'JK Flip-Flop') clkIdx = 2;
            n.memory.lastClock = toBool(state[n.id].inputVals[clkIdx]);
        }
    });

    return def.outputs.map(port => {
        const src = state[port.nodeId];
        const v = src ? src.outputVals[port.pinIndex] : 0;
        return v === undefined ? 0 : v;
    });
}


/* ------------------------------------------------------------------
   Per-node evaluation.

   Deliberately DOM-free: it reads only from `s.inputVals` and the node's
   own config/memory, and returns the output value. That is what lets the
   same logic drive both the top-level board (where nodes have DOM elements)
   and the inside of a composite instance (where they do not).

   Returns a scalar for ordinary gates, or an array of outputs for a
   composite instance, which can expose several output ports.
   ------------------------------------------------------------------ */
function evaluateGate(n, s, depth) {
    const i0 = s.inputVals[0] !== undefined ? s.inputVals[0] : 0;
    const i1 = s.inputVals[1] !== undefined ? s.inputVals[1] : 0;
    const i2 = s.inputVals[2] !== undefined ? s.inputVals[2] : 0;
    let out = 0;
    const b0 = (typeof i0 === 'number' ? i0 > 0 : i0) === true;
    const b1 = (typeof i1 === 'number' ? i1 > 0 : i1) === true;
    const b2 = (typeof i2 === 'number' ? i2 > 0 : i2) === true;

    switch (n.type) {
        case 'AND': out = b0 && b1; break;
        case 'OR': out = b0 || b1; break;
        case 'NOT': out = !b0; break;
        case 'XOR': out = b0 !== b1; break;
        case 'NAND': out = !(b0 && b1); break;
        case 'NOR': out = !(b0 || b1); break;
        case 'XNOR': out = b0 === b1; break;
        case 'ADD': out = (Number(i0) || 0) + (Number(i1) || 0); break;
        case 'SUB': out = (Number(i0) || 0) - (Number(i1) || 0); break;
        case 'MUL': out = (Number(i0) || 0) * (Number(i1) || 0); break;
        case 'DIV': const divI1 = Number(i1) || 0; out = divI1 === 0 ? 0 : (Number(i0) || 0) / divI1; break;
        case 'Equal': out = (Number(i0) || 0) === (Number(i1) || 0); break;
        case 'Greater Than': out = (Number(i0) || 0) > (Number(i1) || 0); break;
        case 'Less Than': out = (Number(i0) || 0) < (Number(i1) || 0); break;
        case 'Numerical Switchbox': out = b2 ? (Number(i1) || 0) : (Number(i0) || 0); break;
        case 'Threshold':
            const min = n.config.min !== undefined ? n.config.min : 0;
            const max = n.config.max !== undefined ? n.config.max : 1;
            const valIn = Number(i0) || 0;
            out = (valIn >= min && valIn <= max);
            break;
        case 'Function':
            const formula = n.config.formula || 'x';
            const x = Number(i0) || 0;
            try {
                const func = new Function('x', `try { return ${formula}; } catch(e) { return 0; }`);
                out = func(x);
                if (typeof out !== 'number' || isNaN(out)) out = 0;
            } catch (e) { out = 0; }
            break;
        case 'SR Latch':
            if (b0) s.internalState = true; else if (b1) s.internalState = false;
            out = s.internalState; break;
        case 'D Flip-Flop':
            if (b1 && !n.memory.lastClock) s.internalState = b0;
            out = s.internalState; break;
        case 'JK Flip-Flop':
            if (b2 && !n.memory.lastClock) {
                if (b0 && !b1) s.internalState = true;
                else if (!b0 && b1) s.internalState = false;
                else if (b0 && b1) s.internalState = !s.internalState;
            }
            out = s.internalState; break;
        case 'T Flip-Flop':
            if (b1 && !n.memory.lastClock) { if (b0) s.internalState = !s.internalState; }
            out = s.internalState; break;
        case 'Memory Register':
            if (b2) { s.internalState = n.config.resetVal || 0; }
            else if (b1 && !n.memory.lastClock) { s.internalState = (Number(i0) || 0); }
            if (s.internalState === undefined) s.internalState = n.config.resetVal || 0;
            out = s.internalState; break;
        // New Logic Gates
        case 'Buffer': out = i0; break;
        case 'Tri-State': out = b1 ? i0 : 0; break;
        // New Math Gates
        case 'MOD': const modB = Number(i1) || 0; out = modB === 0 ? 0 : (Number(i0) || 0) % modB; break;
        case 'ABS': out = Math.abs(Number(i0) || 0); break;
        case 'NEG': out = -(Number(i0) || 0); break;
        case 'POW': out = Math.pow(Number(i0) || 0, Number(i1) || 0); break;
        case 'SQRT': const sqrtVal = Number(i0) || 0; out = sqrtVal >= 0 ? Math.sqrt(sqrtVal) : 0; break;
        case 'MIN': out = Math.min(Number(i0) || 0, Number(i1) || 0); break;
        case 'MAX': out = Math.max(Number(i0) || 0, Number(i1) || 0); break;
        case 'CLAMP':
            const clampVal = Number(i0) || 0;
            const clampMin = Number(i1) || 0;
            const clampMax = Number(i2) || 0;
            out = Math.min(clampMax, Math.max(clampMin, clampVal));
            break;
        case 'ROUND': out = Math.round(Number(i0) || 0); break;
        case 'FLOOR': out = Math.floor(Number(i0) || 0); break;
        case 'CEIL': out = Math.ceil(Number(i0) || 0); break;
        // Signal/Utility Gates
        case 'Constant': out = n.config.value || 0; break;
        case 'Delay':
            if (!n.memory.buffer) n.memory.buffer = [];
            const delayTicks = n.config.ticks || 1;
            // Shift the pipeline once per tick; settle passes only re-read it.
            if (advancesThisTick(n)) {
                n.memory.buffer.push(i0);
                n.memory.lastOut = n.memory.buffer.length > delayTicks ? n.memory.buffer.shift() : 0;
            }
            out = n.memory.lastOut !== undefined ? n.memory.lastOut : 0;
            break;
        case 'Pulse':
            if (b0 && !n.memory.lastInput) out = 1;
            else out = 0;
            n.memory.lastInput = b0;
            break;
        case 'Debounce':
            const debounceTicks = n.config.ticks || 5;
            if (advancesThisTick(n)) {
                if (b0 !== n.memory.lastStableValue) {
                    n.memory.counter = (n.memory.counter || 0) + 1;
                    if (n.memory.counter >= debounceTicks) {
                        n.memory.lastStableValue = b0;
                        n.memory.counter = 0;
                    }
                } else {
                    n.memory.counter = 0;
                }
            }
            out = n.memory.lastStableValue ? 1 : 0;
            break;
        case 'Counter':
            if (b1) { n.memory.count = 0; }
            else if (b0 && !n.memory.lastClock) { n.memory.count = (n.memory.count || 0) + 1; }
            out = n.memory.count || 0;
            n.memory.lastClock = b0;
            break;
        case 'Timer':
            // Reset is level-sensitive so it applies on any pass; counting is
            // time-based and must only advance on a real tick.
            if (b1) { n.memory.time = 0; }
            else if (b0 && advancesThisTick(n)) { n.memory.time = (n.memory.time || 0) + 1; }
            out = n.memory.time || 0;
            break;
        case 'Clock':
            // Free-running oscillator: flips every `period` ticks.
            {
                const period = Math.max(1, Math.round(n.config.period || 10));
                if (advancesThisTick(n)) {
                    n.memory.phase = (n.memory.phase || 0) + 1;
                    if (n.memory.phase >= period) {
                        n.memory.phase = 0;
                        n.memory.clockHigh = !n.memory.clockHigh;
                    }
                }
                /* Deliberately NOT `memory.state`: that key is reserved for
                   flip-flops, which updateSimulation snapshots at the start of
                   a pass and writes back at the end. Storing the clock level
                   there let the write-back revert each flip a tick later. */
                out = !!n.memory.clockHigh;
            }
            break;
        case 'Random':
            const randMin = n.config.min !== undefined ? n.config.min : 0;
            const randMax = n.config.max !== undefined ? n.config.max : 1;
            if (b0 && !n.memory.lastTrigger) {
                n.memory.lastValue = randMin + Math.random() * (randMax - randMin);
            }
            n.memory.lastTrigger = b0;
            out = n.memory.lastValue !== undefined ? n.memory.lastValue : randMin;
            break;
        case 'Up/Down Counter':
            if (b2) { n.memory.count = 0; }
            else {
                if (b0 && !n.memory.lastUpClock) { n.memory.count = (n.memory.count || 0) + 1; }
                if (b1 && !n.memory.lastDownClock) { n.memory.count = (n.memory.count || 0) - 1; }
            }
            n.memory.lastUpClock = b0;
            n.memory.lastDownClock = b1;
            out = n.memory.count || 0;
            break;
    }

    if (isComposite(n.type)) {
        return evaluateComposite(n, s, depth);
    }

    return out;
}

/* `tickId` marks a real advance of simulated time. Omit it for event-driven
   refreshes (a switch toggled, a wire added) so time-based components hold
   their value instead of jumping forward. */
export function updateSimulation(nodes, connections, tickId) {
    currentTickId = (tickId === undefined || tickId === null) ? null : tickId;
    const state = {};
    nodes.forEach(n => {
        state[n.id] = { type: n.type, inputVals: {}, outputVals: {} };
        if (n.memory && n.memory.state !== undefined) state[n.id].internalState = n.memory.state;
    });

    // 3. Get Switch states
    document.querySelectorAll('.node[data-type="Switch"]').forEach(el => {
        const isOn = el.querySelector('.toggle-switch').classList.contains('on');
        state[el.id].outputVals[0] = isOn;
    });

    // Configurable Inputs (Lever) - read from CONFIG now
    nodes.filter(n => n.type === 'Lever').forEach(n => {
        state[n.id].outputVals[0] = n.config.value || 0;
    });

    for (let pass = 0; pass < 20; pass++) {
        let changed = false;
        connections.forEach(conn => {
            const val = state[conn.sourceNode].outputVals[conn.sourceIndex];
            if (state[conn.destNode].inputVals[conn.destIndex] !== val) {
                state[conn.destNode].inputVals[conn.destIndex] = val;
                changed = true;
            }
        });

        nodes.forEach(n => {
            const s = state[n.id];
            // Top level, so nesting starts at depth 0.
            const result = evaluateGate(n, s, 0);

            if (Array.isArray(result)) {
                // Composite instances can drive several output pins.
                result.forEach((v, i) => {
                    if (s.outputVals[i] !== v) { s.outputVals[i] = v; changed = true; }
                });
            } else if (n.type !== 'Switch' && n.type !== 'Lever' && n.type !== 'Light' && n.type !== 'Dial') {
                if (s.outputVals[0] !== result) { s.outputVals[0] = result; changed = true; }
            }
        });
        if (!changed) break;
    }

    nodes.forEach(n => {
        // Store the computed output value for probes to read
        n.outputValue = state[n.id].outputVals[0];

        if (n.memory) {
            if (state[n.id].internalState !== undefined) n.memory.state = state[n.id].internalState;
            let clkVal = false;
            if (n.type === 'D Flip-Flop' || n.type === 'T Flip-Flop') {
                const v = state[n.id].inputVals[1]; clkVal = (typeof v === 'number' ? v > 0 : v) === true;
            } else if (n.type === 'JK Flip-Flop') {
                const v = state[n.id].inputVals[2]; clkVal = (typeof v === 'number' ? v > 0 : v) === true;
            } else if (n.type === 'Memory Register') {
                const v = state[n.id].inputVals[1]; clkVal = (typeof v === 'number' ? v > 0 : v) === true;
            }
            if (n.type.includes('Flip-Flop') || n.type === 'Memory Register') n.memory.lastClock = clkVal;
        }
    });

    // Update UI
    nodes.forEach(n => {
        // Update Config Display
        const display = n.el.querySelector('.config-display');
        const hotkeyDisplay = n.el.querySelector('.hotkey-display');
        
        if (n.type === 'Switch' && hotkeyDisplay) {
            hotkeyDisplay.innerText = n.config.hotkey ? `[${n.config.hotkey.toUpperCase()}]` : '';
        }

        if (n.type === 'Lever') {
            if (display) display.innerText = `Val: ${parseFloat(n.config.value).toFixed(3)}`;
            if (hotkeyDisplay) {
                const up = n.config.hotkeyUp ? n.config.hotkeyUp.toUpperCase() : '';
                const down = n.config.hotkeyDown ? n.config.hotkeyDown.toUpperCase() : '';
                if (up || down) hotkeyDisplay.innerText = `[${down}/${up}]`;
                else hotkeyDisplay.innerText = '';
            }
        } else if (display) {
            if (n.type === 'Threshold') display.innerText = `${n.config.min} < x < ${n.config.max}`;
            else if (n.type === 'Function') display.innerText = n.config.formula;
            else if (n.type === 'Memory Register') display.innerText = `Rst: ${n.config.resetVal}`;
            else if (n.type === 'Delay') display.innerText = `${n.config.ticks} tick${n.config.ticks > 1 ? 's' : ''}`;
            else if (n.type === 'Debounce') display.innerText = `${n.config.ticks} tick${n.config.ticks > 1 ? 's' : ''}`;
            else if (n.type === 'Random') display.innerText = `${n.config.min}-${n.config.max}`;
            else if (n.type === 'Constant') display.innerText = `${n.config.value}`;
        }

        if (n.type === 'Light') {
            const val = state[n.id].inputVals[0];
            const isOn = (typeof val === 'number' ? val > 0 : val) === true;
            const lightEl = n.el.querySelector('.light-indicator');
            if (isOn) lightEl.classList.add('on'); else lightEl.classList.remove('on');
        } else if (n.type === 'Dial') {
            const val = state[n.id].inputVals[0];
            const display = n.el.querySelector('.dial-display');
            if (typeof val === 'number') display.innerText = val.toFixed(2);
            else if (val === true) display.innerText = 'ON';
            else display.innerText = '0.00';
        } else if (n.type === 'Bar Graph') {
            const val = Number(state[n.id].inputVals[0]) || 0;
            const min = n.config.min !== undefined ? n.config.min : 0;
            const max = n.config.max !== undefined ? n.config.max : 100;
            
            // Calculate percentage
            let percent = 0;
            if (max > min) {
                percent = (val - min) / (max - min);
            }
            
            // Clamp between 0 and 1
            percent = Math.max(0, Math.min(1, percent));
            
            const fillEl = n.el.querySelector('.bar-graph-fill');
            const containerEl = n.el.querySelector('.bar-graph-container');
            if (fillEl) {
                fillEl.style.height = `${percent * 100}%`;
            }
            if (containerEl) {
                containerEl.title = `Value: ${val.toFixed(2)}`;
            }
        }
    });

    connections.forEach(conn => {
        const val = state[conn.sourceNode].outputVals[conn.sourceIndex];
        conn.pathEl.classList.remove('flowing');
        if (typeof val === 'number') {
            conn.pathEl.style.stroke = '#2ecc71'; conn.pathEl.style.strokeWidth = '3px';
            if (val !== 0) conn.pathEl.classList.add('flowing');
        } else if (val === true) {
            conn.pathEl.style.stroke = '#e74c3c'; conn.pathEl.style.strokeWidth = '3px';
            conn.pathEl.classList.add('flowing');
        } else {
            conn.pathEl.style.stroke = ''; conn.pathEl.style.strokeWidth = '';
        }
    });
}

// Get connection value by running simulation state check (Used by probes)
export function getConnectionValue(connection, nodes) {
    const sourceNodeData = nodes.find(n => n.id === connection.sourceNode);
    if (!sourceNodeData) return undefined;

    const sourceEl = document.getElementById(connection.sourceNode);

    // Check type and get appropriate value
    switch (sourceNodeData.type) {
        case 'Switch':
            const toggleEl = sourceEl?.querySelector('.toggle-switch');
            return toggleEl?.classList.contains('on') || false;
        case 'Lever':
            return sourceNodeData.config?.value || 0;
        default:
            // For computed gates, read the stored output value
            if (sourceNodeData.outputValue !== undefined) {
                return sourceNodeData.outputValue;
            }
            // Fallback: check wire color as indicator
            const pathEl = connection.pathEl;
            if (pathEl) {
                const stroke = pathEl.style.stroke;
                if (stroke === 'rgb(231, 76, 60)' || stroke === '#e74c3c') return true;
                if (stroke === 'rgb(46, 204, 113)' || stroke === '#2ecc71') return 1;
                return false;
            }
            return false;
    }
}

export function snapCoordinate(value, gridSize = 20) {
    return Math.round(value / gridSize) * gridSize;
}
