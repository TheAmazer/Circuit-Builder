<h1 align="center" style="font-size:56px;margin:18px 0;color:#0a84ff;text-shadow:0 2px 8px rgba(10,132,255,0.16);">
  NodeCraft
</h1>

<p align="center" style="margin-top:-8px;font-size:17px;color:#556675;">
  <strong>Build logic circuits the way you would build with blocks.</strong><br>
  A browser-based digital logic simulator with a Stormworks-inspired workshop feel &mdash; and an assistant that can build, test and fix circuits alongside you.
</p>

<p align="center">
  <a href="https://circuitbuilder-omega.vercel.app/"><strong>&#9654; Open NodeCraft</strong></a>
  &nbsp;&middot;&nbsp;
  <a href="#what-you-can-do">Features</a>
  &nbsp;&middot;&nbsp;
  <a href="#getting-started">Run it locally</a>
</p>

---

## What is it

NodeCraft turns digital logic into something you can pick up and play with. Drag gates onto an infinite canvas, wire them together, flip a switch and watch the signal travel. Red wires carry on/off, green wires carry numbers, and the whole circuit simulates live as you build.

It is aimed at people learning how computers actually work — but it does not stop at the basics. Group a working circuit into a reusable chip, nest chips inside other chips, and build an adder out of gates, then something larger out of adders.

