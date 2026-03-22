// gateDefinitions.js

export const configurableTypes = ['Switch', 'Lever', 'Light', 'Dial', 'Bar Graph', 'Threshold', 'Function', 'Memory Register', 'Delay', 'Debounce', 'Random', 'Constant'];

export const componentDefinitions = {
    'AND': { inputs: 2, outputs: 1, label: 'AND', desc: "Outputs ON only if <b>both</b> inputs are ON.<br><br><table class='truth-table'><tr><th>A</th><th>B</th><th>Out</th></tr><tr><td>0</td><td>0</td><td>0</td></tr><tr><td>0</td><td>1</td><td>0</td></tr><tr><td>1</td><td>0</td><td>0</td></tr><tr><td>1</td><td>1</td><td>1</td></tr></table>" },
    'OR': { inputs: 2, outputs: 1, label: 'OR', desc: "Outputs ON if <b>either</b> or both inputs are ON.<br><br><table class='truth-table'><tr><th>A</th><th>B</th><th>Out</th></tr><tr><td>0</td><td>0</td><td>0</td></tr><tr><td>0</td><td>1</td><td>1</td></tr><tr><td>1</td><td>0</td><td>1</td></tr><tr><td>1</td><td>1</td><td>1</td></tr></table>" },
    'NOT': { inputs: 1, outputs: 1, label: 'NOT', desc: "Inverts the input signal. ON becomes OFF, and OFF becomes ON.<br><br><table class='truth-table'><tr><th>In</th><th>Out</th></tr><tr><td>0</td><td>1</td></tr><tr><td>1</td><td>0</td></tr></table>" },
    'XOR': { inputs: 2, outputs: 1, label: 'XOR', desc: "Exclusive OR. Outputs ON only if the inputs are <b>different</b> (one ON, one OFF).<br><br><table class='truth-table'><tr><th>A</th><th>B</th><th>Out</th></tr><tr><td>0</td><td>0</td><td>0</td></tr><tr><td>0</td><td>1</td><td>1</td></tr><tr><td>1</td><td>0</td><td>1</td></tr><tr><td>1</td><td>1</td><td>0</td></tr></table>" },
    'NAND': { inputs: 2, outputs: 1, label: 'NAND', desc: "NOT-AND gate. Outputs OFF only if <b>both</b> inputs are ON, otherwise ON.<br><br><table class='truth-table'><tr><th>A</th><th>B</th><th>Out</th></tr><tr><td>0</td><td>0</td><td>1</td></tr><tr><td>0</td><td>1</td><td>1</td></tr><tr><td>1</td><td>0</td><td>1</td></tr><tr><td>1</td><td>1</td><td>0</td></tr></table>" },
    'NOR': { inputs: 2, outputs: 1, label: 'NOR', desc: "NOT-OR gate. Outputs ON only if <b>both</b> inputs are OFF.<br><br><table class='truth-table'><tr><th>A</th><th>B</th><th>Out</th></tr><tr><td>0</td><td>0</td><td>1</td></tr><tr><td>0</td><td>1</td><td>0</td></tr><tr><td>1</td><td>0</td><td>0</td></tr><tr><td>1</td><td>1</td><td>0</td></tr></table>" },
    'XNOR': { inputs: 2, outputs: 1, label: 'XNOR', desc: "Exclusive NOR. Outputs ON only if the inputs are the <b>same</b> (both ON or both OFF).<br><br><table class='truth-table'><tr><th>A</th><th>B</th><th>Out</th></tr><tr><td>0</td><td>0</td><td>1</td></tr><tr><td>0</td><td>1</td><td>0</td></tr><tr><td>1</td><td>0</td><td>0</td></tr><tr><td>1</td><td>1</td><td>1</td></tr></table>" },
    'Switch': { inputs: 0, outputs: 1, label: 'Switch', type: 'input', desc: "A manual toggle switch. Use this to send an ON/OFF signal into your circuit." },
    'Lever': { inputs: 0, outputs: 1, label: 'Lever', type: 'input', desc: "A variable input that outputs a specific <b>Number</b> value. Click config icon to set value." },
    'Dial': { inputs: 1, outputs: 0, label: 'Dial', type: 'output', desc: "Displays the numeric value of the input signal." },
    'Bar Graph': { inputs: 1, outputs: 0, label: 'Bar Graph', type: 'output', desc: "Visual bar that fills based on value (Min-Max). Click config icon to set range." },
    'Light': { inputs: 1, outputs: 0, label: 'Light', type: 'output', desc: "A visual indicator. Lights up when receiving an ON signal (value > 0)." },
    'ADD': { inputs: 2, outputs: 1, label: 'ADD', desc: "Outputs the sum of two inputs.<br><br><b>Formula:</b> <code>A + B</code><br><br><b>Example:</b> 5 + 3 = 8" },
    'SUB': { inputs: 2, outputs: 1, label: 'SUB', desc: "Outputs the difference. Top is A, Bottom is B.<br><br><b>Formula:</b> <code>A - B</code><br><br><b>Example:</b> 10 - 4 = 6" },
    'MUL': { inputs: 2, outputs: 1, label: 'MUL', desc: "Outputs the product of two inputs.<br><br><b>Formula:</b> <code>A × B</code><br><br><b>Example:</b> 4 × 3 = 12" },
    'DIV': { inputs: 2, outputs: 1, label: 'DIV', desc: "Outputs the division. Top is A, Bottom is B.<br><br><b>Formula:</b> <code>A ÷ B</code><br><br><b>Example:</b> 20 ÷ 4 = 5" },
    'Equal': { inputs: 2, outputs: 1, label: 'Equal', desc: "Outputs ON (1) if Input A <b>equals</b> Input B, otherwise OFF (0).<br><br><b>Formula:</b> <code>A = B</code>" },
    'Greater Than': { inputs: 2, outputs: 1, label: 'Greater Than', desc: "Outputs ON (1) if Input A is <b>greater than</b> Input B, otherwise OFF (0).<br><br><b>Formula:</b> <code>A > B</code>" },
    'Less Than': { inputs: 2, outputs: 1, label: 'Less Than', desc: "Outputs ON (1) if Input A is <b>less than</b> Input B, otherwise OFF (0).<br><br><b>Formula:</b> <code>A < B</code>" },
    'Numerical Switchbox': { inputs: 3, outputs: 1, label: 'Numerical Switchbox', desc: "Switches between two number inputs based on a control signal.<br>Top: Input A (when ON), Mid: Input B (when OFF), Bot: Switch Signal.<br><br><b>Output:</b> <code>Switch ? A : B</code>" },
    'Threshold': { inputs: 1, outputs: 1, label: 'Threshold', desc: "Outputs ON if input is between <b>Min</b> and <b>Max</b>. Click config icon to set range.<br><br><b>Formula:</b> <code>Min ≤ X ≤ Max</code>" },
    'Function': { inputs: 1, outputs: 1, label: 'Function', desc: "Outputs the result of a custom formula. Use 'x' as the input variable. Click config icon to set formula.<br><br><b>Example:</b> <code>x * 2 + 1</code>" },
    'SR Latch': { inputs: 2, outputs: 1, label: 'SR Latch', desc: "Set-Reset Latch. Top: Set (S), Bottom: Reset (R). Retains state when both are OFF.<br><br><table class='truth-table'><tr><th>S</th><th>R</th><th>Q</th></tr><tr><td>0</td><td>0</td><td>Q</td></tr><tr><td>1</td><td>0</td><td>1</td></tr><tr><td>0</td><td>1</td><td>0</td></tr><tr><td>1</td><td>1</td><td>?</td></tr></table>" },
    'D Flip-Flop': { inputs: 2, outputs: 1, label: 'D Flip-Flop', desc: "Data Flip-Flop. Top: Data (D), Bottom: Clock (CLK). Updates on rising edge.<br><br><table class='truth-table'><tr><th>CLK</th><th>D</th><th>Q</th></tr><tr><td>↑</td><td>0</td><td>0</td></tr><tr><td>↑</td><td>1</td><td>1</td></tr><tr><td>0/1</td><td>X</td><td>Q</td></tr></table>" },
    'JK Flip-Flop': { inputs: 3, outputs: 1, label: 'JK Flip-Flop', desc: "JK Flip-Flop. Top: J, Mid: K, Bot: Clock. Updates on rising edge.<br><br><table class='truth-table'><tr><th>CLK</th><th>J</th><th>K</th><th>Q</th></tr><tr><td>↑</td><td>0</td><td>0</td><td>Q</td></tr><tr><td>↑</td><td>1</td><td>0</td><td>1</td></tr><tr><td>↑</td><td>0</td><td>1</td><td>0</td></tr><tr><td>↑</td><td>1</td><td>1</td><td>Q̅</td></tr></table>" },
    'T Flip-Flop': { inputs: 2, outputs: 1, label: 'T Flip-Flop', desc: "Toggle Flip-Flop. Top: Toggle (T), Bottom: Clock. Toggles output on rising edge when T=1.<br><br><table class='truth-table'><tr><th>CLK</th><th>T</th><th>Q</th></tr><tr><td>↑</td><td>0</td><td>Q</td></tr><tr><td>↑</td><td>1</td><td>Q̅</td></tr></table>" },
    'Memory Register': { inputs: 3, outputs: 1, label: 'Memory Register', desc: "Stores a numerical value.<br>Top: Value In, Mid: Set (Rising Edge), Bot: Reset (Hold).<br><br>When Set rises: stores Value In.<br>When Reset held: outputs Reset Value.<br><br>Click config icon to set Reset Value." },
    // Logic Gates
    'Buffer': { inputs: 1, outputs: 1, label: 'Buffer', desc: "Passes the input signal unchanged. Useful for signal isolation or delay.<br><br><b>Formula:</b> <code>Out = In</code>" },
    'Tri-State': { inputs: 2, outputs: 1, label: 'Tri-State', desc: "Tri-State Buffer. Top: Data, Bottom: Enable.<br>When enabled, outputs Data. When disabled, outputs 0.<br><br><table class='truth-table'><tr><th>En</th><th>Data</th><th>Out</th></tr><tr><td>0</td><td>X</td><td>0</td></tr><tr><td>1</td><td>D</td><td>D</td></tr></table>" },
    // Math Gates
    'MOD': { inputs: 2, outputs: 1, label: 'MOD', desc: "Modulo operation. Returns the remainder of A divided by B.<br><br><b>Formula:</b> <code>A % B</code><br><br><b>Example:</b> 10 % 3 = 1" },
    'ABS': { inputs: 1, outputs: 1, label: 'ABS', desc: "Absolute value. Returns the positive magnitude of the input.<br><br><b>Formula:</b> <code>|X|</code><br><br><b>Example:</b> |-5| = 5" },
    'NEG': { inputs: 1, outputs: 1, label: 'NEG', desc: "Negates the input value (multiplies by -1).<br><br><b>Formula:</b> <code>-X</code><br><br><b>Example:</b> -7 → -7, -(-3) → 3" },
    'POW': { inputs: 2, outputs: 1, label: 'POW', desc: "Power function. Raises A to the power of B.<br><br><b>Formula:</b> <code>A^B</code><br><br><b>Example:</b> 2^3 = 8" },
    'SQRT': { inputs: 1, outputs: 1, label: 'SQRT', desc: "Square root of the input.<br><br><b>Formula:</b> <code>√X</code><br><br><b>Example:</b> √16 = 4" },
    'MIN': { inputs: 2, outputs: 1, label: 'MIN', desc: "Outputs the smaller of two inputs.<br><br><b>Formula:</b> <code>min(A, B)</code><br><br><b>Example:</b> min(5, 3) = 3" },
    'MAX': { inputs: 2, outputs: 1, label: 'MAX', desc: "Outputs the larger of two inputs.<br><br><b>Formula:</b> <code>max(A, B)</code><br><br><b>Example:</b> max(5, 3) = 5" },
    'CLAMP': { inputs: 3, outputs: 1, label: 'CLAMP', desc: "Limits a value between min and max.<br>Top: Value, Mid: Min, Bot: Max.<br><br><b>Formula:</b> <code>clamp(V, Min, Max)</code>" },
    'ROUND': { inputs: 1, outputs: 1, label: 'ROUND', desc: "Rounds input to the nearest integer.<br><br><b>Formula:</b> <code>round(X)</code><br><br><b>Example:</b> round(3.7) = 4" },
    'FLOOR': { inputs: 1, outputs: 1, label: 'FLOOR', desc: "Rounds input down to the nearest integer.<br><br><b>Formula:</b> <code>floor(X)</code><br><br><b>Example:</b> floor(3.9) = 3" },
    'CEIL': { inputs: 1, outputs: 1, label: 'CEIL', desc: "Rounds input up to the nearest integer.<br><br><b>Formula:</b> <code>ceil(X)</code><br><br><b>Example:</b> ceil(3.1) = 4" },
    // Signal/Utility Gates
    'Delay': { inputs: 1, outputs: 1, label: 'Delay', desc: "Outputs the input value after a delay. Click config icon to set delay ticks.<br><br><b>Default:</b> 1 tick delay" },
    'Pulse': { inputs: 1, outputs: 1, label: 'Pulse', desc: "Outputs a single ON pulse on rising edge of input, then returns to OFF.<br><br><table class='truth-table'><tr><th>Input</th><th>Out</th></tr><tr><td>0→1</td><td>1</td></tr><tr><td>1→1</td><td>0</td></tr><tr><td>1→0</td><td>0</td></tr></table>" },
    'Debounce': { inputs: 1, outputs: 1, label: 'Debounce', desc: "Filters rapid signal changes. Only updates output after input is stable. Click config icon to set delay ticks." },
    'Counter': { inputs: 2, outputs: 1, label: 'Counter', desc: "Counts rising edges on Clock input. Reset input clears count to 0.<br>Top: Clock, Bottom: Reset.<br><br>Outputs the current count value." },
    'Timer': { inputs: 2, outputs: 1, label: 'Timer', desc: "Outputs time (ticks) since last reset. Top: Enable, Bottom: Reset.<br><br>Increments while enabled. Reset clears to 0." },
    'Random': { inputs: 2, outputs: 1, label: 'Random', desc: "Generates a random value on each trigger. Top: Trigger, Bottom: Seed (optional).<br>Click config icon to set min/max range.<br><br><b>Default:</b> 0 to 1" },
    'Constant': { inputs: 0, outputs: 1, label: 'Constant', type: 'input', desc: "Outputs a fixed numerical value. Click config icon to set the value.<br><br><b>Default:</b> 0" },
    // Advanced Memory
    'Up/Down Counter': { inputs: 3, outputs: 1, label: 'Up/Down Counter', desc: "Bidirectional counter. Top: Up Clock, Mid: Down Clock, Bot: Reset.<br><br>Counts up on Up rising edge, down on Down rising edge. Reset clears to 0." }
};

