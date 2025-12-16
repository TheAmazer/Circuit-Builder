# Logic Gate Circuit Builder

A web-based circuit designer inspired by Stormworks microcontroller editor.

## Features
- **Drag & Drop Interface**: Easily place components from the toolbar.
- **Visual Wiring**: Connect components using smooth Bezier curves (Red for boolean signals).
- **Real-time Simulation**: Interaction with switches instantly updates the circuit state (Lights/Output).
- **Stormworks Aesthetic**: Dark grid theme and node styling.

## Getting Started
1. Open `index.html` in any modern web browser (Chrome, Firefox, Edge).
2. No installation required.

## How to Use
1. **Add Components**: Drag items (AND, OR, Switch, Light, etc.) from the left toolbar onto the grid.
2. **Move Components**: Click and drag the header of any node to move it.
3. **Connect Wires**:
   - Click and drag from an **Output Pin** (Right side of node).
   - Drop onto an **Input Pin** (Left side of node).
   - *Note: Inputs can only have one connection. Outputs can have multiple.*
4. **Interact**:
   - Click the **Switch** toggle to send an On (True) signal.
   - Watch the **Light** nodes turn yellow when they receive an On signal.
5. **Delete Wire**: Click on any wire to remove it (requires confirmation).
6. **Clear**: Use the "Clear Board" button to reset.

## Future Plans
- Number and Composite signal types (Green/Purple wires).
- Save/Load functionality.
- Export to Executable (using Electron/Tauri).
