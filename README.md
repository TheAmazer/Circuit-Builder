<!-- Large, prominent heading with graceful fallback -->
<h1 align="center" style="font-size:56px;margin:18px 0;color:#0a84ff;text-shadow:0 2px 8px rgba(10,132,255,0.16);">
  NodeCraft
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
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Tutorial & learning](#tutorial--learning)
- [Future plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

---

## Highlights
- **Latest Update (March 22, 2026):** Account Dashboard added with username, password, avatar URL update, and permanent account deletion flow.
- **Simulator Navigation Update:** Added a Home button next to Settings to return from simulator to landing page without refreshing.
- **Auth UX Update:** Cloud Save/Load entry remains visible when signed out, with a locked/blurred state and contextual sign-in prompt.
- **Responsive Polish:** Simulator surfaces and save modal tuned for improved 1080p readability and layout balance.
- **Tutorial Upgrade:** Mission-based guided/fast modes, smarter hints, animated feedback, and connection demo fallback handling.
- **Media Structure:** Feature/tutorial videos are now referenced from `assets/videos/*.mp4`.
- **New!** Immersive landing page with CRT-style transition and animated background.
- **Stormworks-inspired UI:** Industrial aesthetic with a playful Minecraft-themed logo.
- **Updated Simulator UI (March 2026):** In-simulator top bar, TAB menu, quick bar, and microcontroller manager were restyled to better match Stormworks references.
- Intuitive drag-and-drop editor with an infinite canvas.
- Real-time simulation with animated flowing wires to show active signals.
- Mixed-signal support: Boolean signals (red) and numerical signals (green).
- Built with plain modern JavaScript â€” no build step required.

---

## Quick demo
Run a local HTTP server and open the app in your browser:

```bash
npx http-server -p 8080 --cors
``` 

Then open `http://localhost:8080/index.html`.

---

## Features
- **UI & UX**
  - **NodeCraft Identity:** Custom logo with a Minecraft-inspired "Crafting Table" texture and interactive particle effects.
  - **Immersive Landing Page:**
    - **Unified Authentication:** Secure login via Google or Email/Password to sync circuits across devices.
    - **User Registration:** Dedicated signup modal with real-time alphanumeric validation, password confirmation validation, and rich UI elements (SVG icons, dark gradient aesthetic).
    - **Password Reset:** Added a "Forgot Password?" link in the sign-in dropdown (functionality to be implemented).
    - **Cloud Storage:** Save and load circuits directly from the cloud using Supabase.
    - **Account Settings Dashboard:** Signed-in users can open a dedicated account page to update username, update password, change avatar URL, or delete account.
    - **Signed-out Cloud Lock State:** Cloud actions remain discoverable but are visually locked until authentication.
    - **Features** modal showcasing video demos of key capabilities.
    - Long-range magnetic "Start Designing" button with physics-based attraction.
    - CRT-style shutter transition effect.
    - Logic-gate themed Account dropdown with circuit decorations.
    - Interactive social media links (Instagram, X, Discord) with brand-color hover effects.
    - Dedicated "Report Bug" icon.
    - Animated background grid with signal traces.
  - "Start Designing" CRT shutter transition.
  - Dark mode and "Stormworks" blue grid theme.
  - **Simulator-Only Stormworks Pass:** Landing page left unchanged; simulator workspace updated with Stormworks-style top bar controls, compact panel geometry, and refined in-canvas node colors.
  - **TAB Menu Focus Mode:** Opening TAB blurs the simulator background and pushes the quick-access hotbar behind the menu.
  - **Smart Hotbar Drop Behavior:** While dragging a component from TAB, the hotbar pops forward and unblurs for drop assignment.
  - **Toolbar Icon Update:** The top-bar microcontroller-management button now uses a folder icon for better visual clarity.
  - **Home Button:** Top-bar Home control (next to Settings) returns users to the landing page via CRT transition, without page reload.
  - **Deprecated UI Removed:** Bottom-right trashbin overlay and drag-to-trash deletion were removed; Delete Mode is now the dedicated delete workflow.
- **Drag & Drop Interface**
  - Logic gates: AND, OR, NOT, XOR
  - Memory components: SR Latch, Flip-Flops, Registers
  - Math gates: ADD, SUB, MUL, DIV
  - Programmable Function Gates for custom math expressions
  - Utility gates: Numerical Switchboxes, Threshold Gates
  - Output displays: Lights, Dials, Bar Graphs
- **Visual Wiring**
  - Smooth BÃ©zier wires
  - Color-coded signal paths (Red = Boolean, Green = Numeric)
  - Animated "flow" on active wires
- **Real-time Simulation**
  - Immediate propagation of logic states and numerical values
- Configuration & Controls
  - Gate parameter editing (min/max, formulas, reset values)
  - Undo / Redo
  - Microcontroller Management Menu (Centralized cloud save/load/search, custom save modal with thumbnail drawing, and sliding details panel)
  - Account Dashboard (`account.html`) for profile and security management
  - Home button for simulator-to-landing navigation without refresh
- UX & Style
  - Single white-node aesthetic with SVG symbols
  - Bright blue grid background for high contrast

---

## Getting started
1. Clone the repo or download the files.
2. Start a local server:
   - `npx http-server -p 8080 --cors`
3. Open `http://localhost:8080/index.html` in your browser.
4. Start building on the canvas.

---

## How to use

### Add components
- Press `TAB` to open the animated full-screen component menu.
- Use the Quick Access Bar (keys `1`â€“`0`) for frequently used components.
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

## Keyboard shortcuts
- TAB â€” Open component menu
- 1â€“0 â€” Quick access bar slots
- Ctrl/Cmd + Z â€” Undo
- Ctrl/Cmd + Y / Shift + Ctrl/Cmd + Z â€” Redo
- Delete / Backspace â€” Remove selected components or wires
- Double-click node â€” Open configuration sidebar

(Keyboard bindings are customizable in later versions.)

---

## Tutorial & learning
The app includes an interactive tutorial that walks you through:
- menu navigation
- placing components
- wiring signals
- running a simple example circuit
- guided and fast learning modes
- mission-style checks with progress feedback and skip controls

For current demo behavior, the tutorial resets on page refresh.

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
This project is open source â€” include your preferred license here (e.g., MIT).  

If you want help adding a LICENSE file or badges, I can propose those as well.


