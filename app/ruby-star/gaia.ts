import {
  CHAMBER_BOUNDS, ENEMY_CONFIGS, GAIA_BLOSSOM_GAP, GAIA_BLOSSOM_HEAL, GAIA_BLOSSOM_MAX, GAIA_BLOSSOM_SHOT_DAMAGE, GAIA_BLOSSOM_SHOT_GAP,
  GAIA_BLOSSOM_SHOT_RANGE, GAIA_CREEP_CAP, GAIA_CREEP_CHANCE, GAIA_CREEP_GAP, GAIA_LIFEBLOOM_GAP, GAIA_LIFEBLOOM_LIFE, GAIA_LIFEBLOOM_MAX,
  GAIA_MOSS_CHANCE, GAIA_P3_TWIN_OFFSET, GAIA_PHASE_HP, GAIA_POD_BURST_RADIUS, GAIA_POD_FUSE, GAIA_POD_GAP, GAIA_POLLEN_DRIFT_SLOW, GAIA_POLLEN_GAP,
  GAIA_POLLEN_LASER, GAIA_POLLEN_SLOW, GAIA_POLLEN_SLOW_TICKS, GAIA_POLLEN_TICKS, GAIA_RING_DAMAGE, GAIA_RING_RADIUS, GAIA_SCORCH_TICKS,
  GAIA_SEEK_RANGE, GAIA_SNARE_DAMAGE, GAIA_SNARE_GAP, GAIA_SNARE_ROOT, GAIA_SNARE_WARNING, GAIA_SPORE_RADIUS, GAIA_SPORE_SLOW, GAIA_SPORE_TICKS,
  GAIA_STONE_DRIFT_GAP, GAIA_STONE_DRIFT_STEP, GAIA_STONE_DRIFT_TICKS, GAIA_STONE_RELIGHT, GAIA_STONE_SELF_DAMAGE, GAIA_STONE_TRAVEL,
  GAIA_STRIKE_DAMAGE, GAIA_SUN_CHARGE_RATE, GAIA_SUN_MAX, GAIA_SUN_MIN, GAIA_SUN_RADIUS, GAIA_SUN_SELF_DAMAGE, GAIA_THICKET_ARMOR, GAIA_THICKET_DAMAGE,
  GAIA_THICKET_HEAL, GAIA_THICKET_SLOW, GAIA_TRAIL_GAP, GAIA_TRAIL_RADIUS, GAIA_VINE_HEAL, GAIA_VINE_SLOW, GAIA_WARD_RADIUS, GAIA_WITHER_TICKS,
  MAP_COLS, MAP_ROWS, SPECIAL_WEAVER_RADIUS, THORN_CONTACT_INTERVAL, TILE_SIZE, T_FLOOR, chamberOfTile, getThornFieldBounds, isBossType,
  type EnemyType,
} from './constants';
import {
  playUiSfx,
} from './ui-sfx';
import {
  ATTACK_SFX_VOLUME, bfs, clearThornHazards, createEncounterEnemy, damageEnemy, damagePlayer, damageRuby, godSpawnBoss, isFloorTile, killEnemy,
  playAudioOneShot, playCelestialSound, playSFX_objectBreak, playThornCut, tileEuclidDist, type Enemy, type GameState,
} from './engine';
import {
  isNeptuneObject, randomFloorTileAwayFromPlayer,
} from './neptune';

// Gaia challenge (Thorn Weaver): overgrowth, Sunfire, Sunstones, phases, plants and Gaia aliens.
// The core engine calls in through updateGaia and the exported helpers; this module uses engine helpers in turn.

export interface GaiaStone { x: number; y: number; fromX: number; fromY: number; lit: boolean; travel: number; relight: number; slide?: number } // slide: phase 3 drift animation
export interface GaiaState {
  phase: 1 | 2 | 3; bossId: number;
  growth: number[]; // per tile (y * MAP_COLS + x): 0 clean, 1 moss, 2 vines, 3 thicket
  scorch: number[]; // ticks before a scorched tile may regrow
  trailTimer: number; creepTimer: number; secondTimer: number;
  sunCharge: number;
  sunfire: { chamber: number; ticks: number } | null; // full-charge wind-up on a chamber
  sunImpact: { chamber: number; ticks: number } | null;
  sunBurst: { x: number; y: number; radius: number; ticks: number } | null; // partial-charge burst around you
  stones: GaiaStone[];
  stoneFlashes: { x: number; y: number; toX: number; toY: number; ticks: number }[]; // burn-away visuals, stone -> her
  podTimer: number; blossomTimer: number; lifebloomTimer: number;
  bolts: { fromX: number; fromY: number; toX: number; toY: number; ticks: number }[];
  pollenSlowTicks: number;
  snareTimer: number; snares: { tileX: number; tileY: number; ticks: number; ruby: boolean }[]; snaredTicks: number;
  rubyRootTicks: number; // visual: roots binding Ruby after a snare hits it
  wither: number; // >0 between phases
  ringClosure: number; // share of Ruby's ring covered by vines
  rubyThornTimer: number; // ticks until a placed Ruby inside his field is hurt again
  spores: { x: number; y: number; ticks: number }[];
  pollen: { chamber: number; ticks: number } | null; pollenTimer: number;
  phaseBannerTicks: number;
}



export function isGaiaObject(type: EnemyType) { return type === 'seed_pod' || type === 'blossom' || type === 'lifebloom'; }

