# NodeCraft - Project Description

## Overview
NodeCraft (formerly Circuit Builder) is a web-based visual simulation tool inspired by the Stormworks microcontroller editor. It allows users to design, build, and simulate complex logic circuits directly in the browser using a modern, drag-and-drop interface. The application supports both boolean logic and numerical (floating-point) signal processing.

### August 7, 2026 Update Snapshot
- **AI Assistant:** Describe a circuit in plain language and the assistant builds it, or ask what the board in front of you does. It verifies its own work by running a truth table against the simulator before reporting back. Sign-in gated, with the API key held server-side.
- **Simulation Tick & Clock:** The simulator now runs on a real fixed-rate tick with Run/Pause and Step controls, and a new free-running Clock component. This also fixed Timer, Delay and Debounce, which were advancing up to 20 times too fast.
- **Block UI:** Composite blocks are now created and edited through a right-click context menu and a dialog, rather than keyboard shortcuts alone. The dialog covers name, description, a preview of the pins the block will have, and editable pin names.
- **TAB Menu Polish:** Hovering a component tile shows its name and a one-line summary with an animated tooltip. The "Stock" chip was removed, and all component icons were unified onto a single light tile theme matching the node body colour — so a menu tile previews how the component will look once placed. Previously math, input/output and logic icons each looked different.
- **Composite Components:** Group a selection into a named, reusable block (`Ctrl/Cmd + G`) and expand it back to see inside (`Ctrl/Cmd + Shift + G`). These are true nested sub-circuits — each instance keeps its own internal state, blocks can contain other blocks, and definitions are saved with the circuit.
- **Copy / Cut / Paste / Duplicate:** Reuse parts of a circuit with their internal wiring intact (`Ctrl/Cmd + C / X / V / D`). Paste lands under the cursor, carries node configuration and Switch state, and selects the result so it can be dragged immediately. Wires to components outside the selection are deliberately not copied.
- **Undo/Redo Shortcuts:** `Ctrl/Cmd + Z` and `Ctrl/Cmd + Y` now work. They were documented but had never been bound — undo and redo were toolbar-only.
- **UI Overhaul:** The landing page now shares the simulator's design system — dark Stormworks palette, a top bar mirroring the simulator's, chunky inset-shadow buttons, and matching dropdown/modal panels. Previously it used a bright blue gradient that clashed with the dark editor chrome.
- **Components Button:** The component menu can now be opened from a top-bar button instead of only the `TAB` key, and `Escape` closes it.
- **Motion Pass:** Shared easing and duration tokens, a staggered component-menu entrance, springy control feedback, node drop-in, and panel entrance animations — with full `prefers-reduced-motion` support.
- **Fixed:** The minimap no longer goes blank when a component is placed. Node positions were never recorded on the internal data model at creation, so the map's world bounds evaluated to `NaN` and nothing was drawn — including the viewport indicator — until a node happened to be dragged.
- Minimap now renders at device pixel ratio for crisp output on high-density displays, frames the viewport alongside the nodes so the indicator is always visible, and corrects a small click-to-pan offset caused by the canvas border.
- **Settings now persist** across reloads (zoom sensitivity, pan sensitivity, snap to grid, dark mode), with the theme applied before first paint to avoid a flash.
- **Unsaved changes warning** added, so a refresh can no longer silently discard a circuit.
- Fixed four double-encoded characters that rendered as garbled text (`√`, `🎉`, `🎯`, `©`).

### March 22, 2026 Update Snapshot
- Added a dedicated **Account Dashboard** page for username, password, avatar, and account deletion management.
- Added a **Home button** in simulator top bar (next to Settings) to return to landing page without refresh.
- Improved signed-out UX by keeping cloud management entry visible in a **locked/blurred** state.
- Upgraded tutorial flow with mission-style guidance, animated feedback, and media fallback behavior.
- Standardized feature/tutorial media references to `assets/videos/*.mp4`.
- Applied responsive tuning for 1080p screens and save modal layout.

---

## 1. Component Library
The project features a comprehensive library of components ranging from basic logic gates to advanced mathematical functions.

### Logic Gates
- **Basic:** AND, OR, NOT, XOR, NAND, NOR, XNOR.
- **Utility:**
  - **Buffer:** Passes signal unchanged.
  - **Tri-State:** Controlled buffer (High-Z simulation).
  - **Threshold:** Outputs ON if input is within a configurable range (Min/Max).
  - **Numerical Switchbox:** Switches between two numerical inputs based on a boolean control signal.

