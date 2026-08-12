# Circuit Builder - Change Catalog

This file documents changes made to the Circuit Builder project.

---

## August 7, 2026

### Assistant: Visible Building, and Open Access

**Files Modified:** `scripts/agentTools.js`, `scripts/agent.js`, `api/agent.js`, `css/style.css`, `tools/dev-server.mjs`

**Watching the agent work.** Batching tool calls fixed the rate limits but made a whole circuit appear in a single frame, which reads as a glitch rather than as work. The fix paces the *execution* rather than the requests — components appear one at a time (~150ms apart), wires draw on from source to destination using the path's own length, the board re-lays-out after each placement so parts settle into their columns, and the simulation updates per wire so signals visibly propagate as the circuit closes. A brief amber pulse marks whatever was just touched.

This is local pacing, so **a build is still four model turns** — the delays cost no API calls. Per-item delay shrinks as the batch grows, capped so the whole sequence stays under ~2.6s: a six-gate circuit feels deliberate, a fifty-gate one is not a slideshow. Disabled entirely under `prefers-reduced-motion`. Measured cost: ~1.6s on a build.

**Turn timeout.** A hanging provider request previously left the UI on "Thinking…" indefinitely. Each turn now aborts after 90s with a message naming the likely cause (free-tier capacity for large models queues). Discovered when `nemotron-3-ultra-550b` stopped responding entirely — three probes at 30s, 45s and 60s returned nothing.

**Sign-in gate opened.** The assistant no longer requires an account. The gate is intact rather than removed: `AGENT_REQUIRE_AUTH=1` restores it, and every request still resolves the caller against Supabase even while open, so a signed-in user is *identified* but not *required*. Flipping the flag later enables a path that has been running all along rather than switching on untested code.

Rate limiting was quietly broken by that change — it keyed on `user.id`, which does not exist for an anonymous caller, so everyone would have shared one bucket. It now keys on user id when signed in and forwarded IP otherwise, with separate ceilings: 40 turns/minute signed in, 12 anonymous (a build is ~4). `AGENT_ALLOW_ANON` was removed, superseded by this.

**Accepted risk:** while the gate is open the endpoint spends the provider key for anyone who finds it. `x-forwarded-for` is client-settable, so the limit is a cost guard against runaway loops and casual abuse, not a security control. The mitigation is the flag, not a cleverer IP heuristic.

**Provider note:** Gemini `gemini-flash-latest` completes a build in ~13s versus ~39s on OpenRouter's `nemotron-3-ultra-550b:free`, and proved more reliably available. Gemini is now primary, OpenRouter the fallback.

### AI Assistant (Agentic Framework)
Added a built-in assistant that can create, analyse and correct circuits from a single prompt.

**Files Added:**
- `api/agent.js` - Serverless proxy (Vercel function).
- `scripts/agentTools.js` - Tool definitions, executors, auto-layout, truth-table sweep.
- `scripts/agent.js` - The agent loop and prompt-bar UI.
- `tools/dev-server.mjs` - Local server that runs the real handler, since a static server cannot.

**Files Modified:**
- `index.html` - Prompt bar and top-bar toggle. `scripts/script.js` - Agent API wiring. `css/style.css` - Prompt bar styling. `package.json` - `"type": "module"` for the Vercel function.

**Architecture:**
- **The loop runs in the browser, not the server.** The circuit lives in the tab and the tools mutate it directly, so a client-side loop means no state is shipped anywhere and no serverless timeout applies — each model turn is its own short request. The function is a stateless proxy: verify session, inject key, forward.
- **The key never reaches the client.** NodeCraft is a static site, so an API key in the browser is readable by anyone. It lives only in the deployment's environment.
- **Sign-in gated.** The proxy verifies the caller's token against Supabase's `/auth/v1/user` rather than checking a JWT signature — no secret to hold, and revocation takes effect immediately.
- **Providers sit behind an adapter.** Gemini, OpenRouter and Grok are implemented; each converts a neutral request shape to its own wire format. Switching provider is an environment variable, not a code change.
- **The canvas is passed as structured JSON, not screenshots.** `saveState()` already produces exactly the shape a model needs, so vision is unnecessary — cheaper, and far more reliable for a 30-node board.

**Tools:** `get_circuit`, `list_component_types`, `add_components`, `connect`, `delete_component`, `configure_component`, `run_truth_table`.

**Two decisions that carry the design:**
- **The model never picks coordinates.** Spatial layout is the weakest part of LLM output and hand-placed x/y produces overlapping boards. It emits a graph; `layoutCircuit()` assigns positions by topological depth. Verified: a half adder lands in three clean columns with no overlaps.
- **`run_truth_table` is the point.** Because NodeCraft has a deterministic simulator, the agent can verify its own work — the loop is build → test → fix. Without it this is a plausible-circuit generator. The system prompt requires comparing the table against the request before reporting success.

**Component types are injected into the system prompt** rather than described, so the model cannot invent a part that does not exist.

**Bugs found and fixed during implementation:**
- **Gemini 3.x `thoughtSignature`.** Gemini attaches an opaque signature to each function-call part and rejects the *next* turn with a 400 unless it is echoed back unchanged. It only appears on turn 2+, so every single-call test passed and all seven tool schemas validated — the first multi-turn request was the first thing to hit it. The adapter now round-trips it.
- **Retired model IDs.** `gemini-2.0-flash` no longer exists and the entire 2.5 line returns *"no longer available to new users"* for new keys. Defaulted to the `gemini-flash-latest` alias so a future retirement does not break the integration the same way.
- **Rate limits from unbatched tools.** The agent originally placed one component per turn, making a six-gate circuit ~19 requests and exhausting free-tier per-minute quota. `add_components` and `connect` now take lists; a build is 4 turns. Both report per-item results so one bad entry does not fail the batch.
- **No backoff.** A mid-run 429 killed the run. The proxy now parses the provider's own `retryDelay` and the client waits it out, counting down in the status line.

**Model selection is empirical, not assumed.** Free models were tested against the real tool schemas with a simulated loop: `openai/gpt-oss-20b:free` reliably places components and then abandons the task without wiring or verifying; `nvidia/nemotron-3-ultra-550b-a55b:free` completes the full sequence. That harness is what separated "model cannot follow through" from "the wiring is broken".

**Verification:** From the prompt *"Build a half adder: switches A and B, XOR for Sum and AND for Carry, each driving its own light. Verify it."* — 4 turns, 39 seconds, 6 components, 6 wires, and a correct truth table the agent measured rather than asserted.

