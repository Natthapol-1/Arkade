/* ═══════════════════════════════════════════
   Core Breach — Types & Tunables
   ═══════════════════════════════════════════ */

export type WordKind =
  | 'normal'
  | 'shielded'
  | 'erratic'
  | 'virus'
  | 'reversed'
  | 'slow'
  | 'boost'
  | 'skipLetter'
  | 'chained'
  | 'shifting'
  | 'spawner'
  | 'vanish'
  | 'encrypted'
  | 'caseSensitive';

export const ALL_KINDS: WordKind[] = [
  'normal', 'shielded', 'reversed', 'erratic', 'virus', 'slow', 'boost', 'skipLetter', 'chained',
  'shifting', 'spawner', 'vanish', 'encrypted', 'caseSensitive',
];

/** Level at which each kind first becomes available. 'normal' is always available. */
export const KIND_UNLOCK_LEVEL: Record<WordKind, number> = {
  normal: 1,
  shielded: 2,
  reversed: 3,
  erratic: 4,
  virus: 5,
  slow: 6,
  boost: 7,
  skipLetter: 8,
  chained: 9,
  shifting: 10,
  spawner: 11,
  vanish: 12,
  encrypted: 13,
  caseSensitive: 14,
};

export const LIVES_START = 10;

// ─── Word bank, by length tier ──────────────
export const WORDS_SHORT = [
  'CAT', 'DOG', 'SUN', 'RUN', 'JUMP', 'CODE', 'BYTE', 'GAME', 'WIRE', 'CHIP',
  'DISK', 'ECHO', 'GRID', 'HACK', 'LOCK', 'NODE', 'PING', 'PORT', 'ROOT', 'SCAN',
  'SYNC', 'ZERO', 'BUG', 'KEY', 'RAM', 'LAN', 'BIT', 'NET', 'APP', 'BOX',
  'CAP', 'DEV', 'FAN', 'HUB', 'ICE', 'KIT', 'LOG', 'MAP', 'PIN', 'TAG',
  'USB', 'ZIP', 'CORE', 'DATA', 'FILE', 'LINK', 'MESH', 'PATH', 'PIXEL', 'QUERY',
];

export const WORDS_MEDIUM = [
  'ROUTER', 'SERVER', 'MEMORY', 'BUFFER', 'KERNEL', 'MATRIX', 'SIGNAL', 'MODULE',
  'BINARY', 'ENGINE', 'SOCKET', 'CIRCUIT', 'PROCESS', 'PACKET', 'GATEWAY',
  'PROTOCOL', 'DATABASE', 'CRYPTO', 'NETWORK', 'SECURITY', 'SYSTEM', 'PLATFORM',
  'COMPILER', 'FUNCTION', 'VARIABLE', 'ARGUMENT', 'STORAGE', 'WIRELESS', 'BANDWIDTH',
  'KEYBOARD', 'MONITOR', 'SHUTDOWN', 'OVERRIDE', 'SANDBOX', 'PIPELINE',
];

export const WORDS_LONG = [
  'ENCRYPTION', 'AUTHENTICATION', 'COMPRESSION', 'SYNCHRONIZE', 'INFRASTRUCTURE',
  'CONFIGURATION', 'AUTHORIZATION', 'VIRTUALIZATION', 'MICROCONTROLLER',
  'DECRYPTION', 'OPTIMIZATION', 'REPLICATION', 'CONNECTIVITY', 'TRANSMISSION',
  'CALIBRATION', 'INTERFERENCE', 'SUBROUTINE', 'PARTITION', 'TERMINAL',
];

// ─── Mixed-case words for kind === 'caseSensitive' — stored exactly as typed,
// never uppercased, unlike every other bank above. ──────────────────────
export const WORDS_CASE_SENSITIVE = [
  'aCcEsS', 'sEcUrItY', 'fIrEwAlL', 'pAsSwOrD', 'pRoToCoL', 'kErNeL',
  'oVeRrIdE', 'sIgNaL', 'bAcKdOoR', 'mAlWaRe', 'rOoTkIt', 'sAnDbOx',
  'snake_Case', 'access_Denied', 'system_Error', 'root_Access',
];

// ─── Chained word pairs — real two-word collocations, spawned together ──
export const CHAIN_PAIRS: [string, string][] = [
  ['BUG', 'DETECTED'], ['VIRUS', 'DETECTED'], ['THREAT', 'DETECTED'], ['INTRUSION', 'DETECTED'],
  ['ANOMALY', 'DETECTED'], ['ACCESS', 'DENIED'], ['ACCESS', 'GRANTED'], ['SYSTEM', 'FAILURE'],
  ['SYSTEM', 'ERROR'], ['MEMORY', 'LEAK'], ['STACK', 'OVERFLOW'], ['BUFFER', 'OVERFLOW'],
  ['NULL', 'POINTER'], ['KERNEL', 'PANIC'], ['SIGNAL', 'LOST'], ['CONNECTION', 'LOST'],
  ['PACKET', 'LOST'], ['SECURITY', 'BREACH'], ['DATA', 'BREACH'], ['FIREWALL', 'DOWN'],
  ['SERVER', 'DOWN'], ['BRUTE', 'FORCE'], ['ZERO', 'DAY'], ['BACK', 'DOOR'],
  ['ROOT', 'ACCESS'], ['SYNTAX', 'ERROR'], ['FATAL', 'ERROR'], ['CRITICAL', 'ERROR'],
  ['CORE', 'DUMP'], ['PHISHING', 'SCAM'], ['TROJAN', 'HORSE'], ['DEEP', 'FAKE'],
];

export interface KindStyle {
  label: string;
  accent: string; // hex, used for border/text accent of the falling word
  hint: string; // short rule text shown in the rules modal
}

