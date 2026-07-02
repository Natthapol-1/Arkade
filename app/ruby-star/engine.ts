import {
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  T_WALL, T_TELEPORT,
  PLAYER_START, CHAMBER_SPAWN_TILES, TELEPORT_PADS,
  chamberOfTile,
  PLAYER_MAX_HP, RUBY_MAX_HP, PLAYER_BASE_SPEED, PLAYER_CARRY_MULT, PLAYER_INVINCIBLE_TICKS,
  LASER_RANGE, LASER_RANGE_PWR, LASER_DMG, LASER_DMG_PWR, LASER_COOLDOWN,
  CHARGE_NEEDED, CHARGE_DECAY_TICKS,
  WAVE_RADIUS, WAVE_RADIUS_PWR, WAVE_DMG, WAVE_DMG_PWR,
  WAVE_PUSH_TILES, WAVE_PUSH_TILES_PWR, WAVE_COOLDOWN,
  SPEED_DURATION, SPEED_DURATION_PWR, SPEED_MULT, SPEED_COOLDOWN,
  BOMB_RADIUS, BOMB_RADIUS_PWR, BOMB_DMG, BOMB_DMG_PWR,
  BULLET_COOLDOWN, BULLET_DMG, BULLET_DMG_PWR, BULLET_SPEED,
  STAR_ENERGY_MAX, STAR_ENERGY_PER_KILL,
  RESOURCE_SPAWN_INTERVAL, RESOURCE_MAX_ON_MAP, HEAL_AMOUNT, ENERGY_AMOUNT,
  RUBY_HEAL_AMOUNT, RUBY_HEAL_COOLDOWN, RUBY_HEAL_RANGE, RUBY_HEAL_CLEAR_RANGE,
  METEORITE_CYCLE, METEORITE_WARNING, METEORITE_PLAYER_DMG, METEORITE_RUBY_DMG,
  SNIPER_ATTACK_RANGE, SNIPER_WINDUP_TICKS, SNIPER_CHAIN_RANGE, SNIPER_CHAIN_DMG,
  HEALER_HEAL_RADIUS, HEALER_HEAL_AMOUNT, HEALER_HEAL_INTERVAL,
  CHARGER_CHARGE_SPEED, CHARGER_SIGHT_RANGE, CHARGER_STUN_TICKS,
  SHIELDER_SHIELD_RANGE,
  BOSS_SPAWN_INTERVAL, BOSS_WARNING_TICKS, BOSS_METEOR_DMG, BOSS_ATTACK_RANGE,
  QUEEN_PHASE_INTERVAL, QUEEN_ATTACK_RANGE, QUEEN_WINDUP_TICKS,
  DIFFICULTY_RAMP_TICKS, DIFFICULTY_TIERS,
  ENEMY_CONFIGS, EnemyType,
  generateMap,
} from './constants';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  // shielder specific
  shieldTargetId: number; // ID of ally being shielded; -1 = none
  // splitter_queen specific — countdown to her next phase-jump; unused for queen_echo (echoes are permanent)
  phaseTimer: number;
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

export interface DeathParticle {
  x: number; y: number;
  vx: number; vy: number;
  ticks: number;
  maxTicks: number;
  size: number;
  color: string;
}

export type GamePhase = 'playing' | 'teleporting' | 'lost';

export interface GameState {
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
  playerHP: number;
  playerInvincibleTicks: number;
  playerCarryingRuby: boolean;

  // Ruby
  rubyHP: number;
  rubyTileX: number;  // -1 when carried
  rubyTileY: number;

  // Abilities
  laserCooldown: number;
  waveCooldown: number;
  speedCooldown: number;
  chargeCount: number;
  chargeDecayTimer: number; // ticks since last charge press
  speedActiveTicks: number; // remaining ticks of speed boost
  speedFlashTicks: number; // burst glow ticks on initial cast
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
  meteoriteTimer: number;   // countdown to next strike
  meteoriteWarning: number; // -1 = no warning; 0-3 = chamber index
  meteoriteStrikeIn: number; // ticks remaining in warning phase

