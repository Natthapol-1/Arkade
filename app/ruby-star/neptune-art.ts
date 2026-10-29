import { TILE_SIZE, CHAMBER_BOUNDS, ENEMY_CONFIGS, NEPTUNE_BOMB_FUSE, NEPTUNE_BOMB_RADIUS, NEPTUNE_LASER_WARNING } from './constants';
import type { Enemy, GameState } from './engine';

// Blocky neon-vector art for the Neptune challenge: fish, stingers, water clones, water balls,
// tides and the player's sky laser.

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function facing(e: Readonly<Enemy>) {
  const dx = e.targetTileX - e.tileX;
  return dx < 0 ? -1 : 1;
}

// Small fish: body, tail and eye, swimming toward its next tile with a little bob.
function drawFish(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  const red = e.type === 'fish_red';
  const body = red ? '#ff5a6a' : '#59c8ff', dark = red ? '#a8243a' : '#1f6fa8', light = red ? '#ffc2c8' : '#d8f4ff';
  ctx.save(); ctx.scale(facing(e), 1); ctx.translate(0, Math.round(Math.sin(tick * .2 + e.id) * 1.5));
  ctx.shadowColor = body; ctx.shadowBlur = 6;
  block(ctx, -9, -6, 16, 12, body); ctx.shadowBlur = 0;
  block(ctx, -9, 2, 16, 4, dark); block(ctx, -7, -6, 10, 3, light);
  const flap = Math.floor(tick / 6 + e.id) % 2 ? 2 : 0;
  block(ctx, -15, -6 + flap, 6, 4, body); block(ctx, -15, 2 - flap, 6, 4, body);
  block(ctx, 2, -3, 3, 3, '#0b1020');
  if (red) { block(ctx, -3, -9, 2, 3, light); block(ctx, 1, -9, 2, 3, light); } // little warning spines
  else block(ctx, -1, -1, 3, 3, '#ffffff'); // healing sparkle
  ctx.restore();
}

// Stinger: a larger teal fish with a spiked back and a glowing poison barb.
function drawStinger(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  ctx.save(); ctx.scale(facing(e), 1);
  ctx.shadowColor = '#3fd6b0'; ctx.shadowBlur = 6;
  block(ctx, -13, -9, 24, 18, '#2fa889'); ctx.shadowBlur = 0;
  block(ctx, -13, 3, 24, 6, '#1a6b58'); block(ctx, -11, -9, 18, 4, '#a8f5e2');
  for (const x of [-9, -3, 3]) block(ctx, x, -14, 3, 5, '#a8f5e2');
  block(ctx, -20, -8, 7, 6, '#2fa889'); block(ctx, -20, 2, 7, 6, '#2fa889');
  block(ctx, 5, -4, 4, 4, '#0b1020');
  const pulse = .55 + .45 * Math.abs(Math.sin(tick * .15));
  ctx.globalAlpha = pulse; block(ctx, 11, -2, 8, 4, '#c6ff8a'); ctx.globalAlpha = 1;
  if (e.shootTicks > 0) { ctx.globalAlpha = e.shootTicks / 14; block(ctx, 14, -6, 10, 12, '#c6ff8a'); ctx.globalAlpha = 1; }
  ctx.restore();
}

