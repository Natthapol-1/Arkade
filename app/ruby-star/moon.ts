import {
  CHAMBER_SPAWN_TILES, MAP_COLS, TILE_SIZE, T_WALL, chamberOfTile, type EnemyType,
  MOON_PHASE_HP, MOON_FIRST_CLONES, MOON_CLONES_PER_JUMP, MOON_CLONE_CAP, MOON_REVEAL_TICKS, MOON_REVEAL_DAMAGE_MULT,
  MOON_MARK_TICKS, MOON_MARK_COOLDOWN, MOON_SHARD_COUNT, MOON_SHARD_SPEED, MOON_SHARD_TICKS, MOON_SHARD_DAMAGE, MOON_SHARD_RUBY_DAMAGE, MOON_SHARD_HIT_RADIUS, ENEMY_CONFIGS,
} from './constants';
import {
  createEncounterEnemy, damagePlayer, playCelestialSound, damageRuby, playSFX_objectBreak, spawnDeathParticles, tileEuclidDist, type Enemy, type GameState,
} from './engine';

// Moon challenge (Shadow Queen), phase 1: illusions. She wears her Echo's look and, from her first jump on, hides among
// illusions that look and attack exactly like her. For the last moments before each jump she shows her true self and
// takes extra damage. Destroying an illusion bursts it into a ring of crystal shards. Only she casts a reflection on
// the crystal floor. The core engine calls in through updateMoon and the exported helpers.

export interface MoonShard { x: number; y: number; dx: number; dy: number; ticks: number }
export interface MoonState {
  phase: 1; bossId: number;
  jumps: number; // jumps made so far; the first brings MOON_FIRST_CLONES illusions
  shards: MoonShard[];
  arrivals: { x: number; y: number; ticks: number }[]; // visual: where she and her new illusions appear together
  unmask: { id: number; ticks: number } | null;        // visual: her disguise breaking as the reveal starts
  mark: { id: number; ticks: number } | null;          // C: one marked Queen or illusion
  markCooldown: number;
}

export const MOON_ARRIVAL_TICKS = 30;
export const MOON_UNMASK_TICKS = 24;

export function createMoonState(state: GameState) {
  state.moon = { phase: 1, bossId: -1, jumps: 0, shards: [], arrivals: [], unmask: null, mark: null, markCooldown: 0 };
}

export function isMoonObject(type: EnemyType) { return type === 'moon_illusion'; }

export function initializeMoonBoss(state: GameState, boss: Enemy) {
  boss.hp = boss.maxHp = MOON_PHASE_HP;
  state.moon!.bossId = boss.id;
}

export function isMoonBoss(state: Readonly<GameState>, e: Enemy) { return !!state.moon && e.id === state.moon.bossId; }
export function isMoonRevealed(state: Readonly<GameState>, e: Enemy) { return isMoonBoss(state, e) && e.phaseTimer <= MOON_REVEAL_TICKS; }
// Drawn with the Echo model: every illusion, and the Queen herself except while revealed.
export function moonWearsGuise(state: Readonly<GameState>, e: Enemy) {
  return e.type === 'moon_illusion' || (isMoonBoss(state, e) && !isMoonRevealed(state, e));
}
export function moonBossDamageMult(state: GameState, e: Enemy) { return isMoonRevealed(state, e) ? MOON_REVEAL_DAMAGE_MULT : 1; }

// After she lands: illusions appear in the same instant, one in her own new chamber (so a lone arrival there gives
// nothing away) and the rest in chambers other than yours. The oldest fade out past the cap.
export function moonQueenJumped(state: GameState, boss: Enemy) {
  const moon = state.moon!;
  const count = moon.jumps === 0 ? MOON_FIRST_CLONES : MOON_CLONES_PER_JUMP;
  moon.jumps++;
  const taken = new Set(state.enemies.map(e => e.tileX + ',' + e.tileY));
  const bossChamber = chamberOfTile(boss.tileX, boss.tileY), playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);
  const others = [0, 1, 2, 3].filter(ch => ch !== playerChamber);
  moon.arrivals.push({ x: boss.x, y: boss.y, ticks: MOON_ARRIVAL_TICKS });
  for (let i = 0; i < count; i++) {
    const chamber = i === 0 ? bossChamber : others[Math.floor(Math.random() * others.length)];
    const pool = CHAMBER_SPAWN_TILES[chamber].filter(([x, y]) => !taken.has(x + ',' + y) && tileEuclidDist(x, y, boss.tileX, boss.tileY) >= 3);
    if (!pool.length) continue;
    const [tx, ty] = pool[Math.floor(Math.random() * pool.length)];
    taken.add(tx + ',' + ty);
    const clone = createEncounterEnemy(state, 'moon_illusion', tx, ty, ENEMY_CONFIGS.moon_illusion.maxHp);
    clone.attackTimer = 0; // same as her after a jump
    state.enemies.push(clone);
    moon.arrivals.push({ x: clone.x, y: clone.y, ticks: MOON_ARRIVAL_TICKS });
  }
  const illusions = state.enemies.filter(e => e.type === 'moon_illusion').sort((a, b) => a.id - b.id);
  for (const old of illusions.slice(0, Math.max(0, illusions.length - MOON_CLONE_CAP))) {
    spawnDeathParticles(state, old);
    state.enemies.splice(state.enemies.indexOf(old), 1);
  }
}