export function createGaiaState(state: GameState): GaiaState {
  const gaia: GaiaState = {
    phase: 1, bossId: -1, growth: new Array(MAP_COLS * MAP_ROWS).fill(0), scorch: new Array(MAP_COLS * MAP_ROWS).fill(0),
    trailTimer: GAIA_TRAIL_GAP, creepTimer: GAIA_CREEP_GAP, secondTimer: 60,
    sunCharge: 0, sunfire: null, sunImpact: null, sunBurst: null, stones: [], stoneFlashes: [],
    podTimer: GAIA_POD_GAP[1], blossomTimer: GAIA_BLOSSOM_GAP, lifebloomTimer: GAIA_LIFEBLOOM_GAP[1], bolts: [], pollenSlowTicks: 0,
    snareTimer: GAIA_SNARE_GAP, snares: [], snaredTicks: 0, rubyRootTicks: 0, wither: 0,
    ringClosure: 0, rubyThornTimer: THORN_CONTACT_INTERVAL, spores: [], pollen: null, pollenTimer: GAIA_POLLEN_GAP, phaseBannerTicks: 0,
  };
  state.gaia = gaia;
  for (let room = 0; room < 4; room++) for (let i = 0; i < 2; i++) {
    const tile = gaiaStoneTile(state, room, -1);
    if (tile) gaia.stones.push({ x: tile[0], y: tile[1], fromX: tile[0], fromY: tile[1], lit: true, travel: 0, relight: 0 });
  }
  return gaia;
}

const gaiaIndex = (x: number, y: number) => y * MAP_COLS + x;
export function gaiaLevel(state: GameState, x: number, y: number) { return state.gaia?.growth[gaiaIndex(x, y)] ?? 0; }

function gaiaWarded(state: GameState, x: number, y: number) {
  return state.rubyTileX !== -1 && Math.max(Math.abs(x - state.rubyTileX), Math.abs(y - state.rubyTileY)) <= GAIA_WARD_RADIUS;
}
function inGaiaRootsField(state: GameState, x: number, y: number) {
  const field = state.celestialField; if (!field) return false;
  const cx = (x + .5) * TILE_SIZE, cy = (y + .5) * TILE_SIZE;
  return cx >= field.x - SPECIAL_WEAVER_RADIUS && cx < field.x + SPECIAL_WEAVER_RADIUS && cy >= field.y - SPECIAL_WEAVER_RADIUS && cy < field.y + SPECIAL_WEAVER_RADIUS;
}
// Walls and pads never grow; nor do scorched tiles, Ruby's ward, Sunstones or ground inside Gaia's Roots.
function gaiaCanGrow(state: GameState, x: number, y: number) {
  const gaia = state.gaia!;
  return state.map[y]?.[x] === T_FLOOR && gaia.scorch[gaiaIndex(x, y)] <= 0 && !gaiaWarded(state, x, y) &&
    !gaia.stones.some(s => s.x === x && s.y === y) && !inGaiaRootsField(state, x, y);
}
function gaiaGrow(state: GameState, x: number, y: number, max: number): boolean {
  const gaia = state.gaia!, i = gaiaIndex(x, y);
  if (gaia.growth[i] >= max || !gaiaCanGrow(state, x, y)) return false;
  gaia.growth[i]++; return true;
}
function gaiaSet(state: GameState, x: number, y: number, level: number) {
  const gaia = state.gaia!, i = gaiaIndex(x, y);
  if (gaia.growth[i] < level && gaiaCanGrow(state, x, y)) gaia.growth[i] = level;
}

// The player's attacks cut overgrowth back by `amount` levels; each level cut charges Sunfire.
// Scorching (meteors, Sunfire itself) does not charge it.
export function gaiaClearTile(state: GameState, x: number, y: number, amount = 1) {
  const gaia = state.gaia; if (!gaia || x < 0 || y < 0 || x >= MAP_COLS || y >= MAP_ROWS) return;
  const i = gaiaIndex(x, y), removed = Math.min(gaia.growth[i], amount);
  if (removed <= 0) return;
  gaia.growth[i] -= removed;
  if (!gaia.sunfire) addGaiaSunCharge(state, removed * GAIA_SUN_CHARGE_RATE);
}
export function addGaiaSunCharge(state: GameState, amount: number) {
  const gaia = state.gaia!, before = gaia.sunCharge;
  gaia.sunCharge = Math.min(GAIA_SUN_MAX, gaia.sunCharge + amount);
  if (before < GAIA_SUN_MAX && gaia.sunCharge >= GAIA_SUN_MAX) playStrikeCharged(); // full Sunfire is ready
}
// A room strike (Trident or full Sunfire) is ready: the sci-fi "acquired" cue over the bright chime.
export function playStrikeCharged() {
  playUiSfx('charged');
  try { const a = new Audio('/sounds/strike-charged.wav'); a.volume = .55; a.play().catch(() => {}); } catch { }
}
export function gaiaClearArea(state: GameState, cx: number, cy: number, radius: number) {
  if (!state.gaia) return;
  const r = Math.ceil(radius);
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++)
    if (tileEuclidDist(x, y, cx, cy) <= radius) gaiaClearTile(state, x, y, 3);
}
export function gaiaClearRootsField(state: GameState) {
  const field = state.celestialField; if (!state.gaia || !field) return;
  const r = Math.ceil(SPECIAL_WEAVER_RADIUS / TILE_SIZE), fx = Math.floor(field.x / TILE_SIZE), fy = Math.floor(field.y / TILE_SIZE);
  // It wipes its whole field clean and keeps it from regrowing while it lasts.
  for (let y = fy - r - 1; y <= fy + r; y++) for (let x = fx - r - 1; x <= fx + r; x++) if (inGaiaRootsField(state, x, y)) gaiaClearTile(state, x, y, 3);
}
export function gaiaScorchRoom(state: GameState, chamber: number) {
  const gaia = state.gaia; if (!gaia) return;
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamber];
  for (let y = r1; y <= r2; y++) for (let x = c1; x <= c2; x++) {
    if (state.map[y]?.[x] !== T_FLOOR) continue;
    gaia.growth[gaiaIndex(x, y)] = 0; gaia.scorch[gaiaIndex(x, y)] = GAIA_SCORCH_TICKS;
  }
}

