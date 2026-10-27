# Worst Rowers Ever --- Game Development Roadmap

**Project status:** Working Phaser 4 + Vite prototype\
**Visual direction:** Semi-realistic 2D with detailed water, textured
assets, lighting, and funny physical reactions\
**First target:** A complete, funny two-player game played on one
keyboard\
**Long-term target:** A polished browser game that friends can share
and, if it gains an audience, monetize responsibly

------------------------------------------------------------------------

## 1. The Core Idea

Two players share one boat on a river. Each player controls the boat
using a different part of the keyboard:

-   **Player 1:** `W`, `A`, `S`, `D`
-   **Player 2:** Arrow keys

Players do not move the boat directly. Their paddling and steering
inputs affect the same boat physics. When they coordinate, the boat
moves forward. When they disagree, it may slow down, turn in circles,
crash into obstacles, or miss the finish line by a ridiculous amount.

The game's identity should be **cooperative chaos**: easy to understand,
difficult to coordinate, and funny even when the players fail.

## 2. Principles We Will Follow

1.  **Keep the working game playable.** Make small changes and test
    after each one.
2.  **Do not rebuild the project unnecessarily.** Keep Phaser 4, Vite,
    JavaScript, and the existing keyboard controls.
3.  **Prioritize fun over feature count.** A small game with satisfying
    movement is better than a large game with boring controls.
4.  **Build the core locally first.** Online multiplayer comes only
    after the local game is enjoyable.
5.  **Use temporary graphics when testing mechanics.** Add polished art
    after the relevant gameplay works.
6.  **Use suitable licensed assets.** Check each asset's license and
    attribution requirements before publishing.
7.  **Avoid unnecessary libraries and infrastructure.** No account
    system, database, or backend is required for the first playable
    release.
8.  **Keep performance in mind.** Target smooth play on ordinary laptops
    and common desktop browsers.
9.  **Make the game shareable, not intrusive.** Encourage invitations
    through funny results and challenge links rather than spam.
10. **Treat revenue as a later milestone.** First establish that people
    enjoy the game and invite others.

------------------------------------------------------------------------

## 3. Development Phases

### Phase 0 --- Protect the Working Prototype (COMPLETED)

**Goal:** Keep a known-good version before changing the game further.

Tasks:
- [x] Baseline prototype preserved in `src/main.backup.phase0.js`.
- [x] Confirmed `npm run dev` starts the game and runs on `localhost:5173`.
- [x] Confirmed both keyboard layouts work (Player 1: WASD, Player 2: Arrow keys).
- [x] Confirmed restart (R key) and finish condition (`y < 80`) work.
- [x] Documented baseline limitations and preserved known-good state.

**Status:** Completed.

### Phase 1 --- Improve the River and Visual Foundation (COMPLETED)

**Goal:** Replace flat placeholder graphics with a coherent, semi-realistic 2D look.

Tasks:
- [x] Procedural multi-layered water texture with seamless repeating tiles and continuous downstream scrolling current.
- [x] Layered water colors with deep river channel gradient, surface caustics shimmer, gentle current drift, and expanding boat wake ripples.
- [x] Natural curving riverbanks with organic shorelines, multi-tiered terrain (shallow sand transition, muddy embankment, dark moss base, lush grass turf), foliage bushes, river reeds/cattails, and dynamic shoreline lapping foam.
- [x] Varied obstacles: faceted river boulders with moss and highlights, smooth pebble clusters, and weathered driftwood logs with tree rings and branch knots.
- [x] Consistent asset sizing, origins (centered), and strict rendering depth ordering (Depths 0 to 25).
- [x] Subtle translucent drop shadows under the boat, all river obstacles, and riverbanks.
- [x] Floating finish line marker buoys with bobbing physics and checkered finish ribbon.
- [x] Glassmorphism HUD with player control indicators (P1 Blue, P2 Orange) and race commentary.

**Status:** Completed.

### Phase 2 — Establish the 3D Game Foundation (COMPLETED)

**Goal:** Build the actual game in 3D using Three.js. Camera movement, a 3D world, and shared boat physics are core requirements—not future enhancements.

#### Technology
- **Three.js** — 3D rendering, models, lighting, materials, water and camera.
- **Vite** — development server and build tooling.
- **Rapier** — evaluated; lightweight custom kinematic model currently sufficient for smooth 60 FPS gameplay.
- **JavaScript** — retained existing project language.