  // FX
  laserBeams: LaserBeam[];
  laserBullets: LaserBullet[];
  waveEffects: WaveEffect[];
  bombBlasts: BombBlast[];
  lightningArcs: LightningArc[];
  deathParticles: DeathParticle[];

  // Teleport
  playerChamber: number;   // -1 if in hallway
  teleportDestOptions: number[]; // which chambers can be jumped to
  teleportCooldown: number; // ticks after teleport/cancel before pad can re-trigger

  // Screen shake
  screenShakeTicks: number;
  screenShakeAmt: number;

  // Ruby Core healing
  rubyHealCooldown: number;

  // God mode
  godMode: boolean;

  // Sniper kill buff — electric chain on player attacks
  electricBuffTicks: number;

  // Boss spawn system
  bossTimer: number;        // countdown to next boss spawn
  bossWarningTicks: number; // >0 while boss is about to spawn (shows warning)
  bossesKilled: number;     // tracks how many bosses have been killed (each +15 HP)

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

export function playSFX_laser() {
  try {
    const a = new Audio('/sounds/laserBeam.mp3'); a.volume = 0.29; a.play().catch(() => {});
  } catch { }
}

export function playSFX_laserBullet() {
  try {
    const a = new Audio('/sounds/laserBullet.mp3'); a.volume = 0.22; a.play().catch(() => {});
  } catch { }
}

export function playSFX_wave() {
  try {
    const a = new Audio('/sounds/chargeWave.mp3'); a.volume = 0.64; a.play().catch(() => {});
    const a2 = new Audio('/sounds/chargeWave.mp3'); a2.volume = 0.64; a2.play().catch(() => {});
  } catch { }
}

export function playSFX_alienHit() {
  try {
    const a = new Audio('/sounds/alienGetDamaged.wav'); a.volume = 0.35; a.play().catch(() => {});
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
    const a = new Audio('/sounds/alienShootLaser.wav'); a.volume = 0.29; a.play().catch(() => {});
  } catch { }
}

function playSFX_queenAttack() {
  try {
    const a = new Audio('/sounds/bossQueenAttack1.mp3'); a.volume = 0.85; a.play().catch(() => {});
    const b = new Audio('/sounds/gameModeClick.mp3'); b.volume = 0.8; b.play().catch(() => {});
  } catch { }
}

function playSFX_bossLaser() {
  try {
    for (let i = 0; i < 3; i++) {
      const a = new Audio('/sounds/chargeWave.mp3'); a.volume = 0.95; a.play().catch(() => {});
    }
    const b = new Audio('/sounds/laserBeam.mp3'); b.volume = 0.5; b.play().catch(() => {});
  } catch { }
}

export function playSFX_bomb() {
  try {
    const a = new Audio('/sounds/bombExplode.wav'); a.volume = 0.64; a.play().catch(() => {});
  } catch { }
}

export function playSFX_hit() {
  try {
    const a = new Audio('/sounds/hitHurt.wav'); a.volume = 0.22; a.play().catch(() => {});
  } catch { }
}

export function playSFX_pickup() {
  try {
    // Play multiple times simultaneously to stack volume beyond 1.0
    for (let i = 0; i < 4; i++) {
      const a = new Audio('/sounds/gameModeClick.mp3'); a.volume = 0.64; a.play().catch(() => {});
    }
  } catch { }
}

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

export function playSFX_charge() { playTone(440 + 110 * Math.random(), 0.06, 0.115, 'square'); }

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
    playTone(330, 0.06, 0.13, 'sine');
    setTimeout(() => playTone(495, 0.06, 0.13, 'sine'), 70);
    setTimeout(() => playTone(660, 0.12, 0.13, 'sine'), 140);
  } catch { }
}