// Share of a room's floor at vines or thicker.
export function gaiaRoomShare(state: GameState, chamber: number) {
  const gaia = state.gaia; if (!gaia) return 0;
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamber];
  let floor = 0, grown = 0;
  for (let y = r1; y <= r2; y++) for (let x = c1; x <= c2; x++) {
    if (state.map[y]?.[x] !== T_FLOOR) continue;
    floor++; if (gaia.growth[gaiaIndex(x, y)] >= 2) grown++;
  }
  return floor ? grown / floor : 0;
}
export function gaiaPhaseFloor(gaia: GaiaState) { return (3 - gaia.phase) * GAIA_PHASE_HP; }
function gaiaPhaseCeil(gaia: GaiaState) { return (4 - gaia.phase) * GAIA_PHASE_HP; }
export function gaiaBoss(state: GameState) { const gaia = state.gaia; return gaia ? state.enemies.find(b => b.id === gaia.bossId && b.hp > 0) : undefined; }
function healGaia(state: GameState, boss: Enemy, amount: number) {
  if (amount <= 0) return;
  const before = boss.hp;
  boss.hp = Math.min(gaiaPhaseCeil(state.gaia!), boss.hp + amount);
  if (boss.hp > before) boss.healFlashTicks = Math.max(boss.healFlashTicks, 12);
}
// Damage multiplier on the Weaver herself: withering takes nothing, thicket armors her.
export function gaiaBossDamageMult(state: GameState, e: Enemy) {
  const gaia = state.gaia!;
  if (gaia.wither > 0) return 0;
  return gaiaLevel(state, e.tileX, e.tileY) >= 3 ? GAIA_THICKET_ARMOR : 1;
}
// Meteors and Sunfire: a share of the current phase that ignores her armor and thicket (still never past a phase end).
// Nothing lands while she is withering between phases.
export function gaiaStrikeDamage(state: GameState, boss: Enemy, share: number) {
  const gaia = state.gaia!;
  if (gaia.wither > 0) return;
  gaiaSelfDamage(state, boss, share);
}
// Self-damage from her own mistakes (Sunstones, uprooting) skips her armor.
export function gaiaSelfDamage(state: GameState, boss: Enemy, share: number) {
  const gaia = state.gaia!;
  boss.hp = Math.max(gaia.phase === 3 ? 0 : gaiaPhaseFloor(gaia) + .01, boss.hp - share * GAIA_PHASE_HP); // phase 3 can kill
  boss.flashTicks = 12;
}

// A lit Sunstone tile in a room: interior floor, not beside a wall or pad, away from other stones and the player.
function gaiaStoneTile(state: GameState, room: number, ignore: number): [number, number] | null {
  const gaia = state.gaia!, [r1, c1, r2, c2] = CHAMBER_BOUNDS[room], tiles: [number, number][] = [];
  for (let y = r1 + 2; y <= r2 - 2; y++) for (let x = c1 + 2; x <= c2 - 2; x++) {
    let open = true;
    for (let dy = -1; dy <= 1 && open; dy++) for (let dx = -1; dx <= 1; dx++) if (state.map[y + dy]?.[x + dx] !== T_FLOOR) { open = false; break; }
    if (!open || tileEuclidDist(x, y, state.playerTileX, state.playerTileY) < 4) continue;
    if (gaia.stones.some((s, i) => i !== ignore && tileEuclidDist(s.x, s.y, x, y) < 3)) continue;
    tiles.push([x, y]);
  }
  return tiles.length ? tiles[Math.floor(Math.random() * tiles.length)] : null;
}
// A used stone shatters and flies to a different room, lighting up shortly after it lands.
function moveGaiaStone(state: GameState, index: number, room?: number) {
  const gaia = state.gaia!, stone = gaia.stones[index], from = chamberOfTile(stone.x, stone.y);
  const rooms = room !== undefined ? [room] : [0, 1, 2, 3].filter(r => r !== from).sort(() => Math.random() - .5);
  for (const r of rooms) {
    const tile = gaiaStoneTile(state, r, index); if (!tile) continue;
    stone.fromX = stone.x; stone.fromY = stone.y; [stone.x, stone.y] = tile;
    stone.lit = false; stone.travel = GAIA_STONE_TRAVEL; stone.relight = GAIA_STONE_RELIGHT; stone.slide = 0;
    gaia.growth[gaiaIndex(tile[0], tile[1])] = 0;
    return;
  }
}
function burnAtStone(state: GameState, boss: Enemy, index: number, share: number) {
  const gaia = state.gaia!, stone = gaia.stones[index];
  gaia.stoneFlashes.push({ x: stone.x, y: stone.y, toX: boss.tileX, toY: boss.tileY, ticks: 30 });
  gaiaSelfDamage(state, boss, share);
  moveGaiaStone(state, index);
  playSFX_objectBreak('frost'); playCelestialSound('fiery_king', .6);
}
// Phase 3 twin cast: a second field one field-width from you toward your nearest lit Sunstone, blocking the way
// there. Skipped if it would cover a stone (that would only hand you a free burn) or land in a wall.
export function gaiaTwinFieldAim(state: GameState): { x: number; y: number } | null {
  const gaia = state.gaia!;
  const stones = gaia.stones.filter(s => s.lit && s.travel === 0)
    .sort((a, b) => tileEuclidDist(a.x, a.y, state.playerTileX, state.playerTileY) - tileEuclidDist(b.x, b.y, state.playerTileX, state.playerTileY));
  const stone = stones[0]; if (!stone) return null;
  const dx = stone.x - state.playerTileX, dy = stone.y - state.playerTileY;
  const [ux, uy] = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dy) || 1];
  const tx = state.playerTileX + ux * GAIA_P3_TWIN_OFFSET, ty = state.playerTileY + uy * GAIA_P3_TWIN_OFFSET;
  if (!isFloorTile(state.map, tx, ty)) return null;
  const b = getThornFieldBounds((tx + .5) * TILE_SIZE, (ty + .5) * TILE_SIZE);
  if (gaia.stones.some(s => s.lit && (s.x + .5) * TILE_SIZE >= b.left && (s.x + .5) * TILE_SIZE < b.right && (s.y + .5) * TILE_SIZE >= b.top && (s.y + .5) * TILE_SIZE < b.bottom)) return null;
  return { x: b.x, y: b.y };
}