// A destroyed illusion bursts into a ring of crystal shards flying outward.
export function moonShatter(state: GameState, victim: Enemy) {
  const moon = state.moon; if (!moon) return;
  const turn = Math.random() * Math.PI / MOON_SHARD_COUNT;
  for (let i = 0; i < MOON_SHARD_COUNT; i++) {
    const a = turn + i * Math.PI * 2 / MOON_SHARD_COUNT;
    moon.shards.push({ x: victim.x, y: victim.y, dx: Math.cos(a) * MOON_SHARD_SPEED, dy: Math.sin(a) * MOON_SHARD_SPEED, ticks: MOON_SHARD_TICKS });
  }
  playSFX_objectBreak('frost');
}

// Her defeat clears every illusion and shard.
export function clearMoonIllusions(state: GameState) {
  if (!state.moon) return;
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    if (state.enemies[i].type !== 'moon_illusion') continue;
    spawnDeathParticles(state, state.enemies[i]); state.enemies.splice(i, 1);
  }
  state.moon.shards = []; state.moon.mark = null;
}

// C: mark the nearest Queen or illusion. The mark rides along with whoever wears it, so if it was her it follows her
// to her next chamber; an illusion's mark stays put when she jumps.
export function canUseMoonMark(state: GameState) { return !!state.moon && state.gamePhase === 'playing' && state.moon.markCooldown <= 0; }
export function useMoonMark(state: GameState): boolean {
  const moon = state.moon; if (!moon || !canUseMoonMark(state)) return false;
  let best: Enemy | null = null, bestDist = Infinity;
  for (const e of state.enemies) {
    if (e.hp <= 0 || (e.type !== 'moon_illusion' && e.id !== moon.bossId)) continue;
    const d = Math.hypot(e.x - state.playerX, e.y - state.playerY);
    if (d < bestDist) { bestDist = d; best = e; }
  }
  if (!best) return false;
  moon.mark = { id: best.id, ticks: MOON_MARK_TICKS }; moon.markCooldown = MOON_MARK_COOLDOWN;
  playCelestialSound('ready');
  return true;
}

export function updateMoon(state: GameState) {
  const moon = state.moon!;
  state.ambientEvents.timer = Math.max(state.ambientEvents.timer, 3600); // no space events on this world
  const boss = state.enemies.find(e => e.id === moon.bossId && e.hp > 0);
  if (boss && boss.phaseTimer === MOON_REVEAL_TICKS) moon.unmask = { id: boss.id, ticks: MOON_UNMASK_TICKS };
  if (moon.unmask && --moon.unmask.ticks <= 0) moon.unmask = null;
  if (moon.markCooldown > 0) moon.markCooldown--;
  if (moon.mark && (--moon.mark.ticks <= 0 || !state.enemies.some(e => e.id === moon.mark!.id && e.hp > 0))) moon.mark = null;
  for (let i = moon.arrivals.length - 1; i >= 0; i--) if (--moon.arrivals[i].ticks <= 0) moon.arrivals.splice(i, 1);
  const hit = MOON_SHARD_HIT_RADIUS * TILE_SIZE;
  for (let i = moon.shards.length - 1; i >= 0; i--) {
    const s = moon.shards[i];
    s.x += s.dx; s.y += s.dy; s.ticks--;
    const tx = Math.floor(s.x / TILE_SIZE), ty = Math.floor(s.y / TILE_SIZE);
    let gone = s.ticks <= 0 || tx < 0 || tx >= MAP_COLS || (state.map[ty]?.[tx] ?? T_WALL) === T_WALL;
    if (!gone && Math.hypot(s.x - state.playerX, s.y - state.playerY) < hit) { damagePlayer(state, MOON_SHARD_DAMAGE); gone = true; }
    if (!gone && state.rubyTileX !== -1 && Math.hypot(s.x - (state.rubyTileX + .5) * TILE_SIZE, s.y - (state.rubyTileY + .5) * TILE_SIZE) < hit) {
      damageRuby(state, MOON_SHARD_RUBY_DAMAGE); gone = true;
    }
    if (gone) moon.shards.splice(i, 1);
  }
}
