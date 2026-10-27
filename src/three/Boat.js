import * as THREE from "three";

/**
 * 3D Boat model and dual-player cooperative physics.
 * Bow points forward (-Z direction).
 * Player 1: Front Rower (Blue shirt & Blue oar tips)
 * Player 2: Rear Rower (Orange shirt & Orange oar tips)
 */
export class Boat {
  constructor() {
    this.mesh = new THREE.Group();

    // Physics State
    this.x = 0;
    this.y = 0.16;
    this.z = 20; // Starting position downstream
    this.heading = 0; // 0 = pointing straight upstream (-Z)
    this.speed = 0;
    this.turnSpeed = 0;
    this.collisions = 0;
    this.radius = 1.35; // Collision radius for obstacles

    // Collision debounce tracking
    this.lastBankImpactTime = -1;
    this.lastObstacleImpactTime = -1;
    this.collidingObstacleId = null;

    // Visual roll/pitch
    this.roll = 0;
    this.pitch = 0;

    this.createBoatModel();
  }

  createBoatModel() {
    // 1. Tapered Wooden Hull
    const hullGeo = new THREE.BoxGeometry(1.65, 0.72, 4.3);
    const pos = hullGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      // Taper bow (-Z) to pointed prow
      if (z < -0.6) {
        const factor = (z + 0.6) / -1.55;
        pos.setX(i, pos.getX(i) * (1 - factor * 0.72));
        if (y < 0.1) {
          pos.setY(i, pos.getY(i) * (1 - factor * 0.45));
        }
      }
      // Slightly taper transom stern (+Z)
      if (z > 0.8) {
        const factor = (z - 0.8) / 1.35;
        pos.setX(i, pos.getX(i) * (1 - factor * 0.32));
      }
    }
    hullGeo.computeVertexNormals();

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x823f1c,
      roughness: 0.6,
      metalness: 0.1,
    });
    this.hullMesh = new THREE.Mesh(hullGeo, hullMat);
    this.hullMesh.castShadow = true;
    this.hullMesh.receiveShadow = true;
    this.mesh.add(this.hullMesh);

    // Light cedar gunwale rim (decorative trim)
    const rimGeo = new THREE.BoxGeometry(1.48, 0.14, 4.0);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xdfa66c,
      roughness: 0.5,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 0.36;
    this.mesh.add(rimMesh);

    // Bow deck plate (front tip triangular cap)
    const bowCapGeo = new THREE.ConeGeometry(0.75, 1.1, 3);
    bowCapGeo.rotateX(Math.PI / 2);
    bowCapGeo.rotateZ(Math.PI);
    const bowCapMat = new THREE.MeshStandardMaterial({ color: 0x5a2b12, roughness: 0.7 });
    const bowCap = new THREE.Mesh(bowCapGeo, bowCapMat);
    bowCap.position.set(0, 0.32, -1.8);
    this.mesh.add(bowCap);

    // Wooden seats
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x5a2e12, roughness: 0.7 });
    const seatFront = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.12, 0.48), seatMat);
    seatFront.position.set(0, 0.22, -0.65);
    const seatRear = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.12, 0.48), seatMat);
    seatRear.position.set(0, 0.22, 0.75);
    this.mesh.add(seatFront, seatRear);

    // 2. Rowers
    // Player 1 (Front, Blue shirt & cap)
    this.player1Mesh = this.createRowerMesh(0x1d65ab, 0x113f6d, 0xffcf9e);
    this.player1Mesh.position.set(0, 0.42, -0.65);
    this.mesh.add(this.player1Mesh);

    // Player 2 (Rear, Orange shirt & cap)
    this.player2Mesh = this.createRowerMesh(0xe05c10, 0xa33d05, 0xffcf9e);
    this.player2Mesh.position.set(0, 0.42, 0.75);
    this.mesh.add(this.player2Mesh);

    // 3. Left and Right Paddles (with Player colored tips)
    this.createPaddles();

    this.mesh.position.set(this.x, this.y, this.z);
  }

  createRowerMesh(shirtColor, capColor, skinColor) {
    const group = new THREE.Group();

    // Torso / Life Vest
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.29, 0.62, 8),
      new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.55 })
    );
    torso.position.y = 0.32;
    torso.castShadow = true;
    group.add(torso);

    // Life vest chest straps
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x1a2630, roughness: 0.8 });
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.45), strapMat);
    strap.position.y = 0.32;
    group.add(strap);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 10, 10),
      new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 })
    );
    head.position.y = 0.75;
    head.castShadow = true;
    group.add(head);

    // Cap with visor
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.23, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.6 })
    );
    cap.position.y = 0.88;
    group.add(cap);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.04, 0.18),
      new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.6 })
    );
    visor.position.set(0, 0.83, -0.22);
    group.add(visor);

    // Rowing arms grasping oars
    const armMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45), armMat);
    leftArm.rotation.set(0, 0, Math.PI / 3);
    leftArm.position.set(-0.35, 0.38, -0.05);
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45), armMat);
    rightArm.rotation.set(0, 0, -Math.PI / 3);
    rightArm.position.set(0.35, 0.38, -0.05);
    group.add(leftArm, rightArm);

    return group;
  }

  createPaddles() {
    const oarShaftMat = new THREE.MeshStandardMaterial({ color: 0xcca062, roughness: 0.6 });
    const p1BladeMat = new THREE.MeshStandardMaterial({ color: 0x1d65ab, roughness: 0.5 }); // Blue tip
    const p2BladeMat = new THREE.MeshStandardMaterial({ color: 0xe05c10, roughness: 0.5 }); // Orange tip

    // Left Paddle (Front rower side / P1)
    this.leftPaddleGroup = new THREE.Group();
    this.leftPaddleGroup.position.set(-0.9, 0.35, -0.3);

    const leftShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9), oarShaftMat);
    leftShaft.rotation.z = Math.PI / 3.2;
    leftShaft.position.set(-0.75, -0.3, 0);

    const leftBlade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.24), p1BladeMat);
    leftBlade.rotation.z = Math.PI / 3.2;
    leftBlade.position.set(-1.42, -0.68, 0);

    this.leftPaddleGroup.add(leftShaft, leftBlade);
    this.mesh.add(this.leftPaddleGroup);

    // Right Paddle (Rear rower side / P2)
    this.rightPaddleGroup = new THREE.Group();
    this.rightPaddleGroup.position.set(0.9, 0.35, 0.3);

    const rightShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9), oarShaftMat);
    rightShaft.rotation.z = -Math.PI / 3.2;
    rightShaft.position.set(0.75, -0.3, 0);

    const rightBlade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.24), p2BladeMat);
    rightBlade.rotation.z = -Math.PI / 3.2;
    rightBlade.position.set(1.42, -0.68, 0);

    this.rightPaddleGroup.add(rightShaft, rightBlade);
    this.mesh.add(this.rightPaddleGroup);
  }

  update(dt, p1, p2, time) {
    // Dual player control input integration
    const forwardInput = (p1.forward || 0) + (p2.forward || 0);
    const steeringInput = (p1.steering || 0) + (p2.steering || 0);

    // Acceleration & hydrodynamic drag
    this.speed += forwardInput * 16.5 * dt;
    this.speed *= Math.pow(0.984, dt * 60);
    this.speed = THREE.MathUtils.clamp(this.speed, -8, 23);

    // Steering & rotational inertia
    this.turnSpeed += steeringInput * 3.7 * dt;
    this.turnSpeed *= Math.pow(0.89, dt * 60);
    this.turnSpeed = THREE.MathUtils.clamp(this.turnSpeed, -2.6, 2.6);

    // Turning is more pronounced when boat has momentum
    const momentumTurnFactor = 0.45 + Math.abs(this.speed) / 12;
    this.heading += this.turnSpeed * momentumTurnFactor * dt;

    // Velocity translation: heading > 0 turns right (+X), -Z is forward
    const fwdX = Math.sin(this.heading);
    const fwdZ = -Math.cos(this.heading);
    this.x += fwdX * this.speed * dt;
    this.z += fwdZ * this.speed * dt;

    // Gentle aquatic water bobbing
    this.y = 0.16 + Math.sin(time * 3.5 + this.x * 0.2) * 0.035;

    // Visual roll and pitch
    const targetRoll = -this.turnSpeed * 0.12;
    const targetPitch = (this.speed / 26) * 0.07;
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll, 0.16);
    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, 0.16);

    // Apply transforms: visual mesh Y-rotation is -this.heading to align perfectly with forward vector
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.set(this.pitch, -this.heading, this.roll);

    // Paddle stroke animations
    const isMoving = forwardInput !== 0 || steeringInput !== 0;
    const stroke = isMoving ? Math.sin(time * 9.5) : 0;

    this.leftPaddleGroup.rotation.y = stroke * 0.38 + (p1.steering > 0 ? 0.2 : 0);
    this.leftPaddleGroup.rotation.x = stroke * 0.15;

    this.rightPaddleGroup.rotation.y = -stroke * 0.38 - (p2.steering < 0 ? 0.2 : 0);
    this.rightPaddleGroup.rotation.x = stroke * 0.15;
  }

  deflectBank(normalX, currentTime) {
    const isMovingIntoBank = (normalX > 0 && this.speed * Math.sin(this.heading) < 0) ||
                             (normalX < 0 && this.speed * Math.sin(this.heading) > 0);

    if (isMovingIntoBank) {
      this.speed *= -0.38;
    }
    this.turnSpeed += normalX * 1.5;

    // Debounced collision counting (cooldown: 0.38 seconds)
    if (currentTime - this.lastBankImpactTime > 0.38) {
      this.collisions++;
      this.lastBankImpactTime = currentTime;
      return true; // New impact
    }
    return false; // Continuous contact
  }

  deflectObstacle(normalX, normalZ, obstacleId, currentTime) {
    // Only bounce if new impact or cooldown expired
    const isNew = obstacleId !== this.collidingObstacleId ||
                  currentTime - this.lastObstacleImpactTime > 0.42;

    if (isNew) {
      this.speed *= -0.48;
      this.turnSpeed += normalX * 1.6;
      this.collisions++;
      this.lastObstacleImpactTime = currentTime;
      this.collidingObstacleId = obstacleId;
      return true; // New impact
    } else {
      // Continuous sliding against obstacle: apply gentle friction
      this.speed *= 0.94;
      return false; // Continuous contact
    }
  }

  clearObstacleContact() {
    this.collidingObstacleId = null;
  }

  reset(x = 0, z = 20) {
    this.x = x;
    this.y = 0.16;
    this.z = z;
    this.heading = 0;
    this.speed = 0;
    this.turnSpeed = 0;
    this.collisions = 0;
    this.roll = 0;
    this.pitch = 0;
    this.lastBankImpactTime = -1;
    this.lastObstacleImpactTime = -1;
    this.collidingObstacleId = null;
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.set(0, 0, 0);
  }
}
