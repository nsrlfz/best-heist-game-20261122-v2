// thief.js — one job: Mara Voss, the thief. Movement, sprint + stamina,
// click-to-move, smoke pellets, coin tosses, vent crawling and sabotage.
// No rendering, no guard logic — just the thief's own state and actions.
import { THIEF, VENT, SABOTAGE, VENTS, EXIT } from './config.js';
import { collideCircle, clampToRoom } from './world.js';

export function makeThief() {
  return {
    x: THIEF.startX, y: THIEF.startY, radius: THIEF.radius,
    angle: -Math.PI / 2, moving: false, sprinting: false,
    stamina: THIEF.staminaMax, clickX: null, clickY: null,
    smokeLeft: THIEF.smokeMax, coinLeft: THIEF.coinMax,
    scoreSpent: 0, inVent: false, ventTimer: 0, ventCooldown: 0,
    ventFrom: 0, ventTo: 0, sabotageCooldown: 0, hidden: false,
  };
}

// Nearest vent within reach, or -1.
export function nearestVent(thief, maxDist) {
  let best = -1, bestD = maxDist;
  for (let i = 0; i < VENTS.length; i++) {
    const dx = VENTS[i].x - thief.x, dy = VENTS[i].y - thief.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

export function thiefNearVent(thief) {
  return nearestVent(thief, VENT.radius + 34) >= 0;
}

export function thiefNearExit(thief) {
  return thief.x > EXIT.x - 10 && thief.x < EXIT.x + EXIT.w + 10
    && thief.y > EXIT.y - 30 && thief.y < EXIT.y + EXIT.h + 10;
}

// Start crawling into the nearest vent. Returns a log line or null.
export function tryEnterVent(thief) {
  if (thief.inVent || thief.ventCooldown > 0) return null;
  const i = nearestVent(thief, VENT.radius + 34);
  if (i < 0) return null;
  thief.inVent = true;
  thief.ventTimer = VENT.channelSeconds;
  thief.ventFrom = i;
  thief.ventTo = (i + 1) % VENTS.length;
  thief.hidden = true;
  return 'Mara slips into the vent…';
}

// Sabotage: kill every camera for a while, at a score cost. Returns a line or null.
export function trySabotage(thief, cameras) {
  if (thief.sabotageCooldown > 0) return null;
  thief.sabotageCooldown = SABOTAGE.cooldownSeconds;
  thief.scoreSpent += SABOTAGE.cost;
  for (const cam of cameras) cam.disabled = SABOTAGE.disableSeconds;
  return 'Sabotage! All cameras dark for 8 seconds (−30 score).';
}

// Drop a smoke pellet at the thief's feet. Returns a cloud or null.
export function trySmoke(thief) {
  if (thief.smokeLeft <= 0) return null;
  thief.smokeLeft -= 1;
  thief.scoreSpent += THIEF.smokeCost;
  return { x: thief.x, y: thief.y, r: 74, t: THIEF.smokeSeconds };
}

// Toss a coin: the nearest guard walks to it. Returns a coin or null.
export function tryCoin(thief, guards) {
  if (thief.coinLeft <= 0) return null;
  thief.coinLeft -= 1;
  thief.scoreSpent += THIEF.coinCost;
  const cx = thief.x + Math.cos(thief.angle) * 130;
  const cy = thief.y + Math.sin(thief.angle) * 130;
  let best = null, bestD = Infinity;
  for (const g of guards) {
    const dx = g.x - cx, dy = g.y - cy;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = g; }
  }
  if (best) {
    best.distracted = THIEF.coinSeconds;
    best.distractX = cx; best.distractY = cy;
  }
  return { x: cx, y: cy, t: THIEF.coinSeconds };
}

// Move the thief one frame. keys: {up,down,left,right,sprint}.
export function updateThief(thief, keys, dt, obstacles) {
  if (thief.ventCooldown > 0) thief.ventCooldown -= dt;
  if (thief.sabotageCooldown > 0) thief.sabotageCooldown -= dt;
  if (thief.inVent) {
    thief.ventTimer -= dt;
    if (thief.ventTimer <= 0) {
      thief.inVent = false;
      thief.hidden = false;
      thief.ventCooldown = VENT.cooldownSeconds;
      thief.x = VENTS[thief.ventTo].x;
      thief.y = VENTS[thief.ventTo].y;
      thief.clickX = null; thief.clickY = null;
    }
    return;
  }
  let dx = 0, dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (dx === 0 && dy === 0 && thief.clickX !== null) {
    const cx = thief.clickX - thief.x, cy = thief.clickY - thief.y;
    const d = Math.sqrt(cx * cx + cy * cy);
    if (d < 8) { thief.clickX = null; thief.clickY = null; }
    else { dx = cx / d; dy = cy / d; }
  }
  const len = Math.sqrt(dx * dx + dy * dy);
  thief.moving = len > 0;
  if (!thief.moving) return;
  dx /= len; dy /= len;
  thief.angle = Math.atan2(dy, dx);
  const wantSprint = keys.sprint && thief.stamina > 1;
  thief.sprinting = wantSprint;
  const speed = wantSprint ? THIEF.sprintSpeed : THIEF.walkSpeed;
  thief.x += dx * speed * dt;
  thief.y += dy * speed * dt;
  if (wantSprint) thief.stamina = Math.max(0, thief.stamina - THIEF.staminaDrain * dt);
  else thief.stamina = Math.min(THIEF.staminaMax, thief.stamina + THIEF.staminaRegen * dt);
  collideCircle(thief, obstacles);
  clampToRoom(thief);
}
