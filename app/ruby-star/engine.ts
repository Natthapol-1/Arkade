import {
  NEPTUNE_PHASE_HP, NEPTUNE_DIVE_POINTS, NEPTUNE_CLONES, NEPTUNE_FINAL_CLONES, NEPTUNE_DIVE_TICKS, NEPTUNE_CLONE_DROP_GAP, NEPTUNE_CLONE_HEAL, NEPTUNE_DIVE_SPEED,
  NEPTUNE_BOMB_INTERVAL, NEPTUNE_BOMB_FUSE, NEPTUNE_BOMB_RADIUS, NEPTUNE_BOMB_DAMAGE, NEPTUNE_BOMB_SELF_DAMAGE, NEPTUNE_ATTACK_MULT, NEPTUNE_LIFESTEAL,
  NEPTUNE_STRIKE_DAMAGE, NEPTUNE_HEAL_CHARGE_MAX, NEPTUNE_LASER_WARNING, NEPTUNE_FISH_CAP, NEPTUNE_FISH_RED_CHANCE, NEPTUNE_FISH_SPAWN_GAP,
  NEPTUNE_FISH_HEAL, NEPTUNE_FISH_BOSS_HEAL, NEPTUNE_FISH_HURT, NEPTUNE_STINGER_CHANCE, NEPTUNE_POISON_TICKS, NEPTUNE_POISON_DAMAGE,
  NEPTUNE_CLONE_HEAL_BLOCK, NEPTUNE_TIDE_TICKS, NEPTUNE_TIDE_GAP, NEPTUNE_TIDE_ROTATE, NEPTUNE_TIDE_WITH, NEPTUNE_TIDE_AGAINST, NEPTUNE_TIDE_PUSH_GAP,
} from './constants';
import { stopAmbientEventSounds, pauseAmbientEventSounds, resumeAmbientEventSounds } from './event-audio';
import { createAmbientEvents, updateAmbientEvents, isEclipseActive, hitSupernova, SUPERNOVA_PLAYER_RADIUS, SUPERNOVA_FULL_DAMAGE_RADIUS, type AmbientEventState } from './events';
export { AMBIENT_EVENTS, STAR_FALL_TICKS, SUPERNOVA_CHARGE_TICKS, SUPERNOVA_BLAST_TICKS, triggerAmbientEvent } from './events';
export type { AmbientEventKind } from './events';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  SpecialSkill, SPECIAL_UNLOCK_KILLS, SPECIAL_SKILLS, SPECIAL_REAPER_RADIUS, SPECIAL_WARDEN_SHIELD,
  SPECIAL_VENUS_DURATION, SPECIAL_VENUS_DAMAGE_MULT, SPECIAL_VENUS_BOSS_REFLECT_CAP, SPECIAL_TWIN_DURATION, SPECIAL_TWIN_DAMAGE_MULT,
  SPECIAL_CHANTER_HEAL, SPECIAL_CHANTER_RADIUS, SPECIAL_CHANTER_PUSH, SPECIAL_PRAYER_DURATION, SPECIAL_QUEEN_DECOY_HITS, SPECIAL_QUEEN_DECOY_INVULNERABILITY,
  SPECIAL_WEAVER_DURATION, SPECIAL_WEAVER_RADIUS, SPECIAL_WEAVER_SLOW, SPECIAL_WEAVER_NORMAL_DAMAGE, SPECIAL_WEAVER_BOSS_DAMAGE,
  SPECIAL_SINGULARITY_RADIUS, SPECIAL_SINGULARITY_TICKS, SPECIAL_SINGULARITY_NORMAL_DAMAGE, SPECIAL_SINGULARITY_BOSS_DAMAGE, REGULAR_ENEMY_HP_MULT,
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
  METEORITE_CYCLE, METEORITE_WARNING, TUTORIAL_STEPS, TUTORIAL_STEP_PAUSE, TRIAL_BOSS_DELAY, TRIAL_SKILL_COOLDOWN, METEORITE_PLAYER_DMG, METEORITE_RUBY_DMG,
  SNIPER_ATTACK_RANGE, SNIPER_WINDUP_TICKS, SNIPER_CHAIN_RANGE, SNIPER_CHAIN_DMG,
  HEALER_HEAL_RADIUS, HEALER_HEAL_AMOUNT, HEALER_HEAL_INTERVAL,
  CHARGER_CHARGE_SPEED, CHARGER_WINDUP_TICKS, CHARGER_CHARGE_TILES, CHARGER_SIGHT_RANGE, CHARGER_STUN_TICKS,
  SHIELDER_SHIELD_RANGE, KILL_SHIELD_HP,
  BOSS_SPAWN_INTERVAL, BOSS_WARNING_TICKS, BOSS_METEOR_DMG, BOSS_LATE_METEOR_DMG, BOSS_ATTACK_RANGE, BOSS_FIRST_SPAWN_TIMER,
  BOSS_ANNOUNCEMENT_TICKS, BOSS_NAMES, BOSS_TYPES, BossType, isBossType, PRAYER_FLEE_REPATH_TICKS,
  BOSS_SKILL_REWARDS, AEGIS_DAMAGE_MULT, AEGIS_REFLECT_RATIO, AEGIS_EXPOSE_TICKS, AEGIS_RESHIELD_WARNING_TICKS, AEGIS_EXPOSED_SPEED,
  PYLON_LIFETIME_TICKS, PYLON_OVERLOAD_WINDUP, PYLON_OVERLOAD_DAMAGE,
  TWIN_REVIVE_TICKS, TWIN_REVIVE_HP_RATIO, TWIN_REVIVE_HASTE_TICKS, TWIN_REVIVE_HASTE_MULT, TWIN_BERSERK_SPEED_MULT, TWIN_BERSERK_COOLDOWN_MULT, TWIN_BERSERK_DAMAGE_TAKEN, TWIN_MIN_SEPARATION,
  TWIN_RANGED_RANGE, TWIN_RANGED_SPEED, TWIN_RANGED_WINDUP, TWIN_RANGED_COOLDOWN, TWIN_RANGED_DAMAGE,
  TWIN_TRANSFER_MIN_TICKS, TWIN_TRANSFER_MAX_TICKS, TWIN_TRANSFER_RATIO, TWIN_TRANSFER_FX_TICKS,
  PRAYER_RUBY_COOLDOWN, PRAYER_RUBY_WINDUP, PRAYER_ESCAPE_WINDUP,
  PRAYER_ESCAPE_DURATION, PRAYER_ESCAPE_SPEED, PRAYER_ESCAPE_GRACE,
  PRAYER_KNOCKBACK_SPEED,
  THORN_WINDUP, THORN_FIRST_DELAY, THORN_RADIUS, THORN_DEFENSE_RADIUS, THORN_DEFENSE_TRIGGER_RANGE, THORN_DEFENSE_COOLDOWN, THORN_LIFETIME, THORN_MAX_PATCHES, getThornFieldBounds,
  THORN_POISON_TICKS, THORN_POISON_INTERVAL, THORN_POISON_DAMAGE, THORN_CONTACT_DAMAGE, THORN_CONTACT_INTERVAL, THORN_SLOW_MULT, THORN_FLEE_RANGE,
  SEA_DIVE_DAMAGE_MULTIPLIER, SEA_DIVE_SPEED, SEA_DIVE_FLEE_RANGE, SEA_DIVE_ENTER_HP, SEA_DIVE_EXIT_HP, SEA_MINIMAP_INTERVAL, SEA_MINIMAP_REVEAL,
  SEA_ALLY_HEAL_RADIUS, SEA_ALLY_HEAL_AMOUNT, SEA_ALLY_HEAL_INTERVAL, SEA_ALLY_PASSIVE_HEAL, SEA_FEED_HEAL_RATIO, SEA_FEED_HEAL_CAP, SEA_HEALING_BLOCK_TICKS,
  SEA_SONG_WINDUP, SEA_SONG_FIRST_DELAY, SEA_SONG_SPEED, SEA_SONG_HIT_RADIUS, SEA_SONG_BLAST_RADIUS, SEA_SONG_BLAST_TICKS, SEA_SONG_BLAST_DAMAGE_CENTER, SEA_SONG_BLAST_DAMAGE_EDGE,
  KING_SPEED_RAMP_PER_SEC, KING_SPEED_CAP,
  KING_UNTOUCHED_TICKS, KING_ARENA_WINDUP, KING_ARENA_DAMAGE, KING_ARENA_DAMAGE_MAX, KING_RAMP_SECONDS, KING_ARENA_FX_TICKS,
  QUEEN_PHASE_INTERVAL, QUEEN_ATTACK_RANGE, QUEEN_WINDUP_TICKS, QUEEN_PHASE_HEAL_PCT, QUEEN_PHASE_HEAL_CAP,
  REAPER_SEAL_DURATION, REAPER_SEAL_COOLDOWN,
  DEVOURER_ABSORB_RANGE, DEVOURER_ABSORB_COOLDOWN, DEVOURER_ABSORB_COOLDOWN_PER_GEN, DEVOURER_ABSORB_COOLDOWN_GEN_STEP, DEVOURER_MAX_STACKS, DEVOURER_STACK_HP_PCT, DEVOURER_STACK_DAMAGE,
  DEVOURER_FULL_HEAL_PCT, DEVOURER_HUNGRY_BELOW, DEVOURER_NEWBORN_TICKS, DEVOURER_NEWBORN_SPEED_MULT, DEVOURER_COPY_FIRST_MEAL, DEVOURER_START_STACKS, DEVOURER_GEN_SPEED_MULT, DEVOURER_GEN_DAMAGE_MULT, DEVOURER_FAMILY_CAP, DEVOURER_SELF_SPLIT_TICKS, DEVOURER_BODY_KILL_HEAL, DEVOURER_HP_PER_DEFEAT, DEVOURER_COPY_HP_RATIO, DEVOURER_COPY_SCALE,
  FROST_CHILL_SPEED_MULT, FROST_CHILL_TICK_RATE, FROST_ICE_TILE_COUNT,
  FROST_FREEZE_DURATION, FROST_RELOCATE_INTERVAL, FROST_SHIELD_HP, FROST_SHIELD_HP_PER_DEFEAT, FROST_SHIELD_HP_MAX, FROST_SHIELD_CAST_DELAY,
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
export const ASCENSION_START_CONSTELLATIONS = 3; // picks offered one after another when Ascension mode starts

export function constellationBonus(state: GameState, kind: Constellation): number {
  return state.constellations.includes(kind) ? 1 : 0;
}

export function getBombRadius(state: GameState, powered: boolean): number {
  return (powered ? BOMB_RADIUS_PWR : BOMB_RADIUS) + constellationBonus(state, 'bomb');
}

// Extra health applies only to new regular aliens, including Splitter children.
export const LATE_ALIEN_HP_FROM = 18;        // milestone bonus tops out here (+30%)...
export const LATE_ALIEN_HP_PER_STAGE = 0.02; // ...then every further boss defeat adds 2%, without a cap

export function constellationAlienHPMult(state: GameState): number {
  return 1 + Math.min(6, Math.floor(state.bossesKilled / CONSTELLATION_INTERVAL)) * 0.05
    + Math.max(0, state.bossesKilled - LATE_ALIEN_HP_FROM) * LATE_ALIEN_HP_PER_STAGE;
}

// force skips the every-third-boss check (used for Ascension's starting picks).
function offerConstellation(state: GameState, force = false) {
  if ((!force && state.bossesKilled % CONSTELLATION_INTERVAL !== 0) || state.gamePhase === 'lost') return;
  const pool = (Object.keys(CONSTELLATIONS) as Constellation[]).filter(kind => !state.constellations.includes(kind));
  if (!pool.length) return;
  const choices: Constellation[] = [];
  while (choices.length < 2 && pool.length) choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  state.constellationChoices = choices;
  state.constellationDelayTicks = 60;
}

export const CONSTELLATION_REVEAL_TICKS = 96;

export function chooseConstellation(state: GameState, kind: Constellation): boolean {
  if (state.gamePhase !== 'constellation' || !state.constellationChoices.includes(kind)) return false;
  if (state.godConstellationMode) {
    const index=state.constellations.indexOf(kind);
    if(index>=0)state.constellations.splice(index,1);else state.constellations.push(kind);
    return true;
  }
  if (state.constellations.includes(kind)) return false;
  state.constellations.push(kind);
  state.constellationReveal = { kind, ticks: CONSTELLATION_REVEAL_TICKS };
  try {
    const sound = new Audio('/sounds/constellation-chosen.wav'); sound.volume = .6; sound.play().catch(() => {});
  } catch { }
  state.constellationChoices = [];
  state.playerQueuedDirX = state.playerQueuedDirY = 0;
  state.gamePhase = 'playing';
  // Ascension's starting picks follow one another until none remain.
  if (state.pendingConstellations > 0 && --state.pendingConstellations > 0) offerConstellation(state, true);
  return true;
}

export function openGodConstellations(state: GameState): boolean {
  if(state.gamePhase!=='playing'||state.constellationChoices.length)return false;
  state.godConstellationMode=true;state.constellationChoices=Object.keys(CONSTELLATIONS) as Constellation[];
  state.gamePhase='constellation';state.playerQueuedDirX=state.playerQueuedDirY=0;
  try { const sound=new Audio('/sounds/constellation-choice.wav');sound.volume=.6;sound.play().catch(()=>{}); } catch {}
  return true;
}

export function closeGodConstellations(state: GameState): boolean {
  if(state.gamePhase!=='constellation'||!state.godConstellationMode)return false;
  state.godConstellationMode=false;state.constellationChoices=[];state.gamePhase='playing';return true;
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
  fleeing?: boolean;
}

export interface KingAbilities {
  untouchedTicks: number;
  arenaWindupTicks: number;
}

export interface ThornAbilities {
  cooldown: number; defenseCooldown: number; windupTicks: number; aimX: number; aimY: number; fleeing: boolean;
}
export interface ThornPatch { x: number; y: number; ticks: number; ownerId: number; radius?: number; }
export interface EncounterEffect {
  kind: 'reflect' | 'shield-break' | 'shield-form' | 'construct-break' | 'pylon-overload' | 'sentinel-hit' | 'sentinel-death' | 'melee' | 'shot' | 'transfer' | 'fall' | 'revive';
  x: number; y: number; toX: number; toY: number; ticks: number; maxTicks: number; ownerId: number; targetId?: number; color: string;
}

export interface SeaChanterAbilities {
  mode: 'hunting' | 'diving';
  diveElapsedTicks: number;
  diveFleeing: boolean;
  healingBlockedUntilTick: number;
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
  neptune?: boolean; // the Neptune challenge drives her dives instead of the HP thresholds below
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
  aegis?: { shielded: boolean; exposedUntilTick: number; constructsLeft: number; openAmount?: number; reflectTicks?: number; brokenOnce?: boolean; reshieldTicks?: number };
  constructOwnerId?: number;
  pylon?: { ageTicks: number; overloadTicks: number };
  visualSpawnTicks?: number;
  devourer?: { generation: number; newbornTicks?: number; splitTicks?: number; originMaxHp?: number }; // generation, newborn sprint, self-split timer, original's spawn HP
  twin?: { pairId: number; index: number; downedTicks: number; partnerDownTicks: number; transferTicks: number; transferGiveTicks?: number; transferGetTicks?: number; shotAimX?: number; shotAimY?: number; shotTargetX?: number; shotTargetY?: number; strikeAngle?: number; fallTicks?: number; reviveTicks?: number; hasteTicks?: number };
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
  water?: boolean; // Neptune's water ball: drawn as a water burst instead of a bomb blast
}

export interface LaserBullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  powered: boolean;
  ticks: number;
  mirror?: boolean; // fired by the Binary Star twin at reduced damage
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

export type GamePhase = 'playing' | 'teleporting' | 'laserTarget' | 'constellation' | 'skillChoice' | 'won' | 'lost';

export interface RewardEffect {
  target: 'player' | 'ruby';
  kind: 'heal' | 'energy' | 'shield' | 'speed' | 'electric' | 'restore';
  ticks: number;
}

