import {
  NoteName, NOTES, NOTE_FREQUENCIES, NOTE_TILES, MELODY_TILES, CHORD_TILES,
  MELODIES, CHORDS, ChordEffect,
  T_WALL, T_PATH, T_DOT, T_NOTE_C, tileToNote, tileMelodyId, tileChordId,
  MAP_COLS, MAP_ROWS, TILE_SIZE,
  INITIAL_VISION, INITIAL_SPEED, MIN_SPEED, MAX_SPEED, MIN_VISION, MAX_VISION,
  SPRINT_MULTIPLIER, GHOST_SPRINT_MULTIPLIER,
  SPRINT_DURATION_TICKS, SPRINT_COOLDOWN_TICKS,
  GHOST_SPRINT_DURATION_TICKS, GHOST_SPRINT_COOLDOWN_TICKS,
  generateMap, getPlayerStart, getGhostStarts,
} from './constants';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ActiveEffect {
  type: ChordEffect;
  remainingTicks: number;
  color: string;
  description: string;
}

export interface Ghost {
  x: number;       // pixel
  y: number;
  tileX: number;   // current tile
  tileY: number;
  targetX: number; // next tile to step toward
  targetY: number;
  pathStep: number; // pixel progress toward target (0..TILE_SIZE)
  color: string;
  pathUpdateTimer: number;
  path: [number, number][];
  hunting: boolean; // true = BFS toward player; false = random wander
  sprintActive: boolean;
  sprintTicks: number;
  sprintCooldown: number;
}

const GHOST_SIGHT_TILES = 8; // Euclidean tile distance at which a ghost starts hunting

export interface GameState {
  map: number[][];
  playerX: number;     // pixel x of player center
  playerY: number;
  playerTileX: number;
  playerTileY: number;
  playerTargetX: number; // tile the player is moving toward
  playerTargetY: number;
  playerDirX: number;  // current direction
  playerDirY: number;
  playerQueuedDirX: number; // buffered direction from input
  playerQueuedDirY: number;
  playerStepProgress: number; // 0..TILE_SIZE pixels into current step

  vision: number;
  speed: number;
  lives: number;
  score: number;

  noteInventory: Record<NoteName, number>;
  melodiesCompleted: boolean[];
  activeMelodyId: number | null; // which melody spot player is standing on
  melodyProgress: number;        // notes correctly played so far

  activeChordId: number | null;  // which chord spot player is standing on
  heldNotes: Set<NoteName>;      // notes currently held for chord input

  activeEffects: ActiveEffect[];

  ghosts: Ghost[];
  invincibleTicks: number;  // after losing a life
  gamePhase: 'playing' | 'melody' | 'chord' | 'won' | 'lost';
  godMode: boolean;
  godModeReveal: boolean;
  sprintActive: boolean;
  sprintTicks: number;
  sprintCooldown: number;
  bonusSprintTicks: number; // No-cooldown dash from note collection

  totalDots: number;
  eatenDots: number;
}

// ─── Audio ────────────────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

