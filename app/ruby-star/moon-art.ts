import { TILE_SIZE, CHAMBER_BOUNDS, MAP_COLS, T_WALL, T_FLOOR, chamberOfTile } from './constants';
import type { Enemy, GameState } from './engine';

// The Moon challenge world (Shadow Queen): a shadowy crystal cavern beneath the lunar surface. Purely visual for now.

export const MOON_CHAMBER_COLORS = ['#b98cff', '#8f7dff', '#de9cff', '#86b8ff'] as const; // amethyst, violet, orchid, ice blue

export function isMoonMap(state: Readonly<GameState>) { return state.trial?.boss === 'splitter_queen'; }

const PALE = '#f4eaff', ICE = '#a9e6ff', SHADOW = '#05030b';
const hash = (x: number, y: number, k: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function tri(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
}
// Interior cover (not the outer walls, which stay open to the backdrop).
function isCover(state: Readonly<GameState>, tx: number, ty: number) {
  if ((state.map[ty]?.[tx] ?? T_WALL) !== T_WALL) return false;
  const ch = chamberOfTile(tx, ty); if (ch < 0) return false;
  const [t, l, b, r] = CHAMBER_BOUNDS[ch];
  return tx > l && tx < r && ty > t && ty < b;
}
// The diagonal light that sweeps across the crystal: 0 outside the band, 1 at its centre. World-space, so it runs
// on seamlessly from tile to tile.
function sweep(px: number, py: number, tick: number, period: number, speed: number, width: number) {
  const d = (((px + py) - tick * speed) % period + period) % period;
  return d < width ? 1 - Math.abs(d / width * 2 - 1) : 0;
}

// A distant crystal spire: a stepped, tapering column with a lit left face, rising up (dir 1) or hanging down (dir -1).
function spire(ctx: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, dir: 1 | -1, body: string, lit: string, tip: string, tipAlpha: number) {
  const step = 12, steps = Math.max(2, Math.round(h / step));
  for (let i = 0; i < steps; i++) {
    const sw = Math.max(4, Math.round(w * (1 - i / steps) / 2) * 2), y = dir > 0 ? base - (i + 1) * step : base + i * step;
    block(ctx, x - sw / 2, y, sw, step, body);
    block(ctx, x - sw / 2, y, Math.max(2, sw * .3), step, lit);
  }
  const tipY = dir > 0 ? base - steps * step - 6 : base + steps * step;
  ctx.globalAlpha *= tipAlpha; block(ctx, x - 2, tipY, 4, 6, tip); ctx.globalAlpha /= tipAlpha;
}

// Behind the station: the dark of a vast geode. Crystal spires rise from below and hang from above in two parallax
// layers, pale veins pulse inside the nearer ones, faint prism shafts sway, shadow mist drifts and lone shards turn
// slowly in the dark.
export function drawMoonBackdrop(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, camX: number, camY: number, tick: number) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, '#07040f'); sky.addColorStop(.5, '#0e0722'); sky.addColorStop(1, '#060310');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, viewW, viewH);
  // Deep violet mist: stacked translucent blocks drifting very slowly.
  for (let n = 0; n < 3; n++) {
    const span = viewW + 900, nx = ((hash(n, 1, 7) * span - camX * .03 + tick * .02) % span + span) % span - 450, ny = viewH * (.2 + n * .3) - (camY * .03) % 160;
    ctx.fillStyle = n === 1 ? '#3b6fa8' : '#6a3fb0';
    for (let b = 0; b < 6; b++) {
      ctx.globalAlpha = .03 + hash(n, b, 8) * .02;
      ctx.fillRect(Math.round(nx + (hash(n, b, 9) - .5) * 360), Math.round(ny + (hash(n, b, 10) - .5) * 140), 160 + hash(n, b, 11) * 220, 50 + hash(n, b, 12) * 70);
    }
  }
  // Prism shafts: narrow, faint and swaying.
  for (let k = 0; k < 4; k++) {
    const sx = ((hash(k, 2, 3) * viewW * 1.4 - camX * .05) % (viewW * 1.4) + viewW * 1.4) % (viewW * 1.4) - viewW * .2 + Math.sin(tick * .004 + k * 2) * 40;
    ctx.globalAlpha = .035 + .02 * Math.sin(tick * .01 + k);
    ctx.fillStyle = k % 2 ? ICE : '#c9a6ff';
    ctx.fillRect(Math.round(sx), 0, 26 + k * 6, viewH);
    ctx.globalAlpha *= .6; ctx.fillRect(Math.round(sx) + 8, 0, 4, viewH);
  }
  // Two spire layers; the far one is dim, the near one darker with glowing tips and pulsing veins.
  for (let layer = 0; layer < 2; layer++) {
    const par = layer ? .12 : .05, count = layer ? 8 : 12, span = viewW + 400;
    for (let i = 0; i < count; i++) {
      const up = (i + layer) % 3 !== 0, w = (layer ? 46 : 30) + hash(i, layer, 4) * (layer ? 50 : 30), h = viewH * ((layer ? .28 : .2) + hash(i, layer, 5) * .3);
      const x = ((hash(i, layer, 6) * span - camX * par) % span + span) % span - 200;
      const base = up ? viewH + 12 - (camY * par) % 60 : -12 - (camY * par) % 60;
      const pulse = .55 + .45 * Math.sin(tick * .02 + i * 1.3 + layer);
      ctx.globalAlpha = layer ? .95 : .6;
      spire(ctx, x, base, w, h, up ? 1 : -1, layer ? '#120a26' : '#1b1238', layer ? '#2a1c52' : '#2b1f50', layer ? (i % 3 ? '#de9cff' : ICE) : '#8f7dff', layer ? pulse : .5);
      if (layer) { // a pale vein running up the middle
        ctx.globalAlpha = .18 * pulse; ctx.fillStyle = i % 3 ? '#b98cff' : ICE;
        const vh = h * .7; ctx.fillRect(Math.round(x - 1), Math.round(up ? base - vh : base), 2, Math.round(vh));
      }
    }
  }
  // Lone shards turning slowly in the dark: whole solid diamonds, rotated as one shape.
  for (let k = 0; k < 10; k++) {
    const span = viewW + 300, x = ((hash(k, 4, 2) * span - camX * .09 + tick * .04 * (1 + k % 3)) % span + span) % span - 150;
    const y = viewH * (.15 + hash(k, 5, 2) * .7) + Math.sin(tick * .01 + k) * 12 - (camY * .09) % 80, r = 6 + hash(k, 6, 2) * 10;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tick * .004 * (k % 2 ? 1 : -1) + k);
    ctx.globalAlpha = .4 + .2 * Math.sin(tick * .03 + k);
    ctx.fillStyle = '#4a3480'; ctx.beginPath(); ctx.moveTo(0, -r * 1.6); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.6); ctx.lineTo(-r, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = k % 3 ? '#9f7dff' : '#6fa8e0'; ctx.beginPath(); ctx.moveTo(0, -r * 1.6); ctx.lineTo(0, r * 1.6); ctx.lineTo(-r, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PALE; ctx.globalAlpha *= .8; ctx.fillRect(-1, -r * 1.2, 2, r * 1.4);
    ctx.restore();
  }
  // Crystal dust: a few pale glints that twinkle as four-point sparkles.
  for (let i = 0; i < 40; i++) {
    const x = ((hash(i, 2, 1) * viewW * 1.5 - camX * .08) % viewW + viewW) % viewW, y = ((hash(i, 3, 1) * viewH * 1.5 - camY * .08) % viewH + viewH) % viewH;
    const tw = Math.max(0, Math.sin(tick * .03 + i * 2.1));
    ctx.globalAlpha = .12 + .4 * tw; ctx.fillStyle = i % 4 ? '#dcd0ff' : ICE; ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
    if (tw > .85) { ctx.globalAlpha = (tw - .85) * 3; ctx.fillRect(Math.round(x) - 4, Math.round(y), 10, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - 4, 1, 10); }
  }
  // Shadow vignette: the cavern closes in at top and bottom.
  ctx.globalAlpha = 1;
  const v = ctx.createLinearGradient(0, 0, 0, viewH);
  v.addColorStop(0, '#000000aa'); v.addColorStop(.25, '#00000000'); v.addColorStop(.75, '#00000000'); v.addColorStop(1, '#000000aa');
  ctx.fillStyle = v; ctx.fillRect(0, 0, viewW, viewH);
  ctx.restore();
}