### Input / Output
- **Switch:** Manual toggle switch for Boolean input (ON/OFF). Supports **Hotkeys**.
- **Lever:** Slider-configurable numerical input. Features **Min/Max limits**, **Hotkeys** (Up/Down), and **Curve/Direct control modes**.
- **Constant:** Outputs a fixed, configurable numerical value.
- **Light:** Visual indicator that glows when receiving a signal.
- **Dial:** Displays numerical values on a digital readout.
- **Bar Graph:** Visual meter that fills based on value (0-100%). Features configurable **Min/Max** range and hover value tooltip.

### Math Gates
Performs operations on numerical signals (Green wires).
- **Arithmetic:** ADD, SUB, MUL, DIV, MOD (Modulo).
- **Functions:** POW (Power), SQRT (Square Root), ABS (Absolute), NEG (Negate).
- **Rounding:** ROUND, FLOOR, CEIL.
- **Comparison:** Equal, Greater Than, Less Than.
- **Range:** MIN, MAX, CLAMP.
- **Function Gate:** Programmable gate where users can enter custom JS-like formulas (e.g., `x * 2 + 1`).

### Memory & State
- **Flip-Flops:** SR Latch, D Flip-Flop, JK Flip-Flop, T Flip-Flop.
- **Memory Register:** Stores a numerical value on a rising edge trigger.
- **Counters:**
  - **Counter:** Simple up-counter.
  - **Up/Down Counter:** Bidirectional counter.
  - **Timer:** Measures time in ticks.

### Signal Utilities
- **Delay:** Outputs the input signal after N ticks.
- **Pulse:** Generates a single-tick pulse on a rising edge.
- **Debounce:** Filters rapid signal changes to prevent noise.
- **Random:** Generates random numbers within a range.

---

## 2. Visual Interface
The interface is designed for clarity and ease of use, featuring a "blueprint" aesthetic with a Stormworks-inspired theme.

- **Landing Page:**
  - **Comprehensive Authentication:** Integrated Supabase Auth for Google Login and Email/Password registration, featuring real-time alphanumeric username validation.
  - **Integrated Cloud Management:** "Save to Cloud" and "Load from Cloud" buttons available directly in the main editor.
  - **Animated Background:** A blurred, generative circuit grid with moving signals.
  - **Interactive Logo:** The "Node" text jumps and emits wire particles on hover, while "CRAFT" rumbles with a Minecraft-style wood texture.
  - **Features Showcase:** A dedicated "Features" modal displaying video demos of connection logic, UI, and hotkeys.
  - **Social Integration:** Direct links to Instagram, X, and Discord with brand-specific hover animations.
  - **Bug Reporting:** Prominent, styled bug report icon for easy feedback.
  - **Magnetic Button:** The "Start Designing" button features a long-range magnetic attraction effect.
  - **Transitions:** A seamless CRT-style shutter wipe transitions users from the landing page to the app.
- **Theme:** Brighter blue grid background with contrasting white components.
- **Dark Mode:** Optional dark grayish-blue background (`#2c3e50`) for reduced eye strain, toggleable via settings. The preference is remembered between sessions and applied before first paint, so there is no flash of the light theme on load.
- **Simulator UI Refresh (March 2026):** The in-simulator top bar, TAB menu, quick-access bar, microcontroller menu, and sidebar/modal surfaces were restyled to better match Stormworks references.
- **Unified Theme (August 2026):** The landing page was brought onto the same design tokens as the simulator — dark panel palette, matching top bar, and chunky inset-shadow buttons — replacing the bright blue gradient it previously used. The Minecraft "CRAFT" wordmark was kept as product identity.
- **Motion:** A shared set of easing and duration tokens drives menu, panel, node, and control animations, so timing feels consistent across the app. Honours the OS "reduce motion" setting.
- **Visuals:**
  - **SVG rendering** for crisp icons and smooth Bezier curve wires.
  - **Animated Wires:** Wires animate with a "flowing" effect when carrying a signal (Red for active Boolean, Green for non-zero Number).
  - **Pin Styling:** Color-coded pins (Red for Boolean, Green for Number) for easy identification.
  - **Selection:** "Marching ants" animation for selected nodes.

---

## 3. Interaction & Usability

### Core Editing
- **Drag & Drop:** Smooth dragging with "Snap to Grid" support (toggleable).
- **Wiring:** Click-and-drag to connect pins.
  - **Type Safety:** Prevents connecting incompatible pins (Boolean to Number).
  - **Auto-Routing:** Smooth Bezier curves automatically adjust as nodes move.
  - **Deleting Wires:** Dragging a wire between already connected pins disconnects them.
