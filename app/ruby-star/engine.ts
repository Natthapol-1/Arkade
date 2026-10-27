import { createAmbientEvents, updateAmbientEvents, isEclipseActive, type AmbientEventState } from './events';
export { AMBIENT_EVENTS, STAR_FALL_TICKS, triggerAmbientEvent } from './events';
export type { AmbientEventKind } from './events';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  SpecialSkill, SPECIAL_UNLOCK_KILLS, SPECIAL_SKILLS, SPECIAL_REAPER_RADIUS, SPECIAL_WARDEN_SHIELD,
  SPECIAL_CHANTER_HEAL, SPECIAL_CHANTER_RADIUS, SPECIAL_CHANTER_PUSH, SPECIAL_PRAYER_DURATION, SPECIAL_QUEEN_DECOY_HITS, SPECIAL_QUEEN_DECOY_INVULNERABILITY,
  SPECIAL_WEAVER_DURATION, SPECIAL_WEAVER_RADIUS, SPECIAL_WEAVER_SLOW, SPECIAL_WEAVER_NORMAL_DAMAGE, SPECIAL_WEAVER_BOSS_DAMAGE,
  SPECIAL_SINGULARITY_RADIUS, REGULAR_ENEMY_HP_MULT,
  T_WALL, T_TELEPORT, T_FLOOR,
  PLAYER_START, CHAMBER_SPAWN_TILES, CHAMBER_BOUNDS, TELEPORT_PADS, HALLWAY_BOUNDS,
  chamberOfTile, hallwayOfTile,
  PLAYER_MAX_HP, RUBY_MAX_HP, PLAYER_BASE_SPEED, PLAYER_CARRY_MULT,
  LASER_RANGE, LASER_RANGE_PWR, LASER_DMG, LASER_DMG_PWR, LASER_COOLDOWN,
  CHARGE_NEEDED, CHARGE_DECAY_TICKS,
  WAVE_RADIUS, WAVE_RADIUS_PWR, WAVE_DMG, WAVE_DMG_PWR,
  WAVE_PUSH_TILES, WAVE_PUSH_TILES_PWR, WAVE_COOLDOWN,
  SPEED_DURATION, SPEED_DURATION_PWR, SPEED_MULT, SPEED_COOLDOWN,
  BOMB_RADIUS, BOMB_RADIUS_PWR, BOMB_DMG, BOMB_DMG_PWR,
  BULLET_COOLDOWN, BULLET_DMG, BULLET_DMG_PWR, BULLET_SPEED,
  STAR_ENERGY_MAX, STAR_ENERGY_PER_KILL, ENERGY_LEECH_DRAIN,
  RESOURCE_SPAWN_INTERVAL, RESOURCE_MAX_ON_MAP, HEAL_AMOUNT, ENERGY_AMOUNT,
  RUBY_HEAL_AMOUNT, RUBY_HEAL_COOLDOWN, RUBY_HEAL_RANGE, RUBY_HEAL_CLEAR_RANGE,
  METEORITE_CYCLE, METEORITE_WARNING, METEORITE_PLAYER_DMG, METEORITE_RUBY_DMG,
  SNIPER_ATTACK_RANGE, SNIPER_WINDUP_TICKS, SNIPER_CHAIN_RANGE, SNIPER_CHAIN_DMG,
  HEALER_HEAL_RADIUS, HEALER_HEAL_AMOUNT, HEALER_HEAL_INTERVAL,
  CHARGER_CHARGE_SPEED, CHARGER_WINDUP_TICKS, CHARGER_CHARGE_TILES, CHARGER_SIGHT_RANGE, CHARGER_STUN_TICKS,
  SHIELDER_SHIELD_RANGE, KILL_SHIELD_HP,
  BOSS_SPAWN_INTERVAL, BOSS_WARNING_TICKS, BOSS_METEOR_DMG, BOSS_LATE_METEOR_DMG, BOSS_ATTACK_RANGE, BOSS_FIRST_SPAWN_TIMER,
  BOSS_ANNOUNCEMENT_TICKS, BOSS_NAMES, BOSS_TYPES, BossType, isBossType, PRAYER_FLEE_REPATH_TICKS,
  PRAYER_RUBY_COOLDOWN, PRAYER_RUBY_WINDUP, PRAYER_ESCAPE_WINDUP,
  PRAYER_ESCAPE_DURATION, PRAYER_ESCAPE_SPEED, PRAYER_ESCAPE_GRACE,
  PRAYER_KNOCKBACK_SPEED,
  THORN_WINDUP, THORN_FIRST_DELAY, THORN_RADIUS, THORN_LIFETIME, THORN_MAX_PATCHES, getThornFieldBounds,
  THORN_POISON_TICKS, THORN_POISON_INTERVAL, THORN_POISON_DAMAGE, THORN_CONTACT_DAMAGE, THORN_CONTACT_INTERVAL, THORN_SLOW_MULT, THORN_FLEE_RANGE,
  SEA_DIVE_DAMAGE_MULTIPLIER, SEA_DIVE_SPEED, SEA_DIVE_FLEE_RANGE, SEA_DIVE_ENTER_HP, SEA_DIVE_EXIT_HP, SEA_MINIMAP_INTERVAL, SEA_MINIMAP_REVEAL,
  SEA_ALLY_HEAL_RADIUS, SEA_ALLY_HEAL_AMOUNT, SEA_ALLY_HEAL_INTERVAL, SEA_ALLY_PASSIVE_HEAL, SEA_HEALING_DEBUFF_TICKS, SEA_HEALING_DEBUFF_MULTIPLIER, SEA_FEED_HEAL_RATIO, SEA_FEED_HEAL_CAP,
  SEA_SONG_WINDUP, SEA_SONG_FIRST_DELAY, SEA_SONG_SPEED, SEA_SONG_HIT_RADIUS, SEA_SONG_BLAST_RADIUS, SEA_SONG_BLAST_TICKS, SEA_SONG_BLAST_DAMAGE_CENTER, SEA_SONG_BLAST_DAMAGE_EDGE,
  KING_SPEED_RAMP_PER_SEC, KING_SPEED_CAP,
  KING_UNTOUCHED_TICKS, KING_ARENA_WINDUP, KING_ARENA_DAMAGE, KING_ARENA_DAMAGE_MAX, KING_RAMP_SECONDS, KING_ARENA_FX_TICKS,
  QUEEN_PHASE_INTERVAL, QUEEN_ATTACK_RANGE, QUEEN_WINDUP_TICKS, QUEEN_PHASE_HEAL_PCT, QUEEN_PHASE_HEAL_CAP,
  REAPER_SEAL_DURATION, REAPER_SEAL_COOLDOWN,
  DEVOURER_ATTACK_RANGE_MAX, DEVOURER_RANGE_GROWTH, DEVOURER_ABSORB_RANGE, DEVOURER_ABSORB_COOLDOWN, DEVOURER_MAX_STACKS,
  DEVOURER_STACK_HP_PCT, DEVOURER_STACK_DMG_MAX_MULT, DEVOURER_STACK_SPEED_PCT,
  FROST_CHILL_SPEED_MULT, FROST_CHILL_TICK_RATE, FROST_ICE_TILE_COUNT,
  FROST_FREEZE_DURATION, FROST_RELOCATE_INTERVAL, FROST_SHIELD_HP, FROST_SHIELD_CAST_DELAY,
  DIFFICULTY_OPENING_THRESHOLDS, DIFFICULTY_TIERS,
  ENEMY_CONFIGS, EnemyType,
  generateMap,
} from './constants';

// Chamber indices are 0=ALPHA(TL), 1=BETA(TR), 2=DELTA(BL), 3=GAMMA(BR) — see constants.ts.
// Clockwise strike order: ALPHA(TL) -> BETA(TR) -> GAMMA(BR) -> DELTA(BL).
export const METEOR_CLOCKWISE_ORDER = [0, 1, 3, 2];

export const CONSTELLATIONS = {
  healing: { name: 'Ophiuchus', description: 'Manual healing recharges 20% faster.', color: '#ff9cae' },
  laser: { name: 'Lyra', description: 'Lasers deal 20% more damage.', color: '#7ee8f5' },
  speed: { name: 'Pegasus', description: 'Move 8% faster, including while carrying Ruby.', color: '#89e5c6' },
  energy: { name: 'Aquarius', description: 'Gain 20% more energy from alien kills and blue shards.', color: '#8aafff' },
  bomb: { name: 'Perseus', description: 'Bomb radius grows by one tile. Stay clear of your blast!', color: '#ffb778' },
  bullets: { name: 'Orion', description: 'Bullets deal 25% more damage.', color: '#7ecbff' },
  wave: { name: 'Draco', description: 'Waves deal 25% more damage.', color: '#bba0ff' },
  ruby: { name: 'Cassiopeia', description: 'Ruby takes 15% less damage, including hits to its shields.', color: '#ff8dbb' },
  power: { name: 'Phoenix', description: 'Powered mode lasts one extra second, including Sirius Surge.', color: '#ffd477' },
  laserRate: { name: 'Aquila', description: 'Laser cooldown is 15% shorter.', color: '#8fe7ff' },
  waveReach: { name: 'Cygnus', description: 'Waves reach one tile farther and push one extra tile.', color: '#a0c7ff' },
  bombDamage: { name: 'Scorpius', description: 'Bombs deal 20% more damage. Your own blast hurts more too.', color: '#ffa08c' },
  burstDuration: { name: 'Taurus', description: 'All speed bursts last 25% longer.', color: '#8de6b1' },
  burstRate: { name: 'Vela', description: 'Speed-burst cooldown is 20% shorter.', color: '#a0ead8' },
  waveRate: { name: 'Centaurus', description: 'Wave cooldown is 15% shorter.', color: '#d1b1ff' },
  playerGuard: { name: 'Delphinus', description: 'Take 10% less damage, including hits to your shields.', color: '#ffabbf' },
  manualHealing: { name: 'Libra', description: 'Each manual heal restores 2 extra Ruby HP and 1 extra player HP.', color: '#f6b4df' },
  killHealing: { name: 'Hercules', description: 'Ordinary alien defeats restore 2 extra player HP.', color: '#e5b48b' },
  bombRate: { name: 'Cepheus', description: 'Bomb cooldown is 20% shorter.', color: '#ffc88a' },
  laserRange: { name: 'Crux', description: 'Lasers reach two tiles farther.', color: '#9ce7ef' },
} as const;
export type Constellation = keyof typeof CONSTELLATIONS;
export const CONSTELLATION_INTERVAL = 3;

export function constellationBonus(state: GameState, kind: Constellation): number {
  return state.constellations.includes(kind) ? 1 : 0;
}

export function getBombRadius(state: GameState, powered: boolean): number {
  return (powered ? BOMB_RADIUS_PWR : BOMB_RADIUS) + constellationBonus(state, 'bomb');
}

// Extra health applies only to new regular aliens, including Splitter children.
export function constellationAlienHPMult(state: GameState): number {
  return 1 + Math.min(6, Math.floor(state.bossesKilled / CONSTELLATION_INTERVAL)) * 0.05;
}

function offerConstellation(state: GameState) {
  if (state.bossesKilled % CONSTELLATION_INTERVAL !== 0 || state.gamePhase === 'lost') return;
  const pool = (Object.keys(CONSTELLATIONS) as Constellation[]).filter(kind => !state.constellations.includes(kind));
  if (!pool.length) return;
  const choices: Constellation[] = [];
  while (choices.length < 2 && pool.length) choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  state.constellationChoices = choices;
  state.constellationDelayTicks = 60;
}

export function chooseConstellation(state: GameState, kind: Constellation): boolean {
  if (state.gamePhase !== 'constellation' || !state.constellationChoices.includes(kind) || state.constellations.includes(kind)) return false;
  state.constellations.push(kind);
  state.constellationChoices = [];
  state.playerQueuedDirX = state.playerQueuedDirY = 0;
  state.gamePhase = 'playing';
  return true;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrayerAbilities {
  rubyCooldown: number;
  rubyCastTicks: number;
  rubyDestination: number;
  rubyOriginX: number;
  rubyOriginY: number;
  escapeCooldown: number;
  escapeWindupTicks: number;
  escapeBoostTicks: number;
}

export interface KingAbilities {
  untouchedTicks: number;
  arenaWindupTicks: number;
}

export interface ThornAbilities {
  cooldown: number; windupTicks: number; aimX: number; aimY: number; fleeing: boolean;
}
export interface ThornPatch { x: number; y: number; ticks: number; ownerId: number; }

export interface SeaChanterAbilities {
  mode: 'hunting' | 'diving';
  diveElapsedTicks: number;
  diveFleeing: boolean;
  songCooldown: number;
  songWindupTicks: number;
  songAimX: number;
  songAimY: number;
  supportPulseTicks: number;
  allyHealCooldown: number;
  healPulseTicks: number;
  healSoundCooldown: number;
  resurfaceTicks: number;
  resurfaceX: number; resurfaceY: number;
}

export interface SeaSongWave {
  x: number; y: number;
  dx: number; dy: number;
  rangeLeft: number;
  aimX: number; aimY: number;
  hitPlayer: boolean;
  hitDecoy?: boolean;
  ownerId: number;
}

export interface PrayerWave {
  x: number;
  y: number;
  radius: number;
  ticks: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;   // pixel center
  y: number;
  tileX: number;
  tileY: number;
  targetTileX: number;
  targetTileY: number;
  stepProgress: number; // 0..TILE_SIZE pixels into current step
  hp: number;
  maxHp: number;
  path: [number, number][];
  pathTimer: number;   // ticks until next BFS recalc
  attackTimer: number; // ticks until next attack
  targeting: 'player' | 'ruby';
  // push state (from charge wave)
  pushDirX: number;
  pushDirY: number;
  pushTiles: number; // remaining push tiles
  flashTicks: number; // hit flash
  healFlashTicks: number; // pink heal-aura ticks (healer's pulse landed on this enemy)
  shootTicks: number; // ticks remaining for attack-laser visual
  // bomber specific
  exploding: boolean;
  explodeTick: number;
  // sniper specific
  windupTicks: number; // >0 = telegraphing before firing (charger: stun ticks)
  // charger specific
  chargeDirX: number; // locked charge direction; 0 = not charging
  chargeDirY: number;
  chargeWindupTicks?: number; // locked warning before a Charger rush; windupTicks remains its recovery
  chargeTilesLeft?: number;
  // Energy Leech: only energy actually removed from the player is stored/refunded.
  stolenEnergy?: number;
  // shielder specific
  shieldTargetId: number; // ID of ally being shielded; -1 = none
  // splitter_queen specific — countdown to her next phase-jump; unused for queen_echo (echoes are permanent)
  phaseTimer: number;
  // frost_warden specific — remaining absorb capacity of an icy shield she granted this
  // ally; damageEnemy drains this before touching real hp. 0 = no shield.
  icyShieldHP: number;
  prayer?: PrayerAbilities;
  king?: KingAbilities;
  sea?: SeaChanterAbilities;
  thorn?: ThornAbilities;
}

export interface Bomb {
  tileX: number;
  tileY: number;
  powered: boolean;
}

export interface Resource {
  tileX: number;
  tileY: number;
  type: 'health' | 'energy';
}

export interface LaserBeam {
  fromX: number; fromY: number;
  dirX: number; dirY: number;
  endX: number; endY: number;
  ticks: number;
  powered?: boolean;
  color?: string; // undefined = player cyan; set for enemy beams
}

export interface WaveEffect {
  cx: number; cy: number;
  radius: number;
  maxRadius: number;
  ticks: number;
  powered?: boolean;
}

export interface BombBlast {
  cx: number; cy: number;
  radius: number;
  maxRadius: number;
  ticks: number;
}

export interface LaserBullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  powered: boolean;
  ticks: number;
}

export interface LightningArc {
  fromX: number; fromY: number;
  toX: number; toY: number;
  ticks: number;
}

// Storm Reaper's melee strike — a crescent electric slash, not a laser beam (she's melee-only).
export interface SlashEffect {
  x: number; y: number;
  angle: number; // facing direction of the swipe
  ticks: number;
  maxTicks: number;
}

export interface DeathParticle {
  x: number; y: number;
  vx: number; vy: number;
  ticks: number;
  maxTicks: number;
  size: number;
  color: string;
}

export type GamePhase = 'playing' | 'teleporting' | 'constellation' | 'lost';

export interface RewardEffect {
  target: 'player' | 'ruby';
  kind: 'heal' | 'energy' | 'shield' | 'speed' | 'electric' | 'restore';
  ticks: number;
}

export interface GameState {
  ambientEvents: AmbientEventState;
  map: number[][];
  gameTick: number;
  gamePhase: GamePhase;
  score: number;           // time survived in seconds (fractional)
  killScore: number;
  difficultyLevel: number;
  difficultyTimer: number;

  // Player
  playerX: number;
  playerY: number;
  playerTileX: number;
  playerTileY: number;
  playerTargetX: number;
  playerTargetY: number;
  playerDirX: number;
  playerDirY: number;
  playerQueuedDirX: number;
  playerQueuedDirY: number;
  playerStepProgress: number;
  playerKnockback: { dirX: number; dirY: number; started: boolean } | null;
  playerHP: number;
  playerShieldHP: number; // Armored kill reward — absorbs damage before player HP
  playerSaturnShield: boolean;
  runnerEnergyFlashTicks: number; // orange energy reward burst after a Runner kill
  playerCarryingRuby: boolean;
  playerFrozenTicks: number; // Frost Warden ice-tile freeze — fully immobilized while > 0
  playerChilledPrev: boolean; // whether player was in a Frost Warden's chamber last tick — edge-triggers the enter-field SFX

  // Ruby
  rubyHP: number;
  rubyShieldHP: number; // Shielder kill reward — absorbs damage before core HP
  rubySaturnShield: boolean;
  rubyTileX: number;  // -1 when carried
  rubyTileY: number;
  rubyPlacedFlashTicks: number; // brief feedback after teleport auto-places a carried Ruby

  // Abilities
  laserCooldown: number;
  waveCooldown: number;
  speedCooldown: number;
  chargeCount: number;
  chargeDecayTimer: number; // ticks since last charge press
  speedActiveTicks: number; // remaining ticks of speed boost
  speedFlashTicks: number; // burst glow ticks on initial cast
  playerCastTicks: number; // cosmetic cast pose; never blocks movement or attacks
  playerCastKind: SpecialSkill | 'bomb' | null;
  bomb: Bomb | null;
  bombCooldown: number;
  bulletCooldown: number;

  // Star energy
  starEnergy: number;
  poweredTicks: number; // >0 when abilities are powered (e.g. 1.5s duration)

  // Enemies
  enemies: Enemy[];
  enemyIdCounter: number;
  spawnTimer: number;
  nextEnemyId: number;

  // Resources on map
  resources: Resource[];
  resourceTimer: number;

  // Meteorite
  meteoriteImpact: { chamber: number; ticks: number } | null;
  meteoriteTimer: number;   // countdown to next strike
  meteoriteWarning: number; // -1 = no warning; 0-3 = chamber index
  meteoriteStrikeIn: number; // ticks remaining in warning phase
  meteoriteChamberSeq: number; // index into the clockwise strike order (ALPHA->BETA->GAMMA->DELTA)

  // Storm Reaper hallway seal
  hallwaySeal: number;         // -1 = none; 0-3 = sealed hallway index (walled off)
  hallwaySealTicks: number;    // ticks remaining until the seal lifts
  hallwaySealCooldown: number; // ticks before the Reaper can seal another hallway

  // Frost Warden ice tiles — hazard tiles in whichever chamber she currently occupies
  frostIceTiles: [number, number][];

  // FX
  laserBeams: LaserBeam[];
  laserBullets: LaserBullet[];
  waveEffects: WaveEffect[];
  bombBlasts: BombBlast[];
  lightningArcs: LightningArc[];
  slashEffects: SlashEffect[];
  deathParticles: DeathParticle[];
  rewardEffects: RewardEffect[];
  prayerWaves: PrayerWave[];
  thornPatches: ThornPatch[];
  thornPoisonTicks: number;
  thornPoisonTimer: number;
  thornWasInside: boolean;
  thornContactTimer: number;
  seaSongWaves: SeaSongWave[];
  seaSongBursts: { x: number; y: number; ticks: number; ownerId: number }[];
  kingArenaPulseTicks: number;

  // Teleport
  playerChamber: number;   // -1 if in hallway
  teleportDestOptions: number[]; // which chambers can be jumped to
  teleportCooldown: number; // ticks after teleport/cancel before pad can re-trigger

  specialDevourerStacks: number;
  singularity: { x: number; y: number; ticks: number; maxTicks: number; stacks: number; pullTimer: number; damageTimer: number } | null;
  celestialField: { x: number; y: number; ticks: number; damageTimer: number } | null;
  lunarDecoy: { x: number; y: number; tileX: number; tileY: number; hitsLeft: number; maxHits: number; flashTicks: number; invulnerableTicks: number } | null;
  enemyDecoyActive: boolean;
  ascensionBannerTicks: number;
  specialSkill: SpecialSkill | null;
  specialEffects: { kind: SpecialSkill; x: number; y: number; ticks: number }[];

  // Screen shake
  screenShakeTicks: number;
  screenShakeAmt: number;

  // Ruby Core healing
  rubyHealCooldown: number;

  // God mode
  godMode: boolean;
  noBossSpawns: boolean;
  noMobs: boolean; // debug: suppress regular enemies while retaining boss-created echoes

  // Sniper kill buff — electric chain on player attacks
  electricBuffTicks: number;

  // Boss spawn system
  bossTimer: number;        // countdown to next boss spawn
  bossWarningTicks: number; // >0 while boss is about to spawn (shows warning)
  bossSpawnName: string;
  bossSpawnColor: string;
  bossSpawnTicks: number;   // remaining ticks of the post-spawn name banner
  constellations: Constellation[];
  constellationChoices: Constellation[];
  constellationDelayTicks: number;
  bossesKilled: number;     // tracks how many bosses have been killed (each +15 HP)
  bossPool: BossType[];     // natural spawns draw every boss once before reshuffling
  lastNaturalBoss: BossType | null;

  seaHealingDebuffTicks: number;
  healJiggleTicks: number;  // >0 while player jiggle animation plays after heal
}

// ─── BFS ─────────────────────────────────────────────────────────────────────

function bfs(
  map: number[][],
  fx: number, fy: number,
  tx: number, ty: number,
): [number, number][] {
  if (fx === tx && fy === ty) return [];
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
  const key = (x: number, y: number) => y * MAP_COLS + x;
  const visited = new Set<number>();
  const prev = new Map<number, number>();
  const q: [number, number][] = [[fx, fy]];
  visited.add(key(fx, fy));

  while (q.length) {
    const [cx, cy] = q.shift()!;
    if (cx === tx && cy === ty) {
      const path: [number, number][] = [];
      let k = key(cx, cy);
      while (prev.has(k)) {
        path.unshift([k % MAP_COLS, Math.floor(k / MAP_COLS)]);
        k = prev.get(k)!;
      }
      return path;
    }
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) continue;
      if (map[ny][nx] === T_WALL) continue;
      const nk = key(nx, ny);
      if (visited.has(nk)) continue;
      visited.add(nk);
      prev.set(nk, key(cx, cy));
      q.push([nx, ny]);
    }
  }
  return [];
}