**Known limitations:**
- The Supabase sign-in path is unverified; local development uses `AGENT_ALLOW_ANON`, which is ignored whenever `VERCEL` is set and so cannot be enabled in a deployment.
- Free tiers are rate-limited per minute. Four turns per build keeps normal use inside the limit, but concurrent users will queue.
- Sequential circuits (clocks, flip-flops) cannot be verified by a truth-table sweep; only combinational logic is checked automatically.

### Simulation Tick, Clock Component, and Run/Pause
The simulator previously only ran in response to user input, so nothing could oscillate on its own.

**Files Modified:**
- `scripts/simulation.js`, `scripts/script.js`, `scripts/gateDefinitions.js`, `index.html`, `css/style.css`

**Changes:**
- **Fixed-rate tick** at 20 ticks/second, driven by `requestAnimationFrame` with a time accumulator and a catch-up cap, so a backgrounded tab drops its time debt rather than replaying seconds at once.
- **Clock component** — a free-running oscillator with a configurable half-period in ticks. No input required.
- **Run/Pause and Step-one-tick** controls in the top bar; paused reads amber so the state is obvious.

**Bug found: time-based components were advancing per settle pass.**
`updateSimulation` settles combinational logic by re-evaluating every node up to 20 times per call, and `Timer`, `Delay` and `Debounce` advanced on *every pass* — up to 20× too fast. A tick alone would not have fixed this. Time-based components now advance at most once per node per tick, tracked by a tick id; omitting the id marks an event-driven refresh where no simulated time passes, so toggling a switch no longer nudges every Timer forward. Verified: a Timer reads exactly `10.00` after 10 steps and is unchanged by a non-tick update.

**Bug introduced and fixed:** the Clock first stored its level in `memory.state`, which collides with the flip-flop convention — `updateSimulation` snapshots that key at the start of a pass and writes it back at the end, reverting each flip one tick later. Moved to `memory.clockHigh`.

### TAB Menu Polish
Three changes to the component menu.

**Files Modified:**
- `index.html` - Added the hover tooltip element, removed the Stock chip, replaced inline icon colours with a `num-icon` class.
- `scripts/script.js` - Tooltip logic and short-description derivation.
- `css/style.css` - Tooltip styling/animation and the unified icon theme.

**Changes:**
- **Hover tooltips:** Hovering a component tile shows its name and a one-line summary, so the library can be scanned without clicking each tile in turn. The tile grid is icon-only, which previously made identification slow.
- **Derived summaries:** Rather than adding a second description field to all 48 components, the tooltip reduces the existing `desc` to its first plain-text sentence — truth tables and markup are stripped, and the result is capped at 120 characters. Results are cached per type. This keeps a single source of truth for component copy.
- **Tooltip animation:** Fades and rises on a quintic curve using the shared motion tokens, and follows the cursor. Hidden on drag start and on menu close so it cannot be left stranded.
- **Removed the "Stock" chip** from the right-hand panel header.
- **Unified icon theme:** The grid previously showed three unrelated treatments side by side — math icons had a filled tile, input/output icons had hard coloured borders, and logic/memory/signal icons were bare SVG on no background. All tiles now share one 36px rounded tile with the same background and inset ring; category is carried by ring colour alone, with a blue ring on hover.
- **Light tiles:** The shared tile uses the same light body colour as a placed node (`#e9eaec`) with dark symbols, so a menu tile previews how the component will actually look on the canvas. The 18 SVG paths carrying a hard-coded `stroke="white"` in the markup are overridden to `currentColor` so they read against it.
- **Accent colours re-tuned for the light tile.** The category colours had been chosen against a dark background and washed out once the tile went light:

| Category | Colour | Contrast on tile |
|---|---|---|
| Logic / Math | `#12181d` | 14.9:1 |
| Inputs | `#b8281a` | 5.2:1 |
| Outputs | `#9a6206` | 4.2:1 |
| Numeric | `#157347` | 4.9:1 |

  All clear WCAG AA for graphical elements (3:1); all but Outputs clear AA text (4.5:1), which is acceptable for an icon stroke and keeps the amber reading as amber rather than brown.
- **Inline styles moved to a class.** Lever, Bar Graph, Dial and Constant carried `style="color: #2ecc71"` directly in the markup, which beat the stylesheet and left them near-invisible on the light tile. They now use a `num-icon` class instead, keeping the "numerical signal" green semantic at a darker value. Preferred over an `!important` override so the cascade stays predictable.

### Composite Block UI (Context Menu, Dialog, Pin Names)
Replaced the keyboard-and-`prompt()`-only workflow for composite blocks with a proper interface.

**Files Modified:**
- `index.html` - Context menu container and the block create/edit dialog.
- `scripts/script.js` - Menu building, dialog handling, port label editing.
- `css/style.css` - Context menu, dialog, and pin-name editor styling.

**Features:**
- **Right-click context menu.** On a node: Group into Block (showing the selection count, disabled below two), Copy, Cut, Duplicate, Delete. On a composite instance it additionally offers Block Details and Ungroup Block. On empty canvas: Paste (disabled when the clipboard is empty) and Select All. Items show their keyboard equivalents.
- **Block dialog** with name and description fields, replacing the previous `prompt()`. `Ctrl/Cmd + G` routes through the same dialog so both entry points behave identically.
- **Port preview.** The dialog reports what the selection will become (`2 components | 4 inputs | 2 outputs`) *before* committing, which surfaces the per-pin port behaviour at the moment it can still be acted on.
- **Editable pin names.** One field per pin, pre-filled with the derived label, in both create and edit modes. Blank fields fall back to the derived label so no pin is ever nameless. Names appear on pin hover and in the component menu description. Because names live on the definition, editing them updates every instance at once.
- Descriptions and a `createdAt` timestamp are stored on definitions now, so a future "save blocks as Microcontrollers" menu needs a table and browse UI rather than a data migration.

**Behaviour notes:**
- Right-clicking a node outside the current selection retargets the selection to it first, matching file-manager convention.
- The context menu stays out of the way during placement mode (which already uses right-click to cancel) and Delete Mode, and dismisses on outside click, Escape, or window blur.

**Bugs Found and Fixed During Implementation:**
- **Duplicate `escapeHtml` broke the entire app.** A second `function escapeHtml` was added while one already existed at line 182. Duplicate function declarations at module scope are a `SyntaxError`, so `script.js` failed to evaluate and nothing initialised at all. Removed the duplicate and hardened the original with `String(text ?? '')`, since it called `.replace` directly and would throw on the `undefined` description being passed to it.
- **Pin renames never reached existing instances.** `createPin()` resolved the pin label once at creation and captured it in the hover handler. That was fine when labels came from static gate definitions, but composite pin names can be edited after instances exist, leaving those instances showing the old name permanently. The label is now resolved at hover time. The fix applies to all pins, not just composites, and the label is escaped since it is now user-supplied text going into `innerHTML`.