- **Selection:** Box selection (drag background) and multi-select (Shift+Click). Move multiple nodes at once.
- **Composite Blocks:** Group a selection into a reusable block (`Ctrl/Cmd + G`), or expand one back into its parts (`Ctrl/Cmd + Shift + G`). The block's input and output pins are derived from the connections the selection needed: an input for every inner pin with no internal driver, an output for every inner pin that feeds the outside or nothing at all. Each instance simulates its own copy of the inner circuit, so two instances of a counter block count independently, and blocks may be nested. Input controls (Switch, Lever) cannot live inside a block, since a block has no way to expose an interactive control.
- **Clipboard:** Copy (`Ctrl/Cmd + C`), cut (`Ctrl/Cmd + X`), paste (`Ctrl/Cmd + V`), and duplicate (`Ctrl/Cmd + D`) a selection. Wiring between selected components is preserved; wiring to components outside the selection is not carried, since it has no counterpart in the copy. Paste lands at the cursor and respects Snap to Grid.
- **Delete Mode:** Dedicated mode (top-bar delete-mode button or Delete key) to click-delete nodes and wires.
- **Deprecated Trashbin Removal:** The old bottom-right drag-to-trash UI was removed.

### Configuration
- **Sidebar:** Double-click any configurable node (or click the gear icon) to open the settings sidebar.
- **Renameable Components:** Custom labels (Max 23 chars) for Switches, Levers, Lights, Dials, etc., with dynamic font scaling.
- **Parameters:** Adjust values like Threshold ranges, Lever values, Delay ticks, and Math formulas.

### Navigation
- **Infinite Canvas:** Pan (Middle Mouse or Two-finger scroll) and Zoom (Scroll wheel or Pinch) freely.
- **Minimap:** A real-time navigation aid in the top-right showing the entire circuit layout. Click to jump to location. Scales to frame both the circuit and the current viewport, and renders at device pixel ratio for crisp output on high-density displays.

### Menus & Shortcuts
- **Component Menu:** Full-screen overlay with search functionality and detailed descriptions/truth tables. Opened from the **top-bar Components button** or the `TAB` key, and closed with `TAB` or `Escape`. Tiles cascade in on a short stagger, share a single unified icon theme (light tile matching the node body, category shown by ring colour), and reveal an animated tooltip with the component's name and a one-line summary on hover.
- **Right-Click Context Menu:** Group/ungroup blocks, open block details, and copy/cut/duplicate/delete from the canvas; paste and select-all on empty space. Shows keyboard equivalents alongside each action. While open, simulator UI layers blur; the quick-access bar sits behind and blurs, then pops forward/unblurs while dragging components to assign slots.
- **Quick Access Bar:** 10 slots (Keys 1-0) for frequently used components. Drag from menu to assign.
- **Microcontroller Management Menu:** A high-density submenu inspired by Stormworks for managing cloud-saved circuits. Includes a visual grid (now supporting custom drawn thumbnails), a live search, a dedicated **Save Circuit Modal** with a drawing canvas for thumbnails, and a sliding right-hand **Details Panel** for viewing circuit descriptions and metadata before loading. The top-bar menu button now uses a folder icon.
- **Home Button:** New top-bar Home control beside Settings returns the user to landing page with the existing shutter transition, without reloading the app.
- **Undo/Redo:** Full history support for all actions.

### Settings & Session Safety
- **Settings Modal:** Gear icon in the top bar exposes Zoom Sensitivity, Pan Sensitivity, Snap to Grid, and Dark Mode.
- **Persistence:** All four settings are stored in browser localStorage and restored on load, including slider positions and toggle labels.
- **Unsaved Changes Warning:** Refreshing or closing the tab with unsaved work on the board prompts for confirmation. The prompt is suppressed on an empty board and after a save, load, or New Circuit. This is a warning only — periodic auto-save and recovery remain planned.

### Tutorial
- **Interactive Guide:** Step-by-step tutorial for new users, featuring animated ghosts, confetti rewards, and hands-on tasks.
- **Mission Flow:** Includes guided/fast modes, contextual hints, progress states, and robust fallback if tutorial media is missing.

---

## 6. Account & Authentication Experience
- **Authentication:** Google OAuth + Email/Password via Supabase Auth.
- **Account Dropdown States:**
  - Signed out: login/register actions + cloud lock messaging.
  - Signed in: account button, logout, and account settings shortcut.
- **Account Dashboard (`account.html`):**
  - Update username
  - Update password
  - Update avatar URL (`http(s)` or `data:image`)
  - Permanently delete account
- **Backend Support:** Supabase RPC `delete_my_account()` migration added for safe self-deletion flow.

---

## 4. Simulation Engine
- **Real-Time:** The circuit simulates instantly as you build.
- **Hybrid Signals:** Supports both Boolean (True/False) and Numerical (Float) types.
- **Propagation:** Logic propagates through wires and gates with support for feedback loops (via memory components).
- **Probes:** Hover over any wire to see its live value (Boolean state or exact Number).

---

## 5. Technical Stack
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Architecture:** Modular ES6 design (Simulation, Rendering, Wiring, Interaction separated).
- **No Dependencies:** Built entirely without external libraries or frameworks.
