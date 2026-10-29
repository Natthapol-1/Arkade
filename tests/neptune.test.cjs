const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => {
  let source = fs.readFileSync(f, 'utf8');
  if (f.endsWith('engine.ts')) source += '\nexport const neptuneTest = { damageEnemy, killEnemy, healPlayer, damagePlayer };';
  m._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
};
const e = require('../app/ruby-star/engine.ts'), c = require('../app/ruby-star/constants.ts'), api = e.neptuneTest, nep = require('../app/ruby-star/neptune.ts');
const HP = c.NEPTUNE_PHASE_HPS, TOTAL = c.NEPTUNE_TOTAL_HP, F1 = HP[2] + HP[3]; // phase 1 sits above phases 2 and 3

function fresh() {
  const s = e.createModeState('trial', 'sea_chanter');
  s.noMobs = true; s.godMode = true; s.meteoriteTimer = 100000; s.neptune.fishTimer = 100000; s.neptune.tideTimer = 100000; s.neptune.sharkTimer = 1e9; s.neptune.jellyTimer = 1e9;
  e.godSpawnBoss(s, 'sea_chanter');
  const boss = s.enemies.find(x => x.type === 'sea_chanter');
  boss.attackTimer = boss.sea.songCooldown = 100000;
  return { s, boss };
}
const clones = s => s.enemies.filter(x => x.type === 'water_clone');
function dropAllClones(s) { for (let i = 0; i < 1200 && s.neptune.dive?.dropsLeft; i++) e.tick(s); }

test('the guardian carries three phases and cannot be pushed below the current phase', () => {
  const { s, boss } = fresh();
  assert.equal(boss.maxHp, TOTAL); assert.equal(boss.hp, TOTAL); assert.equal(s.neptune.phase, 1);
  api.damageEnemy(s, boss, 5000);
  assert.ok(boss.hp > F1 && boss.hp < F1 + 1, 'held at the phase floor: ' + boss.hp);
  assert.ok(s.enemies.includes(boss));
});

test('crossing a dive point dives; destroying every clone snaps HP down to the point', () => {
  const { s, boss } = fresh();
  boss.hp = F1 + .75 * HP[1] - 1; e.tick(s);
  assert.ok(s.neptune.dive, 'dive started'); assert.ok(e.isSeaChanterDiving(boss));
  e.tick(s);
  assert.equal(s.neptune.dive.dropsLeft, 0, 'all clones appear together'); assert.equal(clones(s).length, c.NEPTUNE_CLONES[1]);
  assert.equal(new Set(clones(s).map(x => c.chamberOfTile(x.tileX, x.tileY))).size, c.NEPTUNE_CLONES[1], 'each clone in its own room');
  boss.hp += 20; // ally healing during the dive
  for (const clone of clones(s)) api.damageEnemy(s, clone, 100);
  e.tick(s); e.tick(s);
  assert.equal(s.neptune.dive, null); assert.ok(!e.isSeaChanterDiving(boss));
  assert.ok(Math.abs(boss.hp - (F1 + .75 * HP[1])) < .5, 'snapped to 75%: ' + boss.hp);
  assert.ok(boss.sea.resurfaceTicks > 0, 'she resurfaces as soon as the last clone is gone');
});

test('surviving clones each restore 10% of the phase when time runs out, never past the phase top', () => {
  const { s, boss } = fresh();
  boss.hp = F1 + .5 * HP[1] - 1; s.neptune.armed = [false, true, true, true]; e.tick(s);
  dropAllClones(s);
  api.damageEnemy(s, clones(s)[0], 100);
  const before = boss.hp;
  for (let i = 0; i < c.NEPTUNE_DIVE_TICKS[1] && s.neptune.dive; i++) e.tick(s);
  assert.equal(s.neptune.dive, null);
  assert.ok(Math.abs(boss.hp - (before + 2 * c.NEPTUNE_CLONE_HEAL * HP[1])) < 1, 'healed by two clones: ' + boss.hp);
  boss.hp = TOTAL + 50; e.tick(s); assert.equal(boss.hp, TOTAL, 'capped at the phase top');
});

