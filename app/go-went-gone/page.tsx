'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import BackButton from '@/components/BackButton';
import RulesModal from '@/components/RulesModal';
import BGMController, { BGMControllerHandle } from '@/components/BGMController';
import {
  Timeline, TIMELINES, TIMELINE_THEME, PILLAR_WIDTHS,
  LOGICAL_H, HUD_H, PLAYER_SCREEN_X, PLAYER_W, PLAYER_H,
  GAP_SIZE, PILLAR_W,
  ENERGY_MAX, ENERGY_PICKUP_SIZE,
  HP_MAX,
  BUFF_SIZE, BUFF_META,
  GHOST_ALPHA_NORMAL, GHOST_ALPHA_SLOWMO,
  METEOR_SIZE,
  ObstacleKind,
} from './constants';
import { GameState, createInitialState, tick, TickInput } from './engine';

// ─── Utilities ────────────────────────────────────────────────────────────────

function ca(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── Background ───────────────────────────────────────────────────────────────

function drawBg(ctx: CanvasRenderingContext2D, tl: Timeline, w: number, h: number, cameraX: number) {
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, w, h);

  const color = TIMELINE_THEME[tl].color;
  ctx.strokeStyle = ca(color, 0.05);
  ctx.lineWidth = 1;

  for (let gy = 0; gy < h; gy += 44) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  }
  const vStep = 88;
  const vOff  = cameraX % vStep;
  for (let gx = -vOff; gx < w; gx += vStep) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
  }
}

// ─── Obstacle drawing (pw = per-timeline pillar width) ────────────────────────

function pillarBase(
  ctx: CanvasRenderingContext2D,
  sx: number, gapTop: number, gapBottom: number, h: number,
  color: string, body: string, pw: number,
) {
  ctx.fillStyle = body;
  ctx.fillRect(sx, 0, pw, gapTop);
  ctx.fillRect(sx, gapBottom, pw, h - gapBottom);
  ctx.fillStyle = color;
  ctx.fillRect(sx, 0, 2, gapTop);
  ctx.fillRect(sx + pw - 2, 0, 2, gapTop);
  ctx.fillRect(sx, gapBottom, 2, h - gapBottom);
  ctx.fillRect(sx + pw - 2, gapBottom, 2, h - gapBottom);
  ctx.fillRect(sx, Math.max(0, gapTop - 2), pw, 2);
  ctx.fillRect(sx, Math.min(h, gapBottom), pw, 2);
}

function drawRockWall(ctx: CanvasRenderingContext2D, sx: number, gapTop: number, gapBottom: number, h: number, color: string, body: string, pw: number) {
  pillarBase(ctx, sx, gapTop, gapBottom, h, color, body, pw);
  ctx.fillStyle = ca(color, 0.22);
  for (let ry = 18; ry < gapTop; ry += 18) ctx.fillRect(sx + 2, ry, pw - 4, 1);
  for (let ry = gapBottom + 18; ry < h; ry += 18) ctx.fillRect(sx + 2, ry, pw - 4, 1);
  ctx.fillStyle = color;
  const tooth = 10;
  for (let i = 0; i * tooth < pw; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(sx + i * tooth, Math.max(0, gapTop - 10), tooth - 1, 10);
      ctx.fillRect(sx + i * tooth, gapBottom, tooth - 1, 10);
    }
  }
}

function drawDeadTree(ctx: CanvasRenderingContext2D, sx: number, gapTop: number, gapBottom: number, h: number, color: string, body: string, pw: number) {
  pillarBase(ctx, sx, gapTop, gapBottom, h, color, body, pw);
  const trunkX = sx + pw / 2 - 4;
  ctx.fillStyle = ca(color, 0.4);
  ctx.fillRect(trunkX, 0, 8, gapTop);
  ctx.fillRect(trunkX, gapBottom, 8, h - gapBottom);
  ctx.fillStyle = color;
  ctx.fillRect(sx + 6,       Math.max(0, gapTop - 22), 22, 4);
  ctx.fillRect(sx + 6,       Math.max(0, gapTop - 22), 4,  22);
  ctx.fillRect(sx + pw - 28, Math.max(0, gapTop - 16), 22, 4);
  ctx.fillRect(sx + pw - 12, Math.max(0, gapTop - 16), 4,  16);
  ctx.fillRect(sx + 6,       gapBottom + 4, 4, 18);
  ctx.fillRect(sx + 6,       gapBottom + 4, 18, 4);
  ctx.fillRect(sx + pw - 28, gapBottom + 4, 22, 4);
  ctx.fillRect(sx + pw - 12, gapBottom + 4, 4, 16);
}

function drawMountain(ctx: CanvasRenderingContext2D, sx: number, gapTop: number, gapBottom: number, h: number, color: string, body: string, pw: number) {
  pillarBase(ctx, sx, gapTop, gapBottom, h, color, body, pw);
  const stepW = Math.floor(pw / 5);
  const stepH = 13;
  ctx.fillStyle = ca(color, 0.75);
  for (let i = 0; i < 5; i++) {
    const sh = (5 - Math.abs(i - 2)) * stepH;
    ctx.fillRect(sx + i * stepW, Math.max(0, gapTop - sh), stepW, sh);
    ctx.fillRect(sx + i * stepW, gapBottom, stepW, sh);
  }
  ctx.fillStyle = color;
  ctx.fillRect(sx + pw / 2 - 4, Math.max(0, gapTop - 5 * stepH), 8, 6);
  ctx.fillRect(sx + pw / 2 - 4, gapBottom + 5 * stepH - 6, 8, 6);
}

