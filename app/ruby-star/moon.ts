import {
  CHAMBER_BOUNDS, CHAMBER_SPAWN_TILES, MAP_COLS, TELEPORT_PADS, TILE_SIZE, T_FLOOR, T_WALL, chamberOfTile, type EnemyType,
  MOON_PHASE_HP, MOON_FIRST_CLONES, MOON_CLONES_PER_JUMP, MOON_CLONE_CAPS, MOON_MIRROR_STRIPS, MOON_MIRROR_LENGTH, MOON_MIRROR_SHIFT, MOON_MIRROR_FADE, MOON_REVEAL_TICKS, MOON_REVEAL_DAMAGE_MULT,
  MOON_MARK_TICKS, MOON_MARK_COOLDOWN, MOON_MITE_HINT_TICKS, MOON_MIMIC_TRUE_TICKS, MOON_MIMIC_GAP, MOON_MIMIC_CAP, MOON_DARK_SHIFT, MOON_DARK_FADE, MOON_SEEN_TICKS, MOON_SHARD_COUNT, MOON_SHARD_SPEED, MOON_SHARD_TICKS, MOON_SHARD_DAMAGE, MOON_SHARD_RUBY_DAMAGE, MOON_SHARD_HIT_RADIUS, ENEMY_CONFIGS,
} from './constants';
import {
  ATTACK_SFX_VOLUME, bfs, createEncounterEnemy, damagePlayer, playAudioOneShot, godSpawnBoss, healCore, healPlayer, playCelestialSound, playSFX_queenTeleport, damageRuby, playSFX_objectBreak, spawnDeathParticles, tileEuclidDist, type Enemy, type GameState,
} from './engine';
import { playUiSfx } from './ui-sfx';

// Moon challenge (Shadow Queen), phase 1: illusions. She wears her Echo's look and, from her first jump on, hides among
// illusions that look and attack exactly like her. For the last moments before each jump she shows her true self and
// takes extra damage. Destroying an illusion bursts it into a ring of crystal shards. Only she casts a reflection on
// the crystal floor. The core engine calls in through updateMoon and the exported helpers.

export interface MoonShard { x: number; y: number; dx: number; dy: number; ticks: number }
export interface MoonState {
  phase: 1 | 2 | 3; bossId: number; // phases only move forward; all three play the same for now
  jumps: number; // jumps made so far; the first brings MOON_FIRST_CLONES illusions
  shards: MoonShard[];
  arrivals: { x: number; y: number; ticks: number }[]; // visual: where she and her new illusions appear together
  unmask: { id: number; ticks: number } | null;        // visual: her disguise breaking as the reveal starts
  mark: { id: number; ticks: number } | null;          // C: one marked Queen or illusion
  markCooldown: number;
  hint: { rooms: number[]; ticks: number } | null; // after a mite kill: her room and one other, in random order
  healBank: number; // heal earned by hitting her, paid out on her next jump
  shownHp: number;  // what the guardian bar shows: synced only while she is revealed and when she jumps
  mirrors: number[]; // phase 2+: mirror floor tiles (y * MAP_COLS + x)
  mirrorTimer: number; // ticks until they move
  mimicTimer: number; // phase 2+: ticks until the next mimic arrives
  dark: number; darkTimer: number; // phase 3: the dark room (-1 none) and ticks until it moves
  oldDark: number; darkFade: number; // visual: the room it just left, still fading back in
  seen: { id: number; ticks: number }[]; // units in the dark that were just hit, briefly visible
  oldMirrors: number[]; mirrorFade: number; // visual: last spots fading out while the new ones fade in
  reflects: { x: number; y: number; toX: number; toY: number; ticks: number }[]; // visual: your shot bouncing back
}

export const MOON_ARRIVAL_TICKS = 30;
export const MOON_UNMASK_TICKS = 24;

export function createMoonState(state: GameState) {
  state.moon = { phase: 1, bossId: -1, jumps: 0, shards: [], arrivals: [], unmask: null, mark: null, markCooldown: 0, hint: null, healBank: 0, shownHp: 0, mirrors: [], mirrorTimer: 0, mimicTimer: MOON_MIMIC_GAP, dark: -1, darkTimer: 0, oldDark: -1, darkFade: 0, seen: [], oldMirrors: [], mirrorFade: 0, reflects: [] };
}

export function isMoonObject(type: EnemyType) { return type === 'moon_illusion'; }

