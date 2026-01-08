// minimap.js

let getNodes, getViewState, setViewState, getWorkspace, updateTransformCallback;
let minimapCanvas, minimapCtx;
let isMinimapDragging = false;

export function initMinimap(config) {
    getNodes = config.getNodes;
    getViewState = config.getViewState;
    setViewState = config.setViewState;
    getWorkspace = config.getWorkspace;
    updateTransformCallback = config.updateTransform;

    minimapCanvas = document.getElementById('minimap');
    if (minimapCanvas) {
        minimapCtx = minimapCanvas.getContext('2d');
        
        minimapCanvas.addEventListener('mousedown', (e) => {
            isMinimapDragging = true;
            moveViewToMinimap(e);
        });

        minimapCanvas.addEventListener('wheel', (e) => e.stopPropagation());

        window.addEventListener('mousemove', (e) => {
            if (isMinimapDragging) {
                moveViewToMinimap(e);
                e.preventDefault(); // Prevent text selection
            }
        });

        window.addEventListener('mouseup', () => {
            isMinimapDragging = false;
        });

        // Initial draw
        drawMinimap();
    }
}

function moveViewToMinimap(e) {
    if (!minimapCanvas || !minimapCanvas._data) return;
    const rect = minimapCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const { minX, minY, scale } = minimapCanvas._data;
    const { zoom } = getViewState();
    const workspace = getWorkspace();

    // Target World Center
    const targetWorldX = (clickX / scale) + minX;
    const targetWorldY = (clickY / scale) + minY;

    // Update Pan
    const newPanX = (workspace.clientWidth / 2) - targetWorldX * zoom;
    const newPanY = (workspace.clientHeight / 2) - targetWorldY * zoom;

    setViewState({ panX: newPanX, panY: newPanY });
    updateTransformCallback();
}

export function drawMinimap() {
    if (!minimapCtx || !minimapCanvas) return;
    
    // Safety check for initialization
    if (!getNodes || !getViewState || !getWorkspace) return;

    const nodes = getNodes();
    const { panX, panY, zoom } = getViewState();
    const workspace = getWorkspace();

    // Clear
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // Calculate World Bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    if (nodes.length === 0) {
        // Default bounds if empty
        minX = -500; minY = -500; maxX = 500; maxY = 500;
    } else {
        nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + 140);
            maxY = Math.max(maxY, n.y + (n.el.offsetHeight || 100));
        });
    }

    // Padding (in World Units)
    const padding = 4000; 
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Ensure aspect ratio matches canvas to avoid distortion
    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const canvasAspect = minimapCanvas.width / minimapCanvas.height;
    const worldAspect = worldW / worldH;
    
    if (worldAspect > canvasAspect) {
        // World is wider, fit to width
        const newWorldH = worldW / canvasAspect;
        const diff = newWorldH - worldH;
        minY -= diff / 2;
        maxY += diff / 2;
    } else {
        // World is taller, fit to height
        const newWorldW = worldH * canvasAspect;
        const diff = newWorldW - worldW;
        minX -= diff / 2;
        maxX += diff / 2;
    }

    const finalWorldW = maxX - minX;
    const finalWorldH = maxY - minY;
    const scale = minimapCanvas.width / finalWorldW;

    // Draw Nodes
    minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    try {
        nodes.forEach(n => {
            const x = (n.x - minX) * scale;
            const y = (n.y - minY) * scale;
            const w = 140 * scale;
            const h = (n.el.offsetHeight || 100) * scale;
            minimapCtx.fillRect(x, y, w, h);
        });
    } catch (e) {
        // Ignore render errors (e.g. if node removed mid-render)
    }

    // Draw Viewport
    const viewportW = workspace.clientWidth / zoom;
    const viewportH = workspace.clientHeight / zoom;
    const viewportX = -panX / zoom;
    const viewportY = -panY / zoom;

    const vX = (viewportX - minX) * scale;
    const vY = (viewportY - minY) * scale;
    const vW = viewportW * scale;
    const vH = viewportH * scale;

    // Clamp Viewport Rect to Canvas to ensure visibility when zoomed out
    let drawX = vX, drawY = vY, drawW = vW, drawH = vH;
    const cW = minimapCanvas.width;
    const cH = minimapCanvas.height;

    if (drawX < 0) { drawW += drawX; drawX = 0; }
    if (drawY < 0) { drawH += drawY; drawY = 0; }
    if (drawX + drawW > cW) { drawW = cW - drawX; }
    if (drawY + drawH > cH) { drawH = cH - drawY; }
    
    drawW = Math.max(0, drawW);
    drawH = Math.max(0, drawH);

    minimapCtx.strokeStyle = '#3498db';
    minimapCtx.lineWidth = 2;
    minimapCtx.strokeRect(drawX, drawY, drawW, drawH);

    // Save transform data for interaction
    minimapCanvas._data = { minX, minY, scale };
}
