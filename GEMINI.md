# Logic Gate Circuit Builder

A web-based visual circuit designer inspired by Stormworks microcontroller editor.

## Project Overview
This project allows users to design and simulate logic circuits directly in the browser. It features a drag-and-drop interface, real-time logic simulation, and a user experience modeled after the Stormworks game editor.

## Features implemented
- **AI Assistant (New):** Agentic framework for building/analysing/correcting circuits. The loop runs client-side (the circuit lives in the browser and tools mutate it directly, so no state ships anywhere and no serverless timeout applies); `api/agent.js` is a stateless proxy that verifies the Supabase session and injects the provider key. Providers sit behind an adapter (Gemini, OpenRouter, Grok) — switching is an env var. The canvas is passed as JSON from `saveState()`, not screenshots. The model never picks coordinates; `layoutCircuit()` assigns positions by topological depth. `run_truth_table` lets the agent verify its own work against the deterministic simulator, which is what makes the build → test → fix loop possible.
- **Simulation Tick (New):** Fixed-rate 20 ticks/sec via rAF with a catch-up cap, plus Run/Pause and Step. Added a Clock component. Fixed `Timer`/`Delay`/`Debounce` advancing once per *settle pass* (up to 20x too fast) — time-based parts now advance at most once per tick, and event-driven refreshes pass no tick id so no simulated time elapses.
- **TAB Menu Polish (New):** Hover tooltips on component tiles (name plus a one-line summary), animated with the shared motion tokens. Summaries are derived from each component's existing `desc` by stripping markup and truth tables and taking the first sentence, so component copy keeps a single source of truth. The "Stock" chip was removed, and all tile icons were unified onto one tile treatment — previously math, I/O and logic icons each had a different look. Tiles use the same light body colour as a placed node (`#e9eaec`) with dark symbols, so a tile previews the real component; hard-coded `stroke="white"` attributes in the markup are overridden to `currentColor`. Category is carried by ring colour alone, re-tuned for the light tile (all combinations clear WCAG AA for graphical elements). Inline `#2ecc71` styles on the numeric components were replaced with a `num-icon` class, since inline styles beat the stylesheet and left them unreadable.
- **Composite Block UI (New):** Right-click context menu (group, ungroup, block details, copy/cut/duplicate/delete; paste and select-all on empty canvas) and a block create/edit dialog with name, description, a port-count preview, and editable pin names. `Ctrl/Cmd + G` routes through the same dialog. Pin names live on the definition, so editing updates every instance.
- **Composite Components (New):** Group a selection into a reusable block (`Ctrl/Cmd + G`) and expand it again (`Ctrl/Cmd + Shift + G`). These are true nested sub-circuits, not visual grouping:
  - An instance's node type is `Composite:<definitionId>`, registered into `componentDefinitions` with derived pin counts, so node creation, wiring, pin rendering, the save format and copy/paste need no special cases.
  - The per-node gate `switch` was extracted from the `updateSimulation` loop into a DOM-free `evaluateGate(n, s, depth)`, shared by the top-level board and by inner circuits (whose nodes have no DOM).
  - `instantiateInner()` gives each instance private inner nodes and memory, so two instances of the same block do not share flip-flop or counter state.
  - Blocks may nest; depth is capped at 8 so a self-containing definition fails safe.
  - Input ports are inner input pins with no internal driver; output ports are inner output pins that drive something outside or nothing at all. Ports are ordered by node position.
  - Definitions are serialised with the circuit (undo history and cloud saves). Circuits saved before blocks existed have no `composites` key and load unchanged.
  - Switches and Levers are rejected inside a block, since a block cannot expose an interactive control.
