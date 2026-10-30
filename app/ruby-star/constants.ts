// ─── Map ─────────────────────────────────────────────────────────────────────

export const TILE_SIZE = 48;
export const MAP_COLS = 51;
export const MAP_ROWS = 51;

// Tile types
export const T_WALL = 0;
export const T_FLOOR = 1;
export const T_TELEPORT = 2;

// Chamber indices
export const CH_ALPHA = 0; // top-left
export const CH_BETA = 1; // top-right
export const CH_GAMMA = 3; // bottom-right
export const CH_DELTA = 2; // bottom-left

// Chamber boundaries [row1, col1, row2, col2] inclusive (outer walls)
export const CHAMBER_BOUNDS = [
  [1, 1, 20, 20],   // ALPHA (TL)
  [1, 30, 20, 49],  // BETA  (TR)
  [30, 1, 49, 20],  // DELTA (BL)
  [30, 30, 49, 49], // GAMMA (BR)
] as const;

export const CHAMBER_LABELS = ['ALPHA', 'BETA', 'DELTA', 'GAMMA'];
export const CHAMBER_COLORS = ['#00d4ff', '#ff6b6b', '#00ff88', '#ffaa00'];

// Teleport pads (tileX=col, tileY=row)
export const TELEPORT_PADS: readonly [number, number][] = [
  [10, 10], // ALPHA
  [39, 10], // BETA
  [10, 39], // DELTA
  [39, 39], // GAMMA
];

// Player starting tile
export const PLAYER_START: [number, number] = [10, 10]; // [tileX, tileY] in ALPHA

// Spawn points per chamber — floor tiles on perimeter (excluding hallway openings)
// Hallway openings: TL right col=20 rows 9-11, TL bottom row=20 cols 9-11
//                  TR left  col=30 rows 9-11, TR bottom row=20 cols 38-40
//                  BL right col=20 rows 38-40, BL top row=30 cols 9-11
//                  BR left  col=30 rows 38-40, BR top row=30 cols 38-40
export const CHAMBER_SPAWN_TILES: readonly (readonly [number, number][])[] = [
  // ALPHA - interior rows 2-19, cols 2-19
  [[2, 2], [10, 2], [18, 2], [2, 10], [2, 18], [19, 5], [19, 15], [7, 19], [15, 19]],
  // BETA - interior rows 2-19, cols 31-48
  [[31, 2], [39, 2], [47, 2], [31, 7], [31, 15], [47, 10], [35, 19], [46, 19]],
  // DELTA - interior rows 31-48, cols 2-19
  [[7, 31], [15, 31], [2, 31], [2, 39], [2, 47], [19, 32], [19, 45], [7, 48], [15, 48]],
  // GAMMA - interior rows 31-48, cols 31-48
  [[35, 31], [46, 31], [31, 35], [31, 45], [47, 39], [48, 46], [35, 48], [46, 48]],
];

// ─── Map generator ────────────────────────────────────────────────────────────

export function generateMap(): number[][] {
  const map: number[][] = Array.from({ length: MAP_ROWS }, () =>
    new Array(MAP_COLS).fill(T_WALL),
  );

  function fillFloor(r1: number, c1: number, r2: number, c2: number) {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        map[r][c] = T_FLOOR;
  }

  // Chamber interiors (1-tile wall border → interior starts at +1)
  fillFloor(2, 2, 19, 19);   // ALPHA
  fillFloor(2, 31, 19, 48);  // BETA
  fillFloor(31, 2, 48, 19);  // DELTA
  fillFloor(31, 31, 48, 48); // GAMMA

  // Hallways (3 tiles wide)
  fillFloor(9, 20, 11, 30);   // top horizontal  (ALPHA <-> BETA)
  fillFloor(38, 20, 40, 30);  // bottom horizontal (DELTA <-> GAMMA)
  fillFloor(20, 9, 30, 11);   // left vertical   (ALPHA <-> DELTA)
  fillFloor(20, 38, 30, 40);  // right vertical  (BETA  <-> GAMMA)

  // Teleport pads
  for (const [tx, ty] of TELEPORT_PADS) map[ty][tx] = T_TELEPORT;

  // Scatter wall cover inside chambers (2×2 blocks in corners, a few singles mid-chamber)
  const coverWalls: [number, number][] = [
    // ALPHA (interior rows 2-19, cols 2-19; teleport at col 10, row 10)
    [3, 3], [4, 3], [3, 4], [4, 4],     // upper-left
    [3, 17], [4, 17], [3, 16], [4, 16], // upper-right
    [16, 3], [17, 3], [16, 4], [17, 4], // lower-left
    [16, 17], [17, 17], [16, 16], [17, 16], // lower-right
    [7, 14], [13, 7],               // mid singles
    // horizontal bars
    [6, 5], [6, 6], [6, 7], [6, 8],
    [14, 12], [14, 13], [14, 14], [14, 15], [14, 16],
    // vertical bar
    [6, 17], [7, 17], [8, 17], [9, 17], [10, 17],
    // L-shape (left-center)
    [10, 5], [11, 5], [12, 5], [12, 6], [12, 7], [12, 8],
    // diagonal staircase
    [5, 14], [6, 15], [7, 16],
    // Z-shape
    [11, 12], [11, 13], [12, 13], [12, 14],

    // BETA (interior rows 2-19, cols 31-48; teleport at col 39, row 10)
    [3, 32], [4, 32], [3, 33], [4, 33],
    [3, 46], [4, 46], [3, 47], [4, 47],
    [16, 32], [17, 32], [16, 33], [17, 33],
    [16, 46], [17, 46], [16, 47], [17, 47],
    [7, 44], [13, 36],
    // horizontal bars
    [6, 33], [6, 34], [6, 35], [6, 36],
    [14, 40], [14, 41], [14, 42], [14, 43], [14, 44],
    // vertical bars
    [6, 46], [7, 46], [8, 46], [9, 46],
    [13, 34], [14, 34], [15, 34], [16, 34],
    // L-shape
    [9, 34], [9, 35], [9, 36], [10, 34], [11, 34],
    // diagonal staircase
    [5, 31], [6, 32], [7, 33],

    // DELTA (interior rows 31-48, cols 2-19; teleport at col 10, row 39)
    [32, 3], [33, 3], [32, 4], [33, 4],
    [32, 16], [33, 16], [32, 17], [33, 17],
    [46, 3], [47, 3], [46, 4], [47, 4],
    [46, 16], [47, 16], [46, 17], [47, 17],
    [35, 14], [43, 7],
    // horizontal bars
    [34, 12], [34, 13], [34, 14], [34, 15],
    [44, 5], [44, 6], [44, 7], [44, 8],
    // L-shape from horizontal into vertical
    [45, 8], [46, 8], [47, 8],
    // vertical bar
    [35, 12], [36, 12], [37, 12], [38, 12],
    // L-shape (center-right)
    [41, 13], [42, 13], [42, 14], [42, 15], [42, 16],
    // diagonal staircase
    [34, 5], [35, 6], [36, 7],

    // GAMMA (interior rows 31-48, cols 31-48; teleport at col 39, row 39)
    [32, 32], [33, 32], [32, 33], [33, 33],
    [32, 46], [33, 46], [32, 47], [33, 47],
    [46, 32], [47, 32], [46, 33], [47, 33],
    [46, 46], [47, 46], [46, 47], [47, 47],
    [35, 44], [43, 36],
    // horizontal bars
    [33, 40], [33, 41], [33, 42], [33, 43],
    [44, 35], [44, 36], [44, 37], [44, 38],
    // vertical bars
    [34, 35], [35, 35], [36, 35], [37, 35],
    [36, 46], [37, 46], [38, 46], [39, 46],
    // L-shape
    [40, 44], [41, 44], [42, 44], [42, 43], [42, 42], [42, 41],
    // diagonal staircase
    [34, 32], [35, 33], [36, 34],
  ];

  const hallwayZones: [number, number, number, number][] = [
    [9, 20, 11, 30], [38, 20, 40, 30], [20, 9, 30, 11], [20, 38, 30, 40],
  ];
  function inHallway(r: number, c: number) {
    return hallwayZones.some(([r1, c1, r2, c2]) => r >= r1 && r <= r2 && c >= c1 && c <= c2);
  }
  function isTeleport(r: number, c: number) {
    return TELEPORT_PADS.some(([tx, ty]) => tx === c && ty === r);
  }

  for (const [r, c] of coverWalls) {
    if (!inHallway(r, c) && !isTeleport(r, c)) map[r][c] = T_WALL;
  }

  return map;
}

