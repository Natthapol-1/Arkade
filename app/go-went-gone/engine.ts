import {
  Timeline, TIMELINES, PHYSICS, LOGICAL_H,
  PLAYER_SCREEN_X, PLAYER_W, PLAYER_H,
  GAP_SIZE, PILLAR_W, PILLAR_SPACING, FIRST_OBSTACLE_X,
  GAP_MIN_Y, GAP_MAX_Y, BLOCKED_GAP_Y,
  SCROLL_SPEED_BASE, SCROLL_SPEED_MAX, SPEED_RAMP_PER_SCORE,
  ENERGY_MAX, ENERGY_DRAIN_PER_SEC, ENERGY_PICKUP_VALUE,
  ENERGY_PICKUP_SIZE, ENERGY_TRAIL_COUNT, ENERGY_TRAIL_AMP,
  HP_MAX, INVINCIBILITY_MS,
  SLOW_MO_FACTOR,
  ObstacleKind, OBSTACLE_POOL,
  HazardKind, HAZARD_EVERY_N, HAZARD_WARNING_MS, HAZARD_ACTIVE_MS,
  METEOR_FALL_SPEED, METEOR_SIZE,
  BuffType, BUFF_EVERY_N_PILLARS, BUFF_DURATION_MS, BUFF_SIZE,
  TIMELINE_BUFF,
  SCORE_PER_PILLAR, SCORE_ENERGY_COLLECT, SCORE_BUFF_COLLECT,
  PILLAR_WIDTHS,
} from './constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ObstacleSet {
  id: number;
  worldX: number;
  gapY: Record<Timeline, number>;
  kind: Record<Timeline, ObstacleKind>;
  passed: boolean;
}

export interface EnergyPickup {
  id: number;
  worldX: number;
  y: number;
  timeline: Timeline;
  collected: boolean;
}

export interface Buff {
  id: number;
  worldX: number;
  y: number;
  timeline: Timeline;
  type: BuffType;
  collected: boolean;
}

export interface ActiveBuff {
  type: BuffType;
  expiresAt: number;
}

export interface MidHazard {
  id: number;
  worldX: number;    // X position (meteor: where it falls; laser: trigger point)
  y: number;         // current Y (meteor falls, laser is static)
  targetY: number;   // final Y for meteor impact; Y for laser beam
  timeline: Timeline;
  kind: HazardKind;
  phase: 'warning' | 'active' | 'done';
  phaseTimer: number;
  activated: boolean; // true once it has entered the screen
}

export interface GameState {
  playerY: number;
  playerVY: number;
  hp: number;
  energy: number;
  invincibleUntil: number;

  activeTimeline: Timeline;
  slowMo: boolean;

  cameraX: number;

  obstacles: ObstacleSet[];
  energyPickups: EnergyPickup[];
  buffs: Buff[];
  midHazards: MidHazard[];
  activeBuff: ActiveBuff | null;

  score: number;
  pillarsSpawned: number;
  lastFlapMs: number;

