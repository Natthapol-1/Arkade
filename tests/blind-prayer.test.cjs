const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

// Load the pure TypeScript engine without adding a test-runtime dependency.
require.extensions['.ts'] = (mod, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  });
  mod._compile(compiled.outputText, filename);
};
const engine = require('../app/ruby-star/engine.ts');
const constants = require('../app/ruby-star/constants.ts');

function fresh() {
  const state = engine.createInitialState();
  state.godMode = true;
  state.spawnTimer = -100000;
  state.resourceTimer = -100000;
  state.meteoriteTimer = 100000;
  return state;
}

function position(enemy, x, y) {
  enemy.tileX = enemy.targetTileX = x;
  enemy.tileY = enemy.targetTileY = y;
  enemy.x = x * constants.TILE_SIZE + constants.TILE_SIZE / 2;
  enemy.y = y * constants.TILE_SIZE + constants.TILE_SIZE / 2;
  enemy.path = [];
  enemy.stepProgress = 0;
}

function prayer(state) {
  engine.godSpawnBoss(state, 'blind_prayer');
  return state.enemies.find(e => e.type === 'blind_prayer');
}

test('reverses all four raw movement directions exactly once', () => {
  for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const state = fresh();
    prayer(state);
    state.playerQueuedDirX = x;
    state.playerQueuedDirY = y;
    engine.tick(state);
    assert.equal(state.playerTargetX, 10 - x);
    assert.equal(state.playerTargetY, 10 - y);
    assert.equal(state.playerQueuedDirX, x);
    assert.equal(state.playerQueuedDirY, y);
  }
});

test('reversal respects walls, pauses, and leaves in-flight steps intact', () => {
  const state = fresh();
  prayer(state);
  state.playerQueuedDirX = 1;
  state.map[10][9] = constants.T_WALL;
  engine.tick(state);
  assert.equal(state.playerTargetX, 10);
  state.map[10][9] = constants.T_FLOOR;
  state.gamePhase = 'teleporting';
  engine.tick(state);
  assert.equal(state.playerTargetX, 10);
  state.gamePhase = 'playing';
  state.playerTargetX = 11;
  engine.tick(state);
  assert.equal(state.playerTargetX, 11);
  assert.ok(state.playerX > 10 * constants.TILE_SIZE + constants.TILE_SIZE / 2);
});

test('death lifts the curse and starts the normal 42-second boss delay', () => {
  const state = fresh();
  const boss = prayer(state);
  position(boss, state.playerTileX, state.playerTileY);
  boss.hp = 1;
  engine.useBomb(state);
  engine.useBomb(state);
  assert.equal(engine.isMovementReversed(state), false);
  assert.equal(state.bossesKilled, 1);
  assert.equal(state.bossTimer + constants.BOSS_WARNING_TICKS, 42 * 60);
  state.playerQueuedDirX = 1;
  engine.tick(state);
  assert.equal(state.playerTargetX, 11);
});

test('debug replacement and restart remove reversal without stale debuffs', () => {
  const state = fresh();
  prayer(state);
  engine.godSpawnBoss(state, 'fiery_king');
  assert.equal(engine.isMovementReversed(state), false);
  assert.equal(state.enemies.filter(e => constants.isBossType(e.type)).length, 1);
  assert.equal(engine.isMovementReversed(engine.createInitialState()), false);
});

test('natural spawn includes Prayer, scales HP, announces its name/color, and remains exclusive', () => {
  const state = fresh();
  state.difficultyLevel = 1;
  state.bossesKilled = 2;
  state.bossWarningTicks = 1;
  const random = Math.random;
  Math.random = () => (constants.BOSS_TYPES.indexOf('blind_prayer') + 0.5) / constants.BOSS_TYPES.length;
  try { engine.tick(state); } finally { Math.random = random; }
  const boss = state.enemies.find(e => e.type === 'blind_prayer');
  assert.ok(boss);
  assert.equal(boss.hp, 110);
  assert.equal(state.bossSpawnName, 'BLIND PRAYER');
  assert.equal(state.bossSpawnColor, '#ffdd22');
  const timer = state.bossTimer;
  for (let i = 0; i < 3000; i++) engine.tick(state);
  assert.equal(state.bossTimer, timer);
  assert.equal(state.enemies.filter(e => constants.isBossType(e.type)).length, 1);
});