// Returns which chamber index a tile belongs to (-1 if none / hallway)
export function chamberOfTile(tileX: number, tileY: number): number {
  for (let i = 0; i < CHAMBER_BOUNDS.length; i++) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[i];
    if (tileY >= r1 && tileY <= r2 && tileX >= c1 && tileX <= c2) return i;
  }
  return -1;
}

// Hallway bounds [row1, col1, row2, col2] inclusive — must match generateMap's fillFloor calls.
// 0: top (ALPHA<->BETA), 1: bottom (DELTA<->GAMMA), 2: left (ALPHA<->DELTA), 3: right (BETA<->GAMMA)
export const HALLWAY_BOUNDS: readonly [number, number, number, number][] = [
  [9, 20, 11, 30],
  [38, 20, 40, 30],
  [20, 9, 30, 11],
  [20, 38, 30, 40],
];

// Returns which hallway index a tile belongs to (-1 if none / inside a chamber)
export function hallwayOfTile(tileX: number, tileY: number): number {
  for (let i = 0; i < HALLWAY_BOUNDS.length; i++) {
    const [r1, c1, r2, c2] = HALLWAY_BOUNDS[i];
    if (tileY >= r1 && tileY <= r2 && tileX >= c1 && tileX <= c2) return i;
  }
  return -1;
}

// ─── Enemy types ─────────────────────────────────────────────────────────────

export type EnemyType = 'normal' | 'armored' | 'fast' | 'bomber' | 'sniper' | 'healer' | 'charger' | 'ghost' | 'splitter' | 'mini_splitter' | 'shielder' | 'energy_leech' | 'fiery_king' | 'splitter_queen' | 'queen_echo' | 'storm_reaper' | 'devourer' | 'frost_warden' | 'blind_prayer' | 'sea_chanter' | 'thorn_weaver' | 'aegis_sentinel' | 'aegis_construct' | 'astral_twins'
  | 'fish_blue' | 'fish_red' | 'stinger' | 'water_clone' | 'water_bomb' | 'jellyfish' | 'pufferfish'
  | 'seed_pod' | 'blossom' | 'sporeling' | 'vine_crawler' | 'angry_mushroom' | 'lifebloom'
  | 'moon_illusion' | 'mirror_mite' | 'moon_shade' | 'moon_mimic';

export const ENERGY_LEECH_DRAIN = 20;

