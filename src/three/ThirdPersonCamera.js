import * as THREE from "three";

/**
 * ThirdPersonCamera for Worst Rowers Ever (Phase 2):
 * - Elevated 3rd-person follow perspective
 * - Smooth position lerping with configurable distance, height, and smoothing
 * - Heading tracking with look-ahead targeting along river bends
 * - Boat turning camera lag and tilt
 * - Traumatic collision impact screen shake
 */
export class ThirdPersonCamera {
  constructor(camera, options = {}) {
    this.camera = camera;

    // Configurable camera parameters
    this.distance = options.distance || 13.5;
    this.height = options.height || 7.2;
    this.lookAhead = options.lookAhead || 14.0;
    this.posSmoothing = options.posSmoothing || 0.085;
    this.lookSmoothing = options.lookSmoothing || 0.12;

    this.currentLookAt = new THREE.Vector3(0, 1.2, 0);
    this.cameraOffset = new THREE.Vector3(0, 0, 0);
    this.smoothedHeading = 0;

    // Collision shake state
    this.trauma = 0;
  }

  triggerShake(intensity = 0.6) {
    this.trauma = Math.min(this.trauma + intensity, 1.2);
  }

  update(boat, dt) {
    const safeDt = Math.min(dt, 0.05);

    // Smooth heading tracking with slight lag to create a pleasant turning feel
    // Blend heading so extreme 360 spins don't violently whip the camera
    this.smoothedHeading = THREE.MathUtils.lerp(
      this.smoothedHeading,
      boat.heading,
      0.14
    );

    const fwdX = Math.sin(this.smoothedHeading);
    const fwdZ = -Math.cos(this.smoothedHeading);

    // Desired camera position: elevated and behind the boat along smoothed heading
    const targetCamX = boat.x - fwdX * this.distance;
    const targetCamY = boat.y + this.height;
    const targetCamZ = boat.z - fwdZ * this.distance;

    // Smoothly interpolate camera position
    const lerpFactor = 1.0 - Math.pow(1.0 - this.posSmoothing, safeDt * 60);
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, lerpFactor);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, lerpFactor);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, lerpFactor);

    // Look-ahead point in front of boat so players anticipate river bends & hazards
    const targetLookX = boat.x + fwdX * this.lookAhead;
    const targetLookY = boat.y + 1.2;
    const targetLookZ = boat.z + fwdZ * this.lookAhead;

    const lookLerpFactor = 1.0 - Math.pow(1.0 - this.lookSmoothing, safeDt * 60);
    this.currentLookAt.x = THREE.MathUtils.lerp(this.currentLookAt.x, targetLookX, lookLerpFactor);
    this.currentLookAt.y = THREE.MathUtils.lerp(this.currentLookAt.y, targetLookY, lookLerpFactor);
    this.currentLookAt.z = THREE.MathUtils.lerp(this.currentLookAt.z, targetLookZ, lookLerpFactor);

    // Apply collision trauma camera shake
    if (this.trauma > 0) {
      const shakeFactor = this.trauma * this.trauma * 0.45;
      this.camera.position.x += (Math.random() - 0.5) * shakeFactor;
      this.camera.position.y += (Math.random() - 0.5) * shakeFactor;
      this.currentLookAt.x += (Math.random() - 0.5) * shakeFactor * 0.6;
      this.trauma = Math.max(0, this.trauma - safeDt * 2.8);
    }

    this.camera.lookAt(this.currentLookAt);

    // Dynamic bank turning tilt
    const bankRoll = -boat.turnSpeed * 0.035;
    this.camera.rotation.z += bankRoll;
  }

  snapToBoat(boat) {
    const fwdX = Math.sin(boat.heading);
    const fwdZ = -Math.cos(boat.heading);
    this.smoothedHeading = boat.heading;
    this.camera.position.set(
      boat.x - fwdX * this.distance,
      boat.y + this.height,
      boat.z - fwdZ * this.distance
    );
    this.currentLookAt.set(
      boat.x + fwdX * this.lookAhead,
      boat.y + 1.2,
      boat.z + fwdZ * this.lookAhead
    );
    this.camera.lookAt(this.currentLookAt);
  }
}