// ─── Audio helpers ───────────────────────────────────────────────────────────

// Shared trim for player and enemy attack sounds, preserving their relative mix.
const ATTACK_SFX_VOLUME = 0.765;

let _actx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!_actx) _actx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}

function playTone(freq: number, dur: number, vol = 0.16, type: OscillatorType = 'square') {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  } catch { }
}

const CELESTIAL_AUDIO: Record<SpecialSkill | 'ready' | 'empty' | 'pickup' | 'solar_swoosh' | 'jupiter_shot' | 'neptune_electric', { file: string; gain: number }> = {
  neptune_electric:{file:'neptune-electric.wav',gain:.6},
  jupiter_shot:{file:'jupiter-shot.wav',gain:.75},
  solar_swoosh:{file:'solar-flare-swoosh.wav',gain:.8},
  fiery_king:{file:'solar-flare.wav',gain:.75}, storm_reaper:{file:'jupiter-storm.wav',gain:.8},
  splitter_queen:{file:'lunar-echo.wav',gain:1.1}, devourer:{file:'singularity.wav',gain:.8},
  frost_warden:{file:'saturn-guard.wav',gain:.7},sea_chanter:{file:'neptune-tide.wav',gain:.9},
  blind_prayer:{file:'sirius-surge.wav',gain:1.3},thorn_weaver:{file:'gaia-reach.wav',gain:.45},
  ready:{file:'skill-ready.wav',gain:.5},empty:{file:'empty-charge.wav',gain:.22},pickup:{file:'energy-pickup.wav',gain:.4},
};
function playCelestialSound(cue: keyof typeof CELESTIAL_AUDIO) {
  try{const clip=CELESTIAL_AUDIO[cue],sound=new Audio('/sounds/celestial/'+clip.file);sound.volume=clip.gain*ATTACK_SFX_VOLUME;sound.loop=false;sound.play().catch(()=>{});}catch{}
}

let singularityVoice: HTMLAudioElement | null = null;
export function stopSingularitySound() {
  if (!singularityVoice) return;
  singularityVoice.pause(); singularityVoice.currentTime = 0; singularityVoice = null;
}
function updateSingularitySound(state: GameState) {
  if (!state.singularity || state.gamePhase !== 'playing' || (typeof document !== 'undefined' && document.hidden)) {
    stopSingularitySound(); return;
  }
  if (singularityVoice) return;
  try {
    const clip = CELESTIAL_AUDIO.devourer;
    const voice = new Audio('/sounds/celestial/' + clip.file);
    voice.volume = clip.gain * ATTACK_SFX_VOLUME; voice.loop = true;
    singularityVoice = voice;
    voice.play().catch(() => { if (singularityVoice === voice) stopSingularitySound(); });
  } catch { stopSingularitySound(); }
}

export function playSFX_laser(volumeMultiplier = 1) {
  try {
    const a = new Audio('/sounds/laserBeam.mp3'); a.volume = 0.3045 * ATTACK_SFX_VOLUME * volumeMultiplier; a.play().catch(() => {});
  } catch { }
}

export function playSFX_laserBullet() {
  try {
    const a = new Audio('/sounds/laserBullet.mp3'); a.volume = 0.2541 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
  } catch { }
}

export function playSFX_wave() {
  try {
    const a = new Audio('/sounds/chargeWave.mp3'); a.volume = 0.768 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
    const a2 = new Audio('/sounds/chargeWave.mp3'); a2.volume = 0.768 * ATTACK_SFX_VOLUME; a2.play().catch(() => {});
  } catch { }
}

export function playSFX_alienHit() {
  try {
    const a = new Audio('/sounds/alienGetDamaged.wav'); a.volume = 0.1933155; a.play().catch(() => {});
  } catch { }
}

function playSFX_alienDeath() {
  try {
    const a = new Audio('/sounds/alienDeath.mp3'); a.volume = 0.13; a.play().catch(() => {});
  } catch { }
}

function playSFX_bossDeath() {
  try {
    const a = new Audio('/sounds/shield.mp3'); a.volume = 0.55; a.play().catch(() => {});
  } catch { }
}

function playSFX_decoyDeath() {
  try {
    const a = new Audio('/sounds/decoyDeath.mp3'); a.volume = 0.4; a.play().catch(() => {});
  } catch { }
}

function playSFX_alienShoot() {
  try {
    const a = new Audio('/sounds/alienShootLaser.wav'); a.volume = 0.2 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
  } catch { }
}

function playSFX_queenAttack() {
  try {
    const a = new Audio('/sounds/bossQueenAttack1.mp3'); a.volume = 0.765 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
    const b = new Audio('/sounds/gameModeClick.mp3'); b.volume = 0.72 * ATTACK_SFX_VOLUME; b.play().catch(() => {});
  } catch { }
}

function playSFX_bossLaser() {
  try {
    for (let i = 0; i < 3; i++) {
      const a = new Audio('/sounds/chargeWave.mp3'); a.volume = 0.855 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
    }
    const b = new Audio('/sounds/laserBeam.mp3'); b.volume = 0.45 * ATTACK_SFX_VOLUME; b.play().catch(() => {});
  } catch { }
}

export function playSFX_bomb() {
  try {
    const a = new Audio('/sounds/bombExplode.wav'); a.volume = 0.832 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
  } catch { }
}

export function playSFX_hit() {
  try {
    const a = new Audio('/sounds/hitHurt.wav'); a.volume = 0.22; a.play().catch(() => {});
  } catch { }
}

export function playSFX_pickup() { playCelestialSound('pickup'); }

function playSFX_healPickup() {
  try {
    const a = new Audio('/sounds/grow.wav'); a.volume = 0.32; a.play().catch(() => {});
  } catch { }
}

function playSFX_powerUp() {
  try {
    const a = new Audio('/sounds/powerUpBoost.mp3'); a.volume = 0.38; a.play().catch(() => {});
  } catch { }
}

export function playSFX_speed() {
  try {
    const a = new Audio('/sounds/speedBoost.mp3'); a.volume = 0.35; a.play().catch(() => {});
  } catch { }
}

let _chargeSound: HTMLAudioElement | null = null;
let _chargeHolding = false;
function getChargeSound(): HTMLAudioElement {
  if (!_chargeSound) {
    _chargeSound = new Audio('/sounds/charging.wav');
    _chargeSound.preload = 'auto';
    _chargeSound.volume = 0.85 * ATTACK_SFX_VOLUME;
  }
  return _chargeSound;
}

export function startChargeSound(chargeSeconds = 0.8) {
  try {
    if (_chargeHolding) return;
    const sound = getChargeSound();
    // Stretch one play to the charge window instead of looping into its intro.
    const duration = Number.isFinite(sound.duration) && sound.duration > 0 ? sound.duration : 26028 / 44100;
    sound.playbackRate = Math.max(0.25, Math.min(2, duration / Math.max(0.1, chargeSeconds)));
    sound.loop = false;
    sound.currentTime = 0;
    _chargeHolding = true;
    sound.play().catch(() => { _chargeHolding = false; });
  } catch { }
}

export function stopChargeSound() {
  _chargeHolding = false;
  if (!_chargeSound) return;
  _chargeSound.pause();
  _chargeSound.currentTime = 0;
  _chargeSound.loop = false;
}

export function playSFX_charge() {
  try {
    const sound = getChargeSound();
    if (sound.paused) {
      sound.loop = false; sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  } catch { }
}

function playSFX_enemyAttack() { playSFX_alienShoot(); }

function playSFX_rubyHit() {
  try {
    const a = new Audio('/sounds/shieldBreak.mp3'); a.volume = 0.42; a.play().catch(() => {});
  } catch { }
}

export function playSFX_rubyToggle() {
  try {
    const a = new Audio('/sounds/levelup.mp3'); a.volume = 0.38; a.play().catch(() => {});
  } catch { }
}

export function playSFX_teleport() {
  try {
    const sound = new Audio('/sounds/gameModeClick.mp3');
    sound.volume = 0.64;
    sound.play().catch(() => {});
  } catch { }
}

function playSFX_queenTeleport() {
  try {
    const a = new Audio('/sounds/ghostHunt2.mp3'); a.volume = 0.5; a.play().catch(() => {});
  } catch { }
}

function playSFX_reaperStrike() {
  try {
    const a = new Audio('/sounds/slash.mp3'); a.volume = 1.0 * ATTACK_SFX_VOLUME; a.play().catch(() => {}); // base file is quiet, so retain its higher mix level
    const b = new Audio('/sounds/laserBullet.mp3'); b.volume = 0.6 * ATTACK_SFX_VOLUME; b.play().catch(() => {});
  } catch { }
}

function playSFX_devourerBite() {
  try {
    const a = new Audio('/sounds/soundWaveAttack.mp3'); a.volume = 0.7 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
    const b = new Audio('/sounds/slash.mp3'); b.volume = 0.5 * ATTACK_SFX_VOLUME; b.play().catch(() => {});
  } catch { }
}

function playSFX_devourerAbsorb() {
  try {
    const a = new Audio('/sounds/reverse.mp3'); a.volume = 0.7 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
    const b = new Audio('/sounds/grow.wav'); b.volume = 0.5 * ATTACK_SFX_VOLUME; b.play().catch(() => {});
  } catch { }
}

function playSFX_hallwaySeal() {
  try {
    const a = new Audio('/sounds/shieldBreak.mp3'); a.volume = 0.6; a.play().catch(() => {});
  } catch { }
}

function playSFX_frostFreeze() {
  try {
    const a = new Audio('/sounds/freeze.mp3'); a.volume = 1.0; a.play().catch(() => {});
  } catch { }
}

function playSFX_frostFieldEnter() {
  try {
    const a = new Audio('/sounds/swap.mp3'); a.volume = 0.5; a.play().catch(() => {});
    const b = new Audio('/sounds/freeze.mp3'); b.volume = 0.5; b.play().catch(() => {});
  } catch { }
}

function playSFX_frostRelocate() {
  try {
    const a = new Audio('/sounds/ice.mp3'); a.volume = 0.5; a.play().catch(() => {});
    const b = new Audio('/sounds/slash.mp3'); b.volume = 1.0; b.play().catch(() => {});
  } catch { }
}

// No thaw.mp3 asset exists — reusing thaw.wav here instead, freed up since it moved off
// playSFX_frostRelocate above (kept the two "thaw" sounds from overlapping in meaning).
function playSFX_thaw() {
  try {
    const a = new Audio('/sounds/thaw.wav'); a.volume = 0.6; a.play().catch(() => {});
  } catch { }
}

export function playSFX_meteorite() {
  try {
    const a = new Audio('/sounds/meteorExplode.mp3'); a.volume = 0.38; a.play().catch(() => {});
  } catch { }
}

export function playSFX_meteorFalling() {
  try {
    const a = new Audio('/sounds/meteorFalling.mp3'); a.volume = 0.45; a.play().catch(() => {});
  } catch { }
}

function playSFX_meteorWarning(urgent: boolean) {
  playTone(urgent ? 1320 : 880, 0.1, 0.1, 'square');
}

export function playSFX_gameOver() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    [220, 185, 155, 110].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.2;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f;
      g.gain.setValueAtTime(0.19, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.38);
    });
  } catch { }
}

// ─── Initial state ────────────────────────────────────────────────────────────

export function createInitialState(): GameState {
  stopGaiaFieldSound();
  stopSingularitySound();
  stopPoisonSound();
  stopSeaSounds();
  stopChargeSound();
  const map = generateMap();
  const [px, py] = PLAYER_START;
  return {
    map,
    gameTick: 0,
    gamePhase: 'playing',
    ambientEvents: createAmbientEvents(),
    score: 0,
    killScore: 0,
    difficultyLevel: 0,
    difficultyTimer: 0,

    playerX: px * TILE_SIZE + TILE_SIZE / 2,
    playerY: py * TILE_SIZE + TILE_SIZE / 2,
    playerTileX: px,
    playerTileY: py,
    playerTargetX: px,
    playerTargetY: py,
    playerDirX: 1,
    playerDirY: 0,
    playerQueuedDirX: 0,
    playerQueuedDirY: 0,
    playerStepProgress: 0,
    playerKnockback: null,
    playerHP: PLAYER_MAX_HP,
    playerShieldHP: 0,
    playerSaturnShield: false,
    runnerEnergyFlashTicks: 0,
    playerCarryingRuby: false,
    playerFrozenTicks: 0,
    playerChilledPrev: false,

    rubyHP: RUBY_MAX_HP,
    rubyShieldHP: 0,
    rubySaturnShield: false,
    rubyTileX: TELEPORT_PADS[0][0],
    rubyTileY: TELEPORT_PADS[0][1],
    rubyPlacedFlashTicks: 0,

    laserCooldown: 0,
    waveCooldown: 0,
    speedCooldown: 0,
    chargeCount: 0,
    chargeDecayTimer: 0,
    speedActiveTicks: 0,
    speedFlashTicks: 0,
    playerCastTicks: 0,
    playerCastKind: null,
    bomb: null,
    bombCooldown: 0,
    bulletCooldown: 0,

    starEnergy: 0,
    poweredTicks: 0,

    enemies: [],
    enemyIdCounter: 0,
    spawnTimer: 0,
    nextEnemyId: 0,

    resources: [],
    resourceTimer: 0,

    meteoriteImpact: null,
    meteoriteTimer: METEORITE_CYCLE,
    meteoriteWarning: -1,
    meteoriteStrikeIn: 0,
    meteoriteChamberSeq: 0,

    hallwaySeal: -1,
    hallwaySealTicks: 0,
    hallwaySealCooldown: 0,

    frostIceTiles: [],

    laserBeams: [],
    laserBullets: [],
    waveEffects: [],
    bombBlasts: [],
    lightningArcs: [],
    slashEffects: [],
    deathParticles: [],
    rewardEffects: [],
    prayerWaves: [],
    thornPatches: [], thornPoisonTicks: 0, thornPoisonTimer: 0, thornWasInside: false, thornContactTimer: 0,
    seaSongWaves: [],
    seaSongBursts: [],
    kingArenaPulseTicks: 0,
    specialSkill: null, specialEffects: [], ascensionBannerTicks: 0, lunarDecoy: null, enemyDecoyActive: false, celestialField: null, specialDevourerStacks: 0, singularity: null,

    playerChamber: 0,
    teleportDestOptions: [],
    teleportCooldown: 0,

    screenShakeTicks: 0,
    screenShakeAmt: 0,

    rubyHealCooldown: 0,

    godMode: false,
    noMobs: false, noBossSpawns: false,

    electricBuffTicks: 0,

    bossTimer: BOSS_FIRST_SPAWN_TIMER,
    bossWarningTicks: 0,
    bossSpawnName: '',
    bossSpawnColor: '',
    bossSpawnTicks: 0,
    constellations: [],
    constellationChoices: [],
    constellationDelayTicks: 0,
    bossesKilled: 0,
    bossPool: [],
    lastNaturalBoss: null,
    healJiggleTicks: 0,
    seaHealingDebuffTicks: 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tileDist(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function tileEuclidDist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function isFloorTile(map: number[][], tx: number, ty: number) {
  if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) return false;
  return map[ty][tx] !== T_WALL;
}

function damageLunarDecoy(state: GameState, amount: number) {
  const decoy=state.lunarDecoy;if(!decoy || amount<=0 || decoy.invulnerableTicks>0)return;
  decoy.hitsLeft=Math.max(0,decoy.hitsLeft-1);decoy.flashTicks=8;decoy.invulnerableTicks=SPECIAL_QUEEN_DECOY_INVULNERABILITY;
  if(decoy.hitsLeft<=0){
    for(let i=0;i<12;i++)state.deathParticles.push({x:decoy.x,y:decoy.y,vx:Math.cos(i*Math.PI/6)*2,vy:Math.sin(i*Math.PI/6)*2,ticks:24,maxTicks:24,size:3,color:i%2?'#cc88ff':'#e5d4ff'});
    state.lunarDecoy=null;state.enemies.forEach(e=>e.pathTimer=0);playSFX_decoyDeath();
  }
}

function damagePlayer(state: GameState, amount: number) {
  if(state.enemyDecoyActive){damageLunarDecoy(state,amount);return;}
  if (state.godMode) return;
  amount *= state.constellations.includes('playerGuard') ? 0.9 : 1;
  const absorbed = Math.min(state.playerShieldHP, amount);
  state.playerShieldHP -= absorbed;
  if(state.playerShieldHP<=0)state.playerSaturnShield=false;
  amount -= absorbed;
  if (absorbed > 0) showRewardEffect(state, 'player', 'shield');
  if (amount <= 0) return;
  state.playerHP = Math.max(0, state.playerHP - amount);
  playSFX_hit();
  if (state.playerHP <= 0) endGame(state);
}

function damageRuby(state: GameState, amount: number) {
  if (state.godMode) return;
  if (state.rubyTileX === -1) return; // carried — ruby not vulnerable
  amount *= 1 - 0.15 * constellationBonus(state, 'ruby');
  const absorbed = Math.min(state.rubyShieldHP, amount);
  state.rubyShieldHP -= absorbed;
  if(state.rubyShieldHP<=0)state.rubySaturnShield=false;
  amount -= absorbed;
  if (absorbed > 0) showRewardEffect(state, 'ruby', 'shield');
  if (amount <= 0) return;
  state.rubyHP = Math.max(0, state.rubyHP - amount);
  playSFX_rubyHit();
  if (state.rubyHP <= 0) endGame(state);
}

function damageEnemy(state: GameState, e: Enemy, amount: number, source: 'player' | 'meteor' | 'enemy' | 'special' = 'player') {
  const wasSeaHunting = e.type === 'sea_chanter' && !isSeaChanterDiving(e);
  const previousHP = e.hp;
  const shielded = state.enemies.some(s => s.type === 'shielder' && s.shieldTargetId === e.id);
  let actual = shielded ? amount / 2 : amount;

  // Frost Warden's icy shield absorbs damage outright (a real HP pool, not a %-reduction
  // like the shielder's) — drains first, any overflow past its remaining capacity spills to hp.
  if (e.icyShieldHP > 0) {
    const absorbed = Math.min(e.icyShieldHP, actual);
    e.icyShieldHP -= absorbed;
    actual -= absorbed;
  }

  // Underwater vulnerability boosts HP damage after shields absorb their share.
  if (isSeaChanterDiving(e)) actual *= SEA_DIVE_DAMAGE_MULTIPLIER;
  e.hp -= actual;
  const hpLost = Math.min(Math.max(0, previousHP), Math.max(0, actual));
  if (source === 'player' && hpLost > 0) {
    if (wasSeaHunting && e.hp > 0) {
      healSeaAllies(state, e, SEA_ALLY_HEAL_AMOUNT);
    } else if (!isBossType(e.type) && e.type !== 'queen_echo') {
      for (const chanter of state.enemies) {
        if (!isSeaChanterDiving(chanter) || chanter.hp <= 0) continue;
        chanter.hp = Math.min(chanter.maxHp, chanter.hp + Math.min(SEA_FEED_HEAL_CAP, hpLost * SEA_FEED_HEAL_RATIO));
        chanter.sea!.healPulseTicks = 24;
        playSeaHealing(chanter);
        updateSeaMode(chanter);
      }
    }
  }
  if (e.type === 'sea_chanter' && e.hp > 0) updateSeaMode(e);
  if (e.type === 'fiery_king' && actual > 0) {
    e.king = { untouchedTicks: 0, arenaWindupTicks: 0 };
  }
  e.flashTicks = 10;
}

// Called after a player attack hits `hitEnemy` — if electric buff is active,
// chain lightning to up to 2 nearby enemies.
function chainElectric(state: GameState, hitEnemy: Enemy, bombProtected?: Set<number>) {
  if (state.electricBuffTicks <= 0) return;
  const targets = state.enemies
    .filter(a => a !== hitEnemy && tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, a.tileX, a.tileY) <= SNIPER_CHAIN_RANGE)
    .sort((a, b) => tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, a.tileX, a.tileY) - tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, b.tileX, b.tileY))
    .slice(0, 2);
  for (const t of targets) {
    state.lightningArcs.push({ fromX: hitEnemy.x, fromY: hitEnemy.y, toX: t.x, toY: t.y, ticks: 22 });
    const damage = bombProtected?.has(t.id) ? Math.min(SNIPER_CHAIN_DMG, t.icyShieldHP) : SNIPER_CHAIN_DMG;
    if (damage > 0) damageEnemy(state, t, damage);
  }
}

function endGame(state: GameState) {
  stopGaiaFieldSound();
  stopSingularitySound();
  stopSeaSounds();
  state.gamePhase = 'lost';
  playSFX_gameOver();
}

// ─── Spawn ────────────────────────────────────────────────────────────────────

function spawnEnemy(state: GameState) {
  const tier = DIFFICULTY_TIERS[Math.min(state.difficultyLevel, DIFFICULTY_TIERS.length - 1)];
  if (state.enemies.length >= tier.maxEnemies) return;

  // Pick a chamber far from player or near ruby depending on tension
  const chambers = [0, 1, 2, 3];
  // Weight chambers: prefer ones with player or ruby
  const _playerCh = state.playerChamber; void _playerCh;

  const eligibleSpawns: [number, number][] = [];
  for (const ch of chambers) {
    for (const [tx, ty] of CHAMBER_SPAWN_TILES[ch]) {
      // Don't spawn right on top of player
      if (Math.abs(tx - state.playerTileX) + Math.abs(ty - state.playerTileY) > 6) {
        eligibleSpawns.push([tx, ty]);
      }
    }
  }
  if (!eligibleSpawns.length) return;

  const spawnCount = Math.min(tier.spawnCount, tier.maxEnemies - state.enemies.length);
  for (let s = 0; s < spawnCount; s++) {
    const idx = Math.floor(Math.random() * eligibleSpawns.length);
    const [tx, ty] = eligibleSpawns[idx];

    const typeIdx = Math.floor(Math.random() * tier.spawnTypes.length);
    const type: EnemyType = tier.spawnTypes[typeIdx];
    const cfg = ENEMY_CONFIGS[type];
    const hpScaled = Math.ceil(cfg.maxHp * tier.hpMult) * REGULAR_ENEMY_HP_MULT * constellationAlienHPMult(state);

    const enemy: Enemy = {
      id: state.nextEnemyId++,
      type,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      tileX: tx, tileY: ty,
      targetTileX: tx, targetTileY: ty,
      stepProgress: 0,
      hp: hpScaled, maxHp: hpScaled,
      path: [], pathTimer: Math.floor(Math.random() * 30),
      attackTimer: 0,
      targeting: 'player',
      pushDirX: 0, pushDirY: 0, pushTiles: 0,
      flashTicks: 0,
      healFlashTicks: 0,
      shootTicks: 0,
      exploding: false, explodeTick: 0,
      windupTicks: 0,
      chargeDirX: 0, chargeDirY: 0,
      shieldTargetId: -1,
      phaseTimer: 0,
      icyShieldHP: 0,
    };
    state.enemies.push(enemy);
  }
}

