// world.js — one job: the museum floor plan and geometry helpers.
// Obstacles, the vault enclosure, paintings, plants, chandeliers, collision
// and line-of-sight. No game rules here, only space.
import { VIEW, WALL, PALETTE } from './config.js';

// Solid rectangles the thief and guards walk around. kind drives the look.
export function buildObstacles() {
  return [
    // Left wing: marble statue + display case (route 1 cover).
    { x: 180, y: 170, w: 56, h: 90, kind: 'statue' },
    { x: 176, y: 268, w: 64, h: 18, kind: 'plinth' },
    { x: 420, y: 150, w: 130, h: 62, kind: 'case' },
    { x: 180, y: 420, w: 56, h: 90, kind: 'statue' },
    { x: 176, y: 518, w: 64, h: 18, kind: 'plinth' },
    // Middle: bench row + long table (route 2 cover).
    { x: 560, y: 380, w: 160, h: 70, kind: 'table' },
    { x: 560, y: 470, w: 160, h: 22, kind: 'bench' },
    { x: 700, y: 150, w: 130, h: 62, kind: 'case' },
    // Right wing: columns + case (route 3 cover).
    { x: 980, y: 200, w: 44, h: 44, kind: 'column' },
    { x: 980, y: 420, w: 44, h: 44, kind: 'column' },
    { x: 920, y: 560, w: 120, h: 58, kind: 'case' },
    // Vault enclosure, top-right: three walls, open at the bottom.
    { x: 1040, y: 60, w: 18, h: 130, kind: 'vault' },
    { x: 1040, y: 60, w: 196, h: 18, kind: 'vault' },
    { x: 1218, y: 60, w: 18, h: 130, kind: 'vault' },
  ];
}

// Framed paintings hung on the top wall (pure decoration, no collision).
export function buildPaintings() {
  return [
    { x: 90, y: 34, w: 92, h: 62, hue: '#e74c3c', title: 'Sunset' },
    { x: 300, y: 34, w: 70, h: 62, hue: '#3498db', title: 'Sea' },
    { x: 880, y: 34, w: 92, h: 62, hue: '#9b59b6', title: 'Queen' },
    { x: 60, y: 300, w: 62, h: 92, hue: '#16a085', title: 'Garden' },
  ];
}

// Potted plants in the corners and along the bottom wall.
export function buildPlants() {
  return [
    { x: 70, y: 700 }, { x: 1210, y: 700 }, { x: 70, y: 130 }, { x: 1210, y: 260 },
  ];
}

// Chandeliers hanging from the ceiling; each casts a warm pool of light.
export function buildChandeliers() {
  return [
    { x: 320, y: 210, r: 150 }, { x: 640, y: 210, r: 150 }, { x: 960, y: 210, r: 150 },
  ];
}

// Push a circle out of every solid rect it overlaps. Returns true on hit.
export function collideCircle(body, obstacles) {
  let hit = false;
  for (const o of obstacles) {
    const cx = Math.max(o.x, Math.min(body.x, o.x + o.w));
    const cy = Math.max(o.y, Math.min(body.y, o.y + o.h));
    const dx = body.x - cx, dy = body.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= body.radius * body.radius) continue;
    hit = true;
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2);
      body.x = cx + (dx / d) * body.radius;
      body.y = cy + (dy / d) * body.radius;
    } else {
      body.y = o.y - body.radius;
    }
  }
  return hit;
}

// Keep a circle inside the playable room (inside the outer walls).
export function clampToRoom(body) {
  body.x = Math.max(WALL + body.radius, Math.min(VIEW.w - WALL - body.radius, body.x));
  body.y = Math.max(WALL + body.radius, Math.min(VIEW.h - WALL - body.radius, body.y));
}

// Does segment (x1,y1)-(x2,y2) cross rect r? (slab test, segment version)
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;
  for (const [p, q] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
      else { if (t < tmin) return false; if (t < tmax) tmax = t; }
    }
  }
  return true;
}

// Line of sight between two points, blocked by any obstacle rect.
export function hasLineOfSight(x1, y1, x2, y2, obstacles) {
  for (const o of obstacles) {
    if (segmentHitsRect(x1, y1, x2, y2, o)) return false;
  }
  return true;
}

// Is point (x,y) inside the smoke cloud list (vision-blocking)?
export function insideSmoke(x, y, clouds) {
  for (const c of clouds) {
    const dx = x - c.x, dy = y - c.y;
    if (dx * dx + dy * dy < c.r * c.r) return true;
  }
  return false;
}

// Does the sight segment pass through any smoke cloud? Sampled cheaply.
export function sightThroughSmoke(x1, y1, x2, y2, clouds) {
  for (const c of clouds) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((c.x - x1) * dx + (c.y - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + dx * t, py = y1 + dy * t;
    const ddx = c.x - px, ddy = c.y - py;
    if (ddx * ddx + ddy * ddy < c.r * c.r) return true;
  }
  return false;
}

export { PALETTE };
