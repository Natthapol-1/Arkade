import { playAmbientEventSound, syncAmbientEventLoop, pauseAmbientEventSounds, resumeAmbientEventSounds } from './event-audio';
import { CHAMBER_BOUNDS, TILE_SIZE, T_FLOOR, T_WALL } from './constants';
import type { GameState } from './engine';

export const AMBIENT_EVENTS = {
  blackhole: { name: 'BLACK HOLE', color: '#cb96ff', duration: 420 },
  shootingStar: { name: 'SHOOTING STAR', color: '#ffe18c', duration: 1836 },
  eclipse: { name: 'ECLIPSE', color: '#b6b4ff', duration: 360 },
  supernova: { name: 'SUPERNOVA', color: '#ffbd91', duration: 2700 },
} as const;
export type AmbientEventKind = keyof typeof AMBIENT_EVENTS;
export type EventPoint = { x: number; y: number };
export interface AmbientEventState {
  timer: number;
  pool: AmbientEventKind[];
  warning: { kind: AmbientEventKind; ticks: number; points: EventPoint[] } | null;
  active: { kind: AmbientEventKind; ticks: number; maxTicks: number; age: number; points: EventPoint[]; pullTimer: number; chargeTicks?: number; blastTicks?: number } | null;
  rewardTicks: number;
}
export const AMBIENT_WARNING_TICKS = 180;
export const STAR_FALL_TICKS = 36;
export const SUPERNOVA_CHARGE_TICKS = 180;
export const SUPERNOVA_BLAST_TICKS = 150;
export const SUPERNOVA_FULL_DAMAGE_RADIUS = 20;
export const SUPERNOVA_PLAYER_RADIUS = 45; // tiles; opposite chamber is additionally safe

// Only player lasers and area attacks call this; the star is never an enemy/auto-aim target.
export function hitSupernova(state: GameState, contains: (x: number, y: number) => boolean): boolean {
  const active = state.ambientEvents.active;
  if (state.gamePhase !== 'playing' || active?.kind !== 'supernova' || active.chargeTicks !== undefined) return false;
  const p = active.points[0];
  if (!contains((p.x + .5) * TILE_SIZE, (p.y + .5) * TILE_SIZE)) return false;
  playAmbientEventSound('supernova', 'charge');
  active.chargeTicks = SUPERNOVA_CHARGE_TICKS;
  active.ticks = SUPERNOVA_CHARGE_TICKS + SUPERNOVA_BLAST_TICKS + 1;
  return true;
}

const delay = () => 10800 + Math.floor(Math.random() * 7201);
export function createAmbientEvents(): AmbientEventState {
  return { timer: 9000 + Math.floor(Math.random() * 3601), pool: [], warning: null, active: null, rewardTicks: 0 };
}
export function isEclipseActive(state: GameState): boolean {
  return state.ambientEvents.active?.kind === 'eclipse';
}

function floorPoint(state: GameState, chamber: number): EventPoint | null {
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamber], candidates: EventPoint[] = [];
  for (let y = r1 + 2; y < r2 - 1; y++) for (let x = c1 + 2; x < c2 - 1; x++) {
    if (state.map[y][x] === T_FLOOR && Math.hypot(x - state.playerTileX, y - state.playerTileY) >= 3 &&
      !(x === state.rubyTileX && y === state.rubyTileY)) candidates.push({ x, y });
  }
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

export function triggerAmbientEvent(state: GameState, kind: AmbientEventKind): boolean {
  const events = state.ambientEvents;
  if (state.gamePhase !== 'playing' || events.warning || events.active || events.rewardTicks > 0) return false;
  const chambers = [0, 1, 2, 3].filter(ch => ch !== state.meteoriteWarning);
  const points: EventPoint[] = [];
  if (kind === 'blackhole' || kind === 'eclipse') points.push({ x: 25, y: 25 });
  else {
    while (chambers.length && points.length < 1) {
      const ch = chambers.splice(Math.floor(Math.random() * chambers.length), 1)[0];
      const point = floorPoint(state, ch); if (point) points.push(point);
    }
    if (points.length < 1) return false;
  }
  events.warning = { kind, ticks: AMBIENT_WARNING_TICKS, points };
  playAmbientEventSound(kind, 'warning');
  return true;
}