// Phase 3: each lit stone hops GAIA_STONE_DRIFT_STEP tiles in a random direction, staying on open floor in its room
// (another direction is tried if cover blocks the way).
function driftGaiaStones(state: GameState) {
  const gaia = state.gaia!;
  for (const stone of gaia.stones) {
    if (!stone.lit || stone.travel > 0) continue;
    const room = chamberOfTile(stone.x, stone.y);
    const fits = (nx: number, ny: number) => {
      if (chamberOfTile(nx, ny) !== room || gaia.stones.some(o => o !== stone && o.x === nx && o.y === ny)) return false;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (state.map[ny + oy]?.[nx + ox] !== T_FLOOR) return false;
      return true;
    };
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - .5);
    const dir = dirs.find(([dx, dy]) => { for (let k = 1; k <= GAIA_STONE_DRIFT_STEP; k++) if (!fits(stone.x + dx * k, stone.y + dy * k)) return false; return true; });
    if (!dir) continue;
    const nx = stone.x + dir[0] * GAIA_STONE_DRIFT_STEP, ny = stone.y + dir[1] * GAIA_STONE_DRIFT_STEP;
    stone.fromX = stone.x; stone.fromY = stone.y; stone.x = nx; stone.y = ny; stone.slide = GAIA_STONE_DRIFT_TICKS;
    gaia.growth[gaiaIndex(nx, ny)] = 0;
  }
}

// Her thorn field lands on a lit Sunstone: the field burns away harmlessly and she takes self-damage.
export function gaiaStoneBlocksField(state: GameState, e: Enemy, x: number, y: number, radius: number): boolean {
  const gaia = state.gaia; if (!gaia || e.id !== gaia.bossId) return false;
  const b = getThornFieldBounds(x, y, radius);
  const index = gaia.stones.findIndex(s => s.lit && (s.x + .5) * TILE_SIZE >= b.left && (s.x + .5) * TILE_SIZE < b.right && (s.y + .5) * TILE_SIZE >= b.top && (s.y + .5) * TILE_SIZE < b.bottom);
  if (index < 0) return false;
  burnAtStone(state, e, index, GAIA_STONE_SELF_DAMAGE);
  e.shootTicks = 14;
  return true;
}

export function gaiaPlayerSpeed(state: GameState) {
  const gaia = state.gaia; if (!gaia) return 1;
  const level = gaiaLevel(state, state.playerTileX, state.playerTileY);
  let mult = level >= 3 ? GAIA_THICKET_SLOW : level === 2 ? GAIA_VINE_SLOW : 1;
  if (gaia.pollenSlowTicks > 0) mult *= GAIA_POLLEN_SLOW;
  if (gaia.pollen && chamberOfTile(state.playerTileX, state.playerTileY) === gaia.pollen.chamber) mult *= GAIA_POLLEN_DRIFT_SLOW; // walking through the haze
  if (gaia.spores.some(c => tileEuclidDist(c.x, c.y, state.playerTileX, state.playerTileY) <= GAIA_SPORE_RADIUS)) mult *= GAIA_SPORE_SLOW;
  return mult;
}
export function gaiaLaserRangeMult(state: GameState) {
  const pollen = state.gaia?.pollen;
  return pollen && chamberOfTile(state.playerTileX, state.playerTileY) === pollen.chamber ? GAIA_POLLEN_LASER : 1;
}

export function initializeGaiaBoss(state: GameState, boss: Enemy) {
  const gaia = state.gaia!;
  boss.hp = boss.maxHp = GAIA_PHASE_HP * 3;
  gaia.bossId = boss.id; gaia.phase = 1;
}

function spawnGaiaObject(state: GameState, type: EnemyType, x: number, y: number) {
  const object = createEncounterEnemy(state, type, x, y, ENEMY_CONFIGS[type].maxHp);
  object.attackTimer = type === 'blossom' ? GAIA_BLOSSOM_SHOT_GAP : 100000; object.visualSpawnTicks = 20;
  state.enemies.push(object);
  return object;
}