function drawBuilding(ctx: CanvasRenderingContext2D, sx: number, gapTop: number, gapBottom: number, h: number, color: string, body: string, pw: number) {
  pillarBase(ctx, sx, gapTop, gapBottom, h, color, body, pw);
  ctx.fillStyle = ca(color, 0.35);
  for (let wy = 14; wy < gapTop - 6; wy += 18) {
    for (let wx = sx + 8; wx < sx + pw - 8; wx += 16) ctx.fillRect(wx, wy, 6, 6);
  }
  for (let wy = gapBottom + 8; wy < h - 6; wy += 18) {
    for (let wx = sx + 8; wx < sx + pw - 8; wx += 16) ctx.fillRect(wx, wy, 6, 6);
  }
  ctx.fillStyle = color;
  for (let rx = sx + 4; rx < sx + pw - 4; rx += 12) {
    ctx.fillRect(rx, Math.max(0, gapTop - 6), 8, 6);
    ctx.fillRect(rx, gapBottom, 8, 6);
  }
}

function drawHedge(ctx: CanvasRenderingContext2D, sx: number, gapTop: number, gapBottom: number, h: number, color: string, body: string, pw: number) {
  pillarBase(ctx, sx, gapTop, gapBottom, h, color, body, pw);
  ctx.fillStyle = ca(color, 0.14);
  for (let hy = 10; hy < gapTop; hy += 10) {
    for (let hx = sx + 6; hx < sx + pw - 6; hx += 10) ctx.fillRect(hx, hy, 4, 4);
  }
  for (let hy = gapBottom + 6; hy < h; hy += 10) {
    for (let hx = sx + 6; hx < sx + pw - 6; hx += 10) ctx.fillRect(hx, hy, 4, 4);
  }
  ctx.fillStyle = color;
  const bW = 8;
  for (let i = 0; i * bW < pw; i++) {
    const bh = (i % 2 === 0) ? 14 : 9;
    ctx.fillRect(sx + i * bW, Math.max(0, gapTop - bh), bW - 1, bh);
    ctx.fillRect(sx + i * bW, gapBottom, bW - 1, bh);
  }
}

function drawBarrier(ctx: CanvasRenderingContext2D, sx: number, gapTop: number, gapBottom: number, h: number, color: string, body: string, pw: number) {
  const sw = 10;
  for (let i = 0; i * sw < pw; i++) {
    ctx.fillStyle = i % 2 === 0 ? body : ca(color, 0.18);
    ctx.fillRect(sx + i * sw, 0, sw, gapTop);
    ctx.fillRect(sx + i * sw, gapBottom, sw, h - gapBottom);
  }
  ctx.fillStyle = color;
  ctx.fillRect(sx, 0, 2, gapTop);
  ctx.fillRect(sx + pw - 2, 0, 2, gapTop);
  ctx.fillRect(sx, gapBottom, 2, h - gapBottom);
  ctx.fillRect(sx + pw - 2, gapBottom, 2, h - gapBottom);
  ctx.fillRect(sx, Math.max(0, gapTop - 2), pw, 2);
  ctx.fillRect(sx, Math.min(h, gapBottom), pw, 2);
  ctx.fillStyle = ca(color, 0.65);
  for (let i = 0; i * sw < pw; i += 2) {
    ctx.fillRect(sx + i * sw, Math.max(0, gapTop - 8), sw, 8);
    ctx.fillRect(sx + i * sw, gapBottom, sw, 8);
  }
}

function drawLaserGate(ctx: CanvasRenderingContext2D, sx: number, gapTop: number, gapBottom: number, h: number, color: string, body: string, pw: number, tick: number) {
  ctx.fillStyle = ca(body, 0.85);
  ctx.fillRect(sx, 0, pw, gapTop);
  ctx.fillRect(sx, gapBottom, pw, h - gapBottom);
  const pulse = 0.6 + 0.4 * Math.sin(tick * 0.1);
  ctx.fillStyle = ca(color, 0.10 * pulse);
  for (let ry = 0; ry < gapTop; ry += 10) ctx.fillRect(sx, ry, pw, 5);
  for (let ry = gapBottom; ry < h; ry += 10) ctx.fillRect(sx, ry, pw, 5);
  ctx.fillStyle = color;
  ctx.fillRect(sx, 0, 3, gapTop);
  ctx.fillRect(sx + pw - 3, 0, 3, gapTop);
  ctx.fillRect(sx, gapBottom, 3, h - gapBottom);
  ctx.fillRect(sx + pw - 3, gapBottom, 3, h - gapBottom);
  const ns = 10;
  ctx.fillRect(sx, Math.max(0, gapTop - ns), ns, ns);
  ctx.fillRect(sx + pw - ns, Math.max(0, gapTop - ns), ns, ns);
  ctx.fillRect(sx, gapBottom, ns, ns);
  ctx.fillRect(sx + pw - ns, gapBottom, ns, ns);
  ctx.fillStyle = ca(color, 0.55 + 0.45 * Math.sin(tick * 0.14));
  ctx.fillRect(sx, Math.max(0, gapTop - 2), pw, 2);
  ctx.fillRect(sx, Math.min(h, gapBottom), pw, 2);
}

