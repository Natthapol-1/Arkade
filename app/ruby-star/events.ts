import { CHAMBER_BOUNDS, T_FLOOR, T_WALL } from './constants';
import type { GameState } from './engine';

export const AMBIENT_EVENTS = {
  blackhole: { name: 'BLACK HOLE', color: '#cb96ff', duration: 420 },
  shootingStar: { name: 'SHOOTING STAR', color: '#ffe18c', duration: 1836 },
  eclipse: { name: 'ECLIPSE', color: '#b6b4ff', duration: 360 },
} as const;
export type AmbientEventKind = keyof typeof AMBIENT_EVENTS;
export type EventPoint = { x: number; y: number };
export interface AmbientEventState {
  timer: number;
  pool: AmbientEventKind[];
  warning: { kind: AmbientEventKind; ticks: number; points: EventPoint[] } | null;
  active: { kind: AmbientEventKind; ticks: number; maxTicks: number; age: number; points: EventPoint[]; pullTimer: number } | null;
  rewardTicks: number;
}
export const AMBIENT_WARNING_TICKS = 180;
export const STAR_FALL_TICKS = 36;
const delay = () => 5400 + Math.floor(Math.random() * 3601);
export function createAmbientEvents(): AmbientEventState {
  return { timer: 4500 + Math.floor(Math.random() * 2401), pool: [], warning: null, active: null, rewardTicks: 0 };
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
  return true;
}

function finish(state: GameState) {
  state.ambientEvents.active = null;
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
    if (enemy.pushTiles > 0 || enemy.exploding) continue;
    const direction = pullDirection(state, enemy.tileX, enemy.tileY);
    if (direction) { enemy.pushDirX = direction.x; enemy.pushDirY = direction.y; enemy.pushTiles = 1; }
  }
}

// Returns true once when a landed stellar shard is collected. The engine owns rewards.
export function updateAmbientEvents(state: GameState): boolean {
  if (state.gamePhase !== 'playing') return false;
  const events = state.ambientEvents;
  if (events.rewardTicks > 0) events.rewardTicks--;
  if (events.warning) {
    if (--events.warning.ticks <= 0) {
      const { kind, points } = events.warning, duration = AMBIENT_EVENTS[kind].duration;
      events.active = { kind, points, ticks: duration, maxTicks: duration, age: 0, pullTimer: 0 };
      events.warning = null;
    }
    return false;
  }
  const active = events.active;
  if (!active) {
    events.timer--;
    // Let meteor and boss announcements take priority over scheduling minor events.
    if (events.timer <= 0 && state.meteoriteWarning < 0 && state.bossWarningTicks <= 0 && state.bossSpawnTicks <= 0) {
      if (!events.pool.length) events.pool = Object.keys(AMBIENT_EVENTS) as AmbientEventKind[];
      const index = Math.floor(Math.random() * events.pool.length), kind = events.pool[index];
      if (triggerAmbientEvent(state, kind)) events.pool.splice(index, 1);
    }
    return false;
  }
  if (--active.ticks <= 0) { finish(state); return false; }
  active.age++;
  if (active.kind === 'blackhole' && --active.pullTimer <= 0) { active.pullTimer = 45; pull(state); }
  if (active.kind === 'shootingStar' && active.age >= STAR_FALL_TICKS) {
    const point = active.points[0];
    if (state.playerTileX === point.x && state.playerTileY === point.y) {
      events.rewardTicks = 180; finish(state); return true;
    }
  }
  return false;
}
