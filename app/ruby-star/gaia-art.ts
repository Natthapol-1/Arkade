import { TILE_SIZE, MAP_COLS, CHAMBER_BOUNDS, T_FLOOR, GAIA_POD_FUSE, GAIA_SUN_WARNING, GAIA_SCORCH_TICKS, GAIA_STONE_TRAVEL, GAIA_STONE_RELIGHT,
  GAIA_STONE_DRIFT_TICKS, GAIA_RING_RADIUS, GAIA_RING_WARN, GAIA_WARD_RADIUS, GAIA_SPORE_RADIUS, GAIA_SPORE_TICKS, GAIA_WITHER_TICKS, GAIA_SNARE_ROOT } from './constants';
import { ENEMY_CONFIGS } from './constants';
import type { Enemy, GameState } from './engine';

// Blocky neon-vector art for the Gaia challenge: overgrowth, Sunstones, her plants and aliens, root snares,
// Sunfire and the forest backdrop.

export const GAIA_CHAMBER_COLORS = ['#8fdc4a', '#e0c44a', '#4fd49a', '#c7e05a'] as const;

const hash = (x: number, y: number, k: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// One overgrown tile, kept deliberately plain: a flat green wash that darkens with each level, plus one simple
// motif — two moss dots, one straight vine with a leaf, or a crossed vine with two thorns. No wiggle or clutter.
export function drawGrowthTile(ctx: CanvasRenderingContext2D, level: number, x: number, y: number, tx: number, ty: number, tick: number) {
  const s = TILE_SIZE, flip = hash(tx, ty, 1) > .5; void tick;
  if (level === 1) {
    ctx.globalAlpha = .16; block(ctx, x, y, s, s, '#4f9a33');
    ctx.globalAlpha = .7; block(ctx, x + 12, y + (flip ? 14 : 28), 6, 6, '#6fae45'); block(ctx, x + 30, y + (flip ? 30 : 16), 6, 6, '#6fae45');
    ctx.globalAlpha = 1; return;
  }
  const thicket = level >= 3;
  ctx.globalAlpha = thicket ? .62 : .42; block(ctx, x, y, s, s, thicket ? '#1d4a18' : '#2f6a24'); ctx.globalAlpha = 1;
  const vine = thicket ? '#4f8f34' : '#6fbf4a', leaf = thicket ? '#8fcf5a' : '#a8e47a';
  // One straight vine across the tile, oriented per tile so neighbours don't line up into stripes.
  if (flip) { block(ctx, x, y + 21, s, 6, vine); block(ctx, x + 14, y + 15, 8, 6, leaf); }
  else { block(ctx, x + 21, y, 6, s, vine); block(ctx, x + 27, y + 14, 6, 8, leaf); }
  if (thicket) {
    if (flip) block(ctx, x + 21, y, 6, s, vine); else block(ctx, x, y + 21, s, 6, vine);
    block(ctx, x + 8, y + 8, 4, 4, '#e0f4a8'); block(ctx, x + 36, y + 36, 4, 4, '#e0f4a8');
  }
}

export function drawStone(ctx: CanvasRenderingContext2D, cx: number, cy: number, lit: boolean, progress: number, tick: number) {
  ctx.save(); ctx.translate(Math.round(cx), Math.round(cy));
  const bob = lit ? Math.round(Math.sin(tick * .06) * 2) : 0;
  ctx.translate(0, bob);
  ctx.shadowColor = '#ffd36a'; ctx.shadowBlur = lit ? 4 + 2 * Math.abs(Math.sin(tick * .05)) : 0;
  const outer = lit ? '#c8912a' : '#5e5848', mid = lit ? '#ffd36a' : '#857d64', light = lit ? '#fff3b8' : '#a39b80';
  block(ctx, -4, -16, 8, 32, outer); block(ctx, -10, -10, 20, 20, outer); block(ctx, -16, -4, 32, 8, outer);
  ctx.shadowBlur = 0;
  block(ctx, -6, -8, 12, 16, mid); block(ctx, -8, -6, 16, 12, mid);
  block(ctx, -6, -8, 4, 8, light); block(ctx, -2, -12, 4, 4, light);
  if (!lit && progress > 0) { // relight ring fills around the dim stone
    ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.arc(0, 0, 21, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// Under actors: growth, scorch, Ruby's ward and ring, Sunstones and snare cracks.
export function drawGaiaGround(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, viewW: number, viewH: number, tick: number) {
  const gaia = state.gaia; if (!gaia) return;
  const s = TILE_SIZE;
  const x0 = Math.max(0, Math.floor(camX / s) - 1), y0 = Math.max(0, Math.floor(camY / s) - 1);
  const x1 = Math.min(MAP_COLS - 1, Math.ceil((camX + viewW) / s) + 1), y1 = Math.min(state.map.length - 1, Math.ceil((camY + viewH) / s) + 1);
  ctx.save(); ctx.shadowBlur = 0;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (state.map[ty]?.[tx] !== T_FLOOR) continue;
    const i = ty * MAP_COLS + tx, x = tx * s - camX, y = ty * s - camY;
    if (gaia.scorch[i] > 0) {
      const heat = gaia.scorch[i] / GAIA_SCORCH_TICKS;
      ctx.globalAlpha = .25 + .3 * heat; block(ctx, x, y, s, s, '#2a2118');
      ctx.globalAlpha = heat; if (hash(tx, ty, 5) > .7) block(ctx, x + 8 + hash(tx, ty, 6) * 28, y + 8 + hash(tx, ty, 7) * 28, 4, 4, '#ff9a3c');
      ctx.globalAlpha = 1;
    }
    if (gaia.growth[i] > 0) drawGrowthTile(ctx, gaia.growth[i], x, y, tx, ty, tick);
  }
  // Ruby's ward (faint gold frame) and the ring warning when vines close in.
  if (state.rubyTileX !== -1) {
    const rx = state.rubyTileX * s - camX, ry = state.rubyTileY * s - camY;
    ctx.globalAlpha = .45; ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 5;
    ctx.strokeRect(rx - GAIA_WARD_RADIUS * s + 3, ry - GAIA_WARD_RADIUS * s + 3, (GAIA_WARD_RADIUS * 2 + 1) * s - 6, (GAIA_WARD_RADIUS * 2 + 1) * s - 6);
    if (gaia.ringClosure >= GAIA_RING_WARN) {
      const closed = gaia.ringClosure >= 1, pulse = .5 + .5 * Math.sin(tick * (closed ? .3 : .15));
      ctx.globalAlpha = (closed ? .7 : .4) + .3 * pulse; ctx.strokeStyle = closed ? '#ff3b4f' : '#ff8a5a'; ctx.lineWidth = closed ? 6 : 4;
      ctx.strokeRect(rx - GAIA_RING_RADIUS * s + 3, ry - GAIA_RING_RADIUS * s + 3, (GAIA_RING_RADIUS * 2 + 1) * s - 6, (GAIA_RING_RADIUS * 2 + 1) * s - 6);
    }
    ctx.globalAlpha = 1;
  }
  // Root snare cracks: red zigzags that flash faster just before they erupt.
  for (const snare of gaia.snares) {
    const x = snare.tileX * s - camX, y = snare.tileY * s - camY, urgent = snare.ticks < 24;
    ctx.globalAlpha = urgent && Math.floor(tick / 3) % 2 ? 1 : .75;
    block(ctx, x + 2, y + 2, s - 4, s - 4, '#ff3b4f33');
    for (let k = 0; k < 6; k++) block(ctx, x + 6 + k * 6, y + 20 + (k % 2 ? 6 : 0), 6, 4, '#ff4d5a');
    for (let k = 0; k < 4; k++) block(ctx, x + 22 + (k % 2 ? 4 : 0), y + 6 + k * 8, 4, 6, '#ff8a8a');
    ctx.globalAlpha = 1;
  }
  // Sunstones, including ones flying to their new room.
  for (const stone of gaia.stones) {
    if (stone.travel > 0) {
      const t = 1 - stone.travel / GAIA_STONE_TRAVEL;
      const fx = (stone.fromX + .5) * s, fy = (stone.fromY + .5) * s, tx = (stone.x + .5) * s, ty = (stone.y + .5) * s;
      const px = fx + (tx - fx) * t - camX, py = fy + (ty - fy) * t - Math.sin(t * Math.PI) * 140 - camY;
      ctx.save(); ctx.shadowColor = '#ffd36a'; ctx.shadowBlur = 6;
      for (let k = 3; k >= 0; k--) { ctx.globalAlpha = 1 - k * .22; block(ctx, px - (tx - fx) * .02 * k - 5, py + k * 6 - 5, 10 - k * 2, 10 - k * 2, k ? '#ffd36a' : '#fff3b8'); }
      ctx.restore();
      continue;
    }
    const k = stone.slide ? stone.slide / GAIA_STONE_DRIFT_TICKS : 0; // phase 3 drift slides smoothly to its new tile
    const sx = stone.x + (stone.fromX - stone.x) * k, sy = stone.y + (stone.fromY - stone.y) * k;
    drawStone(ctx, (sx + .5) * s - camX, (sy + .5) * s - camY, stone.lit, stone.lit ? 0 : 1 - stone.relight / GAIA_STONE_RELIGHT, tick);
  }
  ctx.restore();
}

// Roots binding someone in place: four blocky roots burst up around the tile, curl over the top and grip,
// trembling while they hold, then sink back as the hold ends. `hold` 0–1 is how much of the hold remains.
export function drawRootBind(ctx: CanvasRenderingContext2D, x: number, y: number, hold: number, tick: number, squeeze = false) {
  const age = (1 - hold) * GAIA_SNARE_ROOT, rise = squeeze ? 1 : Math.min(1, age / 8), sink = squeeze ? 1 : Math.min(1, hold / .15);
  const reach = 26 * rise * sink, shake = Math.round(Math.sin(tick * (squeeze ? .9 : .6)) * (squeeze ? 1.5 : 2));
  ctx.save(); ctx.translate(Math.round(x) + shake, Math.round(y)); ctx.shadowBlur = 0;
  // Soil burst at the base.
  ctx.globalAlpha = .8 * sink; block(ctx, -24, 14, 48, 8, '#4a3420'); block(ctx, -18, 10, 36, 4, '#6a4a2c');
  ctx.globalAlpha = 1;
  for (const side of [-1, 1]) for (const k of [0, 1]) {
    const bx = side * (12 + k * 8), top = 18 - reach - k * 6;
    block(ctx, bx - 4, top, 8, 18 - top + 2, k ? '#7a5530' : '#5a3a1f'); // root shaft rising from the floor
    if (reach > 14) { // tip curls inward over the body
      const curl = side * -(6 + k * 2);
      block(ctx, bx - 4 + curl, top - 6, 8, 6, '#5a3a1f'); block(ctx, bx - 4 + curl * 2, top - 4, 6, 6, '#8fdc4a');
    }
  }
  if (reach > 18) { // a band of vine wrapping across the middle
    block(ctx, -20, -2, 40, 6, squeeze ? '#c94a3a' : '#3f8a2c'); block(ctx, -20, -2, 40, 2, squeeze ? '#ff8a7a' : '#8fdc4a');
  }
  ctx.restore();
}

// Above actors: spores, pollen drift, blossom shots, Sunstone burns, root binds and Sunfire.
export function drawGaiaOverlay(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const gaia = state.gaia; if (!gaia) return;
  const s = TILE_SIZE;
  ctx.save(); ctx.shadowBlur = 0;
  for (const cloud of gaia.spores) {
    const fade = Math.min(1, cloud.ticks / 40) * (1 - Math.max(0, cloud.ticks - (GAIA_SPORE_TICKS - 20)) / 20);
    for (let k = 0; k < 18; k++) {
      const a = hash(cloud.x, cloud.y, k) * Math.PI * 2, r = hash(cloud.y, cloud.x, k) * GAIA_SPORE_RADIUS * s;
      const px = (cloud.x + .5) * s + Math.cos(a + tick * .01) * r - camX, py = (cloud.y + .5) * s + Math.sin(a + tick * .01) * r - camY;
      ctx.globalAlpha = fade * .55; block(ctx, px - 6, py - 6, 12, 12, k % 3 ? '#a58cff' : '#d8ccff');
    }
  }
  if (gaia.pollen) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[gaia.pollen.chamber];
    const x = c1 * s - camX, y = r1 * s - camY, w = (c2 - c1 + 1) * s, h = (r2 - r1 + 1) * s, fade = Math.min(1, gaia.pollen.ticks / 40);
    ctx.globalAlpha = .16 * fade; block(ctx, x, y, w, h, '#f2d64a');
    for (let k = 0; k < 40; k++) {
      const px = x + ((hash(k, 1, 3) * w + tick * (.3 + hash(k, 2, 3) * .4)) % w), py = y + ((hash(k, 4, 3) * h + Math.sin(tick * .02 + k) * 20 + h) % h);
      ctx.globalAlpha = .7 * fade; block(ctx, px, py, 4, 4, k % 4 ? '#ffe680' : '#fff8cc');
    }
  }
  for (const bolt of gaia.bolts) {
    const t = 1 - bolt.ticks / 16;
    for (let k = 0; k < 4; k++) {
      const u = Math.max(0, t - k * .08);
      ctx.globalAlpha = 1 - k * .2; block(ctx, bolt.fromX + (bolt.toX - bolt.fromX) * u - camX - 5, bolt.fromY + (bolt.toY - bolt.fromY) * u - camY - 5, 10, 10, k ? '#ffb7dc' : '#fff0f8');
    }
  }
  for (const flash of gaia.stoneFlashes) {
    const t = flash.ticks / 30, sx = (flash.x + .5) * s - camX, sy = (flash.y + .5) * s - camY, ex = (flash.toX + .5) * s - camX, ey = (flash.toY + .5) * s - camY;
    ctx.globalAlpha = t; ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 6; ctx.shadowColor = '#ffd36a'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.shadowBlur = 0;
    const burst = (1 - t) * 3 * s;
    ctx.strokeStyle = '#fff3b8'; ctx.lineWidth = 4; ctx.strokeRect(sx - burst / 2, sy - burst / 2, burst, burst);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; block(ctx, sx + Math.cos(a) * burst * .6 - 4, sy + Math.sin(a) * burst * .6 - 4, 8, 8, '#ffd36a'); }
  }
  // Roots holding you after a snare, and Ruby after a snare or while a closed ring squeezes it.
  if (gaia.snaredTicks > 0) drawRootBind(ctx, state.playerX - camX, state.playerY - camY, gaia.snaredTicks / GAIA_SNARE_ROOT, tick);
  if (state.rubyTileX !== -1 && (gaia.rubyRootTicks > 0 || gaia.ringClosure >= 1)) {
    const rx = (state.rubyTileX + .5) * s - camX, ry = (state.rubyTileY + .5) * s - camY;
    drawRootBind(ctx, rx, ry, gaia.rubyRootTicks > 0 ? gaia.rubyRootTicks / GAIA_SNARE_ROOT : 1, tick, gaia.rubyRootTicks <= 0);
  }
  const boss = state.enemies.find(e => e.id === gaia.bossId && e.hp > 0);
  if (boss && gaia.wither > 0) { // she sinks into a mound of soil, then rises in the next phase
    const t = gaia.wither / GAIA_WITHER_TICKS, x = boss.x - camX, y = boss.y - camY;
    ctx.globalAlpha = .9; block(ctx, x - 30, y + 10, 60, 16, '#4a3420'); block(ctx, x - 22, y + 4, 44, 8, '#6a4a2c');
    for (let k = 0; k < 5; k++) { ctx.globalAlpha = t; block(ctx, x - 24 + k * 12, y + 2 - ((tick + k * 9) % 30), 4, 4, '#8fdc4a'); }
  }
  // Sunfire: the chosen room glows gold with a narrowing column, then the sun strikes.
  if (gaia.sunfire) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[gaia.sunfire.chamber];
    const x = c1 * s - camX, y = r1 * s - camY, w = (c2 - c1 + 1) * s, h = (r2 - r1 + 1) * s, t = 1 - gaia.sunfire.ticks / GAIA_SUN_WARNING;
    ctx.globalAlpha = .12 + .14 * Math.abs(Math.sin(tick * .2)); block(ctx, x, y, w, h, '#ffd36a');
    const col = Math.max(16, w * (1 - t) * .5);
    ctx.globalAlpha = .25 + t * .35; block(ctx, x + w / 2 - col / 2, y - 600, col, h / 2 + 600, '#ffe680');
    ctx.globalAlpha = 1; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff3b8';
    ctx.fillText('SUNFIRE ' + Math.ceil(gaia.sunfire.ticks / 60), x + w / 2, y + 40);
  }
  if (gaia.sunBurst) { // partial Sunfire: a gold burst around where you stood
    const burst = gaia.sunBurst, age = 36 - burst.ticks, t = age / 36, x = burst.x - camX, y = burst.y - camY, reach = burst.radius * s;
    ctx.globalAlpha = Math.max(0, 1 - age / 10) * .45; block(ctx, x - reach, y - reach, reach * 2, reach * 2, '#fff3b8');
    for (let k = 0; k < 3; k++) {
      const u = t - k * .15; if (u <= 0 || u >= 1) continue;
      const half = Math.round((12 + u * reach) / 6) * 6;
      ctx.globalAlpha = (1 - u) * .9; ctx.strokeStyle = k % 2 ? '#ffb84a' : '#fff3b8'; ctx.lineWidth = k % 2 ? 4 : 8;
      ctx.strokeRect(x - half, y - half, half * 2, half * 2);
    }
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.globalAlpha = 1 - t; block(ctx, x + Math.cos(a) * reach * t - 5, y + Math.sin(a) * reach * t - 5, 10, 10, '#ffd36a'); }
  }
  if (gaia.sunImpact) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[gaia.sunImpact.chamber];
    const x = c1 * s - camX, y = r1 * s - camY, w = (c2 - c1 + 1) * s, h = (r2 - r1 + 1) * s, age = 60 - gaia.sunImpact.ticks;
    ctx.globalAlpha = Math.max(0, 1 - age / 14) * .6; block(ctx, x, y, w, h, '#fff8d8');
    const beam = Math.max(12, w * .8 * Math.max(0, 1 - age / 24)), fade = Math.max(0, 1 - Math.max(0, age - 24) / 30);
    ctx.globalAlpha = .45 * fade; block(ctx, x + w / 2 - beam / 2 - 16, y - 900, beam + 32, h / 2 + 900, '#ffb84a');
    ctx.globalAlpha = .85 * fade; block(ctx, x + w / 2 - beam / 2, y - 900, beam, h / 2 + 900, '#ffe680');
    ctx.globalAlpha = fade; block(ctx, x + w / 2 - beam / 6, y - 900, beam / 3, h / 2 + 900, '#ffffff');
    for (let k = 0; k < 4; k++) {
      const u = (age - k * 6) / 36; if (u <= 0 || u >= 1) continue;
      const half = Math.round((20 + u * w * .55) / 8) * 8;
      ctx.globalAlpha = (1 - u) * .8; ctx.strokeStyle = k % 2 ? '#ffb84a' : '#fff3b8'; ctx.lineWidth = k % 2 ? 4 : 8;
      ctx.strokeRect(x + w / 2 - half, y + h / 2 - half, half * 2, half * 2);
    }
  }
  ctx.restore();
}