function drawEnergyWall(ctx: CanvasRenderingContext2D, sx: number, gapTop: number, gapBottom: number, h: number, color: string, body: string, pw: number, tick: number) {
  pillarBase(ctx, sx, gapTop, gapBottom, h, color, body, pw);
  const scanOffset = (tick * 4) % 14;
  ctx.fillStyle = ca(color, 0.13);
  for (let ry = scanOffset; ry < gapTop; ry += 14) ctx.fillRect(sx + 2, ry, pw - 4, 7);
  for (let ry = gapBottom + scanOffset; ry < h; ry += 14) ctx.fillRect(sx + 2, ry, pw - 4, 7);
  ctx.fillStyle = ca(color, 0.55 + 0.45 * Math.sin(tick * 0.1));
  ctx.fillRect(sx, Math.max(0, gapTop - 4), pw, 4);
  ctx.fillRect(sx, Math.min(h, gapBottom), pw, 4);
}

function drawTowerArray(ctx: CanvasRenderingContext2D, sx: number, gapTop: number, gapBottom: number, h: number, color: string, body: string, pw: number) {
  ctx.fillStyle = body;
  ctx.fillRect(sx, 0, pw, gapTop);
  ctx.fillRect(sx, gapBottom, pw, h - gapBottom);
  const tW = 7; const tCount = 3;
  const gap2 = (pw - tCount * tW) / (tCount + 1);
  for (let t = 0; t < tCount; t++) {
    const tx = sx + gap2 + t * (tW + gap2);
    ctx.fillStyle = ca(color, 0.18);
    ctx.fillRect(tx, 0, tW, gapTop);
    ctx.fillRect(tx, gapBottom, tW, h - gapBottom);
    ctx.fillStyle = color;
    ctx.fillRect(tx, 0, 1, gapTop);
    ctx.fillRect(tx + tW - 1, 0, 1, gapTop);
    ctx.fillRect(tx, gapBottom, 1, h - gapBottom);
    ctx.fillRect(tx + tW - 1, gapBottom, 1, h - gapBottom);
    ctx.fillRect(tx - 3, Math.max(0, gapTop - 6), tW + 6, 6);
    ctx.fillRect(tx - 3, gapBottom, tW + 6, 6);
  }
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  kind: ObstacleKind,
  sx: number, gapTop: number, gapBottom: number, h: number,
  color: string, body: string,
  tick: number, pw: number,
) {
  switch (kind) {
    case 'rock_wall':   drawRockWall(ctx, sx, gapTop, gapBottom, h, color, body, pw); break;
    case 'dead_tree':   drawDeadTree(ctx, sx, gapTop, gapBottom, h, color, body, pw); break;
    case 'mountain':    drawMountain(ctx, sx, gapTop, gapBottom, h, color, body, pw); break;
    case 'building':    drawBuilding(ctx, sx, gapTop, gapBottom, h, color, body, pw); break;
    case 'hedge':       drawHedge(ctx, sx, gapTop, gapBottom, h, color, body, pw); break;
    case 'barrier':     drawBarrier(ctx, sx, gapTop, gapBottom, h, color, body, pw); break;
    case 'laser_gate':  drawLaserGate(ctx, sx, gapTop, gapBottom, h, color, body, pw, tick); break;
    case 'energy_wall': drawEnergyWall(ctx, sx, gapTop, gapBottom, h, color, body, pw, tick); break;
    case 'tower_array': drawTowerArray(ctx, sx, gapTop, gapBottom, h, color, body, pw); break;
  }
}

// ─── Pillar pass ──────────────────────────────────────────────────────────────

function drawPillars(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number, ghostAlpha: number, tick: number) {
  const activeTL = state.activeTimeline;

  for (const obs of state.obstacles) {
    const sx = obs.worldX - state.cameraX;
    if (sx > w + PILLAR_W + 4 || sx + PILLAR_W < -4) continue;

    // Ghost timelines drawn first (behind active)
    for (const tl of TIMELINES) {
      if (tl === activeTL) continue;
      const theme     = TIMELINE_THEME[tl];
      const pw        = PILLAR_WIDTHS[tl];
      const gapTop    = obs.gapY[tl];
      const gapBottom = gapTop + GAP_SIZE;

      ctx.globalAlpha = ghostAlpha;
      drawObstacle(ctx, obs.kind[tl], sx, gapTop, gapBottom, h, theme.color, theme.bodyColor, tick, pw);
      ctx.globalAlpha = 1;
    }

    // Active timeline drawn on top at full opacity
    const theme     = TIMELINE_THEME[activeTL];
    const pw        = PILLAR_WIDTHS[activeTL];
    const gapTop    = obs.gapY[activeTL];
    const gapBottom = gapTop + GAP_SIZE;
    drawObstacle(ctx, obs.kind[activeTL], sx, gapTop, gapBottom, h, theme.color, theme.bodyColor, tick, pw);
  }
}