// A cover block made of crystal. Each tile is cut differently (a diagonal split either way, or an off-centre point),
// shaded as lit from the top left in its room colour or a cold ice tint, with a deeper inner facet seen through the
// surface, thin pale facet edges, a bright rim only where the block meets open floor, and a glint sweeping across.
export function drawMoonCrystalBlock(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string, tick: number) {
  const s = TILE_SIZE, cut = Math.floor(hash(tx, ty, 1) * 3), tint = hash(tx, ty, 2) > .7 ? '#e48cff' : color, lift = .85 + hash(tx, ty, 3) * .3;
  const x1 = x + s, y1 = y + s;
  ctx.save(); ctx.shadowBlur = 0;
  block(ctx, x, y, s, s, '#120a26');
  ctx.fillStyle = tint; ctx.strokeStyle = PALE; ctx.lineWidth = 1;
  const edges: number[][] = [];
  if (cut === 0) { // split top-left to bottom-right: the upper-right face catches the light
    ctx.globalAlpha = .42 * lift; tri(ctx, x, y, x1, y, x1, y1);
    ctx.globalAlpha = .2 * lift; tri(ctx, x, y, x, y1, x1, y1);
    edges.push([x, y, x1, y1]);
  } else if (cut === 1) { // split top-right to bottom-left: the upper-left face is lit
    ctx.globalAlpha = .46 * lift; tri(ctx, x, y, x1, y, x, y1);
    ctx.globalAlpha = .14 * lift; tri(ctx, x1, y, x1, y1, x, y1);
    edges.push([x1, y, x, y1]);
  } else { // an off-centre point
    const px = x + s * (.3 + hash(tx, ty, 4) * .4), py = y + s * (.3 + hash(tx, ty, 5) * .4);
    ctx.globalAlpha = .44 * lift; tri(ctx, x, y, x1, y, px, py);
    ctx.globalAlpha = .3 * lift; tri(ctx, x, y, x, y1, px, py);
    ctx.globalAlpha = .15 * lift; tri(ctx, x1, y, x1, y1, px, py);
    ctx.globalAlpha = .07 * lift; tri(ctx, x, y1, x1, y1, px, py);
    edges.push([x, y, px, py], [x1, y, px, py], [x, y1, px, py], [x1, y1, px, py]);
  }
  // In some tiles, a deeper facet inside the crystal slowly brightens and dims, with an ice-blue spark at its tip.
  if (hash(tx, ty, 9) > .55) {
    const pulse = .55 + .45 * Math.sin(tick * .03 + tx * 1.3 + ty * .7);
    const ix = x + 10 + hash(tx, ty, 6) * 14, iy = y + 8 + hash(tx, ty, 7) * 12, iw = 10 + hash(tx, ty, 8) * 8;
    ctx.globalAlpha = .16 + .16 * pulse; ctx.fillStyle = tint;
    ctx.beginPath(); ctx.moveTo(ix + iw / 2, iy); ctx.lineTo(ix + iw, iy + iw * .7); ctx.lineTo(ix + iw / 2, iy + iw * 1.4); ctx.lineTo(ix, iy + iw * .7); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = .3 + .6 * pulse; block(ctx, ix + iw / 2 - 1.5, iy + 2, 3, 3, ICE);
  }
  // Facet edges.
  ctx.globalAlpha = .22; ctx.beginPath();
  for (const [ax, ay, bx, by] of edges) { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
  ctx.stroke();
  // Glint: a straight pale band on the line x + y = const, sweeping across all crystal in world space, clipped to
  // the block. A thin second line trails it.
  const period = 1800, u0 = (tx + ty) * s, head = ((tick * 2.2) % period + period) % period;
  const centre = u0 - ((u0 - head) % period + period) % period + period; // the next band position at or after this tile
  for (const c of [centre - period, centre]) {
    if (c < u0 - 30 || c > u0 + 2 * s + 30) continue;
    const C = c - (tx * s - x) - (ty * s - y); // to screen space
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip(); ctx.fillStyle = PALE;
    const band = (mid: number, hw: number, alpha: number) => {
      ctx.globalAlpha = alpha; ctx.beginPath();
      ctx.moveTo(mid - hw - (y - s), y - s); ctx.lineTo(mid + hw - (y - s), y - s); ctx.lineTo(mid + hw - (y + 2 * s), y + 2 * s); ctx.lineTo(mid - hw - (y + 2 * s), y + 2 * s);
      ctx.closePath(); ctx.fill();
    };
    band(C, 7, .38); band(C - 22, 2, .3);
    ctx.restore();
  }
  // Rim on exposed edges; the top edge also catches a pale highlight.
  const open = (dx: number, dy: number) => !isCover(state, tx + dx, ty + dy);
  ctx.globalAlpha = .85; ctx.fillStyle = color;
  if (open(0, -1)) block(ctx, x, y, s, 2, color);
  if (open(-1, 0)) block(ctx, x, y, 2, s, color);
  if (open(1, 0)) block(ctx, x + s - 2, y, 2, s, color);
  if (open(0, 1)) block(ctx, x, y + s - 2, s, 2, color);
  if (open(0, -1)) { ctx.globalAlpha = .55; block(ctx, x + 4, y + 3, s * .45, 1, PALE); }
  ctx.restore();
}

// Light bands along x + y = C crossing the given screen rectangle: soft-edged, repeating every `period` world px.
function sheen(ctx: CanvasRenderingContext2D, camX: number, camY: number, left: number, top: number, w: number, h: number, tick: number, period: number, speed: number, half: number, color: string, alpha: number) {
  const head = ((tick * speed) % period + period) % period, lo = left + top + camX + camY - half * 2, hi = left + top + w + h + camX + camY + half * 2;
  for (let u = lo - ((lo - head) % period + period) % period; u <= hi; u += period) {
    if (u < lo) continue;
    const C = u - camX - camY, qx = C / 2, qy = C / 2;
    const g = ctx.createLinearGradient(qx - half, qy - half, qx + half, qy + half);
    g.addColorStop(0, color + '00'); g.addColorStop(.42, color); g.addColorStop(.5, PALE); g.addColorStop(.58, color); g.addColorStop(1, color + '00');
    ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(left, top, w, h);
  }
}

// On the station floor: polished dark crystal. Soft diagonal sheens sweep across it (a broad violet one and a thin
// ice-blue one), crystal grain lines catch the light, blocks reflect into the floor below them, dark mist drifts
// over everything, small set crystals and rare runes glimmer, and magic motes rise through the rooms.
export function drawMoonAmbience(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number, tick: number) {
  const s = TILE_SIZE, left = x0 * s - camX, top = y0 * s - camY, w = (x1 - x0 + 1) * s, h = (y1 - y0 + 1) * s;
  ctx.save(); ctx.shadowBlur = 0;
  // Clip to open floor (pads stay clean) for the sheen and the mist.
  ctx.save(); ctx.beginPath();
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { // one rectangle per run of floor in a row
    if (state.map[ty]?.[tx] !== T_FLOOR) continue;
    const start = tx; while (tx < x1 && state.map[ty]?.[tx + 1] === T_FLOOR) tx++;
    ctx.rect(start * s - camX, ty * s - camY, (tx - start + 1) * s, s);
  }
  ctx.clip();
  sheen(ctx, camX, camY, left, top, w, h, tick, 1700, 1.4, 150, '#b98cff', .09);
  sheen(ctx, camX, camY, left, top, w, h, tick + 520, 2300, 1.9, 40, ICE, .1);
  // Shadow mist: large dark patches drifting slowly around fixed points in the world.
  const mapW = (state.map[0]?.length ?? 0) * s, mapH = state.map.length * s;
  for (let k = 0; k < 40; k++) {
    const mx = hash(k, 1, 13) * mapW + Math.sin(tick * .003 + k * 2.4) * 160 - camX;
    const my = hash(k, 2, 13) * mapH + Math.cos(tick * .0025 + k * 1.7) * 120 - camY, r = s * (3 + hash(k, 3, 13) * 3);
    if (mx + r < left || mx - r > left + w || my + r < top || my - r > top + h) continue;
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, r);
    g.addColorStop(0, SHADOW + 'b0'); g.addColorStop(.6, SHADOW + '50'); g.addColorStop(1, SHADOW + '00');
    ctx.globalAlpha = .7 + .3 * Math.sin(tick * .01 + k); ctx.fillStyle = g; ctx.fillRect(mx - r, my - r, r * 2, r * 2);
  }
  ctx.restore();
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (state.map[ty]?.[tx] !== T_FLOOR) continue;
    const x = tx * s - camX, y = ty * s - camY, ch = chamberOfTile(tx, ty), color = ch >= 0 ? MOON_CHAMBER_COLORS[ch] : '#c9b6ff';
    // Crystal grain: a faint straight line in some tiles that brightens as the sheen passes.
    if (hash(tx, ty, 10) > .78) {
      const lit = sweep(tx * s, ty * s, tick, 1700, 1.4, 300), vertical = hash(tx, ty, 14) > .5, at = 8 + Math.floor(hash(tx, ty, 15) * 32);
      ctx.globalAlpha = .07 + .3 * lit;
      if (vertical) block(ctx, x + at, y + 6, 1, s - 12, PALE); else block(ctx, x + 6, y + at, s - 12, 1, PALE);
    }
    // Reflection of a crystal block standing just above: a glow fading down the floor.
    if (isCover(state, tx, ty - 1)) {
      const g = ctx.createLinearGradient(0, y, 0, y + s * .7), shimmer = .8 + .2 * Math.sin(tick * .03 + tx * .9);
      g.addColorStop(0, color + '40'); g.addColorStop(1, color + '00');
      ctx.globalAlpha = shimmer; ctx.fillStyle = g; ctx.fillRect(x, y, s, s * .7);
    }
    // Set crystals: a small faceted gem in a few tiles that twinkles.
    if (hash(tx, ty, 7) > .9) {
      const gx = x + 12 + hash(tx, ty, 8) * 24, gy = y + 12 + hash(tx, ty, 9) * 24, tw = Math.max(0, Math.sin(tick * .045 + tx * 1.7 + ty));
      ctx.globalAlpha = .55; ctx.fillStyle = '#5a3d9e'; tri(ctx, gx, gy - 5, gx + 4, gy, gx, gy + 5); ctx.fillStyle = color; tri(ctx, gx, gy - 5, gx - 4, gy, gx, gy + 5);
      ctx.globalAlpha = .4 + .5 * tw; block(ctx, gx - 1, gy - 1, 2, 2, PALE);
      if (tw > .8) { ctx.globalAlpha = (tw - .8) * 3; block(ctx, gx - 6, gy, 12, 1, PALE); block(ctx, gx, gy - 6, 1, 12, PALE); }
    }
    // Runes: a rare sigil that slowly fades in and out: a square frame, a turning diamond and four corner marks.
    if (hash(tx, ty, 11) > .98) {
      const life = Math.max(0, Math.sin(tick * .008 + hash(tx, ty, 12) * 20));
      if (life > 0) {
        const cx = x + s / 2, cy = y + s / 2;
        ctx.globalAlpha = .22 * life; ctx.strokeStyle = ICE; ctx.lineWidth = 1.5; ctx.strokeRect(x + 8.5, y + 8.5, s - 17, s - 17);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(tick * .006 + tx); ctx.globalAlpha = .4 * life; ctx.lineWidth = 2; ctx.strokeRect(-8, -8, 16, 16); ctx.restore();
        ctx.globalAlpha = .5 * life;
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) block(ctx, cx + dx * 15 - 1.5, cy + dy * 15 - 1.5, 3, 3, ICE);
        ctx.globalAlpha = .7 * life; block(ctx, cx - 2, cy - 2, 4, 4, PALE);
      }
    }
  }
  // Phase 2+ mirror tiles: a framed silver-lilac pane with a bright glint sliding across it. Walkable, but they bounce
  // your shots back.
  // When they move, the old panes fade out and the new ones fade in with a pale flash.
  const fade = state.moon ? state.moon.mirrorFade / 30 : 0;
  const panes = [...(state.moon?.oldMirrors ?? []).map(i => [i, fade] as const), ...(state.moon?.mirrors ?? []).map(i => [i, 1 - fade] as const)];
  for (const [index, visible] of panes) {
    if (visible <= 0) continue;
    const tx = index % MAP_COLS, ty = Math.floor(index / MAP_COLS);
    if (tx < x0 || tx > x1 || ty < y0 || ty > y1) continue;
    const x = tx * s - camX, y = ty * s - camY;
    ctx.save(); ctx.globalAlpha = visible; const alphaScale = visible;
    if (visible < 1 && (state.moon?.mirrors ?? []).includes(index)) { ctx.globalAlpha = (1 - visible) * .6; block(ctx, x, y, s, s, PALE); ctx.globalAlpha = visible; }
    ctx.globalAlpha = .4 * alphaScale; block(ctx, x + 3, y + 3, s - 6, s - 6, '#2c2450'); // see-through: the floor shows beneath
    const g = ctx.createLinearGradient(x, y, x + s, y + s);
    g.addColorStop(0, '#b8aef0'); g.addColorStop(.5, '#6a5cb0'); g.addColorStop(1, '#c9c0ff');
    ctx.globalAlpha = .32 * alphaScale; ctx.fillStyle = g; ctx.fillRect(x + 6, y + 6, s - 12, s - 12);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, s - 12, s - 12); ctx.clip();
    const d = ((tick * 1.5 + (tx + ty) * 14) % 120) - 30;
    ctx.globalAlpha = .5 * alphaScale; ctx.fillStyle = PALE; ctx.beginPath(); ctx.moveTo(x + d, y); ctx.lineTo(x + d + 8, y); ctx.lineTo(x + d - 40, y + s); ctx.lineTo(x + d - 48, y + s); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = .75 * alphaScale; ctx.strokeStyle = '#e6dcff'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, y + 4, s - 8, s - 8);
    const tw = Math.max(0, Math.sin(tick * .06 + tx * 1.3 + ty));
    if (tw > .7) { ctx.globalAlpha = (tw - .7) * 3 * alphaScale; block(ctx, x + 9, y + 8, 6, 1, PALE); block(ctx, x + 11.5, y + 5.5, 1, 6, PALE); }
    ctx.restore();
  }
  // Magic motes rising through the rooms, violet and ice blue, each with a short tail. Each one loops on a fixed
  // world column, so the camera moving never makes them jump.
  const worldH = state.map.length * s, worldW = (state.map[0]?.length ?? 0) * s;
  for (let k = 0; k < 160; k++) {
    const fx = hash(k, 5, 1) * worldW + Math.sin(tick * .01 + k * 2) * 40 - camX;
    const fy = worldH - ((tick * (.3 + hash(k, 7, 1) * .3) + hash(k, 8, 1) * worldH) % worldH) - camY;
    if (fx < left - 10 || fx > left + w + 10 || fy < top - 10 || fy > top + h + 10) continue;
    const c = k % 3 ? '#d6c2ff' : ICE, a = .3 + .3 * Math.sin(tick * .05 + k);
    ctx.globalAlpha = a; block(ctx, fx, fy, 3, 3, c);
    ctx.globalAlpha = a * .4; block(ctx, fx + 1, fy + 3, 1, 6, c);
  }
  ctx.restore();
}

