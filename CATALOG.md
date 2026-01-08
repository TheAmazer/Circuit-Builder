# Circuit Builder - Change Catalog

This file documents changes made to the Circuit Builder project.

---

## January 8, 2026

### UI Enhancements
Updated the Dark Mode toggle in the settings menu.

**Files Modified:**
- `index.html` - Replaced checkbox with `.toggle-switch` div structure
- `script.js` - Updated event listener to handle custom toggle click interactions
- `GEMINI.md` - Updated documentation to reflect the UI change

**Changes:**
- Replaced the standard HTML checkbox for "Dark Mode" with a custom sliding toggle switch.
- The new toggle visually matches the "Switch" component used in the circuit editor.
- Updated event handling to manually toggle the `on` class and update the "On/Off" label.
- Added a 0.5s fade transition to the background color for a smoother dark mode switch.

**Result:**
- Consistent visual language across the application's UI and the circuit components.
- Improved aesthetic for the settings menu.
- Polished user experience.

### Minimap Feature
Implemented a minimap for easier navigation of large circuits.

**Files Modified:**
- `index.html` - Added minimap canvas
- `style.css` - Styled minimap container
- `script.js` - Implemented rendering and navigation logic

**Features:**
- Real-time visualization of all nodes and the current viewport.
- Click-to-pan functionality.
- Auto-scaling to fit the entire circuit.

### Minimap Bug Fixes
Fixed issues with minimap rendering and interaction.

**Files Modified:**
- `script.js`

**Changes:**
- **Data Sync:** Updated node dragging logic to sync position data with the internal `nodes` array, ensuring the minimap renders current positions instead of initial ones.
- **Event Isolation:** Added `stopPropagation` for wheel events on the minimap to prevent accidental workspace zooming.
- **Viewport Visibility:** Increased minimap world padding (to 4000) to ensure the viewport indicator (blue square) remains visible and proportionally sized even with a single node, and appears smaller at medium zoom.
- **Render Timing:** Implemented delayed rendering for the minimap upon node creation to ensure DOM layout is complete before drawing, preventing missing elements.
- **Viewport Clamping:** Implemented clamping logic for the viewport indicator so it remains visible as a border when the viewport exceeds the minimap boundaries (e.g., fully zoomed out).
- **Zoom Range:** Expanded zoom limits to 0.1x - 10x (previously 0.25x - 3x) to allow for tighter close-ups, satisfying the requirement for the viewport indicator to closely match the gate size at max zoom.

**Result:**
- Minimap accurately reflects the circuit layout.
- Clicking the minimap correctly centers the view on the target area.
- Interaction is more stable.
- Viewport indicator is always visible.

### Codebase Refactoring
Extracted minimap logic into a separate module.

**Files Modified:**
- `script.js`
- `minimap.js` (Created)

**Changes:**
- Moved `drawMinimap` and related event listeners to `minimap.js`.
- Implemented an initialization function `initMinimap` to inject dependencies (state accessors).
- Cleaned up `script.js`.

**Result:**
- Reduced complexity of `script.js`.
- Better separation of concerns.

### Wiring Logic Refactoring
Extracted connection and wiring logic into a separate module.

**Files Modified:**
- `script.js`
- `wiring.js` (Created)

**Changes:**
- Moved functions: `startWiring`, `finishWiring`, `cancelWiring`, `createConnection`, `updateConnections`, `updateGhostLine`.
- Implemented `initWiring` to inject state dependencies.
- Updated `script.js` to delegate wiring operations to the new module.

**Result:**
- Significant reduction in `script.js` size (~200 lines).
- Isolated complex SVG wiring logic.

### Bug Fixes
- **Sidebar:** Fixed a `ReferenceError` (missing `closeSettings` function) that prevented the configuration sidebar from opening.

---

## January 2, 2026

### Codebase Modularization Complete
Finalized the refactoring of the monolithic codebase into a clean ES Module structure.

**Files Modified:**
- `script.js` - Retained as main controller, now imports from other modules
- `gateDefinitions.js` - Static component data, SVG icons, pin descriptions
- `simulation.js` - Simulation logic engine
- `tutorial.js` - Interactive tutorial system (rebuilt from scratch)
- `index.html` - Loads script.js with `type="module"`

**Changes:**
- Split monolithic `script.js` into focused ES Modules
- Fixed corrupted `tutorial.js` file that was preventing app startup
- All modules now use proper ES6 `import`/`export` syntax
- Application now requires a local HTTP server to run (due to ES Module CORS restrictions)

**Result:**
- Cleaner, more maintainable codebase
- Better separation of concerns
- Modular architecture ready for future enhancements

---

## December 30, 2025

### Wire Connection & Type Safety Fixes
Addressed visual bugs in wiring and implemented strict type safety for connections.

**Files Modified:**
- `script.js`

**Changes:**
- **Wire Drawing Fix:** Updated ghost wire coordinate calculation in `mousemove` handler to correctly account for zoom level and center the starting point on the pin.
- **Strict Type Checking:** Added validation in `finishWiring` to verify that source and destination pins share the same type (`bool` or `num`) before allowing a connection.

**Result:**
- Dragging a wire now visually starts exactly from the pin center, regardless of zoom or pan.
- Users can no longer accidentally connect incompatible Boolean and Numerical pins.

---

## December 20, 2025

### Delete Mode Feature
A new delete mode for easier component removal.

**Files Modified:**
- `index.html` - Added delete mode button to top bar
- `script.js` - Added `isDeleteMode` state, `toggleDeleteMode()` function, delete mode click handlers
- `style.css` - Added delete mode styling and animations

**Features:**
- Toggle with Delete key or trash button in top bar
- Click nodes or wires to delete them
- 45-degree rotated red X cursor when active
- Pulsing red hover effect on gates
- Same red shade for gate header and body
- Tooltips hidden during delete mode
- Exit by pressing Escape or clicking empty space

---

### Signal Probe Numerical Fix
Fixed signal probes showing incorrect values for math gate outputs.

**Files Modified:**
- `script.js`

**Changes:**
- Added `n.outputValue` storage in `updateSimulation()` to persist computed output values
- Updated `getConnectionValue()` to read from `sourceNodeData.outputValue` instead of returning hardcoded `1`

**Result:**
- Signal probes now correctly display actual numerical values (e.g., 5+3=8) instead of always showing 1

---

### Wire Visual Alignment Fix
Fixed wires not staying aligned to pins at different zoom levels.

**Files Modified:**
- `script.js`

**Changes:**
- Updated `updateConnections()` to divide screen coordinates by zoom factor
- Wires now correctly connect to pins at all zoom levels (0.25x to 3x)

---
