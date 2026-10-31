import { SUN, TILE_SIZE, T_WALL, TELEPORT_PADS, ENEMY_CONFIGS, CHAMBER_BOUNDS, chamberOfTile } from './constants';
import type { Enemy, GameState } from './engine';
import type { CoolingStation } from './sun';

// ALPHA gold, BETA coral, DELTA orange, GAMMA dawn rose; shared by borders, pads and maps.
export const SUN_CHAMBER_COLORS = ['#ffd35c', '#ff727e', '#ff9a45', '#eeb1d6'];

const hash = (x: number, y: number, salt = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
const block = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

// Layered photosphere scenery: broad plasma currents, distant magnetic plumes and open dark space.
export function drawSunBackdrop(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, width: number, height: number, camX: number, camY: number, tick: number) {
  const heat = (state.sun?.heat ?? 50) / 100, cold = (state.sun?.quenchedTicks ?? 0) > 0;
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#0c0913'); sky.addColorStop(.6, '#190d19'); sky.addColorStop(1, '#2e1520');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  // A broad, low horizon glow supplies depth without outlining every patch of the void.
  const horizon = ctx.createLinearGradient(0, height * .4, 0, height);
  horizon.addColorStop(0, 'rgba(166,55,33,0)');
  horizon.addColorStop(1, `rgba(191,67,36,${cold ? .06 : .1 + heat * .09})`);
  ctx.fillStyle = horizon; ctx.fillRect(0, height * .4, width, height * .6);
  // Three broad plasma rivers provide readable landmarks, rather than a field of small outlines.
  // Their slow drift sits behind the faster foreground cinders and the station's solid silhouette.
  for (let river = 0; river < 3; river++) {
    const base = height * [.23, .65, .94][river] - camY * .035 % 75;
    const drift = camX * .06 + tick * (.06 + river * .015);
    const flowY = (px: number) => base + Math.sin((px + drift) / 230 + river * 2) * 38
      + Math.sin((px + drift) / 510 - river) * 24;
    const points = Array.from({ length: 19 }, (_, j) => {
      const px = -90 + j * (width + 180) / 18;
      return [px, flowY(px)] as const;
    });
    for (const [thickness, color, opacity] of [[46, '#793934', .24], [20, '#bd5a3c', .18], [3, '#f3b177', .2]] as const) {
      ctx.beginPath();
      for (let j = 0; j < points.length; j++) {
        const [px, py] = points[j];
        if (j === 0) ctx.moveTo(px, py - thickness / 2); else ctx.lineTo(px, py - thickness / 2);
      }
      for (let j = points.length - 1; j >= 0; j--) ctx.lineTo(points[j][0], points[j][1] + thickness / 2);
      ctx.closePath(); ctx.globalAlpha = opacity * (cold ? .55 : .7 + heat * .6);
      ctx.fillStyle = color; ctx.fill();
    }
    // A few separated glints move with each current, giving it direction without particle clutter.
    for (let j = 0; j < 3; j++) {
      const span = width + 200, px = ((j * 379 + river * 143 + tick * .17 - camX * .08) % span + span) % span - 100;
      const py = flowY(px);
      ctx.globalAlpha = cold ? .1 : .2 + heat * .12;
      block(ctx, px, py - 2, 18 + j * 8, 2, '#ffd5a1');
      ctx.globalAlpha *= .55; block(ctx, px - 10, py + 7, 9, 2, '#ee8a61');
    }
  }
  // Widely spaced magnetic plumes in the distance: stepped silhouettes with a thin lit edge.
  // Their scale and different parallax add depth, like Neptune's reefs and Moon's cavern spires.
  for (let i = 0; i < 5; i++) {
    const span = width + 400;
    const px = ((i * 331 + 60 - camX * .025) % span + span) % span - 160;
    const base = height * (.38 + hash(i, 8) * .45) - camY * .02 % 50;
    const h = 70 + hash(i, 9) * 140;
    ctx.globalAlpha = .3;
    block(ctx, px - 24, base - h * .35, 62, h * .35, '#432331');
    block(ctx, px - 12, base - h * .7, 35, h * .35, '#432331');
    block(ctx, px, base - h, 16, h * .3, '#432331');
    ctx.globalAlpha = cold ? .06 : .1 + heat * .09;
    block(ctx, px, base - h, 3, h * .3, '#e79b66');
    block(ctx, px - 12, base - h * .7, 3, h * .35, '#cd764f');
  }
  // Broad, widely separated solar-cloud silhouettes, like the other worlds' distant scenery.
  // They add a little material and parallax while leaving most of the void open.
  for (let i = 0; i < 3; i++) {
    const span = width + 650, par = .025 + i * .012;
    const cx = ((width * (.37 + i * .31) - camX * par + tick * .018 * (i % 2 ? -1 : 1)) % span + span) % span - 120;
    const cy = height * [.16, .67, .38][i] - camY * par % 80;
    const w = 240 + hash(i, 6) * 160;
    ctx.globalAlpha = cold ? .045 : .065 + heat * .055;
    block(ctx, cx, cy, w, 46, '#ad5b50');
    block(ctx, cx + 45, cy - 18, w - 100, 18, '#ad5b50');
    block(ctx, cx + 70, cy + 46, w - 130, 14, '#ad5b50');
    ctx.globalAlpha *= .5;
    block(ctx, cx + 22, cy + 20, w - 20, 2, '#ffd69f');
  }
  // One distant angular arc, subdued like the forest silhouettes and cavern spires.
  const x = width * .73 - camX * .025, base = height * 1.12 - camY * .02;
  const radius = Math.min(width * .32, 350), rise = height * (.29 + Math.sin(tick * .002) * .01);
  ctx.beginPath();
  for (let j = 0; j <= 12; j++) {
    const a = j / 12 * Math.PI, px = x - Math.cos(a) * radius, py = base - Math.sin(a) * rise;
    if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.lineJoin = 'bevel';
  ctx.globalAlpha = cold ? .04 : .06 + heat * .05;
  ctx.strokeStyle = '#e77d4f'; ctx.lineWidth = 9; ctx.stroke();
  ctx.globalAlpha *= .8; ctx.strokeStyle = '#ffd09a'; ctx.lineWidth = 2; ctx.stroke();
  // Small, separated embers in world space; no repeated cells, outlines or foreground shelf.
  for (let i = 0; i < 14; i++) {
    const span = width + 80, spanY = height + 80;
    const px = ((hash(i, 1) * span - camX * .08 + Math.sin(tick * .004 + i) * 9) % span + span) % span - 40;
    const py = ((hash(i, 2) * spanY - camY * .06 - tick * (.06 + i % 3 * .025)) % spanY + spanY) % spanY - 40;
    ctx.globalAlpha = .08 + heat * .09;
    block(ctx, px, py, 2, i % 4 === 0 ? 4 : 2, '#e9b17b');
    if (i % 5 === 0) {
      ctx.globalAlpha *= .6;
      block(ctx, px + 12, py - 7, 2, 2, '#f5a16e');
      block(ctx, px - 9, py + 13, 1, 2, '#f5a16e');
    }
  }
  ctx.restore();
}

// Readable dark heat shields over a molten substrate. Seams are scenery, never damage tiles.
export function drawSunFloorTile(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, tick: number) {
  const s = TILE_SIZE, n = hash(tx, ty), heat = (state.sun?.heat ?? 50) / 100;
  ctx.save();
  block(ctx, x, y, s, s, '#100d16');
  block(ctx, x + 2, y + 2, s - 4, s - 4, n > .65 ? '#201923' : n > .3 ? '#1a1620' : '#18141d');
  block(ctx, x + 3, y + 3, s - 6, 1, '#35252e');
  block(ctx, x + 3, y + 4, 1, s - 8, '#2d212d');
  // Joined molten faults run through selected plate seams, with a slow travelling light.
  const faultX = tx % 7 === 2 || hash(Math.floor(tx / 2), ty, 11) > .84;
  const faultY = ty % 9 === 5 || hash(tx, Math.floor(ty / 2), 12) > .88;
  const glow = .18 + heat * .38 + Math.sin(tick * .025 - (tx + ty) * .65) * .08;
  ctx.globalAlpha = glow;
  if (faultX) { block(ctx, x, y, 2, s, '#ff964f'); block(ctx, x + 2, y + 7, 5, 2, '#f47440'); }
  if (faultY) { block(ctx, x, y, s, 2, '#e78448'); block(ctx, x + 28, y + 2, 2, 6, '#ffba6a'); }
  ctx.globalAlpha = 1;
  if (n > .72) {
    // Riveted reinforced plates; quiet enough to leave combat silhouettes clear.
    block(ctx, x + 7, y + 8, 2, 2, '#635047'); block(ctx, x + s - 9, y + s - 10, 2, 2, '#42343a');
    block(ctx, x + 14, y + s - 8, 17, 1, '#33242c');
  } else if (n < .12) {
    ctx.globalAlpha = .22;
    ctx.strokeStyle = '#b48b5b'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 17, y + 17, 14, 14);
    block(ctx, x + 23, y + 20, 2, 8, '#c99b62'); ctx.globalAlpha = 1;
  }
  // Ceremonial sun-wheel inlaid around each teleport pad, clipped naturally by floor tiles.
  const room = chamberOfTile(tx, ty), pad = room >= 0 ? TELEPORT_PADS[room] : undefined;
  if (pad) {
    const dx = tx - pad[0], dy = ty - pad[1], ring = Math.max(Math.abs(dx), Math.abs(dy));
    if (ring === 2 && (Math.abs(dx) === 2 || Math.abs(dy) === 2)) {
      ctx.globalAlpha = .25;
      const color = SUN_CHAMBER_COLORS[room];
      if (Math.abs(dx) === 2) block(ctx, x + (dx < 0 ? 37 : 9), y, 2, s, color);
      if (Math.abs(dy) === 2) block(ctx, x, y + (dy < 0 ? 37 : 9), s, 2, color);
    }
    if ((dx === 0 || dy === 0) && ring === 3) {
      ctx.globalAlpha = .32;
      block(ctx, x + 19, y + 19, 10, 10, SUN_CHAMBER_COLORS[room]);
      block(ctx, x + 22, y + 22, 4, 4, '#17131e');
    }
  }
  ctx.restore();
}

export function drawSunCover(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, tick: number) {
  const s = TILE_SIZE, n = hash(tx, ty), heat = (state.sun?.heat ?? 50) / 100;
  const wall = (dx: number, dy: number) => state.map[ty + dy]?.[tx + dx] === T_WALL;
  ctx.save();
  block(ctx, x, y, s, s, '#15121c');
  block(ctx, x + 3, y + 3, s - 6, s - 6, n > .5 ? '#39303b' : '#302934');
  block(ctx, x + 6, y + 7, s - 12, s - 15, '#241f2c');
  block(ctx, x + 7, y + 8, s - 14, 2, '#615047');
  // Gold caps join into fortifications; no glow on the whole body.
  if (!wall(0, -1)) {
    block(ctx, x + 1, y, s - 2, 5, '#9e7145'); block(ctx, x + 4, y, s - 8, 2, '#edc080');
    block(ctx, x + 7, y + 5, s - 14, 3, '#513c36');
  }
  if (!wall(-1, 0)) { block(ctx, x, y + 3, 4, s - 3, '#967345'); block(ctx, x, y + 4, 1, s - 8, '#e1b57b'); }
  if (!wall(1, 0)) block(ctx, x + s - 4, y + 4, 4, s - 4, '#4d3636');
  if (!wall(0, 1)) {
    block(ctx, x + 2, y + s - 7, s - 4, 7, '#110e18');
    block(ctx, x + 7, y + s - 5, s - 14, 2, '#a46038');
  }
  // An inset solar seal or exposed molten core gives each block a physical material.
  if (n > .52) {
    ctx.fillStyle = '#906a48'; ctx.fillRect(x + 17, y + 17, 14, 14);
    block(ctx, x + 20, y + 20, 8, 8, '#251b28'); block(ctx, x + 23, y + 14, 2, 20, '#bd925f');
    block(ctx, x + 14, y + 23, 20, 2, '#bd925f');
  } else {
    block(ctx, x + 19, y + 12, 10, 24, '#120e18');
    const flicker = .45 + heat * .3 + Math.sin(tick * .04 + tx * 2 + ty) * .1;
    ctx.globalAlpha = flicker;
    block(ctx, x + 22, y + 14, 4, 20, '#fa8646'); block(ctx, x + 23, y + 17, 2, 11, '#ffe5ad');
    ctx.globalAlpha = 1;
    block(ctx, x + 15, y + 18, 18, 3, '#4e3b3b'); block(ctx, x + 15, y + 29, 18, 3, '#4e3b3b');
  }
  ctx.restore();
}

export function drawSunPad(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, room: number) {
  const s = TILE_SIZE, color = SUN_CHAMBER_COLORS[Math.max(0, room)];
  ctx.save();
  block(ctx, x + 2, y + 2, s - 4, s - 4, '#403040');
  block(ctx, x + 6, y + 6, s - 12, s - 12, '#110f1b');
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 4;
  ctx.strokeRect(x + 7, y + 7, s - 14, s - 14); ctx.shadowBlur = 0;
  block(ctx, x + 18, y + 18, 12, 12, color); block(ctx, x + 21, y + 21, 6, 6, '#ffefd0');
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.translate(x + s / 2, y + s / 2); ctx.rotate(i * Math.PI / 2);
    ctx.globalAlpha = .45 + .4 * Math.sin(tick * .04 - i * 1.57);
    block(ctx, -2, -19, 4, 6, color); ctx.restore();
  }
  ctx.restore();
}

