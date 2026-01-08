// script.js
import { componentDefinitions, gateSVGs, ioSVGs, pinDescriptions, configurableTypes } from './gateDefinitions.js';
import { updateSimulation, getConnectionValue } from './simulation.js';
import { initTutorial, checkTutorialTaskCompletion } from './tutorial.js';
import { initMinimap, drawMinimap } from './minimap.js';
import { initWiring, startWiring, updateGhostLine, finishWiring, cancelWiring, createConnection, updateConnections, getWiringStatus } from './wiring.js';

const workspace = document.getElementById('workspace');
const world = document.getElementById('world');
const svgLayer = document.getElementById('connections-layer');
const componentMenu = document.getElementById('component-menu');
const menuItems = document.querySelectorAll('.menu-item');
const componentSearch = document.getElementById('component-search');
const selectionBox = document.getElementById('selection-box');
const tooltip = document.getElementById('custom-tooltip');

if (componentSearch) {
    componentSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        
        // Filter Items
        menuItems.forEach(item => {
            const type = item.dataset.type.toLowerCase();
            if (type.includes(term)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });

        // Handle Section Titles
        const sections = document.querySelectorAll('.menu-section-title');
        sections.forEach(title => {
            const grid = title.nextElementSibling;
            if (grid && grid.classList.contains('menu-grid')) {
                const visibleItems = grid.querySelectorAll('.menu-item:not(.hidden)');
                if (visibleItems.length > 0) {
                    title.classList.remove('hidden');
                } else {
                    title.classList.add('hidden');
                }
            }
        });
    });
}


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
let zoom = 1;
let zoomSensitivity = 0.5;
let panSensitivity = 0.5;
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

// Placing State
let placingType = null;
let ghostNode = null;

// Delete Mode State
let isDeleteMode = false;

// --- Menu & Placing Logic ---
const descTitle = document.getElementById('desc-title');
const descText = document.getElementById('desc-text');
const qaSlots = document.querySelectorAll('.qa-slot:not(#qa-menu-btn)');
const qaMenuBtn = document.getElementById('qa-menu-btn');
const deleteModeBtn = document.getElementById('delete-mode-btn');
let selectedMenuItem = null;

document.addEventListener('keydown', (e) => {
    // Ignore hotkeys if typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Tab') { e.preventDefault(); toggleMenu(); } // Allow Tab to toggle menu even from input
        if (e.key === 'Escape') { e.target.blur(); } // Blur input on Escape
        return;
    }

    if (e.key === 'Tab') { e.preventDefault(); toggleMenu(); }
    if (e.key === 'Escape') {
        cancelPlacing();
        closeSidebar();
        closeSettings();
        if (isDeleteMode) toggleDeleteMode(); // Exit delete mode on Escape
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
        // If nodes are selected, delete them; otherwise toggle delete mode
        if (selectedNodes.length > 0) {
            deleteSelectedNode();
        } else {
            toggleDeleteMode();
        }
    }
    if ((e.key >= '0' && e.key <= '9')) {
        const slot = document.querySelector(`.qa-slot[data-slot="${e.key}"]`);
        if (slot && slot.dataset.type) startPlacing(slot.dataset.type);
    }
});

if (qaMenuBtn) qaMenuBtn.addEventListener('click', toggleMenu);
if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);

// Delete Mode Toggle
function toggleDeleteMode() {
    isDeleteMode = !isDeleteMode;
    if (isDeleteMode) {
        document.body.classList.add('delete-mode');
        deleteModeBtn?.classList.add('active');
        cancelPlacing(); // Cancel any placing operation
    } else {
        document.body.classList.remove('delete-mode');
        deleteModeBtn?.classList.remove('active');
    }
}

if (deleteModeBtn) {
    deleteModeBtn.addEventListener('click', toggleDeleteMode);
}