test('a dive point re-arms when she heals above it, so dives are not limited to four', () => {
  const { s, boss } = fresh();
  boss.hp = F1 + .75 * HP[1] - 1; e.tick(s); dropAllClones(s);
  for (const clone of clones(s)) api.damageEnemy(s, clone, 100);
  e.tick(s); e.tick(s); assert.equal(s.neptune.dive, null);
  boss.hp = F1 + .9 * HP[1]; e.tick(s); assert.equal(s.neptune.armed[0], true);
  boss.hp = F1 + .74 * HP[1]; e.tick(s); assert.ok(s.neptune.dive, 'dives at 75% again');
});

test('hitting a clone pauses her ally-feeding heal, and clones swim', () => {
  const { s, boss } = fresh();
  boss.hp = F1 + .75 * HP[1] - 1; e.tick(s); dropAllClones(s);
  const clone = clones(s)[0];
  api.damageEnemy(s, clone, 1);
  assert.ok(boss.sea.healingBlockedUntilTick >= s.gameTick + c.NEPTUNE_CLONE_HEAL_BLOCK - 1);
  const start = [clone.x, clone.y]; for (let i = 0; i < 90; i++) e.tick(s);
  assert.ok(clone.x !== start[0] || clone.y !== start[1] || clone.stepProgress > 0, 'clone moves');
});

test('the final dive of a phase moves to the next phase; phase 3 final dive leaves her exposed to one last hit', () => {
  const { s, boss } = fresh();
  for (const phase of [1, 2, 3]) {
    assert.equal(s.neptune.phase, phase);
    api.damageEnemy(s, boss, 5000); s.neptune.armed = s.neptune.armed.map((_, i, all) => i === all.length - 1);
    e.tick(s); assert.ok(s.neptune.dive && s.neptune.dive.point === 0, 'final dive of phase ' + phase);
    dropAllClones(s); assert.equal(clones(s).length, c.NEPTUNE_CLONES[phase]);
    for (const clone of clones(s)) api.damageEnemy(s, clone, 100);
    e.tick(s); e.tick(s);
  }
  assert.equal(s.neptune.exposed, true); assert.ok(boss.hp > 0 && boss.hp <= .01, 'alive but exposed');
  for (let i = 0; i < 60; i++) e.tick(s);
  assert.equal(s.neptune.dive, null, 'no more dives'); assert.notEqual(s.gamePhase, 'won');
  api.damageEnemy(s, boss, 1); e.tick(s);
  assert.equal(s.gamePhase, 'won');
});

test('every phase 3 dive drops four clones', () => {
  const { s, boss } = fresh();
  nep.godSetNeptunePhase(s, 3);
  boss.hp = .65 * HP[3]; e.tick(s); assert.ok(s.neptune.dive && s.neptune.dive.point > 0);
  dropAllClones(s); assert.equal(clones(s).length, 4);
});

test('phase 2 water balls: popping one hurts her, letting it burst hurts you', () => {
  const { s, boss } = fresh();
  s.neptune.phase = 2; s.neptune.armed = [false, false, false]; boss.hp = HP[3] + .9 * HP[2]; s.neptune.bombTimer = 1; s.godMode = false;
  e.tick(s);
  let ball = s.enemies.find(x => x.type === 'water_bomb'); assert.ok(ball);
  const hp = boss.hp; api.damageEnemy(s, ball, 100); e.tick(s);
  assert.ok(Math.abs(boss.hp - (hp - c.NEPTUNE_BOMB_SELF_DAMAGE * HP[2])) < .5, 'self damage: ' + boss.hp);
  s.neptune.bombTimer = 1; e.tick(s); ball = s.enemies.find(x => x.type === 'water_bomb');
  const playerHP = s.playerHP; for (let i = 0; i < c.NEPTUNE_BOMB_FUSE + 2; i++) e.tick(s);
  assert.ok(!s.enemies.includes(ball)); assert.ok(s.playerHP <= playerHP - c.NEPTUNE_BOMB_DAMAGE + .01);
});

