'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import BackButton from '@/components/BackButton';
import RulesModal from '@/components/RulesModal';
import BGMController, { BGMControllerHandle } from '@/components/BGMController';
import {
  NOTES, NOTE_COLORS, NOTE_KEY_MAP, NoteName,
  MELODIES, CHORDS,
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  T_WALL, T_DOT,
  tileToNote, tileMelodyId, tileChordId,
} from './constants';
import {
  GameState, createInitialState, tick, handleNoteKey, exitInteractionMode, activateSprint,
} from './engine';
import { SPRINT_COOLDOWN_TICKS, SPRINT_DURATION_TICKS } from './constants';

// ─── Canvas rendering ─────────────────────────────────────────────────────────

const WALL_COLOR = '#1c1c3c';
const WALL_BORDER = '#2e2e5e';
const DOT_COLOR = '#5555aa';
const PATH_COLOR = '#050510';

const MELODY_COLORS = ['#00d4ff', '#ffd32a', '#ff6b6b', '#00ff88'];
const CHORD_COLORS = ['#00ff88', '#00d4ff', '#ffaa00', '#cc44ff', '#ff6699', '#ffdd44'];

function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
  tick: number,
): void {
  // Camera offset — player centered
  const camX = state.playerX - canvasW / 2;
  const camY = state.playerY - canvasH / 2;

  // Fill background
  ctx.fillStyle = PATH_COLOR;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const visionTiles = state.vision;
  const hasReveal = state.activeEffects.some(e => e.type === 'reveal') || (state.godMode && state.godModeReveal);
  const playerScreenX = state.playerX - camX;
  const playerScreenY = state.playerY - camY;

  // Determine visible tile range
  const tileStartX = Math.floor(camX / TILE_SIZE) - 1;
  const tileStartY = Math.floor(camY / TILE_SIZE) - 1;
  const tileEndX = Math.ceil((camX + canvasW) / TILE_SIZE) + 1;
  const tileEndY = Math.ceil((camY + canvasH) / TILE_SIZE) + 1;

  // Draw tiles
  for (let ty = tileStartY; ty <= tileEndY; ty++) {
    for (let tx = tileStartX; tx <= tileEndX; tx++) {
      if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) continue;

      const screenX = tx * TILE_SIZE - camX;
      const screenY = ty * TILE_SIZE - camY;
      const tile = state.map[ty]?.[tx];
      if (tile === undefined) continue;

      // Distance from player for fog
      const distX = tx * TILE_SIZE + TILE_SIZE / 2 - state.playerX;
      const distY = ty * TILE_SIZE + TILE_SIZE / 2 - state.playerY;
      const distTiles = Math.sqrt(distX * distX + distY * distY) / TILE_SIZE;

      const alpha = hasReveal
        ? 0.9
        : Math.max(0, Math.min(1, (visionTiles - distTiles + 0.5)));

      if (alpha <= 0.01) continue;
      ctx.globalAlpha = alpha;

      if (tile === T_WALL) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        // Subtle border
        ctx.strokeStyle = WALL_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        continue;
      }

      // Path background
      ctx.fillStyle = PATH_COLOR;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      if (tile === T_DOT) {
        const pulse = 0.8 + 0.2 * Math.sin(tick * 0.06 + tx * 0.5 + ty * 0.3);
        const s = TILE_SIZE * 0.22;
        ctx.fillStyle = DOT_COLOR;
        ctx.globalAlpha = alpha * pulse;
        ctx.fillRect(screenX + TILE_SIZE / 2 - s / 2, screenY + TILE_SIZE / 2 - s / 2, s, s);
        continue;
      }

      // Note pickup — black tile with glowing border + number
      const noteNote = tileToNote(tile);
      if (noteNote !== null) {
        const noteColor = NOTE_COLORS[noteNote];
        const pulse = 0.7 + 0.3 * Math.abs(Math.sin(tick * 0.07 + tx + ty));
        const bw = 3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        ctx.shadowColor = noteColor;
        ctx.shadowBlur = 14 * pulse;
        ctx.strokeStyle = noteColor;
        ctx.lineWidth = bw;
        ctx.strokeRect(screenX + bw / 2, screenY + bw / 2, TILE_SIZE - bw, TILE_SIZE - bw);
        ctx.fillStyle = noteColor;
        ctx.font = `${Math.floor(TILE_SIZE * 0.38)}px 'Press Start 2P', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(noteNote, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 1);
        ctx.shadowBlur = 0;
        continue;
      }

      // Melody spot — bright solid fill + thick glowing border + large white number
      const melId = tileMelodyId(tile);
      if (melId !== null) {
        const melColor = MELODY_COLORS[melId];
        const completed = state.melodiesCompleted[melId];
        const pulse = 0.8 + 0.2 * Math.sin(tick * 0.05 + melId);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = completed ? melColor + '18' : melColor + '66';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        const bw = 3;
        ctx.shadowColor = melColor;
        ctx.shadowBlur = completed ? 4 : 14 * pulse;
        ctx.strokeStyle = completed ? melColor + '55' : melColor;
        ctx.lineWidth = bw;
        ctx.strokeRect(screenX + bw / 2, screenY + bw / 2, TILE_SIZE - bw, TILE_SIZE - bw);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = alpha * (completed ? 0.35 : 1);
        ctx.fillStyle = completed ? melColor : '#ffffff';
        ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px 'Press Start 2P', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(completed ? 'X' : String(melId + 1), screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 1);
        continue;
      }

      // Chord spot — dark translucent fill + thin dashed-look border + colored # symbol
      const chordId = tileChordId(tile);
      if (chordId !== null) {
        const chordColor = CHORD_COLORS[chordId];
        const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tick * 0.07 + chordId * 0.8));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = chordColor + '1a';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        const bw2 = 2;
        ctx.shadowColor = chordColor;
        ctx.shadowBlur = 5 * pulse;
        ctx.strokeStyle = chordColor + 'aa';
        ctx.lineWidth = bw2;
        ctx.strokeRect(screenX + bw2 / 2, screenY + bw2 / 2, TILE_SIZE - bw2, TILE_SIZE - bw2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = chordColor;
        ctx.globalAlpha = alpha * pulse;
        ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px 'Press Start 2P', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('#', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 1);
        continue;
      }
    }
  }

  ctx.globalAlpha = 1;

  // ── Draw ghosts ────────────────────────────────────────────────────────────
  const invisible = state.activeEffects.some(e => e.type === 'invisible');
  for (const ghost of state.ghosts) {
    const gsx = ghost.x - camX;
    const gsy = ghost.y - camY;
    const distX = ghost.x - state.playerX;
    const distY = ghost.y - state.playerY;
    const distTiles = Math.sqrt(distX * distX + distY * distY) / TILE_SIZE;
    const alpha = hasReveal ? 0.9 : Math.max(0, Math.min(1, (visionTiles - distTiles + 0.5)));
    if (alpha <= 0.01) continue;

    const frightened = invisible || state.activeEffects.some(e => e.type === 'immune');
    const ghostAlpha = frightened ? alpha * (0.4 + 0.3 * Math.sin(tick * 0.2)) : alpha;
    ctx.globalAlpha = ghostAlpha;

    const gw = Math.floor(TILE_SIZE * 0.78);
    const gh = Math.floor(TILE_SIZE * 0.78);
    const gx2 = Math.floor(gsx - gw / 2);
    const gy2 = Math.floor(gsy - gh / 2);
    const col = frightened ? '#555577' : ghost.color;

    // Ghost sprint glow
    if (ghost.sprintActive && !frightened) {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 18;
    }
    const toothH = Math.floor(gh * 0.24);
    const bodyH = gh - toothH;
    const toothW = Math.floor(gw * 0.38);
    const toothGap = gw - toothW * 2;

    ctx.fillStyle = col;
    ctx.fillRect(gx2, gy2, gw, bodyH);
    ctx.shadowBlur = 0;
    ctx.fillRect(gx2, gy2 + bodyH, toothW, toothH);
    ctx.fillRect(gx2 + toothW + toothGap, gy2 + bodyH, toothW, toothH);

    if (!frightened) {
      const eyeSz = Math.floor(gw * (ghost.hunting ? 0.34 : 0.22));
      const pupSz = Math.floor(eyeSz * 0.55);
      const eyeY = gy2 + Math.floor(bodyH * (ghost.hunting ? 0.15 : 0.22));
      const pad = Math.floor(gw * (ghost.hunting ? 0.12 : 0.16));
      const padOff = Math.floor((eyeSz - pupSz) / 2);
      ctx.fillStyle = '#fff';
      ctx.fillRect(gx2 + pad, eyeY, eyeSz, eyeSz);
      ctx.fillRect(gx2 + gw - pad - eyeSz, eyeY, eyeSz, eyeSz);
      ctx.fillStyle = '#0000cc';
      ctx.fillRect(gx2 + pad + padOff, eyeY + padOff, pupSz, pupSz);
      ctx.fillRect(gx2 + gw - pad - eyeSz + padOff, eyeY + padOff, pupSz, pupSz);
    }
  }

  ctx.globalAlpha = 1;

  // ── Draw player ────────────────────────────────────────────────────────────
  const invBlink = state.invincibleTicks > 0 && Math.floor(tick / 4) % 2 === 0;
  const isInvisible = state.activeEffects.some(e => e.type === 'invisible');
  const isImmune = state.activeEffects.some(e => e.type === 'immune');
  const hasSpeedFx = state.activeEffects.some(e => e.type === 'speed');
  if (!invBlink) {
    const pSize = Math.floor(TILE_SIZE * 0.84);
    const px2 = Math.floor(playerScreenX - pSize / 2);
    const py2 = Math.floor(playerScreenY - pSize / 2);
    const mouthOpen = 0.22 + 0.32 * Math.abs(Math.sin(tick * 0.15));
    const mouthH = Math.floor(pSize * mouthOpen);
    const mouthD = Math.floor(pSize * 0.58);
    const mouthOff = Math.floor((pSize - mouthH) / 2);
    const dx = state.playerDirX;
    const dy = state.playerDirY;

    // Effect modifiers on player appearance
    const isSprinting = state.sprintActive || state.bonusSprintTicks > 0;
    ctx.globalAlpha = isInvisible ? 0.22 : 1;
    const bodyColor = isImmune ? '#66aaff' : hasSpeedFx ? '#ffaa00' : isSprinting ? '#ffffff' : '#ffd32a';
    const glowColor = isImmune ? '#4488ff' : hasSpeedFx ? '#ff8800' : isSprinting ? '#ffffff' : '#ffd32a';
    const glowSize = isSprinting ? 28 : isImmune || hasSpeedFx ? 20 : 14;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowSize;

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(px2, py2, pSize, pSize);
    ctx.shadowBlur = 0;

    // Mouth cutout
    ctx.fillStyle = PATH_COLOR;
    if (dx === 1) ctx.fillRect(px2 + pSize - mouthD, py2 + mouthOff, mouthD, mouthH);
    else if (dx === -1) ctx.fillRect(px2, py2 + mouthOff, mouthD, mouthH);
    else if (dy === 1) ctx.fillRect(px2 + mouthOff, py2 + pSize - mouthD, mouthH, mouthD);
    else if (dy === -1) ctx.fillRect(px2 + mouthOff, py2, mouthH, mouthD);
    else ctx.fillRect(px2 + pSize - mouthD, py2 + mouthOff, mouthD, mouthH);

    // Eye (small black square, top-right of body)
    const eyeSz = Math.max(3, Math.floor(pSize * 0.13));
    let ex = px2 + Math.floor(pSize * 0.62);
    let ey = py2 + Math.floor(pSize * 0.18);
    if (dx === -1) { ex = px2 + Math.floor(pSize * 0.25); }
    else if (dy === 1) { ex = px2 + Math.floor(pSize * 0.62); ey = py2 + Math.floor(pSize * 0.58); }
    else if (dy === -1) { ex = px2 + Math.floor(pSize * 0.62); ey = py2 + Math.floor(pSize * 0.25); }
    ctx.fillStyle = '#000';
    ctx.fillRect(ex, ey, eyeSz, eyeSz);
    ctx.globalAlpha = 1;
  }

  // ── Fog overlay ────────────────────────────────────────────────────────────
  if (!hasReveal) {
    ctx.save();
    const visionPx = visionTiles * TILE_SIZE;
    const fogGrad = ctx.createRadialGradient(
      playerScreenX, playerScreenY, visionPx * 0.55,
      playerScreenX, playerScreenY, visionPx * 1.6,
    );
    fogGrad.addColorStop(0, 'rgba(5, 5, 16, 0)');
    fogGrad.addColorStop(0.6, 'rgba(5, 5, 16, 0.6)');
    fogGrad.addColorStop(1, 'rgba(5, 5, 16, 0.98)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }

  // ── Vision Effect: Highlight Melodies ─────────────────────────────────────────
  const hasVision = state.activeEffects.some(e => e.type === 'vision');
  if (hasVision && !hasReveal) {
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const screenX = tx * TILE_SIZE - camX;
        const screenY = ty * TILE_SIZE - camY;
        // only draw if on screen
        if (screenX < -TILE_SIZE || screenX > canvasW || screenY < -TILE_SIZE || screenY > canvasH) continue;
        
        const tile = state.map[ty]?.[tx];
        const melId = tileMelodyId(tile);
        if (melId !== null) {
          const melody = MELODIES[melId];
          if (!melody) continue;
          const completed = state.melodiesCompleted[melId];
          const pulse = 0.5 + 0.5 * Math.abs(Math.sin(tick * 0.05 + melId));
          const melColor = melody.color;
          
          ctx.globalAlpha = completed ? 0.35 : (0.6 + 0.4 * pulse);
          ctx.fillStyle = completed ? melColor + '18' : melColor + '66';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          
          const bw = 3;
          ctx.shadowColor = melColor;
          ctx.shadowBlur = completed ? 4 : 20 * pulse;
          ctx.strokeStyle = completed ? melColor + '55' : melColor;
          ctx.lineWidth = bw;
          ctx.strokeRect(screenX + bw / 2, screenY + bw / 2, TILE_SIZE - bw, TILE_SIZE - bw);
          ctx.shadowBlur = 0;
          
          ctx.fillStyle = completed ? melColor : '#ffffff';
          ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px 'Press Start 2P', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(completed ? 'X' : String(melId + 1), screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SwiftSoundPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const tickRef = useRef(0);
  const rafRef = useRef<number>(0);
  const bgmRef = useRef<BGMControllerHandle>(null);
  const [showRules, setShowRules] = useState(true);
  const [, forceRender] = useState(0);
  const [isGodModeQuery, setIsGodModeQuery] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsGodModeQuery(window.location.search.includes('god=1'));
    }
  }, []);
  const rerender = useCallback(() => forceRender(n => n + 1), []);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    stateRef.current = createInitialState();
    
    if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
      (screen.orientation as any).lock('landscape').catch(() => {
        // Silently fail if not supported or requires user gesture first
      });
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

      // Always tick — melody/chord panels are non-blocking overlays now.
      if (state.gamePhase !== 'won' && state.gamePhase !== 'lost') tick(state);

      // Render
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      if (W === 0 || H === 0) return;
      ctx.imageSmoothingEnabled = false;
      drawGame(ctx, state, W, H, t);

      // Trigger React re-render for HUD (every 6 frames)
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
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      // Set logical size (CSS) — use 1:1 pixel ratio for crisp pixel art
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
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
      if (!state) return;

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
        if (!e.repeat) {
          try {
            const a = new Audio('/sounds/numberClick.mp3');
            a.volume = 0.23;
            a.play().catch(() => { });
          } catch { }
        }
        return;
      }

      // Sprint
      if (e.key === 'Shift') {
        e.preventDefault();
        activateSprint(state);
        return;
      }

      // Note keys 1-7
      const noteKey = NOTE_KEY_MAP[e.key];
      if (noteKey) {
        e.preventDefault();
        handleNoteKey(state, noteKey);
        rerender();
        return;
      }

      // Escape exits melody/chord mode
      if (e.key === 'Escape' && (state.gamePhase === 'melody' || state.gamePhase === 'chord')) {
        exitInteractionMode(state);
        rerender();
      }
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

  // ── Touch Virtual Joystick ────────────────────────────────────────────────
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // Only capture single touch
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    
    // Attempt to enter fullscreen on first touch to hide URL bar
    if (document.fullscreenElement === null && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const state = stateRef.current;
    if (!state || !touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    const minDrag = 15; // Deadzone threshold

    if (Math.abs(dx) > minDrag || Math.abs(dy) > minDrag) {
      let newDirX = 0;
      let newDirY = 0;
      if (Math.abs(dx) > Math.abs(dy)) {
        newDirX = dx > 0 ? 1 : -1;
      } else {
        newDirY = dy > 0 ? 1 : -1;
      }

      if (state.playerQueuedDirX !== newDirX || state.playerQueuedDirY !== newDirY) {
        state.playerQueuedDirX = newDirX;
        state.playerQueuedDirY = newDirY;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
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
    try {
      const a = new Audio('/sounds/numberClick.mp3');
      a.volume = 0.23;
      a.play().catch(() => { });
    } catch { }
  };

  const releaseDir = (dx: number, dy: number) => {
    const state = stateRef.current;
    if (!state) return;
    if (state.playerQueuedDirX === dx && state.playerQueuedDirY === dy) {
      state.playerQueuedDirX = 0;
      state.playerQueuedDirY = 0;
    }
  };

  const pressNote = (note: NoteName) => {
    const state = stateRef.current;
    if (!state) return;
    handleNoteKey(state, note);
    rerender();
  };

  const handleRestart = () => {
    const wasGod = stateRef.current?.godMode ?? false;
    const s = createInitialState();
    s.godMode = wasGod;
    stateRef.current = s;
    tickRef.current = 0;
    rerender();
  };

  const toggleGodMode = () => {
    const s = stateRef.current;
    if (!s) return;
    s.godMode = !s.godMode;
    rerender();
  };

  const toggleReveal = () => {
    const s = stateRef.current;
    if (!s) return;
    s.godModeReveal = !s.godModeReveal;
    rerender();
  };

  const state = stateRef.current;
  const phase = state?.gamePhase ?? 'playing';
  const melody = state?.activeMelodyId != null ? MELODIES[state.activeMelodyId] : null;
  const chord = state?.activeChordId != null ? CHORDS[state.activeChordId] : null;

  const blockedMelody = (() => {
    if (!state || state.gamePhase === 'won' || state.gamePhase === 'lost') return null;
    const tile = state.map[state.playerTileY]?.[state.playerTileX];
    if (tile === undefined) return null;
    const melId = tileMelodyId(tile);
    if (melId === null || state.melodiesCompleted[melId]) return null;
    const mel = MELODIES[melId];
    const needed: Partial<Record<NoteName, number>> = {};
    for (const n of mel.notes) needed[n] = (needed[n] ?? 0) + 1;
    const missing = NOTES.filter(n => (state.noteInventory[n] ?? 0) < (needed[n] ?? 0))
      .map(n => ({ note: n, have: state.noteInventory[n] ?? 0, need: needed[n]! }));
    if (missing.length === 0) return null;
    return { mel, missing, melId };
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0, background: 'var(--void)', overflow: 'hidden', touchAction: 'none' }}>
      <style>{`
        :root {
          --bar-pad: 8px 14px;
          --font-stat: 0.8rem;
          --font-score: 0.9rem;
          --batt-w: 70px; --batt-h: 18px;
          --mel-w: 30px; --mel-h: 16px;
          --dash-w: 48px; --dash-h: 16px;
          --bot-bar-h: 60px;
          --font-note: 1.3rem;
          --font-count: 0.7rem;
          --font-dash-main: 1.1rem;
          --font-dash-sub: 0.6rem;
        }
        @media (min-width: 1024px) {
          :root {
            --bar-pad: 14px 18px;
            --font-stat: 1rem;
            --font-score: 1.2rem;
            --batt-w: 80px; --batt-h: 22px;
            --mel-w: 36px; --mel-h: 20px;
            --dash-w: 56px; --dash-h: 20px;
            --bot-bar-h: 90px;
            --font-note: 1.6rem;
            --font-count: 0.9rem;
            --font-dash-main: 1.4rem;
            --font-dash-sub: 0.8rem;
          }
        }
        @media (min-width: 768px) {
          .mobile-dpad-container { display: none !important; }
        }
        .rotate-overlay { display: none; }
        @media (orientation: portrait) and (max-width: 768px) {
          .rotate-overlay { display: flex !important; }
        }
        @media (max-width: 767px) {
          .ss-modal-popup {
            transform: scale(0.85);
            transform-origin: top center;
          }
        }
      `}</style>
      <BGMController ref={bgmRef} visible={false} src={["/sounds/swiftSoundBGM.mp3", "/sounds/horrorBGM1.mp3", "/sounds/horrorBGM2.mp3"]} volume={[0.2, 0.02, 0.15]} />

      <div className="rotate-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--void)', color: 'white',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px'
      }}>
        <span style={{ fontSize: '4rem', marginBottom: '20px' }}>📱➔🔄</span>
        <h2 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.2rem', marginBottom: '16px', lineHeight: 1.5 }}>PLEASE ROTATE<br/>YOUR DEVICE</h2>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '0.9rem' }}>This game is designed to be played in landscape mode.</p>
      </div>

      <RulesModal
        isOpen={showRules}
        onClose={() => { setShowRules(false); bgmRef.current?.playMusic(); }}
        title=":: SWIFT & SOUND"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
            Navigate the dark maze, collect musical notes, and complete{' '}
            <span style={{ color: 'var(--cyan)' }}>4 melodies</span> hidden across the map.
            Avoid the ghosts — you have <span style={{ color: 'var(--danger)' }}>4 lives</span>.
          </p>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
              COLLECTING NOTES
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Collect a <span style={{ color: 'var(--warning)' }}>coloured note tile</span> (C–B) by pressing the matching key{' '}
              <span style={{ color: 'var(--cyan)' }}>1–7</span> or button at the bottom bar.
              You can collect notes up to <span style={{ color: 'var(--cyan)' }}>2 blocks away</span> — no need to stand on the exact tile.
              Notes go into your inventory and are spent when playing melodies.
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
              PLAYING MELODIES
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Walk onto a <span style={{ color: '#00d4ff' }}>♪ melody spot [1-4]</span>. A sequence appears — press
              notes in order. Run out of notes? Collect more and come back.
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
              CHORD POWER-UPS
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Stand on a <span style={{ color: '#00ff88' }}>♫ chord spot #</span> and press all required notes
              to unlock a temporary power-up (speed, vision, ghost immunity, and more).
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
              CONTROLS
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--cyan)' }}>Move:</span> WASD / Arrow keys / Swipe{' '}
              &nbsp;|&nbsp;{' '}
              <span style={{ color: 'var(--cyan)' }}>Notes:</span> Keys 1–7 (C D E F G A B){' '}
              &nbsp;|&nbsp;{' '}
              <span style={{ color: 'var(--warning)' }}>Sprint:</span> Shift / DASH button
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '4px' }}>
              Vision and speed decay over time. Eat dots to restore them.
            </p>
          </div>
        </div>
      </RulesModal>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--bar-pad)', flexShrink: 0, gap: '10px'
      }}>
        <BackButton />
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* HP battery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--font-stat)', color: 'var(--text-dim)', letterSpacing: '0.12em', fontWeight: 700 }}>HP</span>
            {state?.godMode ? (
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--font-score)', color: 'var(--success)' }}>∞</span>
            ) : (() => {
              const livesPct = Math.max(0, Math.min(100, ((state?.lives ?? 4) / 4) * 100));
              const batteryColor = livesPct > 60 ? 'var(--success)' : livesPct > 30 ? 'var(--warning)' : 'var(--danger)';
              return (
                <div className="battery" title={`${state?.lives ?? 4}/4 lives`} style={{ width: 'var(--batt-w)', height: 'var(--batt-h)' }}>
                  <div className="battery-fill" style={{ width: `${livesPct}%`, background: batteryColor, boxShadow: `0 0 8px ${batteryColor}` }} />
                  <div className="battery-nub" />
                </div>
              );
            })()}
          </div>
          {/* Melody progress bar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-stat)', color: 'var(--text-dim)', letterSpacing: '0.12em', fontWeight: 700 }}>SONG</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              {MELODIES.map((mel, i) => (
                <div key={i} style={{
                  width: 'var(--mel-w)', height: 'var(--mel-h)', borderRadius: '3px',
                  background: state?.melodiesCompleted[i] ? mel.color : 'transparent',
                  border: state?.melodiesCompleted[i] ? `2px solid ${mel.color}` : '2px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: state?.melodiesCompleted[i] ? `0 0 6px ${mel.color}` : 'none',
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>
              {state?.melodiesCompleted.filter(Boolean).length ?? 0}/4
            </span>
          </div>
          {/* Sprint status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--font-stat)', color: 'var(--text-dim)', letterSpacing: '0.12em', fontWeight: 700 }}>DASH</span>
            {state?.sprintActive ? (
              <div style={{ width: 'var(--dash-w)', height: 'var(--dash-h)', borderRadius: '3px', background: 'var(--cyan)', border: '2px solid var(--cyan)', boxShadow: '0 0 8px var(--cyan)' }} />
            ) : state?.sprintCooldown ?? 0 > 0 ? (
              <div style={{ width: 'var(--dash-w)', height: 'var(--dash-h)', borderRadius: '3px', background: 'transparent', border: '2px solid rgba(255, 255, 255, 0.5)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${100 - ((state?.sprintCooldown ?? 0) / SPRINT_COOLDOWN_TICKS) * 100}%`, background: 'var(--text-dim)' }} />
              </div>
            ) : (
              <div style={{ width: 'var(--dash-w)', height: 'var(--dash-h)', borderRadius: '3px', background: 'var(--success)', border: '2px solid var(--success)', boxShadow: '0 0 6px var(--success)' }} />
            )}
          </div>
          {/* Score */}
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--font-score)', color: 'var(--cyan)' }}>
            {state?.score ?? 0}
          </span>
          {/* God mode toggle */}
          {isGodModeQuery && (
            <button
              onClick={toggleGodMode}
              className="btn btn-ghost"
              style={{
                fontSize: '0.75rem', padding: '6px 12px',
                color: state?.godMode ? 'var(--success)' : undefined,
                borderColor: state?.godMode ? 'var(--success)' : undefined,
                boxShadow: state?.godMode ? '0 0 8px var(--success)' : undefined,
              }}
            >GOD</button>
          )}
          {isGodModeQuery && state?.godMode && (
            <button
              onClick={toggleReveal}
              className="btn btn-ghost"
              style={{
                fontSize: '0.75rem', padding: '6px 12px',
                color: state.godModeReveal ? 'var(--warning)' : undefined,
                borderColor: state.godModeReveal ? 'var(--warning)' : undefined,
                boxShadow: state.godModeReveal ? '0 0 8px var(--warning)' : undefined,
              }}
            >REVEAL</button>
          )}
          <button
            onClick={() => setShowRules(true)}
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >? RULES</button>
        </div>
      </div>


      {/* ── Active effects ────────────────────────────────────────────────── */}
      {state && state.activeEffects.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', padding: '0 12px 4px', flexWrap: 'wrap', flexShrink: 0 }}>
          {state.activeEffects.map((e, i) => (
            <span key={i} className="effect-badge" style={{ borderColor: e.color + '88', color: e.color, fontSize: '0.5rem' }}>
              {e.description}
            </span>
          ))}
        </div>
      )}

      {/* ── Canvas + side panel ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: '0' }}>
        {/* Canvas */}
        <div 
          style={{ flex: 1, position: 'relative' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />

          {/* Melody modal */}
          {phase === 'melody' && melody && state && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              paddingTop: '16px',
              background: 'transparent',
            }}>
              <div className="ss-modal-popup" style={{
                background: 'var(--surface)',
                border: `3px solid ${melody.color}`,
                boxShadow: `0 0 32px ${melody.color}55, 0 0 80px ${melody.color}22`,
                borderRadius: '8px',
                padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: '14px',
                minWidth: '280px', maxWidth: '90%',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', color: melody.color, textShadow: `0 0 10px ${melody.color}` }}>
                    {melody.name.toUpperCase()}
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.65rem', padding: '4px 10px' }}
                    onClick={() => { exitInteractionMode(stateRef.current!); rerender(); }}
                  >ESC</button>
                </div>
                {/* Sequence */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', minHeight: '60px' }}>
                  {melody.notes.map((note, i) => {
                    const done = i < state.melodyProgress;
                    const active = i === state.melodyProgress;
                    return (
                      <div key={i} style={{
                        width: active ? '52px' : '36px',
                        height: active ? '52px' : '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '6px',
                        background: done ? NOTE_COLORS[note] + '44' : active ? NOTE_COLORS[note] + '33' : 'var(--void)',
                        border: `${active ? '3px' : '2px'} solid ${done || active ? NOTE_COLORS[note] : 'var(--border)'}`,
                        color: done || active ? NOTE_COLORS[note] : 'var(--text)',
                        fontSize: active ? '1.4rem' : '0.85rem',
                        fontWeight: 900,
                        boxShadow: active ? `0 0 16px ${NOTE_COLORS[note]}` : 'none',
                        animation: active ? 'pulseGlow 0.8s ease-in-out infinite' : 'none',
                        transition: 'all 0.2s ease',
                      }}>
                        {done ? '■' : note}
                      </div>
                    );
                  })}
                </div>
                {/* Inventory check */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {NOTES.map(n => {
                    const need = melody.notes.slice(state.melodyProgress).filter(x => x === n).length;
                    const have = state.noteInventory[n];
                    if (need === 0) return null;
                    return (
                      <span key={n} style={{
                        fontSize: '0.7rem', fontWeight: 700,
                        color: have >= need ? NOTE_COLORS[n] : 'var(--danger)',
                        textShadow: have >= need ? `0 0 6px ${NOTE_COLORS[n]}` : '0 0 6px var(--danger)',
                      }}>
                        {n} {have}/{need}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Chord modal */}
          {phase === 'chord' && chord && state && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              paddingTop: '16px',
              background: 'transparent',
            }}>
              <div className="ss-modal-popup" style={{
                background: 'var(--surface)',
                border: `3px solid ${chord.color}`,
                boxShadow: `0 0 32px ${chord.color}55, 0 0 80px ${chord.color}22`,
                borderRadius: '8px',
                padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: '14px',
                minWidth: '280px', maxWidth: '90%',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', color: chord.color, textShadow: `0 0 10px ${chord.color}` }}>
                    {chord.name.toUpperCase()} — {chord.description}
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.65rem', padding: '4px 10px' }}
                    onClick={() => { exitInteractionMode(stateRef.current!); rerender(); }}
                  >ESC</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text)', alignSelf: 'center', marginRight: '6px' }}>
                    Play the following notes:
                  </span>
                  {chord.notes.map(note => {
                    const held = state.heldNotes.has(note);
                    return (
                      <div key={note} style={{
                        width: '40px', height: '40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '4px',
                        background: held ? chord.color + '33' : 'var(--void)',
                        border: `2px solid ${held ? chord.color : 'var(--border)'}`,
                        color: held ? chord.color : 'var(--text)',
                        fontSize: '0.9rem', fontWeight: 700,
                        boxShadow: held ? `0 0 12px ${chord.color}` : 'none',
                      }}>{note}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Blocked melody warning banner */}
          {blockedMelody && phase !== 'won' && phase !== 'lost' && (
            <div style={{
              position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(5,5,16,0.88)',
              border: `2px solid ${blockedMelody.mel.color}`,
              boxShadow: `0 0 18px ${blockedMelody.mel.color}55`,
              borderRadius: '8px',
              padding: '16px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              animation: 'pulseGlow 1s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', color: blockedMelody.mel.color, letterSpacing: '0.08em' }}>
                ♪ {blockedMelody.mel.name.toUpperCase()} — MISSING NOTES
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                {blockedMelody.missing.map(({ note, have, need }) => (
                  <span key={note} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 900,
                    color: NOTE_COLORS[note],
                    textShadow: `0 0 8px ${NOTE_COLORS[note]}`,
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>{note}</span> {have}/{need}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Win/Lose overlay */}
          {(phase === 'won' || phase === 'lost') && (
            <div className="game-over-overlay" style={{ position: 'absolute' }}>
              <div className="game-over-title" style={{ color: phase === 'won' ? 'var(--success)' : 'var(--danger)' }}>
                {phase === 'won' ? 'THE NIGHTMARE ENDED' : 'THE NIGHTMARE CONTINUES'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 2 }}>
                <div>SCORE: <span style={{ color: 'var(--cyan)' }}>{state?.score ?? 0}</span></div>
                <div>MELODIES: <span style={{ color: 'var(--warning)' }}>
                  {state?.melodiesCompleted.filter(Boolean).length ?? 0}/4
                </span></div>
              </div>
              <button onClick={handleRestart} className="btn btn-primary">PLAY AGAIN</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Bar (piano keys) ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexShrink: 0,
        borderTop: '2px solid var(--border)',
        background: 'rgba(5,5,16,0.97)',
        height: 'var(--bot-bar-h)',
      }}>
        {NOTES.map((note, i) => {
          const count = state?.noteInventory[note] ?? 0;
          const color = NOTE_COLORS[note];
          const active = count > 0;
          return (
            <div
              key={note}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: active ? color + '30' : color + '10',
                borderRight: '1px solid var(--border)',
                borderTop: active ? `3px solid ${color}` : `3px solid ${color}44`,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                transition: 'background 0.1s ease, border-color 0.1s ease',
                boxShadow: active ? `inset 0 0 24px ${color}33, 0 -2px 16px ${color}44` : 'none',
              }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); pressNote(note); }}
            >
              <span style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 'var(--font-note)',
                color: active ? color : color + '99',
                textShadow: active ? `0 0 14px ${color}, 0 0 28px ${color}88` : 'none',
                lineHeight: 1,
              }}>{note}</span>
              <span style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 'var(--font-count)',
                color: active ? 'var(--text)' : 'var(--text-muted)',
                lineHeight: 1,
              }}>×{count}</span>
            </div>
          );
        })}
        {/* Dash button */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: state?.sprintActive ? 'var(--cyan)22' : (state?.sprintCooldown ?? 0) > 0 ? 'var(--void)' : 'var(--success)22',
            borderTop: `3px solid ${state?.sprintActive ? 'var(--cyan)' : (state?.sprintCooldown ?? 0) > 0 ? 'transparent' : 'var(--success)'}`,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            transition: 'background 0.1s ease, border-color 0.1s ease',
            boxShadow: state?.sprintActive ? 'inset 0 0 24px var(--cyan)33, 0 -2px 16px var(--cyan)44' : (state?.sprintCooldown ?? 0) === 0 ? 'inset 0 0 24px var(--success)33, 0 -2px 16px var(--success)44' : 'none',
          }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); activateSprint(stateRef.current!); rerender(); }}
        >
          <span style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'var(--font-dash-main)',
            color: state?.sprintActive ? 'var(--cyan)' : (state?.sprintCooldown ?? 0) > 0 ? 'var(--text-muted)' : 'var(--success)',
            textShadow: state?.sprintActive ? '0 0 14px var(--cyan), 0 0 28px var(--cyan)88' : (state?.sprintCooldown ?? 0) === 0 ? '0 0 14px var(--success), 0 0 28px var(--success)88' : 'none',
            lineHeight: 1,
          }}>DASH</span>
          <span style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'var(--font-dash-sub)',
            color: state?.sprintActive ? 'var(--cyan)' : (state?.sprintCooldown ?? 0) > 0 ? 'var(--text-muted)' : 'var(--success)',
            lineHeight: 1,
          }}>{state?.sprintActive ? '>>' : (state?.sprintCooldown ?? 0) > 0 ? 'WAIT' : 'READY'}</span>
        </div>
      </div>
    </div>
  );
}
