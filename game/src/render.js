// render.js — one job: draw the whole museum on the canvas.
// Bright high-saturation look: cream checkerboard floor, teal + red carpets,
// gold trim, framed paintings, chandeliers with light pools, dust motes,
// sparkles on the loot, drop shadows under every bean. Original art only:
// Mara Voss and the guards are simple bean figures with visors + backpacks.
import { VIEW, WALL, PALETTE, VENTS, EXIT, CAMERA, GUARD } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A bean body: rounded capsule with a light-blue visor and a backpack.
function drawBean(ctx, x, y, r, color, visor, angle, bob, name) {
  // Drop shadow.
  ctx.fillStyle = 'rgba(20, 16, 8, 0.30)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y + r * 0.86, r * 0.95, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  const lift = Math.sin(bob) * 1.5;
  const bx = x, by = y + lift;
  // Backpack (behind, opposite the facing angle).
  ctx.fillStyle = shade(color, -28);
  ctx.beginPath();
  ctx.ellipse(bx - Math.cos(angle) * r * 0.72, by - Math.sin(angle) * r * 0.72 - r * 0.08,
    r * 0.52, r * 0.62, angle, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  const grad = ctx.createLinearGradient(bx - r, by - r, bx + r, by + r);
  grad.addColorStop(0, shade(color, 26));
  grad.addColorStop(0.55, color);
  grad.addColorStop(1, shade(color, -22));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(bx, by, r * 0.92, r * 1.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Visor: wide light-blue window on the facing side.
  const vx = bx + Math.cos(angle) * r * 0.34;
  const vy = by + Math.sin(angle) * r * 0.30 - r * 0.22;
  ctx.fillStyle = '#cfe9ff';
  ctx.beginPath();
  ctx.ellipse(vx, vy, r * 0.56, r * 0.38, angle * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(vx - r * 0.14, vy - r * 0.12, r * 0.2, r * 0.1, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = visor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(vx, vy, r * 0.56, r * 0.38, angle * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  // Little feet.
  ctx.fillStyle = shade(color, -34);
  ctx.beginPath();
  ctx.ellipse(bx - r * 0.42, by + r * 0.92, r * 0.3, r * 0.16, 0, 0, Math.PI * 2);
  ctx.ellipse(bx + r * 0.42, by + r * 0.92, r * 0.3, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  if (name) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 3;
    ctx.strokeText(name, bx, by - r - 9);
    ctx.fillText(name, bx, by - r - 9);
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function drawCone(ctx, x, y, angle, dist, half, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, dist, angle - half, angle + half);
  ctx.closePath();
  ctx.fill();
}

function drawFloor(ctx, time, dust) {
  // Checkerboard cream tiles with grout lines.
  const T = 64;
  for (let gy = 0; gy < 13; gy++) {
    for (let gx = 0; gx < 20; gx++) {
      ctx.fillStyle = (gx + gy) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(gx * T, gy * T, T, T);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  for (let gx = 0; gx <= 20; gx++) {
    ctx.beginPath(); ctx.moveTo(gx * T, 0); ctx.lineTo(gx * T, 800); ctx.stroke();
  }
  for (let gy = 0; gy <= 13; gy++) {
    ctx.beginPath(); ctx.moveTo(0, gy * T); ctx.lineTo(1280, gy * T); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Teal runner down the middle + red runner to the vault.
  ctx.fillStyle = PALETTE.carpetTeal;
  ctx.fillRect(596, 24, 88, 732);
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(1052, 190, 88, 566);
  ctx.strokeStyle = PALETTE.carpetEdge;
  ctx.lineWidth = 4;
  ctx.strokeRect(596, 24, 88, 732);
  ctx.strokeRect(1052, 190, 88, 566);
  // Gold diamonds stitched into the teal runner.
  ctx.fillStyle = PALETTE.goldLight;
  for (let y = 90; y < 740; y += 90) {
    ctx.save();
    ctx.translate(640, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
  // Dust motes drifting in the light.
  ctx.fillStyle = 'rgba(255, 244, 200, 0.5)';
  for (const d of dust) {
    const x = (d.x + time * d.vx) % 1280;
    const y = (d.y + time * d.vy) % 800;
    ctx.beginPath();
    ctx.arc(x < 0 ? x + 1280 : x, y < 0 ? y + 800 : y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWalls(ctx, paintings, plants) {
  // Outer walls: deep blue with gold trim.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, 1280, WALL);
  ctx.fillRect(0, 776, 1280, WALL);
  ctx.fillRect(0, 0, WALL, 800);
  ctx.fillRect(1256, 0, WALL, 800);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, 1280, 8);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, WALL - 5, 1280, 5);
  ctx.fillRect(0, 776, 1280, 5);
  ctx.fillRect(WALL - 5, 0, 5, 800);
  ctx.fillRect(1256, 0, 5, 800);
  // Framed paintings.
  for (const p of paintings) {
    ctx.fillStyle = '#6b4f1d';
    ctx.fillRect(p.x - 6, p.y - 6, p.w + 12, p.h + 12);
    ctx.fillStyle = p.hue;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + p.h);
    ctx.lineTo(p.x + p.w * 0.45, p.y);
    ctx.lineTo(p.x + p.w * 0.7, p.y);
    ctx.lineTo(p.x + p.w * 0.25, p.y + p.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8dc';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.title, p.x + p.w / 2, p.y + p.h + 16);
  }
  // Potted plants.
  for (const p of plants) {
    ctx.fillStyle = PALETTE.pot;
    ctx.beginPath();
    ctx.moveTo(p.x - 14, p.y + 6);
    ctx.lineTo(p.x + 14, p.y + 6);
    ctx.lineTo(p.x + 10, p.y + 24);
    ctx.lineTo(p.x - 10, p.y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.plant;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.45;
      ctx.beginPath();
      ctx.ellipse(p.x + Math.cos(a) * 13, p.y + Math.sin(a) * 13, 7, 15, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawObstacle(ctx, o) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,16,8,0.25)';
  roundRect(ctx, o.x + 4, o.y + 6, o.w, o.h, 8);
  ctx.fill();
  if (o.kind === 'statue') {
    ctx.fillStyle = PALETTE.statueBase;
    roundRect(ctx, o.x - 4, o.y + o.h - 6, o.w + 8, 16, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.statue;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h * 0.42, o.w * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(o.x + o.w * 0.28, o.y + o.h * 0.42, o.w * 0.44, o.h * 0.5);
    ctx.fillStyle = '#9aa7ba';
    ctx.fillRect(o.x + o.w * 0.28, o.y + o.h * 0.42, o.w * 0.44, 6);
  } else if (o.kind === 'plinth') {
    ctx.fillStyle = '#8a6d2f';
    roundRect(ctx, o.x, o.y, o.w, o.h, 3);
    ctx.fill();
    ctx.fillStyle = PALETTE.goldLight;
    ctx.fillRect(o.x + 4, o.y + 3, o.w - 8, 3);
  } else if (o.kind === 'case') {
    ctx.fillStyle = PALETTE.caseFrame;
    roundRect(ctx, o.x, o.y, o.w, o.h, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.caseGlass;
    roundRect(ctx, o.x + 6, o.y + 6, o.w - 12, o.h - 12, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(o.x + 12, o.y + o.h - 10);
    ctx.lineTo(o.x + o.w * 0.4, o.y + 8);
    ctx.stroke();
  } else if (o.kind === 'table') {
    ctx.fillStyle = '#5d3a1a';
    roundRect(ctx, o.x, o.y, o.w, o.h, 10);
    ctx.fill();
    ctx.fillStyle = '#7d4f24';
    roundRect(ctx, o.x + 8, o.y + 8, o.w - 16, o.h - 16, 8);
    ctx.fill();
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(o.x + 20, o.y + 14, 34, 20);
    ctx.fillRect(o.x + 100, o.y + 14, 34, 20);
  } else if (o.kind === 'bench') {
    ctx.fillStyle = '#8a5a2b';
    roundRect(ctx, o.x, o.y, o.w, o.h, 8);
    ctx.fill();
    ctx.fillStyle = '#a9743c';
    ctx.fillRect(o.x + 6, o.y + 4, o.w - 12, 6);
  } else if (o.kind === 'column') {
    ctx.fillStyle = '#e8e2d4';
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#c9bda6';
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2 - 6, o.y + o.h / 2 - 6, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.kind === 'vault') {
    ctx.fillStyle = '#3a3f4a';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(o.x, o.y, o.w, 4);
    ctx.fillStyle = '#c8ccd4';
    for (let i = 8; i < Math.max(o.w, o.h) - 4; i += 16) {
      if (o.w > o.h) ctx.fillRect(o.x + i, o.y + 6, 3, o.h - 12);
      else ctx.fillRect(o.x + 6, o.y + i, o.w - 12, 3);
    }
  }
  ctx.restore();
}

function drawVent(ctx, v, time, cooldown) {
  ctx.fillStyle = 'rgba(20,16,8,0.3)';
  ctx.beginPath();
  ctx.ellipse(v.x + 3, v.y + 5, 28, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b3442';
  ctx.beginPath();
  ctx.arc(v.x, v.y, VENT_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = cooldown > 0 ? '#8a93a5' : '#ffd34d';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = '#5a6a80';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(v.x - 18, v.y + i * 7);
    ctx.lineTo(v.x + 18, v.y + i * 7);
    ctx.stroke();
  }
  if (cooldown <= 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    ctx.strokeStyle = `rgba(255, 211, 77, ${0.25 + pulse * 0.45})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(v.x, v.y, VENT_R + 6 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}
const VENT_R = 26;

function drawLoot(ctx, loot, time) {
  for (const item of loot) {
    if (item.taken) continue;
    const tw = 0.6 + 0.4 * Math.sin(time * 2.4 + item.x);
    // Sparkles.
    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + tw * 0.5})`;
    for (let i = 0; i < 4; i++) {
      const a = time * 1.2 + i * 1.7;
      const sx = item.x + Math.cos(a) * 26;
      const sy = item.y + Math.sin(a * 1.3) * 20 - 8;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a);
      ctx.fillRect(-2.5, -2.5, 5, 5);
      ctx.restore();
    }
    // Glow halo.
    const glow = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 46);
    glow.addColorStop(0, item.glow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.35 + tw * 0.25;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Pedestal.
    ctx.fillStyle = '#7d8aa0';
    ctx.fillRect(item.x - 16, item.y + 12, 32, 10);
    ctx.fillStyle = '#aeb9c9';
    ctx.fillRect(item.x - 16, item.y + 10, 32, 4);
    // The treasure itself.
    ctx.fillStyle = item.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    if (item.id === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(item.x - 16, item.y - 2);
      ctx.lineTo(item.x + 16, item.y - 2);
      ctx.lineTo(item.x + 8, item.y - 20);
      ctx.lineTo(item.x - 8, item.y - 20);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(item.x - 16, item.y - 2);
      ctx.lineTo(item.x, item.y + 12);
      ctx.lineTo(item.x + 16, item.y - 2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (item.id === 'idol') {
      ctx.beginPath();
      ctx.arc(item.x, item.y - 6, 10, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillRect(item.x - 7, item.y + 2, 14, 12);
    } else if (item.id === 'vase') {
      ctx.beginPath();
      ctx.ellipse(item.x, item.y - 2, 11, 15, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillRect(item.x - 6, item.y - 20, 12, 6);
    } else if (item.id === 'chalice') {
      ctx.beginPath();
      ctx.arc(item.x, item.y - 8, 11, Math.PI, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillRect(item.x - 2, item.y - 8, 4, 14);
      ctx.fillRect(item.x - 8, item.y + 6, 16, 4);
    } else {
      // Ruby Tiara: a golden band with three red gems.
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.arc(item.x, item.y + 2, 13, Math.PI, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff2e54';
      for (const ox of [-9, 0, 9]) {
        ctx.beginPath();
        ctx.arc(item.x + ox, item.y - 8 - (ox === 0 ? 5 : 0), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Value tag.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText(`$${item.value}`, item.x, item.y + 38);
    ctx.fillText(`$${item.value}`, item.x, item.y + 38);
  }
}

function drawExit(ctx, time, hasDiamond) {
  const x = EXIT.x, y = EXIT.y;
  ctx.fillStyle = 'rgba(20,16,8,0.3)';
  ctx.beginPath();
  ctx.ellipse(x + EXIT.w / 2 + 3, y + EXIT.h + 4, EXIT.w / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Round green door (Among Us-style hatch) in the bottom wall.
  const pulse = hasDiamond ? 0.6 + 0.4 * Math.sin(time * 5) : 0;
  ctx.fillStyle = hasDiamond ? `rgba(46, 204, 113, ${0.55 + pulse * 0.4})` : '#2fbf71';
  roundRect(ctx, x, y, EXIT.w, EXIT.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#0f5c33';
  ctx.beginPath();
  ctx.arc(x + EXIT.w / 2, y + EXIT.h / 2 + 2, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', x + EXIT.w / 2, y - 10);
  if (hasDiamond) {
    ctx.fillStyle = '#ffe27a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('▼ GETAWAY OPEN ▼', x + EXIT.w / 2, y + EXIT.h + 20);
  }
}

function drawSmoke(ctx, clouds) {
  for (const c of clouds) {
    const grad = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.r);
    grad.addColorStop(0, 'rgba(220, 225, 235, 0.85)');
    grad.addColorStop(0.7, 'rgba(200, 208, 220, 0.55)');
    grad.addColorStop(1, 'rgba(200, 208, 220, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoin(ctx, coin, time) {
  if (!coin) return;
  const bob = Math.sin(time * 6) * 3;
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y + bob, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a87608';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#a87608';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$', coin.x, coin.y + bob + 4);
}

function drawCameraUnit(ctx, cam, time) {
  const disabled = cam.disabled > 0;
  // Cone.
  if (!disabled) {
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA.viewDist, CAMERA.viewHalfAngle,
      'rgba(255, 214, 64, 0.20)');
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA.viewDist, CAMERA.viewHalfAngle * 0.45,
      'rgba(255, 214, 64, 0.16)');
  }
  // Wall mount + head.
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(cam.x - 16, cam.y - 10, 32, 20);
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.rotate(cam.angle);
  ctx.fillStyle = disabled ? '#5a6a80' : '#1c2433';
  roundRect(ctx, 0, -9, 30, 18, 6);
  ctx.fill();
  ctx.fillStyle = disabled ? '#3a4556' : '#ff3b30';
  ctx.beginPath();
  ctx.arc(26, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = disabled ? '#8a93a5' : '#fff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(disabled ? `${cam.label} OFF ${Math.ceil(cam.disabled)}s` : cam.label,
    cam.x, cam.y + (cam.y < 100 ? 34 : -18));
}

function drawHud(ctx, s) {
  const { thief, alarm, loot, guards, cameras, time } = s;
  // Top bar.
  ctx.fillStyle = PALETTE.hudBg;
  roundRect(ctx, 14, 10, 1252, 54, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.hudGold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE GILDED VAULT', 30, 38);
  ctx.fillStyle = '#fff';
  ctx.font = '15px sans-serif';
  const taken = loot.filter((i) => i.taken);
  ctx.fillText(`Loot $${taken.reduce((a, i) => a + i.value, 0)}  •  ${taken.length}/5 taken`, 300, 38);
  // Alarm meter (pulses red when high).
  const ax = 640, ay = 26, aw = 260, ah = 20;
  const danger = alarm.value > 60;
  const pulse = danger ? 0.5 + 0.5 * Math.sin(time * 8) : 0;
  ctx.fillStyle = '#0a0e18';
  roundRect(ctx, ax, ay, aw, ah, 10);
  ctx.fill();
  const frac = alarm.value / 100;
  const grad = ctx.createLinearGradient(ax, 0, ax + aw, 0);
  grad.addColorStop(0, '#2fbf71');
  grad.addColorStop(0.6, '#ffd34d');
  grad.addColorStop(1, '#ff3b30');
  ctx.fillStyle = grad;
  if (frac > 0) {
    roundRect(ctx, ax + 2, ay + 2, (aw - 4) * frac, ah - 4, 8);
    ctx.fill();
  }
  ctx.strokeStyle = danger ? `rgba(255, 59, 48, ${0.5 + pulse * 0.5})` : PALETTE.hudGold;
  ctx.lineWidth = danger ? 3 : 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(alarm.value)}%`, ax + aw / 2, ay + ah + 15);
  // Tools + stamina, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Smoke ${thief.smokeLeft}× (SPACE)  •  Coin ${thief.coinLeft}× (C)  •  Vent (E)  •  Sabotage (F)`, 1250, 30);
  ctx.fillStyle = '#9fb4d8';
  ctx.font = '13px sans-serif';
  const ventTxt = thief.ventCooldown > 0 ? `Vent ${Math.ceil(thief.ventCooldown)}s` : 'Vent ready';
  const sabTxt = thief.sabotageCooldown > 0 ? `Sabotage ${Math.ceil(thief.sabotageCooldown)}s` : 'Sabotage ready';
  ctx.fillText(`${ventTxt}  •  ${sabTxt}`, 1250, 52);
  // Stamina bar under the tools.
  ctx.fillStyle = '#0a0e18';
  roundRect(ctx, 1120, 58, 130, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#4dd0e1';
  roundRect(ctx, 1120, 58, 130 * (thief.stamina / 100), 6, 3);
  ctx.fill();
  // Objective banner.
  const obj = s.state === 'playing'
    ? (hasDiamondLoot(loot) ? 'Diamond secured — reach the EXIT!' : 'Steal the Aurora Diamond ($500) in the vault, top-right.')
    : '';
  if (obj) {
    // Set the font BEFORE measuring: measuring with the previous (13px)
    // font made the pill ~30% too narrow, so the yellow text spilled past
    // both pill edges onto the cream floor and read as clipped.
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'rgba(16, 22, 35, 0.78)';
    const w = ctx.measureText(obj).width + 36;
    roundRect(ctx, 640 - w / 2, 72, w, 26, 13);
    ctx.fill();
    ctx.strokeStyle = PALETTE.hudGold;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffe27a';
    ctx.fillText(obj, 640, 90);
  }
  // Contextual hint.
  if (s.hint) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 59, 48, 0.85)';
    const w = ctx.measureText(s.hint).width + 28;
    roundRect(ctx, 640 - w / 2, 106, w, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(s.hint, 640, 123);
  }
  // Guard suspicion pips. Row sits BELOW the top-wall paintings (frames end
  // y=102, titles at y=112) and above the display cases (y=150): y=134,
  // x from 100 so the (70,130) plant stays clear. Spacing 160 at 12px keeps
  // even the longest status ("VESPER — suspicious…") off the teal carpet.
  guards.forEach((g, i) => {
    const x = 100 + i * 160, y = 134;
    ctx.textAlign = 'left';
    ctx.fillStyle = g.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${g.name}${g.chasing ? ' — CHASING!' : g.suspicion > 0.05 ? ' — suspicious…' : ''}`, x, y);
    if (g.suspicion > 0.05) {
      ctx.fillStyle = '#0a0e18';
      ctx.fillRect(x, y + 5, 120, 6);
      ctx.fillStyle = '#ff9f0a';
      ctx.fillRect(x, y + 5, 120 * Math.min(1, g.suspicion), 6);
    }
  });
  // Camera status, bottom-left.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  cameras.forEach((c, i) => {
    ctx.fillText(c.disabled > 0 ? `${c.label}: OFF (${Math.ceil(c.disabled)}s)` : `${c.label}: LIVE`,
      30, 760 - i * 18);
  });
}

function hasDiamondLoot(loot) {
  const d = loot.find((i) => i.id === 'diamond');
  return !!d && d.taken;
}

function drawOverlay(ctx, s) {
  if (s.state === 'title') {
    ctx.fillStyle = 'rgba(10, 14, 24, 0.55)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 64px sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 8;
    ctx.strokeText('THE GILDED VAULT', 640, 250);
    ctx.fillText('THE GILDED VAULT', 640, 250);
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText('A museum heist. One thief. Three guards. Two cameras.', 640, 300);
    ctx.fillText('Steal the Aurora Diamond ($500) — then slip out the EXIT.', 640, 332);
    ctx.fillStyle = '#ffe27a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('WASD / arrows to move  •  SHIFT sprint  •  SPACE smoke  •  C coin  •  E vent  •  F sabotage', 640, 392);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    const blink = 0.6 + 0.4 * Math.sin(s.time * 4);
    ctx.globalAlpha = blink;
    ctx.fillText('Press ENTER to begin the heist', 640, 452);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#9fb4d8';
    ctx.font = '15px sans-serif';
    ctx.fillText('Mara Voss — thief in yellow. SABLE, ROOK, VESPER — the guards. Don’t let the alarm hit 100%.', 640, 500);
  } else if (s.state === 'caught') {
    ctx.fillStyle = 'rgba(60, 4, 8, 0.62)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b61';
    ctx.font = 'bold 58px sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 8;
    ctx.strokeText('CAUGHT!', 640, 330);
    ctx.fillText('CAUGHT!', 640, 330);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(s.caughtReason || 'The guards closed in.', 640, 380);
    ctx.fillText(`Loot kept: $${s.lootKept}  •  Alarm peaked at ${Math.round(s.alarm.peak)}%`, 640, 414);
    ctx.fillStyle = '#ffe27a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press R to try again', 640, 470);
  } else if (s.state === 'escaped') {
    ctx.fillStyle = 'rgba(6, 32, 18, 0.62)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5fe3a1';
    ctx.font = 'bold 54px sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 8;
    ctx.strokeText('CLEAN GETAWAY!', 640, 300);
    ctx.fillText('CLEAN GETAWAY!', 640, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Loot $${s.finalLoot}  •  Tools spent −$${s.scoreSpent}  •  Speed bonus +$${s.speedBonus}`, 640, 350);
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`FINAL SCORE  $${s.finalScore}`, 640, 400);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Finished in ${s.seconds.toFixed(1)}s  •  Alarm peaked at ${Math.round(s.alarm.peak)}%`, 640, 440);
    ctx.fillStyle = '#ffe27a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press R to run it again', 640, 490);
  }
  // Vent channel progress.
  if (s.thief.inVent) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Crawling through the vent…', 640, 700);
  }
}

// The main draw: floor, room dressing, cones under the actors, actors, HUD.
export function drawGame(ctx, s) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawFloor(ctx, s.time, s.dust);
  drawWalls(ctx, s.paintings, s.plants);
  // Warm pools under the chandeliers.
  for (const ch of s.chandeliers) {
    const grad = ctx.createRadialGradient(ch.x, ch.y, 10, ch.x, ch.y, ch.r);
    grad.addColorStop(0, 'rgba(255, 226, 140, 0.20)');
    grad.addColorStop(1, 'rgba(255, 226, 140, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ch.x, ch.y, ch.r, 0, Math.PI * 2);
    ctx.fill();
    // Chandelier fixture: gold ring + candles.
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.arc(ch.x, ch.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe27a';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(ch.x + Math.cos(a) * 12, ch.y + Math.sin(a) * 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const o of s.obstacles) drawObstacle(ctx, o);
  for (const v of VENTS) drawVent(ctx, v, s.time, s.thief.ventCooldown);
  drawExit(ctx, s.time, hasDiamondLoot(s.loot));
  drawLoot(ctx, s.loot, s.time);
  // Vision cones (under the actors so the beans read clearly).
  for (const g of s.guards) {
    const col = g.chasing ? 'rgba(255, 59, 48, 0.30)' : 'rgba(255, 59, 48, 0.17)';
    drawCone(ctx, g.x, g.y, g.angle, GUARD.viewDist, GUARD.viewHalfAngle, col);
  }
  for (const cam of s.cameras) drawCameraUnit(ctx, cam, s.time);
  drawSmoke(ctx, s.clouds);
  drawCoin(ctx, s.coin, s.time);
  // Actors.
  for (const g of s.guards) drawBean(ctx, g.x, g.y, g.radius, g.color, g.visor, g.angle, g.bob, g.name);
  if (!s.thief.hidden) {
    drawBean(ctx, s.thief.x, s.thief.y, s.thief.radius, '#ffd60a', '#123a7d',
      s.thief.angle, s.thief.moving ? s.time * 10 : 0, 'MARA');
  }
  drawHud(ctx, s);
  drawOverlay(ctx, s);
}
