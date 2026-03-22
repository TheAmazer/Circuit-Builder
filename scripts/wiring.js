// wiring.js

let config = {};
let isWiring = false;
let activePin = null;
let ghostLine = null;

export function initWiring(c) {
    config = c;
}

export function getWiringStatus() {
    return { isWiring, activePin };
}

export function startWiring(pin) {
    isWiring = true;
    activePin = pin;
    ghostLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    ghostLine.classList.add('wire-ghost');
    ghostLine.style.stroke = 'red';
    ghostLine.style.strokeWidth = '4px';
    ghostLine.style.fill = 'none';
    ghostLine.style.pointerEvents = 'none';
    config.svgLayer.appendChild(ghostLine);
}

export function updateGhostLine(x1, y1, x2, y2) {
    if (!ghostLine) return;
    const dist = Math.abs(x2 - x1) * 0.5;
    ghostLine.setAttribute('d', `M ${x1} ${y1} C ${x1 + dist + 20} ${y1}, ${x2 - dist - 20} ${y2}, ${x2} ${y2}`);
}

export function finishWiring(targetPin) {
    if (!isWiring || !activePin) return;
    if (activePin === targetPin || activePin.dataset.node === targetPin.dataset.node || activePin.dataset.type === targetPin.dataset.type) return;

    // Strict Type Checking
    const activeType = activePin.classList.contains('num') ? 'num' : 'bool';
    const targetType = targetPin.classList.contains('num') ? 'num' : 'bool';
    if (activeType !== targetType) return;

    let sourcePin = activePin.dataset.type === 'output' ? activePin : targetPin;
    let destPin = activePin.dataset.type === 'input' ? activePin : targetPin;

    const connections = config.getConnections();
    
    // Check existing
    const existingConnIndex = connections.findIndex(c =>
        c.sourceNode === sourcePin.dataset.node && c.sourceIndex === sourcePin.dataset.index &&
        c.destNode === destPin.dataset.node && c.destIndex === destPin.dataset.index
    );

    if (existingConnIndex !== -1) {
        connections[existingConnIndex].pathEl.remove();
        connections.splice(existingConnIndex, 1);
        config.setConnections(connections); // Notify update (even if splice is in-place, good practice)
    } else {
        // Disconnect existing inputs (one wire per input)
        const otherConnIndex = connections.findIndex(c =>
            c.destNode === destPin.dataset.node && c.destIndex === destPin.dataset.index
        );
        if (otherConnIndex !== -1) {
            connections[otherConnIndex].pathEl.remove();
            connections.splice(otherConnIndex, 1);
            config.setConnections(connections);
        }
        createConnection(sourcePin, destPin);
    }
    
    cancelWiring();
    config.updateSimulation(config.getNodes(), config.getConnections());
    config.saveState();
}

export function cancelWiring() {
    isWiring = false;
    activePin = null;
    if (ghostLine) { ghostLine.remove(); ghostLine = null; }
    if (config.setSidebarTitle) config.setSidebarTitle("Configuration");
}

export function createConnection(sourcePinEl, destPinEl) {
    const connId = `conn-${Date.now()}-${Math.random()}`;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('wire');
    path.id = connId;
    path.style.pointerEvents = 'stroke';

    // Hover Interactions
    path.addEventListener('mouseenter', (e) => {
        const conn = config.getConnections().find(c => c.id === connId);
        if (conn) config.showHoverProbe(conn, e.clientX, e.clientY);
    });

    path.addEventListener('mousemove', (e) => {
        config.updateHoverProbePosition(e.clientX, e.clientY);
        const conn = config.getConnections().find(c => c.id === connId);
        if (conn) config.showHoverProbe(conn, e.clientX, e.clientY);
    });

    path.addEventListener('mouseleave', () => {
        config.hideHoverProbe();
    });

    // Delete Interactions
    path.addEventListener('click', (e) => {
        if (config.getDeleteMode()) {
            e.stopPropagation();
            let conns = config.getConnections();
            conns = conns.filter(c => c.id !== connId);
            config.setConnections(conns);
            
            path.remove();
            config.hideHoverProbe();
            config.updateSimulation(config.getNodes(), conns);
            config.saveState();
        }
    });

    path.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete connection?')) {
            let conns = config.getConnections();
            conns = conns.filter(c => c.id !== connId);
            config.setConnections(conns);
            
            path.remove();
            config.updateSimulation(config.getNodes(), conns);
            config.saveState();
        }
    });

    config.svgLayer.appendChild(path);
    
    // Push new connection
    const conns = config.getConnections();
    conns.push({
        id: connId, pathEl: path,
        sourceNode: sourcePinEl.dataset.node, sourceIndex: sourcePinEl.dataset.index,
        destNode: destPinEl.dataset.node, destIndex: destPinEl.dataset.index
    });
    config.setConnections(conns); // Likely redundant if push is in-place, but consistent
    
    updateConnections();
}

export function updateConnections() {
    const { panX, panY, zoom } = config.getViewState();
    const worldRect = config.world.getBoundingClientRect();
    const connections = config.getConnections();

    connections.forEach(conn => {
        const sourceNode = document.getElementById(conn.sourceNode);
        const destNode = document.getElementById(conn.destNode);
        if (!sourceNode || !destNode) return;
        const sourcePin = sourceNode.querySelector(`.outputs .pin[data-index="${conn.sourceIndex}"]`);
        const destPin = destNode.querySelector(`.inputs .pin[data-index="${conn.destIndex}"]`);
        if (!sourcePin || !destPin) return;
        const sRect = sourcePin.getBoundingClientRect();
        const dRect = destPin.getBoundingClientRect();
        // Convert screen coordinates to world coordinates by dividing by zoom
        const x1 = ((sRect.left - worldRect.left) + sRect.width / 2) / zoom;
        const y1 = ((sRect.top - worldRect.top) + sRect.height / 2) / zoom;
        const x2 = ((dRect.left - worldRect.left) + dRect.width / 2) / zoom;
        const y2 = ((dRect.top - worldRect.top) + dRect.height / 2) / zoom;
        const dist = Math.abs(x2 - x1) * 0.5;
        conn.pathEl.setAttribute('d', `M ${x1} ${y1} C ${x1 + dist + 20} ${y1}, ${x2 - dist - 20} ${y2}, ${x2} ${y2}`);
    });
}
