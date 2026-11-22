// audio.js — one job: tiny synthesized sounds via WebAudio. No audio files.
// A soft click, a coin chime, a smoke puff, a rising alarm and a win arpeggio.
export function makeAudio() {
  return { ctx: null, enabled: true, alarmOn: false, alarmNodes: null };
}

function ensureCtx(audio) {
  if (audio.ctx) return audio.ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
  } catch (e) {
    audio.ctx = null;
  }
  return audio.ctx;
}

function tone(audio, freq, dur, type, vol, when) {
  const ctx = ensureCtx(audio);
  if (!ctx || !audio.enabled) return;
  const t0 = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playPickup(audio) {
  tone(audio, 880, 0.12, 'sine', 0.09);
  tone(audio, 1318, 0.18, 'sine', 0.07, 0.07);
}

export function playDiamond(audio) {
  tone(audio, 1046, 0.14, 'triangle', 0.1);
  tone(audio, 1318, 0.14, 'triangle', 0.1, 0.1);
  tone(audio, 1568, 0.26, 'triangle', 0.1, 0.2);
}

export function playCoin(audio) {
  tone(audio, 1568, 0.09, 'square', 0.04);
  tone(audio, 2093, 0.12, 'square', 0.03, 0.06);
}

export function playSmoke(audio) {
  const ctx = ensureCtx(audio);
  if (!ctx || !audio.enabled) return;
  const dur = 0.35, t0 = ctx.currentTime;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

export function playCaught(audio) {
  tone(audio, 392, 0.2, 'sawtooth', 0.09);
  tone(audio, 311, 0.2, 'sawtooth', 0.09, 0.16);
  tone(audio, 233, 0.42, 'sawtooth', 0.09, 0.32);
}

export function playWin(audio) {
  const notes = [523, 659, 784, 1046, 1318];
  notes.forEach((n, i) => tone(audio, n, 0.22, 'triangle', 0.09, i * 0.11));
}

export function playVent(audio) {
  tone(audio, 300, 0.16, 'sine', 0.06);
  tone(audio, 520, 0.16, 'sine', 0.06, 0.12);
}

export function playSabotage(audio) {
  tone(audio, 220, 0.12, 'square', 0.05);
  tone(audio, 180, 0.2, 'square', 0.05, 0.1);
}

// A low pulsing alarm while the meter is high; call every frame.
export function updateAlarmSound(audio, alarmValue) {
  const ctx = ensureCtx(audio);
  if (!ctx || !audio.enabled) return;
  if (alarmValue > 55 && !audio.alarmOn) {
    audio.alarmOn = true;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 620;
    lfo.type = 'sine';
    lfo.frequency.value = 4;
    lfoGain.gain.value = 0.025;
    gain.gain.value = 0.035;
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    lfo.start();
    audio.alarmNodes = { osc, lfo, gain };
  } else if (alarmValue <= 45 && audio.alarmOn && audio.alarmNodes) {
    try { audio.alarmNodes.osc.stop(); audio.alarmNodes.lfo.stop(); } catch (e) { /* already stopped */ }
    audio.alarmNodes = null;
    audio.alarmOn = false;
  }
}
