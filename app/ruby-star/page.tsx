'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import BackButton from '@/components/BackButton';
import RulesModal from '@/components/RulesModal';
import BGMController, { BGMControllerHandle } from '@/components/BGMController';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  T_WALL, T_TELEPORT,
  CHAMBER_BOUNDS, CHAMBER_LABELS, CHAMBER_COLORS,
  chamberOfTile,
  ENEMY_CONFIGS,
  PLAYER_MAX_HP, RUBY_MAX_HP,
  LASER_COOLDOWN,
  STAR_ENERGY_MAX,
  METEORITE_WARNING, BOMB_RADIUS, BOMB_RADIUS_PWR, BULLET_COOLDOWN, BULLET_SPEED,
  HEALER_HEAL_INTERVAL, QUEEN_WINDUP_TICKS, QUEEN_PHASE_TELEGRAPH,
} from './constants';
import {
  GameState, createInitialState, tick,
  useLaser, useBullet, activateWave, useSpeedBoost, useBomb, godSpawnBoss,
  toggleCarryRuby, tryActivateTeleport, doTeleport, cancelTeleport,
  healRuby, canHealRuby, isPlayerChilled, playSFX_charge,
} from './engine';

// ─── Canvas colors ────────────────────────────────────────────────────────────
const BG_COLOR = '#000010';
const RUBY_COLOR = '#ff1155';
const BOMB_COLOR = '#ff6600';
const COOLDOWN_GRAY = '#5a5a66'; // mobile ability buttons dim to this while their ability is on cooldown