export function drawSunUnit(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, tick: number): boolean {
  if (e.type === 'scorch_sapper') { drawScorchSapper(ctx, e, x, y, tick); return true; }
  if (e.type !== 'cinder_wisp' && e.type !== 'emberling') return false;
  const cold = !!e.extinguished, wisp = e.type === 'cinder_wisp';
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  const pulse = Math.round(Math.sin(tick * .12 + e.id) * 2);
  ctx.shadowColor = cold ? '#93bac4' : '#ff9c42'; ctx.shadowBlur = cold ? 0 : 5;
  ctx.fillStyle = e.flashTicks > 0 ? '#ffffff' : cold ? '#7e8e96' : wisp ? '#ffb34f' : '#ff6843';
  if (wisp) {
    ctx.fillRect(-11, -9, 22, 21); ctx.fillRect(-7, -16 - (cold ? 0 : pulse), 14, 9);
    ctx.shadowBlur = 0; ctx.fillStyle = cold ? '#283b49' : '#792a21'; ctx.fillRect(-7, -5, 14, 13);
    ctx.fillStyle = cold ? '#c2e9ef' : '#fff4be';
    ctx.fillRect(-3, -9, 6, 12); ctx.fillRect(-6, -3, 12, 5);
    if (!cold) {
      ctx.fillStyle = '#ffce79';
      for (let i = 0; i < 3; i++) { const age = (tick * .8 + e.id * 11 + i * 14) % 42; ctx.globalAlpha = 1 - age / 42; ctx.fillRect((i - 1) * 8, -14 - age, 3, 6); }
    } else { ctx.fillStyle = '#a9d6e0'; ctx.fillRect(-12, 13, 24, 2); }
  } else {
    // Emberling: larger, armored heavy silhouette
    ctx.fillRect(-15, -12, 30, 27); ctx.fillRect(-10, -21 - (cold ? 0 : pulse), 20, 11);
    ctx.shadowBlur = 0; ctx.fillStyle = cold ? '#283b49' : '#792a21'; ctx.fillRect(-10, -7, 20, 18);
    ctx.fillStyle = cold ? '#c2e9ef' : '#fff4be';
    ctx.fillRect(-9, -4, 6, 4); ctx.fillRect(3, -4, 6, 4);
    if (!cold) {
      ctx.fillStyle = '#ffce79';
      for (let i = 0; i < 3; i++) { const age = (tick * 1.3 + e.id * 11 + i * 14) % 42; ctx.globalAlpha = 1 - age / 42; ctx.fillRect((i - 1) * 11, -19 - age, 4, 7); }
      ctx.globalAlpha = .75; ctx.strokeStyle = '#ffc66d'; ctx.lineWidth = 2.5; ctx.strokeRect(-20, -18, 40, 38);
    } else { ctx.fillStyle = '#a9d6e0'; ctx.fillRect(-16, 16, 32, 3); }
  }
  ctx.restore(); return true;
}