function playSFX_queenTeleport() {
  try {
    const a = new Audio('/sounds/ghostHunt2.mp3'); a.volume = 0.5; a.play().catch(() => {});
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
  const map = generateMap();
  const [px, py] = PLAYER_START;
  return {
    map,
    gameTick: 0,
    gamePhase: 'playing',
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
    playerHP: PLAYER_MAX_HP,
    playerInvincibleTicks: 0,
    playerCarryingRuby: true,

    rubyHP: RUBY_MAX_HP,
    rubyTileX: -1,
    rubyTileY: -1,

    laserCooldown: 0,
    waveCooldown: 0,
    speedCooldown: 0,
    chargeCount: 0,
    chargeDecayTimer: 0,
    speedActiveTicks: 0,
    speedFlashTicks: 0,
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

    meteoriteTimer: METEORITE_CYCLE,
    meteoriteWarning: -1,
    meteoriteStrikeIn: 0,

    laserBeams: [],
    laserBullets: [],
    waveEffects: [],
    bombBlasts: [],
    lightningArcs: [],
    deathParticles: [],

    playerChamber: 0,
    teleportDestOptions: [],
    teleportCooldown: 0,

    screenShakeTicks: 0,
    screenShakeAmt: 0,

    rubyHealCooldown: 0,

    godMode: false,

    electricBuffTicks: 0,

    bossTimer: BOSS_SPAWN_INTERVAL,
    bossWarningTicks: 0,
    bossesKilled: 0,
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

function damagePlayer(state: GameState, amount: number) {
  if (state.godMode || state.playerInvincibleTicks > 0) return;
  state.playerHP = Math.max(0, state.playerHP - amount);
  state.playerInvincibleTicks = PLAYER_INVINCIBLE_TICKS;
  playSFX_hit();
  if (state.playerHP <= 0) endGame(state);
}

function damageRuby(state: GameState, amount: number) {
  if (state.godMode) return;
  if (state.rubyTileX === -1) return; // carried — ruby not vulnerable
  state.rubyHP = Math.max(0, state.rubyHP - amount);
  playSFX_rubyHit();
  if (state.rubyHP <= 0) endGame(state);
}

function damageEnemy(state: GameState, e: Enemy, amount: number) {
  const shielded = state.enemies.some(s => s.type === 'shielder' && s.shieldTargetId === e.id);
  const actual = shielded ? Math.max(1, Math.ceil(amount / 2)) : amount;
  e.hp -= actual;
  e.flashTicks = 10;
}

// Called after a player attack hits `hitEnemy` — if electric buff is active,
// chain lightning to up to 2 nearby enemies.
function chainElectric(state: GameState, hitEnemy: Enemy) {
  if (state.electricBuffTicks <= 0) return;
  const targets = state.enemies
    .filter(a => a !== hitEnemy && tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, a.tileX, a.tileY) <= SNIPER_CHAIN_RANGE)
    .sort((a, b) => tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, a.tileX, a.tileY) - tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, b.tileX, b.tileY))
    .slice(0, 2);
  for (const t of targets) {
    state.lightningArcs.push({ fromX: hitEnemy.x, fromY: hitEnemy.y, toX: t.x, toY: t.y, ticks: 22 });
    damageEnemy(state, t, SNIPER_CHAIN_DMG);
  }
}

function endGame(state: GameState) {
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
    const hpScaled = Math.ceil(cfg.maxHp * tier.hpMult);

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
  playSFX_alienShoot();
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
  playSFX_queenTeleport();
}

