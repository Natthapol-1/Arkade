// ─── Map ─────────────────────────────────────────────────────────────────────

export const TILE_SIZE = 48;
export const MAP_COLS = 51;
export const MAP_ROWS = 51;

// Tile types
export const T_WALL      = 0;
export const T_FLOOR     = 1;
export const T_TELEPORT  = 2;

// Chamber indices
export const CH_ALPHA = 0; // top-left
export const CH_BETA  = 1; // top-right
export const CH_GAMMA = 2; // bottom-left
export const CH_DELTA = 3; // bottom-right

// Chamber boundaries [row1, col1, row2, col2] inclusive (outer walls)
export const CHAMBER_BOUNDS = [
  [1, 1, 20, 20],   // ALPHA (TL)
  [1, 30, 20, 49],  // BETA  (TR)
  [30, 1, 49, 20],  // GAMMA (BL)
  [30, 30, 49, 49], // DELTA (BR)
] as const;

export const CHAMBER_LABELS = ['ALPHA', 'BETA', 'GAMMA', 'DELTA'];
export const CHAMBER_COLORS = ['#00d4ff', '#ff6b6b', '#00ff88', '#ffaa00'];

// Teleport pads (tileX=col, tileY=row)
export const TELEPORT_PADS: readonly [number, number][] = [
  [10, 10], // ALPHA
  [39, 10], // BETA
  [10, 39], // GAMMA
  [39, 39], // DELTA
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
  [[2,2],[10,2],[18,2],[2,10],[2,18],[19,5],[19,15],[7,19],[15,19]],
  // BETA - interior rows 2-19, cols 31-48
  [[31,2],[39,2],[47,2],[31,7],[31,15],[47,10],[35,19],[46,19]],
  // GAMMA - interior rows 31-48, cols 2-19
  [[7,31],[15,31],[2,31],[2,39],[2,47],[19,32],[19,45],[7,48],[15,48]],
  // DELTA - interior rows 31-48, cols 31-48
  [[35,31],[46,31],[31,35],[31,45],[47,39],[47,46],[35,48],[46,48]],
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
  fillFloor(31, 2, 48, 19);  // GAMMA
  fillFloor(31, 31, 48, 48); // DELTA

  // Hallways (3 tiles wide)
  fillFloor(9, 20, 11, 30);   // top horizontal  (ALPHA <-> BETA)
  fillFloor(38, 20, 40, 30);  // bottom horizontal (GAMMA <-> DELTA)
  fillFloor(20, 9, 30, 11);   // left vertical   (ALPHA <-> GAMMA)
  fillFloor(20, 38, 30, 40);  // right vertical  (BETA  <-> DELTA)

  // Teleport pads
  for (const [tx, ty] of TELEPORT_PADS) map[ty][tx] = T_TELEPORT;

  // Scatter wall cover inside chambers (2×2 blocks in corners, a few singles mid-chamber)
  const coverWalls: [number, number][] = [
    // ALPHA (interior rows 2-19, cols 2-19; teleport at col 10, row 10)
    [3,3],[4,3],[3,4],[4,4],     // upper-left
    [3,17],[4,17],[3,16],[4,16], // upper-right
    [16,3],[17,3],[16,4],[17,4], // lower-left
    [16,17],[17,17],[16,16],[17,16], // lower-right
    [7,14],[13,7],               // mid singles
    // horizontal bars
    [6,5],[6,6],[6,7],[6,8],
    [14,12],[14,13],[14,14],[14,15],[14,16],
    // vertical bar
    [6,17],[7,17],[8,17],[9,17],[10,17],
    // L-shape (left-center)
    [10,5],[11,5],[12,5],[12,6],[12,7],[12,8],
    // diagonal staircase
    [5,14],[6,15],[7,16],
    // Z-shape
    [11,12],[11,13],[12,13],[12,14],

    // BETA (interior rows 2-19, cols 31-48; teleport at col 39, row 10)
    [3,32],[4,32],[3,33],[4,33],
    [3,46],[4,46],[3,47],[4,47],
    [16,32],[17,32],[16,33],[17,33],
    [16,46],[17,46],[16,47],[17,47],
    [7,44],[13,36],
    // horizontal bars
    [6,33],[6,34],[6,35],[6,36],
    [14,40],[14,41],[14,42],[14,43],[14,44],
    // vertical bars
    [6,46],[7,46],[8,46],[9,46],
    [13,34],[14,34],[15,34],[16,34],
    // L-shape
    [9,34],[9,35],[9,36],[10,34],[11,34],
    // diagonal staircase
    [5,31],[6,32],[7,33],

    // GAMMA (interior rows 31-48, cols 2-19; teleport at col 10, row 39)
    [32,3],[33,3],[32,4],[33,4],
    [32,16],[33,16],[32,17],[33,17],
    [46,3],[47,3],[46,4],[47,4],
    [46,16],[47,16],[46,17],[47,17],
    [35,14],[43,7],
    // horizontal bars
    [34,12],[34,13],[34,14],[34,15],
    [44,5],[44,6],[44,7],[44,8],
    // L-shape from horizontal into vertical
    [45,8],[46,8],[47,8],
    // vertical bar
    [35,12],[36,12],[37,12],[38,12],
    // L-shape (center-right)
    [41,13],[42,13],[42,14],[42,15],[42,16],
    // diagonal staircase
    [34,5],[35,6],[36,7],

    // DELTA (interior rows 31-48, cols 31-48; teleport at col 39, row 39)
    [32,32],[33,32],[32,33],[33,33],
    [32,46],[33,46],[32,47],[33,47],
    [46,32],[47,32],[46,33],[47,33],
    [46,46],[47,46],[46,47],[47,47],
    [35,44],[43,36],
    // horizontal bars
    [33,40],[33,41],[33,42],[33,43],
    [44,35],[44,36],[44,37],[44,38],
    // vertical bars
    [34,35],[35,35],[36,35],[37,35],
    [36,46],[37,46],[38,46],[39,46],
    // L-shape
    [40,44],[41,44],[42,44],[42,43],[42,42],[42,41],
    // diagonal staircase
    [34,32],[35,33],[36,34],
  ];

  const hallwayZones: [number,number,number,number][] = [
    [9,20,11,30],[38,20,40,30],[20,9,30,11],[20,38,30,40],
  ];
  function inHallway(r: number, c: number) {
    return hallwayZones.some(([r1,c1,r2,c2]) => r>=r1&&r<=r2&&c>=c1&&c<=c2);
  }
  function isTeleport(r: number, c: number) {
    return TELEPORT_PADS.some(([tx,ty]) => tx===c && ty===r);
  }

  for (const [r, c] of coverWalls) {
    if (!inHallway(r,c) && !isTeleport(r,c)) map[r][c] = T_WALL;
  }

  return map;
}