// ─── Resource spawning ────────────────────────────────────────────────────────

function spawnResource(state: GameState) {
  if (state.resources.length >= RESOURCE_MAX_ON_MAP) return;
  // Pick random floor tile not occupied by player, ruby, or existing resource
  const candidates: [number, number][] = [];
  for (let ty = 0; ty < MAP_ROWS; ty++) {
    for (let tx = 0; tx < MAP_COLS; tx++) {
      if (state.map[ty][tx] === T_WALL) continue;
      if (tx === state.playerTileX && ty === state.playerTileY) continue;
      if (tx === state.rubyTileX && ty === state.rubyTileY) continue;
      if (state.resources.some(r => r.tileX === tx && r.tileY === ty)) continue;
      candidates.push([tx, ty]);
    }
  }
  if (!candidates.length) return;
  const [tx, ty] = candidates[Math.floor(Math.random() * candidates.length)];
  const type = Math.random() < 0.5 ? 'health' : 'energy';
  state.resources.push({ tileX: tx, tileY: ty, type });
}

// ─── Line of sight (Bresenham) ───────────────────────────────────────────────

function hasLineOfSight(map: number[][], x1: number, y1: number, x2: number, y2: number): boolean {
  let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy, cx = x1, cy = y1;
  while (true) {
    if ((cx !== x1 || cy !== y1) && map[cy]?.[cx] === T_WALL) return false;
    if (cx === x2 && cy === y2) return true;
    const e2 = err * 2;
    const prevCx = cx, prevCy = cy;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx)  { err += dx; cy += sy; }
    
    // If we moved diagonally, prevent seeing through solid corners
    if (cx !== prevCx && cy !== prevCy) {
      if (map[prevCy]?.[cx] === T_WALL || map[cy]?.[prevCx] === T_WALL) return false;
    }
  }
}

function fireSniperLaser(state: GameState, e: Enemy) {
  const tgtX = e.targeting === 'player' ? state.playerX : state.rubyTileX * TILE_SIZE + TILE_SIZE / 2;
  const tgtY = e.targeting === 'player' ? state.playerY : state.rubyTileY * TILE_SIZE + TILE_SIZE / 2;
  state.laserBeams.push({ fromX: e.x, fromY: e.y, dirX: 0, dirY: 0, endX: tgtX, endY: tgtY, ticks: 22, color: '#ff3300' });
  if (e.targeting === 'player') {
    damagePlayer(state, ENEMY_CONFIGS.sniper.damageToPlayer);
  } else if (state.rubyTileX !== -1) {
    damageRuby(state, ENEMY_CONFIGS.sniper.damageToRuby);
  }
  e.shootTicks = 22;
  e.attackTimer = ENEMY_CONFIGS.sniper.attackCooldown;
  playSFX_laser(0.85);
}

function fireQueenBolt(state: GameState, e: Enemy, tgtX: number, tgtY: number, targetIsPlayer: boolean) {
  const cfg = ENEMY_CONFIGS[e.type as 'splitter_queen' | 'queen_echo'];
  state.laserBeams.push({ fromX: e.x, fromY: e.y, dirX: 0, dirY: 0, endX: tgtX, endY: tgtY, ticks: 20, color: cfg.color });
  if (targetIsPlayer) damagePlayer(state, cfg.damageToPlayer);
  else if (state.rubyTileX !== -1) damageRuby(state, cfg.damageToRuby);
  e.shootTicks = 20;
  e.attackTimer = cfg.attackCooldown;
  playSFX_queenAttack();
}

// Walls off (or reopens) every tile in a hallway — hallways are pure floor by construction
// (no cover-walls or teleport pads inside them), so this is always a clean, reversible swap.
// Walls off only the two end-caps of a hallway (like a portcullis dropping at each mouth),
// not the whole corridor — sealing every tile would strand whoever's inside with zero
// adjacent floor tiles, freezing them in place instead of trapping them in a fightable space.
function setHallwayWalled(state: GameState, hallwayIdx: number, walled: boolean) {
  if (hallwayIdx < 0) return;
  const [r1, c1, r2, c2] = HALLWAY_BOUNDS[hallwayIdx];
  const horizontal = (c2 - c1) > (r2 - r1);
  if (horizontal) {
    for (let r = r1; r <= r2; r++) {
      state.map[r][c1] = walled ? T_WALL : T_FLOOR;
      state.map[r][c2] = walled ? T_WALL : T_FLOOR;
    }
  } else {
    for (let c = c1; c <= c2; c++) {
      state.map[r1][c] = walled ? T_WALL : T_FLOOR;
      state.map[r2][c] = walled ? T_WALL : T_FLOOR;
    }
  }
}

// Whether the player currently shares a chamber with a living Frost Warden — drives both
// the movement slow and the attack-speed slow, computed fresh each tick rather than stored.
export function isPlayerChilled(state: GameState): boolean {
  const playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);
  if (playerChamber === -1) return false;
  return state.enemies.some(e => e.type === 'frost_warden' && chamberOfTile(e.tileX, e.tileY) === playerChamber);
}

// Scatters FROST_ICE_TILE_COUNT ice tiles across the given chamber's spawn-tile pool —
// reuses CHAMBER_SPAWN_TILES as a ready-made set of valid, non-wall interior floor tiles.
function scatterFrostIceTiles(state: GameState, chamberIdx: number) {
  // Any floor tile in the chamber interior qualifies — not just the perimeter spawn-point
  // pool (CHAMBER_SPAWN_TILES), which is why ice used to only ever appear near the edges.
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamberIdx];
  const candidates: [number, number][] = [];
  for (let ty = r1; ty <= r2; ty++) {
    for (let tx = c1; tx <= c2; tx++) {
      if (state.map[ty][tx] === T_FLOOR) candidates.push([tx, ty]);
    }
  }
  state.frostIceTiles = [];
  for (let i = 0; i < FROST_ICE_TILE_COUNT && candidates.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    state.frostIceTiles.push(candidates[idx]);
    candidates.splice(idx, 1);
  }
}

// Teleports the Frost Warden to a different chamber and re-scatters her ice tiles there.
function relocateFrostWarden(state: GameState, e: Enemy) {
  const curChamber = chamberOfTile(e.tileX, e.tileY);
  const others = [0, 1, 2, 3].filter(ch => ch !== curChamber);
  const nextChamber = others[Math.floor(Math.random() * others.length)];
  const pool = CHAMBER_SPAWN_TILES[nextChamber];
  const [tx, ty] = pool[Math.floor(Math.random() * pool.length)];
  e.tileX = tx; e.tileY = ty; e.targetTileX = tx; e.targetTileY = ty;
  e.x = tx * TILE_SIZE + TILE_SIZE / 2; e.y = ty * TILE_SIZE + TILE_SIZE / 2;
  e.stepProgress = 0;
  e.phaseTimer = FROST_RELOCATE_INTERVAL;
  scatterFrostIceTiles(state, nextChamber);

  // Doesn't grant the shield immediately — windupTicks (unused otherwise for this type)
  // counts down to when she fires the ice-laser shield cast, FROST_SHIELD_CAST_DELAY after
  // settling into the new chamber.
  e.windupTicks = FROST_SHIELD_CAST_DELAY;

  playSFX_frostRelocate();
}

// Fires an ice-laser at one random ally sharing her chamber, granting them an icy shield
// (absorbs FROST_SHIELD_HP damage) — her support role for the grunts defending alongside her.
function castFrostShield(state: GameState, e: Enemy) {
  const chamber = chamberOfTile(e.tileX, e.tileY);
  const alliesHere = state.enemies.filter(a =>
    a !== e && !isBossType(a.type) && a.type !== 'queen_echo' &&
    chamberOfTile(a.tileX, a.tileY) === chamber
  );
  if (alliesHere.length === 0) return;
  // Spread protection before refreshing an ally that still has an active ice shield.
  const unshielded = alliesHere.filter(a => (a.icyShieldHP ?? 0) <= 0);
  const candidates = unshielded.length > 0 ? unshielded : alliesHere;
  const ally = candidates[Math.floor(Math.random() * candidates.length)];
  ally.icyShieldHP = FROST_SHIELD_HP;
  e.shootTicks = 20; // Animate the caster only when a shield actually fires.
  state.laserBeams.push({
    fromX: e.x, fromY: e.y, dirX: 0, dirY: 0,
    endX: ally.x, endY: ally.y, ticks: 30, color: '#aaeeff',
  });
  try { const a = new Audio('/sounds/ice.mp3'); a.volume = 0.6 * ATTACK_SFX_VOLUME; a.play().catch(() => {}); } catch { }
}

// Teleports the Queen to a spawn tile in a different chamber (weighted toward whichever
// is farthest from the player), leaving a decaying 1-HP echo at her old position.
function phaseQueenJump(state: GameState, e: Enemy) {
  const curChamber = chamberOfTile(e.tileX, e.tileY);
  const playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);

  state.enemies.push({
    id: state.nextEnemyId++, type: 'queen_echo',
    x: e.x, y: e.y, tileX: e.tileX, tileY: e.tileY, targetTileX: e.tileX, targetTileY: e.tileY,
    stepProgress: 0, hp: 1, maxHp: 1,
    path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
    pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0,
    shootTicks: 0, exploding: false, explodeTick: 0,
    windupTicks: 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1,
    phaseTimer: 0, // unused for echoes — they persist until killed, not on a timer
    icyShieldHP: 0,
  });

  // Never land in the chamber she just left, or the one the player is currently standing in
  const others = [0, 1, 2, 3].filter(ch => ch !== curChamber && ch !== playerChamber);
  others.sort((a, b) => {
    const da = tileEuclidDist(state.playerTileX, state.playerTileY, TELEPORT_PADS[a][0], TELEPORT_PADS[a][1]);
    const db = tileEuclidDist(state.playerTileX, state.playerTileY, TELEPORT_PADS[b][0], TELEPORT_PADS[b][1]);
    return db - da; // farthest-from-player first
  });
  const nextChamber = Math.random() < 0.65 ? others[0] : others[Math.floor(Math.random() * others.length)];

  const pool = CHAMBER_SPAWN_TILES[nextChamber];
  const [tx, ty] = pool[Math.floor(Math.random() * pool.length)];
  e.tileX = tx; e.tileY = ty; e.targetTileX = tx; e.targetTileY = ty;
  e.x = tx * TILE_SIZE + TILE_SIZE / 2; e.y = ty * TILE_SIZE + TILE_SIZE / 2;
  e.stepProgress = 0;
  e.phaseTimer = QUEEN_PHASE_INTERVAL;
  e.windupTicks = 0;
  e.attackTimer = 0;

  // Each jump heals her a small amount — rewards ignoring her in favor of the decoys.
  if (e.hp < e.maxHp) {
    e.hp = Math.min(e.maxHp, e.hp + Math.min(QUEEN_PHASE_HEAL_CAP, Math.max(1, Math.round(e.maxHp * QUEEN_PHASE_HEAL_PCT))));
    e.healFlashTicks = 20;
  }

  playSFX_queenTeleport();
}

// ─── Enemy update ────────────────────────────────────────────────────────────

export function isMovementReversed(state: GameState): boolean {
  return state.enemies.some(e => e.type === 'blind_prayer' && e.hp > 0);
}

type SeaSound = 'dive' | 'attack' | 'heal' | 'singing' | 'diveSinging';
const seaVoices: Partial<Record<SeaSound, HTMLAudioElement>> = {};
function stopSeaSound(cue: SeaSound) {
  const voice = seaVoices[cue];
  if (voice) { voice.pause(); voice.ontimeupdate = null; delete seaVoices[cue]; }
}
function stopSeaSounds() { for (const cue of Object.keys(seaVoices) as SeaSound[]) stopSeaSound(cue); }
function playSeaSound(cue: SeaSound) {
  try {
    stopSeaSound(cue);
    const mix = { diveSinging: ['seaSinging4.mp3', 0.32], dive: ['seaDive.mp3', 0.28], attack: ['seaSong.mp3', 0.30], heal: ['seaHeal.mp3', 0.52], singing: ['seaSinging.mp3', 0.58] } as const;
    const [file, gain] = mix[cue];
    const voice = new Audio('/sounds/' + file);
    voice.volume = Number(gain) * ATTACK_SFX_VOLUME;
    if (cue === 'singing') voice.playbackRate = 1; // full natural note overlaps the faster wave launch
    if (cue === 'heal') {
      // The supplied healing clip is 10 seconds; use a short, fading cue without stacking.
      voice.ontimeupdate = () => {
        voice.volume = Number(gain) * ATTACK_SFX_VOLUME * Math.max(0, Math.min(1, (1.6 - voice.currentTime) / 0.5));
        if (voice.currentTime >= 1.6) stopSeaSound('heal');
      };
    }
    voice.onended = () => { if (seaVoices[cue] === voice) delete seaVoices[cue]; };
    seaVoices[cue] = voice; voice.play().catch(() => {});
  } catch { }
}
function playSeaHealing(e: Enemy) {
  const sea = e.sea;
  if (!sea || sea.healSoundCooldown > 0) return;
  sea.healSoundCooldown = 180; playSeaSound('heal');
}

export function isSeaChanterDiving(enemy: Enemy): boolean {
  return enemy.type === 'sea_chanter' && enemy.sea?.mode === 'diving';
}

export function isEnemyVisibleOnMinimap(enemy: Enemy): boolean {
  if (!isSeaChanterDiving(enemy)) return true;
  const phase = (enemy.sea?.diveElapsedTicks ?? 0) % SEA_MINIMAP_INTERVAL;
  return phase >= SEA_MINIMAP_INTERVAL - SEA_MINIMAP_REVEAL;
}

function createThornAbilities(): ThornAbilities {
  return { cooldown: THORN_FIRST_DELAY, windupTicks: 0, aimX: 0, aimY: 0, fleeing: false };
}
function clearThornHazards(state: GameState) {
  stopPoisonSound();
  state.thornPatches = []; state.thornPoisonTicks = 0; state.thornPoisonTimer = 0; state.thornWasInside = false; state.thornContactTimer = 0;
}
let poisonVoice: HTMLAudioElement | null = null;
let poisonSoundGap = 0;
export function stopPoisonSound() {
  if (poisonVoice) { poisonVoice.onended = null; poisonVoice.pause(); poisonVoice.currentTime = 0; poisonVoice = null; }
  poisonSoundGap = 0;
}
function updatePoisonSound(state: GameState) {
  if (state.gamePhase !== 'playing' || state.thornPoisonTicks <= 0 || (typeof document !== 'undefined' && document.hidden)) { stopPoisonSound(); return; }
  if (poisonVoice) return;
  if (poisonSoundGap > 0) { poisonSoundGap--; return; }
  try {
    const voice = new Audio('/sounds/poisoned.wav');
    voice.volume = .28 * ATTACK_SFX_VOLUME; voice.loop = false;
    voice.onended = () => {
      if (poisonVoice !== voice) return;
      poisonVoice = null; poisonSoundGap = 36; // A 0.6-second gap at 60 ticks/sec.
    };
    poisonVoice = voice;
    voice.play().catch(() => { if (poisonVoice === voice) { poisonVoice = null; poisonSoundGap = 60; } });
  } catch { poisonVoice = null; poisonSoundGap = 60; }
}

function playThornCut() {
  try { const sound = new Audio('/sounds/cut.mp3'); sound.volume = 0.95 * ATTACK_SFX_VOLUME; sound.play().catch(() => {}); } catch { }
}
function applyThornPoison(state: GameState) {
  state.thornPoisonTicks = THORN_POISON_TICKS;
  if (state.thornPoisonTimer <= 0) state.thornPoisonTimer = THORN_POISON_INTERVAL;
}
export function isPlayerInThorns(state: GameState): boolean {
  if (!isFloorTile(state.map, Math.floor(state.playerX / TILE_SIZE), Math.floor(state.playerY / TILE_SIZE))) return false;
  return (state.thornPatches ?? []).some(p => p.ticks > 0 && isPlayerInThornField(state,p.x,p.y));
}
function isPlayerInThornField(state: GameState,x: number,y: number): boolean {
  const bounds=getThornFieldBounds(x,y);
  return isFloorTile(state.map,Math.floor(state.playerX/TILE_SIZE),Math.floor(state.playerY/TILE_SIZE)) &&
    state.playerX>=bounds.left&&state.playerX<bounds.right&&state.playerY>=bounds.top&&state.playerY<bounds.bottom;
}
function updateThornWeaver(state: GameState, e: Enemy) {
  if (e.hp <= 0) return;
  const thorn = e.thorn ??= createThornAbilities();
  if (thorn.windupTicks > 0) {
    if (--thorn.windupTicks === 0) {
      (state.thornPatches ??= []).push({ x: thorn.aimX, y: thorn.aimY, ticks: THORN_LIFETIME, ownerId: e.id });
      if (state.thornPatches.length > THORN_MAX_PATCHES) state.thornPatches.shift();
      if (isPlayerInThornField(state,thorn.aimX,thorn.aimY)) {
        damagePlayer(state, ENEMY_CONFIGS.thorn_weaver.damageToPlayer); applyThornPoison(state);
        playThornCut();
        state.thornWasInside = true; // The eruption already played this entry's cut cue.
        state.thornContactTimer = THORN_CONTACT_INTERVAL;
      }
      e.shootTicks = 14; thorn.cooldown = ENEMY_CONFIGS.thorn_weaver.attackCooldown;
      try { const sound = new Audio('/sounds/place-plant.mp3'); sound.volume = 0.4 * ATTACK_SFX_VOLUME; sound.play().catch(() => {}); } catch { }
    }
  } else if (thorn.cooldown > 0) thorn.cooldown--;
  else {
    // Global ground targeting: cover and distance cannot cancel the attack; leaving the marked area can.
    const aim=getThornFieldBounds(state.playerX,state.playerY);
    thorn.aimX = aim.x; thorn.aimY = aim.y; thorn.windupTicks = THORN_WINDUP;
    try {
      const sound = new Audio('/sounds/charging.wav'); sound.volume = 0.55 * ATTACK_SFX_VOLUME;
      sound.playbackRate = (26028 / 44100) / 0.8; sound.loop = false;
      sound.play().catch(() => {});
    } catch { }
  }
  e.pathTimer--;
  if (e.pathTimer <= 0) {
    const threatened = tileEuclidDist(e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY) <= THORN_FLEE_RANGE;
    if (threatened) e.path = fleePath(state, e);
    else if (thorn.fleeing || e.path.length === 0) e.path = roamPath(state, e);
    thorn.fleeing = threatened; e.pathTimer = 30;
  }
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    const next = e.path.shift();
    if (next && isFloorTile(state.map, next[0], next[1])) { [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0; }
  } else {
    e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + ENEMY_CONFIGS.thorn_weaver.speed * celestialMoveMultiplier(state,e));
    e.x = (e.tileX + 0.5) * TILE_SIZE + (e.targetTileX - e.tileX) * e.stepProgress;
    e.y = (e.tileY + 0.5) * TILE_SIZE + (e.targetTileY - e.tileY) * e.stepProgress;
    if (e.stepProgress === TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
  }
}
function updateThornHazards(state: GameState) {
  state.thornPatches ??= [];
  if (!state.enemies.some(e => e.type === 'thorn_weaver' && e.hp > 0)) { clearThornHazards(state); return; }
  state.thornPatches = state.thornPatches.filter(p => --p.ticks > 0 && state.enemies.some(e => e.id === p.ownerId && e.hp > 0));
  const inside = isPlayerInThorns(state);
  if (inside) {
    if (!state.thornWasInside) { playThornCut(); state.thornContactTimer = THORN_CONTACT_INTERVAL; }
    applyThornPoison(state);
    if (--state.thornContactTimer <= 0) {
      damagePlayer(state, THORN_CONTACT_DAMAGE); playThornCut();
      state.thornContactTimer = THORN_CONTACT_INTERVAL;
    }
  } else state.thornContactTimer = 0;
  state.thornWasInside = inside;
  if (state.thornPoisonTicks > 0) {
    state.thornPoisonTicks--;
    if (--state.thornPoisonTimer <= 0) {
      damagePlayer(state, THORN_POISON_DAMAGE); state.thornPoisonTimer = THORN_POISON_INTERVAL;
    }
  } else state.thornPoisonTimer = 0;
}

function createSeaChanterAbilities(): SeaChanterAbilities {
  return { mode: 'hunting', diveElapsedTicks: 0, diveFleeing: false, songCooldown: SEA_SONG_FIRST_DELAY, songWindupTicks: 0,
    songAimX: 0, songAimY: 0, allyHealCooldown: SEA_ALLY_HEAL_INTERVAL, supportPulseTicks: 0, healPulseTicks: 0, healSoundCooldown: 0, resurfaceTicks: 0, resurfaceX: 0, resurfaceY: 0 };
}

function updateSeaMode(e: Enemy) {
  const sea = e.sea ??= createSeaChanterAbilities();
  if (sea.mode === 'hunting' && e.hp <= e.maxHp * SEA_DIVE_ENTER_HP) {
    sea.mode = 'diving'; sea.diveElapsedTicks = 0; sea.diveFleeing = false; sea.songWindupTicks = 0; sea.resurfaceTicks = 0;
    playSeaSound('dive'); playSeaSound('diveSinging'); e.pathTimer = 0; e.path = [];
  } else if (sea.mode === 'diving' && e.hp >= e.maxHp * SEA_DIVE_EXIT_HP) {
    sea.mode = 'hunting'; sea.songCooldown = SEA_SONG_FIRST_DELAY;
    sea.allyHealCooldown = SEA_ALLY_HEAL_INTERVAL;
    sea.resurfaceTicks = 36; sea.resurfaceX = e.x; sea.resurfaceY = e.y;
    stopSeaSound('diveSinging');
    sea.songWindupTicks = 0; e.pathTimer = 0; e.path = [];
  }
}