// ─── Enemy update ────────────────────────────────────────────────────────────

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
      if (e.type === 'charger') { e.chargeDirX = 0; e.chargeDirY = 0; }
      e.pushTiles = Math.max(0, e.pushTiles - 1);
      continue;
    }

    // ── Boss special logic ───────────────────────────────────────────────
    if (e.type === 'boss') {
      // Boss is immune to push
      e.pushTiles = 0;
      if (e.attackTimer > 0) e.attackTimer--;

      // Boss always targets the player, no matter which chamber
      const bTgtTX = state.playerTileX;
      const bTgtTY = state.playerTileY;
      const bDist  = tileEuclidDist(e.tileX, e.tileY, bTgtTX, bTgtTY);

      // Attack if within range
      if (e.attackTimer === 0 && bDist <= BOSS_ATTACK_RANGE) {
        playSFX_bossLaser();
        damagePlayer(state, ENEMY_CONFIGS.boss.damageToPlayer);
        e.attackTimer = ENEMY_CONFIGS.boss.attackCooldown;
        e.shootTicks = 22;
        state.laserBeams.push({
          fromX: e.x, fromY: e.y,
          dirX: 0, dirY: 0,
          endX: state.playerX, endY: state.playerY,
          ticks: 22,
          color: '#cc0022'
        });
        spawnFireBurst(state, state.playerX, state.playerY);
      }

      // BFS toward player — recalculate frequently so boss tracks across chambers
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        e.path = bfs(state.map, e.targetTileX, e.targetTileY, bTgtTX, bTgtTY);
        e.pathTimer = 8;
      }
      const bCfg = ENEMY_CONFIGS.boss;
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
      } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
        e.stepProgress += bCfg.speed;
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

    // ── Splitter Queen special logic ──────────────────────────────────────
    if (e.type === 'splitter_queen') {
      e.pushTiles = 0; // immune to knockback, like the boss

      const qChamber = chamberOfTile(e.tileX, e.tileY);
      const hasPlacedRubyQ = state.rubyTileX !== -1;
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
          e.stepProgress += sCfg.speed;
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
          e.stepProgress += hCfg.speed;
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
      // Stunned after hitting wall or player
      if (e.windupTicks > 0) { e.windupTicks--; continue; }

      // Currently charging
      if (e.chargeDirX !== 0 || e.chargeDirY !== 0) {
        if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
          const nx = e.tileX + e.chargeDirX;
          const ny = e.tileY + e.chargeDirY;
          const hitWall   = !isFloorTile(state.map, nx, ny);
          const hitPlayer = nx === state.playerTileX && ny === state.playerTileY;
          const hasRubyC  = state.rubyTileX !== -1;
          const hitRuby   = hasRubyC && nx === state.rubyTileX && ny === state.rubyTileY;
          if (hitWall || hitPlayer || hitRuby) {
            if (hitPlayer) { playSFX_enemyAttack(); damagePlayer(state, cCfg.damageToPlayer); e.attackTimer = cCfg.attackCooldown; e.shootTicks = 14; }
            if (hitRuby && !hitPlayer) { playSFX_enemyAttack(); damageRuby(state, cCfg.damageToRuby); e.attackTimer = cCfg.attackCooldown; e.shootTicks = 14; }
            e.chargeDirX = 0; e.chargeDirY = 0;
            e.windupTicks = hitWall ? CHARGER_STUN_TICKS : Math.floor(CHARGER_STUN_TICKS / 2);
          } else {
            e.targetTileX = nx; e.targetTileY = ny; e.stepProgress = 0;
          }
        } else {
          e.stepProgress += CHARGER_CHARGE_SPEED;
          const cdx = e.targetTileX - e.tileX, cdy = e.targetTileY - e.tileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + cdx * Math.min(e.stepProgress, TILE_SIZE);
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + cdy * Math.min(e.stepProgress, TILE_SIZE);
          if (e.stepProgress >= TILE_SIZE) {
            e.tileX = e.targetTileX; e.tileY = e.targetTileY;
            e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
            e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
            e.stepProgress = 0;
          }
        }
        continue;
      }

      // Idle — watch for player LoS and charge
      if (e.attackTimer > 0) e.attackTimer--;
      const cDist = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const cLoS  = hasLineOfSight(state.map, e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      if (e.attackTimer === 0 && cDist <= CHARGER_SIGHT_RANGE && cLoS) {
        const ddx = state.playerTileX - e.tileX, ddy = state.playerTileY - e.tileY;
        if (Math.abs(ddx) >= Math.abs(ddy)) { e.chargeDirX = ddx > 0 ? 1 : -1; e.chargeDirY = 0; }
        else { e.chargeDirX = 0; e.chargeDirY = ddy > 0 ? 1 : -1; }
      } else {
        e.pathTimer--;
        if (e.pathTimer <= 0) { e.path = bfs(state.map, e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY); e.pathTimer = 35 + Math.floor(Math.random() * 20); }
        if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
          const [ntx, nty] = e.path.shift()!;
          if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
        } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
          e.stepProgress += cCfg.speed;
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
        e.stepProgress += gCfg.speed;
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
          e.stepProgress += sCfg.speed;
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
          e.stepProgress += sCfg.speed;
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
    if (playerCarrying || !hasPlacedRuby) {
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
      e.stepProgress += speed;
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
      damageEnemy(state, other, 2);
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

function killEnemy(state: GameState, idx: number, fromMeteor = false) {
  const e = state.enemies[idx];
  spawnDeathParticles(state, e);

  // Echoes never grant score/energy/kill-effects — only the real Queen dying counts.
  const skipRewards = fromMeteor || e.type === 'queen_echo';
  if (!skipRewards) {
    state.killScore += ENEMY_CONFIGS[e.type].scoreValue;
    const wasMax = state.starEnergy >= STAR_ENERGY_MAX;
    const energyGain = STAR_ENERGY_PER_KILL + (e.type === 'armored' ? 8 : 0);
    state.starEnergy = Math.min(STAR_ENERGY_MAX, state.starEnergy + energyGain);
    if (!wasMax && state.starEnergy >= STAR_ENERGY_MAX) playSFX_powerUp();

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
        if (tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY) <= RANGE * 0.75) damageEnemy(state, ally, 20);
      }
    } else if (e.type === 'healer') {
      state.playerHP = Math.min(PLAYER_MAX_HP, state.playerHP + 24); // was 20, +20%
      try { const a = new Audio('/sounds/grow.wav'); a.volume = 0.38; a.play().catch(() => {}); } catch {}
    } else if (e.type === 'charger') {
      state.speedActiveTicks = Math.max(state.speedActiveTicks, 120);
      state.speedFlashTicks = 15;
      playSFX_speed();
    } else if (e.type === 'ghost') {
      if (state.rubyTileX !== -1) state.rubyHP = Math.min(RUBY_MAX_HP, state.rubyHP + 15);
      playSFX_teleport();
    } else if (e.type === 'shielder') {
      state.playerInvincibleTicks = Math.max(state.playerInvincibleTicks, 150); // ~2.5s shield
      playSFX_rubyToggle();
    } else if (e.type === 'sniper') {
      // Grant player electric chain buff for ~5s (300 ticks)
      state.electricBuffTicks = Math.max(state.electricBuffTicks, 300);
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
          hp: miniCfg.maxHp, maxHp: miniCfg.maxHp,
          path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
          pushDirX: 0, pushDirY: 0, pushTiles: 0,
          flashTicks: 0, healFlashTicks: 0, shootTicks: 0, exploding: false, explodeTick: 0,
          windupTicks: 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1, phaseTimer: 0,
        });
      }
    }
  }

  // Boss-tier full-restore reward — applies no matter how the kill happened (including a
  // meteor strike finishing it off), unlike the score/energy rewards above which meteor kills skip.
  if (e.type === 'boss' || e.type === 'splitter_queen') {
    state.bossesKilled++;
    state.playerHP = PLAYER_MAX_HP;
    state.rubyHP   = RUBY_MAX_HP;
    state.starEnergy = STAR_ENERGY_MAX;
    playSFX_powerUp();
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
  }

  // Re-locate by reference — the echo cleanup above may have shifted this enemy's index
  const finalIdx = state.enemies.indexOf(e);
  if (finalIdx !== -1) state.enemies.splice(finalIdx, 1);

  if (e.type === 'boss' || e.type === 'splitter_queen') playSFX_bossDeath();
  else if (e.type === 'queen_echo') playSFX_decoyDeath();
  else playSFX_alienDeath();
}