// The same King's square armor, shoulders, crown and four eyes, cooled to an inert brown husk.
// No aura, flames, orbiting accents, particles or animated glow in this state.
export function drawQuenchedKing(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number) {
  const size = Math.floor(TILE_SIZE * ENEMY_CONFIGS.fiery_king.bodyFraction), h = size / 2;
  const pad = Math.max(3, Math.floor(size * .1)), spike = Math.floor(size * .18);
  const flash = e.flashTicks > 0;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.shadowBlur = 0;
  block(ctx, -h - spike, -h * .2, spike, size * .3, '#8c7865');
  block(ctx, h, -h * .2, spike, size * .3, '#8c7865');
  block(ctx, -h, -h, size, size, flash ? '#e8ddcc' : '#b49b80');
  block(ctx, -h + pad, -h + pad, size - pad * 2, size - pad * 2, '#72604e');
  block(ctx, -h + pad, -2, size - pad * 2, 4, '#95816b');
  block(ctx, -2, -h + pad, 4, size - pad * 2, '#95816b');
  const crown = Math.floor(size * .22), segment = Math.floor(size / 5);
  for (let i = 0; i < 5; i++) {
    const tall = i % 2 ? Math.floor(crown * .55) : crown;
    block(ctx, -h + i * segment, -h - tall, segment - 1, tall, '#cdbb9d');
  }
  block(ctx, -2, -h - crown - 3, 4, 4, '#a5947c');
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) block(ctx, dx * (h - pad - 4) - 2, dy * (h - pad - 4) - 2, 4, 4, '#d2c0a4');
  const eye = Math.max(3, Math.floor(size * .16)), pupil = Math.max(2, Math.floor(eye * .6));
  const left = -h + pad + 2, right = h - pad - eye - 2, top = -h + pad + 2;
  for (const ex of [left, right]) for (const ey of [top, top + eye + 3]) {
    block(ctx, ex, ey, eye, eye, '#ddd4c1'); block(ctx, ex + 1, ey + 2, pupil, Math.max(2, pupil - 2), '#695c4e');
  }
  const mouthW = Math.floor(size * .7), mouthY = top + eye * 2 + 6;
  block(ctx, -mouthW / 2, mouthY, mouthW, Math.floor(size * .1), '#51483f');
  for (let i = 0; i < 5; i++) block(ctx, -mouthW / 2 + i * mouthW / 6 + 1, mouthY - 3, 4, 5, '#c8bba5');
  ctx.restore();
}

