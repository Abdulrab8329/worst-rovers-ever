import * as THREE from "three";

/**
 * ThirdPersonCamera for Worst Rowers Ever (Phase 2):
 * - Elevated 3rd-person follow perspective
 * - Smooth position lerping with configurable distance, height, and smoothing
 * - Heading tracking with look-ahead targeting along river bends
 * - Gentle boat turning camera lag and bank tilt
 * - Controlled collision impact screen shake without motion sickness
 */
export class ThirdPersonCamera {
  constructor(camera, options = {}) {
    this.camera = camera;

    // Configurable camera parameters
    this.distance = options.distance || 14.8;
    this.height = options.height || 7.6;
    this.lookAhead = options.lookAhead || 15.5;
    this.posSmoothing = options.posSmoothing || 0.088;
    this.lookSmoothing = options.lookSmoothing || 0.11;

    this.currentLookAt = new THREE.Vector3(0, 1.2, 0);
    this.smoothedHeading = 0;

    // Controlled collision shake state
    this.trauma = 0;
  }

  triggerShake(intensity = 0.5) {
    this.trauma = Math.min(this.trauma + intensity, 0.9);
  }

  update(boat, dt) {
    const safeDt = Math.min(dt, 0.05);

    // Smooth heading tracking with slight lag to create a pleasant turning feel
    this.smoothedHeading = THREE.MathUtils.lerp(
      this.smoothedHeading,
      boat.heading,
      0.13
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

    // Look-ahead point in front of boat along smoothed heading
    const targetLookX = boat.x + fwdX * this.lookAhead;
    const targetLookY = boat.y + 1.2;
    const targetLookZ = boat.z + fwdZ * this.lookAhead;

    const lookLerpFactor = 1.0 - Math.pow(1.0 - this.lookSmoothing, safeDt * 60);
    this.currentLookAt.x = THREE.MathUtils.lerp(this.currentLookAt.x, targetLookX, lookLerpFactor);
    this.currentLookAt.y = THREE.MathUtils.lerp(this.currentLookAt.y, targetLookY, lookLerpFactor);
    this.currentLookAt.z = THREE.MathUtils.lerp(this.currentLookAt.z, targetLookZ, lookLerpFactor);

    // Apply controlled collision trauma shake (clamped to prevent discomfort)
    if (this.trauma > 0) {
      const shakeFactor = Math.min(this.trauma * 0.22, 0.2);
      this.camera.position.x += (Math.random() - 0.5) * shakeFactor;
      this.camera.position.y += (Math.random() - 0.5) * shakeFactor;
      this.currentLookAt.x += (Math.random() - 0.5) * shakeFactor * 0.5;
      this.trauma = Math.max(0, this.trauma - safeDt * 3.2);
    }

    this.camera.lookAt(this.currentLookAt);

    // Gentle bank turning tilt (strictly clamped to avoid disorientation)
    const bankRoll = THREE.MathUtils.clamp(-boat.turnSpeed * 0.024, -0.055, 0.055);
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