test('fish: blue heals you (or her while she dives), red costs you HP on a direct hit only', () => {
  const { s, boss } = fresh(); s.godMode = false; s.playerHP = 50;
  const blue = e.createModeState('trial', 'sea_chanter'); void blue;
  const spawn = type => { const f = { ...boss, id: s.nextEnemyId++, type, hp: 1, maxHp: 1, sea: undefined }; s.enemies.push(f); return f; };
  api.damageEnemy(s, spawn('fish_blue'), 5); assert.equal(s.playerHP, 50 + c.NEPTUNE_FISH_HEAL);
  api.damageEnemy(s, spawn('fish_red'), 5); assert.equal(s.playerHP, 50 + c.NEPTUNE_FISH_HEAL - c.NEPTUNE_FISH_HURT);
  api.damageEnemy(s, spawn('fish_red'), 5, 'special'); assert.equal(s.playerHP, 50 + c.NEPTUNE_FISH_HEAL - c.NEPTUNE_FISH_HURT, 'skills pop red fish safely');
  boss.hp = F1 + .75 * HP[1] - 1; e.tick(s); assert.ok(e.isSeaChanterDiving(boss));
  const hp = boss.hp, player = s.playerHP; api.damageEnemy(s, spawn('fish_blue'), 5);
  assert.equal(s.playerHP, player); assert.ok(Math.abs(boss.hp - (hp + c.NEPTUNE_FISH_BOSS_HEAL * HP[1])) < .01);
});

test('healing charges the sky laser; it strikes the chosen room like a meteor for a share of phase HP', () => {
  const { s, boss } = fresh(); s.godMode = false; s.playerHP = 10;
  assert.equal(nep.openSkyLaser(s), false);
  for (let i = 0; i < 20; i++) { s.playerHP = 10; api.healPlayer(s, 10); }
  assert.equal(s.neptune.healCharge, c.NEPTUNE_HEAL_CHARGE_MAX);
  assert.ok(nep.openSkyLaser(s)); assert.equal(s.gamePhase, 'laserTarget');
  const room = c.chamberOfTile(boss.tileX, boss.tileY);
  assert.ok(e.chooseSkyLaser(s, room)); assert.equal(s.neptune.healCharge, 0);
  const hp = boss.hp; boss.path = []; boss.pathTimer = 100000; boss.stepProgress = 0; boss.targetTileX = boss.tileX; boss.targetTileY = boss.tileY;
  for (let i = 0; i < c.NEPTUNE_LASER_WARNING + 1; i++) e.tick(s);
  assert.ok(Math.abs(hp - boss.hp - c.NEPTUNE_STRIKE_DAMAGE * HP[1]) < 1, 'strike damage ' + (hp - boss.hp));
});

test('phase 3 hits steal life; meteors deal a share of phase HP; tides speed movement with the flow', () => {
  const { s, boss } = fresh(); s.godMode = false;
  s.neptune.phase = 3; s.neptune.armed = [false, false, false]; boss.hp = .5 * HP[3];
  api.damageEnemy(s, boss, 0.0001);
  s.neptune.tides = [{ chamber: c.chamberOfTile(s.playerTileX, s.playerTileY), dirX: 1, dirY: 0, ticks: 100 }];
  s.playerTargetX = s.playerTileX + 1; s.playerTargetY = s.playerTileY;
  assert.equal(nep.neptuneTideSpeed(s), c.NEPTUNE_TIDE_WITH);
  s.playerTargetX = s.playerTileX - 1; assert.equal(nep.neptuneTideSpeed(s), c.NEPTUNE_TIDE_AGAINST);
  s.playerTargetX = s.playerTileX;
  // Her hits are 1.5x in phases 2-3 and, in phase 3, heal her for the damage dealt.
  s.playerHP = 100; const stolen = boss.hp; api.damagePlayer(s, 10, boss);
  assert.equal(s.playerHP, 100 - 10 * c.NEPTUNE_ATTACK_MULT[3]);
  assert.ok(Math.abs(boss.hp - (stolen + 10 * c.NEPTUNE_ATTACK_MULT[3] * c.NEPTUNE_LIFESTEAL)) < .01, 'life steal ' + boss.hp);
  // Meteors deal a share of phase HP.
  boss.hp = .5 * HP[3]; const room = c.chamberOfTile(boss.tileX, boss.tileY); boss.path = []; boss.pathTimer = 100000;
  s.meteoriteWarning = room; s.meteoriteStrikeIn = 1; s.playerHP = 100; e.tick(s);
  assert.ok(Math.abs(.5 * HP[3] - boss.hp - c.NEPTUNE_STRIKE_DAMAGE * HP[3]) < 1, 'meteor ' + boss.hp);
});