export interface GameState {
  mode: RubyStarMode;
  tutorial: TutorialState | null;
  trial: { boss: BossType; skill: SpecialSkill; cooldown: number } | null; // cooldown counts down after a cast
  neptune: NeptuneState | null;
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
  stellarPowerBonusTicks: number;
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
  encounterEffects: EncounterEffect[];
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

  singularity: { x: number; y: number; ticks: number; maxTicks: number; pullTimer: number; damageTimer: number } | null;
  celestialField: { x: number; y: number; ticks: number; damageTimer: number } | null;
  lunarDecoy: { x: number; y: number; tileX: number; tileY: number; hitsLeft: number; maxHits: number; flashTicks: number; invulnerableTicks: number } | null;
  enemyDecoyActive: boolean;
  ascensionBannerTicks: number;
  specialSkill: SpecialSkill | null;
  specialEffects: { kind: SpecialSkill; x: number; y: number; ticks: number }[];
  venusVeilTicks: number;
  mirrorTwinTicks: number;
  venusReflects: { fromX: number; fromY: number; toX: number; toY: number; ticks: number }[];

  // Screen shake
  screenShakeTicks: number;
  screenShakeAmt: number;

  // Ruby Core healing
  rubyHealCooldown: number;

  // God mode
  godMode: boolean; // Invincible: ignores damage
  immortal: boolean; // HP damage applies, but player and Ruby stay at 1+ HP
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
  pendingConstellations: number; // starting picks still owed (Ascension mode)
  godConstellationMode: boolean;
  constellationReveal: { kind: Constellation; ticks: number } | null;
  bossesKilled: number;     // tracks how many bosses have been killed (each +15 HP)
  bossPool: BossType[];     // natural spawns draw every boss once before reshuffling
  lastNaturalBoss: BossType | null;

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

const CELESTIAL_AUDIO: Record<SpecialSkill | 'ready' | 'empty' | 'pickup' | 'solar_swoosh' | 'jupiter_shot' | 'neptune_electric' | 'binary_reach', { file: string; gain: number }> = {
  binary_reach:{file:'gaia-reach.mp3',gain:.45},
  neptune_electric:{file:'neptune-electric.wav',gain:.6},
  jupiter_shot:{file:'jupiter-shot.wav',gain:.75},
  solar_swoosh:{file:'solar-flare-swoosh.wav',gain:.8},
  fiery_king:{file:'solar-flare.wav',gain:.75}, storm_reaper:{file:'jupiter-storm.wav',gain:.8},
  splitter_queen:{file:'lunar-echo.wav',gain:1.1}, devourer:{file:'singularity.wav',gain:.8},
  frost_warden:{file:'saturn-guard.wav',gain:.85},sea_chanter:{file:'neptune-tide.wav',gain:.9},
  blind_prayer:{file:'sirius-surge.wav',gain:1.3},aegis_sentinel:{file:'venus-veil.wav',gain:.8},astral_twins:{file:'binary-star.mp3',gain:.8},thorn_weaver:{file:'gaia-reach.wav',gain:.45},
  ready:{file:'skill-ready.wav',gain:.5},empty:{file:'empty-charge.wav',gain:.22},pickup:{file:'energy-pickup.wav',gain:.4},
};
function playCelestialSound(cue: keyof typeof CELESTIAL_AUDIO, multiplier = 1) {
  const clip = CELESTIAL_AUDIO[cue];
  playAudioOneShot('/sounds/celestial/' + clip.file, clip.gain * ATTACK_SFX_VOLUME * multiplier);
}

function playAudioOneShot(file: string, level: number) {
  try {
    const sound = new Audio(file); sound.volume = Math.min(1, level); sound.loop = false;
    let cleanup = () => {};
    if (level > 1) {
      const ctx = getAudioCtx();
      if (ctx) {
        const source = ctx.createMediaElementSource(sound), boost = ctx.createGain();
        boost.gain.value = level; source.connect(boost); boost.connect(ctx.destination);
        cleanup = () => { source.disconnect(); boost.disconnect(); sound.onended = null; sound.onerror = null; };
        sound.onended = cleanup; sound.onerror = cleanup;
      }
    }
    sound.play().catch(() => cleanup());
  } catch { }
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

export function playSFX_supernova() {
  for (const [file, volume] of [['bombExplode.wav', 1], ['meteorExplode.mp3', .85]] as const) {
    try {
      const sound = new Audio('/sounds/' + file); sound.volume = volume; sound.play().catch(() => {});
    } catch { }
  }
  playTone(65, .8, .3, 'sawtooth');
}

function announceAscension(state: GameState) {
  state.ascensionBannerTicks = 360;
  if (state.gamePhase === 'lost') return;
  try {
    const sound = new Audio('/sounds/ascension-unlock.mp3'); sound.volume = .7; sound.play().catch(() => {});
  } catch { }
}

export function playSFX_hit() {
  try {
    const a = new Audio('/sounds/hitHurt.wav'); a.volume = 0.22; a.play().catch(() => {});
  } catch { }
}

function playSFX_chargerImpact() {
  try {
    const sound = new Audio('/sounds/hitHurt.wav');
    sound.volume = .55; sound.playbackRate = .7; sound.preservesPitch = false;
    sound.play().catch(() => {});
  } catch { }
  playTone(90, .14, .15, 'triangle');
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

function playSFX_enemyAttack(enemy?: Enemy) {
  const file = enemy?.type === 'aegis_sentinel' ? 'aegis-attack.mp3'
    : enemy?.type === 'astral_twins' ? enemy.twin?.index === 1 ? 'dusk-attack.mp3' : 'celestial/jupiter-storm.wav' : null;
  if (!file) { playSFX_alienShoot(); return; }
  if (enemy?.type === 'astral_twins' && enemy.twin?.index === 1) playCelestialSound('neptune_electric', 3.5);
  try {
    const sound = new Audio('/sounds/' + file);
    sound.volume = (file === 'celestial/jupiter-storm.wav' ? 1.3 : .8) * ATTACK_SFX_VOLUME; sound.loop = false;
    sound.play().catch(() => {});
  } catch { }
}

function playSFX_twinRevive() {
  try {
    const sound = new Audio('/sounds/twin-revive.mp3');
    sound.volume = .85 * ATTACK_SFX_VOLUME; sound.loop = false;
    sound.play().catch(() => {});
  } catch { }
}

function playSFX_twinTransfer() { playCelestialSound('ready'); }

function playSFX_objectBreak(kind: 'frost' | 'pylon' | 'aegis') {
  const clips = {
    frost: { file: 'frost-shield-break.mp3', gain: .7 },
    pylon: { file: 'pylon-break.wav', gain: .85 },
    aegis: { file: 'aegis-shield-break.wav', gain: 3 },
  };
  const clip = clips[kind];
  playAudioOneShot('/sounds/' + clip.file, clip.gain * ATTACK_SFX_VOLUME);
}

function playSFX_pylonExplosion() {
  try {
    const sound = new Audio('/sounds/pylon-explode.mp3');
    sound.volume = .9 * ATTACK_SFX_VOLUME; sound.loop = false;
    sound.play().catch(() => {});
  } catch { }
}

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

// Softer rising chime than the meteor beep, so the shield countdown reads as its own cue.
function playSFX_aegisReshieldWarning(final: boolean) {
  playTone(final ? 990 : 660, 0.18, 0.13, 'triangle');
  setTimeout(() => playTone(final ? 1480 : 990, 0.14, 0.1, 'triangle'), 90);
}

export function playSFX_gameOver() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    [220, 185, 155, 110].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.2;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f;
      g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.38);
    });
  } catch { }
}

// ─── Initial state ────────────────────────────────────────────────────────────

export interface NeptuneTide { chamber: number; dirX: number; dirY: number; ticks: number }
export interface NeptuneState {
  phase: 1 | 2 | 3; bossId: number;
  armed: boolean[]; // per dive point of the current phase; re-arms once her HP rises above it
  dive: { point: number; ticks: number; dropsLeft: number; dropTimer: number; cloneIds: number[] } | null;
  healCharge: number;
  laser: { chamber: number; ticks: number } | null;
  laserImpact: { chamber: number; ticks: number } | null; // the strike's visual, separate from meteor impacts
  bombTimer: number; fishTimer: number; poisonTicks: number; poisonTimer: number;
  tides: NeptuneTide[]; tideTimer: number; tidePushTimer: number;
  phaseBannerTicks: number;
  exposed: boolean; // phase 3's final dive is cleared: no more dives, and the next hit kills her
}

export interface TutorialState {
  step: number; count: number; pauseTicks: number; retry: boolean;
  lastTile: [number, number]; cooldowns: Record<string, number>; carried: boolean;
}

// Ascension's opening pick: hold any one celestial skill, then play resumes.
export function chooseStartingSkill(state: GameState, kind: SpecialSkill): boolean {
  if (state.gamePhase !== 'skillChoice') return false;
  state.specialSkill = kind;
  state.gamePhase = 'playing';
  playCelestialSound('ready');
  return true;
}

// Game modes picked in the lobby. Endless Space is the standard run; Ascension starts at stage 10
// with celestial skills already unlocked and regular aliens at their hardest tier.
export type RubyStarMode = 'endless' | 'ascension' | 'tutorial' | 'trial';

export function createModeState(mode: RubyStarMode, trialBoss?: BossType): GameState {
  const state = createInitialState();
  state.mode = mode;
  if (mode === 'ascension') {
    state.bossesKilled = SPECIAL_UNLOCK_KILLS;
    state.difficultyLevel = DIFFICULTY_TIERS.length - 1;
    state.ascensionBannerTicks = 360;
    state.pendingConstellations = ASCENSION_START_CONSTELLATIONS;
    offerConstellation(state, true);
    state.gamePhase = 'skillChoice'; // pick a starting celestial skill first; the Constellation picks follow
  }
  if (mode === 'trial' && trialBoss) {
    // Stage 0 run where the guardian is the only boss; beating it wins. Its celestial skill is always on hand.
    state.trial = { boss: trialBoss, skill: BOSS_SKILL_REWARDS[trialBoss], cooldown: 0 };
    state.specialSkill = state.trial.skill;
    state.bossTimer = TRIAL_BOSS_DELAY;
    if (trialBoss === 'sea_chanter') {
      state.neptune = { phase: 1, bossId: -1, armed: [], dive: null, healCharge: 0, laser: null, laserImpact: null, bombTimer: NEPTUNE_BOMB_INTERVAL,
        fishTimer: 0, poisonTicks: 0, poisonTimer: 0, tides: [], tideTimer: NEPTUNE_TIDE_GAP[0], tidePushTimer: NEPTUNE_TIDE_PUSH_GAP, phaseBannerTicks: 0, exposed: false };
    }
  }
  if (mode === 'tutorial') {
    // A safe sandbox: no natural aliens, bosses, meteors or events; you and Ruby never drop below 1 HP.
    state.noMobs = true; state.noBossSpawns = true; state.immortal = true;
    state.tutorial = { step: 0, count: 0, pauseTicks: 0, retry: false, lastTile: [state.playerTileX, state.playerTileY], cooldowns: {}, carried: false };
  }
  return state;
}