#### Tasks
- [x] **2.1 — Protect Existing Prototype**: Preserved complete Phase 1 2D Phaser game in `src/main.phaser.js` with dual-mode runtime launcher in `src/main.js`.
- [x] **2.2 — Create the 3D World**: Three.js scene, perspective camera, WebGL renderer with PCF soft shadows, directional sunlight tracking the boat, atmospheric fog, curved river channel, consistent width banks, obstacles, and finish buoys.
- [x] **2.3 — Implement Third-Person Camera**: Elevated 3rd-person follow camera with look-ahead heading tracking along river curves, clamped bank roll, and controlled collision trauma shake.
- [x] **2.4 — Implement Shared Two-Player Controls & Fixes**:
  - Independent and combined input integration for Player 1 (WASD) and Player 2 (Arrows).
  - Aligned physical velocity vector with 3D mesh Y-rotation.
  - Implemented debounced collision impact cooldown preventing multi-frame repeated hits during continuous contact.
  - Added edge-triggered Space and R keys to prevent rapid-fire restarts.
- [x] **2.5 — Visual Themes & Day Mode**:
  - Implemented vibrant, sunny Day Theme as default (cyan sky, sunny fog, warm golden sunlight, aqua river water, bright glassmorphic cards).
  - Implemented interactive instant Day/Night mode toggle button in HUD.
  - Tested dual-player independence, conflicting input cancellation, and collision debouncing via unit tests.

**Status:** Completed.

**Remaining Limitations for Phase 2:**
- Sound effects (paddle splashes, collision thuds) deferred to Phase 5.
- Models currently use procedural low-poly geometries; external glTF character models to be added in Phase 3/4.

### Phase 3 --- Make the Boat Physics Feel Funny

**Goal:** Make coordination and mistakes produce entertaining results.

Tasks: - Tune acceleration, reverse movement, drag, turning, and
momentum. - Make forward paddling feel useful without making steering
too easy. - Make conflicting inputs cause believable loss of speed or
awkward turns. - Prevent the boat from getting stuck permanently against
an obstacle or riverbank. - Add short collision reactions and temporary
speed loss. - Add a small recovery opportunity after a bad collision. -
Test with two people at the same keyboard, not only one person pressing
every key.

Design rule: - Mistakes should be funny, not unfair. Players should
usually understand why the boat spun or crashed.

**Done when:** Two people can learn the controls quickly, and
coordinating better noticeably improves their result.

### Phase 4 --- Add Obstacles and River Hazards

**Goal:** Make each run a small challenge.

Introduce hazards gradually: 1. Stationary rocks. 2. Floating logs. 3.
Narrow bends. 4. Gentle currents that push the boat sideways. 5. Faster
water or a small rapid section. 6. Moving hazards only if the simpler
ones are already fun.

Tasks: - Add collision feedback and a brief splash. - Vary obstacle
placement while preserving a fair path. - Avoid impossible or
unavoidable obstacle layouts. - Ensure hazards do not repeatedly count
the same collision every frame. - Keep the boat's movement and collision
behavior consistent.

**Done when:** Players need to steer and cooperate, but failures still
feel fair.

### Phase 5 --- Add Sound and Game Feel

**Goal:** Make every action feel satisfying.

Tasks: - Add paddle splashes. - Add a wooden bump or water impact sound
for collisions. - Add a short countdown sound. - Add a finish sound and
simple victory/defeat cues. - Add small camera shake or impact animation
for stronger collisions, used sparingly. - Provide a mute control. -
Respect browser audio restrictions by starting audio after a user
interaction.

**Done when:** The game feels responsive even without adding more
levels.

### Phase 6 --- Complete the Game Flow

**Goal:** Turn the prototype into a complete short game.

Tasks: - Add a clean title screen. - Explain both players' controls
before starting. - Add a countdown: 3, 2, 1, ROW! - Add pause and
resume. - Add a race timer and collision counter. - Add a clear finish
condition and result screen. - Add restart and quick rematch. - Handle
window resizing without stretching the game incorrectly. - Test keyboard
focus so controls work reliably after menus are used.

**Done when:** A new player can open the site, understand the controls,
play a race, see the result, and start another race without help.

### Phase 7 --- Add Humor and Personality

**Goal:** Make the game memorable and share-worthy.

Features to test one at a time: - Funny result titles, such as
"Professional Boat Spinners" or "Two Paddles, Zero Plan." - A result
based on time, collisions, and how much the boat spun. - Short character
reactions after a collision. - Small random events, such as a duck
crossing the river or a brief current. - Optional boat or paddle
skins. - Silly but brief messages when players paddle against each
other. - A replay of the final few seconds only if it can be implemented
reliably.

