<!-- Large, prominent heading with graceful fallback -->
<h1 align="center" style="font-size:56px;margin:18px 0;color:#0a84ff;text-shadow:0 2px 8px rgba(10,132,255,0.16);">
  Circuit Builder
</h1>

<p align="center" style="margin-top:-8px;font-size:16px;color:#556675;">
  A lightweight, web-based logic- and math-circuit designer inspired by the Stormworks microcontroller editor.
</p>

---

## Table of contents
- [Highlights](#highlights)
- [Quick demo](#quick-demo)
- [Features](#features)
- [Getting started](#getting-started)
- [How to use](#how-to-use)
  - [Add components](#add-components)
  - [Move & select](#move--select)
  - [Connect & edit wires](#connect--edit-wires)
  - [Configure gates](#configure-gates)
- [File format & persistence](#file-format--persistence)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Tutorial & learning](#tutorial--learning)
- [Future plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

---

## Highlights
- Intuitive drag-and-drop editor with an infinite canvas and bright Stormworks-like aesthetic.
- Real-time simulation with animated flowing wires to show active signals.
- Mixed-signal support: Boolean signals (red) and numerical signals (green).
- Built with plain modern JavaScript — no build step required.

---

## Quick demo
Open `index.html` in any modern browser (Chrome, Firefox, Edge) to try the app locally — no installation required.

---

## Features
- Drag & Drop Interface
  - Logic gates: AND, OR, NOT, XOR
  - Memory components: SR Latch, Flip-Flops, Registers
  - Math gates: ADD, SUB, MUL, DIV
  - Programmable Function Gates for custom math expressions
  - Utility gates: Numerical Switchboxes, Threshold Gates
- Visual Wiring
  - Smooth Bézier wires
  - Color-coded signal paths (Red = Boolean, Green = Numeric)
  - Animated "flow" on active wires
- Real-time Simulation
  - Immediate propagation of logic states and numerical values
- Configuration & Controls
  - Gate parameter editing (min/max, formulas, reset values)
  - Undo / Redo
  - Save / Load (.logic export/import)
- UX & Style
  - Single white-node aesthetic with SVG symbols
  - Bright blue grid background for high contrast

---

## Getting started
1. Clone the repo or download the files.
2. Open `index.html` in your browser.
   - No server, no build tools — just static files.
3. Start building on the canvas.

---

## How to use

### Add components
- Press `TAB` to open the animated full-screen component menu.
- Use the Quick Access Bar (keys `1`–`0`) for frequently used components.
- Drag components from the menu onto the canvas.

### Move & select
- Drag node headers to reposition a node.
- Click-and-drag a selection box to select and move multiple nodes.

### Connect & edit wires
- Click and drag from an Output pin (right side) to an Input pin (left side).
- Dragging a connection between already-connected pins will toggle (delete) the connection.

### Configure gates
- Double-click a node or click the gear icon to open the Sidebar editor.
- Edit parameters such as min/max values, custom formulas, and memory reset values.

---

## File format & persistence
- Save your design to a `.logic` file using the Save function.
- Load `.logic` files back into the app with the Load function to continue editing.

---

## Keyboard shortcuts
- TAB — Open component menu
- 1–0 — Quick access bar slots
- Ctrl/Cmd + Z — Undo
- Ctrl/Cmd + Y / Shift + Ctrl/Cmd + Z — Redo
- Delete / Backspace — Remove selected components or wires
- Double-click node — Open configuration sidebar

(Keyboard bindings are customizable in later versions.)

---

## Tutorial & learning
On first run the app launches an interactive tutorial that walks you through:
- menu navigation
- placing components
- wiring signals
- running a simple example circuit

Complete the tutorial to get comfortable with the editor and tools.

---

## Future plans
- Desktop builds using Electron or Tauri for single-click launch.
- Expanded component library: more memory primitives, composite signal types, and utility modules.
- Community-contributed gates and example designs.

---

## Contributing
Contributions, issues and suggestions are welcome!
- Open an issue to discuss a change or feature.
- Fork the repo, create a branch for a feature/fix, and submit a PR.

Please include screenshots or GIFs for visual changes and a short description of behavior for bug fixes.

---

## License
This project is open source — include your preferred license here (e.g., MIT).  

If you want help adding a LICENSE file or badges, I can propose those as well.