### Composite Components (Reusable Sub-Circuits)
Added true nested sub-circuits: a selection can be grouped into a named block that behaves as a single component, and expanded back into its parts.

**Files Modified:**
- `scripts/simulation.js` - Extracted per-node evaluation and added recursive composite evaluation.
- `scripts/script.js` - Definition registry, port derivation, group/ungroup, persistence.
- `css/style.css` - Block styling and the grouping notice.

**Features:**
- `Ctrl/Cmd + G` groups the current selection into a named block; `Ctrl/Cmd + Shift + G` expands a selected block back into its components.
- Blocks are genuinely reusable: each instance carries its own inner state, so two copies of a counter block count independently.
- Blocks can be nested inside other blocks.
- Definitions are saved with the circuit, both in the undo history and in cloud saves.
- Instances are visually distinguished with an orange header and border, so it is obvious which nodes contain a circuit rather than a single operation.

**Architecture:**
- **Type encoding:** An instance's node type is `Composite:<definitionId>`, and the definition is registered into `componentDefinitions` with its derived pin counts. Because a block is just another component type, `createNode`, wiring, pin rendering, the save format, and copy/paste all work with no special cases.
- **Evaluation refactor:** The ~130-line gate `switch` was extracted out of the `updateSimulation` loop into a DOM-free `evaluateGate(n, s, depth)`. This is what makes nesting possible: the same logic now drives both the top-level board (where nodes have DOM elements) and the inside of a block (where they do not). The extraction was performed programmatically rather than retyped, to avoid transcription errors.
- **Inner evaluation:** `evaluateComposite()` mirrors the fixpoint loop without any DOM access. Inner Switches and Levers read from data rather than the DOM, input ports are re-applied on every pass so an inner wire cannot overwrite them, and sequential state is written back to the instance afterwards.
- **Per-instance state:** `instantiateInner()` gives every instance a private copy of the definition's nodes and memory. Sharing it would make two instances of the same block share flip-flop and counter state.
- **Recursion guard:** Nesting depth is capped at 8. A block that (directly or indirectly) contains itself yields zeros instead of blowing the stack.
- **Port derivation:** An input port is any inner input pin with no driver inside the group; an output port is any inner output pin that drives something outside the group or drives nothing at all. Ports are ordered by node position (top-to-bottom, then left-to-right) so a block's pins follow the visual layout of the circuit it came from.

**Bugs Found and Fixed During Implementation:**
- **Dropped external wiring.** Connection pin indices arrive from `dataset` as strings, but ports derived from pin counts are numbers, so the strict `===` in the port lookup never matched and every external wire was discarded on grouping (observed as 6 wires → 0). All comparisons now go through a `samePin()` helper so the two representations cannot drift apart.
- **Grouping was two undo steps.** `deleteSelectedNode()` saves state internally, so a single undo landed on a broken intermediate board where the members were gone but the block did not yet exist. Group and ungroup now suppress the inner save and write one history entry.

**Verification:**
Built a half adder (two Switches → XOR/AND → two Lights) and recorded its truth table, then grouped the XOR and AND. The table is identical before grouping, through the block, and after ungrouping:

```
A=0 B=0 -> sum=0 carry=0
A=0 B=1 -> sum=1 carry=0
A=1 B=0 -> sum=1 carry=0
A=1 B=1 -> sum=0 carry=1
```

All six external wires reconnect to the correct ports in both directions, definitions survive undo/redo, and copy/paste produces a second instance of the same definition.

**Known Limitations:**
- Blocks do not yet appear in the TAB menu. Definitions register and are fully reusable, but placing another instance currently requires copy/paste. Adding a "My Blocks" section needs tile injection, since the menu is static HTML.
- Switches and Levers are rejected inside a block (with an explanation), because a block has no way to expose an interactive control.
- Ports are per-pin rather than per-signal, so a half adder exposes four inputs rather than two — one input feeding two gates becomes two ports. Merging ports that share a source would make blocks tidier.

### Copy / Cut / Paste / Duplicate
Added clipboard support for selected components, including the wiring between them.

**Files Modified:**
- `scripts/script.js` - Clipboard state, selection serialisation, paste reconstruction, and key bindings.

**Features:**
- `Ctrl/Cmd + C` copies the selection, `Ctrl/Cmd + X` cuts, `Ctrl/Cmd + V` pastes, `Ctrl/Cmd + D` duplicates in place.
- Paste lands under the cursor when it is over the workspace; otherwise successive pastes cascade so copies don't stack exactly on top of each other.
- Node configuration (values, formulas, labels, ranges) and Switch on/off state are carried across.
- Pasted nodes are selected on arrival, so they can be dragged immediately.
- Snap to Grid is respected when active.

**Design Notes:**
- **Internal wiring only:** A wire is carried with the copy only when *both* of its endpoints are inside the selection. A wire to an unselected node has no meaningful counterpart in the copy, so duplicating it would create either a dangling edge or a silent extra connection to the original circuit.
- **Id remapping:** `serializeSelection()` stores positions relative to the selection's top-left and keeps the original ids. On paste an old-id → new-id map is built as nodes are created, then used to rebuild the internal connections, so copies wire to copies rather than back to the originals.
- **In-memory clipboard:** The system clipboard is deliberately not used. Circuits are structured data, and taking over the OS clipboard would break ordinary text copy inside the app (for example in the component search or a config field). The key handler sits behind the existing input-focus guard for the same reason.

**Verification:**
Built Switch → NOT → Light, copied all three, and toggled only the original Switch — only the original Light changed, confirming the copy is independently wired. Also confirmed config preservation (a Constant set to 42 pastes as 42), that partial selections do not duplicate wires to unselected nodes, cut/paste round-trips, and that `Ctrl+C` inside a text field is not intercepted.

### Undo/Redo Keyboard Shortcuts
`Ctrl/Cmd + Z`, `Ctrl/Cmd + Y`, and `Ctrl/Cmd + Shift + Z` had been documented in `README.md` for some time but were never actually bound — undo and redo were reachable only from the toolbar buttons.

**Files Modified:**
- `scripts/script.js`