// ─── Player movement ──────────────────────────────────────────────────────────

function updatePlayer(state: GameState) {
  const speedMultiplier =
    state.speedActiveTicks > 0 ? SPEED_MULT :
    state.playerCarryingRuby ? PLAYER_CARRY_MULT : 1.0;
  const baseSpeed = PLAYER_BASE_SPEED * speedMultiplier;

  if (state.playerTileX === state.playerTargetX && state.playerTileY === state.playerTargetY) {

    // Try to apply queued direction
    const { playerQueuedDirX: qdx, playerQueuedDirY: qdy } = state;
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
    }
  }

  // Update which chamber the player is in
  state.playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);

  // Collect resources
  for (let i = state.resources.length - 1; i >= 0; i--) {
    const r = state.resources[i];
    if (r.tileX === state.playerTileX && r.tileY === state.playerTileY) {
      if (r.type === 'health') {
        state.playerHP = Math.min(PLAYER_MAX_HP, state.playerHP + HEAL_AMOUNT);
        state.resources.splice(i, 1);
        playSFX_healPickup();
      } else {
        const wasMax = state.starEnergy >= STAR_ENERGY_MAX;
        state.starEnergy = Math.min(STAR_ENERGY_MAX, state.starEnergy + ENERGY_AMOUNT);
        if (!wasMax && state.starEnergy >= STAR_ENERGY_MAX) {
          playSFX_powerUp();
        }
        grantInstantSpeedBoost(state);
        state.resources.splice(i, 1);
        playSFX_pickup();
      }
    }
  }
}

