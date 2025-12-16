# Logic Gate Circuit Builder

A web-based visual circuit designer inspired by Stormworks microcontroller editor.

## Project Overview
This project allows users to design and simulate logic circuits directly in the browser. It features a drag-and-drop interface, real-time logic simulation, and a user experience modeled after the Stormworks game editor.

## Features implemented
- **Component Library:** AND, OR, NOT, XOR gates, Switches, and Lights.
- **Visual Interface:**
  - Dark grid theme.
  - SVG-based logic symbols.
  - Smooth Bezier curve wiring.
- **Interaction:**
  - **Quick Access Bar:** 5 slots for frequent components (Drag from menu to assign).
  - **Component Menu:** Full-screen overlay (TAB) with descriptions.
  - **Navigation:** Infinite canvas panning (Middle Mouse Button).
  - **Selection:** Drag-box selection and multi-move capability.
  - **Editing:** Delete nodes via Trash Bin (Drag to bottom right) or Delete key.
- **Simulation:** Instant feedback loop for logic states (Red/Green wires, Light indicators).

## Tech Stack
- **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Rendering:** DOM elements for nodes, SVG for wires.
- **No external dependencies.**

## File Structure
- `index.html`: Main structure and container layouts.
- `style.css`: Visual styling, grid, animations, and theme variables.
- `script.js`: Application logic (Node creation, Interaction handling, Simulation loop).

## How to Run
1. Open `index.html` in any modern browser.
2. No build step required.

## Roadmap (Future)
- Number and Composite signal support.
- Save/Load functionality (JSON export).
- Undo/Redo history.
- Packaging as a standalone executable (Electron/Tauri).