- **Clipboard (New):** `Ctrl/Cmd + C / X / V / D` for copy, cut, paste, and duplicate of the current selection. Wires are carried only when both endpoints are inside the selection; an old-id → new-id map rebuilds the internal wiring so copies connect to copies rather than back to the originals. Node config and Switch state are preserved, paste lands under the cursor, and the result is selected on arrival. The clipboard is in-memory — the system clipboard is left alone so text copy still works inside the app.
- **Undo/Redo Shortcuts (New):** `Ctrl/Cmd + Z`, `Ctrl/Cmd + Y`, and `Ctrl/Cmd + Shift + Z` are now bound. They had been documented but never wired; undo/redo were toolbar-only.
- **Unified Stormworks Theme (New):** The landing page now uses the same `--sw-*` design tokens as the simulator — dark panel palette, a top bar mirroring `#top-bar`, chunky inset-shadow buttons, and matching dropdown/modal surfaces. Added as an appended override block so the original landing rules remain intact.
- **Top Bar Component Menu Button (New):** A Components button in the top bar opens the TAB menu without needing the keyboard shortcut. `Escape` now also closes the menu (previously the focused search input swallowed it, leaving `TAB` as the only keyboard exit).
- **Motion Pass (New):** Shared easing/duration tokens, a staggered component-menu entrance, springy control feedback, node drop-in, panel entrances, and a `prefers-reduced-motion` block. Implemented in CSS to preserve the zero-dependency architecture.
- **Persistent Settings (New):** Zoom Sensitivity, Pan Sensitivity, Snap to Grid, and Dark Mode are stored in the `nodecraft-settings` localStorage key and restored on load. Dark Mode is applied by a pre-paint inline script so the light theme never flashes first.
- **Unsaved Changes Warning (New):** Leaving or refreshing with an unsaved, non-empty circuit prompts for confirmation. Cleared on initial load, New Circuit, cloud load, and successful cloud save. (Warning only — periodic auto-save is still on the roadmap.)
- **Minimap Rendering Fix (New):** The minimap previously went blank as soon as a component was placed, because node positions were never written to the data model at creation. See `CATALOG.md` (August 7, 2026) for the full breakdown.
- **Account Dashboard:** Added `account.html` + `scripts/account.js` for profile/security management.
  - Update username (stored in `accounts` and reflected in dropdown).
  - Update password for email/password sign-ins.
  - Update avatar URL (`user_metadata.avatar_url`) with validation.
  - Permanent account deletion flow (frontend + Supabase RPC).
