# Logic Gate Circuit Builder

A web-based visual circuit designer inspired by Stormworks microcontroller editor.

## Project Overview
This project allows users to design and simulate logic circuits directly in the browser. It features a drag-and-drop interface, real-time logic simulation, and a user experience modeled after the Stormworks game editor.

## Features implemented
- **Component Library:** AND, OR, NOT, XOR gates, Switches, and Lights.
- **Memory Components:** SR Latch, D Flip-Flop, JK Flip-Flop, T Flip-Flop, and **Memory Register** (stores a numerical value, with Set and Clear signals).
- **Number System Support:** Wires can now carry numerical (floating-point) values. Logic gates interpret values > 0 as ON.
- **Math Gates:** ADD, SUB (Subtract), MUL (Multiply), DIV (Divide), **Equal**, **Greater Than**, **Less Than** gates for numerical operations.
- **Function Gate:** A programmable math gate where users can enter custom formulas (e.g., `x * 2 + 1`).
- **Utility Gates:** **Numerical Switchbox** (switches between two numerical inputs based on a boolean control signal).
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
  - **Gate Tooltips:** Hovering over a gate's header in the workspace displays its description.
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
  - **Component Menu:** Full-screen overlay (TAB) with descriptions, now features a **smooth animated opening/closing** without darkening the background.
  - **Configurable Gates:** Gates like Threshold, Function, Lever, and Memory Register now display their configured values directly on the node. To edit these values, click the small gear icon in the top-right corner of the node or double-click the node to open a **sidebar**. The sidebar allows easy modification of parameters (Min/Max, Formula, Value, Reset Value).
  - **Navigation:** Infinite canvas panning (Middle Mouse Button).
  - **Selection:** Drag-box selection and multi-move capability.
  - **Editing:** Delete nodes via Trash Bin (Drag to bottom right) or Delete key. **Dragging a wire between already connected pins will now toggle (delete) the connection.**
  - **Save/Load:** Save circuits to a `.logic` file and load them back.
  - **Undo/Redo:** Full history support for circuit changes.
  - **Improved Drag & Drop:** Enhanced dragging stability for nodes and wiring, preventing "sticky" behavior and ensuring reliable connections.
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
