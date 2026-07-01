'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import BackButton from '@/components/BackButton';
import RulesModal from '@/components/RulesModal';
import BGMController, { BGMControllerHandle } from '@/components/BGMController';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  T_WALL, T_TELEPORT,
  CHAMBER_BOUNDS, CHAMBER_LABELS, CHAMBER_COLORS,
  TELEPORT_PADS, chamberOfTile,
  ENEMY_CONFIGS,
  PLAYER_MAX_HP, RUBY_MAX_HP,
  LASER_COOLDOWN, WAVE_COOLDOWN, SPEED_COOLDOWN,
  STAR_ENERGY_MAX,
  SPEED_DURATION, SPEED_DURATION_PWR,
  METEORITE_WARNING, BOMB_RADIUS, BOMB_RADIUS_PWR, BULLET_COOLDOWN,
} from './constants';
import {
  GameState, createInitialState, tick,
  useLaser, useBullet, activateWave, useSpeedBoost, useBomb,
  toggleCarryRuby, tryActivateTeleport, doTeleport, cancelTeleport,
  healRuby, canHealRuby,
} from './engine';

// ─── Canvas colors ────────────────────────────────────────────────────────────
const BG_COLOR     = '#000010';
const PLAYER_COLOR = '#e8e850';
const RUBY_COLOR   = '#ff1155';
const BOMB_COLOR   = '#ff6600';

// ─── Drawing ──────────────────────────────────────────────────────────────────

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
  tickN: number,
) {
  const S = 2; // px per tile
  const MW = MAP_COLS * S;
  const MH = MAP_ROWS * S;
  const PAD = 8;
  const MX = canvasW - MW - PAD;
  const MY = PAD;

  // Border + bg
  ctx.fillStyle = 'rgba(0,0,8,0.85)';
  ctx.fillRect(MX - 2, MY - 2, MW + 4, MH + 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(MX - 1.5, MY - 1.5, MW + 3, MH + 3);

  // Tiles
  for (let ty = 0; ty < MAP_ROWS; ty++) {
    for (let tx = 0; tx < MAP_COLS; tx++) {
      const tile = state.map[ty][tx];
      const px = MX + tx * S;
      const py = MY + ty * S;
      if (tile === T_WALL) {
        ctx.fillStyle = '#060615';
      } else if (tile === T_TELEPORT) {
        const ch = chamberOfTile(tx, ty);
        ctx.fillStyle = ch >= 0 ? CHAMBER_COLORS[ch] + '99' : '#ffffff44';
      } else {
        const ch = chamberOfTile(tx, ty);
        ctx.fillStyle = ch >= 0 ? CHAMBER_COLORS[ch] + '18' : '#0a0a1a';
      }
      ctx.fillRect(px, py, S, S);
    }
  }

  // Meteorite warning flash
  if (state.meteoriteWarning >= 0) {
    const pulse = Math.floor(tickN / 6) % 2 === 0;
    if (pulse) {
      const [r1, c1, r2, c2] = CHAMBER_BOUNDS[state.meteoriteWarning];
      ctx.fillStyle = 'rgba(255,80,0,0.45)';
      ctx.fillRect(MX + c1 * S, MY + r1 * S, (c2 - c1 + 1) * S, (r2 - r1 + 1) * S);
    }
  }

  // Resources
  for (const r of state.resources) {
    ctx.fillStyle = r.type === 'health' ? '#ff4455' : '#44aaff';
    ctx.fillRect(MX + r.tileX * S - 1, MY + r.tileY * S - 1, 3, 3);
  }

  // Bomb
  if (state.bomb) {
    const pulse = Math.floor(tickN / 8) % 2 === 0;
    ctx.fillStyle = pulse ? '#ff6600' : '#ffaa00';
    ctx.fillRect(MX + state.bomb.tileX * S - 1, MY + state.bomb.tileY * S - 1, 3, 3);
  }

  // Enemies
  for (const e of state.enemies) {
    ctx.fillStyle = ENEMY_CONFIGS[e.type].color;
    ctx.fillRect(MX + e.tileX * S, MY + e.tileY * S, S, S);
  }

  // Ruby (placed)
  if (state.rubyTileX !== -1) {
    ctx.fillStyle = '#ff1155';
    ctx.fillRect(MX + state.rubyTileX * S - 1, MY + state.rubyTileY * S - 1, 4, 4);
  }

  // Player (blink when invincible)
  const pBlink = state.playerInvincibleTicks > 0 && Math.floor(tickN / 4) % 2 === 0;
  if (!pBlink) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(MX + state.playerTileX * S - 1, MY + state.playerTileY * S - 1, 4, 4);
    if (state.playerCarryingRuby) {
      ctx.fillStyle = '#ff2266';
      ctx.fillRect(MX + state.playerTileX * S, MY + state.playerTileY * S, 2, 2);
    }
  }

  // Chamber labels on minimap
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelPts = [[10,10],[39,10],[10,39],[39,39]];
  for (let i = 0; i < 4; i++) {
    const [lx, ly] = labelPts[i];
    ctx.fillStyle = CHAMBER_COLORS[i] + 'cc';
    ctx.fillText(CHAMBER_LABELS[i][0], MX + lx * S + S / 2, MY + ly * S + S / 2);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, sx: number, sy: number, state: GameState, tickN: number, chargingMs = 0) {
  const blink = state.playerInvincibleTicks > 0 && Math.floor(tickN / 4) % 2 === 0;
  if (blink) return;

  const speeding   = state.speedActiveTicks > 0;
  const carrying   = state.playerCarryingRuby;
  const suitColor  = speeding ? '#00ffee' : carrying ? '#ff3366' : '#d8d870';
  const suitDark   = speeding ? '#00aaaa' : carrying ? '#aa0033' : '#a0a040';
  const glowColor  = speeding ? '#00ffee' : carrying ? '#ff1155' : '#eeee44';
  const visorColor = speeding ? '#ffffff' : carrying ? '#ff88aa' : '#44ccff';

  // Shrink on laser fire
  const laserFired = state.laserCooldown >= LASER_COOLDOWN - 10;
  const laserShrink = laserFired
    ? 0.75 + 0.25 * (1 - (state.laserCooldown - (LASER_COOLDOWN - 10)) / 10)
    : 1.0;
    
  // Shrink on bullet fire
  const bulletShrink = state.bulletCooldown > 0
    ? 0.8 + 0.2 * (1 - state.bulletCooldown / BULLET_COOLDOWN)
    : 1.0;

  // Gradually shrink to tiny while charging (200ms → 1000ms collapses to 30%)
  const chargeProgress = (chargingMs >= 200 && state.waveCooldown === 0)
    ? Math.min(1, (chargingMs - 200) / 800)
    : 0;
  const chargeShrink = 1 - chargeProgress * 0.70;
  const scaleFactor = Math.min(laserShrink, chargeShrink, bulletShrink);

  const sz  = Math.floor(TILE_SIZE * 0.74 * scaleFactor);
  const h   = Math.floor(sz / 2);
  const { playerDirX: dx, playerDirY: dy } = state;

  // Speed burst glow on initial cast
  const speedFlashTicks = state.speedFlashTicks;
  const burstGlow = speedFlashTicks > 0 ? Math.floor(60 * speedFlashTicks / 30) : 0;

  // Outer glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur  = speeding ? (burstGlow > 0 ? burstGlow : 22) : 14;

  // ── Spacesuit body (solid square) ─────────────────────────────────────
  ctx.fillStyle = suitColor;
  ctx.fillRect(sx - h, sy - h, sz, sz);
  ctx.shadowBlur = 0;

  // ── Inner suit detail — slightly darker inset panel ───────────────────
  const pad = Math.max(2, Math.floor(sz * 0.12));
  ctx.fillStyle = suitDark;
  ctx.fillRect(sx - h + pad, sy - h + pad, sz - pad * 2, sz - pad * 2);

  // ── Helmet / visor on the facing side ────────────────────────────────
  const vw = Math.floor(sz * 0.56); // visor width
  const vh = Math.floor(sz * 0.30); // visor height
  let vx = sx - vw / 2, vy = sy - vh / 2;

  if (dx === 1)       { vx = sx + h - pad - Math.floor(vh * 0.1) - vh; vy = sy - vw / 2; }
  else if (dx === -1) { vx = sx - h + pad + Math.floor(vh * 0.1);        vy = sy - vw / 2; }
  else if (dy === -1) { vx = sx - vw / 2; vy = sy - h + pad + Math.floor(vh * 0.1); }
  else                { vx = sx - vw / 2; vy = sy + h - pad - Math.floor(vh * 0.1) - vh; }

  const vwFinal = (dx !== 0) ? vh : vw;
  const vhFinal = (dx !== 0) ? vw : vh;

  ctx.shadowColor = visorColor;
  ctx.shadowBlur  = 10;
  ctx.fillStyle   = visorColor + 'cc';
  ctx.fillRect(vx, vy, vwFinal, vhFinal);
  // Visor glare highlight
  ctx.fillStyle = '#ffffff55';
  ctx.fillRect(vx + 1, vy + 1, Math.floor(vwFinal * 0.4), Math.floor(vhFinal * 0.4));
  ctx.shadowBlur = 0;

  // ── Antenna (always on top, small dot) ────────────────────────────────
  const antH = Math.max(3, Math.floor(sz * 0.22));
  ctx.fillStyle = suitColor;
  ctx.fillRect(sx - 1, sy - h - antH, 2, antH);
  ctx.shadowColor = glowColor;
  ctx.shadowBlur  = 8;
  ctx.fillStyle   = '#ffffff';
  ctx.fillRect(sx - 2, sy - h - antH - 2, 4, 4);
  ctx.shadowBlur = 0;

  // ── Wave charge ring ──────────────────────────────────────────────────
  if (chargingMs >= 40 && state.waveCooldown === 0) {
    const progress = Math.min(1, chargingMs / 1000);
    const ringPad  = Math.floor(h * (0.15 + progress * 1.6));
    ctx.globalAlpha = 0.15 + 0.7 * progress;
    ctx.strokeStyle = '#00ccff';
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur  = Math.floor(20 * progress);
    ctx.lineWidth   = Math.max(1, Math.floor(4 * progress));
    ctx.strokeRect(sx - h - ringPad, sy - h - ringPad, sz + ringPad * 2, sz + ringPad * 2);
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
    // Fully charged: fast pulsing second ring
    if (progress >= 0.98) {
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.012));
      ctx.globalAlpha = pulse * 0.6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 2;
      const r2 = ringPad * 1.4;
      ctx.strokeRect(sx - h - r2, sy - h - r2, sz + r2 * 2, sz + r2 * 2);
      ctx.globalAlpha = 1;
    }
  }
}

