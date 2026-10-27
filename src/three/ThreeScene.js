import * as THREE from "three";
import { Boat } from "./Boat.js";
import { RiverEnvironment } from "./RiverEnvironment.js";
import { ThirdPersonCamera } from "./ThirdPersonCamera.js";
import { InputManager } from "./InputManager.js";

/**
 * ThreeScene - Core 3D Scene Controller
 * Manages Three.js scene lifecycle, renderer, lighting, shadows, physics loops,
 * and HUD overlay.
 */
export class ThreeScene {
  constructor(containerElement, onSwitchTo2D) {
    this.container = containerElement;
    this.onSwitchTo2D = onSwitchTo2D;

    this.started = false;
    this.finished = false;
    this.startTime = 0;
    this.isRunning = false;

    this.initScene();
    this.createHUD();
    this.input = new InputManager(window);

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener("resize", this.onWindowResize);

    this.start();
  }

  initScene() {
    const width = this.container.clientWidth || 960;
    const height = Math.min(window.innerHeight - 80, 600);

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e313f);
    this.scene.fog = new THREE.FogExp2(0x0e313f, 0.0072);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.4, 500);

    // 3. Renderer with PCF Soft Shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.innerHTML = "";
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const hemiLight = new THREE.HemisphereLight(0xbce6ff, 0x1f4726, 0.75);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7e6, 1.25);
    this.sunLight.position.set(-25, 55, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.camera.left = -30;
    this.sunLight.shadow.camera.right = 30;
    this.sunLight.shadow.camera.top = 35;
    this.sunLight.shadow.camera.bottom = -35;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // 5. River Environment & Boat
    this.river = new RiverEnvironment(this.scene);
    this.boat = new Boat();
    this.scene.add(this.boat.mesh);

    // Make sun track boat so shadow resolution stays optimal
    this.sunLight.target = this.boat.mesh;

    // 6. Camera Controller
    this.cameraController = new ThirdPersonCamera(this.camera, {
      distance: 14.0,
      height: 7.2,
      lookAhead: 14.5,
      posSmoothing: 0.088,
      lookSmoothing: 0.12,
    });
    this.cameraController.snapToBoat(this.boat);
  }

  createHUD() {
    this.hudContainer = document.createElement("div");
    this.hudContainer.className = "three-hud-overlay";
    this.hudContainer.innerHTML = `
      <div class="hud-topbar">
        <div class="hud-stats">
          <span id="hud-time">⏱ Time: 0.0s</span>
          <span class="hud-sep">|</span>
          <span id="hud-hits">💥 Hits: 0</span>
          <span class="hud-sep">|</span>
          <span id="hud-speed">⚡ Speed: 0</span>
        </div>
        <div class="hud-actions">
          <button id="btn-toggle-view" class="hud-btn hud-btn-mode">Switch to 2D Phaser</button>
        </div>
      </div>

      <div id="start-overlay" class="modal-card">
        <h2>🛶 WORST ROWERS EVER (3D) 🛶</h2>
        <div class="control-grid">
          <div class="player-box p1-box">
            <span class="player-badge p1-badge">PLAYER 1 (Blue)</span>
            <div class="key-hints"><strong>W / S</strong> : Row Forward / Back</div>
            <div class="key-hints"><strong>A / D</strong> : Turn Left / Right</div>
          </div>
          <div class="player-box p2-box">
            <span class="player-badge p2-badge">PLAYER 2 (Orange)</span>
            <div class="key-hints"><strong>↑ / ↓</strong> : Row Forward / Back</div>
            <div class="key-hints"><strong>← / →</strong> : Turn Left / Right</div>
          </div>
        </div>
        <p class="coop-hint">Both rowers share the same boat! Coordinate your paddling or spin out of control!</p>
        <button id="btn-start" class="btn-primary">▶  PRESS SPACE OR CLICK TO ROW  ◀</button>
      </div>

      <div id="finish-overlay" class="modal-card finish-modal" style="display:none;">
        <h2>🏁 FINISH LINE REACHED! 🏁</h2>
        <div id="finish-title" class="finish-title">🏆 Great Coordination! 🏆</div>
        <div class="finish-stats-grid">
          <div class="stat-pill"><span class="label">Time</span><span id="finish-time-val" class="val">0s</span></div>
          <div class="stat-pill"><span class="label">Collisions</span><span id="finish-hits-val" class="val">0</span></div>
        </div>
        <p class="rematch-hint">Press <strong>R</strong> or click below to race again</p>
        <button id="btn-rematch" class="btn-primary">🔄 RACE AGAIN (R)</button>
      </div>
    `;

    this.container.appendChild(this.hudContainer);

    this.timeEl = this.hudContainer.querySelector("#hud-time");
    this.hitsEl = this.hudContainer.querySelector("#hud-hits");
    this.speedEl = this.hudContainer.querySelector("#hud-speed");
    this.startOverlay = this.hudContainer.querySelector("#start-overlay");
    this.finishOverlay = this.hudContainer.querySelector("#finish-overlay");
    this.finishTitleEl = this.hudContainer.querySelector("#finish-title");
    this.finishTimeValEl = this.hudContainer.querySelector("#finish-time-val");
    this.finishHitsValEl = this.hudContainer.querySelector("#finish-hits-val");

    this.hudContainer.querySelector("#btn-start").addEventListener("click", () => this.startGame());
    this.hudContainer.querySelector("#btn-rematch").addEventListener("click", () => this.restartGame());

    const toggleBtn = this.hudContainer.querySelector("#btn-toggle-view");
    if (toggleBtn && this.onSwitchTo2D) {
      toggleBtn.addEventListener("click", () => {
        this.destroy();
        this.onSwitchTo2D();
      });
    }
  }

  startGame() {
    if (!this.started) {
      this.started = true;
      this.startTime = performance.now();
      this.startOverlay.style.display = "none";
    }
  }

  restartGame() {
    this.boat.reset(0, 20);
    this.cameraController.snapToBoat(this.boat);
    this.started = true;
    this.finished = false;
    this.startTime = performance.now();
    this.finishOverlay.style.display = "none";
    this.startOverlay.style.display = "none";
  }

  onWindowResize() {
    const width = this.container.clientWidth || 960;
    const height = Math.min(window.innerHeight - 80, 600);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  start() {
    this.isRunning = true;
    this.clock.start();
    requestAnimationFrame(this.animate);
  }

  animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsedTime = this.clock.getElapsedTime();

    // Check keyboard shortcuts
    if (this.input.isSpacePressed() && !this.started) {
      this.startGame();
    }
    if (this.input.isRestartPressed() && (this.started || this.finished)) {
      this.restartGame();
    }

    const p1 = this.input.getPlayer1();
    const p2 = this.input.getPlayer2();

    if (this.started && !this.finished) {
      // 1. Update boat physics with dual player input
      this.boat.update(dt, p1, p2, elapsedTime);

      // 2. Riverbank collision check
      const bankCol = this.river.checkRiverbankCollision(this.boat.x, this.boat.z);
      if (bankCol.collided) {
        this.boat.deflect(bankCol.normalX, 0, 0.42);
        this.boat.x += bankCol.normalX * (bankCol.penetration + 0.12);
        this.cameraController.triggerShake(0.65);
      }

      // 3. Obstacle collision check
      const obCol = this.river.checkObstacleCollisions(this.boat.x, this.boat.z, this.boat.radius);
      if (obCol.collided) {
        this.boat.deflect(obCol.normalX, obCol.normalZ, 0.52);
        this.boat.x += obCol.normalX * (obCol.penetration + 0.18);
        this.boat.z += obCol.normalZ * (obCol.penetration + 0.18);
        this.cameraController.triggerShake(0.85);
      }

      // 4. Update HUD
      const raceSeconds = ((performance.now() - this.startTime) / 1000).toFixed(1);
      this.timeEl.textContent = `⏱ Time: ${raceSeconds}s`;
      this.hitsEl.textContent = `💥 Hits: ${this.boat.collisions}`;
      this.speedEl.textContent = `⚡ Speed: ${Math.abs(this.boat.speed * 4).toFixed(0)}`;

      // 5. Finish condition check
      if (this.boat.z <= this.river.finishZ) {
        this.finished = true;
        this.finishOverlay.style.display = "block";
        this.finishTimeValEl.textContent = `${raceSeconds}s`;
        this.finishHitsValEl.textContent = `${this.boat.collisions}`;

        let rating = "🏆 Masters of the River! 🏆";
        if (this.boat.collisions > 5) {
          rating = "🤪 Professional Boat Spinners! 🤪";
        } else if (this.boat.collisions > 2) {
          rating = "🌀 Not Bad, Rowers! 🌀";
        }
        this.finishTitleEl.textContent = rating;
      }
    }

    // River animations (water ripple & bobbing buoys)
    this.river.update(elapsedTime);

    // Dynamic third-person camera follow
    this.cameraController.update(this.boat, dt);

    // Keep sunlight tracking boat region
    this.sunLight.position.set(this.boat.x - 25, 55, this.boat.z + 30);

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener("resize", this.onWindowResize);
    if (this.input) this.input.destroy();
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.hudContainer && this.hudContainer.parentNode) {
      this.hudContainer.parentNode.removeChild(this.hudContainer);
    }
  }
}
