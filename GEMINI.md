# Logic Gate Circuit Builder

A web-based visual circuit designer inspired by Stormworks microcontroller editor.

## Project Overview
This project allows users to design and simulate logic circuits directly in the browser. It features a drag-and-drop interface, real-time logic simulation, and a user experience modeled after the Stormworks game editor.

## Features implemented
- **Component Library:** AND, OR, NOT, XOR, NAND, NOR, XNOR gates, Buffer, Tri-State, Switches, and Lights.
- **Memory Components:** SR Latch, D Flip-Flop, JK Flip-Flop, T Flip-Flop, **Memory Register**, Counter, Timer, and **Up/Down Counter**.
- **Number System Support:** Wires can now carry numerical (floating-point) values. Logic gates interpret values > 0 as ON.
- **Math Gates:** ADD, SUB, MUL, DIV, **MOD**, **POW**, **SQRT**, **ABS**, **NEG**, **MIN**, **MAX**, **CLAMP**, **ROUND**, **FLOOR**, **CEIL**, Equal, Greater Than, Less Than.
- **Function Gate:** A programmable math gate where users can enter custom formulas (e.g., `x * 2 + 1`).
- **Logic Utility Gates:** **Threshold** (outputs ON if input is within a range), **Numerical Switchbox** (switches between two numerical inputs based on a boolean control signal).
- **Signal/Utility Gates:** **Constant** (fixed value output), **Delay** (outputs after N ticks), **Pulse** (single pulse on rising edge), **Debounce** (filters rapid changes), **Random** (random value generator).
- **Lever Input:** A new input component allowing users to set a floating-point value. **Advanced features:**
  - **Min/Max Limits:** Constrain the output value within a specific range.
  - **Control Modes:** **Direct** (Step change) or **Curve** (Continuous smooth change).
  - **Hotkeys:** Assign keys to increase/decrease the value.
- **Dial Output:** A new output component to display numerical values.
- **Threshold Gate:** A logic gate that outputs ON if its numerical input is within a user-defined (Min/Max) range.
- **Hotkey System:**
  - Assign keyboard shortcuts to **Switches** (Toggle) and **Levers** (Up/Down).
  - **Visual Feedback:** Assigned hotkeys are displayed on the component (e.g., `[W]`, `[S/W]`).
- **Visual Interface:**
  - **Modernized Sidebar:** Configuration inputs now use a transparent "Dark Card" aesthetic with flow animations for mode switching.
  - **Visual Selectors:** Replaced standard dropdowns with graphical arrow toggles for Lever modes.
  - Brighter blue grid theme.
  - Logic gates are now single white boxes with the name at the top center.
  - SVG-based logic symbols.
  - Smooth Bezier curve wiring.
  - White SVG logos for Input/Output components in menus (TAB and Quick Access Bar).
  - **Pin Styling:** Binary (Boolean) pins are Red, Number pins are Green.
  - **Wire Animation:** Active wires (carrying signal/value) have a flowing animation.
  - **Gate Tooltips:** Hovering over a gate's header in the workspace displays its description.
  - **Pin Tooltips:** Hovering over any input/output pin shows color-coded label ([INPUT] red, [OUTPUT] green) with pin function description.
  - **Selection Animation:** Selected gates display a flowing "marching ants" animation with a dark blue outline for clear visibility.