function roamPath(state: GameState, e: Enemy): [number, number][] {
  const candidates: [number, number][] = [];
  // Short wandering routes keep her swimming around instead of selecting the farthest map corner.
  for (let y = Math.max(0, e.targetTileY - 10); y <= Math.min(state.map.length - 1, e.targetTileY + 10); y++) {
    for (let x = Math.max(0, e.targetTileX - 10); x <= Math.min(state.map[0].length - 1, e.targetTileX + 10); x++) {
      const distance = tileEuclidDist(e.targetTileX, e.targetTileY, x, y);
      if (distance < 4 || distance > 10 || !isFloorTile(state.map, x, y)) continue;
      const openSides = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => isFloorTile(state.map, x + dx, y + dy)).length;
      if (openSides >= 3) candidates.push([x, y]);
    }
  }
  // Try other destinations if a temporary hallway seal makes one unreachable.
  while (candidates.length > 0) {
    const [destination] = candidates.splice(Math.floor(Math.random() * candidates.length), 1);
    const path = bfs(state.map, e.targetTileX, e.targetTileY, destination[0], destination[1]);
    if (path.length > 0) return path;
  }
  return [];
}

function healSeaAllies(state: GameState, e: Enemy, amount: number) {
  let healed = false;
  for (const ally of state.enemies) {
    if (isBossType(ally.type) || ally.type === 'queen_echo' || ally.hp <= 0 ||
        tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY) > SEA_ALLY_HEAL_RADIUS) continue;
    const before = ally.hp;
    ally.hp = Math.min(ally.maxHp, ally.hp + amount);
    if (ally.hp > before) { ally.healFlashTicks = 20; healed = true; }
  }
  if (healed) {
    (e.sea ??= createSeaChanterAbilities()).supportPulseTicks = 24;
    playSeaHealing(e);
  }
}

function updateSeaChanter(state: GameState, e: Enemy) {
  if (e.hp <= 0) return;
  const sea = e.sea ??= createSeaChanterAbilities();
  updateSeaMode(e);
  if (sea.resurfaceTicks > 0) sea.resurfaceTicks--;
  if (sea.supportPulseTicks > 0) sea.supportPulseTicks--;
  if (sea.healPulseTicks > 0) sea.healPulseTicks--;
  if (sea.healSoundCooldown > 0) sea.healSoundCooldown--;
  if (sea.songCooldown > 0) sea.songCooldown--;
  if (sea.mode === 'hunting') {
    sea.allyHealCooldown = (sea.allyHealCooldown ?? SEA_ALLY_HEAL_INTERVAL) - 1;
    if (sea.allyHealCooldown <= 0) {
      sea.supportPulseTicks = 24;
      healSeaAllies(state, e, SEA_ALLY_PASSIVE_HEAL);
      if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= SEA_ALLY_HEAL_RADIUS) {
        state.seaHealingDebuffTicks = SEA_HEALING_DEBUFF_TICKS;
        playSeaHealing(e);
      }
      sea.allyHealCooldown = SEA_ALLY_HEAL_INTERVAL;
    }
  }
  if (sea.mode === 'diving') {
    sea.diveElapsedTicks = (sea.diveElapsedTicks ?? 0) + 1;
    updateSeaMode(e);
  } else if (sea.songWindupTicks > 0) {
    sea.songWindupTicks--;
    if (sea.songWindupTicks === 0) {
      const dx = sea.songAimX - e.x, dy = sea.songAimY - e.y;
      const length = Math.hypot(dx, dy) || 1;
      (state.seaSongWaves ??= []).push({ x: e.x, y: e.y, dx: dx / length, dy: dy / length,
        rangeLeft: length, aimX: sea.songAimX, aimY: sea.songAimY, hitPlayer: false, ownerId: e.id });
      e.shootTicks = 24;
      playSeaSound('attack');
      sea.songCooldown = ENEMY_CONFIGS.sea_chanter.attackCooldown;
    }
  } else if (sea.songCooldown === 0 && e.tileX === e.targetTileX && e.tileY === e.targetTileY &&
      tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= ENEMY_CONFIGS.sea_chanter.attackRange) {
    sea.songAimX = state.playerX; sea.songAimY = state.playerY;
    sea.songWindupTicks = SEA_SONG_WINDUP;
    playSeaSound('singing');
  }
  // Singing is a stationary, telegraphed ranged attack. Diving never deals damage.
  if (sea.songWindupTicks > 0) return;
  e.pathTimer--;
  if (e.pathTimer <= 0) {
    if (sea.mode === 'diving') {
      const threatened = tileEuclidDist(e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY) <= SEA_DIVE_FLEE_RANGE;
      if (threatened) e.path = fleePath(state, e);
      else if (sea.diveFleeing || e.path.length === 0) e.path = roamPath(state, e);
      sea.diveFleeing = threatened;
    } else {
      e.path = bfs(state.map, e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY);
    }
    e.pathTimer = 20;
  }
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    const next = e.path.shift();
    if (next && isFloorTile(state.map, next[0], next[1])) {
      [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0;
    }
  } else {
    const speed = isSeaChanterDiving(e) ? SEA_DIVE_SPEED : ENEMY_CONFIGS.sea_chanter.speed;
    e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + speed * celestialMoveMultiplier(state,e));
    e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + (e.targetTileX - e.tileX) * e.stepProgress;
    e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + (e.targetTileY - e.tileY) * e.stepProgress;
    if (e.stepProgress === TILE_SIZE) {
      e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0;
    }
  }
}

function updateSeaSongWaves(state: GameState) {
  const bursts = state.seaSongBursts ??= [];
  for (let i = bursts.length - 1; i >= 0; i--) {
    if (--bursts[i].ticks <= 0 || !state.enemies.some(e => e.id === bursts[i].ownerId && e.hp > 0)) bursts.splice(i, 1);
  }
  const waves = state.seaSongWaves ??= [];
  for (let i = waves.length - 1; i >= 0; i--) {
    const wave = waves[i];
    let remove = !state.enemies.some(e => e.id === wave.ownerId && e.hp > 0);
    // Substeps preserve player collision at the faster speed; water magic passes through walls.
    for (let distance = 0; distance < SEA_SONG_SPEED && !remove; distance += 4) {
      const step = Math.min(4, SEA_SONG_SPEED - distance, wave.rangeLeft);
      wave.x += wave.dx * step; wave.y += wave.dy * step; wave.rangeLeft -= step;
      const decoy=state.lunarDecoy;
      if(decoy && !wave.hitDecoy && Math.hypot(wave.aimX-decoy.x,wave.aimY-decoy.y)>SEA_SONG_HIT_RADIUS && Math.hypot(wave.x-decoy.x,wave.y-decoy.y)<=SEA_SONG_HIT_RADIUS){
        damageLunarDecoy(state,ENEMY_CONFIGS.sea_chanter.damageToPlayer);wave.hitDecoy=true;
      }
      if (!wave.hitPlayer && Math.hypot(wave.aimX - state.playerX, wave.aimY - state.playerY) > SEA_SONG_HIT_RADIUS &&
          Math.hypot(wave.x - state.playerX, wave.y - state.playerY) <= SEA_SONG_HIT_RADIUS) {
        damagePlayer(state, ENEMY_CONFIGS.sea_chanter.damageToPlayer); wave.hitPlayer = true;
      }
      if (wave.rangeLeft <= 0) {
        bursts.push({ x: wave.aimX, y: wave.aimY, ticks: SEA_SONG_BLAST_TICKS, ownerId: wave.ownerId });
        const decoy=state.lunarDecoy;
        if(decoy && !wave.hitDecoy){
          const d=Math.hypot(wave.aimX-decoy.x,wave.aimY-decoy.y);
          if(d<=SEA_SONG_BLAST_RADIUS)damageLunarDecoy(state,Math.round(SEA_SONG_BLAST_DAMAGE_CENTER-(SEA_SONG_BLAST_DAMAGE_CENTER-SEA_SONG_BLAST_DAMAGE_EDGE)*d/SEA_SONG_BLAST_RADIUS));
        }
        const blastDistance = Math.hypot(wave.aimX - state.playerX, wave.aimY - state.playerY);
        if (!wave.hitPlayer && blastDistance <= SEA_SONG_BLAST_RADIUS) {
          const damage = Math.round(SEA_SONG_BLAST_DAMAGE_CENTER -
            (SEA_SONG_BLAST_DAMAGE_CENTER - SEA_SONG_BLAST_DAMAGE_EDGE) * blastDistance / SEA_SONG_BLAST_RADIUS);
          damagePlayer(state, damage);
        }
        remove = true;
      }
    }
    if (remove) waves.splice(i, 1);
  }
}

function createPrayerAbilities(): PrayerAbilities {
  return {
    rubyCooldown: PRAYER_RUBY_COOLDOWN, rubyCastTicks: 0, rubyDestination: -1,
    rubyOriginX: -1, rubyOriginY: -1,
    escapeCooldown: PRAYER_ESCAPE_GRACE, escapeWindupTicks: 0, escapeBoostTicks: 0,
  };
}

function playSFX_kingArenaFire(warning: boolean) {
  // A soft warning followed by the supplied fire-spell cue on the arena pulse.
  try {
    const sound = new Audio(warning ? '/sounds/kingFireWarning.wav' : '/sounds/kingFireSpell.mp3');
    sound.volume = (warning ? 0.38 : 0.605) * ATTACK_SFX_VOLUME;
    sound.play().catch(() => {});
  } catch { }
}

function updateKingArenaAttack(state: GameState, e: Enemy) {
  if (e.hp <= 0) return;
  const ability = e.king ??= { untouchedTicks: 0, arenaWindupTicks: 0 };
  if (ability.arenaWindupTicks > 0) {
    ability.arenaWindupTicks--;
    if (ability.arenaWindupTicks === 0) {
      const progress = Math.min(1, e.phaseTimer / (KING_RAMP_SECONDS * 60));
      const damage = KING_ARENA_DAMAGE + Math.floor((KING_ARENA_DAMAGE_MAX - KING_ARENA_DAMAGE) * progress);
      const targetingDecoy=state.enemyDecoyActive;state.enemyDecoyActive=false;
      damagePlayer(state, damage);damageLunarDecoy(state,damage);
      state.enemyDecoyActive=targetingDecoy;
      damageRuby(state, damage);
      state.kingArenaPulseTicks = KING_ARENA_FX_TICKS;
      state.screenShakeTicks = Math.max(state.screenShakeTicks, 10);
      state.screenShakeAmt = Math.max(state.screenShakeAmt, 3);
      playSFX_kingArenaFire(false);
      ability.untouchedTicks = 0;
    }
  } else {
    ability.untouchedTicks++;
    if (ability.untouchedTicks >= KING_UNTOUCHED_TICKS) {
      ability.arenaWindupTicks = KING_ARENA_WINDUP;
      playSFX_kingArenaFire(true);
    }
  }
}

function playPrayerSound(path: string, volume: number) {
  try { const sound = new Audio(path); sound.volume = volume; sound.play().catch(() => {}); } catch { }
}

function prayerBurst(state: GameState, x: number, y: number) {
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    state.deathParticles.push({
      x, y, vx: Math.cos(angle) * 2.4, vy: Math.sin(angle) * 2.4,
      ticks: 24, maxTicks: 24, size: 3, color: i % 3 ? '#ffdd22' : '#ffffff',
    });
  }
}

function updatePrayerAbilities(state: GameState, e: Enemy) {
  const ability = e.prayer ??= createPrayerAbilities();
  const cfg = ENEMY_CONFIGS.blind_prayer;
  if (ability.escapeBoostTicks > 0) ability.escapeBoostTicks--;
  if (ability.escapeCooldown > 0) ability.escapeCooldown--;
  const inAttackRange = () => tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= cfg.attackRange &&
    hasLineOfSight(state.map, e.tileX, e.tileY, state.playerTileX, state.playerTileY);
  if (ability.escapeWindupTicks > 0) {
    ability.escapeWindupTicks--;
    if (ability.escapeWindupTicks === 0) {
      (state.prayerWaves ??= []).push({ x: e.x, y: e.y, radius: cfg.attackRange * TILE_SIZE, ticks: 30 });
      if (inAttackRange()) {
        playSFX_laser();
        damagePlayer(state, cfg.damageToPlayer);
        if (state.gamePhase !== 'lost' && !state.enemyDecoyActive) {
          const dx = state.playerX - e.x, dy = state.playerY - e.y;
          state.playerKnockback = {
            dirX: Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) || 1 : 0,
            dirY: Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0,
            started: false,
          };
        }
        state.laserBeams.push({ fromX: e.x, fromY: e.y, dirX: 0, dirY: 0,
          endX: state.playerX, endY: state.playerY, ticks: 18, color: '#ffdd22' });
      }
      e.shootTicks = 14; // Brief body pulse synchronized with the escape wave.
      ability.escapeBoostTicks = PRAYER_ESCAPE_DURATION;
      ability.escapeCooldown = cfg.attackCooldown;
      e.pathTimer = 0;
      prayerBurst(state, e.x, e.y);
      playPrayerSound('/sounds/holy2.mp3', 1.0);
    }
  } else if (ability.escapeCooldown === 0 && inAttackRange()) {
    ability.escapeWindupTicks = PRAYER_ESCAPE_WINDUP;
  }

  // Carrying or moving the core cancels the cast and grants a full preparation window.
  if (state.rubyTileX === -1 || (ability.rubyCastTicks > 0 &&
      (state.rubyTileX !== ability.rubyOriginX || state.rubyTileY !== ability.rubyOriginY))) {
    ability.rubyCooldown = PRAYER_RUBY_COOLDOWN;
    ability.rubyCastTicks = 0;
    ability.rubyDestination = -1;
    return;
  }
  if (ability.rubyCooldown > 0) ability.rubyCooldown--;
  if (ability.rubyCastTicks > 0) {
    ability.rubyCastTicks--;
    if (ability.rubyCastTicks === 0) {
      const destination = ability.rubyDestination;
      // Never deliver the Ruby into an active meteor warning, even if it began mid-cast.
      if (destination >= 0 && destination !== state.meteoriteWarning) {
        prayerBurst(state, state.rubyTileX * TILE_SIZE + TILE_SIZE / 2, state.rubyTileY * TILE_SIZE + TILE_SIZE / 2);
        [state.rubyTileX, state.rubyTileY] = TELEPORT_PADS[destination];
        prayerBurst(state, state.rubyTileX * TILE_SIZE + TILE_SIZE / 2, state.rubyTileY * TILE_SIZE + TILE_SIZE / 2);
        showRewardEffect(state, 'ruby', 'restore');
      }
      ability.rubyDestination = -1;
    }
  } else if (ability.rubyCooldown === 0) {
    const current = chamberOfTile(state.rubyTileX, state.rubyTileY);
    const options = [0, 1, 2, 3].filter(ch => ch !== current && ch !== state.meteoriteWarning);
    ability.rubyDestination = options[Math.floor(Math.random() * options.length)];
    ability.rubyOriginX = state.rubyTileX; ability.rubyOriginY = state.rubyTileY;
    ability.rubyCastTicks = PRAYER_RUBY_WINDUP;
    ability.rubyCooldown = PRAYER_RUBY_COOLDOWN;
    playPrayerSound('/sounds/holy1.mp3', 1.0);
  }
}

function fleePath(state: GameState, e: Enemy): [number, number][] {
  const cols = state.map[0].length;
  const size = cols * state.map.length;
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function explore(x: number, y: number) {
    const distances = new Int32Array(size).fill(-1);
    const parents = new Int32Array(size).fill(-1);
    const start = y * cols + x;
    const queue = [start];
    distances[start] = 0;
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      for (const [dx, dy] of directions) {
        const nx = current % cols + dx, ny = Math.floor(current / cols) + dy;
        if (!isFloorTile(state.map, nx, ny)) continue;
        const next = ny * cols + nx;
        if (distances[next] !== -1) continue;
        distances[next] = distances[current] + 1;
        parents[next] = current;
        queue.push(next);
      }
    }
    return { distances, parents, queue, start };
  }
  // Walking distance accounts for cover walls and corridors, rather than trying to
  // run straight through walls. Re-plan from the tile the current step will reach.
  const threat = explore(state.playerTileX, state.playerTileY);
  const escape = explore(e.targetTileX, e.targetTileY);
  let best = escape.start;
  let bestScore = threat.distances[best];
  for (const tile of escape.queue) {
    if (threat.distances[tile] < 0) continue;
    const score = threat.distances[tile] - escape.distances[tile] * 0.15;
    if (score > bestScore) { best = tile; bestScore = score; }
  }
  const path: [number, number][] = [];
  while (best !== escape.start && best !== -1) {
    path.push([best % cols, Math.floor(best / cols)]);
    best = escape.parents[best];
  }
  return path.reverse();
}

function updateSingularity(state: GameState) {
  const field=state.singularity;if(!field){stopSingularitySound();return;}
  if(--field.ticks<=0){state.singularity=null;stopSingularitySound();return;}
  updateSingularitySound(state);
  field.pullTimer--;field.damageTimer--;
  const targets=state.enemies.filter(e=>{
    const tx=Math.floor(e.x/TILE_SIZE),ty=Math.floor(e.y/TILE_SIZE);
    return e.hp>0&&isFloorTile(state.map,tx,ty)&&Math.hypot((tx+.5)*TILE_SIZE-field.x,(ty+.5)*TILE_SIZE-field.y)<=SPECIAL_SINGULARITY_RADIUS;
  });
  if(field.pullTimer<=0){
    field.pullTimer=15;const pullBoss=(field.maxTicks-field.ticks)%30===0;
    for(const enemy of targets){
      if(enemy.pushTiles>0||isBossType(enemy.type)&&!pullBoss)continue;
      const tx=Math.floor(field.x/TILE_SIZE),ty=Math.floor(field.y/TILE_SIZE),dx=tx-enemy.tileX,dy=ty-enemy.tileY;
      if(!dx&&!dy)continue;
      const choices=Math.abs(dx)>=Math.abs(dy)?[[Math.sign(dx),0],[0,Math.sign(dy)]]:[[0,Math.sign(dy)],[Math.sign(dx),0]];
      const step=choices.find(([x,y])=>(x||y)&&isFloorTile(state.map,enemy.tileX+x,enemy.tileY+y));
      if(step){enemy.pushDirX=step[0];enemy.pushDirY=step[1];enemy.pushTiles=1;}
    }
  }
  if(field.damageTimer<=0){
    field.damageTimer=60;
    const strength=(field.stacks/DEVOURER_MAX_STACKS)**2;
    for(const enemy of targets)damageEnemy(state,enemy,isBossType(enemy.type)?enemy.maxHp*(.003+strength*.017):1.5+strength*6.5,'special');
    for(const enemy of targets){const index=state.enemies.indexOf(enemy);if(index>=0&&enemy.hp<=0)killEnemy(state,index);}
  }
}

function inCelestialField(state: GameState, e: Enemy): boolean {
  const field=state.celestialField;
  if(!field||field.ticks<=0)return false;
  const tx=Math.floor(e.x/TILE_SIZE),ty=Math.floor(e.y/TILE_SIZE);
  return isFloorTile(state.map,tx,ty)&&tx>=(field.x-SPECIAL_WEAVER_RADIUS)/TILE_SIZE&&tx<(field.x+SPECIAL_WEAVER_RADIUS)/TILE_SIZE&&ty>=(field.y-SPECIAL_WEAVER_RADIUS)/TILE_SIZE&&ty<(field.y+SPECIAL_WEAVER_RADIUS)/TILE_SIZE;
}
function celestialMoveMultiplier(state: GameState, e: Enemy): number { return inCelestialField(state,e)?SPECIAL_WEAVER_SLOW:1; }
let gaiaFieldVoice: HTMLAudioElement | null = null;
export function stopGaiaFieldSound() {
  if (!gaiaFieldVoice) return;
  gaiaFieldVoice.pause(); gaiaFieldVoice.currentTime = 0; gaiaFieldVoice = null;
}
function updateGaiaFieldSound(state: GameState) {
  if (state.gamePhase !== 'playing' || !state.celestialField ||
      (typeof document !== 'undefined' && document.hidden) ||
      !state.enemies.some(enemy => enemy.hp > 0 && inCelestialField(state, enemy))) {
    stopGaiaFieldSound(); return;
  }
  if (gaiaFieldVoice) return;
  try {
    const voice = new Audio('/sounds/celestial/gaia-field-click.wav');
    voice.volume = .4 * ATTACK_SFX_VOLUME; voice.loop = true;
    gaiaFieldVoice = voice;
    voice.play().catch(() => { if (gaiaFieldVoice === voice) stopGaiaFieldSound(); });
  } catch { stopGaiaFieldSound(); }
}
function updateCelestialField(state: GameState) {
  const field=state.celestialField;if(!field){stopGaiaFieldSound();return;}
  if(--field.ticks<=0){state.celestialField=null;stopGaiaFieldSound();return;}
  updateGaiaFieldSound(state);
  if(--field.damageTimer>0)return;
  field.damageTimer=60;
  const targets=state.enemies.filter(e=>e.hp>0&&inCelestialField(state,e));
  for(const target of targets)damageEnemy(state,target,isBossType(target.type)?target.maxHp*SPECIAL_WEAVER_BOSS_DAMAGE:SPECIAL_WEAVER_NORMAL_DAMAGE,'special');
  for(const target of targets){const index=state.enemies.indexOf(target);if(index>=0&&target.hp<=0)killEnemy(state,index);}
  updateGaiaFieldSound(state);
}

function updateEnemyTargets(state: GameState) {
  const decoy=state.lunarDecoy;
  if(!decoy){updateEnemies(state);return;}
  const saved={playerX:state.playerX,playerY:state.playerY,playerTileX:state.playerTileX,playerTileY:state.playerTileY,
    playerTargetX:state.playerTargetX,playerTargetY:state.playerTargetY,playerChamber:state.playerChamber,playerCarryingRuby:state.playerCarryingRuby};
  state.enemyDecoyActive=true;
  Object.assign(state,{playerX:decoy.x,playerY:decoy.y,playerTileX:decoy.tileX,playerTileY:decoy.tileY,
    playerTargetX:decoy.tileX,playerTargetY:decoy.tileY,playerChamber:chamberOfTile(decoy.tileX,decoy.tileY),playerCarryingRuby:true});
  try{updateEnemies(state);}finally{Object.assign(state,saved);state.enemyDecoyActive=false;}
}

