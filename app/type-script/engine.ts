/* ═══════════════════════════════════════════
   Core Breach — Game Engine
   Pure logic: no React, no DOM, no side effects.
   ═══════════════════════════════════════════ */

import {
  ALL_KINDS, KIND_UNLOCK_LEVEL, WordKind, FallingWord, GameState, SpeedEffect,
  WORDS_SHORT, WORDS_MEDIUM, WORDS_LONG, CHAIN_PAIRS, WORDS_CASE_SENSITIVE,
  TICK_MS, BASE_FALL_SPEED, SPEED_PER_LEVEL, MAX_LEVEL_FOR_SCALING,
  SPAWN_INTERVAL_BASE, SPAWN_INTERVAL_PER_LEVEL, SPAWN_INTERVAL_MIN,
  SLOW_FACTOR, SLOW_DURATION_MS, BOOST_WORD_MULTIPLIER, CHAIN_SCORE_MULTIPLIER,
  SHIFT_INTERVAL_MS, SPAWNER_CHILD_COUNT,
  WORDS_PER_LEVEL, LANES, requiredInput,
} from './constants';

let nextId = 1;
function makeId(): string {
  return `w${nextId++}`;
}

export function spawnIntervalForLevel(level: number): number {
  const capped = Math.min(level, MAX_LEVEL_FOR_SCALING);
  return Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_BASE - (capped - 1) * SPAWN_INTERVAL_PER_LEVEL);
}

export function fallSpeedForLevel(level: number): number {
  const capped = Math.min(level, MAX_LEVEL_FOR_SCALING);
  return BASE_FALL_SPEED + (capped - 1) * SPEED_PER_LEVEL;
}

function activeSpeedMultiplier(effects: SpeedEffect[], now: number): number {
  return effects
    .filter(e => e.expiresAt > now)
    .reduce((mult) => mult * SLOW_FACTOR, 1);
}

const KIND_BASE_WEIGHT: Record<WordKind, number> = {
  normal: 6,
  shielded: 2,
  erratic: 2,
  virus: 1.5,
  reversed: 2,
  slow: 3,
  boost: 1.5,
  skipLetter: 1.5,
  chained: 1.5,
  shifting: 1.5,
  spawner: 1.2,
  vanish: 1.5,
  encrypted: 1.5,
  caseSensitive: 1.5,
};

function pickKind(level: number): WordKind {
  const unlocked = ALL_KINDS.filter(k => KIND_UNLOCK_LEVEL[k] <= level);
  const total = unlocked.reduce((sum, k) => sum + KIND_BASE_WEIGHT[k], 0);
  let roll = Math.random() * total;
  for (const k of unlocked) {
    roll -= KIND_BASE_WEIGHT[k];
    if (roll <= 0) return k;
  }
  return 'normal';
}

function poolForKind(kind: WordKind, level: number): string[] {
  if (kind === 'caseSensitive') return WORDS_CASE_SENSITIVE;

  // Word length leans longer as levels progress.
  const longChance = Math.min(0.5, 0.05 * level);
  const mediumChance = Math.min(0.6, 0.12 * level);
  const roll = Math.random();
  let pool: string[];
  if (roll < longChance) pool = WORDS_LONG;
  else if (roll < longChance + mediumChance) pool = WORDS_MEDIUM;
  else pool = WORDS_SHORT;

  if (kind === 'skipLetter') {
    // Needs enough letters that skipping one still leaves a real word to type.
    const filtered = [...WORDS_MEDIUM, ...WORDS_LONG].filter(w => w.length >= 5);
    return filtered.length > 0 ? filtered : pool;
  }
  if (pool.length === 0) return WORDS_SHORT;
  return pool;
}