export function drawCoolingStation(ctx: CanvasRenderingContext2D, station: CoolingStation, x: number, y: number, tick: number, nearby = false) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  const color = station.blocked ? '#ff7956' : '#81eaf5', fill = Math.max(0, Math.min(1, station.charge / 100));
  // A glass coolant reservoir on four brass clamps, distinct from health pickups.
  block(ctx, -24, -24, 48, 48, '#101823');
  block(ctx, -18, -21, 36, 42, '#306371');
  block(ctx, -14, -17, 28, 34, '#102f44');
  ctx.shadowColor = color; ctx.shadowBlur = nearby ? 6 : 3;
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(-17, -20, 34, 40); ctx.shadowBlur = 0;
  const water = Math.round(9 + fill * 20);
  block(ctx, -13, 16 - water, 26, water, station.blocked ? '#a64b43' : '#267ca0');
  block(ctx, -13, 16 - water, 26, 2, color);
  block(ctx, -10, -14, 3, 24, '#a5efff');
  ctx.globalAlpha = .45; block(ctx, -6, -14, 2, 13, '#a5efff'); ctx.globalAlpha = 1;
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) {
    block(ctx, dx < 0 ? -25 : 17, dy < 0 ? -24 : 16, 8, 8, '#a48560');
    block(ctx, dx < 0 ? -23 : 19, dy < 0 ? -23 : 17, 4, 2, '#f4d1a0');
  }
  for (let i = 0; i < 3; i++) {
    const rise = (tick * .35 + i * 11 + station.id * 7) % water;
    ctx.globalAlpha = .65; block(ctx, -6 + i * 5, 14 - rise, 2, 2, color);
  }
  ctx.globalAlpha = 1;
  block(ctx, -22, 28, 44, 5, '#101c2a'); block(ctx, -22, 28, 44 * fill, 5, color);
  for (let i = 1; i < 4; i++) block(ctx, -22 + 11 * i, 28, 1, 5, '#172c3a');
  if (station.blocked) {
    ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color;
    ctx.fillText('KING NEARBY', 0, -33);
  }
  ctx.restore();
}

