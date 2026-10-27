/**
 * Procedural texture generation for Worst Rowers Ever (Phase 1)
 * Generates seamless water tiles, rocks, driftwood, buoys, and foam textures.
 */

export function createProceduralTextures(scene) {
  const textures = scene.textures;

  // 1. Deep River Water Base Texture (256x256 seamless)
  if (!textures.exists("water_base")) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // River water gradient background
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, "#105a74");
    grad.addColorStop(0.5, "#146985");
    grad.addColorStop(1, "#0d4c62");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Flowing current bands (organic wavy bands)
    ctx.fillStyle = "rgba(30, 130, 160, 0.22)";
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(64, y + 10, 128, y - 10, 192, y + 8);
      ctx.bezierCurveTo(224, y + 12, 240, y + 4, 256, y);
      ctx.lineTo(256, y + 16);
      ctx.bezierCurveTo(240, y + 20, 224, y + 28, 192, y + 24);
      ctx.bezierCurveTo(128, y + 6, 64, y + 26, 0, y + 16);
      ctx.closePath();
      ctx.fill();
    }

    // Gentle sub-current swirls
    ctx.fillStyle = "rgba(50, 165, 195, 0.12)";
    for (let i = 0; i < 18; i++) {
      const rx = (i * 47) % 256;
      const ry = (i * 73) % 256;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 28, 7, (i * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    textures.addCanvas("water_base", canvas);
  }

  // 2. Surface Water Shimmer & Caustics Texture (256x256 seamless)
  if (!textures.exists("water_shimmer")) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 256, 256);

    // Fine wavy ripple highlights
    ctx.strokeStyle = "rgba(180, 235, 248, 0.28)";
    ctx.lineWidth = 1.6;
    for (let y = 8; y < 256; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(70, y - 6, 140, y + 6, 210, y - 4);
      ctx.bezierCurveTo(230, y - 6, 245, y - 2, 256, y);
      ctx.stroke();
    }

    // Specular water glints / highlights
    ctx.fillStyle = "rgba(220, 250, 255, 0.4)";
    const glints = [
      [35, 42], [90, 85], [160, 28], [210, 110], [50, 170],
      [135, 150], [225, 195], [80, 230], [175, 240], [20, 115]
    ];
    for (const [gx, gy] of glints) {
      ctx.beginPath();
      ctx.ellipse(gx, gy, 6, 1.8, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    textures.addCanvas("water_shimmer", canvas);
  }

  // 3. Faceted River Boulder Texture (64x64)
  if (!textures.exists("rock_boulder")) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    // Boulder body (faceted polygon)
    const points = [
      [32, 6], [52, 16], [58, 36], [48, 54],
      [30, 58], [12, 50], [6, 32], [14, 14]
    ];

    // Base tone
    ctx.fillStyle = "#4a443c";
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    // Shaded facets (bottom & right)
    ctx.fillStyle = "#2d2822";
    ctx.beginPath();
    ctx.moveTo(32, 34);
    ctx.lineTo(58, 36);
    ctx.lineTo(48, 54);
    ctx.lineTo(30, 58);
    ctx.lineTo(12, 50);
    ctx.closePath();
    ctx.fill();

    // Highlighted top facets
    ctx.fillStyle = "#746c60";
    ctx.beginPath();
    ctx.moveTo(32, 6);
    ctx.lineTo(52, 16);
    ctx.lineTo(32, 34);
    ctx.lineTo(14, 14);
    ctx.closePath();
    ctx.fill();

    // Top ridge highlight
    ctx.fillStyle = "#958c7e";
    ctx.beginPath();
    ctx.moveTo(28, 10);
    ctx.lineTo(42, 16);
    ctx.lineTo(32, 26);
    ctx.closePath();
    ctx.fill();

    // Moss / lichen patch on top
    ctx.fillStyle = "#496d36";
    ctx.beginPath();
    ctx.arc(26, 20, 6, 0, Math.PI * 2);
    ctx.arc(32, 18, 5, 0, Math.PI * 2);
    ctx.fill();

    // Wet waterline dark accent at base
    ctx.fillStyle = "rgba(15, 25, 30, 0.45)";
    ctx.beginPath();
    ctx.ellipse(32, 54, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    textures.addCanvas("rock_boulder", canvas);
  }

  // 4. Smooth Pebble Cluster Texture (56x56)
  if (!textures.exists("rock_cluster")) {
    const canvas = document.createElement("canvas");
    canvas.width = 56;
    canvas.height = 56;
    const ctx = canvas.getContext("2d");

    // Stone 1 (large center)
    ctx.fillStyle = "#48433d";
    ctx.beginPath();
    ctx.ellipse(28, 28, 16, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6d675f";
    ctx.beginPath();
    ctx.ellipse(26, 25, 11, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#918b82";
    ctx.beginPath();
    ctx.ellipse(25, 23, 6, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Stone 2 (top-left)
    ctx.fillStyle = "#3e3a35";
    ctx.beginPath();
    ctx.ellipse(15, 18, 10, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5c564f";
    ctx.beginPath();
    ctx.ellipse(14, 16, 6, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Stone 3 (bottom-right)
    ctx.fillStyle = "#36322d";
    ctx.beginPath();
    ctx.ellipse(39, 36, 11, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#58524b";
    ctx.beginPath();
    ctx.ellipse(38, 34, 7, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Wet ring
    ctx.fillStyle = "rgba(10, 20, 25, 0.35)";
    ctx.beginPath();
    ctx.ellipse(28, 38, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    textures.addCanvas("rock_cluster", canvas);
  }

  // 5. Driftwood Log Texture (76x32)
  if (!textures.exists("driftwood_log")) {
    const canvas = document.createElement("canvas");
    canvas.width = 76;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    // Main log body
    ctx.fillStyle = "#5e3e26";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(8, 8, 58, 16, 6);
    } else {
      ctx.rect(8, 8, 58, 16);
    }
    ctx.fill();

    // Bark shading (bottom)
    ctx.fillStyle = "#3f2817";
    ctx.fillRect(12, 17, 50, 7);

    // Bark highlight (top)
    ctx.fillStyle = "#845938";
    ctx.fillRect(12, 8, 48, 4);

    // Wood rings on cut end (left)
    ctx.fillStyle = "#a8784d";
    ctx.beginPath();
    ctx.ellipse(11, 16, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4a2d18";
    ctx.beginPath();
    ctx.ellipse(11, 16, 2, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Broken branch stub
    ctx.fillStyle = "#6b472c";
    ctx.beginPath();
    ctx.moveTo(42, 8);
    ctx.lineTo(46, 2);
    ctx.lineTo(51, 8);
    ctx.closePath();
    ctx.fill();

    // Moss patch on top
    ctx.fillStyle = "#426b34";
    ctx.beginPath();
    ctx.ellipse(30, 9, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    textures.addCanvas("driftwood_log", canvas);
  }

  // 6. Water Ripple / Wake Ring Texture (48x24)
  if (!textures.exists("water_ripple")) {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 24;
    const ctx = canvas.getContext("2d");

    ctx.strokeStyle = "rgba(190, 242, 255, 0.75)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(24, 12, 21, 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(24, 12, 14, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    textures.addCanvas("water_ripple", canvas);
  }

  // 7. Finish Line Buoy Texture (32x40)
  if (!textures.exists("finish_buoy")) {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");

    // Buoy body
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(16, 20, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red stripes
    ctx.fillStyle = "#e53e3e";
    ctx.beginPath();
    ctx.rect(4, 14, 24, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(7, 26, 18, 5);
    ctx.fill();

    // Top beacon/ring
    ctx.fillStyle = "#ecc94b";
    ctx.beginPath();
    ctx.arc(16, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Water shadow ring at buoy base
    ctx.fillStyle = "rgba(10, 30, 40, 0.35)";
    ctx.beginPath();
    ctx.ellipse(16, 34, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    textures.addCanvas("finish_buoy", canvas);
  }
}