**Changes:**
- Bound the shortcuts, routed through the existing toolbar button handlers so the history logic stays in one place.
- Digit handling for the Quick Access Bar now skips events with a modifier held, so `Ctrl+Z` no longer also triggers slot placement.

### Landing Page Stormworks Alignment Pass
Brought the landing page onto the same design system as the simulator. Previously the landing page used its own palette (a bright blue gradient) that clashed with the dark Stormworks chrome users saw immediately after clicking "Start Designing".

**Files Modified:**
- `css/style.css` - Appended a landing-page override block.

**Changes:**
- **Background:** Replaced `linear-gradient(135deg, #2c3e50, #3498db)` with `--sw-ui-bg` (`#101a20`) plus a radial vignette so the hero reads against the animated trace field.
- **Background Animation:** Reduced blur from 4px to 1.5px and raised opacity to 0.55. Over the old gradient the traces were an indistinct wash; on the dark field they read as circuitry and echo the workspace grid.
- **Top Navigation:** Now mirrors `#top-bar` exactly — same three-stop gradient, `1px solid #1d2c34` border, and matching inset/drop shadows.
- **Primary Buttons:** "Start Designing" and the Account button were soft 50px pills with a glow. They now use the simulator's chunky control treatment: `--sw-blue`, 6px radius, `2px solid #65bddf`, and the signature `inset 0 -4px/-5px 0` bottom shadow.
- **Panels:** Account dropdown, Features modal, and auth modal adopt `--sw-panel`, `--sw-border`, and the 28px grid overlay used by the TAB menu windows.
- **Footer/Socials:** Were `color: #000`, effectively invisible against the dark background. Now `--sw-muted`.
- The Minecraft "CRAFT" wordmark was deliberately kept — it is product identity rather than part of the UI system.

**Implementation Note:**
Written as an appended override block (the same pattern used by the March 2026 "Stormworks Simulator Theme Overrides" section) rather than by editing the original rules. The pass is purely additive, so it can be lifted out by deleting the block.

**Decision:** The simulator canvas still defaults to the light cyan theme. Dark mode remains opt-in via Settings, so there is an intentional brightness change when entering the simulator.

### Top Bar Component Menu Button
The component menu was only reachable via the `TAB` key or the small hotbar button, which made it undiscoverable for new users.

**Files Modified:**
- `index.html` - Added `#component-menu-btn` to the top bar.
- `scripts/script.js` - Wired the button and extended Escape handling.
- `css/style.css` - Added the button to the primary (blue) control group and gave it a pressed state.

**Changes:**
- Added a top-bar Components button using the same grid icon as the hotbar menu button, so the two read as the same action. It calls the existing `toggleMenu()`, so there is no duplicated open/close state logic.
- Carries both a `title` and an `aria-label`.
- Shows a pressed-in state while the menu is open.
- **Escape Now Closes the Menu:** Escape previously did nothing here. The main hotkey handler returns early whenever an input has focus, and opening the menu auto-focuses the search field — so `TAB` was the only keyboard exit. Escape now blurs the input and closes the menu.

**Known Behavior:** The existing TAB focus mode blurs the top bar while the menu is open, so the new button is visually blurred at that moment. Clicking still toggles the menu correctly.

### Motion Pass (UI Animation)
Added a consistent motion layer to make the interface feel lighter and less abrupt.

**Files Modified:**
- `css/style.css` - Motion tokens, keyframes, and transitions.
- `scripts/script.js` - Stagger index assignment for menu tiles.

**Changes:**
- **Motion Tokens:** Shared easing (`--ease-out-quint`, `--ease-back`, `--ease-standard`) and duration (`--dur-fast/base/slow`) custom properties so timing is consistent across the app.
- **Component Menu:** Container scales and fades on a quintic curve while the backdrop fades independently.
- **Staggered Tiles:** Component tiles cascade in at 14ms intervals, numbered per section and capped at 260ms so long sections don't trail behind the panel.
- **Controls:** Springy hover/press feedback on top-bar buttons, hotbar slots, menu tiles, and the landing CTA.
- **Nodes:** Drop-in animation when a component is placed.
- **Panels:** Entrance animation for modals and the Features showcase.
- **Reduced Motion:** A `prefers-reduced-motion: reduce` block strips travel, scaling, and cascades while keeping state changes legible.

**Implementation Note:**
Implemented in CSS rather than with an animation library. These are enter/exit/hover transitions that CSS handles on the compositor; a runtime library would add a network dependency without buying anything, and the project documents a no-build, zero-dependency architecture. A library would be justified later for timeline sequencing, spring physics, or FLIP layout animation.

Menu tiles use `animation-fill-mode: both` rather than a base `opacity: 0`, so the cascade still works but tiles remain visible if the animation never plays (animations disabled, frozen background tab, older engine). Content is never hidden behind an animation that might not run.

### RESOLVED: Minimap Rendered Nothing After Placing a Component
Fixed a long-standing bug where the minimap went completely blank the moment a component was placed. The viewport indicator (blue box) was visible on an empty board, then disappeared on the first placement and only reappeared after a node was dragged.

**Files Modified:**
- `scripts/script.js` - Node position now stored on the data model at creation.
- `scripts/minimap.js` - Bounds hardening, resolution handling, and framing rewrite.

**Root Cause:**
`createNode()` built its `nodeData` object as `{ id, type, el, memory, config }` without `x`/`y`, but `drawMinimap()` reads `n.x`/`n.y` to compute world bounds. Those `undefined` values turned every bound into `NaN`, which propagated into the render scale and made both the node `fillRect` calls and the viewport `strokeRect` silently draw nothing. Dragging a node was the only code path that assigned `x`/`y`, which is why a drag appeared to "repair" the minimap.

**Changes:**
- **Position Sync at Creation:** `nodeData` now includes `x` and `y`. All three node paths (placement, circuit load, drag) keep the data model in sync. `saveState()` continues to read positions from the DOM, so undo/redo is unaffected.
- **NaN-Proof Bounds:** Nodes without a finite position are skipped rather than poisoning the bounds for every other node, so a single bad entry can no longer blank the whole minimap.
- **Viewport Always Framed:** The current viewport is unioned into the world bounds, so the indicator can never fall outside the drawn region. Verified visible at all four extreme corners.
- **Removed Unguarded Property Read:** `n.el.offsetHeight` was read outside the existing `try/catch` and could throw, aborting the entire render.
- **Proportional Padding:** Replaced the fixed 4000-unit world padding (added January 8, 2026) with 15% of the framed extent. The fixed value was why the map read as a near-empty box — a real circuit was scaled down to a speck.
- **Border Offset Fix:** `moveViewToMinimap()` measured clicks with `getBoundingClientRect()`, which spans the *border* box, while the drawing scale is based on the 200x150 content box. Every click-to-pan was offset by the 2px border. Now subtracts `clientLeft`/`clientTop` and clamps to the canvas.
- **HiDPI Rendering:** The canvas backing store now scales by `devicePixelRatio` while all drawing math stays in CSS pixels, with a `resize` listener to re-render when moved between displays. Previously the map was blurry on high-density screens.
- **Stroke Inset:** The viewport rect is inset by half its stroke width so an edge-clamped indicator isn't visually half-clipped.