// ─── Mid-hazard drawing ───────────────────────────────────────────────────────

function drawMidHazards(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number, tick: number) {
  const activeTL   = state.activeTimeline;
  const ghostAlpha = state.slowMo ? GHOST_ALPHA_SLOWMO : GHOST_ALPHA_NORMAL;

  for (const hz of state.midHazards) {
    if (!hz.activated) continue;

    const isCurrent = hz.timeline === activeTL;
    const hx        = hz.worldX - state.cameraX;

    if (hz.kind === 'meteor') {
      const blink = Math.floor(tick / 5) % 2 === 0;

      if (hz.phase === 'warning') {
        const alpha = isCurrent ? (blink ? 0.9 : 0.3) : (blink ? ghostAlpha * 0.8 : 0);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = TIMELINE_THEME[hz.timeline].color;
        ctx.fillRect(hx + METEOR_SIZE / 2 - 12, hz.targetY - 1, 24, 3);
        ctx.fillRect(hx + METEOR_SIZE / 2 - 1, hz.targetY - 12, 3, 24);
        ctx.fillRect(hx + METEOR_SIZE / 2 - 6, 0, 12, 8);
        ctx.fillRect(hx + METEOR_SIZE / 2 - 10, 6, 20, 4);
        ctx.fillRect(hx + METEOR_SIZE / 2 - 4, 10, 8, 4);
        ctx.globalAlpha = 1;

      } else if (hz.phase === 'active') {
        ctx.globalAlpha = isCurrent ? 1 : ghostAlpha;
        ctx.fillStyle   = TIMELINE_THEME[hz.timeline].color;
        const my = hz.y;
        ctx.fillRect(hx, my, METEOR_SIZE, METEOR_SIZE);
        ctx.fillStyle = '#050508';
        ctx.fillRect(hx + 4, my + 4, METEOR_SIZE - 8, METEOR_SIZE - 8);
        ctx.fillStyle = TIMELINE_THEME[hz.timeline].color;
        ctx.globalAlpha = (isCurrent ? 0.6 : ghostAlpha * 0.6);
        ctx.fillRect(hx + 4, my - 12, METEOR_SIZE - 8, 10);
        ctx.globalAlpha = (isCurrent ? 0.3 : ghostAlpha * 0.3);
        ctx.fillRect(hx + 7, my - 22, METEOR_SIZE - 14, 8);
        ctx.globalAlpha = 1;
      }

    } else if (hz.kind === 'sweep_laser') {
      const blink = Math.floor(tick / 4) % 2 === 0;
      const color = TIMELINE_THEME[hz.timeline].color;
      const ly    = hz.targetY;

      if (hz.phase === 'warning') {
        const alpha = isCurrent ? (blink ? 0.95 : 0.3) : (blink ? ghostAlpha * 0.8 : 0.05);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(0, ly - 5, 12, 10);
        ctx.fillRect(w - 12, ly - 5, 12, 10);
        ctx.fillStyle = ca(color, 0.3);
        for (let dx = 16; dx < w - 16; dx += 20) ctx.fillRect(dx, ly - 1, 10, 3);
        ctx.globalAlpha = 1;

      } else if (hz.phase === 'active') {
        const lPulse = 0.7 + 0.3 * Math.sin(tick * 0.15);
        ctx.globalAlpha = isCurrent ? lPulse : ghostAlpha * lPulse;
        ctx.fillStyle = color;
        ctx.fillRect(0, ly - 5, w, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, ly - 1, w, 3);
        ctx.globalAlpha = 1;
      }
    }
  }
}

// ─── Pickup drawing ───────────────────────────────────────────────────────────