- **Interaction:**
  - **First-Time Tutorial:** Interactive step-by-step guide for new users with animated demos and hands-on tasks:
    - **Transparent overlay mode** - no darkened background, allows seeing the workspace
    - **TAB menu opens automatically** during menu-related tutorial steps
    - Ghost animation showing how to drag components from menu to Quick Access slots
    - Interactive gate placement task with achievement celebration and confetti
    - **Connection animation demo** with ghost Switch/Light nodes and animated wire
    - Sidebar visible during configuration step
    - Skip button available at any stage
    - Tutorial resets on every page refresh (for demo purposes)
  - **Quick Access Bar:** **Expanded to 10 slots (1-0 for keyboard shortcuts)** for frequent components (Drag from menu to assign), with a dedicated **Menu Button**.
  - **Component Menu:** Full-screen overlay (TAB) with descriptions, now features a **smooth animated opening/closing** without darkening the background. Logic section includes utility gates (Threshold, Numerical Switchbox).
  - **Component Search:** Added a search bar to the TAB menu header. Users can type to filter components by name. The search bar auto-focuses on open and clears on close.
  - **Configurable Gates:** Gates like Threshold, Function, Lever, and Memory Register now display their configured values directly on the node. To edit these values, click the small gear icon in the top-right corner of the node or double-click the node to open a **sidebar**. The sidebar allows easy modification of parameters (Min/Max, Formula, Value, Reset Value). **All configurable components (including Switches, Levers, Lights, Dials) can now be renamed** via a "Label" field in the sidebar (Max 23 characters).
  - **Navigation:** Infinite canvas panning (Middle Mouse Button or two-finger trackpad scroll). **Zoom** with Ctrl+scroll or trackpad pinch (0.25x to 3x).
  - **Selection:** Drag-box selection and multi-move capability with animated visual feedback.
  - **Editing:** Delete nodes via Trash Bin (Drag to bottom right) or Delete key. **Dragging a wire between already connected pins will now toggle (delete) the connection.**
  - **New Circuit Button:** A "+" button in the top menu to clear the board and start fresh (with confirmation dialog).
  - **Save/Load:** Save circuits to a `.logic` file and load them back.
  - **Undo/Redo:** Full history support for circuit changes.
  - **Improved Drag & Drop:** Enhanced dragging stability for nodes and wiring, preventing "sticky" behavior and ensuring reliable connections.
  - **Settings:** Gear icon in the top-right opens a settings modal to configure:
    - **Zoom Sensitivity**
    - **Pan Sensitivity**
    - **Dark Mode:** Sliding toggle switch (consistent with in-game Switch component) to change the background to a dark grayish-blue (`#2c3e50`) for reduced eye strain.
  - **Delete Mode:** Press Delete key or click trash button to enter delete mode. Click on any node or wire to delete it. Features 45° rotated red X cursor, pulsing red hover effect on gates.
  - **Minimap:** A visual navigation aid in the top-right corner showing the entire circuit layout and current viewport. Clicking on the minimap centers the view to that location.
  - **Signal Probes:** Hover over any wire to see its current value. Works with both boolean (ON/OFF) and numerical values. Math gate outputs now show actual computed values.
  - **Bug Fixes:**
    - **Wire Visuals:** Fixed an issue where the wire connection line did not start from the correct position on the pin when dragging, now accounting for zoom and pin centering.
    - **Connection Type Safety:** Implemented strict type checking to prevent invalid connections between Boolean (Red) and Numerical (Green) pins.
    - **Hotkey Conflict:** Fixed an issue where hotkeys (0-9 for Quick Access, Delete/Backspace) would trigger while typing in input fields (like the Component Search or Value Config). Hotkeys are now disabled when an input is focused.
    - **Snap to Grid Jitter:** Fixed an issue where enabling "Snap to Grid" caused sticky or jerky movement when dragging nodes. The dragging logic now calculates positions based on the total distance moved from the start, rather than incremental updates, ensuring smooth and accurate snapping.
- **Simulation:** Instant feedback loop for logic states (Red/Green wires, Light indicators), now with numerical propagation.

## Tech Stack
- **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Rendering:** DOM elements for nodes, SVG for wires.
- **No external dependencies.**

## File Structure
- `index.html`: Main structure and container layouts.
- `style.css`: Visual styling, grid, animations, and theme variables.
- `script.js`: Main controller (DOM events, global state, initialization).
- `gateDefinitions.js`: Static data (component definitions, SVGs, pin descriptions).
- `simulation.js`: Simulation logic engine.
- `tutorial.js`: Interactive tutorial system.
- `minimap.js`: Minimap rendering and interaction logic.
- `wiring.js`: Logic for creating, updating, and managing wire connections.

## How to Run
1. Start a local HTTP server (required for ES Modules):
   ```bash
   npx http-server -p 8080 --cors
   ```
2. Open `http://localhost:8080/index.html` in any modern browser.
3. No build step required.

> **Note:** Opening `index.html` directly via `file://` protocol will not work due to CORS restrictions on ES Modules.

## Roadmap (Future)
- Packaging as a standalone executable (Electron/Tauri).

## Codebase Refactoring (Complete)
The codebase has been refactored from a monolithic structure into a clean ES Module architecture for improved maintainability and scalability.

**Module Structure:**
| File | Purpose |
|------|--------|
| `script.js` | Main controller - DOM events, global state, initialization |
| `gateDefinitions.js` | Static data - component definitions, SVG icons, pin descriptions |
| `simulation.js` | Simulation engine - logic evaluation, signal propagation |
| `tutorial.js` | Tutorial system - interactive walkthrough, step management |
| `minimap.js` | Minimap rendering and interaction logic |
| `wiring.js` | Connection management and SVG rendering |

**Details:**
- **`gateDefinitions.js`**: Contains all static component data, including `componentDefinitions`, SVG icons (`gateSVGs`, `ioSVGs`), and tooltip descriptions.
- **`simulation.js`**: Encapsulates the `updateSimulation` logic and `getConnectionValue` helper. Operates as a pure function accepting the current state.
- **`tutorial.js`**: Encapsulates the entire tutorial state machine and DOM interaction logic. Communicates with the main app via callbacks and state getters.
- **`minimap.js`**: Handles the rendering of the mini-map and view panning interactions.
- **`wiring.js`**: Manages wire creation, SVG paths, and connection logic.
- **`script.js`**: Entry point and main controller. Manages global state (`nodes`, `connections`), handles global DOM events (mouse, keyboard), and coordinates other modules.
- **`index.html`**: Loads `script.js` as a module (`type="module"`).

**Status:** ✅ Complete
- Modular split finalized and tested.
- Core functionality (simulation, placing, wiring) fully preserved.
- Tutorial system working with modular state.
