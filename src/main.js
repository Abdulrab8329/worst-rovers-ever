import "./style.css";
import { ThreeScene } from "./three/ThreeScene.js";
import { startPhaserGame } from "./main.phaser.js";

const gameContainer = document.getElementById("game");

// Check query param (?mode=2d or ?mode=3d), defaulting to 3d
const urlParams = new URLSearchParams(window.location.search);
let currentMode = urlParams.get("mode") === "2d" ? "2d" : "3d";

let activeInstance = null;

function mountGame(mode) {
  if (activeInstance) {
    if (typeof activeInstance.destroy === "function") {
      activeInstance.destroy(true);
    }
  }
  gameContainer.innerHTML = "";

  if (mode === "2d") {
    // Top banner allowing instant switch back to 3D
    const banner = document.createElement("div");
    banner.style.cssText =
      "position:absolute; top:16px; right:16px; z-index:99; pointer-events:auto;";
    banner.innerHTML = `<button id="btn-to-3d" class="hud-btn">Switch to 3D Three.js</button>`;
    gameContainer.appendChild(banner);

    banner.querySelector("#btn-to-3d").addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("mode", "3d");
      window.location.href = url.toString();
    });

    activeInstance = startPhaserGame("game");
  } else {
    activeInstance = new ThreeScene(gameContainer, () => {
      const url = new URL(window.location.href);
      url.searchParams.set("mode", "2d");
      window.location.href = url.toString();
    });
  }
}

mountGame(currentMode);
