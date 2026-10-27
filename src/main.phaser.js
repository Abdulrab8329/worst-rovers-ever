import Phaser from "phaser";
import "./style.css";
import { createProceduralTextures } from "./game/proceduralTextures.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    const { width, height } = this.scale;

    // Generate procedural textures for water, rocks, driftwood, buoys, and foam
    createProceduralTextures(this);

    // Initial boat physics state
    this.physicsState = {
      x: width / 2,
      y: height - 100,
      angle: 0,
      speed: 0,
      turnSpeed: 0,
      collisions: 0,
    };

    this.started = false;
    this.finished = false;
    this.startTime = 0;
    this.lastWakeTime = 0;

    // -------------------------------------------------------------
    // 1. LAYERED PROCEDURAL WATER & CURRENT (Depths 0 - 2)
    // -------------------------------------------------------------
    this.waterBase = this.add.tileSprite(width / 2, height / 2, width, height, "water_base").setDepth(0);
    this.waterShimmer = this.add.tileSprite(width / 2, height / 2, width, height, "water_shimmer").setDepth(1).setAlpha(0.6);

    const channelDepth = this.add.graphics().setDepth(2);
    channelDepth.fillStyle(0x062835, 0.16);
    channelDepth.fillRect(160, 0, width - 320, height);
    channelDepth.fillStyle(0x041d27, 0.12);
    channelDepth.fillRect(240, 0, width - 480, height);

    // -------------------------------------------------------------
    // 2. NATURAL CURVED RIVERBANKS (Depths 3 - 5)
    // -------------------------------------------------------------
    this.getLeftBankX = (y) => 82 + Math.sin(y * 0.014) * 14 + Math.sin(y * 0.032) * 7;
    this.getRightBankX = (y) => (width - 82) + Math.cos(y * 0.013) * 14 - Math.sin(y * 0.030) * 7;

    const bankShadow = this.add.graphics().setDepth(3);
    bankShadow.fillStyle(0x02161f, 0.38);

    bankShadow.beginPath();
    for (let y = 0; y <= height; y += 15) {
      const bx = this.getLeftBankX(y) + 14;
      if (y === 0) bankShadow.moveTo(bx, y);
      else bankShadow.lineTo(bx, y);
    }
    bankShadow.lineTo(0, height);
    bankShadow.lineTo(0, 0);
    bankShadow.closePath();
    bankShadow.fillPath();

    bankShadow.beginPath();
    for (let y = 0; y <= height; y += 15) {
      const bx = this.getRightBankX(y) - 14;
      if (y === 0) bankShadow.moveTo(bx, y);
      else bankShadow.lineTo(bx, y);
    }
    bankShadow.lineTo(width, height);
    bankShadow.lineTo(width, 0);
    bankShadow.closePath();
    bankShadow.fillPath();

    const banks = this.add.graphics().setDepth(4);
    banks.fillStyle(0x4a4132);
    this.drawCurvedBank(banks, 0, (y) => this.getLeftBankX(y) + 5, height, true);
    this.drawCurvedBank(banks, width, (y) => this.getRightBankX(y) - 5, height, false);

    banks.fillStyle(0x322416);
    this.drawCurvedBank(banks, 0, (y) => this.getLeftBankX(y) + 2, height, true);
    this.drawCurvedBank(banks, width, (y) => this.getRightBankX(y) - 2, height, false);

    banks.fillStyle(0x194324);
    this.drawCurvedBank(banks, 0, (y) => this.getLeftBankX(y) - 2, height, true);
    this.drawCurvedBank(banks, width, (y) => this.getRightBankX(y) + 2, height, false);

    banks.fillStyle(0x276637);
    this.drawCurvedBank(banks, 0, (y) => this.getLeftBankX(y) - 6, height, true);
    this.drawCurvedBank(banks, width, (y) => this.getRightBankX(y) + 6, height, false);

    const foliage = this.add.graphics().setDepth(5);
    for (let y = 15; y < height; y += 38) {
      const leftX = this.getLeftBankX(y);
      const rightX = this.getRightBankX(y);
      this.drawBushCluster(foliage, leftX - 22, y + ((y * 7) % 15));
      this.drawRiverReeds(foliage, leftX - 3, y + 16);
      this.drawBushCluster(foliage, rightX + 22, y + 12 - ((y * 5) % 12));
      this.drawRiverReeds(foliage, rightX + 3, y - 10);
    }

    this.shorelineFoam = this.add.graphics().setDepth(5);

    // -------------------------------------------------------------
    // 3. VARIED OBSTACLES: ROCKS & DRIFTWOOD (Depths 6 - 7)
    // -------------------------------------------------------------
    this.obstacles = [];
    const obstacleDefs = [
      { x: 230, y: 155, type: "boulder", scale: 0.95, radius: 22 },
      { x: 480, y: 175, type: "driftwood", scale: 1.0, radius: 24, rotation: -0.15 },
      { x: 710, y: 160, type: "cluster", scale: 0.95, radius: 20 },
      { x: 340, y: 285, type: "boulder", scale: 1.05, radius: 24 },
      { x: 620, y: 310, type: "driftwood", scale: 0.95, radius: 23, rotation: 0.22 },
      { x: 210, y: 415, type: "cluster", scale: 1.0, radius: 21 },
      { x: 505, y: 440, type: "boulder", scale: 0.90, radius: 21 },
      { x: 740, y: 430, type: "driftwood", scale: 1.0, radius: 24, rotation: -0.28 },
    ];

    const obstacleShadows = this.add.graphics().setDepth(6);
    const obstacleFoamGraphics = this.add.graphics().setDepth(6);
    this.obstacleFoamGraphics = obstacleFoamGraphics;

    for (const def of obstacleDefs) {
      const textureKey =
        def.type === "boulder"
          ? "rock_boulder"
          : def.type === "driftwood"
          ? "driftwood_log"
          : "rock_cluster";

      obstacleShadows.fillStyle(0x02161f, 0.38);
      const shadowW = def.type === "driftwood" ? 64 : 44;
      const shadowH = def.type === "driftwood" ? 22 : 30;
      obstacleShadows.fillEllipse(def.x + 6, def.y + 8, shadowW * def.scale, shadowH * def.scale);

      const sprite = this.add.image(def.x, def.y, textureKey).setDepth(7);
      sprite.setScale(def.scale);
      if (def.rotation) sprite.setRotation(def.rotation);

      this.obstacles.push({
        x: def.x,
        y: def.y,
        radius: def.radius,
        type: def.type,
        sprite,
      });
    }

    // -------------------------------------------------------------
    // 4. FINISH LINE & BUOYS (Depths 8 - 9)
    // -------------------------------------------------------------
    const finishLineGfx = this.add.graphics().setDepth(8);
    finishLineGfx.fillStyle(0x031822, 0.45);
    finishLineGfx.fillRect(90, 78, width - 180, 24);

    const finishStartX = 95;
    const finishEndX = width - 95;
    const sqSize = 12;
    for (let x = finishStartX; x < finishEndX; x += sqSize) {
      const col = Math.floor((x - finishStartX) / sqSize);
      finishLineGfx.fillStyle(col % 2 === 0 ? 0xffffff : 0x1a242c, 0.95);
      finishLineGfx.fillRect(x, 70, sqSize, sqSize);
      finishLineGfx.fillStyle(col % 2 === 1 ? 0xffffff : 0x1a242c, 0.95);
      finishLineGfx.fillRect(x, 82, sqSize, sqSize);
    }

    finishLineGfx.lineStyle(2, 0xf6ad55, 0.9);
    finishLineGfx.beginPath();
    finishLineGfx.moveTo(finishStartX, 69);
    finishLineGfx.lineTo(finishEndX, 69);
    finishLineGfx.moveTo(finishStartX, 95);
    finishLineGfx.lineTo(finishEndX, 95);
    finishLineGfx.strokePath();

    this.buoyLeft = this.add.image(finishStartX - 8, 82, "finish_buoy").setDepth(9);
    this.buoyRight = this.add.image(finishEndX + 8, 82, "finish_buoy").setDepth(9);

    this.finishSign = this.add.text(width / 2, 42, "🏁  FINISH LINE  🏁", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "19px",
      fontStyle: "bold",
      color: "#ffffff",
      backgroundColor: "rgba(12, 46, 58, 0.85)",
      padding: { x: 16, y: 7 },
    }).setOrigin(0.5).setDepth(9);

    // -------------------------------------------------------------
    // 5. BOAT, SHADOW & PADDLES (Depths 10 - 12)
    // -------------------------------------------------------------
    this.wakeRipples = [];

    this.boatShadow = this.add.ellipse(
      this.physicsState.x + 8,
      this.physicsState.y + 12,
      48,
      112,
      0x02161f,
      0.34
    ).setDepth(10);

    this.boat = this.add.container(width / 2, height - 100).setDepth(11);

    const hull = this.add.graphics();
    hull.fillStyle(0x82441f);
    hull.lineStyle(3, 0xe2b57b);
    hull.beginPath();
    hull.moveTo(0, -58);
    hull.lineTo(25, -30);
    hull.lineTo(23, 35);
    hull.lineTo(0, 55);
    hull.lineTo(-23, 35);
    hull.lineTo(-25, -30);
    hull.closePath();
    hull.fillPath();
    hull.strokePath();

    const seats = this.add.graphics();
    seats.fillStyle(0xd8a16b);
    seats.fillRect(-21, -12, 42, 7);
    seats.fillRect(-21, 20, 42, 7);

    const rowers = this.add.graphics();
    rowers.fillStyle(0xffcf9e);
    rowers.fillCircle(-8, -22, 8);
    rowers.fillCircle(8, 12, 8);
    rowers.fillStyle(0x2b6cb0);
    rowers.fillRoundedRect(-15, -16, 14, 19, 5);
    rowers.fillStyle(0xdd6b20);
    rowers.fillRoundedRect(1, 18, 14, 19, 5);

    this.paddles = this.add.graphics();
    this.boat.add([hull, seats, rowers, this.paddles]);

    // -------------------------------------------------------------
    // 6. HUD & INTERACTIVE UI (Depth 20)
    // -------------------------------------------------------------
    this.hud = this.add.text(24, 20, "", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "15px",
      color: "#e6f6f9",
      fontStyle: "bold",
      lineSpacing: 6,
      backgroundColor: "rgba(10, 36, 46, 0.82)",
      padding: { x: 14, y: 10 },
    }).setDepth(20);

    this.message = this.add.text(width / 2, height / 2, "", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      backgroundColor: "rgba(9, 32, 42, 0.94)",
      padding: { x: 28, y: 22 },
    }).setOrigin(0.5).setDepth(25);

    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.showTitleScreen();

    this.input.keyboard.on("keydown-SPACE", () => {
      if (!this.started) {
        this.started = true;
        this.startTime = this.time.now;
        this.message.setText("");
        this.message.setVisible(false);
      }
    });

    this.input.keyboard.on("keydown-R", () => this.scene.restart());
  }

  showTitleScreen() {
    this.message.setVisible(true);
    this.message.setText(
      "🛶 WORST ROWERS EVER (2D Phaser Prototype) 🛶\n\n" +
      "PLAYER 1 (Blue):   W · A · S · D\n" +
      "PLAYER 2 (Orange): ↑ · ← · ↓ · →\n\n" +
      "W / ↑ : Paddle forward    |    S / ↓ : Paddle backward\n" +
      "A / ← : Turn left         |    D / → : Turn right\n\n" +
      "Work together to reach the finish line!\n\n" +
      "▶  PRESS SPACE TO ROW  ◀"
    );
  }

  drawCurvedBank(graphics, originX, curveFunc, height, isLeft) {
    graphics.beginPath();
    for (let y = 0; y <= height; y += 15) {
      const bx = curveFunc(y);
      if (y === 0) graphics.moveTo(bx, y);
      else graphics.lineTo(bx, y);
    }
    graphics.lineTo(originX, height);
    graphics.lineTo(originX, 0);
    graphics.closePath();
    graphics.fillPath();
  }

  drawBushCluster(graphics, x, y) {
    graphics.fillStyle(0x1a4a27);
    graphics.fillCircle(x, y, 16);
    graphics.fillStyle(0x276d3a);
    graphics.fillCircle(x - 6, y - 5, 13);
    graphics.fillCircle(x + 6, y - 4, 12);
    graphics.fillStyle(0x38924f);
    graphics.fillCircle(x, y - 8, 9);
    if ((x + y) % 5 === 0) {
      graphics.fillStyle(0xfff3a8);
      graphics.fillCircle(x + 2, y - 7, 2.5);
    }
  }

  drawRiverReeds(graphics, x, y) {
    graphics.lineStyle(2, 0x5a8a3a, 0.85);
    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(x + 4, y - 14);
    graphics.moveTo(x + 3, y);
    graphics.lineTo(x + 9, y - 18);
    graphics.moveTo(x - 3, y);
    graphics.lineTo(x - 2, y - 12);
    graphics.strokePath();
    graphics.fillStyle(0x4a2e18);
    graphics.fillRect(x + 7, y - 20, 3, 7);
  }

  updateShorelineFoam(time) {
    const foam = this.shorelineFoam;
    foam.clear();
    const { height } = this.scale;
    const pulse = Math.sin(time / 280) * 1.5;

    foam.lineStyle(2.5, 0xc8f0f8, 0.45 + Math.sin(time / 320) * 0.15);
    foam.beginPath();
    for (let y = 0; y <= height; y += 18) {
      const fx = this.getLeftBankX(y) + 2 + pulse;
      if (y === 0) foam.moveTo(fx, y);
      else foam.lineTo(fx, y);
    }
    foam.strokePath();

    foam.beginPath();
    for (let y = 0; y <= height; y += 18) {
      const fx = this.getRightBankX(y) - 2 - pulse;
      if (y === 0) foam.moveTo(fx, y);
      else foam.lineTo(fx, y);
    }
    foam.strokePath();
  }

  updateObstacleFoam(time) {
    const gfx = this.obstacleFoamGraphics;
    gfx.clear();
    const pulse = Math.sin(time / 220);

    for (const ob of this.obstacles) {
      gfx.lineStyle(2, 0xcaf0f8, 0.5 + pulse * 0.15);
      gfx.beginPath();
      const foamW = ob.type === "driftwood" ? 36 : 24;
      gfx.arc(ob.x, ob.y - 4, foamW, Math.PI * 0.95, Math.PI * 2.05, false);
      gfx.strokePath();
    }
  }

  emitBoatWake(x, y, angle) {
    const sternX = x - Math.cos(angle - Math.PI / 2) * 55;
    const sternY = y - Math.sin(angle - Math.PI / 2) * 55;

    const ripple = this.add.image(sternX, sternY, "water_ripple").setDepth(2).setAlpha(0.6).setScale(0.7);
    ripple.setRotation(angle);

    this.tweens.add({
      targets: ripple,
      scaleX: 1.6,
      scaleY: 1.4,
      alpha: 0,
      duration: 750,
      ease: "Quad.easeOut",
      onComplete: () => {
        ripple.destroy();
      },
    });
  }

  update(_time, delta) {
    const dt = Math.min(delta / 1000, 0.04);

    this.waterBase.tilePositionY += 34 * dt;
    this.waterShimmer.tilePositionY += 56 * dt;
    this.waterShimmer.tilePositionX = Math.sin(_time / 1100) * 10;

    this.updateShorelineFoam(_time);
    this.updateObstacleFoam(_time);

    this.buoyLeft.y = 82 + Math.sin(_time / 380) * 2.5;
    this.buoyRight.y = 82 + Math.cos(_time / 410) * 2.5;

    if (!this.started || this.finished) return;

    const k = this.keys;
    const p = this.physicsState;

    const forward =
      (k.w.isDown ? 1 : 0) -
      (k.s.isDown ? 1 : 0) +
      (k.up.isDown ? 1 : 0) -
      (k.down.isDown ? 1 : 0);

    const steering =
      (k.a.isDown ? -1 : 0) +
      (k.d.isDown ? 1 : 0) +
      (k.left.isDown ? -1 : 0) +
      (k.right.isDown ? 1 : 0);

    p.speed += forward * 150 * dt;
    p.speed *= Math.pow(0.985, dt * 60);
    p.speed = Phaser.Math.Clamp(p.speed, -100, 230);

    p.turnSpeed += steering * 3.2 * dt;
    p.turnSpeed *= Math.pow(0.90, dt * 60);
    p.turnSpeed = Phaser.Math.Clamp(p.turnSpeed, -2.8, 2.8);

    p.angle += p.turnSpeed * (0.35 + Math.abs(p.speed) / 130) * dt;

    p.x += Math.cos(p.angle - Math.PI / 2) * p.speed * dt;
    p.y += Math.sin(p.angle - Math.PI / 2) * p.speed * dt;

    if (Math.abs(p.speed) > 22 && _time - this.lastWakeTime > 160) {
      this.lastWakeTime = _time;
      this.emitBoatWake(p.x, p.y, p.angle);
    }

    const leftLimit = this.getLeftBankX(p.y) + 26;
    const rightLimit = this.getRightBankX(p.y) - 26;

    if (p.x < leftLimit) {
      p.x = leftLimit;
      p.speed *= -0.35;
      p.turnSpeed += 1.3;
      p.collisions++;
      this.emitBoatWake(p.x, p.y, p.angle);
    } else if (p.x > rightLimit) {
      p.x = rightLimit;
      p.speed *= -0.35;
      p.turnSpeed -= 1.3;
      p.collisions++;
      this.emitBoatWake(p.x, p.y, p.angle);
    }

    for (const ob of this.obstacles) {
      const distance = Phaser.Math.Distance.Between(p.x, p.y, ob.x, ob.y);
      const minDistance = ob.radius + 14;

      if (distance < minDistance) {
        p.speed *= -0.5;
        p.turnSpeed += p.x < ob.x ? -1.1 : 1.1;
        p.collisions++;

        const pushFactor = 0.16;
        p.x += (p.x - ob.x) * pushFactor;
        p.y += (p.y - ob.y) * pushFactor;

        this.emitBoatWake(p.x, p.y, p.angle);
      }
    }

    this.boat.setPosition(p.x, p.y);
    this.boat.setRotation(p.angle);

    this.boatShadow.setPosition(p.x + 8, p.y + 12);
    this.boatShadow.setRotation(p.angle);

    this.paddles.clear();
    const moving = forward !== 0 || steering !== 0;
    const paddleAngle = moving ? Math.sin(_time / 100) * 0.45 : 0;

    this.paddles.lineStyle(5, 0xe3bd82);
    this.paddles.beginPath();
    this.paddles.moveTo(-20, -24);
    this.paddles.lineTo(-47, -18 + paddleAngle * 20);
    this.paddles.moveTo(20, 17);
    this.paddles.lineTo(47, 23 - paddleAngle * 20);
    this.paddles.strokePath();

    if (p.y < 80) {
      this.finished = true;
      const seconds = ((this.time.now - this.startTime) / 1000).toFixed(1);
      const title =
        p.collisions === 0
          ? "🏆 Masters of the River! 🏆"
          : p.collisions <= 2
          ? "👏 Great Coordination! 👏"
          : p.collisions <= 5
          ? "🌀 Not Bad, Rowers! 🌀"
          : "🤪 Professional Boat Spinners! 🤪";

      this.message.setVisible(true);
      this.message.setText(
        `🏁 FINISH! 🏁\n\n` +
        `⏱ Time: ${seconds} seconds\n` +
        `💥 Collisions: ${p.collisions}\n\n` +
        `${title}\n\n` +
        `Press R to race again`
      );
    }

    const elapsed = ((this.time.now - this.startTime) / 1000).toFixed(1);
    this.hud.setText(
      `⏱ Time: ${elapsed}s  |  💥 Hits: ${p.collisions}  |  ⚡ Speed: ${Math.abs(p.speed).toFixed(0)}`
    );
  }
}

export function startPhaserGame(parentElement = "game") {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentElement,
    width: 960,
    height: 600,
    backgroundColor: "#0d4c62",
    scene: GameScene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
}
