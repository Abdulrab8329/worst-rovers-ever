// Backup of working prototype from Phase 0
import Phaser from "phaser";
import "./style.css";

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    const { width, height } = this.scale;

    this.physicsState = {
      x: width / 2,
      y: height / 2,
      angle: 0,
      speed: 0,
      turnSpeed: 0,
      collisions: 0,
    };

    this.started = false;
    this.finished = false;
    this.startTime = 0;

    // River background
    const river = this.add.graphics();
    river.fillStyle(0x167d9a);
    river.fillRect(0, 0, width, height);

    // River banks
    river.fillStyle(0x246b43);
    river.fillRect(0, 0, 65, height);
    river.fillRect(width - 65, 0, 65, height);

    river.fillStyle(0x46a86b);
    for (let y = 0; y < height; y += 45) {
      river.fillCircle(25, y, 12);
      river.fillCircle(width - 25, y + 20, 12);
    }

    // Water ripples
    river.lineStyle(2, 0x66c5d5, 0.5);
    for (let y = 25; y < height; y += 55) {
      river.beginPath();
      river.moveTo(100, y);
      river.lineTo(180, y + 8);
      river.moveTo(width - 180, y + 15);
      river.lineTo(width - 100, y + 5);
      river.strokePath();
    }

    // Finish line
    const finish = this.add.graphics();
    finish.fillStyle(0xffffff, 0.9);
    for (let x = 75; x < width - 75; x += 30) {
      finish.fillRect(x, 85, 15, 15);
      finish.fillRect(x + 15, 100, 15, 15);
    }
    finish.fillStyle(0xffffff);
    finish.fillRect(0, 65, width, 4);
    this.add.text(width / 2, 35, "FINISH LINE", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Obstacles
    this.obstacles = [];
    for (let i = 0; i < 7; i++) {
      const x = Phaser.Math.Between(120, width - 120);
      const y = Phaser.Math.Between(150, height - 100);
      const rock = this.add.ellipse(x, y, 34, 25, 0x65584a);
      rock.setStrokeStyle(3, 0x453a30);
      this.obstacles.push(rock);
    }

    // Boat container: all boat graphics rotate together.
    this.boat = this.add.container(width / 2, height - 100);

    const hull = this.add.graphics();
    hull.fillStyle(0x8b4c24);
    hull.lineStyle(3, 0xf0c38a);
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

    // Seats
    const seats = this.add.graphics();
    seats.fillStyle(0xd8a16b);
    seats.fillRect(-21, -12, 42, 7);
    seats.fillRect(-21, 20, 42, 7);

    // Two rowers
    const rowers = this.add.graphics();
    rowers.fillStyle(0xffcf9e);
    rowers.fillCircle(-8, -22, 8);
    rowers.fillCircle(8, 12, 8);
    rowers.fillStyle(0x315bd6);
    rowers.fillRoundedRect(-15, -16, 14, 19, 5);
    rowers.fillStyle(0xef654b);
    rowers.fillRoundedRect(1, 18, 14, 19, 5);

    // Paddles
    this.paddles = this.add.graphics();
    this.boat.add([hull, seats, rowers, this.paddles]);

    this.hud = this.add.text(18, 16, "", {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
      lineSpacing: 8,
      backgroundColor: "#103b49cc",
      padding: { x: 12, y: 10 },
    }).setDepth(10);

    this.message = this.add.text(width / 2, height / 2, "", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      backgroundColor: "#103b49dd",
      padding: { x: 22, y: 18 },
    }).setOrigin(0.5).setDepth(20);

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

    this.message.setText(
      "WORST ROWERS EVER\n\n" +
      "PLAYER 1: W A S D\n" +
      "PLAYER 2: ARROW KEYS\n\n" +
      "W / ↑ = Paddle forward\n" +
      "S / ↓ = Paddle backward\n" +
      "A / ← = Turn left\n" +
      "D / → = Turn right\n\n" +
      "Press SPACE to start!"
    );

    this.input.keyboard.on("keydown-SPACE", () => {
      if (!this.started) {
        this.started = true;
        this.startTime = this.time.now;
        this.message.setText("");
      }
    });

    this.input.keyboard.on("keydown-R", () => this.scene.restart());
  }

  update(_time, delta) {
    if (!this.started || this.finished) return;

    const dt = Math.min(delta / 1000, 0.04);
    const k = this.keys;
    const p = this.physicsState;

    // Both players contribute to the same boat.
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

    // Turning is more dramatic when the boat is moving.
    p.angle += p.turnSpeed * (0.35 + Math.abs(p.speed) / 130) * dt;

    p.x += Math.cos(p.angle - Math.PI / 2) * p.speed * dt;
    p.y += Math.sin(p.angle - Math.PI / 2) * p.speed * dt;

    // River boundaries
    const { width, height } = this.scale;
    if (p.x < 90 || p.x > width - 90) {
      p.x = Phaser.Math.Clamp(p.x, 90, width - 90);
      p.speed *= -0.35;
      p.turnSpeed += p.x < width / 2 ? 1.3 : -1.3;
      p.collisions++;
    }

    // Obstacle collisions
    for (const rock of this.obstacles) {
      const distance = Phaser.Math.Distance.Between(
        p.x, p.y, rock.x, rock.y
      );

      if (distance < 36) {
        p.speed *= -0.5;
        p.turnSpeed += p.x < rock.x ? -1.1 : 1.1;
        p.collisions++;

        // Push the boat away to prevent repeated collisions.
        p.x += (p.x - rock.x) * 0.15;
        p.y += (p.y - rock.y) * 0.15;
      }
    }

    this.boat.setPosition(p.x, p.y);
    this.boat.setRotation(p.angle);

    // Paddle animation follows player input.
    this.paddles.clear();
    const moving = forward !== 0 || steering !== 0;
    const paddleAngle = moving ? Math.sin(this.time.now / 100) * 0.45 : 0;

    this.paddles.lineStyle(5, 0xe3bd82);
    this.paddles.beginPath();
    this.paddles.moveTo(-20, -24);
    this.paddles.lineTo(-47, -18 + paddleAngle * 20);
    this.paddles.moveTo(20, 17);
    this.paddles.lineTo(47, 23 - paddleAngle * 20);
    this.paddles.strokePath();

    // Finish line
    if (p.y < 80) {
      this.finished = true;
      const seconds = ((this.time.now - this.startTime) / 1000).toFixed(1);
      this.message.setText(
        `FINISH!\n\nTime: ${seconds} seconds\nCollisions: ${p.collisions}\n\n` +
        (p.collisions > 4 ? "Professional Boat Spinners!" : "Not bad, rowers!") +
        "\n\nPress R to race again"
      );
    }

    const elapsed = ((this.time.now - this.startTime) / 1000).toFixed(1);
    this.hud.setText(
      `WORST ROWERS EVER\nTime: ${elapsed}s\n` +
      `Collisions: ${p.collisions}\nSpeed: ${Math.abs(p.speed).toFixed(0)}`
    );
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 600,
  backgroundColor: "#167d9a",
  scene: GameScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
 