// Water clone: a smaller, see-through echo of the Sea Chanter's silhouette (square shell, stepped fan fins,
// crest and fluke, pearl eyes) built from a few flat water-tone blocks, without her scales, gills or lashes.
function drawClone(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  const shimmer = .55 + .12 * Math.sin(tick * .12 + e.id), edge = '#4f7fc4', water = '#6fc7ff', pale = '#d8f2ff';
  ctx.save(); ctx.globalAlpha = shimmer; ctx.translate(0, Math.round(Math.sin(tick * .06 + e.id) * 2)); ctx.scale(.75, .75);
  for (const side of [-1, 1]) {
    block(ctx, side * 27 - 5, -22, 10, 34, edge); block(ctx, side * 36 - 4, -28, 8, 28, edge);
    block(ctx, side * 27 - 3, -20, 6, 30, water);
  }
  block(ctx, -8, 20, 16, 12, edge); block(ctx, -20, 28, 16, 8, edge); block(ctx, 4, 28, 16, 8, edge);
  block(ctx, -8, -34, 16, 12, edge); block(ctx, -2, -32, 4, 10, water);
  ctx.shadowColor = water; ctx.shadowBlur = 6;
  block(ctx, -25, -24, 50, 48, water); ctx.shadowBlur = 0;
  block(ctx, -20, -19, 40, 38, '#1d5a8f');
  block(ctx, -16, -8, 12, 6, pale); block(ctx, 4, -8, 12, 6, pale);
  block(ctx, -3, 6, 6, 4, pale);
  // One slow light band sweeps down the shell, so it reads as water rather than a solid body.
  ctx.globalAlpha = shimmer * .6; block(ctx, -20, -19 + Math.floor((tick * .4 + e.id * 7) % 34), 40, 4, pale);
  ctx.restore();
  const pips = Math.ceil(e.hp / e.maxHp * 4);
  for (let i = 0; i < 4; i++) block(ctx, -15 + i * 8, -36, 6, 3, i < pips ? '#d8f2ff' : '#1b2a3d');
}

// Water ball: a glowing orb whose ring empties as the fuse burns, with its blast area marked on the floor.
function drawWaterBall(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  const left = Math.max(0, e.windupTicks / NEPTUNE_BOMB_FUSE), radius = NEPTUNE_BOMB_RADIUS * TILE_SIZE;
  const urgent = left < .34, flash = urgent && Math.floor(tick / 4) % 2 === 0;
  ctx.save();
  ctx.globalAlpha = .1 + (1 - left) * .14; ctx.fillStyle = '#7fd0ff'; ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.globalAlpha = .55 + (1 - left) * .4; ctx.strokeStyle = flash ? '#ffffff' : '#7fd0ff'; ctx.lineWidth = 3;
  ctx.strokeRect(-radius + 1, -radius + 1, radius * 2 - 2, radius * 2 - 2);
  ctx.globalAlpha = 1; ctx.shadowColor = '#7fd0ff'; ctx.shadowBlur = 12;
  block(ctx, -12, -12, 24, 24, '#3fa8f0'); ctx.shadowBlur = 0;
  block(ctx, -8, -8, 16, 16, '#7fd0ff'); block(ctx, -6, -6, 6, 6, '#ffffff');
  ctx.strokeStyle = '#e1f6ff'; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(0, -17); // fuse ring: clockwise square perimeter that empties
  const perimeter = [[17, -17], [17, 17], [-17, 17], [-17, -17], [0, -17]], total = left * 4;
  for (let i = 0; i < 4 && i < total; i++) {
    const [x1, y1] = i === 0 ? [0, -17] : perimeter[i - 1], [x2, y2] = perimeter[i], part = Math.min(1, total - i);
    ctx.lineTo(x1 + (x2 - x1) * part, y1 + (y2 - y1) * part);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawNeptuneUnit(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number): boolean {
  if (e.type !== 'fish_blue' && e.type !== 'fish_red' && e.type !== 'stinger' && e.type !== 'water_clone' && e.type !== 'water_bomb') return false;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
  if (e.flashTicks > 0) ctx.filter = 'brightness(1.8)';
  if (e.type === 'water_bomb') drawWaterBall(ctx, e, tick);
  else if (e.type === 'water_clone') drawClone(ctx, e, tick);
  else if (e.type === 'stinger') {
    ctx.save(); ctx.scale(1.15, 1.15); drawStinger(ctx, e, tick); ctx.restore();
    const width = 30; block(ctx, -width / 2, -22, width, 4, '#0a101b');
    block(ctx, -width / 2, -22, Math.floor(width * Math.max(0, e.hp / e.maxHp)), 4, ENEMY_CONFIGS.stinger.color);
  } else { ctx.scale(1.4, 1.4); drawFish(ctx, e, tick); }
  ctx.restore();
  return true;
}

// Floor layer: tides flowing through a room and the sky laser's countdown on its chosen room.
export function drawNeptuneOverlay(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const neptune = state.neptune;
  if (!neptune) return;
  ctx.save();
  for (const tide of neptune.tides) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[tide.chamber];
    const x = c1 * TILE_SIZE - camX, y = r1 * TILE_SIZE - camY, w = (c2 - c1 + 1) * TILE_SIZE, h = (r2 - r1 + 1) * TILE_SIZE;
    ctx.globalAlpha = .1; ctx.fillStyle = '#3f8fe8'; ctx.fillRect(x, y, w, h);
    // Chevrons drift along the current.
    ctx.globalAlpha = .45; ctx.fillStyle = '#9fd8ff';
    const step = TILE_SIZE * 3, drift = (tick * 2) % step;
    for (let gy = 0; gy < h; gy += step) for (let gx = 0; gx < w; gx += step) {
      const px = x + gx + step / 2 + tide.dirX * (drift - step / 2), py = y + gy + step / 2 + tide.dirY * (drift - step / 2);
      if (px < x || px > x + w || py < y || py > y + h) continue;
      ctx.save(); ctx.translate(Math.round(px), Math.round(py)); ctx.rotate(Math.atan2(tide.dirY, tide.dirX));
      ctx.fillRect(-6, -10, 6, 4); ctx.fillRect(0, -6, 6, 4); ctx.fillRect(0, 2, 6, 4); ctx.fillRect(-6, 6, 6, 4);
      ctx.restore();
    }
    ctx.globalAlpha = .6; ctx.strokeStyle = '#7fc7ff'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  }
  const laser = neptune.laser;
  if (laser) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[laser.chamber], progress = 1 - laser.ticks / NEPTUNE_LASER_WARNING;
    const x = c1 * TILE_SIZE - camX, y = r1 * TILE_SIZE - camY, w = (c2 - c1 + 1) * TILE_SIZE, h = (r2 - r1 + 1) * TILE_SIZE;
    const pulse = Math.abs(Math.sin(tick * (.15 + progress * .25)));
    ctx.globalAlpha = .05 + pulse * (.08 + progress * .12); ctx.fillStyle = '#c9f2ff'; ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = .6 + pulse * .35; ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    // A narrowing targeting column marks the strike centre.
    const cx = x + w / 2, cy = y + h / 2, beam = Math.round(w * (.5 - progress * .42));
    ctx.globalAlpha = .18 + progress * .35; ctx.fillStyle = '#9fe4ff'; ctx.fillRect(cx - beam / 2, y, beam, h);
    ctx.globalAlpha = .9; ctx.fillStyle = '#ffffff';
    ctx.font = '700 22px var(--font-pixel), monospace'; ctx.textAlign = 'center';
    ctx.fillText(`SKY LASER ${Math.ceil(laser.ticks / 60)}s`, cx, cy);
  }
  ctx.restore();
}