  started: boolean;
  gameOver: boolean;
  gameOverReason: 'hp' | 'energy' | null;
  now: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _nextId = 0;
function uid() { return _nextId++; }
function rng(min: number, max: number) { return min + Math.random() * (max - min); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Obstacle spawning ────────────────────────────────────────────────────────

function spawnObstacleSet(state: GameState, worldX: number): void {
  const clearIdx = Math.floor(Math.random() * 3);
  const clearTL  = TIMELINES[clearIdx];

  const gapY: Record<Timeline, number> = {} as Record<Timeline, number>;
  const kind: Record<Timeline, ObstacleKind> = {} as Record<Timeline, ObstacleKind>;

  for (const tl of TIMELINES) {
    // Only the clear timeline has a passable gap — the other two are solid walls
    gapY[tl] = tl === clearTL ? rng(GAP_MIN_Y, GAP_MAX_Y) : BLOCKED_GAP_Y;
    kind[tl]  = pick(OBSTACLE_POOL[tl]);
  }

  state.obstacles.push({ id: uid(), worldX, gapY, kind, passed: false });

  // ── Energy trail in the gap BEFORE this obstacle ──────────────────────────
  if (state.pillarsSpawned > 0) {
    const trailStartX = worldX - PILLAR_SPACING + PILLAR_W + 110;
    const trailEndX   = worldX - 110;
    const centerY     = gapY[clearTL] + GAP_SIZE / 2;

    for (let i = 0; i < ENERGY_TRAIL_COUNT; i++) {
      const t   = i / (ENERGY_TRAIL_COUNT - 1);
      const ex  = trailStartX + t * (trailEndX - trailStartX);
      const ey  = centerY + Math.sin(t * Math.PI * 2) * ENERGY_TRAIL_AMP;
      state.energyPickups.push({
        id: uid(),
        worldX: ex,
        y: ey,
        timeline: TIMELINES[i % 3],   // cycle PAST / PRESENT / FUTURE
        collected: false,
      });
    }
  }

  // ── Buff ─────────────────────────────────────────────────────────────────
  state.pillarsSpawned++;

  if (state.pillarsSpawned > 1 && state.pillarsSpawned % BUFF_EVERY_N_PILLARS === 0) {
    const tl   = pick(TIMELINES);
    const type = TIMELINE_BUFF[tl];
    state.buffs.push({
      id: uid(),
      worldX: worldX - PILLAR_SPACING * 0.3,
      y: gapY[tl] + GAP_SIZE / 2 - BUFF_SIZE / 2,
      timeline: tl,
      type,
      collected: false,
    });
  }

  // ── Mid-field hazard ──────────────────────────────────────────────────────
  if (state.pillarsSpawned >= 3 && state.pillarsSpawned % HAZARD_EVERY_N === 0) {
    const hazardX  = worldX - PILLAR_SPACING * 0.5;
    const altIdx   = Math.floor(state.pillarsSpawned / HAZARD_EVERY_N) % 2;
    const hazardTL : Timeline  = altIdx === 0 ? 'gone' : 'go';
    const hazardKind: HazardKind = hazardTL === 'gone' ? 'meteor' : 'sweep_laser';
    const targetY  = rng(LOGICAL_H * 0.25, LOGICAL_H * 0.72);
    state.midHazards.push({
      id: uid(),
      worldX: hazardX,
      y: hazardTL === 'gone' ? -METEOR_SIZE : targetY,
      targetY,
      timeline: hazardTL,
      kind: hazardKind,
      phase: 'warning',
      phaseTimer: HAZARD_WARNING_MS,
      activated: false,
    });
  }
}

// ─── Initial state ────────────────────────────────────────────────────────────

export function createInitialState(now: number): GameState {
  const state: GameState = {
    playerY: LOGICAL_H / 2 - PLAYER_H / 2,
    playerVY: 0,
    hp: HP_MAX,
    energy: ENERGY_MAX,
    invincibleUntil: 0,
    activeTimeline: 'went',
    slowMo: false,
    cameraX: 0,
    obstacles: [],
    energyPickups: [],
    buffs: [],
    midHazards: [],
    activeBuff: null,
    score: 0,
    pillarsSpawned: 0,
    lastFlapMs: 0,
    started: false,
    gameOver: false,
    gameOverReason: null,
    now,
  };

  // Pre-populate
  for (let i = 0; i < 4; i++) {
    spawnObstacleSet(state, FIRST_OBSTACLE_X + i * PILLAR_SPACING);
  }

  return state;
}

// ─── Tick ─────────────────────────────────────────────────────────────────────

export interface TickInput {
  flap: boolean;
  flapHeld: boolean;
  switchTimeline: Timeline | null;
  toggleSlowMo: boolean;
  godMode?: boolean;  // ?god=1 in URL — skips damage and energy death for testing
}

export function tick(
  prev: GameState,
  rawDeltaMs: number,
  input: TickInput,
  now: number,
  canvasW: number,
): GameState {
  if (!prev.started || prev.gameOver) return { ...prev, now };

  const s: GameState = {
    ...prev,
    obstacles:     prev.obstacles.map(o => ({ ...o, gapY: { ...o.gapY }, kind: { ...o.kind } })),
    energyPickups: prev.energyPickups.map(p => ({ ...p })),
    buffs:         prev.buffs.map(b => ({ ...b })),
    midHazards:    prev.midHazards.map(h => ({ ...h })),
    activeBuff:    prev.activeBuff ? { ...prev.activeBuff } : null,
    now,
  };

  // ── Slow-mo toggle ────────────────────────────────────────────────────────
  if (input.toggleSlowMo) s.slowMo = !s.slowMo;

  // ── Timeline switch ───────────────────────────────────────────────────────
  if (input.switchTimeline && input.switchTimeline !== s.activeTimeline) {
    s.activeTimeline = input.switchTimeline;
    s.slowMo = false;
  }

  const timeScale = s.slowMo ? SLOW_MO_FACTOR : 1;
  const dt        = (rawDeltaMs * timeScale) / 1000;

  const phys = PHYSICS[s.activeTimeline];

  // ── Flap (single tap — disabled for jet via flapForce === 0) ─────────────
  if (phys.flapForce !== 0 && input.flap && now - s.lastFlapMs > phys.flapCooldownMs) {
    s.playerVY   = phys.flapForce;
    s.lastFlapMs = now;
  }
  // ── Jet thrust (hold) ─────────────────────────────────────────────────────
  if (phys.thrustHold && input.flapHeld) {
    s.playerVY += phys.thrustHoldForce * dt * 60;
    s.playerVY  = Math.max(s.playerVY, phys.maxRiseSpeed);
  }

  // ── Gravity & position ────────────────────────────────────────────────────
  s.playerVY = Math.min(s.playerVY + phys.gravity * dt * 60, phys.maxFallSpeed);
  s.playerY += s.playerVY * dt * 60;

  if (s.playerY < 0) { s.playerY = 0; s.playerVY = 0; }
  if (s.playerY + PLAYER_H > LOGICAL_H) {
    s.playerY  = LOGICAL_H - PLAYER_H;
    s.playerVY = 0;
    if (now > s.invincibleUntil && s.activeBuff?.type !== 'shield') {
      s.hp--;
      s.invincibleUntil = now + INVINCIBILITY_MS;
      if (s.hp <= 0) { s.gameOver = true; s.gameOverReason = 'hp'; }
    }
  }

  // ── Scroll ────────────────────────────────────────────────────────────────
  const speed = Math.min(SCROLL_SPEED_BASE + s.score * SPEED_RAMP_PER_SCORE, SCROLL_SPEED_MAX);
  s.cameraX += speed * dt;

  // ── Energy drain (real-time, ignores slow-mo) ─────────────────────────────
  s.energy = Math.max(0, s.energy - ENERGY_DRAIN_PER_SEC * (rawDeltaMs / 1000));
  if (s.energy <= 0 && !s.gameOver && !input.godMode) { s.gameOver = true; s.gameOverReason = 'energy'; }

  // ── Spawn ─────────────────────────────────────────────────────────────────
  const screenRight = s.cameraX + canvasW;
  const lastObs = s.obstacles[s.obstacles.length - 1];
  const nextX   = lastObs ? lastObs.worldX + PILLAR_SPACING : FIRST_OBSTACLE_X;
  if (nextX < screenRight + 400) spawnObstacleSet(s, nextX);

  // ── Cull ──────────────────────────────────────────────────────────────────
  const cullX = s.cameraX - 300;
  s.obstacles     = s.obstacles.filter(o => o.worldX + PILLAR_W > cullX);
  s.energyPickups = s.energyPickups.filter(p => p.worldX + ENERGY_PICKUP_SIZE > cullX);
  s.buffs         = s.buffs.filter(b => b.worldX + BUFF_SIZE > cullX);
  s.midHazards    = s.midHazards.filter(h => h.phase !== 'done' && h.worldX > cullX - 200);

  // ── Buff expiry ───────────────────────────────────────────────────────────
  if (s.activeBuff && now > s.activeBuff.expiresAt) s.activeBuff = null;

  // ── Mid-hazard tick ───────────────────────────────────────────────────────
  for (const hz of s.midHazards) {
    const hScreenX = hz.worldX - s.cameraX;
    if (!hz.activated && hScreenX < canvasW + 80) hz.activated = true;
    if (!hz.activated) continue;

    hz.phaseTimer -= rawDeltaMs;   // warning/active run in real-time
    if (hz.phaseTimer <= 0) {
      if (hz.phase === 'warning') { hz.phase = 'active'; hz.phaseTimer = HAZARD_ACTIVE_MS; }
      else { hz.phase = 'done'; }
    }

    if (hz.kind === 'meteor' && hz.phase === 'active') {
      hz.y = Math.min(hz.y + METEOR_FALL_SPEED * (rawDeltaMs / 1000), hz.targetY);
    }
  }

  // ── Player bounding box ───────────────────────────────────────────────────
  const pLeft   = PLAYER_SCREEN_X;
  const pRight  = PLAYER_SCREEN_X + PLAYER_W;
  const pTop    = s.playerY;
  const pBottom = s.playerY + PLAYER_H;
  const canHit  = !input.godMode && now > s.invincibleUntil && s.activeBuff?.type !== 'shield';

  // ── Pillar collision (active timeline only, uses per-timeline width) ───────
  if (canHit) {
    for (const obs of s.obstacles) {
      const oPW    = PILLAR_WIDTHS[s.activeTimeline];
      const oLeft  = obs.worldX - s.cameraX;
      const oRight = oLeft + oPW;
      if (oRight < pLeft || oLeft > pRight) continue;

      const gapTop    = obs.gapY[s.activeTimeline];
      const gapBottom = gapTop + GAP_SIZE;
      if (pTop < gapTop || pBottom > gapBottom) {
        s.hp--;
        s.invincibleUntil = now + INVINCIBILITY_MS;
        if (s.hp <= 0) { s.gameOver = true; s.gameOverReason = 'hp'; }
        break;
      }
    }
  }

  // ── Mid-hazard collision (active timeline only) ───────────────────────────
  if (canHit) {
    for (const hz of s.midHazards) {
      if (hz.phase !== 'active' || hz.timeline !== s.activeTimeline) continue;

      let hit = false;
      if (hz.kind === 'meteor') {
        const hx = hz.worldX - s.cameraX;
        hit = hx < pRight + 4 && hx + METEOR_SIZE > pLeft - 4
           && hz.y < pBottom + 4 && hz.y + METEOR_SIZE > pTop - 4;
      } else {
        // sweep_laser: full-width horizontal bar at hz.targetY
        hit = hz.targetY < pBottom && hz.targetY + 10 > pTop;
      }

      if (hit) {
        s.hp--;
        s.invincibleUntil = now + INVINCIBILITY_MS;
        if (s.hp <= 0) { s.gameOver = true; s.gameOverReason = 'hp'; }
        break;
      }
    }
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  for (const obs of s.obstacles) {
    const oRight = obs.worldX - s.cameraX + PILLAR_WIDTHS[s.activeTimeline];
    if (!obs.passed && oRight < pLeft) {
      obs.passed = true;
      s.score += SCORE_PER_PILLAR * (s.activeBuff?.type === 'score_surge' ? 2 : 1);
    }
  }

  // ── Energy pickup ─────────────────────────────────────────────────────────
  for (const pk of s.energyPickups) {
    if (pk.collected || pk.timeline !== s.activeTimeline) continue;
    const px = pk.worldX - s.cameraX;
    if (px + ENERGY_PICKUP_SIZE > pLeft && px < pRight
     && pk.y + ENERGY_PICKUP_SIZE > pTop && pk.y < pBottom) {
      pk.collected = true;
      s.energy = Math.min(ENERGY_MAX, s.energy + ENERGY_PICKUP_VALUE);
      s.score += SCORE_ENERGY_COLLECT;
    }
  }

  // ── Buff collection ───────────────────────────────────────────────────────
  for (const bf of s.buffs) {
    if (bf.collected || bf.timeline !== s.activeTimeline) continue;
    const bx = bf.worldX - s.cameraX;
    if (bx + BUFF_SIZE > pLeft - 4 && bx < pRight + 4
     && bf.y + BUFF_SIZE > pTop - 4 && bf.y < pBottom + 4) {
      bf.collected = true;
      s.activeBuff = { type: bf.type, expiresAt: now + BUFF_DURATION_MS };
      s.score += SCORE_BUFF_COLLECT;
      if (bf.type === 'energy_burst') s.energy = Math.min(ENERGY_MAX, s.energy + 30);
    }
  }

  return s;
}