export function initializeMoonBoss(state: GameState, boss: Enemy) {
  boss.hp = boss.maxHp = MOON_PHASE_HP * 3;
  state.moon!.bossId = boss.id; state.moon!.phase = 1; state.moon!.shownHp = boss.hp;
  state.moon!.arrivals.push({ x: boss.x, y: boss.y, ticks: MOON_ARRIVAL_TICKS }); // she arrives the way she jumps
  playSFX_queenTeleport();
}

export function isMoonBoss(state: Readonly<GameState>, e: Enemy) { return !!state.moon && e.id === state.moon.bossId; }
export function isMoonRevealed(state: Readonly<GameState>, e: Enemy) { return isMoonBoss(state, e) && e.phaseTimer <= MOON_REVEAL_TICKS; }
// Drawn with the Echo model: every illusion, and the Queen herself except while revealed.
export function moonWearsGuise(state: Readonly<GameState>, e: Enemy) {
  return e.type === 'moon_illusion' || !!e.mimic?.disguised || (isMoonBoss(state, e) && !isMoonRevealed(state, e));
}

const between = ([a, b]: [number, number]) => a + Math.floor(Math.random() * (b - a + 1));
// Mimic: it never chases or attacks. In its own form it wanders its room; then it walks to the nearest free
// wall-side spot (where she and her illusions stand), takes an illusion's look and sits still until destroyed.
// Always returns true, so the normal chase-and-attack AI never runs for it.
export function updateMoonMimic(state: GameState, e: Enemy): boolean {
  const m = e.mimic ??= { disguised: false, timer: between(MOON_MIMIC_TRUE_TICKS) };
  if (m.timer > 0) m.timer--;
  if (m.disguised) { e.pushTiles = 0; return true; } // posing for good: like an illusion, it cannot be pushed
  if (m.timer > 0) { wander(state, e, m); return true; }
  // Time to pose: it only poses once it stands on a free wall-side spot, where she and her illusions always stand.
  // It heads for the nearest one, and picks the next nearest if that one is taken or cannot be reached.
  const settled = e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.pushTiles <= 0;
  const occupied = (x: number, y: number) => state.enemies.some(o => o !== e && o.hp > 0 && o.tileX === x && o.tileY === y);
  if (m.seek && settled && occupied(m.seek[0], m.seek[1])) m.seek = undefined;
  if (!m.seek) {
    // Nearest first; only path-check until the first reachable free spot.
    const spots = CHAMBER_SPAWN_TILES.flat().filter(([x, y]) => !occupied(x, y))
      .sort((p, q) => tileEuclidDist(e.tileX, e.tileY, p[0], p[1]) - tileEuclidDist(e.tileX, e.tileY, q[0], q[1]));
    const best = spots.find(([x, y]) => (x === e.tileX && y === e.tileY) || bfs(state.map, e.tileX, e.tileY, x, y).length > 0) as [number, number] | undefined;
    if (!best) { wander(state, e, m); return true; } // nowhere free yet: keep wandering
    m.seek = best; e.path = [];
  }
  const [gx, gy] = m.seek;
  if (!(settled && e.tileX === gx && e.tileY === gy)) { walkToward(state, e, gx, gy); return true; }
  {
    m.seek = undefined;
    m.disguised = true; e.hp = Math.min(e.hp, 1); // it poses until destroyed, fragile at 1 HP
    e.x = (e.tileX + .5) * TILE_SIZE; e.y = (e.tileY + .5) * TILE_SIZE; e.stepProgress = 0; e.path = []; e.windupTicks = 0;
    return true;
  }
}

// Phase 2+: mimics arrive on their own timer on a free wall-side spot at least 5 tiles from you, so they never take
// the place of other spawns.
function spawnMimic(state: GameState) {
  if (state.enemies.filter(e => e.type === 'moon_mimic').length >= MOON_MIMIC_CAP) return;
  const spots = CHAMBER_SPAWN_TILES.flat().filter(([x, y]) => tileEuclidDist(x, y, state.playerTileX, state.playerTileY) >= 5
    && !state.enemies.some(o => o.tileX === x && o.tileY === y));
  if (!spots.length) return;
  const [tx, ty] = spots[Math.floor(Math.random() * spots.length)];
  state.enemies.push(createEncounterEnemy(state, 'moon_mimic', tx, ty, ENEMY_CONFIGS.moon_mimic.maxHp));
}