**Result:**
- Minimap renders correctly from the first placed component onward, with no drag required.
- Click-to-pan is pixel-exact (measured 0 world-unit error, previously ~17).
- Node rectangles and viewport indicator remain visible and usefully scaled at any circuit size.

### Settings Persistence
Settings previously reset on every page reload; only tutorial state was persisted.

**Files Modified:**
- `scripts/script.js` - Added load/save helpers and wired them into each control.
- `index.html` - Added a pre-paint theme script.

**Changes:**
- Zoom Sensitivity, Pan Sensitivity, Snap to Grid, and Dark Mode now persist to a `nodecraft-settings` localStorage key, matching the existing `nodecraft-tutorial-*` naming convention.
- Reads and writes are wrapped in `try/catch` so blocked or corrupt storage falls back to defaults instead of throwing.
- `applyStoredSettings()` restores the underlying state variables (not just the toggle CSS classes) and re-syncs slider positions and On/Off labels.
- **Flash Prevention:** `script.js` is a module at the end of `<body>`, so restoring the theme there would paint the light theme first and snap to dark on every load. A small inline script at the top of `<body>` now applies the class before the rest of the page renders; `applyStoredSettings()` only mirrors that state onto the toggle.

**Result:**
- Settings survive reloads with sliders, labels, and toggles all restored in sync.
- No theme flash on load for users with dark mode enabled.

### Unsaved Changes Warning
A refresh previously discarded an entire circuit with no prompt.

**Files Modified:**
- `scripts/script.js`

**Changes:**
- Added a `hasUnsavedChanges` flag set in `saveState()` and cleared at the four points where work is not at risk: initial load, New Circuit, loading a cloud circuit, and a successful cloud save.
- Added a `beforeunload` handler that warns only when there are unsaved changes *and* the board is non-empty, so the landing page and a fresh session never prompt.
- Undo/Redo set `isRestoring`, which makes `saveState()` return early. Both handlers now set the flag explicitly, otherwise saving to the cloud and then undoing would discard that change silently.

**Note:** This is a warning only. Periodic auto-save/recovery to localStorage remains on the roadmap.

**Result:**
- Verified across five states: landing page, empty simulator, after placing a node (warns), after New Circuit, and after undoing back to an empty board.

### Text Encoding Fix (Mojibake)
Four characters were stored as double-encoded UTF-8 and rendered as garbled text on the live site.

**Files Modified:**
- `index.html`
- `GEMINI.md`

**Changes:**
- `index.html`: SQRT component icon (`√`), tutorial achievement and task icons (`🎉`, `🎯`), and the landing page copyright symbol (`©`).
- `GEMINI.md`: degree symbol in the Delete Mode description and the completion checkmark in the refactoring status.

**Result:**
- All affected glyphs verified as correct UTF-8 on disk and in the rendered DOM.

---

## March 22, 2026

### Simulator Home Button (Landing Return Without Refresh)
Added a dedicated Home button to the simulator top bar next to Settings. It returns users to the landing page without refreshing and reuses the existing CRT shutter transition for consistency.

**Files Modified:**
- `index.html`
- `scripts/script.js`
- `css/style.css`

### Documentation Refresh (Home Button Update)
Updated all primary documentation to include the new simulator Home button flow.

**Files Modified:**
- `README.md`
- `GEMINI.md`
- `Description.md`
- `Description.html`
- `CATALOG.md`
- `Features and Improvments.txt`
- `assets/videos/README.md`

### Documentation Refresh
Updated all core documentation files to reflect the current product state (account dashboard, locked cloud UX for signed-out users, tutorial upgrades, responsive polish, and media path standardization).

**Files Modified:**
- `README.md`
- `GEMINI.md`
- `Description.md`
- `Description.html`
- `Features and Improvments.txt`
- `assets/videos/README.md`

### Account Dashboard + Profile Controls
Implemented a dedicated account settings page with profile and security controls.

**Files Modified:**
- `account.html` - Added account dashboard layout and forms.
- `scripts/account.js` - Added page logic for username/password/avatar updates and delete-account flow.
- `scripts/auth.js` - Added helpers for profile retrieval, username update, password update, avatar update, and account deletion RPC call.
- `css/style.css` - Added account dashboard theming and responsive styles.
- `scripts/script.js` - Added signed-in dropdown routing to account settings and improved display-name behavior.

**Features:**
- Update username and surface it in the account dropdown.
- Update password for email/password users.
- Update avatar URL using auth metadata.
- Delete account permanently via Supabase RPC.

### Supabase Account Deletion Backend
Added and applied a migration that introduces secure self-account deletion logic.

**Files Modified:**
- `supabase/migrations/20260322113500_add_delete_account_function.sql`

**Status:** ✅ Applied via `supabase db push`.

### Cloud Menu Locked State for Signed-out Users
Kept cloud menu entry visible even when signed out, while applying blur/lock treatment and guidance message.

**Files Modified:**
- `index.html`
- `css/style.css`
- `scripts/script.js`

### Tutorial + Media Path Robustness
Enhanced tutorial flow and standardized media paths.

**Files Modified:**
- `scripts/tutorial.js`
- `index.html`
- `assets/videos/README.md`

**Changes:**
- Mission-like tutorial progression and reset-on-refresh behavior.
- Connection demo now references `assets/videos/connection_demo.mp4`.
- Features modal videos standardized to `assets/videos/*.mp4`.
- Fallback ghost animation shown when media is unavailable.

### Responsive UI Polish (1080p)
Improved scaling and spacing for simulator surfaces and save modal.

**Files Modified:**
- `css/style.css`
- `scripts/minimap.js`
- `index.html`

## March 5, 2026

### Tutorial Video Path Fix
Fixed an issue where the connection demonstration video in the interactive tutorial failed to load due to an incorrect path after the recent file structure overhaul.

**Files Modified:**
- `scripts/tutorial.js` - Updated `videoUrl` to point to `assets/videos/connection_demo.mp4`.