export function gaiaSporeCloud(state: GameState, victim: Enemy) {
  const gaia = state.gaia; if (!gaia) return;
  gaia.spores.push({ x: victim.tileX, y: victim.tileY, ticks: GAIA_SPORE_TICKS });
  for (let y = victim.tileY - GAIA_SPORE_RADIUS; y <= victim.tileY + GAIA_SPORE_RADIUS; y++)
    for (let x = victim.tileX - GAIA_SPORE_RADIUS; x <= victim.tileX + GAIA_SPORE_RADIUS; x++)
      if (tileEuclidDist(x, y, victim.tileX, victim.tileY) <= GAIA_SPORE_RADIUS) gaiaSet(state, x, y, 1);
}

// Gaia alien mix: 40% Ragecaps, 30% each sporelings and vine crawlers.
export function gaiaAlienType(): EnemyType {
  const roll = Math.random();
  return roll < .4 ? 'angry_mushroom' : roll < .7 ? 'sporeling' : 'vine_crawler';
}

// Not fleeing: the best overgrown tile within reach (thicket counts as 2 tiles closer), or null if none.
export function gaiaSeekPath(state: GameState, e: Enemy): [number, number][] | null {
  const gaia = state.gaia!, r = GAIA_SEEK_RANGE, spots: { x: number; y: number; score: number }[] = [];
  for (let y = e.targetTileY - r; y <= e.targetTileY + r; y++) for (let x = e.targetTileX - r; x <= e.targetTileX + r; x++) {
    if (x < 0 || y < 0 || x >= MAP_COLS || y >= MAP_ROWS) continue;
    const level = gaia.growth[gaiaIndex(x, y)], distance = tileEuclidDist(x, y, e.targetTileX, e.targetTileY);
    if (level >= 2 && distance <= r) spots.push({ x, y, score: distance - (level >= 3 ? 2 : 0) });
  }
  spots.sort((a, b) => a.score - b.score);
  for (const spot of spots.slice(0, 6)) { const path = bfs(state.map, e.targetTileX, e.targetTileY, spot.x, spot.y); if (path.length > 0) return path; }
  return null;
}

function advanceGaiaPhase(state: GameState, boss: Enemy) {
  const gaia = state.gaia!;
  gaia.phase = (gaia.phase + 1) as 2 | 3;
  gaia.podTimer = GAIA_POD_GAP[gaia.phase] || 0; gaia.blossomTimer = GAIA_BLOSSOM_GAP; gaia.snareTimer = GAIA_SNARE_GAP;
  boss.hp = Math.min(boss.hp, gaiaPhaseCeil(gaia) - .01); boss.healFlashTicks = 30;
  state.bossSpawnName = `PHASE ${gaia.phase}`; state.bossSpawnColor = ENEMY_CONFIGS.thorn_weaver.color; state.bossSpawnTicks = 150;
  gaia.phaseBannerTicks = 180;
  playCelestialSound('ready');
}

// God panel: jump straight to a phase at full phase HP (summoning her first if she has not arrived).
export function godSetGaiaPhase(state: GameState, phase: 1 | 2 | 3) {
  const gaia = state.gaia;
  if (!gaia || state.gamePhase !== 'playing') return;
  let boss = gaiaBoss(state);
  if (!boss) { godSpawnBoss(state, 'thorn_weaver'); boss = gaiaBoss(state); }
  if (!boss) return;
  state.enemies = state.enemies.filter(e => !isGaiaObject(e.type));
  gaia.phase = phase; gaia.wither = 0; gaia.snares = [];
  gaia.podTimer = GAIA_POD_GAP[phase] || 0; gaia.blossomTimer = GAIA_BLOSSOM_GAP; gaia.snareTimer = GAIA_SNARE_GAP;
  boss.hp = gaiaPhaseCeil(gaia) - .01; boss.healFlashTicks = 30;
  state.bossSpawnName = 'PHASE ' + phase; state.bossSpawnColor = ENEMY_CONFIGS.thorn_weaver.color; state.bossSpawnTicks = 120;
}

function updateGaiaGrowth(state: GameState, boss: Enemy | undefined) {
  const gaia = state.gaia!;
  for (let i = 0; i < gaia.scorch.length; i++) if (gaia.scorch[i] > 0) gaia.scorch[i]--;
  // Her trail: tiles around her grow, up to vines.
  if (boss && gaia.wither === 0 && --gaia.trailTimer <= 0) {
    gaia.trailTimer = GAIA_TRAIL_GAP;
    const radius = GAIA_TRAIL_RADIUS;
    for (let y = boss.tileY - radius; y <= boss.tileY + radius; y++) for (let x = boss.tileX - radius; x <= boss.tileX + radius; x++)
      if (tileEuclidDist(x, y, boss.tileX, boss.tileY) <= radius) gaiaGrow(state, x, y, 2);
  }
  // Creep: vines spread moss into clean neighbours, and moss beside vines thickens.
  if (--gaia.creepTimer <= 0) {
    gaia.creepTimer = GAIA_CREEP_GAP;
    let budget = GAIA_CREEP_CAP;
    const start = Math.floor(Math.random() * gaia.growth.length);
    for (let n = 0; n < gaia.growth.length && budget > 0; n++) {
      const i = (start + n) % gaia.growth.length;
      if (gaia.growth[i] < 2 || Math.random() >= GAIA_CREEP_CHANCE) continue;
      const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
      const x = i % MAP_COLS + dx, y = Math.floor(i / MAP_COLS) + dy;
      if (x < 0 || y < 0 || x >= MAP_COLS || y >= MAP_ROWS) continue;
      const level = gaiaLevel(state, x, y);
      if (level === 0 ? gaiaGrow(state, x, y, 1) : level === 1 && Math.random() < GAIA_MOSS_CHANCE / GAIA_CREEP_CHANCE ? gaiaGrow(state, x, y, 2) : false) budget--;
    }
  }
  // Vine crawlers and Ragecaps thicken the ground they walk on.
  if (state.gameTick % 30 === 0) for (const crawler of state.enemies) if ((crawler.type === 'vine_crawler' || crawler.type === 'angry_mushroom') && crawler.hp > 0) gaiaGrow(state, crawler.tileX, crawler.tileY, 2);
}