// The tell: only the real Queen casts a reflection on the crystal floor, a faint violet glow and a mirrored tiara
// below her. Illusions have none.
export function drawMoonReflection(ctx: CanvasRenderingContext2D, sx: number, sy: number, tick: number) {
  const half = Math.floor(TILE_SIZE * .4), top = sy + half + 2, shimmer = .75 + .25 * Math.sin(tick * .05);
  ctx.save(); ctx.shadowBlur = 0;
  const g = ctx.createLinearGradient(0, top, 0, top + 20);
  g.addColorStop(0, '#cc33ff66'); g.addColorStop(1, '#cc33ff00');
  ctx.globalAlpha = shimmer; ctx.fillStyle = g; ctx.fillRect(sx - half + 3, top, half * 2 - 6, 20);
  ctx.globalAlpha = .35 * shimmer; ctx.fillStyle = '#ddaaff'; // mirrored tiara, pointing down
  block(ctx, sx - 2, top + 3, 4, 9, '#ddaaff'); block(ctx, sx - half + 5, top + 3, 4, 5, '#ddaaff'); block(ctx, sx + half - 9, top + 3, 4, 5, '#ddaaff');
  ctx.restore();
}

// Arrival frames (she and her new illusions appear together), her disguise breaking at the reveal, and the crystal
// shards thrown by a destroyed illusion.
export function drawMoonEffects(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const moon = state.moon; if (!moon) return;
  ctx.save(); ctx.shadowBlur = 0;
  for (const a of moon.arrivals) {
    const t = 1 - a.ticks / 30, size = Math.round((18 + t * 40) / 4) * 4, x = a.x - camX, y = a.y - camY;
    ctx.globalAlpha = (1 - t) * .8; ctx.strokeStyle = PALE; ctx.lineWidth = 2; ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    ctx.globalAlpha = (1 - t) * .5; ctx.strokeStyle = '#dd88ff'; ctx.lineWidth = 4; ctx.strokeRect(x - size / 2 - 6, y - size / 2 - 6, size + 12, size + 12);
  }
  const boss = moon.unmask && state.enemies.find(e => e.id === moon.unmask!.id);
  if (moon.unmask && boss) {
    const t = 1 - moon.unmask.ticks / 24, x = boss.x - camX, y = boss.y - camY;
    ctx.globalAlpha = (1 - t) * .55; block(ctx, x - 22, y - 22, 44, 44, PALE);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + .3, d = 14 + t * 34;
      ctx.globalAlpha = 1 - t; block(ctx, x + Math.cos(a) * d - 3, y + Math.sin(a) * d - 3, 6, 6, i % 2 ? '#dd88ff' : PALE);
    }
  }
  // Moon Mark: an ice-blue sigil (turning diamond, four corner brackets, a pointer above) riding on the marked target;
  // it blinks in its last second.
  const marked = moon.mark && state.enemies.find(e => e.id === moon.mark!.id);
  if (moon.mark && marked && (moon.mark.ticks > 60 || Math.floor(tick / 6) % 2 === 0)) {
    const x = marked.x - camX, y = marked.y - camY, r = 28 + Math.round(Math.sin(tick * .1) * 2);
    ctx.strokeStyle = ICE; ctx.fillStyle = ICE; ctx.globalAlpha = .9; ctx.lineWidth = 3;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { block(ctx, x + dx * r - (dx > 0 ? 8 : 0), y + dy * r - (dy > 0 ? 3 : 0), 8, 3, ICE); block(ctx, x + dx * r - (dx > 0 ? 3 : 0), y + dy * r - (dy > 0 ? 8 : 0), 3, 8, ICE); }
    ctx.save(); ctx.translate(x, y - r - 14); ctx.rotate(tick * .05); ctx.globalAlpha = .95; ctx.lineWidth = 2; ctx.strokeRect(-5, -5, 10, 10); ctx.restore();
    block(ctx, x - 2, y - r - 16, 4, 4, PALE);
    ctx.globalAlpha = .18; block(ctx, x - r, y - r, r * 2, r * 2, ICE);
  }
  // A shot bounced off a mirror: a pale streak from the mirror back to you and a small cross flash on the pane.
  for (const r of moon.reflects) {
    const k = r.ticks / 16, mx = r.x - camX, my = r.y - camY, px = r.toX - camX, py = r.toY - camY;
    ctx.globalAlpha = k; ctx.strokeStyle = PALE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + (px - mx) * (1 - k * .6), my + (py - my) * (1 - k * .6)); ctx.stroke();
    block(ctx, mx - 10, my - 1.5, 20, 3, PALE); block(ctx, mx - 1.5, my - 10, 3, 20, PALE);
  }
  for (const s of moon.shards) {
    const x = s.x - camX, y = s.y - camY, fade = Math.min(1, s.ticks / 15);
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(s.dy, s.dx));
    ctx.globalAlpha = .3 * fade; ctx.fillStyle = '#b98cff'; ctx.fillRect(-22, -2, 16, 4); // short trail
    ctx.globalAlpha = fade; ctx.fillStyle = '#8f5fe0';
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(0, -5); ctx.lineTo(-8, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PALE; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(0, -2); ctx.lineTo(-4, 0); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Moon aliens. Mirror mite: a small blocky crystal bug with a mirror-bright shell (pale rim, dark inset, a glint
// sliding across its face), two pale eyes and three pairs of stepped legs that scuttle as it moves.
export function drawMoonUnit(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number): boolean {
  if (e.type === 'moon_shade') { drawShade(ctx, e, sx, sy, tick); return true; }
  if (e.type === 'moon_mimic') { drawMimic(ctx, e, sx, sy, tick); return true; }
  if (e.type !== 'mirror_mite') return false;
  const flash = e.flashTicks > 0, step = Math.floor(tick / 6 + e.id) % 2, attack = e.attackTimer > 0 && e.attackTimer <= 12;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.shadowBlur = 0;
  for (let k = -1; k <= 1; k++) { // bent legs, alternating as it scuttles
    const lift = (k + 1 + step) % 2 ? 3 : 0, y = k * 6;
    block(ctx, -15, y - 1, 5, 2, '#8a7ac0'); block(ctx, -17, y + 1 - lift, 2, 4, '#8a7ac0');
    block(ctx, 10, y - 1, 5, 2, '#8a7ac0'); block(ctx, 15, y + 1 - (3 - lift), 2, 4, '#8a7ac0');
  }
  const h = attack ? 12 : 10;
  ctx.shadowColor = '#c6b8ff'; ctx.shadowBlur = 5;
  block(ctx, -h, -h, h * 2, h * 2, flash ? '#ffffff' : '#c6b8ff'); ctx.shadowBlur = 0;
  if (!flash) {
    block(ctx, -h + 2, -h + 2, h * 2 - 4, h * 2 - 4, '#251a44');
    ctx.fillStyle = '#6b55b0'; tri(ctx, -h + 2, -h + 2, h - 2, -h + 2, -h + 2, h - 2); // lit mirror facet
    ctx.globalAlpha = .5; ctx.fillStyle = '#9d86e8'; tri(ctx, -h + 2, -h + 2, 2, -h + 2, -h + 2, 2); ctx.globalAlpha = 1;
    ctx.save(); ctx.beginPath(); ctx.rect(-h + 2, -h + 2, h * 2 - 4, h * 2 - 4); ctx.clip(); // glint sweeping across the mirror
    const g = ((tick * 1.4 + e.id * 17) % 44) - 22;
    ctx.globalAlpha = .7; ctx.fillStyle = PALE; ctx.beginPath(); ctx.moveTo(g - 3, -h); ctx.lineTo(g + 3, -h); ctx.lineTo(g - 13, h); ctx.lineTo(g - 19, h); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
    block(ctx, -6, 0, 4, 4, '#f4eaff'); block(ctx, 2, 0, 4, 4, '#f4eaff');
    block(ctx, -5, 1, 2, 2, '#3a2a6a'); block(ctx, 3, 1, 2, 2, '#3a2a6a');
  }
  // a mirror shard on its back
  ctx.fillStyle = flash ? '#ffffff' : '#e8e0ff'; tri(ctx, -3, -h, 3, -h, 0, -h - 7);
  ctx.fillStyle = flash ? '#ffffff' : '#a98cff'; tri(ctx, 0, -h, 3, -h, 0, -h - 7);
  ctx.restore();
  return true;
}

// Shade: a translucent shadow wraith that hunts Ruby. A stepped hood and body in deep violet, flickering between
// see-through and nearly solid, a ragged tail of drifting blocks, and two ice-blue eyes that flare as it strikes.
function drawShade(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number) {
  const flash = e.flashTicks > 0, attack = e.attackTimer > 0 && e.attackTimer <= 14, bob = Math.round(Math.sin(tick * .08 + e.id) * 2);
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy) + bob); ctx.shadowBlur = 0;
  const alpha = flash ? 1 : .55 + .2 * Math.sin(tick * .11 + e.id * 2);
  ctx.globalAlpha = alpha * .6; // ragged tail
  for (let i = 0; i < 3; i++) block(ctx, -8 + i * 6 + Math.round(Math.sin(tick * .1 + i) * 2), 12 + i * 2, 4, 6 - i, '#3c2a6e');
  ctx.globalAlpha = alpha;
  ctx.shadowColor = '#7a5cc8'; ctx.shadowBlur = 6;
  block(ctx, -12, -6, 24, 18, flash ? '#ffffff' : '#2a1d4e'); // body
  block(ctx, -9, -13, 18, 8, flash ? '#ffffff' : '#2a1d4e');  // hood
  block(ctx, -5, -17, 10, 4, flash ? '#ffffff' : '#2a1d4e');
  ctx.shadowBlur = 0;
  if (!flash) {
    block(ctx, -12, -6, 3, 18, '#5a4396'); block(ctx, -9, -13, 3, 8, '#5a4396'); // lit edge
    block(ctx, -6, -6, 12, 7, '#120a26');                                      // face in shadow
    ctx.shadowColor = '#a9e6ff'; ctx.shadowBlur = attack ? 8 : 4;
    block(ctx, -5, -4, 3, attack ? 4 : 3, ICE); block(ctx, 2, -4, 3, attack ? 4 : 3, ICE);
    ctx.shadowBlur = 0;
    if (attack) { block(ctx, -16, 4, 4, 3, '#c9b6ff'); block(ctx, 12, 4, 4, 3, '#c9b6ff'); } // claws out
  }
  ctx.restore();
}