export function createInitialState(): GameState {
  stopGaiaFieldSound();
  stopSingularitySound();
  stopPoisonSound();
  stopSeaSounds();
  stopChargeSound();
  const map = generateMap();
  const [px, py] = PLAYER_START;
  return {
    mode: 'endless', tutorial: null, trial: null, neptune: null,
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
    stellarPowerBonusTicks: 0,

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
    thornPatches: [], encounterEffects: [], thornPoisonTicks: 0, thornPoisonTimer: 0, thornWasInside: false, thornContactTimer: 0,
    seaSongWaves: [],
    seaSongBursts: [],
    kingArenaPulseTicks: 0,
    specialSkill: null, specialEffects: [], venusVeilTicks: 0, mirrorTwinTicks: 0, venusReflects: [], ascensionBannerTicks: 0, lunarDecoy: null, enemyDecoyActive: false, celestialField: null, singularity: null,

    playerChamber: 0,
    teleportDestOptions: [],
    teleportCooldown: 0,

    screenShakeTicks: 0,
    screenShakeAmt: 0,

    rubyHealCooldown: 0,

    godMode: false,
    immortal: false,
    noMobs: false, noBossSpawns: false,

    electricBuffTicks: 0,

    bossTimer: BOSS_FIRST_SPAWN_TIMER,
    bossWarningTicks: 0,
    bossSpawnName: '',
    bossSpawnColor: '',
    bossSpawnTicks: 0,
    constellations: [],
    constellationChoices: [],
    constellationDelayTicks: 0, pendingConstellations: 0,
    godConstellationMode: false,
    constellationReveal: null,
    bossesKilled: 0,
    bossPool: [],
    lastNaturalBoss: null,
    healJiggleTicks: 0,
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

// Venus returns the full incoming hit to a direct attacker; bosses take a capped share.
function reflectVenusDamage(state: GameState, attacker: Enemy | undefined, amount: number, fromX: number, fromY: number) {
  if (state.venusVeilTicks <= 0 || !attacker || attacker.hp <= 0 || amount <= 0) return;
  const damage = isBossType(attacker.type) ? Math.min(amount, attacker.maxHp * SPECIAL_VENUS_BOSS_REFLECT_CAP) : amount;
  damageEnemy(state, attacker, damage, 'special');
  state.venusReflects.push({ fromX, fromY, toX: attacker.x, toY: attacker.y, ticks: 18 });
  if (state.venusReflects.length > 24) state.venusReflects.shift();
}

function damagePlayer(state: GameState, amount: number, attacker?: Enemy) {
  if (state.neptune && attacker?.id === state.neptune.bossId) {
    amount *= NEPTUNE_ATTACK_MULT[state.neptune.phase];
    if (state.neptune.phase === 3 && !state.enemyDecoyActive) healNeptune(state, attacker, amount * NEPTUNE_LIFESTEAL);
  }
  if(state.enemyDecoyActive){damageLunarDecoy(state,amount);return;}
  reflectVenusDamage(state, attacker, amount, state.playerX, state.playerY);
  if (state.godMode) return;
  amount *= state.constellations.includes('playerGuard') ? 0.9 : 1;
  if (state.venusVeilTicks > 0) amount *= SPECIAL_VENUS_DAMAGE_MULT;
  const absorbed = Math.min(state.playerShieldHP, amount);
  state.playerShieldHP -= absorbed;
  if(state.playerShieldHP<=0)state.playerSaturnShield=false;
  amount -= absorbed;
  if (absorbed > 0) showRewardEffect(state, 'player', 'shield');
  if (amount <= 0) return;
  state.playerHP = Math.max(state.immortal ? 1 : 0, state.playerHP - amount);
  playSFX_hit();
  if (state.playerHP <= 0) endGame(state);
}

function damageRuby(state: GameState, amount: number, attacker?: Enemy) {
  if (state.rubyTileX === -1) return; // carried — ruby not vulnerable
  reflectVenusDamage(state, attacker, amount, (state.rubyTileX + .5) * TILE_SIZE, (state.rubyTileY + .5) * TILE_SIZE);
  if (state.godMode) return;
  amount *= 1 - 0.15 * constellationBonus(state, 'ruby');
  if (state.venusVeilTicks > 0) amount *= SPECIAL_VENUS_DAMAGE_MULT;
  const absorbed = Math.min(state.rubyShieldHP, amount);
  state.rubyShieldHP -= absorbed;
  if(state.rubyShieldHP<=0)state.rubySaturnShield=false;
  amount -= absorbed;
  if (absorbed > 0) showRewardEffect(state, 'ruby', 'shield');
  if (amount <= 0) return;
  state.rubyHP = Math.max(state.immortal ? 1 : 0, state.rubyHP - amount);
  playSFX_rubyHit();
  if (state.rubyHP <= 0) endGame(state);
}

function damageEnemy(state: GameState, e: Enemy, amount: number, source: 'player' | 'meteor' | 'enemy' | 'special' = 'player') {
  if (e.hp <= 0 || (e.twin?.downedTicks ?? 0) > 0 || amount <= 0) return;
  const wasSeaHunting = e.type === 'sea_chanter' && !isSeaChanterDiving(e);
  const previousHP = e.hp;
  const shielded = state.enemies.some(s => s.type === 'shielder' && s.shieldTargetId === e.id);
  let actual = shielded ? amount / 2 : amount;
  if (e.twin?.partnerDownTicks) actual *= TWIN_BERSERK_DAMAGE_TAKEN; // berserk survivor
  if (e.aegis) {
    refreshAegisShield(state, e);
    if (e.aegis.shielded) {
      actual *= AEGIS_DAMAGE_MULT;
      // Every player-dealt hit returns its incoming damage, before the Aegis shield reduces it.
      if (source === 'player' || source === 'special') {
        e.aegis.reflectTicks = 10;
        encounterEffect(state, 'reflect', e, state.playerX, state.playerY, 12, '#78dedf');
        damagePlayer(state, amount * AEGIS_REFLECT_RATIO);
      }
    }
  }

  // Frost Warden's icy shield absorbs damage outright (a real HP pool, not a %-reduction
  // like the shielder's) — drains first, any overflow past its remaining capacity spills to hp.
  if (e.icyShieldHP > 0) {
    const absorbed = Math.min(e.icyShieldHP, actual);
    e.icyShieldHP -= absorbed;
    if (absorbed > 0 && e.icyShieldHP <= 0) playSFX_objectBreak('frost');
    actual -= absorbed;
  }

  // Underwater vulnerability boosts HP damage after shields absorb their share.
  if (isSeaChanterDiving(e)) actual *= SEA_DIVE_DAMAGE_MULTIPLIER;
  e.hp -= actual;
  const neptune = state.neptune;
  if (neptune && e.id === neptune.bossId && !neptune.exposed) e.hp = Math.max(e.hp, neptunePhaseFloor(neptune) + .01); // phases end only through the final dive
  // Hitting one of her clones stops her ally-feeding heal for a while.
  if (neptune && e.type === 'water_clone' && actual > 0) {
    const boss = state.enemies.find(b => b.id === neptune.bossId);
    if (boss?.sea) boss.sea.healingBlockedUntilTick = Math.max(boss.sea.healingBlockedUntilTick, state.gameTick + NEPTUNE_CLONE_HEAL_BLOCK);
  }
  if (neptune && previousHP > 0 && e.hp <= 0) {
    if (source === 'player' && e.type === 'fish_blue') blueFishPopped(state);
    if (source === 'player' && e.type === 'fish_red') damagePlayer(state, NEPTUNE_FISH_HURT);
    if (e.type === 'water_bomb' && source !== 'enemy') {
      const boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0);
      if (boss) damageEnemy(state, boss, NEPTUNE_PHASE_HP * NEPTUNE_BOMB_SELF_DAMAGE, 'enemy');
    }
  }
  const hpLost = Math.min(Math.max(0, previousHP), Math.max(0, actual));
  if (hpLost > 0 && isSeaChanterDiving(e)) {
    e.sea!.healingBlockedUntilTick = state.gameTick + SEA_HEALING_BLOCK_TICKS;
  }
  if (source === 'player' && hpLost > 0) {
    if (wasSeaHunting && e.hp > 0) {
      healSeaAllies(state, e, SEA_ALLY_HEAL_AMOUNT);
    } else if (!isBossType(e.type) && e.type !== 'queen_echo' && e.type !== 'aegis_construct' && !isNeptuneObject(e.type)) {
      for (const chanter of state.enemies) {
        if (!isSeaChanterDiving(chanter) || chanter.hp <= 0 || state.gameTick < chanter.sea!.healingBlockedUntilTick) continue;
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
    .filter(a => a !== hitEnemy && a.hp > 0 && !(a.twin?.downedTicks) && tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, a.tileX, a.tileY) <= SNIPER_CHAIN_RANGE)
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
  stopAmbientEventSounds();
  playSFX_gameOver();
}

// ─── Spawn ────────────────────────────────────────────────────────────────────

function spawnEnemy(state: GameState) {
  const tier = DIFFICULTY_TIERS[Math.min(state.difficultyLevel, DIFFICULTY_TIERS.length - 1)];
  const population = state.enemies.filter(e => !isNeptuneObject(e.type)).length; // fish and water objects never block aliens
  if (population >= tier.maxEnemies) return;

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

  const spawnCount = Math.min(tier.spawnCount, tier.maxEnemies - population);
  for (let s = 0; s < spawnCount; s++) {
    const idx = Math.floor(Math.random() * eligibleSpawns.length);
    const [tx, ty] = eligibleSpawns[idx];

    const typeIdx = Math.floor(Math.random() * tier.spawnTypes.length);
    const type: EnemyType = state.neptune && Math.random() < NEPTUNE_STINGER_CHANCE ? 'stinger' : tier.spawnTypes[typeIdx];
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
    damagePlayer(state, ENEMY_CONFIGS.sniper.damageToPlayer, e);
  } else if (state.rubyTileX !== -1) {
    damageRuby(state, ENEMY_CONFIGS.sniper.damageToRuby, e);
  }
  e.shootTicks = 22;
  e.attackTimer = ENEMY_CONFIGS.sniper.attackCooldown;
  playSFX_laser(0.85);
}

function fireQueenBolt(state: GameState, e: Enemy, tgtX: number, tgtY: number, targetIsPlayer: boolean) {
  const cfg = ENEMY_CONFIGS[e.type as 'splitter_queen' | 'queen_echo'];
  state.laserBeams.push({ fromX: e.x, fromY: e.y, dirX: 0, dirY: 0, endX: tgtX, endY: tgtY, ticks: 20, color: cfg.color });
  if (targetIsPlayer) damagePlayer(state, cfg.damageToPlayer, e);
  else if (state.rubyTileX !== -1) damageRuby(state, cfg.damageToRuby, e);
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
  if (isEnemyInSingularity(state,e)) return;
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
// (absorbs FROST_SHIELD_HP plus a per-defeat bonus) — her support role for the grunts defending alongside her.
function castFrostShield(state: GameState, e: Enemy) {
  const chamber = chamberOfTile(e.tileX, e.tileY);
  const alliesHere = state.enemies.filter(a =>
    a !== e && !isBossType(a.type) && a.type !== 'queen_echo' && a.type !== 'aegis_construct' &&
    chamberOfTile(a.tileX, a.tileY) === chamber
  );
  if (alliesHere.length === 0) return;
  // Spread protection before refreshing an ally that still has an active ice shield.
  const unshielded = alliesHere.filter(a => (a.icyShieldHP ?? 0) <= 0);
  const candidates = unshielded.length > 0 ? unshielded : alliesHere;
  const ally = candidates[Math.floor(Math.random() * candidates.length)];
  ally.icyShieldHP = Math.min(FROST_SHIELD_HP_MAX, FROST_SHIELD_HP + state.bossesKilled * FROST_SHIELD_HP_PER_DEFEAT);
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
  if (isEnemyInSingularity(state,e)) return;
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

function encounterEffect(state: GameState, kind: EncounterEffect['kind'], enemy: Enemy, toX = enemy.x, toY = enemy.y, ticks = 24, color = ENEMY_CONFIGS[enemy.type].color) {
  // Rapid reflected bullets refresh one return streak instead of piling up effects.
  const old = kind === 'reflect' ? state.encounterEffects.find(fx => fx.kind === kind && fx.ownerId === enemy.id) : undefined;
  if (old) { Object.assign(old, { x: enemy.x, y: enemy.y, toX, toY, ticks, maxTicks: ticks }); return old; }
  const effect: EncounterEffect = { kind, x: enemy.x, y: enemy.y, toX, toY, ticks, maxTicks: ticks, ownerId: enemy.id, color };
  state.encounterEffects.push(effect);
  if (state.encounterEffects.length > 48) state.encounterEffects.shift();
  return effect;
}

// Regular aliens only: no bosses, echoes, pylons or downed twins.
function nearestDevourerFood(state: GameState, e: Enemy, maxDist: number): Enemy | null {
  let nearest: Enemy | null = null, nearestDist = maxDist;
  for (const ally of state.enemies) {
    if (ally === e || ally.type === 'aegis_construct' || (ally.twin?.downedTicks ?? 0) > 0) continue;
    if (isBossType(ally.type) || ally.type === 'queen_echo') continue;
    const d = tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY);
    if (d <= nearestDist) { nearest = ally; nearestDist = d; }
  }
  return nearest;
}

function devourerAbsorbCooldown(e: Enemy) {
  // Generation g adds 3s + 4s + ... : g * 180 + 60 * g(g-1)/2 ticks.
  const g = e.devourer?.generation ?? 0;
  return DEVOURER_ABSORB_COOLDOWN + DEVOURER_ABSORB_COOLDOWN_PER_GEN * g + DEVOURER_ABSORB_COOLDOWN_GEN_STEP * g * (g - 1) / 2;
}

// Visual size: each stack swells the body; each generation of copies is smaller.
export function devourerBodyScale(e: Enemy) {
  return (1 + e.chargeDirX * 0.1) * Math.pow(DEVOURER_COPY_SCALE, e.devourer?.generation ?? 0);
}

// Each stack bursts out as a fresh copy on nearby floor; copies start empty but can eat and split again.
function devourerFamilyRoom(state: GameState, parent: Enemy) {
  // Shared safety cap: the whole family never exceeds DEVOURER_FAMILY_CAP living bodies.
  return DEVOURER_FAMILY_CAP - state.enemies.filter(other => other !== parent && other.type === 'devourer' && other.hp > 0).length;
}

function spawnDevourerCopies(state: GameState, parent: Enemy, wanted = parent.chargeDirX) {
  const count = Math.max(0, Math.min(DEVOURER_MAX_STACKS, wanted, devourerFamilyRoom(state, parent)));
  const generation = (parent.devourer?.generation ?? 0) + 1;
  const hp = Math.max(1, Math.round(parent.maxHp * DEVOURER_COPY_HP_RATIO));
  const spots: [number, number][] = [];
  for (let r = 0; r <= 3 && spots.length < count; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || spots.length >= count) continue;
      const x = parent.tileX + dx, y = parent.tileY + dy;
      if (isFloorTile(state.map, x, y) && !spots.some(([sx, sy]) => sx === x && sy === y)) spots.push([x, y]);
    }
  }
  while (spots.length < count) spots.push([parent.tileX, parent.tileY]);
  for (const [x, y] of spots) {
    const copy = createEncounterEnemy(state, 'devourer', x, y, hp);
    spawnAbsorbBurst(state, parent.x, parent.y, (x + .5) * TILE_SIZE, (y + .5) * TILE_SIZE);
    copy.devourer = { generation, newbornTicks: DEVOURER_NEWBORN_TICKS, originMaxHp: parent.devourer?.originMaxHp ?? parent.maxHp };
    copy.windupTicks = DEVOURER_COPY_FIRST_MEAL;
    copy.attackTimer = 45; copy.visualSpawnTicks = 30; copy.healFlashTicks = 26;
    state.enemies.push(copy);
  }
}

function createEncounterEnemy(state: GameState, type: EnemyType, tx: number, ty: number, hp: number): Enemy {
  return {
    id: state.nextEnemyId++, type, x: (tx + .5) * TILE_SIZE, y: (ty + .5) * TILE_SIZE,
    tileX: tx, tileY: ty, targetTileX: tx, targetTileY: ty, stepProgress: 0, hp, maxHp: hp,
    path: [], pathTimer: 0, attackTimer: 60, targeting: 'player',
    pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0, shootTicks: 0,
    exploding: false, explodeTick: 0, windupTicks: 0, chargeDirX: 0, chargeDirY: 0,
    shieldTargetId: -1, phaseTimer: 0, icyShieldHP: 0,
  };
}

function freeChamberTiles(state: GameState, chamber: number): [number, number][] {
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamber];
  const tiles: [number, number][] = [];
  for (let y = r1 + 1; y < r2; y++) for (let x = c1 + 1; x < c2; x++) {
    if (state.map[y]?.[x] !== T_FLOOR || x === state.playerTileX && y === state.playerTileY ||
        x === state.rubyTileX && y === state.rubyTileY ||
        state.enemies.some(e => e.tileX === x && e.tileY === y)) continue;
    tiles.push([x, y]);
  }
  return tiles;
}

function summonAegisConstructs(state: GameState, boss: Enemy) {
  const chambers = [0, 1, 2, 3];
  for (let i = 0; i < 2; i++) {
    const chamber = chambers.splice(Math.floor(Math.random() * chambers.length), 1)[0];
    const tiles = freeChamberTiles(state, chamber);
    if (!tiles.length) continue;
    const [x, y] = tiles[Math.floor(Math.random() * tiles.length)];
    const construct = createEncounterEnemy(state, 'aegis_construct', x, y, ENEMY_CONFIGS.aegis_construct.maxHp + state.bossesKilled * 3);
    construct.constructOwnerId = boss.id;
    construct.pylon = { ageTicks: 0, overloadTicks: 0 };
    construct.visualSpawnTicks = 30;
    state.enemies.push(construct);
  }
  const wasExposed = boss.aegis && !boss.aegis.shielded;
  boss.aegis = { shielded: true, exposedUntilTick: 0, constructsLeft: 2, openAmount: boss.aegis?.openAmount ?? 0, reflectTicks: 0, brokenOnce: boss.aegis?.brokenOnce ?? false, reshieldTicks: 0 };
  if (wasExposed) encounterEffect(state, 'shield-form', boss, boss.x, boss.y, 30, '#78dedf');
  refreshAegisShield(state, boss);
}

function refreshAegisShield(state: GameState, boss: Enemy) {
  if (!boss.aegis) return;
  const count = state.enemies.filter(e => e.constructOwnerId === boss.id && e.hp > 0).length;
  boss.aegis.constructsLeft = count;
  if (boss.aegis.shielded && count === 0) {
    boss.aegis.shielded = false;
    boss.aegis.brokenOnce = true;
    boss.aegis.exposedUntilTick = state.gameTick + AEGIS_EXPOSE_TICKS;
    boss.flashTicks = 20;
    encounterEffect(state, 'shield-break', boss, boss.x, boss.y, 30, '#78dedf');
    playSFX_objectBreak('aegis');
  }
}

function initializeNewEncounter(state: GameState, boss: Enemy) {
  if (boss.type === 'aegis_sentinel' || boss.type === 'astral_twins') boss.visualSpawnTicks = 30;
  if (boss.type === 'aegis_sentinel') summonAegisConstructs(state, boss);
  if (boss.type === 'sea_chanter' && state.neptune) {
    // Neptune guardian: one body carrying all three phases; the challenge controls her dives.
    boss.hp = boss.maxHp = NEPTUNE_PHASE_HP * 3;
    state.neptune.bossId = boss.id; state.neptune.phase = 1;
    state.neptune.armed = NEPTUNE_DIVE_POINTS[1].map(() => true);
    (boss.sea ??= createSeaChanterAbilities()).neptune = true;
  }
  if (boss.type === 'devourer') {
    boss.chargeDirX = DEVOURER_START_STACKS; // the original is born with one stack, so it always splits
    // Its swarm multiplies effective HP, so it scales slower than the usual +15 per defeat.
    boss.hp = boss.maxHp = ENEMY_CONFIGS.devourer.maxHp + state.bossesKilled * DEVOURER_HP_PER_DEFEAT;
    boss.devourer = { generation: 0, originMaxHp: boss.maxHp };
  }
  if (boss.type !== 'astral_twins') return;
  // One encounter's +15 HP per stage is shared between its two bodies.
  boss.hp = boss.maxHp = ENEMY_CONFIGS.astral_twins.maxHp + state.bossesKilled * 7.5;
  boss.twin = { pairId: boss.id, index: 0, downedTicks: 0, partnerDownTicks: 0, transferTicks: TWIN_TRANSFER_MIN_TICKS + Math.floor(Math.random() * (TWIN_TRANSFER_MAX_TICKS - TWIN_TRANSFER_MIN_TICKS + 1)) };
  const chamber = chamberOfTile(boss.tileX, boss.tileY);
  const tiles = freeChamberTiles(state, chamber).filter(([x, y]) => {
    const distance = Math.hypot(x - boss.tileX, y - boss.tileY);
    return distance >= TWIN_MIN_SEPARATION && distance <= 8;
  });
  const [x, y] = tiles.length ? tiles[Math.floor(Math.random() * tiles.length)] : [boss.tileX, boss.tileY];
  const twin = createEncounterEnemy(state, 'astral_twins', x, y, boss.maxHp);
  twin.twin = { ...boss.twin, index: 1 };
  twin.attackTimer = 90;
  twin.visualSpawnTicks = 30;
  state.enemies.push(twin);
}

function updateBossEncounters(state: GameState) {
  state.encounterEffects = state.encounterEffects.filter(fx => --fx.ticks > 0);
  for (const boss of [...state.enemies]) {
    if (boss.hp <= 0) continue;
    if ((boss.visualSpawnTicks ?? 0) > 0) boss.visualSpawnTicks = (boss.visualSpawnTicks ?? 0) - 1;
    if (boss.pylon && !isEclipseActive(state)) updatePylonOverload(state, boss);
    if (boss.aegis) {
      refreshAegisShield(state, boss);
      // The last seconds of exposure count down with a closing frame and a beep each second.
      const reshieldLeft = boss.aegis.shielded ? 0 : boss.aegis.exposedUntilTick - state.gameTick;
      boss.aegis.reshieldTicks = reshieldLeft > 0 && reshieldLeft <= AEGIS_RESHIELD_WARNING_TICKS ? reshieldLeft : 0;
      if (boss.aegis.reshieldTicks && boss.aegis.reshieldTicks % 60 === 0) playSFX_aegisReshieldWarning(boss.aegis.reshieldTicks <= 60);
      if (!boss.aegis.shielded && state.gameTick >= boss.aegis.exposedUntilTick) summonAegisConstructs(state, boss);
      const target = boss.aegis.shielded ? 0 : 1;
      const previous = boss.aegis.openAmount ?? target;
      boss.aegis.openAmount = previous + Math.max(-1 / 24, Math.min(1 / 24, target - previous));
      if ((boss.aegis.reflectTicks ?? 0) > 0) boss.aegis.reflectTicks = (boss.aegis.reflectTicks ?? 0) - 1;
    }
    if ((boss.twin?.fallTicks ?? 0) > 0) boss.twin!.fallTicks = (boss.twin!.fallTicks ?? 0) - 1;
    if ((boss.twin?.reviveTicks ?? 0) > 0) boss.twin!.reviveTicks = (boss.twin!.reviveTicks ?? 0) - 1;
    if ((boss.twin?.hasteTicks ?? 0) > 0) boss.twin!.hasteTicks = (boss.twin!.hasteTicks ?? 0) - 1;
    if ((boss.twin?.transferGiveTicks ?? 0) > 0) boss.twin!.transferGiveTicks = (boss.twin!.transferGiveTicks ?? 0) - 1;
    if ((boss.twin?.transferGetTicks ?? 0) > 0) boss.twin!.transferGetTicks = (boss.twin!.transferGetTicks ?? 0) - 1;
    if (boss.twin?.downedTicks) {
      if (--boss.twin.downedTicks === 0) {
        boss.hp = Math.max(1, boss.maxHp * TWIN_REVIVE_HP_RATIO);
        boss.icyShieldHP = 0; boss.healFlashTicks = 30; boss.attackTimer = 60;
        boss.path = []; boss.pathTimer = 0;
        boss.twin.reviveTicks = 48; boss.twin.hasteTicks = TWIN_REVIVE_HASTE_TICKS;
        encounterEffect(state, 'revive', boss, boss.x, boss.y, 48, boss.twin.index === 1 ? '#83cfff' : '#f08062');
        playSFX_twinRevive();
      }
    }
  }
  for (const leader of state.enemies) {
    if (!leader.twin || leader.twin.index !== 0) continue;
    const partner = state.enemies.find(e => e !== leader && e.twin?.pairId === leader.twin!.pairId);
    if (!partner?.twin) continue;
    leader.twin.partnerDownTicks = partner.twin.downedTicks;
    partner.twin.partnerDownTicks = leader.twin.downedTicks;
    if (leader.twin.downedTicks || partner.twin.downedTicks || isEclipseActive(state)) continue;
    if (--leader.twin.transferTicks > 0) continue;
    leader.twin.transferTicks = TWIN_TRANSFER_MIN_TICKS + Math.floor(Math.random() * (TWIN_TRANSFER_MAX_TICKS - TWIN_TRANSFER_MIN_TICKS + 1));
    const transfers = [[leader, partner], [partner, leader]].filter(([donor, receiver]) => donor.hp > 1 && receiver.hp < receiver.maxHp);
    if (!transfers.length) continue;
    const [donor, receiver] = transfers[Math.floor(Math.random() * transfers.length)];
    const amount = Math.min(donor.hp * TWIN_TRANSFER_RATIO, receiver.maxHp - receiver.hp, donor.hp - 1);
    donor.hp -= amount; receiver.hp += amount;
    donor.twin!.transferGiveTicks = TWIN_TRANSFER_FX_TICKS; receiver.twin!.transferGetTicks = TWIN_TRANSFER_FX_TICKS;
    const transfer = encounterEffect(state, 'transfer', donor, receiver.x, receiver.y, TWIN_TRANSFER_FX_TICKS, donor.twin!.index === 1 ? '#83cfff' : '#f08062');
    transfer.targetId = receiver.id;
    playSFX_twinTransfer();
  }
}

function updatePylonOverload(state: GameState, e: Enemy) {
  const pylon = e.pylon!;
  if (pylon.overloadTicks <= 0) {
    if (++pylon.ageTicks >= PYLON_LIFETIME_TICKS) pylon.overloadTicks = PYLON_OVERLOAD_WINDUP;
    return;
  }
  const chamber = chamberOfTile(e.tileX, e.tileY);
  if (pylon.overloadTicks % 60 === 0) playSFX_meteorWarning(pylon.overloadTicks <= 60);
  if (--pylon.overloadTicks > 0) return;
  encounterEffect(state, 'pylon-overload', e, e.x, e.y, 36, '#ffce8a');
  if (chamber >= 0 && chamberOfTile(state.playerTileX, state.playerTileY) === chamber) {
    damagePlayer(state, PYLON_OVERLOAD_DAMAGE);
    state.screenShakeTicks = Math.max(state.screenShakeTicks, 22);
    state.screenShakeAmt = Math.max(state.screenShakeAmt, 8);
  }
  playSFX_pylonExplosion();
  const occupied = new Set(state.enemies.filter(other => other !== e && other.constructOwnerId === e.constructOwnerId && other.hp > 0).map(other => chamberOfTile(other.tileX, other.tileY)));
  const chambers = [0, 1, 2, 3].filter(ch => ch !== chamber && !occupied.has(ch));
  const destination = chambers[Math.floor(Math.random() * chambers.length)];
  const tiles = freeChamberTiles(state, destination);
  if (tiles.length) {
    const [x, y] = tiles[Math.floor(Math.random() * tiles.length)];
    Object.assign(e, { tileX: x, tileY: y, targetTileX: x, targetTileY: y, x: (x + .5) * TILE_SIZE, y: (y + .5) * TILE_SIZE, stepProgress: 0 });
  }
  e.hp = e.maxHp; e.icyShieldHP = 0; e.visualSpawnTicks = 30; e.path = []; e.pushTiles = 0;
  pylon.ageTicks = 0; pylon.overloadTicks = 0;
}

// Dusk picks its own firing spot: about 7 tiles from the player, off their row/column, near its current position.
function twinRangedPath(state: GameState, e: Enemy): [number, number][] {
  const start = e.targetTileY * MAP_COLS + e.targetTileX;
  const queue = [start], parents = new Map<number, number>([[start, -1]]), distances = new Map<number, number>([[start, 0]]);
  let best = start, bestScore = Infinity;
  for (let i = 0; i < queue.length; i++) {
    const tile = queue[i], x = tile % MAP_COLS, y = Math.floor(tile / MAP_COLS), steps = distances.get(tile)!;
    const playerDistance = tileEuclidDist(x, y, state.playerTileX, state.playerTileY);
    const aligned = Math.abs(x - state.playerTileX) < 2 || Math.abs(y - state.playerTileY) < 2;
    const score = Math.abs(playerDistance - 7) + Math.max(0, playerDistance - TWIN_RANGED_RANGE) * 2 +
      (aligned ? 8 : 0) + steps * .12;
    if (score < bestScore) { best = tile; bestScore = score; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = ny * MAP_COLS + nx;
      if (!isFloorTile(state.map, nx, ny) || parents.has(key)) continue;
      parents.set(key, tile); distances.set(key, steps + 1); queue.push(key);
    }
  }
  const path: [number, number][] = [];
  while (best !== start && best !== -1) {
    path.push([best % MAP_COLS, Math.floor(best / MAP_COLS)]); best = parents.get(best)!;
  }
  return path.reverse();
}

function updateAstralTwin(state: GameState, e: Enemy) {
  const twin = e.twin!;
  // Each twin hunts on its own path; there is no leash or regrouping.
  e.targeting = 'player';
  if (e.attackTimer > 0) e.attackTimer--;
  const ranged = twin.index === 1;
  const berserkCooldown = twin.partnerDownTicks ? TWIN_BERSERK_COOLDOWN_MULT : 1;
  const inRange = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= (ranged ? TWIN_RANGED_RANGE : 1);
  const chamber = chamberOfTile(e.tileX, e.tileY);
  const canTrack = inRange && chamber >= 0 && chamber === chamberOfTile(state.playerTileX, state.playerTileY);
  if (ranged) {
    twin.shotAimX = state.playerTileX; twin.shotAimY = state.playerTileY;
    twin.shotTargetX = state.playerX; twin.shotTargetY = state.playerY;
  } else {
    e.windupTicks = inRange && e.attackTimer > 0 && e.attackTimer <= 12 ? e.attackTimer : 0;
  }

  if (ranged && e.windupTicks > 0) {
    if (!canTrack) e.windupTicks = 0;
    else {
      if (--e.windupTicks === 0) {
        state.laserBeams.push({ fromX: e.x, fromY: e.y, endX: state.playerX, endY: state.playerY,
          dirX: 0, dirY: 0, ticks: 18, color: '#89cbff' });
        damagePlayer(state, TWIN_RANGED_DAMAGE, e);
        playSFX_enemyAttack(e); e.shootTicks = 14; e.attackTimer = Math.round(TWIN_RANGED_COOLDOWN * berserkCooldown);
        encounterEffect(state, 'shot', e, state.playerX, state.playerY, 18, '#83cfff');
      }
      return;
    }
  }
  if (inRange && e.attackTimer <= 0) {
    if (ranged && canTrack) {
      twin.shotAimX = state.playerTileX; twin.shotAimY = state.playerTileY; e.windupTicks = TWIN_RANGED_WINDUP;
      return;
    }
    if (!ranged) {
      twin.strikeAngle = Math.atan2(state.playerY - e.y, state.playerX - e.x);
      damagePlayer(state, ENEMY_CONFIGS.astral_twins.damageToPlayer, e); playSFX_enemyAttack(e);
      encounterEffect(state, 'melee', e, state.playerX, state.playerY, 22, '#f08062');
      e.shootTicks = 22; e.attackTimer = Math.round(ENEMY_CONFIGS.astral_twins.attackCooldown * berserkCooldown);
    }
  }
  e.pathTimer--;
  if (e.pathTimer <= 0) {
    e.path = ranged ? twinRangedPath(state, e) : bfs(state.map, e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY);
    e.pathTimer = 18;
  }
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    // The melee twin holds its attack position; the ranged twin keeps repositioning during cooldown.
    if (!ranged && inRange) return;
    const next = e.path.shift();
    if (!next || !isFloorTile(state.map, next[0], next[1])) return;
    [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0;
  } else {
    const haste = ((e.twin?.hasteTicks ?? 0) > 0 ? TWIN_REVIVE_HASTE_MULT : 1) * (e.twin?.partnerDownTicks ? TWIN_BERSERK_SPEED_MULT : 1);
    e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + (ranged ? TWIN_RANGED_SPEED : ENEMY_CONFIGS.astral_twins.speed) * haste * celestialMoveMultiplier(state, e));
    e.x = (e.tileX + .5) * TILE_SIZE + (e.targetTileX - e.tileX) * e.stepProgress;
    e.y = (e.tileY + .5) * TILE_SIZE + (e.targetTileY - e.tileY) * e.stepProgress;
    if (e.stepProgress === TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
  }
}

function createThornAbilities(): ThornAbilities {
  return { cooldown: THORN_FIRST_DELAY, defenseCooldown: 0, windupTicks: 0, aimX: 0, aimY: 0, fleeing: false };
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
  return (state.thornPatches ?? []).some(p => p.ticks > 0 && isPlayerInThornField(state,p.x,p.y,p.radius));
}
function isPlayerInThornField(state: GameState,x: number,y: number,radius = THORN_RADIUS): boolean {
  const bounds=getThornFieldBounds(x,y,radius);
  return isFloorTile(state.map,Math.floor(state.playerX/TILE_SIZE),Math.floor(state.playerY/TILE_SIZE)) &&
    state.playerX>=bounds.left&&state.playerX<bounds.right&&state.playerY>=bounds.top&&state.playerY<bounds.bottom;
}
function eruptThornField(state: GameState, e: Enemy, x: number, y: number, radius = THORN_RADIUS) {
  const center = getThornFieldBounds(x, y, radius);
  (state.thornPatches ??= []).push({ x: center.x, y: center.y, radius, ticks: THORN_LIFETIME, ownerId: e.id });
  if (state.thornPatches.length > THORN_MAX_PATCHES) state.thornPatches.shift();
  if (isPlayerInThornField(state, center.x, center.y, radius)) {
    damagePlayer(state, ENEMY_CONFIGS.thorn_weaver.damageToPlayer, e); applyThornPoison(state);
    playThornCut(); state.thornWasInside = true; state.thornContactTimer = THORN_CONTACT_INTERVAL;
  }
  e.shootTicks = 14;
  try { const sound = new Audio('/sounds/place-plant.mp3'); sound.volume = 0.4 * ATTACK_SFX_VOLUME; sound.play().catch(() => {}); } catch { }
}
function updateThornWeaver(state: GameState, e: Enemy) {
  if (e.hp <= 0) return;
  const thorn = e.thorn ??= createThornAbilities();
  thorn.defenseCooldown = Math.max(0, (thorn.defenseCooldown ?? 0) - 1);
  if (thorn.defenseCooldown === 0 && Math.hypot(e.x - state.playerX, e.y - state.playerY) <= THORN_DEFENSE_TRIGGER_RANGE) {
    eruptThornField(state, e, e.x, e.y, THORN_DEFENSE_RADIUS);
    thorn.defenseCooldown = THORN_DEFENSE_COOLDOWN;
  }
  if (thorn.windupTicks > 0) {
    if (--thorn.windupTicks === 0) {
      eruptThornField(state, e, thorn.aimX, thorn.aimY);
      thorn.cooldown = ENEMY_CONFIGS.thorn_weaver.attackCooldown;
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
  return { mode: 'hunting', diveElapsedTicks: 0, diveFleeing: false, healingBlockedUntilTick: 0, songCooldown: SEA_SONG_FIRST_DELAY, songWindupTicks: 0,
    songAimX: 0, songAimY: 0, allyHealCooldown: SEA_ALLY_HEAL_INTERVAL, supportPulseTicks: 0, healPulseTicks: 0, healSoundCooldown: 0, resurfaceTicks: 0, resurfaceX: 0, resurfaceY: 0 };
}

function updateSeaMode(e: Enemy) {
  const sea = e.sea ??= createSeaChanterAbilities();
  if (sea.neptune) return;
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
    if (isBossType(ally.type) || ally.type === 'queen_echo' || ally.type === 'aegis_construct' || ally.hp <= 0 ||
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
    const speed = isSeaChanterDiving(e) ? (sea.neptune ? NEPTUNE_DIVE_SPEED : SEA_DIVE_SPEED) : ENEMY_CONFIGS.sea_chanter.speed;
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
        damagePlayer(state, ENEMY_CONFIGS.sea_chanter.damageToPlayer, state.enemies.find(e => e.id === wave.ownerId)); wave.hitPlayer = true;
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
          damagePlayer(state, damage, state.enemies.find(e => e.id === wave.ownerId));
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
      damagePlayer(state, damage, e);damageLunarDecoy(state,damage);
      state.enemyDecoyActive=targetingDecoy;
      damageRuby(state, damage, e);
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
        damagePlayer(state, cfg.damageToPlayer, e);
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

function isEnemyInSingularity(state: GameState, enemy: Enemy): boolean {
  const field=state.singularity;if(!field||field.ticks<=0)return false;
  const x=Math.floor(enemy.x/TILE_SIZE),y=Math.floor(enemy.y/TILE_SIZE);
  return isFloorTile(state.map,x,y)&&Math.hypot((x+.5)*TILE_SIZE-field.x,(y+.5)*TILE_SIZE-field.y)<=SPECIAL_SINGULARITY_RADIUS;
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
      if(enemy.type==='aegis_construct'||enemy.twin?.downedTicks||enemy.pushTiles>0||isBossType(enemy.type)&&!pullBoss)continue;
      const tx=Math.floor(field.x/TILE_SIZE),ty=Math.floor(field.y/TILE_SIZE),dx=tx-enemy.tileX,dy=ty-enemy.tileY;
      if(!dx&&!dy)continue;
      const choices=Math.abs(dx)>=Math.abs(dy)?[[Math.sign(dx),0],[0,Math.sign(dy)]]:[[0,Math.sign(dy)],[Math.sign(dx),0]];
      const step=choices.find(([x,y])=>(x||y)&&isFloorTile(state.map,enemy.tileX+x,enemy.tileY+y));
      if(step){enemy.pushDirX=step[0];enemy.pushDirY=step[1];enemy.pushTiles=1;}
    }
  }
  if(field.damageTimer<=0){
    field.damageTimer=60;
    hitSupernova(state, (x, y) => Math.hypot(x - field.x, y - field.y) <= SPECIAL_SINGULARITY_RADIUS);
    for(const enemy of targets)damageEnemy(state,enemy,isBossType(enemy.type)?enemy.maxHp*SPECIAL_SINGULARITY_BOSS_DAMAGE:SPECIAL_SINGULARITY_NORMAL_DAMAGE,'special');
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
  hitSupernova(state, (x, y) => x >= field.x - SPECIAL_WEAVER_RADIUS && x < field.x + SPECIAL_WEAVER_RADIUS && y >= field.y - SPECIAL_WEAVER_RADIUS && y < field.y + SPECIAL_WEAVER_RADIUS);
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

  for (const e of [...state.enemies].reverse()) {
    if (!state.enemies.includes(e) || e.hp <= 0 || (e.twin?.downedTicks ?? 0) > 0) continue;
    if (e.flashTicks > 0) e.flashTicks--;
    if (e.healFlashTicks > 0) e.healFlashTicks--;
    if (e.shootTicks > 0) e.shootTicks--;

    // Bomber explode mechanic
    if (e.type === 'bomber' && e.exploding) {
      e.explodeTick--;
      if (e.explodeTick <= 0) {
        triggerBomberExplosion(state, e);
        const index = state.enemies.indexOf(e);
        if (index >= 0) state.enemies.splice(index, 1);
      }
      continue;
    }

    if (e.type === 'aegis_construct') { e.pushTiles = 0; continue; }
    if (e.type === 'water_bomb') { e.pushTiles = 0; continue; } // stationary; the challenge times its fuse
    if ((e.type === 'fish_blue' || e.type === 'fish_red' || e.type === 'water_clone') && e.pushTiles <= 0) { updateFish(state, e); continue; } // fish and her clones swim around

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

    if (e.type === 'astral_twins' && e.twin) { updateAstralTwin(state, e); continue; }
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
        // Same escape range as Thorn Weaver: flee when the player is close, otherwise wander.
        const threatened = tileEuclidDist(e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY) <= THORN_FLEE_RANGE;
        if (threatened) e.path = fleePath(state, e);
        else if (e.prayer!.fleeing || e.path.length === 0) e.path = roamPath(state, e);
        e.prayer!.fleeing = threatened;
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
        if (bTargetIsPlayer) damagePlayer(state, ENEMY_CONFIGS.fiery_king.damageToPlayer, e);
        else damageRuby(state, ENEMY_CONFIGS.fiery_king.damageToRuby, e);
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
        damagePlayer(state, rCfg.damageToPlayer, e);
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
      // Newborn copies scatter: they flee the player at boosted speed and hold their bite.
      const newborn = (e.devourer?.newbornTicks ?? 0) > 0;
      if (newborn) e.devourer!.newbornTicks!--;
      // Ignored too long, a body with a stack spends it to bud a copy on its own (counts toward the family cap).
      e.devourer ??= { generation: 0 };
      e.devourer.splitTicks = Math.min(DEVOURER_SELF_SPLIT_TICKS, (e.devourer.splitTicks ?? 0) + 1);
      if (e.devourer.splitTicks >= DEVOURER_SELF_SPLIT_TICKS && e.chargeDirX > 0 && devourerFamilyRoom(state, e) > 1) {
        spawnDevourerCopies(state, e, 1);
        e.chargeDirX--; e.devourer.splitTicks = 0; e.healFlashTicks = 26;
        playSFX_devourerAbsorb();
      }

      // Targets whichever of player/ruby is closer, same split-attention as the King.
      const dHasRuby = !state.enemyDecoyActive && state.rubyTileX !== -1;
      const dDistPlayer = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const dDistRuby = dHasRuby ? tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) : Infinity;
      const dTargetIsPlayer = !dHasRuby || dDistPlayer <= dDistRuby;
      e.targeting = dTargetIsPlayer ? 'player' : 'ruby';
      const dTgtTX = dTargetIsPlayer ? state.playerTileX : state.rubyTileX;
      const dTgtTY = dTargetIsPlayer ? state.playerTileY : state.rubyTileY;
      const dDist = dTargetIsPlayer ? dDistPlayer : dDistRuby;
      const dAttackRange = dCfg.attackRange;

      // Short sound-wave bite; each stack adds damage.
      if (!newborn && e.attackTimer === 0 && dDist <= dAttackRange) {
        playSFX_devourerBite();
        const dTgtX = dTargetIsPlayer ? state.playerX : state.rubyTileX * TILE_SIZE + TILE_SIZE / 2;
        const dTgtY = dTargetIsPlayer ? state.playerY : state.rubyTileY * TILE_SIZE + TILE_SIZE / 2;
        const genDamage = Math.pow(DEVOURER_GEN_DAMAGE_MULT, e.devourer?.generation ?? 0); // each copy generation hits 10% softer
        if (dTargetIsPlayer) damagePlayer(state, (dCfg.damageToPlayer + stacks * DEVOURER_STACK_DAMAGE) * genDamage, e);
        else damageRuby(state, (dCfg.damageToRuby + stacks * DEVOURER_STACK_DAMAGE) * genDamage, e);
        state.laserBeams.push({
          fromX: e.x, fromY: e.y,
          dirX: 0, dirY: 0,
          endX: dTgtX, endY: dTgtY,
          ticks: 20,
          color: '#6b2fa8',
        });
        e.attackTimer = dCfg.attackCooldown;
        e.shootTicks = 16;
        state.screenShakeTicks = Math.max(state.screenShakeTicks, 6);
        state.screenShakeAmt = Math.max(state.screenShakeAmt, 4 + stacks);
      }

      // Periodically consume the nearest regular ally in reach. Below the cap each meal adds a
      // stack (more HP, reach and damage, and one more copy on death); at the cap it only heals.
      if (e.windupTicks > 0) {
        e.windupTicks--;
      } else {
        const nearest = nearestDevourerFood(state, e, DEVOURER_ABSORB_RANGE);
        if (nearest) {
          spawnAbsorbBurst(state, nearest.x, nearest.y, e.x, e.y);
          const idx2 = state.enemies.indexOf(nearest);
          if (idx2 !== -1) state.enemies.splice(idx2, 1);
          if (stacks < DEVOURER_MAX_STACKS) {
            const gained = Math.round(e.maxHp * DEVOURER_STACK_HP_PCT);
            e.maxHp += gained;
            e.hp = Math.min(e.maxHp, e.hp + gained);
            e.chargeDirX = stacks + 1;
          } else {
            e.hp = Math.min(e.maxHp, e.hp + e.maxHp * DEVOURER_FULL_HEAL_PCT); // unrounded: 1% of a small body is under 1 HP
          }
          e.healFlashTicks = 26; // drives the big shockwave-ring pulse in drawEnemy
          playSFX_devourerAbsorb();
          state.screenShakeTicks = Math.max(state.screenShakeTicks, 10);
          state.screenShakeAmt = Math.max(state.screenShakeAmt, 6);
          e.windupTicks = devourerAbsorbCooldown(e); // the cooldown starts only after a real meal
        }
      }

      // BFS toward target — recalculate frequently so she tracks across chambers. While nearly
      // empty (below DEVOURER_HUNGRY_BELOW stacks) she hunts the nearest alien to eat instead.
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        const food = !newborn && e.chargeDirX < DEVOURER_HUNGRY_BELOW ? nearestDevourerFood(state, e, Infinity) : null;
        e.path = newborn ? fleePath(state, e) : food ? bfs(state.map, e.targetTileX, e.targetTileY, food.tileX, food.tileY)
          : bfs(state.map, e.targetTileX, e.targetTileY, dTgtTX, dTgtTY);
        e.pathTimer = 8;
      }
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
      } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
        const genSpeed = Math.pow(DEVOURER_GEN_SPEED_MULT, e.devourer?.generation ?? 0); // each copy generation is a bit slower
        e.stepProgress += dCfg.speed * genSpeed * (newborn ? DEVOURER_NEWBORN_SPEED_MULT : 1) * celestialMoveMultiplier(state, e);
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
          if (ally === e || ally.type === 'aegis_construct' || (ally.twin?.downedTicks ?? 0) > 0) continue;
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
        if (ally === e || ally.type === 'aegis_construct' || (ally.twin?.downedTicks ?? 0) > 0) continue;
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
              playSFX_chargerImpact();
              if (hitPlayer) {
                damagePlayer(state,cCfg.damageToPlayer,e);
                if (state.gamePhase !== 'lost' && !state.enemyDecoyActive && !state.playerKnockback) {
                  state.playerKnockback = { dirX: e.chargeDirX, dirY: e.chargeDirY, started: false };
                }
              } else damageRuby(state,cCfg.damageToRuby,e);
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
          playSFX_enemyAttack(); damagePlayer(state, gCfg.damageToPlayer, e);
          e.attackTimer = gCfg.attackCooldown; e.shootTicks = 14;
        } else if (adjRuby && gTargetRuby) {
          playSFX_enemyAttack(); damageRuby(state, gCfg.damageToRuby, e);
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
        if (ally === e || ally.type === 'shielder' || ally.type === 'aegis_construct' || (ally.twin?.downedTicks ?? 0) > 0) continue;
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
    const speed = e.aegis && !e.aegis.shielded ? AEGIS_EXPOSED_SPEED : cfg.speed;

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
          playSFX_enemyAttack(e);
          e.attackTimer = cfg.attackCooldown;
          e.shootTicks = 14;
        } else {
          playSFX_enemyAttack(e);
          damagePlayer(state, cfg.damageToPlayer, e);
          if (e.type === 'stinger' && state.neptune) { state.neptune.poisonTicks = NEPTUNE_POISON_TICKS; state.neptune.poisonTimer ||= 60; }
          if (e.aegis) encounterEffect(state, 'sentinel-hit', e, state.playerX, state.playerY, 18, '#78dedf');
          e.attackTimer = cfg.attackCooldown;
          e.shootTicks = 14;
        }
      } else if (adjRuby && e.targeting === 'ruby') {
        if (e.type === 'bomber') {
          e.exploding = true; e.explodeTick = 45;
        } else {
          playSFX_enemyAttack(e);
          damageRuby(state, cfg.damageToRuby, e);
          if (e.aegis) encounterEffect(state, 'sentinel-hit', e, (state.rubyTileX + .5) * TILE_SIZE, (state.rubyTileY + .5) * TILE_SIZE, 18, '#78dedf');
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
  for (const other of [...state.enemies].reverse()) {
    if (other === e || !state.enemies.includes(other) || other.twin?.downedTicks) continue;
    if (tileEuclidDist(e.tileX, e.tileY, other.tileX, other.tileY) <= RANGE * 0.6) {
      damageEnemy(state, other, 2, 'enemy');
      if (other.hp <= 0) { killEnemy(state, state.enemies.indexOf(other)); }
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
  state.playerHP = Math.min(PLAYER_MAX_HP, Math.round((state.playerHP + amount) * 10) / 10);
  chargeNeptuneHealing(state, state.playerHP - before);
  if (showEffect && state.playerHP > before) showRewardEffect(state, 'player', 'heal');
}

function healCore(state: GameState, amount: number) {
  const before = state.rubyHP;
  state.rubyHP = Math.min(RUBY_MAX_HP, state.rubyHP + amount);
  chargeNeptuneHealing(state, state.rubyHP - before);
  if (state.rubyHP > before) showRewardEffect(state, 'ruby', 'heal');
}

function killEnemy(state: GameState, idx: number, fromMeteor = false, suppressEnergy = false) {
  const victim = state.enemies[idx];
  if (!victim || (victim.twin?.downedTicks ?? 0) > 0) return;
  if (isNeptuneObject(victim.type)) {
    // Fish, water clones and water balls are objectives: no score, energy, healing or progress.
    spawnDeathParticles(state, victim);
    state.enemies.splice(idx, 1);
    if (victim.type === 'water_clone' || victim.type === 'water_bomb') playSFX_objectBreak('frost'); else playSFX_alienDeath();
    return;
  }
  if (victim.type === 'aegis_construct') {
    spawnDeathParticles(state, victim);
    encounterEffect(state, 'construct-break', victim, victim.x, victim.y, 150, '#78dedf');
    state.enemies.splice(idx, 1);
    const owner = state.enemies.find(e => e.id === victim.constructOwnerId);
    if (owner) refreshAegisShield(state, owner);
    playSFX_objectBreak('pylon');
    return; // Objectives give no score, healing, energy, or stage progress.
  }
  if (victim.type === 'devourer') {
    spawnDevourerCopies(state, victim);
    if (state.enemies.some(other => other !== victim && other.type === 'devourer' && other.hp > 0)) {
      // Not the last of the family: no boss reward yet, but each body killed heals the player a little.
      if (!fromMeteor) healPlayer(state, DEVOURER_BODY_KILL_HEAL + 2 * constellationBonus(state, 'killHealing'));
      spawnDeathParticles(state, victim);
      state.enemies.splice(state.enemies.indexOf(victim), 1);
      playSFX_alienDeath();
      return;
    }
  }
  if (victim.twin) {
    const partner = state.enemies.find(e => e !== victim && e.twin?.pairId === victim.twin!.pairId);
    if (partner && partner.hp > 0 && !partner.twin!.downedTicks) {
      victim.hp = 1; // Keep the downed body in the encounter without feeding casualty sweeps.
      victim.twin.downedTicks = TWIN_REVIVE_TICKS;
      victim.twin.fallTicks = 24;
      partner.twin!.partnerDownTicks = TWIN_REVIVE_TICKS;
      victim.path = []; victim.pushTiles = 0; victim.icyShieldHP = 0; victim.windupTicks = 0;
      victim.targetTileX = victim.tileX; victim.targetTileY = victim.tileY;
      victim.x = (victim.tileX + .5) * TILE_SIZE; victim.y = (victim.tileY + .5) * TILE_SIZE; victim.stepProgress = 0;
      spawnDeathParticles(state, victim);
      encounterEffect(state, 'fall', victim, victim.x, victim.y, 24, victim.twin.index === 1 ? '#83cfff' : '#f08062');
      return;
    }
    if (partner) {
      encounterEffect(state, 'fall', partner, partner.x, partner.y, 30, partner.twin!.index === 1 ? '#83cfff' : '#f08062');
      spawnDeathParticles(state, partner);
      state.enemies.splice(state.enemies.indexOf(partner), 1);
    }
    encounterEffect(state, 'fall', victim, victim.x, victim.y, 30, victim.twin.index === 1 ? '#83cfff' : '#f08062');
    idx = state.enemies.indexOf(victim);
  }
  if (victim.aegis) {
    encounterEffect(state, 'sentinel-death', victim, victim.x, victim.y, 36, '#c5a35d');
    state.enemies = state.enemies.filter(e => e.constructOwnerId !== victim.id);
    idx = state.enemies.indexOf(victim);
  }
  if (state.enemies[idx]?.type === 'thorn_weaver') clearThornHazards(state);
  if (state.enemies[idx]?.type === 'sea_chanter') { stopSeaSounds(); }
  const e = state.enemies[idx];
  spawnDeathParticles(state, e);

  const skipRewards = fromMeteor;
  const recoveredEnergy = e.type === 'energy_leech' ? (e.stolenEnergy ?? 0) : 0;
  const wasMax = state.starEnergy >= STAR_ENERGY_MAX;
  const energyGain = suppressEnergy ? 0 : (skipRewards ? 0 : (STAR_ENERGY_PER_KILL + (e.type === 'fast' ? 8 : 0)) * (1 + 0.2 * constellationBonus(state, 'energy'))) + recoveredEnergy;
  state.starEnergy = Math.min(STAR_ENERGY_MAX, state.starEnergy + energyGain);
  if (!wasMax && state.starEnergy >= STAR_ENERGY_MAX && !isBossType(e.type)) playSFX_powerUp();
  // Stolen energy is returned even when a meteor defeats the Leech.
  if (recoveredEnergy > 0 && !suppressEnergy) state.runnerEnergyFlashTicks = 60;
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
        if (ally === e || (ally.twin?.downedTicks ?? 0) > 0) continue;
        if (tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY) <= RANGE * 0.75) damageEnemy(state, ally, 20, 'enemy');
      }
    } else if (e.type === 'fast') {
      if (!suppressEnergy) state.runnerEnergyFlashTicks = 60;
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
    if (state.trial) state.gamePhase = 'won'; // defeating the guardian clears the trial
    offerConstellation(state);
    if (state.bossesKilled === SPECIAL_UNLOCK_KILLS) announceAscension(state);
    if (state.bossesKilled >= SPECIAL_UNLOCK_KILLS) {
      state.specialSkill = BOSS_SKILL_REWARDS[e.type];
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
  const baseSpeed = knockback?.started ? PRAYER_KNOCKBACK_SPEED : PLAYER_BASE_SPEED * speedMultiplier * (1 + 0.08 * constellationBonus(state, 'speed')) * neptuneTideSpeed(state);

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
      for (const e of [...state.enemies].reverse()) {
        if (!state.enemies.includes(e) || (e.twin?.downedTicks ?? 0) > 0) continue;
        if (chamberOfTile(e.tileX, e.tileY) === ch) {
          // An active Frost Warden shield blocks the meteor completely, without
          // draining its absorb pool. Break the shield with attacks first.
          if (e.icyShieldHP > 0) continue;
          if (state.neptune && e.id === state.neptune.bossId) {
            damageEnemy(state, e, NEPTUNE_PHASE_HP * NEPTUNE_STRIKE_DAMAGE, 'meteor');
          } else if (e.type === 'devourer') {
            // Every body takes the boss meteor share of the ORIGINAL's max HP, so a meteor usually wipes copies.
            const share = (state.bossesKilled >= SPECIAL_UNLOCK_KILLS ? BOSS_LATE_METEOR_DMG : BOSS_METEOR_DMG) / 100;
            damageEnemy(state, e, (e.devourer?.originMaxHp ?? e.maxHp) * share, 'meteor');
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (e.type === 'aegis_construct') {
            damageEnemy(state, e, e.maxHp * 0.5, 'meteor');
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (isBossType(e.type)) {
            // Deals BOSS_METEOR_DMG% of the boss's max HP — so anything already at or below
            // that HP fraction dies outright.
            damageEnemy(state, e, Math.round(e.maxHp * ((state.bossesKilled >= SPECIAL_UNLOCK_KILLS ? BOSS_LATE_METEOR_DMG : BOSS_METEOR_DMG) / 100)), 'meteor');
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else {
            killEnemy(state, state.enemies.indexOf(e), true);
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
    state.poweredTicks = 120 + state.stellarPowerBonusTicks + 60 * constellationBonus(state, 'power');
    state.stellarPowerBonusTicks = 0;
    grantInstantSpeedBoost(state);
    return true;
  }
  return false;
}

// Binary Star's twin stands on the first open tile beside Ruby (or beside the player while carrying).
export function getMirrorTwinTile(state: GameState): { tileX: number; tileY: number } | null {
  if (state.mirrorTwinTicks <= 0) return null;
  const ax = state.rubyTileX !== -1 ? state.rubyTileX : state.playerTileX, ay = state.rubyTileX !== -1 ? state.rubyTileY : state.playerTileY;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (isFloorTile(state.map, ax + dx, ay + dy)) return { tileX: ax + dx, tileY: ay + dy };
  return { tileX: ax, tileY: ay };
}

// Runs an attack from the player and, while Binary Star is active, again from the twin at reduced damage.
function withMirrorTwin(state: GameState, attack: (tileX: number, tileY: number, mult: number) => boolean): boolean {
  let hit = attack(state.playerTileX, state.playerTileY, 1);
  const twin = getMirrorTwinTile(state);
  if (twin) hit = attack(twin.tileX, twin.tileY, SPECIAL_TWIN_DAMAGE_MULT) || hit;
  return hit;
}

export function useLaser(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.laserCooldown > 0) return;
  const powered = checkAndConsumePower(state);
  const range = (powered ? LASER_RANGE_PWR : LASER_RANGE) + 2 * constellationBonus(state, 'laserRange');
  const baseDmg = (powered ? LASER_DMG_PWR : LASER_DMG) * (1 + 0.2 * constellationBonus(state, 'laser'));

  const DIRS: [number, number][] = [[1,0],[-1,0],[0,1],[0,-1]];
  const laserHit = withMirrorTwin(state, (originX, originY, mult) => {
    const dmg = baseDmg * mult;
    let hit = false;
    for (const [dx, dy] of DIRS) {
      let tx = originX + dx;
      let ty = originY + dy;
      let endTx = originX;
      let endTy = originY;
      for (let r = 0; r < range; r++) {
        if (!isFloorTile(state.map, tx, ty)) break;
        endTx = tx; endTy = ty;
        hitSupernova(state, (x, y) => Math.floor(x / TILE_SIZE) === tx && Math.floor(y / TILE_SIZE) === ty);
        for (const e of [...state.enemies].reverse()) {
          if (!state.enemies.includes(e) || (e.twin?.downedTicks ?? 0) > 0) continue;
          if (e.tileX === tx && e.tileY === ty) {
            damageEnemy(state, e, dmg); hit = true;
            chainElectric(state, e);
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e));
          }
        }
        tx += dx; ty += dy;
      }
      state.laserBeams.push({
        fromX: mult === 1 ? state.playerX : originX * TILE_SIZE + TILE_SIZE / 2,
        fromY: mult === 1 ? state.playerY : originY * TILE_SIZE + TILE_SIZE / 2,
        dirX: dx, dirY: dy,
        endX: endTx * TILE_SIZE + TILE_SIZE / 2,
        endY: endTy * TILE_SIZE + TILE_SIZE / 2,
        ticks: 18,
        powered
      });
    }
    return hit;
  });
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

  const waveHit = withMirrorTwin(state, (originX, originY, mult) => {
    state.waveEffects.push({
      cx: mult === 1 ? state.playerX : originX * TILE_SIZE + TILE_SIZE / 2, cy: mult === 1 ? state.playerY : originY * TILE_SIZE + TILE_SIZE / 2,
      radius: 0, maxRadius: radius * TILE_SIZE, ticks: 30, powered
    });
    hitSupernova(state, (x, y) => Math.hypot(x / TILE_SIZE - .5 - originX, y / TILE_SIZE - .5 - originY) <= radius);
    let hit = false;
    for (const e of [...state.enemies].reverse()) {
      if (!state.enemies.includes(e) || (e.twin?.downedTicks ?? 0) > 0) continue;
      const dist = tileEuclidDist(e.tileX, e.tileY, originX, originY);
      if (dist <= radius) {
        damageEnemy(state, e, dmg * mult); hit = true;
        chainElectric(state, e);
        const edx = e.tileX - originX;
        const edy = e.tileY - originY;
        const len = Math.sqrt(edx * edx + edy * edy) || 1;
        e.pushDirX = Math.round(edx / len);
        e.pushDirY = Math.round(edy / len);
        if (e.pushDirX === 0 && e.pushDirY === 0) e.pushDirX = 1;
        e.pushTiles = push;
        if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e));
      }
    }
    return hit;
  });
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
    // Snapshot protection before any blast/chain hit can break a shield. The same
    // detonation must not then hit that enemy's HP through a later chained strike.
    const frostProtected = new Set(state.enemies.filter(e => e.icyShieldHP > 0).map(e => e.id));
    const blastAt = (originX: number, originY: number, mult: number) => {
      hitSupernova(state, (x, y) => Math.hypot(x / TILE_SIZE - .5 - originX, y / TILE_SIZE - .5 - originY) <= radius);
      state.bombBlasts.push({
        cx: originX * TILE_SIZE + TILE_SIZE / 2,
        cy: originY * TILE_SIZE + TILE_SIZE / 2,
        radius: 0, maxRadius: radius * TILE_SIZE, ticks: 28,
      });
      let hit = false;
      for (const e of [...state.enemies].reverse()) {
        if (!state.enemies.includes(e) || (e.twin?.downedTicks ?? 0) > 0) continue;
        if (tileEuclidDist(e.tileX, e.tileY, originX, originY) <= radius) {
          // An active frost shield blocks this entire blast: it can lose shield HP,
          // but excess bomb damage never spills into the enemy's real HP.
          const damage = frostProtected.has(e.id) ? Math.min(dmg * mult, e.icyShieldHP) : dmg * mult;
          if (damage > 0) damageEnemy(state, e, damage);
          hit = true;
          chainElectric(state, e, frostProtected);
          if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e));
        }
      }
      return hit;
    };
    let bombHit = blastAt(bx, by, 1);
    // The twin answers the detonation with its own blast where it stands; it never hurts the player.
    const twin = getMirrorTwinTile(state);
    if (twin) bombHit = blastAt(twin.tileX, twin.tileY, SPECIAL_TWIN_DAMAGE_MULT) || bombHit;
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

// A pad works from its own tile or any of the eight tiles around it.
export function isNearTeleportPad(state: GameState): boolean {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (state.map[state.playerTileY + dy]?.[state.playerTileX + dx] === T_TELEPORT) return true;
  }
  return false;
}

// Opens the teleport screen when the player is on or next to a pad.
export function tryActivateTeleport(state: GameState): boolean {
  if (state.gamePhase !== 'playing') return false;
  if (state.teleportCooldown > 0) return false;
  
  if (!isNearTeleportPad(state)) return false;
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
    if (e.type === 'fish_blue' || e.type === 'fish_red') continue; // fish are not enemies
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
  if (state.trial) return state.trial.boss;
  if(state.bossPool.length===0)state.bossPool=[...BOSS_TYPES];
  const choices=state.bossPool.length>1?state.bossPool.filter(type=>type!==state.lastNaturalBoss):state.bossPool;
  const next=choices[Math.floor(Math.random()*choices.length)];
  state.bossPool=state.bossPool.filter(type=>type!==next);
  state.lastNaturalBoss=next;
  return next;
}

// Environmental damage cannot feed Chanter or chain player electricity.
function detonateSupernova(state: GameState) {
  const point = state.ambientEvents.active!.points[0];
  const x = (point.x + .5) * TILE_SIZE, y = (point.y + .5) * TILE_SIZE;
  const distance = Math.hypot(state.playerX - x, state.playerY - y) / TILE_SIZE;
  const originChamber = chamberOfTile(point.x, point.y);
  const playerChamber = chamberOfTile(Math.floor(state.playerX / TILE_SIZE), Math.floor(state.playerY / TILE_SIZE));
  if (distance < SUPERNOVA_PLAYER_RADIUS && playerChamber !== (originChamber ^ 3)) {
    const strength = Math.min(1, (SUPERNOVA_PLAYER_RADIUS - distance) / (SUPERNOVA_PLAYER_RADIUS - SUPERNOVA_FULL_DAMAGE_RADIUS));
    damagePlayer(state, Math.ceil(100 * strength ** 3));
  }
  const playerDied = (state as GameState).gamePhase === 'lost';
  const victims = state.enemies.filter(enemy => enemy.hp > 0);
  for (const enemy of victims) {
    const d = Math.hypot(enemy.x - x, enemy.y - y) / TILE_SIZE;
    const strength = Math.max(0, 1 - d / 65) ** 2;
    damageEnemy(state, enemy, isBossType(enemy.type) ? enemy.maxHp * (.05 + .55 * strength) : 5 + 95 * strength, 'enemy');
  }
  for (const enemy of victims) {
    const index = state.enemies.indexOf(enemy);
    if (index >= 0 && enemy.hp <= 0) killEnemy(state, index, true);
  }
  if (playerDied) state.playerHP = 0; // Boss restoration cannot revive a fatal simultaneous blast.
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 30);
  state.screenShakeAmt = Math.max(state.screenShakeAmt, 16);
  playSFX_supernova();
}