export function playNote(note: NoteName, duration = 0.45, volume = 0.6): void {
  try {
    const ctx = getCtx();
    const freq = NOTE_FREQUENCIES[note];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(volume * 0.4, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch { /* no audio context in SSR or permission denied */ }
}

export function playRandomDotNote(): void {
  const notes: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const note = notes[Math.floor(Math.random() * notes.length)];
  playNote(note, 0.15, 0.06);
}

export function playMelodyComplete(notes: NoteName[]): void {
  try {
    const ctx = getCtx();
    notes.forEach((note, i) => {
      const freq = NOTE_FREQUENCIES[note];
      const now = ctx.currentTime + i * 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1.5, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    });
  } catch { }
}

// ─── Placeholder SFX ─────────────────────────────────────────────────────────

export function playDashSound(): void {
  try {
    const a = new Audio('/sounds/ghostwalk.mp3');
    a.volume = 0.5;
    a.play().catch(() => {});
  } catch {}
}

let _dotEatFlip = 0;
export function playGhostHunt(): void {
  try {
    const r = Math.floor(Math.random() * 3) + 1;
    const a = new Audio(`/sounds/ghostHunt${r}.mp3`);
    a.volume = 0.4;
    a.play().catch(() => {});
  } catch {}
}

export function playDotEat(): void {
  try {
    const a = new Audio('/sounds/numberClick.mp3');
    a.volume = 0.02; // Super low volume
    a.play().catch(() => {});
  } catch {}
}

export function playSFX_lifeLost(): void {
  try {
    const a = new Audio('/sounds/explosion.mp3');
    a.volume = 0.5;
    a.play().catch(() => {});
  } catch { }
}

export function playSFX_gameOver(): void {
  try {
    const ctx = getCtx();
    [220, 185, 156, 110].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch { }
}

export function playSFX_win(): void {
  try {
    const ctx = getCtx();
    [261.63, 329.63, 392.00, 523.25, 659.26].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch { }
}

export function playSFX_chordSuccess(notes: NoteName[]): void {
  try {
    const ctx = getCtx();
    notes.forEach(note => {
      const freq = NOTE_FREQUENCIES[note] * 2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.75);
    });
  } catch { }
}

// ─── BFS pathfinding ──────────────────────────────────────────────────────────
export function bfsPath(
  map: number[][],
  fromX: number, fromY: number,
  toX: number, toY: number,
): [number, number][] {
  if (fromX === toX && fromY === toY) return [];
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
  const visited = new Set<number>();
  const prev = new Map<number, number>();
  const encKey = (x: number, y: number) => y * MAP_COLS + x;

  const queue: [number, number][] = [[fromX, fromY]];
  visited.add(encKey(fromX, fromY));

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    if (cx === toX && cy === toY) {
      // Reconstruct path
      const path: [number, number][] = [];
      let k = encKey(cx, cy);
      while (prev.has(k)) {
        path.unshift([k % MAP_COLS, Math.floor(k / MAP_COLS)]);
        k = prev.get(k)!;
      }
      return path;
    }
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) continue;
      if (map[ny][nx] === T_WALL) continue;
      const nk = encKey(nx, ny);
      if (visited.has(nk)) continue;
      visited.add(nk);
      prev.set(nk, encKey(cx, cy));
      queue.push([nx, ny]);
    }
  }
  return [];
}

// ─── Initial state factory ────────────────────────────────────────────────────
export function createInitialState(): GameState {
  const map = generateMap();
  const [psx, psy] = getPlayerStart(map);
  const ghostStarts = getGhostStarts(map);

  const GHOST_COLORS = ['#ff6b6b', '#a29bfe', '#fd79a8', '#ffd32a', '#00ff88', '#00d4ff'];

  const ghosts: Ghost[] = ghostStarts.map(([gx, gy], i) => ({
    x: gx * TILE_SIZE + TILE_SIZE / 2,
    y: gy * TILE_SIZE + TILE_SIZE / 2,
    tileX: gx, tileY: gy,
    targetX: gx, targetY: gy,
    pathStep: 0,
    color: GHOST_COLORS[i] ?? '#ff6b6b',
    pathUpdateTimer: i * 15,
    path: [],
    hunting: false,
    sprintActive: false,
    sprintTicks: 0,
    sprintCooldown: 0,
  }));

  // Count dots for progress tracking
  let totalDots = 0;
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (map[r][c] === T_DOT) totalDots++;
    }
  }

  return {
    map,
    playerX: psx * TILE_SIZE + TILE_SIZE / 2,
    playerY: psy * TILE_SIZE + TILE_SIZE / 2,
    playerTileX: psx,
    playerTileY: psy,
    playerTargetX: psx,
    playerTargetY: psy,
    playerDirX: 0,
    playerDirY: 0,
    playerQueuedDirX: 0,
    playerQueuedDirY: 0,
    playerStepProgress: 0,

    vision: INITIAL_VISION,
    speed: INITIAL_SPEED,
    lives: 4,
    score: 0,

    noteInventory: { C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 },
    melodiesCompleted: Array(4).fill(false),
    activeMelodyId: null,
    melodyProgress: 0,

    activeChordId: null,
    heldNotes: new Set(),

    activeEffects: [],
    ghosts,
    invincibleTicks: 0,
    gamePhase: 'playing',
    godMode: false,
    godModeReveal: false,
    sprintActive: false,
    sprintTicks: 0,
    sprintCooldown: 0,
    bonusSprintTicks: 0,

    totalDots,
    eatenDots: 0,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function isWalkable(map: number[][], tx: number, ty: number): boolean {
  if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) return false;
  return map[ty][tx] !== T_WALL;
}