// Placed Ruby keeps its ward clean and pushes moss back; a closed ring of vines around it squeezes Ruby.
function updateGaiaRuby(state: GameState, second: boolean) {
  const gaia = state.gaia!;
  if (state.rubyTileX === -1) { gaia.ringClosure = 0; return; }
  const rx = state.rubyTileX, ry = state.rubyTileY;
  for (let y = ry - GAIA_WARD_RADIUS; y <= ry + GAIA_WARD_RADIUS; y++) for (let x = rx - GAIA_WARD_RADIUS; x <= rx + GAIA_WARD_RADIUS; x++)
    if (x >= 0 && y >= 0 && x < MAP_COLS && y < MAP_ROWS) gaia.growth[gaiaIndex(x, y)] = 0;
  let ring = 0, grown = 0;
  for (let y = ry - GAIA_RING_RADIUS; y <= ry + GAIA_RING_RADIUS; y++) for (let x = rx - GAIA_RING_RADIUS; x <= rx + GAIA_RING_RADIUS; x++) {
    if (Math.max(Math.abs(x - rx), Math.abs(y - ry)) !== GAIA_RING_RADIUS || state.map[y]?.[x] !== T_FLOOR) continue;
    ring++; if (gaiaLevel(state, x, y) >= 2) grown++;
  }
  gaia.ringClosure = ring ? grown / ring : 0;
  if (second && gaia.ringClosure >= 1) damageRuby(state, GAIA_RING_DAMAGE);
}

function updateGaiaStones(state: GameState) {
  const gaia = state.gaia!;
  if (gaia.phase === 3 && gaia.wither === 0 && state.gameTick % GAIA_STONE_DRIFT_GAP === 0) driftGaiaStones(state);
  for (const stone of gaia.stones) {
    if (stone.slide) stone.slide--;
    if (stone.travel > 0) { stone.travel--; continue; }
    if (!stone.lit && --stone.relight <= 0) stone.lit = true;
  }
  gaia.stoneFlashes = gaia.stoneFlashes.filter(f => --f.ticks > 0);
}

