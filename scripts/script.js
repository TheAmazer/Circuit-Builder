// script.js
import { componentDefinitions, gateSVGs, ioSVGs, pinDescriptions, configurableTypes } from './gateDefinitions.js';
import { updateSimulation, getConnectionValue, snapCoordinate } from './simulation.js';
import { initTutorial, checkTutorialTaskCompletion } from './tutorial.js';
import { initMinimap, drawMinimap } from './minimap.js';
import { initWiring, startWiring, updateGhostLine, finishWiring, cancelWiring, createConnection, updateConnections, getWiringStatus } from './wiring.js';
import { initLandingAnimation } from './landing_animation.js';
import { loginWithGoogle, loginWithEmail, logout, onAuthStateChange, getSession, signUp, getAccountProfile } from './auth.js';
import { saveCircuit, loadCircuits, deleteCircuit } from './storage.js';

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
let dragStartX = 0;
let dragStartY = 0;
let dragStartPositions = new Map();
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

// Input State for Continuous Control
const activeKeys = new Set();

// Snap to Grid State
let snapToGrid = false;

// --- Continuous Input Loop ---
function updateContinuousInputs() {
    let changed = false;
    nodes.forEach(node => {
        if (node.type === 'Lever' && node.config.controlMode === 'curve') {
            // Apply a modifier to make the default sensitivity (1) usable in continuous mode
            // 0.05 multiplier means at 60FPS, sensitivity 1 changes value by ~3.0 per second
            const sensitivity = (node.config.sensitivity !== undefined ? node.config.sensitivity : 1) * 0.05;
            const upKey = node.config.hotkeyUp;
            const downKey = node.config.hotkeyDown;
            
            let valChange = 0;
            if (upKey && activeKeys.has(upKey.toLowerCase())) valChange += sensitivity;
            if (downKey && activeKeys.has(downKey.toLowerCase())) valChange -= sensitivity;

            if (valChange !== 0) {
                let newVal = (node.config.value || 0) + valChange;
                
                // Clamp Value
                if (node.config.min !== undefined && newVal < node.config.min) newVal = node.config.min;
                if (node.config.max !== undefined && newVal > node.config.max) newVal = node.config.max;
                
                node.config.value = newVal;
                changed = true;
                
                // Update Sidebar if open
                if (activeConfigNodeId === node.id) {
                    const valInput = sidebarContent.querySelector('input[type="number"]'); // Assuming Value is first
                    if (valInput) valInput.value = node.config.value.toFixed(3);
                }
            }
        }
    });

    if (changed) {
        updateSimulation(nodes, connections);
        // Note: We don't saveState() every frame to avoid history spam. 
        // Maybe save on keyup?
    }
    
    requestAnimationFrame(updateContinuousInputs);
}
requestAnimationFrame(updateContinuousInputs);

// --- Menu & Placing Logic ---
const descTitle = document.getElementById('desc-title');
const descText = document.getElementById('desc-text');
const qaSlots = document.querySelectorAll('.qa-slot:not(#qa-menu-btn)');
const qaMenuBtn = document.getElementById('qa-menu-btn');
const deleteModeBtn = document.getElementById('delete-mode-btn');
let selectedMenuItem = null;

const numericInputTypes = new Set([
    'ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'POW', 'SQRT', 'ABS', 'NEG', 'MIN', 'MAX',
    'CLAMP', 'ROUND', 'FLOOR', 'CEIL', 'Lever', 'Dial', 'Bar Graph', 'Function',
    'Equal', 'Greater Than', 'Less Than', 'Numerical Switchbox', 'Memory Register',
    'Constant', 'Delay', 'Counter', 'Timer', 'Random', 'Up/Down Counter', 'Threshold'
]);

const numericOutputTypes = new Set([
    'ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'POW', 'SQRT', 'ABS', 'NEG', 'MIN', 'MAX',
    'CLAMP', 'ROUND', 'FLOOR', 'CEIL', 'Lever', 'Function', 'Numerical Switchbox',
    'Memory Register', 'Constant', 'Delay', 'Counter', 'Timer', 'Random', 'Up/Down Counter'
]);

function getInputPinSignalType(type, index) {
    let signalType = numericInputTypes.has(type) ? 'num' : 'bool';
    if (type === 'Numerical Switchbox' && index === 2) signalType = 'bool';
    if (type === 'Memory Register' && (index === 1 || index === 2)) signalType = 'bool';
    return signalType;
}