// Returns which chamber index a tile belongs to (-1 if none / hallway)
export function chamberOfTile(tileX: number, tileY: number): number {
  for (let i = 0; i < CHAMBER_BOUNDS.length; i++) {
    const [r1,c1,r2,c2] = CHAMBER_BOUNDS[i];
    if (tileY >= r1 && tileY <= r2 && tileX >= c1 && tileX <= c2) return i;
  }
  return -1;
}

// ─── Enemy types ─────────────────────────────────────────────────────────────

export type EnemyType = 'normal' | 'armored' | 'fast' | 'bomber' | 'sniper';

export interface EnemyConfig {
  maxHp: number;
  speed: number;          // px per tick (at ~60 fps)
  color: string;
  shieldColor: string;
  bodyFraction: number;   // fraction of TILE_SIZE for body width
  scoreValue: number;
  damageToPlayer: number;
  damageToRuby: number;
  attackCooldown: number; // ticks between attacks when adjacent
  bombExplodeRange: number; // only for bomber
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  normal: {
    maxHp: 3, speed: 0.65, color: '#44ee44', shieldColor: '#44ee44',
    bodyFraction: 0.7, scoreValue: 10, damageToPlayer: 8, damageToRuby: 5,
    attackCooldown: 55, bombExplodeRange: 0,
  },
  armored: {
    maxHp: 6, speed: 0.45, color: '#4488ff', shieldColor: '#88bbff',
    bodyFraction: 0.82, scoreValue: 25, damageToPlayer: 12, damageToRuby: 8,
    attackCooldown: 70, bombExplodeRange: 0,
  },
  fast: {
    maxHp: 2, speed: 0.95, color: '#ff8844', shieldColor: '#ff8844',
    bodyFraction: 0.6, scoreValue: 15, damageToPlayer: 6, damageToRuby: 4,
    attackCooldown: 40, bombExplodeRange: 0,
  },
  bomber: {
    maxHp: 4, speed: 0.50, color: '#cc44ff', shieldColor: '#cc44ff',
    bodyFraction: 0.78, scoreValue: 30, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 999, bombExplodeRange: 4,
  },
  sniper: {
    maxHp: 3, speed: 0.32, color: '#ffee00', shieldColor: '#ffee00',
    bodyFraction: 0.64, scoreValue: 20, damageToPlayer: 18, damageToRuby: 14,
    attackCooldown: 130, bombExplodeRange: 0,
  },
};

export const SNIPER_ATTACK_RANGE  = 8;  // tiles — fires from this distance
export const SNIPER_WINDUP_TICKS  = 50; // telegraph before firing (~0.83s)

// ─── Difficulty tiers ────────────────────────────────────────────────────────

