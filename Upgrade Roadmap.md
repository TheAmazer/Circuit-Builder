# Professional Workflow & CircuitVerse Feature Specification

## Overview
This document outlines the professional feature set required to elevate **NodeCraft** from a visual circuit simulator into an industry-standard educational and engineering logic design suite[cite: 2]. 

By analyzing **CircuitVerse**—a benchmark browser-based digital logic simulator—this roadmap defines the essential core engine enhancements, analysis tools, advanced component suites, and usability features needed for a professional workflow.

---

## 1. Core Engine & Simulation Enhancements

To support complex digital logic (e.g., CPUs, ALUs, memory systems), the underlying simulation engine must expand beyond single-bit Booleans and floating-point numbers[cite: 2].

### Multi-Bit Bus Systems
* **Dynamic Bit-Widths (1–32 Bits):** Allow components (gates, inputs, outputs) to configure bit-width (e.g., 8-bit, 16-bit, 32-bit data buses)[cite: 3].
* **Bus Splitters & Joiners:** Components to split a multi-bit bundle into individual bit wires or combine single wires into a multi-bit bus.
* **Bus Color-Coding:** Wires change appearance based on bit-width, active signal state, high-impedance (Z), or conflict errors (X).

### Advanced Signal States
* **4-State Logic Engine:**
  * **0 (Low / False)**
  * **1 (High / True)**
  * **Z (High Impedance / Tri-State / Disconnected)**
  * **X (Error / Contention / Contradiction)**
* **Bus Contention Detection:** Signal short-circuit detection when two opposing outputs drive the same line without a Tri-State buffer.

### Nested Sub-Circuits (Custom ICs)
* **Sub-Circuit Creation:** Group sub-diagrams into reusable custom chips (IC nodes) with defined input/output pins[cite: 3].
* **Hierarchical Nesting:** Support placing sub-circuits inside other sub-circuits with infinite recursion protection.
* **Custom Sub-Circuit Layout Editor:** Visual interface to rearrange pin locations on the border of a sub-circuit box.

---

## 2. Analysis & Professional Verification Tools

Professional workflows require formal verification, waveform analysis, and automated logic synthesis.

### Circuit-Wide Truth Table Generator
* **Whole-Circuit Evaluation:** Analyze the active circuit layout and generate a complete truth table for all primary inputs and outputs[cite: 3].
* **Interactive Evaluation:** Click any state in the generated truth table to test that exact input vector on the live workspace.

### Combinational Analysis Engine
* **Logic Synthesis:** Input a truth table or Boolean expression (e.g., `Y = (A AND B) OR NOT C`) and automatically generate the optimized gate layout.
* **K-Map Optimization:** Built-in Karnaugh Map (K-Map) and Quine-McCluskey solvers to minimize logic functions before generating gates.

### Timing Diagram & Waveform Scope
* **Logic Analyzer View:** A bottom panel displaying live waveforms of selected signals across simulation ticks[cite: 3].
* **Clock Sync:** Trace propagation delays, clock pulse transitions, and glitch states across memory components.

---

## 3. Advanced Component Library

Adding specialized input, output, and storage components to complement standard logic gates.

| Category | Component Name | Description & Professional Utility |
| :--- | :--- | :--- |
| **Wiring** | **Tunnel / Net Label** | Connect signals "wirelessly" across long distances by matching label names. |
| **Displays** | **7-Segment Display** | Visual readout for 4-bit BCD (Binary-Coded Decimal) numbers[cite: 3]. |
| **Displays** | **Hex Display** | 16-state single-digit hexadecimal readout with internal decoder[cite: 3]. |
| **Displays** | **LED Matrix (8x8)** | Grid display for complex visual outputs, character rendering, and games[cite: 3]. |
| **Displays** | **RGB Lamp** | Multi-pin or multi-bit input component to control Red, Green, Blue channels[cite: 3]. |
| **Storage** | **RAM (Random Access Memory)** | Addressable memory block with read/write enable lines and configurable data/address bit-widths. |
| **Storage** | **ROM (Read-Only Memory)** | Pre-programmable hex memory data block for microcode and lookup tables. |
| **Control** | **Clock Generator** | Oscillating clock source with configurable frequency[cite: 3]. |
| **Input** | **Keypad** | Enter multi-digit numbers via keypad interface[cite: 3]. |

---

## 4. UI, UX & CAD Editing Capabilities

Professional circuit designers require precise navigation, rapid editing shortcuts, and export options.

### Wire Management & CAD Controls
* **Manual Wire Waypoints:** Ability to click on a wire to add anchor points for neat 90-degree orthogonal routing[cite: 3].
* **Auto-Routing Engine:** Intelligent wire pathing around gates to prevent overlap and visual clutter.
* **Color-Coded Skins:** Let users customize component colors for visual organization[cite: 3].

### Clipboard Operations
* **Copy / Paste:** Full `Ctrl+C` and `Ctrl+V` support for duplicating selected gates with their connections[cite: 3].
* **Duplicate:** Instant duplication with offset placement.

### Export & Documentation Options
* **High-Resolution Vector Export:** Download circuit as a shareable image or SVG for academic papers and documentation[cite: 3].
* **Embed Code Generator:** Generate responsive HTML `<iframe>` embed code to view and interact with built circuits on external websites.

---

## 5. Implementation Phasing Strategy

To maintain a smooth development cycle, implementations should occur in three distinct phases:

### **Phase 1: Workflow Essentials (UI & Engine)**
1. Implement Copy/Paste logic[cite: 3].
2. Implement **Tunnels / Net Labels** for cleaner diagrams.
3. Add **7-Segment** and **Hex Displays**[cite: 3].
4. Add high-res **SVG/Image Export** support[cite: 3].

### **Phase 2: Advanced Digital Logic (Sub-circuits & Buses)**
1. Implement 4-state logic handling (Z and X handling).
2. Build **Multi-Bit Bus support** with splitters and joiners[cite: 3].
3. Build the **Composite Components** system (Grouping circuits into reusable custom nodes)[cite: 3].
4. Add **RAM & ROM** components.

### **Phase 3: Professional Verification Suite**
1. Build the **Circuit-Wide Truth Table Generator**[cite: 3].
2. Integrate the **Combinational Analysis Engine** (K-Map reduction & auto-gate generation).
3. Build the **Timing Diagrams** bottom panel[cite: 3].