// Mimic in its own form: a soft lavender-grey shapeshifter cube whose horizontal slices keep sliding out of line, one
// large eye, and a faint flicker of the Queen's tiara above it, the look it is trying on. Disguised, it is drawn
// exactly as an illusion instead.
function drawMimic(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number) {
  const flash = e.flashTicks > 0, attack = e.attackTimer > 0 && e.attackTimer <= 12, h = attack ? 13 : 11;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.shadowBlur = 0;
  ctx.shadowColor = '#9a8cd0'; ctx.shadowBlur = 4;
  for (let k = 0; k < 4; k++) { // four slices drifting out of line
    const shift = Math.round(Math.sin(tick * .09 + k * 1.7 + e.id) * 3);
    block(ctx, -h + shift, -h + k * (h / 2), h * 2, h / 2, flash ? '#ffffff' : k % 2 ? '#8a7cc0' : '#a597d8');
  }
  ctx.shadowBlur = 0;
  if (!flash) {
    block(ctx, -6, -5, 12, 9, '#f2ecff'); block(ctx, -3, -3, 6, 6, '#3a2a6a'); block(ctx, -1, -2, 2, 2, ICE); // the eye
    const try_ = Math.max(0, Math.sin(tick * .05 + e.id)); // trying on her tiara
    ctx.globalAlpha = .25 + .35 * try_;
    block(ctx, -1, -h - 8, 3, 7, '#ddaaff'); block(ctx, -h + 3, -h - 5, 3, 4, '#ddaaff'); block(ctx, h - 6, -h - 5, 3, 4, '#ddaaff');
  }
  ctx.restore();
}