// ─── Main tick ────────────────────────────────────────────────────────────────
export function tick(state: GameState): void {
  if (state.gamePhase === 'won' || state.gamePhase === 'lost') return;

  const { map } = state;

  // ── Vision/speed decay ─────────────────────────────────────────────────────
  const hasReveal = state.activeEffects.some(e => e.type === 'reveal');
  if (!hasReveal) {
    state.vision = clamp(state.vision - 0.0015, MIN_VISION, MAX_VISION);
  }
  state.speed = clamp(state.speed - 0.00004, MIN_SPEED, MAX_SPEED);

  // ── Tick active effects ────────────────────────────────────────────────────
  state.activeEffects = state.activeEffects
    .map(e => ({ ...e, remainingTicks: e.remainingTicks - 1 }))
    .filter(e => e.remainingTicks > 0);

  if (state.invincibleTicks > 0) state.invincibleTicks--;

  if (state.bonusSprintTicks > 0) {
    state.bonusSprintTicks--;
  }

  // ── Player sprint ─────────────────────────────────────────────────────────
  if (state.sprintActive) {
    state.sprintTicks--;
    if (state.sprintTicks <= 0) {
      state.sprintActive = false;
      state.sprintCooldown = SPRINT_COOLDOWN_TICKS;
    }
  } else if (state.sprintCooldown > 0) {
    state.sprintCooldown--;
  }

  // ── Compute effective speed (with effect modifiers) ────────────────────────
  const hasSpeed = state.activeEffects.some(e => e.type === 'speed');
  const isSprinting = state.sprintActive || state.bonusSprintTicks > 0 || state.invincibleTicks > 0;
  const sprintMult = isSprinting ? SPRINT_MULTIPLIER : 1;
  const effectiveSpeed = (hasSpeed ? state.speed * 1.5 : state.speed) * sprintMult;

  // ── Player movement ────────────────────────────────────────────────────────
  const tryDir = (dx: number, dy: number): boolean => {
    const nx = state.playerTileX + dx;
    const ny = state.playerTileY + dy;
    if (isWalkable(map, nx, ny)) {
      state.playerDirX = dx;
      state.playerDirY = dy;
      state.playerTargetX = nx;
      state.playerTargetY = ny;
      return true;
    }
    return false;
  };

  // Step 1: On arrival at a new tile
  if (state.playerStepProgress >= TILE_SIZE) {
    state.playerTileX = state.playerTargetX;
    state.playerTileY = state.playerTargetY;
    state.playerStepProgress = 0;
    state.playerX = state.playerTileX * TILE_SIZE + TILE_SIZE / 2;
    state.playerY = state.playerTileY * TILE_SIZE + TILE_SIZE / 2;

    handleTileInteraction(state);
    if (state.gamePhase !== 'playing') return;
  }

  // Step 2: At tile centre — move only if a direction key is currently held
  if (state.playerTargetX === state.playerTileX && state.playerTargetY === state.playerTileY) {
    const qx = state.playerQueuedDirX;
    const qy = state.playerQueuedDirY;
    if (qx !== 0 || qy !== 0) {
      tryDir(qx, qy);
      // Don't clear queuedDir — it stays set while the key is held
    }
  }

  // Step 3: Advance toward target
  if (state.playerTargetX !== state.playerTileX || state.playerTargetY !== state.playerTileY) {
    state.playerStepProgress += effectiveSpeed;
    const t = Math.min(state.playerStepProgress / TILE_SIZE, 1);
    state.playerX = (state.playerTileX + (state.playerTargetX - state.playerTileX) * t) * TILE_SIZE + TILE_SIZE / 2;
    state.playerY = (state.playerTileY + (state.playerTargetY - state.playerTileY) * t) * TILE_SIZE + TILE_SIZE / 2;
  }

  // ── Ghost movement ────────────────────────────────────────────────────────
  const ghostSpeed = state.activeEffects.some(e => e.type === 'slow_ghosts')
    ? effectiveSpeed * 0.2
    : effectiveSpeed * 0.336; // +5% from 0.32

  const playerIsInvisible = state.activeEffects.some(e => e.type === 'invisible');

  for (const ghost of state.ghosts) {
    // Decide hunt vs wander based on proximity to player
    ghost.pathUpdateTimer--;
    if (ghost.pathUpdateTimer <= 0) {
      ghost.pathUpdateTimer = 30 + Math.floor(Math.random() * 20);
      const ddx = ghost.tileX - state.playerTileX;
      const ddy = ghost.tileY - state.playerTileY;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (!playerIsInvisible && dist <= GHOST_SIGHT_TILES) {
        if (!ghost.hunting) {
          playGhostHunt();
        }
        ghost.hunting = true;
        ghost.path = bfsPath(map, ghost.tileX, ghost.tileY, state.playerTileX, state.playerTileY);
      } else {
        ghost.hunting = false;
        ghost.path = []; // will wander randomly when path is empty
      }
    }

    // Move along path (hunt) or pick random adjacent tile (wander)
    if (ghost.tileX === ghost.targetX && ghost.tileY === ghost.targetY) {
      ghost.pathStep = 0;
      if (ghost.path.length > 0) {
        const [nx, ny] = ghost.path.shift()!;
        if (map[ny]?.[nx] !== T_WALL) {
          ghost.targetX = nx;
          ghost.targetY = ny;
        }
      } else {
        // Wander: pick a random walkable neighbor
        const WDIRS: [number,number][] = [[0,-1],[0,1],[-1,0],[1,0]];
        const opts = WDIRS.filter(([dx,dy]) => {
          const nx = ghost.tileX + dx, ny = ghost.tileY + dy;
          return nx >= 0 && nx < MAP_COLS && ny >= 0 && ny < MAP_ROWS && map[ny][nx] !== T_WALL;
        });
        if (opts.length > 0) {
          const [dx, dy] = opts[Math.floor(Math.random() * opts.length)];
          ghost.targetX = ghost.tileX + dx;
          ghost.targetY = ghost.tileY + dy;
        }
      }
    }

    // Ghost sprint
    if (ghost.sprintActive) {
      ghost.sprintTicks--;
      if (ghost.sprintTicks <= 0) {
        ghost.sprintActive = false;
        ghost.sprintCooldown = GHOST_SPRINT_COOLDOWN_TICKS;
      }
    } else if (ghost.sprintCooldown > 0) {
      ghost.sprintCooldown--;
    } else if (ghost.hunting && Math.random() < 0.012) {
      ghost.sprintActive = true;
      ghost.sprintTicks = GHOST_SPRINT_DURATION_TICKS;
    }
    const thisGhostSpeed = ghost.sprintActive ? ghostSpeed * GHOST_SPRINT_MULTIPLIER : ghostSpeed;

    if (ghost.tileX !== ghost.targetX || ghost.tileY !== ghost.targetY) {
      ghost.pathStep += thisGhostSpeed;
      if (ghost.pathStep >= TILE_SIZE) {
        ghost.tileX = ghost.targetX;
        ghost.tileY = ghost.targetY;
        ghost.pathStep = TILE_SIZE;
      }
      const t = ghost.pathStep / TILE_SIZE;
      ghost.x = (ghost.tileX + (ghost.targetX - ghost.tileX) * t) * TILE_SIZE + TILE_SIZE / 2;
      ghost.y = (ghost.tileY + (ghost.targetY - ghost.tileY) * t) * TILE_SIZE + TILE_SIZE / 2;
    }
  }

  // ── Ghost collision ───────────────────────────────────────────────────────
  if (state.invincibleTicks === 0 && !state.godMode) {
    const immune = state.activeEffects.some(e => e.type === 'immune');
    if (!immune) {
      for (const ghost of state.ghosts) {
        const dx = ghost.x - state.playerX;
        const dy = ghost.y - state.playerY;
        if (Math.sqrt(dx * dx + dy * dy) < TILE_SIZE * 0.85) {
          state.lives--;
          state.invincibleTicks = 240;
          if (state.lives <= 0) {
            state.gamePhase = 'lost';
            playSFX_gameOver();
          } else {
            playSFX_lifeLost();
          }
          // Reset player to tile center
          state.playerX = state.playerTileX * TILE_SIZE + TILE_SIZE / 2;
          state.playerY = state.playerTileY * TILE_SIZE + TILE_SIZE / 2;
          state.playerStepProgress = 0;
          state.playerDirX = 0;
          state.playerDirY = 0;
          state.playerQueuedDirX = 0;
          state.playerQueuedDirY = 0;
          break;
        }
      }
    }
  }

  // ── Win check ─────────────────────────────────────────────────────────────
  if (state.melodiesCompleted.every(Boolean)) {
    state.gamePhase = 'won';
    playSFX_win();
  }

  // ── Random dot regeneration ────────────────────────────────────────────────
  // ~3 attempts/sec at 60fps; only lands on bare path tiles so notes/melodies are safe
  if (Math.random() < 0.05) {
    const rx = Math.floor(Math.random() * MAP_COLS);
    const ry = Math.floor(Math.random() * MAP_ROWS);
    if (map[ry]?.[rx] === T_PATH) {
      map[ry][rx] = T_DOT;
    }
  }
}