// ─── Drawing ──────────────────────────────────────────────────────────────────

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  tickN: number,
  isMobileTouch = false,
) {
  const S = isMobileTouch ? 3 : 4; // px per tile — smaller on mobile, unchanged on desktop
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
      } else if (state.frostIceTiles.some(([itx, ity]) => itx === tx && ity === ty)) {
        ctx.fillStyle = '#aaeeffcc'; // Frost Warden ice hazard tile
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

  // Boss on minimap — huge pulsing dot with glowing core and border
  for (const e of state.enemies) {
    if (e.type === 'fiery_king' || e.type === 'splitter_queen' || e.type === 'storm_reaper' || e.type === 'devourer' || e.type === 'frost_warden') {
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.12));
      const bx = MX + e.tileX * S;
      const by = MY + e.tileY * S;

      // Deep purple for the Queen, cyan for the Reaper (glow matches her own color), the
      // Devourer's dot fills toxic green (her veins) but glows violet (her body color), white
      // glow + light blue fill for the Frost Warden, red for the King
      const colorGlow = e.type === 'splitter_queen' ? '#8800ff' : e.type === 'storm_reaper' ? '#00d4ff' : e.type === 'devourer' ? '#6b2fa8' : e.type === 'frost_warden' ? '#ffffff' : '#ff0033';
      const colorFill = e.type === 'splitter_queen' ? `rgba(136,0,255,${pulse})` : e.type === 'storm_reaper' ? `rgba(0,212,255,${pulse})` : e.type === 'devourer' ? `rgba(136,255,68,${pulse})` : e.type === 'frost_warden' ? `rgba(102,204,255,${pulse})` : `rgba(255,0,34,${pulse})`;

      // Devourer gets an explicit painted violet halo behind her green dot — canvas
      // shadowBlur alone reads too faint to register as purple at this icon size
      if (e.type === 'devourer') {
        ctx.globalAlpha = 0.55 * pulse;
        ctx.fillStyle = '#6b2fa8';
        ctx.fillRect(bx - 7, by - 7, 16, 16);
        ctx.globalAlpha = 1;
      }

      ctx.shadowColor = colorGlow; ctx.shadowBlur = Math.floor(15 * pulse);
      ctx.fillStyle = colorFill;
      ctx.fillRect(bx - 3, by - 3, 8, 8);

      // Inner core is gold for every boss except the Frost Warden, whose icon is white/white-blue
      // through and through — a gold core there read too similar to the Devourer's violet+gold combo
      ctx.fillStyle = e.type === 'frost_warden' ? '#ffffff' : '#ffcc00';
      ctx.fillRect(bx - 1, by - 1, 4, 4);

      ctx.strokeStyle = e.type === 'frost_warden' ? `rgba(255,255,255,${pulse})` : `rgba(255,204,0,${pulse})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 4, by - 4, 10, 10);
      ctx.shadowBlur = 0;
    }
  }

  // Chamber labels on minimap
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelPts = [[10, 10], [39, 10], [10, 39], [39, 39]];
  for (let i = 0; i < 4; i++) {
    const [lx, ly] = labelPts[i];
    ctx.fillStyle = CHAMBER_COLORS[i] + 'cc';
    ctx.fillText(CHAMBER_LABELS[i][0], MX + lx * S + S / 2, MY + ly * S + S / 2);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, sx: number, sy: number, state: GameState, tickN: number, chargingMs = 0) {
  const invincible = state.playerInvincibleTicks > 0;

  const speeding = state.speedActiveTicks > 0;
  const carrying = state.playerCarryingRuby;
  const suitColor = speeding ? '#00ffee' : carrying ? '#ff3366' : '#d8d870';
  const suitDark = speeding ? '#00aaaa' : carrying ? '#aa0033' : '#a0a040';
  const glowColor = speeding ? '#00ffee' : carrying ? '#ff1155' : '#eeee44';
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

  // Gradually shrink to tiny while charging (200ms → full charge collapses to 30%) — full
  // charge takes longer while chilled by a Frost Warden sharing the player's chamber
  const waveChargeMs = isPlayerChilled(state) ? 1500 : 1000;
  const chargeProgress = (chargingMs >= 200 && state.waveCooldown <= 0)
    ? Math.min(1, (chargingMs - 200) / (waveChargeMs - 200))
    : 0;
  const chargeShrink = 1 - chargeProgress * 0.70;
  const scaleFactor = Math.min(laserShrink, chargeShrink, bulletShrink);

  const sz = Math.floor(TILE_SIZE * 0.74 * scaleFactor);
  const h = Math.floor(sz / 2);
  const { playerDirX: dx, playerDirY: dy } = state;

  // Speed burst glow on initial cast
  const speedFlashTicks = state.speedFlashTicks;
  const burstGlow = speedFlashTicks > 0 ? Math.floor(60 * speedFlashTicks / 30) : 0;

  // Outer glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = speeding ? (burstGlow > 0 ? burstGlow : 22) : 14;

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

  if (dx === 1) { vx = sx + h - pad - Math.floor(vh * 0.1) - vh; vy = sy - vw / 2; }
  else if (dx === -1) { vx = sx - h + pad + Math.floor(vh * 0.1); vy = sy - vw / 2; }
  else if (dy === -1) { vx = sx - vw / 2; vy = sy - h + pad + Math.floor(vh * 0.1); }
  else { vx = sx - vw / 2; vy = sy + h - pad - Math.floor(vh * 0.1) - vh; }

  const vwFinal = (dx !== 0) ? vh : vw;
  const vhFinal = (dx !== 0) ? vw : vh;

  ctx.shadowColor = visorColor;
  ctx.shadowBlur = 10;
  ctx.fillStyle = visorColor + 'cc';
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
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - 2, sy - h - antH - 2, 4, 4);
  ctx.shadowBlur = 0;

  // ── Wave charge ring ──────────────────────────────────────────────────
  if (chargingMs >= 40 && state.waveCooldown <= 0) {
    const progress = Math.min(1, chargingMs / waveChargeMs);
    const ringPad = Math.floor(h * (0.15 + progress * 1.6));
    ctx.globalAlpha = 0.15 + 0.7 * progress;
    ctx.strokeStyle = '#00ccff';
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = Math.floor(20 * progress);
    ctx.lineWidth = Math.max(1, Math.floor(4 * progress));
    ctx.strokeRect(sx - h - ringPad, sy - h - ringPad, sz + ringPad * 2, sz + ringPad * 2);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    // Fully charged: fast pulsing second ring
    if (progress >= 0.98) {
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.012));
      ctx.globalAlpha = pulse * 0.6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      const r2 = ringPad * 1.4;
      ctx.strokeRect(sx - h - r2, sy - h - r2, sz + r2 * 2, sz + r2 * 2);
      ctx.globalAlpha = 1;
    }
  }

  // Shield aura when player is invincible (shielder kill buff)
  if (invincible) {
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(tickN * 0.07));
    const shieldPad = Math.floor(h * 0.5);
    ctx.globalAlpha = pulse * 0.75;
    ctx.strokeStyle = '#00ddcc';
    ctx.shadowColor = '#00ffee';
    ctx.shadowBlur = Math.floor(16 * pulse);
    ctx.lineWidth = 3;
    ctx.strokeRect(sx - h - shieldPad, sy - h - shieldPad, sz + shieldPad * 2, sz + shieldPad * 2);
    // Inner thinner ring
    ctx.globalAlpha = pulse * 0.4;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - h - shieldPad + 3, sy - h - shieldPad + 3, sz + (shieldPad - 3) * 2, sz + (shieldPad - 3) * 2);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  // Electric aura when sniper buff is active
  if (state.electricBuffTicks > 0) {
    const ePulse = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.18));
    ctx.globalAlpha = ePulse * 0.6;
    ctx.strokeStyle = '#ffffaa';
    ctx.shadowColor = '#ffff44';
    ctx.shadowBlur = Math.floor(12 * ePulse);
    ctx.lineWidth = 2;
    const eOff = invincible ? Math.floor(h * 0.5) + 5 : Math.floor(h * 0.3);
    ctx.strokeRect(sx - h - eOff, sy - h - eOff, sz + eOff * 2, sz + eOff * 2);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
}

// Blocky diamond shape (like playing card diamond) centered at (cx,cy) fitting in `sz`
function drawPixelDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string) {
  const p = Math.max(2, Math.floor(sz / 10)); // pixel unit
  const rows = 9;   // must be odd for a symmetric diamond
  const mid = Math.floor(rows / 2);
  ctx.fillStyle = color;
  for (let i = 0; i < rows; i++) {
    const dist = Math.abs(i - mid);
    const w = (mid - dist + 1) * 2 * p;
    const x = cx - w / 2;
    const y = cy - mid * p + i * p;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), p);
  }
}

// 8-pointed compass/north star — 4 long cardinal tips, 4 shorter diagonal tips
function drawCompassStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string) {
  const outerR = sz / 2;       // long cardinal tips (N/E/S/W)
  const diagR = sz * 0.28;    // shorter diagonal tips
  const innerR = sz * 0.045;   // tight concave valleys between tips
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const tipAngle = (i * Math.PI / 4) - Math.PI / 2; // start from top (N)
    const tipR = i % 2 === 0 ? outerR : diagR;
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
    [0, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0],
  ];
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c]) ctx.fillRect(ox + c * p, oy + r * p, p, p);
    }
  }
}


function drawRubyGem(ctx: CanvasRenderingContext2D, sx: number, sy: number, tickN: number) {
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.06));
  const sz = Math.floor(TILE_SIZE * 0.68);
  const h = sz / 2;
  const pad = Math.max(2, Math.floor(sz * 0.14));

  // Outer glow box
  ctx.shadowColor = RUBY_COLOR;
  ctx.shadowBlur = Math.floor(20 * pulse);
  ctx.fillStyle = RUBY_COLOR;
  ctx.fillRect(sx - h, sy - h, sz, sz);

  // Inner darker panel
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#880033';
  ctx.fillRect(sx - h + pad, sy - h + pad, sz - pad * 2, sz - pad * 2);

  // Blocky star inside
  ctx.shadowColor = RUBY_COLOR;
  ctx.shadowBlur = Math.floor(14 * pulse);
  drawCompassStar(ctx, sx, sy, sz - pad * 2, '#ff88aa');
  ctx.shadowBlur = 0;

  // Highlight corner
  ctx.fillStyle = '#ffaabb';
  ctx.fillRect(sx - h + pad + 1, sy - h + pad + 1, Math.floor(pad * 0.8), Math.floor(pad * 0.8));
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: ReturnType<typeof createInitialState>['enemies'][0], sx: number, sy: number, tickN: number, shielded = false) {
  const cfg = ENEMY_CONFIGS[e.type];
  const size = Math.floor(TILE_SIZE * cfg.bodyFraction);
  const half = size / 2;
  const pad = Math.max(2, Math.floor(size * 0.12));
  const flash = e.flashTicks > 0;
  // Attack animation: scale up slightly when about to attack (last 15 ticks of cooldown)
  const attacking = e.attackTimer > 0 && e.attackTimer <= 15 && !e.exploding;
  const attackScale = attacking ? (1 + 0.15 * (1 - e.attackTimer / 15)) : 1;
  // Bomber explode animation: gradually swell up as fuse ticks down from 60
  const explodeScale = (e.type === 'bomber' && e.exploding) ? (1 + 0.5 * (1 - Math.max(0, e.explodeTick) / 60)) : 1;
  // Attack-impact animation: punchy bloat-then-squash the instant a hit actually lands (driven by shootTicks,
  // the same timer that drives the per-type attack-projectile visuals), decaying back to normal size.
  const impactMax = (e.type === 'sniper' || e.type === 'fiery_king') ? 22 : 14;
  const impactT = e.shootTicks > 0 ? 1 - e.shootTicks / impactMax : 1;
  const impactScale = e.shootTicks > 0 ? 1 + 0.35 * Math.exp(-impactT * 4) * Math.cos(impactT * Math.PI * 2.2) : 1;
  const drawSz = Math.floor(size * attackScale * explodeScale * impactScale);
  const drawH = drawSz / 2;
  const color = flash ? '#ffffff' : cfg.color;

  // Heal aura — pink glow ring pulsing outward when a healer's pulse just landed on this enemy
  if (e.healFlashTicks > 0) {
    const hProgress = e.healFlashTicks / 20; // 1 -> 0
    const auraSz = drawSz + 8 + 16 * (1 - hProgress);
    const auraH = auraSz / 2;
    ctx.save();
    ctx.globalAlpha = hProgress * 0.85;
    ctx.shadowColor = '#ff44cc';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#ff77dd';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx - auraH, sy - auraH, auraSz, auraSz);
    ctx.restore();
  }

  // Glow — brightens during attack wind-up
  ctx.shadowColor = e.exploding ? '#ff4400' : color;
  ctx.shadowBlur = e.exploding ? (14 + 6 * Math.abs(Math.sin(tickN * 0.3)))
    : attacking ? (16 + 8 * (1 - e.attackTimer / 15))
      : 8;

  // ── Boss: fully custom draw ───────────────────────────────────────────
  if (e.type === 'fiery_king') {
    const bSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const bH = bSz / 2;
    const bPad = Math.max(3, Math.floor(bSz * 0.10));
    const pulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.06));
    const hpPct = e.hp / e.maxHp;
    const bFlash = e.flashTicks > 0;
    const bodyColor = bFlash ? '#ffffff' : '#cc0022';

    // Outer crimson glow
    ctx.shadowColor = '#ff0033'; ctx.shadowBlur = Math.floor(22 * pulse);

    // Shoulder spikes (left and right) - they extend further during attack
    const spikeW = Math.max(4, Math.floor(bSz * 0.18));
    const spikeH = Math.max(6, Math.floor(bSz * (attacking ? 0.50 : 0.30)));
    ctx.fillStyle = bFlash ? '#ffffff' : '#880011';
    ctx.fillRect(sx - bH - spikeW, sy - Math.floor(spikeH * 0.6), spikeW, spikeH); // left spike
    ctx.fillRect(sx + bH, sy - Math.floor(spikeH * 0.6), spikeW, spikeH); // right spike
    // Spike tips (gold)
    ctx.fillStyle = bFlash ? '#ffffff' : '#ffcc00';
    ctx.fillRect(sx - bH - spikeW - 2, sy - Math.floor(spikeH * 0.6), 3, 3);
    ctx.fillRect(sx + bH + spikeW, sy - Math.floor(spikeH * 0.6), 3, 3);

    // Main body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx - bH, sy - bH, bSz, bSz);
    ctx.shadowBlur = 0;

    // Inner armor plate (dark inset)
    if (!bFlash) {
      ctx.fillStyle = '#550011';
      ctx.fillRect(sx - bH + bPad, sy - bH + bPad, bSz - bPad * 2, bSz - bPad * 2);
      // Gold cross/X armor detail
      ctx.fillStyle = '#ffcc0088';
      const cx = bSz - bPad * 2, gH = Math.max(1, Math.floor(bSz * 0.07));
      ctx.fillRect(sx - bH + bPad, sy - Math.floor(gH / 2), cx, gH); // horizontal bar
      ctx.fillRect(sx - Math.floor(gH / 2), sy - bH + bPad, gH, cx); // vertical bar

      // Corner rivet studs — small gold rivets bolting the armor plate, one per corner
      const rivetSz = Math.max(2, Math.floor(bSz * 0.07));
      const rivetInset = bPad + Math.floor(rivetSz * 0.8);
      ctx.fillStyle = '#ffcc00cc';
      for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) {
        ctx.fillRect(sx + ox * (bH - rivetInset) - rivetSz / 2, sy + oy * (bH - rivetInset) - rivetSz / 2, rivetSz, rivetSz);
      }
    }

    // Crown (5 spikes on top)
    if (!bFlash) {
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 8;
      const crownW = bSz;
      const crownX = sx - bH;
      const crownBase = sy - bH;
      const crownH = Math.max(5, Math.floor(bSz * (attacking ? 0.35 : 0.22)));
      // 5 alternating-height spikes: tall, short, tall, short, tall
      const spW = Math.floor(crownW / 5);
      const heights = [crownH, Math.floor(crownH * 0.55), crownH, Math.floor(crownH * 0.55), crownH];
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(crownX + i * spW, crownBase - heights[i], spW - 1, heights[i]);
      }
      ctx.shadowBlur = 0;

      // Twinkling ruby gem set into the center spike tip — a "living jewel" like the Queen's
      const gemTwinkle = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.09));
      ctx.shadowColor = '#ff0033'; ctx.shadowBlur = Math.floor(8 * gemTwinkle);
      ctx.fillStyle = `rgba(255,51,102,${gemTwinkle})`;
      ctx.fillRect(sx - 2, crownBase - heights[2] - 3, 4, 4);
      ctx.shadowBlur = 0;
    }

    // 4 eyes (2 rows of 2)
    if (!bFlash) {
      const eSz = Math.max(3, Math.floor(bSz * 0.16));
      const pSz = Math.max(2, Math.floor(eSz * 0.6));
      const ex1 = sx - bH + bPad + 2;
      const ex2 = sx + bH - bPad - eSz - 2;
      const ey1 = sy - bH + bPad + 2;
      const ey2 = ey1 + eSz + 3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, ey1, eSz, eSz); ctx.fillRect(ex2, ey1, eSz, eSz);
      ctx.fillRect(ex1, ey2, eSz, eSz); ctx.fillRect(ex2, ey2, eSz, eSz);
      // Eyes glow yellow when attacking
      ctx.fillStyle = attacking ? '#ffcc00' : '#ff0000';
      ctx.shadowColor = attacking ? '#ffcc00' : '#ff0000'; ctx.shadowBlur = attacking ? 12 : 6;
      ctx.fillRect(ex1 + 1, ey1 + 1, pSz, pSz); ctx.fillRect(ex2 + 1, ey1 + 1, pSz, pSz);
      ctx.fillRect(ex1 + 1, ey2 + 1, pSz, pSz); ctx.fillRect(ex2 + 1, ey2 + 1, pSz, pSz);
      ctx.shadowBlur = 0;

      // Wide jagged mouth with teeth
      const mW = Math.max(8, Math.floor(bSz * 0.70));
      const mH = Math.max(2, Math.floor(bSz * (attacking ? 0.18 : 0.10)));
      const mX = sx - Math.floor(mW / 2);
      const mY = ey2 + eSz + 3 + (attacking ? 4 : 0); // Drop jaw slightly when attacking
      const toothW = Math.max(2, Math.floor(mW / 6));
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(mX, mY, mW, mH);
      ctx.fillStyle = '#ffffff';
      for (let t = 0; t < 5; t++) {
        ctx.fillRect(mX + toothW * t + 1, mY - mH, Math.max(1, toothW - 2), mH + 1);
      }
    }

    // HP bar above boss
    const barW = bSz + 10;
    const barH = 4;
    const barX = sx - Math.floor(barW / 2);
    const barY = sy - bH - 16;
    ctx.fillStyle = '#440000';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#ff2222' : hpPct > 0.25 ? '#ff8800' : '#ffff00';
    ctx.fillRect(barX, barY, Math.floor(barW * hpPct), barH);
    ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Ground-fire glow — a warm pulsing wash beneath him, like he's standing over embers
    const groundPulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.08));
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = Math.floor(20 * groundPulse);
    ctx.fillStyle = `rgba(255,68,0,${0.25 * groundPulse})`;
    ctx.fillRect(sx - bH - 6, sy + bH - 4, bSz + 12, 10);
    ctx.shadowBlur = 0;

    // Orange fiery aura — a guttering flame-outline around his whole body, jittering in size/
    // brightness like unstable heat haze rather than the Queen's smooth magic-breathing pulse
    const auraFlicker = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.5) * Math.sin(tickN * 0.23 + 1));
    const fAuraR = bH + 8 + Math.floor(6 * auraFlicker);
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = Math.floor(14 * auraFlicker);
    ctx.strokeStyle = `rgba(255,${120 + Math.floor(60 * auraFlicker)},0,${0.35 + 0.25 * auraFlicker})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - fAuraR, sy - fAuraR, fAuraR * 2, fAuraR * 2);
    ctx.shadowBlur = 0;

    // Rising embers — sparks kicking off his body and drifting upward, flickering out like real
    // cinders off a flame (not orbiting him — fire doesn't circle, it rises and dies)
    const emberCount = 14;
    for (let m = 0; m < emberCount; m++) {
      const cycle = 60 + (m % 3) * 15; // varied lifespans so they don't pulse in lockstep
      const phase = (tickN + m * (cycle / emberCount) * 5.3) % cycle;
      const riseT = phase / cycle; // 0 (spawn, at his base) -> 1 (fully risen, faded out)
      const jitterX = Math.sin(tickN * 0.22 + m * 2.1) * (bH * 0.7);
      const ex = sx + jitterX * riseT;
      const ey = sy + bH - riseT * (bSz + 22);
      const emberSz = Math.max(1, 4 - Math.floor(riseT * 2.5));
      const emberAlpha = Math.sin(riseT * Math.PI); // fades in, peaks mid-rise, fades out
      ctx.globalAlpha = emberAlpha;
      ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10;
      ctx.fillStyle = riseT < 0.4 ? '#ffee00' : riseT < 0.7 ? '#ff8800' : '#ff3300';
      ctx.fillRect(ex - emberSz / 2, ey - emberSz / 2, emberSz, emberSz);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Flickering flame licks — shoulder spike tips (bigger/brighter) plus the crown peak,
    // an actual guttering-fire flicker rather than a steady glow
    const flicker1 = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.45));
    const flicker2 = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.45 + 1.3));
    const flicker3 = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.5 + 2.4));
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = Math.floor(16 * flicker1);
    ctx.fillStyle = `rgba(255,${140 + Math.floor(90 * flicker1)},0,${0.75 + 0.25 * flicker1})`;
    ctx.fillRect(sx - bH - spikeW - 2, sy - Math.floor(spikeH * 0.6) - 5, 7, 6);
    ctx.shadowBlur = Math.floor(16 * flicker2);
    ctx.fillStyle = `rgba(255,${140 + Math.floor(90 * flicker2)},0,${0.75 + 0.25 * flicker2})`;
    ctx.fillRect(sx + bH + spikeW - 3, sy - Math.floor(spikeH * 0.6) - 5, 7, 6);
    ctx.shadowBlur = Math.floor(14 * flicker3);
    ctx.fillStyle = `rgba(255,${150 + Math.floor(80 * flicker3)},0,${0.7 + 0.3 * flicker3})`;
    ctx.fillRect(sx - 3, sy - bH - Math.floor(bSz * 0.30) - 6, 6, 6);
    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // ── Storm Reaper: fully custom draw (sleek angular striker, electric theme —
  // no crown/tiara since she's a rogue, not royalty like the King/Queen) ──
  if (e.type === 'storm_reaper') {
    const rSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const rH = rSz / 2;
    const pulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.14)); // faster restless pulse than King/Queen
    const hpPct = e.hp / e.maxHp;
    const rFlash = e.flashTicks > 0;
    const bodyColor = rFlash ? '#ffffff' : '#00c8e0';

    // Motion streak — a couple of faded afterimage copies trailing behind her movement,
    // selling speed the way King's embers sell heat and Queen's motes sell magic.
    if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
      const mdx = e.targetTileX - e.tileX, mdy = e.targetTileY - e.tileY;
      for (let i = 1; i <= 2; i++) {
        ctx.save();
        ctx.globalAlpha = 0.14 / i;
        ctx.fillStyle = '#00eaff';
        ctx.translate(sx - mdx * i * 8, sy - mdy * i * 8);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-rH * 0.7, -rH * 0.7, rH * 1.4, rH * 1.4);
        ctx.restore();
      }
    }

    // Ground electric crackle — a pulsing wash beneath her, boss-scale presence like
    // King's ground-fire glow / Queen's idle aura (she previously had no ambient ground FX)
    const groundPulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.16));
    ctx.shadowColor = '#00eaff'; ctx.shadowBlur = Math.floor(18 * groundPulse);
    ctx.fillStyle = `rgba(0,234,255,${0.22 * groundPulse})`;
    ctx.fillRect(sx - rH - 6, sy + rH - 4, rSz + 12, 10);
    ctx.shadowBlur = 0;

    // Outer soft halo — big, always-on aura ring so she reads as boss-scale even at rest
    ctx.save();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.strokeStyle = '#00eaff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00eaff'; ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(sx, sy, rH * 1.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Outer electric glow
    ctx.shadowColor = '#00eaff'; ctx.shadowBlur = Math.floor(20 * pulse);

    // Blade fins — angular and sharp, unlike King's blocky spikes or Queen's rounded epaulettes
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = rFlash ? '#ffffff' : '#008fa8';
    const finLen = rH * (attacking ? 1.6 : 1.25);
    ctx.beginPath();
    ctx.moveTo(-rH * 0.5, -rH * 0.3);
    ctx.lineTo(-finLen, 0);
    ctx.lineTo(-rH * 0.5, rH * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rH * 0.5, -rH * 0.3);
    ctx.lineTo(finLen, 0);
    ctx.lineTo(rH * 0.5, rH * 0.3);
    ctx.closePath();
    ctx.fill();

    // Backswept horn spikes — her equivalent of a crown/tiara silhouette, but angular
    ctx.fillStyle = rFlash ? '#ffffff' : '#00c8e0';
    ctx.beginPath();
    ctx.moveTo(-rH * 0.35, -rH * 0.55);
    ctx.lineTo(-rH * 0.7, -rH * 1.25);
    ctx.lineTo(-rH * 0.12, -rH * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rH * 0.35, -rH * 0.55);
    ctx.lineTo(rH * 0.7, -rH * 1.25);
    ctx.lineTo(rH * 0.12, -rH * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Diamond core body (rotated square)
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-rH * 0.72, -rH * 0.72, rH * 1.44, rH * 1.44);
    ctx.shadowBlur = 0;
    if (!rFlash) {
      ctx.fillStyle = '#003844';
      ctx.fillRect(-rH * 0.5, -rH * 0.5, rH, rH);
      // Diagonal circuit-line detail across the inset plate — reads as tech/armor, not skin
      ctx.strokeStyle = '#00eaff88'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-rH * 0.5, 0); ctx.lineTo(0, -rH * 0.5);
      ctx.moveTo(0, rH * 0.5); ctx.lineTo(rH * 0.5, 0);
      ctx.stroke();
    }
    ctx.restore();

    // Glowing white slit eyes
    if (!rFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
      ctx.fillRect(sx - rH * 0.28, sy - rH * 0.12, rH * 0.16, rH * 0.24);
      ctx.fillRect(sx + rH * 0.12, sy - rH * 0.12, rH * 0.16, rH * 0.24);
      ctx.shadowBlur = 0;
    }

    // Crackling electric arcs orbiting her at a distance — jagged zigzag bolts
    const arcCount = 5;
    for (let i = 0; i < arcCount; i++) {
      const ang = tickN * 0.1 + (Math.PI * 2 * i) / arcCount;
      const orbitR = rH + 12;
      const ax = sx + Math.cos(ang) * orbitR;
      const ay = sy + Math.sin(ang) * orbitR;
      ctx.strokeStyle = `rgba(180,255,255,${0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.3 + i))})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#aefcff'; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(ax - 3, ay - 3);
      ctx.lineTo(ax + 2, ay);
      ctx.lineTo(ax - 2, ay + 2);
      ctx.lineTo(ax + 3, ay + 5);
      ctx.stroke();
    }

    // Close-in body sparks — quick jittering micro-bolts crackling right off her silhouette,
    // denser and closer than the orbiting arcs, refreshed every frame for a "live wire" feel
    for (let i = 0; i < 4; i++) {
      const sparkAng = Math.random() * Math.PI * 2;
      const r1 = rH * (0.5 + Math.random() * 0.3);
      const r2 = r1 + 4 + Math.random() * 5;
      ctx.strokeStyle = `rgba(255,255,255,${0.4 + Math.random() * 0.4})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(sparkAng) * r1, sy + Math.sin(sparkAng) * r1);
      ctx.lineTo(sx + Math.cos(sparkAng) * r2, sy + Math.sin(sparkAng) * r2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // HP bar above her
    const rBarW = rSz + 10;
    const rBarH = 4;
    const rBarX = sx - Math.floor(rBarW / 2);
    const rBarY = sy - rH - 16;
    ctx.fillStyle = '#003340';
    ctx.fillRect(rBarX, rBarY, rBarW, rBarH);
    ctx.fillStyle = hpPct > 0.5 ? '#00eaff' : hpPct > 0.25 ? '#ff8800' : '#ffff00';
    ctx.fillRect(rBarX, rBarY, Math.floor(rBarW * hpPct), rBarH);
    ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1;
    ctx.strokeRect(rBarX, rBarY, rBarW, rBarH);

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // ── Devourer: fully custom draw (blocky, matching the rest of the game's pixel-art
  // language — grows via literal fused blocks stuck to her body, not organic curves) ──
  if (e.type === 'devourer') {
    const stacks = e.chargeDirX; // absorb-stack counter, reused from the charger's unused field
    const stackGrowth = 1 + stacks * 0.06;
    const vSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale * stackGrowth);
    const vH = vSz / 2;
    const vPad = Math.max(3, Math.floor(vSz * 0.10));
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.09));
    const hpPct = e.hp / e.maxHp;
    const vFlash = e.flashTicks > 0;
    const vHealFlash = e.healFlashTicks > 0; // pulses brightly right when she absorbs something
    const bodyColor = vFlash ? '#ffffff' : vHealFlash ? '#c8a0ff' : '#6b2fa8';

    // Big absorb shockwave — blocky expanding square ring, the moment she eats
    if (vHealFlash) {
      const shockProgress = 1 - e.healFlashTicks / 26; // 0 -> 1
      ctx.save();
      ctx.globalAlpha = 1 - shockProgress;
      ctx.shadowColor = '#c8ff88'; ctx.shadowBlur = 24;
      const ringSz1 = vSz * (1 + shockProgress * 2.2);
      ctx.strokeStyle = '#88ff44'; ctx.lineWidth = 5;
      ctx.strokeRect(sx - ringSz1 / 2, sy - ringSz1 / 2, ringSz1, ringSz1);
      const ringSz2 = vSz * (0.7 + shockProgress * 1.8);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.strokeRect(sx - ringSz2 / 2, sy - ringSz2 / 2, ringSz2, ringSz2);
      ctx.restore();
      ctx.shadowBlur = 0;
    }

    // Always-on violet aura ring — matches her minimap glow, gives her the same idle
    // presence the other three bosses have (King's ground-fire, Queen's motes, Reaper's halo)
    ctx.save();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.strokeStyle = '#6b2fa8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#6b2fa8'; ctx.shadowBlur = 18;
    ctx.strokeRect(sx - vH * 1.5, sy - vH * 1.5, vH * 3, vH * 3);
    ctx.restore();

    // Orbiting spore particles — blocky squares drifting around her, the persistent
    // "consuming aura" tell she was missing (King has embers, Queen has motes, Reaper has arcs)
    const sporeCount = 5;
    for (let i = 0; i < sporeCount; i++) {
      const ang = tickN * 0.025 + (Math.PI * 2 * i) / sporeCount;
      const orbitR = vH + 10 + 3 * Math.sin(tickN * 0.06 + i);
      const spx = sx + Math.cos(ang) * orbitR;
      const spy = sy + Math.sin(ang) * orbitR;
      const sporeAlpha = 0.5 + 0.4 * Math.abs(Math.sin(tickN * 0.1 + i * 1.3));
      ctx.fillStyle = i % 2 === 0 ? `rgba(136,255,68,${sporeAlpha})` : `rgba(107,47,168,${sporeAlpha})`;
      ctx.shadowColor = '#88ff44'; ctx.shadowBlur = 5;
      ctx.fillRect(spx - 2, spy - 2, 4, 4);
    }
    ctx.shadowBlur = 0;

    // Ground corruption pool — a sickly wash beneath her, bigger with more stacks
    ctx.shadowColor = '#88ff44'; ctx.shadowBlur = Math.floor(16 * pulse);
    ctx.fillStyle = `rgba(107,47,168,${0.22 * pulse})`;
    ctx.fillRect(sx - vH - 6, sy + vH - 4, vSz + 12, 10);
    ctx.shadowBlur = 0;

    // Blocky side + top spikes (same construction as the King's shoulder spikes) —
    // grow a little longer with more stacks
    const spikeW = Math.max(4, Math.floor(vSz * 0.16));
    const spikeH = Math.max(6, Math.floor(vSz * (0.22 + Math.min(stacks, 6) * 0.025)));
    ctx.fillStyle = vFlash ? '#ffffff' : '#4a1a5c';
    ctx.fillRect(sx - vH - spikeW, sy - Math.floor(spikeH * 0.5), spikeW, spikeH);
    ctx.fillRect(sx + vH, sy - Math.floor(spikeH * 0.5), spikeW, spikeH);
    ctx.fillRect(sx - Math.floor(spikeW / 2), sy - vH - spikeH, spikeW, spikeH);

    // Main blocky body
    ctx.shadowColor = '#88ff44'; ctx.shadowBlur = Math.floor(18 * pulse);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx - vH, sy - vH, vSz, vSz);
    ctx.shadowBlur = 0;

    if (!vFlash) {
      // Inner dark armor plate inset, like the King's
      ctx.fillStyle = '#2a0a3a';
      ctx.fillRect(sx - vH + vPad, sy - vH + vPad, vSz - vPad * 2, vSz - vPad * 2);

      // Fused chunks — small square blocks stuck around her edges, one per absorb stack
      // (capped at 8 positions), the "consumed ally fragments" tell
      ctx.fillStyle = '#4a1a5c';
      const chunkPositions: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
      const chunkCount = Math.min(stacks, chunkPositions.length);
      for (let i = 0; i < chunkCount; i++) {
        const [ox, oy] = chunkPositions[i];
        const csz = 6;
        ctx.fillRect(sx + ox * vH * 0.95 - csz / 2, sy + oy * vH * 0.95 - csz / 2, csz, csz);
      }

      // Circuit-line veins — blocky right-angle segments, not smooth radiating lines
      ctx.strokeStyle = `rgba(136,255,68,${0.5 + 0.4 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#88ff44'; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(sx - vH * 0.5, sy); ctx.lineTo(sx, sy); ctx.lineTo(sx, sy - vH * 0.5);
      ctx.moveTo(sx + vH * 0.5, sy); ctx.lineTo(sx, sy); ctx.lineTo(sx, sy + vH * 0.5);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Blocky square eye
      ctx.fillStyle = '#c8ff88';
      ctx.shadowColor = '#c8ff88'; ctx.shadowBlur = 8;
      ctx.fillRect(sx - vH * 0.18, sy - vH * 0.35, vH * 0.36, vH * 0.26);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a3300';
      ctx.fillRect(sx - vH * 0.08, sy - vH * 0.28, vH * 0.16, vH * 0.14);

      // Jagged blocky maw beneath the eye — widens open right before/during a bite
      const mawOpen = attacking ? 0.55 : 0.18;
      ctx.fillStyle = '#1a0526';
      ctx.fillRect(sx - vH * 0.45, sy + vH * 0.1, vH * 0.9, vH * mawOpen + 4);
      ctx.fillStyle = '#c8ff88';
      for (const txp of [-0.32, -0.1, 0.1, 0.32]) {
        ctx.fillRect(sx + txp * vH - 2, sy + vH * 0.1, 4, 6);
      }
    }

    // Absorb-stack counter, small text above the HP bar
    ctx.font = '9px monospace';
    ctx.fillStyle = '#c8ff88';
    ctx.textAlign = 'center';
    ctx.fillText(`x${stacks}`, sx, sy - vH - 20);
    ctx.textAlign = 'left';

    // HP bar above her
    const vBarW = vSz + 10;
    const vBarH = 4;
    const vBarX = sx - Math.floor(vBarW / 2);
    const vBarY = sy - vH - 14;
    ctx.fillStyle = '#2a0a3a';
    ctx.fillRect(vBarX, vBarY, vBarW, vBarH);
    ctx.fillStyle = hpPct > 0.5 ? '#88ff44' : hpPct > 0.25 ? '#ff8800' : '#ffff00';
    ctx.fillRect(vBarX, vBarY, Math.floor(vBarW * hpPct), vBarH);
    ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1;
    ctx.strokeRect(vBarX, vBarY, vBarW, vBarH);

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // ── Frost Warden: fully custom draw (icy blocky theme — crystalline crown, frosty aura,
  // matches the game's rectangle-based sprite style like the rest of the bosses) ──
  if (e.type === 'frost_warden') {
    const wSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const wH = wSz / 2;
    const wPad = Math.max(3, Math.floor(wSz * 0.10));
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.08));
    const hpPct = e.hp / e.maxHp;
    const wFlash = e.flashTicks > 0;
    const bodyColor = wFlash ? '#ffffff' : '#aaeeff';

    // Always-on white aura ring — the idle presence tell the other bosses have
    ctx.save();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 18;
    ctx.strokeRect(sx - wH * 1.55, sy - wH * 1.55, wH * 3.1, wH * 3.1);
    ctx.restore();

    // Frosty ground mist — pale blue wash beneath her
    ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = Math.floor(16 * pulse);
    ctx.fillStyle = `rgba(170,238,255,${0.2 * pulse})`;
    ctx.fillRect(sx - wH - 6, sy + wH - 4, wSz + 12, 10);
    ctx.shadowBlur = 0;

    // Orbiting ice shards — angular crystal shapes, not just dots, riding a wider orbit
    const shardCount = 6;
    for (let i = 0; i < shardCount; i++) {
      const ang = tickN * 0.02 + (Math.PI * 2 * i) / shardCount;
      const orbitR = wH + 18 + 5 * Math.sin(tickN * 0.05 + i);
      const mx = sx + Math.cos(ang) * orbitR;
      const my = sy + Math.sin(ang) * orbitR * 0.65;
      const shardAlpha = 0.5 + 0.4 * Math.abs(Math.sin(tickN * 0.1 + i));
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(ang + tickN * 0.04);
      ctx.fillStyle = `rgba(255,255,255,${shardAlpha})`;
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(0, -5); ctx.lineTo(3, 0); ctx.lineTo(0, 5); ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 0;

    // Continuous frost breath — small drifting mist puffs rising off her, like the
    // Devourer's drips but rising instead of falling
    if (Math.random() < 0.35) {
      const puffAng = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sx + Math.cos(puffAng) * wH * 0.5, sy + Math.sin(puffAng) * wH * 0.9 - 6, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Heavy snowfall — a wide field of small falling flakes constantly drifting down around
    // her, index-phased off tickN so it's dense and continuous without needing particle state
    const snowCount = 28;
    const snowField = wH * 2.6;
    for (let i = 0; i < snowCount; i++) {
      const seedX = ((i * 53 + 7) % 97) / 97 - 0.5; // stable pseudo-random x per flake
      const speed = 0.4 + (i % 5) * 0.15;
      const fallCycle = 140 + (i % 7) * 10;
      const fallT = ((tickN * speed + i * 31) % fallCycle) / fallCycle; // 0 -> 1 falling
      const sway = Math.sin(tickN * 0.05 + i) * 4;
      const fx = sx + seedX * snowField + sway;
      const fy = sy - wH * 1.8 + fallT * wH * 3.6;
      const fadeIn = Math.min(1, fallT * 6);
      const fadeOut = Math.min(1, (1 - fallT) * 6);
      ctx.globalAlpha = Math.min(fadeIn, fadeOut) * 0.85;
      ctx.fillStyle = i % 4 === 0 ? '#ffffff' : '#cceeff';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 3;
      const flakeSz = 1.5 + (i % 3);
      ctx.fillRect(fx - flakeSz / 2, fy - flakeSz / 2, flakeSz, flakeSz);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Icicle side spikes (mirrors King's shoulder-spike construction, angular icy tone)
    const spikeW = Math.max(4, Math.floor(wSz * 0.16));
    const spikeH = Math.max(6, Math.floor(wSz * 0.28));
    ctx.fillStyle = wFlash ? '#ffffff' : '#eaffff';
    ctx.fillRect(sx - wH - spikeW, sy - Math.floor(spikeH * 0.5), spikeW, spikeH);
    ctx.fillRect(sx + wH, sy - Math.floor(spikeH * 0.5), spikeW, spikeH);

    // Main blocky body
    ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = Math.floor(18 * pulse);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx - wH, sy - wH, wSz, wSz);
    ctx.shadowBlur = 0;

    if (!wFlash) {
      // Inner frosted plate
      ctx.fillStyle = '#dff7ff';
      ctx.fillRect(sx - wH + wPad, sy - wH + wPad, wSz - wPad * 2, wSz - wPad * 2);

      // Frost-crack lines across the plate — blocky right-angle segments like the Devourer's
      // circuit veins, but icy, selling "she's made of ice, not flesh"
      ctx.strokeStyle = `rgba(0,136,170,${0.5 + 0.3 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx - wH * 0.5, sy - wH * 0.3); ctx.lineTo(sx - wH * 0.15, sy - wH * 0.3); ctx.lineTo(sx - wH * 0.15, sy + wH * 0.2);
      ctx.moveTo(sx + wH * 0.5, sy - wH * 0.3); ctx.lineTo(sx + wH * 0.15, sy - wH * 0.3); ctx.lineTo(sx + wH * 0.15, sy + wH * 0.2);
      ctx.stroke();

      // Crystalline crown — 5 angular icicle spikes on top (bigger/denser than before), her
      // "royal" tell distinct from the King's gold crown and Queen's tiara
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
      for (const cx2 of [-0.42, -0.2, 0, 0.2, 0.42]) {
        const spH = cx2 === 0 ? wH * 0.65 : Math.abs(cx2) === 0.2 ? wH * 0.5 : wH * 0.32;
        ctx.beginPath();
        ctx.moveTo(sx + cx2 * wSz - 3, sy - wH);
        ctx.lineTo(sx + cx2 * wSz, sy - wH - spH);
        ctx.lineTo(sx + cx2 * wSz + 3, sy - wH);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Blocky glowing eyes
      ctx.fillStyle = '#0088aa';
      ctx.shadowColor = '#0088aa'; ctx.shadowBlur = 6;
      ctx.fillRect(sx - wH * 0.3, sy - wH * 0.1, wH * 0.18, wH * 0.22);
      ctx.fillRect(sx + wH * 0.12, sy - wH * 0.1, wH * 0.18, wH * 0.22);
      ctx.shadowBlur = 0;
    }

    // Ice shield — a slowly-rotating double hexagonal crystal barrier encasing her, drawn
    // OVER her fully-built body (not before it) so every layer is actually visible instead
    // of being painted over by her opaque body fill.
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(tickN * 0.008);
    const shieldR = wH * 1.3;
    const hexPoints: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const hAng = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      hexPoints.push([Math.cos(hAng) * shieldR, Math.sin(hAng) * shieldR]);
    }
    // Outermost hazy glow layer (opacity dialed down — the elaborate shape reads fine
    // without being as bright/loud as the first pass)
    ctx.globalAlpha = 0.14 + 0.08 * pulse;
    ctx.strokeStyle = '#aaeeff';
    ctx.lineWidth = 18;
    ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = 24;
    ctx.beginPath();
    hexPoints.forEach(([hx, hy], i) => i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy));
    ctx.closePath();
    ctx.stroke();
    // Thick mid layer
    ctx.globalAlpha = 0.25 + 0.14 * pulse;
    ctx.strokeStyle = '#66ccff';
    ctx.lineWidth = 10;
    ctx.shadowBlur = 16;
    ctx.stroke();
    // Bright core layer
    ctx.globalAlpha = 0.4 + 0.17 * pulse;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.shadowBlur = 10;
    ctx.stroke();
    // Gem-cut facet lines from each vertex to center — sells "crystal", not just a ring
    ctx.globalAlpha = 0.17 + 0.08 * pulse;
    ctx.strokeStyle = '#cceeff';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (const [hx, hy] of hexPoints) { ctx.moveTo(0, 0); ctx.lineTo(hx, hy); }
    ctx.stroke();
    // Counter-rotating inner hexagon layer for depth
    ctx.rotate(-tickN * 0.016);
    ctx.globalAlpha = 0.2 + 0.11 * pulse;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const hAng = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const hx = Math.cos(hAng) * shieldR * 0.6, hy = Math.sin(hAng) * shieldR * 0.6;
      if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.rotate(tickN * 0.016);
    // Corner glints on the outer shield vertices
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.5;
    ctx.shadowBlur = 6;
    for (const [hx, hy] of hexPoints) {
      ctx.fillRect(hx - 2.5, hy - 2.5, 5, 5);
    }
    ctx.restore();
    ctx.shadowBlur = 0;

    // Saturn-style ring — a thick, tilted, blocky halo encircling her (chunky rect segments
    // along a flattened ellipse, not a smooth stroke, to match the pixel-art construction)
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(0.25); // fixed tilt, like Saturn's rings
    const ringRx = wH * 2.0, ringRy = wH * 0.55;
    const ringSegs = 20;
    const ringPulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.05));
    for (let i = 0; i < ringSegs; i++) {
      const rAng = tickN * 0.012 + (Math.PI * 2 * i) / ringSegs;
      const rx = Math.cos(rAng) * ringRx, ry = Math.sin(rAng) * ringRy;
      const segW = 10, segH = 6;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(rAng + Math.PI / 2);
      ctx.globalAlpha = (0.5 + 0.35 * ringPulse) * (i % 2 === 0 ? 1 : 0.7);
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#aaeeff';
      ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = 8;
      ctx.fillRect(-segW / 2, -segH / 2, segW, segH);
      ctx.restore();
    }
    ctx.restore();
    ctx.shadowBlur = 0;

    // Ice-shard particles orbiting along the shield's edge — denser now, with trailing streaks
    const shieldSparkCount = 12;
    for (let i = 0; i < shieldSparkCount; i++) {
      const sAng = tickN * 0.022 + (Math.PI * 2 * i) / shieldSparkCount;
      const orbR = shieldR * (1.05 + 0.06 * Math.sin(tickN * 0.05 + i));
      const sx2 = sx + Math.cos(sAng) * orbR;
      const sy2 = sy + Math.sin(sAng) * orbR;
      const sparkAlpha = 0.5 + 0.4 * Math.abs(Math.sin(tickN * 0.12 + i * 1.6));
      // trailing streak toward where the spark came from
      const trailAng = sAng - 0.15;
      const tx2 = sx + Math.cos(trailAng) * orbR, ty2 = sy + Math.sin(trailAng) * orbR;
      ctx.strokeStyle = `rgba(170,238,255,${sparkAlpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx2, ty2); ctx.lineTo(sx2, sy2); ctx.stroke();
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : `rgba(255,255,255,${sparkAlpha})`;
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
      ctx.fillRect(sx2 - 2, sy2 - 2, 4, 4);
    }
    ctx.shadowBlur = 0;

    // HP bar above her
    const wBarW = wSz + 10;
    const wBarH = 4;
    const wBarX = sx - Math.floor(wBarW / 2);
    const wBarY = sy - wH - 16;
    ctx.fillStyle = '#0a2a33';
    ctx.fillRect(wBarX, wBarY, wBarW, wBarH);
    ctx.fillStyle = hpPct > 0.5 ? '#aaeeff' : hpPct > 0.25 ? '#ff8800' : '#ffff00';
    ctx.fillRect(wBarX, wBarY, Math.floor(wBarW * hpPct), wBarH);
    ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1;
    ctx.strokeRect(wBarX, wBarY, wBarW, wBarH);

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // Ghost is semi-transparent
  if (e.type === 'ghost') ctx.globalAlpha = 0.55 + 0.2 * Math.abs(Math.sin(tickN * 0.08));
  // Queen echo — unstable, flickers faster and dimmer than a ghost (it's decaying)
  if (e.type === 'queen_echo') ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(tickN * 0.28));
  // Splitter Queen destabilizes visually just before she phase-jumps away
  if (e.type === 'splitter_queen' && e.phaseTimer <= QUEEN_PHASE_TELEGRAPH) {
    const jProgress = 1 - e.phaseTimer / QUEEN_PHASE_TELEGRAPH; // 0 -> 1 as jump nears
    ctx.globalAlpha = 1 - jProgress * 0.5 * (0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.5)));
  }

  // ── Splitter Queen: fully custom draw (regal counterpart to the King boss) ──
  if (e.type === 'splitter_queen') {
    const qSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const qH = qSz / 2;
    const qPad = Math.max(3, Math.floor(qSz * 0.10));
    const pulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.06));
    const hpPct = e.hp / e.maxHp;
    const qFlash = e.flashTicks > 0;
    const bodyColor = qFlash ? '#ffffff' : '#8800cc';

    // Outer violet glow
    ctx.shadowColor = '#dd44ff'; ctx.shadowBlur = Math.floor(22 * pulse);

    // Slender epaulettes (tapered, unlike the King's blunt shoulder spikes)
    const epW = Math.max(3, Math.floor(qSz * 0.13));
    const epH = Math.max(6, Math.floor(qSz * (attacking ? 0.42 : 0.24)));
    ctx.fillStyle = qFlash ? '#ffffff' : '#5a0088';
    ctx.fillRect(sx - qH - epW, sy - Math.floor(epH * 0.55), epW, epH);
    ctx.fillRect(sx + qH, sy - Math.floor(epH * 0.55), epW, epH);
    ctx.fillStyle = qFlash ? '#ffffff' : '#ee99ff';
    ctx.fillRect(sx - qH - epW - 2, sy - Math.floor(epH * 0.55), 2, 2);
    ctx.fillRect(sx + qH + epW, sy - Math.floor(epH * 0.55), 2, 2);

    // Main body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx - qH, sy - qH, qSz, qSz);
    ctx.shadowBlur = 0;

    // Cloak hem — stepped, alternating-height fringe along her lower edge (pixel-art zigzag)
    if (!qFlash) {
      const hemSegW = Math.max(2, Math.floor(qSz / 5));
      const hemH1 = Math.max(3, Math.floor(qSz * 0.12));
      const hemH2 = Math.max(2, Math.floor(qSz * 0.06));
      ctx.fillStyle = '#5a0088';
      for (let i = 0; i < 5; i++) {
        const hh = i % 2 === 0 ? hemH1 : hemH2;
        ctx.fillRect(sx - qH + i * hemSegW, sy + qH, hemSegW - 1, hh);
      }
    }

    // Inner plate + diamond gem motif (silver, not the King's gold cross)
    if (!qFlash) {
      ctx.fillStyle = '#4a0066';
      ctx.fillRect(sx - qH + qPad, sy - qH + qPad, qSz - qPad * 2, qSz - qPad * 2);

      // Twinkling center gem — brightness pulses independently for a "living jewel" feel
      const gemTwinkle = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.09));
      ctx.fillStyle = `rgba(255,255,255,${gemTwinkle})`;
      const gemSz = Math.max(3, Math.floor(qSz * 0.14));
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-gemSz / 2, -gemSz / 2, gemSz, gemSz);
      ctx.restore();

      // Corner gem studs — small diamonds echoing the center gem, one per plate corner
      const studSz = Math.max(2, Math.floor(qSz * 0.07));
      const studInset = qPad + Math.floor(studSz * 0.8);
      ctx.fillStyle = '#ee99ffcc';
      for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) {
        const stx = sx + ox * (qH - studInset);
        const sty = sy + oy * (qH - studInset);
        ctx.save();
        ctx.translate(stx, sty);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-studSz / 2, -studSz / 2, studSz, studSz);
        ctx.restore();
      }
    }

    // Tiara (3 spikes: tall center gem-spike, shorter sides) — regal vs. the King's 5-spike crown
    if (!qFlash) {
      ctx.fillStyle = '#ddaaff';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
      const tiaraH = Math.max(6, Math.floor(qSz * (attacking ? 0.40 : 0.26)));
      const sideH = Math.floor(tiaraH * 0.55);
      const tW = Math.max(3, Math.floor(qSz * 0.12));
      ctx.fillRect(sx - Math.floor(tW / 2), sy - qH - tiaraH, tW, tiaraH); // center spike
      ctx.fillRect(sx - qH + qPad, sy - qH - sideH, tW, sideH); // left spike
      ctx.fillRect(sx + qH - qPad - tW, sy - qH - sideH, tW, sideH); // right spike
      // Gem tip on center spike — twinkles out of sync with the center gem
      const tipTwinkle = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.09 + Math.PI / 2));
      ctx.shadowColor = '#ff66ee'; ctx.shadowBlur = Math.floor(6 * tipTwinkle);
      ctx.fillStyle = '#ff66ee';
      ctx.fillRect(sx - 2, sy - qH - tiaraH - 3, 4, 4);
      ctx.shadowBlur = 0;
    }

    // 2 large almond eyes — fewer/larger than the King's 4, glow gold when attacking
    if (!qFlash) {
      const eSz = Math.max(4, Math.floor(qSz * 0.20));
      const pSz = Math.max(2, Math.floor(eSz * 0.55));
      const eyeY = sy - qH + qPad + Math.floor(qSz * 0.20);
      const ex1 = sx - Math.floor(qSz * 0.22) - Math.floor(eSz / 2);
      const ex2 = sx + Math.floor(qSz * 0.22) - Math.floor(eSz / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eSz, eSz); ctx.fillRect(ex2, eyeY, eSz, eSz);
      ctx.fillStyle = attacking ? '#ffcc00' : '#ee44ff';
      ctx.shadowColor = attacking ? '#ffcc00' : '#ee44ff'; ctx.shadowBlur = attacking ? 12 : 6;
      ctx.fillRect(ex1 + 1, eyeY + 1, pSz, pSz); ctx.fillRect(ex2 + 1, eyeY + 1, pSz, pSz);
      ctx.shadowBlur = 0;

      // Thin, closed regal mouth (no teeth, unlike the King)
      const mW = Math.max(6, Math.floor(qSz * 0.42));
      const mH = Math.max(1, Math.floor(qSz * 0.05));
      ctx.fillStyle = '#4a0066';
      ctx.fillRect(sx - Math.floor(mW / 2), eyeY + eSz + Math.max(3, Math.floor(qSz * 0.12)), mW, mH);
    }

    // HP bar above her
    const barW = qSz + 10;
    const barH = 4;
    const barX = sx - Math.floor(barW / 2);
    const barY = sy - qH - 16;
    ctx.fillStyle = '#330044';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#dd44ff' : hpPct > 0.25 ? '#ff8800' : '#ffff00';
    ctx.fillRect(barX, barY, Math.floor(barW * hpPct), barH);
    ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Attack wind-up aiming ring (her custom body returns early, so draw it here too)
    if (e.windupTicks > 0) {
      const progress = 1 - e.windupTicks / QUEEN_WINDUP_TICKS;
      const ringR = qH + 6 + Math.floor(progress * 10);
      const ringPulse = 0.5 + 0.5 * Math.abs(Math.sin(Date.now() * 0.018));
      ctx.shadowColor = '#cc33ff';
      ctx.shadowBlur = 10 + Math.floor(progress * 16);
      ctx.strokeStyle = `rgba(221,${Math.floor(80 + 100 * progress)},255,${0.6 + 0.4 * ringPulse})`;
      ctx.lineWidth = 2 + Math.floor(progress * 2);
      ctx.strokeRect(sx - ringR, sy - ringR, ringR * 2, ringR * 2);
      ctx.shadowBlur = 0;
    }

    // Idle aura ring — subtle constant breathing glow so she reads as magical even at rest
    const auraR = qH + 10 + Math.floor(4 * pulse);
    ctx.shadowColor = '#dd44ff'; ctx.shadowBlur = 6;
    ctx.strokeStyle = `rgba(221,68,255,${0.18 + 0.12 * pulse})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - auraR, sy - auraR, auraR * 2, auraR * 2);
    ctx.shadowBlur = 0;

    // Revolving magic ring — a segmented halo of tick marks spinning continuously around her,
    // on a tilted ellipse so it reads as a ring orbiting in 3D, not a flat static circle
    const ringR = qH + 21;
    const ringSegs = 12;
    const ringSpin = tickN * 0.06;
    for (let r = 0; r < ringSegs; r++) {
      const ang = ringSpin + (r * Math.PI * 2) / ringSegs;
      const rx = sx + Math.cos(ang) * ringR;
      const ry = sy + Math.sin(ang) * ringR * 0.42;
      const depthFade = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(ang)); // segments at the "back" dim out
      const segSz = 2.5;
      ctx.globalAlpha = depthFade;
      ctx.shadowColor = '#ee66ff'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffbbff';
      ctx.fillRect(rx - segSz / 2, ry - segSz / 2, segSz, segSz);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Orbiting magic motes — inner ring (3, faster/closer) + outer ring (2, slower/wider)
    // for a layered "boss presence" that's always alive, not tied to any event
    const orbitR = qH + 16;
    for (let m = 0; m < 3; m++) {
      const ang = tickN * 0.05 + (m * Math.PI * 2) / 3;
      const mx = sx + Math.cos(ang) * orbitR;
      const my = sy + Math.sin(ang) * orbitR * 0.6; // flattened ellipse orbit
      const moteSz = 3;
      ctx.shadowColor = '#ff88ee'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffccff';
      ctx.fillRect(mx - moteSz / 2, my - moteSz / 2, moteSz, moteSz);
      ctx.shadowBlur = 0;
    }
    const outerOrbitR = qH + 26;
    for (let m = 0; m < 2; m++) {
      const ang = -tickN * 0.025 + (m * Math.PI) + Math.PI / 4; // opposite direction, slower
      const mx = sx + Math.cos(ang) * outerOrbitR;
      const my = sy + Math.sin(ang) * outerOrbitR * 0.6;
      const moteSz = 2;
      ctx.shadowColor = '#dd44ff'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#ee99ff';
      ctx.fillRect(mx - moteSz / 2, my - moteSz / 2, moteSz, moteSz);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // ── Queen Echo: a paler, simplified fragment of the Queen's silhouette ─
  if (e.type === 'queen_echo') {
    const qSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const qH = qSz / 2;
    const qPad = Math.max(2, Math.floor(qSz * 0.10));
    const eFlash = e.flashTicks > 0;

    ctx.shadowColor = '#dd44ff'; ctx.shadowBlur = 6;

    // Epaulettes with tips — same shape/colors as the real Queen (the flicker/translucency
    // already established earlier is what reads as "echo", not a separate off-palette color)
    const epW = Math.max(3, Math.floor(qSz * 0.13));
    const epH = Math.max(6, Math.floor(qSz * 0.24));
    ctx.fillStyle = eFlash ? '#ffffff' : '#5a0088';
    ctx.fillRect(sx - qH - epW, sy - Math.floor(epH * 0.55), epW, epH);
    ctx.fillRect(sx + qH, sy - Math.floor(epH * 0.55), epW, epH);
    ctx.fillStyle = eFlash ? '#ffffff' : '#ee99ff';
    ctx.fillRect(sx - qH - epW - 2, sy - Math.floor(epH * 0.55), 2, 2);
    ctx.fillRect(sx + qH + epW, sy - Math.floor(epH * 0.55), 2, 2);

    // Main body — the Queen's real color, not a separate hue; alpha flicker sells the "echo" read
    ctx.fillStyle = eFlash ? '#ffffff' : '#8800cc';
    ctx.fillRect(sx - qH, sy - qH, qSz, qSz);
    ctx.shadowBlur = 0;

    if (!eFlash) {
      // Inner plate + diamond gem motif — same as the Queen's
      ctx.fillStyle = '#4a0066';
      ctx.fillRect(sx - qH + qPad, sy - qH + qPad, qSz - qPad * 2, qSz - qPad * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      const gemSz = Math.max(3, Math.floor(qSz * 0.14));
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-gemSz / 2, -gemSz / 2, gemSz, gemSz);
      ctx.restore();

      // Glitch scanlines — a couple of horizontally-shifted slivers, the one thing that tells
      // her apart from the real Queen up close (an unstable copy, not just a dimmer one)
      const glitchY1 = sy - qH + Math.floor(qSz * (0.35 + 0.1 * Math.sin(tickN * 0.2)));
      const glitchY2 = sy - qH + Math.floor(qSz * (0.65 + 0.1 * Math.cos(tickN * 0.17)));
      const glitchH = Math.max(1, Math.floor(qSz * 0.05));
      const glitchShift = Math.floor(qSz * 0.12 * Math.sin(tickN * 0.3));
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(sx - qH + glitchShift, glitchY1, qSz, glitchH);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(sx - qH - glitchShift, glitchY2, qSz, glitchH);

      // Tiara (3 spikes + gem tip) — same shape as the Queen's
      ctx.fillStyle = '#ddaaff';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
      const tiaraH = Math.max(6, Math.floor(qSz * 0.26));
      const sideH = Math.floor(tiaraH * 0.55);
      const tW = Math.max(3, Math.floor(qSz * 0.12));
      ctx.fillRect(sx - Math.floor(tW / 2), sy - qH - tiaraH, tW, tiaraH);
      ctx.fillRect(sx - qH + qPad, sy - qH - sideH, tW, sideH);
      ctx.fillRect(sx + qH - qPad - tW, sy - qH - sideH, tW, sideH);
      ctx.fillStyle = '#ff66ee';
      ctx.fillRect(sx - 2, sy - qH - tiaraH - 3, 4, 4);
      ctx.shadowBlur = 0;

      // 2 large almond eyes, same glow color as the Queen's — no mouth (she's a silent fragment)
      const eSz = Math.max(4, Math.floor(qSz * 0.20));
      const pSz = Math.max(2, Math.floor(eSz * 0.55));
      const eyeY = sy - qH + qPad + Math.floor(qSz * 0.20);
      const ex1 = sx - Math.floor(qSz * 0.22) - Math.floor(eSz / 2);
      const ex2 = sx + Math.floor(qSz * 0.22) - Math.floor(eSz / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eSz, eSz); ctx.fillRect(ex2, eyeY, eSz, eSz);
      ctx.fillStyle = '#ee44ff';
      ctx.shadowColor = '#ee44ff'; ctx.shadowBlur = 5;
      ctx.fillRect(ex1 + 1, eyeY + 1, pSz, pSz); ctx.fillRect(ex2 + 1, eyeY + 1, pSz, pSz);
      ctx.shadowBlur = 0;
    }

    // Attack wind-up aiming ring (same treatment as the real Queen's)
    if (e.windupTicks > 0) {
      const progress = 1 - e.windupTicks / QUEEN_WINDUP_TICKS;
      const ringR = qH + 6 + Math.floor(progress * 10);
      const ringPulse = 0.5 + 0.5 * Math.abs(Math.sin(Date.now() * 0.018));
      ctx.shadowColor = '#cc33ff';
      ctx.shadowBlur = 10 + Math.floor(progress * 16);
      ctx.strokeStyle = `rgba(221,${Math.floor(80 + 100 * progress)},255,${0.6 + 0.4 * ringPulse})`;
      ctx.lineWidth = 2 + Math.floor(progress * 2);
      ctx.strokeRect(sx - ringR, sy - ringR, ringR * 2, ringR * 2);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // ── Blocky body (slightly scaled during attack) ───────────────────────
  ctx.fillStyle = color;
  if (e.type === 'splitter' && !flash) {
    // Two boxes stacked vertically with a gap between them
    const boxH = Math.floor(drawSz * 0.44);
    const gap2 = Math.max(2, drawSz - boxH * 2);
    ctx.fillRect(sx - drawH, sy - drawH, drawSz, boxH);           // top box
    ctx.fillStyle = '#aaffcc';
    ctx.fillRect(sx - drawH, sy - drawH + boxH + gap2, drawSz, boxH); // bottom box (lighter)
  } else {
    ctx.fillRect(sx - drawH, sy - drawH, drawSz, drawSz);
  }
  ctx.shadowBlur = 0;

  // Inner panel (darker)
  if (!flash && e.type !== 'splitter') {
    const darken = e.type === 'armored' ? '66' : '44';
    ctx.fillStyle = '#000000' + darken;
    ctx.fillRect(sx - half + pad, sy - half + pad, size - pad * 2, size - pad * 2);
  }

  // ── Antenna ───────────────────────────────────────────────────────────
  const antH = Math.max(3, Math.floor(size * 0.28));
  const dotSz = 3;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  if (e.type === 'bomber') {
    // No antenna — bald, dangerous look
  } else if (e.type === 'fast') {
    // Twin antennas
    const fw = 2, fgap = Math.floor(size * 0.17);
    ctx.fillRect(sx - fgap - fw, sy - half - antH, fw, antH);
    ctx.fillRect(sx + fgap, sy - half - antH, fw, antH);
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - fgap - 1, sy - half - antH - dotSz, dotSz, dotSz);
    ctx.fillRect(sx + fgap, sy - half - antH - dotSz, dotSz, dotSz);
    ctx.shadowBlur = 0;
  } else if (e.type === 'healer') {
    // Triple fan antennas
    const hw = 2, hgap = Math.floor(size * 0.20);
    const sideH = Math.max(2, Math.floor(antH * 0.70));
    ctx.fillRect(sx - Math.floor(hw / 2), sy - half - antH, hw, antH);
    ctx.fillRect(sx - hgap - hw, sy - half - sideH, hw, sideH);
    ctx.fillRect(sx + hgap, sy - half - sideH, hw, sideH);
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - Math.floor(dotSz / 2), sy - half - antH - dotSz, dotSz, dotSz);
    const sd = dotSz - 1;
    ctx.fillRect(sx - hgap - hw + Math.floor(hw / 2) - Math.floor(sd / 2), sy - half - sideH - sd, sd, sd);
    ctx.fillRect(sx + hgap + Math.floor(hw / 2) - Math.floor(sd / 2), sy - half - sideH - sd, sd, sd);
    ctx.shadowBlur = 0;
  } else if (e.type === 'sniper') {
    // Tall single antenna with crosshair tip
    const tallH = Math.floor(antH * 1.5);
    ctx.fillRect(sx - 1, sy - half - tallH, 2, tallH);
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - Math.floor(dotSz / 2), sy - half - tallH - dotSz, dotSz, dotSz);
    ctx.fillRect(sx - dotSz - 1, sy - half - tallH - 1, dotSz * 2 + 3, 1); // horizontal tick
    ctx.shadowBlur = 0;
  } else if (e.type === 'charger') {
    // Side antennas — one extends left, one extends right from mid-body
    const antLen = Math.max(5, Math.floor(size * 0.38));
    const antThk = 2;
    const midY = sy - Math.floor(antThk / 2);
    ctx.shadowColor = color; ctx.shadowBlur = 5;
    ctx.fillRect(sx - half - antLen, midY, antLen, antThk); // left
    ctx.fillRect(sx + half, midY, antLen, antThk); // right
    // Tips
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(sx - half - antLen - 2, midY - 1, 2, antThk + 2);
    ctx.fillRect(sx + half + antLen, midY - 1, 2, antThk + 2);
    ctx.shadowBlur = 0;
  } else if (e.type === 'mini_splitter') {
    // No antenna
  } else if (e.type === 'ghost') {
    // 3 antennas hanging from the bottom (ghost tendrils)
    const gw = 2, ggap = Math.floor(size * 0.22);
    const botY = sy + half;
    const tentH = Math.floor(antH * 1.1);
    const sideH = Math.floor(antH * 0.75);
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 5;
    ctx.fillRect(sx - Math.floor(gw / 2), botY, gw, tentH);       // center
    ctx.fillRect(sx - ggap - gw, botY, gw, sideH);      // left
    ctx.fillRect(sx + ggap, botY, gw, sideH);      // right
    // Tip dots
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - Math.floor(dotSz / 2), botY + tentH, dotSz, dotSz);
    ctx.fillRect(sx - ggap - gw, botY + sideH, dotSz - 1, dotSz - 1);
    ctx.fillRect(sx + ggap, botY + sideH, dotSz - 1, dotSz - 1);
    ctx.shadowBlur = 0;
  } else if (e.type === 'shielder') {
    // 3 antennas with flat shield-like tips
    const hw = 2, hgap = Math.floor(size * 0.20);
    const sideH = Math.max(2, Math.floor(antH * 0.75));
    ctx.fillRect(sx - 1, sy - half - antH, 2, antH); // center
    ctx.fillRect(sx - hgap - hw, sy - half - sideH, hw, sideH); // left
    ctx.fillRect(sx + hgap, sy - half - sideH, hw, sideH); // right
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    // tips
    ctx.fillRect(sx - Math.floor(dotSz * 1.5), sy - half - antH - dotSz, dotSz * 3, dotSz); // center tip
    const sTip = dotSz * 2;
    ctx.fillRect(sx - hgap - hw - Math.floor((sTip - hw) / 2), sy - half - sideH - dotSz, sTip, dotSz); // left tip
    ctx.fillRect(sx + hgap - Math.floor((sTip - hw) / 2), sy - half - sideH - dotSz, sTip, dotSz); // right tip
    ctx.shadowBlur = 0;
  } else if (e.type === 'splitter') {
    // Twin antennas (same as fast but spaced for the wider body)
    const sw = 2, sgap = Math.floor(size * 0.20);
    ctx.fillRect(sx - sgap - sw, sy - half - antH, sw, antH);
    ctx.fillRect(sx + sgap, sy - half - antH, sw, antH);
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - sgap - 1, sy - half - antH - dotSz, dotSz, dotSz);
    ctx.fillRect(sx + sgap, sy - half - antH - dotSz, dotSz, dotSz);
    ctx.shadowBlur = 0;
  } else {
    // normal / armored: single centered antenna
    const aw = e.type === 'armored' ? 3 : 2;
    ctx.fillRect(sx - Math.floor(aw / 2), sy - half - antH, aw, antH);
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - Math.floor(dotSz / 2), sy - half - antH - dotSz, dotSz, dotSz);
    ctx.shadowBlur = 0;
  }

  // ── Eyes / face ───────────────────────────────────────────────────────
  if (!flash) {
    const eyeY = sy - half + pad + 1;
    if (e.type === 'sniper') {
      // 1 large central cycloptic eye
      const eyeSz = Math.max(4, Math.floor(size * 0.34));
      const pupSz = Math.max(2, Math.floor(eyeSz * 0.55));
      const ex = sx - Math.floor(eyeSz / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex, eyeY, eyeSz, eyeSz);
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff2200';
      ctx.fillRect(ex + Math.floor((eyeSz - pupSz) / 2), eyeY + Math.floor((eyeSz - pupSz) / 2), pupSz, pupSz);
      ctx.shadowBlur = 0;
    } else if (e.type === 'fast') {
      // No eyes — just a wide mouth (aggressive horizontal slit)
      const mouthW = Math.max(4, Math.floor(size * 0.55));
      const mouthH = Math.max(2, Math.floor(size * 0.12));
      const mouthY = sy - half + Math.floor(size * 0.52);
      ctx.fillStyle = '#ff2200';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 5;
      ctx.fillRect(sx - Math.floor(mouthW / 2), mouthY, mouthW, mouthH);
      ctx.shadowBlur = 0;
    } else if (e.type === 'healer') {
      // 2 normal top eyes + 1 centered mouth-eye embedded in body
      const eyeSz = Math.max(2, Math.floor(size * 0.18));
      const pupSz = Math.max(1, eyeSz - 1);
      const eyeClr = '#ff55cc';
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eyeSz - 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex2, eyeY, eyeSz, eyeSz);
      ctx.fillStyle = eyeClr;
      ctx.fillRect(ex1 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pupSz, pupSz);
      // mouth-eye: centered, below the top eyes
      const mEyeY = eyeY + eyeSz + Math.max(2, Math.floor(size * 0.10));
      const mEx = sx - Math.floor(eyeSz / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mEx, mEyeY, eyeSz, eyeSz);
      ctx.shadowColor = eyeClr;
      ctx.shadowBlur = 8;
      ctx.fillStyle = eyeClr;
      ctx.fillRect(mEx + 1, mEyeY + 1, pupSz, pupSz);
      ctx.shadowBlur = 0;
    } else if (e.type === 'charger') {
      // Smile mouth (U-shape) at the top
      const mW = Math.max(6, Math.floor(size * 0.45));
      const mH = Math.max(1, Math.floor(size * 0.10));
      const mX = sx - Math.floor(mW / 2);
      const mY = sy - half + pad + 2 + Math.max(2, Math.floor(size * 0.15));
      const cW = Math.max(1, Math.floor(mW * 0.15));
      const cH = Math.max(2, Math.floor(mH * 2.5));

      ctx.fillStyle = '#ff2200';
      ctx.fillRect(mX, mY, mW, mH);           // bottom bar
      ctx.fillRect(mX, mY - cH, cW, cH);      // left corner
      ctx.fillRect(mX + mW - cW, mY - cH, cW, cH); // right corner

      // Diagonal slanted eyes (\ /) at the bottom
      const eSz = Math.max(2, Math.floor(size * 0.12));
      const bottomEyeY = sy + half - pad - eSz * 2 - 2;
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eSz * 2 - 1;

      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 5;
      // Left eye: \
      ctx.fillRect(ex1, bottomEyeY, eSz, eSz);
      ctx.fillRect(ex1 + eSz, bottomEyeY + eSz, eSz, eSz);
      // Right eye: /
      ctx.fillRect(ex2 + eSz, bottomEyeY, eSz, eSz);
      ctx.fillRect(ex2, bottomEyeY + eSz, eSz, eSz);
      ctx.shadowBlur = 0;
    } else if (e.type === 'ghost') {
      // Large hollow eyes — white outline with strong glow
      const eSz = Math.max(4, Math.floor(size * 0.30));
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eSz - 1;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.shadowColor = '#aa88ff'; ctx.shadowBlur = 15;
      ctx.strokeRect(ex1, eyeY, eSz, eSz);
      ctx.strokeRect(ex2, eyeY, eSz, eSz);
      ctx.shadowBlur = 0;
    } else if (e.type === 'splitter') {
      // 2 green eyes on top box, 2 on bottom box
      const eSz = Math.max(2, Math.floor(size * 0.18));
      const pSz = Math.max(1, eSz - 1);
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eSz - 1;

      const unscaledBoxH = Math.floor(size * 0.44);
      const unscaledGap = Math.max(2, size - unscaledBoxH * 2);
      const bottomEyeY = sy - half + unscaledBoxH + unscaledGap + pad;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eSz, eSz);
      ctx.fillRect(ex2, eyeY, eSz, eSz);
      ctx.fillRect(ex1, bottomEyeY, eSz, eSz);
      ctx.fillRect(ex2, bottomEyeY, eSz, eSz);

      ctx.fillStyle = '#00ff44';
      ctx.fillRect(ex1 + 1, eyeY + 1, pSz, pSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pSz, pSz);
      ctx.fillRect(ex1 + 1, bottomEyeY + 1, pSz, pSz);
      ctx.fillRect(ex2 + 1, bottomEyeY + 1, pSz, pSz);
    } else if (e.type === 'mini_splitter') {
      // 2 tiny eyes — no pupils, just small white squares
      const eSz = Math.max(1, Math.floor(size * 0.22));
      const ex1 = sx - half + pad;
      const ex2 = sx + half - pad - eSz;
      ctx.fillStyle = '#aaffcc';
      ctx.fillRect(ex1, eyeY, eSz, eSz);
      ctx.fillRect(ex2, eyeY, eSz, eSz);
    } else if (e.type === 'shielder') {
      // A pair of vertical eyes (2 eyes stacked on top of each other) above 1 smile mouth
      const eSz = Math.max(2, Math.floor(size * 0.15));
      const pSz = Math.max(1, eSz - 1);
      const eX = sx - Math.floor(eSz / 2);
      const eY1 = sy - half + pad + 1;
      const eY2 = eY1 + eSz + Math.max(3, Math.floor(size * 0.15));

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eX, eY1, eSz, eSz);
      ctx.fillRect(eX, eY2, eSz, eSz);
      ctx.fillStyle = '#00ddcc';
      ctx.fillRect(eX + 1, eY1 + 1, pSz, pSz);
      ctx.fillRect(eX + 1, eY2 + 1, pSz, pSz);

      const mW = Math.max(6, Math.floor(size * 0.56));
      const mH = Math.max(1, Math.floor(size * 0.10));
      const mX = sx - Math.floor(mW / 2);
      const cW = Math.max(1, Math.floor(mW * 0.13));
      const cH = Math.max(2, Math.floor(mH * 2.5));
      const mY = eY2 + eSz + Math.max(1, Math.floor(size * 0.04)) + cH;

      ctx.fillStyle = '#00ddcc';
      ctx.shadowColor = '#00ddcc'; ctx.shadowBlur = 5;
      ctx.fillRect(mX, mY, mW, mH);
      ctx.fillRect(mX, mY - cH, cW, cH);
      ctx.fillRect(mX + mW - cW, mY - cH, cW, cH);
      ctx.shadowBlur = 0;
    } else if (e.type === 'bomber') {
      // 3 eyes in a row
      const eyeSz = Math.max(3, Math.floor(size * 0.21));
      const pupSz = Math.max(2, eyeSz - 1);
      const gap = Math.floor((size - pad * 2 - eyeSz * 3) / 2);
      const ex1 = sx - half + pad;
      const ex2 = ex1 + eyeSz + gap;
      const ex3 = ex2 + eyeSz + gap;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex2, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex3, eyeY, eyeSz, eyeSz);
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(ex1 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex3 + 1, eyeY + 1, pupSz, pupSz);
      // Smile mouth (U-shape): bottom bar + two corner uprights
      const mW = Math.max(6, Math.floor(size * 0.55));
      const mH = Math.max(1, Math.floor(size * 0.10));
      const mX = sx - Math.floor(mW / 2);
      const mY = eyeY + eyeSz + Math.max(2, Math.floor(size * 0.10));
      const cW = Math.max(1, Math.floor(mW * 0.13));
      const cH = Math.max(2, Math.floor(mH * 2.5));
      ctx.fillStyle = e.exploding ? '#ff2200' : '#cc3300';
      ctx.fillRect(mX, mY, mW, mH);           // bottom bar
      ctx.fillRect(mX, mY - cH, cW, cH);      // left corner upright
      ctx.fillRect(mX + mW - cW, mY - cH, cW, cH); // right corner upright
    } else {
      // normal / armored: 2 eyes
      const eyeSz = Math.max(2, Math.floor(size * 0.18));
      const pupSz = Math.max(1, eyeSz - 1);
      const eyeClr = e.type === 'armored' ? '#ffff00' : '#ff2200';
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eyeSz - 1;
      ctx.fillStyle = '#ffffff';
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
    ctx.lineWidth = 3;
    ctx.shadowColor = cfg.shieldColor;
    ctx.shadowBlur = 8;
    ctx.strokeRect(sx - half - 3, sy - half - 3, size + 6, size + 6);
    ctx.shadowBlur = 0;
  }
  if (e.type === 'armored' && !flash) {
    // Wavy/squiggly mouth below the eyes
    const wW = Math.max(8, Math.floor(size * 0.60));
    const segW = Math.max(2, Math.floor(wW / 6));
    const wH = Math.max(1, Math.floor(size * 0.09));
    const amp = Math.max(2, Math.floor(size * 0.12));
    const wX = sx - Math.floor(wW / 2);
    const wY = sy - half + Math.floor(size * 0.55);
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 4;
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(wX + i * segW, wY + (i % 2 === 0 ? 0 : amp), segW, wH);
    }
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
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 18;
    ctx.strokeRect(sx - drawH - 4, sy - drawH - 4, drawSz + 8, drawSz + 8);
    ctx.shadowBlur = 0;
  }

  // ── Charger: motion trail when charging / dizzy when stunned ─────────
  if (e.type === 'charger') {
    if (e.chargeDirX !== 0 || e.chargeDirY !== 0) {
      // Motion trail — two faint rects trailing behind
      for (let t = 1; t <= 2; t++) {
        const alpha = 0.25 / t;
        ctx.fillStyle = `rgba(255,68,0,${alpha})`;
        ctx.fillRect(sx - drawH - e.chargeDirX * TILE_SIZE * t * 0.4,
          sy - drawH - e.chargeDirY * TILE_SIZE * t * 0.4, drawSz, drawSz);
      }
    } else if (e.windupTicks > 0) {
      // Dizzy stars
      const dAngle = (tickN * 0.15) % (Math.PI * 2);
      for (let d = 0; d < 3; d++) {
        const a = dAngle + (d * Math.PI * 2 / 3);
        const dx2 = Math.cos(a) * (half + 5), dy2 = Math.sin(a) * (half + 4);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(sx + Math.floor(dx2) - 2, sy + Math.floor(dy2) - 2, 3, 3);
      }
    }
  }

  // ── Shielder: shield arc toward shielded target (drawn per-enemy; shielded overlay is separate) ──
  if (e.type === 'shielder' && e.shieldTargetId !== -1) {
    ctx.shadowColor = '#00ddcc'; ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(0,221,204,0.55)'; ctx.lineWidth = 2;
    ctx.strokeRect(sx - half - 3, sy - half - 3, size + 6, size + 6);
    ctx.shadowBlur = 0;
  }

  // ── Shielded enemy overlay ────────────────────────────────────────────
  if (shielded) {
    ctx.shadowColor = '#00ddcc'; ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(0,221,204,0.75)'; ctx.lineWidth = 3;
    ctx.strokeRect(sx - half - 4, sy - half - 4, size + 8, size + 8);
    // Corner triangles
    const ct = Math.max(3, Math.floor(half * 0.35));
    ctx.fillStyle = 'rgba(0,221,204,0.6)';
    for (const [cx2, cy2] of [[sx - half - 4, sy - half - 4], [sx + half + 4, sy - half - 4], [sx - half - 4, sy + half + 4], [sx + half + 4, sy + half + 4]] as [number, number][]) {
      ctx.fillRect(cx2 - 1, cy2 - 1, ct, 2);
      ctx.fillRect(cx2 - 1, cy2 - 1, 2, ct);
    }
    ctx.shadowBlur = 0;
  }

  // ── Frost Warden icy shield overlay — a hexagonal ice-crystal barrier on whichever
  // ally she granted it to, distinct from the shielder's teal square+corners look.
  // Double stroke (glow + bright core) plus corner glints, not just one thin line.
  if (e.icyShieldHP > 0) {
    const shPulse = 0.6 + 0.3 * Math.abs(Math.sin(tickN * 0.15));

    // Orbiting ice-shard particles
    const shSparkCount = 4;
    for (let i = 0; i < shSparkCount; i++) {
      const spAng = tickN * 0.03 + (Math.PI * 2 * i) / shSparkCount;
      const spR = half + 10;
      const spx = sx + Math.cos(spAng) * spR;
      const spy = sy + Math.sin(spAng) * spR;
      const spAlpha = 0.5 + 0.4 * Math.abs(Math.sin(tickN * 0.1 + i * 1.7));
      ctx.fillStyle = `rgba(255,255,255,${spAlpha})`;
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 5;
      ctx.fillRect(spx - 1.5, spy - 1.5, 3, 3);
    }
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(sx, sy);
    const shR = half + 6;
    const shHexPoints: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const hAng = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      shHexPoints.push([Math.cos(hAng) * shR, Math.sin(hAng) * shR]);
    }
    // Outer glow layer — thicker border
    ctx.globalAlpha = 0.35 + 0.2 * shPulse;
    ctx.strokeStyle = '#aaeeff';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = 12;
    ctx.beginPath();
    shHexPoints.forEach(([hx, hy], i) => i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy));
    ctx.closePath();
    ctx.stroke();
    // Bright core layer
    ctx.globalAlpha = 0.65 + 0.3 * shPulse;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 6;
    ctx.stroke();
    // Corner glints
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    for (const [hx, hy] of shHexPoints) {
      ctx.fillRect(hx - 1.5, hy - 1.5, 3, 3);
    }
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  // ── Healer pulsing aura ring ─────────────────────────────────────────
  if (e.type === 'healer') {
    const healProgress = 1 - e.attackTimer / HEALER_HEAL_INTERVAL; // 0→1 toward next heal
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.01));
    const ringR = half + 4 + Math.floor(healProgress * 10);
    ctx.shadowColor = '#ff55cc';
    ctx.shadowBlur = 5 + Math.floor(healProgress * 12);
    ctx.strokeStyle = `rgba(255,85,204,${(0.2 + 0.6 * healProgress) * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - ringR, sy - ringR, ringR * 2, ringR * 2);
    ctx.shadowBlur = 0;
  }

  // ── Sniper wind-up aiming ring ────────────────────────────────────────
  if (e.type === 'sniper' && e.windupTicks > 0) {
    const progress = 1 - e.windupTicks / 50; // 0→1 as windup completes
    const ringR = half + 6 + Math.floor(progress * 10);
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(Date.now() * 0.018));
    const danger = `rgba(255,${Math.floor(80 * (1 - progress))},0,${0.6 + 0.4 * pulse})`;
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 10 + Math.floor(progress * 16);
    ctx.strokeStyle = danger;
    ctx.lineWidth = 2 + Math.floor(progress * 2);
    ctx.strokeRect(sx - ringR, sy - ringR, ringR * 2, ringR * 2);
    // Corner tick marks
    const tick = Math.max(4, Math.floor(ringR * 0.3));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    for (const [cx2, cy2, dx2, dy2] of [
      [sx - ringR, sy - ringR, 1, 1],
      [sx + ringR, sy - ringR, -1, 1],
      [sx - ringR, sy + ringR, 1, -1],
      [sx + ringR, sy + ringR, -1, -1],
    ] as [number, number, number, number][]) {
      ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2 + dx2 * tick, cy2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2, cy2 + dy2 * tick); ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // ── HP bar ────────────────────────────────────────────────────────────
  if (e.hp < e.maxHp) {
    const barW = size + 4;
    const barH = Math.max(5, Math.floor(size * 0.13));
    const bx = sx - barW / 2;
    const by = sy - half - antH - dotSz - barH - 3;
    const pct = e.hp / e.maxHp;
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
  isMobileTouch = false,
): void {
  // Mobile sees more of the map (zoomed out); desktop is untouched. The whole world is drawn
  // in a scaled coordinate space (viewW/viewH), then we restore back to true pixel space
  // before the minimap so it isn't affected by this — it gets its own independent mobile sizing.
  const worldZoom = isMobileTouch ? 0.4 : 1;
  const viewW = canvasW / worldZoom;
  const viewH = canvasH / worldZoom;

  let camX = state.playerX - viewW / 2;
  let camY = state.playerY - viewH / 2;
  if (state.screenShakeTicks > 0) {
    const shakeStr = state.screenShakeAmt * (state.screenShakeTicks / 22);
    camX += Math.round((Math.random() - 0.5) * shakeStr * 2);
    camY += Math.round((Math.random() - 0.5) * shakeStr * 2);
  }

  ctx.save();
  ctx.scale(worldZoom, worldZoom);

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, viewW, viewH);

  // Per-chamber glowing borders — inset 1 tile to sit right on the floor edge
  for (let ch = 0; ch < 4; ch++) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[ch];
    const bx2 = (c1 + 1) * TILE_SIZE - camX;
    const by2 = (r1 + 1) * TILE_SIZE - camY;
    const bw2 = (c2 - c1 - 1) * TILE_SIZE;
    const bh2 = (r2 - r1 - 1) * TILE_SIZE;
    const col = CHAMBER_COLORS[ch];
    ctx.shadowColor = col;
    ctx.shadowBlur = 22;
    ctx.strokeStyle = col + '99';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx2, by2, bw2, bh2);
    ctx.shadowBlur = 10;
    ctx.strokeStyle = col + '44';
    ctx.lineWidth = 8;
    ctx.strokeRect(bx2, by2, bw2, bh2);
    ctx.shadowBlur = 0;
  }

  // Hallway border lines — exposed long sides of each corridor (neutral glow)
  // fillFloor zones: (9,20,11,30), (38,20,40,30), (20,9,30,11), (20,38,30,40)
  const TS = TILE_SIZE;
  const hallways: [number, number, number, number][] = [
    [9, 20, 11, 30],   // top horizontal  (ALPHA ↔ BETA)
    [38, 20, 40, 30],  // bottom horizontal (GAMMA ↔ DELTA)
    [20, 9, 30, 11],   // left vertical   (ALPHA ↔ GAMMA)
    [20, 38, 30, 40],  // right vertical  (BETA  ↔ DELTA)
  ];
  ctx.shadowColor = '#8899ff';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = '#8899ff88';
  ctx.lineWidth = 3;
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
  const tx1 = Math.ceil((camX + viewW) / TILE_SIZE) + 1;
  const ty1 = Math.ceil((camY + viewH) / TILE_SIZE) + 1;

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
        ctx.shadowBlur = Math.floor(16 * blinkPulse);
        const diaSize = Math.floor(TILE_SIZE * (0.15 + 0.45 * blinkPulse));
        drawPixelDiamond(ctx, sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, diaSize, tcol);
        ctx.shadowBlur = 0;
      }

      // Frost Warden ice tile — blocky icy tint + crack pattern, freezes the player on step
      if (state.frostIceTiles.some(([itx, ity]) => itx === tx && ity === ty)) {
        const icePulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.06));
        ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = Math.floor(10 * icePulse);
        ctx.fillStyle = `rgba(170,238,255,${0.4 * icePulse})`;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255,255,255,${0.7 * icePulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + TILE_SIZE * 0.2, sy + TILE_SIZE * 0.5); ctx.lineTo(sx + TILE_SIZE * 0.8, sy + TILE_SIZE * 0.5);
        ctx.moveTo(sx + TILE_SIZE * 0.5, sy + TILE_SIZE * 0.2); ctx.lineTo(sx + TILE_SIZE * 0.5, sy + TILE_SIZE * 0.8);
        ctx.stroke();
      }
    }
  }

  // Frost Warden chill field — persistent icy wash + frosty border over whichever chamber
  // she currently occupies, so the chill debuff is visible, not just felt
  const frostWarden = state.enemies.find(e => e.type === 'frost_warden');
  if (frostWarden) {
    const fwChamber = chamberOfTile(frostWarden.tileX, frostWarden.tileY);
    if (fwChamber >= 0) {
      const [r1, c1, r2, c2] = CHAMBER_BOUNDS[fwChamber];
      const frostPulse = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.03));
      ctx.fillStyle = `rgba(170,238,255,${0.06 + 0.05 * frostPulse})`;
      ctx.fillRect(c1 * TILE_SIZE - camX, r1 * TILE_SIZE - camY,
        (c2 - c1 + 1) * TILE_SIZE, (r2 - r1 + 1) * TILE_SIZE);
      ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.2 * frostPulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(c1 * TILE_SIZE - camX + 1, r1 * TILE_SIZE - camY + 1,
        (c2 - c1 + 1) * TILE_SIZE - 2, (r2 - r1 + 1) * TILE_SIZE - 2);
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
    const endY = cy2;
    const metY = Math.round(startY + (endY - startY) * strikeProg);
    const metX = Math.round(cx2);
    if (metY < endY) {
      const tailH = Math.min(viewH, metSz * 3);
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
    ctx.fillRect(bodyCX - bw / 2 - 2, bodyCY - bw / 2 - 2, bw + 4, bw + 4);
    ctx.shadowBlur = 0;

    // Dark orangeish fill
    ctx.fillStyle = innerCol;
    ctx.fillRect(bodyCX - bw / 2 + 2, bodyCY - bw / 2 + 2, bw - 4, bw - 4);

    // Highlight corner
    ctx.fillStyle = state.bomb.powered ? '#ffeedd' : '#ffbb88';
    ctx.fillRect(bodyCX - bw / 2 + 5, bodyCY - bw / 2 + 5, 3, 3);
    // Fuse rope (line from top of circle to spark)
    const fuseX = bodyCX + Math.floor(bodyW * 0.22);
    const fuseTopY = Math.round(bodyCY - bodyW / 2 - Math.floor(TILE_SIZE * 0.18));
    const fuseBottomY = Math.round(bodyCY - bodyW / 2);
    ctx.fillStyle = '#997744';
    ctx.fillRect(fuseX, fuseTopY, 2, fuseBottomY - fuseTopY);
    // Spark dot
    const sparkOn = Math.floor(tickN * 0.2) % 2 === 0;
    ctx.shadowColor = bombCol;
    ctx.shadowBlur = sparkOn ? 12 : 0;
    ctx.fillStyle = sparkOn ? '#ffffff' : bombCol;
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
  const shieldedIds = new Set(
    state.enemies.filter(e => e.type === 'shielder' && e.shieldTargetId !== -1).map(e => e.shieldTargetId)
  );
  for (const e of state.enemies) {
    const sx = e.x - camX;
    const sy = e.y - camY;
    drawEnemy(ctx, e, sx, sy, tickN, shieldedIds.has(e.id));
    ctx.globalAlpha = 1; // reset in case ghost modified it
  }

  // Death particles — blocky debris burst on enemy kill
  for (const p of state.deathParticles) {
    const alpha = p.ticks / p.maxTicks;
    const px = p.x - camX, py = p.y - camY;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

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

    if (e.type === 'ghost') {
      const t = 1 - (e.shootTicks / 14); // 0 to 1 progress
      const dx = tgtX - exs;
      const dy = tgtY - eys;
      const totalLen = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / totalLen;
      const ny = dy / totalLen;

      const traveled = t * totalLen;
      const bx = exs + nx * traveled; // front of bullet
      const by = eys + ny * traveled;

      const maxTailLen = TILE_SIZE * 0.4; // much shorter tail
      const tailLen = Math.min(maxTailLen, traveled);

      const startX = bx - nx * tailLen;
      const startY = by - ny * tailLen;
      const endX = bx;
      const endY = by;

      const size = Math.max(2, Math.floor(TILE_SIZE * 0.15)); // smaller bullet

      ctx.globalAlpha = 0.8;
      ctx.shadowColor = ecol;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = ecol;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 0.4;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.lineCap = 'butt';
    } else if (e.type === 'splitter' || e.type === 'armored') {
      const t = 1 - (e.shootTicks / 14); // 0 to 1 progress
      const dx = tgtX - exs;
      const dy = tgtY - eys;
      const totalLen = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / totalLen;
      const ny = dy / totalLen;

      const traveled = t * totalLen;
      const bx = exs + nx * traveled; // center of ball
      const by = eys + ny * traveled;

      const ballRadius = Math.max(4, Math.floor(TILE_SIZE * 0.22));

      ctx.globalAlpha = 0.85;
      ctx.shadowColor = ecol;
      ctx.shadowBlur = 16;
      ctx.fillStyle = ecol;
      ctx.beginPath();
      ctx.arc(bx, by, ballRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, ballRadius * 0.45, 0, 2 * Math.PI);
      ctx.fill();
    } else if (e.type === 'normal' || e.type === 'mini_splitter') {
      const alpha = e.shootTicks / 14;
      const progress = 1 - alpha; // 0 to 1
      const angle = Math.atan2(tgtY - eys, tgtX - exs);
      const sweepRadius = TILE_SIZE * 0.4 + (TILE_SIZE * 0.8 * progress); // expands outward
      const arcSpread = Math.PI * 0.6; // 108 degrees wide

      ctx.globalAlpha = alpha * 0.9;
      ctx.shadowColor = ecol;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = ecol;
      ctx.lineWidth = Math.max(3, TILE_SIZE * 0.25 * alpha);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(exs, eys, sweepRadius, angle - arcSpread / 2, angle + arcSpread / 2);
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, TILE_SIZE * 0.08 * alpha);
      ctx.beginPath();
      ctx.arc(exs, eys, sweepRadius, angle - arcSpread / 2, angle + arcSpread / 2);
      ctx.stroke();

      // Fix: reset alpha and line cap
      ctx.globalAlpha = 1;
      ctx.lineCap = 'butt';
    } else {
      ctx.globalAlpha = alpha * 0.75;
      ctx.shadowColor = ecol;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = ecol;
      ctx.lineWidth = Math.max(4, Math.floor(TILE_SIZE * 0.22));
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(exs, eys);
      ctx.lineTo(tgtX, tgtY);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(exs, eys);
      ctx.lineTo(tgtX, tgtY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.lineCap = 'butt';
    }
  }

  // Player
  const jiggle = state.healJiggleTicks > 0
    ? Math.sin(state.healJiggleTicks * 1.8) * 3
    : 0;
  const psx = state.playerX - camX + jiggle;
  const psy = state.playerY - camY;
  drawPlayer(ctx, psx, psy, state, tickN, chargingMs);

  // Frozen by a Frost Warden ice tile — blocky ice-block overlay encasing the player
  if (state.playerFrozenTicks > 0) {
    const fSz = Math.floor(TILE_SIZE * 0.9);
    const fH = fSz / 2;
    const fPulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.2));
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = Math.floor(16 * fPulse);
    ctx.fillStyle = '#cceeff';
    ctx.fillRect(psx - fH, psy - fH, fSz, fSz);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(psx - fH, psy - fH, fSz, fSz);
    ctx.restore();
  }

  // Laser bullets
  for (const b of state.laserBullets || []) {
    const shadowCol = b.powered ? '#ffaa00' : '#00ffff';
    const strokeOut = b.powered ? '#ffcc00' : '#44ddff';
    const strokeIn = b.powered ? '#ffee88' : '#aaffff';

    const cx = b.x * TILE_SIZE - camX;
    const cy = b.y * TILE_SIZE - camY;

    // Streak from previous position to slightly ahead
    const len = Math.sqrt(b.dx * b.dx + b.dy * b.dy) || 1;
    const nx = b.dx / len;
    const ny = b.dy / len;
    const maxTailLen = TILE_SIZE * 1.5;
    const traveled = b.ticks * BULLET_SPEED * TILE_SIZE;
    const tailLen = Math.min(maxTailLen, traveled);

    const startX = cx - nx * tailLen;
    const startY = cy - ny * tailLen;
    const endX = cx + nx * TILE_SIZE * 0.4;
    const endY = cy + ny * TILE_SIZE * 0.4;

    const size = b.powered ? 24 : 12;

    // Outermost soft glow
    ctx.globalAlpha = 0.4;
    ctx.shadowColor = shadowCol;
    ctx.shadowBlur = 25;
    ctx.strokeStyle = shadowCol;
    ctx.lineWidth = size * 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Outer bright layer
    ctx.globalAlpha = 0.8;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = strokeOut;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Inner bright core
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = strokeIn;
    ctx.lineWidth = size * 0.4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  // Lightning arcs — chain from sniper kill
  for (const arc of state.lightningArcs) {
    const progress = arc.ticks / 22;
    ctx.globalAlpha = progress * 0.9;
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14;
    ctx.strokeStyle = '#ffffaa'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(arc.fromX - camX, arc.fromY - camY);
    // Zigzag midpoint for electric look
    const midX = (arc.fromX + arc.toX) / 2 - camX + (Math.random() - 0.5) * 16;
    const midY = (arc.fromY + arc.toY) / 2 - camY + (Math.random() - 0.5) * 16;
    ctx.lineTo(midX, midY);
    ctx.lineTo(arc.toX - camX, arc.toY - camY);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(arc.fromX - camX, arc.fromY - camY);
    ctx.lineTo(midX, midY);
    ctx.lineTo(arc.toX - camX, arc.toY - camY);
    ctx.stroke();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  // Storm Reaper's melee strike — a big double electric slash (X-cut), not a laser beam
  for (const slash of state.slashEffects) {
    const progress = slash.ticks / slash.maxTicks; // 1 -> 0
    const sxp = slash.x - camX, syp = slash.y - camY;
    const radius = TILE_SIZE * (0.9 + 0.65 * (1 - progress)); // swipes outward as it fades
    const arcSpan = 1.5; // radians of the crescent

    ctx.save();
    ctx.translate(sxp, syp);
    ctx.globalAlpha = progress;

    // Impact flash — bright burst at the moment of the hit, gone within a couple ticks
    if (progress > 0.82) {
      const flashT = (progress - 0.82) / 0.18; // 1 -> 0 fast
      ctx.globalAlpha = flashT;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(0, 0, TILE_SIZE * 0.7 * flashT, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = progress;
    }

    ctx.shadowColor = '#00eaff'; ctx.shadowBlur = 20;

    // Two crossed crescents (X-slash) for a bigger, more dramatic hit than a single swipe
    for (const rot of [slash.angle - 0.35, slash.angle + 0.35]) {
      ctx.save();
      ctx.rotate(rot);
      ctx.strokeStyle = '#00c8e0'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, radius, -arcSpan / 2, arcSpan / 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, radius, -arcSpan / 2, arcSpan / 2);
      ctx.stroke();
      ctx.restore();
    }

    // Forking electric bolts jutting off the slash — denser spray than before
    ctx.save();
    ctx.rotate(slash.angle);
    ctx.strokeStyle = '#aefcff'; ctx.lineWidth = 1.5;
    for (const t of [-0.7, -0.45, -0.2, 0.05, 0.3, 0.55]) {
      const bx = Math.cos(t) * radius, by = Math.sin(t) * radius;
      const forkLen = 10 + Math.random() * 6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(t) * forkLen + (Math.random() - 0.5) * 10, by + Math.sin(t) * forkLen + (Math.random() - 0.5) * 10);
      ctx.stroke();
    }
    ctx.restore();

    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Laser beams — player=cyan, powered=gold, sniper=red, boss=dark red
  for (const beam of state.laserBeams) {
    const isEnemy = !!beam.color;
    const isBossLaser = beam.color === '#cc0022';
    const isQueenLaser = beam.color === '#cc33ff' || beam.color === '#dd88ff';
    const isDevourerLaser = beam.color === '#6b2fa8';
    const isFrostLaser = beam.color === '#aaeeff';
    const maxTicks = isEnemy ? 22 : 18;
    const alpha = beam.ticks / maxTicks;
    const shadowCol = isBossLaser ? '#ff6600' : isQueenLaser ? '#dd44ff' : isDevourerLaser ? '#88ff44' : isFrostLaser ? '#aaeeff' : isEnemy ? '#ff2200' : beam.powered ? '#ffaa00' : '#00ffff';
    const strokeOut = isBossLaser ? '#cc2200' : isQueenLaser ? '#cc33ff' : isDevourerLaser ? '#6b2fa8' : isFrostLaser ? '#66ccff' : isEnemy ? '#ff4400' : beam.powered ? '#ffcc00' : '#44ddff';
    const strokeIn = isBossLaser ? '#ff8800' : isQueenLaser ? '#ee99ff' : isDevourerLaser ? '#88ff44' : isFrostLaser ? '#cceeff' : isEnemy ? '#ff8844' : beam.powered ? '#ffee88' : '#aaffff';
    const coreCol = isBossLaser ? '#ffee88' : isDevourerLaser ? '#c8ff88' : '#ffffff';

    // Boss laser flickers like a guttering flame column; Queen laser shimmers like arcane current
    const fireFlicker = isBossLaser ? 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.7)) : 1;
    const queenShimmer = isQueenLaser ? 0.75 + 0.25 * Math.abs(Math.sin(tickN * 0.35)) : 1;

    const outerW = isBossLaser ? Math.floor(TILE_SIZE * 1.2 * fireFlicker) : isDevourerLaser ? Math.floor(TILE_SIZE * 0.5) : isFrostLaser ? Math.floor(TILE_SIZE * 0.7) : isEnemy ? Math.max(4, Math.floor(TILE_SIZE * 0.25)) : TILE_SIZE;
    const innerW = isBossLaser ? Math.floor(TILE_SIZE * 0.6 * fireFlicker) : isDevourerLaser ? Math.floor(TILE_SIZE * 0.3) : isFrostLaser ? Math.floor(TILE_SIZE * 0.4) : Math.max(4, Math.floor(TILE_SIZE * 0.35));
    const coreW = isBossLaser ? 4 : isDevourerLaser ? 3 : isFrostLaser ? 4 : 2;

    ctx.lineCap = 'square';
    ctx.globalAlpha = alpha * 0.45 * fireFlicker * queenShimmer;
    ctx.shadowColor = shadowCol;
    ctx.shadowBlur = isBossLaser ? Math.floor(32 * fireFlicker) : 18;
    ctx.strokeStyle = strokeOut;
    ctx.lineWidth = outerW;
    ctx.beginPath();
    ctx.moveTo(beam.fromX - camX, beam.fromY - camY);
    ctx.lineTo(beam.endX - camX, beam.endY - camY);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.85 * fireFlicker;
    ctx.strokeStyle = strokeIn;
    ctx.lineWidth = innerW;
    ctx.beginPath();
    ctx.moveTo(beam.fromX - camX, beam.fromY - camY);
    ctx.lineTo(beam.endX - camX, beam.endY - camY);
    ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = coreCol;
    ctx.lineWidth = coreW;
    ctx.beginPath();
    ctx.moveTo(beam.fromX - camX, beam.fromY - camY);
    ctx.lineTo(beam.endX - camX, beam.endY - camY);
    ctx.stroke();

    // Arcane ripple — a shimmering wavy line riding alongside the Queen's bolt (heat-shimmer,
    // but magical): several short zigzag segments offset by a traveling sine wave
    if (isQueenLaser) {
      const rdx = beam.endX - beam.fromX, rdy = beam.endY - beam.fromY;
      const rlen = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
      const rnx = -rdy / rlen, rny = rdx / rlen;
      ctx.globalAlpha = alpha * 0.5 * queenShimmer;
      ctx.strokeStyle = '#ffccff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ee66ff'; ctx.shadowBlur = 10;
      ctx.beginPath();
      const rippleSegs = 8;
      for (let i = 0; i <= rippleSegs; i++) {
        const t = i / rippleSegs;
        const wob = Math.sin(t * Math.PI * 4 + tickN * 0.4) * 4;
        const px = beam.fromX + rdx * t - camX + rnx * wob;
        const py = beam.fromY + rdy * t - camY + rny * wob;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Queen bolt magic dust storm — a dense scatter of twinkling motes riding the whole beam,
    // matching her orbiting-mote body effect: lots of them, varied size/color, drifting and twinkling
    if (isQueenLaser) {
      const bdx = beam.endX - beam.fromX, bdy = beam.endY - beam.fromY;
      const blen = Math.sqrt(bdx * bdx + bdy * bdy) || 1;
      const nx = -bdy / blen, ny = bdx / blen; // perpendicular unit vector
      const sparkleCount = 22;
      const sparkleColors = ['#ffccff', '#ee99ff', '#ffffff'];
      for (let s = 0; s < sparkleCount; s++) {
        const t = (s + 0.5) / sparkleCount + Math.sin(s * 2.7) * 0.02;
        const cycle = 18 + (s % 5) * 3;
        const phase = (tickN * 0.7 + s * 6.1) % cycle;
        const life = phase / cycle; // 0 -> 1 twinkle lifespan
        const wobble = Math.sin(tickN * 0.3 + s * 1.7) * 6 + (life - 0.5) * 10; // drifts outward as it twinkles
        const px = beam.fromX + bdx * t - camX + nx * wobble;
        const py = beam.fromY + bdy * t - camY + ny * wobble;
        const sSz = Math.max(1, 3 - Math.floor(life * 2));
        ctx.globalAlpha = alpha * Math.sin(life * Math.PI);
        ctx.shadowColor = '#ee66ff'; ctx.shadowBlur = 8;
        ctx.fillStyle = sparkleColors[s % sparkleColors.length];
        ctx.fillRect(px - sSz / 2, py - sSz / 2, sSz, sSz);
      }
    }

    // Boss laser ember storm — a dense scatter of embers riding the whole beam, matching the
    // rising-ember effect on his body: lots of them, varied size/color, some rising, some falling
    if (isBossLaser) {
      const bdx = beam.endX - beam.fromX, bdy = beam.endY - beam.fromY;
      const blen2 = Math.sqrt(bdx * bdx + bdy * bdy) || 1;
      const bnx = -bdy / blen2, bny = bdx / blen2; // perpendicular unit vector
      const emberCount = 22;
      for (let s = 0; s < emberCount; s++) {
        const t = (s + 0.5) / emberCount + Math.sin(s * 3.1) * 0.02;
        const cycle = 16 + (s % 5) * 3;
        const phase = (tickN * 0.8 + s * 7.3) % cycle;
        const life = phase / cycle; // 0 -> 1 over this ember's lifespan
        const rising = s % 2 === 0;
        const drift = (rising ? -1 : 1) * life * 16; // half rise, half fall off the beam line
        const jitter = Math.sin(tickN * 0.3 + s * 2.3) * 4;
        const px = beam.fromX + bdx * t - camX + bnx * jitter;
        const py = beam.fromY + bdy * t - camY + bny * jitter + drift;
        const eSz = Math.max(1, 3 - Math.floor(life * 2));
        const eAlpha = alpha * Math.sin(life * Math.PI); // fades in, peaks mid-life, fades out
        ctx.globalAlpha = eAlpha;
        ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 8;
        ctx.fillStyle = life < 0.4 ? '#ffee00' : life < 0.7 ? '#ff8800' : '#ff3300';
        ctx.fillRect(px - eSz / 2, py - eSz / 2, eSz, eSz);
      }
    }

    // Frost Warden ice-laser — a dense scatter of drifting ice-crystal shards riding the
    // whole beam, matching her shield's shard-orbit effect rather than embers or magic dust
    if (isFrostLaser) {
      const fdx = beam.endX - beam.fromX, fdy = beam.endY - beam.fromY;
      const flen2 = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
      const fnx = -fdy / flen2, fny = fdx / flen2;
      const shardCount = 24;
      for (let s = 0; s < shardCount; s++) {
        const t = (s + 0.5) / shardCount + Math.sin(s * 2.9) * 0.02;
        const cycle = 14 + (s % 4) * 3;
        const phase = (tickN * 0.7 + s * 5.7) % cycle;
        const life = phase / cycle;
        const jitter = Math.sin(tickN * 0.25 + s * 2.1) * 10;
        const px = beam.fromX + fdx * t - camX + fnx * jitter;
        const py = beam.fromY + fdy * t - camY + fny * jitter;
        const fAlpha = alpha * Math.sin(life * Math.PI);
        const fSz = Math.max(1, 4 - Math.floor(life * 2));
        ctx.globalAlpha = fAlpha;
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
        ctx.fillStyle = s % 3 === 0 ? '#ffffff' : s % 3 === 1 ? '#aaeeff' : '#66ccff';
        ctx.fillRect(px - fSz / 2, py - fSz / 2, fSz, fSz);
      }
    }

    // Devourer sound-wave — several traveling concentric arcs pulsing along the beam path,
    // reading as an audio waveform/shout rather than a solid bolt like the King/Queen's
    if (isDevourerLaser) {
      const sdx = beam.endX - beam.fromX, sdy = beam.endY - beam.fromY;
      const slen = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
      const snx = -sdy / slen, sny = sdx / slen;
      const ringCount = 6;
      for (let r = 0; r < ringCount; r++) {
        const t = ((tickN * 0.06 + r / ringCount) % 1);
        ctx.globalAlpha = alpha * Math.sin(t * Math.PI);
        ctx.strokeStyle = '#c8ff88';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#88ff44'; ctx.shadowBlur = 16;
        ctx.beginPath();
        const segs = 14;
        let started = false;
        for (let i = 0; i <= segs; i++) {
          const segT = t - 0.13 + (i / segs) * 0.26; // a short wavy arc segment riding along the beam
          if (segT < 0 || segT > 1) continue;
          const wob = Math.sin(i / segs * Math.PI) * 18;
          const px = beam.fromX + sdx * segT - camX + snx * wob;
          const py = beam.fromY + sdy * segT - camY + sny * wob;
          if (!started) { ctx.moveTo(px, py); started = true; } else { ctx.lineTo(px, py); }
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
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
    ctx.shadowBlur = 40;
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 14;
    ctx.strokeRect(wx - r, wy - r, r * 2, r * 2);

    // Bright core ring
    ctx.globalAlpha = Math.min(1, alpha * 1.2);
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(wx - r, wy - r, r * 2, r * 2);

    // Inner secondary ring (lags behind at 70% radius)
    const r2 = r * 0.7;
    ctx.globalAlpha = alpha * 0.8;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(wx - r2, wy - r2, r2 * 2, r2 * 2);

    // Wave faint fill
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = glowColor;
    ctx.fillRect(wx - r, wy - r, r * 2, r * 2);

    // Tinted fill
    ctx.globalAlpha = alpha * 0.12;
    ctx.fillStyle = ringColor;
    ctx.fillRect(wx - r, wy - r, r * 2, r * 2);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Bomb blasts (blocky square explosion)
  for (const b of state.bombBlasts) {
    const alpha = (b.ticks / 28) * 0.9;
    const bwx = b.cx - camX, bwy = b.cy - camY, r = b.radius;
    ctx.globalAlpha = Math.min(1, alpha * 1.5);
    ctx.strokeStyle = '#ffee77';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 40;
    ctx.lineWidth = 6;
    ctx.strokeRect(bwx - r, bwy - r, r * 2, r * 2);
    ctx.globalAlpha = Math.min(1, alpha * 1.2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(bwx - r * 0.5, bwy - r * 0.5, r, r);
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = '#ff3300';
    ctx.fillRect(bwx - r, bwy - r, r * 2, r * 2);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  ctx.restore(); // back to true physical-pixel space — unaffected by the world zoom above

  // Minimap — drawn in true pixel space, with its own independent (smaller) mobile sizing
  drawMinimap(ctx, state, canvasW, tickN, isMobileTouch);
}

// ─── Mobile ability button ────────────────────────────────────────────────────

function TouchAbilityButton({ label, color, size = 56, onDown, onUp, className, style }: {
  label: React.ReactNode; color: string; size?: number; onDown: () => void; onUp?: () => void;
  className?: string; style?: React.CSSProperties;
}) {
  return (
    <button
      className={className}
      onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${color}`, background: 'rgba(10,10,20,0.55)',
        color, fontFamily: 'var(--font-pixel)', fontWeight: 700, fontSize: size < 44 ? '0.4rem' : '0.65rem',
        boxShadow: `0 0 12px ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none', padding: 0, lineHeight: 1.1, textAlign: 'center',
        ...style,
      }}
    >
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RubyStarPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const tickRef = useRef(0);
  const rafRef = useRef(0);
  const bgmRef = useRef<BGMControllerHandle>(null);
  const [showRules, setShowRules] = useState(true);
  const [, forceRender] = useState(0);
  const [isGodQuery, setIsGodQuery] = useState(false);
  // Ref (not state) — read imperatively inside the rAF draw loop, whose effect doesn't
  // re-run on state changes, so a plain useState here would risk a stale closure.
  const isMobileTouchRef = useRef(false);
  const teleportOpenedAtRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownTimeRef = useRef<number>(0);
  const rightMouseHeldRef = useRef<boolean>(false);

  // ── Mobile virtual joystick ──────────────────────────────────────────────
  const [joyThumb, setJoyThumb] = useState({ x: 0, y: 0 });
  const joyPointerIdRef = useRef<number | null>(null);
  const JOY_RADIUS = 64;
  const JOY_DEADZONE = 12;

  const updateJoyFromPointer = useCallback((clientX: number, clientY: number, baseEl: HTMLElement) => {
    const rect = baseEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOY_RADIUS) { dx = (dx / dist) * JOY_RADIUS; dy = (dy / dist) * JOY_RADIUS; }
    setJoyThumb({ x: dx, y: dy });

    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    if (dist < JOY_DEADZONE) {
      state.playerQueuedDirX = 0; state.playerQueuedDirY = 0;
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      state.playerQueuedDirX = dx > 0 ? 1 : -1;
      state.playerQueuedDirY = 0;
    } else {
      state.playerQueuedDirX = 0;
      state.playerQueuedDirY = dy > 0 ? 1 : -1;
    }
  }, []);

  const handleJoyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    joyPointerIdRef.current = e.pointerId;
    updateJoyFromPointer(e.clientX, e.clientY, e.currentTarget);
  };
  const handleJoyPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    updateJoyFromPointer(e.clientX, e.clientY, e.currentTarget);
  };
  const handleJoyPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    joyPointerIdRef.current = null;
    setJoyThumb({ x: 0, y: 0 });
    const state = stateRef.current;
    if (state) { state.playerQueuedDirX = 0; state.playerQueuedDirY = 0; }
  };

  // ── Mobile ability buttons — reuse the exact same engine calls as mouse/keyboard ──
  const handleTouchLaserDown = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    mouseDownTimeRef.current = Date.now();
    useLaser(state);
    rerender();
  };
  const handleTouchLaserUp = () => { mouseDownTimeRef.current = 0; };
  const handleTouchBullet = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    useBullet(state); rerender();
  };
  const handleTouchSpeed = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    useSpeedBoost(state); rerender();
  };
  const handleTouchBomb = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    useBomb(state); rerender();
  };
  // RUBY and HEAL are separate single-tap buttons — no hold-duration timing involved.
  const handleTouchRuby = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    toggleCarryRuby(state); rerender();
  };
  // HEAL also doubles as the TELEPORT button — identical priority to the Space key
  // (teleport if standing on a pad, otherwise heal).
  const handleTouchHeal = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    if (!tryActivateTeleport(state)) healRuby(state);
    rerender();
  };

  const rerender = useCallback(() => forceRender(n => n + 1), []);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    stateRef.current = createInitialState();
    if (typeof window !== 'undefined') {
      setIsGodQuery(window.location.search.includes('god=1'));
      // Require all three signals — some desktop setups (touchscreen laptops/monitors)
      // misreport hover/pointer and still have maxTouchPoints > 0, so also require a
      // phone/tablet-sized viewport (a real desktop display is essentially never this narrow,
      // even resized, since resizing a window doesn't add touch hardware or change these
      // media features on its own).
      isMobileTouchRef.current =
        window.matchMedia('(hover: none) and (pointer: coarse)').matches &&
        navigator.maxTouchPoints > 0 &&
        window.innerWidth <= 1024;
    }
    if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
      (screen.orientation as any).lock('landscape').catch(() => { });
    }
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (showRules) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const TARGET_MS = 1000 / 60;
    let lastTime = 0;
    let accumulator = 0;

    // Runs exactly one 60Hz game tick's worth of logic — pulled out of loop() so it can be
    // invoked 0, 1, or several times per rendered frame depending on real elapsed time,
    // instead of being tied to however often requestAnimationFrame happens to fire.
    function runOneTick(state: GameState) {
      tickRef.current++;
      const chargingMsNow = mouseDownTimeRef.current > 0 ? Date.now() - mouseDownTimeRef.current : 0;
      // Full charge takes longer while chilled by a Frost Warden sharing the player's chamber
      const waveChargeMsNow = isPlayerChilled(state) ? 1500 : 1000;
      // Auto-fire wave once the hold reaches full charge (only if wave not on cooldown)
      if (chargingMsNow >= waveChargeMsNow && state.gamePhase === 'playing' && state.waveCooldown <= 0) {
        activateWave(state);
        mouseDownTimeRef.current = Date.now();
      }
      // Charge build-up sound — the same simple tone already used for the LASER's charge
      // hits, played once every ~120ms while charging. A custom rising-pitch oscillator was
      // tried twice here and regressed to sounding "slowed" even when not chilled both times
      // (likely from creating a fresh AudioContext on every single tick instead of reusing
      // one) — not worth re-chasing, this simple version is proven correct.
      if (chargingMsNow >= 200 && state.waveCooldown <= 0 && state.gamePhase === 'playing') {
        const chargeSlot = Math.floor(chargingMsNow / 120);
        const prevChargeSlot = Math.floor((chargingMsNow - 16) / 120);
        if (chargeSlot !== prevChargeSlot) playSFX_charge();
      }
      // Lock movement while ACTIVELY charging (not during cooldown)
      if (chargingMsNow >= 200 && state.waveCooldown <= 0) {
        state.playerQueuedDirX = 0;
        state.playerQueuedDirY = 0;
      }
      // Auto-fire bullet while right mouse button is held — fires at exactly the same rate
      // as spam-clicking, since useBullet is already self-gated by the raw bulletCooldown.
      if (rightMouseHeldRef.current && state.gamePhase === 'playing' && state.bulletCooldown <= 0) {
        useBullet(state);
      }
      if (state.gamePhase !== 'lost') tick(state);
    }

    function loop(ts: number) {
      rafRef.current = requestAnimationFrame(loop);
      const state = stateRef.current;
      if (!state) return;

      if (lastTime === 0) lastTime = ts;
      let delta = ts - lastTime;
      lastTime = ts;
      // Cap a single frame's catch-up so a backgrounded tab / debugger pause doesn't dump
      // a huge burst of ticks the instant the tab regains focus.
      if (delta > TARGET_MS * 5) delta = TARGET_MS * 5;
      accumulator += delta;

      // Fixed-timestep: run exactly as many 60Hz ticks as real time has actually elapsed,
      // regardless of the display's refresh rate — the previous "skip if too soon" heuristic
      // (ts - lastTime < TARGET_MS * 0.8) wasn't a clean divisor of every refresh rate (144Hz
      // in particular), so ticks — and everything timed in ticks: boss spawns, cooldowns,
      // ice-tile freezes, all of it — ran up to ~20% faster than intended on those displays.
      while (accumulator >= TARGET_MS) {
        accumulator -= TARGET_MS;
        runOneTick(state);
      }

      const t = tickRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      if (W === 0 || H === 0) return;
      ctx.imageSmoothingEnabled = false;
      const chargingMs = mouseDownTimeRef.current > 0 ? Date.now() - mouseDownTimeRef.current : 0;
      drawGame(ctx, state, W, H, t, chargingMs, isMobileTouchRef.current);
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
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      canvas.style.width = `${parent.clientWidth}px`;
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
        if (e.key === 'Escape' || e.code === 'Space') { cancelTeleport(state); rerender(); return; }
        const numMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
        const dest = numMap[e.key];
        if (dest !== undefined && state.teleportDestOptions.includes(dest)) {
          doTeleport(state, dest); rerender(); return;
        }
        return;
      }

      // Movement
      const dirMap: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
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
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
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
      rightMouseHeldRef.current = true;
      useBullet(state);
      rerender();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2) { rightMouseHeldRef.current = false; return; }
    if (e.button !== 0) return;
    mouseDownTimeRef.current = 0; // cancel any in-progress charge
  };

  const handleMouseLeave = () => {
    rightMouseHeldRef.current = false;
  };

  // ── Touch swipe ───────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (document.fullscreenElement === null && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => { });
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

  const handleRestart = () => {
    const s = createInitialState();
    s.godMode = stateRef.current?.godMode ?? false;
    stateRef.current = s;
    tickRef.current = 0;
    rightMouseHeldRef.current = false;
    rerender();
  };

  const state = stateRef.current;
  const phase = state?.gamePhase ?? 'playing';
  const timeSurvived = Math.floor(state?.score ?? 0);

  // Guards the teleport overlay's backdrop-tap-to-cancel against the mobile "ghost click":
  // the same touch that opened the menu (tapping HEAL/TP) can generate a trailing synthetic
  // click at the same screen coordinates, landing on the backdrop that just appeared there
  // and instantly cancelling it. Ignore backdrop clicks within a short window of opening.
  useEffect(() => {
    if (phase === 'teleporting') teleportOpenedAtRef.current = Date.now();
  }, [phase]);

  const rubyHealAvail = state ? canHealRuby(state) : false;
  const powered = (state?.poweredTicks ?? 0) > 0 || (state?.starEnergy ?? 0) >= STAR_ENERGY_MAX;
  const carrying = state?.playerCarryingRuby ?? true;

  // HP percentages
  const playerHpPct = Math.max(0, Math.min(100, ((state?.playerHP ?? PLAYER_MAX_HP) / PLAYER_MAX_HP) * 100));
  const rubyHpPct = Math.max(0, Math.min(100, ((state?.rubyHP ?? RUBY_MAX_HP) / RUBY_MAX_HP) * 100));
  const energyPct = Math.max(0, Math.min(100, ((state?.starEnergy ?? 0) / STAR_ENERGY_MAX) * 100));

  const playerBattColor = playerHpPct > 60 ? 'var(--success)' : playerHpPct > 30 ? 'var(--warning)' : 'var(--danger)';
  const rubyBattColor = rubyHpPct > 60 ? '#ff4488' : rubyHpPct > 30 ? '#ff7700' : '#ff2200';

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
        /* Touch controls (joystick + ability buttons) only ever show on devices whose
           primary input has no hover and no fine pointer — i.e. touch, never desktop mouse.
           !important on both rules: several of these elements (TouchAbilityButton) also set
           display:flex inline for their own centering, which would otherwise always beat a
           plain (non-important) class rule regardless of media query. */
        .rs-touch-controls { display: none !important; }
        @media (hover: none) and (pointer: coarse) {
          .rs-touch-controls { display: flex !important; }
        }
      `}</style>

      <BGMController ref={bgmRef} visible={false} src={['/sounds/rubyStarBGM.mp3']} volume={[0.29]} />

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

          {/* CONTROLS & ABILITIES */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              CONTROLS &amp; ABILITIES
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.9 }}>
              <span style={{ color: 'var(--cyan)' }}>WASD / Arrows / Swipe</span> — Move<br />
              <span style={{ color: 'var(--cyan)' }}>E / F</span> — Carry or place the Ruby Core (pick up within 2 tiles)<br />
              <span style={{ color: 'var(--cyan)' }}>SPACE</span> — Heal nearby Ruby (if no enemies close) · or Teleport (if on ✦ pad)<br />
              <span style={{ color: '#ffcc44' }}>Left-click</span> — <span style={{ color: '#ffcc44' }}>LASER</span> — beam forward, pierces enemies<br />
              <span style={{ color: '#aaddff' }}>Hold-click</span> — <span style={{ color: '#aaddff' }}>WAVE</span> — charged ring blast (hold ~1s to auto-fire)<br />
              <span style={{ color: '#ffee44' }}>Shift</span> — <span style={{ color: '#ffee44' }}>SPEED</span> — brief speed burst<br />
              <span style={{ color: BOMB_COLOR }}>Q</span> — <span style={{ color: BOMB_COLOR }}>BOMB</span> — place first, press again to detonate. Its blast also hurts <em>you</em> if you&apos;re still in range (the Ruby is never damaged by it)<br />
              <span style={{ color: '#ff9944' }}>Right-click</span> — <span style={{ color: '#ff9944' }}>BULLET</span> — fast low-damage burst<br />
              <span style={{ color: 'var(--text-muted)' }}>1–4</span> — Select teleport destination after menu opens · ESC to cancel<br />
              <span style={{ color: 'var(--text-muted)' }}>Mobile</span> — on-screen joystick (move) + ability buttons replace keyboard/mouse; same abilities, same cooldowns
            </p>
          </div>

          {/* RUBY CORE */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              RUBY CORE &amp; HEALING
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <span style={{ color: RUBY_COLOR }}>Carry it</span> — movement slows but enemies only target you.<br />
              <span style={{ color: '#ffaa00' }}>Place it</span> — enemies can attack the ruby directly.<br />
              Stand near the ruby with no enemies close, then press{' '}
              <span style={{ color: '#ff88aa' }}>SPACE</span> to slowly heal both yourself and the Ruby Core.
            </p>
          </div>

          {/* STAR ENERGY & TELEPORT */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              STAR ENERGY ✦ &amp; TELEPORT
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Kill enemies (not meteors) and collect <span style={{ color: '#66aaff' }}>energy crystals</span> to fill your star gauge.
              When full, your next ability is <span style={{ color: '#ffcc00' }}>POWERED UP</span> for extra damage or range.<br />
              Each chamber has a <span style={{ color: 'var(--cyan)' }}>✦ teleport pad</span> at its center.
              Step on one and press SPACE to jump instantly between any of the 4 chambers.
              Opening the destination menu <span style={{ color: '#ffcc00' }}>pauses the game</span> — enemies, timers, and the meteorite/boss clocks all freeze until you pick a chamber or cancel.
            </p>
          </div>

          {/* METEORITE */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              METEORITE ☄
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Every ~30 seconds a chamber is targeted, cycling clockwise (ALPHA → BETA → DELTA → GAMMA → repeat). You have{' '}
              <span style={{ color: 'var(--danger)' }}>5 seconds to escape</span> — watch the minimap and the warning banner!
              Every enemy in the struck chamber is wiped out (all boss types instead lose 75% of their max HP — dying outright if already at or below that, except the Soul Devourer who a meteor alone can never finish off below 5% HP).
            </p>
          </div>

          {/* STRATEGY TIPS */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: '#ffcc00', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              ★ HINT
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
              Meteorite and teleportation could create a good synergy!
            </p>
          </div>

          {/* ENEMIES */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              ENEMIES
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.9 }}>
              <span style={{ color: '#44ee44' }}>■ NORMAL</span> — Standard attacker. Fast and fragile.<br />
              <span style={{ color: '#4488ff' }}>■ ARMORED</span> — Tanky with a damage shield. Slow but hits hard. Drops more energy.<br />
              <span style={{ color: '#ff8844' }}>■ FAST</span> — Extremely quick and fragile. Don&apos;t let it swarm you.<br />
              <span style={{ color: '#cc44ff' }}>■ BOMBER</span> — Self-destructs in a wide blast on arrival. Keep your distance.<br />
              <span style={{ color: '#ffdd44' }}>■ SNIPER</span> — Long-range shot with windup telegraph. Kill it for a 5s electric chain buff.<br />
              <span style={{ color: '#ff4444' }}>■ HEALER</span> — Heals nearby allies. Prioritize it. Kill rewards +20 player HP.<br />
              <span style={{ color: '#ff6600' }}>■ CHARGER</span> — Locks on and charges at high speed. Kill rewards a speed burst.<br />
              <span style={{ color: '#aaaaaa' }}>■ GHOST</span> — Phases through walls. Semi-transparent and hard to track. Kill restores +15 ruby HP.<br />
              <span style={{ color: '#ee8822' }}>■ SPLITTER</span> — Splits into 2 Mini Splitters on death. Tanky stacked-box design.<br />
              <span style={{ color: '#cc6611' }}>■ MINI SPLITTER</span> — Spawned from Splitter death. Small and fast.<br />
              <span style={{ color: '#44ddff' }}>■ SHIELDER</span> — Shields the most-injured ally, halving all damage it takes. Kill grants ~2.5s invincibility.<br />
              <span style={{ color: '#cc0022' }}>■ FIERY KING</span> — High HP, high damage, speeds up the longer he's alive.<br />
              <span style={{ color: '#cc33ff' }}>■ SHADOW QUEEN</span> — Teleports between chambers and leaves a decoy behind that keeps attacking.<br />
              <span style={{ color: '#00eaff' }}>■ STORM REAPER</span> — Fast, only hunts you (never the ruby), can seal a hallway shut to trap you.<br />
              <span style={{ color: '#6b2fa8' }}>■ SOUL DEVOURER</span> — Eats nearby enemies to grow bigger, tankier, and stronger — don't let her feast.<br />
              <span style={{ color: '#aaeeff' }}>■ FROST WARDEN</span> — Never attacks directly. Chills her chamber (slows you and your attack speed), scatters freezing ice tiles, and shields nearby allies.
            </p>
          </div>
        </div>
      </RulesModal>

      {/* God Mode UI */}
      {isGodQuery && (
        <div style={{
          position: 'absolute', top: 10, right: 230,
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
          <button
            style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #cc0022', borderRadius: '4px' }}
            onClick={() => {
              if (stateRef.current) godSpawnBoss(stateRef.current, 'fiery_king');
              rerender();
            }}>
            Spawn Fiery King
          </button>
          <button
            style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #cc33ff', borderRadius: '4px' }}
            onClick={() => {
              if (stateRef.current) godSpawnBoss(stateRef.current, 'splitter_queen');
              rerender();
            }}>
            Spawn Shadow Queen
          </button>
          <button
            style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #00eaff', borderRadius: '4px' }}
            onClick={() => {
              if (stateRef.current) godSpawnBoss(stateRef.current, 'storm_reaper');
              rerender();
            }}>
            Spawn Storm Reaper
          </button>
          <button
            style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #6b2fa8', borderRadius: '4px' }}
            onClick={() => {
              if (stateRef.current) godSpawnBoss(stateRef.current, 'devourer');
              rerender();
            }}>
            Spawn Soul Devourer
          </button>
          <button
            style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #aaeeff', borderRadius: '4px' }}
            onClick={() => {
              if (stateRef.current) godSpawnBoss(stateRef.current, 'frost_warden');
              rerender();
            }}>
            Spawn Frost Warden
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
            <span style={{
              fontSize: 'var(--font-stat)', color: powered ? '#ffcc00' : 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.1em',
              textShadow: powered ? '0 0 10px #ffcc00' : 'none'
            }}>✦</span>
            <div style={{
              width: 'var(--batt-w)', height: 'var(--batt-h)', border: `1px solid ${powered ? '#00ffff' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '2px', background: 'rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', width: `${energyPct}%`,
                background: powered ? '#ffffff' : 'linear-gradient(90deg, #4488ff, #88ccff)',
                boxShadow: powered ? '0 0 10px #00ffff' : 'none', transition: 'background 0.3s'
              }} />
              <div style={{
                position: 'absolute', right: -2, top: '25%', width: 4, height: '50%',
                background: powered ? '#ffffff' : 'rgba(255,255,255,0.2)', borderRadius: '0 2px 2px 0'
              }} />
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
              style={{
                fontSize: '0.7rem', padding: '4px 10px',
                color: state?.godMode ? 'var(--success)' : undefined,
                borderColor: state?.godMode ? 'var(--success)' : undefined
              }}
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
        onMouseLeave={handleMouseLeave}
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
            onClick={(e) => {
              if (e.target !== e.currentTarget) return;
              if (Date.now() - teleportOpenedAtRef.current < 400) return; // ignore the opening tap's ghost click
              cancelTeleport(state); rerender();
            }}
          >
            <p style={{
              fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: 'var(--cyan)',
              textShadow: '0 0 16px var(--cyan)', letterSpacing: '0.12em'
            }}>
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
        {phase === 'playing' && (state?.bossWarningTicks ?? 0) > 0 && (
          <div style={{
            position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(20,0,0,0.92)', border: '2px solid #cc0022',
            boxShadow: '0 0 28px #cc002288',
            borderRadius: '6px', padding: '8px 24px',
            display: 'flex', alignItems: 'center', gap: '14px',
            animation: 'pulseGlow 0.35s ease-in-out infinite',
            pointerEvents: 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: '#ff2244' }}>
              ⚠ BOSS APPROACHING
            </span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: '#ffcc00' }}>
              {Math.ceil((state?.bossWarningTicks ?? 0) / 60)}s
            </span>
          </div>
        )}

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

      {/* ── Mobile touch controls — joystick (movement) + ability buttons ──────
          CSS-hidden whenever the device has a real mouse (hover:hover + pointer:fine),
          so desktop input/behavior is completely unchanged. Siblings of the canvas
          wrapper (not descendants), so they never interfere with its own touch/mouse
          handlers — a touch starting here simply never bubbles into that div. */}
      {phase === 'playing' && (
        <>
          <div
            className="rs-touch-controls"
            style={{
              position: 'fixed', left: '30px', bottom: '30px', zIndex: 60,
              width: '160px', height: '160px', borderRadius: '50%',
              border: '2px solid rgba(0,212,255,0.35)', background: 'rgba(0,20,30,0.35)',
              touchAction: 'none', alignItems: 'center', justifyContent: 'center',
            }}
            onPointerDown={handleJoyPointerDown}
            onPointerMove={handleJoyPointerMove}
            onPointerUp={handleJoyPointerUp}
            onPointerCancel={handleJoyPointerUp}
          >
            <div style={{
              position: 'absolute',
              left: `calc(50% + ${joyThumb.x}px - 35px)`,
              top: `calc(50% + ${joyThumb.y}px - 35px)`,
              width: '70px', height: '70px', borderRadius: '50%',
              background: 'rgba(0,212,255,0.35)', border: '2px solid rgba(0,212,255,0.8)',
              boxShadow: '0 0 12px rgba(0,212,255,0.5)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Ability cluster — scattered arc layout (mirrors a Genshin-style mobile HUD):
              LASER in the center, BULLET low-and-left of it, BOMB above-right of that,
              RUBY to bullet's left, and a small SPEED/dash button in the very corner.
              Each button grays out while its ability is on cooldown. */}
          <TouchAbilityButton
            label="LASER" color={(state?.laserCooldown ?? 0) > 0 ? COOLDOWN_GRAY : '#ffcc44'} size={64}
            onDown={handleTouchLaserDown} onUp={handleTouchLaserUp}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '68px', bottom: '80px', zIndex: 60 }}
          />
          <TouchAbilityButton
            label="BULLET" color={(state?.bulletCooldown ?? 0) > 0 ? COOLDOWN_GRAY : '#ff9944'} size={64}
            onDown={handleTouchBullet}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '96px', bottom: '16px', zIndex: 60 }}
          />
          <TouchAbilityButton
            label="BOMB" color={(!state?.bomb && (state?.bombCooldown ?? 0) > 0) ? COOLDOWN_GRAY : BOMB_COLOR} size={64}
            onDown={handleTouchBomb}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '8px', bottom: '110px', zIndex: 60 }}
          />
          {/* RUBY — carry/place toggle, identical to E/F */}
          <TouchAbilityButton
            label="RUBY" color={RUBY_COLOR} size={60}
            onDown={handleTouchRuby}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '176px', bottom: '16px', zIndex: 60 }}
          />
          {/* HEAL/TP — teleport-or-heal, identical to Space */}
          <TouchAbilityButton
            label={<>HEAL<br />TP</>} color="#ff88aa" size={60}
            onDown={handleTouchHeal}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '252px', bottom: '16px', zIndex: 60 }}
          />
          <TouchAbilityButton
            label="SPD" color={(state?.speedCooldown ?? 0) > 0 ? COOLDOWN_GRAY : '#ffee44'} size={48}
            onDown={handleTouchSpeed}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '16px', bottom: '16px', zIndex: 61 }}
          />
        </>
      )}

    </div>
  );
}