function updateEnemies(state: GameState) {
  const playerCarrying = state.playerCarryingRuby;

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.flashTicks > 0) e.flashTicks--;
    if (e.healFlashTicks > 0) e.healFlashTicks--;
    if (e.shootTicks > 0) e.shootTicks--;

    // Bomber explode mechanic
    if (e.type === 'bomber' && e.exploding) {
      e.explodeTick--;
      if (e.explodeTick <= 0) {
        triggerBomberExplosion(state, e);
        state.enemies.splice(i, 1);
      }
      continue;
    }

    // Push (knockback)
    if (e.pushTiles > 0) {
      const cfg = ENEMY_CONFIGS[e.type];
      void Math.min(cfg.speed * 2, e.pushTiles * TILE_SIZE);
      const nx = e.tileX + e.pushDirX;
      const ny = e.tileY + e.pushDirY;
      if (isFloorTile(state.map, nx, ny)) {
        e.tileX = nx; e.tileY = ny;
        e.x = nx * TILE_SIZE + TILE_SIZE / 2;
        e.y = ny * TILE_SIZE + TILE_SIZE / 2;
      }
      // Knockback overrides normal step interpolation — resync target/step state
      // so the resumed movement (or charger's charge) doesn't lerp toward a
      // stale pre-push tile (which visibly dragged the enemy across walls).
      e.targetTileX = e.tileX; e.targetTileY = e.tileY; e.stepProgress = 0;
      if (e.type === 'charger') { e.chargeDirX = 0; e.chargeDirY = 0; e.chargeWindupTicks=0; e.chargeTilesLeft=0; }
      e.pushTiles = Math.max(0, e.pushTiles - 1);
      continue;
    }

    if (e.type === 'thorn_weaver') { updateThornWeaver(state, e); continue; }
    if (e.type === 'sea_chanter') {
      updateSeaChanter(state, e);
      continue;
    }

    // Blind Prayer flees, with a telegraphed escape attack and occasional Ruby ritual.
    if (e.type === 'blind_prayer') {
      updatePrayerAbilities(state, e);
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        e.path = fleePath(state, e);
        e.pathTimer = PRAYER_FLEE_REPATH_TICKS;
      }
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
        const next = e.path.shift();
        if (next && isFloorTile(state.map, next[0], next[1])) {
          [e.targetTileX, e.targetTileY] = next;
          e.stepProgress = 0;
        }
      } else {
        const speed = e.prayer!.escapeBoostTicks > 0 ? PRAYER_ESCAPE_SPEED : ENEMY_CONFIGS.blind_prayer.speed;
        e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + speed * celestialMoveMultiplier(state,e));
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + (e.targetTileX - e.tileX) * e.stepProgress;
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + (e.targetTileY - e.tileY) * e.stepProgress;
        if (e.stepProgress === TILE_SIZE) {
          e.tileX = e.targetTileX; e.tileY = e.targetTileY;
          e.stepProgress = 0;
        }
      }
      continue;
    }

    // ── Boss special logic ───────────────────────────────────────────────
    if (e.type === 'fiery_king') {
      // Boss is immune to push
      e.pushTiles = 0;
      if (e.attackTimer > 0) e.attackTimer--;
      // phaseTimer is unused for fiery_king otherwise — reused here as "ticks alive since
      // this king spawned", so speed ramps from base on every fresh spawn, not from run start.
      e.phaseTimer++;
      updateKingArenaAttack(state, e);

      // Targets whichever of player/ruby is closer — unlike the Reaper, who only ever
      // hunts the player, the King (like the Queen) will go straight for an undefended ruby.
      const bHasRuby = !state.enemyDecoyActive && state.rubyTileX !== -1;
      const bDistPlayer = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const bDistRuby = bHasRuby ? tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) : Infinity;
      const bTargetIsPlayer = !bHasRuby || bDistPlayer <= bDistRuby;
      e.targeting = bTargetIsPlayer ? 'player' : 'ruby';
      const bTgtTX = bTargetIsPlayer ? state.playerTileX : state.rubyTileX;
      const bTgtTY = bTargetIsPlayer ? state.playerTileY : state.rubyTileY;
      const bDist  = bTargetIsPlayer ? bDistPlayer : bDistRuby;

      // Attack if within range
      if (e.attackTimer === 0 && bDist <= BOSS_ATTACK_RANGE) {
        playSFX_bossLaser();
        const bTgtX = bTargetIsPlayer ? state.playerX : state.rubyTileX * TILE_SIZE + TILE_SIZE / 2;
        const bTgtY = bTargetIsPlayer ? state.playerY : state.rubyTileY * TILE_SIZE + TILE_SIZE / 2;
        if (bTargetIsPlayer) damagePlayer(state, ENEMY_CONFIGS.fiery_king.damageToPlayer);
        else damageRuby(state, ENEMY_CONFIGS.fiery_king.damageToRuby);
        e.attackTimer = ENEMY_CONFIGS.fiery_king.attackCooldown;
        e.shootTicks = 22;
        state.laserBeams.push({
          fromX: e.x, fromY: e.y,
          dirX: 0, dirY: 0,
          endX: bTgtX, endY: bTgtY,
          ticks: 22,
          color: '#cc0022'
        });
        spawnFireBurst(state, bTgtX, bTgtY);
      }

      // BFS toward player — recalculate frequently so boss tracks across chambers
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        e.path = bfs(state.map, e.targetTileX, e.targetTileY, bTgtTX, bTgtTY);
        e.pathTimer = 8;
      }
      const bCfg = ENEMY_CONFIGS.fiery_king;
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
      } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
        // Gradually speeds up the longer THIS king has been alive — resets to base speed
        // on every fresh spawn — capped at an absolute top speed.
        const kingAliveSec = e.phaseTimer / 60;
        const kingSpeed = Math.min(KING_SPEED_CAP, bCfg.speed * (1 + kingAliveSec * KING_SPEED_RAMP_PER_SEC));
        e.stepProgress += kingSpeed * celestialMoveMultiplier(state, e);
        const bdx = e.targetTileX - e.tileX, bdy = e.targetTileY - e.tileY;
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + bdx * Math.min(e.stepProgress, TILE_SIZE);
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + bdy * Math.min(e.stepProgress, TILE_SIZE);
        if (e.stepProgress >= TILE_SIZE) {
          e.tileX = e.targetTileX; e.tileY = e.targetTileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
          e.stepProgress = 0;
        }
      }
      continue;
    }

    // ── Storm Reaper special logic ──────────────────────────────────────
    if (e.type === 'storm_reaper') {
      e.pushTiles = 0; // immune to push, like the other bosses
      if (e.attackTimer > 0) e.attackTimer--;

      // Always hunts the player specifically — never the ruby, unlike King/Queen.
      const rTgtTX = state.playerTileX;
      const rTgtTY = state.playerTileY;
      const rCfg = ENEMY_CONFIGS.storm_reaper;
      const rDist = tileEuclidDist(e.tileX, e.tileY, rTgtTX, rTgtTY);

      // Melee strike if adjacent and off cooldown — an electric slash, not a laser beam,
      // since she's a close-range striker rather than a ranged attacker like the King/Queen.
      if (e.attackTimer === 0 && rDist <= rCfg.attackRange) {
        playSFX_reaperStrike();
        damagePlayer(state, rCfg.damageToPlayer);
        e.attackTimer = rCfg.attackCooldown;
        e.shootTicks = 14;
        const slashAngle = Math.atan2(state.playerY - e.y, state.playerX - e.x);
        state.slashEffects.push({ x: state.playerX, y: state.playerY, angle: slashAngle, ticks: 14, maxTicks: 14 });
        spawnSlashBurst(state, state.playerX, state.playerY);
        state.screenShakeTicks = 10;
        state.screenShakeAmt = 7;
      }

      // Seal the hallway shut if she and the player are both standing in the same one —
      // traps them together for a few seconds, then reopens on its own.
      const rHallway = hallwayOfTile(e.tileX, e.tileY);
      if (
        rHallway !== -1 &&
        rHallway === hallwayOfTile(state.playerTileX, state.playerTileY) &&
        state.hallwaySeal === -1 &&
        state.hallwaySealCooldown === 0
      ) {
        setHallwayWalled(state, rHallway, true);
        state.hallwaySeal = rHallway;
        state.hallwaySealTicks = REAPER_SEAL_DURATION;
        state.hallwaySealCooldown = REAPER_SEAL_COOLDOWN;
        playSFX_hallwaySeal();
        state.screenShakeTicks = 14;
        state.screenShakeAmt = 6;
      }

      // BFS toward player — recalculate frequently so she tracks across chambers/hallways
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        e.path = bfs(state.map, e.targetTileX, e.targetTileY, rTgtTX, rTgtTY);
        e.pathTimer = 8;
      }
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
      } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
        e.stepProgress += rCfg.speed * celestialMoveMultiplier(state, e);
        const rdx = e.targetTileX - e.tileX, rdy = e.targetTileY - e.tileY;
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + rdx * Math.min(e.stepProgress, TILE_SIZE);
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + rdy * Math.min(e.stepProgress, TILE_SIZE);
        if (e.stepProgress >= TILE_SIZE) {
          e.tileX = e.targetTileX; e.tileY = e.targetTileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
          e.stepProgress = 0;
        }
      }
      continue;
    }

    // ── Devourer special logic ──────────────────────────────────────────
    if (e.type === 'devourer') {
      e.pushTiles = 0; // immune to push, like the other bosses
      if (e.attackTimer > 0) e.attackTimer--;
      // chargeDirX is unused for this type otherwise — reused as her absorb-stack counter (0..DEVOURER_MAX_STACKS).
      // windupTicks is unused otherwise — reused as her absorb cooldown countdown.
      const stacks = e.chargeDirX;
      const dCfg = ENEMY_CONFIGS.devourer;

      // Targets whichever of player/ruby is closer, same split-attention as the King.
      const dHasRuby = !state.enemyDecoyActive && state.rubyTileX !== -1;
      const dDistPlayer = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const dDistRuby = dHasRuby ? tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) : Infinity;
      const dTargetIsPlayer = !dHasRuby || dDistPlayer <= dDistRuby;
      e.targeting = dTargetIsPlayer ? 'player' : 'ruby';
      const dTgtTX = dTargetIsPlayer ? state.playerTileX : state.rubyTileX;
      const dTgtTY = dTargetIsPlayer ? state.playerTileY : state.rubyTileY;
      const dDist = dTargetIsPlayer ? dDistPlayer : dDistRuby;
      const progress = Math.min(1, Math.max(0, stacks / DEVOURER_MAX_STACKS));
      const rangeGrowth = (Math.pow(DEVOURER_RANGE_GROWTH, progress) - 1) / (DEVOURER_RANGE_GROWTH - 1);
      const dAttackRange = dCfg.attackRange + Math.floor((DEVOURER_ATTACK_RANGE_MAX - dCfg.attackRange) * rangeGrowth);

      // Shouts a ranged sound-wave burst instead of a plain melee bite — matches her
      // attack range now reaching well past 1 tile as she stacks up.
      if (e.attackTimer === 0 && dDist <= dAttackRange) {
        playSFX_devourerBite();
        // Accelerating curve — small increase early, big jumps near the cap
        const dmgMult = 1 + (DEVOURER_STACK_DMG_MAX_MULT - 1) * Math.pow(stacks / DEVOURER_MAX_STACKS, 2);
        const dTgtX = dTargetIsPlayer ? state.playerX : state.rubyTileX * TILE_SIZE + TILE_SIZE / 2;
        const dTgtY = dTargetIsPlayer ? state.playerY : state.rubyTileY * TILE_SIZE + TILE_SIZE / 2;
        if (dTargetIsPlayer) damagePlayer(state, Math.round(dCfg.damageToPlayer * dmgMult));
        else damageRuby(state, Math.round(dCfg.damageToRuby * dmgMult));
        state.laserBeams.push({
          fromX: e.x, fromY: e.y,
          dirX: 0, dirY: 0,
          endX: dTgtX, endY: dTgtY,
          ticks: 20,
          color: '#6b2fa8',
        });
        e.attackTimer = dCfg.attackCooldown;
        e.shootTicks = 16;
        state.screenShakeTicks = Math.max(state.screenShakeTicks, 8);
        state.screenShakeAmt = Math.max(state.screenShakeAmt, 5 + stacks * 0.4);
      }

      // Periodically reach out and consume the nearest non-boss ally within range — below
      // DEVOURER_MAX_STACKS this grows her max HP (and heals by the same amount) and her
      // damage/range, at the cost of a little speed. Once maxed out she keeps eating on the
      // same cooldown, but purely to top herself back up to full — no further stat growth.
      if (e.windupTicks > 0) {
        e.windupTicks--;
      } else {
        let nearest: Enemy | null = null;
        let nearestDist = DEVOURER_ABSORB_RANGE;
        for (const ally of state.enemies) {
          if (ally === e) continue;
          if (isBossType(ally.type) || ally.type === 'queen_echo') continue;
          const d = tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY);
          if (d <= nearestDist) { nearest = ally; nearestDist = d; }
        }
        if (nearest) {
          spawnAbsorbBurst(state, nearest.x, nearest.y, e.x, e.y);
          spawnAbsorbBurst(state, nearest.x, nearest.y, e.x, e.y); // doubled up — big, chaotic spectacle
          const idx2 = state.enemies.indexOf(nearest);
          if (idx2 !== -1) state.enemies.splice(idx2, 1);
          if (stacks < DEVOURER_MAX_STACKS) {
            const gained = Math.round(e.maxHp * DEVOURER_STACK_HP_PCT);
            e.maxHp += gained;
            e.hp = Math.min(e.maxHp, e.hp + gained);
            e.chargeDirX = stacks + 1;
          } else {
            e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.05)); // maxed out — just a small top-up now, not a full heal
          }
          e.healFlashTicks = 26; // drives the big shockwave-ring pulse in drawEnemy
          playSFX_devourerAbsorb();
          state.screenShakeTicks = Math.max(state.screenShakeTicks, 16);
          state.screenShakeAmt = Math.max(state.screenShakeAmt, 10);
        }
        e.windupTicks = DEVOURER_ABSORB_COOLDOWN;
      }

      // BFS toward target — recalculate frequently so she tracks across chambers
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        e.path = bfs(state.map, e.targetTileX, e.targetTileY, dTgtTX, dTgtTY);
        e.pathTimer = 8;
      }
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
      } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
        // Bigger from absorbing = slower, floored so she never fully stops.
        const dSpeed = Math.max(0.15, dCfg.speed * (1 - stacks * DEVOURER_STACK_SPEED_PCT));
        e.stepProgress += dSpeed * celestialMoveMultiplier(state, e);
        const ddx = e.targetTileX - e.tileX, ddy = e.targetTileY - e.tileY;
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + ddx * Math.min(e.stepProgress, TILE_SIZE);
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + ddy * Math.min(e.stepProgress, TILE_SIZE);
        if (e.stepProgress >= TILE_SIZE) {
          e.tileX = e.targetTileX; e.tileY = e.targetTileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
          e.stepProgress = 0;
        }
      }
      continue;
    }

    // ── Frost Warden special logic ──────────────────────────────────────
    if (e.type === 'frost_warden') {
      e.pushTiles = 0; // immune to push, like the other bosses

      // No direct attack on the player — she's a pure field-controller. Her threat is
      // entirely the chamber-wide chill debuff (isPlayerChilled) and the ice-tile freeze
      // hazards. Her only "offense" is supportive: firing an ice-laser shield cast at a
      // random ally every FROST_SHIELD_CAST_DELAY ticks (recurring, not a one-shot per
      // relocation) — any number of allies can be carrying a shield at once, not just one.
      if (e.windupTicks > 0) {
        e.windupTicks--;
        if (e.windupTicks === 0) {
          castFrostShield(state, e);
          e.windupTicks = FROST_SHIELD_CAST_DELAY;
        }
      }

      // Periodically relocate to a new chamber, re-scattering her ice tiles there —
      // phaseTimer is unused for this type otherwise (only meaningful for splitter_queen).
      e.phaseTimer--;
      if (e.phaseTimer <= 0) {
        relocateFrostWarden(state, e);
      }
      continue;
    }

    // ── Splitter Queen special logic ──────────────────────────────────────
    if (e.type === 'splitter_queen') {
      e.pushTiles = 0; // immune to knockback, like the boss

      const qChamber = chamberOfTile(e.tileX, e.tileY);
      const hasPlacedRubyQ = !state.enemyDecoyActive && state.rubyTileX !== -1;
      const playerInChamber = chamberOfTile(state.playerTileX, state.playerTileY) === qChamber;
      const rubyInChamber = hasPlacedRubyQ && chamberOfTile(state.rubyTileX, state.rubyTileY) === qChamber;
      const targetIsPlayer = playerInChamber || !rubyInChamber;
      e.targeting = targetIsPlayer ? 'player' : 'ruby';
      const qTgtTX = targetIsPlayer ? state.playerTileX : state.rubyTileX;
      const qTgtTY = targetIsPlayer ? state.playerTileY : state.rubyTileY;
      const inChamberTarget = targetIsPlayer ? playerInChamber : rubyInChamber;
      const qDist = tileEuclidDist(e.tileX, e.tileY, qTgtTX, qTgtTY);
      // No line-of-sight requirement — her bolts pierce walls, only chamber + range gate her.

      if (e.windupTicks > 0) {
        if (!inChamberTarget || qDist > QUEEN_ATTACK_RANGE) {
          e.windupTicks = 0;
        } else {
          e.windupTicks--;
          if (e.windupTicks === 0) {
            const tgtX = targetIsPlayer ? state.playerX : state.rubyTileX * TILE_SIZE + TILE_SIZE / 2;
            const tgtY = targetIsPlayer ? state.playerY : state.rubyTileY * TILE_SIZE + TILE_SIZE / 2;
            fireQueenBolt(state, e, tgtX, tgtY, targetIsPlayer);
          }
        }
      } else {
        if (e.attackTimer > 0) e.attackTimer--;
        if (e.attackTimer === 0 && inChamberTarget && qDist <= QUEEN_ATTACK_RANGE) {
          e.windupTicks = QUEEN_WINDUP_TICKS;
        }
      }

      // Phase-jump countdown runs independently of her attack state
      e.phaseTimer--;
      if (e.phaseTimer <= 0) phaseQueenJump(state, e);
      continue;
    }

    // ── Queen Echo special logic ──────────────────────────────────────────
    if (e.type === 'queen_echo') {
      e.pushTiles = 0;
      const chamber = chamberOfTile(e.tileX, e.tileY);
      const playerInChamber = chamberOfTile(state.playerTileX, state.playerTileY) === chamber;
      const eDist = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      // No line-of-sight requirement — bolts pierce walls, only chamber + range gate the attack.

      if (e.windupTicks > 0) {
        if (!playerInChamber || eDist > QUEEN_ATTACK_RANGE) {
          e.windupTicks = 0;
        } else {
          e.windupTicks--;
          if (e.windupTicks === 0) fireQueenBolt(state, e, state.playerX, state.playerY, true);
        }
      } else {
        if (e.attackTimer > 0) e.attackTimer--;
        if (e.attackTimer === 0 && playerInChamber && eDist <= QUEEN_ATTACK_RANGE) {
          e.windupTicks = QUEEN_WINDUP_TICKS;
        }
      }

      // Echoes persist until the player kills them — no self-expiry.
      continue;
    }

    // ── Sniper special logic ─────────────────────────────────────────────
    if (e.type === 'sniper') {
      const hasPlacedRubyS = state.rubyTileX !== -1;
      if (playerCarrying || !hasPlacedRubyS) {
        e.targeting = 'player';
      } else {
        const dP = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
        const dR = tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY);
        e.targeting = dP <= dR + 2 ? 'player' : 'ruby';
      }
      const sTgtTX = e.targeting === 'player' ? state.playerTileX : state.rubyTileX;
      const sTgtTY = e.targeting === 'player' ? state.playerTileY : state.rubyTileY;
      const sDist  = tileEuclidDist(e.tileX, e.tileY, sTgtTX, sTgtTY);
      const sLos   = hasLineOfSight(state.map, e.tileX, e.tileY, sTgtTX, sTgtTY);

      if (e.windupTicks > 0) {
        // Cancel windup if LoS lost
        if (!sLos || sDist > SNIPER_ATTACK_RANGE) { e.windupTicks = 0; }
        else {
          e.windupTicks--;
          if (e.windupTicks === 0) fireSniperLaser(state, e);
        }
        continue;
      }

      if (e.attackTimer > 0) { e.attackTimer--; }

      if (e.attackTimer === 0 && sDist <= SNIPER_ATTACK_RANGE && sLos) {
        e.windupTicks = SNIPER_WINDUP_TICKS;
        continue;
      }

      // Move toward target only when out of attack range
      if (sDist > SNIPER_ATTACK_RANGE) {
        e.pathTimer--;
        if (e.pathTimer <= 0) {
          e.path = bfs(state.map, e.targetTileX, e.targetTileY, sTgtTX, sTgtTY);
          e.pathTimer = 25 + Math.floor(Math.random() * 15);
        }
        const sCfg = ENEMY_CONFIGS.sniper;
        if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
          const [ntx, nty] = e.path.shift()!;
          if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
        } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
          e.stepProgress += sCfg.speed * celestialMoveMultiplier(state, e);
          const sdx = e.targetTileX - e.tileX, sdy = e.targetTileY - e.tileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + sdx * Math.min(e.stepProgress, TILE_SIZE);
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + sdy * Math.min(e.stepProgress, TILE_SIZE);
          if (e.stepProgress >= TILE_SIZE) {
            e.tileX = e.targetTileX; e.tileY = e.targetTileY;
            e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
            e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
            e.stepProgress = 0;
          }
        }
      }
      continue;
    }

    // ── Healer special logic ─────────────────────────────────────────────
    if (e.type === 'healer') {
      // Tick heal cooldown
      if (e.attackTimer > 0) e.attackTimer--;

      // Heal pulse: restore HP for all allies within radius (including from range)
      if (e.attackTimer === 0) {
        let healedAnyone = false;
        for (const ally of state.enemies) {
          if (ally === e) continue;
          const dist = tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY);
          if (dist <= HEALER_HEAL_RADIUS && ally.hp < ally.maxHp) {
            ally.hp = Math.min(ally.maxHp, ally.hp + HEALER_HEAL_AMOUNT);
            ally.healFlashTicks = 20; // pink heal aura
            healedAnyone = true;
          }
        }
        if (healedAnyone) {
          const a = new Audio('/sounds/swap.mp3'); a.volume = 0.15; a.play().catch(() => {});
        }
        e.attackTimer = HEALER_HEAL_INTERVAL;
      }

      // Find most injured ally (lowest HP ratio) to move toward
      let healTargetTX = state.playerTileX; // fallback: drift toward player
      let healTargetTY = state.playerTileY;
      let lowestRatio = 1.0;
      for (const ally of state.enemies) {
        if (ally === e) continue;
        const ratio = ally.hp / ally.maxHp;
        if (ratio < lowestRatio) {
          lowestRatio = ratio;
          healTargetTX = ally.tileX;
          healTargetTY = ally.tileY;
        }
      }

      // Only move if not already within heal radius of target
      const distToHealTarget = tileEuclidDist(e.tileX, e.tileY, healTargetTX, healTargetTY);
      if (distToHealTarget > HEALER_HEAL_RADIUS) {
        e.pathTimer--;
        if (e.pathTimer <= 0) {
          e.path = bfs(state.map, e.targetTileX, e.targetTileY, healTargetTX, healTargetTY);
          e.pathTimer = 25 + Math.floor(Math.random() * 15);
        }
        const hCfg = ENEMY_CONFIGS.healer;
        if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
          const [ntx, nty] = e.path.shift()!;
          if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
        } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
          e.stepProgress += hCfg.speed * celestialMoveMultiplier(state, e);
          const hdx = e.targetTileX - e.tileX, hdy = e.targetTileY - e.tileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + hdx * Math.min(e.stepProgress, TILE_SIZE);
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + hdy * Math.min(e.stepProgress, TILE_SIZE);
          if (e.stepProgress >= TILE_SIZE) {
            e.tileX = e.targetTileX; e.tileY = e.targetTileY;
            e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
            e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
            e.stepProgress = 0;
          }
        }
      }
      continue;
    }

    // ── Charger special logic ─────────────────────────────────────────────
    if (e.type === 'charger') {
      const cCfg = ENEMY_CONFIGS.charger;
      if (e.attackTimer > 0) e.attackTimer--;
      // Stunned after hitting wall or player
      if (e.windupTicks > 0) { e.windupTicks--; continue; }
      if ((e.chargeWindupTicks ?? 0) > 0) { e.chargeWindupTicks!--; continue; }
      const recover=(wall:boolean)=>{
        e.chargeDirX=0;e.chargeDirY=0;e.chargeTilesLeft=0;
        e.windupTicks=wall?CHARGER_STUN_TICKS:Math.floor(CHARGER_STUN_TICKS/2);
        e.attackTimer=cCfg.attackCooldown;e.path=[];e.pathTimer=0;
      };

      // Currently charging
      if (e.chargeDirX !== 0 || e.chargeDirY !== 0) {
        if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
          const nx = e.tileX + e.chargeDirX;
          const ny = e.tileY + e.chargeDirY;
          if (!isFloorTile(state.map, nx, ny)) recover(true);
          else if ((e.chargeTilesLeft ?? CHARGER_CHARGE_TILES) <= 0) recover(false);
          else {
            e.targetTileX = nx; e.targetTileY = ny; e.stepProgress = 0;
          }
        } else {
          e.stepProgress += CHARGER_CHARGE_SPEED * celestialMoveMultiplier(state, e);
          const cdx = e.targetTileX - e.tileX, cdy = e.targetTileY - e.tileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + cdx * Math.min(e.stepProgress, TILE_SIZE);
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + cdy * Math.min(e.stepProgress, TILE_SIZE);
          if (e.stepProgress >= TILE_SIZE) {
            e.tileX = e.targetTileX; e.tileY = e.targetTileY;
            e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
            e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
            e.stepProgress = 0;
            e.chargeTilesLeft=(e.chargeTilesLeft ?? CHARGER_CHARGE_TILES)-1;
            // Contact damage happens on arrival, rather than a tile before impact.
            const hitPlayer=e.tileX===state.playerTileX&&e.tileY===state.playerTileY;
            const hitRuby=!state.enemyDecoyActive&&state.rubyTileX!==-1&&e.tileX===state.rubyTileX&&e.tileY===state.rubyTileY;
            if(hitPlayer||hitRuby){
              playSFX_enemyAttack();if(hitPlayer)damagePlayer(state,cCfg.damageToPlayer);else damageRuby(state,cCfg.damageToRuby);
              e.shootTicks=14;recover(false);
            }
          }
        }
        continue;
      }

      // Idle — watch for player LoS and charge
      const cDist = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const cLoS  = hasLineOfSight(state.map, e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      if (e.attackTimer === 0 && e.tileX===e.targetTileX && e.tileY===e.targetTileY && cDist <= CHARGER_SIGHT_RANGE && cLoS) {
        const ddx = state.playerTileX - e.tileX, ddy = state.playerTileY - e.tileY;
        if (Math.abs(ddx) >= Math.abs(ddy)) { e.chargeDirX = ddx > 0 ? 1 : -1; e.chargeDirY = 0; }
        else { e.chargeDirX = 0; e.chargeDirY = ddy > 0 ? 1 : -1; }
        e.chargeWindupTicks=CHARGER_WINDUP_TICKS;e.chargeTilesLeft=CHARGER_CHARGE_TILES;e.path=[];
      } else {
        e.pathTimer--;
        if (e.pathTimer <= 0) { e.path = bfs(state.map, e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY); e.pathTimer = 35 + Math.floor(Math.random() * 20); }
        if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
          const [ntx, nty] = e.path.shift()!;
          if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
        } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
          e.stepProgress += cCfg.speed * celestialMoveMultiplier(state, e);
          const cdx = e.targetTileX - e.tileX, cdy = e.targetTileY - e.tileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + cdx * Math.min(e.stepProgress, TILE_SIZE);
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + cdy * Math.min(e.stepProgress, TILE_SIZE);
          if (e.stepProgress >= TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2; e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2; e.stepProgress = 0; }
        }
      }
      continue;
    }

    // ── Ghost special logic ───────────────────────────────────────────────
    if (e.type === 'ghost') {
      const gCfg = ENEMY_CONFIGS.ghost;
      const gHasRuby = state.rubyTileX !== -1;
      const dGP = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const dGR = gHasRuby ? tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) : Infinity;
      const gTargetRuby = !playerCarrying && gHasRuby && dGR < dGP - 2;
      const gTX = gTargetRuby ? state.rubyTileX : state.playerTileX;
      const gTY = gTargetRuby ? state.rubyTileY : state.playerTileY;
      e.targeting = gTargetRuby ? 'ruby' : 'player';

      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
        const adjPlayer = tileDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= gCfg.attackRange;
        const adjRuby   = gHasRuby && tileDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= gCfg.attackRange;
        if (e.attackTimer > 0) {
          e.attackTimer--;
        } else if (adjPlayer && !gTargetRuby) {
          playSFX_enemyAttack(); damagePlayer(state, gCfg.damageToPlayer);
          e.attackTimer = gCfg.attackCooldown; e.shootTicks = 14;
        } else if (adjRuby && gTargetRuby) {
          playSFX_enemyAttack(); damageRuby(state, gCfg.damageToRuby);
          e.attackTimer = gCfg.attackCooldown; e.shootTicks = 14;
        } else if (e.tileX !== gTX || e.tileY !== gTY) {
          // Ghost moves through walls — greedy direction
          const ddx = gTX - e.tileX, ddy = gTY - e.tileY;
          let nx = e.tileX, ny = e.tileY;
          if (Math.abs(ddx) >= Math.abs(ddy)) nx = e.tileX + (ddx > 0 ? 1 : -1);
          else ny = e.tileY + (ddy > 0 ? 1 : -1);
          nx = Math.max(0, Math.min(MAP_COLS - 1, nx));
          ny = Math.max(0, Math.min(MAP_ROWS - 1, ny));
          e.targetTileX = nx; e.targetTileY = ny; e.stepProgress = 0;
        }
      } else {
        e.stepProgress += gCfg.speed * celestialMoveMultiplier(state, e);
        const gdx = e.targetTileX - e.tileX, gdy = e.targetTileY - e.tileY;
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + gdx * Math.min(e.stepProgress, TILE_SIZE);
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + gdy * Math.min(e.stepProgress, TILE_SIZE);
        if (e.stepProgress >= TILE_SIZE) {
          e.tileX = e.targetTileX; e.tileY = e.targetTileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
          e.stepProgress = 0;
        }
      }
      continue;
    }

    // ── Shielder special logic ────────────────────────────────────────────
    if (e.type === 'shielder') {
      const sCfg = ENEMY_CONFIGS.shielder;
      if (e.attackTimer > 0) e.attackTimer--;

      // Find most injured non-shielder ally that isn't already shielded by someone else
      let shieldTarget: Enemy | null = null;
      let lowestRatio = 1.0;
      const validAllies: Enemy[] = [];
      
      const alreadyShielded = new Set(
        state.enemies
          .filter(other => other.type === 'shielder' && other !== e && other.shieldTargetId !== -1)
          .map(other => other.shieldTargetId)
      );

      for (const ally of state.enemies) {
        if (ally === e || ally.type === 'shielder') continue;
        if (alreadyShielded.has(ally.id)) continue; // 1 shield per shielder (unique targets)
        
        // Only grant shield to aliens within range
        if (tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY) > SHIELDER_SHIELD_RANGE) continue;

        validAllies.push(ally);
        const ratio = ally.hp / ally.maxHp;
        if (ratio < lowestRatio) { lowestRatio = ratio; shieldTarget = ally; }
      }

      if (!shieldTarget && validAllies.length > 0) {
        // No one is injured. Stick to current healthy target if still valid, otherwise pick random.
        shieldTarget = validAllies.find(a => a.id === e.shieldTargetId) || null;
        if (!shieldTarget) {
          shieldTarget = validAllies[Math.floor(Math.random() * validAllies.length)];
        }
      }

      if (shieldTarget) {
        e.shieldTargetId = shieldTarget.id;
        
        e.pathTimer--;
        if (e.pathTimer <= 0) { e.path = bfs(state.map, e.targetTileX, e.targetTileY, shieldTarget.tileX, shieldTarget.tileY); e.pathTimer = 20 + Math.floor(Math.random() * 15); }
        if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
          const [ntx, nty] = e.path.shift()!;
          if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
        } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
          e.stepProgress += sCfg.speed * celestialMoveMultiplier(state, e);
          const sdx = e.targetTileX - e.tileX, sdy = e.targetTileY - e.tileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + sdx * Math.min(e.stepProgress, TILE_SIZE);
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + sdy * Math.min(e.stepProgress, TILE_SIZE);
          if (e.stepProgress >= TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2; e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2; e.stepProgress = 0; }
        }
        
        // Shielder never attacks
      } else {
        // No injured ally — drift toward player
        e.shieldTargetId = -1;
        e.pathTimer--;
        if (e.pathTimer <= 0) { e.path = bfs(state.map, e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY); e.pathTimer = 30 + Math.floor(Math.random() * 20); }
        if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
          const [ntx, nty] = e.path.shift()!;
          if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
        } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
          e.stepProgress += sCfg.speed * celestialMoveMultiplier(state, e);
          const sdx = e.targetTileX - e.tileX, sdy = e.targetTileY - e.tileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + sdx * Math.min(e.stepProgress, TILE_SIZE);
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + sdy * Math.min(e.stepProgress, TILE_SIZE);
          if (e.stepProgress >= TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2; e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2; e.stepProgress = 0; }
        }
      }
      continue;
    }

    // Determine target
    const hasPlacedRuby = state.rubyTileX !== -1;
    if (e.type === 'energy_leech' || playerCarrying || !hasPlacedRuby) {
      e.targeting = 'player';
    } else {
      // Closest to player? target player; else target ruby
      const distToPlayer = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const distToRuby = tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY);
      e.targeting = distToPlayer <= distToRuby + 2 ? 'player' : 'ruby';
    }

    const tgtTX = e.targeting === 'player' ? state.playerTileX : state.rubyTileX;
    const tgtTY = e.targeting === 'player' ? state.playerTileY : state.rubyTileY;

    // BFS recalc
    e.pathTimer--;
    if (e.pathTimer <= 0) {
      e.path = bfs(state.map, e.targetTileX, e.targetTileY, tgtTX, tgtTY);
      e.pathTimer = 25 + Math.floor(Math.random() * 15);
    }

    // Move toward next path tile
    const cfg = ENEMY_CONFIGS[e.type];
    const speed = cfg.speed;

    if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
      // Check attack adjacency
      const adjPlayer = tileDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= cfg.attackRange;
      const adjRuby = hasPlacedRuby && tileDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= cfg.attackRange;

      if (e.attackTimer > 0) {
        e.attackTimer--;
      } else if (adjPlayer && e.targeting === 'player') {
        if (e.type === 'bomber') {
          e.exploding = true; e.explodeTick = 45;
        } else if (e.type === 'energy_leech') {
          // Echo attracts the bite, but contains no real star energy to steal.
          if (state.enemyDecoyActive) damageLunarDecoy(state, 1);
          else if (!state.godMode) {
            const stolen = Math.min(ENERGY_LEECH_DRAIN, state.starEnergy);
            state.starEnergy -= stolen;
            e.stolenEnergy = (e.stolenEnergy ?? 0) + stolen;
          }
          playSFX_enemyAttack();
          e.attackTimer = cfg.attackCooldown;
          e.shootTicks = 14;
        } else {
          playSFX_enemyAttack();
          damagePlayer(state, cfg.damageToPlayer);
          e.attackTimer = cfg.attackCooldown;
          e.shootTicks = 14;
        }
      } else if (adjRuby && e.targeting === 'ruby') {
        if (e.type === 'bomber') {
          e.exploding = true; e.explodeTick = 45;
        } else {
          playSFX_enemyAttack();
          damageRuby(state, cfg.damageToRuby);
          e.attackTimer = cfg.attackCooldown;
          e.shootTicks = 14;
        }
      } else if (e.path.length > 0) {
        // Start moving to next tile
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) {
          e.targetTileX = ntx; e.targetTileY = nty;
          e.stepProgress = 0;
        }
      }
    } else {
      // Interpolate pixel position
      e.stepProgress += speed * celestialMoveMultiplier(state, e);
      const dx = e.targetTileX - e.tileX;
      const dy = e.targetTileY - e.tileY;
      e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + dx * Math.min(e.stepProgress, TILE_SIZE);
      e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + dy * Math.min(e.stepProgress, TILE_SIZE);
      if (e.stepProgress >= TILE_SIZE) {
        e.tileX = e.targetTileX; e.tileY = e.targetTileY;
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
        e.stepProgress = 0;
      }
    }

    // Bomber check: if adjacent to target, start exploding
    if (e.type === 'bomber' && !e.exploding) {
      const adjPlayer = tileDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= cfg.attackRange;
      const adjRuby = hasPlacedRuby && tileDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= cfg.attackRange;
      if ((e.targeting === 'player' && adjPlayer) || (e.targeting === 'ruby' && adjRuby)) {
        e.exploding = true; e.explodeTick = 60;
      }
    }
  }
}