function handleTileInteraction(state: GameState): void {
  const { map, playerTileX: tx, playerTileY: ty } = state;
  const tile = map[ty]?.[tx];
  if (tile === undefined || tile === T_WALL) return;

  // If player walked off a melody/chord tile, auto-dismiss the panel.
  const isStillOnMelody = tileMelodyId(tile) !== null;
  const isStillOnChord  = tileChordId(tile) !== null;
  if (state.gamePhase === 'melody' && !isStillOnMelody) exitInteractionMode(state);
  if (state.gamePhase === 'chord'  && !isStillOnChord)  exitInteractionMode(state);

  // Dot
  if (tile === T_DOT) {
    map[ty][tx] = T_PATH; // dot eaten, tile stays walkable
    state.eatenDots++;
    state.score += 1;
    state.vision = clamp(state.vision + 0.05, MIN_VISION, MAX_VISION);
    state.speed = clamp(state.speed + 0.018, MIN_SPEED, MAX_SPEED);
    playRandomDotNote();
    return;
  }

  // Note pickup — just entering the tile doesn't collect; user must press key
  // (handled in handleNoteKey)
  if (tile >= 3 && tile <= 9) return;

  // Melody spot
  const melId = tileMelodyId(tile);
  if (melId !== null) {
    if (!state.melodiesCompleted[melId]) {
      const needed: Partial<Record<NoteName, number>> = {};
      for (const n of MELODIES[melId].notes) needed[n] = (needed[n] ?? 0) + 1;
      const hasAll = NOTES.every(n => (state.noteInventory[n] ?? 0) >= (needed[n] ?? 0));
      if (hasAll) {
        state.activeMelodyId = melId;
        state.gamePhase = 'melody';
      }
    }
    return;
  }

  // Chord spot
  const chordId = tileChordId(tile);
  if (chordId !== null) {
    state.activeChordId = chordId;
    state.heldNotes = new Set();
    state.gamePhase = 'chord';
    return;
  }
}