// ─── Main tick ───────────────────────────────────────────────────────────────

export function tick(state: GameState) {
  if (state.gamePhase !== 'playing') { pauseAmbientEventSounds(); stopPoisonSound(); stopSingularitySound(); stopGaiaFieldSound(); return; }

  resumeAmbientEventSounds();
  if (state.constellationDelayTicks > 0 && --state.constellationDelayTicks === 0 && state.constellationChoices.length) {
    state.gamePhase = 'constellation';
    try {
      const sound = new Audio('/sounds/constellation-choice.wav'); sound.volume = .6; sound.play().catch(() => {});
    } catch { }
    state.playerQueuedDirX = state.playerQueuedDirY = 0;
    stopChargeSound(); stopPoisonSound(); stopSingularitySound(); stopGaiaFieldSound();
    return;
  }
  state.gameTick++;
  updateBossEncounters(state);
  if (state.constellationReveal && --state.constellationReveal.ticks <= 0) state.constellationReveal = null;
  if (state.meteoriteImpact && --state.meteoriteImpact.ticks <= 0) state.meteoriteImpact = null;
  if(state.lunarDecoy){
    if(state.lunarDecoy.flashTicks>0)state.lunarDecoy.flashTicks--;
    if(state.lunarDecoy.invulnerableTicks>0)state.lunarDecoy.invulnerableTicks--;
  }
  if (state.ascensionBannerTicks > 0) state.ascensionBannerTicks--;
  state.specialEffects = state.specialEffects.filter(fx => --fx.ticks > 0);
  if (state.venusVeilTicks > 0) state.venusVeilTicks--;
  if (state.mirrorTwinTicks > 0) state.mirrorTwinTicks--;
  state.venusReflects = state.venusReflects.filter(fx => --fx.ticks > 0);
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
  if (!state.noBossSpawns && (state.difficultyLevel >= 1 || state.trial) && !hasActiveBoss) {
    if (state.bossWarningTicks > 0) {
      state.bossWarningTicks--;
      if (state.bossWarningTicks === 0) {
        // Spawn one random boss-tier enemy at a spawn tile far from player.
        // One boss encounter at a time; Astral Twins has two bodies.
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
            initializeNewEncounter(state, state.enemies[state.enemies.length - 1]);
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
  const ambientResult = updateAmbientEvents(state);
  if (ambientResult === 'supernova') detonateSupernova(state);
  if ((state as GameState).gamePhase === 'lost') return;
  if (ambientResult === true) {
    healPlayer(state, 20); healCore(state, 20);
    state.starEnergy = STAR_ENERGY_MAX;
    state.stellarPowerBonusTicks = Math.max(state.stellarPowerBonusTicks, 120);
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
    const dmg = (b.powered ? BULLET_DMG_PWR : BULLET_DMG) * (1 + 0.25 * constellationBonus(state, 'bullets')) * (b.mirror ? SPECIAL_TWIN_DAMAGE_MULT : 1);
    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (!e || (e.twin?.downedTicks ?? 0) > 0) continue;
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
    if (state.enemies[i]?.hp <= 0) killEnemy(state, i);
  }
  if (state.tutorial) updateTutorial(state);
  if (state.trial) updateTrialSkill(state);
  if (state.neptune) updateNeptune(state);
}

// ─── Neptune challenge ────────────────────────────────────────────────────────

export function isNeptuneObject(type: EnemyType) {
  return type === 'fish_blue' || type === 'fish_red' || type === 'water_clone' || type === 'water_bomb';
}

export function neptunePhaseFloor(neptune: NeptuneState) { return (3 - neptune.phase) * NEPTUNE_PHASE_HP; }
function neptunePhaseCeil(neptune: NeptuneState) { return (4 - neptune.phase) * NEPTUNE_PHASE_HP; }

// Healing can never lift her past the top of the current phase.
function healNeptune(state: GameState, boss: Enemy, amount: number) {
  const neptune = state.neptune!;
  if (amount <= 0 || boss.hp <= 0) return;
  boss.hp = Math.min(neptunePhaseCeil(neptune), boss.hp + amount);
  if (boss.sea) boss.sea.healPulseTicks = 24;
}

function chargeNeptuneHealing(state: GameState, healed: number) {
  if (!state.neptune || healed <= 0) return;
  state.neptune.healCharge = Math.min(NEPTUNE_HEAL_CHARGE_MAX, state.neptune.healCharge + healed);
}

function blueFishPopped(state: GameState) {
  const neptune = state.neptune!, boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0);
  if (boss && isSeaChanterDiving(boss)) { healNeptune(state, boss, NEPTUNE_PHASE_HP * NEPTUNE_FISH_BOSS_HEAL); playSeaHealing(boss); }
  else healPlayer(state, NEPTUNE_FISH_HEAL);
}

function updateFish(state: GameState, e: Enemy) {
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    if (e.path.length === 0) e.path = roamPath(state, e);
    const next = e.path.shift();
    if (next && isFloorTile(state.map, next[0], next[1])) { [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0; }
    return;
  }
  e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + ENEMY_CONFIGS[e.type].speed);
  e.x = (e.tileX + .5) * TILE_SIZE + (e.targetTileX - e.tileX) * e.stepProgress;
  e.y = (e.tileY + .5) * TILE_SIZE + (e.targetTileY - e.tileY) * e.stepProgress;
  if (e.stepProgress === TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
}

function spawnNeptuneObject(state: GameState, type: EnemyType, x: number, y: number) {
  const object = createEncounterEnemy(state, type, x, y, ENEMY_CONFIGS[type].maxHp);
  object.attackTimer = 100000; object.visualSpawnTicks = 20;
  state.enemies.push(object);
  return object;
}

function randomFloorTileAwayFromPlayer(state: GameState, minDistance: number): [number, number] | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = 1 + Math.floor(Math.random() * (MAP_COLS - 2)), y = 1 + Math.floor(Math.random() * (MAP_ROWS - 2));
    if (state.map[y]?.[x] === T_FLOOR && tileEuclidDist(x, y, state.playerTileX, state.playerTileY) >= minDistance) return [x, y];
  }
  return null;
}