// Own form: amble to random floor tiles in its current room.
function wander(state: GameState, e: Enemy, m: NonNullable<Enemy['mimic']>) {
  const settled = e.tileX === e.targetTileX && e.tileY === e.targetTileY;
  if (!m.wander || (settled && e.tileX === m.wander[0] && e.tileY === m.wander[1]) || (settled && !e.path.length)) {
    const room = chamberOfTile(e.tileX, e.tileY), [r1, c1, r2, c2] = CHAMBER_BOUNDS[Math.max(0, room)];
    for (let tries = 0; tries < 20; tries++) {
      const x = c1 + 1 + Math.floor(Math.random() * (c2 - c1 - 1)), y = r1 + 1 + Math.floor(Math.random() * (r2 - r1 - 1));
      if (state.map[y]?.[x] === T_FLOOR) { m.wander = [x, y]; e.path = []; break; }
    }
  }
  if (m.wander) walkToward(state, e, m.wander[0], m.wander[1]);
}

// One tick of tile-by-tile walking along a BFS path (never attacking).
function walkToward(state: GameState, e: Enemy, gx: number, gy: number) {
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    if (!e.path.length) e.path = bfs(state.map, e.tileX, e.tileY, gx, gy);
    const next = e.path.shift();
    if (next) { [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0; }
    return;
  }
  e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + ENEMY_CONFIGS.moon_mimic.speed);
  e.x = (e.tileX + .5) * TILE_SIZE + (e.targetTileX - e.tileX) * e.stepProgress;
  e.y = (e.tileY + .5) * TILE_SIZE + (e.targetTileY - e.tileY) * e.stepProgress;
  if (e.stepProgress >= TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
}
export function moonBossDamageMult(state: GameState, e: Enemy) { return isMoonRevealed(state, e) ? MOON_REVEAL_DAMAGE_MULT : 1; }