---

## March 4, 2026

### Simulator UI Stormworks Alignment Pass
Applied a focused simulator-only UI overhaul to better align with Stormworks reference screenshots while preserving all core interactions and leaving the landing page untouched.

**Files Modified:**
- `index.html` - Updated top-bar structure for grouped controls; changed microcontroller top-bar button to a folder icon; removed deprecated bottom-right trashbin overlay button.
- `style.css` - Added simulator-only Stormworks theme override for top bar, TAB menu, quick-access bar, micro menu, settings/save/sidebar surfaces, minimap, and node chrome; tuned top-bar and TAB menu scale; added TAB focus blur and hotbar layering behavior.
- `script.js` - Added TAB menu state classes (`menu-open`, `qa-drop-active`) to drive blur/layering behavior; enhanced component description panel with pin-type badges; removed deprecated drag-to-trash deletion logic.

**Features / Changes:**
- **Stormworks-Inspired Simulator Styling:** Dark paneling, cyan control accents, orange headings, and compact toolbar grouping.
- **TAB Focus Blur Behavior:** Opening TAB blurs simulator layers and pushes quick bar behind the menu.
- **Hotbar Drag Priority:** While dragging from TAB, the quick bar pops forward and unblurs for slot assignment.
- **Node Color Correction:** Restored white/light in-canvas node styling per latest reference image while keeping updated UI shell styling.
- **Top-Bar Folder Icon:** Replaced the microcontroller menu top-bar icon with a folder icon.
- **Deprecated Trashbin Removal:** Fully removed bottom-right trashbin UI and drag-to-trash deletion path in favor of Delete Mode.

---

## March 3, 2026 - FIXED

### RESOLVED: Component Menu UI Overhaul Success
Successfully fixed the critical layout and HTML structural issues in the Component Menu (TAB menu). The menu now accurately reflects the high-density, blocky Stormworks aesthetic with a functional dual-window flexbox layout.

**Fixes Applied:**
- **HTML Structure:** Fixed an unbalanced `div` in the left window that was swallowing the right window and other UI elements.
- **Flexbox Layout:** Restored the side-by-side positioning of the left and right menu windows.
- **Grid Styling:** Updated `.menu-item` with `box-sizing: border-box` and `aspect-ratio: 1/1` to ensure they scale perfectly within the flexible grid tracks.
- **Stability:** Fixed interactions between the menu and the tutorial system that were caused by the malformed DOM.

**Status:** ✅ Fully functional and visually polished.

---

## March 3, 2026

### Circuit Saving & Loading Enhancements
Upgraded the Microcontroller Management Menu with a sleek side panel for viewing circuit metadata and introduced a dedicated modal for saving circuits, complete with a drawing canvas for custom thumbnails.

**Files Modified:**
- `index.html` - Added HTML structure for the new `save-circuit-modal`, drawing canvas, and the sliding `micro-details-panel` within the load menu.
- `style.css` - Styled the new modal, canvas tools, and sliding details panel to perfectly match the chunky, dark-themed Stormworks aesthetic. Fixed z-index layering to ensure the save modal pops over the load menu.
- `script.js` - Built the logic for drawing on the canvas, converting it to Base64, injecting custom thumbnails into the JSON save payload, and handling the sliding details panel animations and population.

**Features:**
- **Save Circuit Modal:** A new dedicated popup replacing the standard browser prompt. It includes fields for Name, Description, and a custom thumbnail.
- **Thumbnail Drawing Canvas:** Users can now pick a color, adjust brush size, and literally draw a 130x130 thumbnail icon for their circuit before hitting save.
- **Sliding Details Panel:** Clicking a circuit in the load menu now smoothly slides open a side panel displaying the circuit's title, description, modification date, and custom drawn thumbnail.
- **Grid Thumbnails:** The custom drawn thumbnails are now actively displayed in the load menu's visual grid.

---

## March 2, 2026

### UI Cleanup & Microcontroller Management Menu
Removed deprecated local save/load features and implemented a high-density Stormworks-style management menu.

**Files Modified:**
- `index.html` - Removed local I/O buttons; implemented `micro-menu-modal` with high-density grid and new "Save Current" UI.
- `style.css` - Added comprehensive styling for the micro-menu (92vw/88vh size), 130px circuit cards, and logo-style save button.
- `script.js` - Integrated `microMenuBtn` logic; implemented `refreshMicroGrid` and `renderMicroGrid` for visual circuit management.
- `tutorial.js` - Updated guidance to point to the new Management Menu.

**Features:**
- **Microcontroller Management Menu:** A polished submenu for cloud persistence:
    - **Visual Grid:** High-density display of saved circuits with stylized icons and metadata.
    - **Logo-style Save:** Replaced the save button with a vertical icon + blue text button.
    - **Live Search:** Search through your cloud library in real-time.
- **Cloud-Only Storage:** Removed all local `.logic` file export/import logic.
- **Conditional Avatars:** User profile pictures (or default icons) now only appear when authenticated.

---

## February 24, 2026

### Registration System & UI Restoration
Implemented a robust email/password registration system and restored the project's signature visual identity.

**Files Modified:**
- `index.html` - Added Registration Modal and dropdown action buttons.
- `style.css` - Restored blue gradient theme, fixed tutorial visibility, and styled cloud/registration UI.
- `script.js` - Implemented registration logic and username validation.
- `auth.js` - Added `signUp` function for Supabase integration.

**Features:**
- **Email/Password Signup:** New modal for creating accounts directly without Google.
- **Username Validation:** Strict alphanumeric validation (no spaces/special chars) for new usernames.
- **Improved Cloud Access:** "Save to Cloud" and "Load from Cloud" buttons added to the landing page account menu.
- **Visual Restoration:** Reverted landing page to the preferred blue gradient theme.
- **Tutorial Fix:** Ensured the interactive tutorial remains hidden until the workspace is entered.

---

## February 15, 2026

### Cloud Storage & Authentication (Supabase)
Implemented cloud persistence and user authentication to allow saving and loading circuits from any device.

**Files Modified:**
- `supabaseClient.js` - (New) Initialization of Supabase client.
- `auth.js` - (New) Logic for Google OAuth, logout, and session management.
- `storage.js` - (New) Cloud CRUD operations (save, load, delete) for circuits.
- `index.html` - Added Account dropdown, Google Login button, and cloud action buttons (Save/Load).
- `script.js` - Integrated auth state changes and cloud button event listeners.
- `style.css` - Styled account menu, cloud modals, and user profile UI.