function finish(state: GameState) {
  state.ambientEvents.active = null;
  syncAmbientEventLoop(undefined);
  state.ambientEvents.timer = delay();
}

function pullDirection(state: GameState, x: number, y: number): EventPoint | null {
  const dx = Math.sign(25 - x), dy = Math.sign(25 - y);
  const directions = Math.abs(25 - x) >= Math.abs(25 - y) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
  for (const [sx, sy] of directions) {
    if ((sx || sy) && state.map[y + sy]?.[x + sx] !== undefined && state.map[y + sy][x + sx] !== T_WALL) return { x: sx, y: sy };
  }
  return null;
}

function pull(state: GameState) {
  if (!state.playerKnockback && state.playerFrozenTicks <= 0) {
    const direction = pullDirection(state, state.playerTargetX, state.playerTargetY);
    if (direction) state.playerKnockback = { dirX: direction.x, dirY: direction.y, started: false };
  }
  for (const enemy of state.enemies) {
    if (enemy.type === 'aegis_construct' || enemy.twin?.downedTicks || enemy.pushTiles > 0 || enemy.exploding) continue;
    const direction = pullDirection(state, enemy.tileX, enemy.tileY);
    if (direction) { enemy.pushDirX = direction.x; enemy.pushDirY = direction.y; enemy.pushTiles = 1; }
  }
}

// Returns a one-time pickup/detonation signal; the engine owns rewards and damage.
export function updateAmbientEvents(state: GameState): boolean | 'supernova' {
  if (state.gamePhase !== 'playing') { pauseAmbientEventSounds(); return false; }
  resumeAmbientEventSounds();
  syncAmbientEventLoop(state.ambientEvents.active?.kind, state.ambientEvents.active?.age);
  const events = state.ambientEvents;
  if (events.rewardTicks > 0) events.rewardTicks--;
  if (events.warning) {
    if (--events.warning.ticks <= 0) {
      const { kind, points } = events.warning, duration = AMBIENT_EVENTS[kind].duration;
      events.active = { kind, points, ticks: duration, maxTicks: duration, age: 0, pullTimer: 0 };
      events.warning = null;
      playAmbientEventSound(kind, 'active');
    }
    return false;
  }
  const active = events.active;
  if (!active) {
    events.timer--;
    // Let meteor and boss announcements take priority over scheduling minor events.
    if (events.timer <= 0 && state.meteoriteWarning < 0 && state.bossWarningTicks <= 0 && state.bossSpawnTicks <= 0) {
      if (!events.pool.length) events.pool = (Object.keys(AMBIENT_EVENTS) as AmbientEventKind[]).flatMap(kind => Array<AmbientEventKind>(kind === 'supernova' ? 1 : 6).fill(kind));
      const index = Math.floor(Math.random() * events.pool.length), kind = events.pool[index];
      if (triggerAmbientEvent(state, kind)) events.pool.splice(index, 1);
    }
    return false;
  }
  if (--active.ticks <= 0) { finish(state); return false; }
  active.age++;
  if (active.kind === 'supernova') {
    if (active.blastTicks !== undefined) active.blastTicks--;
    else if (active.chargeTicks !== undefined && --active.chargeTicks <= 0) {
      active.blastTicks = SUPERNOVA_BLAST_TICKS;
      return 'supernova';
    }
  }
  if (active.kind === 'blackhole' && --active.pullTimer <= 0) { active.pullTimer = 45; pull(state); }
  if (active.kind === 'shootingStar' && active.age >= STAR_FALL_TICKS) {
    const point = active.points[0];
    if (state.playerTileX === point.x && state.playerTileY === point.y) {
      playAmbientEventSound('shootingStar', 'collect');
      events.rewardTicks = 180; finish(state); return true;
    }
  }
  return false;
}