// Speed along a tide: faster with the flow, slower against it.
export function neptuneTideSpeed(state: GameState) {
  const tide = state.neptune?.tides.find(t => t.chamber === chamberOfTile(state.playerTileX, state.playerTileY));
  if (!tide) return 1;
  const dx = state.playerTargetX - state.playerTileX, dy = state.playerTargetY - state.playerTileY;
  if (dx === tide.dirX && dy === tide.dirY) return NEPTUNE_TIDE_WITH;
  if (dx === -tide.dirX && dy === -tide.dirY) return NEPTUNE_TIDE_AGAINST;
  return 1;
}

function randomTide(chamber: number, ticks: number): NeptuneTide {
  const [dirX, dirY] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
  return { chamber, dirX, dirY, ticks };
}

function updateNeptuneTides(state: GameState) {
  const neptune = state.neptune!;
  if (neptune.phase === 3) {
    // Maelstrom: two rooms always flow, and the currents move every 15s.
    if (neptune.tides.length < 2 || neptune.tides.some(t => t.ticks <= 0)) {
      const rooms = [0, 1, 2, 3].sort(() => Math.random() - .5).slice(0, 2);
      neptune.tides = rooms.map(room => randomTide(room, NEPTUNE_TIDE_ROTATE));
    }
  } else if (--neptune.tideTimer <= 0) {
    neptune.tides = [randomTide(Math.floor(Math.random() * 4), NEPTUNE_TIDE_TICKS)];
    neptune.tideTimer = NEPTUNE_TIDE_GAP[0] + Math.floor(Math.random() * (NEPTUNE_TIDE_GAP[1] - NEPTUNE_TIDE_GAP[0]));
  }
  for (const tide of neptune.tides) tide.ticks--;
  if (neptune.phase !== 3) neptune.tides = neptune.tides.filter(t => t.ticks > 0);
  // Like the black hole: anyone not swimming with the current is pushed one tile along it.
  if (--neptune.tidePushTimer > 0) return;
  neptune.tidePushTimer = NEPTUNE_TIDE_PUSH_GAP;
  const tide = neptune.tides.find(t => t.chamber === chamberOfTile(state.playerTileX, state.playerTileY));
  if (!tide || state.playerKnockback || state.playerFrozenTicks > 0 || neptuneTideSpeed(state) === NEPTUNE_TIDE_WITH) return;
  if (isFloorTile(state.map, state.playerTargetX + tide.dirX, state.playerTargetY + tide.dirY))
    state.playerKnockback = { dirX: tide.dirX, dirY: tide.dirY, started: false };
}