// ─── Note key press ───────────────────────────────────────────────────────────
export function handleNoteKey(state: GameState, note: NoteName): void {
  const { map, playerTileX: tx, playerTileY: ty } = state;
  const tile = map[ty]?.[tx];

  // In melody mode
  if (state.gamePhase === 'melody' && state.activeMelodyId !== null) {
    const melody = MELODIES[state.activeMelodyId];
    const expected = melody.notes[state.melodyProgress];
    if (note === expected) {
      playNote(note);
      state.melodyProgress++;
      if (state.melodyProgress >= melody.notes.length) {
        // Melody complete!
        state.melodiesCompleted[state.activeMelodyId] = true;
        state.score += 100;
        state.vision = clamp(state.vision + 2.5, MIN_VISION, MAX_VISION);
        state.speed = clamp(state.speed + 0.5, MIN_SPEED, MAX_SPEED);
        playMelodyComplete(melody.notes);
        // Consume notes from inventory
        const used: Record<NoteName, number> = { C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 };
        for (const n of melody.notes) used[n]++;
        for (const n of NOTES) {
          state.noteInventory[n] = Math.max(0, state.noteInventory[n] - used[n]);
        }
        state.activeMelodyId = null;
        state.melodyProgress = 0;
        state.gamePhase = 'playing';
      }
    } else {
      // Wrong note — play it but don't advance (no penalty)
      playNote(note, 0.2, 0.4);
    }
    return;
  }

  // In chord mode
  if (state.gamePhase === 'chord' && state.activeChordId !== null) {
    state.heldNotes.add(note);
    playNote(note, 0.3, 0.8);

    const chord = CHORDS[state.activeChordId];
    const required = new Set(chord.notes);
    const allHeld = [...required].every(n => state.heldNotes.has(n));
    if (allHeld) {
      // Chord complete — apply effect
      applyChordEffect(state, chord.effect, chord.duration, chord.color, chord.description);
      playSFX_chordSuccess(chord.notes);
      state.map[ty][tx] = T_PATH; // chord collected
      state.activeChordId = null;
      state.heldNotes = new Set();
      state.gamePhase = 'playing';
      state.score += 50;
    }
    return;
  }

  // Normal collection: player tile + all tiles within 2 steps (including diagonals),
  // unless a wall blocks the path between the player and the note.
  // Wall check: for offset (dx, dy) we sample intermediate cells along the line.
  // A position is blocked if any tile strictly between player and target is a wall.
  const hasWall = (x: number, y: number) =>
    x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS || map[y]?.[x] === T_WALL;

  let collected = false;
  const visited = new Set<string>();
  const queue: {x: number, y: number, step: number}[] = [{x: tx, y: ty, step: 0}];
  visited.add(`${tx},${ty}`);

  while (queue.length > 0) {
    const {x, y, step} = queue.shift()!;
    
    const t = map[y]?.[x];
    if (t !== undefined) {
      const tileNote = tileToNote(t);
      if (tileNote === note) {
        state.noteInventory[note]++;
        map[y][x] = T_PATH;
        state.vision = clamp(state.vision + 0.25, MIN_VISION, MAX_VISION);
        state.speed = clamp(state.speed + 0.06, MIN_SPEED, MAX_SPEED);
        state.bonusSprintTicks = Math.min(state.bonusSprintTicks + 20, SPRINT_DURATION_TICKS);
        playNote(note, 0.5, 0.7);
        state.score += 10;
        collected = true;
        break; // only collect one per keypress
      }
    }

    if (step >= 4) continue; // Max 4 orthogonal steps covers the 5x5 area without wrapping around long walls

    const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
    for (const [ddx, ddy] of dirs) {
      const nx = x + ddx;
      const ny = y + ddy;
      // Restrict to 5x5 bounding box around player
      if (Math.abs(nx - tx) <= 2 && Math.abs(ny - ty) <= 2) {
        if (nx >= 0 && nx < MAP_COLS && ny >= 0 && ny < MAP_ROWS && map[ny][nx] !== T_WALL) {
          const k = `${nx},${ny}`;
          if (!visited.has(k)) {
            visited.add(k);
            queue.push({x: nx, y: ny, step: step + 1});
          }
        }
      }
    }
  }
  if (!collected) {
    // No matching tile nearby — play the note softly (exploration)
    playNote(note, 0.2, 0.3);
  }
}

// ─── Sprint activation ────────────────────────────────────────────────────────
export function activateSprint(state: GameState): void {
  if (state.sprintCooldown > 0 || state.sprintActive || state.gamePhase !== 'playing') return;
  state.sprintActive = true;
  state.sprintTicks = SPRINT_DURATION_TICKS;
  playDashSound();
}

// Exit melody/chord mode (player moved away or pressed Escape)
export function exitInteractionMode(state: GameState): void {
  state.activeMelodyId = null;
  state.melodyProgress = 0;
  state.activeChordId = null;
  state.heldNotes = new Set();
  state.gamePhase = 'playing';
}

function applyChordEffect(
  state: GameState,
  effect: ChordEffect,
  duration: number,
  color: string,
  description: string,
): void {
  // Remove any existing effect of same type
  state.activeEffects = state.activeEffects.filter(e => e.type !== effect);

  if (effect === 'heal') {
    state.lives = Math.min(state.lives + 1, 4);
  }

  state.activeEffects.push({ type: effect, remainingTicks: duration, color, description });
}