// One tile of the King's phase 2+ burning trail (also used by the rule sheet).
export function drawBurningTile(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, fade: number, bx = 0, by = 0) {
  const s = TILE_SIZE, b = { x: bx, y: by };
  ctx.save();
  ctx.globalAlpha = .55 * fade; block(ctx, x + 2, y + 2, s - 4, s - 4, '#5a1a10');
  ctx.globalAlpha = (.35 + .15 * Math.sin(tick * .2 + b.x + b.y)) * fade; block(ctx, x + 6, y + 6, s - 12, s - 12, '#ff6a2a');
  for (let k = 0; k < 3; k++) { // stepped tapering flames: wide base, narrower body, pale tip, each flickering
    const h = 9 + Math.round((Math.sin(tick * .25 + k * 2.1 + b.x * 1.3) + 1) * 4), cx = x + 12 + k * 12, base = y + s - 9;
    const sway = Math.round(Math.sin(tick * .18 + k + b.y) * 1.5), step = Math.max(3, Math.round(h / 3));
    ctx.globalAlpha = .9 * fade;
    block(ctx, cx - 4, base - step, 8, step, '#ff6a2a');
    block(ctx, cx - 3 + sway, base - step * 2, 6, step, '#ff8a3a');
    block(ctx, cx - 1 + sway, base - h, 3, h - step * 2, '#ffd36a');
  }
  ctx.globalAlpha = .6 * fade; ctx.strokeStyle = '#ff9b4a'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, s - 6, s - 6);
  ctx.restore();
}

// Scorch Sapper: not a flame but a dark armoured siphon beetle that steals coolant. A basalt shell with thin molten
// seams and a lighter top plate, two small ember eyes, a brass siphon nozzle on the side it faces, six stepping legs,
// and a glass tank on its back holding stolen cyan coolant that sloshes, and fills and glows while it drains a
// station (with little puffs of steam).
function drawScorchSapper(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, tick: number) {
  const flash = e.flashTicks > 0, draining = e.sapStation !== undefined;
  const face = draining ? (e.chargeDirX || 1) : e.targetTileX !== e.tileX ? Math.sign(e.targetTileX - e.tileX) : (e.id % 2 ? 1 : -1), step = Math.floor(tick / 6 + e.id) % 2;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  for (let k = -1; k <= 1; k++) { // legs
    const lift = (k + 1 + step) % 2 ? 2 : 0;
    block(ctx, -15, k * 6 + 2 - lift, 4, 2, '#3a2a26'); block(ctx, 11, k * 6 + 2 - (2 - lift), 4, 2, '#3a2a26');
  }
  block(ctx, -13, -7, 26, 20, flash ? '#ffffff' : '#a8723e');                           // bronze outline so it reads on the dark floor
  block(ctx, -11, -5, 22, 16, flash ? '#ffffff' : '#3e2c28');                           // shell
  if (!flash) {
    block(ctx, -11, -5, 22, 4, '#5c4238');                                               // lighter top plate
    block(ctx, -6, 4, 12, 2, '#ff7a2a'); block(ctx, 2, 0, 2, 8, '#ff7a2a');              // molten seams
    block(ctx, face > 0 ? 6 : -10, 0, 4, 3, '#ffb347');                                   // ember eye
    block(ctx, face > 0 ? 12 : -18, 2, 6, 4, '#b9893f');                                  // brass siphon nozzle
    block(ctx, face > 0 ? 17 : -19, 1, 2, 6, '#e0b860');
    // Glass tank of stolen coolant on its back.
    const level = draining ? 6 + Math.round(Math.sin(tick * .2) * 1) : 3 + Math.round(Math.sin(tick * .12 + e.id));
    block(ctx, -7, -17, 14, 12, '#16232a'); ctx.strokeStyle = '#9fdcea'; ctx.lineWidth = 2; ctx.strokeRect(-7, -17, 14, 12);
    ctx.shadowColor = '#6bd9ea'; ctx.shadowBlur = draining ? 8 : 0;
    block(ctx, -5, -6 - level, 10, level, '#58d4ea'); ctx.shadowBlur = 0;
    block(ctx, -5, -6 - level, 10, 1, '#d8fbff');
    if (draining) for (let k = 0; k < 2; k++) { // steam puffs
      const age = (tick * .6 + k * 20 + e.id * 7) % 40;
      ctx.globalAlpha = .5 * (1 - age / 40); block(ctx, -2 + k * 5, -22 - age * .5, 4, 4, '#c9d2d6');
    }
  }
  ctx.restore();
}