test('her HP pool is large: a single bomb is a small dent and never reaches the first dive point', () => {
  const { s, boss } = fresh();
  assert.deepEqual([HP[1], HP[2], HP[3]], [2000, 2400, 3000]);
  const hp = boss.hp; api.damageEnemy(s, boss, 45); assert.equal(hp - boss.hp, 45);
  api.damageEnemy(s, boss, 90); e.tick(s); assert.equal(s.neptune.dive, null, 'no dive from a couple of bombs');
});

test('God panel phase buttons jump to a phase at full phase HP, summoning her if needed', () => {
  const s = e.createModeState('trial', 'sea_chanter'); s.noMobs = true; s.godMode = true;
  nep.godSetNeptunePhase(s, 3);
  const boss = s.enemies.find(x => x.type === 'sea_chanter'); assert.ok(boss, 'summoned');
  assert.equal(s.neptune.phase, 3); assert.ok(Math.abs(boss.hp - HP[3]) < .1);
  nep.godSetNeptunePhase(s, 1); assert.equal(s.neptune.phase, 1); assert.ok(Math.abs(boss.hp - TOTAL) < .1);
  boss.hp = F1 + .75 * HP[1] - 1; e.tick(s); assert.ok(s.neptune.dive);
  nep.godSetNeptunePhase(s, 2); assert.equal(s.neptune.dive, null); assert.equal(s.enemies.filter(x => x.type === 'water_clone').length, 0);
});

test('fish nearby never block manual healing', () => {
  const { s, boss } = fresh(); s.godMode = false; s.playerHP = 50;
  boss.tileX = boss.targetTileX = 40; boss.tileY = boss.targetTileY = 40;
  s.playerCarryingRuby = true; s.rubyTileX = s.rubyTileY = -1;
  for (const type of ['fish_blue', 'fish_red']) s.enemies.push({ ...boss, id: s.nextEnemyId++, type, hp: 1, maxHp: 1, sea: undefined, tileX: s.playerTileX + 1, tileY: s.playerTileY });
  assert.equal(e.canHealRuby(s), true);
});

test('her song bursts also hit a placed Ruby', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.rubyShieldHP = 0;
  const x = (s.rubyTileX + .5) * c.TILE_SIZE, y = (s.rubyTileY + .5) * c.TILE_SIZE, ruby = s.rubyHP;
  s.playerX = x + 50 * c.TILE_SIZE; s.playerY = y;
  s.seaSongWaves.push({ x: x - 1, y, dx: 1, dy: 0, rangeLeft: 1, aimX: x, aimY: y, hitPlayer: false, ownerId: boss.id });
  e.tick(s); e.tick(s);
  assert.ok(Math.abs(ruby - s.rubyHP - (c.SEA_SONG_BLAST_DAMAGE_CENTER + c.NEPTUNE_SONG_BONUS)) < .01, 'ruby took a full centre burst (+2): ' + (ruby - s.rubyHP));
});

test('her water waves hit you for +2 on this map', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.playerShieldHP = 0;
  const hp = s.playerHP, x = s.playerX, y = s.playerY;
  s.seaSongWaves.push({ x: x - 30, y, dx: 1, dy: 0, rangeLeft: 400, aimX: x + 400, aimY: y, hitPlayer: false, ownerId: boss.id });
  for (let i = 0; i < 10; i++) e.tick(s);
  assert.equal(hp - s.playerHP, c.ENEMY_CONFIGS.sea_chanter.damageToPlayer + c.NEPTUNE_SONG_BONUS);
});

test('jellyfish drift in now and then; killing one during a dive reveals the nearest clone for a while', () => {
  const { s, boss } = fresh();
  s.neptune.jellyTimer = 1; e.tick(s);
  assert.ok(s.enemies.some(x => x.type === 'jellyfish'), 'spawns outside dives too');
  boss.hp = F1 + .75 * HP[1] - 1; e.tick(s); dropAllClones(s);
  s.enemies = s.enemies.filter(x => x.type !== 'jellyfish');
  s.neptune.dive.jellyTimer = 1; e.tick(s); // the dive's own jellyfish
  const jelly = s.enemies.find(x => x.type === 'jellyfish'); assert.ok(jelly, 'a jellyfish drifted in');
  api.damageEnemy(s, jelly, 5); api.killEnemy(s, s.enemies.indexOf(jelly));
  assert.ok(s.neptune.reveal, 'a clone is revealed');
  assert.ok(clones(s).some(x => x.id === s.neptune.reveal.cloneId));
  for (let i = 0; i < c.NEPTUNE_REVEAL_TICKS + 1; i++) e.tick(s);
  assert.equal(s.neptune.reveal, null);
});