export const gateSVGs = {
    'AND': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 10 5 H 25 A 20 20 0 0 1 25 45 H 10 V 5 Z" /></svg>`,
    'OR': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 5 5 C 15 5 15 45 5 45 C 35 45 45 25 45 25 C 45 25 35 5 5 5 Z" /></svg>`,
    'NOT': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 10 10 V 40 L 35 25 Z" /><circle cx="40" cy="25" r="4" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
    'XOR': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 10 5 C 20 5 20 45 10 45 C 40 45 50 25 50 25 C 50 25 40 5 10 5 Z" /><path d="M 2 5 C 12 5 12 45 2 45" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
    'NAND': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 8 5 H 20 A 20 20 0 0 1 20 45 H 8 V 5 Z" /><circle cx="42" cy="25" r="4" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
    'NOR': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 5 5 C 15 5 15 45 5 45 C 30 45 38 25 38 25 C 38 25 30 5 5 5 Z" /><circle cx="44" cy="25" r="4" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
    'XNOR': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 8 5 C 16 5 16 45 8 45 C 32 45 40 25 40 25 C 40 25 32 5 8 5 Z" /><path d="M 2 5 C 10 5 10 45 2 45" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="46" cy="25" r="4" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
    'SR Latch': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">SR</text></svg>`,
    'D Flip-Flop': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">D</text></svg>`,
    'JK Flip-Flop': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">JK</text></svg>`,
    'T Flip-Flop': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">T</text></svg>`,
    'Memory Register': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">REG</text></svg>`,
    'Threshold': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="10" y="15" width="30" height="20" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="25" cy="25" r="5" fill="currentColor"/></svg>`
};

export const ioSVGs = {
    'Switch': `<svg viewBox="0 0 50 50" class="io-icon"><rect x="10" y="15" width="30" height="20" rx="10" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="18" cy="25" r="6" fill="currentColor"/></svg>`,
    'Lever': `<svg viewBox="0 0 50 50" class="io-icon"><line x1="10" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="3"/><rect x="20" y="15" width="10" height="20" fill="currentColor"/></svg>`,
    'Bar Graph': `<svg viewBox="0 0 50 50" class="io-icon"><rect x="15" y="5" width="20" height="40" stroke="currentColor" stroke-width="3" fill="none"/><rect x="15" y="25" width="20" height="20" fill="currentColor" stroke="none"/></svg>`,
    'Light': `<svg viewBox="0 0 50 50" class="io-icon"><circle cx="25" cy="20" r="10" stroke="currentColor" stroke-width="3" fill="none"/><path d="M 25 30 V 40 M 20 40 H 30" stroke="currentColor" stroke-width="3"/></svg>`,
    'Dial': `<svg viewBox="0 0 50 50" class="io-icon"><circle cx="25" cy="25" r="15" stroke="currentColor" stroke-width="3" fill="none"/><path d="M 25 25 L 35 15" stroke="currentColor" stroke-width="2"/></svg>`
};

export const pinDescriptions = {
    // Logic Gates (2 inputs)
    'AND': { inputs: ['Input A', 'Input B'], outputs: ['Output (A AND B)'] },
    'OR': { inputs: ['Input A', 'Input B'], outputs: ['Output (A OR B)'] },
    'NOT': { inputs: ['Input'], outputs: ['Output (NOT Input)'] },
    'XOR': { inputs: ['Input A', 'Input B'], outputs: ['Output (A XOR B)'] },
    'NAND': { inputs: ['Input A', 'Input B'], outputs: ['Output (NOT (A AND B))'] },
    'NOR': { inputs: ['Input A', 'Input B'], outputs: ['Output (NOT (A OR B))'] },
    'XNOR': { inputs: ['Input A', 'Input B'], outputs: ['Output (A XNOR B)'] },
    'Buffer': { inputs: ['Input'], outputs: ['Output (same as input)'] },
    'Tri-State': { inputs: ['Data Input', 'Enable'], outputs: ['Output (Data when enabled)'] },
    // I/O
    'Switch': { inputs: [], outputs: ['Signal Output (ON/OFF)'] },
    'Lever': { inputs: [], outputs: ['Number Output'] },
    'Bar Graph': { inputs: ['Number Input'], outputs: [] },
    'Light': { inputs: ['Signal Input'], outputs: [] },
    'Dial': { inputs: ['Number Input'], outputs: [] },
    'Constant': { inputs: [], outputs: ['Constant Value'] },
    // Math Gates (2 inputs)
    'ADD': { inputs: ['Input A', 'Input B'], outputs: ['Output (A + B)'] },
    'SUB': { inputs: ['Input A', 'Input B'], outputs: ['Output (A - B)'] },
    'MUL': { inputs: ['Input A', 'Input B'], outputs: ['Output (A × B)'] },
    'DIV': { inputs: ['Input A', 'Input B'], outputs: ['Output (A ÷ B)'] },
    'MOD': { inputs: ['Input A', 'Input B'], outputs: ['Output (A % B)'] },
    'POW': { inputs: ['Base (A)', 'Exponent (B)'], outputs: ['Output (A ^ B)'] },
    'MIN': { inputs: ['Input A', 'Input B'], outputs: ['Output (smaller value)'] },
    'MAX': { inputs: ['Input A', 'Input B'], outputs: ['Output (larger value)'] },
    // Math Gates (1 input)
    'SQRT': { inputs: ['Input'], outputs: ['Output (√Input)'] },
    'ABS': { inputs: ['Input'], outputs: ['Output (|Input|)'] },
    'NEG': { inputs: ['Input'], outputs: ['Output (-Input)'] },
    'ROUND': { inputs: ['Input'], outputs: ['Output (rounded)'] },
    'FLOOR': { inputs: ['Input'], outputs: ['Output (floor)'] },
    'CEIL': { inputs: ['Input'], outputs: ['Output (ceil)'] },
    // Math Gates (3 inputs)
    'CLAMP': { inputs: ['Value', 'Min', 'Max'], outputs: ['Output (clamped value)'] },
    // Comparison Gates
    'Equal': { inputs: ['Input A', 'Input B'], outputs: ['Output (A = B)'] },
    'Greater Than': { inputs: ['Input A', 'Input B'], outputs: ['Output (A > B)'] },
    'Less Than': { inputs: ['Input A', 'Input B'], outputs: ['Output (A < B)'] },
    // Utility Gates
    'Threshold': { inputs: ['Value Input'], outputs: ['Output (Min ≤ Value ≤ Max)'] },
    'Function': { inputs: ['Input (x)'], outputs: ['Output (f(x))'] },
    'Numerical Switchbox': { inputs: ['Input A (when ON)', 'Input B (when OFF)', 'Switch Signal'], outputs: ['Selected Output'] },
    // Memory Gates
    'SR Latch': { inputs: ['Set (S)', 'Reset (R)'], outputs: ['Output (Q)'] },
    'D Flip-Flop': { inputs: ['Data (D)', 'Clock (CLK)'], outputs: ['Output (Q)'] },
    'JK Flip-Flop': { inputs: ['J', 'K', 'Clock (CLK)'], outputs: ['Output (Q)'] },
    'T Flip-Flop': { inputs: ['Toggle (T)', 'Clock (CLK)'], outputs: ['Output (Q)'] },
    'Memory Register': { inputs: ['Value In', 'Set (Rising Edge)', 'Reset (Hold)'], outputs: ['Stored Value'] },
    // Signal Gates
    'Delay': { inputs: ['Input'], outputs: ['Delayed Output'] },
    'Pulse': { inputs: ['Input'], outputs: ['Pulse Output'] },
    'Debounce': { inputs: ['Input'], outputs: ['Debounced Output'] },
    'Counter': { inputs: ['Clock', 'Reset'], outputs: ['Count Value'] },
    'Timer': { inputs: ['Enable', 'Reset'], outputs: ['Time Value'] },
    'Random': { inputs: ['Trigger', 'Seed (optional)'], outputs: ['Random Value'] },
    'Up/Down Counter': { inputs: ['Up Clock', 'Down Clock', 'Reset'], outputs: ['Count Value'] }
};