function triggerBomberExplosion(state: GameState, e: Enemy) {
  const RANGE = ENEMY_CONFIGS.bomber.bombExplodeRange;
  playSFX_bomb();
  state.bombBlasts.push({ cx: e.x, cy: e.y, radius: 0, maxRadius: RANGE * TILE_SIZE, ticks: 25 });
  // Damage player if in range
  if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= RANGE) {
    damagePlayer(state, 25);
  }
  // Damage ruby if in range
  if (state.rubyTileX !== -1 && tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= RANGE) {
    damageRuby(state, 30);
  }
  // Kill nearby normal enemies (splash)
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const other = state.enemies[j];
    if (other === e) continue;
    if (tileEuclidDist(e.tileX, e.tileY, other.tileX, other.tileY) <= RANGE * 0.6) {
      damageEnemy(state, other, 2, 'enemy');
      if (other.hp <= 0) { killEnemy(state, j); }
    }
  }
}

function spawnFireBurst(state: GameState, x: number, y: number) {
  const colors = ['#ffee00', '#ff8800', '#ff3300'];
  const count = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 0.6 + Math.random() * 2.0;
    state.deathParticles.push({
      x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.6, // slight upward kick, like fire
      ticks: 18, maxTicks: 18,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function spawnSlashBurst(state: GameState, x: number, y: number) {
  const colors = ['#ffffff', '#00eaff', '#aefcff'];
  const count = 16 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 1.2 + Math.random() * 2.6; // faster, flatter spray than fire — electric snap, not rising embers
    state.deathParticles.push({
      x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      ticks: 14, maxTicks: 14,
      size: 1.5 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

// Consumed enemy gets pulled INTO the devourer — particles converge toward her rather
// than scattering outward, selling "absorbed" instead of "destroyed".
function spawnAbsorbBurst(state: GameState, fromX: number, fromY: number, toX: number, toY: number) {
  const colors = ['#6b2fa8', '#b088e0', '#88ff44', '#ffffff', '#c8ff88'];
  const count = 20 + Math.floor(Math.random() * 8);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const spawnR = 6 + Math.random() * 16;
    const px = fromX + Math.cos(angle) * spawnR;
    const py = fromY + Math.sin(angle) * spawnR;
    const pullAngle = Math.atan2(toY - py, toX - px);
    const speed = 2.5 + Math.random() * 4;
    state.deathParticles.push({
      x: px, y: py,
      vx: Math.cos(pullAngle) * speed, vy: Math.sin(pullAngle) * speed,
      ticks: 18, maxTicks: 18,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function spawnDeathParticles(state: GameState, e: Enemy) {
  const color = ENEMY_CONFIGS[e.type].color;
  const count = 10 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 0.8 + Math.random() * 2.2;
    state.deathParticles.push({
      x: e.x, y: e.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      ticks: 22, maxTicks: 22,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function showRewardEffect(state: GameState, target: RewardEffect['target'], kind: RewardEffect['kind']) {
  // Refresh matching effects instead of stacking bursts during crowd kills.
  const effect = state.rewardEffects.find(fx => fx.target === target && fx.kind === kind);
  if (effect) effect.ticks = 36;
  else state.rewardEffects.push({ target, kind, ticks: 36 });
}

function healPlayer(state: GameState, amount: number, showEffect = true) {
  const before = state.playerHP;
  const multiplier = state.seaHealingDebuffTicks > 0 ? SEA_HEALING_DEBUFF_MULTIPLIER : 1;
  state.playerHP = Math.min(PLAYER_MAX_HP, Math.round((state.playerHP + amount * multiplier) * 10) / 10);
  if (showEffect && state.playerHP > before) showRewardEffect(state, 'player', 'heal');
}

function healCore(state: GameState, amount: number) {
  const before = state.rubyHP;
  state.rubyHP = Math.min(RUBY_MAX_HP, state.rubyHP + amount);
  if (state.rubyHP > before) showRewardEffect(state, 'ruby', 'heal');
}

function killEnemy(state: GameState, idx: number, fromMeteor = false) {
  if (state.enemies[idx]?.type === 'thorn_weaver') clearThornHazards(state);
  if (state.enemies[idx]?.type === 'sea_chanter') { stopSeaSounds(); state.seaHealingDebuffTicks = 0; }
  const e = state.enemies[idx];
  spawnDeathParticles(state, e);

  const skipRewards = fromMeteor;
  const recoveredEnergy = e.type === 'energy_leech' ? (e.stolenEnergy ?? 0) : 0;
  const wasMax = state.starEnergy >= STAR_ENERGY_MAX;
  const energyGain = (skipRewards ? 0 : (STAR_ENERGY_PER_KILL + (e.type === 'fast' ? 8 : 0)) * (1 + 0.2 * constellationBonus(state, 'energy'))) + recoveredEnergy;
  state.starEnergy = Math.min(STAR_ENERGY_MAX, state.starEnergy + energyGain);
  if (!wasMax && state.starEnergy >= STAR_ENERGY_MAX && !isBossType(e.type)) playSFX_powerUp();
  // Stolen energy is returned even when a meteor defeats the Leech.
  if (recoveredEnergy > 0) state.runnerEnergyFlashTicks = 60;
  if (!skipRewards) {
    state.killScore += ENEMY_CONFIGS[e.type].scoreValue;

    // Passive sustain — every kill heals a small flat amount, stacking on top of any
    // type-specific reward below (e.g. a healer kill grants this +24 more, not instead of).
    healPlayer(state, 5 + 2 * constellationBonus(state, 'killHealing'), false);

    // ── Kill effects by type ─────────────────────────────────────────────
    if (e.type === 'bomber') {
      // Explode on death — damages nearby allies
      const RANGE = ENEMY_CONFIGS.bomber.bombExplodeRange;
      playSFX_bomb();
      state.bombBlasts.push({ cx: e.x, cy: e.y, radius: 0, maxRadius: RANGE * TILE_SIZE, ticks: 25 });
      if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= RANGE) damagePlayer(state, 25);
      if (state.rubyTileX !== -1 && tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= RANGE) damageRuby(state, 30);
      for (const ally of state.enemies) {
        if (ally === e) continue;
        if (tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY) <= RANGE * 0.75) damageEnemy(state, ally, 20, 'enemy');
      }
    } else if (e.type === 'fast') {
      state.runnerEnergyFlashTicks = 60;
    } else if (e.type === 'armored') {
      state.playerShieldHP = Math.max(state.playerShieldHP, KILL_SHIELD_HP);
      showRewardEffect(state, 'player', 'shield');
      playSFX_rubyToggle();
    } else if (e.type === 'healer') {
      healPlayer(state, 24);
      showRewardEffect(state, 'player', 'heal');
      try { const a = new Audio('/sounds/grow.wav'); a.volume = 0.38; a.play().catch(() => {}); } catch {}
    } else if (e.type === 'charger') {
      state.speedActiveTicks = Math.max(state.speedActiveTicks, 120);
      state.speedFlashTicks = 15;
      showRewardEffect(state, 'player', 'speed');
      playSFX_speed();
    } else if (e.type === 'ghost') {
      if (state.rubyTileX !== -1) {
        healCore(state, 15);
        showRewardEffect(state, 'ruby', 'heal');
      }
      playSFX_teleport();
    } else if (e.type === 'shielder') {
      state.rubyShieldHP = Math.max(state.rubyShieldHP, KILL_SHIELD_HP);
      showRewardEffect(state, 'ruby', 'shield');
      playSFX_rubyToggle();
    } else if (e.type === 'sniper') {
      // Grant player electric chain buff for ~5s (300 ticks)
      state.electricBuffTicks = Math.max(state.electricBuffTicks, 300);
      showRewardEffect(state, 'player', 'electric');
      playSFX_laser();
    } else if (e.type === 'splitter') {
      // Spawn 2 mini_splitters
      const miniCfg = ENEMY_CONFIGS.mini_splitter;
      const offsets: [number,number][] = [[-1,0],[1,0],[0,-1],[0,1],[0,0]];
      const spawnPositions: [number,number][] = [];
      for (const [ox, oy] of offsets) {
        const tx = e.tileX + ox, ty = e.tileY + oy;
        if (isFloorTile(state.map, tx, ty)) { spawnPositions.push([tx, ty]); if (spawnPositions.length >= 2) break; }
      }
      while (spawnPositions.length < 2) spawnPositions.push([e.tileX, e.tileY]);
      for (const [tx, ty] of spawnPositions) {
        state.enemies.push({
          id: state.nextEnemyId++, type: 'mini_splitter',
          x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2,
          tileX: tx, tileY: ty, targetTileX: tx, targetTileY: ty, stepProgress: 0,
          hp: miniCfg.maxHp * REGULAR_ENEMY_HP_MULT * constellationAlienHPMult(state), maxHp: miniCfg.maxHp * REGULAR_ENEMY_HP_MULT * constellationAlienHPMult(state),
          path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
          pushDirX: 0, pushDirY: 0, pushTiles: 0,
          flashTicks: 0, healFlashTicks: 0, shootTicks: 0, exploding: false, explodeTick: 0,
          windupTicks: 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1, phaseTimer: 0,
          icyShieldHP: 0,
        });
      }
    }
  }

  // Boss-tier full-restore reward — applies no matter how the kill happened (including a
  // meteor strike finishing it off), unlike the score/energy rewards above which meteor kills skip.
  if (isBossType(e.type)) {
    state.bossesKilled++;
    offerConstellation(state);
    if (state.bossesKilled === SPECIAL_UNLOCK_KILLS) state.ascensionBannerTicks = 360;
    if (state.bossesKilled >= SPECIAL_UNLOCK_KILLS && e.type in SPECIAL_SKILLS) {
      state.specialSkill = e.type as SpecialSkill;
      state.specialDevourerStacks=e.type==='devourer'?Math.min(DEVOURER_MAX_STACKS,Math.max(0,e.chargeDirX)):0;
    }
    state.bossTimer = BOSS_SPAWN_INTERVAL;
    state.bossWarningTicks = 0;
    healPlayer(state, PLAYER_MAX_HP, false);
    healCore(state, RUBY_MAX_HP);
    showRewardEffect(state, 'player', 'restore');
    showRewardEffect(state, 'ruby', 'restore');
    state.starEnergy = STAR_ENERGY_MAX;
    if(state.bossesKilled>=SPECIAL_UNLOCK_KILLS)playCelestialSound('ready');else playSFX_powerUp();
    if (e.type === 'splitter_queen') {
      // Killing the real Queen instantly dissolves any echoes she left behind
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        if (state.enemies[j].type === 'queen_echo') {
          spawnDeathParticles(state, state.enemies[j]);
          state.enemies.splice(j, 1);
          playSFX_decoyDeath();
        }
      }
    }
    if (e.type === 'storm_reaper' && state.hallwaySeal !== -1) {
      // No reason to keep a hallway sealed once the one who sealed it is dead
      setHallwayWalled(state, state.hallwaySeal, false);
      state.hallwaySeal = -1;
      state.hallwaySealTicks = 0;
    }
    if (e.type === 'frost_warden') {
      state.frostIceTiles = []; // ice hazards vanish once she's dead
    }
  }

  // Re-locate by reference — the echo cleanup above may have shifted this enemy's index
  const finalIdx = state.enemies.indexOf(e);
  if (finalIdx !== -1) state.enemies.splice(finalIdx, 1);

  if (isBossType(e.type)) playSFX_bossDeath();
  else if (e.type === 'queen_echo') playSFX_decoyDeath();
  else playSFX_alienDeath();
}

// ─── Player movement ──────────────────────────────────────────────────────────

function updatePlayer(state: GameState) {
  // Frozen solid by a Frost Warden ice tile — no movement at all until it wears off
  if (state.playerFrozenTicks > 0) {
    state.playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);
    return;
  }

  const chilled = isPlayerChilled(state);
  const speedMultiplier =
    (state.speedActiveTicks > 0 ? SPEED_MULT :
    state.playerCarryingRuby ? PLAYER_CARRY_MULT : 1.0) *
    (chilled ? FROST_CHILL_SPEED_MULT : 1) * (isPlayerInThorns(state) ? THORN_SLOW_MULT : 1);
  const knockback = state.playerKnockback;
  const baseSpeed = knockback?.started ? PRAYER_KNOCKBACK_SPEED : PLAYER_BASE_SPEED * speedMultiplier * (1 + 0.08 * constellationBonus(state, 'speed'));

  if (state.playerTileX === state.playerTargetX && state.playerTileY === state.playerTargetY) {

    if (knockback) {
      // Finish any existing step before pushing one cardinal tile. Never snap the
      // player across a wall or overwrite held input with the forced direction.
      const nx = state.playerTileX + knockback.dirX;
      const ny = state.playerTileY + knockback.dirY;
      if (isFloorTile(state.map, nx, ny)) {
        state.playerTargetX = nx; state.playerTargetY = ny;
        state.playerStepProgress = 0;
        knockback.started = true;
      } else state.playerKnockback = null;
    } else {
      // Try to apply queued direction
      // All keyboard, swipe, and joystick input stays raw in the queue. Reverse it
      // exactly once when selecting the next tile; never reverse an in-flight step.
      const controlSign = isMovementReversed(state) ? -1 : 1;
      const qdx = state.playerQueuedDirX * controlSign;
      const qdy = state.playerQueuedDirY * controlSign;
      if (qdx !== 0 || qdy !== 0) {
        const ntx = state.playerTileX + qdx;
        const nty = state.playerTileY + qdy;
        if (isFloorTile(state.map, ntx, nty)) {
          state.playerTargetX = ntx;
          state.playerTargetY = nty;
          state.playerDirX = qdx;
          state.playerDirY = qdy;
          state.playerStepProgress = 0;
        }
      }
    }
  } else {
    state.playerStepProgress += baseSpeed;
    const dx = state.playerTargetX - state.playerTileX;
    const dy = state.playerTargetY - state.playerTileY;
    state.playerX = state.playerTileX * TILE_SIZE + TILE_SIZE / 2 + dx * Math.min(state.playerStepProgress, TILE_SIZE);
    state.playerY = state.playerTileY * TILE_SIZE + TILE_SIZE / 2 + dy * Math.min(state.playerStepProgress, TILE_SIZE);
    if (state.playerStepProgress >= TILE_SIZE) {
      state.playerTileX = state.playerTargetX;
      state.playerTileY = state.playerTargetY;
      state.playerX = state.playerTileX * TILE_SIZE + TILE_SIZE / 2;
      state.playerY = state.playerTileY * TILE_SIZE + TILE_SIZE / 2;
      state.playerStepProgress = 0;
      if (knockback?.started) state.playerKnockback = null;

      // Stepped onto an active Frost Warden ice tile — freeze in place
      if (state.frostIceTiles.some(([tx, ty]) => tx === state.playerTileX && ty === state.playerTileY)) {
        state.playerFrozenTicks = FROST_FREEZE_DURATION;
        state.playerQueuedDirX = 0; state.playerQueuedDirY = 0;
        playSFX_frostFreeze();
      }
    }
  }

  // Update which chamber the player is in
  state.playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);

  // Collect resources
  for (let i = state.resources.length - 1; i >= 0; i--) {
    const r = state.resources[i];
    if (r.tileX === state.playerTileX && r.tileY === state.playerTileY) {
      if (r.type === 'health') {
        healPlayer(state, HEAL_AMOUNT);
        state.resources.splice(i, 1);
        playSFX_healPickup();
      } else {
        const wasMax = state.starEnergy >= STAR_ENERGY_MAX;
        state.starEnergy = Math.min(STAR_ENERGY_MAX, state.starEnergy + ENERGY_AMOUNT * (1 + 0.2 * constellationBonus(state, 'energy')));
        showRewardEffect(state, 'player', 'energy');
        if (!wasMax && state.starEnergy >= STAR_ENERGY_MAX) {
          playSFX_powerUp();
        } else playSFX_pickup();
        grantInstantSpeedBoost(state, false);
        state.resources.splice(i, 1);
      }
    }
  }
}

// ─── Meteorite ───────────────────────────────────────────────────────────────

function updateMeteorite(state: GameState) {
  if (state.meteoriteWarning >= 0) {
    // Short alarm pulses during the red-flashing countdown, only in the impact chamber.
    // Scheduling by game ticks also pauses the alarm while the teleport menu is open.
    if (state.meteoriteStrikeIn > 0 && state.meteoriteStrikeIn % 30 === 0 &&
        chamberOfTile(state.playerTileX, state.playerTileY) === state.meteoriteWarning) {
      playSFX_meteorWarning(state.meteoriteStrikeIn <= 60);
    }
    state.meteoriteStrikeIn--;
    if (state.meteoriteStrikeIn === 150) {
      playSFX_meteorFalling();
    }
    if (state.meteoriteStrikeIn <= 0) {
      // STRIKE
      const ch = state.meteoriteWarning;
      state.meteoriteImpact = { chamber: ch, ticks: 60 };
      playSFX_meteorite();
      // Kill all enemies in that chamber (boss only takes heavy damage)
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        if (chamberOfTile(e.tileX, e.tileY) === ch) {
          // An active Frost Warden shield blocks the meteor completely, without
          // draining its absorb pool. Break the shield with attacks first.
          if (e.icyShieldHP > 0) continue;
          if (e.type === 'devourer') {
            // Same 75%-of-max-HP hit as the other bosses, but a meteor alone can never finish
            // her off — the survival floor is 1% of max HP, capped at 50 HP even after growth.
            damageEnemy(state, e, Math.round(e.maxHp * ((state.bossesKilled >= SPECIAL_UNLOCK_KILLS ? BOSS_LATE_METEOR_DMG : BOSS_METEOR_DMG) / 100)), 'meteor');
            const floor = Math.min(50, Math.ceil(e.maxHp * 0.01));
            if (e.hp < floor) e.hp = floor;
          } else if (isBossType(e.type)) {
            // Deals BOSS_METEOR_DMG% of the boss's max HP — so anything already at or below
            // that HP fraction dies outright.
            damageEnemy(state, e, Math.round(e.maxHp * ((state.bossesKilled >= SPECIAL_UNLOCK_KILLS ? BOSS_LATE_METEOR_DMG : BOSS_METEOR_DMG) / 100)), 'meteor');
            if (e.hp <= 0) killEnemy(state, i, true);
          } else {
            killEnemy(state, i, true);
          }
        }
      }
      // Damage player if in struck chamber
      if (state.playerChamber === ch) {
        damagePlayer(state, METEORITE_PLAYER_DMG);
      }
      // Damage ruby if placed in struck chamber
      if (state.rubyTileX !== -1 && chamberOfTile(state.rubyTileX, state.rubyTileY) === ch) {
        damageRuby(state, METEORITE_RUBY_DMG);
      }
      state.meteoriteWarning = -1;
      state.meteoriteTimer = METEORITE_CYCLE + Math.floor(Math.random() * 300 - 150);
    }
  } else {
    state.meteoriteTimer--;
    if (state.meteoriteTimer <= 0) {
      // Cycle chambers clockwise: ALPHA(TL) -> BETA(TR) -> DELTA(BR) -> GAMMA(BL) -> repeat
      state.meteoriteWarning = METEOR_CLOCKWISE_ORDER[state.meteoriteChamberSeq % 4];
      state.meteoriteChamberSeq++;
      state.meteoriteStrikeIn = METEORITE_WARNING;
    }
  }
}

// ─── Abilities ───────────────────────────────────────────────────────────────

// Grants a free speed burst that ignores/doesn't touch the SPEED ability's own cooldown —
// used as a passive bonus (energy pickups, entering the powered-up state), not a manual cast.
function grantInstantSpeedBoost(state: GameState, withSound = true) {
  state.speedActiveTicks = Math.max(state.speedActiveTicks, SPEED_DURATION * (state.constellations.includes('burstDuration') ? 1.25 : 1));
  state.speedFlashTicks = 30;
  if (withSound) playSFX_speed();
}

function checkAndConsumePower(state: GameState): boolean {
  if (state.poweredTicks > 0) return true;
  if (state.starEnergy >= STAR_ENERGY_MAX) {
    state.starEnergy = 0;
    state.poweredTicks = 120 + 60 * constellationBonus(state, 'power');
    grantInstantSpeedBoost(state);
    return true;
  }
  return false;
}

export function useLaser(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.laserCooldown > 0) return;
  const powered = checkAndConsumePower(state);
  const range = (powered ? LASER_RANGE_PWR : LASER_RANGE) + 2 * constellationBonus(state, 'laserRange');
  const dmg = (powered ? LASER_DMG_PWR : LASER_DMG) * (1 + 0.2 * constellationBonus(state, 'laser'));

  const DIRS: [number, number][] = [[1,0],[-1,0],[0,1],[0,-1]];
  let laserHit = false;
  for (const [dx, dy] of DIRS) {
    let tx = state.playerTileX + dx;
    let ty = state.playerTileY + dy;
    let endTx = state.playerTileX;
    let endTy = state.playerTileY;
    for (let r = 0; r < range; r++) {
      if (!isFloorTile(state.map, tx, ty)) break;
      endTx = tx; endTy = ty;
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        if (e.tileX === tx && e.tileY === ty) {
          damageEnemy(state, e, dmg); laserHit = true;
          chainElectric(state, e);
          if (e.hp <= 0) killEnemy(state, i);
        }
      }
      tx += dx; ty += dy;
    }
    state.laserBeams.push({
      fromX: state.playerX, fromY: state.playerY,
      dirX: dx, dirY: dy,
      endX: endTx * TILE_SIZE + TILE_SIZE / 2,
      endY: endTy * TILE_SIZE + TILE_SIZE / 2,
      ticks: 18,
      powered
    });
  }
  state.laserCooldown = LASER_COOLDOWN * (state.constellations.includes('laserRate') ? 0.85 : 1);
  playSFX_laser();
  if (laserHit) playSFX_alienHit();
}

export function pressCharge(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.waveCooldown > 0) return;
  state.chargeDecayTimer = 0;
  state.chargeCount++;
  playSFX_charge();
  if (state.chargeCount >= CHARGE_NEEDED) {
    fireWave(state);
  }
}

// Directly fire wave without charge count — used for hold-left-click and keyboard K
export function activateWave(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.waveCooldown > 0) return;
  fireWave(state);
}

function fireWave(state: GameState) {
  stopChargeSound();
  const powered = checkAndConsumePower(state);
  const radius = (powered ? WAVE_RADIUS_PWR : WAVE_RADIUS) + constellationBonus(state, 'waveReach');
  const dmg = (powered ? WAVE_DMG_PWR : WAVE_DMG) * (1 + 0.25 * constellationBonus(state, 'wave'));
  const push = (powered ? WAVE_PUSH_TILES_PWR : WAVE_PUSH_TILES) + constellationBonus(state, 'waveReach');

  state.waveEffects.push({
    cx: state.playerX, cy: state.playerY,
    radius: 0, maxRadius: radius * TILE_SIZE, ticks: 30, powered
  });

  let waveHit = false;
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    const dist = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
    if (dist <= radius) {
      damageEnemy(state, e, dmg); waveHit = true;
      chainElectric(state, e);
      const edx = e.tileX - state.playerTileX;
      const edy = e.tileY - state.playerTileY;
      const len = Math.sqrt(edx * edx + edy * edy) || 1;
      e.pushDirX = Math.round(edx / len);
      e.pushDirY = Math.round(edy / len);
      if (e.pushDirX === 0 && e.pushDirY === 0) e.pushDirX = 1;
      e.pushTiles = push;
      if (e.hp <= 0) killEnemy(state, i);
    }
  }
  state.chargeCount = 0;
  state.waveCooldown = WAVE_COOLDOWN * (state.constellations.includes('waveRate') ? 0.85 : 1);
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 8);
  state.screenShakeAmt = Math.max(state.screenShakeAmt, 3);
  playSFX_wave();
  if (waveHit) playSFX_alienHit();
}