// A random floor tile in a room that has no clone yet (any room once all four are used), away from the player.
function neptuneCloneTile(state: GameState, cloneIds: number[]): [number, number] | null {
  const used = new Set(state.enemies.filter(c => cloneIds.includes(c.id)).map(c => chamberOfTile(c.tileX, c.tileY)));
  const rooms = [0, 1, 2, 3].filter(room => !used.has(room));
  const room = (rooms.length ? rooms : [0, 1, 2, 3])[Math.floor(Math.random() * (rooms.length || 4))];
  const tiles = freeChamberTiles(state, room).filter(([x, y]) => tileEuclidDist(x, y, state.playerTileX, state.playerTileY) >= 5);
  return tiles.length ? tiles[Math.floor(Math.random() * tiles.length)] : null;
}

function startNeptuneDive(state: GameState, boss: Enemy, point: number) {
  const neptune = state.neptune!, sea = boss.sea ??= createSeaChanterAbilities();
  neptune.dive = { point, ticks: NEPTUNE_DIVE_TICKS[neptune.phase], dropsLeft: neptune.phase === 3 && point === 0 ? NEPTUNE_FINAL_CLONES : NEPTUNE_CLONES[neptune.phase], dropTimer: 20, cloneIds: [] };
  sea.mode = 'diving'; sea.diveElapsedTicks = 0; sea.diveFleeing = false; sea.songWindupTicks = 0; sea.resurfaceTicks = 0;
  boss.pathTimer = 0; boss.path = [];
  playSeaSound('dive'); playSeaSound('diveSinging');
}

