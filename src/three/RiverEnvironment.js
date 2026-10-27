import * as THREE from "three";

/**
 * 3D River Environment:
 * - Flowing procedural water surface with subtle ripples and color variation
 * - Consistent-width natural 3D riverbanks with sandy shoreline and grassy embankments
 * - Fair, readable obstacle placements with unique IDs
 * - Finish line buoys and checkered banner
 */
export class RiverEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.finishZ = -300;

    // Mathematical curvature of the river centerline along Z
    this.getCenterlineX = (z) => Math.sin(z * 0.018) * 5.2 + Math.sin(z * 0.045) * 2.0;
    // Consistent navigable river half-width (Total width: 26.0 units)
    this.riverHalfWidth = 13.0;

    this.createEnvironment();
  }

  createEnvironment() {
    this.group = new THREE.Group();

    // 1. Riverbed (Deep ground underneath water)
    const riverbedGeo = new THREE.PlaneGeometry(90, 480, 16, 48);
    riverbedGeo.rotateX(-Math.PI / 2);
    const riverbedMat = new THREE.MeshStandardMaterial({
      color: 0x06222b,
      roughness: 0.95,
    });
    this.riverbedMesh = new THREE.Mesh(riverbedGeo, riverbedMat);
    this.riverbedMesh.position.set(0, -1.5, -140);
    this.riverbedMesh.receiveShadow = true;
    this.group.add(this.riverbedMesh);

    // 2. Animated Flowing Water Surface
    this.createWaterSurface();

    // 3. Natural 3D Riverbanks with consistent width
    this.createRiverbanks();

    // 4. 3D Obstacles with unique IDs
    this.createObstacles();

    // 5. Finish Line
    this.createFinishLine();

    this.scene.add(this.group);
  }

  createWaterSurface() {
    const width = 32;
    const length = 460;
    const segmentsX = 24;
    const segmentsZ = 120;

    const waterGeo = new THREE.PlaneGeometry(width, length, segmentsX, segmentsZ);
    waterGeo.rotateX(-Math.PI / 2);

    // Curve water geometry along river centerline
    const pos = waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const worldZ = z - 140;
      const cx = this.getCenterlineX(worldZ);
      pos.setX(i, pos.getX(i) + cx);
    }
    waterGeo.computeVertexNormals();

    // Stylized river water material with subtle flow texture
    const waterCanvas = document.createElement("canvas");
    waterCanvas.width = 256;
    waterCanvas.height = 256;
    const ctx = waterCanvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, "#10677c");
    grad.addColorStop(0.5, "#18849c");
    grad.addColorStop(1, "#0d5566");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = "rgba(180, 240, 255, 0.16)";
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.arc(64, y + 16, 24, 0, Math.PI * 2);
      ctx.arc(192, y + 8, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    const waterTex = new THREE.CanvasTexture(waterCanvas);
    waterTex.wrapS = THREE.RepeatWrapping;
    waterTex.wrapT = THREE.RepeatWrapping;
    waterTex.repeat.set(4, 28);
    this.waterTex = waterTex;

    const waterMat = new THREE.MeshStandardMaterial({
      map: waterTex,
      color: 0x18849c,
      roughness: 0.18,
      metalness: 0.12,
      transparent: true,
      opacity: 0.90,
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(0, 0, -140);
    this.waterMesh.receiveShadow = true;
    this.group.add(this.waterMesh);
  }

  createRiverbanks() {
    const bankSegments = 64;
    const length = 460;
    const startZ = 70;
    const dz = length / bankSegments;

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x276637, roughness: 0.8 });
    const shorelineSandMat = new THREE.MeshStandardMaterial({ color: 0x6e6047, roughness: 0.9 });
    const bankShadowMat = new THREE.MeshBasicMaterial({ color: 0x051d26, transparent: true, opacity: 0.45 });

    for (let i = 0; i <= bankSegments; i++) {
      const z = startZ - i * dz;
      const cx = this.getCenterlineX(z);
      const leftX = cx - this.riverHalfWidth;
      const rightX = cx + this.riverHalfWidth;

      // Left Shoreline Sandy Edge (Consistent placement right at channel border)
      const leftSand = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 2.2, 0.45, 6),
        shorelineSandMat
      );
      leftSand.position.set(leftX - 0.9, 0.12, z);
      leftSand.receiveShadow = true;
      this.group.add(leftSand);

      // Left Grassy Hill Mound (Set back 4.5 units from water edge)
      const leftHill = new THREE.Mesh(
        new THREE.DodecahedronGeometry(3.6, 1),
        grassMat
      );
      leftHill.scale.set(1.9, 0.72, 1.6);
      leftHill.position.set(leftX - 4.2, 0.95, z);
      leftHill.receiveShadow = true;
      leftHill.castShadow = true;
      this.group.add(leftHill);

      // Right Shoreline Sandy Edge
      const rightSand = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 2.2, 0.45, 6),
        shorelineSandMat
      );
      rightSand.position.set(rightX + 0.9, 0.12, z);
      rightSand.receiveShadow = true;
      this.group.add(rightSand);

      // Right Grassy Hill Mound
      const rightHill = new THREE.Mesh(
        new THREE.DodecahedronGeometry(3.6, 1),
        grassMat
      );
      rightHill.scale.set(1.9, 0.72, 1.6);
      rightHill.position.set(rightX + 4.2, 0.95, z);
      rightHill.receiveShadow = true;
      rightHill.castShadow = true;
      this.group.add(rightHill);

      // Pine trees along outer embankment crest (safe distance from boat)
      if (i % 3 === 0) {
        this.createPineTree(leftX - 7.5, z + 1.2);
        this.createPineTree(rightX + 7.5, z - 1.2);
      }
    }
  }

  createPineTree(x, z) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x482d15, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x164223, roughness: 0.7 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 2.1, 6), trunkMat);
    trunk.position.set(x, 1.5, z);
    trunk.castShadow = true;
    this.group.add(trunk);

    const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3.0, 6), foliageMat);
    foliage1.position.set(x, 3.2, z);
    foliage1.castShadow = true;
    const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.4, 6), foliageMat);
    foliage2.position.set(x, 4.5, z);
    foliage2.castShadow = true;
    this.group.add(foliage1, foliage2);
  }

  createObstacles() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x5a544c,
      roughness: 0.75,
      metalness: 0.1,
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x5c3c24,
      roughness: 0.7,
    });

    // Well-balanced obstacle placements ensuring open navigation lanes
    const obstacleConfigs = [
      { id: "ob_1", z: -25, offsetX: -4.5, type: "boulder", scale: 1.3, radius: 1.7 },
      { id: "ob_2", z: -55, offsetX: 4.0, type: "driftwood", scale: 1.2, radius: 2.0, rotY: 0.35 },
      { id: "ob_3", z: -90, offsetX: -2.2, type: "boulder", scale: 1.5, radius: 1.9 },
      { id: "ob_4", z: -125, offsetX: 5.0, type: "boulder", scale: 1.3, radius: 1.7 },
      { id: "ob_5", z: -160, offsetX: -4.8, type: "driftwood", scale: 1.3, radius: 2.0, rotY: -0.28 },
      { id: "ob_6", z: -195, offsetX: 2.5, type: "boulder", scale: 1.4, radius: 1.8 },
      { id: "ob_7", z: -230, offsetX: -3.5, type: "boulder", scale: 1.3, radius: 1.7 },
      { id: "ob_8", z: -265, offsetX: 3.8, type: "driftwood", scale: 1.3, radius: 2.0, rotY: 0.22 },
    ];

    for (const conf of obstacleConfigs) {
      const cx = this.getCenterlineX(conf.z);
      const x = cx + conf.offsetX;
      const y = 0.2;

      let mesh;
      if (conf.type === "boulder") {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(conf.radius, 1), rockMat);
        mesh.scale.set(1.1, 0.75, 1.0);
      } else {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, conf.radius * 2.1, 8), woodMat);
        mesh.rotation.z = Math.PI / 2;
        if (conf.rotY) mesh.rotation.y = conf.rotY;
      }

      mesh.position.set(x, y, conf.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);

      this.obstacles.push({
        id: conf.id,
        x,
        z: conf.z,
        radius: conf.radius,
        type: conf.type,
        mesh,
      });
    }
  }

  createFinishLine() {
    const z = this.finishZ;
    const cx = this.getCenterlineX(z);
    const leftX = cx - (this.riverHalfWidth - 1.5);
    const rightX = cx + (this.riverHalfWidth - 1.5);

    // Buoy Left
    const buoyMat = new THREE.MeshStandardMaterial({ color: 0xdd3838, roughness: 0.3 });

    this.leftBuoy = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), buoyMat);
    this.leftBuoy.position.set(leftX, 0.4, z);
    this.leftBuoy.castShadow = true;
    this.group.add(this.leftBuoy);

    // Buoy Right
    this.rightBuoy = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), buoyMat);
    this.rightBuoy.position.set(rightX, 0.4, z);
    this.rightBuoy.castShadow = true;
    this.group.add(this.rightBuoy);

    // Checkered banner ribbon
    const bannerLength = rightX - leftX;
    const bannerGeo = new THREE.PlaneGeometry(bannerLength, 1.8, 16, 2);
    bannerGeo.rotateY(Math.PI);

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    for (let x = 0; x < 256; x += 32) {
      for (let y = 0; y < 64; y += 32) {
        ctx.fillStyle = (x / 32 + y / 32) % 2 === 0 ? "#ffffff" : "#1a202c";
        ctx.fillRect(x, y, 32, 32);
      }
    }
    const bannerTex = new THREE.CanvasTexture(canvas);
    bannerTex.wrapS = THREE.RepeatWrapping;
    bannerTex.repeat.set(8, 1);

    const bannerMat = new THREE.MeshStandardMaterial({
      map: bannerTex,
      side: THREE.DoubleSide,
      roughness: 0.5,
    });
    this.bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    this.bannerMesh.position.set(cx, 3.2, z);
    this.group.add(this.bannerMesh);
  }

  update(time) {
    // Water surface dual-frequency flow animation
    const pos = this.waterMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      const vz = pos.getZ(i);
      const vx = pos.getX(i);
      const wave = Math.sin(time * 3.8 + vz * 0.16 + vx * 0.22) * 0.07 +
                   Math.cos(time * 2.2 + vz * 0.08) * 0.03;
      pos.setY(i, wave);
    }
    this.waterMesh.geometry.computeVertexNormals();
    this.waterMesh.geometry.attributes.position.needsUpdate = true;

    // Scroll water surface texture downstream
    if (this.waterTex) {
      this.waterTex.offset.y = (time * 0.12) % 1;
      this.waterTex.offset.x = Math.sin(time * 0.4) * 0.02;
    }

    // Bobbing finish buoys
    if (this.leftBuoy && this.rightBuoy) {
      this.leftBuoy.position.y = 0.4 + Math.sin(time * 3) * 0.07;
      this.rightBuoy.position.y = 0.4 + Math.cos(time * 3.2) * 0.07;
    }
  }

  checkRiverbankCollision(x, z) {
    const cx = this.getCenterlineX(z);
    // Safe channel margin
    const leftLimit = cx - (this.riverHalfWidth - 2.1);
    const rightLimit = cx + (this.riverHalfWidth - 2.1);

    if (x < leftLimit) {
      return { collided: true, normalX: 1, penetration: leftLimit - x };
    }
    if (x > rightLimit) {
      return { collided: true, normalX: -1, penetration: x - rightLimit };
    }
    return { collided: false };
  }

  checkObstacleCollisions(boatX, boatZ, boatRadius = 1.35) {
    for (const ob of this.obstacles) {
      const dx = boatX - ob.x;
      const dz = boatZ - ob.z;
      const dist = Math.hypot(dx, dz);
      const minDist = ob.radius + boatRadius;

      if (dist < minDist) {
        const nx = dx / (dist || 1);
        const nz = dz / (dist || 1);
        return {
          collided: true,
          obstacleId: ob.id,
          obstacle: ob,
          normalX: nx,
          normalZ: nz,
          penetration: minDist - dist,
        };
      }
    }
    return { collided: false };
  }

  setTheme(themeName) {
    if (themeName === "day") {
      if (this.waterMesh && this.waterMesh.material) {
        this.waterMesh.material.color.setHex(0x20b4d4);
        this.waterMesh.material.opacity = 0.88;
      }
      if (this.riverbedMesh && this.riverbedMesh.material) {
        this.riverbedMesh.material.color.setHex(0x1a5466);
      }
    } else {
      if (this.waterMesh && this.waterMesh.material) {
        this.waterMesh.material.color.setHex(0x18849c);
        this.waterMesh.material.opacity = 0.90;
      }
      if (this.riverbedMesh && this.riverbedMesh.material) {
        this.riverbedMesh.material.color.setHex(0x06222b);
      }
    }
  }
}

