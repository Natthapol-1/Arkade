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
  [[35, 31], [46, 31], [31, 35], [31, 45], [47, 39], [47, 46], [35, 48], [46, 48]],
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

export type EnemyType = 'normal' | 'armored' | 'fast' | 'bomber' | 'sniper' | 'healer' | 'charger' | 'ghost' | 'splitter' | 'mini_splitter' | 'shielder' | 'fiery_king' | 'splitter_queen' | 'queen_echo' | 'storm_reaper' | 'devourer' | 'frost_warden' | 'blind_prayer' | 'sea_chanter' | 'thorn_weaver';

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
    maxHp: 60, speed: 0.5, color: '#6b2fa8', shieldColor: '#b088e0',
    bodyFraction: 0.95, scoreValue: 480, damageToPlayer: 10, damageToRuby: 8,
    attackCooldown: 55, attackRange: 1, bombExplodeRange: 0,
  },
  blind_prayer: {
    maxHp: 80, speed: 2.0, color: '#ffdd22', shieldColor: '#fff199',
    bodyFraction: 1.05, scoreValue: 470, damageToPlayer: 6, damageToRuby: 0,
    attackCooldown: 720, attackRange: 6, bombExplodeRange: 0, // matches normal player WAVE_RADIUS
  },
  sea_chanter: {
    maxHp: 90, speed: 3.8, color: '#3998d6', shieldColor: '#c7e9ff',
    bodyFraction: 1.05, scoreValue: 470, damageToPlayer: 12, damageToRuby: 0,
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
} as const;
export type BossType = keyof typeof BOSS_NAMES;
export const BOSS_TYPES = Object.keys(BOSS_NAMES) as BossType[];
export function isBossType(type: EnemyType): type is BossType {
  return BOSS_TYPES.includes(type as BossType);
}
export const PRAYER_FLEE_REPATH_TICKS = 30;
export const THORN_WINDUP = 90; // locked ground target, 1.5s to leave
export const THORN_FIRST_DELAY = 120;
export const THORN_RADIUS = TILE_SIZE * 2;
// Four whole tiles per side, snapped to the nearest grid intersection.
// Shared by warning/plant rendering and actual hazard membership.
export function getThornFieldBounds(x: number, y: number) {
  const centerX=Math.round(x/TILE_SIZE)*TILE_SIZE,centerY=Math.round(y/TILE_SIZE)*TILE_SIZE;
  return {x:centerX,y:centerY,left:centerX-THORN_RADIUS,top:centerY-THORN_RADIUS,right:centerX+THORN_RADIUS,bottom:centerY+THORN_RADIUS};
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
export const SEA_DIVE_SPEED = 4.2;
export const SEA_DIVE_FLEE_RANGE = 18; // tiles, roughly one chamber wide
export const SEA_DIVE_ENTER_HP = 0.4;
export const SEA_DIVE_EXIT_HP = 0.75;
export const SEA_MINIMAP_INTERVAL = 480; // ticks: one reveal every 8 seconds
export const SEA_MINIMAP_REVEAL = 60; // ticks: visible for 1 second
export const SEA_ALLY_HEAL_RADIUS = 12; // tiles; broad circular area, not restricted to chambers
export const SEA_HEALING_DEBUFF_TICKS = 180;
export const SEA_HEALING_DEBUFF_MULTIPLIER = 0.7;
export const SEA_ALLY_HEAL_INTERVAL = 180; // 3 seconds while surfaced
export const SEA_ALLY_PASSIVE_HEAL = 3;
export const SEA_ALLY_HEAL_AMOUNT = 10; // per hit on surfaced Sea Chanter
export const SEA_FEED_HEAL_RATIO = 0.8; // actual HP damage dealt to other aliens
export const SEA_FEED_HEAL_CAP = 25; // max healing from one hit on one alien
export const SEA_SONG_WINDUP = 24;
export const SEA_SONG_FIRST_DELAY = 120;
export const SEA_SONG_SPEED = 20; // px/tick
export const SEA_SONG_HIT_RADIUS = 25; // px
export const SEA_SONG_BLAST_RADIUS = TILE_SIZE * 6;
export const SEA_SONG_BLAST_TICKS = 24;
export const SEA_SONG_BLAST_DAMAGE_CENTER = 17;
export const SEA_SONG_BLAST_DAMAGE_EDGE = 7;
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

export const CHARGER_CHARGE_SPEED = 2.45; // px/tick during charge (very fast)
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

export const DEVOURER_ATTACK_RANGE_MAX = 40; // roughly two chamber widths
export const DEVOURER_RANGE_GROWTH = 16; // normalized exponential: slow early, steep late
export const DEVOURER_ABSORB_RANGE = 5;   // tiles — how far she'll reach to consume a nearby ally
export const DEVOURER_ABSORB_COOLDOWN = 540; // ticks (~9s) between absorb attempts — reaching all 20 stacks takes ~3 minutes minimum
export const DEVOURER_MAX_STACKS = 20;  // hard cap — compounding growth makes her genuinely terrifying if left unchecked this long
export const DEVOURER_STACK_HP_PCT = 0.12; // fraction of max HP gained (and healed) per absorb
// Damage multiplier at full stacks (player 10 -> 20; Ruby 8 -> 16), scaled by
// (stacks/DEVOURER_MAX_STACKS)^2 so growth accelerates — small early on, big near the cap.
export const DEVOURER_STACK_DMG_MAX_MULT = 2;
export const DEVOURER_STACK_SPEED_PCT = 0.04; // fraction of speed lost per absorb — bigger, slower

export const FROST_CHILL_SPEED_MULT = 0.65; // player move-speed multiplier while sharing her chamber
export const FROST_CHILL_TICK_RATE = 0.5;  // LASER/BULLET/WAVE cooldowns tick down at this rate while chilled (half attack speed)
export const FROST_ICE_TILE_COUNT = 7;    // ice tiles scattered in whichever chamber she currently occupies
export const FROST_FREEZE_DURATION = 90;   // ticks (~1.5s) fully immobilized after stepping on ice
export const FROST_RELOCATE_INTERVAL = 1800; // ticks (~30s) between chamber relocations (re-scatters ice tiles)
export const FROST_SHIELD_HP = 15;   // absorb capacity of the icy shield granted per cast
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
  { spawnInterval: 80, maxEnemies: 18, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'sniper', 'healer', 'charger', 'ghost', 'shielder'], hpMult: 1.3, spawnCount: 2 }, // stage 2
  { spawnInterval: 65, maxEnemies: 21, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'bomber', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'splitter'], hpMult: 1.5, spawnCount: 2 }, // stage 3
  { spawnInterval: 50, maxEnemies: 25, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'bomber', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'splitter'], hpMult: 1.7, spawnCount: 2 }, // stage 4
  { spawnInterval: 38, maxEnemies: 31, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'bomber', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'splitter'], hpMult: 2.0, spawnCount: 3 }, // stage 5+
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

export const METEORITE_CYCLE = 1800; // ticks (~30s) until next strike is chosen
export const METEORITE_WARNING = 300;  // ticks of warning (5s)
export const METEORITE_PLAYER_DMG = 75;
export const METEORITE_RUBY_DMG = 75;

// ─── BFS (re-exported for engine) ────────────────────────────────────────────
// Actual BFS lives in engine.ts; this comment is a cross-reference placeholder.

// One-use late-game rewards, starting with the tenth defeated boss.
export type SpecialSkill = 'fiery_king' | 'storm_reaper' | 'frost_warden' | 'sea_chanter' | 'blind_prayer' | 'splitter_queen' | 'thorn_weaver' | 'devourer';
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
} as const;
export const SPECIAL_REAPER_RADIUS = TILE_SIZE * 6;
export const SPECIAL_WARDEN_SHIELD = 40;

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

export const SPECIAL_QUEEN_DECOY_INVULNERABILITY = 21; // .35 seconds after each connected hit