// ─── Meteorite ───────────────────────────────────────────────────────────────

function updateMeteorite(state: GameState) {
  if (state.meteoriteWarning >= 0) {
    state.meteoriteStrikeIn--;
    if (state.meteoriteStrikeIn === 150) {
      playSFX_meteorFalling();
    }
    if (state.meteoriteStrikeIn <= 0) {
      // STRIKE
      const ch = state.meteoriteWarning;
      playSFX_meteorite();
      // Kill all enemies in that chamber (boss only takes heavy damage)
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        if (chamberOfTile(e.tileX, e.tileY) === ch) {
          if (e.type === 'boss' || e.type === 'splitter_queen') {
            damageEnemy(state, e, BOSS_METEOR_DMG);
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
      // Pick a random chamber to strike
      state.meteoriteWarning = Math.floor(Math.random() * 4);
      state.meteoriteStrikeIn = METEORITE_WARNING;
    }
  }
}

// ─── Abilities ───────────────────────────────────────────────────────────────

// Grants a free speed burst that ignores/doesn't touch the SPEED ability's own cooldown —
// used as a passive bonus (energy pickups, entering the powered-up state), not a manual cast.
function grantInstantSpeedBoost(state: GameState) {
  state.speedActiveTicks = Math.max(state.speedActiveTicks, SPEED_DURATION);
  state.speedFlashTicks = 30;
  playSFX_speed();
}

function checkAndConsumePower(state: GameState): boolean {
  if (state.poweredTicks > 0) return true;
  if (state.starEnergy >= STAR_ENERGY_MAX) {
    state.starEnergy = 0;
    state.poweredTicks = 120;
    grantInstantSpeedBoost(state);
    return true;
  }
  return false;
}

export function useLaser(state: GameState) {
  if (state.laserCooldown > 0) return;
  const powered = checkAndConsumePower(state);
  const range = powered ? LASER_RANGE_PWR : LASER_RANGE;
  const dmg = powered ? LASER_DMG_PWR : LASER_DMG;

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
  state.laserCooldown = LASER_COOLDOWN;
  playSFX_laser();
  if (laserHit) playSFX_alienHit();
}

export function pressCharge(state: GameState) {
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
  if (state.waveCooldown > 0) return;
  fireWave(state);
}

function fireWave(state: GameState) {
  const powered = checkAndConsumePower(state);
  const radius = powered ? WAVE_RADIUS_PWR : WAVE_RADIUS;
  const dmg = powered ? WAVE_DMG_PWR : WAVE_DMG;
  const push = powered ? WAVE_PUSH_TILES_PWR : WAVE_PUSH_TILES;

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
  state.waveCooldown = WAVE_COOLDOWN;
  playSFX_wave();
  if (waveHit) playSFX_alienHit();
}

export function useSpeedBoost(state: GameState) {
  if (state.speedCooldown > 0) return;
  const powered = checkAndConsumePower(state);
  const dur = powered ? SPEED_DURATION_PWR : SPEED_DURATION;
  state.speedActiveTicks = dur;
  state.speedFlashTicks = 30;
  state.speedCooldown = SPEED_COOLDOWN;
  playSFX_speed();
}

export function useBomb(state: GameState) {
  if (state.bomb === null) {
    if (state.bombCooldown > 0) return; // still on cooldown from last explosion
    const powered = checkAndConsumePower(state);
    state.bomb = { tileX: state.playerTileX, tileY: state.playerTileY, powered };
    useSpeedBoost(state); // Automatically try to use speed boost to escape
  } else {
    // Detonate
    const powered = state.bomb.powered;
    const radius = powered ? BOMB_RADIUS_PWR : BOMB_RADIUS;
    const dmg = powered ? BOMB_DMG_PWR : BOMB_DMG;

    const bx = state.bomb.tileX, by = state.bomb.tileY;
    playSFX_bomb();
    state.bombBlasts.push({
      cx: bx * TILE_SIZE + TILE_SIZE / 2,
      cy: by * TILE_SIZE + TILE_SIZE / 2,
      radius: 0, maxRadius: radius * TILE_SIZE, ticks: 28,
    });

    let bombHit = false;
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      if (tileEuclidDist(e.tileX, e.tileY, bx, by) <= radius) {
        damageEnemy(state, e, dmg); bombHit = true;
        chainElectric(state, e);
        if (e.hp <= 0) killEnemy(state, i);
      }
    }
    if (bombHit) playSFX_alienHit();
    // Damage player if in blast radius (own bomb hurts you)
    if (tileEuclidDist(state.playerTileX, state.playerTileY, bx, by) <= radius) {
      damagePlayer(state, Math.floor(dmg * 0.35));
    }
    state.bomb = null;
    state.bombCooldown = 300;
    state.screenShakeTicks = 22;
    state.screenShakeAmt = powered ? 18 : 12;
  }
}

export function toggleCarryRuby(state: GameState) {
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
  state.playerChamber = chamberIdx;
  state.gamePhase = 'playing';
  state.teleportDestOptions = [];
  state.teleportCooldown = 90;
  playSFX_teleport();
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
  if (state.playerCarryingRuby || state.rubyTileX === -1) return false;
  if (state.rubyHP >= RUBY_MAX_HP && state.playerHP >= PLAYER_MAX_HP) return false;
  const dist = Math.max(
    Math.abs(state.playerTileX - state.rubyTileX),
    Math.abs(state.playerTileY - state.rubyTileY),
  );
  if (dist > RUBY_HEAL_RANGE) return false;
  for (const e of state.enemies) {
    if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= RUBY_HEAL_CLEAR_RANGE) return false;
  }
  return true;
}