test('flees on walkable tiles and grants a grace period before attacking', () => {
  const state = fresh();
  const boss = prayer(state);
  position(boss, 11, 10);
  const initialDistance = Math.abs(boss.tileX - state.playerTileX) + Math.abs(boss.tileY - state.playerTileY);
  // Disable god mode so zero offense is verified rather than masked by immunity.
  state.godMode = false;
  state.playerCarryingRuby = false;
  state.rubyTileX = 10; state.rubyTileY = 10;
  for (let i = 0; i < 120; i++) {
    engine.tick(state);
    assert.notEqual(state.map[boss.tileY][boss.tileX], constants.T_WALL);
    assert.ok(Math.abs(boss.targetTileX - boss.tileX) + Math.abs(boss.targetTileY - boss.tileY) <= 1);
  }
  assert.ok(Math.abs(boss.tileX - 10) + Math.abs(boss.tileY - 10) > initialDistance);
  assert.equal(state.playerHP, constants.PLAYER_MAX_HP);
  assert.equal(state.rubyHP, constants.RUBY_MAX_HP);
});

test('Ruby ritual warns before teleporting a placed core to another chamber center', () => {
  const state = fresh();
  const boss = prayer(state);
  state.playerCarryingRuby = false;
  state.rubyTileX = 10; state.rubyTileY = 10;
  boss.prayer.rubyCooldown = 1;
  engine.tick(state);
  const destination = boss.prayer.rubyDestination;
  assert.notEqual(destination, 0);
  assert.equal(boss.prayer.rubyCastTicks, constants.PRAYER_RUBY_WINDUP);
  assert.deepEqual([state.rubyTileX, state.rubyTileY], [10, 10]);
  for (let i = 0; i < constants.PRAYER_RUBY_WINDUP - 1; i++) engine.tick(state);
  assert.deepEqual([state.rubyTileX, state.rubyTileY], [10, 10]);
  engine.tick(state);
  assert.deepEqual([state.rubyTileX, state.rubyTileY], constants.TELEPORT_PADS[destination]);
  assert.equal(state.rubyHP, constants.RUBY_MAX_HP);
  assert.ok(state.deathParticles.length >= 24);
});

test('carrying the core cancels the ritual and resets its cooldown', () => {
  const state = fresh();
  const boss = prayer(state);
  state.playerCarryingRuby = false;
  state.rubyTileX = 10; state.rubyTileY = 10;
  boss.prayer.rubyCooldown = 1;
  engine.tick(state);
  engine.toggleCarryRuby(state);
  engine.tick(state);
  assert.equal(state.rubyTileX, -1);
  assert.equal(boss.prayer.rubyCastTicks, 0);
  assert.equal(boss.prayer.rubyCooldown, constants.PRAYER_RUBY_COOLDOWN);
  engine.toggleCarryRuby(state);
  engine.tick(state);
  assert.equal(boss.prayer.rubyCastTicks, 0);
  assert.equal(boss.prayer.rubyCooldown, constants.PRAYER_RUBY_COOLDOWN - 1);
});

test('ritual avoids meteor warnings at selection and resolution', () => {
  const state = fresh();
  const boss = prayer(state);
  state.playerCarryingRuby = false;
  state.rubyTileX = 10; state.rubyTileY = 10;
  state.meteoriteWarning = 1; state.meteoriteStrikeIn = 300;
  boss.prayer.rubyCooldown = 1;
  engine.tick(state);
  assert.notEqual(boss.prayer.rubyDestination, 1);
  state.meteoriteWarning = boss.prayer.rubyDestination;
  boss.prayer.rubyCastTicks = 1;
  engine.tick(state);
  assert.deepEqual([state.rubyTileX, state.rubyTileY], [10, 10]);
  assert.equal(boss.prayer.rubyDestination, -1);
});

test('escape attack warns, deals 6 damage, boosts briefly, and obeys cooldown', () => {
  const state = fresh();
  const boss = prayer(state);
  position(boss, 11, 10);
  boss.pathTimer = 100000;
  boss.prayer.escapeCooldown = 1;
  state.godMode = false;
  engine.tick(state);
  assert.equal(boss.prayer.escapeWindupTicks, constants.PRAYER_ESCAPE_WINDUP);
  for (let i = 0; i < constants.PRAYER_ESCAPE_WINDUP - 1; i++) engine.tick(state);
  assert.equal(state.playerHP, 100);
  engine.tick(state);
  assert.equal(state.playerHP, 94);
  assert.equal(boss.prayer.escapeBoostTicks, constants.PRAYER_ESCAPE_DURATION);
  assert.equal(boss.prayer.escapeCooldown, 720);
  const speedBefore = boss.stepProgress;
  engine.tick(state);
  assert.equal(boss.stepProgress - speedBefore, constants.PRAYER_ESCAPE_SPEED);
  for (let i = 0; i < constants.PRAYER_ESCAPE_DURATION - 1; i++) engine.tick(state);
  assert.equal(boss.prayer.escapeBoostTicks, 0);
  assert.equal(state.playerHP, 94);
  assert.equal(boss.prayer.escapeCooldown, 720 - constants.PRAYER_ESCAPE_DURATION);
});

