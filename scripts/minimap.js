// minimap.js

let getNodes, getViewState, setViewState, getWorkspace, updateTransformCallback;
let minimapCanvas, minimapCtx;
let isMinimapDragging = false;

// Logical (CSS pixel) size of the minimap. The canvas backing store is scaled by
// devicePixelRatio on top of this, so all drawing math below stays in CSS pixels.
const MINIMAP_W = 200;
const MINIMAP_H = 150;

// Fraction of the framed extent kept as breathing room around the content.
const MINIMAP_PADDING_RATIO = 0.15;

function syncMinimapResolution() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(MINIMAP_W * dpr);
    const h = Math.round(MINIMAP_H * dpr);
    if (minimapCanvas.width !== w || minimapCanvas.height !== h) {
        minimapCanvas.width = w;
        minimapCanvas.height = h;
    }
    // Keep the CSS box locked to the logical size regardless of the backing store.
    minimapCanvas.style.width = `${MINIMAP_W}px`;
    minimapCanvas.style.height = `${MINIMAP_H}px`;
    minimapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function initMinimap(config) {
    getNodes = config.getNodes;
    getViewState = config.getViewState;
    setViewState = config.setViewState;
    getWorkspace = config.getWorkspace;
    updateTransformCallback = config.updateTransform;

    minimapCanvas = document.getElementById('minimap');
    if (minimapCanvas) {
        minimapCtx = minimapCanvas.getContext('2d');
        syncMinimapResolution();

        // Re-render at the new pixel density if the window moves to another display.
        window.addEventListener('resize', () => drawMinimap());

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

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function moveViewToMinimap(e) {
    if (!minimapCanvas || !minimapCanvas._data) return;
    const rect = minimapCanvas.getBoundingClientRect();
    // getBoundingClientRect() spans the border box; clientLeft/clientTop are the
    // border widths, so subtracting them lands us in content-box coordinates.
    const clickX = clamp(e.clientX - rect.left - minimapCanvas.clientLeft, 0, MINIMAP_W);
    const clickY = clamp(e.clientY - rect.top - minimapCanvas.clientTop, 0, MINIMAP_H);
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

    syncMinimapResolution();

    // Clear (transform is set to dpr scale, so clear in logical units)
    minimapCtx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

    // Current viewport in world units. Framed alongside the nodes below so the
    // viewport rect is always inside the minimap, even with no nodes placed.
    const safeZoom = (zoom > 0 && isFinite(zoom)) ? zoom : 1;
    const viewportW = workspace.clientWidth / safeZoom;
    const viewportH = workspace.clientHeight / safeZoom;
    const viewportX = -panX / safeZoom;
    const viewportY = -panY / safeZoom;

    // Calculate World Bounds over every node with a usable position, unioned
    // with the viewport. Nodes are skipped rather than poisoning the bounds with
    // NaN if their position hasn't been synced yet.
    let minX = viewportX, minY = viewportY;
    let maxX = viewportX + viewportW, maxY = viewportY + viewportH;

    const drawable = [];
    nodes.forEach(n => {
        if (!n || !isFinite(n.x) || !isFinite(n.y)) return;
        const el = n.el;
        const nodeWidth = (el && el.offsetWidth) ? el.offsetWidth : 140;
        const nodeHeight = (el && el.offsetHeight) ? el.offsetHeight : 100;
        drawable.push({ x: n.x, y: n.y, w: nodeWidth, h: nodeHeight });
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + nodeWidth);
        maxY = Math.max(maxY, n.y + nodeHeight);
    });

    // Padding proportional to the framed extent, so the scale stays useful
    // whether the circuit is one gate or a thousand.
    // Guard against a zero-extent frame (e.g. drawn while the workspace is
    // still collapsed behind the landing page), which would make scale Infinite.
    const extent = Math.max(maxX - minX, maxY - minY, 1);
    const padding = extent * MINIMAP_PADDING_RATIO;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Ensure aspect ratio matches canvas to avoid distortion
    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const canvasAspect = MINIMAP_W / MINIMAP_H;
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
    const scale = MINIMAP_W / finalWorldW;

    // Draw Nodes (each node is at least 1px so single gates stay visible)
    minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    drawable.forEach(n => {
        minimapCtx.fillRect(
            (n.x - minX) * scale,
            (n.y - minY) * scale,
            Math.max(1, n.w * scale),
            Math.max(1, n.h * scale)
        );
    });

    // Draw Viewport
    const vX = (viewportX - minX) * scale;
    const vY = (viewportY - minY) * scale;
    const vW = viewportW * scale;
    const vH = viewportH * scale;

    // Clamp Viewport Rect to Canvas to ensure visibility when zoomed out
    let drawX = vX, drawY = vY, drawW = vW, drawH = vH;
    const cW = MINIMAP_W;
    const cH = MINIMAP_H;

    if (drawX < 0) { drawW += drawX; drawX = 0; }
    if (drawY < 0) { drawH += drawY; drawY = 0; }
    if (drawX + drawW > cW) { drawW = cW - drawX; }
    if (drawY + drawH > cH) { drawH = cH - drawY; }
    
    drawW = Math.max(0, drawW);
    drawH = Math.max(0, drawH);

    // Inset by half the stroke width so an edge-clamped rect isn't half-clipped.
    const half = 1;
    const x0 = clamp(drawX, half, cW - half);
    const y0 = clamp(drawY, half, cH - half);
    const x1 = clamp(drawX + drawW, half, cW - half);
    const y1 = clamp(drawY + drawH, half, cH - half);

    minimapCtx.strokeStyle = '#3498db';
    minimapCtx.lineWidth = 2;
    minimapCtx.strokeRect(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0));

    // Save transform data for interaction
    minimapCanvas._data = { minX, minY, scale };
}