// Shared solar hazard identity, used by the battlefield, minimap and rule sheet.
export function drawSunburstEmblem(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(size / 32, size / 32);
  block(ctx, -7, -7, 14, 14, '#ffe778'); block(ctx, -4, -4, 8, 8, '#fff9d5');
  for (let i = 0; i < 8; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 4); block(ctx, -2, -16, 4, 6, '#ffe778'); ctx.restore();
  }
  ctx.restore();
}

export function drawSunburstWarning(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ticks: number, tick: number, compact = false) {
  const remaining = Math.max(0, Math.min(1, ticks / SUN.flareWarning));
  const pulse = .5 + .5 * Math.sin(tick * (remaining < .35 ? .18 : .07));
  ctx.save();
  ctx.globalAlpha = .045 + pulse * .035; block(ctx, x, y, w, h, '#ffe778');
  ctx.globalAlpha = 1; ctx.strokeStyle = '#ffe778'; ctx.lineWidth = compact ? 2 : 4;
  const inset = compact ? 3 : 10, arm = Math.min(w, h) * .16;
  for (const sx of [0, 1]) for (const sy of [0, 1]) {
    const cx = x + (sx ? w - inset : inset), cy = y + (sy ? h - inset : inset);
    ctx.beginPath(); ctx.moveTo(cx + (sx ? -arm : arm), cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + (sy ? -arm : arm)); ctx.stroke();
  }
  // A row of solar cells drains towards detonation; no meteor-style flashing fill.
  const cells = 16, gap = compact ? 2 : 6, span = w * .6, cell = (span - gap * (cells - 1)) / cells;
  for (let i = 0; i < cells; i++) block(ctx, x + (w - span) / 2 + i * (cell + gap), y + inset, cell, compact ? 3 : 6, i < Math.ceil(remaining * cells) ? '#ffe778' : '#50442d');
  const pw = compact ? 144 : 252, ph = compact ? 62 : 76;
  const px = Math.round(x + (w - pw) / 2), py = Math.round(y + h * .3 - ph / 2);
  block(ctx, px, py, pw, ph, '#191521');
  ctx.strokeStyle = '#c7a953'; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph);
  block(ctx, px, py, 4, ph, '#ffe778');
  drawSunburstEmblem(ctx, px + (compact ? 22 : 42), py + ph / 2, compact ? 25 : 36);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = (compact ? '9px' : '14px') + ' "Press Start 2P", monospace'; ctx.fillStyle = '#ffe778';
  ctx.fillText('SUNBURST', px + (compact ? 43 : 82), py + ph * .32);
  ctx.font = (compact ? '12px' : '18px') + ' "Press Start 2P", monospace'; ctx.fillStyle = '#fff9d5';
  ctx.fillText(Math.ceil(ticks / 60) + 's', px + (compact ? 43 : 82), py + ph * .68);
  ctx.restore();
}

export function drawSunGround(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tick: number) {
  const sun = state.sun; if (!sun) return;
  ctx.save();
  // Scorch Sappers draining a station: a crackling orange spark line from the imp to the reservoir.
  for (const e of state.enemies) {
    if (e.type !== 'scorch_sapper' || e.sapStation === undefined) continue;
    const station = sun.stations.find(s => s.id === e.sapStation); if (!station) continue;
    const ax = e.x - camX, ay = e.y - camY, bx = (station.x + .5) * TILE_SIZE - camX, by = (station.y + .5) * TILE_SIZE - camY;
    ctx.globalAlpha = .75 + .25 * Math.sin(tick * .5); ctx.shadowColor = '#6bd9ea'; ctx.shadowBlur = 8; ctx.strokeStyle = '#9fe8f5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); // coolant being siphoned off
    for (let k = 1; k < 4; k++) ctx.lineTo(ax + (bx - ax) * k / 4 + (k % 2 ? 4 : -4) * Math.sin(tick * .4 + k), ay + (by - ay) * k / 4);
    ctx.lineTo(bx, by); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.globalAlpha = 1; block(ctx, bx - 3, by - 3, 6, 6, '#ffe08a');
  }
  ctx.globalAlpha = 1;
  // Phase 2+ burning trail: a glowing ember plate with three flickering stepped flames, fading over its last second.
  // Phase 3 sunburst: the marked room pulses gold with a countdown; when it goes off it flashes orange (cyan if defused).
  const roomRect = (room: number) => { const [r1, c1, r2, c2] = CHAMBER_BOUNDS[room]; return [c1 * TILE_SIZE - camX, r1 * TILE_SIZE - camY, (c2 - c1 + 1) * TILE_SIZE, (r2 - r1 + 1) * TILE_SIZE] as const; };
  if (sun.flare) {
    const [x, y, w, h] = roomRect(sun.flare.room);
    drawSunburstWarning(ctx, x, y, w, h, sun.flare.ticks, tick);
  }
  if (sun.flareFlash) {
    const [x, y, w, h] = roomRect(sun.flareFlash.room), k = sun.flareFlash.ticks / 45;
    ctx.globalAlpha = .5 * k; block(ctx, x, y, w, h, sun.flareFlash.defused ? '#a5efff' : '#ff8a3a');
  }
  ctx.globalAlpha = 1;
  for (const b of sun.burning) drawBurningTile(ctx, b.x * TILE_SIZE - camX, b.y * TILE_SIZE - camY, tick, Math.min(1, b.ticks / 60), b.x, b.y);
  ctx.globalAlpha = 1;
  for (const station of sun.stations) {
    const x = (station.x + .5) * TILE_SIZE - camX, y = (station.y + .5) * TILE_SIZE - camY;
    // Small cyan guide lights mark the reservoir; no false water/hazard field.
    ctx.globalAlpha = .28 + station.charge / 300;
    for (let side = -1; side <= 1; side += 2) {
      block(ctx, x + side * 30 - 2, y - 5, 4, 10, '#6bd9ea');
      block(ctx, x - 5, y + side * 30 - 2, 10, 4, '#6bd9ea');
    }
    ctx.globalAlpha = 1;
    drawCoolingStation(ctx, station, x, y, tick,
      Math.hypot(station.x - state.playerX / TILE_SIZE + .5, station.y - state.playerY / TILE_SIZE + .5) <= SUN.stationReach);
  }
  ctx.restore();
}