- **Cloud Access UX:** Save/Load menu entry now remains visible even while signed out, with locked/blurred state and guidance overlay.
- **Simulator Home Navigation:** Added a top-bar Home button beside Settings to return to landing page without browser refresh.
- **Responsive 1080p Polish:** Updated simulator and save modal scaling for better readability and reduced "zoomed-in" feel.
- **Tutorial System Upgrade:** Mission-based guided/fast flow, smarter hints, richer animation feedback, and robust connection demo fallback if video is unavailable.
- **Media Path Standardization:** Feature and tutorial videos now use `assets/videos/*.mp4` paths.
- **Cloud Integration (Supabase):**
  - **Authentication:** Users can sign in using **Google OAuth** or **Email/Password registration**.
  - **Registration Modal:** Dedicated animated popup for new users with real-time alphanumeric validation.
  - **Microcontroller Management Menu:** A high-density, Stormworks-inspired submenu for managing cloud circuits:
    - **Cloud Save Modal:** Dedicated popup for saving circuits featuring Name, Description, and a custom **Paint Canvas** (130x130) to draw a thumbnail before saving.
    - **Cloud Load:** A visual grid of 130px circuit cards displaying the custom drawn thumbnail and circuit name.
    - **Details Panel:** Clicking a circuit in the grid opens a sleek right-hand side panel showing the thumbnail, description, last modified date, and a "Load Circuit" button.
    - **Cloud Delete:** Direct removal of circuits via a trash icon on each card.
    - **Live Search:** Real-time filtering of the cloud library.
    - **Windowed UI:** The menu covers a large portion of the screen (92vw/88vh) for a professional workspace feel with chunky `#3d515a` borders.
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
- **Bar Graph:** A visual output component that fills a bar based on numerical input. Features configurable **Min/Max** range and hover tooltip for exact value.
- **Bug Report UI:** Added a "Bugs" button to the top bar that opens a modal with contact information.
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
  - **Component Menu:** Full-screen overlay with descriptions, opened either by the **top-bar Components button** or the `TAB` key, and closed by `TAB` or `Escape`. Features a smooth animated opening/closing with a staggered tile cascade, without darkening the background. Logic section includes utility gates (Threshold, Numerical Switchbox).
  - **TAB Focus Layering:** Opening TAB now blurs simulator UI layers. The Quick Access Bar moves behind and blurs by default, then pops forward/unblurs while dragging a component for slot assignment.
  - **Simulator UI Refresh (Stormworks pass):** In-simulator top bar, menu windows, quick bar, and microcontroller manager were visually tuned to match current reference screenshots while preserving functionality.
  - **Top Bar Icon Update:** The microcontroller management button in the top bar now uses a folder icon.
  - **Component Search:** Added a search bar to the TAB menu header. Users can type to filter components by name. The search bar auto-focuses on open and clears on close.
  - **Configurable Gates:** Gates like Threshold, Function, Lever, and Memory Register now display their configured values directly on the node. To edit these values, click the small gear icon in the top-right corner of the node or double-click the node to open a **sidebar**. The sidebar allows easy modification of parameters (Min/Max, Formula, Value, Reset Value). **All configurable components (including Switches, Levers, Lights, Dials) can now be renamed** via a "Label" field in the sidebar (Max 23 characters).
  - **Navigation:** Infinite canvas panning (Middle Mouse Button or two-finger trackpad scroll). **Zoom** with Ctrl+scroll or trackpad pinch (0.25x to 3x).
  - **Selection:** Drag-box selection and multi-move capability with animated visual feedback.
  - **Editing:** Deletion is handled via Delete Mode and keyboard selection deletion (Delete/Backspace). The deprecated bottom-right trashbin drag-delete UI has been removed. **Dragging a wire between already connected pins will now toggle (delete) the connection.**
  - **New Circuit Button:** A "+" button in the top menu to clear the board and start fresh (with confirmation dialog).
  - Cloud Sync: Save and load circuits via Supabase cloud storage.
  - Undo/Redo: Full history support for circuit changes, via the toolbar buttons or `Ctrl/Cmd + Z` / `Ctrl/Cmd + Y`.
  - **Clipboard:** Copy, cut, paste, and duplicate a selection with its internal wiring (`Ctrl/Cmd + C / X / V / D`). Paste lands at the cursor and respects Snap to Grid.
  - **Improved Drag & Drop:** Enhanced dragging stability for nodes and wiring, preventing "sticky" behavior and ensuring reliable connections.
  - **Settings:** Gear icon in the top-right opens a settings modal to configure:
    - **Zoom Sensitivity**
    - **Pan Sensitivity**
    - **Snap to Grid**
    - **Dark Mode:** Sliding toggle switch (consistent with in-game Switch component) to change the background to a dark grayish-blue (`#2c3e50`) for reduced eye strain.
    - All four settings persist across reloads via localStorage.
  - **Delete Mode:** Press Delete key or click the top-bar delete-mode button to enter delete mode. Click on any node or wire to delete it. Features 45° rotated red X cursor, pulsing red hover effect on gates.
  - **Minimap:** A visual navigation aid in the top-right corner showing the entire circuit layout and current viewport. Clicking on the minimap centers the view to that location. Renders at `devicePixelRatio` for crisp output on high-density displays, and frames the viewport together with the nodes so the indicator stays visible and usefully scaled at any circuit size.
  - **Signal Probes:** Hover over any wire to see its current value. Works with both boolean (ON/OFF) and numerical values. Math gate outputs now show actual computed values.
  - **Bug Fixes:**
    - **Minimap Blank After Placement:** Node positions were never written to the `nodes` data model at creation, so world bounds evaluated to `NaN` and the minimap drew nothing — including the viewport indicator — until a node was dragged. Positions are now set on creation, bounds skip non-finite entries, and click-to-pan accounts for the canvas border.
    - **Text Encoding:** Fixed four double-encoded UTF-8 characters that rendered as mojibake (`√` in the SQRT tile, the tutorial `🎉`/`🎯` icons, and the landing page `©`).
    - **Wire Visuals:** Fixed an issue where the wire connection line did not start from the correct position on the pin when dragging, now accounting for zoom and pin centering.
    - **Connection Type Safety:** Implemented strict type checking to prevent invalid connections between Boolean (Red) and Numerical (Green) pins.
    - **Hotkey Conflict:** Fixed an issue where hotkeys (0-9 for Quick Access, Delete/Backspace) would trigger while typing in input fields (like the Component Search or Value Config). Hotkeys are now disabled when an input is focused.
    - **Snap to Grid Jitter:** Fixed an issue where enabling "Snap to Grid" caused sticky or jerky movement when dragging nodes. The dragging logic now calculates positions based on the total distance moved from the start, rather than incremental updates, ensuring smooth and accurate snapping.
  - **Navigation Avatar:** Displays the user's profile picture (or a default SVG icon for email logins) next to the "Account" button only when authenticated.
