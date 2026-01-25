# Logic Gate Circuit Builder - Project Description

## Overview
The Logic Gate Circuit Builder is a web-based visual simulation tool inspired by the Stormworks microcontroller editor. It allows users to design, build, and simulate complex logic circuits directly in the browser using a modern, drag-and-drop interface. The application supports both boolean logic and numerical (floating-point) signal processing.

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
The interface is designed for clarity and ease of use, featuring a "blueprint" aesthetic.

- **Theme:** Brighter blue grid background with contrasting white components.
- **Dark Mode:** Optional dark grayish-blue background (`#2c3e50`) for reduced eye strain, toggleable via settings.
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
- **Delete Mode:** Dedicated mode (Trash icon or Delete key) to click-delete nodes and wires.

### Configuration
- **Sidebar:** Double-click any configurable node (or click the gear icon) to open the settings sidebar.
- **Renameable Components:** Custom labels (Max 23 chars) for Switches, Levers, Lights, Dials, etc., with dynamic font scaling.
- **Parameters:** Adjust values like Threshold ranges, Lever values, Delay ticks, and Math formulas.

### Navigation
- **Infinite Canvas:** Pan (Middle Mouse or Two-finger scroll) and Zoom (Scroll wheel or Pinch) freely.
- **Minimap:** A real-time navigation aid in the top-right showing the entire circuit layout. Click to jump to location.

### Menus & Shortcuts
- **Component Menu (TAB):** Full-screen overlay with search functionality and detailed descriptions/truth tables.
- **Quick Access Bar:** 10 slots (Keys 1-0) for frequently used components. Drag from menu to assign.
- **Undo/Redo:** Full history support for all actions.
- **Save/Load:** Export circuits to `.logic` JSON files and import them back.

### Tutorial
- **Interactive Guide:** Step-by-step tutorial for new users, featuring animated ghosts, confetti rewards, and hands-on tasks.

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
