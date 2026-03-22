// simulation.js

export function updateSimulation(nodes, connections) {
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
                    n.memory.buffer.push(i0);
                    if (n.memory.buffer.length > delayTicks) out = n.memory.buffer.shift();
                    else out = 0;
                    break;
                case 'Pulse':
                    if (b0 && !n.memory.lastInput) out = 1;
                    else out = 0;
                    n.memory.lastInput = b0;
                    break;
                case 'Debounce':
                    const debounceTicks = n.config.ticks || 5;
                    if (b0 !== n.memory.lastStableValue) {
                        n.memory.counter = (n.memory.counter || 0) + 1;
                        if (n.memory.counter >= debounceTicks) {
                            n.memory.lastStableValue = b0;
                            n.memory.counter = 0;
                        }
                    } else {
                        n.memory.counter = 0;
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
                    if (b1) { n.memory.time = 0; }
                    else if (b0) { n.memory.time = (n.memory.time || 0) + 1; }
                    out = n.memory.time || 0;
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

            if (n.type !== 'Switch' && n.type !== 'Lever' && n.type !== 'Light' && n.type !== 'Dial') {
                if (s.outputVals[0] !== out) { s.outputVals[0] = out; changed = true; }
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