// Settings Modal
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const zoomSensitivitySlider = document.getElementById('zoom-sensitivity');
const zoomSensitivityValue = document.getElementById('zoom-sensitivity-value');
const panSensitivitySlider = document.getElementById('pan-sensitivity');
const panSensitivityValue = document.getElementById('pan-sensitivity-value');
const darkModeToggle = document.getElementById('dark-mode-toggle');

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
}

if (settingsClose) {
    settingsClose.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });
}

if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });
}

if (zoomSensitivitySlider) {
    zoomSensitivitySlider.addEventListener('input', (e) => {
        zoomSensitivity = parseFloat(e.target.value);
        zoomSensitivityValue.textContent = zoomSensitivity.toFixed(1) + 'x';
    });
}

if (panSensitivitySlider) {
    panSensitivitySlider.addEventListener('input', (e) => {
        panSensitivity = parseFloat(e.target.value);
        panSensitivityValue.textContent = panSensitivity.toFixed(1) + 'x';
    });
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', (e) => {
        darkModeToggle.classList.toggle('on');
        const isDark = darkModeToggle.classList.contains('on');
        
        if (isDark) {
            document.body.classList.add('dark-mode');
            darkModeToggle.nextElementSibling.innerText = "On";
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggle.nextElementSibling.innerText = "Off";
        }
    });
}

// Update Escape key to also close settings modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
    }
});

function closeSettings() {
    if (settingsModal) settingsModal.classList.add('hidden');
}

let menuTransitioning = false;