**Features:**
- **Google Login:** Secure authentication via Supabase Auth.
- **Cloud Save:** Persist circuits to the `circuits` table with RLS protection.
- **Cloud Load:** Modal UI to browse and load your saved circuits.
- **Session Persistence:** Automatically restores session on page refresh.

---

## January 31, 2026

### Bar Graph Component
Added a new visual output component to visualize numerical values as a fillable bar.

**Files Modified:**
- `gateDefinitions.js` - Added 'Bar Graph' definition, SVG, and pin configuration.
- `script.js` - Added rendering and configuration logic (Min/Max).
- `simulation.js` - Implemented visual update logic and value clamping (0-100%).
- `style.css` - Added styles for `.bar-graph-container` and `.bar-graph-fill`.
- `index.html` - Added 'Bar Graph' to the Component Menu.

**Features:**
- **Visual Meter:** Vertical bar that fills from 0% to 100% based on input value.
- **Configurable Range:** Users can set custom **Min** and **Max** values (default 0-100) via the sidebar.
- **Hover Tooltip:** Hovering over the bar displays the exact numerical value (e.g., "Value: 50.25").
- **Green Input:** Uses a green numerical input pin.

### Bug Report UI
Added a quick way for users to find contact information for reporting bugs.

**Files Modified:**
- `index.html` - Added "Bugs" button to top bar and corresponding modal.
- `style.css` - Styled the button (Orange) and modal.
- `script.js` - Added event listeners for opening/closing the modal.

**Features:**
- **Top Bar Button:** Orange bug icon button in the top right.
- **Modal:** Popup window displaying contact email (configurable in HTML).

---

## January 10, 2026

### Hotkey Display & Visual Refinements
Enhanced visual feedback for hotkeys and modernized the configuration sidebar.

**Files Modified:**
- `script.js` - Updated node creation to include hotkey labels, implemented visual mode selector for Lever.
- `style.css` - Added styles for hotkey display, redesigned sidebar inputs to match "Dark Card" aesthetic, added mode switch animation.
- `simulation.js` - Updated simulation loop to populate hotkey labels.

**Features:**
- **Hotkey Labels:** Switches and Levers now display their assigned hotkeys (e.g., `[W]`, `[S/W]`) directly on the node.
- **Visual Mode Selector:** Replaced the "Control Mode" dropdown for Levers with a graphical arrow-based selector.
- **Sidebar Theme:** Updated all sidebar inputs to a cleaner, flat dark theme with transparent backgrounds and subtle underlines, matching the new visual direction.
- **Animations:** Added smooth flow animations when switching Lever control modes.

---

### Label Scaling and Limits
Implemented constraints and visual adjustments for renameable components.

**Files Modified:**
- `script.js` - Added `adjustHeaderFontSize` function, updated label handling in `createNode`, `openSidebar`, `loadCircuit`.

**Features:**
- **Character Limit:** Custom labels are now restricted to a maximum of 23 characters (reduced from 32 to prevent overflow).
- **Dynamic Font Scaling:** Node header text automatically reduces in size (from 14px down to ~9px) as the label gets longer (> 15 characters) to ensure it fits within the node boundaries.
- **UI Feedback:** Added "Max 23 characters" note in the settings sidebar.

---

### Hotkey System & Lever Enhancements
Implemented a robust hotkey system and significantly upgraded the Lever component's capabilities.

**Files Modified:**
- `script.js` - Added hotkey logic (direct & continuous), upgraded sidebar config, updated event handlers.
- `simulation.js` - Updated `updateSimulation` to display assigned hotkeys on nodes and handle new config values.
- `style.css` - Added styling for `.hotkey-display` and sidebar inputs.

**Features:**
- **Hotkeys:**
  - **Switch:** Toggle ON/OFF with a designated key.
  - **Lever:** Control value with "Increase" and "Decrease" keys.
  - **Visual Feedback:** Assigned hotkeys are displayed directly on the component in the workspace (e.g., `[W]`, `[S/W]`).
- **Advanced Lever Control:**
  - **Control Modes:** Choose between **Direct** (Step) and **Curve** (Continuous) modes.
  - **Sensitivity:** Configurable rate of change. In "Curve" mode, sensitivity is intelligently scaled (0.05x) for smooth operation.
  - **Value Limits:** Configurable **Min** and **Max** values. The lever value is clamped within this range.
  - **Precision:** Value display is limited to 3 decimal places for cleaner UI.

### Bug Fixes
- **Save/Load Integrity:** Fixed an issue where loading a circuit broke the configuration sidebar. The loader now correctly preserves Node IDs, ensuring event listeners remain valid.
- **Icon Restoration:** Fixed a regression where the Lever icon was replaced by a generic symbol. Restored the original SVG slider icon.

---

### Light and Dial Rendering Fix
Fixed an issue where Lights and Dials lost their visual indicators after making them renameable.

**Files Modified:**
- `script.js` - Reordered `createNode` logic.

**Changes:**
- Prioritized specific rendering logic for `Dial` and `Light` over the generic `configurableTypes` handler.
- Ensures they display their functional UI (dial number, light bulb) while still supporting the configuration sidebar for renaming.

---

### Renameable Components
Added the ability to rename input/output components (and other configurable nodes) via the settings sidebar.

**Files Modified:**
- `gateDefinitions.js` - Added 'Switch', 'Light', 'Dial' to `configurableTypes`.
- `script.js` - Updated `openSidebar` to add "Label" input, updated `loadCircuit` to restore labels.
- `GEMINI.md` - Updated documentation.

**Features:**
- **Custom Labels:** Users can now assign custom names to Switches, Levers, Lights, Dials, and other configurable components.
- **Sidebar Integration:** A new "Label" input field appears at the top of the configuration sidebar.
- **Visual Update:** The node header text updates in real-time when the label is changed.
- **Persistence:** Custom labels are saved and loaded with the circuit file.

---

### Snap to Grid Fix
Fixed "sticky" and "janky" behavior when dragging nodes with Snap to Grid enabled.

**Files Modified:**
- `script.js` - Updated dragging logic.
- `GEMINI.md` - Updated documentation.

**Changes:**
- **Refactored Dragging Logic:** Changed `mousemove` handler to calculate new positions based on the *total delta* from the drag start position, rather than accumulating small `movementX/Y` increments.
- **State Management:** Introduced `dragStartX`, `dragStartY`, and `dragStartPositions` map to track initial states during a drag operation.

**Result:**
- Dragging nodes with "Snap to Grid" on is now smooth and predictable.
- Eliminates rounding errors that caused nodes to stick to their previous positions until rapid mouse movement occurred.

