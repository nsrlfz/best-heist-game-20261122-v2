// guard.js — one job: the three patrolling guards (SABLE, ROOK, VESPER).
// Patrol loops, vision cones, suspicion that builds, chase, coin distraction.
// A guard never uses vents and never leaves the room.
import { GUARD, GUARDS } from './config.js';
import { hasLineOfSight, sightThroughSmoke, collideCircle, clampToRoom } from './world.js';

export function makeGuards() {
  return GUARDS.map((def) => ({
    name: def.name, color: def.color, visor: def.visor,
    waypoints: def.waypoints.map(([x, y]) => ({ x, y })),
    wp: 0, x: def.waypoints[0][0], y: def.waypoints[0][1],
    angle: Math.PI / 2, suspicion: 0, chasing: false,
    distracted: 0, distractX: 0, distractY: 0,
    radius: GUARD.radius, bob: Math.random() * 6,
  }));
}

// Can this guard see the thief right now? Cone + distance + line of sight,
// blocked by smoke clouds. A hidden (vent) thief is never seen.
export function guardSeesThief(guard, thief, obstacles, clouds) {
  if (thief.hidden) return false;
  const dx = thief.x - guard.x, dy = thief.y - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > GUARD.viewDist) return false;
  const want = Math.atan2(dy, dx);
  let diff = want - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD.viewHalfAngle) return false;
  if (!hasLineOfSight(guard.x, guard.y, thief.x, thief.y, obstacles)) return false;
  if (sightThroughSmoke(guard.x, guard.y, thief.x, thief.y, clouds)) return false;
  return true;
}

function moveToward(guard, tx, ty, speed, dt, obstacles) {
  const dx = tx - guard.x, dy = ty - guard.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 4) return true;
  guard.angle = Math.atan2(dy, dx);
  guard.x += (dx / d) * speed * dt;
  guard.y += (dy / d) * speed * dt;
  collideCircle(guard, obstacles);
  clampToRoom(guard);
  return false;
}

// One frame of guard behaviour. Returns 'caught' when the guard touches Mara.
export function updateGuard(guard, thief, obstacles, clouds, dt) {
  guard.bob += dt * 6;
  if (guard.distracted > 0) {
    guard.distracted -= dt;
    guard.suspicion = 0;
    guard.chasing = false;
    moveToward(guard, guard.distractX, guard.distractY, GUARD.patrolSpeed * 1.15, dt, obstacles);
    return null;
  }
  const sees = guardSeesThief(guard, thief, obstacles, clouds);
  if (sees) {
    guard.suspicion += dt / GUARD.suspicionSeconds;
    if (guard.suspicion >= 1) guard.chasing = true;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 1.4);
    if (guard.suspicion <= 0) guard.chasing = false;
  }
  if (guard.chasing) {
    moveToward(guard, thief.x, thief.y, GUARD.chaseSpeed, dt, obstacles);
  } else {
    const wp = guard.waypoints[guard.wp];
    if (moveToward(guard, wp.x, wp.y, GUARD.patrolSpeed, dt, obstacles)) {
      guard.wp = (guard.wp + 1) % guard.waypoints.length;
    }
  }
  const dx = thief.x - guard.x, dy = thief.y - guard.y;
  if (!thief.hidden && dx * dx + dy * dy < GUARD.catchDist * GUARD.catchDist) return 'caught';
  return null;
}