// Gaia's plants and aliens. Returns false for any other unit.
export function drawGaiaUnit(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number): boolean {
  if (e.type !== 'seed_pod' && e.type !== 'blossom' && e.type !== 'sporeling' && e.type !== 'vine_crawler' && e.type !== 'angry_mushroom' && e.type !== 'lifebloom') return false;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.shadowBlur = 0;
  if (e.flashTicks > 0) ctx.filter = 'brightness(1.8)';
  if (e.type === 'seed_pod') {
    const grow = 1 - Math.max(0, e.windupTicks) / GAIA_POD_FUSE, urgent = grow > .66 && Math.floor(tick / 5) % 2 === 0;
    const size = Math.round(14 + grow * 12);
    block(ctx, -2, 4, 4, 14, '#3f7a2c'); block(ctx, -10, 12, 8, 4, '#5fae3e'); block(ctx, 2, 10, 8, 4, '#5fae3e');
    ctx.shadowColor = '#c6e86a'; ctx.shadowBlur = urgent ? 6 : 3;
    block(ctx, -size / 2, -size + 6, size, size, urgent ? '#f4ffb0' : '#a8d84a'); ctx.shadowBlur = 0;
    block(ctx, -size / 2, -size + 6, size / 3, size, '#7fb03a'); block(ctx, size / 6, -size + 6 + 4, 4, size - 8, '#e0f8a0');
    block(ctx, -4, -size + 2, 8, 4, '#3f7a2c');
  } else if (e.type === 'blossom') {
    const pulse = Math.round(Math.sin(tick * .1 + e.id) * 2);
    block(ctx, -2, 2, 4, 18, '#3f7a2c'); block(ctx, -12, 10, 10, 6, '#5fae3e'); block(ctx, 2, 6, 10, 6, '#5fae3e');
    ctx.shadowColor = '#ff8fc8'; ctx.shadowBlur = 4;
    for (const [dx, dy] of [[0, -12], [12, 0], [0, 12], [-12, 0]]) block(ctx, dx - 7 - (dx ? pulse : 0) * Math.sign(dx), dy - 7 - (dy ? pulse : 0) * Math.sign(dy) - 6, 14, 14, '#ff8fc8');
    ctx.shadowBlur = 0;
    for (const [dx, dy] of [[0, -12], [12, 0], [0, 12], [-12, 0]]) block(ctx, dx - 3, dy - 3 - 6, 6, 6, '#ffd6ec');
    block(ctx, -6, -12, 12, 12, '#ffd36a'); block(ctx, -6, -12, 4, 4, '#fff3b8');
    if (e.shootTicks > 0) { ctx.globalAlpha = e.shootTicks / 12; block(ctx, -10, -16, 20, 20, '#fff0f8'); ctx.globalAlpha = 1; }
  } else if (e.type === 'lifebloom') {
    // A friendly white-mint flower with a glowing green cross at its heart; it fades out in its last two seconds.
    const fade = Math.min(1, e.windupTicks / 120), pulse = .7 + .3 * Math.abs(Math.sin(tick * .1 + e.id));
    ctx.globalAlpha = fade;
    block(ctx, -2, 2, 4, 16, '#3f8a2c'); block(ctx, -12, 8, 10, 5, '#5fae3e'); block(ctx, 2, 4, 10, 5, '#5fae3e');
    ctx.shadowColor = '#9fffc8'; ctx.shadowBlur = 6 * pulse;
    for (const [dx, dy] of [[0, -11], [11, 0], [0, 11], [-11, 0]]) block(ctx, dx - 6, dy - 6 - 6, 12, 12, '#e8fff0');
    ctx.shadowBlur = 0;
    block(ctx, -6, -12, 12, 12, '#9fffc8');
    block(ctx, -2, -10, 4, 8, '#ffffff'); block(ctx, -4, -8, 8, 4, '#ffffff');
    ctx.globalAlpha = 1;
  } else if (e.type === 'angry_mushroom') {
    // A red-capped mushroom sprinting on stubby legs, brows furrowed; it lunges when it hits.
    const run = Math.floor(tick / 5 + e.id) % 2, lunge = e.shootTicks > 0 ? 4 : 0, dir = e.targetTileX - e.tileX < 0 ? -1 : 1;
    ctx.scale(dir, 1); ctx.translate(lunge, 0);
    block(ctx, -8, 8, 5, run ? 8 : 5, '#c9b896'); block(ctx, 3, 8, 5, run ? 5 : 8, '#c9b896');
    block(ctx, -9, -2, 18, 12, '#f0e2c0'); block(ctx, -9, 6, 18, 4, '#c9b896');
    block(ctx, -6, 0, 4, 4, '#1a0f0f'); block(ctx, 3, 0, 4, 4, '#1a0f0f');
    block(ctx, -8, -3, 6, 2, '#1a0f0f'); block(ctx, 2, -3, 6, 2, '#1a0f0f'); // angry brows
    block(ctx, -3, 6, 6, 2, '#8a2a2a');
    ctx.shadowColor = '#ff5a4a'; ctx.shadowBlur = 4;
    block(ctx, -18, -16, 36, 14, '#e2382c'); ctx.shadowBlur = 0;
    block(ctx, -14, -20, 28, 4, '#e2382c'); block(ctx, -18, -6, 36, 4, '#a8231c');
    block(ctx, -12, -16, 6, 5, '#ffe8e0'); block(ctx, 4, -18, 5, 5, '#ffe8e0'); block(ctx, 10, -11, 4, 4, '#ffe8e0');
  } else if (e.type === 'sporeling') {
    const bob = Math.round(Math.sin(tick * .15 + e.id) * 2);
    block(ctx, -8, 0 + bob, 16, 12, '#e6dcc0'); block(ctx, -8, 8 + bob, 16, 4, '#b8ad90');
    block(ctx, -5, 3 + bob, 3, 3, '#1a1426'); block(ctx, 2, 3 + bob, 3, 3, '#1a1426');
    ctx.shadowColor = '#b9a8ff'; ctx.shadowBlur = 4;
    block(ctx, -16, -14 + bob, 32, 14, '#8a6fe0'); ctx.shadowBlur = 0;
    block(ctx, -16, -6 + bob, 32, 6, '#5f48b0'); block(ctx, -12, -18 + bob, 24, 4, '#8a6fe0');
    block(ctx, -10, -14 + bob, 5, 5, '#e2d9ff'); block(ctx, 4, -12 + bob, 4, 4, '#e2d9ff'); block(ctx, -2, -17 + bob, 3, 3, '#e2d9ff');
  } else {
    const wave = (k: number) => Math.round(Math.sin(tick * .2 + k * 1.2 + e.id) * 3);
    const dir = e.targetTileX - e.tileX < 0 ? -1 : 1;
    ctx.scale(dir, 1);
    for (let k = 2; k >= 0; k--) {
      const x = -16 + k * 12;
      block(ctx, x - 7, -7 + wave(k), 14, 14, k === 2 ? '#7fd35a' : '#5fbf4a'); block(ctx, x - 7, 3 + wave(k), 14, 4, '#3f8a2c');
      if (k < 2) block(ctx, x - 3, -11 + wave(k), 6, 4, '#b6f0a0');
    }
    block(ctx, 12, -3 + wave(2), 3, 3, '#0b1020');
  }
  ctx.restore();
  if (e.type === 'lifebloom') { /* no HP bar: one hit breaks it */ }
  else if (e.type === 'seed_pod' || e.type === 'blossom') {
    const pips = Math.ceil(e.hp / e.maxHp * 4);
    for (let i = 0; i < 4; i++) block(ctx, Math.round(sx) - 15 + i * 8, Math.round(sy) - 34, 6, 3, i < pips ? '#eaffb0' : '#1b2a1d');
  } else { // aliens: a thin bar like the stinger's
    const width = 30, x = Math.round(sx) - width / 2, y = Math.round(sy) - (e.type === 'vine_crawler' ? 22 : 28);
    block(ctx, x, y, width, 4, '#0a101b'); block(ctx, x, y, Math.floor(width * Math.max(0, e.hp / e.maxHp)), 4, ENEMY_CONFIGS[e.type].color);
  }
  return true;
}

