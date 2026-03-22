# Circuit Builder - Change Catalog

This file documents changes made to the Circuit Builder project.

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