export const KIND_STYLE: Record<WordKind, KindStyle> = {
  normal: { label: 'Normal', accent: '#00d4ff', hint: 'Type it exactly and press Enter.' },
  shielded: { label: 'Shielded', accent: '#ffaa00', hint: 'Has a shield — type it once to break the shield, type it again to destroy it.' },
  erratic: { label: 'Erratic', accent: '#cc44ff', hint: 'Drifts unpredictably as it falls. Type it exactly like any other word.' },
  virus: { label: 'Virus', accent: '#ff3366', hint: "Don't type it! Typing a virus damages your Core. Left alone, it's harmless." },
  reversed: { label: 'Reversed', accent: '#00ff88', hint: "Displayed backwards, but type it in its normal spelling, not what's shown." },
  slow: { label: 'Coolant', accent: '#bae6fd', hint: 'Destroying it temporarily slows every falling word down.' },
  boost: { label: 'Overclock', accent: '#ff8800', hint: 'Falls noticeably faster than other words — same rules, just less time to react.' },
  skipLetter: { label: 'Corrupted', accent: '#a3e635', hint: 'Safe to type — just skip the one letter highlighted in red, and type every other letter in order.' },
  chained: { label: 'Chained', accent: '#a78bfa', hint: 'Two words linked together — type both, separated by a space, to clear them (e.g. "BUG DETECTED"). Either one breaching only costs one life, but you can’t clear just one alone.' },
  shifting: { label: 'Mutating', accent: '#fb923c', hint: 'Its text completely changes every few seconds. Finish typing it before it shifts, or you have to start over on the new word.' },
  spawner: { label: 'Hydra', accent: '#2dd4bf', hint: 'Destroying it immediately spawns several 1-letter words of its own, already partway down the screen.' },
  vanish: { label: 'Phantom', accent: '#94a3b8', hint: "Visible until you type its first letter — then it vanishes. Finish typing it from memory." },
  encrypted: { label: 'Ciphered', accent: '#64748b', hint: "Falls as scrambled symbols and can't be typed yet. It decrypts into the real word once it's about halfway down." },
  caseSensitive: { label: 'CaSeD', accent: '#fde047', hint: 'Spawns in mIxEd case — you must match its capitalization exactly, unlike every other word.' },
};

// ─── Timing & scaling ──────────────────────
export const TICK_MS = 50;
export const BASE_FALL_SPEED = 6; // % of board height per second, at level 1
export const SPEED_PER_LEVEL = 0.9; // added to base speed per level
export const MAX_LEVEL_FOR_SCALING = 12; // speed/spawn scaling caps out here, kind unlocks continue

export const SPAWN_INTERVAL_BASE = 2400; // ms, level 1
export const SPAWN_INTERVAL_PER_LEVEL = 140; // ms removed per level
export const SPAWN_INTERVAL_MIN = 750;

export const SLOW_FACTOR = 0.5; // multiplies fall speed while active
export const SLOW_DURATION_MS = 6000;
export const BOOST_WORD_MULTIPLIER = 1.6; // boost words fall this much faster than everything else, always
export const CHAIN_SCORE_MULTIPLIER = 1.4; // applied to a chained pair's combined letter count on clear

export const SHIFT_INTERVAL_MS = 3500; // how often a 'shifting' word's text mutates
export const SPAWNER_CHILD_COUNT = 3; // how many 1-letter words a destroyed 'spawner' leaves behind
export const ENCRYPTED_REVEAL_Y = 35; // % down the board where an 'encrypted' word's garbled text decrypts into the real word

export const WORDS_PER_LEVEL = 4; // words destroyed (or correctly ignored) to advance a level

export const LANES = 7;

export interface SpeedEffect {
  kind: 'slow';
  expiresAt: number;
}

export interface FallingWord {
  id: string;
  text: string; // canonical word, always uppercase
  kind: WordKind;
  lane: number; // 0..LANES-1, used to keep words from overlapping at spawn
  x: number; // 0-100, percent across the board (includes erratic offset already baked in per-tick)
  baseX: number; // 0-100, the lane's home position (erratic oscillates around this)
  y: number; // 0-100, percent down the board; 100 = breach line
  spawnedAt: number;
  shieldBroken: boolean; // only meaningful for kind === 'shielded'
  skipIndex: number; // only meaningful for kind === 'skipLetter'
  erraticSeed: number; // phase offset so erratic words don't move in lockstep
  /** Shared id linking the two halves of a kind === 'chained' pair. '' for every other kind. */
  chainId: string;
  /** Absolute timestamp when a kind === 'shifting' word's text next mutates. 0 for every other kind. */
  nextShiftAt: number;
  /** Random symbol string shown pre-reveal for kind === 'encrypted'. '' for every other kind. */
  garbledText: string;
}

export type GameStatus = 'playing' | 'lost';

export interface GameState {
  words: FallingWord[];
  lives: number;
  score: number;
  level: number;
  destroyedThisLevel: number;
  status: GameStatus;
  effects: SpeedEffect[];
  lastSpawnAt: number;
  now: number;
  /** Testing aid — when true, nothing can reduce lives or end the run. See ?god=1. */
  godMode: boolean;
}

export function requiredInput(word: FallingWord): string {
  if (word.kind === 'skipLetter') {
    return word.text.slice(0, word.skipIndex) + word.text.slice(word.skipIndex + 1);
  }
  return word.text;
}

export function createInitialState(now: number, godMode = false): GameState {
  return {
    words: [],
    lives: LIVES_START,
    score: 0,
    level: 1,
    destroyedThisLevel: 0,
    status: 'playing',
    effects: [],
    lastSpawnAt: now,
    now,
    godMode,
  };
}