// Blocky diamond shape (like playing card diamond) centered at (cx,cy) fitting in `sz`
function drawPixelDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string) {
  const p    = Math.max(2, Math.floor(sz / 10)); // pixel unit
  const rows = 9;   // must be odd for a symmetric diamond
  const mid  = Math.floor(rows / 2);
  ctx.fillStyle = color;
  for (let i = 0; i < rows; i++) {
    const dist = Math.abs(i - mid);
    const w    = (mid - dist + 1) * 2 * p;
    const x    = cx - w / 2;
    const y    = cy - mid * p + i * p;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), p);
  }
}

// 8-pointed compass/north star — 4 long cardinal tips, 4 shorter diagonal tips
function drawCompassStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string) {
  const outerR = sz / 2;       // long cardinal tips (N/E/S/W)
  const diagR  = sz * 0.28;    // shorter diagonal tips
  const innerR = sz * 0.045;   // tight concave valleys between tips
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const tipAngle = (i * Math.PI / 4) - Math.PI / 2; // start from top (N)
    const tipR     = i % 2 === 0 ? outerR : diagR;
    const tx = cx + Math.cos(tipAngle) * tipR;
    const ty = cy + Math.sin(tipAngle) * tipR;
    const valAngle = tipAngle + Math.PI / 8;
    const vx = cx + Math.cos(valAngle) * innerR;
    const vy = cy + Math.sin(valAngle) * innerR;
    if (i === 0) ctx.moveTo(tx, ty);
    else ctx.lineTo(tx, ty);
    ctx.lineTo(vx, vy);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Pixel lightning bolt centered at (cx,cy) fitting inside `sz` — classic ⚡ shape
function drawPixelBolt(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string) {
  const cols = 8, rows = 10;
  const p = Math.max(1, Math.floor(sz / rows));
  const ox = Math.round(cx - (cols * p) / 2);
  const oy = Math.round(cy - (rows * p) / 2);
  const grid = [
    [0,0,0,0,0,1,1,0],
    [0,0,0,0,1,1,1,0],
    [0,0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0,0],
    [0,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0,0],
    [0,1,1,1,0,0,0,0],
    [0,1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0,0],
  ];
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c]) ctx.fillRect(ox + c * p, oy + r * p, p, p);
    }
  }
}

// Pixel art circle (like the classic staircase pixel circle)
function drawPixelCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string) {
  const p = Math.max(1, Math.round(sz / 11));
  // widths per row (out of 11 units), gives staircase corners
  const widths = [5, 5, 9, 9, 11, 11, 11, 9, 9, 5, 5];
  const totalH = widths.length * p;
  ctx.fillStyle = color;
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i] * p;
    ctx.fillRect(Math.round(cx - w / 2), Math.round(cy - totalH / 2 + i * p), w, p);
  }
}

