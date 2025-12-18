Logic Gate Circuit Builder
A web-based circuit designer inspired by Stormworks microcontroller editor.

Features
Drag & Drop Interface: Expanded library including Logic Gates (AND, OR, NOT, XOR), Memory Components (SR Latch, Flip-Flops, Registers), and Math Gates (ADD, SUB, MUL, DIV).

Visual Wiring: Smooth Bezier curves with color-coded signal paths—Red for Boolean and Green for Numerical signals.

Real-time Simulation: Instant feedback loop for logic states with numerical propagation and animated "flowing" wires for active signals.

Advanced Functionality: Programmable Function Gates for custom math formulas and Utility Gates like Numerical Switchboxes and Threshold Gates.

Stormworks Aesthetic: Single white box node styling with SVG symbols on a bright blue infinite grid.

Getting Started
Open index.html in any modern web browser (Chrome, Firefox, Edge).

No installation or build steps required—built with Vanilla JavaScript (ES6+).

How to Use
Add Components: Press TAB to open the animated full-screen menu or use the Quick Access Bar (slots 1-0) to drag items onto the grid.

Move & Select: Click and drag headers to move nodes. Use drag-box selection to move multiple components at once.

Connect & Edit Wires:

Click and drag from an Output Pin (right) to an Input Pin (left).

Dragging a wire between already connected pins will toggle (delete) the connection.

Configure Gates: Double-click a node or click the Gear Icon to open the Sidebar. Modify parameters like Min/Max values, custom formulas, or memory reset values.

Tutorial: Complete the Interactive First-Time Tutorial to learn menu navigation, tool assignment, and component connection.

Manage Progress: Use Undo/Redo for mistakes and Save/Load to export your design as a .logic file.

Future Plans
Standalone Executable: Packaging the app using Electron or Tauri for desktop use.

Enhanced Component Library: Further expansion of composite signal types and complex utility modules.
