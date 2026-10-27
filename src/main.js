import "./style.css";
import { ThreeScene } from "./three/ThreeScene.js";
import { startPhaserGame } from "./main.phaser.js";

const gameContainer = document.getElementById("game");

// Initialize saved theme or default to beautiful Day Theme
const savedTheme = localStorage.getItem("wre_theme") || "day";
document.body.classList.remove("theme-day", "theme-dark");
document.body.classList.add(savedTheme === "day" ? "theme-day" : "theme-dark");

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
    // Action bar for 2D mode (Theme toggle + 3D switch)
    const banner = document.createElement("div");
    banner.style.cssText =
      "position:absolute; top:16px; right:16px; z-index:99; display:flex; gap:8px; pointer-events:auto;";
    const currentTheme = localStorage.getItem("wre_theme") || "day";
    banner.innerHTML = `
      <button id="btn-theme-2d" class="hud-btn">${currentTheme === "day" ? "🌙 Night Mode" : "☀️ Day Mode"}</button>
      <button id="btn-to-3d" class="hud-btn">Switch to 3D Three.js</button>
    `;
    gameContainer.appendChild(banner);

    const themeBtn = banner.querySelector("#btn-theme-2d");
    themeBtn.addEventListener("click", () => {
      const isDay = document.body.classList.contains("theme-day");
      const nextTheme = isDay ? "dark" : "day";
      document.body.classList.remove("theme-day", "theme-dark");
      document.body.classList.add(nextTheme === "day" ? "theme-day" : "theme-dark");
      localStorage.setItem("wre_theme", nextTheme);
      themeBtn.textContent = nextTheme === "day" ? "🌙 Night Mode" : "☀️ Day Mode";
    });

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
