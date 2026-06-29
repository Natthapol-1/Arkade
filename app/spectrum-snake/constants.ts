/* ═══════════════════════════════════════════
   Spectrum Snake — Constants & Types
   ═══════════════════════════════════════════ */

export const GRID_SIZE = 30;
export const SPEED = 150; // ms per tick
export const MAX_COLORS = 7;

export enum FoodColor {
  Green = 'green',
  Blue = 'blue',
  Red = 'red',
  Yellow = 'yellow',
  Pink = 'pink',
  Gray = 'gray',
  Purple = 'purple',
  Blank = 'blank', // no color (starting state)
}

// Ordered color list — this defines the level unlock order
export const COLOR_ORDER: FoodColor[] = [
  FoodColor.Green,
  FoodColor.Blue,
  FoodColor.Red,
  FoodColor.Yellow,
  FoodColor.Pink,
  FoodColor.Gray,
  FoodColor.Purple,
];

export interface ColorDef {
  hex: string;
  label: string;
  description: string;
}

export const COLOR_DEFS: Record<FoodColor, ColorDef> = {
  [FoodColor.Green]: {
    hex: '#4ade80',
    label: 'Green',
    description: 'Grow the snake by 2 segments',
  },
  [FoodColor.Blue]: {
    hex: '#22d3ee',
    label: 'Blue',
    description: 'Freeze the snake briefly',
  },
  [FoodColor.Red]: {
    hex: '#ef4444',
    label: 'Red',
    description: '1-time shield for collision',
  },
  [FoodColor.Yellow]: {
    hex: '#fde047',
    label: 'Yellow',
    description: 'Reveal all colors until next eat',
  },
  [FoodColor.Pink]: {
    hex: '#f9a8d4',
    label: 'Pink',
    description: 'Swap positions of 2 blocks',
  },
  [FoodColor.Gray]: {
    hex: '#94a3b8',
    label: 'Gray',
    description: 'Ghost walk (pass through body)',
  },
  [FoodColor.Purple]: {
    hex: '#7c3aed',
    label: 'Purple',
    description: 'Reverse all controls',
  },
  [FoodColor.Blank]: {
    hex: '#ffffff',
    label: 'None',
    description: 'No color — free to eat anything',
  },
};

// Effect durations (in ticks)
export const GREEN_GROWTH = 2;
export const BLUE_FREEZE = 10;
export const RED_SHIELD_USES = 1;
export const GRAY_GHOST = 70;
export const PURPLE_REVERSE = 30;
export const PINK_SWAP_DELAY = 3; // ticks before swap happens
export const PINK_REVEAL_DURATION = 13; // ticks to show swap
export const GROWTH_GLOW_DURATION = GREEN_GROWTH + 6; // ticks the green "jelly" glow plays
export const SHAKE_DURATION = 3; // ticks the shield-hit shake plays

export interface Coordinate {
  x: number;
  y: number;
}

export interface Food {
  color: FoodColor;
  coord: Coordinate;
}

export interface GameState {
  isOver: boolean;
  isStarted: boolean;
  color: FoodColor;        // current locked color
  isBlind: boolean;         // are colors hidden?
  isMatching: boolean;      // have we eaten the first of a pair?
  level: number;
  score: number;
  direction: Coordinate;
  growthRemaining: number;
  freezeDuration: number;
  hasShield: boolean;
  shieldUses: number;
  yellowToken: boolean;     // yellow was last match — next eat keeps vision
  yellowFilter: boolean;    // currently seeing all colors
  ghostWalkDuration: number;
  reverseDuration: number;
  swapCooldown: number;
  visibleFoodCoords: Coordinate[]; // temporarily revealed food (pink swap)
  growthGlowEffect: number;        // green "jelly" glow ticks remaining
  shakeEffect: number;             // shield-absorbed-hit shake ticks remaining
}

export const INITIAL_SNAKE: Coordinate[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

export function createInitialGameState(): GameState {
  return {
    isOver: true,
    isStarted: false,
    color: FoodColor.Blank,
    isBlind: false,
    isMatching: false,
    level: 0,
    score: 0,
    direction: { x: 0, y: 0 },
    growthRemaining: 0,
    freezeDuration: 0,
    hasShield: false,
    shieldUses: 0,
    yellowToken: false,
    yellowFilter: false,
    ghostWalkDuration: 0,
    reverseDuration: 0,
    swapCooldown: 0,
    visibleFoodCoords: [],
    growthGlowEffect: 0,
    shakeEffect: 0,
  };
}
