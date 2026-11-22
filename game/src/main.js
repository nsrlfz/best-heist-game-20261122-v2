// main.js — one job: run The Gilded Vault.
// Owns the state machine (title / playing / caught / escaped), the frame
// loop, keyboard + mouse input, the alarm/guard/camera updates, the
// ?shot=…&seed=1 deterministic mode, and window.__game for playtests.
import { VIEW, THIEF, VENTS, EXIT } from './config.js';
import { makeRng, hashString } from './random.js';
import {
  buildObstacles, buildPaintings, buildPlants, buildChandeliers,
} from './world.js';
import {
  makeThief, updateThief, trySmoke, tryCoin, tryEnterVent, trySabotage,
  thiefNearVent, thiefNearExit,
} from './thief.js';
import { makeGuards, updateGuard, guardSeesThief } from './guard.js';
import { makeCameras, updateCamera, cameraSeesThief } from './camera.js';
import {
  makeAlarm, makeLootState, updateAlarm, collectLoot,
  hasDiamond, finalScore, lootTotal,
} from './alarm.js';
import {
  makeAudio, playPickup, playDiamond, playCoin, playSmoke, playCaught,
  playWin, playVent, playSabotage, updateAlarmSound,
} from './audio.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = parseInt(params.get('seed') || '1', 10) || 1;
const rng = makeRng(seed ^ hashString(shotName || 'live'));

function makeState() {
  const dust = [];
  for (let i = 0; i < 70; i++) {
    dust.push({
      x: rng() * VIEW.w, y: rng() * VIEW.h,
      vx: 2 + rng() * 5, vy: 1 + rng() * 3, r: 0.8 + rng() * 1.6,
    });
  }
  return {
    state: 'title',
    time: 0, seconds: 0,
    thief: makeThief(),
    guards: makeGuards(),
    cameras: makeCameras(),
    alarm: makeAlarm(),
    loot: makeLootState(),
    obstacles: buildObstacles(),
    paintings: buildPaintings(),
    plants: buildPlants(),
    chandeliers: buildChandeliers(),
    dust,
    clouds: [],
    coin: null,
    audio: makeAudio(),
    hint: '', hintTimer: 0,
    caughtReason: '', lootKept: 0,
    finalLoot: 0, scoreSpent: 0, speedBonus: 0, finalScore: 0,
    log: [],
  };
}

let s = makeState();
if (shotName) applyShot(s, shotName);

const keys = { up: false, down: false, left: false, right: false, sprint: false };
let lastTs = 0;

function say(text) {
  s.log.push(text);
  if (s.log.length > 6) s.log.shift();
}

function resetGame() {
  s = makeState();
  if (shotName) applyShot(s, shotName);
  else s.state = 'playing';
}

function startGame() {
  s = makeState();
  s.state = 'playing';
  say('The vault is open. Steal the Aurora Diamond, then reach the EXIT.');
}

function catchThief(reason) {
  if (s.state !== 'playing') return;
  s.state = 'caught';
  s.caughtReason = reason;
  s.lootKept = lootTotal(s.loot);
  playCaught(s.audio);
}

function escapeThief() {
  if (s.state !== 'playing') return;
  s.state = 'escaped';
  s.finalLoot = lootTotal(s.loot);
  s.scoreSpent = s.thief.scoreSpent;
  s.speedBonus = Math.max(0, Math.round(120 - s.seconds));
  s.finalScore = finalScore(s.loot, s.thief.scoreSpent, s.seconds);
  playWin(s.audio);
}

function nearestGuardDistance() {
  let best = Infinity;
  for (const g of s.guards) {
    const dx = g.x - s.thief.x, dy = g.y - s.thief.y;
    best = Math.min(best, Math.sqrt(dx * dx + dy * dy));
  }
  return best;
}

