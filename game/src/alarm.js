// alarm.js — one job: the alarm meter and the loot score.
// The meter climbs while a guard or a camera sees Mara, decays otherwise,
// and 100 means caught. Loot is collected once, on touch.
import { ALARM, LOOT } from './config.js';

export function makeAlarm() {
  return { value: 0, peak: 0, lastRise: 0 };
}

export function makeLootState() {
  return LOOT.map((item) => ({ ...item, taken: false }));
}

// Raise or decay the meter. spottedBy is 'guard', 'camera', or null.
// Returns true the moment the meter hits the top.
export function updateAlarm(alarm, spottedBy, dt) {
  if (spottedBy === 'guard') alarm.value += ALARM.guardPerSecond * dt;
  else if (spottedBy === 'camera') alarm.value += ALARM.cameraPerSecond * dt;
  else alarm.value -= ALARM.decayPerSecond * dt;
  alarm.value = Math.max(0, Math.min(ALARM.max, alarm.value));
  alarm.peak = Math.max(alarm.peak, alarm.value);
  if (alarm.value >= ALARM.max) return true;
  return false;
}

// Pick up any loot within reach. Returns the items just taken.
export function collectLoot(loot, thief) {
  const got = [];
  for (const item of loot) {
    if (item.taken) continue;
    const dx = item.x - thief.x, dy = item.y - thief.y;
    if (dx * dx + dy * dy < 34 * 34) {
      item.taken = true;
      got.push(item);
    }
  }
  return got;
}

export function lootTotal(loot) {
  return loot.filter((i) => i.taken).reduce((sum, i) => sum + i.value, 0);
}

export function hasDiamond(loot) {
  const d = loot.find((i) => i.id === 'diamond');
  return !!d && d.taken;
}

// Final score: loot value minus everything the tools cost, plus a speed bonus.
export function finalScore(loot, scoreSpent, seconds) {
  const speedBonus = Math.max(0, Math.round(120 - seconds));
  return lootTotal(loot) - scoreSpent + speedBonus;
}