function drawRubyGem(ctx: CanvasRenderingContext2D, sx: number, sy: number, tickN: number) {
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.06));
  const sz  = Math.floor(TILE_SIZE * 0.68);
  const h   = sz / 2;
  const pad = Math.max(2, Math.floor(sz * 0.14));

  // Outer glow box
  ctx.shadowColor = RUBY_COLOR;
  ctx.shadowBlur  = Math.floor(20 * pulse);
  ctx.fillStyle   = RUBY_COLOR;
  ctx.fillRect(sx - h, sy - h, sz, sz);

  // Inner darker panel
  ctx.shadowBlur = 0;
  ctx.fillStyle  = '#880033';
  ctx.fillRect(sx - h + pad, sy - h + pad, sz - pad * 2, sz - pad * 2);

  // Blocky star inside
  ctx.shadowColor = RUBY_COLOR;
  ctx.shadowBlur  = Math.floor(14 * pulse);
  drawCompassStar(ctx, sx, sy, sz - pad * 2, '#ff88aa');
  ctx.shadowBlur = 0;

  // Highlight corner
  ctx.fillStyle = '#ffaabb';
  ctx.fillRect(sx - h + pad + 1, sy - h + pad + 1, Math.floor(pad * 0.8), Math.floor(pad * 0.8));
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: ReturnType<typeof createInitialState>['enemies'][0], sx: number, sy: number, tickN: number) {
  const cfg  = ENEMY_CONFIGS[e.type];
  const size = Math.floor(TILE_SIZE * cfg.bodyFraction);
  const half = size / 2;
  const pad  = Math.max(2, Math.floor(size * 0.12));
  const flash = e.flashTicks > 0;
  // Attack animation: scale up slightly when about to attack (last 15 ticks of cooldown)
  const attacking = e.attackTimer > 0 && e.attackTimer <= 15 && !e.exploding;
  const attackScale = attacking ? (1 + 0.15 * (1 - e.attackTimer / 15)) : 1;
  const drawSz = Math.floor(size * attackScale);
  const drawH  = drawSz / 2;
  const color = flash ? '#ffffff' : cfg.color;

  // Glow — brightens during attack wind-up
  ctx.shadowColor = e.exploding ? '#ff4400' : color;
  ctx.shadowBlur  = e.exploding ? (14 + 6 * Math.abs(Math.sin(tickN * 0.3)))
                  : attacking   ? (16 + 8 * (1 - e.attackTimer / 15))
                  : 8;

  // ── Blocky body (slightly scaled during attack) ───────────────────────
  ctx.fillStyle = color;
  ctx.fillRect(sx - drawH, sy - drawH, drawSz, drawSz);
  ctx.shadowBlur = 0;

  // Inner panel (darker)
  if (!flash) {
    const darken = e.type === 'armored' ? '66' : '44';
    ctx.fillStyle = '#000000' + darken;
    ctx.fillRect(sx - half + pad, sy - half + pad, size - pad * 2, size - pad * 2);
  }

  // ── Antenna ───────────────────────────────────────────────────────────
  const antH = Math.max(3, Math.floor(size * 0.28));
  const antW = e.type === 'armored' ? 3 : 2;
  ctx.fillStyle = color;
  ctx.fillRect(sx - Math.floor(antW / 2), sy - half - antH, antW, antH);
  // Antenna tip dot
  const dotSz = e.type === 'fast' ? 4 : 3;
  ctx.fillStyle = flash ? '#ffffff' : '#ffffff';
  ctx.shadowColor = color;
  ctx.shadowBlur  = 6;
  ctx.fillRect(sx - Math.floor(dotSz / 2), sy - half - antH - dotSz, dotSz, dotSz);
  ctx.shadowBlur = 0;

  // ── Eyes ──────────────────────────────────────────────────────────────
  if (!flash) {
    const threeEyes = e.type === 'fast' || e.type === 'bomber';
    const eyeSz  = Math.max(2, Math.floor(size * 0.18));
    const pupSz  = Math.max(1, eyeSz - 1);
    const eyeY   = sy - half + pad + 1;
    const eyeClr = e.type === 'armored' ? '#ffff00' : e.type === 'bomber' ? '#ff6600' : '#ff2200';

    ctx.fillStyle = '#ffffff';
    if (threeEyes) {
      // 3 eyes spread across the body
      const gap = Math.floor((size - pad * 2 - eyeSz * 3) / 2);
      const ex1 = sx - half + pad;
      const ex2 = ex1 + eyeSz + gap;
      const ex3 = ex2 + eyeSz + gap;
      ctx.fillRect(ex1, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex2, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex3, eyeY, eyeSz, eyeSz);
      ctx.fillStyle = eyeClr;
      ctx.fillRect(ex1 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex3 + 1, eyeY + 1, pupSz, pupSz);
    } else {
      // 2 eyes
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eyeSz - 1;
      ctx.fillRect(ex1, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex2, eyeY, eyeSz, eyeSz);
      ctx.fillStyle = eyeClr;
      ctx.fillRect(ex1 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pupSz, pupSz);
    }
  }

  // ── Type-specific details ─────────────────────────────────────────────
  if (e.type === 'armored' && e.hp > e.maxHp / 2) {
    // Shield border plates
    ctx.strokeStyle = cfg.shieldColor + 'bb';
    ctx.lineWidth   = 3;
    ctx.shadowColor = cfg.shieldColor;
    ctx.shadowBlur  = 8;
    ctx.strokeRect(sx - half - 3, sy - half - 3, size + 6, size + 6);
    ctx.shadowBlur = 0;
  }
  if (e.type === 'bomber') {
    // X danger mark across body
    const x1 = sx - half + pad * 2, y1 = sy - half + pad * 2;
    const x2 = sx + half - pad * 2, y2 = sy + half - pad * 2;
    const xs = Math.max(2, Math.floor(size * 0.08));
    ctx.fillStyle = e.exploding ? '#ff2200' : '#880000';
    ctx.fillRect(x1, y1, xs, xs);
    ctx.fillRect(x2 - xs, y1, xs, xs);
    ctx.fillRect(sx - xs / 2, sy - xs / 2, xs, xs);
    ctx.fillRect(x1, y2 - xs, xs, xs);
    ctx.fillRect(x2 - xs, y2 - xs, xs, xs);
  }
  if (e.type === 'bomber' && e.exploding) {
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth   = 3;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur  = 18;
    ctx.strokeRect(sx - half - 4, sy - half - 4, size + 8, size + 8);
    ctx.shadowBlur = 0;
  }

  // ── HP bar ────────────────────────────────────────────────────────────
  if (e.hp < e.maxHp) {
    const barW = size + 4;
    const barH = Math.max(5, Math.floor(size * 0.13));
    const bx   = sx - barW / 2;
    const by   = sy - half - antH - dotSz - barH - 3;
    const pct  = e.hp / e.maxHp;
    ctx.fillStyle = '#330000';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = pct > 0.5 ? '#00cc44' : pct > 0.25 ? '#ffaa00' : '#ff3300';
    ctx.fillRect(bx, by, barW * pct, barH);
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);
  }
}