**Try it: [circuitbuilder-omega.vercel.app](https://circuitbuilder-omega.vercel.app/)** — no install, no account needed.

## What you can do

**Build.** Fifty-odd components: logic gates, flip-flops and registers, arithmetic and comparison, a programmable function gate, timers, a free-running clock, and displays from simple lamps to bar graphs. Wire them by dragging pin to pin; the simulator refuses connections that would not make sense.

**Package.** Select any working circuit and press `Ctrl+G` to turn it into a named block with its own pins. Blocks are real nested sub-circuits, not drawings — each copy keeps its own internal state, and blocks can contain other blocks. Expand one at any time to see what is inside.

**Ask.** Describe what you want and the assistant builds it, component by component, in front of you. Ask what a circuit does and it reads the board, runs a truth table, and explains it in plain language. Point it at something broken and it finds the faulty gate and replaces it. It checks its own work against the simulator before telling you it is done.

**Verify.** Any circuit can be swept across every combination of its inputs to produce a truth table — the same mechanism the assistant uses to prove its work.

**Keep.** Save circuits to the cloud with a hand-drawn thumbnail, reload them anywhere, and pick up where you left off.

---

## Table of contents
- [Highlights](#highlights)
- [Run it](#run-it)
- [Features](#features)
- [Getting started](#getting-started)
- [How to use](#how-to-use)
  - [Add components](#add-components)
  - [Move & select](#move--select)
  - [Copy & reuse](#copy--reuse)
  - [Build a reusable block](#build-a-reusable-block)
  - [Connect & edit wires](#connect--edit-wires)
  - [Configure gates](#configure-gates)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Tutorial & learning](#tutorial--learning)
- [Future plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

---

## Highlights
- **Latest Update (August 7, 2026):** **AI assistant** — build, analyse and correct circuits from a single prompt, with the agent verifying its own work against the simulator.
- **Simulation Tick (August 7, 2026):** A real fixed-rate tick with Run/Pause and Step, a new Clock component, and a fix for Timer/Delay/Debounce running up to 20x too fast.
- **UI (August 7, 2026):** Right-click context menu, a block create/edit dialog with editable pin names, and TAB menu polish — hover tooltips, unified component icons.
- **Composite Components (August 7, 2026):** Group a selection into a reusable block that simulates as a real nested sub-circuit, and expand it back to see inside.
- **Clipboard (August 7, 2026):** Copy/cut/paste/duplicate for selected components (wiring included), plus working undo/redo keyboard shortcuts.
- **UI Overhaul (August 7, 2026):** Landing page restyled onto the simulator's design system, a Components button added to the top bar, and a motion pass across the UI.
- **Bug-fix pass (August 7, 2026):** The minimap now renders correctly (it previously went blank as soon as a component was placed), settings persist across reloads, and an unsaved-changes warning prevents losing a circuit to an accidental refresh.
- **Account Dashboard (March 22, 2026):** Username, password, avatar URL update, and permanent account deletion flow.
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
- Built with plain modern JavaScript — no build step required.

---

## Run it

**Hosted:** [circuitbuilder-omega.vercel.app](https://circuitbuilder-omega.vercel.app/) — nothing to install.

**Locally**, use the bundled dev server. A plain static server works for the simulator, but cannot run the `/api` function the assistant needs:

```bash
node tools/dev-server.mjs
```

Then open `http://localhost:4321`. See [AI Assistant setup](#ai-assistant-setup) for the API key.

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
  - **Unified Stormworks Theme (August 2026):** The landing page now shares the simulator's design tokens — dark panel palette, matching top bar, and chunky inset-shadow buttons — so the app reads as one system end to end.
  - **Motion Pass (August 2026):** Shared easing/duration tokens, staggered component-menu entrance, springy control feedback, node drop-in, and full `prefers-reduced-motion` support.
  - **Simulator-Only Stormworks Pass (March 2026):** Simulator workspace updated with Stormworks-style top bar controls, compact panel geometry, and refined in-canvas node colors. (Superseded for the landing page by the August 2026 pass above.)
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
  - Smooth Bézier wires
  - Color-coded signal paths (Red = Boolean, Green = Numeric)
  - Animated "flow" on active wires
- **Real-time Simulation**
  - Immediate propagation of logic states and numerical values
- Configuration & Controls
  - Gate parameter editing (min/max, formulas, reset values)
  - Undo / Redo (toolbar buttons or `Ctrl/Cmd + Z` / `Ctrl/Cmd + Y`)
  - **Copy / Cut / Paste / Duplicate:** Reuse parts of a circuit with their internal wiring intact. Pastes under the cursor, carries configuration and Switch state, and selects the result so it can be dragged straight away.
  - **AI Assistant:** Describe a circuit and it builds one, or ask what the current board does. It reads the circuit as structured data, places and wires components, then runs a truth table to check its own work before reporting back. Sign-in gated; the API key stays server-side.
  - **Clock & Simulation Control:** A free-running Clock component with a configurable period, plus Run/Pause and Step-one-tick in the top bar.
  - **Composite Components:** Group a selection into a named block (`Ctrl/Cmd + G`, or right-click → Group into Block) that behaves as a single component, and expand it again (`Ctrl/Cmd + Shift + G`) to see what it is made of. Blocks are true nested sub-circuits — each instance keeps its own internal state, and blocks can contain other blocks. Definitions are saved with the circuit.
  - **Block Dialog:** Name a block, give it a description, and rename its input and output pins. Shows what the selection will become (component and pin counts) before you commit. Reopen any time with right-click → Block Details.
  - **Right-Click Context Menu:** Group, ungroup, copy, cut, duplicate and delete from the canvas, with paste and select-all on empty space.
  - **Component Hover Tooltips:** Hovering a tile in the TAB menu shows its name and a one-line summary, so the library can be scanned without clicking through it.
  - **Persistent Settings:** Zoom sensitivity, pan sensitivity, snap-to-grid, and dark mode are remembered between sessions
  - **Unsaved Changes Warning:** Prompts before you refresh or close with unsaved work on the board
  - **Minimap:** Live overview of the whole circuit with a click-to-pan viewport indicator, rendered crisply on high-DPI displays
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
- Click the **Components** button in the top bar, or press `TAB`, to open the full-screen component menu.
- Press `Esc` (or `TAB` again) to close it.
- Use the Quick Access Bar (keys `1`–`0`) for frequently used components.
- Drag components from the menu onto the canvas.

### Move & select
- Drag node headers to reposition a node.
- Click-and-drag a selection box to select and move multiple nodes.

### Copy & reuse
- Select one or more components, then `Ctrl/Cmd + C` to copy or `Ctrl/Cmd + X` to cut.
- `Ctrl/Cmd + V` pastes at the cursor; `Ctrl/Cmd + D` duplicates in place.
- Wires between selected components come along; wires to components outside the selection do not.

### Build a reusable block
- Select the components you want to bundle, then press `Ctrl/Cmd + G` — or right-click the selection and choose **Group into Block**.
- Name the block, add a description, and rename its pins (`A`, `B`, `Sum`, `Carry` rather than `XOR in 1`). The dialog shows how many pins the block will have before you commit.
- Right-click a block and choose **Block Details** to rename it or its pins later. Changes apply to every instance.
- The selection is replaced by a single block wired to the rest of your circuit. Its input and output pins are worked out from the connections the selection needed.
- Select a block and press `Ctrl/Cmd + Shift + G` to expand it back into its parts.
- Copy/paste a block to place another instance. Each instance has its own internal state, so two copies of a counter block count independently.
- Input controls (Switches and Levers) can't live inside a block — leave them outside and wire them to the block's inputs.

### Connect & edit wires
- Click and drag from an Output pin (right side) to an Input pin (left side).
- Dragging a connection between already-connected pins will toggle (delete) the connection.

### Configure gates
- Double-click a node or click the gear icon to open the Sidebar editor.
- Edit parameters such as min/max values, custom formulas, and memory reset values.

---

## Keyboard shortcuts
- TAB — Open/close component menu (or use the top-bar Components button)
- Esc — Close the component menu, settings, or sidebar; exit Delete Mode
- 1–0 — Quick access bar slots
- Ctrl/Cmd + C / X / V — Copy, cut, paste selected components (pastes at the cursor, keeping internal wiring)
- Ctrl/Cmd + D — Duplicate the selection in place
- Ctrl/Cmd + G — Group the selection into a reusable block
- Ctrl/Cmd + Shift + G — Ungroup the selected block back into its components
- Ctrl/Cmd + Z — Undo
- Ctrl/Cmd + Y / Shift + Ctrl/Cmd + Z — Redo
- Delete / Backspace — Remove selected components or wires
- Double-click node — Open configuration sidebar

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
- Verification for sequential circuits (clocks, flip-flops) — the truth-table sweep only proves combinational logic.
- Auto-save and recovery to localStorage (the current unsaved-changes prompt is a warning only).
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



---

## AI Assistant setup

The assistant is optional — the simulator works without it. To enable it you need an API key from any supported provider.

### Providers

| `AGENT_PROVIDER` | Notes |
| --- | --- |
| `openrouter` | Has free models that support tool calling. Default. |
| `gemini` | Google AI Studio key. Free tier available. |
| `grok` | xAI key. |

### Local development

The static file servers can't run the `/api` function, so use the bundled dev server:

```bash
node tools/dev-server.mjs
```

Create `.env.local` in the project root (git-ignored):

```
AGENT_API_KEY=your-key
AGENT_PROVIDER=openrouter
AGENT_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
AGENT_ALLOW_ANON=1
```

`AGENT_ALLOW_ANON` skips the sign-in gate for local testing. It is ignored whenever the `VERCEL` environment variable is set, so it cannot take effect in a deployment.

### Deployment (Vercel)

Set `AGENT_API_KEY`, `AGENT_PROVIDER` and `AGENT_MODEL` under Settings → Environment Variables, then redeploy. Do not set `AGENT_ALLOW_ANON`.

### Choosing a model

The assistant needs **tool calling**, and not every model that advertises it follows a multi-step task through to the end. `openai/gpt-oss-20b:free` places components and then abandons the task without wiring or verifying; `nvidia/nemotron-3-ultra-550b-a55b:free` completes the full sequence. Test a candidate with a build prompt before committing to it.

Free tiers are rate-limited per minute. A build is about four model calls, which normally stays inside the limit, but concurrent users will queue.
