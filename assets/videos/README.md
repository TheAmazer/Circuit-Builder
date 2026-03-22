# Video Assets

Place all landing-page feature videos and tutorial media files in this folder.

Last reviewed: March 22, 2026.

## Required files

- connection_demo.mp4
- boolean_numerical_demo.mp4
- menu_demo.mp4
- hotkeys_demo.mp4

## Referenced from

- `index.html` (Features modal)
- `scripts/tutorial.js` (connection tutorial step)

## Path convention

All media references should use:

`assets/videos/<filename>.mp4`

## Runtime behavior

- If `connection_demo.mp4` is missing or fails to load, the tutorial falls back to a ghost animation demo.
- Simulator Home button navigation does not change any media file references.