function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
  tickN: number,
  chargingMs = 0,
): void {
  let camX = state.playerX - canvasW / 2;
  let camY = state.playerY - canvasH / 2;
  if (state.screenShakeTicks > 0) {
    const shakeStr = state.screenShakeAmt * (state.screenShakeTicks / 22);
    camX += Math.round((Math.random() - 0.5) * shakeStr * 2);
    camY += Math.round((Math.random() - 0.5) * shakeStr * 2);
  }

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Per-chamber glowing borders — inset 1 tile to sit right on the floor edge
  for (let ch = 0; ch < 4; ch++) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[ch];
    const bx2 = (c1 + 1) * TILE_SIZE - camX;
    const by2 = (r1 + 1) * TILE_SIZE - camY;
    const bw2 = (c2 - c1 - 1) * TILE_SIZE;
    const bh2 = (r2 - r1 - 1) * TILE_SIZE;
    const col = CHAMBER_COLORS[ch];
    ctx.shadowColor = col;
    ctx.shadowBlur  = 22;
    ctx.strokeStyle = col + '99';
    ctx.lineWidth   = 3;
    ctx.strokeRect(bx2, by2, bw2, bh2);
    ctx.shadowBlur  = 10;
    ctx.strokeStyle = col + '44';
    ctx.lineWidth   = 8;
    ctx.strokeRect(bx2, by2, bw2, bh2);
    ctx.shadowBlur  = 0;
  }

  // Hallway border lines — exposed long sides of each corridor (neutral glow)
  // fillFloor zones: (9,20,11,30), (38,20,40,30), (20,9,30,11), (20,38,30,40)
  const TS = TILE_SIZE;
  const hallways: [number,number,number,number][] = [
    [9,20,11,30],   // top horizontal  (ALPHA ↔ BETA)
    [38,20,40,30],  // bottom horizontal (GAMMA ↔ DELTA)
    [20,9,30,11],   // left vertical   (ALPHA ↔ GAMMA)
    [20,38,30,40],  // right vertical  (BETA  ↔ DELTA)
  ];
  ctx.shadowColor = '#8899ff';
  ctx.shadowBlur  = 14;
  ctx.strokeStyle = '#8899ff88';
  ctx.lineWidth   = 3;
  for (const [hr1, hc1, hr2, hc2] of hallways) {
    const isHoriz = (hr2 - hr1) < (hc2 - hc1);
    if (isHoriz) {
      // Top and bottom long edges
      ctx.beginPath();
      ctx.moveTo(hc1 * TS - camX, hr1 * TS - camY);
      ctx.lineTo((hc2 + 1) * TS - camX, hr1 * TS - camY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hc1 * TS - camX, (hr2 + 1) * TS - camY);
      ctx.lineTo((hc2 + 1) * TS - camX, (hr2 + 1) * TS - camY);
      ctx.stroke();
    } else {
      // Left and right long edges
      ctx.beginPath();
      ctx.moveTo(hc1 * TS - camX, hr1 * TS - camY);
      ctx.lineTo(hc1 * TS - camX, (hr2 + 1) * TS - camY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((hc2 + 1) * TS - camX, hr1 * TS - camY);
      ctx.lineTo((hc2 + 1) * TS - camX, (hr2 + 1) * TS - camY);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // Tile range in view
  const tx0 = Math.floor(camX / TILE_SIZE) - 1;
  const ty0 = Math.floor(camY / TILE_SIZE) - 1;
  const tx1 = Math.ceil((camX + canvasW) / TILE_SIZE) + 1;
  const ty1 = Math.ceil((camY + canvasH) / TILE_SIZE) + 1;

  // Tiles
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) continue;
      const tile = state.map[ty][tx];
      const sx = tx * TILE_SIZE - camX;
      const sy = ty * TILE_SIZE - camY;

      if (tile === T_WALL) {
        // Interior cover walls inside chambers get a distinct color
        const wch = chamberOfTile(tx, ty);
        if (wch >= 0) {
          const [wr1, wc1, wr2, wc2] = CHAMBER_BOUNDS[wch];
          if (ty > wr1 && ty < wr2 && tx > wc1 && tx < wc2) {
            ctx.fillStyle = '#0f0f28';
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = CHAMBER_COLORS[wch] + '22';
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = CHAMBER_COLORS[wch] + '55';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          }
        }
        continue;
      }

      // Floor / hallway base
      const ch = chamberOfTile(tx, ty);
      if (ch >= 0) {
        ctx.fillStyle = '#0d0d22';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = CHAMBER_COLORS[ch] + '10';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      }
      // Subtle grid border on every walkable tile
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

      // Teleport pad
      if (tile === T_TELEPORT) {
        const tcol = ch >= 0 ? CHAMBER_COLORS[ch] : '#ffffff';
        const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.04 + ch));
        ctx.fillStyle = tcol + '33';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.shadowColor = tcol;
        ctx.shadowBlur = 14 * pulse;
        ctx.strokeStyle = tcol;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        ctx.shadowBlur = 0;
        // Blocky diamond symbol - blinking pulse
        const blinkPulse = Math.pow(Math.abs(Math.sin(tickN * 0.08 + ch * 2)), 8);
        ctx.shadowColor = tcol;
        ctx.shadowBlur  = Math.floor(16 * blinkPulse);
        const diaSize = Math.floor(TILE_SIZE * (0.15 + 0.45 * blinkPulse));
        drawPixelDiamond(ctx, sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, diaSize, tcol);
        ctx.shadowBlur = 0;
      }
    }
  }

  // Meteorite warning: flash chamber on main canvas
  if (state.meteoriteWarning >= 0) {
    const pulse = Math.floor(tickN / 8) % 2 === 0;
    if (pulse) {
      const [r1, c1, r2, c2] = CHAMBER_BOUNDS[state.meteoriteWarning];
      ctx.fillStyle = 'rgba(255,60,0,0.12)';
      ctx.fillRect(c1 * TILE_SIZE - camX, r1 * TILE_SIZE - camY,
        (c2 - c1 + 1) * TILE_SIZE, (r2 - r1 + 1) * TILE_SIZE);
      // Chamber border flash
      ctx.strokeStyle = 'rgba(255,80,0,0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(c1 * TILE_SIZE - camX + 1, r1 * TILE_SIZE - camY + 1,
        (c2 - c1 + 1) * TILE_SIZE - 2, (r2 - r1 + 1) * TILE_SIZE - 2);
    }
    // Warning text in chamber
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[state.meteoriteWarning];
    const cx2 = ((c1 + c2) / 2) * TILE_SIZE - camX + TILE_SIZE / 2;
    const cy2 = ((r1 + r2) / 2) * TILE_SIZE - camY + TILE_SIZE / 2;
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff6600';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const warning = Math.ceil(state.meteoriteStrikeIn / 60);
    ctx.fillText(`☄ INCOMING! ${warning}s`, cx2, cy2 - 20);
    ctx.fillText(CHAMBER_LABELS[state.meteoriteWarning], cx2, cy2 + 10);
    ctx.shadowBlur = 0;

    // GIGANTIC falling meteor — grows from tiny dot to nearly chamber-sized
    const strikeProg = 1 - state.meteoriteStrikeIn / METEORITE_WARNING;
    const chamW = (c2 - c1 - 1) * TILE_SIZE;
    // meteor grows from 2 tiles to 11 tiles wide as it falls
    const metSz = Math.floor(TILE_SIZE * (2 + 9 * strikeProg));
    const startY = (r1 - 1) * TILE_SIZE - camY - metSz;
    const endY   = cy2;
    const metY   = Math.round(startY + (endY - startY) * strikeProg);
    const metX   = Math.round(cx2);
    if (metY < endY) {
      const tailH = Math.min(canvasH, metSz * 3);
      const tailW = Math.max(4, Math.floor(metSz * 0.55));
      // Fire tail stretching above
      const tailAlpha = 0.35 + 0.3 * strikeProg;
      ctx.globalAlpha = tailAlpha;
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(metX - tailW / 2, metY - tailH, tailW, tailH);
      ctx.globalAlpha = tailAlpha * 0.5;
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(metX - tailW * 0.35, metY - tailH * 0.7, tailW * 0.7, tailH * 0.7);
      ctx.globalAlpha = 1;
      // Main meteor body
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 40 + Math.floor(strikeProg * 40);
      ctx.fillStyle = '#cc2200';
      ctx.fillRect(metX - metSz / 2, metY - metSz / 2, metSz, metSz);
      // Cracked inner detail
      const ip = Math.max(4, Math.floor(metSz * 0.12));
      ctx.fillStyle = '#661100';
      ctx.fillRect(metX - metSz / 2 + ip, metY - metSz / 2 + ip, metSz - ip * 2, metSz - ip * 2);
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(metX - ip / 2, metY - metSz / 2 + ip, ip, metSz - ip * 2); // vertical crack
      ctx.shadowBlur = 0;
      // Small debris pieces
      for (let d = 0; d < 3; d++) {
        const dSz = Math.floor(metSz * (0.15 + d * 0.08));
        const dox = [- chamW * 0.28, chamW * 0.22, -chamW * 0.12][d];
        const doy = [-metSz * 0.8, -metSz * 1.2, -metSz * 0.5][d];
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(Math.round(metX + dox - dSz / 2), Math.round(metY + doy - dSz / 2), dSz, dSz);
      }
    }
  }

  // Resources
  for (const r of state.resources) {
    const sx = r.tileX * TILE_SIZE - camX + TILE_SIZE / 2;
    const sy = r.tileY * TILE_SIZE - camY + TILE_SIZE / 2;
    const pulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.07 + r.tileX));
    if (r.type === 'health') {
      ctx.shadowColor = '#ff3355';
      ctx.shadowBlur = 18 * pulse;
      ctx.fillStyle = '#ff4466';
      const hcw = Math.floor(TILE_SIZE * 0.58), hch = Math.floor(TILE_SIZE * 0.22);
      ctx.fillRect(sx - hcw / 2, sy - hch / 2, hcw, hch); // horizontal
      ctx.fillRect(sx - hch / 2, sy - hcw / 2, hch, hcw); // vertical
      // Bright center dot
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    } else {
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 18 * pulse;
      const boltSz = Math.floor(TILE_SIZE * 0.72);
      drawPixelBolt(ctx, sx, sy, boltSz, '#66aaff');
      // Highlight core
      ctx.shadowBlur = 8;
      drawPixelBolt(ctx, sx, sy, boltSz, '#bbddff');
    }
    ctx.shadowBlur = 0;
  }

  // Placed bomb
  if (state.bomb) {
    const bsx = state.bomb.tileX * TILE_SIZE - camX;
    const bsy = state.bomb.tileY * TILE_SIZE - camY;
    // Highlight all the area that bomb can affect
    const radiusTiles = state.bomb.powered ? BOMB_RADIUS_PWR : BOMB_RADIUS;
    ctx.fillStyle = (state.bomb.powered ? '#ffcc00' : '#ff6600') + '22';
    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        if (Math.hypot(dx, dy) <= radiusTiles) {
           const hx = bsx + dx * TILE_SIZE;
           const hy = bsy + dy * TILE_SIZE;
           ctx.fillRect(hx + 1, hy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }
    }

    // Bomb body — completely blocky like ruby core
    const bombCol = state.bomb.powered ? '#ffcc00' : '#ff6600';
    const innerCol = state.bomb.powered ? '#885500' : '#883300';
    const bodyW = Math.floor(TILE_SIZE * 0.45);
    const bodyCX = Math.round(bsx + TILE_SIZE / 2);
    const bodyCY = Math.round(bsy + TILE_SIZE / 2 + TILE_SIZE * 0.06);
    const bw = bodyW * 1.5;

    // Colored outline
    ctx.shadowColor = bombCol;
    ctx.shadowBlur = 6;
    ctx.fillStyle = bombCol;
    ctx.fillRect(bodyCX - bw/2 - 2, bodyCY - bw/2 - 2, bw + 4, bw + 4);
    ctx.shadowBlur = 0;

    // Dark orangeish fill
    ctx.fillStyle = innerCol;
    ctx.fillRect(bodyCX - bw/2 + 2, bodyCY - bw/2 + 2, bw - 4, bw - 4);

    // Highlight corner
    ctx.fillStyle = state.bomb.powered ? '#ffeedd' : '#ffbb88';
    ctx.fillRect(bodyCX - bw/2 + 5, bodyCY - bw/2 + 5, 3, 3);
    // Fuse rope (line from top of circle to spark)
    const fuseX = bodyCX + Math.floor(bodyW * 0.22);
    const fuseTopY = Math.round(bodyCY - bodyW / 2 - Math.floor(TILE_SIZE * 0.18));
    const fuseBottomY = Math.round(bodyCY - bodyW / 2);
    ctx.fillStyle = '#997744';
    ctx.fillRect(fuseX, fuseTopY, 2, fuseBottomY - fuseTopY);
    // Spark dot
    const sparkOn = Math.floor(tickN * 0.2) % 2 === 0;
    ctx.shadowColor = bombCol;
    ctx.shadowBlur  = sparkOn ? 12 : 0;
    ctx.fillStyle   = sparkOn ? '#ffffff' : bombCol;
    ctx.fillRect(fuseX - 1, fuseTopY - 3, 4, 4);
    ctx.shadowBlur = 0;
    // 7-pointed star inside body
    ctx.fillStyle = bombCol;
    ctx.beginPath();
    const starOuter = bodyW * 0.4;
    const starInner = bodyW * 0.18;
    for (let i = 0; i < 14; i++) {
      const radius = i % 2 === 0 ? starOuter : starInner;
      const angle = (i * Math.PI) / 7 - Math.PI / 2;
      const x = bodyCX + radius * Math.cos(angle);
      const y = bodyCY + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Ruby (placed)
  if (state.rubyTileX !== -1) {
    const rsx = state.rubyTileX * TILE_SIZE - camX + TILE_SIZE / 2;
    const rsy = state.rubyTileY * TILE_SIZE - camY + TILE_SIZE / 2;
    drawRubyGem(ctx, rsx, rsy, tickN);
    // Ruby HP bar
    const barW = TILE_SIZE - 2;
    const bx = rsx - barW / 2;
    const by = rsy - TILE_SIZE / 2 - 8;
    ctx.fillStyle = '#330011';
    ctx.fillRect(bx, by, barW, 4);
    const pct = state.rubyHP / RUBY_MAX_HP;
    ctx.fillStyle = pct > 0.5 ? '#ff1155' : pct > 0.25 ? '#ff6622' : '#ff3300';
    ctx.fillRect(bx, by, barW * pct, 4);
  }

  // Enemies
  for (const e of state.enemies) {
    const sx = e.x - camX;
    const sy = e.y - camY;
    drawEnemy(ctx, e, sx, sy, tickN);
  }

  // Enemy attack lasers — drawn after enemies, over them
  for (const e of state.enemies) {
    if (e.shootTicks <= 0) continue;
    const alpha = e.shootTicks / 14;
    const exs = e.x - camX;
    const eys = e.y - camY;
    const tgtX = e.targeting === 'ruby' && state.rubyTileX !== -1
      ? state.rubyTileX * TILE_SIZE + TILE_SIZE / 2 - camX
      : state.playerX - camX;
    const tgtY = e.targeting === 'ruby' && state.rubyTileX !== -1
      ? state.rubyTileY * TILE_SIZE + TILE_SIZE / 2 - camY
      : state.playerY - camY;
    const ecol = ENEMY_CONFIGS[e.type].color;
    ctx.globalAlpha = alpha * 0.75;
    ctx.shadowColor = ecol;
    ctx.shadowBlur  = 16;
    ctx.strokeStyle = ecol;
    ctx.lineWidth   = Math.max(4, Math.floor(TILE_SIZE * 0.22));
    ctx.lineCap     = 'square';
    ctx.beginPath();
    ctx.moveTo(exs, eys);
    ctx.lineTo(tgtX, tgtY);
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(exs, eys);
    ctx.lineTo(tgtX, tgtY);
    ctx.stroke();
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
    ctx.lineCap     = 'butt';
  }

  // Player
  const psx = state.playerX - camX;
  const psy = state.playerY - camY;
  drawPlayer(ctx, psx, psy, state, tickN, chargingMs);

  // Laser bullets
  for (const b of state.laserBullets || []) {
    const shadowCol = b.powered ? '#ffaa00' : '#00ffff';
    const strokeOut = b.powered ? '#ffcc00' : '#44ddff';
    const strokeIn  = b.powered ? '#ffee88' : '#aaffff';

    const cx = b.x * TILE_SIZE - camX;
    const cy = b.y * TILE_SIZE - camY;
    
    // Streak from previous position to slightly ahead
    const len = Math.sqrt(b.dx*b.dx + b.dy*b.dy) || 1;
    const nx = b.dx / len;
    const ny = b.dy / len;
    const tailLen = TILE_SIZE * 1.5;
    
    const startX = cx - nx * tailLen;
    const startY = cy - ny * tailLen;
    const endX = cx + nx * TILE_SIZE * 0.4;
    const endY = cy + ny * TILE_SIZE * 0.4;

    const size = b.powered ? 24 : 12;

    // Outer glow
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = shadowCol;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = strokeOut;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Inner bright core
    ctx.globalAlpha = 1;
    ctx.strokeStyle = strokeIn;
    ctx.lineWidth = size * 0.4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  // Laser beams — tile-wide
  for (const beam of state.laserBeams) {
    const alpha = beam.ticks / 18;
    const shadowCol = beam.powered ? '#ffaa00' : '#00ffff';
    const strokeOut = beam.powered ? '#ffcc00' : '#44ddff';
    const strokeIn  = beam.powered ? '#ffee88' : '#aaffff';

    // Outer wide glow layer
    ctx.globalAlpha = alpha * 0.45;
    ctx.shadowColor = shadowCol;
    ctx.shadowBlur  = 18;
    ctx.strokeStyle = strokeOut;
    ctx.lineWidth   = TILE_SIZE;
    ctx.lineCap     = 'square';
    ctx.beginPath();
    ctx.moveTo(beam.fromX - camX, beam.fromY - camY);
    ctx.lineTo(beam.endX - camX, beam.endY - camY);
    ctx.stroke();
    // Bright core
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = strokeIn;
    ctx.lineWidth   = Math.max(4, Math.floor(TILE_SIZE * 0.35));
    ctx.beginPath();
    ctx.moveTo(beam.fromX - camX, beam.fromY - camY);
    ctx.lineTo(beam.endX - camX, beam.endY - camY);
    ctx.stroke();
    // White center line
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(beam.fromX - camX, beam.fromY - camY);
    ctx.lineTo(beam.endX - camX, beam.endY - camY);
    ctx.stroke();
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
    ctx.lineCap     = 'butt';
  }

  // Wave effects (expanding SQUARE ring)
  for (const w of state.waveEffects) {
    const progress = 1 - w.ticks / 30;
    const alpha = (w.ticks / 30) * 0.9;
    const wx = w.cx - camX, wy = w.cy - camY, r = w.radius;
    const hue = w.powered ? Math.round(40 + progress * 20) : Math.round(180 + progress * 100);
    const ringColor = `hsl(${hue}, 100%, 75%)`;
    const glowColor = `hsl(${hue}, 100%, 60%)`;

    // Outer glow ring
    ctx.globalAlpha = Math.min(1, alpha * 1.5);
    ctx.shadowColor = glowColor;
    ctx.shadowBlur  = 40;
    ctx.strokeStyle = ringColor;
    ctx.lineWidth   = 14;
    ctx.strokeRect(wx - r, wy - r, r * 2, r * 2);

    // Bright core ring
    ctx.globalAlpha = Math.min(1, alpha * 1.2);
    ctx.shadowBlur  = 20;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 4;
    ctx.strokeRect(wx - r, wy - r, r * 2, r * 2);

    // Inner secondary ring (lags behind at 70% radius)
    const r2 = r * 0.7;
    ctx.globalAlpha = alpha * 0.8;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur  = 20;
    ctx.strokeStyle = ringColor;
    ctx.lineWidth   = 6;
    ctx.strokeRect(wx - r2, wy - r2, r2 * 2, r2 * 2);

    // Wave faint fill
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = glowColor;
    ctx.fillRect(wx - r, wy - r, r * 2, r * 2);

    // Tinted fill
    ctx.globalAlpha = alpha * 0.12;
    ctx.fillStyle   = ringColor;
    ctx.fillRect(wx - r, wy - r, r * 2, r * 2);

    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
  }

  // Bomb blasts (blocky square explosion)
  for (const b of state.bombBlasts) {
    const alpha = (b.ticks / 28) * 0.9;
    const bwx = b.cx - camX, bwy = b.cy - camY, r = b.radius;
    ctx.globalAlpha = Math.min(1, alpha * 1.5);
    ctx.strokeStyle = '#ffee77';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur  = 40;
    ctx.lineWidth   = 6;
    ctx.strokeRect(bwx - r, bwy - r, r * 2, r * 2);
    ctx.globalAlpha = Math.min(1, alpha * 1.2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 3;
    ctx.strokeRect(bwx - r * 0.5, bwy - r * 0.5, r, r);
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle   = '#ff3300';
    ctx.fillRect(bwx - r, bwy - r, r * 2, r * 2);
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
  }

  // Minimap
  drawMinimap(ctx, state, canvasW, canvasH, tickN);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RubyStarPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<GameState | null>(null);
  const tickRef   = useRef(0);
  const rafRef    = useRef(0);
  const bgmRef    = useRef<BGMControllerHandle>(null);
  const [showRules, setShowRules] = useState(true);
  const [, forceRender] = useState(0);
  const [isGodQuery, setIsGodQuery] = useState(false);
  const touchStartRef    = useRef<{ x: number; y: number } | null>(null);
  const mouseDownTimeRef = useRef<number>(0);

  const rerender = useCallback(() => forceRender(n => n + 1), []);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    stateRef.current = createInitialState();
    if (typeof window !== 'undefined') {
      setIsGodQuery(window.location.search.includes('god=1'));
    }
    if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
      (screen.orientation as any).lock('landscape').catch(() => {});
    }
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (showRules) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let lastTime = 0;
    const TARGET_MS = 1000 / 60;
    function loop(ts: number) {
      rafRef.current = requestAnimationFrame(loop);
      if (ts - lastTime < TARGET_MS * 0.8) return;
      lastTime = ts;
      const state = stateRef.current;
      if (!state) return;
      tickRef.current++;
      const t = tickRef.current;
      const chargingMsNow = mouseDownTimeRef.current > 0 ? Date.now() - mouseDownTimeRef.current : 0;
      // Auto-fire wave when hold reaches 1000ms (only if wave not on cooldown)
      if (chargingMsNow >= 1000 && state.gamePhase === 'playing' && state.waveCooldown === 0) {
        activateWave(state);
        mouseDownTimeRef.current = Date.now();
      }
      // Charge build-up sound — rising tone every ~120ms while charging
      if (chargingMsNow >= 200 && state.waveCooldown === 0 && state.gamePhase === 'playing') {
        const chargeSlot = Math.floor(chargingMsNow / 120);
        const prevChargeSlot = Math.floor((chargingMsNow - 16) / 120);
        if (chargeSlot !== prevChargeSlot) {
          const progress = Math.min(1, chargingMsNow / 1000);
          const freq = 180 + progress * 720; // rises from 180Hz to 900Hz
          try {
            const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, actx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.09);
            osc.connect(gain); gain.connect(actx.destination);
            osc.start(); osc.stop(actx.currentTime + 0.1);
          } catch { }
        }
      }
      // Lock movement while ACTIVELY charging (not during cooldown)
      if (chargingMsNow >= 200 && state.waveCooldown === 0) {
        state.playerQueuedDirX = 0;
        state.playerQueuedDirY = 0;
      }
      if (state.gamePhase !== 'lost') tick(state);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      if (W === 0 || H === 0) return;
      ctx.imageSmoothingEnabled = false;
      const chargingMs = mouseDownTimeRef.current > 0 ? Date.now() - mouseDownTimeRef.current : 0;
      drawGame(ctx, state, W, H, t, chargingMs);
      if (t % 6 === 0) rerender();
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [showRules, rerender]);

  // ── Canvas resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement!;
      canvas.width  = parent.clientWidth;
      canvas.height = parent.clientHeight;
      canvas.style.width  = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Keyboard input ────────────────────────────────────────────────────────
  useEffect(() => {
    if (showRules) return;
    const onKey = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state || state.gamePhase === 'lost') return;

      // Teleport menu
      if (state.gamePhase === 'teleporting') {
        if (e.key === 'Escape') { cancelTeleport(state); rerender(); return; }
        const numMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
        const dest = numMap[e.key];
        if (dest !== undefined && state.teleportDestOptions.includes(dest)) {
          doTeleport(state, dest); rerender(); return;
        }
        return;
      }

      // Movement
      const dirMap: Record<string, [number, number]> = {
        ArrowUp: [0,-1], w: [0,-1], W: [0,-1],
        ArrowDown: [0,1], s: [0,1], S: [0,1],
        ArrowLeft: [-1,0], a: [-1,0], A: [-1,0],
        ArrowRight: [1,0], d: [1,0], D: [1,0],
      };
      const dir = dirMap[e.key];
      if (dir) {
        e.preventDefault();
        state.playerQueuedDirX = dir[0];
        state.playerQueuedDirY = dir[1];
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (tryActivateTeleport(state)) { rerender(); return; }
        healRuby(state);
        rerender();
        return;
      }
      if (e.key === 'Shift' || e.key === 'r' || e.key === 'R') { e.preventDefault(); useSpeedBoost(state); rerender(); return; }
      if (e.key === 'e' || e.key === 'E' || e.key === 'f' || e.key === 'F') {
        toggleCarryRuby(state); rerender(); return;
      }
      if (e.key === 'q' || e.key === 'Q') { useBomb(state); rerender(); return; }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state) return;
      const dirMap: Record<string, [number, number]> = {
        ArrowUp: [0,-1], w: [0,-1], W: [0,-1],
        ArrowDown: [0,1], s: [0,1], S: [0,1],
        ArrowLeft: [-1,0], a: [-1,0], A: [-1,0],
        ArrowRight: [1,0], d: [1,0], D: [1,0],
      };
      const dir = dirMap[e.key];
      if (dir && state.playerQueuedDirX === dir[0] && state.playerQueuedDirY === dir[1]) {
        state.playerQueuedDirX = 0;
        state.playerQueuedDirY = 0;
      }
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [showRules, rerender]);

  // ── Mouse input ───────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    if (e.button === 0) {

      mouseDownTimeRef.current = Date.now();
      useLaser(state);
      rerender();
    } else if (e.button === 2) {
      e.preventDefault();
      useBullet(state);
      rerender();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    mouseDownTimeRef.current = 0; // cancel any in-progress charge
  };

  // ── Touch swipe ───────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (document.fullscreenElement === null && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const state = stateRef.current;
    if (!state || !touchStartRef.current || state.gamePhase !== 'playing') return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 14 || Math.abs(dy) > 14) {
      if (Math.abs(dx) > Math.abs(dy)) {
        state.playerQueuedDirX = dx > 0 ? 1 : -1;
        state.playerQueuedDirY = 0;
      } else {
        state.playerQueuedDirX = 0;
        state.playerQueuedDirY = dy > 0 ? 1 : -1;
      }
    }
  };
  const handleTouchEnd = () => {
    const state = stateRef.current;
    touchStartRef.current = null;
    if (!state) return;
    state.playerQueuedDirX = 0;
    state.playerQueuedDirY = 0;
  };

  const pressDir = (dx: number, dy: number) => {
    const state = stateRef.current;
    if (!state) return;
    state.playerQueuedDirX = dx;
    state.playerQueuedDirY = dy;
  };
  const releaseDir = (dx: number, dy: number) => {
    const state = stateRef.current;
    if (!state) return;
    if (state.playerQueuedDirX === dx && state.playerQueuedDirY === dy) {
      state.playerQueuedDirX = 0;
      state.playerQueuedDirY = 0;
    }
  };

  const handleRestart = () => {
    const s = createInitialState();
    s.godMode = stateRef.current?.godMode ?? false;
    stateRef.current = s;
    tickRef.current = 0;
    rerender();
  };

  const state = stateRef.current;
  const phase = state?.gamePhase ?? 'playing';
  const timeSurvived = Math.floor(state?.score ?? 0);

  // Ability state helpers for UI
  const rubyHealAvail = state ? canHealRuby(state) : false;
  const laserReady  = (state?.laserCooldown ?? 0) === 0;
  const waveReady   = (state?.waveCooldown ?? 0) === 0;
  const speedReady  = (state?.speedCooldown ?? 0) === 0;
  const bombReady   = (state?.bombCooldown ?? 0) === 0 && !state?.bomb;
  const powered     = (state?.poweredTicks ?? 0) > 0 || (state?.starEnergy ?? 0) >= STAR_ENERGY_MAX;
  const carrying    = state?.playerCarryingRuby ?? true;

  // HP percentages
  const playerHpPct = Math.max(0, Math.min(100, ((state?.playerHP ?? PLAYER_MAX_HP) / PLAYER_MAX_HP) * 100));
  const rubyHpPct   = Math.max(0, Math.min(100, ((state?.rubyHP ?? RUBY_MAX_HP) / RUBY_MAX_HP) * 100));
  const energyPct   = Math.max(0, Math.min(100, ((state?.starEnergy ?? 0) / STAR_ENERGY_MAX) * 100));

  const playerBattColor = playerHpPct > 60 ? 'var(--success)' : playerHpPct > 30 ? 'var(--warning)' : 'var(--danger)';
  const rubyBattColor   = rubyHpPct   > 60 ? '#ff4488'        : rubyHpPct   > 30 ? '#ff7700'        : '#ff2200';

  // Ability button renderer
  const abilityBtn = (
    label: string, sub: string,
    cooldownPct: number, ready: boolean, active: boolean,
    onClick: () => void,
    overrideColor?: string,
  ) => {
    const col = overrideColor ?? (active ? 'var(--cyan)' : ready ? 'var(--success)' : 'var(--text-muted)');
    const bg  = active ? 'var(--cyan)22' : ready ? 'var(--success)22' : 'transparent';
    const border = `3px solid ${active || ready ? col : 'rgba(255,255,255,0.15)'}`;
    return (
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '2px',
          background: bg, borderTop: border,
          cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent',
          position: 'relative', overflow: 'hidden',
        }}
        onPointerDown={(e) => { e.preventDefault(); onClick(); }}
      >
        {cooldownPct > 0 && cooldownPct < 100 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            width: `${cooldownPct}%`, height: '2px', background: col, opacity: 0.5,
          }} />
        )}
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--font-abl)', color: col,
          textShadow: (active || ready) ? `0 0 10px ${col}` : 'none', lineHeight: 1 }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--font-abs)', color: col, lineHeight: 1 }}>
          {sub}
        </span>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      position: 'fixed', inset: 0,
      background: 'var(--void)', overflow: 'hidden', touchAction: 'none',
    }}>
      <style>{`
        :root {
          --bar-pad: 8px 12px;
          --font-stat: 0.75rem;
          --font-score: 0.85rem;
          --batt-w: 64px; --batt-h: 16px;
          --bot-bar-h: 56px;
          --font-abl: 0.65rem;
          --font-abs: 0.5rem;
        }
        @media (min-width: 1024px) {
          :root {
            --bar-pad: 10px 16px;
            --font-stat: 0.9rem;
            --font-score: 1rem;
            --batt-w: 76px; --batt-h: 20px;
            --bot-bar-h: 72px;
            --font-abl: 0.78rem;
            --font-abs: 0.6rem;
          }
        }
        .rotate-overlay { display: none; }
        @media (orientation: portrait) and (max-width: 768px) {
          .rotate-overlay { display: flex !important; }
        }
      `}</style>

      <BGMController ref={bgmRef} visible={false} src={['/sounds/rubyStarBGM.mp3']} volume={[0.3]} />

      {/* Rotate prompt */}
      <div className="rotate-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--void)',
        color: 'white', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '20px',
      }}>
        <span style={{ fontSize: '4rem', marginBottom: '20px' }}>📱➔🔄</span>
        <h2 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.2rem', marginBottom: '16px', lineHeight: 1.5 }}>
          PLEASE ROTATE<br />YOUR DEVICE
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          Ruby Star is designed for landscape mode.
        </p>
      </div>

      <RulesModal
        isOpen={showRules}
        onClose={() => { setShowRules(false); bgmRef.current?.playMusic(); }}
        title=":: RUBY STAR"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
            Survive as long as possible in a 4-chamber space station under alien attack.
            Guard the <span style={{ color: RUBY_COLOR }}>Ruby Core</span> — if it or you run out of HP, it&apos;s over.
          </p>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              RUBY CORE
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <span style={{ color: RUBY_COLOR }}>Carry it</span> (WASD movement slows) — enemies only attack you.<br />
              <span style={{ color: '#ffaa00' }}>Place it</span> [E / F] — enemies can target the ruby too.
              Pick it back up by standing next to it and pressing E/F.
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              ABILITIES
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
              <span style={{ color: BOMB_COLOR }}>Q — BOMB:</span> Place; press again to detonate. Bait enemies in!
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              STAR ENERGY ✦ &amp; TELEPORT
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Kill enemies and collect <span style={{ color: '#66aaff' }}>energy crystals</span> to fill your star gauge.
              When full, your next ability is <span style={{ color: '#ffcc00' }}>POWERED UP</span>. Walk onto a{' '}
              <span style={{ color: 'var(--cyan)' }}>✦ teleport pad</span> to jump between chambers.
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              METEORITE ☄
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Every ~30 seconds a chamber is targeted. You have{' '}
              <span style={{ color: 'var(--danger)' }}>5 seconds to escape</span>. Watch the minimap!
              Everything in the struck chamber is destroyed.
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              ENEMIES
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
              <span style={{ color: '#44ee44' }}>■ NORMAL</span> — Standard attacker. Fast and fragile.<br />
              <span style={{ color: '#4488ff' }}>■ ARMORED</span> — Tanky shield unit. Slow but hits hard.<br />
              <span style={{ color: '#ff8844' }}>■ FAST</span> — Extremely quick, 1-shot fragile. Don&apos;t ignore it.<br />
              <span style={{ color: '#cc44ff' }}>■ BOMBER</span> — Self-destructs in a wide blast when it reaches you.
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              CONTROLS
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
              <span style={{ color: 'var(--cyan)' }}>Move:</span> WASD / Arrow keys / Swipe<br />
              <span style={{ color: 'var(--cyan)' }}>Laser:</span> Left click<br />
              <span style={{ color: 'var(--cyan)' }}>Wave:</span> Hold left click (~1s)<br />
              <span style={{ color: 'var(--cyan)' }}>Speed:</span> Shift / R key<br />
              <span style={{ color: 'var(--cyan)' }}>Bomb:</span> Q key (place → press again to detonate)<br />
              <span style={{ color: 'var(--cyan)' }}>Bullet:</span> Right click (fast low-damage laser)<br />
              <span style={{ color: 'var(--cyan)' }}>Ruby carry/place:</span> E or F (pick up within 2 tiles)<br />
              <span style={{ color: 'var(--cyan)' }}>Heal Ruby / Teleport:</span> SPACE (heals if near ruby, teleports if on pad)<br />
              <span style={{ color: 'var(--cyan)' }}>Teleport jump:</span> press 1-4 after opening menu, or ESC to cancel
            </p>
          </div>
        </div>
      </RulesModal>

      {/* God Mode UI */}
      {isGodQuery && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.85)', border: '1px solid #ffcc00',
          padding: '12px', borderRadius: '4px', zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'center' }}>GOD MODE</div>
          <button 
            style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', background: stateRef.current?.godMode ? '#ffcc00' : '#444', color: stateRef.current?.godMode ? '#000' : '#fff', border: 'none', borderRadius: '4px' }}
            onClick={() => {
              if (stateRef.current) stateRef.current.godMode = !stateRef.current.godMode;
              rerender();
            }}>
            Immortal: {stateRef.current?.godMode ? 'ON' : 'OFF'}
          </button>
          <button 
            style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #ffcc00', borderRadius: '4px' }}
            onClick={() => {
              if (stateRef.current) {
                stateRef.current.starEnergy = STAR_ENERGY_MAX;
              }
              rerender();
            }}>
            Full Energy
          </button>
        </div>
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--bar-pad)', flexShrink: 0, gap: '8px',
      }}>
        <BackButton />

        {/* HP bars */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Player HP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: 'var(--font-stat)', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>HP</span>
            {state?.godMode ? (
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--font-score)', color: 'var(--success)' }}>∞</span>
            ) : (
              <div className="battery" style={{ width: 'var(--batt-w)', height: 'var(--batt-h)' }}>
                <div className="battery-fill" style={{ width: `${playerHpPct}%`, background: playerBattColor, boxShadow: `0 0 8px ${playerBattColor}` }} />
                <div className="battery-nub" />
              </div>
            )}
          </div>

          {/* Ruby HP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: 'var(--font-stat)', color: RUBY_COLOR, fontWeight: 700, letterSpacing: '0.1em' }}>
              {carrying ? '◆CARRY' : '◆RUBY'}
            </span>
            {carrying ? (
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.7rem', color: RUBY_COLOR }}>SAFE</span>
            ) : (
              <div className="battery" style={{ width: 'var(--batt-w)', height: 'var(--batt-h)', borderColor: RUBY_COLOR + '99' }}>
                <div className="battery-fill" style={{ width: `${rubyHpPct}%`, background: rubyBattColor, boxShadow: `0 0 8px ${rubyBattColor}` }} />
                <div className="battery-nub" style={{ borderLeftColor: RUBY_COLOR + '66' }} />
              </div>
            )}
            {rubyHealAvail && (
              <span style={{
                fontFamily: 'var(--font-pixel)', fontSize: '0.45rem',
                color: '#ff88aa', textShadow: '0 0 8px #ff1155',
                animation: 'pulseGlow 0.6s ease-in-out infinite',
              }}>SPACE:HEAL</span>
            )}
          </div>

          {/* Star energy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: 'var(--font-stat)', color: powered ? '#ffcc00' : 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.1em',
              textShadow: powered ? '0 0 10px #ffcc00' : 'none' }}>✦</span>
            <div style={{ width: 'var(--batt-w)', height: 'var(--batt-h)', border: `1px solid ${powered ? '#00ffff' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '2px', background: 'rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${energyPct}%`,
                background: powered ? '#ffffff' : 'linear-gradient(90deg, #4488ff, #88ccff)',
                boxShadow: powered ? '0 0 10px #00ffff' : 'none', transition: 'background 0.3s' }} />
              <div style={{ position: 'absolute', right: -2, top: '25%', width: 4, height: '50%',
                background: powered ? '#ffffff' : 'rgba(255,255,255,0.2)', borderRadius: '0 2px 2px 0' }} />
            </div>
          </div>

          {/* Score */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-stat)', color: 'var(--text-dim)', fontWeight: 700 }}>TIME</span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--font-score)', color: 'var(--cyan)' }}>
              {timeSurvived}s
            </span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--font-score)', color: '#ffaa00' }}>
              +{state?.killScore ?? 0}
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isGodQuery && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.7rem', padding: '4px 10px',
                color: state?.godMode ? 'var(--success)' : undefined,
                borderColor: state?.godMode ? 'var(--success)' : undefined }}
              onClick={() => { if (stateRef.current) { stateRef.current.godMode = !stateRef.current.godMode; rerender(); } }}
            >GOD</button>
          )}
          <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '4px 10px' }}
            onClick={() => setShowRules(true)}>? RULES</button>
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

        {/* Teleport overlay */}
        {phase === 'teleporting' && state && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,10,0.82)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) { cancelTeleport(state); rerender(); } }}
          >
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: 'var(--cyan)',
              textShadow: '0 0 16px var(--cyan)', letterSpacing: '0.12em' }}>
              TELEPORT — SELECT CHAMBER
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[0, 1, 2, 3].map(ch => {
                const isCurrentChamber = ch === state.playerChamber;
                const available = state.teleportDestOptions.includes(ch);
                const color = CHAMBER_COLORS[ch];
                return (
                  <button
                    key={ch}
                    className="btn"
                    disabled={!available}
                    style={{
                      fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', padding: '14px 22px',
                      border: `2px solid ${available ? color : 'rgba(255,255,255,0.15)'}`,
                      color: available ? color : 'var(--text-muted)',
                      background: isCurrentChamber ? 'rgba(255,255,255,0.05)' : 'transparent',
                      boxShadow: available ? `0 0 16px ${color}55` : 'none',
                      cursor: available ? 'pointer' : 'default',
                    }}
                    onClick={() => { if (available) { doTeleport(state, ch); rerender(); } }}
                  >
                    [{ch + 1}] {CHAMBER_LABELS[ch]}
                    {isCurrentChamber && (
                      <span style={{ display: 'block', fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '4px' }}>YOU ARE HERE</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '6px 14px' }}
              onClick={() => { cancelTeleport(state); rerender(); }}>
              ESC — STAY
            </button>
          </div>
        )}

        {/* Meteorite warning banner */}
        {phase === 'playing' && (state?.meteoriteWarning ?? -1) >= 0 && (
          <div style={{
            position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(5,0,0,0.9)', border: '2px solid #ff4400',
            boxShadow: '0 0 20px #ff440088',
            borderRadius: '6px', padding: '8px 20px',
            display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'pulseGlow 0.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', color: '#ff4400' }}>
              ☄ METEORITE — {CHAMBER_LABELS[state!.meteoriteWarning]} CHAMBER
            </span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', color: '#ffaa00' }}>
              {Math.ceil((state?.meteoriteStrikeIn ?? 0) / 60)}s
            </span>
          </div>
        )}

        {/* Game over */}
        {phase === 'lost' && (
          <div className="game-over-overlay" style={{ position: 'absolute' }}>
            <div className="game-over-title" style={{ color: 'var(--danger)' }}>RUBY STAR LOST</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 2 }}>
              <div>TIME: <span style={{ color: 'var(--cyan)' }}>{timeSurvived}s</span></div>
              <div>KILLS: <span style={{ color: '#ffaa00' }}>{state?.killScore ?? 0}</span></div>
              <div>PLAYER HP: <span style={{ color: 'var(--danger)' }}>{state?.playerHP ?? 0}/{PLAYER_MAX_HP}</span></div>
              <div>RUBY HP: <span style={{ color: RUBY_COLOR }}>{state?.rubyHP ?? 0}/{RUBY_MAX_HP}</span></div>
            </div>
            <button onClick={handleRestart} className="btn btn-primary">PLAY AGAIN</button>
          </div>
        )}
      </div>

      {/* ── Ability bar (bottom HUD) ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexShrink: 0, height: 'var(--bot-bar-h)',
        borderTop: '2px solid var(--border)', background: 'rgba(0,0,10,0.97)',
      }}>
        {/* Ruby toggle */}
        {abilityBtn(
          carrying ? '◆ CARRY' : '◆ PLACE',
          carrying ? 'HOLDING' : 'PLACED',
          0, true, carrying,
          () => { if (stateRef.current) { toggleCarryRuby(stateRef.current); rerender(); } },
          RUBY_COLOR,
        )}

        {/* Laser */}
        {abilityBtn(
          'LASER',
          laserReady ? (powered ? '★ READY' : 'READY') : `CD`,
          laserReady ? 100 : (1 - (state?.laserCooldown ?? 0) / LASER_COOLDOWN) * 100,
          laserReady, false,
          () => { if (stateRef.current) { useLaser(stateRef.current); rerender(); } },
          laserReady && powered ? '#ffcc00' : undefined,
        )}

        {/* Bullet */}
        {abilityBtn(
          'BULLET',
          (state?.bulletCooldown ?? 0) === 0 ? (powered ? '★ READY' : 'READY') : `CD`,
          (state?.bulletCooldown ?? 0) === 0 ? 100 : (1 - (state?.bulletCooldown ?? 0) / BULLET_COOLDOWN) * 100,
          (state?.bulletCooldown ?? 0) === 0, false,
          () => { if (stateRef.current) { useBullet(stateRef.current); rerender(); } },
          (state?.bulletCooldown ?? 0) === 0 && powered ? '#ffcc00' : undefined,
        )}

        {/* Charge wave */}
        {abilityBtn(
          'WAVE',
          waveReady ? 'HOLD' : 'CD',
          waveReady ? 100 : (1 - (state?.waveCooldown ?? 0) / WAVE_COOLDOWN) * 100,
          waveReady,
          false,
          () => { if (stateRef.current) { activateWave(stateRef.current); rerender(); } },
          waveReady && powered ? '#ffcc00' : waveReady ? '#aaddff' : undefined,
        )}

        {/* Speed */}
        {abilityBtn(
          'SPEED',
          (state?.speedActiveTicks ?? 0) > 0
            ? `${Math.ceil((state?.speedActiveTicks ?? 0) / 60)}s`
            : speedReady ? (powered ? '★ READY' : 'READY') : 'CD',
          speedReady ? 100 : (1 - (state?.speedCooldown ?? 0) / SPEED_COOLDOWN) * 100,
          speedReady, (state?.speedActiveTicks ?? 0) > 0,
          () => { if (stateRef.current) { useSpeedBoost(stateRef.current); rerender(); } },
          (state?.speedActiveTicks ?? 0) > 0 ? '#00ffee' : speedReady && powered ? '#ffcc00' : speedReady ? '#ffee44' : undefined,
        )}

        {/* Bomb */}
        {abilityBtn(
          state?.bomb ? 'DETONATE' : 'BOMB',
          state?.bomb ? '◉ ARMED' : (state?.bombCooldown ?? 0) > 0 ? 'CD' : 'PLACE',
          state?.bomb ? 100 : (state?.bombCooldown ?? 0) > 0
            ? (1 - (state?.bombCooldown ?? 0) / 300) * 100
            : 100,
          bombReady || !!state?.bomb,
          !!state?.bomb,
          () => { if (stateRef.current) { useBomb(stateRef.current); rerender(); } },
          state?.bomb ? '#ff4400' : (state?.bombCooldown ?? 0) > 0 ? 'var(--text-muted)' : powered ? '#ffcc00' : BOMB_COLOR,
        )}
      </div>
    </div>
  );
}