Avoid adding random events that interrupt controls or make winning feel
arbitrary.

**Done when:** Players laugh at the outcome and want to try again to
beat their own result.

### Phase 8 --- Build a Small Set of Levels

**Goal:** Give the game variety without turning it into a large
production.

Possible sequence: 1. **Calm Start:** A wide river for learning the
controls. 2. **Rock Garden:** Stationary obstacles and gentle turns. 3.
**The Rapids:** Stronger currents and tighter navigation. 4. **Log
Trouble:** Floating logs and timing challenges. 5. **The Final Bend:** A
short, challenging race that combines earlier mechanics.

Tasks: - Reuse the same core physics. - Change obstacle layouts and
current strength. - Increase difficulty gradually. - Keep each race
short enough for quick rematches.

**Done when:** Players have a reason to replay more than one layout.

### Phase 9 --- Playtest and Polish

**Goal:** Find out whether the game is actually fun for other people.

Tasks: - Ask several pairs of people to play without explaining the game
verbally. - Observe where they misunderstand controls. - Ask what made
them laugh and what felt frustrating. - Fix confusing controls, unfair
collisions, visual clutter, and performance problems. - Test different
window sizes and common browsers. - Test keyboard input when keys are
held simultaneously. - Add basic accessibility improvements such as
readable text and clear control instructions.

Success signals: - Players understand the objective quickly. - They want
a rematch without being asked. - They naturally switch roles or
challenge another pair. - They share the game link with someone else.

**Done when:** Feedback shows repeat play and genuine interest, not just
polite compliments.

### Phase 10 --- Publish the Browser Game

**Goal:** Make it easy for anyone to play through a link.

Tasks: - Create a production build using `npm run build`. - Fix build
errors and test the production preview. - Deploy the static game to a
suitable hosting provider. - Add a title, description, favicon, and
social-sharing preview image. - Create a simple landing page with a Play
button, controls, and a short explanation. - Verify the game works when
opened from the deployed URL. - Keep the initial hosting setup
inexpensive.

**Done when:** A friend can open the link on a supported desktop browser
and start playing immediately.

### Phase 11 --- Make It Shareable

**Goal:** Turn a good local game into something players can recommend.

Tasks: - Create a funny results card with race time, collisions, and
result title. - Add a button to copy or share the game URL. - Add
challenge text such as "Can your team finish with fewer than three
crashes?" - Add a best-time record using local browser storage if
useful. - Consider a daily challenge with a fixed obstacle layout. -
Track only basic, privacy-conscious usage metrics if needed.

**Done when:** Sharing the game is a natural part of finishing a race.

### Phase 12 --- Decide Whether to Add Online Multiplayer

**Goal:** Expand only if people enjoy the local game.

Before building it, assess: - Are people returning to play? - Are they
asking to play with friends who are not in the same room? - Is there
enough interest to justify backend and hosting costs?

If justified: - Add room creation and join codes. - Choose a networking
approach appropriate for a real-time physics game. - Synchronize inputs
or authoritative game state carefully. - Handle disconnects, latency,
and room cleanup. - Test with real internet connections, not only
localhost.

Online multiplayer is a separate, substantial milestone. It is not
required to launch the first version.

### Phase 13 --- Consider Monetization

**Goal:** Explore revenue without damaging the game experience.

Possible options after the game has an audience: - Non-intrusive ads
between races, subject to ad-network approval. - Optional cosmetic boat
or paddle skins. - Sponsored challenges that fit the audience. - A small
supporter purchase if players want to support development.

Rules: - Do not assume traffic will automatically produce meaningful ad
revenue. - Do not add payments before validating demand. - Keep the core
game playable for free. - Avoid intrusive ads during gameplay. - Review
applicable platform, privacy, advertising, and payment requirements
before launch.

**Done when:** A monetization experiment is supported by real user
interest and does not undermine retention.

------------------------------------------------------------------------

## 4. Recommended Asset Direction

Use a consistent visual style rather than mixing unrelated assets.

### Visual assets

-   Top-down wooden rowboat, bow pointing upward.
-   Two cartoon-realistic rowers with readable silhouettes.
-   Paddle sprites or separate paddle layers.
-   Seamless water texture with several blue-green tones.
-   Riverbank, grass, rocks, logs, and foam.
-   Transparent splash effects.
-   Soft shadows and restrained lighting overlays.

### Asset sources to investigate

-   Kenney: https://kenney.nl/assets
-   OpenGameArt: https://opengameart.org/
-   itch.io game assets: https://itch.io/game-assets