function endNeptuneDive(state: GameState, boss: Enemy) {
  const neptune = state.neptune!, sea = boss.sea!;
  for (const id of neptune.dive?.cloneIds ?? []) { const i = state.enemies.findIndex(c => c.id === id); if (i >= 0) state.enemies.splice(i, 1); }
  neptune.dive = null;
  sea.mode = 'hunting'; sea.songCooldown = SEA_SONG_FIRST_DELAY; sea.allyHealCooldown = SEA_ALLY_HEAL_INTERVAL;
  sea.resurfaceTicks = 36; sea.resurfaceX = boss.x; sea.resurfaceY = boss.y; sea.songWindupTicks = 0;
  boss.pathTimer = 0; boss.path = [];
  stopSeaSound('diveSinging');
}

function advanceNeptunePhase(state: GameState, boss: Enemy) {
  const neptune = state.neptune!;
  if (neptune.phase === 3) { neptune.exposed = true; boss.hp = .01; return; } // she resurfaces exposed; the next hit clears the challenge
  neptune.phase = (neptune.phase + 1) as 2 | 3;
  neptune.armed = NEPTUNE_DIVE_POINTS[neptune.phase].map(() => true);
  neptune.bombTimer = NEPTUNE_BOMB_INTERVAL; neptune.tides = []; neptune.phaseBannerTicks = 180;
  boss.hp = neptunePhaseCeil(neptune) - .01; boss.healFlashTicks = 30;
  state.bossSpawnName = `PHASE ${neptune.phase}`; state.bossSpawnColor = ENEMY_CONFIGS.sea_chanter.color; state.bossSpawnTicks = 150;
  playCelestialSound('ready');
}

// God panel: jump straight to a phase at full phase HP (summoning her first if she has not arrived).
export function godSetNeptunePhase(state: GameState, phase: 1 | 2 | 3) {
  const neptune = state.neptune;
  if (!neptune || state.gamePhase !== 'playing') return;
  let boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0);
  if (!boss) { godSpawnBoss(state, 'sea_chanter'); boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0); }
  if (!boss) return;
  if (neptune.dive) endNeptuneDive(state, boss);
  state.enemies = state.enemies.filter(e => e.type !== 'water_clone' && e.type !== 'water_bomb');
  neptune.phase = phase; neptune.exposed = false;
  neptune.armed = NEPTUNE_DIVE_POINTS[phase].map(() => true);
  neptune.bombTimer = NEPTUNE_BOMB_INTERVAL; neptune.tides = [];
  boss.hp = neptunePhaseCeil(neptune) - .01; boss.healFlashTicks = 30;
  state.bossSpawnName = 'PHASE ' + phase; state.bossSpawnColor = ENEMY_CONFIGS.sea_chanter.color; state.bossSpawnTicks = 120;
}

function updateNeptune(state: GameState) {
  const neptune = state.neptune!;
  state.ambientEvents.timer = Math.max(state.ambientEvents.timer, 3600); // no space events on this world
  // Stinger poison.
  if (neptune.poisonTicks > 0) {
    neptune.poisonTicks--;
    if (--neptune.poisonTimer <= 0) { damagePlayer(state, NEPTUNE_POISON_DAMAGE); neptune.poisonTimer = 60; }
  }
  // Fish keep the water busy.
  const fish = state.enemies.filter(f => f.type === 'fish_blue' || f.type === 'fish_red').length;
  if (fish < NEPTUNE_FISH_CAP && --neptune.fishTimer <= 0) {
    const tile = randomFloorTileAwayFromPlayer(state, 6);
    if (tile) spawnNeptuneObject(state, Math.random() < NEPTUNE_FISH_RED_CHANCE ? 'fish_red' : 'fish_blue', tile[0], tile[1]);
    neptune.fishTimer = NEPTUNE_FISH_SPAWN_GAP;
  }
  updateNeptuneTides(state);
  // Sky laser countdown and strike.
  if (neptune.laser && --neptune.laser.ticks <= 0) { neptuneStrike(state, neptune.laser.chamber); neptune.laser = null; }
  if (neptune.phaseBannerTicks > 0) neptune.phaseBannerTicks--;
  if (neptune.laserImpact && --neptune.laserImpact.ticks <= 0) neptune.laserImpact = null;
  // Water balls tick toward their burst.
  for (const ball of state.enemies.filter(b => b.type === 'water_bomb')) {
    if (--ball.windupTicks > 0) continue;
    state.bombBlasts.push({ cx: ball.x, cy: ball.y, radius: 0, maxRadius: NEPTUNE_BOMB_RADIUS * TILE_SIZE, ticks: 28, water: true });
    if (tileEuclidDist(ball.tileX, ball.tileY, state.playerTileX, state.playerTileY) <= NEPTUNE_BOMB_RADIUS) damagePlayer(state, NEPTUNE_BOMB_DAMAGE);
    if (state.rubyTileX !== -1 && tileEuclidDist(ball.tileX, ball.tileY, state.rubyTileX, state.rubyTileY) <= NEPTUNE_BOMB_RADIUS) damageRuby(state, NEPTUNE_BOMB_DAMAGE);
    state.enemies.splice(state.enemies.indexOf(ball), 1);
    playSFX_bomb();
  }
  const boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0);
  if (!boss) return;
  boss.hp = Math.min(boss.hp, neptunePhaseCeil(neptune));
  const points = NEPTUNE_DIVE_POINTS[neptune.phase], floor = neptunePhaseFloor(neptune);
  const level = (point: number) => floor + point * NEPTUNE_PHASE_HP;
  const dive = neptune.dive;
  if (neptune.exposed) boss.hp = Math.min(boss.hp, .01); // no healing back once exposed
  if (!dive && neptune.exposed) return;
  if (!dive) points.forEach((point, i) => { if (boss.hp > level(point) + .5) neptune.armed[i] = true; }); // re-arm only while surfaced
  if (!dive) {
    const i = points.findIndex((point, index) => neptune.armed[index] && boss.hp <= level(point) + .02);
    if (i >= 0) { neptune.armed[i] = false; startNeptuneDive(state, boss, points[i]); return; }
    // Phase 2+: water balls while surfaced.
    if (neptune.phase >= 2 && --neptune.bombTimer <= 0) {
      neptune.bombTimer = NEPTUNE_BOMB_INTERVAL;
      const ball = spawnNeptuneObject(state, 'water_bomb', state.playerTileX, state.playerTileY);
      ball.windupTicks = NEPTUNE_BOMB_FUSE;
      boss.shootTicks = 24; playSeaSound('attack');
    }
    return;
  }
  // Diving: release clones one at a time, each somewhere random in a room not yet used, then wait for them to be found.
  if (dive.dropsLeft > 0 && --dive.dropTimer <= 0) {
    const tile = neptuneCloneTile(state, dive.cloneIds) ?? [boss.tileX, boss.tileY];
    dive.cloneIds.push(spawnNeptuneObject(state, 'water_clone', tile[0], tile[1]).id);
    dive.dropsLeft--; dive.dropTimer = NEPTUNE_CLONE_DROP_GAP;
  }
  const alive = dive.cloneIds.filter(id => state.enemies.some(c => c.id === id && c.hp > 0)).length;
  if (dive.dropsLeft === 0 && alive === 0) {
    boss.hp = Math.min(boss.hp, Math.max(level(dive.point), .01)); // all ally healing during the dive is cancelled
    const finished = dive.point === 0;
    endNeptuneDive(state, boss);
    if (finished) advanceNeptunePhase(state, boss);
    return;
  }
  if (--dive.ticks <= 0) {
    healNeptune(state, boss, alive * NEPTUNE_CLONE_HEAL * NEPTUNE_PHASE_HP); // each clone you missed restores her
    playSeaHealing(boss);
    endNeptuneDive(state, boss);
  }
}