// After she lands: illusions appear in the same instant, one in her own new chamber (so a lone arrival there gives
// nothing away) and the rest in chambers other than yours. The oldest fade out past the cap.
export function moonQueenJumped(state: GameState, boss: Enemy) {
  const moon = state.moon!;
  if (moon.healBank > 0) { // only now that she is gone; Ruby shares it only when it is with you (carried or in your room)
    healPlayer(state, moon.healBank);
    const rubyWithYou = state.playerCarryingRuby || (state.rubyTileX !== -1 && chamberOfTile(state.rubyTileX, state.rubyTileY) === chamberOfTile(state.playerTileX, state.playerTileY));
    if (rubyWithYou) healCore(state, moon.healBank);
    moon.healBank = 0;
  }
  moon.hint = null; // a mite's room hint is out of date once she moves
  syncShownHp(state, boss);
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
  for (const old of illusions.slice(0, Math.max(0, illusions.length - MOON_CLONE_CAPS[moon.phase]))) {
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

// Killing a mirror mite shows two rooms on the minimap: the one she is in and one other, in random order.
export function moonMiteHint(state: GameState) {
  const moon = state.moon; if (!moon) return;
  const boss = state.enemies.find(e => e.id === moon.bossId && e.hp > 0); if (!boss) return;
  const hers = chamberOfTile(boss.tileX, boss.tileY); if (hers < 0) return;
  const others = [0, 1, 2, 3].filter(ch => ch !== hers), other = others[Math.floor(Math.random() * others.length)];
  moon.hint = { rooms: Math.random() < .5 ? [hers, other] : [other, hers], ticks: MOON_MITE_HINT_TICKS };
}

// The guardian bar (and her phase) only catch up while she is revealed and when she jumps, so hitting a disguised
// target never shows at once whether it was her. The phase follows the shown HP and never goes backward.
function syncShownHp(state: GameState, boss: Enemy) {
  const moon = state.moon!;
  moon.shownHp = boss.hp;
  const phase = boss.hp > MOON_PHASE_HP * 2 ? 1 : boss.hp > MOON_PHASE_HP ? 2 : 3;
  if (phase > moon.phase) { moon.phase = phase; phaseBanner(state, phase); }
  if (moon.phase >= 2 && !moon.mirrors.length) placeMoonMirrors(state);
  if (moon.phase >= 3 && moon.dark < 0) moveMoonDark(state);
}

// Phase 3: one random room goes dark (a different one each time it moves). Inside it only walls, the room outline,
// you, Ruby and attack effects show; units appear briefly when hit.
export function moveMoonDark(state: GameState) {
  const moon = state.moon!;
  const rooms = [0, 1, 2, 3].filter(r => r !== moon.dark);
  moon.oldDark = moon.dark; moon.darkFade = moon.dark >= 0 ? MOON_DARK_FADE : 0;
  moon.dark = rooms[Math.floor(Math.random() * rooms.length)]; moon.darkTimer = MOON_DARK_SHIFT;
}

// A unit that takes a hit inside the dark shows itself for a moment.
export function moonSeenWhenHit(state: GameState, e: Enemy) {
  const moon = state.moon; if (!moon || moon.dark < 0) return;
  const seen = moon.seen.find(s => s.id === e.id);
  if (seen) seen.ticks = MOON_SEEN_TICKS; else moon.seen.push({ id: e.id, ticks: MOON_SEEN_TICKS });
}

// Hidden: standing in the dark room and not just hit.
export function moonHiddenInDark(state: Readonly<GameState>, tx: number, ty: number, id?: number) {
  const moon = state.moon;
  if (!moon || moon.dark < 0 || chamberOfTile(tx, ty) !== moon.dark) return false;
  return id === undefined || !moon.seen.some(s => s.id === id);
}

// Phase 2+: short straight strips of mirror floor in every room, on open floor away from pads. You can walk over
// them, but your laser and bullets stop there and their damage bounces back into you.
export function placeMoonMirrors(state: GameState) {
  const moon = state.moon!;
  moon.oldMirrors = moon.mirrors; moon.mirrorFade = moon.mirrors.length ? MOON_MIRROR_FADE : 0;
  moon.mirrors = []; moon.mirrorTimer = MOON_MIRROR_SHIFT;
  const taken = new Set<number>([state.playerTileY * MAP_COLS + state.playerTileX]); // never right under you
  for (let room = 0; room < 4; room++) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[room], [px, py] = TELEPORT_PADS[room];
    for (let strip = 0, tries = 0; strip < MOON_MIRROR_STRIPS && tries < 200; tries++) {
      const vertical = Math.random() < .5;
      const x = c1 + 2 + Math.floor(Math.random() * (c2 - c1 - 3)), y = r1 + 2 + Math.floor(Math.random() * (r2 - r1 - 3));
      const tiles: number[] = [];
      for (let k = 0; k < MOON_MIRROR_LENGTH; k++) {
        const tx = vertical ? x : x + k, ty = vertical ? y + k : y;
        if (state.map[ty]?.[tx] !== T_FLOOR || Math.max(Math.abs(tx - px), Math.abs(ty - py)) <= 2) break;
        const index = ty * MAP_COLS + tx;
        if ([0, 1, -1, MAP_COLS, -MAP_COLS].some(d => taken.has(index + d))) break; // keep strips apart
        tiles.push(index);
      }
      if (tiles.length < MOON_MIRROR_LENGTH) continue;
      tiles.forEach(i => taken.add(i)); moon.mirrors.push(...tiles); strip++;
    }
  }
}

export function isMoonMirror(state: Readonly<GameState>, tx: number, ty: number) { return !!state.moon && state.moon.mirrors.includes(ty * MAP_COLS + tx); }

// Your shot hit a mirror: its damage comes back to you, with a pale streak from the mirror.
export function moonReflect(state: GameState, tx: number, ty: number, damage: number) {
  const moon = state.moon!;
  damagePlayer(state, damage);
  moon.reflects.push({ x: (tx + .5) * TILE_SIZE, y: (ty + .5) * TILE_SIZE, toX: state.playerX, toY: state.playerY, ticks: 16 });
  if (moon.reflects.length > 16) moon.reflects.shift();
}

function phaseBanner(state: GameState, phase: number) {
  state.bossSpawnName = 'PHASE ' + phase; state.bossSpawnColor = ENEMY_CONFIGS.splitter_queen.color; state.bossSpawnTicks = 120;
}

// God panel: jump straight to a phase at full phase HP (summoning her first if she has not arrived).
export function godSetMoonPhase(state: GameState, phase: 1 | 2 | 3) {
  const moon = state.moon;
  if (!moon || state.gamePhase !== 'playing') return;
  let boss = state.enemies.find(e => e.id === moon.bossId && e.hp > 0);
  if (!boss) { godSpawnBoss(state, 'splitter_queen'); boss = state.enemies.find(e => e.id === moon.bossId && e.hp > 0); }
  if (!boss) return;
  moon.phase = phase; boss.hp = moon.shownHp = MOON_PHASE_HP * (4 - phase) - .01;
  if (phase >= 2) { if (!moon.mirrors.length) placeMoonMirrors(state); } else { moon.mirrors = []; moon.oldMirrors = []; }
  if (phase >= 3) { if (moon.dark < 0) moveMoonDark(state); } else { moon.dark = moon.oldDark = -1; moon.darkFade = 0; moon.seen = []; }
  phaseBanner(state, phase);
}

// The Lunar Echo chime, skipping its silent first 0.1s and played 1.6× faster (pitch up), so it lands with the reveal.
function playRevealChime() {
  try {
    const sound = new Audio('/sounds/celestial/lunar-echo.wav');
    sound.volume = Math.min(1, 1.1 * .9 * ATTACK_SFX_VOLUME); sound.playbackRate = 1.6; sound.preservesPitch = false; sound.currentTime = .1;
    sound.play().catch(() => {});
  } catch { }
}

// Her defeat clears every illusion and shard.
export function clearMoonIllusions(state: GameState) {
  if (!state.moon) return;
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    if (state.enemies[i].type !== 'moon_illusion') continue;
    spawnDeathParticles(state, state.enemies[i]); state.enemies.splice(i, 1);
  }
  state.moon.shards = []; state.moon.mark = null; state.moon.hint = null;
}

