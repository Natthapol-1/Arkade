// ─── Timelines ────────────────────────────────────────────────────────────────
// Internal IDs: 'gone'=past, 'went'=present, 'go'=future
// Display names: PAST / PRESENT / FUTURE
export type Timeline = 'gone' | 'went' | 'go';
export const TIMELINES: Timeline[] = ['gone', 'went', 'go'];

export interface TimelineTheme {
  id: Timeline;
  name: string;       // display label in HUD
  key: string;
  color: string;      // primary neon color
  bodyColor: string;  // obstacle body fill (very dark tint)
  character: 'ptero' | 'bird' | 'jet';
  pillarWidth: number; // visual + hitbox width — differs per timeline
}

// Colors match the project's design tokens: --danger / --success / --cyan
export const TIMELINE_THEME: Record<Timeline, TimelineTheme> = {
  gone: {
    id: 'gone',
    name: 'PAST',
    key: '1',
    color: '#FF3366',     // --danger
    bodyColor: '#0D0508',
    character: 'ptero',
    pillarWidth: 88,      // widest — massive rock/tree/mountain slabs
  },
  went: {
    id: 'went',
    name: 'PRESENT',
    key: '2',
    color: '#00FF88',     // --success
    bodyColor: '#050D08',
    character: 'bird',
    pillarWidth: 68,      // standard building/hedge width
  },
  go: {
    id: 'go',
    name: 'FUTURE',
    key: '3',
    color: '#00D4FF',     // --cyan
    bodyColor: '#05080D',
    character: 'jet',
    pillarWidth: 46,      // slim — sleek laser panels and towers
  },
};

// Convenience record for engine collision without importing full theme
export const PILLAR_WIDTHS: Record<Timeline, number> = {
  gone: 88, went: 68, go: 46,
};

// ─── Physics ──────────────────────────────────────────────────────────────────
export interface PhysicsConfig {
  gravity: number;
  flapForce: number;        // 0 = no single-tap flap (jet mode)
  maxFallSpeed: number;
  maxRiseSpeed: number;     // cap on upward velocity
  flapCooldownMs: number;
  thrustHold: boolean;
  thrustHoldForce: number;  // per frame at 60fps base
}

export const PHYSICS: Record<Timeline, PhysicsConfig> = {
  gone: {
    // Pterodactyl: huge single flap, very floaty — player taps rarely (big arc)
    gravity: 0.28,
    flapForce: -13,
    maxFallSpeed: 6,
    maxRiseSpeed: -13,
    flapCooldownMs: 720,   // long cooldown — forces slow deliberate wing beats
    thrustHold: false,
    thrustHoldForce: 0,
  },
  went: {
    // Classic bird: standard flappy feel
    gravity: 0.52,
    flapForce: -9,
    maxFallSpeed: 11,
    maxRiseSpeed: -9,
    flapCooldownMs: 110,
    thrustHold: false,
    thrustHoldForce: 0,
  },
  go: {
    // Jet: NO single tap — hold SPACE to climb, release to fall. Smooth curve.
    gravity: 0.48,
    flapForce: 0,           // disabled
    maxFallSpeed: 10,
    maxRiseSpeed: -7,
    flapCooldownMs: 99999,  // effectively never
    thrustHold: true,
    thrustHoldForce: -0.82, // per frame; net with gravity = -0.82+0.48 = -0.34 (slow climb)
  },
};

// ─── World / obstacles ────────────────────────────────────────────────────────
export const LOGICAL_H = 520;
export const HUD_H = 52;
export const PLAYER_SCREEN_X = 110;
export const PLAYER_W = 36;
export const PLAYER_H = 26;

export const GAP_SIZE = 190;
export const PILLAR_W = 88;    // = max of PILLAR_WIDTHS — used for trail/cull math
export const PILLAR_SPACING = 860;      // wide gap between obstacle sets
export const FIRST_OBSTACLE_X = 580;

export const SCROLL_SPEED_BASE = 165;
export const SCROLL_SPEED_MAX = 280;
export const SPEED_RAMP_PER_SCORE = 1.4;

export const GAP_MIN_Y = 72;
export const GAP_MAX_Y = LOGICAL_H - 72 - GAP_SIZE;

// Sentinel: gap positioned far off-screen → draws a solid wall, player always collides
export const BLOCKED_GAP_Y = LOGICAL_H + 9999;

// ─── Obstacle types ───────────────────────────────────────────────────────────
export type GoneObstacleKind  = 'rock_wall' | 'dead_tree' | 'mountain';
export type WentObstacleKind  = 'building'  | 'hedge'     | 'barrier';
export type GoObstacleKind    = 'laser_gate'| 'energy_wall'| 'tower_array';
export type ObstacleKind = GoneObstacleKind | WentObstacleKind | GoObstacleKind;

export const OBSTACLE_POOL: Record<Timeline, ObstacleKind[]> = {
  gone: ['rock_wall', 'dead_tree', 'mountain'],
  went: ['building',  'hedge',     'barrier'],
  go:   ['laser_gate','energy_wall','tower_array'],
};

// ─── Mid-field hazards ────────────────────────────────────────────────────────
export type HazardKind = 'meteor' | 'sweep_laser';
export const HAZARD_EVERY_N       = 4;     // every N obstacle sets
export const HAZARD_WARNING_MS    = 1800;
export const HAZARD_ACTIVE_MS     = 1600;
export const METEOR_FALL_SPEED    = 300;   // px/s
export const METEOR_SIZE          = 28;
export const LASER_H              = 10;

// ─── Energy ───────────────────────────────────────────────────────────────────
export const ENERGY_MAX           = 100;
export const ENERGY_DRAIN_PER_SEC = 5;
export const ENERGY_PICKUP_VALUE  = 16;    // smaller per pickup (trail has many)
export const ENERGY_PICKUP_SIZE   = 10;    // square side length
export const ENERGY_TRAIL_COUNT   = 11;   // pickups between each obstacle pair
export const ENERGY_TRAIL_AMP     = 72;   // sine wave Y amplitude

// ─── HP ───────────────────────────────────────────────────────────────────────
export const HP_MAX            = 3;
export const INVINCIBILITY_MS  = 2000;

// ─── Slow-motion ──────────────────────────────────────────────────────────────
export const SLOW_MO_FACTOR = 0.05;       // very slow — give player time to think

// ─── Ghost overlay ────────────────────────────────────────────────────────────
export const GHOST_ALPHA_NORMAL = 0.30;
export const GHOST_ALPHA_SLOWMO = 0.60;

// ─── Buffs ────────────────────────────────────────────────────────────────────
export type BuffType = 'shield' | 'score_surge' | 'energy_burst';
export const BUFF_EVERY_N_PILLARS = 6;
export const BUFF_DURATION_MS     = 5000;
export const BUFF_SIZE            = 20;

export const BUFF_META: Record<BuffType, { label: string; color: string }> = {
  shield:       { label: 'SHIELD', color: '#ffaa00' },
  score_surge:  { label: 'SURGE',  color: '#cc44ff' },
  energy_burst: { label: 'CHARGE', color: '#00ff88' },
};

export const TIMELINE_BUFF: Record<Timeline, BuffType> = {
  gone: 'shield',
  went: 'score_surge',
  go:   'energy_burst',
};

// ─── Score ────────────────────────────────────────────────────────────────────
export const SCORE_PER_PILLAR    = 1;
export const SCORE_ENERGY_COLLECT = 2;
export const SCORE_BUFF_COLLECT  = 10;