function update(dt) {
  if (s.state === 'playing') {
    s.seconds += dt;
    updateThief(s.thief, keys, dt, s.obstacles);
    // Vent arrival sound + log.
    if (s.thief.inVent && !s.ventSounded) {
      s.ventSounded = true;
      playVent(s.audio);
    }
    if (!s.thief.inVent) s.ventSounded = false;
    // Smoke clouds decay.
    for (const c of s.clouds) c.t -= dt;
    s.clouds = s.clouds.filter((c) => c.t > 0);
    if (s.coin) {
      s.coin.t -= dt;
      if (s.coin.t <= 0) s.coin = null;
    }
    // Guards.
    for (const g of s.guards) {
      const caught = updateGuard(g, s.thief, s.obstacles, s.clouds, dt);
      if (caught === 'caught') {
        catchThief(`${g.name} caught Mara at close range.`);
        return;
      }
    }
    // Cameras.
    for (const cam of s.cameras) updateCamera(cam, s.time, dt);
    // Who sees Mara right now?
    let spottedBy = null;
    for (const g of s.guards) {
      if (guardSeesThief(g, s.thief, s.obstacles, s.clouds)) { spottedBy = 'guard'; break; }
    }
    if (!spottedBy) {
      for (const cam of s.cameras) {
        if (cameraSeesThief(cam, s.thief, s.obstacles, s.clouds)) { spottedBy = 'camera'; break; }
      }
    }
    if (updateAlarm(s.alarm, spottedBy, dt)) {
      catchThief('The alarm hit 100% — the vault sealed shut.');
      return;
    }
    updateAlarmSound(s.audio, s.alarm.value);
    // Loot.
    const got = collectLoot(s.loot, s.thief);
    for (const item of got) {
      if (item.id === 'diamond') {
        playDiamond(s.audio);
        say('Aurora Diamond secured! Now reach the EXIT, bottom centre.');
      } else {
        playPickup(s.audio);
        say(`${item.label} pocketed (+$${item.value}).`);
      }
    }
    // Contextual hints.
    const near = nearestGuardDistance();
    if (s.hintTimer > 0) s.hintTimer -= dt;
    if (near < 170 && s.hintTimer <= 0) {
      s.hint = 'Guard close — use a smoke pellet (SPACE) or slip into a vent (E)!';
      s.hintTimer = 2.5;
    } else if (s.hintTimer <= 0) {
      s.hint = '';
    }
    if (thiefNearVent(s.thief) && s.thief.ventCooldown <= 0 && !s.thief.inVent) {
      s.hint = 'Press E to crawl through the vent!';
      s.hintTimer = 1.2;
    }
    // Win: diamond + exit.
    if (hasDiamond(s.loot) && thiefNearExit(s.thief)) escapeThief();
  }
  s.time += dt;
}

function frame(ts) {
  const dt = Math.min(0.05, lastTs === 0 ? 0.016 : (ts - lastTs) / 1000);
  lastTs = ts;
  // In shot mode the scene is frozen: render once per frame, no updates,
  // so screenshots are identical every run.
  if (!shotName) update(dt);
  drawGame(ctx, s);
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'arrowup' || k === 'w') keys.up = true;
  if (k === 'arrowdown' || k === 's') keys.down = true;
  if (k === 'arrowleft' || k === 'a') keys.left = true;
  if (k === 'arrowright' || k === 'd') keys.right = true;
  if (e.key === 'Shift') keys.sprint = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (e.key === 'Enter' && s.state === 'title') startGame();
  if ((k === 'r') && (s.state === 'caught' || s.state === 'escaped')) resetGame();
  if (s.state !== 'playing') return;
  if (k === ' ' || e.key === ' ') {
    const cloud = trySmoke(s.thief);
    if (cloud) { s.clouds.push(cloud); playSmoke(s.audio); say('Smoke pellet! Vision blocked for 4s (−25 score).'); }
  }
  if (k === 'c') {
    const coin = tryCoin(s.thief, s.guards);
    if (coin) { s.coin = coin; playCoin(s.audio); say('Coin tossed — the nearest guard goes to look (−15 score).'); }
  }
  if (k === 'e') {
    const line = tryEnterVent(s.thief);
    if (line) say(line);
  }
  if (k === 'f') {
    const line = trySabotage(s.thief, s.cameras);
    if (line) { playSabotage(s.audio); say(line); }
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'arrowup' || k === 'w') keys.up = false;
  if (k === 'arrowdown' || k === 's') keys.down = false;
  if (k === 'arrowleft' || k === 'a') keys.left = false;
  if (k === 'arrowright' || k === 'd') keys.right = false;
  if (e.key === 'Shift') keys.sprint = false;
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * VIEW.w;
  const y = ((e.clientY - rect.top) / rect.height) * VIEW.h;
  if (s.state === 'playing') {
    s.thief.clickX = x;
    s.thief.clickY = y;
  }
});

// Playtest hook: live state for automated checks.
window.__game = {
  get state() { return s.state; },
  get time() { return s.time; },
  get seconds() { return s.seconds; },
  get alarm() { return s.alarm.value; },
  get score() { return lootTotal(s.loot) - s.thief.scoreSpent; },
  get thief() { return { x: s.thief.x, y: s.thief.y, hidden: s.thief.hidden }; },
  get lootTaken() { return s.loot.filter((i) => i.taken).length; },
  get guards() { return s.guards.map((g) => ({ name: g.name, x: g.x, y: g.y, chasing: g.chasing })); },
  get shot() { return shotName; },
};

requestAnimationFrame(frame);
