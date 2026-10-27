# Worst Rowers Ever — Helper Notes & Phase Specifications

## Phase 2 — Establish the 3D Game Foundation

**Goal:** Build the actual game in 3D using Three.js. Camera movement, a 3D world, and shared boat physics are core requirements—not future enhancements.

### Technology
- **Three.js** — 3D rendering, models, lighting, materials, water and camera.
- **Vite** — development server and build tooling.
- **Rapier** — evaluate for physics if needed; begin with a simple custom boat movement model if that is sufficient.
- **JavaScript** — retain the existing project language.

### 2.1 — Protect the Existing Prototype
- Commit the working Phaser version to Git.
- Create a separate branch for the 3D prototype.
- Do not delete or overwrite the working 2D implementation.
- Verify the existing project builds before experimenting.

### 2.2 — Create the 3D World
- Set up a Three.js scene, perspective camera and renderer.
- Add a sky, fog, lighting, shadows and a 3D river environment.
- Create a placeholder river with visible banks and a clear forward direction.
- Add a placeholder boat and basic collision obstacles.
- Ensure the scene performs well in a desktop browser.

### 2.3 — Implement the Third-Person Camera
- Follow the boat from behind and above.
- Smoothly follow its position and heading.
- Look ahead so players can anticipate river bends and obstacles.
- Add configurable camera distance, height and follow smoothing.
- Add subtle collision shake and boat-turning camera lag.
- Keep the boat and important obstacles visible without excessive camera movement.

### 2.4 — Implement Shared Two-Player Boat Controls
- Player 1: W/A/S/D.
- Player 2: Arrow keys.
- Both players influence the same boat.
- Forward and backward paddling must affect boat speed.
- Conflicting steering inputs should cause believable turning, drifting or spinning.
- Add acceleration, drag, rotational inertia and basic riverbank/obstacle collisions.
- Keep the controls responsive and the chaos funny rather than frustrating.

### 2.5 — Test the Core Experience
- Test coordinated paddling, conflicting steering, turning and collisions.
- Confirm the camera behaves correctly during all movements.
- Verify the boat cannot escape the playable river area.
- Test keyboard focus and prevent page scrolling from gameplay controls.
- Check browser performance and fix major rendering issues.

### Phase 2 completion criteria
- A working 3D scene renders in the browser.
- The boat moves through a 3D river.
- Both players control the same boat independently.
- The third-person camera follows and looks ahead smoothly.
- Basic collisions and boat physics work.
- The existing Phaser prototype remains available for comparison.

**Do not proceed to detailed boat models, animated rowers, polished water, multiple levels or online multiplayer until this foundation is playable and enjoyable.**