function pickLane(words: FallingWord[]): number {
  const recentLanes = new Set(words.filter(w => w.y < 20).map(w => w.lane));
  const candidates = Array.from({ length: LANES }, (_, i) => i).filter(l => !recentLanes.has(l));
  const pool = candidates.length > 0 ? candidates : Array.from({ length: LANES }, (_, i) => i);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Minimum lane separation for a chained pair — any closer and the two word
// boxes (each wider than one lane's slot) visually overlap.
const MIN_CHAIN_LANE_GAP = 3;

/** Two distinct, well-separated lanes for a chained pair, ordered ascending — lane order doubles as reading order. */
function pickLanePair(words: FallingWord[]): [number, number] {
  const recentLanes = new Set(words.filter(w => w.y < 20).map(w => w.lane));
  const allLanes = Array.from({ length: LANES }, (_, i) => i);
  const candidates = allLanes.filter(l => !recentLanes.has(l));
  const pool = candidates.length >= 2 ? candidates : allLanes;

  const wideEnough: [number, number][] = [];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const [a, b] = pool[i] < pool[j] ? [pool[i], pool[j]] : [pool[j], pool[i]];
      if (b - a >= MIN_CHAIN_LANE_GAP) wideEnough.push([a, b]);
    }
  }
  if (wideEnough.length > 0) {
    return wideEnough[Math.floor(Math.random() * wideEnough.length)];
  }

  // Not enough room to satisfy the minimum gap right now — fall back to the
  // widest pair available rather than letting two words land on top of each other.
  const sorted = [...pool].sort((a, b) => a - b);
  return [sorted[0], sorted[sorted.length - 1]];
}

// Keeps lane centers well clear of the field's edges — falling words are
// centered on their x via translate(-50%), so a lane center too close to
// 0%/100% lets long words clip against `.breach-field`'s overflow:hidden.
const EDGE_MARGIN = 15;

function laneToX(lane: number): number {
  const usable = 100 - EDGE_MARGIN * 2;
  const slot = usable / LANES;
  return EDGE_MARGIN + slot * lane + slot / 2;
}

const SYMBOL_CHARS = '&%@#*$!?<>{}[]^~+=';
function randomSymbols(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += SYMBOL_CHARS[Math.floor(Math.random() * SYMBOL_CHARS.length)];
  }
  return out;
}

/** Picks a new word for a 'shifting' word to mutate into — tries to avoid repeating the current text. */
function pickShiftText(current: string): string {
  const pool = [...WORDS_SHORT, ...WORDS_MEDIUM];
  let next = current;
  for (let i = 0; i < 5 && next === current; i++) {
    next = pool[Math.floor(Math.random() * pool.length)];
  }
  return next;
}

export function spawnWord(state: GameState): GameState {
  const kind = pickKind(state.level);
  if (kind === 'chained') return spawnChainedPair(state);

  const pool = poolForKind(kind, state.level);
  const text = pool[Math.floor(Math.random() * pool.length)];
  const lane = pickLane(state.words);
  const baseX = laneToX(lane);

  const word: FallingWord = {
    id: makeId(),
    text,
    kind,
    lane,
    x: baseX,
    baseX,
    y: 0,
    spawnedAt: state.now,
    shieldBroken: false,
    skipIndex: kind === 'skipLetter' ? Math.floor(Math.random() * text.length) : -1,
    erraticSeed: Math.random() * Math.PI * 2,
    chainId: '',
    nextShiftAt: kind === 'shifting' ? state.now + SHIFT_INTERVAL_MS : 0,
    garbledText: kind === 'encrypted' ? randomSymbols(text.length) : '',
  };

  return { ...state, words: [...state.words, word], lastSpawnAt: state.now };
}

/** Spawns a linked pair of words — both halves of a CHAIN_PAIRS phrase, in reading order. */
function spawnChainedPair(state: GameState): GameState {
  const [textFirst, textSecond] = CHAIN_PAIRS[Math.floor(Math.random() * CHAIN_PAIRS.length)];
  const [laneFirst, laneSecond] = pickLanePair(state.words);
  const chainId = makeId();

  const makeHalf = (text: string, lane: number): FallingWord => ({
    id: makeId(),
    text,
    kind: 'chained',
    lane,
    x: laneToX(lane),
    baseX: laneToX(lane),
    y: 0,
    spawnedAt: state.now,
    shieldBroken: false,
    skipIndex: -1,
    erraticSeed: 0,
    chainId,
    nextShiftAt: 0,
    garbledText: '',
  });

  const pair = [makeHalf(textFirst, laneFirst), makeHalf(textSecond, laneSecond)];
  return { ...state, words: [...state.words, ...pair], lastSpawnAt: state.now };
}