test('escape attack respects shields, walls, dodging, and teleport pause', () => {
  const state = fresh();
  const boss = prayer(state);
  position(boss, 11, 10);
  boss.pathTimer = 100000;
  boss.prayer.escapeWindupTicks = 1;
  state.godMode = false; state.playerShieldHP = 10;
  engine.tick(state);
  assert.equal(state.playerHP, 100);
  assert.equal(state.playerShieldHP, 4);
  position(boss, 12, 10);
  boss.pathTimer = 100000;
  boss.prayer.escapeCooldown = 0;
  state.map[10][11] = constants.T_WALL;
  engine.tick(state);
  assert.equal(boss.prayer.escapeWindupTicks, 0);
  boss.prayer.escapeWindupTicks = 1;
  engine.tick(state);
  assert.equal(state.playerShieldHP, 4);
  assert.equal(boss.prayer.escapeBoostTicks, constants.PRAYER_ESCAPE_DURATION);
  state.gamePhase = 'teleporting';
  const cooldown = boss.prayer.escapeCooldown;
  engine.tick(state);
  assert.equal(boss.prayer.escapeCooldown, cooldown);
});

test('escape attack reaches normal player wave range and emits a fading glyph wave', () => {
  assert.equal(constants.ENEMY_CONFIGS.blind_prayer.attackRange, constants.WAVE_RADIUS);
  const state = fresh();
  const boss = prayer(state);
  position(boss, 10 + constants.WAVE_RADIUS, 10);
  boss.pathTimer = 100000;
  boss.prayer.escapeCooldown = 1;
  state.godMode = false;
  engine.tick(state);
  assert.equal(boss.prayer.escapeWindupTicks, constants.PRAYER_ESCAPE_WINDUP);
  boss.prayer.escapeWindupTicks = 1;
  engine.tick(state);
  assert.equal(state.playerHP, 94);
  assert.equal(state.prayerWaves.length, 1);
  assert.equal(state.prayerWaves[0].radius, constants.WAVE_RADIUS * constants.TILE_SIZE);
  for (let i = 0; i < 30; i++) engine.tick(state);
  assert.equal(state.prayerWaves.length, 0);
  position(boss, 10 + constants.WAVE_RADIUS + 1, 10);
  boss.pathTimer = 100000;
  boss.prayer.escapeCooldown = 0;
  engine.tick(state);
  assert.equal(boss.prayer.escapeWindupTicks, 0);
});

test('both supplied holy sounds play at the increased volumes', () => {
  const played = [];
  const previousAudio = global.Audio;
  global.Audio = class {
    constructor(path) { this.path = path; }
    play() { played.push({ path: this.path, volume: this.volume }); return Promise.resolve(); }
  };
  try {
    const state = fresh();
    const boss = prayer(state);
    state.rubyTileX = 10; state.rubyTileY = 10; state.playerCarryingRuby = false;
    boss.prayer.rubyCooldown = 1;
    engine.tick(state);
    position(boss, 11, 10); boss.pathTimer = 100000;
    boss.prayer.escapeWindupTicks = 1;
    engine.tick(state);
    const ritual = played.find(sound => sound.path === '/sounds/holy1.mp3');
    const escape = played.find(sound => sound.path === '/sounds/holy2.mp3');
    assert.equal(ritual.volume, 1.0);
    assert.equal(escape.volume, 1.0);
  } finally { global.Audio = previousAudio; }
});

test('escape hit pushes one tile away without replacing held input', () => {
  const state = fresh();
  const boss = prayer(state);
  position(boss, 11, 10); boss.pathTimer = 100000;
  boss.prayer.escapeWindupTicks = 1;
  engine.tick(state);
  assert.equal(state.playerKnockback.dirX, -1);
  state.playerQueuedDirX = 1;
  for (let i = 0; i < 1 + constants.TILE_SIZE / constants.PRAYER_KNOCKBACK_SPEED; i++) engine.tick(state);
  assert.equal(state.playerTileX, 9);
  assert.equal(state.playerTileY, 10);
  assert.equal(state.playerKnockback, null);
  assert.equal(state.playerQueuedDirX, 1);
  engine.tick(state);
  assert.equal(state.playerTargetX, 8); // normal reversed controls resume
});