export interface EnemyConfig {
  maxHp: number;
  speed: number;          // px per tick (at ~60 fps)
  color: string;
  shieldColor: string;
  bodyFraction: number;   // fraction of TILE_SIZE for body width
  scoreValue: number;
  damageToPlayer: number;
  damageToRuby: number;
  attackCooldown: number;
  attackRange: number;     // tile distance at which this enemy can attack
  bombExplodeRange: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  // Neptune challenge units. Fish and water objects never attack; stingers poison on hit.
  fish_blue: {
    maxHp: 1, speed: 1.3, color: '#59c8ff', shieldColor: '#bfe9ff',
    bodyFraction: 0.5, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  fish_red: {
    maxHp: 1, speed: 1.3, color: '#ff5a6a', shieldColor: '#ffc2c8',
    bodyFraction: 0.5, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  stinger: {
    maxHp: 6, speed: 0.95, color: '#3fd6b0', shieldColor: '#a8f5e2',
    bodyFraction: 0.68, scoreValue: 15, damageToPlayer: 4, damageToRuby: 3,
    attackCooldown: 70, attackRange: 1, bombExplodeRange: 0,
  },
  jellyfish: { // fragile; killing one during a dive reveals a clone
    maxHp: 2, speed: 0.5, color: '#ff9ce6', shieldColor: '#ffd6f4',
    bodyFraction: 0.66, scoreValue: 10, damageToPlayer: 5, damageToRuby: 3,
    attackCooldown: 70, attackRange: 1, bombExplodeRange: 0,
  },
  pufferfish: { // chases you, swells up when close, then bursts into spikes that knock you back (melee handled by the challenge)
    maxHp: 7, speed: 1.7, color: '#ffc94a', shieldColor: '#fff0b8',
    bodyFraction: 0.7, scoreValue: 20, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 150, attackRange: 0, bombExplodeRange: 0,
  },
  water_clone: {
    maxHp: 8, speed: 1.3, color: '#6fc7ff', shieldColor: '#d8f2ff',
    bodyFraction: 0.9, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  water_bomb: {
    maxHp: 6, speed: 0, color: '#7fd0ff', shieldColor: '#e1f6ff',
    bodyFraction: 0.6, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  // Gaia challenge units. Pods and blossoms are her plants (objectives, no rewards); sporelings and crawlers are aliens.
  seed_pod: {
    maxHp: 6, speed: 0, color: '#c6e86a', shieldColor: '#eaffb0',
    bodyFraction: 0.55, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  blossom: {
    maxHp: 12, speed: 0, color: '#ff8fc8', shieldColor: '#ffd6ec',
    bodyFraction: 0.7, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  // Moon challenge: an illusion of the Shadow Queen. Looks and attacks exactly like her disguise; shatters when destroyed.
  moon_illusion: {
    maxHp: 4, speed: 0, color: '#dd88ff', shieldColor: '#dd88ff',
    bodyFraction: 0.80, scoreValue: 0, damageToPlayer: 3, damageToRuby: 2,
    attackCooldown: 70, attackRange: 8, bombExplodeRange: 0,
  },
  mirror_mite: { // Moon alien: fragile and quick; killing one heals you a lot
    maxHp: 1, speed: 1.1, color: '#c6b8ff', shieldColor: '#efe8ff',
    bodyFraction: 0.55, scoreValue: 10, damageToPlayer: 4, damageToRuby: 3,
    attackCooldown: 60, attackRange: 1, bombExplodeRange: 0,
  },
  moon_shade: { // Moon alien: a translucent shadow that always hunts a placed Ruby (you only while you carry it)
    maxHp: 6, speed: 1.0, color: '#7a5cc8', shieldColor: '#c9b6ff',
    bodyFraction: 0.75, scoreValue: 15, damageToPlayer: 4, damageToRuby: 6,
    attackCooldown: 70, attackRange: 1, bombExplodeRange: 0,
  },
  moon_mimic: { // Moon alien (phase 2+): wanders, then sits still looking exactly like a Queen illusion; never chases or attacks
    maxHp: 5, speed: 0.9, color: '#9a8cd0', shieldColor: '#d8d0ff',
    bodyFraction: 0.75, scoreValue: 15, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 1, bombExplodeRange: 0,
  },
  lifebloom: { // friendly: a phase 3 flower that heals you and Ruby when broken
    maxHp: 1, speed: 0, color: '#9fffc8', shieldColor: '#e8fff0',
    bodyFraction: 0.6, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  sporeling: {
    maxHp: 5, speed: 0.55, color: '#b9a8ff', shieldColor: '#e2d9ff',
    bodyFraction: 0.66, scoreValue: 15, damageToPlayer: 5, damageToRuby: 4,
    attackCooldown: 70, attackRange: 1, bombExplodeRange: 0,
  },
  angry_mushroom: { // fast melee; its hit knocks you back two tiles, and it leaves vines where it runs
    maxHp: 8, speed: 3, color: '#ff5a4a', shieldColor: '#ffc2b8',
    bodyFraction: 0.7, scoreValue: 20, damageToPlayer: 3, damageToRuby: 2,
    attackCooldown: 80, attackRange: 1, bombExplodeRange: 0,
  },
  vine_crawler: {
    maxHp: 8, speed: 1.2, color: '#5fbf4a', shieldColor: '#b6f0a0',
    bodyFraction: 0.7, scoreValue: 15, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  normal: {
    maxHp: 5, speed: 0.68, color: '#44ee44', shieldColor: '#44ee44',
    bodyFraction: 0.7, scoreValue: 10, damageToPlayer: 10, damageToRuby: 6,
    attackCooldown: 55, attackRange: 1, bombExplodeRange: 0,
  },
  armored: {
    maxHp: 22, speed: 0.47, color: '#4488ff', shieldColor: '#88bbff',
    bodyFraction: 0.82, scoreValue: 25, damageToPlayer: 15, damageToRuby: 10,
    attackCooldown: 70, attackRange: 2, bombExplodeRange: 0,
  },
  fast: {
    maxHp: 4, speed: 5.5, color: '#ff8844', shieldColor: '#ff8844',
    bodyFraction: 0.45, scoreValue: 15, damageToPlayer: 6, damageToRuby: 3,
    attackCooldown: 40, attackRange: 2, bombExplodeRange: 0,
  },
  bomber: {
    maxHp: 6, speed: 0.53, color: '#cc44ff', shieldColor: '#cc44ff',
    bodyFraction: 0.78, scoreValue: 30, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 999, attackRange: 1, bombExplodeRange: 4,
  },
  sniper: {
    maxHp: 5, speed: 0.34, color: '#ffee00', shieldColor: '#ffee00',
    bodyFraction: 0.64, scoreValue: 20, damageToPlayer: 13, damageToRuby: 13,
    attackCooldown: 130, attackRange: 1, bombExplodeRange: 0,
  },
  healer: {
    maxHp: 11, speed: 0.42, color: '#ff55cc', shieldColor: '#ff55cc',
    bodyFraction: 0.72, scoreValue: 12, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  charger: {
    maxHp: 17, speed: 0.75, color: '#ff4400', shieldColor: '#ff4400',
    bodyFraction: 0.76, scoreValue: 22, damageToPlayer: 20, damageToRuby: 14,
    attackCooldown: 90, attackRange: 1, bombExplodeRange: 0,
  },
  ghost: {
    maxHp: 4, speed: 0.89, color: '#8855ff', shieldColor: '#8855ff',
    bodyFraction: 0.60, scoreValue: 18, damageToPlayer: 12, damageToRuby: 9,
    attackCooldown: 50, attackRange: 3, bombExplodeRange: 0,
  },
  splitter: {
    maxHp: 17, speed: 0.82, color: '#66ff33', shieldColor: '#66ff33',
    bodyFraction: 0.80, scoreValue: 28, damageToPlayer: 11, damageToRuby: 8,
    attackCooldown: 60, attackRange: 2, bombExplodeRange: 0,
  },
  mini_splitter: {
    maxHp: 4, speed: 0.95, color: '#88ff55', shieldColor: '#88ff55',
    bodyFraction: 0.52, scoreValue: 5, damageToPlayer: 6, damageToRuby: 4,
    attackCooldown: 35, attackRange: 1, bombExplodeRange: 0,
  },
  shielder: {
    maxHp: 10, speed: 0.44, color: '#00ddcc', shieldColor: '#00ddcc',
    bodyFraction: 0.74, scoreValue: 20, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 999, attackRange: 0, bombExplodeRange: 0,
  },
  energy_leech: {
    maxHp: 8, speed: 1.8, color: '#c77aff', shieldColor: '#e7baff',
    bodyFraction: 0.66, scoreValue: 20, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 75, attackRange: 1, bombExplodeRange: 0,
  },
  fiery_king: {
    maxHp: 121, speed: 0.48, color: '#cc0022', shieldColor: '#ff4444',
    bodyFraction: 1.55, scoreValue: 500, damageToPlayer: 40, damageToRuby: 35,
    attackCooldown: 45, attackRange: 2, bombExplodeRange: 0,
  },
  splitter_queen: {
    maxHp: 50, speed: 0, color: '#cc33ff', shieldColor: '#ee99ff',
    bodyFraction: 0.95, scoreValue: 400, damageToPlayer: 7, damageToRuby: 10,
    attackCooldown: 70, attackRange: 8, bombExplodeRange: 0,
  },
  queen_echo: {
    maxHp: 1, speed: 0, color: '#dd88ff', shieldColor: '#dd88ff',
    bodyFraction: 0.80, scoreValue: 0, damageToPlayer: 5, damageToRuby: 4,
    attackCooldown: 55, attackRange: 8, bombExplodeRange: 0,
  },
  storm_reaper: {
    maxHp: 60, speed: 4.0, color: '#52ffd6', shieldColor: '#c2ffec',
    bodyFraction: 1.1, scoreValue: 450, damageToPlayer: 20, damageToRuby: 0,
    attackCooldown: 24, attackRange: 1, bombExplodeRange: 0, // 40 / 1.7 ≈ 24 — attacks 1.7x faster
  },
  devourer: {
    maxHp: 35, speed: 3.4, color: '#6b2fa8', shieldColor: '#b088e0',
    bodyFraction: 0.95, scoreValue: 480, damageToPlayer: 5, damageToRuby: 1,
    attackCooldown: 60, attackRange: 2, bombExplodeRange: 0,
  },
  blind_prayer: {
    maxHp: 80, speed: 2.0, color: '#ffdd22', shieldColor: '#fff199',
    bodyFraction: 1.05, scoreValue: 470, damageToPlayer: 6, damageToRuby: 0,
    attackCooldown: 720, attackRange: 6, bombExplodeRange: 0, // matches normal player WAVE_RADIUS
  },
  sea_chanter: {
    maxHp: 90, speed: 3.8, color: '#3998d6', shieldColor: '#c7e9ff',
    bodyFraction: 1.05, scoreValue: 470, damageToPlayer: 10, damageToRuby: 0,
    attackCooldown: 210, attackRange: 12, bombExplodeRange: 0,
  },
  thorn_weaver: {
    maxHp: 80, speed: 2.8, color: '#88bc45', shieldColor: '#d8ef9b',
    bodyFraction: 0.95, scoreValue: 480, damageToPlayer: 12, damageToRuby: 0,
    attackCooldown: 240, attackRange: 100, bombExplodeRange: 0,
  },
  frost_warden: {
    // Pure field-controller — no direct attack, so damageToPlayer/damageToRuby/attackCooldown/
    // attackRange are unused (kept only because EnemyConfig requires every field).
    maxHp: 100, speed: 0, color: '#aaeeff', shieldColor: '#ffffff',
    bodyFraction: 0.9, scoreValue: 460, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 65, attackRange: 10, bombExplodeRange: 0,
  },
  aegis_sentinel: {
    maxHp: 90, speed: 4.0, color: '#c5a35d', shieldColor: '#78dedf', // shielded speed, a touch above Sea Chanter
    bodyFraction: 1.05, scoreValue: 500, damageToPlayer: 12, damageToRuby: 8,
    attackCooldown: 75, attackRange: 2, bombExplodeRange: 0,
  },
  aegis_construct: {
    maxHp: 24, speed: 0, color: '#78dedf', shieldColor: '#d5ffff',
    bodyFraction: 0.8, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  astral_twins: {
    maxHp: 60, speed: 2.9, color: '#f08062', shieldColor: '#ffe5c5',
    bodyFraction: 0.9, scoreValue: 500, damageToPlayer: 10, damageToRuby: 7,
    attackCooldown: 65, attackRange: 1, bombExplodeRange: 0,
  },
};

export const BOSS_SPAWN_INTERVAL = 2310; // 38.5s after boss death + 3.5s warning = 42s until the next boss
export const BOSS_WARNING_TICKS = 210;  // ticks of warning before boss appears (~3.5s)
export const BOSS_ANNOUNCEMENT_TICKS = 240; // show the spawned boss's name for 4 seconds
export const BOSS_NAMES = {
  fiery_king: 'FIERY KING',
  splitter_queen: 'SHADOW QUEEN',
  storm_reaper: 'STORM REAPER',
  devourer: 'SOUL DEVOURER',
  frost_warden: 'FROST WARDEN',
  blind_prayer: 'BLIND PRAYER',
  sea_chanter: 'SEA CHANTER',
  thorn_weaver: 'THORN WEAVER',
  aegis_sentinel: 'AEGIS SENTINEL',
  astral_twins: 'ASTRAL TWINS',
} as const;
export type BossType = keyof typeof BOSS_NAMES;
export const BOSS_TYPES = Object.keys(BOSS_NAMES) as BossType[];
export function isBossType(type: EnemyType): type is BossType {
  return BOSS_TYPES.includes(type as BossType);
}
export const AEGIS_DAMAGE_MULT = 0.05;
export const AEGIS_REFLECT_RATIO = 1; // Return 100% of incoming damage before Aegis reduction.
export const AEGIS_EXPOSE_TICKS = 1200;
export const AEGIS_RESHIELD_WARNING_TICKS = 180; // 3s warning before a fresh pylon pair restores the shield
export const AEGIS_EXPOSED_SPEED = 1.19; // core exposed: slow, open to attack
export const PYLON_LIFETIME_TICKS = 1200;
export const PYLON_OVERLOAD_WINDUP = 180;
export const PYLON_OVERLOAD_DAMAGE = 80;
export const TWIN_REVIVE_TICKS = 720;
export const TWIN_REVIVE_HP_RATIO = 0.6;
export const TWIN_REVIVE_HASTE_TICKS = 300; // 5s speed burst after reviving
export const TWIN_REVIVE_HASTE_MULT = 1.4;
// While its partner is down, the survivor goes berserk until the revival.
export const TWIN_BERSERK_SPEED_MULT = 1.25;
export const TWIN_BERSERK_COOLDOWN_MULT = 0.6;
export const TWIN_BERSERK_DAMAGE_TAKEN = 0.65;
export const TWIN_MIN_SEPARATION = 6; // preferred spacing; tight passages can compress it
export const TWIN_RANGED_RANGE = 9;
export const TWIN_RANGED_SPEED = 3.8;
export const TWIN_RANGED_WINDUP = 36;
export const TWIN_RANGED_COOLDOWN = 100;
export const TWIN_RANGED_DAMAGE = 8;
export const TWIN_TRANSFER_MIN_TICKS = 360;
export const TWIN_TRANSFER_MAX_TICKS = 540;
export const TWIN_TRANSFER_RATIO = 0.3;
export const TWIN_TRANSFER_FX_TICKS = 60;
export const PRAYER_FLEE_REPATH_TICKS = 30;
export const THORN_WINDUP = 90; // locked ground target, 1.5s to leave
export const THORN_FIRST_DELAY = 120;
export const THORN_RADIUS = TILE_SIZE * 2;
export const THORN_DEFENSE_RADIUS = TILE_SIZE * 3;
export const THORN_DEFENSE_TRIGGER_RANGE = TILE_SIZE * 3;
export const THORN_DEFENSE_COOLDOWN = 720; // 12s, independent of aimed casts
// Four whole tiles per side, snapped to the nearest grid intersection.
// Shared by warning/plant rendering and actual hazard membership.
export function getThornFieldBounds(x: number, y: number, radius = THORN_RADIUS) {
  const centerX=Math.round(x/TILE_SIZE)*TILE_SIZE,centerY=Math.round(y/TILE_SIZE)*TILE_SIZE;
  return {x:centerX,y:centerY,left:centerX-radius,top:centerY-radius,right:centerX+radius,bottom:centerY+radius};
}
export const THORN_LIFETIME = 840; // 14s, about three simultaneous patches
export const THORN_MAX_PATCHES = 4;
export const THORN_POISON_TICKS = 240; // 4s, refreshed but never stacked
export const THORN_POISON_INTERVAL = 60;
export const THORN_POISON_DAMAGE = 2;
export const THORN_CONTACT_DAMAGE = 1;
export const THORN_CONTACT_INTERVAL = 45; // 0.75s while standing in plants
export const THORN_SLOW_MULT = 0.8; // only while physically inside plants
export const THORN_FLEE_RANGE = 24;
export const SEA_DIVE_DAMAGE_MULTIPLIER = 1.6;
export const SEA_DIVE_SPEED = 4.0;
export const SEA_DIVE_FLEE_RANGE = 18; // tiles, roughly one chamber wide
export const SEA_DIVE_ENTER_HP = 0.4;
export const SEA_DIVE_EXIT_HP = 0.75;
export const SEA_MINIMAP_INTERVAL = 480; // ticks: one reveal every 8 seconds
export const SEA_MINIMAP_REVEAL = 60; // ticks: visible for 1 second
export const SEA_ALLY_HEAL_RADIUS = 12; // tiles; broad circular area, not restricted to chambers
export const SEA_ALLY_HEAL_INTERVAL = 180; // 3 seconds while surfaced
export const SEA_ALLY_PASSIVE_HEAL = 3;
export const SEA_ALLY_HEAL_AMOUNT = 10; // per hit on surfaced Sea Chanter
export const SEA_FEED_HEAL_RATIO = 0.8; // actual HP damage dealt to other aliens
export const SEA_HEALING_BLOCK_TICKS = 180; // 3s after taking HP damage while diving
export const SEA_FEED_HEAL_CAP = 25; // max healing from one hit on one alien
export const SEA_SONG_WINDUP = 24;
export const SEA_SONG_FIRST_DELAY = 120;
export const SEA_SONG_SPEED = 20; // px/tick
export const SEA_SONG_HIT_RADIUS = 25; // px
export const SEA_SONG_BLAST_RADIUS = TILE_SIZE * 6;
export const SEA_SONG_BLAST_TICKS = 24;
export const SEA_SONG_BLAST_DAMAGE_CENTER = 15;
export const SEA_SONG_BLAST_DAMAGE_EDGE = 5;
export const PRAYER_RUBY_COOLDOWN = 1800; // 30s between ritual starts, only while the Ruby is placed
export const PRAYER_RUBY_WINDUP = 90; // 1.5s to pick the Ruby up and cancel the ritual
export const PRAYER_ESCAPE_WINDUP = 36; // 0.6s visible warning before the close-range attack
export const PRAYER_ESCAPE_DURATION = 150; // 2.5s speed burst
export const PRAYER_ESCAPE_SPEED = 5.4; // short burst outruns normal movement; player speed boost still counters it
export const PRAYER_ESCAPE_GRACE = 180; // no escape attack in the first 3s after spawn
export const PRAYER_KNOCKBACK_SPEED = 8; // one-tile push over ~0.1s, stopping at walls
// First boss timer starts counting only once difficultyLevel reaches 1 (~10s in), then this
// many ticks, then BOSS_WARNING_TICKS more — sized so the very first boss appears at ~60s total.
export const BOSS_FIRST_SPAWN_TIMER = 2790;
export const BOSS_LATE_METEOR_DMG = 45; // after special skills unlock
export const BOSS_METEOR_DMG = 75;   // meteor deals 75% of boss max HP
export const BOSS_ATTACK_RANGE = 3;    // boss can attack from 3 tiles away
export const KING_RAMP_SECONDS = 350;
export const KING_SPEED_RAMP_PER_SEC = 11.5 / KING_RAMP_SECONDS; // fraction of base speed gained per second alive
export const KING_SPEED_CAP = 6.0;    // px/tick — exceeds normal player speed after ~255s, caps after 350s
export const KING_UNTOUCHED_TICKS = 600; // warn after 10s untouched, 5s earlier than before
export const KING_ARENA_WINDUP = 390; // 6.5s to interrupt; pulse still lands after 16.5s total
export const KING_ARENA_DAMAGE = 15; // player and placed Ruby, regardless of chamber or cover
export const KING_ARENA_DAMAGE_MAX = 30; // increases with this King's age, reaching the cap alongside speed
export const KING_ARENA_FX_TICKS = 24;

export const HEALER_HEAL_RADIUS = 3;  // tiles — heals allies within this range
export const HEALER_HEAL_AMOUNT = 2;  // HP restored per interval
export const HEALER_HEAL_INTERVAL = 60; // ticks between heals (~1s)

export const SNIPER_ATTACK_RANGE = 10; // tiles — fires from this distance
export const SNIPER_WINDUP_TICKS = 50; // telegraph before firing (~0.83s)

export const CHARGER_CHARGE_SPEED = 7.5; // px/tick during the committed rush
export const CHARGER_WINDUP_TICKS = 30; // half-second locked-lane warning
export const CHARGER_CHARGE_TILES = 8; // recover after a missed rush instead of charging forever
export const CHARGER_SIGHT_RANGE = 7;   // tiles — triggers charge when player in LoS
export const CHARGER_STUN_TICKS = 55;  // ticks stunned after hitting wall

export const SHIELDER_SHIELD_RANGE = 8;  // tiles — shields allies within 8 tiles
export const KILL_SHIELD_HP = 10; // Armored/Shielder kill reward — refills a non-stacking damage absorb pool

export const SNIPER_CHAIN_RANGE = 4;  // tiles — chain lightning radius on sniper kill
export const SNIPER_CHAIN_DMG = 8;  // damage per chain hit

export const QUEEN_PHASE_INTERVAL = 480; // ticks (~8s) between chamber phase-jumps
export const QUEEN_PHASE_TELEGRAPH = 60;  // ticks before a jump where she visibly destabilizes
export const QUEEN_ATTACK_RANGE = 16;  // tiles — fires from this distance, only within her own chamber
export const QUEEN_WINDUP_TICKS = 40;  // telegraph before firing (queen + echo share this)
export const QUEEN_PHASE_HEAL_PCT = 0.07; // fraction of max HP healed on each phase-jump
export const QUEEN_PHASE_HEAL_CAP = 8; // prevent excessive healing in late boss levels

export const REAPER_SEAL_DURATION = 240; // ticks (~4s) a sealed hallway stays walled off
export const REAPER_SEAL_COOLDOWN = 480; // ticks (~8s) before she can seal another hallway

// Soul Devourer: a swift swarm boss. Each ally eaten adds a stack (max 3); on death every
// stack bursts out as a nearly full-strength copy that can eat and split again; the swarm is the fight.
export const DEVOURER_MAX_STACKS = 3;
export const DEVOURER_SELF_SPLIT_TICKS = 1200;   // 20s alive: a body with a stack buds off a copy on its own
export const DEVOURER_SELF_SPLIT_WARNING = 120;  // 2s visible warning before a self-split
export const DEVOURER_FAMILY_CAP = 10; // most living Devourer bodies at once, shared by the whole family
export const DEVOURER_BODY_KILL_HEAL = 8; // player heal for each non-final Devourer body killed (regular kills heal 5)
export const DEVOURER_START_STACKS = 1; // the original spawns with one stack (copies start at 0)
export const DEVOURER_HP_PER_DEFEAT = 6; // original HP gain per prior boss defeat (other bosses use 15)
export const DEVOURER_ABSORB_RANGE = 5;   // tiles — how far she'll reach to consume a nearby ally
export const DEVOURER_ABSORB_COOLDOWN = 360;         // 6s between meals for the original
export const DEVOURER_ABSORB_COOLDOWN_PER_GEN = 180;  // first copy generation adds 3s ...
export const DEVOURER_ABSORB_COOLDOWN_GEN_STEP = 60;  // ... and each later generation adds 1s more than the last (9s, 13s, 18s, 24s, ...)
export const DEVOURER_COPY_FIRST_MEAL = 180; // ticks (3s) before a newborn copy can eat
export const DEVOURER_STACK_HP_PCT = 0.05; // fraction of max HP gained (and healed) per stack
export const DEVOURER_STACK_DAMAGE = 0.5; // extra player/Ruby damage per stack
export const DEVOURER_HUNGRY_BELOW = 2;    // at 0–1 stacks she hunts aliens to eat before the player
export const DEVOURER_FULL_HEAL_PCT = 0.01; // eating at the stack cap heals this much instead
export const DEVOURER_COPY_HP_RATIO = 0.5; // each copy's max HP, as a share of its parent's max HP at death
export const DEVOURER_COPY_SCALE = 0.9;   // body size per generation
export const DEVOURER_NEWBORN_TICKS = 120;   // 2s: a fresh copy flees from the player at boosted speed
export const DEVOURER_NEWBORN_SPEED_MULT = 1.5;
export const DEVOURER_GEN_SPEED_MULT = 0.9; // speed multiplier per copy generation (10% slower each)
export const DEVOURER_GEN_DAMAGE_MULT = 0.8; // bite damage multiplier per copy generation (20% less each)

export const FROST_CHILL_SPEED_MULT = 0.65; // player move-speed multiplier while sharing her chamber
export const FROST_CHILL_TICK_RATE = 0.5;  // LASER/BULLET/WAVE cooldowns tick down at this rate while chilled (half attack speed)
export const FROST_ICE_TILE_COUNT = 7;    // ice tiles scattered in whichever chamber she currently occupies
export const FROST_FREEZE_DURATION = 90;   // ticks (~1.5s) fully immobilized after stepping on ice
export const FROST_RELOCATE_INTERVAL = 1800; // ticks (~30s) between chamber relocations (re-scatters ice tiles)
export const FROST_SHIELD_HP = 15;   // base absorb capacity of the icy shield granted per cast
export const FROST_SHIELD_HP_PER_DEFEAT = 2; // extra absorb per prior boss defeat
export const FROST_SHIELD_HP_MAX = 45; // reached after 15 defeats
export const FROST_SHIELD_CAST_DELAY = 300;  // ticks (~5s) — recurring interval between ice-laser shield casts

// ─── Difficulty tiers ────────────────────────────────────────────────────────

export interface DifficultyTier {
  spawnInterval: number;   // ticks between enemy spawns
  maxEnemies: number;
  spawnTypes: EnemyType[];
  hpMult: number;
  spawnCount: number;      // how many enemies spawn per wave
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  { spawnInterval: 180, maxEnemies: 7, spawnTypes: ['normal'], hpMult: 1.0, spawnCount: 1 }, // opening
  { spawnInterval: 150, maxEnemies: 9, spawnTypes: ['normal'], hpMult: 1.0, spawnCount: 1 }, // after 10s
  { spawnInterval: 120, maxEnemies: 11, spawnTypes: ['normal', 'normal', 'armored', 'healer'], hpMult: 1.0, spawnCount: 1 }, // after 25s
  { spawnInterval: 100, maxEnemies: 16, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'healer', 'charger'], hpMult: 1.2, spawnCount: 1 }, // after 45s
  { spawnInterval: 80, maxEnemies: 18, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'energy_leech'], hpMult: 1.3, spawnCount: 2 }, // stage 1
  { spawnInterval: 65, maxEnemies: 21, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'bomber', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'splitter', 'energy_leech'], hpMult: 1.5, spawnCount: 2 }, // stage 2
  { spawnInterval: 50, maxEnemies: 25, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'bomber', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'splitter', 'energy_leech'], hpMult: 1.7, spawnCount: 2 }, // stage 3
  { spawnInterval: 38, maxEnemies: 31, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'bomber', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'splitter', 'energy_leech'], hpMult: 2.0, spawnCount: 3 }, // stage 4+
];

export const DIFFICULTY_RAMP_TICKS = 600; // first opening increase, preserving first-boss timing
export const DIFFICULTY_OPENING_THRESHOLDS = [0, DIFFICULTY_RAMP_TICKS, 1500, 2700] as const;

// ─── Player / Ruby ────────────────────────────────────────────────────────────

export const PLAYER_MAX_HP = 100;
export const RUBY_MAX_HP = 100;
export const PLAYER_BASE_SPEED = 4.5;  // px/tick  (scaled with TILE_SIZE 48)
export const PLAYER_CARRY_MULT = 0.6; // 60% of normal speed while carrying Ruby

// ─── Abilities ────────────────────────────────────────────────────────────────

// 1. Laser beam (key J)
export const LASER_RANGE = 8;   // tiles
export const LASER_RANGE_PWR = 14;
export const LASER_DMG = 2.1;
export const LASER_DMG_PWR = 6.3;
export const LASER_COOLDOWN = 40;  // ticks (~0.67s) — frequent clicks, low damage

export const BULLET_COOLDOWN = 11;
export const BULLET_DMG = 0.35;
export const BULLET_DMG_PWR = 1.05;
export const BULLET_SPEED = 0.45;

// 2. Charge wave (key K, tap 4×)
export const CHARGE_NEEDED = 4;
export const CHARGE_DECAY_TICKS = 110; // reset charges if gap > 110 ticks
export const WAVE_RADIUS = 6;   // tiles
export const WAVE_RADIUS_PWR = 10;
export const WAVE_DMG = 8;
export const WAVE_DMG_PWR = 14;
export const WAVE_PUSH_TILES = 3;
export const WAVE_PUSH_TILES_PWR = 6;
export const WAVE_COOLDOWN = 120;

// 3. Speed boost (key L)
export const SPEED_DURATION = 120;  // ticks (~2s)
export const SPEED_DURATION_PWR = 240;
export const SPEED_MULT = 2.2;
export const SPEED_COOLDOWN = 270; // (4.5s) — was 360 (6s), reduced by 1.5s

// 4. Bomb (key B — place / detonate)
export const BOMB_RADIUS = 4;   // tiles
export const BOMB_RADIUS_PWR = 5;
export const BOMB_DMG = 45;
export const BOMB_DMG_PWR = 90;

// ─── Star energy ─────────────────────────────────────────────────────────────

export const STAR_ENERGY_MAX = 100;
export const STAR_ENERGY_PER_CRYSTAL = 40;
export const STAR_ENERGY_PER_KILL = 5;

// ─── Resources ───────────────────────────────────────────────────────────────

export const RESOURCE_SPAWN_INTERVAL = Math.round(600 / 1.1); // ~9.1s, 10% more frequent health/energy spawns
export const RESOURCE_MAX_ON_MAP = 5;
export const HEAL_AMOUNT = 33; // was 30, +10%
export const ENERGY_AMOUNT = 42; // was 38, +10%

// ─── Ruby Core healing ────────────────────────────────────────────────────────

export const RUBY_HEAL_AMOUNT = 5;  // HP per Space press
export const RUBY_HEAL_COOLDOWN = 18; // ticks between heals (~0.3s)
export const RUBY_HEAL_RANGE = 3;  // max Chebyshev distance player→ruby
export const RUBY_HEAL_CLEAR_RANGE = 6;  // no enemies within this many tiles

// ─── Meteorite ───────────────────────────────────────────────────────────────

// Tutorial mode: short guided steps, shown one at a time with a goal counter.
export type TutorialStepId = 'move' | 'laser' | 'bullet' | 'wave' | 'speed' | 'bomb' | 'energy' | 'carry' | 'heal' | 'teleport' | 'meteor' | 'celestial' | 'done';
export const TUTORIAL_STEPS: { id: TutorialStepId; title: string; text: string; goal: number }[] = [
  { id: 'move', title: 'MOVE', text: 'Move with WASD or the arrow keys.', goal: 8 },
  { id: 'laser', title: 'LASER', text: 'Left-click or K fires your laser in four directions. Defeat the aliens.', goal: 2 },
  { id: 'bullet', title: 'BULLETS', text: 'Right-click or L shoots bullets. Hold to keep firing. Defeat the aliens.', goal: 2 },
  { id: 'wave', title: 'CHARGED WAVE', text: 'Hold left-click or K to charge, then release for a wave that hits and pushes aliens back.', goal: 1 },
  { id: 'speed', title: 'SPEED BURST', text: 'Press R, Shift or Ctrl for a quick speed burst.', goal: 1 },
  { id: 'bomb', title: 'BOMB', text: 'Press Q to drop a bomb, step away, then press Q again to detonate. Your own blast hurts you.', goal: 1 },
  { id: 'energy', title: 'STAR ENERGY', text: 'Defeating aliens fills your energy bar (top left). When it is full, your next attack turns POWERED for 2 seconds. Fill it and fire!', goal: 1 },
  { id: 'carry', title: 'RUBY', text: 'Protect Ruby! Stand next to it and press E to pick it up, then E again to put it down.', goal: 2 },
  { id: 'heal', title: 'HEAL', text: 'Near Ruby or while carrying it, press Space to heal you both. No aliens may be close.', goal: 6 },
  { id: 'teleport', title: 'TELEPORT', text: 'Stand on or next to the glowing pad, press X, then click a room on the map.', goal: 1 },
  { id: 'meteor', title: 'METEOR', text: 'A meteor is falling on this room! Get out before it lands. It also wipes out aliens inside.', goal: 1 },
  { id: 'celestial', title: 'CELESTIAL SKILL', text: 'Bosses grant celestial skills. Press F to cast Solar Flare.', goal: 1 },
  { id: 'done', title: 'FIRST ORBIT COMPLETE', text: 'You are ready. Defeat bosses, keep Ruby alive and watch the skies.', goal: 0 },
];
export const TUTORIAL_STEP_PAUSE = 75; // ticks of "done" feedback before the next step starts

// Celestial Challenge (prototype): the guardian is the only boss, and its skill recharges after each cast.
export const TRIAL_BOSS_DELAY = 300;        // ticks (5s) before the guardian's arrival warning starts
export const SPECIAL_RECAST_LOCK = 90; // endless: 1.5s after a cast before F works again, so a skill earned by that cast isn't wasted
export const TRIAL_SKILL_COOLDOWN = 1200;   // ticks (20s) after casting before the skill returns
export const TRIAL_SKILL_COOLDOWNS: Partial<Record<SpecialSkill, number>> = { thorn_weaver: 2400, splitter_queen: 900 }; // Gaia's Roots: 40s; Lunar Echo: 15s
export function trialSkillCooldown(skill: SpecialSkill) { return TRIAL_SKILL_COOLDOWNS[skill] ?? TRIAL_SKILL_COOLDOWN; }

// Neptune challenge (Sea Chanter): three phases with their own HP (NEPTUNE_PHASE_HPS). Healing can never lift her into a
// finished phase. Dive points are fractions of the current phase; at each one she dives, drops water clones
// and stays under until they are all destroyed (HP snaps down to the dive point) or time runs out
// (each surviving clone restores NEPTUNE_CLONE_HEAL of the phase). Diving at 0 ends the phase; clearing
// phase 3's final dive leaves her surfaced and exposed, and the next hit kills her.
export const NEPTUNE_PHASE_HPS: Record<1 | 2 | 3, number> = { 1: 2000, 2: 2400, 3: 3000 }; // phase 2 +20%, phase 3 +50%
export const NEPTUNE_TOTAL_HP = NEPTUNE_PHASE_HPS[1] + NEPTUNE_PHASE_HPS[2] + NEPTUNE_PHASE_HPS[3];
// HP left once a phase is emptied (later phases sit below it on the bar), and the top of a phase.
export function neptunePhaseFloorHP(phase: 1 | 2 | 3) { return phase === 1 ? NEPTUNE_PHASE_HPS[2] + NEPTUNE_PHASE_HPS[3] : phase === 2 ? NEPTUNE_PHASE_HPS[3] : 0; }
export function neptunePhaseCeilHP(phase: 1 | 2 | 3) { return neptunePhaseFloorHP(phase) + NEPTUNE_PHASE_HPS[phase]; }
export const NEPTUNE_DIVE_POINTS: Record<1 | 2 | 3, number[]> = { 1: [.75, .5, .25, 0], 2: [.66, .33, 0], 3: [.66, .33, 0] };
export const NEPTUNE_CLONES: Record<1 | 2 | 3, number> = { 1: 3, 2: 3, 3: 4 };
export const NEPTUNE_DIVE_TICKS: Record<1 | 2 | 3, number> = { 1: 1200, 2: 1200, 3: 960 }; // 20s, 20s, 16s
export const NEPTUNE_CLONE_HEAL = .1;       // share of phase HP per surviving clone
export const NEPTUNE_CLONE_HEAL_BLOCK = 240; // hitting a clone stops her ally-feeding heal for 4s
export const NEPTUNE_DIVE_SPEED = 12; // very fast: on this map you hunt her clones, not her
export const NEPTUNE_BOMB_INTERVAL = 360;   // phase 2+: a water ball every 6s while surfaced
export const NEPTUNE_BOMB_FUSE = 180;       // 3s before it bursts
export const NEPTUNE_BOMB_RADIUS = 4;       // tiles
export const NEPTUNE_SONG_BONUS = 2;       // her water waves and bursts deal +2 here (to you and Ruby alike)
export const NEPTUNE_BOMB_DAMAGE = 25;      // to player and Ruby inside the burst
export const NEPTUNE_BOMB_SELF_DAMAGE = .03; // share of phase HP she takes when you pop it first
export const NEPTUNE_ATTACK_MULT: Record<1 | 2 | 3, number> = { 1: 1, 2: 1.5, 3: 1.5 };
export const NEPTUNE_LIFESTEAL = 1;         // phase 3: her hits heal her for the damage dealt
export const NEPTUNE_STRIKE_DAMAGE = .07;   // meteors and the sky laser deal this share of phase HP
export const NEPTUNE_HEAL_CHARGE_MAX = 120;  // healing received to charge the sky laser
export const NEPTUNE_LASER_WARNING = 180;   // 3s from choosing a room to the strike
export const NEPTUNE_FISH_CAP = 12;
export const NEPTUNE_FISH_RED_CHANCE = .35;
export const NEPTUNE_FISH_SPAWN_GAP = 120;
export const NEPTUNE_FISH_HEAL = 8;         // blue fish heal you this much
export const NEPTUNE_FISH_BOSS_HEAL = .03;  // ...or heal her this share of phase HP if she is diving
export const NEPTUNE_FISH_HURT = 6;         // red fish cost you this much
export const NEPTUNE_STINGER_CHANCE = .35;  // share of natural alien spawns replaced by stingers...
export const NEPTUNE_PUFFER_CHANCE = .2;    // ...and then by pufferfish
export const NEPTUNE_PUFF_TICKS = 36, NEPTUNE_PUFF_RADIUS = 2.5, NEPTUNE_PUFF_DAMAGE = 7, NEPTUNE_PUFF_KNOCKBACK = 2;
export const NEPTUNE_POISON_TICKS = 240;    // stinger poison: 2 damage per second for 4s
export const NEPTUNE_POISON_DAMAGE = 2;
export const NEPTUNE_TIDE_TICKS = 600;      // phases 1–2: one 10s tide every 40–60s
export const NEPTUNE_TIDE_GAP: [number, number] = [2400, 3600];
export const NEPTUNE_TIDE_ROTATE = 900;     // phase 3: two tides always flowing, moving every 15s
export const NEPTUNE_TIDE_WITH = 1.4, NEPTUNE_TIDE_AGAINST = .7;
export const NEPTUNE_TIDE_PUSH_GAP = 50;    // ticks between one-tile pushes when not swimming with the flow
export const NEPTUNE_JELLY_GAP: [number, number] = [1200, 1800]; // a jellyfish drifts in every 20–30s...
export const NEPTUNE_JELLY_CAP = 2;         // ...with at most two around
export const NEPTUNE_JELLY_DIVE_CHANCE = .5; // each dive also has this chance to bring one 4s in, even at the cap
export const NEPTUNE_JELLY_DIVE_DELAY = 240;
export const NEPTUNE_REVEAL_TICKS = 240;    // killing one during a dive marks a clone for 4s
export const NEPTUNE_SHARK_GAP: [number, number] = [900, 1500];  // a shark every 15–25s
export const NEPTUNE_SHARK_WARNING = 72;    // lane warning before it charges
export const NEPTUNE_SHARK_SPEED = .5;      // tiles per tick
export const NEPTUNE_SHARK_DAMAGE = 18;
export const NEPTUNE_SHARK_KNOCKBACK = 3;   // tiles you are thrown sideways off its lane
export const NEPTUNE_SHARK_BOSS_DAMAGE = .05; // share of phase HP when she is caught in its lane

// Moon challenge (Shadow Queen): an illusion fight. She wears her Echo's look and hides among illusions that copy her;
// just before each jump she shows her true self and is vulnerable. Three phases, all playing the same for now.
export const MOON_PHASE_HP = 2000;           // per phase; she has three
export const MOON_FIRST_CLONES = 4;          // illusions on her first jump...
export const MOON_CLONES_PER_JUMP = 2;       // ...and on every jump after
export const MOON_CLONE_CAPS: Record<1 | 2 | 3, number> = { 1: 6, 2: 8, 3: 8 }; // the oldest fades when a new one would pass this
export const MOON_REVEAL_TICKS = 90;         // she shows her true self for the last 1.5s before a jump
export const MOON_REVEAL_DAMAGE_MULT = 2.5;  // and takes this much more damage then
export const MOON_QUEEN_DAMAGE_MULT = .4;    // her own hits are softer here (there are many shooters)
export const MOON_SHARD_COUNT = 8;           // a destroyed illusion bursts into a ring of crystal shards
export const MOON_SHARD_SPEED = 5;           // px per tick
export const MOON_SHARD_TICKS = 90;          // about 9 tiles of travel
export const MOON_SHARD_DAMAGE = 6;          // to you
export const MOON_SHARD_RUBY_DAMAGE = 4;     // to a placed Ruby
export const MOON_SHARD_HIT_RADIUS = .45;    // tiles
export const MOON_STRIKE_DAMAGE = .08;       // meteors deal this share of the phase to her
export const MOON_MITE_CHANCE = .4;          // share of regular alien spawns replaced by mirror mites
export const MOON_SHADE_CHANCE = .2;         // share of regular alien spawns replaced by shades (Ruby hunters)
export const MOON_DARK_SHIFT = 600;          // phase 3: one room is dark; every 10s the dark moves to another room
export const MOON_DARK_FADE = 30;            // visual: the dark fades across over 0.5s
export const MOON_SEEN_TICKS = 45;           // anything hit inside the dark shows itself for 0.75s
export const MOON_MIMIC_GAP = 360;           // phase 2+: a mimic arrives every 6s on its own timer (never replacing other spawns)...
export const MOON_MIMIC_CAP = 4;             // ...with at most this many alive
export const MOON_MIMIC_TRUE_TICKS: [number, number] = [120, 240];   // 2–4s in its own form, then it poses as an illusion for good
export const MOON_MITE_KILL_HEAL = 10;       // on top of the usual +5 kill heal
export const MOON_MITE_HINT_TICKS = 300;     // a mite kill shows two rooms on the minimap for 5s: hers and one other
export const MOON_HIT_HEAL = .3;             // this share of the HP she loses to your attacks heals you when she next jumps
export const MOON_MIRROR_STRIPS = 3;         // phase 2+: mirror strips per room; walkable, but they bounce your laser and bullets back into you
export const MOON_MIRROR_LENGTH = 3;         // tiles per strip
export const MOON_MIRROR_SHIFT = 1200;       // every 20s the mirrors move to new spots
export const MOON_MIRROR_FADE = 30;          // visual: old panes fade out, new ones fade in
export const MOON_MARK_TICKS = 360;          // C marks the nearest Queen or illusion for 6s; the mark follows her jumps
export const MOON_MARK_COOLDOWN = 600;       // 10s from each cast

// Gaia challenge (Thorn Weaver): overgrowth fight. Every floor tile has a growth level 0–3 (clean, moss, vines,
// thicket). Vines slow you and heal her; you clear them with attacks, meteors, Sunfire and Gaia's Roots.
// Three phases of GAIA_PHASE_HP; phases 1–2 end with a short wither, and phase 3 plays like phase 2 until she dies.
export const GAIA_PHASE_HP = 3000;
export const GAIA_WITHER_TICKS = 180;            // 3s between phases
export const GAIA_SEEK_RANGE = 8;               // when not fleeing she walks to overgrowth this close and lingers there
export const GAIA_CAST_COOLDOWN = 90;            // aimed fields every 1.5s after one lands (4s elsewhere)
export const GAIA_THORN_RUBY_DAMAGE = 1;         // a placed Ruby inside his field: 1 every 0.75s...
export const GAIA_THORN_RUBY_CUT = 3;            // ...after the eruption cuts it for this (you take 12)
export const GAIA_THORN_CONTACT_DAMAGE = 3;      // standing in his thorn field: 3 every 0.75s here (1 elsewhere), plus poison
export const GAIA_TRAIL_GAP = 90;                // she grows tiles within GAIA_TRAIL_RADIUS every 1.5s
export const GAIA_TRAIL_RADIUS = 2;
export const GAIA_CREEP_GAP = 180;               // every 3s vines creep into neighbours...
export const GAIA_CREEP_CHANCE = .15;            // ...clean neighbour -> moss
export const GAIA_MOSS_CHANCE = .08;             // ...moss next to vines -> vines
export const GAIA_CREEP_CAP = 120;               // at most this many upgrades per creep pass
export const GAIA_VINE_SLOW = .6, GAIA_THICKET_SLOW = .45;
export const GAIA_THICKET_DAMAGE = 1;            // per second while standing in thicket
export const GAIA_VINE_HEAL = .005, GAIA_THICKET_HEAL = .01; // share of phase HP per second she heals on vines / thicket
export const GAIA_THICKET_ARMOR = .75;           // damage she takes while standing in thicket
export const GAIA_SCORCH_TICKS = 600;            // scorched tiles cannot regrow for 10s
export const GAIA_WARD_RADIUS = 2;               // placed Ruby keeps ground clean within this Chebyshev radius
export const GAIA_RING_RADIUS = 3;               // the ring vines must close around Ruby
export const GAIA_RING_WARN = .8;
export const GAIA_RING_DAMAGE = 3;               // per second while the ring is closed
// Sunfire (C) charges from overgrowth you clear (1 per level) and can be fired at any charge. A partial charge bursts around you at once,
// its reach and damage growing with the charge. A full charge picks a room, winds up, then burns the whole room:
// it costs you HP, and hits her hard if she is in that chamber.
export const GAIA_SUN_MAX = 100;
export const GAIA_SUN_CHARGE_RATE = 1.2;         // Sunfire charge per growth level you clear
export const GAIA_POD_CHARGE = 10;               // breaking a seed pod adds this much
export const GAIA_SUN_MIN = 10;                  // smallest charge you can fire
export const GAIA_SUN_RADIUS: [number, number] = [2, 7]; // partial burst radius in tiles, from minimum to almost full
export const GAIA_SUN_WARNING = 180;             // full charge: 3s wind-up before the chamber burns
// Meteors and full Sunfire hit her the same: a share of the current phase, ignoring her armor and thicket.
// A partial Sunfire deals that share scaled by its charge.
export const GAIA_STRIKE_DAMAGE = .1;
export const GAIA_SUN_SELF_DAMAGE = 50;          // full charge burns you and placed Ruby for this if inside the room (dodge it)
export const GAIA_STONE_COUNT = 8;
export const GAIA_STONE_SELF_DAMAGE = .05;       // a field burned by a Sunstone costs her this share of phase HP
export const GAIA_STONE_TRAVEL = 60, GAIA_STONE_RELIGHT = 60;
// Phase 3: each aimed cast adds a second field one field-width from you toward your nearest lit Sunstone, and lit
// stones hop 2 tiles in a random direction every 4s.
export const GAIA_P3_TWIN_OFFSET = 4;            // tiles between the two fields
export const GAIA_STONE_DRIFT_GAP = 240, GAIA_STONE_DRIFT_TICKS = 20, GAIA_STONE_DRIFT_STEP = 2; // every 4s, 2 tiles, random way
export const GAIA_POD_GAP: Record<1 | 2 | 3, number> = { 1: 900, 2: 1080, 3: 1080 };
export const GAIA_POD_FUSE = 480;                // 8s to burst
export const GAIA_POD_BURST_RADIUS = 3;
export const GAIA_BLOSSOM_GAP = 1200, GAIA_BLOSSOM_MAX = 3;
// Lifeblooms (help): rare in phase 1, more in phase 2, most in phase 3.
export const GAIA_LIFEBLOOM_GAP: Record<1 | 2 | 3, number> = { 1: 1500, 2: 900, 3: 360 }; // 25s, 15s, 6s
export const GAIA_LIFEBLOOM_MAX: Record<1 | 2 | 3, number> = { 1: 1, 2: 2, 3: 3 };
export const GAIA_LIFEBLOOM_HEAL = 20, GAIA_LIFEBLOOM_LIFE = 900;
export const GAIA_BLOSSOM_KILL_HEAL = 15;         // breaking a blossom heals you this much
export const GAIA_BLOSSOM_SELF_DAMAGE = .08;     // breaking a blossom costs her this share of the phase
export const GAIA_BLOSSOM_HEAL = .005;           // share of phase HP per second, per blossom
export const GAIA_BLOSSOM_SHOT_GAP = 180, GAIA_BLOSSOM_SHOT_RANGE = 7, GAIA_BLOSSOM_SHOT_DAMAGE = 4;
export const GAIA_POLLEN_SLOW_TICKS = 60, GAIA_POLLEN_SLOW = .7;
export const GAIA_SNARE_GAP = 360, GAIA_SNARE_WARNING = 60, GAIA_SNARE_DAMAGE = 6, GAIA_SNARE_ROOT = 90;
export const GAIA_SPAWN_RATE = .6, GAIA_EXTRA_ENEMIES = 3; // aliens spawn 1.7× as often here, with 3 more allowed at once
export const GAIA_ALIEN_CHANCE = .5;             // share of natural alien spawns replaced by Gaia aliens: 40% Ragecaps,
                                                 // 30% each sporelings and vine crawlers
export const GAIA_MUSHROOM_KNOCKBACK = 2;        // tiles a Ragecap's hit pushes you
export const GAIA_SPORE_TICKS = 240, GAIA_SPORE_RADIUS = 2, GAIA_SPORE_SLOW = .7;
export const GAIA_POLLEN_GAP = 2700, GAIA_POLLEN_TICKS = 480, GAIA_POLLEN_LASER = .5, GAIA_POLLEN_DRIFT_SLOW = .75; // inside the haze

export const METEORITE_CYCLE = 1800; // ticks (~30s) until next strike is chosen
export const METEORITE_WARNING = 300;  // ticks of warning (5s)
export const METEORITE_PLAYER_DMG = 75;
export const METEORITE_RUBY_DMG = 75;

// ─── BFS (re-exported for engine) ────────────────────────────────────────────
// Actual BFS lives in engine.ts; this comment is a cross-reference placeholder.

// One-use late-game rewards, starting with the tenth defeated boss.
export type SpecialSkill = 'fiery_king' | 'storm_reaper' | 'frost_warden' | 'sea_chanter' | 'blind_prayer' | 'splitter_queen' | 'thorn_weaver' | 'devourer' | 'aegis_sentinel' | 'astral_twins';
export const SPECIAL_UNLOCK_KILLS = 10;
export const SPECIAL_SKILLS = {
  devourer: { name: 'SINGULARITY', color: '#303036', bossDamage: 0, normalDamage: 0 },
  thorn_weaver: { name: "GAIA'S ROOTS", color: '#a5de65', bossDamage: 0, normalDamage: 0 },
  splitter_queen: { name: 'LUNAR ECHO', color: '#b278f3', bossDamage: 0, normalDamage: 0 },
  fiery_king: { name: 'SOLAR FLARE', color: '#ff5252', bossDamage: .1, normalDamage: 25 },
  storm_reaper: { name: 'JUPITER STORM', color: '#ffad4d', bossDamage: .3, normalDamage: 60 },
  frost_warden: { name: 'SATURN GUARD', color: '#68e0c9', bossDamage: 0, normalDamage: 0 },
  sea_chanter: { name: "NEPTUNE'S TIDE", color: '#5d9fff', bossDamage: 0, normalDamage: 0 },
  blind_prayer: { name: 'SIRIUS SURGE', color: '#ffe45c', bossDamage: 0, normalDamage: 0 },
  aegis_sentinel: { name: 'VENUS VEIL', color: '#f5dcc8', bossDamage: 0, normalDamage: 0 },
  astral_twins: { name: 'BINARY STAR', color: '#ff8f7a', bossDamage: 0, normalDamage: 0 },
} as const;
export const SPECIAL_REAPER_RADIUS = TILE_SIZE * 6;
export const BOSS_SKILL_REWARDS: Record<BossType, SpecialSkill> = {
  fiery_king: 'fiery_king', splitter_queen: 'splitter_queen', storm_reaper: 'storm_reaper',
  devourer: 'devourer', frost_warden: 'frost_warden', blind_prayer: 'blind_prayer',
  sea_chanter: 'sea_chanter', thorn_weaver: 'thorn_weaver',
  aegis_sentinel: 'aegis_sentinel', astral_twins: 'astral_twins',
};
export const SPECIAL_WARDEN_SHIELD = 40;

// Venus Veil: player/placed Ruby take reduced damage; direct attackers receive the full hit back.
export const SPECIAL_VENUS_DURATION = 600;
export const SPECIAL_VENUS_DAMAGE_MULT = .3;
export const SPECIAL_VENUS_BOSS_REFLECT_CAP = .03;

// Binary Star: a stationary mirror twin beside Ruby repeats the player's attacks at reduced damage.
export const SPECIAL_TWIN_DURATION = 900;
export const SPECIAL_TWIN_DAMAGE_MULT = .6;

export const SPECIAL_CHANTER_HEAL = 35;
export const SPECIAL_CHANTER_RADIUS = TILE_SIZE * 8;
export const SPECIAL_CHANTER_PUSH = 3;
export const SPECIAL_PRAYER_DURATION = 360;

export const SPECIAL_QUEEN_DECOY_HITS = 12;

export const SPECIAL_WEAVER_DURATION = 1800;
export const SPECIAL_WEAVER_RADIUS = TILE_SIZE * 6;
export const SPECIAL_WEAVER_SLOW = .6;
export const SPECIAL_WEAVER_NORMAL_DAMAGE = 4;
export const SPECIAL_WEAVER_BOSS_DAMAGE = .01;

export const REGULAR_ENEMY_HP_MULT = 1.1;
export const SPECIAL_SINGULARITY_RADIUS = TILE_SIZE * 5;
export const SPECIAL_SINGULARITY_TICKS = 1080;        // 18s field
export const SPECIAL_SINGULARITY_NORMAL_DAMAGE = 6;   // per second to regular aliens inside
export const SPECIAL_SINGULARITY_BOSS_DAMAGE = .015;  // share of boss max HP per second

export const SPECIAL_QUEEN_DECOY_INVULNERABILITY = 21; // .35 seconds after each connected hit