/** Groups currently on-screen chained halves into ordered [first, second] pairs (sorted by lane, which doubles as reading order). Skips any orphaned single half. */
export function chainPairs(words: FallingWord[]): [FallingWord, FallingWord][] {
  const groups = new Map<string, FallingWord[]>();
  for (const w of words) {
    if (w.kind !== 'chained' || w.chainId === '') continue;
    const arr = groups.get(w.chainId) ?? [];
    arr.push(w);
    groups.set(w.chainId, arr);
  }
  const pairs: [FallingWord, FallingWord][] = [];
  for (const group of groups.values()) {
    if (group.length !== 2) continue;
    const [a, b] = [...group].sort((x, y) => x.lane - y.lane);
    pairs.push([a, b]);
  }
  return pairs;
}

/** A destroyed 'spawner' leaves behind a small swarm of 1-letter words, already at its last position. */
function spawnChildrenAt(x: number, y: number, now: number): FallingWord[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const children: FallingWord[] = [];
  for (let i = 0; i < SPAWNER_CHILD_COUNT; i++) {
    const offset = (i - (SPAWNER_CHILD_COUNT - 1) / 2) * 8;
    const cx = Math.max(EDGE_MARGIN, Math.min(100 - EDGE_MARGIN, x + offset));
    children.push({
      id: makeId(),
      text: letters[Math.floor(Math.random() * letters.length)],
      kind: 'normal',
      lane: -1, // mid-air spawn, not lane-assigned — harmless sentinel, never matches a real 0..LANES-1 lane
      x: cx,
      baseX: cx,
      y,
      spawnedAt: now,
      shieldBroken: false,
      skipIndex: -1,
      erraticSeed: 0,
      chainId: '',
      nextShiftAt: 0,
      garbledText: '',
    });
  }
  return children;
}

export interface TickResult {
  state: GameState;
  breached: FallingWord[]; // words that hit the bottom this tick (virus breaches included)
}

/** Advances all word positions by one tick, resolves breaches, expires effects, and spawns new words. */
export function tick(state: GameState, now: number): TickResult {
  if (state.status !== 'playing') return { state: { ...state, now }, breached: [] };

  const deltaMs = now - state.now;
  const baseSpeed = fallSpeedForLevel(state.level) * activeSpeedMultiplier(state.effects, now);

  const survivors: FallingWord[] = [];
  const breached: FallingWord[] = [];

  for (const w of state.words) {
    const elapsed = now - w.spawnedAt;
    const x = w.kind === 'erratic'
      ? Math.max(EDGE_MARGIN, Math.min(100 - EDGE_MARGIN, w.baseX + Math.sin(elapsed / 450 + w.erraticSeed) * 10))
      : w.baseX;
    const speed = w.kind === 'boost' ? baseSpeed * BOOST_WORD_MULTIPLIER : baseSpeed;
    const y = w.y + (speed * deltaMs) / 1000;
    if (y >= 100) {
      breached.push(w);
      continue;
    }

    if (w.kind === 'shifting' && now >= w.nextShiftAt) {
      survivors.push({ ...w, x, y, text: pickShiftText(w.text), nextShiftAt: now + SHIFT_INTERVAL_MS });
    } else {
      survivors.push({ ...w, x, y });
    }
  }

  let lives = state.lives;
  if (!state.godMode) {
    const chainLivesLost = new Set<string>();
    for (const w of breached) {
      if (w.kind === 'virus') continue;
      // A chained pair always breaches together (identical y) — only charge one life for the pair.
      if (w.kind === 'chained') {
        if (chainLivesLost.has(w.chainId)) continue;
        chainLivesLost.add(w.chainId);
      }
      lives -= 1;
    }
  }

  const effects = state.effects.filter(e => e.expiresAt > now);
  let nextState: GameState = {
    ...state,
    words: survivors,
    lives,
    effects,
    now,
    status: !state.godMode && lives <= 0 ? 'lost' : state.status,
  };

  if (nextState.status === 'playing' && now - nextState.lastSpawnAt >= spawnIntervalForLevel(nextState.level)) {
    nextState = spawnWord(nextState);
  }

  return { state: nextState, breached };
}