Check each asset's license, commercial-use terms, attribution
requirements, and whether modification is allowed. Do not assume every
asset on a marketplace has the same license.

### Art rules

-   Keep the boat and obstacles readable against the water.
-   Use shadows to establish depth without obscuring collision areas.
-   Keep visual effects short and lightweight.
-   Use a consistent camera angle.
-   Do not use high-resolution textures that make the game slower
    without improving its appearance at actual display size.

------------------------------------------------------------------------

## 5. Technical Plan

### Keep for the current version

-   Phaser 4
-   Vite
-   JavaScript
-   HTML and CSS
-   Existing WASD and arrow-key controls

### Add only when needed

-   Audio files and Phaser audio handling for sound.
-   Licensed sprite sheets and textures for artwork.
-   Local storage for optional personal bests.
-   A backend and networking only if online multiplayer becomes a real
    priority.

### Suggested project organization over time

``` text
worst-rowers-ever/
├── public/
│   └── assets/
│       ├── boats/
│       ├── characters/
│       ├── environment/
│       ├── effects/
│       └── audio/
├── src/
│   ├── main.js
│   ├── style.css
│   └── game/
│       ├── GameScene.js
│       ├── Boat.js
│       ├── InputManager.js
│       ├── ObstacleManager.js
│       └── effects/
├── index.html
├── package.json
└── vite.config.js
```

This is a gradual target structure, not a request to reorganize every
file immediately. Extract code into separate files only when the current
file becomes difficult to maintain.

------------------------------------------------------------------------

## 6. How We Will Work Together

For each implementation step:

1.  State the specific improvement and why it matters.
2.  Identify the exact file and section to edit.
3.  Provide only the necessary replacement or insertion code.
4.  Preserve working controls and features.
5.  Test in the browser before proceeding.
6.  Fix any errors before adding the next feature.
7.  Update this roadmap when a milestone is completed or a decision
    changes.

Avoid changing physics, rendering, input handling, and asset loading all
at once. Small changes make problems easier to isolate.

------------------------------------------------------------------------

## 7. Definition of the First Release

The first public release is complete when:

-   Two players can play on one keyboard.
-   Both control sets work simultaneously.
-   Boat movement feels responsive and intentionally chaotic.
-   The river, boat, rowers, and obstacles have a consistent polished
    visual style.
-   Collisions and paddling have clear visual and audio feedback.
-   At least a few short levels are playable.
-   The game has a title screen, countdown, finish state, results, and
    rematch.
-   It works reliably in a production browser build.
-   A player can share a link and invite someone to try it.

Online multiplayer, accounts, leaderboards, and monetization are later
decisions, not prerequisites for the first release.

## 8. Current Status and Immediate Next Step

**Already working:**
- Phaser 4 + Vite project.
- Two-player keyboard controls (P1: WASD, P2: Arrows).
- Boat movement, rotation, turning momentum, and collision physics.
- Procedural flowing river with layered textures, scrolling caustics, and subtle current.
- Natural curving riverbanks with layered terrain, vegetation, and pulsating shoreline foam.
- Varied procedural obstacles (faceted boulders, driftwood logs, pebble clusters) with breaking foam and shadows.
- Subtle shadows beneath boat, obstacles, and riverbanks.
- Floating buoy finish line, timer, collision tracker, restart (R), and dynamic boat wake.
- Protected backup of Phase 0 baseline in `src/main.backup.phase0.js`.

**Current milestone completed:**
- Phase 0 (Protect the Working Prototype) & Phase 1 (River and Visual Foundation).

**Next implementation step (Phase 2 — Establish the 3D Game Foundation):**
1. **Protect 2D Prototype**: Keep `src/main.phaser.js` so the 2D version remains playable and testable anytime.
2. **Setup Three.js 3D Scene**: Scene, perspective camera, renderer, shadows, atmospheric fog, and directional river sun.
3. **Build 3D River Environment**: Riverbed, flowing water surface, natural banks, placeholder boat, and river obstacles.
4. **Third-Person Dynamic Camera**: Follow behind & above the boat, look-ahead target, turning lag, and collision shake.
5. **Two-Player 3D Shared Boat Physics**: P1 (WASD) + P2 (Arrows) governing forward/reverse paddling, steering drift, drag, and chaotic comedic collisions.
6. **Playtest & Validate**: Verify smooth 60 FPS desktop browser performance before adding complex models.

------------------------------------------------------------------------

**Guiding principle:** Build a small game people want to replay and
share. Add complexity only when it makes the game more fun or helps the
project grow.