export function useSpeedBoost(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.speedCooldown > 0) return;
  const powered = checkAndConsumePower(state);
  const dur = (powered ? SPEED_DURATION_PWR : SPEED_DURATION) * (state.constellations.includes('burstDuration') ? 1.25 : 1);
  state.speedActiveTicks = dur;
  state.speedFlashTicks = 30;
  state.speedCooldown = SPEED_COOLDOWN * (state.constellations.includes('burstRate') ? 0.8 : 1);
  playSFX_speed();
}

export function useBomb(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.bomb === null) {
    if (state.bombCooldown > 0) return; // still on cooldown from last explosion
    const powered = checkAndConsumePower(state);
    state.bomb = { tileX: state.playerTileX, tileY: state.playerTileY, powered };
    state.playerCastTicks = 24; state.playerCastKind = 'bomb';
    try {
      const sound = new Audio('/sounds/place_bomb.wav');
      sound.volume = 0.1625 * ATTACK_SFX_VOLUME;
      sound.play().catch(() => {});
    } catch { }
    useSpeedBoost(state); // Automatically try to use speed boost to escape
  } else {
    // Detonate
    state.playerCastTicks = 24; state.playerCastKind = 'bomb';
    const powered = state.bomb.powered;
    const radius = getBombRadius(state, powered);
    const dmg = (powered ? BOMB_DMG_PWR : BOMB_DMG) * (1 + 0.2 * constellationBonus(state, 'bombDamage'));

    const bx = state.bomb.tileX, by = state.bomb.tileY;
    playSFX_bomb();
    state.bombBlasts.push({
      cx: bx * TILE_SIZE + TILE_SIZE / 2,
      cy: by * TILE_SIZE + TILE_SIZE / 2,
      radius: 0, maxRadius: radius * TILE_SIZE, ticks: 28,
    });

    // Snapshot protection before any blast/chain hit can break a shield. The same
    // detonation must not then hit that enemy's HP through a later chained strike.
    const frostProtected = new Set(state.enemies.filter(e => e.icyShieldHP > 0).map(e => e.id));
    let bombHit = false;
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      if (tileEuclidDist(e.tileX, e.tileY, bx, by) <= radius) {
        // An active frost shield blocks this entire blast: it can lose shield HP,
        // but excess bomb damage never spills into the enemy's real HP.
        const damage = frostProtected.has(e.id) ? Math.min(dmg, e.icyShieldHP) : dmg;
        if (damage > 0) damageEnemy(state, e, damage);
        bombHit = true;
        chainElectric(state, e, frostProtected);
        if (e.hp <= 0) killEnemy(state, i);
      }
    }
    if (bombHit) playSFX_alienHit();
    // Damage player if in blast radius (own bomb hurts you)
    if (tileEuclidDist(state.playerTileX, state.playerTileY, bx, by) <= radius) {
      damagePlayer(state, Math.floor(dmg * 0.35));
    }
    state.bomb = null;
    state.bombCooldown = 300 * (state.constellations.includes('bombRate') ? 0.8 : 1);
    state.screenShakeTicks = 22;
    state.screenShakeAmt = powered ? 18 : 12;
  }
}

export function toggleCarryRuby(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.playerCarryingRuby) {
    state.rubyTileX = state.playerTileX;
    state.rubyTileY = state.playerTileY;
    state.playerCarryingRuby = false;
    playSFX_rubyToggle();
  } else {
    if (state.rubyTileX === -1) return;
    const chebyshev = Math.max(
      Math.abs(state.playerTileX - state.rubyTileX),
      Math.abs(state.playerTileY - state.rubyTileY),
    );
    if (chebyshev <= 2) {
      state.playerCarryingRuby = true;
      state.rubyTileX = -1;
      state.rubyTileY = -1;
      state.rubyPlacedFlashTicks = 0;
      playSFX_rubyToggle();
    }
  }
}

export function doTeleport(state: GameState, chamberIdx: number) {
  if (state.gamePhase !== 'teleporting') return;
  if (!state.teleportDestOptions.includes(chamberIdx)) return;
  const [tx, ty] = [10, 39, 10, 39][chamberIdx] !== undefined
    ? ([[10,10],[39,10],[10,39],[39,39]] as [number,number][])[chamberIdx]
    : ([10, 10] as [number,number]);

  state.playerTileX = tx; state.playerTileY = ty;
  state.playerTargetX = tx; state.playerTargetY = ty;
  state.playerX = tx * TILE_SIZE + TILE_SIZE / 2;
  state.playerY = ty * TILE_SIZE + TILE_SIZE / 2;
  state.playerStepProgress = 0;
  state.playerKnockback = null;
  state.playerChamber = chamberIdx;
  state.gamePhase = 'playing';
  state.teleportDestOptions = [];
  state.teleportCooldown = 0;
  playSFX_teleport();

  // Carrying the ruby through a teleport auto-places it on the destination pad.
  if (state.playerCarryingRuby) {
    state.rubyTileX = tx;
    state.rubyTileY = ty;
    state.playerCarryingRuby = false;
    state.rubyPlacedFlashTicks = 120;
  }

  // Every teleport grants a free speed burst (no cooldown interaction), not just ones
  // made while carrying the ruby.
  grantInstantSpeedBoost(state, false);
}

// Called on left-click — opens teleport screen if player is standing on a pad
export function tryActivateTeleport(state: GameState): boolean {
  if (state.gamePhase !== 'playing') return false;
  if (state.teleportCooldown > 0) return false;
  
  if (state.map[state.playerTileY]?.[state.playerTileX] !== T_TELEPORT) return false;
  const chamberIdx = state.playerChamber;
  const destinations = [0, 1, 2, 3].filter(c => c !== chamberIdx);
  state.teleportDestOptions = destinations;
  state.gamePhase = 'teleporting';
  return true;
}

// Returns true when all conditions to heal the ruby are met (used by UI hint too)
export function canHealRuby(state: GameState): boolean {
  if (state.gamePhase !== 'playing') return false;
  if (state.rubyHP >= RUBY_MAX_HP && state.playerHP >= PLAYER_MAX_HP) return false;
  if (!state.playerCarryingRuby && state.rubyTileX !== -1) {
    const dist = Math.max(
      Math.abs(state.playerTileX - state.rubyTileX),
      Math.abs(state.playerTileY - state.rubyTileY),
    );
    if (dist > RUBY_HEAL_RANGE) return false;
  }
  for (const e of state.enemies) {
    if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= RUBY_HEAL_CLEAR_RANGE) return false;
  }
  return true;
}

export function healRuby(state: GameState): boolean {
  if (!canHealRuby(state)) return false;
  if (state.rubyHealCooldown > 0) return false;
  healCore(state, RUBY_HEAL_AMOUNT + 2 * constellationBonus(state, 'manualHealing'));
  healPlayer(state, 3 + constellationBonus(state, 'manualHealing'));
  state.rubyHealCooldown = RUBY_HEAL_COOLDOWN / (1 + 0.2 * constellationBonus(state, 'healing'));
  state.healJiggleTicks = 18;
  try { const a = new Audio('/sounds/deghost.wav'); a.volume = 0.32; a.play().catch(() => {}); } catch {}
  return true;
}

export function cancelTeleport(state: GameState) {
  if (state.gamePhase !== 'teleporting') return;
  state.gamePhase = 'playing';
  state.teleportDestOptions = [];
  state.teleportCooldown = 0;
}

function takeNextNaturalBoss(state: GameState): BossType {
  if(state.bossPool.length===0)state.bossPool=[...BOSS_TYPES];
  const choices=state.bossPool.length>1?state.bossPool.filter(type=>type!==state.lastNaturalBoss):state.bossPool;
  const next=choices[Math.floor(Math.random()*choices.length)];
  state.bossPool=state.bossPool.filter(type=>type!==next);
  state.lastNaturalBoss=next;
  return next;
}

