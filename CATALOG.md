# Circuit Builder - Change Catalog

This file documents changes made to the Circuit Builder project.

---

## January 10, 2026

### Hotkey Display & Visual Refinements
Enhanced visual feedback for hotkeys and modernized the configuration sidebar.

**Files Modified:**
- `script.js` - Updated node creation to include hotkey labels, implemented visual mode selector for Lever.
- `style.css` - Added styles for hotkey display, redesigned sidebar inputs to match "Dark Card" aesthetic, added mode switch animation.
- `simulation.js` - Updated simulation loop to populate hotkey labels.

**Features:**
- **Hotkey Labels:** Switches and Levers now display their assigned hotkeys (e.g., `[W]`, `[S/W]`) directly on the node.
- **Visual Mode Selector:** Replaced the "Control Mode" dropdown for Levers with a graphical arrow-based selector.
- **Sidebar Theme:** Updated all sidebar inputs to a cleaner, flat dark theme with transparent backgrounds and subtle underlines, matching the new visual direction.
- **Animations:** Added smooth flow animations when switching Lever control modes.

### Visual Experimentation (Reverted)
Briefly implemented and then reverted a "Shaped Gates" feature (where nodes took the shape of their logic symbol) based on user feedback. The standard rectangular node style with icons remains the design choice for consistency.

---

### Label Scaling and Limits
Implemented constraints and visual adjustments for renameable components.

**Files Modified:**
- `script.js` - Added `adjustHeaderFontSize` function, updated label handling in `createNode`, `openSidebar`, `loadCircuit`.

**Features:**
- **Character Limit:** Custom labels are now restricted to a maximum of 23 characters (reduced from 32 to prevent overflow).
- **Dynamic Font Scaling:** Node header text automatically reduces in size (from 14px down to ~9px) as the label gets longer (> 15 characters) to ensure it fits within the node boundaries.
- **UI Feedback:** Added "Max 23 characters" note in the settings sidebar.

---

### Hotkey System & Lever Enhancements
Implemented a robust hotkey system and significantly upgraded the Lever component's capabilities.

**Files Modified:**
- `script.js` - Added hotkey logic (direct & continuous), upgraded sidebar config, updated event handlers.
- `simulation.js` - Updated `updateSimulation` to display assigned hotkeys on nodes and handle new config values.
- `style.css` - Added styling for `.hotkey-display` and sidebar inputs.

**Features:**
- **Hotkeys:**
  - **Switch:** Toggle ON/OFF with a designated key.
  - **Lever:** Control value with "Increase" and "Decrease" keys.
  - **Visual Feedback:** Assigned hotkeys are displayed directly on the component in the workspace (e.g., `[W]`, `[S/W]`).
- **Advanced Lever Control:**
  - **Control Modes:** Choose between **Direct** (Step) and **Curve** (Continuous) modes.
  - **Sensitivity:** Configurable rate of change. In "Curve" mode, sensitivity is intelligently scaled (0.05x) for smooth operation.
  - **Value Limits:** Configurable **Min** and **Max** values. The lever value is clamped within this range.
  - **Precision:** Value display is limited to 3 decimal places for cleaner UI.

### Bug Fixes
- **Save/Load Integrity:** Fixed an issue where loading a circuit broke the configuration sidebar. The loader now correctly preserves Node IDs, ensuring event listeners remain valid.
- **Icon Restoration:** Fixed a regression where the Lever icon was replaced by a generic symbol. Restored the original SVG slider icon.

---

### Light and Dial Rendering Fix
Fixed an issue where Lights and Dials lost their visual indicators after making them renameable.

**Files Modified:**
- `script.js` - Reordered `createNode` logic.

**Changes:**
- Prioritized specific rendering logic for `Dial` and `Light` over the generic `configurableTypes` handler.
- Ensures they display their functional UI (dial number, light bulb) while still supporting the configuration sidebar for renaming.

---

### Renameable Components
Added the ability to rename input/output components (and other configurable nodes) via the settings sidebar.

**Files Modified:**
- `gateDefinitions.js` - Added 'Switch', 'Light', 'Dial' to `configurableTypes`.
- `script.js` - Updated `openSidebar` to add "Label" input, updated `loadCircuit` to restore labels.
- `GEMINI.md` - Updated documentation.

**Features:**
- **Custom Labels:** Users can now assign custom names to Switches, Levers, Lights, Dials, and other configurable components.
- **Sidebar Integration:** A new "Label" input field appears at the top of the configuration sidebar.
- **Visual Update:** The node header text updates in real-time when the label is changed.
- **Persistence:** Custom labels are saved and loaded with the circuit file.

---

### Snap to Grid Fix
Fixed "sticky" and "janky" behavior when dragging nodes with Snap to Grid enabled.

**Files Modified:**
- `script.js` - Updated dragging logic.
- `GEMINI.md` - Updated documentation.

**Changes:**
- **Refactored Dragging Logic:** Changed `mousemove` handler to calculate new positions based on the *total delta* from the drag start position, rather than accumulating small `movementX/Y` increments.
- **State Management:** Introduced `dragStartX`, `dragStartY`, and `dragStartPositions` map to track initial states during a drag operation.

**Result:**
- Dragging nodes with "Snap to Grid" on is now smooth and predictable.
- Eliminates rounding errors that caused nodes to stick to their previous positions until rapid mouse movement occurred.

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