test('knockback stops at walls and finishes an existing step without snapping', () => {
  let state = fresh();
  let boss = prayer(state);
  position(boss, 11, 10); boss.pathTimer = 100000;
  boss.prayer.escapeWindupTicks = 1;
  state.map[10][9] = constants.T_WALL;
  engine.tick(state); engine.tick(state);
  assert.equal(state.playerTileX, 10);
  assert.equal(state.playerKnockback, null);
  state = fresh(); boss = prayer(state);
  position(boss, 11, 10); boss.pathTimer = 100000;
  boss.prayer.escapeWindupTicks = 1;
  state.playerTargetY = 11;
  state.map[11][10] = state.map[11][9] = constants.T_FLOOR;
  engine.tick(state);
  assert.equal(state.playerTargetY, 11);
  assert.equal(state.playerTargetX, 10);
  for (let i = 0; i < 100 && state.playerKnockback; i++) engine.tick(state);
  assert.equal(state.playerTileX, 9);
  assert.equal(state.playerTileY, 11);
  assert.equal(state.playerKnockback, null);
});

test('No Mobs clears regulars without rewards, preserves boss mechanics, and resumes spawning', () => {
  const state = fresh();
  const boss = prayer(state);
  const regular = { ...boss, id: state.nextEnemyId++, type: 'normal', prayer: undefined };
  const echo = { ...boss, id: state.nextEnemyId++, type: 'queen_echo', prayer: undefined };
  state.enemies.push(regular, echo);
  state.playerHP = 50;
  engine.godSetNoMobs(state, true);
  assert.equal(state.enemies.length, 2);
  assert.ok(state.enemies.includes(boss)); assert.ok(state.enemies.includes(echo));
  assert.equal(state.playerHP, 50); assert.equal(state.killScore, 0);
  for (let i = 0; i < 1200; i++) engine.tick(state);
  assert.equal(state.spawnTimer, 0);
  assert.ok(state.enemies.every(e => constants.isBossType(e.type) || e.type === 'queen_echo'));
  engine.godSetNoMobs(state, false);
  state.spawnTimer = constants.DIFFICULTY_TIERS[state.difficultyLevel].spawnInterval - 1;
  engine.tick(state);
  assert.ok(state.enemies.some(e => !constants.isBossType(e.type) && e.type !== 'queen_echo'));
});

test('meteor deals boss damage, can kill Prayer, and lifts the curse', () => {
  const state = fresh();
  const boss = prayer(state);
  position(boss, 2, 2);
  boss.pathTimer = 100000;
  state.meteoriteWarning = 0;
  state.meteoriteStrikeIn = 1;
  engine.tick(state);
  assert.equal(boss.hp, 20);
  assert.equal(engine.isMovementReversed(state), true);
  state.meteoriteWarning = 0;
  state.meteoriteStrikeIn = 1;
  engine.tick(state);
  assert.equal(engine.isMovementReversed(state), false);
  assert.equal(state.bossesKilled, 1);
  assert.equal(state.bossTimer, constants.BOSS_SPAWN_INTERVAL);
});

test('Prayer impact audio plays on connected and shielded hits, not a dodged burst',()=>{
 const oldAudio=global.Audio,played=[];
 global.Audio=class{constructor(src){this.src=src;}play(){played.push(this.src);return Promise.resolve();}pause(){}};
 try{
  for(const shield of [0,10]){
   const state=fresh(),boss=prayer(state);position(boss,11,10);boss.pathTimer=10000;boss.prayer.escapeWindupTicks=1;state.playerShieldHP=shield;
   const before=played.filter(x=>x==='/sounds/laserBeam.mp3').length;engine.tick(state);
   assert.equal(played.filter(x=>x==='/sounds/laserBeam.mp3').length,before+1);
  }
  const state=fresh(),boss=prayer(state);position(boss,30,30);boss.pathTimer=10000;boss.prayer.escapeWindupTicks=1;
  const before=played.filter(x=>x==='/sounds/laserBeam.mp3').length;engine.tick(state);
  assert.equal(played.filter(x=>x==='/sounds/laserBeam.mp3').length,before);
 }finally{global.Audio=oldAudio;}
});

test('Prayer flees only within the Weaver escape range and wanders otherwise', () => {
  const engine = require('../app/ruby-star/engine.ts'), c = require('../app/ruby-star/constants.ts');
  for (const [dx, fleeing] of [[10, true], [c.THORN_FLEE_RANGE + 6, false]]) {
    const s = engine.createInitialState(); s.noMobs = true; s.godMode = true; s.meteoriteTimer = 100000;
    s.map = s.map.map(row => row.map(() => c.T_FLOOR));
    engine.godSpawnBoss(s, 'blind_prayer'); const p = s.enemies.find(x => x.type === 'blind_prayer');
    Object.assign(p, { tileX: 5, tileY: 25, targetTileX: 5, targetTileY: 25, x: 5.5 * c.TILE_SIZE, y: 25.5 * c.TILE_SIZE, pathTimer: 1 });
    Object.assign(s, { playerTileX: 5 + dx, playerTileY: 25, playerTargetX: 5 + dx, playerTargetY: 25 });
    engine.tick(s); assert.equal(p.prayer.fleeing, fleeing);
  }
});