function updateGaiaPlants(state: GameState, boss: Enemy | undefined, second: boolean) {
  const gaia = state.gaia!;
  // Seed pods swell and burst into thicket unless broken first.
  for (const pod of state.enemies.filter(p => p.type === 'seed_pod' && p.hp > 0)) {
    if (--pod.windupTicks > 0) continue;
    for (let y = pod.tileY - GAIA_POD_BURST_RADIUS; y <= pod.tileY + GAIA_POD_BURST_RADIUS; y++)
      for (let x = pod.tileX - GAIA_POD_BURST_RADIUS; x <= pod.tileX + GAIA_POD_BURST_RADIUS; x++)
        if (tileEuclidDist(x, y, pod.tileX, pod.tileY) <= GAIA_POD_BURST_RADIUS) gaiaSet(state, x, y, 3);
    state.enemies.splice(state.enemies.indexOf(pod), 1);
    try { const sound = new Audio('/sounds/place-plant.mp3'); sound.volume = .5 * ATTACK_SFX_VOLUME; sound.play().catch(() => {}); } catch { }
  }
  const active = boss && gaia.wither === 0;
  if (active && GAIA_POD_GAP[gaia.phase] && --gaia.podTimer <= 0) {
    gaia.podTimer = GAIA_POD_GAP[gaia.phase];
    const tile = randomFloorTileAwayFromPlayer(state, 5);
    if (tile) spawnGaiaObject(state, 'seed_pod', tile[0], tile[1]).windupTicks = GAIA_POD_FUSE;
  }
  const blossoms = state.enemies.filter(b => b.type === 'blossom' && b.hp > 0);
  // Phase 2+: blossom turrets planted on overgrowth near her.
  if (active && boss && gaia.phase >= 2 && --gaia.blossomTimer <= 0) {
    gaia.blossomTimer = GAIA_BLOSSOM_GAP;
    // At the cap, the oldest blossom withers to make room for the new one.
    if (blossoms.length >= GAIA_BLOSSOM_MAX) {
      const oldest = blossoms.reduce((a, b) => (a.id < b.id ? a : b));
      killEnemy(state, state.enemies.indexOf(oldest)); blossoms.splice(blossoms.indexOf(oldest), 1);
    }
    {
      const spots: [number, number][] = [];
      for (let y = boss.tileY - 4; y <= boss.tileY + 4; y++) for (let x = boss.tileX - 4; x <= boss.tileX + 4; x++) {
        if (state.map[y]?.[x] !== T_FLOOR || (x === boss.tileX && y === boss.tileY) || state.enemies.some(e => e.tileX === x && e.tileY === y)) continue;
        if (gaia.stones.some(s => tileEuclidDist(s.x, s.y, x, y) <= 2) || gaiaWarded(state, x, y)) continue;
        spots.push([x, y]);
      }
      const grown = spots.filter(([x, y]) => gaiaLevel(state, x, y) >= 2), pick = (grown.length ? grown : spots)[Math.floor(Math.random() * (grown.length || spots.length))];
      if (pick) { gaiaSet(state, pick[0], pick[1], 2); spawnGaiaObject(state, 'blossom', pick[0], pick[1]); }
    }
  }
  for (const blossom of blossoms) {
    if (boss && second) healGaia(state, boss, GAIA_BLOSSOM_HEAL * GAIA_PHASE_HP);
    if (second && gaiaLevel(state, blossom.tileX, blossom.tileY) < 2) { // wilts on cleared ground
      damageEnemy(state, blossom, 2, 'enemy');
      if (blossom.hp <= 0) { killEnemy(state, state.enemies.indexOf(blossom)); continue; }
    }
    if (--blossom.attackTimer <= 0) {
      blossom.attackTimer = GAIA_BLOSSOM_SHOT_GAP;
      if (tileEuclidDist(blossom.tileX, blossom.tileY, state.playerTileX, state.playerTileY) <= GAIA_BLOSSOM_SHOT_RANGE) {
        gaia.bolts.push({ fromX: blossom.x, fromY: blossom.y, toX: state.playerX, toY: state.playerY, ticks: 16 });
        damagePlayer(state, GAIA_BLOSSOM_SHOT_DAMAGE, blossom); gaia.pollenSlowTicks = GAIA_POLLEN_SLOW_TICKS;
        blossom.shootTicks = 12;
      }
    }
  }
  gaia.bolts = gaia.bolts.filter(b => --b.ticks > 0);
  // Help: lifeblooms sprout on random tiles (rare early, more often later); break one to heal you and Ruby. Unbroken ones fade.
  for (const bloom of state.enemies.filter(b => b.type === 'lifebloom' && b.hp > 0)) if (--bloom.windupTicks <= 0) state.enemies.splice(state.enemies.indexOf(bloom), 1);
  if (active && --gaia.lifebloomTimer <= 0) {
    gaia.lifebloomTimer = GAIA_LIFEBLOOM_GAP[gaia.phase];
    const tile = state.enemies.filter(b => b.type === 'lifebloom').length < GAIA_LIFEBLOOM_MAX[gaia.phase] && randomFloorTileAwayFromPlayer(state, 4);
    if (tile) spawnGaiaObject(state, 'lifebloom', tile[0], tile[1]).windupTicks = GAIA_LIFEBLOOM_LIFE;
  }
  // Phase 2+: root snares crack under you, then erupt.
  if (active && gaia.phase >= 2 && --gaia.snareTimer <= 0) {
    gaia.snareTimer = GAIA_SNARE_GAP;
    gaia.snares.push({ tileX: state.playerTileX, tileY: state.playerTileY, ticks: GAIA_SNARE_WARNING, ruby: false }); // roots only target you
  }
  for (const snare of gaia.snares) {
    if (--snare.ticks > 0) continue;
    if (snare.ruby) { if (state.rubyTileX === snare.tileX && state.rubyTileY === snare.tileY) { damageRuby(state, GAIA_SNARE_DAMAGE, boss); gaia.rubyRootTicks = GAIA_SNARE_ROOT; } }
    else if (state.playerTileX === snare.tileX && state.playerTileY === snare.tileY) {
      damagePlayer(state, GAIA_SNARE_DAMAGE, boss); gaia.snaredTicks = GAIA_SNARE_ROOT; playThornCut();
    }
  }
  gaia.snares = gaia.snares.filter(s => s.ticks > 0);
}

function updateGaiaBoss(state: GameState, boss: Enemy, second: boolean) {
  const gaia = state.gaia!;
  boss.hp = Math.min(boss.hp, gaiaPhaseCeil(gaia));
  // Between phases she withers into the soil, then returns in the next phase.
  if (gaia.wither > 0) {
    if (--gaia.wither === 0) advanceGaiaPhase(state, boss);
    return;
  }
  if (gaia.phase < 3 && boss.hp <= gaiaPhaseFloor(gaia) + .02) { // phase 3 simply ends when her HP runs out
    gaia.wither = GAIA_WITHER_TICKS; gaia.snares = [];
    for (const plant of state.enemies.filter(e => e.type === 'blossom')) killEnemy(state, state.enemies.indexOf(plant));
    clearThornHazards(state);
    playCelestialSound('empty');
    return;
  }
  // Healing from overgrowth under her.
  if (second) {
    const level = gaiaLevel(state, boss.tileX, boss.tileY);
    healGaia(state, boss, (level >= 3 ? GAIA_THICKET_HEAL : level === 2 ? GAIA_VINE_HEAL : 0) * GAIA_PHASE_HP);
  }
}

// Sunfire at full charge: after its wind-up it burns the whole chamber. You and Ruby are burned if still inside;
// she takes a big share of the phase if she is there, and her plants and aliens in the chamber burn.
function gaiaSunStrike(state: GameState, chamber: number) {
  const gaia = state.gaia!;
  gaia.sunImpact = { chamber, ticks: 60 };
  gaiaScorchRoom(state, chamber);
  // Like the Trident it can be dodged: only you and Ruby inside the burning room are hurt.
  if (chamberOfTile(state.playerTileX, state.playerTileY) === chamber) damagePlayer(state, GAIA_SUN_SELF_DAMAGE);
  if (state.rubyTileX !== -1 && chamberOfTile(state.rubyTileX, state.rubyTileY) === chamber) damageRuby(state, GAIA_SUN_SELF_DAMAGE);
  playSunfireBlast(1, true);
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 26); state.screenShakeAmt = Math.max(state.screenShakeAmt, 12);
  for (const target of [...state.enemies].reverse()) {
    if (!state.enemies.includes(target) || chamberOfTile(target.tileX, target.tileY) !== chamber) continue;
    if (target.id === gaia.bossId) gaiaStrikeDamage(state, target, GAIA_STRIKE_DAMAGE);
    else if (!isBossType(target.type)) { damageEnemy(state, target, target.hp + 1, 'meteor'); const i = state.enemies.indexOf(target); if (i >= 0) killEnemy(state, i, true); }
  }
  // It also draws a Sunstone into the struck room if the room has fewer than two.
  const inRoom = gaia.stones.filter(s => chamberOfTile(s.x, s.y) === chamber).length;
  if (inRoom < 2) {
    const index = gaia.stones.findIndex(s => chamberOfTile(s.x, s.y) !== chamber);
    if (index >= 0) moveGaiaStone(state, index, chamber);
  }
}