// Water ball burst: a flat stepped water ring sweeps out to the blast edge over a brief pale wash, a short
// white splash column rises from the centre, and eight 12px droplets arc outward and fall. 28 ticks, no glow.
export function drawWaterBurst(ctx: CanvasRenderingContext2D, x: number, y: number, maxRadius: number, ticks: number) {
  const progress = 1 - ticks / 28, fade = 1 - progress, G = 12;
  const snap = (v: number) => Math.round(v / 6) * 6;
  const block = (px: number, py: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(snap(px), snap(py), w, h); };
  ctx.save(); ctx.shadowBlur = 0;
  // Wash marking the hit area, strongest at the moment of the burst.
  ctx.globalAlpha = fade * .22; ctx.fillStyle = '#59c8ff';
  ctx.beginPath(); ctx.arc(x, y, maxRadius, 0, Math.PI * 2); ctx.fill();
  // Two stepped rings of 12px blocks: a bright crest leading, a deeper blue trough behind it.
  const ring = (r: number, c: string, alpha: number) => {
    const rr = Math.max(G * 2, Math.round(r / G) * G);
    ctx.globalAlpha = alpha;
    for (let py = -rr; py <= rr; py += G) for (let px = -rr; px <= rr; px += G) {
      const d = px * px + py * py;
      if (d <= rr * rr && d >= (rr - G) * (rr - G)) block(x + px - G / 2, y + py - G / 2, G, G, c);
    }
  };
  const ease = 1 - (1 - progress) * (1 - progress);
  ring(maxRadius * ease, '#e8fbff', fade * .95);
  if (progress > .15) ring(maxRadius * ease * .7, '#2f7fd0', fade * .7);
  // Splash column: rises then sinks back.
  const rise = Math.sin(Math.min(1, progress * 1.6) * Math.PI) * 42;
  ctx.globalAlpha = fade;
  block(x - 12, y - rise, 24, Math.max(6, rise), '#9fe4ff'); block(x - 6, y - rise - 6, 12, 12, '#ffffff');
  // Droplets thrown outward on a short arc.
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + Math.PI / 8, d = maxRadius * (.25 + ease * .55), lift = Math.sin(progress * Math.PI) * 30;
    block(x + Math.cos(a) * d - 6, y + Math.sin(a) * d * .8 - lift - 6, G, G, i % 2 ? '#9fe4ff' : '#e8fbff');
  }
  ctx.restore();
}