export function healRuby(state: GameState): boolean {
  if (!canHealRuby(state)) return false;
  if (state.rubyHealCooldown > 0) return false;
  if (state.rubyHP < RUBY_MAX_HP) state.rubyHP = Math.min(RUBY_MAX_HP, state.rubyHP + RUBY_HEAL_AMOUNT);
  state.playerHP = Math.min(PLAYER_MAX_HP, state.playerHP + 2);
  state.rubyHealCooldown = RUBY_HEAL_COOLDOWN;
  state.healJiggleTicks = 18;
  try { const a = new Audio('/sounds/deghost.wav'); a.volume = 0.32; a.play().catch(() => {}); } catch {}
  return true;
}

export function cancelTeleport(state: GameState) {
  state.gamePhase = 'playing';
  state.teleportDestOptions = [];
  state.teleportCooldown = 90;
}

// ─── Main tick ───────────────────────────────────────────────────────────────

export function tick(state: GameState) {
  if (state.gamePhase === 'lost') return;
  if (state.gamePhase === 'teleporting') return; // game paused

  state.gameTick++;

  // Score (time in seconds × 10)
  state.score += 1 / 60;

  // Difficulty ramp
  state.difficultyTimer++;
  if (state.difficultyTimer >= DIFFICULTY_RAMP_TICKS) {
    state.difficultyTimer = 0;
    state.difficultyLevel = Math.min(state.difficultyLevel + 1, DIFFICULTY_TIERS.length - 1);
  }

  // Cooldown tickers
  if (state.laserCooldown > 0) state.laserCooldown--;
  if (state.bulletCooldown > 0) state.bulletCooldown--;
  if (state.waveCooldown > 0) state.waveCooldown--;
  if (state.speedCooldown > 0) state.speedCooldown--;
  if (state.bombCooldown > 0) state.bombCooldown--;
  if (state.speedActiveTicks > 0) state.speedActiveTicks--;
  if (state.speedFlashTicks > 0) state.speedFlashTicks--;
  if (state.playerInvincibleTicks > 0) state.playerInvincibleTicks--;
  if (state.teleportCooldown > 0) state.teleportCooldown--;
  if (state.poweredTicks > 0) state.poweredTicks--;
  if (state.screenShakeTicks > 0) state.screenShakeTicks--;
  if (state.rubyHealCooldown > 0) state.rubyHealCooldown--;
  if (state.electricBuffTicks > 0) state.electricBuffTicks--;
  if (state.healJiggleTicks > 0) state.healJiggleTicks--;

  // Boss spawn countdown (only after difficulty level 4+)
  if (state.difficultyLevel >= 1) {
    if (state.bossWarningTicks > 0) {
      state.bossWarningTicks--;
      if (state.bossWarningTicks === 0) {
        // Spawn one random boss-tier enemy at a spawn tile far from player.
        // "hasBoss" covers both boss types — only one boss-tier enemy may exist at a time.
        const hasBoss = state.enemies.some(e => e.type === 'boss' || e.type === 'splitter_queen');
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
            const bossType: EnemyType = Math.random() < 0.5 ? 'boss' : 'splitter_queen';
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
              windupTicks: 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1,
              phaseTimer: bossType === 'splitter_queen' ? QUEEN_PHASE_INTERVAL : 0,
            });
          }
        }
        state.bossTimer = BOSS_SPAWN_INTERVAL;
      }
    } else {
      state.bossTimer--;
      if (state.bossTimer <= 0) {
        const hasBoss = state.enemies.some(e => e.type === 'boss' || e.type === 'splitter_queen');
        if (!hasBoss) state.bossWarningTicks = BOSS_WARNING_TICKS;
        else state.bossTimer = BOSS_SPAWN_INTERVAL; // already has a boss, delay
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

  // Player movement + resource pickup
  updatePlayer(state);

  // Enemy spawning
  state.spawnTimer++;
  const tier = DIFFICULTY_TIERS[Math.min(state.difficultyLevel, DIFFICULTY_TIERS.length - 1)];
  if (state.spawnTimer >= tier.spawnInterval) {
    state.spawnTimer = 0;
    spawnEnemy(state);
  }

  // Enemy AI + attacks
  updateEnemies(state);

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
    const dmg = b.powered ? BULLET_DMG_PWR : BULLET_DMG;
    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
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
  state.laserBeams = state.laserBeams.filter(b => { b.ticks--; return b.ticks > 0; });
  state.waveEffects = state.waveEffects.filter(w => { w.ticks--; w.radius = w.maxRadius * (1 - w.ticks / 30); return w.ticks > 0; });
  state.bombBlasts = state.bombBlasts.filter(b => { b.ticks--; b.radius = b.maxRadius * (1 - b.ticks / 28); return b.ticks > 0; });
  state.lightningArcs = state.lightningArcs.filter(a => { a.ticks--; return a.ticks > 0; });
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

export function useBullet(state: GameState) {
  if (state.bulletCooldown > 0) return;
  const powered = checkAndConsumePower(state);
  
  // Find nearest enemy within bullet range
  const maxRange = powered ? LASER_RANGE_PWR : LASER_RANGE;
  let bestDist = maxRange + 3.5; // +3.5 because we added 3.5 to the actual range in the check
  let targetE = null;
  for (const e of state.enemies) {
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