function drawPickups(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number, tick: number) {
  const activeTL = state.activeTimeline;

  for (const pk of state.energyPickups) {
    if (pk.collected) continue;
    const sx = pk.worldX - state.cameraX;
    if (sx > w + 10 || sx + ENERGY_PICKUP_SIZE < -10) continue;

    const isCurrent = pk.timeline === activeTL;
    const color     = TIMELINE_THEME[pk.timeline].color;
    const pulse     = 0.75 + 0.25 * Math.sin(tick * 0.14 + pk.worldX * 0.03);

    ctx.globalAlpha = isCurrent ? pulse : 0.22;
    ctx.fillStyle   = color;
    ctx.fillRect(sx, pk.y, ENERGY_PICKUP_SIZE, ENERGY_PICKUP_SIZE);
    if (isCurrent) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 3, pk.y + 3, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  for (const bf of state.buffs) {
    if (bf.collected) continue;
    const sx = bf.worldX - state.cameraX;
    if (sx > w + 20 || sx + BUFF_SIZE < -20) continue;

    const isCurrent = bf.timeline === activeTL;
    const bColor    = BUFF_META[bf.type].color;
    const pulse     = 0.7 + 0.3 * Math.sin(tick * 0.09 + bf.worldX * 0.02);

    ctx.globalAlpha = isCurrent ? pulse : 0.2;
    const cx2 = sx + BUFF_SIZE / 2;
    const cy  = bf.y + BUFF_SIZE / 2;
    const r   = BUFF_SIZE / 2;
    ctx.fillStyle = ca(bColor, 0.2);
    ctx.strokeStyle = bColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx2, cy - r); ctx.lineTo(cx2 + r, cy);
    ctx.lineTo(cx2, cy + r); ctx.lineTo(cx2 - r, cy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ─── Player drawing ───────────────────────────────────────────────────────────

function drawPtero(ctx: CanvasRenderingContext2D, color: string, tick: number) {
  const body = '#1A0808';
  // Body
  ctx.fillStyle = body;
  ctx.fillRect(-12, -6, 24, 12);
  // Head
  ctx.fillRect(12, -8, 10, 8);
  // Beak
  ctx.fillStyle = color;
  ctx.fillRect(22, -3, 10, 3);
  ctx.fillRect(24, 0, 8, 3);
  // Eye
  ctx.fillRect(16, -6, 5, 5);
  // Wings — slow flap (every 18 ticks)
  const wingPhase = Math.floor(tick / 18) % 2;
  const wingY = wingPhase === 0 ? 0 : 3;  // tiny 3px dip, not frantic
  ctx.fillStyle = color;
  ctx.fillRect(-28, -14 + wingY, 18, 5);
  ctx.fillRect(-32, -9  + wingY, 8,  5);
  ctx.fillRect(-32, -4  + wingY, 6,  5);
  ctx.fillRect(-28,  9  - wingY, 18, 5);
  ctx.fillRect(-32,  4  - wingY, 8,  5);
  ctx.fillRect(-32, -1  - wingY, 6,  5);
  ctx.fillRect(-12, -8,  4, 16);
  // Border
  ctx.fillRect(-12, -6, 2, 12);
  ctx.fillRect(10,  -6, 2, 12);
  ctx.fillRect(-12, -6, 22, 2);
  ctx.fillRect(-12,  4, 22, 2);
}

function drawBird(ctx: CanvasRenderingContext2D, color: string, tick: number) {
  const body = '#080F08';
  ctx.fillStyle = body;
  ctx.fillRect(-10, -7, 20, 14);
  const wingOff = Math.floor(Math.sin(tick * 0.2) * 4);
  ctx.fillStyle = color;
  ctx.fillRect(-18, -4 + wingOff, 10, 4);
  ctx.fillRect(-14, -8 + wingOff, 6,  4);
  ctx.fillRect(10, -2, 9, 4);
  ctx.fillRect(5, -5, 5, 5);
  ctx.fillStyle = body;
  ctx.fillRect(7, -4, 2, 2);
  ctx.fillStyle = color;
  ctx.fillRect(-10, -7, 20, 2);
  ctx.fillRect(-10,  5, 20, 2);
  ctx.fillRect(-10, -7,  2, 14);
  ctx.fillRect( 8,  -7,  2, 14);
  ctx.fillStyle = color;
  ctx.fillRect(-14, -1, 4, 6);
}

function drawJet(ctx: CanvasRenderingContext2D, color: string, tick: number) {
  const body = '#05080D';
  ctx.fillStyle = body;
  ctx.fillRect(-16, -5, 32, 10);
  ctx.fillStyle = color;
  ctx.fillRect(16, -3, 6,  6);
  ctx.fillRect(22, -1, 4,  2);
  ctx.fillRect(-6, -12, 18, 4);
  ctx.fillRect(-6,   8, 18, 4);
  ctx.fillRect(-16, -8, 9, 4);
  ctx.fillRect(-16,  4, 9, 4);
  ctx.fillStyle = ca(color, 0.4);
  ctx.fillRect(-10, -3, 20, 6);
  ctx.fillStyle = color;
  ctx.fillRect(-16, -5, 2, 10);
  ctx.fillRect(14,  -5, 2, 10);
  const flLen = 6 + (tick % 4);
  ctx.fillStyle = ca(color, 0.9);
  ctx.fillRect(-16 - flLen, -2, flLen, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-16 - 4, -1, 4, 2);
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, now: number, tick: number) {
  const tl    = state.activeTimeline;
  const theme = TIMELINE_THEME[tl];
  const px    = PLAYER_SCREEN_X;
  const py    = state.playerY;

  if (state.invincibleUntil > now && Math.floor(tick / 4) % 2 === 0) return;

  const angle = Math.max(-0.45, Math.min(0.65, state.playerVY * 0.055));

  ctx.save();
  ctx.translate(px + PLAYER_W / 2, py + PLAYER_H / 2);
  ctx.rotate(angle);

  if (tl === 'gone') drawPtero(ctx, theme.color, tick);
  else if (tl === 'went') drawBird(ctx, theme.color, tick);
  else drawJet(ctx, theme.color, tick);

  ctx.restore();

  if (state.activeBuff) {
    const bc = BUFF_META[state.activeBuff.type].color;
    ctx.strokeStyle = ca(bc, 0.7 + 0.3 * Math.sin(tick * 0.1));
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 5, py - 5, PLAYER_W + 10, PLAYER_H + 10);
  }
}

// ─── God mode overlay ─────────────────────────────────────────────────────────

function drawGodModeLabel(ctx: CanvasRenderingContext2D, w: number, tick: number) {
  const a = 0.5 + 0.3 * Math.sin(tick * 0.08);
  ctx.fillStyle = `rgba(255,215,0,${a})`;
  ctx.font = 'bold 8px monospace';
  const lbl = '⚡ GOD MODE';
  ctx.fillText(lbl, w - ctx.measureText(lbl).width - 10, 12);
}

// ─── HUD ──────────────────────────────────────────────────────────────────────

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, w: number, now: number, godMode: boolean, tick: number) {
  const tl    = state.activeTimeline;
  const color = TIMELINE_THEME[tl].color;

  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, w, HUD_H);
  ctx.fillStyle = ca(color, 0.4);
  ctx.fillRect(0, HUD_H - 2, w, 2);

  // HP blocks
  for (let i = 0; i < HP_MAX; i++) {
    ctx.fillStyle = i < state.hp ? '#FF3366' : '#1A0810';
    ctx.fillRect(14 + i * 18, 12, 14, 14);
    if (i < state.hp) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(17 + i * 18, 15, 4, 4);
    }
  }
  ctx.fillStyle = '#444466';
  ctx.font = '7px monospace';
  ctx.fillText('HP', 14, HUD_H - 8);

  // Energy bar
  const bx = 72; const bW = 110; const bH = 12;
  const ef = state.energy / ENERGY_MAX;
  const bc = ef > 0.5 ? '#00FF88' : ef > 0.25 ? '#ffaa00' : '#FF3366';
  ctx.fillStyle = '#0A0A14';
  ctx.fillRect(bx, 10, bW, bH);
  ctx.fillStyle = bc;
  ctx.fillRect(bx, 10, bW * ef, bH);
  ctx.strokeStyle = ca(bc, 0.35);
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, 10, bW, bH);
  ctx.fillStyle = '#555577';
  ctx.font = '7px monospace';
  ctx.fillText('ENERGY', bx, HUD_H - 8);

  // Score
  ctx.fillStyle = color;
  ctx.font = 'bold 14px monospace';
  const sc  = `${state.score}`;
  const scW = ctx.measureText(sc).width;
  ctx.fillText(sc, w / 2 - scW / 2, 28);
  ctx.fillStyle = '#333355';
  ctx.font = '7px monospace';
  ctx.fillText('SCORE', w / 2 - 14, HUD_H - 8);

  // Timeline tabs (right-aligned)
  for (let i = 0; i < 3; i++) {
    const itl    = TIMELINES[i];
    const itheme = TIMELINE_THEME[itl];
    const isAct  = itl === tl;
    const ix     = w - 10 - (2 - i) * 82;
    const iy     = 8;

    ctx.fillStyle   = isAct ? ca(itheme.color, 0.15) : '#0A0A14';
    ctx.strokeStyle = isAct ? itheme.color : '#1A1A2E';
    ctx.lineWidth   = isAct ? 2 : 1;
    ctx.fillRect(ix - 36, iy, 70, 22);
    ctx.strokeRect(ix - 36, iy, 70, 22);

    ctx.fillStyle = isAct ? itheme.color : '#333355';
    ctx.font = isAct ? 'bold 8px monospace' : '7px monospace';
    const lbl = `[${itheme.key}] ${itheme.name}`;
    ctx.fillText(lbl, ix - ctx.measureText(lbl).width / 2, iy + 15);

    if (isAct) {
      ctx.fillStyle = itheme.color;
      ctx.fillRect(ix - 36, iy + 22, 70, 2);
    }
  }

  // Active buff timer
  if (state.activeBuff) {
    const bm  = BUFF_META[state.activeBuff.type];
    const rem = ((state.activeBuff.expiresAt - now) / 1000).toFixed(1);
    ctx.fillStyle = ca(bm.color, 0.9);
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`◆ ${bm.label} ${rem}s`, bx, HUD_H - 8);
  }

  // Slow-mo hint
  if (state.slowMo) {
    ctx.fillStyle = 'rgba(255,200,0,0.9)';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('⧗ SLOW-MO   [1] PAST   [2] PRESENT   [3] FUTURE', 12, HUD_H - 8);
  }

  if (godMode) drawGodModeLabel(ctx, w, tick);
}