// Sky laser impact (drawn above actors): a white-cyan beam slams down over the whole room and narrows to a core,
// square water shockwaves ripple out from the centre, and blocky droplets splash up and fall back.
export function drawSkyLaserImpact(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number) {
  const impact = state.neptune?.laserImpact;
  if (!impact) return;
  const total = 70, age = total - impact.ticks, progress = age / total;
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[impact.chamber];
  const left = c1 * TILE_SIZE - camX, top = r1 * TILE_SIZE - camY, width = (c2 - c1 + 1) * TILE_SIZE, height = (r2 - r1 + 1) * TILE_SIZE;
  const cx = left + width / 2, cy = top + height / 2;
  ctx.save();
  // Room-wide flash.
  ctx.globalAlpha = Math.max(0, 1 - age / 12) * .55; ctx.fillStyle = '#e8fbff'; ctx.fillRect(left, top, width, height);
  // The beam: full room width at impact, shrinking to a thin bright core, reaching from far above the room.
  const beam = Math.max(10, width * Math.max(0, 1 - age / 26)), fade = Math.max(0, 1 - Math.max(0, age - 26) / 30);
  const beamTop = top - 900;
  ctx.globalAlpha = .35 * fade; ctx.fillStyle = '#59c8ff'; ctx.fillRect(Math.round(cx - beam / 2 - 18), beamTop, Math.round(beam + 36), cy - beamTop);
  ctx.globalAlpha = .75 * fade; ctx.fillStyle = '#9fe4ff'; ctx.fillRect(Math.round(cx - beam / 2), beamTop, Math.round(beam), cy - beamTop);
  ctx.globalAlpha = fade; ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(cx - beam / 6), beamTop, Math.round(beam / 3), cy - beamTop);
  ctx.beginPath(); ctx.rect(left, top, width, height); ctx.clip();
  // Square shockwaves rippling out across the water.
  for (let i = 0; i < 4; i++) {
    const t = (age - i * 7) / 45;
    if (t <= 0 || t >= 1) continue;
    const half = Math.round((20 + t * width * .6) / 8) * 8;
    ctx.globalAlpha = (1 - t) * (i % 2 ? .45 : .85); ctx.strokeStyle = i % 2 ? '#59c8ff' : '#e8fbff'; ctx.lineWidth = i % 2 ? 4 : 7;
    ctx.shadowColor = '#9fe4ff'; ctx.shadowBlur = i % 2 ? 0 : 10;
    ctx.strokeRect(cx - half, cy - half, half * 2, half * 2); ctx.shadowBlur = 0;
  }
  // Splash: blocky droplets thrown outward and upward, falling back with gravity.
  for (let i = 0; i < 48; i++) {
    const angle = i * 2.39996, speed = 3 + (i % 6), lift = 5 + (i % 4) * 2;
    const x = cx + Math.cos(angle) * speed * age, y = cy + Math.sin(angle) * speed * age * .55 - lift * age + .18 * age * age;
    ctx.globalAlpha = (1 - progress) * (i % 3 ? .85 : .55);
    ctx.fillStyle = i % 4 ? '#9fe4ff' : '#ffffff';
    const size = 3 + (i % 3) * 2; ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, size, size + 2);
  }
  ctx.restore();
}