test('a shark warns its lane, then hits you once, knocks you off the lane and bites her too', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.playerShieldHP = 0;
  s.neptune.sharkTimer = 1; e.tick(s);
  const shark = s.neptune.shark; assert.ok(shark); assert.ok(shark.warning > 0);
  // Put her in the lane as well.
  if (shark.vertical) { boss.tileX = boss.targetTileX = shark.line; boss.tileY = boss.targetTileY = s.playerTileY + (s.map[s.playerTileY + 2]?.[shark.line] === c.T_FLOOR ? 2 : -2); }
  else { boss.tileY = boss.targetTileY = shark.line; boss.tileX = boss.targetTileX = s.playerTileX + (s.map[shark.line][s.playerTileX + 2] === c.T_FLOOR ? 2 : -2); }
  boss.attackTimer = boss.sea.songCooldown = 100000; boss.path = []; boss.pathTimer = 100000;
  const hp = s.playerHP, bossHP = boss.hp;
  for (let i = 0; i < 160 && s.neptune.shark; i++) { e.tick(s); boss.tileX = boss.targetTileX; boss.tileY = boss.targetTileY; }
  assert.equal(hp - s.playerHP, c.NEPTUNE_SHARK_DAMAGE);
  assert.ok(bossHP - boss.hp >= c.NEPTUNE_SHARK_BOSS_DAMAGE * HP[1] - 1, 'bit her: ' + (bossHP - boss.hp));
  assert.equal(s.neptune.shark, null, 'it swims away');
});

test('a pufferfish swells when close, then bursts: damage and a two-tile knockback', () => {
  const { s } = fresh();
  s.godMode = false; s.playerShieldHP = 0;
  const tile = [s.playerTileX - 1, s.playerTileY];
  const boss = s.enemies.find(x => x.type === 'sea_chanter'); boss.attackTimer = 1e9;
  const puff = { ...boss, id: 900, type: 'pufferfish', sea: undefined, x: (tile[0] + .5) * c.TILE_SIZE, y: (tile[1] + .5) * c.TILE_SIZE, tileX: tile[0], tileY: tile[1],
    targetTileX: tile[0], targetTileY: tile[1], stepProgress: 0, hp: 7, maxHp: 7, path: [], pathTimer: 0, attackTimer: 0, windupTicks: 0, shootTicks: 0, flashTicks: 0 };
  s.enemies.push(puff);
  e.tick(s); assert.ok(puff.windupTicks > 0, 'swelling');
  const hp = s.playerHP;
  for (let i = 0; i < c.NEPTUNE_PUFF_TICKS + 1; i++) e.tick(s);
  assert.equal(hp - s.playerHP, c.NEPTUNE_PUFF_DAMAGE);
  assert.ok(s.playerKnockback && s.playerKnockback.tilesLeft === c.NEPTUNE_PUFF_KNOCKBACK, 'knocked back');
});

test('a pufferfish also bursts when it dies', () => {
  const { s } = fresh();
  s.godMode = false; s.playerShieldHP = 0;
  const boss = s.enemies.find(x => x.type === 'sea_chanter'); boss.attackTimer = 1e9;
  const tile = [s.playerTileX - 1, s.playerTileY];
  const puff = { ...boss, id: 901, type: 'pufferfish', sea: undefined, x: (tile[0] + .5) * c.TILE_SIZE, y: (tile[1] + .5) * c.TILE_SIZE, tileX: tile[0], tileY: tile[1],
    targetTileX: tile[0], targetTileY: tile[1], stepProgress: 0, hp: 7, maxHp: 7, path: [], pathTimer: 0, attackTimer: 1e9, windupTicks: 0, shootTicks: 0, flashTicks: 0 };
  s.enemies.push(puff);
  const hp = s.playerHP; api.damageEnemy(s, puff, 100); api.killEnemy(s, s.enemies.indexOf(puff), true); // no kill reward, to read the burst alone
  assert.equal(hp - s.playerHP, c.NEPTUNE_PUFF_DAMAGE);
  assert.ok(s.playerKnockback, 'knocked back');
});
