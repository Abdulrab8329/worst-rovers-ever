/**
 * InputManager for Worst Rowers Ever (3D Foundation)
 * Manages dual-player keyboard controls:
 * Player 1: W, A, S, D
 * Player 2: Arrow Keys (Up, Down, Left, Right)
 * Also handles Space (start) and R (restart) with edge-triggered consumption,
 * preventing browser scrolling.
 */

export class InputManager {
  constructor(domElement = window) {
    this.keys = {};
    this.spaceConsumed = false;
    this.restartConsumed = false;
    this.domElement = domElement;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  onKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = true;

    // Prevent arrow keys and space from scrolling the web page
    if (
      ["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "space"].includes(key)
    ) {
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = false;
    if (key === " " || key === "space") {
      this.spaceConsumed = false;
    }
    if (key === "r") {
      this.restartConsumed = false;
    }
  }

  getPlayer1() {
    return {
      forward: (this.keys["w"] ? 1 : 0) - (this.keys["s"] ? 1 : 0),
      steering: (this.keys["d"] ? 1 : 0) - (this.keys["a"] ? 1 : 0),
    };
  }

  getPlayer2() {
    return {
      forward: (this.keys["arrowup"] ? 1 : 0) - (this.keys["arrowdown"] ? 1 : 0),
      steering: (this.keys["arrowright"] ? 1 : 0) - (this.keys["arrowleft"] ? 1 : 0),
    };
  }

  consumeSpace() {
    if ((this.keys[" "] || this.keys["space"]) && !this.spaceConsumed) {
      this.spaceConsumed = true;
      return true;
    }
    return false;
  }

  consumeRestart() {
    if (this.keys["r"] && !this.restartConsumed) {
      this.restartConsumed = true;
      return true;
    }
    return false;
  }

  isSpacePressed() {
    return !!(this.keys[" "] || this.keys["space"]);
  }

  isRestartPressed() {
    return !!this.keys["r"];
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