// Meteor-like strike on a whole room: aliens and water objects there are destroyed, she takes a share of
// phase HP, and the player and Ruby are hit like a meteor if they are inside.
function neptuneStrike(state: GameState, chamber: number) {
  const neptune = state.neptune!;
  neptune.laserImpact = { chamber, ticks: 70 };
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 22); state.screenShakeAmt = Math.max(state.screenShakeAmt, 12);
  playSFX_meteorite();
  for (const target of [...state.enemies].reverse()) {
    if (!state.enemies.includes(target) || chamberOfTile(target.tileX, target.tileY) !== chamber) continue;
    if (target.id === neptune.bossId) damageEnemy(state, target, NEPTUNE_PHASE_HP * NEPTUNE_STRIKE_DAMAGE, 'meteor');
    else if (!isBossType(target.type)) { damageEnemy(state, target, target.hp + 1, 'meteor'); const i = state.enemies.indexOf(target); if (i >= 0) killEnemy(state, i, true); }
  }
  if (chamberOfTile(state.playerTileX, state.playerTileY) === chamber) damagePlayer(state, METEORITE_PLAYER_DMG);
  if (state.rubyTileX !== -1 && chamberOfTile(state.rubyTileX, state.rubyTileY) === chamber) damageRuby(state, METEORITE_RUBY_DMG);
}

export function canOpenSkyLaser(state: GameState) {
  return !!state.neptune && state.gamePhase === 'playing' && !state.neptune.laser && state.neptune.healCharge >= NEPTUNE_HEAL_CHARGE_MAX;
}
export function openSkyLaser(state: GameState): boolean {
  if (!canOpenSkyLaser(state)) return false;
  state.gamePhase = 'laserTarget'; state.playerQueuedDirX = state.playerQueuedDirY = 0;
  return true;
}
export function chooseSkyLaser(state: GameState, chamber: number): boolean {
  if (state.gamePhase !== 'laserTarget' || !state.neptune || chamber < 0 || chamber > 3) return false;
  state.neptune.laser = { chamber, ticks: NEPTUNE_LASER_WARNING };
  state.neptune.healCharge = 0;
  state.gamePhase = 'playing';
  return true;
}
export function cancelSkyLaser(state: GameState) {
  if (state.gamePhase === 'laserTarget') state.gamePhase = 'playing';
}

// Trial skill: once cast (the held skill empties), it comes back after TRIAL_SKILL_COOLDOWN.
function updateTrialSkill(state: GameState) {
  const trial = state.trial!;
  if (state.specialSkill) return;
  if (trial.cooldown === 0) trial.cooldown = TRIAL_SKILL_COOLDOWN;
  else if (--trial.cooldown === 0) { state.specialSkill = trial.skill; playCelestialSound('ready'); }
}

// ─── Tutorial ─────────────────────────────────────────────────────────────────

function spawnTutorialAliens(state: GameState, count: number, chamber = chamberOfTile(state.playerTileX, state.playerTileY)) {
  const room = chamber >= 0 ? chamber : 0;
  const tiles = freeChamberTiles(state, room).filter(([x, y]) => {
    const d = Math.hypot(x - state.playerTileX, y - state.playerTileY);
    return d >= 4 && d <= 8;
  });
  for (let i = 0; i < count && tiles.length; i++) {
    const [x, y] = tiles.splice(Math.floor(Math.random() * tiles.length), 1)[0];
    const alien = createEncounterEnemy(state, 'normal', x, y, ENEMY_CONFIGS.normal.maxHp);
    alien.attackTimer = 90;
    state.enemies.push(alien);
  }
}

function enterTutorialStep(state: GameState, step: number) {
  const t = state.tutorial!;
  t.step = step; t.count = 0; t.pauseTicks = 0; t.retry = false;
  const id = TUTORIAL_STEPS[step]?.id;
  if (id === 'laser' || id === 'bullet') spawnTutorialAliens(state, 2);
  if (id === 'wave' || id === 'bomb') spawnTutorialAliens(state, 3);
  if (id === 'energy') { state.starEnergy = Math.max(state.starEnergy, STAR_ENERGY_MAX - 10); state.poweredTicks = 0; spawnTutorialAliens(state, 3); }
  if (id === 'carry') t.carried = state.playerCarryingRuby;
  if (id === 'heal') {
    state.enemies = state.enemies.filter(enemy => isBossType(enemy.type));
    state.playerHP = Math.min(state.playerHP, 50); state.rubyHP = Math.min(state.rubyHP, 50);
  }
  if (id === 'meteor') {
    const chamber = chamberOfTile(state.playerTileX, state.playerTileY);
    state.meteoriteWarning = chamber >= 0 ? chamber : state.playerChamber >= 0 ? state.playerChamber : 0;
    state.meteoriteStrikeIn = METEORITE_WARNING;
    spawnTutorialAliens(state, 3, state.meteoriteWarning);
  }
  if (id === 'celestial') { state.specialSkill = 'fiery_king'; spawnTutorialAliens(state, 4); }
}

// Watches the player's actions (cooldowns starting, tiles moved, Ruby toggled) to advance the current step.
function updateTutorial(state: GameState) {
  const t = state.tutorial!;
  state.meteoriteTimer = Math.max(state.meteoriteTimer, METEORITE_CYCLE); // natural meteors never start
  state.ambientEvents.timer = Math.max(state.ambientEvents.timer, 3600);
  const started = (key: string, value: number) => { const fired = value > (t.cooldowns[key] ?? 0); t.cooldowns[key] = value; return fired; };
  const laser = started('laser', state.laserCooldown), bullet = started('bullet', state.bulletCooldown);
  const wave = started('wave', state.waveCooldown), speed = started('speed', state.speedCooldown);
  const bomb = started('bomb', state.bombCooldown), heal = started('heal', state.rubyHealCooldown);
  const powered = started('powered', state.poweredTicks);
  const moved = state.playerTileX !== t.lastTile[0] || state.playerTileY !== t.lastTile[1];
  const jumped = Math.max(Math.abs(state.playerTileX - t.lastTile[0]), Math.abs(state.playerTileY - t.lastTile[1])) > 2;
  t.lastTile = [state.playerTileX, state.playerTileY];
  const toggled = state.playerCarryingRuby !== t.carried; t.carried = state.playerCarryingRuby;

  const step = TUTORIAL_STEPS[t.step];
  if (!step || step.id === 'done') return;
  if (t.pauseTicks > 0) { if (--t.pauseTicks === 0) enterTutorialStep(state, t.step + 1); return; }
  const aliensLeft = state.enemies.some(enemy => !isBossType(enemy.type));
  switch (step.id) {
    case 'move': if (moved) t.count++; break;
    case 'laser': if (laser) t.count = Math.max(t.count, 1); if (!aliensLeft && t.count >= 1) t.count = step.goal; break;
    case 'bullet': if (bullet) t.count = Math.max(t.count, 1); if (!aliensLeft && t.count >= 1) t.count = step.goal; break;
    case 'wave': if (wave) t.count++; break;
    case 'speed': if (speed) t.count++; break;
    case 'bomb': if (bomb) t.count++; break;
    case 'energy': if (powered) t.count++; break;
    case 'carry': if (toggled) t.count++; break;
    case 'heal': if (heal) t.count++; break;
    case 'teleport': if (jumped) t.count++; break;
    case 'meteor':
      if (state.meteoriteImpact && state.meteoriteWarning < 0 && t.count === 0) {
        if (chamberOfTile(state.playerTileX, state.playerTileY) === state.meteoriteImpact.chamber) {
          t.retry = true; state.playerHP = Math.max(state.playerHP, 60); enterTutorialStep(state, t.step); t.retry = true;
        } else t.count = 1;
      }
      break;
    case 'celestial': if (!state.specialSkill && state.playerCastKind === 'fiery_king') t.count = 1; break;
  }
  if (t.count >= step.goal) { t.count = step.goal; t.pauseTicks = TUTORIAL_STEP_PAUSE; }
}

// God-mode debug tool: clear/suppress regular enemies without rewards or boss cleanup.
export function godSetNoBossSpawns(state: GameState, enabled: boolean) {
  state.noBossSpawns=enabled;
  if(enabled){
    state.encounterEffects = [];
    state.enemies=state.enemies.filter(e=>!isBossType(e.type)&&e.type!=='queen_echo'&&e.type!=='aegis_construct');
    clearThornHazards(state);stopSeaSounds();state.seaSongWaves=[];state.seaSongBursts=[];
    state.prayerWaves=[];state.frostIceTiles=[];state.playerFrozenTicks=0;state.kingArenaPulseTicks=0;state.slashEffects=[];
    const bossColors=new Set(['#cc0022','#cc33ff','#dd88ff','#6b2fa8','#aaeeff','#ffdd22','#89cbff']);
    state.laserBeams=state.laserBeams.filter(beam=>!bossColors.has(beam.color??''));
    if(state.hallwaySeal!==-1)setHallwayWalled(state,state.hallwaySeal,false);
    state.hallwaySeal=-1;state.hallwaySealTicks=0;
    state.bossWarningTicks=0;state.bossTimer=BOSS_SPAWN_INTERVAL;state.bossSpawnTicks=0;
  }
}

export function godSetNoMobs(state: GameState, enabled: boolean) {
  state.noMobs = enabled;
  state.spawnTimer = 0;
  if (enabled) state.enemies = state.enemies.filter(e => isBossType(e.type) || e.type === 'queen_echo' || e.type === 'aegis_construct');
}

// God-mode debug tool: force-spawn a specific boss type at a random valid spawn tile,
// removing whichever boss-tier enemy currently exists (queen decoys are left alone —
// they persist independently of their queen per normal rules).
export function godAdvanceStage(state: GameState) {
  if (state.gamePhase !== 'playing' || state.constellationChoices.length) return;
  state.bossesKilled++;
  state.difficultyLevel = Math.max(state.difficultyLevel, Math.min(DIFFICULTY_TIERS.length - 1, 3 + state.bossesKilled));
  if (state.bossesKilled === SPECIAL_UNLOCK_KILLS) announceAscension(state);
  offerConstellation(state);
}

export function godEnterAscension(state: GameState) {
  if(state.gamePhase!=='playing')return;
  const firstUnlock = state.bossesKilled < SPECIAL_UNLOCK_KILLS;
  state.bossesKilled=Math.max(state.bossesKilled,SPECIAL_UNLOCK_KILLS);
  state.difficultyLevel=DIFFICULTY_TIERS.length-1;state.difficultyTimer=0;
  state.noMobs=false;state.spawnTimer=0;state.ascensionBannerTicks=360;
  if (firstUnlock) announceAscension(state);
}

export function godSpawnBoss(state: GameState, bossType: BossType) {
  state.encounterEffects = [];
  state.noBossSpawns=false; // Explicit manual spawn exits No Boss mode.
  clearThornHazards(state);
  state.enemies = state.enemies.filter(e => !isBossType(e.type) && e.type !== 'aegis_construct');
  state.seaSongWaves = [];
  state.seaSongBursts = [];
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
  initializeNewEncounter(state, state.enemies[state.enemies.length - 1]);
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
  if(kind === 'astral_twins') playCelestialSound('binary_reach');
  // Consume before resolving kills so a newly earned reward is never erased.
  state.specialSkill = null;
  state.playerCastTicks = 24; state.playerCastKind = kind;
  state.specialEffects.push({ kind, x: state.playerX, y: state.playerY, ticks: kind==='splitter_queen'?54:kind==='fiery_king'?48:36 });
  if(kind==='devourer'){
    const ticks=SPECIAL_SINGULARITY_TICKS;
    state.singularity={x:(Math.floor(state.playerX/TILE_SIZE)+.5)*TILE_SIZE,y:(Math.floor(state.playerY/TILE_SIZE)+.5)*TILE_SIZE,ticks,maxTicks:ticks,pullTimer:15,damageTimer:60};updateSingularitySound(state);return true;
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
    state.starEnergy=0;state.stellarPowerBonusTicks=0;state.poweredTicks=Math.max(state.poweredTicks,SPECIAL_PRAYER_DURATION+60*constellationBonus(state,'power'));
    state.laserCooldown=0;state.bulletCooldown=0;state.waveCooldown=0;
    state.bombCooldown=0;state.speedCooldown=0;
    grantInstantSpeedBoost(state, false);return true;
  }
  if (kind === 'astral_twins') {
    state.mirrorTwinTicks = SPECIAL_TWIN_DURATION;
    const twin = getMirrorTwinTile(state)!;
    state.specialEffects.push({ kind, x: (twin.tileX + .5) * TILE_SIZE, y: (twin.tileY + .5) * TILE_SIZE, ticks: 36 });
    return true;
  }
  if (kind === 'aegis_sentinel') {
    state.venusVeilTicks = SPECIAL_VENUS_DURATION;
    showRewardEffect(state, 'player', 'shield'); if (state.rubyTileX !== -1) showRewardEffect(state, 'ruby', 'shield');
    return true;
  }
  if (kind === 'frost_warden') {
    state.playerShieldHP = Math.max(state.playerShieldHP, SPECIAL_WARDEN_SHIELD);
    state.rubyShieldHP = Math.max(state.rubyShieldHP, SPECIAL_WARDEN_SHIELD);
    state.playerSaturnShield=true;state.rubySaturnShield=true;
    showRewardEffect(state, 'player', 'shield'); showRewardEffect(state, 'ruby', 'shield');
    return true;
  }
  hitSupernova(state, (x, y) => kind === 'fiery_king' || Math.hypot(x - state.playerX, y - state.playerY) <= SPECIAL_REAPER_RADIUS);
  const cfg = SPECIAL_SKILLS[kind];
  const targets = state.enemies.filter(e => e.hp > 0 &&
    (kind === 'fiery_king' || Math.hypot(e.x - state.playerX, e.y - state.playerY) <= SPECIAL_REAPER_RADIUS));
  // Snapshot the cast's victims: splits/decoy cleanup cannot make it hit anyone twice.
  for (const target of targets) {
    damageEnemy(state, target, isBossType(target.type) ? target.maxHp * cfg.bossDamage : cfg.normalDamage, 'special');
  }
  if (kind === 'fiery_king') {
    // Resolve Solar's bomber cascades too, including victims processed earlier in the snapshot.
    let index: number;
    while ((index = state.enemies.findIndex(enemy => enemy.hp <= 0)) >= 0) killEnemy(state, index, false, true);
  } else {
    for (const target of targets) {
      const index = state.enemies.indexOf(target);
      if (index >= 0 && target.hp <= 0) killEnemy(state, index);
    }
  }

  const shakeActive=state.screenShakeTicks>0;
  state.screenShakeTicks = Math.max(state.screenShakeTicks, kind==='fiery_king'?14:18);
  state.screenShakeAmt = Math.max(shakeActive?state.screenShakeAmt:0, kind==='fiery_king'?6:8);
  return true;
}

function fireBulletFrom(state: GameState, tileX: number, tileY: number, x: number, y: number, powered: boolean, mirror: boolean) {
  // Find nearest enemy within bullet range
  const maxRange = powered ? LASER_RANGE_PWR : LASER_RANGE;
  let bestDist = maxRange + 3.5; // +3.5 because we added 3.5 to the actual range in the check
  let targetE = null;
  for (const e of state.enemies) {
    if (isSeaChanterDiving(e) || e.twin?.downedTicks || e.type === 'fish_blue' || e.type === 'fish_red') continue;
    const dist = tileEuclidDist(e.tileX, e.tileY, tileX, tileY);
    if (dist < bestDist) {
      bestDist = dist;
      targetE = e;
    }
  }

  let dx = 0, dy = 0;
  if (targetE) {
    const rdx = targetE.tileX - tileX;
    const rdy = targetE.tileY - tileY;
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

  state.laserBullets.push({ x, y, dx, dy, powered, ticks: 0, mirror });
}

export function useBullet(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.bulletCooldown > 0) return;
  const powered = checkAndConsumePower(state);
  
  fireBulletFrom(state, state.playerTileX, state.playerTileY, state.playerX / TILE_SIZE, state.playerY / TILE_SIZE, powered, false);
  const twin = getMirrorTwinTile(state);
  if (twin) fireBulletFrom(state, twin.tileX, twin.tileY, twin.tileX + .5, twin.tileY + .5, powered, true);
  state.bulletCooldown = BULLET_COOLDOWN;
  playSFX_laserBullet();
}