// Gaia backdrop behind the station: a dusky forest seen through the void. Two parallax tree lines, light shafts,
// drifting pollen and blinking fireflies.
export function drawForestBackdrop(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, camX: number, camY: number, tick: number) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, '#0b1a14'); sky.addColorStop(.6, '#0a2416'); sky.addColorStop(1, '#06140c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, viewW, viewH);
  for (let k = 0; k < 4; k++) { // light shafts
    const x = ((k * 377 - camX * .03) % (viewW + 400) + viewW + 400) % (viewW + 400) - 200;
    ctx.globalAlpha = .045 + .02 * Math.sin(tick * .01 + k); ctx.fillStyle = '#e8f0a0';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 120, 0); ctx.lineTo(x + 260, viewH); ctx.lineTo(x + 100, viewH); ctx.fill();
  }
  for (const [layer, par, color, base] of [[0, .06, '#0f2a1a', .55], [1, .14, '#123a20', .7]] as const) {
    const span = 90 + layer * 40;
    for (let k = -1; k < viewW / span + 2; k++) {
      const n = Math.floor(camX * par / span) + k, x = k * span - (camX * par) % span;
      const h = viewH * (base - .2 + hash(n, layer, 1) * .25), top = viewH - h + ((camY * par) % 60);
      ctx.globalAlpha = 1; block(ctx, x + span * .4, top + 30, span * .16, h, color);
      for (let tier = 0; tier < 3; tier++) block(ctx, x + tier * 10, top + tier * 26, span - tier * 20, 30, color);
    }
  }
  for (let k = 0; k < 40; k++) {
    const x = ((hash(k, 1, 9) * viewW * 1.4 - camX * .1 + Math.sin(tick * .01 + k) * 30) % viewW + viewW) % viewW;
    const y = ((hash(k, 2, 9) * viewH * 1.4 - camY * .1 - tick * .2) % viewH + viewH) % viewH;
    const blink = k % 3 === 0 ? .5 + .5 * Math.sin(tick * .07 + k) : .5;
    ctx.globalAlpha = blink * .8; block(ctx, x, y, k % 3 === 0 ? 4 : 3, k % 3 === 0 ? 4 : 3, k % 3 === 0 ? '#d8ff7a' : '#fff3b8');
  }
  ctx.restore();
}

