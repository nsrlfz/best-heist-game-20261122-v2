// camera.js — one job: the two sweeping wall cameras.
// Each camera pans back and forth; its cone raises the alarm when Mara is
// inside it. Sabotage (F) switches every camera off for a few seconds.
import { CAMERA, CAMERAS } from './config.js';
import { hasLineOfSight, sightThroughSmoke } from './world.js';

export function makeCameras() {
  return CAMERAS.map((def) => ({
    x: def.x, y: def.y, baseAngle: def.baseAngle, label: def.label,
    phase: Math.random() * 6, angle: def.baseAngle, disabled: 0,
  }));
}

// Does this camera see the thief? Off cameras never see anyone.
export function cameraSeesThief(cam, thief, obstacles, clouds) {
  if (cam.disabled > 0 || thief.hidden) return false;
  const dx = thief.x - cam.x, dy = thief.y - cam.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > CAMERA.viewDist) return false;
  const want = Math.atan2(dy, dx);
  let diff = want - cam.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA.viewHalfAngle) return false;
  if (!hasLineOfSight(cam.x, cam.y, thief.x, thief.y, obstacles)) return false;
  if (sightThroughSmoke(cam.x, cam.y, thief.x, thief.y, clouds)) return false;
  return true;
}

// Sweep the camera head and count down its sabotage timer.
export function updateCamera(cam, time, dt) {
  if (cam.disabled > 0) cam.disabled -= dt;
  cam.angle = cam.baseAngle + Math.sin(time * CAMERA.sweepSpeed + cam.phase) * CAMERA.sweepAmp;
}
