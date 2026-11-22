// config.js — every tunable number for The Gilded Vault lives here.
// One job: constants. No logic, no drawing, no state.
export const VIEW = { w: 1280, h: 800 };
export const WALL = 24;

export const THIEF = {
  startX: 180, startY: 700, radius: 20, walkSpeed: 175, sprintSpeed: 265,
  staminaMax: 100, staminaDrain: 34, staminaRegen: 22,
  smokeMax: 3, smokeCost: 25, smokeSeconds: 4,
  coinMax: 3, coinCost: 15, coinSeconds: 3,
};

export const GUARD = {
  radius: 20, patrolSpeed: 92, chaseSpeed: 152, viewDist: 235,
  viewHalfAngle: 0.61, suspicionSeconds: 0.6, catchDist: 27,
};

export const CAMERA = {
  viewDist: 265, viewHalfAngle: 0.49, sweepAmp: 0.62, sweepSpeed: 0.55,
};

export const ALARM = {
  guardPerSecond: 25, cameraPerSecond: 20, decayPerSecond: 4, max: 100,
};

export const VENT = { channelSeconds: 0.8, cooldownSeconds: 5, radius: 26 };
export const SABOTAGE = { cost: 30, disableSeconds: 8, cooldownSeconds: 20 };

// Loot: id, label, value, position, colour, glow colour.
export const LOOT = [
  { id: 'diamond', label: 'Aurora Diamond', value: 500, x: 1122, y: 108, color: '#bfe9ff', glow: '#7fd4ff' },
  { id: 'idol', label: 'Gold Idol', value: 150, x: 305, y: 205, color: '#ffd34d', glow: '#ffae00' },
  { id: 'vase', label: 'Jade Vase', value: 120, x: 640, y: 196, color: '#5fe3a1', glow: '#1fae6b' },
  { id: 'chalice', label: 'Silver Chalice', value: 100, x: 905, y: 480, color: '#e8eef7', glow: '#9fb4d8' },
  { id: 'tiara', label: 'Ruby Tiara', value: 90, x: 1062, y: 565, color: '#ff5d7a', glow: '#d81f4c' },
];

// Guards: name, colour, visor colour, patrol loop.
export const GUARDS = [
  { name: 'SABLE', color: '#e5484d', visor: '#7d1a1e', waypoints: [[300, 350], [300, 610], [520, 610], [520, 350]] },
  { name: 'ROOK', color: '#3a86ff', visor: '#123a7d', waypoints: [[850, 300], [850, 620], [1120, 620], [1120, 300]] },
  { name: 'VESPER', color: '#2fbf71', visor: '#0f5c33', waypoints: [[450, 520], [820, 520], [820, 300], [450, 300]] },
];

// Wall cameras: base position, rest angle (radians, 0 = east), sweep.
export const CAMERAS = [
  { x: 640, y: 26, baseAngle: Math.PI / 2, label: 'CAM-1' },
  { x: 1254, y: 400, baseAngle: Math.PI, label: 'CAM-2' },
];

// Floor vents (Among Us-style round grates the thief can crawl through).
export const VENTS = [
  { x: 205, y: 648 }, { x: 640, y: 660 }, { x: 1075, y: 652 },
];

export const EXIT = { x: 590, y: 756, w: 100, h: 44 };

// Palette: bright, high-saturation museum — cream floors, teal carpets, gold trim.
export const PALETTE = {
  floorA: '#f3e3bd', floorB: '#e8cf9a', floorLine: '#c9a86a',
  carpet: '#c0392b', carpetEdge: '#f1c40f', carpetTeal: '#0f766e',
  wall: '#274b73', wallTop: '#3b6ea5', wallTrim: '#d9a441',
  caseGlass: 'rgba(190, 230, 255, 0.28)', caseFrame: '#8a6d2f',
  statue: '#dfe6ee', statueBase: '#7d8aa0',
  plant: '#2e8b57', pot: '#b5542d',
  gold: '#d9a441', goldLight: '#ffd34d', ink: '#1c2433',
  hudBg: 'rgba(16, 22, 35, 0.88)', hudGold: '#d9a441',
};
