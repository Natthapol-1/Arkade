const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => {
  let source = fs.readFileSync(f, 'utf8');
  if (f.endsWith('engine.ts')) source += '\nexport const encounterTest = { damageEnemy, killEnemy, updateBossEncounters };';
  m._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
};
const e = require('../app/ruby-star/engine.ts'), c = require('../app/ruby-star/constants.ts'), api = e.encounterTest;
function fresh(kind, stage = 0) {
  const s = e.createInitialState(); s.bossesKilled = stage; s.noMobs = true; s.godMode = true;
  s.meteoriteTimer = 100000; s.resourceTimer = -100000; s.ambientEvents.nextEventTicks = 100000;
  e.godSpawnBoss(s, kind); return s;
}
function position(enemy, x, y) {
  Object.assign(enemy, { tileX: x, targetTileX: x, tileY: y, targetTileY: y, x: (x + .5) * c.TILE_SIZE, y: (y + .5) * c.TILE_SIZE,
    path: [], pathTimer: 100000, attackTimer: 100000, stepProgress: 0, pushTiles: 0 });
}
function ticks(s, n) { for (let i = 0; i < n; i++) e.tick(s); }
function movePlayer(s, x, y) {
  Object.assign(s, { playerTileX: x, playerTileY: y, playerTargetX: x, playerTargetY: y,
    playerX: (x + .5) * c.TILE_SIZE, playerY: (y + .5) * c.TILE_SIZE, playerStepProgress: 0 });
}
function hit(s, enemy, amount, source = 'player') {
  api.damageEnemy(s, enemy, amount, source);
  if (enemy.hp <= 0) api.killEnemy(s, s.enemies.indexOf(enemy), source === 'meteor');
}
function close(a, b) { assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`); }
function freeze(s) { for (const enemy of s.enemies) position(enemy, enemy.tileX, enemy.tileY); }

test('Sentinel starts shielded with two stationary, scaled constructs in distinct floor chambers', () => {
  const s = fresh('aegis_sentinel', 4), boss = s.enemies[0], constructs = s.enemies.filter(x => x.constructOwnerId === boss.id);
  assert.equal(constructs.length, 2); assert.equal(boss.maxHp, 150);
  assert.equal(new Set(constructs.map(x => c.chamberOfTile(x.tileX, x.tileY))).size, 2);
  for (const construct of constructs) { assert.equal(s.map[construct.tileY][construct.tileX], c.T_FLOOR); assert.equal(construct.maxHp, 36); }
  e.godSetNoMobs(s, true); assert.equal(s.enemies.length, 3);
  const before = constructs.map(x => [x.x, x.y]); e.tick(s);
  assert.deepEqual(constructs.map(x => [x.x, x.y]), before);
});

test('Aegis reflects player-dealt damage at one hundred percent without a cap or cooldown', () => {
  const s = fresh('aegis_sentinel'), boss = s.enemies[0]; s.godMode = false;
  hit(s, boss, 20); close(boss.hp, 89); assert.equal(s.playerHP, 80);
  hit(s, boss, 20); close(boss.hp, 88); assert.equal(s.playerHP, 60);
  hit(s, boss, 8, 'special'); close(s.playerHP, 52);
  hit(s, boss, 20, 'meteor'); hit(s, boss, 20, 'enemy');
  close(s.playerHP, 52); close(boss.hp, 85.6);
  s.playerHP = 12;
  s.playerShieldHP = 100; hit(s, boss, 100); close(s.playerHP, 12); close(s.playerShieldHP, 0); close(boss.hp, 80.6);
});

test('reflection preserves fractional bullet damage, honors protection and stops when the core is exposed', () => {
  const s = fresh('aegis_sentinel'), boss = s.enemies[0]; s.godMode = false;
  hit(s, boss, c.BULLET_DMG); close(s.playerHP, 100 - c.BULLET_DMG);
  s.constellations.push('playerGuard'); hit(s, boss, c.LASER_DMG); close(s.playerHP, 100 - c.BULLET_DMG - c.LASER_DMG * .9);
  s.godMode = true; const before = s.playerHP; hit(s, boss, 10); close(s.playerHP, before);
  s.godMode = false; s.immortal = true; s.playerHP = 1; hit(s, boss, 10); assert.equal(s.playerHP, 1);
  s.immortal = false; s.playerHP = 100;
  for (const construct of s.enemies.slice(1)) hit(s, construct, 100);
  hit(s, boss, 20); assert.equal(s.playerHP, 100);
});

test('breaking both objectives exposes core immediately with no construct kill rewards', () => {
  const s = fresh('aegis_sentinel'), boss = s.enemies[0], constructs = s.enemies.slice(1);
  s.playerHP = 50; s.rubyHP = 45; s.starEnergy = 0;
  hit(s, constructs[0], 100); assert.equal(boss.aegis.shielded, true); assert.equal(boss.aegis.constructsLeft, 1);
  hit(s, constructs[1], 100); assert.equal(boss.aegis.shielded, false); assert.equal(boss.aegis.constructsLeft, 0);
  assert.equal(boss.aegis.exposedUntilTick, s.gameTick + 1200);
  assert.equal(s.playerHP, 50); assert.equal(s.rubyHP, 45); assert.equal(s.starEnergy, 0); assert.equal(s.killScore, 0); assert.equal(s.bossesKilled, 0);
  hit(s, boss, 20); assert.equal(boss.hp, 70);
});

test('exposure pauses in menus, lasts twenty seconds, then creates a fresh pair of constructs', () => {
  const s = fresh('aegis_sentinel'), boss = s.enemies[0]; freeze(s);
  const ids = s.enemies.slice(1).map(x => x.id); for (const target of s.enemies.slice(1)) hit(s, target, 100);
  s.gamePhase = 'teleporting'; ticks(s, 500); assert.equal(s.gameTick, 0);
  s.gamePhase = 'playing'; ticks(s, 1199 - c.AEGIS_RESHIELD_WARNING_TICKS); assert.equal(boss.aegis.reshieldTicks, 0);
  e.tick(s); assert.equal(boss.aegis.reshieldTicks, c.AEGIS_RESHIELD_WARNING_TICKS);
  ticks(s, c.AEGIS_RESHIELD_WARNING_TICKS - 1); assert.equal(boss.aegis.shielded, false); assert.equal(boss.aegis.reshieldTicks, 1);
  e.tick(s); assert.equal(boss.aegis.shielded, true); assert.equal(boss.aegis.reshieldTicks, 0);
  assert.equal(boss.aegis.constructsLeft, 2); assert.equal(boss.aegis.brokenOnce, true);
  assert.ok(s.enemies.slice(1).every(x => !ids.includes(x.id)));
});

test('Sentinel defeat cleans surviving constructs and grants exactly one normal boss reward', () => {
  const s = fresh('aegis_sentinel', 9), boss = s.enemies[0]; s.playerHP = 20; s.rubyHP = 30; s.starEnergy = 0;
  hit(s, boss, 5000); assert.equal(s.enemies.length, 0); assert.equal(s.bossesKilled, 10);
  assert.equal(s.playerHP, 100); assert.equal(s.rubyHP, 100); assert.equal(s.starEnergy, 100); assert.equal(s.specialSkill, 'aegis_sentinel');
});

test('Twins spawn together and share the encounter HP scaling', () => {
  const s = fresh('astral_twins', 6), [a, b] = s.enemies;
  assert.equal(s.enemies.length, 2); assert.equal(a.twin.pairId, b.twin.pairId); assert.notEqual(a.id, b.id);
  assert.equal(a.maxHp, 105); assert.equal(b.maxHp, 105);
  assert.equal(c.chamberOfTile(a.tileX, a.tileY), c.chamberOfTile(b.tileX, b.tileY));
  assert.ok(Math.hypot(a.tileX - b.tileX, a.tileY - b.tileY) >= 6);
});

test('twins hunt on independent paths with no leash between them', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies;
  s.map = s.map.map(row => row.map(() => c.T_FLOOR));
  position(a, 5, 10); position(b, 40, 40); movePlayer(s, 10, 10);
  a.pathTimer = b.pathTimer = 0; a.attackTimer = b.attackTimer = 1000;
  ticks(s, 120);
  assert.ok(Math.hypot(a.tileX - 10, a.tileY - 10) <= 1.5, 'Dawn reaches the player on its own');
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 10 * c.TILE_SIZE, 'they are free to be far apart');
});

test('the survivor keeps chasing while its fallen partner is reviving', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies;
  s.map = s.map.map(row => row.map(() => c.T_FLOOR));
  position(a, 16, 10); position(b, 6, 10); movePlayer(s, 30, 10);
  hit(s, b, 100); a.attackTimer = 1000; a.pathTimer = 0;
  ticks(s, 120); assert.ok(a.tileX > 20, 'survivor moved toward the player: ' + a.tileX); assert.equal(b.tileX, 6);
});


test('ranged twin takes its own off-line firing position while melee twin pressures the player', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies;
  s.map = s.map.map(row => row.map(() => c.T_FLOOR));
  position(a, 11, 10); position(b, 12, 10); movePlayer(s, 10, 10);
  a.pathTimer = b.pathTimer = a.attackTimer = b.attackTimer = 0;
  let shots = 0;
  for (let i = 0; i < 600; i++) { e.tick(s); if (s.laserBeams.some(beam => beam.color === '#89cbff')) shots++; }
  assert.ok(Math.abs(b.tileX - s.playerTileX) >= 2 && Math.abs(b.tileY - s.playerTileY) >= 2);
  assert.ok(Math.hypot(b.tileX - s.playerTileX, b.tileY - s.playerTileY) <= c.TWIN_RANGED_RANGE);
  assert.ok(Math.hypot(a.tileX - s.playerTileX, a.tileY - s.playerTileY) <= 1);
  assert.ok(shots > 0, 'ranged twin must attack from its separate position');
});

test('Dusk tracks a moving player through cover, warns for 0.6 seconds and hits the current position', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; s.godMode = false;
  s.map = s.map.map(row => row.map(() => c.T_FLOOR)); s.map[13][13] = c.T_WALL;
  position(a, 10, 10); position(b, 16, 16); b.attackTimer = 0;
  e.tick(s); assert.equal(b.windupTicks, c.TWIN_RANGED_WINDUP);
  ticks(s, 35); assert.equal(s.playerHP, 100); movePlayer(s, 11, 10); e.tick(s); assert.equal(s.playerHP, 92);
  const beam = s.laserBeams.find(beam => beam.color === '#89cbff');
  assert.equal(beam.endX, s.playerX); assert.equal(beam.endY, s.playerY);
  b.attackTimer = 0; e.tick(s); ticks(s, 36); assert.equal(s.playerHP, 84);
});

test('Dusk cancels tracking when player leaves range or chamber, like the Queen', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; s.godMode = false;
  s.map = s.map.map(row => row.map(() => c.T_FLOOR));
  position(a, 11, 10); position(b, 18, 12); b.attackTimer = 0;
  e.tick(s); assert.equal(b.windupTicks, 36); movePlayer(s, 10, 18); e.tick(s); assert.equal(b.windupTicks, 0);
  movePlayer(s, 10, 10); b.attackTimer = 0; e.tick(s); assert.equal(b.windupTicks, 36);
  movePlayer(s, 21, 10); e.tick(s); assert.equal(b.windupTicks, 0); assert.equal(s.playerHP, 100);
});

test('Dusk moves at 3.8 and Dawn at 2.9', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies;
  s.map = s.map.map(row => row.map(() => c.T_FLOOR));
  position(a, 5, 10); position(b, 12, 10); movePlayer(s, 19, 10);
  a.path = [[6, 10]]; b.path = [[13, 10]]; a.attackTimer = b.attackTimer = 100;
  e.tick(s); e.tick(s); close(a.stepProgress, 2.9); close(b.stepProgress, 3.8);
});

test('Dusk tracking honors Lunar Echo and restores the real player position', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; s.godMode = false;
  s.map = s.map.map(row => row.map(() => c.T_FLOOR));
  position(a, 11, 10); position(b, 16, 16); b.attackTimer = 0;
  s.specialSkill = 'splitter_queen'; e.useSpecialSkill(s); movePlayer(s, 40, 40); s.playerHP = 50;
  e.tick(s); ticks(s, 36);
  assert.equal(s.lunarDecoy.hitsLeft, s.lunarDecoy.maxHits - 1); assert.equal(s.playerHP, 50);
  assert.equal(s.playerTileX, 40); assert.equal(s.playerX, 40.5 * c.TILE_SIZE);
});

test('meteors remove fifty percent of construct max HP and require two hits from full health', () => {
  for (const stage of [0, 8]) {
    const s = fresh('aegis_sentinel', stage), [boss, construct, other] = s.enemies;
    position(boss, 40, 40); position(construct, 2, 2); position(other, 40, 38);
    s.starEnergy = 0;
    s.meteoriteWarning = 0; s.meteoriteStrikeIn = 1; e.tick(s);
    assert.equal(construct.hp, construct.maxHp * .5); assert.ok(s.enemies.includes(construct)); assert.equal(boss.aegis.constructsLeft, 2);
    s.meteoriteWarning = 0; s.meteoriteStrikeIn = 1; e.tick(s);
    assert.equal(s.enemies.includes(construct), false); assert.equal(boss.aegis.constructsLeft, 1);
    assert.equal(s.starEnergy, 0); assert.equal(s.killScore, 0); assert.equal(s.bossesKilled, stage);
  }
});

test('Aegis runs fast while shielded and slows while its core is exposed', () => {
  for (const exposed of [false, true]) {
    const s = fresh('aegis_sentinel'), boss = s.enemies[0]; movePlayer(s, 18, 10); s.playerCarryingRuby = true; s.rubyTileX = s.rubyTileY = -1;
    if (exposed) for (const construct of s.enemies.slice(1)) hit(s, construct, 100);
    position(boss, 10, 10); boss.attackTimer = 0; boss.path = [[11, 10]];
    e.tick(s); e.tick(s); close(boss.stepProgress, exposed ? c.AEGIS_EXPOSED_SPEED : 4);
  }
});

test('first fallen twin stays inert and gives no rewards; revival countdown pauses and restores sixty percent HP with a speed burst', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; freeze(s); s.starEnergy = 0; s.playerHP = 50;
  hit(s, a, 100); assert.equal(a.twin.downedTicks, 720); assert.equal(b.twin.partnerDownTicks, 720);
  assert.equal(s.bossesKilled, 0); assert.equal(s.killScore, 0); assert.equal(s.starEnergy, 0); assert.equal(s.playerHP, 50);
  const [x, y] = [a.x, a.y]; hit(s, a, 100); ticks(s, 100); assert.equal(a.x, x); assert.equal(a.y, y);
  s.gamePhase = 'constellation'; ticks(s, 200); assert.equal(a.twin.downedTicks, 620);
  s.gamePhase = 'playing'; ticks(s, 619); assert.equal(a.twin.downedTicks, 1);
  e.tick(s); assert.equal(a.twin.downedTicks, 0); assert.equal(a.hp, 36); assert.equal(a.twin.hasteTicks, c.TWIN_REVIVE_HASTE_TICKS); assert.equal(b.twin.partnerDownTicks, 0); assert.equal(s.bossesKilled, 0);
});

test('finishing survivor before revival grants one stage, one score reward and one celestial reward', () => {
  const s = fresh('astral_twins', 9), [a, b] = s.enemies; freeze(s);
  hit(s, a, 1000); ticks(s, 719); hit(s, b, 1000);
  assert.equal(s.enemies.length, 0); assert.equal(s.bossesKilled, 10); assert.equal(s.killScore, 500);
  assert.equal(s.specialSkill, 'astral_twins'); assert.equal(s.starEnergy, 100); assert.equal(s.bossTimer, c.BOSS_SPAWN_INTERVAL);
});

test('random health sharing transfers thirty percent in either direction, including lower HP to higher HP', () => {
  for (const roll of [0, .9999]) {
    const s = fresh('astral_twins'), [a, b] = s.enemies; freeze(s); a.hp = 40; b.hp = 20; a.twin.transferTicks = 1;
    const random = Math.random; Math.random = () => roll;
    try { e.tick(s); } finally { Math.random = random; }
    close(a.hp, roll === 0 ? 28 : 46); close(b.hp, roll === 0 ? 32 : 14); close(a.hp + b.hp, 60);
    assert.ok(a.twin.transferTicks >= c.TWIN_TRANSFER_MIN_TICKS && a.twin.transferTicks <= c.TWIN_TRANSFER_MAX_TICKS);
    const transfer = s.encounterEffects.find(fx => fx.kind === 'transfer');
    assert.equal(transfer.targetId, roll === 0 ? b.id : a.id);
    a.hp = 1; b.hp = 1; a.twin.transferTicks = 1; e.tick(s); assert.equal(a.hp, 1); assert.equal(b.hp, 1);
    hit(s, a, 2); a.twin.transferTicks = 1; e.tick(s); assert.equal(b.hp, 1); assert.equal(a.twin.downedTicks, 719);
  }
});

test('health sharing waits at least six seconds, caps received HP and plays skill-ready once per actual transfer', () => {
  const previousAudio = global.Audio, played = [];
  global.Audio = class { constructor(src) { this.src = src; } play() { played.push(this.src); return Promise.resolve(); } pause() {} };
  try {
    const s = fresh('astral_twins'), [a, b] = s.enemies; freeze(s); a.hp = 40; b.hp = 20; a.twin.transferTicks = c.TWIN_TRANSFER_MIN_TICKS;
    ticks(s, c.TWIN_TRANSFER_MIN_TICKS - 1); assert.equal(a.hp, 40); assert.equal(b.hp, 20);
    e.tick(s); close(a.hp + b.hp, 60);
    assert.equal(played.filter(src => src === '/sounds/celestial/skill-ready.wav').length, 1);
    const hp = [a.hp, b.hp]; ticks(s, c.TWIN_TRANSFER_MIN_TICKS - 1); assert.deepEqual([a.hp, b.hp], hp);
    a.hp = a.maxHp; b.hp = b.maxHp - 1; a.twin.transferTicks = 1; e.tick(s);
    close(a.hp, a.maxHp - 1); close(b.hp, b.maxHp);
    assert.equal(played.filter(src => src === '/sounds/celestial/skill-ready.wav').length, 2);
    assert.equal(b.twin.transferGetTicks, 60); assert.equal(a.twin.transferGiveTicks, 60);
  } finally { global.Audio = previousAudio; }
});

test('wave can finish both twins together without repeating damage to another target after companion cleanup', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies;
  position(a, 11, 10); position(b, 12, 10); a.hp = b.hp = 1;
  const grunt = { ...a, twin: undefined, type: 'normal', id: s.nextEnemyId++, hp: 100, maxHp: 100 }; position(grunt, 13, 10); s.enemies.push(grunt);
  e.activateWave(s); assert.equal(s.bossesKilled, 1); assert.deepEqual(s.enemies, [grunt]); close(grunt.hp, 100 - c.WAVE_DMG);
});

test('Solar handles simultaneous twin deaths without an endless casualty sweep or duplicate progression', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; a.hp = b.hp = 1; s.specialSkill = 'fiery_king';
  assert.equal(e.useSpecialSkill(s), true); assert.equal(s.bossesKilled, 1); assert.equal(s.enemies.length, 0);
});

test('meteor can finish both twins in their chamber as a single encounter', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; position(a, 2, 2); position(b, 4, 2); a.hp = b.hp = 1;
  s.meteoriteWarning = 0; s.meteoriteStrikeIn = 1; e.tick(s);
  assert.equal(s.bossesKilled, 1); assert.equal(s.enemies.length, 0); assert.equal(s.killScore, 0);
});

test('bomber finishing a twin removes the actual bomber after companion cleanup and hits each bystander once', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; position(a, 11, 10); position(b, 12, 10);
  hit(s, a, 100); b.hp = 1;
  const bomber = { ...b, twin: undefined, id: s.nextEnemyId++, type: 'bomber', hp: 6, maxHp: 6 };
  position(bomber, 12, 11); bomber.exploding = true; bomber.explodeTick = 1;
  const grunt = { ...b, twin: undefined, id: s.nextEnemyId++, type: 'normal', hp: 100, maxHp: 100 };
  position(grunt, 14, 11); s.enemies.push(bomber, grunt);
  e.tick(s); assert.deepEqual(s.enemies, [grunt]); assert.equal(grunt.hp, 98); assert.equal(s.bossesKilled, 1);
});

test('downed twin does not attract bullets or get moved by waves', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; position(a, 11, 10); position(b, 10, 12); hit(s, a, 100);
  e.useBullet(s); assert.equal(s.laserBullets[0].dx, 0); assert.ok(s.laserBullets[0].dy > 0);
  e.activateWave(s); assert.equal(a.pushTiles, 0); assert.equal(a.twin.downedTicks, 720);
});

test('No Boss and replacement remove every encounter body/object without rewards, while No Mobs preserves them', () => {
  for (const kind of ['aegis_sentinel', 'astral_twins']) {
    const s = fresh(kind); e.godSetNoMobs(s, true); assert.equal(s.enemies.length, kind === 'astral_twins' ? 2 : 3);
    e.godSetNoBossSpawns(s, true); assert.equal(s.enemies.length, 0); assert.equal(s.bossesKilled, 0);
    e.godSpawnBoss(s, kind); e.godSpawnBoss(s, 'fiery_king'); assert.deepEqual(s.enemies.map(x => x.type), ['fiery_king']);
  }
});

test('both new encounters initialize correctly through natural spawning too', () => {
  for (const kind of ['aegis_sentinel', 'astral_twins']) {
    const s = fresh('fiery_king'); s.enemies = []; s.bossPool = [kind]; s.difficultyLevel = 1; s.bossWarningTicks = 1;
    e.tick(s); assert.equal(s.bossSpawnName, c.BOSS_NAMES[kind]); assert.equal(s.enemies.length, kind === 'astral_twins' ? 2 : 3);
  }
});

test('surviving pylon warns for three seconds, hits only player in its chamber for eighty, and relocates at full HP', () => {
  const s = fresh('aegis_sentinel'), [boss, pylon, other] = s.enemies; freeze(s); s.godMode = false;
  position(boss, 40, 10); position(pylon, 2, 2); position(other, 40, 40); other.pylon.ageTicks = -100000;
  const grunt = { ...boss, aegis: undefined, type: 'normal', id: s.nextEnemyId++, hp: 10, maxHp: 10 }; position(grunt, 3, 2); s.enemies.push(grunt);
  pylon.hp = pylon.maxHp / 2;
  ticks(s, c.PYLON_LIFETIME_TICKS - 1); assert.equal(pylon.pylon.overloadTicks, 0); assert.equal(s.playerHP, 100);
  e.tick(s); assert.equal(pylon.pylon.overloadTicks, 180); ticks(s, 179); assert.equal(s.playerHP, 100);
  e.tick(s); assert.equal(s.playerHP, 20); assert.equal(s.rubyHP, 100); assert.equal(grunt.hp, 10); assert.equal(boss.hp, boss.maxHp);
  const destination = c.chamberOfTile(pylon.tileX, pylon.tileY); assert.ok(destination !== 0 && destination !== 3);
  assert.equal(pylon.hp, pylon.maxHp); assert.equal(pylon.pylon.ageTicks, 0); assert.equal(pylon.pylon.overloadTicks, 0);
  assert.equal(boss.aegis.constructsLeft, 2); assert.equal(s.bossesKilled, 0); assert.equal(s.killScore, 0);
  assert.ok(s.encounterEffects.some(fx => fx.kind === 'pylon-overload' && fx.x === 2.5 * c.TILE_SIZE));
});

test('damage never resets pylon lifetime or cancels overload; only destruction prevents the blast', () => {
  const s = fresh('aegis_sentinel'), pylon = s.enemies[1];
  pylon.pylon = { ageTicks: 1200, overloadTicks: 2 }; pylon.icyShieldHP = 1;
  hit(s, pylon, 1); assert.equal(pylon.pylon.overloadTicks, 2);
  hit(s, pylon, .35); assert.equal(pylon.pylon.overloadTicks, 2); assert.equal(pylon.pylon.ageTicks, 1200);
  hit(s, pylon, pylon.maxHp * .5, 'meteor');
  assert.equal(pylon.pylon.overloadTicks, 2); assert.equal(pylon.pylon.ageTicks, 1200);
  hit(s, pylon, 100); assert.equal(s.enemies.includes(pylon), false); e.tick(s);
  assert.equal(s.encounterEffects.some(fx => fx.kind === 'pylon-overload' && fx.ownerId === pylon.id), false);
});

test('pylon countdown pauses in menus and Eclipse; other chambers and normal protection remain safe', () => {
  const s = fresh('aegis_sentinel'), [boss, pylon, other] = s.enemies; freeze(s);
  position(boss, 40, 40); position(pylon, 2, 2); position(other, 40, 38); pylon.pylon.overloadTicks = 20;
  s.gamePhase = 'teleporting'; ticks(s, 80); assert.equal(pylon.pylon.overloadTicks, 20);
  s.gamePhase = 'playing'; s.ambientEvents.active = { kind: 'eclipse', ticks: 100, maxTicks: 100, age: 0, points: [], pullTimer: 0 };
  ticks(s, 40); assert.equal(pylon.pylon.overloadTicks, 20); s.ambientEvents.active = null;
  s.godMode = false; s.playerShieldHP = 30; ticks(s, 20); assert.equal(s.playerHP, 50); assert.equal(s.playerShieldHP, 0);
  position(pylon, 40, 10); pylon.pylon.overloadTicks = 1; e.tick(s); assert.equal(s.playerHP, 50);
});

test('shield opening and cosmetic effects pause, expire, and clear on debug replacement', () => {
  const s = fresh('aegis_sentinel'), boss = s.enemies[0]; freeze(s);
  for (let i = 0; i < 10; i++) hit(s, boss, .35);
  assert.equal(s.encounterEffects.filter(fx => fx.kind === 'reflect').length, 1);
  for (const pylon of s.enemies.slice(1)) hit(s, pylon, 100);
  ticks(s, 12); close(boss.aegis.openAmount, .5); const effects = JSON.stringify(s.encounterEffects);
  s.gamePhase = 'constellation'; ticks(s, 100); close(boss.aegis.openAmount, .5); assert.equal(JSON.stringify(s.encounterEffects), effects);
  s.gamePhase = 'playing'; ticks(s, 12); close(boss.aegis.openAmount, 1);
  s.map = s.map.map(row => row.map(() => c.T_FLOOR));
  e.godSpawnBoss(s, 'astral_twins'); assert.equal(s.encounterEffects.length, 0);
  const [a, b] = s.enemies; position(a, 11, 10); position(b, 16, 16); a.attackTimer = b.attackTimer = 0;
  e.tick(s); assert.ok(s.encounterEffects.some(fx => fx.kind === 'melee')); ticks(s, 36);
  assert.ok(s.encounterEffects.some(fx => fx.kind === 'shot'));
  e.godSetNoBossSpawns(s, true); assert.equal(s.encounterEffects.length, 0); assert.equal(s.enemies.length, 0);
});

test('supplied break sounds play once for the matching shield or pylon transition', () => {
  const previousAudio = global.Audio, played = [];
  global.Audio = class { constructor(src) { this.src = src; } play() { played.push(this.src); return Promise.resolve(); } pause() {} };
  try {
    const s = fresh('aegis_sentinel'), boss = s.enemies[0], pylons = s.enemies.slice(1);
    hit(s, pylons[0], 100);
    assert.equal(played.filter(src => src === '/sounds/pylon-break.wav').length, 1);
    assert.equal(played.filter(src => src === '/sounds/aegis-shield-break.wav').length, 0);
    hit(s, pylons[1], 100); ticks(s, 2);
    assert.equal(played.filter(src => src === '/sounds/pylon-break.wav').length, 2);
    assert.equal(played.filter(src => src === '/sounds/aegis-shield-break.wav').length, 1);
    const grunt = { ...boss, aegis: undefined, type: 'normal', hp: 20, maxHp: 20, icyShieldHP: 4, id: s.nextEnemyId++ };
    position(grunt, 11, 10); s.enemies.push(grunt);
    hit(s, grunt, 1); assert.equal(played.filter(src => src === '/sounds/frost-shield-break.mp3').length, 0);
    hit(s, grunt, 3); hit(s, grunt, 1);
    assert.equal(played.filter(src => src === '/sounds/frost-shield-break.mp3').length, 1);
    e.godSetNoBossSpawns(s, true);
    assert.equal(played.filter(src => src === '/sounds/aegis-shield-break.wav').length, 1);
  } finally { global.Audio = previousAudio; }
});

test('each twin uses its selected attack cue and revival plays only when the fallen twin returns', () => {
  const previousAudio = global.Audio, played = [];
  global.Audio = class { constructor(src) { this.src = src; } play() { played.push(this.src); return Promise.resolve(); } pause() {} };
  try {
    const s = fresh('astral_twins'), [a, b] = s.enemies; s.map = s.map.map(row => row.map(() => c.T_FLOOR));
    position(a, 11, 10); position(b, 16, 16); a.attackTimer = b.attackTimer = 0;
    e.tick(s); assert.equal(played.filter(src => src === '/sounds/celestial/jupiter-storm.wav').length, 1);
    assert.equal(played.filter(src => src === '/sounds/dusk-attack.mp3').length, 0);
    ticks(s, 36); assert.equal(played.filter(src => src === '/sounds/dusk-attack.mp3').length, 1);
    assert.equal(played.filter(src => src === '/sounds/celestial/neptune-electric.wav').length, 1);
    hit(s, a, 100); freeze(s); ticks(s, 719);
    assert.equal(played.filter(src => src === '/sounds/twin-revive.mp3').length, 0);
    s.gamePhase = 'teleporting'; ticks(s, 50); assert.equal(played.filter(src => src === '/sounds/twin-revive.mp3').length, 0);
    s.gamePhase = 'playing'; e.tick(s); e.tick(s);
    assert.equal(played.filter(src => src === '/sounds/twin-revive.mp3').length, 1);
  } finally { global.Audio = previousAudio; }
});

test('revived twin moves forty percent faster for five seconds', () => {
  const s = fresh('astral_twins'), [a] = s.enemies;
  const step = haste => { a.twin.hasteTicks = haste; Object.assign(a, { targetTileX: a.tileX + 1, stepProgress: 0, x: (a.tileX + .5) * c.TILE_SIZE });
    const before = a.stepProgress; e.tick(s); return a.stepProgress - before; };
  const normal = step(0), fast = step(c.TWIN_REVIVE_HASTE_TICKS);
  assert.ok(Math.abs(fast / normal - c.TWIN_REVIVE_HASTE_MULT) < 1e-6, `${fast} / ${normal}`);
  assert.equal(a.twin.hasteTicks, c.TWIN_REVIVE_HASTE_TICKS - 1);
});

test('survivor goes berserk while its partner is down: faster, quicker attacks, half damage taken', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; freeze(s);
  hit(s, a, 10); close(a.hp, a.maxHp - 10);
  hit(s, b, 1000); assert.ok(b.twin.downedTicks > 0); assert.ok(a.twin.partnerDownTicks > 0);
  const before = a.hp; hit(s, a, 10); close(a.hp, before - 10 * c.TWIN_BERSERK_DAMAGE_TAKEN);
  Object.assign(a, { targetTileX: a.tileX + 1, stepProgress: 0, pathTimer: 100000 }); e.tick(s);
  close(a.stepProgress, c.ENEMY_CONFIGS.astral_twins.speed * c.TWIN_BERSERK_SPEED_MULT);
  position(a, a.tileX, a.tileY); movePlayer(s, a.tileX + 1, a.tileY); a.attackTimer = 0; e.tick(s);
  assert.equal(a.attackTimer, Math.round(c.ENEMY_CONFIGS.astral_twins.attackCooldown * c.TWIN_BERSERK_COOLDOWN_MULT));
  ticks(s, b.twin.downedTicks); assert.equal(a.twin.partnerDownTicks, 0);
  const revived = a.hp; hit(s, a, 10); close(a.hp, revived - 10);
});

test('meteors hit a twin for the normal boss share', () => {
  const s = fresh('astral_twins'), [a, b] = s.enemies; position(a, 2, 2); position(b, 30, 30);
  s.meteoriteWarning = c.chamberOfTile(2, 2); s.meteoriteStrikeIn = 1; e.tick(s);
  close(a.hp, a.maxHp * .25); assert.equal(b.hp, b.maxHp);
});