// Floor dressing: fireflies drifting over the station and roots creeping over cover blocks.
export function drawForestAmbience(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number, tick: number) {
  const s = TILE_SIZE;
  ctx.save(); ctx.shadowBlur = 0;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (state.map[ty]?.[tx] !== 0 || hash(tx, ty, 3) < .55) continue;
    const ch = CHAMBER_BOUNDS.findIndex(([t, l, b, r]) => tx > l && tx < r && ty > t && ty < b); if (ch < 0) continue;
    const x = tx * s - camX, y = ty * s - camY;
    block(ctx, x + 4, y + s - 10, s - 8, 6, '#3f7a2c'); block(ctx, x + 10, y + s - 18, 6, 8, '#5fae3e'); block(ctx, x + s - 18, y + s - 16, 8, 6, '#8fdc4a');
  }
  for (let k = 0; k < 24; k++) {
    const fx = (x0 + hash(k, 5, 1) * (x1 - x0 + 1)) * s + Math.sin(tick * .013 + k * 2) * 60 - camX;
    const fy = (y0 + hash(k, 6, 1) * (y1 - y0 + 1)) * s + Math.cos(tick * .011 + k) * 50 - camY;
    ctx.globalAlpha = .35 + .35 * Math.sin(tick * .08 + k); block(ctx, fx, fy, 4, 4, '#d8ff7a');
  }
  ctx.restore();
}