---

## January 8, 2026

### UI Enhancements
Updated the Dark Mode toggle in the settings menu.

**Files Modified:**
- `index.html` - Replaced checkbox with `.toggle-switch` div structure
- `script.js` - Updated event listener to handle custom toggle click interactions
- `GEMINI.md` - Updated documentation to reflect the UI change

**Changes:**
- Replaced the standard HTML checkbox for "Dark Mode" with a custom sliding toggle switch.
- The new toggle visually matches the "Switch" component used in the circuit editor.
- Updated event handling to manually toggle the `on` class and update the "On/Off" label.
- Added a 0.5s fade transition to the background color for a smoother dark mode switch.

**Result:**
- Consistent visual language across the application's UI and the circuit components.
- Improved aesthetic for the settings menu.
- Polished user experience.

### Minimap Feature
Implemented a minimap for easier navigation of large circuits.

**Files Modified:**
- `index.html` - Added minimap canvas
- `style.css` - Styled minimap container
- `script.js` - Implemented rendering and navigation logic

**Features:**
- Real-time visualization of all nodes and the current viewport.
- Click-to-pan functionality.
- Auto-scaling to fit the entire circuit.

### Minimap Bug Fixes
Fixed issues with minimap rendering and interaction.

**Files Modified:**
- `script.js`

**Changes:**
- **Data Sync:** Updated node dragging logic to sync position data with the internal `nodes` array, ensuring the minimap renders current positions instead of initial ones.
- **Event Isolation:** Added `stopPropagation` for wheel events on the minimap to prevent accidental workspace zooming.
- **Viewport Visibility:** Increased minimap world padding (to 4000) to ensure the viewport indicator (blue square) remains visible and proportionally sized even with a single node, and appears smaller at medium zoom.
- **Render Timing:** Implemented delayed rendering for the minimap upon node creation to ensure DOM layout is complete before drawing, preventing missing elements.
- **Viewport Clamping:** Implemented clamping logic for the viewport indicator so it remains visible as a border when the viewport exceeds the minimap boundaries (e.g., fully zoomed out).
- **Zoom Range:** Expanded zoom limits to 0.1x - 10x (previously 0.25x - 3x) to allow for tighter close-ups, satisfying the requirement for the viewport indicator to closely match the gate size at max zoom.

**Result:**
- Minimap accurately reflects the circuit layout.
- Clicking the minimap correctly centers the view on the target area.
- Interaction is more stable.
- Viewport indicator is always visible.

### Codebase Refactoring
Extracted minimap logic into a separate module.

**Files Modified:**
- `script.js`
- `minimap.js` (Created)

**Changes:**
- Moved `drawMinimap` and related event listeners to `minimap.js`.
- Implemented an initialization function `initMinimap` to inject dependencies (state accessors).
- Cleaned up `script.js`.

**Result:**
- Reduced complexity of `script.js`.
- Better separation of concerns.

### Wiring Logic Refactoring
Extracted connection and wiring logic into a separate module.

**Files Modified:**
- `script.js`
- `wiring.js` (Created)

**Changes:**
- Moved functions: `startWiring`, `finishWiring`, `cancelWiring`, `createConnection`, `updateConnections`, `updateGhostLine`.
- Implemented `initWiring` to inject state dependencies.
- Updated `script.js` to delegate wiring operations to the new module.

**Result:**
- Significant reduction in `script.js` size (~200 lines).
- Isolated complex SVG wiring logic.

### Bug Fixes
- **Sidebar:** Fixed a `ReferenceError` (missing `closeSettings` function) that prevented the configuration sidebar from opening.

---

## January 2, 2026

### Codebase Modularization Complete
Finalized the refactoring of the monolithic codebase into a clean ES Module structure.

**Files Modified:**
- `script.js` - Retained as main controller, now imports from other modules
- `gateDefinitions.js` - Static component data, SVG icons, pin descriptions
- `simulation.js` - Simulation logic engine
- `tutorial.js` - Interactive tutorial system (rebuilt from scratch)
- `index.html` - Loads script.js with `type="module"`

**Changes:**
- Split monolithic `script.js` into focused ES Modules
- Fixed corrupted `tutorial.js` file that was preventing app startup
- All modules now use proper ES6 `import`/`export` syntax
- Application now requires a local HTTP server to run (due to ES Module CORS restrictions)

**Result:**
- Cleaner, more maintainable codebase
- Better separation of concerns
- Modular architecture ready for future enhancements

---

## December 30, 2025

### Wire Connection & Type Safety Fixes
Addressed visual bugs in wiring and implemented strict type safety for connections.

**Files Modified:**
- `script.js`

**Changes:**
- **Wire Drawing Fix:** Updated ghost wire coordinate calculation in `mousemove` handler to correctly account for zoom level and center the starting point on the pin.
- **Strict Type Checking:** Added validation in `finishWiring` to verify that source and destination pins share the same type (`bool` or `num`) before allowing a connection.

**Result:**
- Dragging a wire now visually starts exactly from the pin center, regardless of zoom or pan.
- Users can no longer accidentally connect incompatible Boolean and Numerical pins.

---

## December 20, 2025

### Delete Mode Feature
A new delete mode for easier component removal.

**Files Modified:**
- `index.html` - Added delete mode button to top bar
- `script.js` - Added `isDeleteMode` state, `toggleDeleteMode()` function, delete mode click handlers
- `style.css` - Added delete mode styling and animations

**Features:**
- Toggle with Delete key or trash button in top bar
- Click nodes or wires to delete them
- 45-degree rotated red X cursor when active
- Pulsing red hover effect on gates
- Same red shade for gate header and body
- Tooltips hidden during delete mode
- Exit by pressing Escape or clicking empty space

---

### Signal Probe Numerical Fix
Fixed signal probes showing incorrect values for math gate outputs.

**Files Modified:**
- `script.js`

**Changes:**
- Added `n.outputValue` storage in `updateSimulation()` to persist computed output values
- Updated `getConnectionValue()` to read from `sourceNodeData.outputValue` instead of returning hardcoded `1`

**Result:**
- Signal probes now correctly display actual numerical values (e.g., 5+3=8) instead of always showing 1

---

### Wire Visual Alignment Fix
Fixed wires not staying aligned to pins at different zoom levels.

**Files Modified:**
- `script.js`

**Changes:**
- Updated `updateConnections()` to divide screen coordinates by zoom factor
- Wires now correctly connect to pins at all zoom levels (0.25x to 3x)

---
