document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace');
    const world = document.getElementById('world');
    const svgLayer = document.getElementById('connections-layer');
    const componentMenu = document.getElementById('component-menu');
    const menuItems = document.querySelectorAll('.menu-item');
    const selectionBox = document.getElementById('selection-box');
    const tooltip = document.getElementById('custom-tooltip');

    // Sidebar Elements
    const sidebar = document.getElementById('config-sidebar');
    const sidebarTitle = document.getElementById('sidebar-title');
    const sidebarContent = document.getElementById('sidebar-content');
    const sidebarClose = document.getElementById('sidebar-close');
    let activeConfigNodeId = null;

    let nodes = [];
    let connections = [];
    let nextNodeId = 1;
    let isDraggingNode = null;
    let selectedNodes = [];

    // Panning & Selection State
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;

    let isSelecting = false;
    let selectStartX = 0;
    let selectStartY = 0;

    // History State
    let history = [];
    let historyStep = -1;
    let isRestoring = false;

    // Wiring State
    let isWiring = false;
    let activePin = null;
    let ghostLine = null;

    // Placing State
    let placingType = null;
    let ghostNode = null;

    // Configurable Types
    const configurableTypes = ['Lever', 'Threshold', 'Function', 'Memory Register'];

    // --- Component Definitions ---
    const componentDefinitions = {
        'AND': { inputs: 2, outputs: 1, label: 'AND', desc: "Outputs ON only if <b>both</b> inputs are ON." },
        'OR': { inputs: 2, outputs: 1, label: 'OR', desc: "Outputs ON if <b>either</b> or both inputs are ON." },
        'NOT': { inputs: 1, outputs: 1, label: 'NOT', desc: "Inverts the input signal. ON becomes OFF, and OFF becomes ON." },
        'XOR': { inputs: 2, outputs: 1, label: 'XOR', desc: "Exclusive OR. Outputs ON only if the inputs are <b>different</b> (one ON, one OFF)." },
        'Switch': { inputs: 0, outputs: 1, label: 'Switch', type: 'input', desc: "A manual toggle switch. Use this to send an ON/OFF signal into your circuit." },
        'Lever': { inputs: 0, outputs: 1, label: 'Lever', type: 'input', desc: "A variable input that outputs a specific <b>Number</b> value. Click config icon to set value." },
        'Dial': { inputs: 1, outputs: 0, label: 'Dial', type: 'output', desc: "Displays the numeric value of the input signal." },
        'Light': { inputs: 1, outputs: 0, label: 'Light', type: 'output', desc: "A visual indicator. Lights up when receiving an ON signal (value > 0)." },
        'ADD': { inputs: 2, outputs: 1, label: 'ADD', desc: "Outputs the sum of two inputs (A + B)." },
        'SUB': { inputs: 2, outputs: 1, label: 'SUB', desc: "Outputs the difference (A - B). Top is A, Bottom is B." },
        'MUL': { inputs: 2, outputs: 1, label: 'MUL', desc: "Outputs the product of two inputs (A * B)." },
        'DIV': { inputs: 2, outputs: 1, label: 'DIV', desc: "Outputs the division (A / B). Top is A, Bottom is B." },
        'Equal': { inputs: 2, outputs: 1, label: 'Equal', desc: "Outputs ON if Input A <b>equals</b> Input B." },
        'Greater Than': { inputs: 2, outputs: 1, label: 'Greater Than', desc: "Outputs ON if Input A is <b>greater than</b> Input B." },
        'Less Than': { inputs: 2, outputs: 1, label: 'Less Than', desc: "Outputs ON if Input A is <b>less than</b> Input B." },
        'Numerical Switchbox': { inputs: 3, outputs: 1, label: 'Numerical Switchbox', desc: "Switches between two number inputs based on a control signal.<br>Top: Input A (ON), Mid: Input B (OFF), Bot: Switch Signal." },
        'Threshold': { inputs: 1, outputs: 1, label: 'Threshold', desc: "Outputs ON if input is between <b>Min</b> and <b>Max</b>. Click config icon to set range." },
        'Function': { inputs: 1, outputs: 1, label: 'Function', desc: "Outputs the result of a custom formula (e.g. 'x * 2 + 1'). Use 'x' as the input. Click config icon to set formula." },
        'SR Latch': { inputs: 2, outputs: 1, label: 'SR Latch', desc: "Set-Reset Latch. Top: Set, Bottom: Reset. Retains state." },
        'D Flip-Flop': { inputs: 2, outputs: 1, label: 'D Flip-Flop', desc: "Data Flip-Flop. Top: Data, Bottom: Clock. Updates on rising edge." },
        'JK Flip-Flop': { inputs: 3, outputs: 1, label: 'JK Flip-Flop', desc: "JK Flip-Flop. Top: J, Mid: K, Bot: Clock. Updates on rising edge." },
        'T Flip-Flop': { inputs: 2, outputs: 1, label: 'T Flip-Flop', desc: "Toggle Flip-Flop. Top: Toggle, Bottom: Clock. Updates on rising edge." },
        'Memory Register': { inputs: 3, outputs: 1, label: 'Memory Register', desc: "Stores a number.<br>Top: Value In, Mid: Set (Rising Edge), Bot: Reset (Hold).<br>Click config icon to set Reset Value." }
    };

    const gateSVGs = {
        'AND': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 10 5 H 25 A 20 20 0 0 1 25 45 H 10 V 5 Z" /></svg>`,
        'OR': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 5 5 C 15 5 15 45 5 45 C 35 45 45 25 45 25 C 45 25 35 5 5 5 Z" /></svg>`,
        'NOT': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 10 10 V 40 L 35 25 Z" /><circle cx="40" cy="25" r="4" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
        'XOR': `<svg viewBox="0 0 50 50" class="gate-icon"><path class="fill-shape" d="M 10 5 C 20 5 20 45 10 45 C 40 45 50 25 50 25 C 50 25 40 5 10 5 Z" /><path d="M 2 5 C 12 5 12 45 2 45" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
        'SR Latch': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">SR</text></svg>`,
        'D Flip-Flop': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">D</text></svg>`,
        'JK Flip-Flop': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">JK</text></svg>`,
        'T Flip-Flop': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">T</text></svg>`,
        'Memory Register': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="5" y="5" width="40" height="40" stroke="currentColor" stroke-width="3" fill="none"/><text x="25" y="32" fill="currentColor" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">REG</text></svg>`,
        'Threshold': `<svg viewBox="0 0 50 50" class="gate-icon"><rect x="10" y="15" width="30" height="20" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="25" cy="25" r="5" fill="currentColor"/></svg>`
    };

    const ioSVGs = {
        'Switch': `<svg viewBox="0 0 50 50" class="io-icon"><rect x="10" y="15" width="30" height="20" rx="10" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="18" cy="25" r="6" fill="currentColor"/></svg>`,
        'Lever': `<svg viewBox="0 0 50 50" class="io-icon"><line x1="10" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="3"/><rect x="20" y="15" width="10" height="20" fill="currentColor"/></svg>`,
        'Light': `<svg viewBox="0 0 50 50" class="io-icon"><circle cx="25" cy="20" r="10" stroke="currentColor" stroke-width="3" fill="none"/><path d="M 25 30 V 40 M 20 40 H 30" stroke="currentColor" stroke-width="3"/></svg>`,
        'Dial': `<svg viewBox="0 0 50 50" class="io-icon"><circle cx="25" cy="25" r="15" stroke="currentColor" stroke-width="3" fill="none"/><path d="M 25 25 L 35 15" stroke="currentColor" stroke-width="2"/></svg>`
    };

    // --- Menu & Placing Logic ---
    const descTitle = document.getElementById('desc-title');
    const descText = document.getElementById('desc-text');
    const qaSlots = document.querySelectorAll('.qa-slot:not(#qa-menu-btn)');
    const qaMenuBtn = document.getElementById('qa-menu-btn');
    let selectedMenuItem = null;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') { e.preventDefault(); toggleMenu(); }
        if (e.key === 'Escape') { cancelPlacing(); closeSidebar(); }
        if (e.key === 'Delete' || e.key === 'Backspace') deleteSelectedNode();
        if ((e.key >= '0' && e.key <= '9')) {
            const slot = document.querySelector(`.qa-slot[data-slot="${e.key}"]`);
            if (slot && slot.dataset.type) startPlacing(slot.dataset.type);
        }
    });

    if (qaMenuBtn) qaMenuBtn.addEventListener('click', toggleMenu);
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);

    function toggleMenu() {
        if (componentMenu.classList.contains('hidden')) {
            componentMenu.style.display = 'flex';
            componentMenu.offsetWidth;
            componentMenu.classList.remove('hidden');
            cancelPlacing();
            if (selectedMenuItem) {
                selectedMenuItem.classList.remove('selected');
                selectedMenuItem = null;
                descTitle.innerText = "Select a component";
                descText.innerText = "Click on a component to view its description. Double-click to add it to the circuit board.";
            }
        } else {
            componentMenu.classList.add('hidden');
            const onTransitionEnd = () => {
                componentMenu.style.display = 'none';
                componentMenu.removeEventListener('transitionend', onTransitionEnd);
            };
            componentMenu.addEventListener('transitionend', onTransitionEnd);
        }
    }

    function assignSlot(slot, type) {
        slot.dataset.type = type;
        const hint = slot.querySelector('.key-hint').outerHTML;
        let iconHtml = '';
        if (gateSVGs[type]) iconHtml = gateSVGs[type].replace('class="gate-icon"', '');
        else if (ioSVGs[type]) iconHtml = ioSVGs[type].replace('class="io-icon"', '');
        else {
            let text = type.substring(0, 2);
            if (type === 'ADD') text = '+';
            if (type === 'SUB') text = '-';
            if (type === 'MUL') text = 'x';
            if (type === 'DIV') text = '/';
            if (type === 'Equal') text = '=';
            if (type === 'Greater Than') text = '>';
            if (type === 'Less Than') text = '<';
            if (type === 'Numerical Switchbox') text = 'SW';
            iconHtml = `<div class="math-icon" style="font-size:28px;">${text}</div>`;
        }
        slot.innerHTML = hint + iconHtml;
    }

    qaSlots.forEach(slot => {
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('type');
            if (type) assignSlot(slot, type);
        });
        slot.addEventListener('click', () => { if (slot.dataset.type) startPlacing(slot.dataset.type); });
    });

    menuItems.forEach(item => {
        const type = item.dataset.type;
        const def = componentDefinitions[type];
        const iconContainer = item.querySelector('.menu-icon');
        if (iconContainer) {
            if (gateSVGs[type]) iconContainer.innerHTML = gateSVGs[type];
            else if (ioSVGs[type]) iconContainer.innerHTML = ioSVGs[type];
        }
        item.addEventListener('dragstart', (e) => e.dataTransfer.setData('type', type));
        item.addEventListener('click', () => {
            if (selectedMenuItem) selectedMenuItem.classList.remove('selected');
            selectedMenuItem = item;
            item.classList.add('selected');
            descTitle.innerText = def.label;
            descText.innerHTML = def.desc;
        });
        item.addEventListener('dblclick', () => { startPlacing(type); componentMenu.classList.add('hidden'); });
    });

    function startPlacing(type) {
        if (ghostNode) ghostNode.remove();
        placingType = type;
        ghostNode = createNode(type, 0, 0, true);
        ghostNode.classList.add('ghost');
    }

    function cancelPlacing() {
        placingType = null;
        if (ghostNode) { ghostNode.remove(); ghostNode = null; }
    }

    function deleteSelectedNode() {
        if (selectedNodes.length === 0) return;
        selectedNodes.forEach(nodeEl => {
            const id = nodeEl.dataset.id;
            const toRemove = connections.filter(c => c.sourceNode === id || c.destNode === id);
            toRemove.forEach(c => c.pathEl.remove());
            connections = connections.filter(c => c.sourceNode !== id && c.destNode !== id);
            nodeEl.remove();
            nodes = nodes.filter(n => n.id !== id);
            if (activeConfigNodeId === id) closeSidebar();
        });
        selectedNodes = [];
        updateSimulation();
        saveState();
    }

    function toWorld(x, y) { return { x: x - panX, y: y - panY }; }
    function clearSelection() { selectedNodes.forEach(n => n.classList.remove('selected')); selectedNodes = []; }
    function addToSelection(node) {
        if (!selectedNodes.includes(node)) { selectedNodes.push(node); node.classList.add('selected'); }
    }

    const trashBtn = document.querySelector('.icon-btn');
    if (trashBtn) trashBtn.addEventListener('click', deleteSelectedNode);

    function openSidebar(nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        activeConfigNodeId = nodeId;
        sidebarTitle.innerText = `${node.type} Config`;
        sidebarContent.innerHTML = '';
        if (node.type === 'Lever') {
            createSidebarInput('Value', 'number', node.config.value || 0, (val) => {
                node.config.value = parseFloat(val); updateSimulation(); saveState();
            });
        } else if (node.type === 'Threshold') {
            createSidebarInput('Min Value', 'number', node.config.min || 0, (val) => {
                node.config.min = parseFloat(val); updateSimulation(); saveState();
            });
            createSidebarInput('Max Value', 'number', node.config.max || 1, (val) => {
                node.config.max = parseFloat(val); updateSimulation(); saveState();
            });
        } else if (node.type === 'Function') {
            createSidebarInput('Formula (use x)', 'text', node.config.formula || 'x', (val) => {
                node.config.formula = val; updateSimulation(); saveState();
            });
        } else if (node.type === 'Memory Register') {
            createSidebarInput('Reset Value', 'number', node.config.resetVal || 0, (val) => {
                node.config.resetVal = parseFloat(val); updateSimulation(); saveState();
            });
        }
        sidebar.classList.remove('hidden');
    }

    function createSidebarInput(label, type, value, onChange) {
        const group = document.createElement('div');
        group.className = 'sidebar-input-group';
        const labelEl = document.createElement('label');
        labelEl.innerText = label;
        group.appendChild(labelEl);
        const inputEl = document.createElement('input');
        inputEl.type = type;
        inputEl.value = value;
        inputEl.addEventListener('input', (e) => onChange(e.target.value));
        if (type === 'number') inputEl.step = '0.1';
        group.appendChild(inputEl);
        sidebarContent.appendChild(group);
    }

    function closeSidebar() {
        sidebar.classList.add('hidden');
        activeConfigNodeId = null;
    }

    function createNode(type, x, y, isGhost = false) {
        const def = componentDefinitions[type];
        const id = isGhost ? `ghost-${Date.now()}` : `node-${nextNodeId++}`;
        const nodeEl = document.createElement('div');
        nodeEl.classList.add('node');
        nodeEl.id = id;
        nodeEl.style.left = `${x}px`;
        nodeEl.style.top = `${y}px`;
        nodeEl.dataset.id = id;
        nodeEl.dataset.type = type;

        const header = document.createElement('div');
        header.classList.add('node-header');
        header.innerHTML = `<span>${def.label}</span>`;
        nodeEl.appendChild(header);

        if (!isGhost && configurableTypes.includes(type)) {
            const configIcon = document.createElement('div');
            configIcon.className = 'node-config-icon';
            configIcon.innerHTML = '&#9881;';
            configIcon.title = 'Configure';
            configIcon.addEventListener('click', (e) => { e.stopPropagation(); openSidebar(id); });
            nodeEl.appendChild(configIcon);
            nodeEl.addEventListener('dblclick', (e) => { e.stopPropagation(); openSidebar(id); });
        }

        const body = document.createElement('div');
        body.classList.add('node-body');

        let inputClass = 'bool';
        let outputClass = 'bool';
        const numTypes = ['ADD', 'SUB', 'MUL', 'DIV', 'Lever', 'Dial', 'Function', 'Equal', 'Greater Than', 'Less Than', 'Numerical Switchbox', 'Memory Register'];
        if (numTypes.includes(type)) {
            inputClass = 'num';
            if (['ADD', 'SUB', 'MUL', 'DIV', 'Lever', 'Function', 'Numerical Switchbox', 'Memory Register'].includes(type)) outputClass = 'num';
            else outputClass = 'bool';
        } else if (type === 'Threshold') {
            inputClass = 'num';
            outputClass = 'bool';
        }

        const inputsContainer = document.createElement('div');
        inputsContainer.classList.add('inputs');
        for (let i = 0; i < def.inputs; i++) {
            let currentInputClass = inputClass;
            if (type === 'Numerical Switchbox' && i === 2) currentInputClass = 'bool';
            if (type === 'Memory Register' && (i === 1 || i === 2)) currentInputClass = 'bool';
            const pin = createPin('input', id, i, currentInputClass);
            inputsContainer.appendChild(pin);
        }
        body.appendChild(inputsContainer);

        // Controls
        if (type === 'Switch') {
            const switchControl = document.createElement('div');
            switchControl.className = 'node-control';
            switchControl.innerHTML = '<div class="toggle-switch"></div>';
            if (!isGhost) {
                switchControl.querySelector('.toggle-switch').onclick = function () {
                    this.classList.toggle('on');
                    updateSimulation();
                };
            }
            body.appendChild(switchControl);
        } else if (configurableTypes.includes(type)) {
            const container = document.createElement('div');
            container.className = 'node-control';
            const iconDiv = document.createElement('div');
            if (gateSVGs[type]) iconDiv.innerHTML = gateSVGs[type];
            else if (ioSVGs[type]) iconDiv.innerHTML = ioSVGs[type];
            container.appendChild(iconDiv);
            const display = document.createElement('div');
            display.className = 'config-display';
            display.innerText = '...';
            container.appendChild(display);
            body.appendChild(container);
        } else if (type === 'Dial') {
            const dialControl = document.createElement('div');
            dialControl.className = 'node-control';
            dialControl.innerHTML = '<div class="dial-display">0.00</div>';
            body.appendChild(dialControl);
        } else if (type === 'Light') {
            const lightControl = document.createElement('div');
            lightControl.className = 'node-control';
            lightControl.innerHTML = '<div class="light-indicator"></div>';
            body.appendChild(lightControl);
        } else if (gateSVGs[type]) {
            const iconContainer = document.createElement('div');
            iconContainer.className = 'node-control';
            iconContainer.innerHTML = gateSVGs[type];
            body.appendChild(iconContainer);
        } else if (ioSVGs[type]) {
            const iconContainer = document.createElement('div');
            iconContainer.className = 'node-control';
            iconContainer.innerHTML = ioSVGs[type];
            body.appendChild(iconContainer);
        } else {
            const iconContainer = document.createElement('div');
            iconContainer.className = 'node-control';
            let text = type.substring(0, 2);
            if (type === 'ADD') text = '+';
            if (type === 'SUB') text = '-';
            if (type === 'MUL') text = 'x';
            if (type === 'DIV') text = '/';
            if (type === 'Equal') text = '=';
            if (type === 'Greater Than') text = '>';
            if (type === 'Less Than') text = '<';
            if (type === 'Numerical Switchbox') text = 'SW';
            iconContainer.innerHTML = `<div class="math-icon">${text}</div>`;
            body.appendChild(iconContainer);
        }

        const outputsContainer = document.createElement('div');
        outputsContainer.classList.add('outputs');
        for (let i = 0; i < def.outputs; i++) {
            const pin = createPin('output', id, i, outputClass);
            outputsContainer.appendChild(pin);
        }
        body.appendChild(outputsContainer);

        nodeEl.appendChild(body);

        if (isGhost) {
            workspace.appendChild(nodeEl);
        } else {
            world.appendChild(nodeEl);
            header.addEventListener('mouseenter', () => {
                if (def.desc) {
                    tooltip.innerHTML = `<strong>${def.label}</strong><br>${def.desc}`;
                    tooltip.classList.remove('hidden');
                }
            });
            header.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));
            header.addEventListener('mousemove', (e) => {
                if (!tooltip.classList.contains('hidden')) {
                    const gap = 15;
                    let left = e.clientX + gap;
                    let top = e.clientY + gap;
                    const rect = tooltip.getBoundingClientRect();
                    if (left + rect.width > window.innerWidth) left = e.clientX - rect.width - gap;
                    if (top + rect.height > window.innerHeight) top = e.clientY - rect.height - gap;
                    tooltip.style.left = `${left}px`;
                    tooltip.style.top = `${top}px`;
                }
            });
        }

        if (!isGhost) {
            header.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (!e.shiftKey && !selectedNodes.includes(nodeEl)) clearSelection();
                addToSelection(nodeEl);
                isDraggingNode = true;
            });

            const nodeData = { id, type, el: nodeEl, memory: {}, config: {} };
            if (type === 'Lever') nodeData.config.value = 0;
            if (type === 'Threshold') { nodeData.config.min = 0; nodeData.config.max = 1; }
            if (type === 'Function') nodeData.config.formula = 'x';
            if (type === 'Memory Register') nodeData.config.resetVal = 0;

            if (['SR Latch', 'D Flip-Flop', 'JK Flip-Flop', 'T Flip-Flop', 'Memory Register'].includes(type)) {
                nodeData.memory.state = 0; nodeData.memory.lastClock = false;
            }
            nodes.push(nodeData);
        }
        return nodeEl;
    }

    function createPin(type, nodeId, index, styleClass = 'bool') {
        const pin = document.createElement('div');
        pin.classList.add('pin', type, styleClass);
        pin.dataset.type = type;
        pin.dataset.node = nodeId;
        pin.dataset.index = index;
        pin.title = `${type} ${index + 1}`;

        // Explicitly handle events to avoid conflicts
        pin.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault(); // Critical for proper drag behavior
            startWiring(pin);
        });

        pin.addEventListener('mouseup', (e) => {
            // No stopPropagation here to ensure global mouseup can see it if needed,
            // but finishWiring handles the logic.
            finishWiring(pin);
        });

        return pin;
    }

    workspace.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
            isPanning = true; panStartX = e.clientX; panStartY = e.clientY; e.preventDefault(); return;
        }
        if (e.button === 0) {
            if (placingType) {
                const rect = workspace.getBoundingClientRect();
                const wPos = toWorld(e.clientX - rect.left, e.clientY - rect.top);
                createNode(placingType, wPos.x - 70, wPos.y - 30);
                cancelPlacing(); saveState(); return;
            }
            if (e.target === workspace || e.target === world || e.target === svgLayer) {
                clearSelection(); isSelecting = true;
                const rect = workspace.getBoundingClientRect();
                selectStartX = e.clientX - rect.left; selectStartY = e.clientY - rect.top;
                selectionBox.style.left = `${selectStartX}px`; selectionBox.style.top = `${selectStartY}px`;
                selectionBox.style.width = '0px'; selectionBox.style.height = '0px';
                selectionBox.classList.remove('hidden');
            }
        }
    });

    workspace.addEventListener('contextmenu', (e) => { if (placingType) { e.preventDefault(); cancelPlacing(); } });

    document.addEventListener('mousemove', (e) => {
        // Safety: If dragging but no button pressed, stop.
        if (isDraggingNode && e.buttons === 0) {
            if (trashBtn && trashBtn.classList.contains('expanded')) { deleteSelectedNode(); trashBtn.classList.remove('expanded'); }
            else saveState();
            isDraggingNode = null;
            return;
        }

        const rect = workspace.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (isPanning) {
            panX += e.clientX - panStartX; panY += e.clientY - panStartY;
            panStartX = e.clientX; panStartY = e.clientY;
            world.style.transform = `translate(${panX}px, ${panY}px)`;
            workspace.style.backgroundPosition = `${panX}px ${panY}px`;
            return;
        }

        if (isSelecting) {
            const x = Math.min(selectStartX, mouseX); const y = Math.min(selectStartY, mouseY);
            const w = Math.abs(mouseX - selectStartX); const h = Math.abs(mouseY - selectStartY);
            selectionBox.style.left = `${x}px`; selectionBox.style.top = `${y}px`;
            selectionBox.style.width = `${w}px`; selectionBox.style.height = `${h}px`;
            return;
        }

        if (placingType && ghostNode) {
            ghostNode.style.left = `${mouseX - 70}px`; ghostNode.style.top = `${mouseY - 30}px`;
        }

        if (isDraggingNode) {
            selectedNodes.forEach(node => {
                node.style.left = `${parseFloat(node.style.left) + e.movementX}px`;
                node.style.top = `${parseFloat(node.style.top) + e.movementY}px`;
            });
            updateConnections();
            if (trashBtn) {
                const tr = trashBtn.getBoundingClientRect();
                const dist = Math.hypot(e.clientX - (tr.left + tr.width / 2), e.clientY - (tr.top + tr.height / 2));
                if (dist < 60) trashBtn.classList.add('expanded'); else trashBtn.classList.remove('expanded');
            }
        }

        if (isWiring && activePin) {
            sidebarTitle.innerText = "Wiring..."; // Visual Debug
            const mWorld = toWorld(mouseX, mouseY);
            const pRect = activePin.getBoundingClientRect();
            const pX = (pRect.left - rect.left) - panX; const pY = (pRect.top - rect.top) - panY;
            updateGhostLine(pX, pY, mWorld.x, mWorld.y);
        }
    });

    document.addEventListener('mouseup', (e) => {
        isPanning = false;
        if (isSelecting) {
            isSelecting = false; selectionBox.classList.add('hidden');
            const bLeft = parseFloat(selectionBox.style.left); const bTop = parseFloat(selectionBox.style.top);
            const bWidth = parseFloat(selectionBox.style.width); const bHeight = parseFloat(selectionBox.style.height);
            const rect = workspace.getBoundingClientRect();
            nodes.forEach(n => {
                const nRect = n.el.getBoundingClientRect();
                const boxScreenX = bLeft + rect.left; const boxScreenY = bTop + rect.top;
                if (nRect.left < boxScreenX + bWidth && nRect.left + nRect.width > boxScreenX &&
                    nRect.top < boxScreenY + bHeight && nRect.top + nRect.height > boxScreenY) addToSelection(n.el);
            });
        }
        if (isDraggingNode) {
            if (trashBtn && trashBtn.classList.contains('expanded')) { deleteSelectedNode(); trashBtn.classList.remove('expanded'); }
            else saveState();
            isDraggingNode = null;
        }
        if (isWiring) cancelWiring();
    });

    // --- Wiring Logic ---
    function startWiring(pin) {
        isWiring = true;
        activePin = pin;
        ghostLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        ghostLine.classList.add('wire-ghost');
        // Force style for visibility debug
        ghostLine.style.stroke = 'red';
        ghostLine.style.strokeWidth = '4px';
        ghostLine.style.fill = 'none';
        ghostLine.style.pointerEvents = 'none';
        svgLayer.appendChild(ghostLine);
    }

    function updateGhostLine(x1, y1, x2, y2) {
        if (!ghostLine) return;
        const dist = Math.abs(x2 - x1) * 0.5;
        ghostLine.setAttribute('d', `M ${x1} ${y1} C ${x1 + dist + 20} ${y1}, ${x2 - dist - 20} ${y2}, ${x2} ${y2}`);
    }

    function finishWiring(targetPin) {
        if (!isWiring || !activePin) return;
        if (activePin === targetPin || activePin.dataset.node === targetPin.dataset.node || activePin.dataset.type === targetPin.dataset.type) return;

        let sourcePin = activePin.dataset.type === 'output' ? activePin : targetPin;
        let destPin = activePin.dataset.type === 'input' ? activePin : targetPin;

        const existingConnIndex = connections.findIndex(c =>
            c.sourceNode === sourcePin.dataset.node && c.sourceIndex === sourcePin.dataset.index &&
            c.destNode === destPin.dataset.node && c.destIndex === destPin.dataset.index
        );

        if (existingConnIndex !== -1) {
            connections[existingConnIndex].pathEl.remove();
            connections.splice(existingConnIndex, 1);
        } else {
            const otherConnIndex = connections.findIndex(c =>
                c.destNode === destPin.dataset.node && c.destIndex === destPin.dataset.index
            );
            if (otherConnIndex !== -1) {
                connections[otherConnIndex].pathEl.remove();
                connections.splice(otherConnIndex, 1);
            }
            createConnection(sourcePin, destPin);
        }
        cancelWiring();
        updateSimulation();
        saveState();
    }

    function cancelWiring() {
        isWiring = false;
        activePin = null;
        if (ghostLine) { ghostLine.remove(); ghostLine = null; }
        if (sidebarTitle.innerText === "Wiring...") sidebarTitle.innerText = "Configuration"; // Reset title
    }

    function createConnection(sourcePinEl, destPinEl) {
        const connId = `conn-${Date.now()}-${Math.random()}`;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('wire');
        path.id = connId;
        path.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete connection?')) {
                connections = connections.filter(c => c.id !== connId);
                path.remove();
                updateSimulation();
            }
        });
        svgLayer.appendChild(path);
        connections.push({
            id: connId, pathEl: path,
            sourceNode: sourcePinEl.dataset.node, sourceIndex: sourcePinEl.dataset.index,
            destNode: destPinEl.dataset.node, destIndex: destPinEl.dataset.index
        });
        updateConnections();
    }

    function updateConnections() {
        const worldRect = world.getBoundingClientRect();
        connections.forEach(conn => {
            const sourceNode = document.getElementById(conn.sourceNode);
            const destNode = document.getElementById(conn.destNode);
            if (!sourceNode || !destNode) return;
            const sourcePin = sourceNode.querySelector(`.outputs .pin[data-index="${conn.sourceIndex}"]`);
            const destPin = destNode.querySelector(`.inputs .pin[data-index="${conn.destIndex}"]`);
            if (!sourcePin || !destPin) return;
            const sRect = sourcePin.getBoundingClientRect();
            const dRect = destPin.getBoundingClientRect();
            const x1 = (sRect.left - worldRect.left) + sRect.width / 2;
            const y1 = (sRect.top - worldRect.top) + sRect.height / 2;
            const x2 = (dRect.left - worldRect.left) + dRect.width / 2;
            const y2 = (dRect.top - worldRect.top) + dRect.height / 2;
            const dist = Math.abs(x2 - x1) * 0.5;
            conn.pathEl.setAttribute('d', `M ${x1} ${y1} C ${x1 + dist + 20} ${y1}, ${x2 - dist - 20} ${y2}, ${x2} ${y2}`);
        });
    }

    // --- Simulation ---
    function updateSimulation() {
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
                }

                if (n.type !== 'Switch' && n.type !== 'Lever' && n.type !== 'Light' && n.type !== 'Dial') {
                    if (s.outputVals[0] !== out) { s.outputVals[0] = out; changed = true; }
                }
            });
            if (!changed) break;
        }

        nodes.forEach(n => {
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
            if (display) {
                if (n.type === 'Lever') display.innerText = `Val: ${n.config.value}`;
                else if (n.type === 'Threshold') display.innerText = `${n.config.min} < x < ${n.config.max}`;
                else if (n.type === 'Function') display.innerText = n.config.formula;
                else if (n.type === 'Memory Register') display.innerText = `Rst: ${n.config.resetVal}`;
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

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => window.location.reload());

    updateSimulation();
    saveState();

    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    function saveState() {
        if (isRestoring) return;
        const state = {
            nodes: nodes.map(n => ({
                id: n.id, type: n.type, x: parseFloat(n.el.style.left), y: parseFloat(n.el.style.top),
                isOn: n.type === 'Switch' ? n.el.querySelector('.toggle-switch').classList.contains('on') : undefined,
                config: n.config // Save Config Object
            })),
            connections: connections.map(c => ({
                sourceNode: c.sourceNode, sourceIndex: c.sourceIndex,
                destNode: c.destNode, destIndex: c.destIndex
            }))
        };
        if (historyStep < history.length - 1) history = history.slice(0, historyStep + 1);
        history.push(state);
        historyStep++;
        if (history.length > 50) { history.shift(); historyStep--; }
    }

    undoBtn.addEventListener('click', () => {
        if (historyStep > 0) { historyStep--; isRestoring = true; loadCircuit(history[historyStep]); isRestoring = false; }
    });

    redoBtn.addEventListener('click', () => {
        if (historyStep < history.length - 1) { historyStep++; isRestoring = true; loadCircuit(history[historyStep]); isRestoring = false; }
    });

    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const fileInput = document.getElementById('file-input');

    saveBtn.addEventListener('click', () => {
        const data = {
            nodes: nodes.map(n => ({
                id: n.id, type: n.type, x: parseFloat(n.el.style.left), y: parseFloat(n.el.style.top),
                isOn: n.type === 'Switch' ? n.el.querySelector('.toggle-switch').classList.contains('on') : undefined,
                config: n.config
            })),
            connections: connections.map(c => ({
                sourceNode: c.sourceNode, sourceIndex: c.sourceIndex, destNode: c.destNode, destIndex: c.destIndex
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'microprocessor.logic'; a.click(); URL.revokeObjectURL(url);
    });

    loadBtn.addEventListener('click', () => { fileInput.click(); });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try { const data = JSON.parse(event.target.result); loadCircuit(data); } catch (err) { alert("Error loading file: " + err); }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    function loadCircuit(data) {
        nodes.forEach(n => n.el.remove());
        nodes = [];
        connections = [];
        while (svgLayer.firstChild) svgLayer.removeChild(svgLayer.firstChild);

        let maxId = 0;
        data.nodes.forEach(nData => {
            const numId = parseInt(nData.id.replace('node-', ''));
            if (!isNaN(numId) && numId >= maxId) maxId = numId;

            const nodeEl = createNode(nData.type, nData.x, nData.y);
            const nodeObj = nodes[nodes.length - 1];

            nodeObj.id = nData.id; nodeEl.id = nData.id; nodeEl.dataset.id = nData.id;
            const pins = nodeEl.querySelectorAll('.pin');
            pins.forEach(p => p.dataset.node = nData.id);

            if (nData.type === 'Switch' && nData.isOn) nodeEl.querySelector('.toggle-switch').classList.add('on');

            // Restore Config
            if (nData.config) {
                nodeObj.config = { ...nData.config };
            } else {
                // Legacy fallback if needed (though we rewrote save/load)
                // If loading old file format, might need manual mapping here
                if (nData.value !== undefined) nodeObj.config.value = nData.value;
                if (nData.min !== undefined) nodeObj.config.min = nData.min;
                if (nData.max !== undefined) nodeObj.config.max = nData.max;
                if (nData.formula !== undefined) nodeObj.config.formula = nData.formula;
                if (nData.resetVal !== undefined) nodeObj.config.resetVal = nData.resetVal;
            }
        });

        nextNodeId = maxId + 1;

        data.connections.forEach(cData => {
            const sourceNode = nodes.find(n => n.id === cData.sourceNode);
            const destNode = nodes.find(n => n.id === cData.destNode);
            if (sourceNode && destNode) {
                const sourcePin = sourceNode.el.querySelector(`.outputs .pin[data-index="${cData.sourceIndex}"]`);
                const destPin = destNode.el.querySelector(`.inputs .pin[data-index="${cData.destIndex}"]`);
                if (sourcePin && destPin) createConnection(sourcePin, destPin);
            }
        });

        updateSimulation();
    }

    // --- Tutorial System ---
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const tutorialHighlight = document.getElementById('tutorial-highlight');
    const tutorialModal = document.getElementById('tutorial-modal');
    const tutorialTitle = document.getElementById('tutorial-title');
    const tutorialText = document.getElementById('tutorial-text');
    const tutorialStepCounter = document.getElementById('tutorial-step-counter');
    const tutorialDots = document.getElementById('tutorial-dots');
    const tutorialPrev = document.getElementById('tutorial-prev');
    const tutorialNext = document.getElementById('tutorial-next');
    const tutorialSkip = document.getElementById('tutorial-skip');
    const tutorialGhost = document.getElementById('tutorial-ghost');
    const tutorialAchievement = document.getElementById('tutorial-achievement');
    const tutorialTask = document.getElementById('tutorial-task');
    const tutorialTaskText = document.getElementById('tutorial-task-text');
    const tutorialDemoContainer = document.getElementById('tutorial-demo-container');

    let currentTutorialStep = 0;
    let tutorialWaitingForAction = false;
    let tutorialNodeCountBefore = 0;
    let connectionAnimationInterval = null;
    const TUTORIAL_STORAGE_KEY = 'circuit-builder-tutorial-seen';

    const tutorialSteps = [
        {
            title: "Welcome to Logic Gate Circuit Builder! 🔌",
            text: "This is an interactive visual circuit designer where you can build and simulate logic circuits. Let's take a quick tour of the interface!",
            highlight: null,
            modalPosition: 'center'
        },
        {
            title: "Opening the Component Menu",
            text: `Press <span class="highlight-key">TAB</span> on your keyboard to open the full component menu. Here you can browse all available gates, memory components, and math operations.`,
            highlight: '#component-menu',
            modalPosition: 'right',
            transparent: true,
            openMenu: true
        },
        {
            title: "Quick Access Bar",
            text: `Drag components from the menu to the <span class="highlight-text">Quick Access Bar</span> below for quick placement. Use the <span class="highlight-key">1</span> - <span class="highlight-key">0</span> keys to instantly select!`,
            highlight: '#quick-access-bar',
            modalPosition: 'above',
            transparent: true,
            openMenu: true,
            showDragAnimation: true
        },
        {
            title: "Try It: Place a Gate! 🎯",
            text: `I've added an <span class="highlight-text">AND gate</span> to slot 1. Press <span class="highlight-key">1</span>, then <span class="highlight-text">click on the workspace</span> to place it.`,
            highlight: null,
            modalPosition: 'top-right',
            transparent: true,
            interactive: true,
            task: "Press 1, then click on the workspace to place a gate",
            setupAction: 'setupPlacementTask'
        },
        {
            title: "Navigation & Canvas",
            text: `The workspace is an <span class="highlight-text">infinite canvas</span>! Hold <span class="highlight-key">Middle Mouse Button</span> and drag to pan around. You can also drag-select multiple gates.`,
            highlight: null,
            modalPosition: 'top-right',
            transparent: true
        },
        {
            title: "Making Connections",
            text: `To wire gates together, <span class="highlight-text">click and drag</span> from an output pin (right) to an input pin (left). Watch the demo!`,
            highlight: null,
            modalPosition: 'top-right',
            transparent: true,
            showConnectionAnimation: true
        },
        {
            title: "Configuring Gates",
            text: `Some gates like <span class="highlight-text">Lever</span>, <span class="highlight-text">Threshold</span>, <span class="highlight-text">Function</span>, and <span class="highlight-text">Memory Register</span> have settings. Click the <span class="highlight-text">⚙ gear icon</span> to configure.`,
            highlight: '#config-sidebar',
            modalPosition: 'left',
            showSidebar: true,
            transparent: true
        },
        {
            title: "You're Ready! 🎉",
            text: `That's everything! Use <span class="highlight-key">Save</span>/<span class="highlight-key">Load</span> buttons for your circuits. Press <span class="highlight-key">Delete</span> to remove gates. Have fun building!`,
            highlight: '#top-bar',
            modalPosition: 'below',
            transparent: true
        }
    ];

    function initTutorial() {
        // Reset tutorial state on every page load (for testing/demo purposes)
        localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        startTutorial();
    }

    function startTutorial() {
        currentTutorialStep = 0;
        tutorialOverlay.classList.remove('hidden');
        generateDots();
        showStep(0);
    }

    function endTutorial() {
        // Cleanup
        tutorialOverlay.classList.add('hidden');
        tutorialOverlay.classList.remove('interactive', 'transparent');
        tutorialHighlight.classList.remove('no-shadow');
        tutorialGhost.classList.remove('animating');
        tutorialTask.style.display = 'none';
        tutorialAchievement.classList.remove('show');
        tutorialDemoContainer.style.display = 'none';
        tutorialWaitingForAction = false;
        tutorialNext.classList.remove('waiting');

        // Close menu if open
        if (!componentMenu.classList.contains('hidden')) {
            componentMenu.classList.add('hidden');
        }

        // Stop connection animation
        if (connectionAnimationInterval) {
            clearInterval(connectionAnimationInterval);
            connectionAnimationInterval = null;
        }

        localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');

        // Hide sidebar if not needed
        if (!activeConfigNodeId) {
            sidebar.classList.add('hidden');
        }
    }

    function generateDots() {
        tutorialDots.innerHTML = '';
        tutorialSteps.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'tutorial-dot';
            dot.addEventListener('click', () => {
                if (!tutorialWaitingForAction) {
                    showStep(index);
                }
            });
            tutorialDots.appendChild(dot);
        });
    }

    function updateDots() {
        const dots = tutorialDots.querySelectorAll('.tutorial-dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            if (index === currentTutorialStep) {
                dot.classList.add('active');
            } else if (index < currentTutorialStep) {
                dot.classList.add('completed');
            }
        });
    }

    function showStep(stepIndex) {
        currentTutorialStep = stepIndex;
        const step = tutorialSteps[stepIndex];

        // Reset state
        tutorialOverlay.classList.remove('interactive', 'transparent');
        tutorialHighlight.classList.remove('no-shadow');
        tutorialGhost.classList.remove('animating');
        tutorialTask.style.display = 'none';
        tutorialDemoContainer.style.display = 'none';
        tutorialWaitingForAction = false;
        tutorialNext.classList.remove('waiting');

        // Stop connection animation
        if (connectionAnimationInterval) {
            clearInterval(connectionAnimationInterval);
            connectionAnimationInterval = null;
        }

        // Transparent mode
        if (step.transparent) {
            tutorialOverlay.classList.add('transparent');
            tutorialHighlight.classList.add('no-shadow');
        }

        // Handle menu
        if (step.openMenu) {
            componentMenu.classList.remove('hidden');
            componentMenu.style.display = 'flex';
        } else if (!componentMenu.classList.contains('hidden')) {
            componentMenu.classList.add('hidden');
        }

        // Update content
        tutorialTitle.innerText = step.title;
        tutorialText.innerHTML = step.text;
        tutorialStepCounter.innerText = `Step ${stepIndex + 1} of ${tutorialSteps.length}`;
        updateDots();

        // Update navigation buttons
        tutorialPrev.disabled = stepIndex === 0;
        tutorialNext.innerText = stepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next';

        // Show sidebar for config step
        if (step.showSidebar) {
            sidebar.classList.remove('hidden');
            sidebarTitle.innerText = 'Example Config';
            sidebarContent.innerHTML = '<p style="color: #bdc3c7; font-size: 13px;">Configure gate parameters here when you select a configurable gate.</p>';
        } else if (!activeConfigNodeId) {
            sidebar.classList.add('hidden');
        }

        // Handle drag animation demo (from menu)
        if (step.showDragAnimation) {
            startDragAnimationFromMenu();
        }

        // Handle connection animation
        if (step.showConnectionAnimation) {
            startConnectionAnimation();
        }

        // Handle interactive step
        if (step.interactive) {
            setupInteractiveStep(step);
        }

        // Handle highlight and modal positioning
        // If sidebar is being shown, wait for transition to complete before positioning
        if (step.showSidebar) {
            // CSS transition is 0.3s, wait 350ms to ensure it's complete
            setTimeout(() => positionModalForStep(step), 350);
        } else {
            positionModalForStep(step);
        }
    }

    function positionModalForStep(step) {
        const padding = 20;

        // Reset modal position
        tutorialModal.style.left = '';
        tutorialModal.style.right = '';
        tutorialModal.style.top = '';
        tutorialModal.style.bottom = '';
        tutorialModal.style.transform = '';

        // Handle highlight
        if (step.highlight) {
            const targetEl = document.querySelector(step.highlight);
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                tutorialHighlight.classList.remove('hidden');
                tutorialHighlight.style.left = `${rect.left - 5}px`;
                tutorialHighlight.style.top = `${rect.top - 5}px`;
                tutorialHighlight.style.width = `${rect.width + 10}px`;
                tutorialHighlight.style.height = `${rect.height + 10}px`;
            } else {
                tutorialHighlight.classList.add('hidden');
            }
        } else {
            tutorialHighlight.classList.add('hidden');
        }

        // Position modal based on modalPosition
        switch (step.modalPosition) {
            case 'top-right':
                tutorialModal.style.top = `${60 + padding}px`;
                tutorialModal.style.right = `${padding}px`;
                break;
            case 'top-left':
                tutorialModal.style.top = `${60 + padding}px`;
                tutorialModal.style.left = `${padding}px`;
                break;
            case 'bottom-right':
                tutorialModal.style.bottom = `${100 + padding}px`;
                tutorialModal.style.right = `${padding}px`;
                break;
            case 'above':
                if (step.highlight) {
                    const targetEl = document.querySelector(step.highlight);
                    if (targetEl) {
                        const rect = targetEl.getBoundingClientRect();
                        tutorialModal.style.left = `${Math.max(padding, rect.left + rect.width / 2 - 200)}px`;
                        tutorialModal.style.bottom = `${window.innerHeight - rect.top + padding}px`;
                    }
                }
                break;
            case 'below':
                if (step.highlight) {
                    const targetEl = document.querySelector(step.highlight);
                    if (targetEl) {
                        const rect = targetEl.getBoundingClientRect();
                        tutorialModal.style.left = `${Math.max(padding, rect.left + rect.width / 2 - 200)}px`;
                        tutorialModal.style.top = `${rect.bottom + padding}px`;
                    }
                }
                break;
            case 'left':
                if (step.highlight) {
                    const targetEl = document.querySelector(step.highlight);
                    if (targetEl) {
                        const rect = targetEl.getBoundingClientRect();
                        const modalWidth = 400; // Approximate modal width
                        const spaceOnLeft = rect.left - padding * 2;

                        // Check if there's enough space on the left
                        if (spaceOnLeft >= modalWidth) {
                            tutorialModal.style.right = `${window.innerWidth - rect.left + padding}px`;
                            tutorialModal.style.top = `${Math.max(padding + 60, rect.top)}px`;
                        } else {
                            // Not enough space on left, position in the center-left area instead
                            tutorialModal.style.left = `${padding}px`;
                            tutorialModal.style.top = `${Math.max(padding + 60, Math.min(rect.top, window.innerHeight / 2 - 150))}px`;
                        }
                    }
                } else {
                    tutorialModal.style.left = `${padding}px`;
                    tutorialModal.style.top = '50%';
                    tutorialModal.style.transform = 'translateY(-50%)';
                }
                break;
            case 'right':
                if (step.highlight) {
                    const targetEl = document.querySelector(step.highlight);
                    if (targetEl) {
                        const rect = targetEl.getBoundingClientRect();
                        tutorialModal.style.left = `${rect.right + padding}px`;
                        tutorialModal.style.top = `${Math.max(padding + 60, rect.top)}px`;
                    }
                } else {
                    tutorialModal.style.right = `${padding}px`;
                    tutorialModal.style.top = '50%';
                    tutorialModal.style.transform = 'translateY(-50%)';
                }
                break;
            case 'center':
            default:
                tutorialModal.style.left = '50%';
                tutorialModal.style.top = '50%';
                tutorialModal.style.transform = 'translate(-50%, -50%)';
                break;
        }

        // Viewport boundary clamping - ensure modal stays on screen
        // Need to wait for styles to apply before checking bounds
        requestAnimationFrame(() => {
            const modalRect = tutorialModal.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Skip clamping for centered modals (they use transform)
            if (step.modalPosition === 'center') return;

            let needsRepositioning = false;
            let newLeft = modalRect.left;
            let newTop = modalRect.top;

            // Check right edge overflow
            if (modalRect.right > viewportWidth - padding) {
                newLeft = viewportWidth - modalRect.width - padding;
                needsRepositioning = true;
            }

            // Check left edge overflow
            if (modalRect.left < padding) {
                newLeft = padding;
                needsRepositioning = true;
            }

            // Check bottom edge overflow
            if (modalRect.bottom > viewportHeight - padding) {
                newTop = viewportHeight - modalRect.height - padding;
                needsRepositioning = true;
            }

            // Check top edge overflow (account for top bar)
            const minTop = 60 + padding;
            if (modalRect.top < minTop) {
                newTop = minTop;
                needsRepositioning = true;
            }

            // Apply clamped position if needed
            if (needsRepositioning) {
                // Clear right/bottom positioning to use left/top
                tutorialModal.style.right = '';
                tutorialModal.style.bottom = '';
                tutorialModal.style.transform = '';
                tutorialModal.style.left = `${Math.max(padding, newLeft)}px`;
                tutorialModal.style.top = `${Math.max(minTop, newTop)}px`;
            }
        });
    }

    function startDragAnimationFromMenu() {
        // Find an AND menu item in the open menu
        const menuItem = document.querySelector('.menu-item[data-type="AND"]');
        const firstSlot = document.querySelector('.qa-slot[data-slot="1"]');

        if (menuItem && firstSlot) {
            const menuRect = menuItem.getBoundingClientRect();
            const slotRect = firstSlot.getBoundingClientRect();

            // Calculate drag distance
            const dragX = slotRect.left - menuRect.left + slotRect.width / 2 - menuRect.width / 2;
            const dragY = slotRect.top - menuRect.top;

            // Set ghost position and animation
            tutorialGhost.style.left = `${menuRect.left + menuRect.width / 2 - 30}px`;
            tutorialGhost.style.top = `${menuRect.top + menuRect.height / 2 - 30}px`;
            tutorialGhost.style.setProperty('--drag-x', `${dragX}px`);
            tutorialGhost.style.setProperty('--drag-y', `${dragY}px`);
            tutorialGhost.classList.add('animating');
        }
    }

    function startConnectionAnimation() {
        const demoContainer = tutorialDemoContainer;
        const node1 = document.getElementById('demo-node-1');
        const node2 = document.getElementById('demo-node-2');
        const wireEl = document.getElementById('demo-wire');

        // Position demo nodes in visible area
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        node1.style.left = `${centerX - 180}px`;
        node1.style.top = `${centerY - 35}px`;
        node2.style.left = `${centerX + 80}px`;
        node2.style.top = `${centerY - 35}px`;

        // Show container
        demoContainer.style.display = 'block';

        // Animate wire
        function animateWire() {
            const pin1 = node1.querySelector('.demo-pin.output');
            const pin2 = node2.querySelector('.demo-pin.input');

            const r1 = pin1.getBoundingClientRect();
            const r2 = pin2.getBoundingClientRect();

            const x1 = r1.left + r1.width / 2;
            const y1 = r1.top + r1.height / 2;
            const x2 = r2.left + r2.width / 2;
            const y2 = r2.top + r2.height / 2;

            const dist = Math.abs(x2 - x1) * 0.4;
            const d = `M ${x1} ${y1} C ${x1 + dist} ${y1}, ${x2 - dist} ${y2}, ${x2} ${y2}`;

            wireEl.style.left = '0';
            wireEl.style.top = '0';
            wireEl.style.width = '100vw';
            wireEl.style.height = '100vh';

            const path = wireEl.querySelector('path');
            path.classList.remove('flowing');
            path.setAttribute('d', d);
            path.style.animation = 'none';
            path.offsetHeight; // Trigger reflow
            path.style.animation = 'draw-wire 1s ease-out forwards';

            // After draw, add flowing animation
            setTimeout(() => {
                path.classList.add('flowing');
            }, 1000);
        }

        animateWire();
        connectionAnimationInterval = setInterval(() => {
            animateWire();
        }, 3000);
    }

    function setupInteractiveStep(step) {
        tutorialWaitingForAction = true;
        tutorialOverlay.classList.add('interactive');
        tutorialNext.classList.add('waiting');

        // Show task indicator
        tutorialTask.style.display = 'flex';
        tutorialTask.classList.remove('completed');
        tutorialTask.classList.add('waiting');
        tutorialTaskText.innerText = step.task;

        // Execute setup action
        if (step.setupAction === 'setupPlacementTask') {
            // Close menu first
            if (!componentMenu.classList.contains('hidden')) {
                componentMenu.classList.add('hidden');
            }

            // Pre-populate slot 1 with AND gate
            const slot1 = document.querySelector('.qa-slot[data-slot="1"]');
            if (slot1) {
                assignSlot(slot1, 'AND');
            }

            // Store current node count
            tutorialNodeCountBefore = nodes.length;
        }
    }

    function checkTutorialTaskCompletion() {
        if (!tutorialWaitingForAction) return;

        const step = tutorialSteps[currentTutorialStep];

        if (step.setupAction === 'setupPlacementTask') {
            if (nodes.length > tutorialNodeCountBefore) {
                completeTutorialTask();
            }
        }
    }

    function completeTutorialTask() {
        tutorialWaitingForAction = false;
        tutorialOverlay.classList.remove('interactive');
        tutorialNext.classList.remove('waiting');

        // Update task indicator
        tutorialTask.classList.remove('waiting');
        tutorialTask.classList.add('completed');
        tutorialTaskText.innerText = '✓ Task completed!';

        // Show achievement
        showAchievement();
    }

    function showAchievement() {
        createConfetti();
        tutorialAchievement.classList.add('show');

        setTimeout(() => {
            tutorialAchievement.classList.remove('show');
            setTimeout(() => {
                if (currentTutorialStep < tutorialSteps.length - 1) {
                    showStep(currentTutorialStep + 1);
                }
            }, 300);
        }, 1500);
    }

    function createConfetti() {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const confettiCount = 30;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti ' + (Math.random() > 0.5 ? 'square' : 'circle');
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
            confetti.style.top = '40%';
            confetti.style.animation = `confetti-fall ${1 + Math.random() * 1}s ease-out forwards`;
            confetti.style.animationDelay = `${Math.random() * 0.3}s`;

            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 2500);
        }
    }

    tutorialPrev.addEventListener('click', () => {
        if (!tutorialWaitingForAction && currentTutorialStep > 0) {
            showStep(currentTutorialStep - 1);
        }
    });

    tutorialNext.addEventListener('click', () => {
        if (tutorialWaitingForAction) return;

        if (currentTutorialStep < tutorialSteps.length - 1) {
            showStep(currentTutorialStep + 1);
        } else {
            endTutorial();
        }
    });

    tutorialSkip.addEventListener('click', () => {
        endTutorial();
    });

    // Hook into node creation to check for tutorial task completion
    const originalCreateNode = createNode;
    createNode = function (type, x, y, isGhost = false) {
        const result = originalCreateNode(type, x, y, isGhost);
        if (!isGhost) {
            checkTutorialTaskCompletion();
        }
        return result;
    };

    // Start tutorial on load
    initTutorial();
});