export function updateGaia(state: GameState) {
  const gaia = state.gaia!;
  state.ambientEvents.timer = Math.max(state.ambientEvents.timer, 3600); // no space events on this world
  const second = --gaia.secondTimer <= 0;
  if (second) gaia.secondTimer = 60;
  const boss = gaiaBoss(state);
  if (gaia.snaredTicks > 0) gaia.snaredTicks--;
  if (gaia.rubyRootTicks > 0) gaia.rubyRootTicks--;
  if (gaia.pollenSlowTicks > 0) gaia.pollenSlowTicks--;
  if (gaia.phaseBannerTicks > 0) gaia.phaseBannerTicks--;
  gaia.spores = gaia.spores.filter(c => --c.ticks > 0);
  if (gaia.pollen && --gaia.pollen.ticks <= 0) gaia.pollen = null;
  if (!gaia.pollen && --gaia.pollenTimer <= 0) { gaia.pollenTimer = GAIA_POLLEN_GAP; gaia.pollen = { chamber: Math.floor(Math.random() * 4), ticks: GAIA_POLLEN_TICKS }; }
  if (gaia.sunfire && --gaia.sunfire.ticks <= 0) { gaiaSunStrike(state, gaia.sunfire.chamber); gaia.sunfire = null; }
  if (gaia.sunImpact && --gaia.sunImpact.ticks <= 0) gaia.sunImpact = null;
  if (gaia.sunBurst && --gaia.sunBurst.ticks <= 0) gaia.sunBurst = null;
  // Thicket thorns hurt while you stand in them.
  if (second && gaiaLevel(state, state.playerTileX, state.playerTileY) >= 3) damagePlayer(state, GAIA_THICKET_DAMAGE);
  updateGaiaGrowth(state, boss);
  updateGaiaRuby(state, second);
  updateGaiaStones(state);
  updateGaiaPlants(state, boss, second);
  if (boss) updateGaiaBoss(state, boss, second);
}

// C fires Sunfire with whatever is charged. Below full it bursts around you at once; at full it opens the room
// picker and the chosen room winds up (cancelling keeps the charge). Returns false when there is not enough charge or a full strike is already winding up.
export function useSunfire(state: GameState): boolean {
  const gaia = state.gaia;
  if (!gaia || state.gamePhase !== 'playing' || gaia.sunfire || gaia.sunCharge < GAIA_SUN_MIN) return false;
  const charge = gaia.sunCharge;
  if (charge >= GAIA_SUN_MAX) { // full: pick a room on the minimap (the same picker as Neptune's Trident)
    state.gamePhase = 'laserTarget'; state.playerQueuedDirX = state.playerQueuedDirY = 0;
    return true;
  }
  gaia.sunCharge = 0;
  const t = (charge - GAIA_SUN_MIN) / (GAIA_SUN_MAX - GAIA_SUN_MIN);
  const radius = GAIA_SUN_RADIUS[0] + (GAIA_SUN_RADIUS[1] - GAIA_SUN_RADIUS[0]) * t, px = state.playerTileX, py = state.playerTileY;
  gaia.sunBurst = { x: state.playerX, y: state.playerY, radius, ticks: 36 };
  const r = Math.ceil(radius);
  for (let y = py - r; y <= py + r; y++) for (let x = px - r; x <= px + r; x++) {
    if (tileEuclidDist(x, y, px, py) > radius || state.map[y]?.[x] !== T_FLOOR) continue;
    gaia.growth[gaiaIndex(x, y)] = 0; gaia.scorch[gaiaIndex(x, y)] = GAIA_SCORCH_TICKS;
  }
  for (const target of [...state.enemies].reverse()) {
    if (!state.enemies.includes(target) || tileEuclidDist(target.tileX, target.tileY, px, py) > radius) continue;
    if (target.id === gaia.bossId) gaiaStrikeDamage(state, target, GAIA_STRIKE_DAMAGE * charge / GAIA_SUN_MAX);
    else if (!isBossType(target.type)) { damageEnemy(state, target, target.hp + 1, 'meteor'); const i = state.enemies.indexOf(target); if (i >= 0) killEnemy(state, i, true); }
  }
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 10); state.screenShakeAmt = Math.max(state.screenShakeAmt, 4 + 4 * t);
  playSunfireBlast(t, false);
  return true;
}

// Sunfire's blast: the solar flare layered with a sci-fi explosion, louder and heavier as the charge grows;
// a full chamber burn adds a bomb boom underneath.
function playSunfireBlast(power: number, full: boolean) {
  playCelestialSound('fiery_king', 1 + .6 * power);
  playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', Math.min(1, .45 + .5 * power));
  if (full) playAudioOneShot('/sounds/bombExplode.wav', .9);
}
