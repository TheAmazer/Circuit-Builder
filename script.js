document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace');
    const world = document.getElementById('world');
    const svgLayer = document.getElementById('connections-layer');
    const componentMenu = document.getElementById('component-menu');
    const menuItems = document.querySelectorAll('.menu-item');
    const selectionBox = document.getElementById('selection-box');
    
    let nodes = [];
    let connections = [];
    let nextNodeId = 1;
    let isDraggingNode = null;
    let selectedNodes = []; // Array for multi-select
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    // Panning & Selection State
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;

    let isSelecting = false;
    let selectStartX = 0;
    let selectStartY = 0;

    // Wiring State
    let isWiring = false;
    let activePin = null; 
    let ghostLine = null; 

    // Placing State
    let placingType = null;
    let ghostNode = null;

    // --- Component Definitions ---
    const componentDefinitions = {
        'AND': { 
            inputs: 2, outputs: 1, label: 'AND',
            desc: "Outputs ON only if <b>both</b> inputs are ON."
        },
        'OR': { 
            inputs: 2, outputs: 1, label: 'OR',
            desc: "Outputs ON if <b>either</b> or both inputs are ON."
        },
        'NOT': { 
            inputs: 1, outputs: 1, label: 'NOT',
            desc: "Inverts the input signal. ON becomes OFF, and OFF becomes ON."
        },
        'XOR': { 
            inputs: 2, outputs: 1, label: 'XOR',
            desc: "Exclusive OR. Outputs ON only if the inputs are <b>different</b> (one ON, one OFF)."
        },
        'Switch': { 
            inputs: 0, outputs: 1, label: 'Switch', type: 'input',
            desc: "A manual toggle switch. Use this to send an ON/OFF signal into your circuit."
        },
        'Lever': {
            inputs: 0, outputs: 1, label: 'Lever', type: 'input',
            desc: "A variable input that outputs a specific <b>Number</b> value."
        },
        'Dial': {
            inputs: 1, outputs: 0, label: 'Dial', type: 'output',
            desc: "Displays the numeric value of the input signal."
        },
        'Light': { 
            inputs: 1, outputs: 0, label: 'Light', type: 'output',
            desc: "A visual indicator. Lights up when receiving an ON signal (value > 0)."
        },
        'ADD': { inputs: 2, outputs: 1, label: 'ADD', desc: "Outputs the sum of two inputs (A + B)." },
        'SUB': { inputs: 2, outputs: 1, label: 'SUB', desc: "Outputs the difference (A - B). Top is A, Bottom is B." },
        'MUL': { inputs: 2, outputs: 1, label: 'MUL', desc: "Outputs the product of two inputs (A * B)." },
        'DIV': { inputs: 2, outputs: 1, label: 'DIV', desc: "Outputs the division (A / B). Top is A, Bottom is B." },
        'Threshold': { inputs: 1, outputs: 1, label: 'Threshold', desc: "Outputs ON if input is between <b>Min</b> and <b>Max</b>." }
    };

    const gateSVGs = {
        'AND': `<svg viewBox="0 0 50 50" class="gate-icon">
                  <path class="fill-shape" d="M 10 5 H 25 A 20 20 0 0 1 25 45 H 10 V 5 Z" />
                </svg>`,
        'OR':  `<svg viewBox="0 0 50 50" class="gate-icon">
                  <path class="fill-shape" d="M 5 5 C 15 5 15 45 5 45 C 35 45 45 25 45 25 C 45 25 35 5 5 5 Z" />
                </svg>`,
        'NOT': `<svg viewBox="0 0 50 50" class="gate-icon">
                  <path class="fill-shape" d="M 10 10 V 40 L 35 25 Z" />
                  <circle cx="40" cy="25" r="4" stroke="currentColor" stroke-width="3" fill="none"/>
                </svg>`,
        'XOR': `<svg viewBox="0 0 50 50" class="gate-icon">
                  <path class="fill-shape" d="M 10 5 C 20 5 20 45 10 45 C 40 45 50 25 50 25 C 50 25 40 5 10 5 Z" />
                  <path d="M 2 5 C 12 5 12 45 2 45" stroke="currentColor" stroke-width="3" fill="none"/>
                </svg>`
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
    const qaSlots = document.querySelectorAll('.qa-slot');
    let selectedMenuItem = null;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            toggleMenu();
        }
        if (e.key === 'Escape') {
            cancelPlacing();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelectedNode();
        }
        // Quick Access Keys
        if (e.key >= '1' && e.key <= '5') {
            const slot = document.querySelector(`.qa-slot[data-slot="${e.key}"]`);
            if (slot && slot.dataset.type) {
                startPlacing(slot.dataset.type);
            }
        }
    });

    function toggleMenu() {
        componentMenu.classList.toggle('hidden');
        if (!componentMenu.classList.contains('hidden')) {
            cancelPlacing();
            // Reset selection logic...
            if (selectedMenuItem) {
                selectedMenuItem.classList.remove('selected');
                selectedMenuItem = null;
                descTitle.innerText = "Select a component";
                descText.innerText = "Click on a component to view its description. Double-click to add it to the circuit board.";
            }
        }
    }

    // Assign Slot Function
    function assignSlot(slot, type) {
        slot.dataset.type = type;
        const hint = slot.querySelector('.key-hint').outerHTML;
        let iconHtml = '';
        
        if (gateSVGs[type]) {
             iconHtml = gateSVGs[type].replace('class="gate-icon"', '');
        } else if (ioSVGs[type]) {
             iconHtml = ioSVGs[type].replace('class="io-icon"', '');
        } else {
             let text = type.substring(0, 2);
             if (type === 'ADD') text = '+';
             if (type === 'SUB') text = '-';
             if (type === 'MUL') text = 'x';
             if (type === 'DIV') text = '/';
             if (type === 'Threshold') text = '[ ]';
             iconHtml = `<div class="math-icon" style="font-size:28px;">${text}</div>`;
        }
        slot.innerHTML = hint + iconHtml;
    }

    // QAB Drop Logic
    qaSlots.forEach(slot => {
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('type');
            if(type) {
                assignSlot(slot, type);
            }
        });
        slot.addEventListener('click', () => {
             if(slot.dataset.type) startPlacing(slot.dataset.type);
        });
    });

    menuItems.forEach(item => {
        const type = item.dataset.type;
        const def = componentDefinitions[type];
        
        // Dynamic Icon Injection for Consistency
        const iconContainer = item.querySelector('.menu-icon');
        if (iconContainer) {
            if (gateSVGs[type]) {
                iconContainer.innerHTML = gateSVGs[type];
            } else if (ioSVGs[type]) {
                iconContainer.innerHTML = ioSVGs[type];
            } else {
                // Keep existing text for Math or unknown, or update styling if needed.
                // Math items already have .math-icon class in HTML.
            }
        }

        // Drag Start (for QAB)
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', type);
        });

        // Single Click: Select & Describe
        item.addEventListener('click', () => {
            if (selectedMenuItem) selectedMenuItem.classList.remove('selected');
            selectedMenuItem = item;
            item.classList.add('selected');

            // Update Desc
            descTitle.innerText = def.label;
            descText.innerHTML = def.desc; // Use innerHTML for bold tags
        });

        // Double Click: Place
        item.addEventListener('dblclick', () => {
            startPlacing(type);
            componentMenu.classList.add('hidden');
        });
    });

    function startPlacing(type) {
        if (ghostNode) ghostNode.remove();
        placingType = type;
        
        // Create a visual ghost
        ghostNode = createNode(type, 0, 0, true); 
        ghostNode.classList.add('ghost');
    }

    function cancelPlacing() {
        placingType = null;
        if (ghostNode) {
            ghostNode.remove();
            ghostNode = null;
        }
    }

    // --- Global Controls (Delete) ---
    function deleteSelectedNode() {
        if (selectedNodes.length === 0) return;

        selectedNodes.forEach(nodeEl => {
            const id = nodeEl.dataset.id;
            
            // 1. Remove Connections
            const toRemove = connections.filter(c => c.sourceNode === id || c.destNode === id);
            toRemove.forEach(c => c.pathEl.remove());
            connections = connections.filter(c => c.sourceNode !== id && c.destNode !== id);

            // 2. Remove Node Element
            nodeEl.remove();

            // 3. Remove from Array
            nodes = nodes.filter(n => n.id !== id);
        });

        selectedNodes = [];
        updateSimulation();
    }
    
    // Helper: Screen to World Coords
    function toWorld(x, y) {
        return { x: x - panX, y: y - panY };
    }

    // Helper: World to Screen Coords
    function toScreen(x, y) {
        return { x: x + panX, y: y + panY };
    }
    
    // Helper to clear selection
    function clearSelection() {
        selectedNodes.forEach(n => n.classList.remove('selected'));
        selectedNodes = [];
    }
    
    // Add Selection
    function addToSelection(node) {
        if (!selectedNodes.includes(node)) {
            selectedNodes.push(node);
            node.classList.add('selected');
        }
    }

    const trashBtn = document.querySelector('.icon-btn');
    if (trashBtn) {
        trashBtn.addEventListener('click', deleteSelectedNode);
    }

    // --- Node Creation ---
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

        // Header
        const header = document.createElement('div');
        header.classList.add('node-header');
        header.innerHTML = `<span>${def.label}</span>`;
        nodeEl.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.classList.add('node-body');

        // Inputs
        const inputsContainer = document.createElement('div');
        inputsContainer.classList.add('inputs');
        for (let i = 0; i < def.inputs; i++) {
            const pin = createPin('input', id, i);
            inputsContainer.appendChild(pin);
        }
        body.appendChild(inputsContainer);

        // Controls
        if (type === 'Switch') {
            const switchControl = document.createElement('div');
            switchControl.className = 'node-control';
            switchControl.innerHTML = '<div class="toggle-switch"></div>'; // Reverted
            if (!isGhost) {
                switchControl.querySelector('.toggle-switch').onclick = function() {
                    this.classList.toggle('on');
                    updateSimulation();
                };
            }
            body.appendChild(switchControl);
        } else if (type === 'Lever') {
            const leverControl = document.createElement('div');
            leverControl.className = 'node-control';
            leverControl.innerHTML = '<input type="number" step="0.1" value="0" class="lever-input">'; // Reverted
            if (!isGhost) {
                const input = leverControl.querySelector('input');
                input.addEventListener('mousedown', (e) => e.stopPropagation());
                input.addEventListener('change', updateSimulation);
                input.addEventListener('input', updateSimulation);
            }
            body.appendChild(leverControl);
        } else if (type === 'Dial') {
            const dialControl = document.createElement('div');
            dialControl.className = 'node-control';
            dialControl.innerHTML = '<div class="dial-display">0.00</div>'; // Reverted
            body.appendChild(dialControl);
        } else if (type === 'Light') {
            const lightControl = document.createElement('div');
            lightControl.className = 'node-control';
            lightControl.innerHTML = '<div class="light-indicator"></div>'; // Reverted
            body.appendChild(lightControl);
        } else if (gateSVGs[type]) {
            const iconContainer = document.createElement('div');
            iconContainer.className = 'node-control';
            iconContainer.innerHTML = gateSVGs[type];
            body.appendChild(iconContainer);
        } else if (type === 'Threshold') {
            const thControl = document.createElement('div');
            thControl.className = 'node-control threshold-control';
            thControl.innerHTML = `
                <input type="number" class="threshold-input" placeholder="Min" value="0">
                <input type="number" class="threshold-input" placeholder="Max" value="1">
            `; // Reverted (no math-icon div)
            if (!isGhost) {
                const inputs = thControl.querySelectorAll('input');
                inputs.forEach(inp => {
                    inp.addEventListener('mousedown', e => e.stopPropagation());
                    inp.addEventListener('change', updateSimulation);
                    inp.addEventListener('input', updateSimulation);
                });
            }
            body.appendChild(thControl);
        } else {
            // Text Fallback (Math)
            const iconContainer = document.createElement('div');
            iconContainer.className = 'node-control';
            let text = type.substring(0, 2);
            if (type === 'ADD') text = '+';
            if (type === 'SUB') text = '-';
            if (type === 'MUL') text = 'x';
            if (type === 'DIV') text = '/';
            iconContainer.innerHTML = `<div class="math-icon">${text}</div>`;
            body.appendChild(iconContainer);
        }

        // Outputs
        const outputsContainer = document.createElement('div');
        outputsContainer.classList.add('outputs');
        for (let i = 0; i < def.outputs; i++) {
            const pin = createPin('output', id, i);
            outputsContainer.appendChild(pin);
        }
        body.appendChild(outputsContainer);

        nodeEl.appendChild(body);
        
        // Append to WORLD (except ghost? Ghost usually in world too)
        // If ghost, maybe workspace for overlay? But then it doesn't pan.
        // Actually ghost should follow mouse, so overlay (workspace) is better IF panning.
        // For now, let's put real nodes in World. Ghost in Workspace (simple overlay).
        if (isGhost) {
            workspace.appendChild(nodeEl);
        } else {
            world.appendChild(nodeEl);
        }

        if (!isGhost) {
            // Node Movement Handlers
            header.addEventListener('mousedown', (e) => {
                e.stopPropagation(); 
                
                // Multi-Selection Logic
                if (!e.shiftKey && !selectedNodes.includes(nodeEl)) {
                    clearSelection();
                }
                addToSelection(nodeEl);

                isDraggingNode = true;
                // No offset needed, we use movementX/Y
            });

            nodes.push({ id, type, el: nodeEl });
        }
        
        return nodeEl;
    }

    function createPin(type, nodeId, index) {
        const pin = document.createElement('div');
        pin.classList.add('pin', type);
        pin.dataset.type = type;
        pin.dataset.node = nodeId;
        pin.dataset.index = index;
        pin.title = `${type} ${index + 1}`;
        
        // Wiring Interaction
        pin.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Don't drag node or select node (optional, maybe we want to select?)
            startWiring(pin);
        });
        
        pin.addEventListener('mouseup', (e) => {
            e.stopPropagation();
            finishWiring(pin);
        });

        return pin;
    }

    // --- Global Mouse Events (Moving Nodes & Wiring) ---
    // Background click to deselect OR Place Node OR Pan OR Select
    workspace.addEventListener('mousedown', (e) => {
        // Middle Click -> Pan
        if (e.button === 1) {
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            e.preventDefault();
            return;
        }

        // Left Click -> Place or Select
        if (e.button === 0) {
            if (placingType) {
                // Place Node
                const rect = workspace.getBoundingClientRect();
                const rawX = e.clientX - rect.left;
                const rawY = e.clientY - rect.top;
                const wPos = toWorld(rawX, rawY); // Place in world coords
                
                createNode(placingType, wPos.x - 70, wPos.y - 30);
                cancelPlacing(); 
                return;
            }

            // If clicked on background -> Start Selection Box
            if (e.target === workspace || e.target === world || e.target === svgLayer) {
                clearSelection();
                
                isSelecting = true;
                const rect = workspace.getBoundingClientRect();
                selectStartX = e.clientX - rect.left;
                selectStartY = e.clientY - rect.top;
                
                selectionBox.style.left = `${selectStartX}px`;
                selectionBox.style.top = `${selectStartY}px`;
                selectionBox.style.width = '0px';
                selectionBox.style.height = '0px';
                selectionBox.classList.remove('hidden');
            }
        }
    });

    // Right click to cancel placement
    workspace.addEventListener('contextmenu', (e) => {
        if (placingType) {
            e.preventDefault();
            cancelPlacing();
        }
    });

    workspace.addEventListener('mousemove', (e) => {
        const rect = workspace.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Panning
        if (isPanning) {
            const dx = e.clientX - panStartX;
            const dy = e.clientY - panStartY;
            panX += dx;
            panY += dy;
            panStartX = e.clientX;
            panStartY = e.clientY;
            
            world.style.transform = `translate(${panX}px, ${panY}px)`;
            workspace.style.backgroundPosition = `${panX}px ${panY}px`;
            return;
        }

        // Selection Box
        if (isSelecting) {
            const currentX = mouseX;
            const currentY = mouseY;
            
            const x = Math.min(selectStartX, currentX);
            const y = Math.min(selectStartY, currentY);
            const w = Math.abs(currentX - selectStartX);
            const h = Math.abs(currentY - selectStartY);
            
            selectionBox.style.left = `${x}px`;
            selectionBox.style.top = `${y}px`;
            selectionBox.style.width = `${w}px`;
            selectionBox.style.height = `${h}px`;
            return;
        }

        // Ghost Follow (Screen Coords)
        if (placingType && ghostNode) {
            ghostNode.style.left = `${mouseX - 70}px`;
            ghostNode.style.top = `${mouseY - 30}px`;
        }

        // Drag Nodes (Multi-Move)
        if (isDraggingNode) {
            const dx = e.movementX;
            const dy = e.movementY;
            
            selectedNodes.forEach(node => {
                 const curL = parseFloat(node.style.left);
                 const curT = parseFloat(node.style.top);
                 node.style.left = `${curL + dx}px`;
                 node.style.top = `${curT + dy}px`;
            });
            
            updateConnections();
            
            // Trash Interaction
             if (trashBtn) {
                const trashRect = trashBtn.getBoundingClientRect();
                const trashCX = trashRect.left + trashRect.width / 2;
                const trashCY = trashRect.top + trashRect.height / 2;
                const dist = Math.hypot(e.clientX - trashCX, e.clientY - trashCY);
                if (dist < 60) trashBtn.classList.add('expanded');
                else trashBtn.classList.remove('expanded');
            }
        }

        // Wiring
        if (isWiring && activePin) {
             const mWorld = toWorld(mouseX, mouseY);
             const pinRect = activePin.getBoundingClientRect();
             const pX = (pinRect.left - rect.left) - panX;
             const pY = (pinRect.top - rect.top) - panY;
             updateGhostLine(pX, pY, mWorld.x, mWorld.y);
        }
    });

    document.addEventListener('mouseup', (e) => {
        isPanning = false;

        // Selection Box Finalize
        if (isSelecting) {
            isSelecting = false;
            selectionBox.classList.add('hidden');
            
            // Calculate Box World Rect
            // Box is screen/workspace coords
            const bLeft = parseFloat(selectionBox.style.left);
            const bTop = parseFloat(selectionBox.style.top);
            const bWidth = parseFloat(selectionBox.style.width);
            const bHeight = parseFloat(selectionBox.style.height);
            
            // We need to check nodes (which are in World).
            // A node intersects if its Screen Rect intersects the Box.
            // Screen Rect of Node = Node World Pos + Pan.
            
            const rect = workspace.getBoundingClientRect(); // Workspace offset
            
            nodes.forEach(n => {
                const nRect = n.el.getBoundingClientRect();
                // nRect is viewport relative.
                // Box is workspace relative (inside #workspace).
                // So compare relative to viewport.
                
                const boxScreenX = bLeft + rect.left;
                const boxScreenY = bTop + rect.top;
                
                // Intersection Check
                if (nRect.left < boxScreenX + bWidth &&
                    nRect.left + nRect.width > boxScreenX &&
                    nRect.top < boxScreenY + bHeight &&
                    nRect.top + nRect.height > boxScreenY) {
                        addToSelection(n.el);
                }
            });
        }

        if (isDraggingNode) {
            // Check delete
            if (trashBtn && trashBtn.classList.contains('expanded')) {
                deleteSelectedNode();
                trashBtn.classList.remove('expanded');
            }
            isDraggingNode = null;
        }
        if (isWiring) {
            cancelWiring();
        }
    });

    // --- Wiring Logic ---
    function startWiring(pin) {
        // Only start wiring from outputs for now (typical Stormworks flow is Output -> Input)
        // actually, let's allow Input -> Output (dragging from input to find source) or Output -> Input
        isWiring = true;
        activePin = pin;
        
        // Create ghost line
        ghostLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        ghostLine.classList.add('wire-ghost');
        svgLayer.appendChild(ghostLine);
    }

    function updateGhostLine(x1, y1, x2, y2) {
        if (!ghostLine) return;
        const d = calculateWirePath(x1, y1, x2, y2);
        ghostLine.setAttribute('d', d);
    }

    function finishWiring(targetPin) {
        if (!isWiring || !activePin) return;
        
        if (activePin === targetPin) return; // Can't connect to self
        if (activePin.dataset.node === targetPin.dataset.node) return; // Can't connect same node
        if (activePin.dataset.type === targetPin.dataset.type) return; // Must be Input <-> Output

        // Determine source and destination
        let sourcePin = activePin.dataset.type === 'output' ? activePin : targetPin;
        let destPin = activePin.dataset.type === 'input' ? activePin : targetPin;

        // Avoid duplicates
        const exists = connections.find(c => 
            c.sourceNode === sourcePin.dataset.node && 
            c.sourceIndex === sourcePin.dataset.index &&
            c.destNode === destPin.dataset.node &&
            c.destIndex === destPin.dataset.index
        );

        if (!exists) {
            // Allow multiple connections from one output, but only one connection to an input?
            // Logic gates usually allow one input per pin.
            // Remove existing connection to this destination input if any
            connections = connections.filter(c => 
                !(c.destNode === destPin.dataset.node && c.destIndex === destPin.dataset.index)
            );
            
            createConnection(sourcePin, destPin);
        }

        cancelWiring();
        updateSimulation(); // Trigger update immediately
    }

    function cancelWiring() {
        isWiring = false;
        activePin = null;
        if (ghostLine) {
            ghostLine.remove();
            ghostLine = null;
        }
    }

    function createConnection(sourcePinEl, destPinEl) {
        const connId = `conn-${Date.now()}-${Math.random()}`;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('wire');
        path.id = connId;
        
        // Add delete handler (click to delete)
        path.addEventListener('click', (e) => {
            // Check if alt key or similar is held, or just delete on click for prototype
             if (confirm('Delete connection?')) {
                 connections = connections.filter(c => c.id !== connId);
                 path.remove();
                 updateSimulation();
             }
        });

        svgLayer.appendChild(path);

        connections.push({
            id: connId,
            pathEl: path,
            sourceNode: sourcePinEl.dataset.node,
            sourceIndex: sourcePinEl.dataset.index,
            destNode: destPinEl.dataset.node,
            destIndex: destPinEl.dataset.index
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

            // Calculate pos relative to World Container
            // Add width/2 to center on pin
            const x1 = (sRect.left - worldRect.left) + sRect.width / 2;
            const y1 = (sRect.top - worldRect.top) + sRect.height / 2;
            const x2 = (dRect.left - worldRect.left) + dRect.width / 2;
            const y2 = (dRect.top - worldRect.top) + dRect.height / 2;

            conn.pathEl.setAttribute('d', calculateWirePath(x1, y1, x2, y2));
        });
    }

    function calculateWirePath(x1, y1, x2, y2) {
        // Bezier Curve
        const dist = Math.abs(x2 - x1) * 0.5;
        // Control points: Pull horizontal from pads
        const cp1x = x1 + dist + 20; // +20 ensures it goes out a bit even if close
        const cp1y = y1;
        const cp2x = x2 - dist - 20;
        const cp2y = y2;
        
        return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    }

    // --- Simulation Logic (Basic) ---
    function updateSimulation() {
        // 1. Reset all inputs
        // Simple state map: nodeID -> { inputVals: {}, outputVals: {} }
        const state = {};
        nodes.forEach(n => {
            state[n.id] = { 
                type: n.type,
                inputVals: {}, 
                outputVals: {} 
            };
        });

        // 3. Get Switch & Lever states
        document.querySelectorAll('.node[data-type="Switch"]').forEach(el => {
            const isOn = el.querySelector('.toggle-switch').classList.contains('on');
            state[el.id].outputVals[0] = isOn;
        });
        document.querySelectorAll('.node[data-type="Lever"]').forEach(el => {
            const val = parseFloat(el.querySelector('input').value) || 0;
            state[el.id].outputVals[0] = val;
        });

        // 4. Evaluation Loop (Simulate propagation delay)
        // Max depth 20 to prevent infinite loops freezing UI
        for (let pass = 0; pass < 20; pass++) {
            let changed = false;

            // Transfer outputs to inputs via connections
            connections.forEach(conn => {
                const val = state[conn.sourceNode].outputVals[conn.sourceIndex];
                // Check undefined explicitly
                if (state[conn.destNode].inputVals[conn.destIndex] !== val) {
                    state[conn.destNode].inputVals[conn.destIndex] = val;
                    changed = true;
                }
            });

            // Evaluate Gates
            nodes.forEach(n => {
                const s = state[n.id];
                const i0 = s.inputVals[0] !== undefined ? s.inputVals[0] : 0;
                const i1 = s.inputVals[1] !== undefined ? s.inputVals[1] : 0;
                let out = 0;

                // Logic Helper: Treat val > 0 as true
                const b0 = (typeof i0 === 'number' ? i0 > 0 : i0) === true;
                const b1 = (typeof i1 === 'number' ? i1 > 0 : i1) === true;

                switch (n.type) {
                    case 'AND': out = b0 && b1; break;
                    case 'OR':  out = b0 || b1; break;
                    case 'NOT': out = !b0; break;
                    case 'XOR': out = b0 !== b1; break;
                    
                    case 'ADD': out = (Number(i0)||0) + (Number(i1)||0); break;
                    case 'SUB': out = (Number(i0)||0) - (Number(i1)||0); break;
                    case 'MUL': out = (Number(i0)||0) * (Number(i1)||0); break;
                    case 'DIV': 
                        const divI1 = Number(i1)||0;
                        out = divI1 === 0 ? 0 : (Number(i0)||0) / divI1; 
                        break;
                    case 'Threshold':
                        const min = parseFloat(n.el.querySelector('input:nth-child(1)').value) || 0;
                        const max = parseFloat(n.el.querySelector('input:nth-child(2)').value) || 0;
                        const valIn = Number(i0) || 0;
                        out = (valIn >= min && valIn <= max);
                        break;
                }

                if (n.type !== 'Switch' && n.type !== 'Lever' && n.type !== 'Light' && n.type !== 'Dial') {
                    if (s.outputVals[0] !== out) {
                        s.outputVals[0] = out;
                        changed = true;
                    }
                }
            });

            if (!changed) break;
        }

        // 5. Update UI (Lights)
        nodes.forEach(n => {
            if (n.type === 'Light') {
                const val = state[n.id].inputVals[0];
                const isOn = (typeof val === 'number' ? val > 0 : val) === true;
                const lightEl = n.el.querySelector('.light-indicator');
                if (isOn) lightEl.classList.add('on');
                else lightEl.classList.remove('on');
            } else if (n.type === 'Dial') {
                 const val = state[n.id].inputVals[0];
                 const display = n.el.querySelector('.dial-display');
                 if (typeof val === 'number') {
                     display.innerText = val.toFixed(2);
                 } else if (val === true) {
                     display.innerText = 'ON';
                 } else if (val === false || val === undefined) {
                     display.innerText = '0.00';
                 }
            }
        });
        
        // Optional: Animate wires (color them if active)
        connections.forEach(conn => {
             const val = state[conn.sourceNode].outputVals[conn.sourceIndex];
             if (typeof val === 'number') {
                 conn.pathEl.style.stroke = '#2ecc71'; // Green for Numbers
                 conn.pathEl.style.strokeWidth = '3px';
             } else if (val === true) {
                 conn.pathEl.style.stroke = '#f1c40f'; // Active Bool
                 conn.pathEl.style.strokeWidth = '3px';
             } else {
                 conn.pathEl.style.stroke = ''; // Revert to CSS default (red/green)
                 conn.pathEl.style.strokeWidth = '';
             }
        });
    }

    // Clear board
    clearBtn.addEventListener('click', () => {
        workspace.innerHTML = '<svg id="connections-layer"></svg>'; // Nuke it (lazy way)
        nodes = [];
        connections = [];
        nextNodeId = 1;
        // Re-fetch svg layer
        const newSvg = document.getElementById('connections-layer');
        // We lost the svg reference, need to update global var? 
        // Better:
        window.location.reload(); // Simplest for prototype
    });

    // Initial Sim
    updateSimulation();
});