export function drawCoolingRipple(ctx: CanvasRenderingContext2D, x: number, y: number, ticks: number, empowered: boolean, radius = SUN.waveRadius * TILE_SIZE) {
  const age = 1 - ticks / 36;
  if (empowered) {
    // A pressure burst for the five-cast extinguish window. All motion follows the stored
    // ripple lifetime; repeated casts may overlap without adding new state or damage.
    const reach = SUN.waveRadius * TILE_SIZE, scale = radius / reach;
    const fade = Math.pow(Math.max(0, 1 - age), .65), release = Math.min(1, age * 3);
    const burst = Math.max(0, 1 - age * 4);
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    const front = (r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };
    ctx.shadowColor = '#79e8ff'; ctx.shadowBlur = 3;
    // A pale moving water front with a solid blue pressure band behind its white rim.
    for (let i = 0; i < 3; i++) {
      const travel = Math.max(0, release - i * .18), r = reach * travel;
      if (r <= 0) continue;
      front(r);
      ctx.globalAlpha = fade * (i === 0 ? .8 : .4);
      ctx.strokeStyle = i === 0 ? '#3ebfdf' : '#70e2f5'; ctx.lineWidth = i === 0 ? 24 : 7; ctx.stroke();
      ctx.globalAlpha = fade * (i === 0 ? 1 : .65);
      ctx.strokeStyle = i === 0 ? '#efffff' : '#baf5ff'; ctx.lineWidth = i === 0 ? 8 : 3; ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Directional spray travels with the shock front. Each fragment rotates as a solid shape.
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, travel = Math.min(1, age * (i % 2 ? 1.55 : 2.1));
      const r = 26 + (reach - 26) * travel, length = 12 + (1 - travel) * 28;
      ctx.save(); ctx.rotate(a); ctx.globalAlpha = fade * (i % 2 ? .55 : .9);
      block(ctx, r - length, -3, length, 6, i % 2 ? '#70daef' : '#d9fdff');
      if (i % 2 === 0) { ctx.globalAlpha *= .55; block(ctx, r - length - 14, 7, 9, 4, '#64cce7'); }
      ctx.restore();
    }
    // A brief geyser and compact impact flare give the cast weight at its origin.
    const column = 100 * Math.sin(Math.min(1, age * 2.5) * Math.PI);
    ctx.globalAlpha = fade * .7;
    block(ctx, -20, -column, 40, column + 20, '#57cde7');
    block(ctx, -9, -column - 8, 18, column + 28, '#efffff');
    // Chunky water jets break away from the central geyser and fall back into the wave.
    for (let jet = 0; jet < 8; jet++) {
      const a = jet * Math.PI / 4, d = 24 + age * 190;
      const lift = Math.sin(Math.min(1, age * 1.5) * Math.PI) * (30 + jet % 3 * 18);
      ctx.globalAlpha = fade * .85;
      block(ctx, Math.cos(a) * d - 5, Math.sin(a) * d - lift - 5, 10, 16, jet % 2 ? '#8eeafa' : '#e6ffff');
    }
    ctx.globalAlpha = burst * .8;
    block(ctx, -36, -6, 72, 12, '#ecffff'); block(ctx, -6, -28, 12, 56, '#ecffff');
    ctx.globalAlpha = burst * .4; ctx.strokeStyle = '#bcf6ff'; ctx.lineWidth = 4;
    const half = 18 + age * 100; ctx.strokeRect(-half, -half, half * 2, half * 2);
    ctx.restore(); return;
  }
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = (1 - age) * .8;
  ctx.strokeStyle = empowered ? '#eaffff' : '#8ee8f5'; ctx.shadowColor = '#65d9ff'; ctx.shadowBlur = empowered ? 6 : 3;
  for (let i = 0; i < 3; i++) {
    const r = radius * Math.max(0, Math.min(1, age * 1.5 - i * .17)); if (r <= 0) continue;
    ctx.lineWidth = i === 0 ? 5 : 2;
    ctx.beginPath(); ctx.moveTo(-r * .5, -r); ctx.lineTo(r * .5, -r); ctx.lineTo(r, -r * .5); ctx.lineTo(r, r * .5);
    ctx.lineTo(r * .5, r); ctx.lineTo(-r * .5, r); ctx.lineTo(-r, r * .5); ctx.lineTo(-r, -r * .5); ctx.closePath(); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r = radius * age; ctx.fillStyle = i % 2 ? '#b9f7ff' : '#65cfe8'; ctx.fillRect(Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r), 4, 8); }
  ctx.restore();
}