function getOutputPinSignalType(type) {
    return numericOutputTypes.has(type) ? 'num' : 'bool';
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildPinRows(type, labels = [], direction = 'input') {
    if (!labels.length) return '<div class="desc-io-empty">None</div>';
    return labels.map((label, index) => {
        const signal = direction === 'input'
            ? getInputPinSignalType(type, index)
            : getOutputPinSignalType(type);
        const badgeText = signal === 'num' ? 'number' : 'on/off';
        return `<div class="desc-io-row"><span class="desc-chip ${signal}">${badgeText}</span><span class="desc-pin-label">${escapeHtml(label)}</span></div>`;
    }).join('');
}

function buildDescriptionHtml(type, def) {
    const pinInfo = pinDescriptions[type] || { inputs: [], outputs: [] };
    const inputsHtml = buildPinRows(type, pinInfo.inputs, 'input');
    const outputsHtml = buildPinRows(type, pinInfo.outputs, 'output');
    return `
        <div class="desc-overview">${def.desc}</div>
        <div class="desc-io-section">
            <div class="desc-io-heading">logic inputs</div>
            ${inputsHtml}
        </div>
        <div class="desc-io-section">
            <div class="desc-io-heading">logic outputs</div>
            ${outputsHtml}
        </div>
    `;
}

document.addEventListener('keydown', (e) => {
    // Ignore hotkeys if typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Tab') { e.preventDefault(); toggleMenu(); } // Allow Tab to toggle menu even from input
        if (e.key === 'Escape') { e.target.blur(); } // Blur input on Escape
        return;
    }
    
    // Track keys for continuous input
    activeKeys.add(e.key.toLowerCase());

    // Hotkey Handling for Components
    nodes.forEach(node => {
        if (node.type === 'Switch' && node.config.hotkey && node.config.hotkey.toLowerCase() === e.key.toLowerCase()) {
            const switchEl = node.el.querySelector('.toggle-switch');
            if (switchEl) {
                switchEl.classList.toggle('on');
                updateSimulation(nodes, connections);
                saveState();
            }
        } else if (node.type === 'Lever' && (!node.config.controlMode || node.config.controlMode === 'direct')) {
            // Direct Mode (Step on Keydown)
            const sensitivity = node.config.sensitivity !== undefined ? node.config.sensitivity : 1;
            let changed = false;
            
            if (node.config.hotkeyUp && node.config.hotkeyUp.toLowerCase() === e.key.toLowerCase()) {
                node.config.value = (node.config.value || 0) + sensitivity;
                changed = true;
            }
            if (node.config.hotkeyDown && node.config.hotkeyDown.toLowerCase() === e.key.toLowerCase()) {
                node.config.value = (node.config.value || 0) - sensitivity;
                changed = true;
            }

            if (changed) {
                // Clamp Value
                if (node.config.min !== undefined && node.config.value < node.config.min) node.config.value = node.config.min;
                if (node.config.max !== undefined && node.config.value > node.config.max) node.config.value = node.config.max;

                updateSimulation(nodes, connections);
                if (activeConfigNodeId === node.id) {
                     const inputs = sidebarContent.querySelectorAll('input[type="number"]');
                     if (inputs[0]) inputs[0].value = node.config.value.toFixed(3);
                }
                saveState();
            }
        }
    });

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

document.addEventListener('keyup', (e) => {
    if (activeKeys.has(e.key.toLowerCase())) {
        activeKeys.delete(e.key.toLowerCase());
        
        // If we were influencing a continuous control, save state now that interaction stopped
        const relevantNode = nodes.find(n => 
            n.type === 'Lever' && 
            n.config.controlMode === 'curve' && 
            ((n.config.hotkeyUp && n.config.hotkeyUp.toLowerCase() === e.key.toLowerCase()) || 
             (n.config.hotkeyDown && n.config.hotkeyDown.toLowerCase() === e.key.toLowerCase()))
        );
        if (relevantNode) saveState();
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
const homeBtn = document.getElementById('home-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const zoomSensitivitySlider = document.getElementById('zoom-sensitivity');
const zoomSensitivityValue = document.getElementById('zoom-sensitivity-value');
const panSensitivitySlider = document.getElementById('pan-sensitivity');
const panSensitivityValue = document.getElementById('pan-sensitivity-value');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const snapGridToggle = document.getElementById('snap-grid-toggle');

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

if (snapGridToggle) {
    snapGridToggle.addEventListener('click', (e) => {
        snapGridToggle.classList.toggle('on');
        snapToGrid = snapGridToggle.classList.contains('on');
        snapGridToggle.nextElementSibling.innerText = snapToGrid ? "On" : "Off";
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
    if (e.key === 'Escape') {
        if (settingsModal && !settingsModal.classList.contains('hidden')) settingsModal.classList.add('hidden');
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
        document.body.classList.add('menu-open');
        document.body.classList.remove('qa-drop-active');
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
            document.body.classList.remove('menu-open');
            document.body.classList.remove('qa-drop-active');
            componentMenu.removeEventListener('transitionend', onTransitionEnd);
            menuTransitioning = false;
        });
        // Safety timeout in case transitionend doesn't fire
        setTimeout(() => {
            if (menuTransitioning) {
                componentMenu.style.display = 'none';
                document.body.classList.remove('menu-open');
                document.body.classList.remove('qa-drop-active');
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
        document.body.classList.remove('qa-drop-active');
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
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('type', type);
        if (!componentMenu.classList.contains('hidden')) {
            document.body.classList.add('qa-drop-active');
        }
    });
    item.addEventListener('dragend', () => {
        document.body.classList.remove('qa-drop-active');
    });
    item.addEventListener('click', () => {
        if (selectedMenuItem) selectedMenuItem.classList.remove('selected');
        selectedMenuItem = item;
        item.classList.add('selected');
        descTitle.innerText = def.label;
        descText.innerHTML = buildDescriptionHtml(type, def);
        const largeIcon = document.querySelector('.menu-large-icon-placeholder');
        if (largeIcon) {
            largeIcon.innerHTML = gateSVGs[type] || '<svg viewBox="0 0 24 24" width="80" height="80"><path fill="currentColor" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.02-2.4 7.82-6 8.84-3.6-1.02-6-4.82-6-8.84V6.43l6-2.25z"/></svg>';
            const svg = largeIcon.querySelector('svg');
            if (svg) {
                svg.setAttribute('width', '80');
                svg.setAttribute('height', '80');
            }
        }
    });
    item.addEventListener('dblclick', () => {
        startPlacing(type);
        if (!componentMenu.classList.contains('hidden')) toggleMenu();
    });
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

function openSidebar(nodeId) {
    closeSettings();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    activeConfigNodeId = nodeId;
    sidebarTitle.innerText = `${node.type} Config`;
    sidebarContent.innerHTML = '';

    // Common Config: Label (Rename)
    const labelInput = createSidebarInput('Label', 'text', node.config.label || componentDefinitions[node.type].label, (val) => {
        node.config.label = val;
        const header = node.el.querySelector('.node-header');
        if (header) {
            const span = header.querySelector('span');
            if (span) span.innerText = val;
            adjustHeaderFontSize(header);
        }
        saveState();
    });
    labelInput.maxLength = 23;
    
    // Add note for character limit
    const note = document.createElement('small');
    note.style.color = '#95a5a6';
    note.style.fontSize = '11px';
    note.style.marginTop = '4px';
    note.style.display = 'block';
    note.innerText = 'Max 23 characters';
    labelInput.parentNode.appendChild(note);

    if (node.type === 'Switch') {
        createSidebarHotkeyInput('Hotkey', node.config.hotkey || '', (val) => {
            node.config.hotkey = val; saveState();
        });
    } else if (node.type === 'Lever') {
        createSidebarInput('Value', 'number', node.config.value || 0, (val) => {
            node.config.value = parseFloat(val);
            // Clamp if limits exist
            if (node.config.min !== undefined && node.config.value < node.config.min) node.config.value = node.config.min;
            if (node.config.max !== undefined && node.config.value > node.config.max) node.config.value = node.config.max;
            updateSimulation(nodes, connections); saveState();
        });

        createSidebarInput('Min Value', 'number', node.config.min !== undefined ? node.config.min : -Infinity, (val) => {
             const v = parseFloat(val);
             node.config.min = isNaN(v) ? -Infinity : v;
             // Re-clamp value
             if (node.config.value < node.config.min) { node.config.value = node.config.min; updateSimulation(nodes, connections); }
             saveState();
        });

        createSidebarInput('Max Value', 'number', node.config.max !== undefined ? node.config.max : Infinity, (val) => {
             const v = parseFloat(val);
             node.config.max = isNaN(v) ? Infinity : v;
             // Re-clamp value
             if (node.config.value > node.config.max) { node.config.value = node.config.max; updateSimulation(nodes, connections); }
             saveState();
        });

        // Control Mode Selection (Visual)
        const modeSelector = document.createElement('div');
        modeSelector.className = 'mode-selector';
        
        const modeLabel = document.createElement('div');
        modeLabel.className = 'mode-label';
        modeLabel.innerText = 'Mode';
        modeSelector.appendChild(modeLabel);

        const modeControls = document.createElement('div');
        modeControls.className = 'mode-controls';

        const leftBtn = document.createElement('button');
        leftBtn.className = 'mode-btn';
        leftBtn.innerHTML = '&#9664;'; // Left Arrow
        
        const modeDisplay = document.createElement('span');
        modeDisplay.className = 'mode-value';
        
        const rightBtn = document.createElement('button');
        rightBtn.className = 'mode-btn';
        rightBtn.innerHTML = '&#9654;'; // Right Arrow

        const updateModeUI = (animate = false) => {
            const currentMode = node.config.controlMode || 'direct';
            const text = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
            
            if (animate) {
                // Remove class to reset animation if needed (though replacing text usually warrants a new flow)
                modeDisplay.classList.remove('flow-in');
                void modeDisplay.offsetWidth; // Force reflow
                modeDisplay.innerText = text;
                modeDisplay.classList.add('flow-in');
            } else {
                modeDisplay.innerText = text;
            }
            
            if (currentMode === 'direct') {
                leftBtn.classList.remove('active');
                rightBtn.classList.add('active');
            } else {
                leftBtn.classList.add('active');
                rightBtn.classList.remove('active');
            }
        };

        const toggleMode = () => {
            node.config.controlMode = (node.config.controlMode === 'curve') ? 'direct' : 'curve';
            updateModeUI(true);
            saveState();
        };

        leftBtn.onclick = toggleMode;
        rightBtn.onclick = toggleMode;

        modeControls.appendChild(leftBtn);
        modeControls.appendChild(modeDisplay);
        modeControls.appendChild(rightBtn);
        modeSelector.appendChild(modeControls);
        sidebarContent.appendChild(modeSelector);
        
        updateModeUI();
        
        createSidebarHotkeyInput('Increase Hotkey', node.config.hotkeyUp || '', (val) => {
            node.config.hotkeyUp = val; saveState();
        });

        createSidebarHotkeyInput('Decrease Hotkey', node.config.hotkeyDown || '', (val) => {
            node.config.hotkeyDown = val; saveState();
        });

        createSidebarInput('Sensitivity', 'number', node.config.sensitivity || 1, (val) => {
            node.config.sensitivity = parseFloat(val); saveState();
        });
    } else if (node.type === 'Threshold') {
        createSidebarInput('Min Value', 'number', node.config.min || 0, (val) => {
            node.config.min = parseFloat(val); updateSimulation(nodes, connections); saveState();
        });
        createSidebarInput('Max Value', 'number', node.config.max !== undefined ? node.config.max : 1, (val) => {
            node.config.max = parseFloat(val); updateSimulation(nodes, connections); saveState();
        });
    } else if (node.type === 'Bar Graph') {
        createSidebarInput('Min Value', 'number', node.config.min !== undefined ? node.config.min : 0, (val) => {
            node.config.min = parseFloat(val); updateSimulation(nodes, connections); saveState();
        });
        createSidebarInput('Max Value', 'number', node.config.max !== undefined ? node.config.max : 100, (val) => {
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
    if (type === 'number') inputEl.step = 'any';
    group.appendChild(inputEl);
    sidebarContent.appendChild(group);
    return inputEl;
}

function createSidebarHotkeyInput(label, value, onChange) {
    const group = document.createElement('div');
    group.className = 'sidebar-input-group';
    const labelEl = document.createElement('label');
    labelEl.innerText = label;
    group.appendChild(labelEl);
    
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.value = value ? value.toUpperCase() : 'NONE';
    inputEl.readOnly = true;
    inputEl.style.cursor = 'pointer';
    inputEl.style.textAlign = 'center';
    inputEl.title = 'Click to assign key, Backspace to clear';

    inputEl.addEventListener('click', () => {
        inputEl.value = 'Press any key...';
        inputEl.classList.add('assigning');
        
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.key === 'Backspace' || e.key === 'Delete') {
                inputEl.value = 'NONE';
                onChange('');
            } else {
                // Ignore modifier keys alone
                if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
                
                inputEl.value = e.key.toUpperCase();
                onChange(e.key);
            }
            
            inputEl.classList.remove('assigning');
            document.removeEventListener('keydown', handler, true);
            inputEl.blur();
        };
        
        document.addEventListener('keydown', handler, true);
        
        // Remove listener if user clicks away
        const blurHandler = () => {
            if (inputEl.value === 'Press any key...') {
                inputEl.value = value ? value.toUpperCase() : 'NONE';
            }
            inputEl.classList.remove('assigning');
            document.removeEventListener('keydown', handler, true);
            inputEl.removeEventListener('blur', blurHandler);
        };
        inputEl.addEventListener('blur', blurHandler);
    });

    group.appendChild(inputEl);
    sidebarContent.appendChild(group);
    return inputEl;
}

function adjustHeaderFontSize(header) {
    const span = header.querySelector('span');
    if (!span) return;
    const text = span.innerText;
    let fontSize = 14;
    if (text.length > 15) {
        fontSize = Math.max(8, 14 * (15 / text.length));
    }
    header.style.fontSize = `${fontSize}px`;
}

function closeSidebar() {
    sidebar.classList.add('hidden');
    activeConfigNodeId = null;
    closeSettings();
}

function createNode(type, x, y, isGhost = false, providedId = null) {
    const def = componentDefinitions[type];
    const id = providedId || (isGhost ? `ghost-${Date.now()}` : `node-${nextNodeId++}`);
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
    adjustHeaderFontSize(header);

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
    const numTypes = ['ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'POW', 'SQRT', 'ABS', 'NEG', 'MIN', 'MAX', 'CLAMP', 'ROUND', 'FLOOR', 'CEIL', 'Lever', 'Dial', 'Bar Graph', 'Function', 'Equal', 'Greater Than', 'Less Than', 'Numerical Switchbox', 'Memory Register', 'Constant', 'Delay', 'Counter', 'Timer', 'Random', 'Up/Down Counter'];
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
        switchControl.innerHTML = '<div class="toggle-switch"></div><div class="hotkey-display"></div>';
        if (!isGhost) {
            switchControl.querySelector('.toggle-switch').onclick = function () {
                this.classList.toggle('on');
                updateSimulation(nodes, connections);
            };
        }
        body.appendChild(switchControl);
    } else if (type === 'Dial') {
        const dialControl = document.createElement('div');
        dialControl.className = 'node-control';
        dialControl.innerHTML = '<div class="dial-display">0.00</div>';
        body.appendChild(dialControl);
    } else if (type === 'Bar Graph') {
        const barControl = document.createElement('div');
        barControl.className = 'node-control';
        barControl.innerHTML = '<div class="bar-graph-container"><div class="bar-graph-fill"></div></div>';
        body.appendChild(barControl);
    } else if (type === 'Light') {
        const lightControl = document.createElement('div');
        lightControl.className = 'node-control';
        lightControl.innerHTML = '<div class="light-indicator"></div>';
        body.appendChild(lightControl);
    } else if (type === 'Lever') {
        const leverControl = document.createElement('div');
        leverControl.className = 'node-control';
        
        const iconDiv = document.createElement('div');
        // Use the defined SVG for Lever
        if (ioSVGs[type]) iconDiv.innerHTML = ioSVGs[type];
        leverControl.appendChild(iconDiv);
        
        const configDisplay = document.createElement('div');
        configDisplay.className = 'config-display';
        configDisplay.innerText = '...';
        leverControl.appendChild(configDisplay);

        const hotkeyDisplay = document.createElement('div');
        hotkeyDisplay.className = 'hotkey-display';
        leverControl.appendChild(hotkeyDisplay);
        
        body.appendChild(leverControl);
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
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartPositions.clear();
            selectedNodes.forEach(n => {
                dragStartPositions.set(n, {
                    x: parseFloat(n.style.left) || 0,
                    y: parseFloat(n.style.top) || 0
                });
            });
        });

        const nodeData = { id, type, el: nodeEl, memory: {}, config: {} };
        if (type === 'Lever') nodeData.config.value = 0;
        if (type === 'Bar Graph') { nodeData.config.min = 0; nodeData.config.max = 100; }
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
            let placeX = wPos.x - 70;
            let placeY = wPos.y - 30;
            
            if (snapToGrid) {
                placeX = snapCoordinate(placeX);
                placeY = snapCoordinate(placeY);
            }
            
            createNode(placingType, placeX, placeY);
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
        saveState();
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
        const deltaX = (e.clientX - dragStartX) / zoom;
        const deltaY = (e.clientY - dragStartY) / zoom;

        selectedNodes.forEach(node => {
            const startPos = dragStartPositions.get(node);
            if (!startPos) return;

            let newX = startPos.x + deltaX;
            let newY = startPos.y + deltaY;
            
            if (snapToGrid) {
                newX = snapCoordinate(newX);
                newY = snapCoordinate(newY);
            }
            
            node.style.left = `${newX}px`;
            node.style.top = `${newY}px`;

            // Sync with data model for minimap
            const nData = nodes.find(n => n.id == node.dataset.id);
            if (nData) { nData.x = newX; nData.y = newY; }
        });
        updateConnections();
        drawMinimap();
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
        saveState();
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

function loadCircuit(data) {
    nodes.forEach(n => n.el.remove());
    nodes = [];
    connections = [];
    while (svgLayer.firstChild) svgLayer.removeChild(svgLayer.firstChild);

    let maxId = 0;
    data.nodes.forEach(nData => {
        const numId = parseInt(nData.id.replace('node-', ''));
        if (!isNaN(numId) && numId >= maxId) maxId = numId;

        const nodeEl = createNode(nData.type, nData.x, nData.y, false, nData.id);
        const nodeObj = nodes[nodes.length - 1];

        if (nData.type === 'Switch' && nData.isOn) nodeEl.querySelector('.toggle-switch').classList.add('on');

        // Restore Config
        if (nData.config) {
            nodeObj.config = { ...nData.config };
            if (nodeObj.config.label) {
                const header = nodeEl.querySelector('.node-header');
                header.querySelector('span').innerText = nodeObj.config.label;
                adjustHeaderFontSize(header);
            }
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
initTutorial(() => nodes, assignSlot, () => activeConfigNodeId, () => connections);

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

// Landing Page Logic
const landingPage = document.getElementById('landing-page');
const startBtn = document.getElementById('start-btn');

let landingAnim = null;
if (landingPage && !landingPage.classList.contains('hidden')) {
    landingAnim = initLandingAnimation('landing-background', 'landing-page');
}

function enterSimulatorFromLanding() {
    if (!landingPage) return;
    const transitionOverlay = document.getElementById('transition-overlay');

    // 1. Close shutters
    if (transitionOverlay) transitionOverlay.classList.add('closed');

    setTimeout(() => {
        // 2. Hide landing page
        landingPage.classList.add('hidden');
        landingPage.style.display = 'none';
        if (landingAnim) landingAnim.stop();

        // 3. Reveal simulator
        if (transitionOverlay) transitionOverlay.classList.remove('closed');
    }, 800);
}

function returnToLandingFromSimulator() {
    if (!landingPage) return;
    const transitionOverlay = document.getElementById('transition-overlay');

    // 1. Close shutters
    if (transitionOverlay) transitionOverlay.classList.add('closed');

    setTimeout(() => {
        // 2. Close simulator overlays/state
        cancelPlacing();
        closeSidebar();
        closeSettings();
        if (isDeleteMode) toggleDeleteMode();

        if (componentMenu) {
            componentMenu.classList.add('hidden');
            componentMenu.style.display = 'none';
            document.body.classList.remove('menu-open');
            document.body.classList.remove('qa-drop-active');
            menuTransitioning = false;
        }

        if (microMenuModal) microMenuModal.classList.add('hidden');
        if (saveCircuitModal) saveCircuitModal.classList.add('hidden');

        // 3. Show landing page
        landingPage.style.display = 'flex';
        requestAnimationFrame(() => {
            landingPage.classList.remove('hidden');
        });

        // 4. Restart landing animation
        if (landingAnim) landingAnim.stop();
        landingAnim = initLandingAnimation('landing-background', 'landing-page');

        // 5. Reveal landing page
        if (transitionOverlay) transitionOverlay.classList.remove('closed');
    }, 800);
}

if (startBtn && landingPage) {
    let btnAnchorX = 0;
    let btnAnchorY = 0;

    const updateAnchor = () => {
        // Temporarily reset transform to get true layout position
        const prevTransform = startBtn.style.transform;
        startBtn.style.transform = 'none';
        const rect = startBtn.getBoundingClientRect();
        btnAnchorX = rect.left + rect.width / 2;
        btnAnchorY = rect.top + rect.height / 2;
        startBtn.style.transform = prevTransform;
    };

    // Update anchor on load and resize
    window.addEventListener('resize', updateAnchor);
    // Initial calculation after a brief delay to ensure layout is stable
    setTimeout(updateAnchor, 100);

    // Magnetic Button Effect (Long Range)
    landingPage.addEventListener('mousemove', (e) => {
        // If anchor hasn't been set yet (e.g. immediate mousemove), try to set it
        if (btnAnchorX === 0 && btnAnchorY === 0) updateAnchor();

        const deltaX = e.clientX - btnAnchorX;
        const deltaY = e.clientY - btnAnchorY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const interactionRadius = 500; // Increased range

        if (distance < interactionRadius) {
            // Calculate pull strength (0 to 1)
            // Cubic falloff for very smooth 'long distance' feel
            const normalizedDist = 1 - (distance / interactionRadius);
            const pull = Math.pow(normalizedDist, 3); 

            // Maximum movement in pixels
            const maxMove = 60; 
            
            const moveX = deltaX * pull * 0.5; 
            const moveY = deltaY * pull * 0.5;
            
            // Scale effect based on proximity
            const scale = 1 + (pull * 0.1); // Max scale 1.1x

            startBtn.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
            startBtn.style.boxShadow = `${-moveX * 0.6}px ${-moveY * 0.6}px 30px rgba(52, 152, 219, ${0.3 + pull * 0.5})`;
        } else {
            // Reset if out of range
            startBtn.style.transform = 'translate(0, 0) scale(1)';
            startBtn.style.boxShadow = '0 10px 30px rgba(52, 152, 219, 0.4)';
        }
    });

    // Reset when mouse leaves the window/page
    landingPage.addEventListener('mouseleave', () => {
        startBtn.style.transform = 'translate(0, 0) scale(1)';
        startBtn.style.boxShadow = '0 10px 30px rgba(52, 152, 219, 0.4)';
    });

    startBtn.addEventListener('click', enterSimulatorFromLanding);
}

if (homeBtn) {
    homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        returnToLandingFromSimulator();
    });
}

// Features Modal Logic
const featuresModal = document.getElementById('features-modal');
const featuresClose = document.getElementById('features-close');
const featuresLink = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.trim() === 'Features');

if (featuresLink && featuresModal) {
    featuresLink.addEventListener('click', (e) => {
        e.preventDefault();
        featuresModal.classList.remove('hidden');
        // Play videos
        const videos = featuresModal.querySelectorAll('video');
        videos.forEach(v => v.play().catch(() => {}));
    });

    const closeFeatures = () => {
        featuresModal.classList.add('hidden');
        // Pause videos
        const videos = featuresModal.querySelectorAll('video');
        videos.forEach(v => v.pause());
    };

    if (featuresClose) featuresClose.addEventListener('click', closeFeatures);
    
    // Close on click outside
    featuresModal.addEventListener('click', (e) => {
        if (e.target === featuresModal) closeFeatures();
    });
    
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !featuresModal.classList.contains('hidden')) {
            closeFeatures();
        }
    });
}

// Landing Page Nav Links (Placeholders) - Updated to ignore Features as it's handled above
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        if (item.textContent.trim() === 'Features') return; // Handled separately
        e.preventDefault();
        // Future: Handle navigation to specific sections or pages
        console.log(`Clicked ${item.innerText}`);
    });
});

// Logo Interaction (Nav Bar)
const logoNode = document.querySelector('.nav-logo .logo-node');
if (logoNode) {
    logoNode.addEventListener('mouseenter', () => {
        triggerNodeAnimation(logoNode);
    });
}

// Landing Title Interaction (Whole Title Hover)
const landingTitle = document.querySelector('.landing-title');
if (landingTitle) {
    landingTitle.addEventListener('mouseenter', () => {
        // Rumble the Whole Title
        landingTitle.classList.remove('rumble');
        void landingTitle.offsetWidth; 
        landingTitle.classList.add('rumble');

        // Trigger Node Animation
        const nodeSpan = landingTitle.querySelector('.logo-node');
        if (nodeSpan) triggerNodeAnimation(nodeSpan);

        // Trigger Craft Animation (Individual Rumble)
        const craftSpan = landingTitle.querySelector('.craft-logo');
        if (craftSpan) {
            craftSpan.classList.remove('rumble');
            void craftSpan.offsetWidth; 
            craftSpan.classList.add('rumble');
        }
    });
}

// --- Supabase Integration ---
const googleLoginBtn = document.getElementById('google-login-btn');
const emailLoginBtn = document.getElementById('email-login-btn');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const logoutBtn = document.getElementById('logout-btn');
const accountSettingsBtn = document.getElementById('account-settings-btn');
const authLoggedOut = document.getElementById('auth-logged-out');
const authLoggedIn = document.getElementById('auth-logged-in');
const navAccountText = document.getElementById('nav-account-text');
const navAvatar = document.getElementById('nav-avatar');
const userAvatar = document.getElementById('user-avatar');
const userEmail = document.getElementById('user-email');
const microMenuBtn = document.getElementById('micro-menu-btn');
const microMenuModal = document.getElementById('micro-menu-modal');
const microMenuClose = document.getElementById('micro-menu-close');
const microCircuitsGrid = document.getElementById('micro-circuits-grid');
const microSearchInput = document.getElementById('micro-search-input');
const microSaveCurrentBtn = document.getElementById('micro-save-current-btn');
const microTabs = document.querySelectorAll('.micro-tab');

const microDetailsPanel = document.getElementById('micro-details-panel');
const microDetailsTitle = document.getElementById('micro-details-title');
const microDetailsDesc = document.getElementById('micro-details-desc');
const microDetailsDate = document.getElementById('micro-details-date');
const microLoadBtn = document.getElementById('micro-load-btn');
const microDetailsClose = document.getElementById('micro-details-close');
const microMenuBody = document.querySelector('#micro-menu-modal .micro-menu-body');
const microMenuLockOverlay = document.getElementById('micro-menu-lock-overlay');

// Save Circuit Modal Elements
const saveCircuitModal = document.getElementById('save-circuit-modal');
const saveCircuitClose = document.getElementById('save-circuit-close');
const saveCircuitName = document.getElementById('save-circuit-name');
const saveCircuitDesc = document.getElementById('save-circuit-desc');
const saveCircuitCancel = document.getElementById('save-circuit-cancel');
const saveCircuitSubmit = document.getElementById('save-circuit-submit');
const paintCanvas = document.getElementById('paint-canvas');
const paintColor = document.getElementById('paint-color');
const paintSize = document.getElementById('paint-size');
const paintClear = document.getElementById('paint-clear');

let selectedCircuit = null;
let allCloudCircuits = [];

function setMicroMenuLocked(isLocked) {
    if (microMenuBody) {
        microMenuBody.classList.toggle('locked', isLocked);
    }
    if (microMenuLockOverlay) {
        microMenuLockOverlay.classList.toggle('hidden', !isLocked);
    }
}

function setAuthDropdownMode(isLoggedIn) {
    if (authLoggedOut) {
        authLoggedOut.classList.toggle('hidden', isLoggedIn);
        authLoggedOut.style.display = isLoggedIn ? 'none' : 'flex';
    }
    if (authLoggedIn) {
        authLoggedIn.classList.toggle('hidden', !isLoggedIn);
        authLoggedIn.style.display = isLoggedIn ? 'block' : 'none';
    }
}

if (googleLoginBtn) googleLoginBtn.onclick = loginWithGoogle;
if (logoutBtn) logoutBtn.onclick = logout;
if (accountSettingsBtn) {
    accountSettingsBtn.onclick = (e) => {
        e.preventDefault();
        if (authLoggedIn && authLoggedIn.classList.contains('hidden')) return;
        window.location.href = 'account.html';
    };
}

if (emailLoginBtn) {
    emailLoginBtn.onclick = async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }
        await loginWithEmail(email, password);
    };
}

onAuthStateChange(async (event, session) => {
    if (session) {
        setAuthDropdownMode(true);
        
        // Use default avatar if no avatar_url is present
        const avatarUrl = session.user.user_metadata?.avatar_url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fff"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

        if (navAvatar) {
            navAvatar.src = avatarUrl;
            navAvatar.classList.remove('hidden');
        }
        if (userAvatar) {
            userAvatar.src = avatarUrl;
            userAvatar.classList.remove('hidden');
        }

        // Show username if available, else email
        const profile = await getAccountProfile();
        const displayName = profile?.username || session.user.user_metadata?.username || session.user.email;
        userEmail.innerText = displayName;
        if (navAccountText) navAccountText.innerText = displayName || 'Account';

        if (microMenuBtn) microMenuBtn.classList.remove('hidden');
        setMicroMenuLocked(false);
        } else {
        setAuthDropdownMode(false);
        if (navAvatar) navAvatar.classList.add('hidden');
        if (userAvatar) userAvatar.classList.add('hidden');
        if (navAccountText) navAccountText.innerText = 'Account';
        if (microMenuBtn) microMenuBtn.classList.remove('hidden');
        setMicroMenuLocked(true);
    }
});

if (microMenuBtn) {
    microMenuBtn.onclick = async () => {
        const session = await getSession();
        microMenuModal.classList.remove('hidden');
        if (microDetailsPanel) microDetailsPanel.classList.add('hidden');
        selectedCircuit = null;
        if (session) {
            setMicroMenuLocked(false);
            await refreshMicroGrid();
        } else {
            setMicroMenuLocked(true);
            if (microCircuitsGrid) {
                microCircuitsGrid.innerHTML = '<div class="loading-spinner">Sign in to view your cloud microcontrollers.</div>';
            }
        }
    };
}

if (microMenuClose) {
    microMenuClose.onclick = () => {
        microMenuModal.classList.add('hidden');
        if (microDetailsPanel) microDetailsPanel.classList.add('hidden');
        selectedCircuit = null;
    };
}

if (microDetailsClose) {
    microDetailsClose.onclick = () => {
        if (microDetailsPanel) microDetailsPanel.classList.add('hidden');
        document.querySelectorAll('.micro-item').forEach(i => i.classList.remove('selected'));
        selectedCircuit = null;
    };
}

if (microLoadBtn) {
    microLoadBtn.onclick = () => {
        if (selectedCircuit) {
            if (confirm(`Load "${selectedCircuit.name}"? Current progress will be lost.`)) {
                loadCircuit(selectedCircuit.data);
                microMenuModal.classList.add('hidden');
                if (microDetailsPanel) microDetailsPanel.classList.add('hidden');
                selectedCircuit = null;
            }
        }
    };
}

// --- Paint Canvas Logic ---
const paintCtx = paintCanvas ? paintCanvas.getContext('2d') : null;
let isPainting = false;

function initPaintCanvas() {
    if (!paintCtx) return;
    paintCtx.fillStyle = "#0a0a0a";
    paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
}

if (paintCanvas) {
    initPaintCanvas();

    function getMousePos(e) {
        const rect = paintCanvas.getBoundingClientRect();
        // Calculate scale factors in case CSS width/height differ from attribute width/height
        const scaleX = paintCanvas.width / rect.width;
        const scaleY = paintCanvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function draw(e) {
        if (!isPainting || !paintCtx) return;
        const pos = getMousePos(e);
        paintCtx.lineWidth = paintSize ? paintSize.value : 3;
        paintCtx.lineCap = 'round';
        paintCtx.strokeStyle = paintColor ? paintColor.value : '#3498db';

        paintCtx.lineTo(pos.x, pos.y);
        paintCtx.stroke();
        paintCtx.beginPath();
        paintCtx.moveTo(pos.x, pos.y);
    }

    paintCanvas.addEventListener('mousedown', (e) => {
        isPainting = true;
        const pos = getMousePos(e);
        paintCtx.beginPath();
        paintCtx.moveTo(pos.x, pos.y);
        draw(e);
    });
    
    paintCanvas.addEventListener('mousemove', draw);
    
    paintCanvas.addEventListener('mouseup', () => {
        isPainting = false;
        paintCtx.beginPath();
    });
    
    paintCanvas.addEventListener('mouseleave', () => {
        isPainting = false;
        paintCtx.beginPath();
    });
}

if (paintClear) {
    paintClear.onclick = initPaintCanvas;
}

// --- Save Modal Logic ---
function closeSaveModal() {
    saveCircuitModal.classList.add('hidden');
    if (saveCircuitName) saveCircuitName.value = '';
    if (saveCircuitDesc) saveCircuitDesc.value = '';
    initPaintCanvas();
}

if (saveCircuitClose) saveCircuitClose.onclick = closeSaveModal;
if (saveCircuitCancel) saveCircuitCancel.onclick = closeSaveModal;

if (microSaveCurrentBtn) {
    microSaveCurrentBtn.onclick = async () => {
        const session = await getSession();
        if (!session) {
            alert('Please login to save your circuits.');
            return;
        }
        if (saveCircuitName) saveCircuitName.value = 'My Circuit';
        saveCircuitModal.classList.remove('hidden');
    };
}

if (saveCircuitSubmit) {
    saveCircuitSubmit.onclick = async () => {
        const name = saveCircuitName ? saveCircuitName.value.trim() : 'My Circuit';
        if (!name) {
            alert("Please enter a name.");
            return;
        }

        const description = saveCircuitDesc ? saveCircuitDesc.value.trim() : '';
        const thumbnail = paintCanvas ? paintCanvas.toDataURL('image/png') : null;

        const data = {
            nodes: nodes.map(n => ({
                id: n.id, type: n.type, x: parseFloat(n.el.style.left), y: parseFloat(n.el.style.top),
                isOn: n.type === 'Switch' ? n.el.querySelector('.toggle-switch').classList.contains('on') : undefined,
                config: n.config
            })),
            connections: connections.map(c => ({
                sourceNode: c.sourceNode, sourceIndex: c.sourceIndex, destNode: c.destNode, destIndex: c.destIndex
            })),
            description: description,
            thumbnail: thumbnail
        };

        const originalText = saveCircuitSubmit.innerText;
        saveCircuitSubmit.innerText = "Saving...";
        saveCircuitSubmit.disabled = true;

        const result = await saveCircuit(name, data);
        
        saveCircuitSubmit.innerText = originalText;
        saveCircuitSubmit.disabled = false;

        if (result) {
            closeSaveModal();
            // Automatically switch back to the grid and refresh
            microMenuModal.classList.remove('hidden');
            await refreshMicroGrid();
        }
    };
}

if (microSearchInput) {
    microSearchInput.addEventListener('input', () => {
        if (microDetailsPanel) microDetailsPanel.classList.add('hidden');
        selectedCircuit = null;
        renderMicroGrid(allCloudCircuits.filter(c =>
            c.name.toLowerCase().includes(microSearchInput.value.toLowerCase())
        ));
    });
}
microTabs.forEach(tab => {
    tab.onclick = () => {
        microTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Filter logic for workshop/backups could go here
    };
});

async function refreshMicroGrid() {
    if (!microCircuitsGrid) return;
    microCircuitsGrid.innerHTML = '<div class="loading-spinner">Loading...</div>';
    allCloudCircuits = await loadCircuits();
    renderMicroGrid(allCloudCircuits);
}

function renderMicroGrid(circuits) {
    if (!microCircuitsGrid) return;
    
    if (circuits.length === 0) {
        microCircuitsGrid.innerHTML = '<div class="loading-spinner">No microcontrollers found.</div>';
        return;
    }

    microCircuitsGrid.innerHTML = '';
    circuits.forEach(circuit => {
        const item = document.createElement('div');
        item.className = 'micro-item';
        
        const icon = document.createElement('div');
        icon.className = 'micro-item-icon';
        if (circuit.data && circuit.data.thumbnail) {
            icon.innerHTML = `<img src="${circuit.data.thumbnail}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:1;">`;
        }
        item.appendChild(icon);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'micro-delete-btn';
        deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${circuit.name}"?`)) {
                const success = await deleteCircuit(circuit.id);
                if (success) await refreshMicroGrid();
            }
        };
        item.appendChild(deleteBtn);

        const name = document.createElement('div');
        name.className = 'micro-item-name';
        name.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 8px;"><path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg> ${circuit.name}`;
        item.appendChild(name);

        const date = document.createElement('div');
        date.className = 'micro-item-date';
        const dateObj = new Date(circuit.created_at);
        date.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 8px;"><path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg> ${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        item.appendChild(date);

        item.onclick = () => {
            document.querySelectorAll('.micro-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedCircuit = circuit;
            
            if (microDetailsTitle) microDetailsTitle.textContent = circuit.name;
            if (microDetailsDesc) microDetailsDesc.textContent = (circuit.data && circuit.data.description) ? circuit.data.description : "No description available.";
            if (microDetailsDate) microDetailsDate.textContent = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            const detailsImage = document.querySelector('.micro-details-image');
            if (detailsImage) {
                if (circuit.data && circuit.data.thumbnail) {
                    detailsImage.innerHTML = `<img src="${circuit.data.thumbnail}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:1;">`;
                } else {
                    detailsImage.innerHTML = `<svg viewBox="0 0 24 24" width="48" height="48" style="color:#556675"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`;
                }
            }
            
            if (microDetailsPanel) microDetailsPanel.classList.remove('hidden');
        };

        microCircuitsGrid.appendChild(item);
    });
}

function triggerNodeAnimation(element) {
    // Trigger Jump
    element.classList.remove('jump');
    void element.offsetWidth; // Force reflow
    element.classList.add('jump');

    // Spawn Particles
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = `logo-particle ${Math.random() > 0.5 ? 'red' : 'green'}`;
        document.body.appendChild(particle);

        const startX = centerX;
        const startY = centerY;
        
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        const angle = Math.random() * Math.PI * 2;
        const velocity = 40 + Math.random() * 40;
        
        const tx = Math.cos(angle) * velocity + 'px';
        const ty = Math.sin(angle) * velocity + 'px';
        
        const rotation = (angle * 180 / Math.PI) + 90 + 'deg';
        
        particle.style.setProperty('--tx', tx);
        particle.style.setProperty('--ty', ty);
        particle.style.setProperty('--rot', rotation);
        
        particle.style.animation = `particleFloat 0.6s ease-out forwards`;

        setTimeout(() => particle.remove(), 600);
    }
}

// --- Registration Logic ---
const registerBtn = document.getElementById('register-btn');
const registerModal = document.getElementById('register-modal');
const registerClose = document.getElementById('register-close');
const submitRegister = document.getElementById('submit-register');
const regUsername = document.getElementById('reg-username');
const regEmail = document.getElementById('reg-email');
const regPassword = document.getElementById('reg-password');
const regConfirmPassword = document.getElementById('reg-confirm-password');
const usernameError = document.getElementById('username-error');
const passwordMatchError = document.getElementById('password-match-error');
const loginFromRegister = document.getElementById('login-from-register');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');

if (forgotPasswordBtn) {
    forgotPasswordBtn.onclick = (e) => {
        e.preventDefault();
        alert('Password reset functionality will be implemented soon.');
    };
}

if (registerBtn) {
    registerBtn.onclick = (e) => {
        e.preventDefault();
        registerModal.classList.remove('hidden');
    };
}

if (registerClose) {
    registerClose.onclick = () => registerModal.classList.add('hidden');
}

if (loginFromRegister) {
    loginFromRegister.onclick = (e) => {
        e.preventDefault();
        registerModal.classList.add('hidden');
        const dropdown = document.querySelector('.account-dropdown');
        if (dropdown) {
            dropdown.classList.add('force-show');
            setTimeout(() => {
                dropdown.classList.remove('force-show');
            }, 3000); // Remove force show after 3 seconds so normal hover works
            const emailInput = document.getElementById('login-email');
            if (emailInput) emailInput.focus();
        }
    };
}

function validateRegistrationForm() {
    if (!submitRegister) return;
    
    const val = regUsername ? regUsername.value : '';
    const isValidUsername = /^[a-zA-Z0-9]*$/.test(val);
    
    const pass = regPassword ? regPassword.value : '';
    const confirmPass = regConfirmPassword ? regConfirmPassword.value : '';
    const passwordsMatch = pass === confirmPass || confirmPass === '';

    if (!isValidUsername) {
        if (usernameError) usernameError.style.display = 'block';
    } else {
        if (usernameError) usernameError.style.display = 'none';
    }
    
    if (!passwordsMatch && confirmPass !== '') {
        if (passwordMatchError) passwordMatchError.style.display = 'block';
    } else {
        if (passwordMatchError) passwordMatchError.style.display = 'none';
    }

    if (!isValidUsername || (!passwordsMatch && confirmPass !== '')) {
        submitRegister.disabled = true;
        submitRegister.style.opacity = '0.5';
    } else {
        submitRegister.disabled = false;
        submitRegister.style.opacity = '1';
    }
}

if (regUsername) {
    regUsername.oninput = validateRegistrationForm;
}

if (regPassword) {
    regPassword.oninput = validateRegistrationForm;
}

if (regConfirmPassword) {
    regConfirmPassword.oninput = validateRegistrationForm;
}

if (submitRegister) {
    submitRegister.onclick = async () => {
        const username = regUsername.value;
        const email = regEmail.value;
        const password = regPassword.value;
        const confirmPassword = regConfirmPassword.value;

        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields.');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        const data = await signUp(email, password, username);
        if (data) {
            alert('Registration successful! Please check your email for verification.');
            registerModal.classList.add('hidden');
        }
    };
}