// ─── Main tick ───────────────────────────────────────────────────────────────

export function tick(state: GameState) {
  if (state.gamePhase !== 'playing') { stopPoisonSound(); stopSingularitySound(); stopGaiaFieldSound(); return; }

  if (state.constellationDelayTicks > 0 && --state.constellationDelayTicks === 0 && state.constellationChoices.length) {
    state.gamePhase = 'constellation';
    state.playerQueuedDirX = state.playerQueuedDirY = 0;
    stopChargeSound(); stopPoisonSound(); stopSingularitySound(); stopGaiaFieldSound();
    return;
  }
  state.gameTick++;
  if (state.meteoriteImpact && --state.meteoriteImpact.ticks <= 0) state.meteoriteImpact = null;
  if(state.lunarDecoy){
    if(state.lunarDecoy.flashTicks>0)state.lunarDecoy.flashTicks--;
    if(state.lunarDecoy.invulnerableTicks>0)state.lunarDecoy.invulnerableTicks--;
  }
  if (state.ascensionBannerTicks > 0) state.ascensionBannerTicks--;
  state.specialEffects = state.specialEffects.filter(fx => --fx.ticks > 0);
  if (state.seaHealingDebuffTicks > 0) state.seaHealingDebuffTicks--;
  if (state.kingArenaPulseTicks > 0) state.kingArenaPulseTicks--;
  if (state.bossSpawnTicks > 0) state.bossSpawnTicks--;

  // Score (time in seconds × 10)
  state.score += 1 / 60;

  // Ease into the first boss, then advance enemy pressure with defeated bosses.
  state.difficultyTimer++;
  let openingTier=0;
  for(let i=1;i<DIFFICULTY_OPENING_THRESHOLDS.length;i++)if(state.difficultyTimer>=DIFFICULTY_OPENING_THRESHOLDS[i])openingTier=i;
  const stageTier=state.bossesKilled>0?Math.min(DIFFICULTY_TIERS.length-1,3+state.bossesKilled):0;
  state.difficultyLevel=Math.max(state.difficultyLevel,openingTier,stageTier);

  // Cooldown tickers — LASER/BULLET/WAVE ("attack speed") tick down at half rate while
  // chilled by a Frost Warden sharing the player's chamber.
  const chilledNow = isPlayerChilled(state);
  if (chilledNow && !state.playerChilledPrev) playSFX_frostFieldEnter();
  state.playerChilledPrev = chilledNow;
  const chillRate = chilledNow ? FROST_CHILL_TICK_RATE : 1;
  if (state.laserCooldown > 0) state.laserCooldown -= chillRate;
  if (state.bulletCooldown > 0) state.bulletCooldown -= chillRate;
  if (state.waveCooldown > 0) state.waveCooldown -= chillRate;
  if (state.speedCooldown > 0) state.speedCooldown--;
  if (state.bombCooldown > 0) state.bombCooldown--;
  if (state.speedActiveTicks > 0) state.speedActiveTicks--;
  if (state.speedFlashTicks > 0) state.speedFlashTicks--;
  if (state.rubyPlacedFlashTicks > 0) state.rubyPlacedFlashTicks--;
  if (state.playerCastTicks > 0 && --state.playerCastTicks === 0) state.playerCastKind = null;
  if (state.runnerEnergyFlashTicks > 0) state.runnerEnergyFlashTicks--;
  if (state.playerFrozenTicks > 0) {
    state.playerFrozenTicks--;
    if (state.playerFrozenTicks === 0) playSFX_thaw();
  }
  if (state.teleportCooldown > 0) state.teleportCooldown--;
  if (state.poweredTicks > 0) state.poweredTicks--;
  if (state.screenShakeTicks > 0) state.screenShakeTicks--;
  if (state.rubyHealCooldown > 0) state.rubyHealCooldown--;
  if (state.electricBuffTicks > 0) state.electricBuffTicks--;
  if (state.healJiggleTicks > 0) state.healJiggleTicks--;
  if (state.hallwaySealCooldown > 0) state.hallwaySealCooldown--;

  // Storm Reaper hallway seal — lift it once its duration expires
  if (state.hallwaySealTicks > 0) {
    state.hallwaySealTicks--;
    if (state.hallwaySealTicks <= 0) {
      setHallwayWalled(state, state.hallwaySeal, false);
      state.hallwaySeal = -1;
    }
  }

  // First boss keeps its opening delay; later cooldowns begin on boss death.
  const hasActiveBoss = state.enemies.some(e => isBossType(e.type));
  if (!state.noBossSpawns && state.difficultyLevel >= 1 && !hasActiveBoss) {
    if (state.bossWarningTicks > 0) {
      state.bossWarningTicks--;
      if (state.bossWarningTicks === 0) {
        // Spawn one random boss-tier enemy at a spawn tile far from player.
        // "hasBoss" covers all seven boss types — only one boss-tier enemy may exist at a time.
        const hasBoss = state.enemies.some(e => isBossType(e.type));
        if (!hasBoss) {
          const allSpawns: [number, number][] = [];
          for (let ch = 0; ch < 4; ch++) {
            for (const [tx, ty] of CHAMBER_SPAWN_TILES[ch]) {
              if (Math.abs(tx - state.playerTileX) + Math.abs(ty - state.playerTileY) > 10) {
                allSpawns.push([tx, ty]);
              }
            }
          }
          if (allSpawns.length > 0) {
            const [tx, ty] = allSpawns[Math.floor(Math.random() * allSpawns.length)];
            const bossType = takeNextNaturalBoss(state);
            const cfg = ENEMY_CONFIGS[bossType];
            const bossHp = cfg.maxHp + state.bossesKilled * 15;
            state.enemies.push({
              id: state.nextEnemyId++, type: bossType,
              x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2,
              tileX: tx, tileY: ty, targetTileX: tx, targetTileY: ty,
              stepProgress: 0, hp: bossHp, maxHp: bossHp,
              path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
              pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0,
              shootTicks: 0, exploding: false, explodeTick: 0,
              windupTicks: bossType === 'frost_warden' ? FROST_SHIELD_CAST_DELAY : 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1,
              phaseTimer: bossType === 'splitter_queen' ? QUEEN_PHASE_INTERVAL : bossType === 'frost_warden' ? FROST_RELOCATE_INTERVAL : 0,
              icyShieldHP: 0,
              prayer: bossType === 'blind_prayer' ? createPrayerAbilities() : undefined,
              king: bossType === 'fiery_king' ? { untouchedTicks: 0, arenaWindupTicks: 0 } : undefined,
              sea: bossType === 'sea_chanter' ? createSeaChanterAbilities() : undefined,
              thorn: bossType === 'thorn_weaver' ? createThornAbilities() : undefined,
            });
            state.bossSpawnName = BOSS_NAMES[bossType];
            state.bossSpawnColor = cfg.color;
            state.bossSpawnTicks = BOSS_ANNOUNCEMENT_TICKS;
            if (bossType === 'frost_warden') scatterFrostIceTiles(state, chamberOfTile(tx, ty));
          }
        }
        state.bossTimer = BOSS_SPAWN_INTERVAL;
      }
    } else {
      state.bossTimer--;
      if (state.bossTimer <= 0) {
        state.bossWarningTicks = BOSS_WARNING_TICKS;
      }
    }
  }

  // Charge decay
  if (state.chargeCount > 0) {
    state.chargeDecayTimer++;
    if (state.chargeDecayTimer >= CHARGE_DECAY_TICKS) {
      state.chargeCount = 0;
      state.chargeDecayTimer = 0;
    }
  }

  // Minor events use the real player position before any Lunar AI substitution.
  if (updateAmbientEvents(state)) {
    healPlayer(state, 20); healCore(state, 20);
    state.starEnergy = STAR_ENERGY_MAX;
    grantInstantSpeedBoost(state, false);
    showRewardEffect(state, 'player', 'energy');
    playSFX_powerUp();
  }

  // Player movement + resource pickup
  updatePlayer(state);

  // Enemy spawning
  if (!state.noMobs) state.spawnTimer++;
  const tier = DIFFICULTY_TIERS[Math.min(state.difficultyLevel, DIFFICULTY_TIERS.length - 1)];
  if (!state.noMobs && state.spawnTimer >= tier.spawnInterval) {
    state.spawnTimer = 0;
    spawnEnemy(state);
  }

  // Enemy AI + attacks
  updateSingularity(state);
  updateCelestialField(state);
  if (!isEclipseActive(state)) {
    updateEnemyTargets(state);
    updateSeaSongWaves(state);
    updateThornHazards(state);
    updatePoisonSound(state);
  } else stopPoisonSound();

  // Meteorite
  updateMeteorite(state);

  // Resource spawn
  state.resourceTimer++;
  if (state.resourceTimer >= RESOURCE_SPAWN_INTERVAL) {
    state.resourceTimer = 0;
    spawnResource(state);
  }

  // Update bullets
  for (let i = state.laserBullets.length - 1; i >= 0; i--) {
    const b = state.laserBullets[i];
    b.x += b.dx;
    b.y += b.dy;
    b.ticks++;
    const maxRange = (b.powered ? LASER_RANGE_PWR : LASER_RANGE) + 3.5;
    if (b.x < 0 || b.x >= MAP_COLS || b.y < 0 || b.y >= MAP_ROWS || (b.ticks * BULLET_SPEED) > maxRange) {
      state.laserBullets.splice(i, 1);
      continue;
    }
    const dmg = (b.powered ? BULLET_DMG_PWR : BULLET_DMG) * (1 + 0.25 * constellationBonus(state, 'bullets'));
    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (isSeaChanterDiving(e)) continue;
      if (Math.abs(e.tileX + 0.5 - b.x) < 0.6 && Math.abs(e.tileY + 0.5 - b.y) < 0.6) {
        damageEnemy(state, e, dmg);
        chainElectric(state, e);
        hit = true;
        if (e.hp <= 0) killEnemy(state, j);
        break; // no piercing
      }
    }
    if (hit) {
      state.laserBullets.splice(i, 1);
      playSFX_alienHit();
    }
  }

  // Decay visual FX
  state.prayerWaves = (state.prayerWaves ?? []).filter(wave => { wave.ticks--; return wave.ticks > 0; });
  state.rewardEffects = state.rewardEffects.filter(fx => { fx.ticks--; return fx.ticks > 0; });
  state.laserBeams = state.laserBeams.filter(b => { b.ticks--; return b.ticks > 0; });
  state.waveEffects = state.waveEffects.filter(w => { w.ticks--; w.radius = w.maxRadius * (1 - w.ticks / 30); return w.ticks > 0; });
  state.bombBlasts = state.bombBlasts.filter(b => { b.ticks--; b.radius = b.maxRadius * (1 - b.ticks / 28); return b.ticks > 0; });
  state.lightningArcs = state.lightningArcs.filter(a => { a.ticks--; return a.ticks > 0; });
  state.slashEffects = state.slashEffects.filter(s => { s.ticks--; return s.ticks > 0; });
  state.deathParticles = state.deathParticles.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.9; p.vy *= 0.9;
    p.ticks--;
    return p.ticks > 0;
  });
  // Clean up chain-lightning casualties
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    if (state.enemies[i].hp <= 0) killEnemy(state, i);
  }
}

// God-mode debug tool: clear/suppress regular enemies without rewards or boss cleanup.
export function godSetNoBossSpawns(state: GameState, enabled: boolean) {
  state.noBossSpawns=enabled;
  if(enabled){
    state.enemies=state.enemies.filter(e=>!isBossType(e.type)&&e.type!=='queen_echo');
    clearThornHazards(state);stopSeaSounds();state.seaSongWaves=[];state.seaSongBursts=[];state.seaHealingDebuffTicks=0;
    state.prayerWaves=[];state.frostIceTiles=[];state.playerFrozenTicks=0;state.kingArenaPulseTicks=0;state.slashEffects=[];
    const bossColors=new Set(['#cc0022','#cc33ff','#dd88ff','#6b2fa8','#aaeeff','#ffdd22']);
    state.laserBeams=state.laserBeams.filter(beam=>!bossColors.has(beam.color??''));
    if(state.hallwaySeal!==-1)setHallwayWalled(state,state.hallwaySeal,false);
    state.hallwaySeal=-1;state.hallwaySealTicks=0;
    state.bossWarningTicks=0;state.bossTimer=BOSS_SPAWN_INTERVAL;state.bossSpawnTicks=0;
  }
}

export function godSetNoMobs(state: GameState, enabled: boolean) {
  state.noMobs = enabled;
  state.spawnTimer = 0;
  if (enabled) state.enemies = state.enemies.filter(e => isBossType(e.type) || e.type === 'queen_echo');
}

// God-mode debug tool: force-spawn a specific boss type at a random valid spawn tile,
// removing whichever boss-tier enemy currently exists (queen decoys are left alone —
// they persist independently of their queen per normal rules).
export function godAdvanceStage(state: GameState) {
  if (state.gamePhase !== 'playing' || state.constellationChoices.length) return;
  state.bossesKilled++;
  state.difficultyLevel = Math.max(state.difficultyLevel, Math.min(DIFFICULTY_TIERS.length - 1, 3 + state.bossesKilled));
  if (state.bossesKilled === SPECIAL_UNLOCK_KILLS) state.ascensionBannerTicks = 360;
  offerConstellation(state);
}

export function godEnterAscension(state: GameState) {
  if(state.gamePhase!=='playing')return;
  state.bossesKilled=Math.max(state.bossesKilled,SPECIAL_UNLOCK_KILLS);
  state.difficultyLevel=DIFFICULTY_TIERS.length-1;state.difficultyTimer=0;
  state.noMobs=false;state.spawnTimer=0;state.ascensionBannerTicks=360;
}

export function godSpawnBoss(state: GameState, bossType: BossType) {
  state.noBossSpawns=false; // Explicit manual spawn exits No Boss mode.
  clearThornHazards(state);
  state.enemies = state.enemies.filter(e => !isBossType(e.type));
  state.seaSongWaves = [];
  state.seaSongBursts = [];
  state.seaHealingDebuffTicks = 0;
  stopSeaSounds();
  if (state.hallwaySeal !== -1) {
    setHallwayWalled(state, state.hallwaySeal, false);
    state.hallwaySeal = -1;
    state.hallwaySealTicks = 0;
  }
  state.frostIceTiles = [];

  const allSpawns: [number, number][] = [];
  for (let ch = 0; ch < 4; ch++) {
    for (const [tx, ty] of CHAMBER_SPAWN_TILES[ch]) {
      if (Math.abs(tx - state.playerTileX) + Math.abs(ty - state.playerTileY) > 10) {
        allSpawns.push([tx, ty]);
      }
    }
  }
  if (allSpawns.length === 0) return;
  const [tx, ty] = allSpawns[Math.floor(Math.random() * allSpawns.length)];
  const cfg = ENEMY_CONFIGS[bossType];
  const bossHp = cfg.maxHp + state.bossesKilled * 15;
  state.enemies.push({
    id: state.nextEnemyId++, type: bossType,
    x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2,
    tileX: tx, tileY: ty, targetTileX: tx, targetTileY: ty,
    stepProgress: 0, hp: bossHp, maxHp: bossHp,
    path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
    pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0,
    shootTicks: 0, exploding: false, explodeTick: 0,
    windupTicks: bossType === 'frost_warden' ? FROST_SHIELD_CAST_DELAY : 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1,
    phaseTimer: bossType === 'splitter_queen' ? QUEEN_PHASE_INTERVAL : bossType === 'frost_warden' ? FROST_RELOCATE_INTERVAL : 0,
    icyShieldHP: 0,
  });
  if (bossType === 'frost_warden') scatterFrostIceTiles(state, chamberOfTile(tx, ty));
  if (bossType === 'blind_prayer') state.enemies[state.enemies.length - 1].prayer = createPrayerAbilities();
  if (bossType === 'fiery_king') state.enemies[state.enemies.length - 1].king = { untouchedTicks: 0, arenaWindupTicks: 0 };
  if (bossType === 'sea_chanter') state.enemies[state.enemies.length - 1].sea = createSeaChanterAbilities();
  if (bossType === 'thorn_weaver') state.enemies[state.enemies.length - 1].thorn = createThornAbilities();
  state.bossWarningTicks = 0;
  state.bossSpawnName = BOSS_NAMES[bossType];
  state.bossSpawnColor = cfg.color;
  state.bossSpawnTicks = BOSS_ANNOUNCEMENT_TICKS;
  state.bossTimer = BOSS_SPAWN_INTERVAL;
}

export function useSpecialSkill(state: GameState): boolean {
  if(state.gamePhase!=='playing')return false;
  if(!state.specialSkill){playCelestialSound('empty');return false;}
  const kind = state.specialSkill;
  if(kind !== 'devourer') playCelestialSound(kind);
  if(kind === 'fiery_king') playCelestialSound('solar_swoosh');
  if(kind === 'storm_reaper') playCelestialSound('jupiter_shot');
  if(kind === 'storm_reaper') {
    try {const sound=new Audio('/sounds/bossQueenAttack1.mp3');sound.volume=.55*ATTACK_SFX_VOLUME;sound.loop=false;sound.play().catch(()=>{});} catch {}
  }
  if(kind === 'sea_chanter') playCelestialSound('neptune_electric');
  // Consume before resolving kills so a newly earned reward is never erased.
  state.specialSkill = null;
  state.playerCastTicks = 24; state.playerCastKind = kind;
  state.specialEffects.push({ kind, x: state.playerX, y: state.playerY, ticks: kind==='splitter_queen'?54:kind==='fiery_king'?48:36 });
  if(kind==='devourer'){
    const stacks=Math.max(0,Math.min(DEVOURER_MAX_STACKS,state.specialDevourerStacks));
    const ticks=720+stacks*36;
    state.singularity={x:(Math.floor(state.playerX/TILE_SIZE)+.5)*TILE_SIZE,y:(Math.floor(state.playerY/TILE_SIZE)+.5)*TILE_SIZE,ticks,maxTicks:ticks,stacks,pullTimer:15,damageTimer:60};updateSingularitySound(state);return true;
  }
  if(kind==='thorn_weaver'){
    state.celestialField={x:Math.floor(state.playerX/TILE_SIZE)*TILE_SIZE,y:Math.floor(state.playerY/TILE_SIZE)*TILE_SIZE,ticks:SPECIAL_WEAVER_DURATION,damageTimer:60};return true;
  }
  if(kind==='splitter_queen'){
    state.lunarDecoy={x:state.playerX,y:state.playerY,tileX:state.playerTileX,tileY:state.playerTileY,hitsLeft:SPECIAL_QUEEN_DECOY_HITS,maxHits:SPECIAL_QUEEN_DECOY_HITS,flashTicks:0,invulnerableTicks:0};
    state.enemies.forEach(e=>e.pathTimer=0);return true;
  }
  if (kind === 'sea_chanter') {
    healPlayer(state, SPECIAL_CHANTER_HEAL); healCore(state, SPECIAL_CHANTER_HEAL);
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0 || Math.hypot(enemy.x-state.playerX, enemy.y-state.playerY)>SPECIAL_CHANTER_RADIUS) continue;
      const dx=enemy.x-state.playerX,dy=enemy.y-state.playerY,length=Math.hypot(dx,dy)||1;
      enemy.pushDirX=Math.round(dx/length);enemy.pushDirY=Math.round(dy/length);
      if(!enemy.pushDirX && !enemy.pushDirY)enemy.pushDirX=1;
      enemy.pushTiles=Math.max(enemy.pushTiles,SPECIAL_CHANTER_PUSH);
    }
    return true;
  }
  if (kind === 'blind_prayer') {
    playSFX_powerUp();
    state.starEnergy=0;state.poweredTicks=Math.max(state.poweredTicks,SPECIAL_PRAYER_DURATION+60*constellationBonus(state,'power'));
    state.laserCooldown=0;state.bulletCooldown=0;state.waveCooldown=0;
    state.bombCooldown=0;state.speedCooldown=0;
    grantInstantSpeedBoost(state, false);return true;
  }
  if (kind === 'frost_warden') {
    state.playerShieldHP = Math.max(state.playerShieldHP, SPECIAL_WARDEN_SHIELD);
    state.rubyShieldHP = Math.max(state.rubyShieldHP, SPECIAL_WARDEN_SHIELD);
    state.playerSaturnShield=true;state.rubySaturnShield=true;
    showRewardEffect(state, 'player', 'shield'); showRewardEffect(state, 'ruby', 'shield');
    return true;
  }
  const cfg = SPECIAL_SKILLS[kind];
  const targets = state.enemies.filter(e => e.hp > 0 &&
    (kind === 'fiery_king' || Math.hypot(e.x - state.playerX, e.y - state.playerY) <= SPECIAL_REAPER_RADIUS));
  // Snapshot the cast's victims: splits/decoy cleanup cannot make it hit anyone twice.
  for (const target of targets) {
    damageEnemy(state, target, isBossType(target.type) ? target.maxHp * cfg.bossDamage : cfg.normalDamage, 'special');
  }
  for (const target of targets) {
    const index = state.enemies.indexOf(target);
    if (index >= 0 && target.hp <= 0) killEnemy(state, index);
  }

  const shakeActive=state.screenShakeTicks>0;
  state.screenShakeTicks = Math.max(state.screenShakeTicks, kind==='fiery_king'?14:18);
  state.screenShakeAmt = Math.max(shakeActive?state.screenShakeAmt:0, kind==='fiery_king'?6:8);
  return true;
}

export function useBullet(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.bulletCooldown > 0) return;
  const powered = checkAndConsumePower(state);
  
  // Find nearest enemy within bullet range
  const maxRange = powered ? LASER_RANGE_PWR : LASER_RANGE;
  let bestDist = maxRange + 3.5; // +3.5 because we added 3.5 to the actual range in the check
  let targetE = null;
  for (const e of state.enemies) {
    if (isSeaChanterDiving(e)) continue;
    const dist = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
    if (dist < bestDist) {
      bestDist = dist;
      targetE = e;
    }
  }

  let dx = 0, dy = 0;
  if (targetE) {
    const rdx = targetE.tileX - state.playerTileX;
    const rdy = targetE.tileY - state.playerTileY;
    const len = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
    dx = (rdx / len) * BULLET_SPEED;
    dy = (rdy / len) * BULLET_SPEED;
  } else {
    // Fire in facing direction
    if (state.playerDirX === 0 && state.playerDirY === 0) {
      dx = BULLET_SPEED; dy = 0;
    } else {
      dx = state.playerDirX * BULLET_SPEED;
      dy = state.playerDirY * BULLET_SPEED;
    }
  }

  state.laserBullets.push({
    x: state.playerX / TILE_SIZE,
    y: state.playerY / TILE_SIZE,
    dx, dy, powered, ticks: 0
  });
  state.bulletCooldown = BULLET_COOLDOWN;
  playSFX_laserBullet();
}
