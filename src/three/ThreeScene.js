import * as THREE from "three";
import { Boat } from "./Boat.js";
import { RiverEnvironment } from "./RiverEnvironment.js";
import { ThirdPersonCamera } from "./ThirdPersonCamera.js";
import { InputManager } from "./InputManager.js";

/**
 * ThreeScene - Core 3D Scene Controller
 * Manages Three.js scene lifecycle, renderer, lighting, shadows, physics loops,
 * debounced collision handling, and HUD overlay.
 */
export class ThreeScene {
  constructor(containerElement, onSwitchTo2D) {
    this.container = containerElement;
    this.onSwitchTo2D = onSwitchTo2D;

    this.started = false;
    this.finished = false;
    this.startTime = 0;
    this.finalTime = 0;
    this.isRunning = false;

    this.currentTheme = localStorage.getItem("wre_theme") || "day";

    this.initScene();
    this.createHUD();
    this.setTheme(this.currentTheme);
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
    this.scene.background = new THREE.Color(0x8cd3ea);
    this.scene.fog = new THREE.FogExp2(0x9de0f5, 0.0055);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(56, width / height, 0.4, 500);

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
    this.hemiLight = new THREE.HemisphereLight(0xf2faff, 0x3e743a, 0.95);
    this.scene.add(this.hemiLight);

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

    // Track boat region for sharp shadows
    this.sunLight.target = this.boat.mesh;

    // 6. Camera Controller
    this.cameraController = new ThirdPersonCamera(this.camera, {
      distance: 14.8,
      height: 7.6,
      lookAhead: 15.5,
      posSmoothing: 0.088,
      lookSmoothing: 0.11,
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
          <button id="btn-toggle-theme" class="hud-btn hud-btn-theme">🌙 Night Mode</button>
          <button id="btn-toggle-view" class="hud-btn hud-btn-mode">Switch to 2D</button>
        </div>
      </div>

      <div id="start-overlay" class="modal-card">
        <h2>🛶 WORST ROWERS EVER (3D) 🛶</h2>
        <div class="control-grid">
          <div class="player-box p1-box">
            <span class="player-badge p1-badge">PLAYER 1 (Blue — Front)</span>
            <div class="key-hints"><strong>W / S</strong> : Row Forward / Back</div>
            <div class="key-hints"><strong>A / D</strong> : Turn Left / Right</div>
          </div>
          <div class="player-box p2-box">
            <span class="player-badge p2-badge">PLAYER 2 (Orange — Rear)</span>
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

    const themeBtn = this.hudContainer.querySelector("#btn-toggle-theme");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        this.setTheme(this.currentTheme === "day" ? "dark" : "day");
      });
    }

    const toggleBtn = this.hudContainer.querySelector("#btn-toggle-view");
    if (toggleBtn && this.onSwitchTo2D) {
      toggleBtn.addEventListener("click", () => {
        this.destroy();
        this.onSwitchTo2D();
      });
    }
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    try {
      localStorage.setItem("wre_theme", themeName);
    } catch (_) {}

    const themeBtn = this.hudContainer ? this.hudContainer.querySelector("#btn-toggle-theme") : null;

    if (themeName === "day") {
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-day");

      // Beautiful bright sunny daytime scenery
      if (this.scene) {
        this.scene.background.setHex(0x8cd3ea);
        if (this.scene.fog) {
          this.scene.fog.color.setHex(0x9de0f5);
          this.scene.fog.density = 0.0052;
        }
      }
      if (this.sunLight) {
        this.sunLight.color.setHex(0xfff6e2);
        this.sunLight.intensity = 1.6;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0xf4faff);
        this.hemiLight.groundColor.setHex(0x3e743a);
        this.hemiLight.intensity = 0.95;
      }
      if (this.river) {
        this.river.setTheme("day");
      }
      if (themeBtn) {
        themeBtn.textContent = "🌙 Night Mode";
      }
    } else {
      document.body.classList.remove("theme-day");
      document.body.classList.add("theme-dark");

      // Atmospheric dark midnight river
      if (this.scene) {
        this.scene.background.setHex(0x0e313f);
        if (this.scene.fog) {
          this.scene.fog.color.setHex(0x0e313f);
          this.scene.fog.density = 0.0072;
        }
      }
      if (this.sunLight) {
        this.sunLight.color.setHex(0xfff7e6);
        this.sunLight.intensity = 1.25;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0xbce6ff);
        this.hemiLight.groundColor.setHex(0x1f4726);
        this.hemiLight.intensity = 0.75;
      }
      if (this.river) {
        this.river.setTheme("dark");
      }
      if (themeBtn) {
        themeBtn.textContent = "☀️ Day Mode";
      }
    }
  }

  startGame() {
    if (!this.started) {
      this.started = true;
      this.finished = false;
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
    this.finalTime = 0;
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

    // Edge-triggered key shortcuts
    if (this.input.consumeSpace() && !this.started) {
      this.startGame();
    }
    if (this.input.consumeRestart() && (this.started || this.finished)) {
      this.restartGame();
    }

    const p1 = this.input.getPlayer1();
    const p2 = this.input.getPlayer2();

    if (this.started && !this.finished) {
      // 1. Update boat physics with dual player input
      this.boat.update(dt, p1, p2, elapsedTime);

      // 2. Debounced Riverbank collision check
      const bankCol = this.river.checkRiverbankCollision(this.boat.x, this.boat.z);
      if (bankCol.collided) {
        const isNewImpact = this.boat.deflectBank(bankCol.normalX, elapsedTime);
        this.boat.x += bankCol.normalX * (bankCol.penetration + 0.1);
        if (isNewImpact) {
          this.cameraController.triggerShake(0.5);
        }
      }

      // 3. Debounced Obstacle collision check
      const obCol = this.river.checkObstacleCollisions(this.boat.x, this.boat.z, this.boat.radius);
      if (obCol.collided) {
        const isNewImpact = this.boat.deflectObstacle(
          obCol.normalX,
          obCol.normalZ,
          obCol.obstacleId,
          elapsedTime
        );
        this.boat.x += obCol.normalX * (obCol.penetration + 0.14);
        this.boat.z += obCol.normalZ * (obCol.penetration + 0.14);
        if (isNewImpact) {
          this.cameraController.triggerShake(0.68);
        }
      } else {
        this.boat.clearObstacleContact();
      }

      // 4. Update HUD stats
      const raceSeconds = ((performance.now() - this.startTime) / 1000).toFixed(1);
      this.timeEl.textContent = `⏱ Time: ${raceSeconds}s`;
      this.hitsEl.textContent = `💥 Hits: ${this.boat.collisions}`;
      this.speedEl.textContent = `⚡ Speed: ${Math.abs(this.boat.speed * 4).toFixed(0)}`;

      // 5. Finish condition check (crossed finish line upstream)
      if (this.boat.z <= this.river.finishZ) {
        this.finished = true;
        this.finalTime = raceSeconds;
        this.finishOverlay.style.display = "block";
        this.finishTimeValEl.textContent = `${this.finalTime}s`;
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

    // River animations (flowing water ripples & bobbing buoys)
    this.river.update(elapsedTime);

    // Dynamic third-person camera follow
    this.cameraController.update(this.boat, dt);

    // Keep sunlight tracking boat region for optimal shadow map coverage
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