// C: mark the nearest Queen or illusion. The mark rides along with whoever wears it, so if it was her it follows her
// to her next chamber; an illusion's mark stays put when she jumps.
export function canUseMoonMark(state: GameState) { return !!state.moon && state.gamePhase === 'playing' && state.moon.markCooldown <= 0; }
export function useMoonMark(state: GameState): boolean {
  const moon = state.moon; if (!moon || !canUseMoonMark(state)) return false;
  let best: Enemy | null = null, bestDist = Infinity;
  for (const e of state.enemies) {
    if (e.hp <= 0 || (e.type !== 'moon_illusion' && !e.mimic?.disguised && e.id !== moon.bossId)) continue;
    const d = Math.hypot(e.x - state.playerX, e.y - state.playerY);
    if (d < bestDist) { bestDist = d; best = e; }
  }
  if (!best) return false;
  moon.mark = { id: best.id, ticks: MOON_MARK_TICKS }; moon.markCooldown = MOON_MARK_COOLDOWN;
  playUiSfx('markCast');
  return true;
}

export function updateMoon(state: GameState) {
  const moon = state.moon!;
  state.ambientEvents.timer = Math.max(state.ambientEvents.timer, 3600); // no space events on this world
  const boss = state.enemies.find(e => e.id === moon.bossId && e.hp > 0);
  if (boss && isMoonRevealed(state, boss)) syncShownHp(state, boss);
  if (boss && boss.phaseTimer === MOON_REVEAL_TICKS) { // her mask breaks: the Lunar chime over a soft glass crack
    moon.unmask = { id: boss.id, ticks: MOON_UNMASK_TICKS };
    playRevealChime();
    playAudioOneShot('/sounds/frost-shield-break.mp3', .4 * ATTACK_SFX_VOLUME);
  }
  if (moon.unmask && --moon.unmask.ticks <= 0) moon.unmask = null;
  if (moon.markCooldown > 0 && --moon.markCooldown === 0) playUiSfx('markReady'); // the Mark is ready again
  if (moon.hint && --moon.hint.ticks <= 0) moon.hint = null;
  if (moon.mirrors.length && --moon.mirrorTimer <= 0) placeMoonMirrors(state); // they move every so often
  if (boss && moon.phase >= 2 && !state.noMobs && --moon.mimicTimer <= 0) { moon.mimicTimer = MOON_MIMIC_GAP; spawnMimic(state); }
  if (moon.mirrorFade > 0 && --moon.mirrorFade <= 0) moon.oldMirrors = [];
  if (moon.dark >= 0 && --moon.darkTimer <= 0) moveMoonDark(state);
  if (moon.darkFade > 0 && --moon.darkFade <= 0) moon.oldDark = -1;
  for (let i = moon.seen.length - 1; i >= 0; i--) if (--moon.seen[i].ticks <= 0) moon.seen.splice(i, 1);
  for (let i = moon.reflects.length - 1; i >= 0; i--) if (--moon.reflects[i].ticks <= 0) moon.reflects.splice(i, 1);
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