- **Simulation:** Instant feedback loop for logic states (Red/Green wires, Light indicators), now with numerical propagation.

## Tech Stack
- **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Rendering:** DOM elements for nodes, SVG for wires.
- **No external dependencies.**

## File Structure
- `/`: Root directory containing `index.html` (Main structure) and project documentation (`README.md`, `GEMINI.md`, etc.).
- `/css/`: Contains styling files (`style.css` - visual styling, grid, animations, and theme variables).
- `/scripts/`: Contains all JavaScript modules:
  - `script.js`: Main controller (DOM events, global state, initialization).
  - `gateDefinitions.js`: Static data (component definitions, SVGs, pin descriptions).
  - `simulation.js`: Simulation logic engine.
  - `tutorial.js`: Interactive tutorial system.
  - `minimap.js`: Minimap rendering and interaction logic.
  - `wiring.js`: Logic for creating, updating, and managing wire connections.
  - `auth.js`: Authentication logic (Supabase integration).
  - `storage.js`: Cloud saving/loading logic.
  - `supabaseClient.js`: Supabase initialization.
  - `landing_animation.js`: Animations for the landing page.
- `/assets/`: Contains static media.
  - `/assets/videos/`: Feature and tutorial demo videos.
- `/account.html`: Dedicated account settings page.
- `/supabase/`: Contains Supabase configuration and migration files.

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
- **`simulation.js`**: Encapsulates the `updateSimulation` logic and `getConnectionValue` helper. Operates as a pure function accepting the current state. Per-node evaluation lives in a DOM-free `evaluateGate()`, which is shared by the top-level board and by `evaluateComposite()` for the inside of composite blocks. The composite definition registry is injected from `script.js` via `setCompositeRegistry()`, so this module stays free of persistence and UI concerns.
- **`tutorial.js`**: Encapsulates the entire tutorial state machine and DOM interaction logic. Communicates with the main app via callbacks and state getters.
- **`minimap.js`**: Handles the rendering of the mini-map and view panning interactions.
- **`wiring.js`**: Manages wire creation, SVG paths, and connection logic.
- **`script.js`**: Entry point and main controller. Manages global state (`nodes`, `connections`), handles global DOM events (mouse, keyboard), and coordinates other modules.
- **`index.html`**: Loads `script.js` as a module (`type="module"`).

**Status:** ✅ Complete
- Modular split finalized and tested.
- Core functionality (simulation, placing, wiring) fully preserved.
- Tutorial system working with modular state.