export function drawSunEffects(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number) {
  const sun = state.sun; if (!sun) return;
  for (const r of sun.ripples) drawCoolingRipple(ctx, r.x - camX, r.y - camY, r.ticks, r.empowered);
  const boss = state.enemies.find(e => e.id === sun.bossId);
  if (boss && sun.quenchedTicks > 0) {
    ctx.save(); const x = boss.x - camX, y = boss.y - camY;
    ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#eadac2'; ctx.textAlign = 'center'; ctx.fillText(`C ×${sun.empoweredCasts}`, x, y - 68); ctx.restore();
  }
}

export function drawSunAtmosphere(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number, tick: number) {
  const sun = state.sun; if (!sun) return;
  const heat = sun.heat / 100, cold = sun.quenchedTicks > 0;
  ctx.save();
  const quenchAge = SUN.quenchTicks - sun.quenchedTicks;
  if (cold && quenchAge < 75) {
    const t = quenchAge / 75, fade = 1 - t;
    const flash = Math.pow(Math.max(0, 1 - quenchAge / 12), 2);
    ctx.globalAlpha = flash * .42 + fade * .1; ctx.fillStyle = '#c5f9ff'; ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 3; i++) {
      const front = Math.max(0, Math.min(1.8, t * 3 - i * .18));
      if (front === 0) continue;
      ctx.globalAlpha = fade * (i ? .3 : .65); ctx.strokeStyle = i ? '#78d8ec' : '#e2fcff'; ctx.lineWidth = i ? 3 : 6;
      ctx.strokeRect(width * .5 * (1 - front), height * .5 * (1 - front), width * front, height * front);
    }
    // Inward frost streaks around the viewport convey a map-wide pressure collapse.
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, dx = Math.cos(a), dy = Math.sin(a);
      const r = Math.max(width, height) * (.65 - t * .25);
      ctx.save();ctx.translate(width / 2 + dx * r, height / 2 + dy * r);ctx.rotate(a);
      ctx.globalAlpha = fade * .45;block(ctx,-35, -2,70,4,'#bcf5ff');ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  const impact = sun.ripples.reduce((strongest, ripple) => ripple.empowered
    ? Math.max(strongest, Math.max(0, (ripple.ticks - 28) / 8)) : strongest, 0);
  if (impact > 0) {
    // A short icy impact flash accompanies the real empowered cast, including distant hits.
    ctx.globalAlpha = impact * .16; ctx.fillStyle = '#b7f5ff'; ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = impact * .55; ctx.strokeStyle = '#d9fbff'; ctx.lineWidth = 3;
    const inset = 3 + (1 - impact) * 12;
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  }
  ctx.globalAlpha = 1;
  // Edge light conveys heat without flattening the dark plates and actor contrast.
  const vignette = ctx.createRadialGradient(width * .5, height * .5, height * .12, width * .5, height * .5, Math.max(width, height) * .65);
  vignette.addColorStop(0, 'rgba(255,100,35,0)');
  vignette.addColorStop(.65, cold ? 'rgba(74,164,208,.025)' : `rgba(200,62,28,${.025 + heat * .035})`);
  vignette.addColorStop(1, cold ? 'rgba(90,208,240,.11)' : `rgba(255,116,38,${.05 + heat * .14})`);
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 16; i++) {
    const life = (tick * (.35 + i % 3 * .16) + i * 97) % (height + 60);
    const x = (i * 193 + Math.round(Math.sin(tick * .008 + i) * 18)) % width, y = height + 30 - life;
    ctx.globalAlpha = (.1 + heat * .35) * Math.sin(life / (height + 60) * Math.PI);
    block(ctx, x, y, i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 7 : 3, cold ? '#9ee6f0' : i % 4 ? '#ff9861' : '#ffe4af');
  }
  if (heat > .8 && !cold) {
    ctx.globalAlpha = (heat - .8) * (.16 + .08 * Math.sin(tick * .08));
    ctx.strokeStyle = '#ff7045'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, width - 4, height - 4);
  }
  if (sun.eruptionTicks > 0) {
    const t = 1 - sun.eruptionTicks / 90;
    ctx.globalAlpha = Math.max(0, 1 - t * 2) * .75;
    ctx.fillStyle = sun.eruptionTicks > 80 ? '#fff6ce' : '#ff6c30'; ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 3; i++) {
      const r = Math.min(1.6, t * 3 + i * .22);
      ctx.globalAlpha = Math.max(0, (1 - t) * .4 - i * .06); ctx.strokeStyle = i ? '#ff985c' : '#fff0c8'; ctx.lineWidth = 4 - i;
      ctx.strokeRect(width * .5 * (1 - r), height * .5 * (1 - r), width * r, height * r);
    }
  }
  ctx.restore();
}
