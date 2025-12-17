# Logic Gate Circuit Builder

A web-based visual circuit designer inspired by Stormworks microcontroller editor.

## Project Overview
This project allows users to design and simulate logic circuits directly in the browser. It features a drag-and-drop interface, real-time logic simulation, and a user experience modeled after the Stormworks game editor.

## Features implemented
- **Component Library:** AND, OR, NOT, XOR gates, Switches, and Lights.
- **Number System Support:** Wires can now carry numerical (floating-point) values. Logic gates interpret values > 0 as ON.
- **Math Gates:** ADD, SUB (Subtract), MUL (Multiply), DIV (Divide) gates for numerical operations.
- **Function Gate:** A programmable math gate where users can enter custom formulas (e.g., `x * 2 + 1`).
- **Lever Input:** A new input component allowing users to set a floating-point value.
- **Dial Output:** A new output component to display numerical values.
- **Threshold Gate:** A logic gate that outputs ON if its numerical input is within a user-defined (Min/Max) range.
- **Visual Interface:**
  - Brighter blue grid theme.
  - Logic gates are now single white boxes with the name at the top center.
  - SVG-based logic symbols.
  - Smooth Bezier curve wiring.
  - White SVG logos for Input/Output components in menus (TAB and Quick Access Bar).
  - **Pin Styling:** Binary (Boolean) pins are Red, Number pins are Green.
  - **Wire Animation:** Active wires (carrying signal/value) have a flowing animation.
- **Interaction:**
  - **Quick Access Bar:** 5 slots for frequent components (Drag from menu to assign).
  - **Component Menu:** Full-screen overlay (TAB) with descriptions.
  - **Navigation:** Infinite canvas panning (Middle Mouse Button).
  - **Selection:** Drag-box selection and multi-move capability.
  - **Editing:** Delete nodes via Trash Bin (Drag to bottom right) or Delete key.
  - **Save/Load:** Save circuits to a `.logic` file and load them back.
  - **Undo/Redo:** Full history support for circuit changes.
- **Simulation:** Instant feedback loop for logic states (Red/Green wires, Light indicators), now with numerical propagation.

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
- Packaging as a standalone executable (Electron/Tauri).