// ─── Slow-mo border ───────────────────────────────────────────────────────────

function drawSlowMoBorder(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  const a = 0.3 + 0.2 * Math.sin(tick * 0.08);
  ctx.strokeStyle = `rgba(255,200,0,${a})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);
}

// ─── Main render ─────────────────────────────────────────────────────────────

function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cW: number, cH: number,
  now: number, tick: number,
  godMode: boolean,
) {
  const gameH = cH - HUD_H;

  ctx.save();
  ctx.translate(0, HUD_H);

  const ghostAlpha = state.slowMo ? GHOST_ALPHA_SLOWMO : GHOST_ALPHA_NORMAL;

  drawBg(ctx, state.activeTimeline, cW, gameH, state.cameraX);
  drawPillars(ctx, state, cW, gameH, ghostAlpha, tick);
  drawMidHazards(ctx, state, cW, gameH, tick);
  drawPickups(ctx, state, cW, gameH, tick);
  drawPlayer(ctx, state, now, tick);

  if (state.slowMo) drawSlowMoBorder(ctx, cW, gameH, tick);

  ctx.restore();

  drawHUD(ctx, state, cW, now, godMode, tick);
}

// ─── Start screen ─────────────────────────────────────────────────────────────

function renderStartScreen(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, w, h);

  const stripeH = h / 3;
  for (let i = 0; i < 3; i++) {
    const c = TIMELINE_THEME[TIMELINES[i]].color;
    ctx.fillStyle = ca(c, 0.04 + 0.02 * Math.sin(tick * 0.05 + i));
    ctx.fillRect(0, i * stripeH, w, stripeH);
  }

  ctx.fillStyle = '#00D4FF';
  ctx.font = 'bold 26px monospace';
  const title = 'GO, WENT, GONE';
  ctx.fillText(title, w / 2 - ctx.measureText(title).width / 2, h / 2 - 38);

  const pulse = 0.5 + 0.5 * Math.sin(tick * 0.07);
  ctx.fillStyle = `rgba(180,180,220,${pulse})`;
  ctx.font = '11px monospace';
  const sub = 'PRESS SPACE OR TAP TO BEGIN';
  ctx.fillText(sub, w / 2 - ctx.measureText(sub).width / 2, h / 2 + 6);

  const rows = [
    { c: '#FF3366', t: '[1] PAST    — pterodactyl · huge wings · floaty' },
    { c: '#00FF88', t: '[2] PRESENT — bird        · classic flap' },
    { c: '#00D4FF', t: '[3] FUTURE  — jet         · hold SPACE to climb' },
  ];
  for (let i = 0; i < rows.length; i++) {
    ctx.fillStyle = rows[i].c;
    ctx.font = '9px monospace';
    ctx.fillText(rows[i].t, w / 2 - ctx.measureText(rows[i].t).width / 2, h / 2 + 34 + i * 17);
  }

  ctx.fillStyle = ca('#00D4FF', 0.35);
  ctx.font = '8px monospace';
  const hint = 'TAB = slow-motion · only 1 timeline is clear at each wall';
  ctx.fillText(hint, w / 2 - ctx.measureText(hint).width / 2, h / 2 + 90);
}

// ─── Game-over overlay ────────────────────────────────────────────────────────

function renderGameOverCanvas(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number) {
  ctx.fillStyle = 'rgba(5,5,8,0.80)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#FF3366';
  ctx.font = 'bold 20px monospace';
  const t = 'TIMELINE COLLAPSED';
  ctx.fillText(t, w / 2 - ctx.measureText(t).width / 2, h / 2 - 40);
  ctx.fillStyle = '#555577';
  ctx.font = '9px monospace';
  const r = state.gameOverReason === 'energy' ? 'OUT OF ENERGY' : 'ALL LIVES LOST';
  ctx.fillText(r, w / 2 - ctx.measureText(r).width / 2, h / 2 - 18);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoWentGone() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gameRef    = useRef<GameState | null>(null);
  const rafRef     = useRef<number>(0);
  const lastTsRef  = useRef<number>(0);
  const tickRef    = useRef<number>(0);
  const bgmRef     = useRef<BGMControllerHandle>(null);

  const [showRules,    setShowRules]    = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [finalScore,   setFinalScore]   = useState(0);
  const [finalReason,  setFinalReason]  = useState<string>('');

  const godModeRef = useRef(false);
  useEffect(() => {
    godModeRef.current =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('god') === '1';
  }, []);

  const flapPress  = useRef(false);
  const flapHeld   = useRef(false);
  const slowToggle = useRef(false);
  const switchTL   = useRef<Timeline | null>(null);

  const getSizes = useCallback(() => {
    const c = canvasRef.current;
    return c ? { w: c.clientWidth, h: c.clientHeight } : { w: 800, h: 600 };
  }, []);

  const loop = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!canvas || !ctx) { rafRef.current = requestAnimationFrame(loop); return; }

    const rawDelta = Math.min(ts - lastTsRef.current, 80);
    lastTsRef.current = ts;
    tickRef.current++;

    const { w, h } = getSizes();
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }

    const gs = gameRef.current;
    if (!gs) { rafRef.current = requestAnimationFrame(loop); return; }

    const input: TickInput = {
      flap: flapPress.current,
      flapHeld: flapHeld.current,
      switchTimeline: switchTL.current,
      toggleSlowMo: slowToggle.current,
      godMode: godModeRef.current,
    };
    flapPress.current  = false;
    switchTL.current   = null;
    slowToggle.current = false;

    if (!gs.started) {
      renderStartScreen(ctx, w, h, tickRef.current);
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const next = tick(gs, rawDelta, input, ts, w);
    gameRef.current = next;

    render(ctx, next, w, h, ts, tickRef.current, godModeRef.current);

    if (next.gameOver) {
      renderGameOverCanvas(ctx, next, w, h);
      if (!gs.gameOver) {
        setFinalScore(next.score);
        setFinalReason(next.gameOverReason === 'energy' ? 'OUT OF ENERGY' : 'ALL LIVES LOST');
        setShowGameOver(true);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [getSizes]);

  useEffect(() => {
    if (showRules) return;
    gameRef.current  = createInitialState(performance.now());
    lastTsRef.current = performance.now();
    rafRef.current   = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [showRules, loop]);

  useEffect(() => {
    if (showRules) return;

    const onDown = (e: KeyboardEvent) => {
      const gs = gameRef.current;
      if (!gs) return;

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gs.started) { gameRef.current = { ...gs, started: true }; bgmRef.current?.playMusic(); return; }
        flapPress.current = true;
        flapHeld.current  = true;
      }
      if (e.code === 'Tab')  { e.preventDefault(); slowToggle.current = true; }
      if (e.key === '1') switchTL.current = 'gone';
      if (e.key === '2') switchTL.current = 'went';
      if (e.key === '3') switchTL.current = 'go';
    };

    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') flapHeld.current = false;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [showRules]);

  const handleTap = useCallback(() => {
    const gs = gameRef.current;
    if (!gs) return;
    if (!gs.started) { gameRef.current = { ...gs, started: true }; bgmRef.current?.playMusic(); return; }
    if (gs.gameOver) return;
    flapPress.current = true;
    flapHeld.current  = true;
    setTimeout(() => { flapHeld.current = false; }, 160);
  }, []);

  const handleTapEnd = useCallback(() => { flapHeld.current = false; }, []);

  const handlePlayAgain = useCallback(() => {
    setShowGameOver(false);
    cancelAnimationFrame(rafRef.current);
    gameRef.current  = createInitialState(performance.now());
    lastTsRef.current = performance.now();
    rafRef.current   = requestAnimationFrame(loop);
  }, [loop]);

  const switchTimeline = useCallback((tl: Timeline) => { switchTL.current = tl; }, []);

  return (
    <div style={{ width: '100dvw', height: '100dvh', overflow: 'hidden', background: '#050508', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} title="GO, WENT, GONE">
        <div style={{ fontSize: '0.72rem', lineHeight: 1.75, color: 'var(--text-dim)' }}>
          <p style={{ color: 'var(--cyan)', marginBottom: 8 }}>THREE TIMELINES. ONE CLEAR PATH.</p>
          <p style={{ marginBottom: 6 }}>At every wall, <b>only one timeline</b> has a gap — the other two are solid. Find it and switch before you hit.</p>

          <p style={{ color: 'var(--warning)', marginTop: 8, marginBottom: 4 }}>CONTROLS</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px', marginBottom: 8 }}>
            <span style={{ color: 'var(--text)' }}>SPACE / TAP</span><span>Flap / Jet thrust</span>
            <span style={{ color: 'var(--text)' }}>TAB</span><span>Slow-motion (plan your switch)</span>
            <span style={{ color: 'var(--text)' }}>1 / 2 / 3</span><span>Switch PAST / PRESENT / FUTURE</span>
          </div>

          <p style={{ color: 'var(--warning)', marginBottom: 4 }}>TIMELINES</p>
          <p style={{ marginBottom: 4 }}>🦕 <b style={{ color: '#FF3366' }}>PAST</b> — wide red pillars, slow lazy wing flap, floaty gravity</p>
          <p style={{ marginBottom: 4 }}>🐦 <b style={{ color: '#00FF88' }}>PRESENT</b> — medium green pillars, classic tap-to-flap</p>
          <p style={{ marginBottom: 8 }}>✈ <b style={{ color: '#00D4FF' }}>FUTURE</b> — slim cyan panels, hold SPACE to climb, release to fall</p>

          <p style={{ marginBottom: 4 }}>Collect <b>energy squares</b> between walls. Run dry = game over.</p>
          <p>Watch for warnings: ☄ <b style={{ color: '#FF3366' }}>meteors</b> (PAST) · <b style={{ color: '#00D4FF' }}>laser sweeps</b> (FUTURE).</p>
        </div>
      </RulesModal>

      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 100 }}>
        <BackButton />
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'none' }}
        onPointerDown={handleTap}
        onPointerUp={handleTapEnd}
      />

      {!showRules && (
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 50 }}>
          <button
            onPointerDown={(e) => { e.stopPropagation(); slowToggle.current = true; }}
            style={{ padding: '8px 12px', background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.4)', color: '#FFD700', fontFamily: 'monospace', fontSize: '0.65rem', borderRadius: 2 }}
          >⧗</button>
          {TIMELINES.map(itl => {
            const th = TIMELINE_THEME[itl];
            return (
              <button key={itl}
                onPointerDown={(e) => { e.stopPropagation(); switchTimeline(itl); }}
                style={{ padding: '8px 10px', background: ca(th.color, 0.1), border: `1px solid ${ca(th.color, 0.5)}`, color: th.color, fontFamily: 'monospace', fontSize: '0.65rem', borderRadius: 2 }}
              >{th.name}</button>
            );
          })}
        </div>
      )}

      {showGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-title">TIMELINE COLLAPSED</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 8 }}>{finalReason}</div>
          <div style={{ fontSize: '1.1rem', color: 'var(--cyan)', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>SCORE: {finalScore}</div>
          <button className="btn btn-primary" onClick={handlePlayAgain}>PLAY AGAIN</button>
        </div>
      )}

      <BGMController ref={bgmRef} src="/sounds/goWentGoneBGM.mp3" volume={0.1} />
    </div>
  );
}
