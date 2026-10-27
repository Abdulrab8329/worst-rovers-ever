import * as THREE from "three";

/**
 * 3D Boat model and dual-player cooperative physics.
 * Bow points forward (-Z direction).
 */
export class Boat {
  constructor() {
    this.mesh = new THREE.Group();

    // Physics State
    this.x = 0;
    this.y = 0.15;
    this.z = 20; // Starting position downstream
    this.heading = 0; // 0 = pointing directly toward negative Z (upstream)
    this.speed = 0;
    this.turnSpeed = 0;
    this.collisions = 0;
    this.radius = 1.35; // Collision radius for obstacles

    // Visual roll/pitch
    this.roll = 0;
    this.pitch = 0;

    this.createBoatModel();
  }

  createBoatModel() {
    // 1. Wooden Hull
    // Outer wooden hull
    const hullGeo = new THREE.BoxGeometry(1.6, 0.7, 4.2);
    // Taper the bow (front) and stern (back) by adjusting vertices
    const pos = hullGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      // Taper front (-Z) to sharp bow
      if (z < -0.8) {
        const factor = (z + 0.8) / -1.3;
        pos.setX(i, pos.getX(i) * (1 - factor * 0.65));
        if (y < 0) {
          pos.setY(i, pos.getY(i) * (1 - factor * 0.4));
        }
      }
      // Slightly taper rear (+Z)
      if (z > 0.8) {
        const factor = (z - 0.8) / 1.3;
        pos.setX(i, pos.getX(i) * (1 - factor * 0.35));
      }
    }
    hullGeo.computeVertexNormals();

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x8a4521,
      roughness: 0.65,
      metalness: 0.1,
    });
    this.hullMesh = new THREE.Mesh(hullGeo, hullMat);
    this.hullMesh.castShadow = true;
    this.hullMesh.receiveShadow = true;
    this.mesh.add(this.hullMesh);

    // Inner hull rim / deck trim
    const rimGeo = new THREE.BoxGeometry(1.4, 0.55, 3.8);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd89f68,
      roughness: 0.6,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 0.15;
    this.mesh.add(rimMesh);

    // Wooden seats
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x5a2e12, roughness: 0.7 });
    const seatFront = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.45), seatMat);
    seatFront.position.set(0, 0.25, -0.7);
    const seatRear = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.45), seatMat);
    seatRear.position.set(0, 0.25, 0.7);
    this.mesh.add(seatFront, seatRear);

    // 2. Rowers
    // Player 1 (Front, Blue shirt)
    this.player1Mesh = this.createRowerMesh(0x2b6cb0, 0xffcf9e);
    this.player1Mesh.position.set(0, 0.45, -0.7);
    this.mesh.add(this.player1Mesh);

    // Player 2 (Rear, Orange shirt)
    this.player2Mesh = this.createRowerMesh(0xdd6b20, 0xffcf9e);
    this.player2Mesh.position.set(0, 0.45, 0.7);
    this.mesh.add(this.player2Mesh);

    // 3. Left and Right Paddles
    const paddleMat = new THREE.MeshStandardMaterial({ color: 0xd4a359, roughness: 0.5 });
    
    // Left paddle group (pivot at oarlock)
    this.leftPaddleGroup = new THREE.Group();
    this.leftPaddleGroup.position.set(-0.85, 0.35, 0);
    const leftOarShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), paddleMat);
    leftOarShaft.rotation.z = Math.PI / 3;
    leftOarShaft.position.set(-0.7, -0.3, 0);
    const leftOarBlade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.22), paddleMat);
    leftOarBlade.rotation.z = Math.PI / 3;
    leftOarBlade.position.set(-1.3, -0.65, 0);
    this.leftPaddleGroup.add(leftOarShaft, leftOarBlade);
    this.mesh.add(this.leftPaddleGroup);

    // Right paddle group (pivot at oarlock)
    this.rightPaddleGroup = new THREE.Group();
    this.rightPaddleGroup.position.set(0.85, 0.35, 0);
    const rightOarShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), paddleMat);
    rightOarShaft.rotation.z = -Math.PI / 3;
    rightOarShaft.position.set(0.7, -0.3, 0);
    const rightOarBlade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.22), paddleMat);
    rightOarBlade.rotation.z = -Math.PI / 3;
    rightOarBlade.position.set(1.3, -0.65, 0);
    this.rightPaddleGroup.add(rightOarShaft, rightOarBlade);
    this.mesh.add(this.rightPaddleGroup);

    // Position container
    this.mesh.position.set(this.x, this.y, this.z);
  }

  createRowerMesh(shirtColor, skinColor) {
    const group = new THREE.Group();

    // Body / Torso
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.58, 8),
      new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 })
    );
    torso.position.y = 0.3;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 10),
      new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 })
    );
    head.position.y = 0.72;
    head.castShadow = true;
    group.add(head);

    // Cap / Hair accent
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a2630, roughness: 0.8 })
    );
    cap.position.y = 0.88;
    group.add(cap);

    return group;
  }

  update(dt, p1, p2, time) {
    // Dual player control input integration
    const forwardInput = (p1.forward || 0) + (p2.forward || 0);
    const steeringInput = (p1.steering || 0) + (p2.steering || 0);

    // Acceleration & hydrodynamic drag
    this.speed += forwardInput * 16 * dt;
    this.speed *= Math.pow(0.984, dt * 60);
    this.speed = THREE.MathUtils.clamp(this.speed, -8, 22);

    // Steering & rotational inertia
    this.turnSpeed += steeringInput * 3.6 * dt;
    this.turnSpeed *= Math.pow(0.89, dt * 60);
    this.turnSpeed = THREE.MathUtils.clamp(this.turnSpeed, -2.6, 2.6);

    // Turning is more pronounced when boat has momentum
    const momentumTurnFactor = 0.45 + Math.abs(this.speed) / 12;
    this.heading += this.turnSpeed * momentumTurnFactor * dt;

    // Translate along heading (-Z is forward when heading = 0)
    this.x += Math.sin(this.heading) * this.speed * dt;
    this.z -= Math.cos(this.heading) * this.speed * dt;

    // Gentle aquatic water bobbing
    this.y = 0.14 + Math.sin(time * 3.5 + this.x * 0.2) * 0.04;

    // Visual roll and pitch
    const targetRoll = -this.turnSpeed * 0.14;
    const targetPitch = (this.speed / 25) * 0.08;
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll, 0.15);
    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, 0.15);

    // Apply transforms
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.set(this.pitch, this.heading, this.roll);

    // Paddle stroke animations
    const isMoving = forwardInput !== 0 || steeringInput !== 0;
    const stroke = isMoving ? Math.sin(time * 9) : 0;

    this.leftPaddleGroup.rotation.y = stroke * 0.38 + (p1.steering > 0 ? 0.2 : 0);
    this.leftPaddleGroup.rotation.x = stroke * 0.15;

    this.rightPaddleGroup.rotation.y = -stroke * 0.38 - (p2.steering < 0 ? 0.2 : 0);
    this.rightPaddleGroup.rotation.x = stroke * 0.15;
  }

  deflect(normalX, normalZ, bounceSpeed = 0.45) {
    this.speed *= -bounceSpeed;
    this.turnSpeed += normalX * 1.6;
    this.collisions++;
  }

  reset(x = 0, z = 20) {
    this.x = x;
    this.y = 0.15;
    this.z = z;
    this.heading = 0;
    this.speed = 0;
    this.turnSpeed = 0;
    this.collisions = 0;
    this.roll = 0;
    this.pitch = 0;
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.set(0, 0, 0);
  }
}