function scoreForWord(word: FallingWord): number {
  const multiplier: Record<WordKind, number> = {
    normal: 1, shielded: 1.6, erratic: 1.2, virus: 0, reversed: 1.2,
    slow: 1, boost: 1.2, skipLetter: 1.3,
    chained: 0, // never scored through here — chained pairs are scored together in submitInput
    shifting: 1.3, spawner: 1.1, vanish: 1.4, encrypted: 1.2, caseSensitive: 1.2,
  };
  return Math.round(word.text.length * 10 * multiplier[word.kind]);
}

export type SubmitOutcome =
  | { type: 'miss' }
  | { type: 'destroyed'; word: FallingWord }
  | { type: 'shieldHit'; word: FallingWord }
  | { type: 'virusPenalty'; word: FallingWord };

export interface SubmitResult {
  state: GameState;
  outcome: SubmitOutcome;
}

/** Resolves a submitted (Enter-confirmed) line of input against the words currently on screen. */
export function submitInput(state: GameState, rawInput: string): SubmitResult {
  const rawTrimmed = rawInput.trim();
  const input = rawTrimmed.toUpperCase();
  if (!rawTrimmed || state.status !== 'playing') {
    return { state, outcome: { type: 'miss' } };
  }

  // Chained pairs only clear as a unit — typed as "first second", space-joined.
  for (const [first, second] of chainPairs(state.words)) {
    if (`${first.text} ${second.text}` === input) {
      const words = state.words.filter(w => w.chainId !== first.chainId);
      const score = Math.round((first.text.length + second.text.length) * 10 * CHAIN_SCORE_MULTIPLIER);

      let destroyedThisLevel = state.destroyedThisLevel + 1;
      let level = state.level;
      if (destroyedThisLevel >= WORDS_PER_LEVEL) {
        level += 1;
        destroyedThisLevel = 0;
      }

      return {
        state: { ...state, words, score: state.score + score, destroyedThisLevel, level },
        outcome: { type: 'destroyed', word: first },
      };
    }
  }

  // Every other kind matches case-insensitively except 'caseSensitive', which must match verbatim.
  const matches = state.words.filter(w => {
    if (w.kind === 'chained') return false;
    if (w.kind === 'caseSensitive') return w.text === rawTrimmed;
    return requiredInput(w) === input;
  });
  if (matches.length === 0) {
    return { state, outcome: { type: 'miss' } };
  }

  // Most urgent (closest to breaching) match wins if there's a duplicate on screen.
  const target = matches.reduce((a, b) => (b.y > a.y ? b : a));

  if (target.kind === 'virus') {
    const words = state.words.filter(w => w.id !== target.id);
    const lives = state.godMode ? state.lives : Math.max(0, state.lives - 1);
    return {
      state: { ...state, words, lives, status: !state.godMode && lives <= 0 ? 'lost' : state.status },
      outcome: { type: 'virusPenalty', word: target },
    };
  }

  if (target.kind === 'shielded' && !target.shieldBroken) {
    const words = state.words.map(w => (w.id === target.id ? { ...w, shieldBroken: true } : w));
    return { state: { ...state, words }, outcome: { type: 'shieldHit', word: target } };
  }

  let words = state.words.filter(w => w.id !== target.id);
  let effects = state.effects;
  if (target.kind === 'slow') {
    effects = [...effects.filter(e => e.kind !== 'slow'), { kind: 'slow', expiresAt: state.now + SLOW_DURATION_MS }];
  } else if (target.kind === 'spawner') {
    words = [...words, ...spawnChildrenAt(target.x, target.y, state.now)];
  }

  let destroyedThisLevel = state.destroyedThisLevel + 1;
  let level = state.level;
  if (destroyedThisLevel >= WORDS_PER_LEVEL) {
    level += 1;
    destroyedThisLevel = 0;
  }

  return {
    state: { ...state, words, effects, score: state.score + scoreForWord(target), destroyedThisLevel, level },
    outcome: { type: 'destroyed', word: target },
  };
}

export { TICK_MS };