export interface DifficultyTier {
  spawnInterval: number;   // ticks between enemy spawns
  maxEnemies: number;
  spawnTypes: EnemyType[];
  hpMult: number;
  spawnCount: number;      // how many enemies spawn per wave
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  { spawnInterval: 180, maxEnemies: 5,  spawnTypes: ['normal'],                          hpMult: 1.0, spawnCount: 1 }, // 0  0-10s
  { spawnInterval: 150, maxEnemies: 7,  spawnTypes: ['normal'],                          hpMult: 1.0, spawnCount: 1 }, // 1  10-20s
  { spawnInterval: 120, maxEnemies: 9,  spawnTypes: ['normal', 'armored'],               hpMult: 1.0, spawnCount: 1 }, // 2  20-30s
  { spawnInterval: 100, maxEnemies: 12, spawnTypes: ['normal', 'armored', 'fast'],       hpMult: 1.2, spawnCount: 1 }, // 3  30-40s
  { spawnInterval: 80,  maxEnemies: 14, spawnTypes: ['normal', 'armored', 'fast', 'sniper'],              hpMult: 1.3, spawnCount: 2 }, // 4  40-50s
  { spawnInterval: 65,  maxEnemies: 17, spawnTypes: ['normal','armored','fast','bomber','sniper'],         hpMult: 1.5, spawnCount: 2 }, // 5  50-60s
  { spawnInterval: 50,  maxEnemies: 20, spawnTypes: ['normal','armored','fast','bomber','sniper'],         hpMult: 1.7, spawnCount: 2 }, // 6  60-70s
  { spawnInterval: 38,  maxEnemies: 25, spawnTypes: ['normal','armored','fast','bomber','sniper'],         hpMult: 2.0, spawnCount: 3 }, // 7  70s+
];

export const DIFFICULTY_RAMP_TICKS = 600; // increment difficulty level every 10 seconds

// ─── Player / Ruby ────────────────────────────────────────────────────────────

export const PLAYER_MAX_HP       = 100;
export const RUBY_MAX_HP         = 100;
export const PLAYER_BASE_SPEED   = 4.5;  // px/tick  (scaled with TILE_SIZE 48)
export const PLAYER_CARRY_MULT   = 0.4; // speed multiplier when carrying ruby
export const PLAYER_INVINCIBLE_TICKS = 90;

// ─── Abilities ────────────────────────────────────────────────────────────────

// 1. Laser beam (key J)
export const LASER_RANGE     = 8;   // tiles
export const LASER_RANGE_PWR = 14;
export const LASER_DMG       = 2;
export const LASER_DMG_PWR   = 6;
export const LASER_COOLDOWN  = 40;  // ticks (~0.67s) — frequent clicks, low damage

export const BULLET_COOLDOWN = 8;
export const BULLET_DMG      = 0.5;
export const BULLET_DMG_PWR  = 1.5;
export const BULLET_SPEED    = 0.45;

// 2. Charge wave (key K, tap 4×)
export const CHARGE_NEEDED       = 4;
export const CHARGE_DECAY_TICKS  = 110; // reset charges if gap > 110 ticks
export const WAVE_RADIUS         = 5;   // tiles
export const WAVE_RADIUS_PWR     = 9;
export const WAVE_DMG            = 5;
export const WAVE_DMG_PWR        = 12;
export const WAVE_PUSH_TILES     = 3;
export const WAVE_PUSH_TILES_PWR = 6;
export const WAVE_COOLDOWN       = 240;

// 3. Speed boost (key L)
export const SPEED_DURATION     = 120;  // ticks (~2s)
export const SPEED_DURATION_PWR = 240;
export const SPEED_MULT         = 2.2;
export const SPEED_COOLDOWN     = 360; // (6s)

// 4. Bomb (key B — place / detonate)
export const BOMB_RADIUS      = 3;   // tiles
export const BOMB_RADIUS_PWR  = 5;
export const BOMB_DMG         = 45;
export const BOMB_DMG_PWR     = 90;

// ─── Star energy ─────────────────────────────────────────────────────────────

export const STAR_ENERGY_MAX          = 100;
export const STAR_ENERGY_PER_CRYSTAL  = 40;
export const STAR_ENERGY_PER_KILL     = 5;

// ─── Resources ───────────────────────────────────────────────────────────────

export const RESOURCE_SPAWN_INTERVAL = 600; // ticks (~10s)
export const RESOURCE_MAX_ON_MAP     = 5;
export const HEAL_AMOUNT             = 30;
export const ENERGY_AMOUNT           = 38;

// ─── Ruby Core healing ────────────────────────────────────────────────────────

export const RUBY_HEAL_AMOUNT      = 4;  // HP per Space press
export const RUBY_HEAL_COOLDOWN    = 18; // ticks between heals (~0.3s)
export const RUBY_HEAL_RANGE       = 3;  // max Chebyshev distance player→ruby
export const RUBY_HEAL_CLEAR_RANGE = 6;  // no enemies within this many tiles

// ─── Meteorite ───────────────────────────────────────────────────────────────

export const METEORITE_CYCLE        = 1800; // ticks (~30s) until next strike is chosen
export const METEORITE_WARNING      = 300;  // ticks of warning (5s)
export const METEORITE_PLAYER_DMG   = 75;
export const METEORITE_RUBY_DMG     = 75;

// ─── BFS (re-exported for engine) ────────────────────────────────────────────
// Actual BFS lives in engine.ts; this comment is a cross-reference placeholder.