function toggleMenu() {
    // Prevent toggle during transition to avoid race conditions
    if (menuTransitioning) return;

    if (componentMenu.classList.contains('hidden')) {
        componentMenu.style.display = 'flex';
        componentMenu.offsetWidth; // Force reflow
        componentMenu.classList.remove('hidden');
        cancelPlacing();

        // Reset and focus search
        if (componentSearch) {
            componentSearch.value = '';
            componentSearch.focus();
            // Trigger input event to reset list
            componentSearch.dispatchEvent(new Event('input'));
        }

        if (selectedMenuItem) {
            selectedMenuItem.classList.remove('selected');
            selectedMenuItem = null;
            descTitle.innerText = "Select a component";
            descText.innerText = "Click on a component to view its description. Double-click to add it to the circuit board.";
        }
    } else {
        menuTransitioning = true;
        componentMenu.classList.add('hidden');
        componentMenu.addEventListener('transitionend', function onTransitionEnd(e) {
            // Only handle the opacity transition to prevent multiple fires
            if (e.propertyName !== 'opacity') return;
            componentMenu.style.display = 'none';
            componentMenu.removeEventListener('transitionend', onTransitionEnd);
            menuTransitioning = false;
        });
        // Safety timeout in case transitionend doesn't fire
        setTimeout(() => {
            if (menuTransitioning) {
                componentMenu.style.display = 'none';
                menuTransitioning = false;
            }
        }, 400);
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
    // Hide tooltip in case we're deleting a node while hovering over it
    tooltip.classList.add('hidden');
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
    updateSimulation(nodes, connections);
    drawMinimap();
    saveState();
}

function toWorld(x, y) { return { x: (x - panX) / zoom, y: (y - panY) / zoom }; }
function clearSelection() { selectedNodes.forEach(n => n.classList.remove('selected')); selectedNodes = []; }
function addToSelection(node) {
    if (!selectedNodes.includes(node)) { selectedNodes.push(node); node.classList.add('selected'); }
}

const trashBtn = document.querySelector('.icon-btn');
if (trashBtn) trashBtn.addEventListener('click', deleteSelectedNode);

function openSidebar(nodeId) {
    closeSettings();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    activeConfigNodeId = nodeId;
    sidebarTitle.innerText = `${node.type} Config`;
    sidebarContent.innerHTML = '';
    if (node.type === 'Lever') {
        createSidebarInput('Value', 'number', node.config.value || 0, (val) => {
            node.config.value = parseFloat(val); updateSimulation(nodes, connections); saveState();
        });
    } else if (node.type === 'Threshold') {
        createSidebarInput('Min Value', 'number', node.config.min || 0, (val) => {
            node.config.min = parseFloat(val); updateSimulation(nodes, connections); saveState();
        });
        createSidebarInput('Max Value', 'number', node.config.max || 1, (val) => {
            node.config.max = parseFloat(val); updateSimulation(nodes, connections); saveState();
        });
    } else if (node.type === 'Function') {
        createSidebarInput('Formula (use x)', 'text', node.config.formula || 'x', (val) => {
            node.config.formula = val; updateSimulation(nodes, connections); saveState();
        });
    } else if (node.type === 'Memory Register') {
        createSidebarInput('Reset Value', 'number', node.config.resetVal || 0, (val) => {
            node.config.resetVal = parseFloat(val); updateSimulation(nodes, connections); saveState();
        });
    } else if (node.type === 'Delay') {
        createSidebarInput('Delay Ticks', 'number', node.config.ticks || 1, (val) => {
            node.config.ticks = Math.max(1, parseInt(val) || 1); updateSimulation(nodes, connections); saveState();
        });
    } else if (node.type === 'Debounce') {
        createSidebarInput('Stable Ticks', 'number', node.config.ticks || 5, (val) => {
            node.config.ticks = Math.max(1, parseInt(val) || 5); updateSimulation(nodes, connections); saveState();
        });
    } else if (node.type === 'Random') {
        createSidebarInput('Min Value', 'number', node.config.min || 0, (val) => {
            node.config.min = parseFloat(val); updateSimulation(nodes, connections); saveState();
        });
        createSidebarInput('Max Value', 'number', node.config.max || 1, (val) => {
            node.config.max = parseFloat(val); updateSimulation(nodes, connections); saveState();
        });
    } else if (node.type === 'Constant') {
        createSidebarInput('Value', 'number', node.config.value || 0, (val) => {
            node.config.value = parseFloat(val); updateSimulation(nodes, connections); saveState();
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
    closeSettings();
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
    const numTypes = ['ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'POW', 'SQRT', 'ABS', 'NEG', 'MIN', 'MAX', 'CLAMP', 'ROUND', 'FLOOR', 'CEIL', 'Lever', 'Dial', 'Function', 'Equal', 'Greater Than', 'Less Than', 'Numerical Switchbox', 'Memory Register', 'Constant', 'Delay', 'Counter', 'Timer', 'Random', 'Up/Down Counter'];
    if (numTypes.includes(type)) {
        inputClass = 'num';
        if (['ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'POW', 'SQRT', 'ABS', 'NEG', 'MIN', 'MAX', 'CLAMP', 'ROUND', 'FLOOR', 'CEIL', 'Lever', 'Function', 'Numerical Switchbox', 'Memory Register', 'Constant', 'Delay', 'Counter', 'Timer', 'Random', 'Up/Down Counter'].includes(type)) outputClass = 'num';
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
        const pin = createPin('input', id, i, currentInputClass, type);
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
                updateSimulation(nodes, connections);
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
        const pin = createPin('output', id, i, outputClass, type);
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

            // In delete mode, clicking header deletes the node
            if (isDeleteMode) {
                const toRemove = connections.filter(c => c.sourceNode === id || c.destNode === id);
                toRemove.forEach(c => c.pathEl.remove());
                connections = connections.filter(c => c.sourceNode !== id && c.destNode !== id);
                nodeEl.remove();
                nodes = nodes.filter(n => n.id !== id);
                if (activeConfigNodeId === id) closeSidebar();
                tooltip.classList.add('hidden');
                updateSimulation(nodes, connections);
                saveState();
                return;
            }

            if (!e.shiftKey && !selectedNodes.includes(nodeEl)) clearSelection();
            addToSelection(nodeEl);
            isDraggingNode = true;
        });

        const nodeData = { id, type, el: nodeEl, memory: {}, config: {} };
        if (type === 'Lever') nodeData.config.value = 0;
        if (type === 'Threshold') { nodeData.config.min = 0; nodeData.config.max = 1; }
        if (type === 'Function') nodeData.config.formula = 'x';
        if (type === 'Memory Register') nodeData.config.resetVal = 0;
        if (type === 'Delay') nodeData.config.ticks = 1;
        if (type === 'Debounce') nodeData.config.ticks = 5;
        if (type === 'Random') { nodeData.config.min = 0; nodeData.config.max = 1; }
        if (type === 'Constant') nodeData.config.value = 0;

        if (['SR Latch', 'D Flip-Flop', 'JK Flip-Flop', 'T Flip-Flop', 'Memory Register'].includes(type)) {
            nodeData.memory.state = 0; nodeData.memory.lastClock = false;
        }
        if (['Counter', 'Timer', 'Up/Down Counter'].includes(type)) {
            nodeData.memory.count = 0; nodeData.memory.time = 0;
        }
        if (type === 'Delay') nodeData.memory.buffer = [];
        if (type === 'Pulse') nodeData.memory.lastInput = false;
        if (type === 'Debounce') { nodeData.memory.lastStableValue = false; nodeData.memory.counter = 0; }
        if (type === 'Random') { nodeData.memory.lastTrigger = false; nodeData.memory.lastValue = 0; }
        nodes.push(nodeData);
        setTimeout(() => drawMinimap(), 10);

        // Notify tutorial
        checkTutorialTaskCompletion();
    }
    return nodeEl;
}

function createPin(type, nodeId, index, styleClass = 'bool', gateType = '') {
    const pin = document.createElement('div');
    pin.classList.add('pin', type, styleClass);
    pin.dataset.type = type;
    pin.dataset.node = nodeId;
    pin.dataset.index = index;
    pin.dataset.gateType = gateType;

    // Get pin description from pinDescriptions
    const desc = pinDescriptions[gateType];
    let pinLabel = `${type} ${index + 1}`;
    if (desc) {
        if (type === 'input' && desc.inputs && desc.inputs[index]) {
            pinLabel = desc.inputs[index];
        } else if (type === 'output' && desc.outputs && desc.outputs[index]) {
            pinLabel = desc.outputs[index];
        }
    }

    // Pin tooltip events
    pin.addEventListener('mouseenter', (e) => {
        if (isDeleteMode) return;
        const pinType = type === 'input' ? 'INPUT' : 'OUTPUT';
        const color = type === 'input' ? '#e74c3c' : '#2ecc71';
        tooltip.innerHTML = `<span style="color: ${color}; font-weight: bold;">[${pinType}]</span> ${pinLabel}`;
        tooltip.classList.remove('hidden');
    });
    pin.addEventListener('mouseleave', () => {
        tooltip.classList.add('hidden');
    });
    pin.addEventListener('mousemove', (e) => {
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

    // Explicitly handle events to avoid conflicts
    pin.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault(); // Critical for proper drag behavior
        tooltip.classList.add('hidden'); // Hide tooltip when starting to wire
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
        // Delete mode: click to delete nodes
        if (isDeleteMode) {
            const nodeEl = e.target.closest('.node');
            if (nodeEl && !nodeEl.classList.contains('ghost')) {
                const id = nodeEl.dataset.id;
                // Remove all connections to/from this node
                const toRemove = connections.filter(c => c.sourceNode === id || c.destNode === id);
                toRemove.forEach(c => c.pathEl.remove());
                connections = connections.filter(c => c.sourceNode !== id && c.destNode !== id);
                // Remove the node
                nodeEl.remove();
                nodes = nodes.filter(n => n.id !== id);
                if (activeConfigNodeId === id) closeSidebar();
                tooltip.classList.add('hidden');
                updateSimulation(nodes, connections);
                saveState();
                e.stopPropagation();
                return;
            }
            // Click on empty space in delete mode exits the mode
            if (e.target === workspace || e.target === world || e.target === svgLayer) {
                toggleDeleteMode();
                return;
            }
        }

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

// Wheel event for zoom and trackpad panning
workspace.addEventListener('wheel', (e) => {
    e.preventDefault();

    // Detect if this is likely a trackpad (has both deltaX and deltaY with small values)
    // or a mouse wheel (typically only deltaY with larger values)
    const isTrackpadPan = !e.ctrlKey && Math.abs(e.deltaX) > 0;

    if (e.shiftKey || isTrackpadPan) {
        // Pan with Shift + scroll, or two-finger trackpad gesture
        panX -= e.deltaX * panSensitivity;
        panY -= e.deltaY * panSensitivity;
        updateWorldTransform();
    } else {
        // Zoom with scroll wheel (default) or Ctrl + scroll (pinch on trackpad)
        const rect = workspace.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Get world position under cursor before zoom
        const worldX = (mouseX - panX) / zoom;
        const worldY = (mouseY - panY) / zoom;

        // Calculate new zoom level with sensitivity
        const baseZoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const zoomFactor = 1 + (baseZoomFactor - 1) * zoomSensitivity;
        const newZoom = Math.min(10, Math.max(0.1, zoom * zoomFactor));

        // Adjust pan to keep the point under cursor stationary
        panX = mouseX - worldX * newZoom;
        panY = mouseY - worldY * newZoom;
        zoom = newZoom;

        updateWorldTransform();
    }
}, { passive: false });

function updateWorldTransform() {
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    workspace.style.backgroundPosition = `${panX}px ${panY}px`;
    workspace.style.backgroundSize = `${40 * zoom}px ${40 * zoom}px`;
    updateConnections();
    drawMinimap();
}

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
        updateWorldTransform();
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
            const newX = parseFloat(node.style.left) + e.movementX / zoom;
            const newY = parseFloat(node.style.top) + e.movementY / zoom;
            node.style.left = `${newX}px`;
            node.style.top = `${newY}px`;

            // Sync with data model for minimap
            const nData = nodes.find(n => n.id == node.dataset.id);
            if (nData) { nData.x = newX; nData.y = newY; }
        });
        updateConnections();
        drawMinimap();
        if (trashBtn) {
            const tr = trashBtn.getBoundingClientRect();
            const dist = Math.hypot(e.clientX - (tr.left + tr.width / 2), e.clientY - (tr.top + tr.height / 2));
            if (dist < 60) trashBtn.classList.add('expanded'); else trashBtn.classList.remove('expanded');
        }
    }

    const wiringStatus = getWiringStatus();
    if (wiringStatus.isWiring && wiringStatus.activePin) {
        sidebarTitle.innerText = "Wiring..."; // Visual Debug
        const mWorld = toWorld(mouseX, mouseY);
        const pRect = wiringStatus.activePin.getBoundingClientRect();
        
        // Calculate center of pin in screen coordinates relative to workspace
        const pinScreenX = (pRect.left - rect.left) + pRect.width / 2;
        const pinScreenY = (pRect.top - rect.top) + pRect.height / 2;

        // Convert to world coordinates
        const pX = (pinScreenX - panX) / zoom;
        const pY = (pinScreenY - panY) / zoom;

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
    if (getWiringStatus().isWiring) cancelWiring();
});

// --- Hover Probe System ---
let hoverProbeEl = null;
let hoverProbeValueEl = null;
let currentHoverConnection = null;

// Create the hover probe element once
function initHoverProbe() {
    hoverProbeEl = document.createElement('div');
    hoverProbeEl.className = 'signal-probe hover-probe hidden';
    hoverProbeEl.id = 'hover-probe';

    hoverProbeValueEl = document.createElement('span');
    hoverProbeValueEl.className = 'probe-value';
    hoverProbeValueEl.innerText = '?';
    hoverProbeEl.appendChild(hoverProbeValueEl);

    document.body.appendChild(hoverProbeEl);
}

function showHoverProbe(connection, clientX, clientY) {
    if (!hoverProbeEl) initHoverProbe();

    currentHoverConnection = connection;

    // Get current value from the connection's source node output
    const sourceNodeData = nodes.find(n => n.id === connection.sourceNode);
    if (!sourceNodeData) return;

    // Get value from the wire - we need to check current state
    // Read the output pin state from the DOM or recalculate
    const sourceEl = document.getElementById(connection.sourceNode);
    let val = undefined;

    // For switches, check the toggle state
    if (sourceNodeData.type === 'Switch') {
        const toggleEl = sourceEl?.querySelector('.toggle-switch');
        val = toggleEl?.classList.contains('on') || false;
    } else if (sourceNodeData.type === 'Lever') {
        val = sourceNodeData.config?.value || 0;
    } else {
        // For computed values, we need to re-run simulation or cache state
        // Run a quick simulation pass to get current value
        val = getConnectionValue(connection, nodes);
    }

    // Format display
    let displayText = '?';
    let probeClass = 'signal-probe hover-probe';

    if (val === undefined || val === null) {
        displayText = '?';
    } else if (typeof val === 'boolean') {
        displayText = val ? 'ON' : 'OFF';
        probeClass += val ? ' bool-on' : ' bool-off';
    } else if (typeof val === 'number') {
        displayText = Number.isInteger(val) ? val.toString() : val.toFixed(2);
        probeClass += val !== 0 ? ' num-active' : ' num-zero';
    }

    hoverProbeValueEl.innerText = displayText;
    hoverProbeEl.className = probeClass;

    // Position near cursor
    hoverProbeEl.style.left = `${clientX}px`;
    hoverProbeEl.style.top = `${clientY - 30}px`;
    hoverProbeEl.classList.remove('hidden');
    
}

function hideHoverProbe() {
    if (hoverProbeEl) {
        hoverProbeEl.classList.add('hidden');
    }
    currentHoverConnection = null;
}

function updateHoverProbePosition(clientX, clientY) {
    if (hoverProbeEl && !hoverProbeEl.classList.contains('hidden')) {
        hoverProbeEl.style.left = `${clientX}px`;
        hoverProbeEl.style.top = `${clientY - 30}px`;
    }
}



const newBtn = document.getElementById('new-btn');
if (newBtn) {
    newBtn.addEventListener('click', () => {
        if (nodes.length === 0 && connections.length === 0) {
            // Board is already empty, no need to confirm
            return;
        }
        if (confirm('Are you sure you want to clear the board and start a new circuit?\n\nAll unsaved changes will be lost.')) {
            // Clear all nodes
            nodes.forEach(n => n.el.remove());
            nodes = [];
            // Clear all connections
            connections.forEach(c => c.pathEl.remove());
            connections = [];
            // Reset state
            nextNodeId = 1;
            history = [];
            historyStep = -1;
            clearSelection();
            closeSidebar();
            updateSimulation(nodes, connections);
            saveState();
        }
    });
}

updateSimulation(nodes, connections);
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

    updateSimulation(nodes, connections);
}

// Initialize Tutorial with callbacks
initTutorial(() => nodes, assignSlot, () => activeConfigNodeId);

/* --- Wiring Init --- */
initWiring({
    getNodes: () => nodes,
    getConnections: () => connections,
    setConnections: (newConns) => { connections = newConns; },
    getViewState: () => ({ panX, panY, zoom }),
    updateSimulation: updateSimulation,
    saveState: saveState,
    svgLayer: svgLayer,
    world: world,
    getDeleteMode: () => isDeleteMode,
    showHoverProbe: showHoverProbe,
    hideHoverProbe: hideHoverProbe,
    updateHoverProbePosition: updateHoverProbePosition,
    setSidebarTitle: (title) => { sidebarTitle.innerText = title; }
});

/* --- Minimap Logic --- */
initMinimap({
    getNodes: () => nodes,
    getViewState: () => ({ panX, panY, zoom }),
    setViewState: (state) => {
        if (state.panX !== undefined) panX = state.panX;
        if (state.panY !== undefined) panY = state.panY;
    },
    getWorkspace: () => workspace,
    updateTransform: updateWorldTransform
});