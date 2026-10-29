const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => {
  let source = fs.readFileSync(f, 'utf8');
  if (f.endsWith('engine.ts')) source += '\nexport const neptuneTest = { damageEnemy, killEnemy, healPlayer, damagePlayer };';
  m._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
};
const e = require('../app/ruby-star/engine.ts'), c = require('../app/ruby-star/constants.ts'), api = e.neptuneTest;
const PH = c.NEPTUNE_PHASE_HP;

function fresh() {
  const s = e.createModeState('trial', 'sea_chanter');
  s.noMobs = true; s.godMode = true; s.meteoriteTimer = 100000; s.neptune.fishTimer = 100000; s.neptune.tideTimer = 100000;
  e.godSpawnBoss(s, 'sea_chanter');
  const boss = s.enemies.find(x => x.type === 'sea_chanter');
  boss.attackTimer = boss.sea.songCooldown = 100000;
  return { s, boss };
}
const clones = s => s.enemies.filter(x => x.type === 'water_clone');
function dropAllClones(s) { for (let i = 0; i < 1200 && s.neptune.dive?.dropsLeft; i++) e.tick(s); }

test('the guardian carries three phases and cannot be pushed below the current phase', () => {
  const { s, boss } = fresh();
  assert.equal(boss.maxHp, 3 * PH); assert.equal(boss.hp, 3 * PH); assert.equal(s.neptune.phase, 1);
  api.damageEnemy(s, boss, 5000);
  assert.ok(boss.hp > 2 * PH && boss.hp < 2 * PH + 1, 'held at the phase floor: ' + boss.hp);
  assert.ok(s.enemies.includes(boss));
});

test('crossing a dive point dives; destroying every clone snaps HP down to the point', () => {
  const { s, boss } = fresh();
  boss.hp = 2 * PH + .75 * PH - 1; e.tick(s);
  assert.ok(s.neptune.dive, 'dive started'); assert.ok(e.isSeaChanterDiving(boss));
  dropAllClones(s); assert.equal(clones(s).length, c.NEPTUNE_CLONES[1]);
  assert.equal(new Set(clones(s).map(x => c.chamberOfTile(x.tileX, x.tileY))).size, c.NEPTUNE_CLONES[1], 'each clone in its own room');
  boss.hp += 20; // ally healing during the dive
  for (const clone of clones(s)) api.damageEnemy(s, clone, 100);
  e.tick(s); e.tick(s);
  assert.equal(s.neptune.dive, null); assert.ok(!e.isSeaChanterDiving(boss));
  assert.ok(Math.abs(boss.hp - (2 * PH + .75 * PH)) < .5, 'snapped to 75%: ' + boss.hp);
  assert.ok(boss.sea.resurfaceTicks > 0, 'she resurfaces as soon as the last clone is gone');
});

test('surviving clones each restore 10% of the phase when time runs out, never past the phase top', () => {
  const { s, boss } = fresh();
  boss.hp = 2 * PH + .5 * PH - 1; s.neptune.armed = [false, true, true, true]; e.tick(s);
  dropAllClones(s);
  api.damageEnemy(s, clones(s)[0], 100);
  const before = boss.hp;
  for (let i = 0; i < c.NEPTUNE_DIVE_TICKS[1] && s.neptune.dive; i++) e.tick(s);
  assert.equal(s.neptune.dive, null);
  assert.ok(Math.abs(boss.hp - (before + 2 * c.NEPTUNE_CLONE_HEAL * PH)) < 1, 'healed by two clones: ' + boss.hp);
  boss.hp = 3 * PH + 50; e.tick(s); assert.equal(boss.hp, 3 * PH, 'capped at the phase top');
});

test('a dive point re-arms when she heals above it, so dives are not limited to four', () => {
  const { s, boss } = fresh();
  boss.hp = 2 * PH + .75 * PH - 1; e.tick(s); dropAllClones(s);
  for (const clone of clones(s)) api.damageEnemy(s, clone, 100);
  e.tick(s); e.tick(s); assert.equal(s.neptune.dive, null);
  boss.hp = 2 * PH + .9 * PH; e.tick(s); assert.equal(s.neptune.armed[0], true);
  boss.hp = 2 * PH + .74 * PH; e.tick(s); assert.ok(s.neptune.dive, 'dives at 75% again');
});

test('hitting a clone pauses her ally-feeding heal, and clones swim', () => {
  const { s, boss } = fresh();
  boss.hp = 2 * PH + .75 * PH - 1; e.tick(s); dropAllClones(s);
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
    dropAllClones(s); assert.equal(clones(s).length, phase === 3 ? c.NEPTUNE_FINAL_CLONES : c.NEPTUNE_CLONES[phase]);
    for (const clone of clones(s)) api.damageEnemy(s, clone, 100);
    e.tick(s); e.tick(s);
  }
  assert.equal(s.neptune.exposed, true); assert.ok(boss.hp > 0 && boss.hp <= .01, 'alive but exposed');
  for (let i = 0; i < 60; i++) e.tick(s);
  assert.equal(s.neptune.dive, null, 'no more dives'); assert.notEqual(s.gamePhase, 'won');
  api.damageEnemy(s, boss, 1); e.tick(s);
  assert.equal(s.gamePhase, 'won');
});

test('earlier phase 3 dives drop three clones', () => {
  const { s, boss } = fresh();
  e.godSetNeptunePhase(s, 3);
  boss.hp = .65 * PH; e.tick(s); assert.ok(s.neptune.dive && s.neptune.dive.point > 0);
  dropAllClones(s); assert.equal(clones(s).length, 3);
});

test('phase 2 water balls: popping one hurts her, letting it burst hurts you', () => {
  const { s, boss } = fresh();
  s.neptune.phase = 2; s.neptune.armed = [false, false]; boss.hp = PH + .9 * PH; s.neptune.bombTimer = 1; s.godMode = false;
  e.tick(s);
  let ball = s.enemies.find(x => x.type === 'water_bomb'); assert.ok(ball);
  const hp = boss.hp; api.damageEnemy(s, ball, 100); e.tick(s);
  assert.ok(Math.abs(boss.hp - (hp - c.NEPTUNE_BOMB_SELF_DAMAGE * PH)) < .5, 'self damage: ' + boss.hp);
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
  boss.hp = 2 * PH + .75 * PH - 1; e.tick(s); assert.ok(e.isSeaChanterDiving(boss));
  const hp = boss.hp, player = s.playerHP; api.damageEnemy(s, spawn('fish_blue'), 5);
  assert.equal(s.playerHP, player); assert.ok(Math.abs(boss.hp - (hp + c.NEPTUNE_FISH_BOSS_HEAL * PH)) < .01);
});

test('healing charges the sky laser; it strikes the chosen room like a meteor for 10% of phase HP', () => {
  const { s, boss } = fresh(); s.godMode = false; s.playerHP = 10;
  assert.equal(e.openSkyLaser(s), false);
  for (let i = 0; i < 20; i++) { s.playerHP = 10; api.healPlayer(s, 10); }
  assert.equal(s.neptune.healCharge, c.NEPTUNE_HEAL_CHARGE_MAX);
  assert.ok(e.openSkyLaser(s)); assert.equal(s.gamePhase, 'laserTarget');
  const room = c.chamberOfTile(boss.tileX, boss.tileY);
  assert.ok(e.chooseSkyLaser(s, room)); assert.equal(s.neptune.healCharge, 0);
  const hp = boss.hp; boss.path = []; boss.pathTimer = 100000; boss.stepProgress = 0; boss.targetTileX = boss.tileX; boss.targetTileY = boss.tileY;
  for (let i = 0; i < c.NEPTUNE_LASER_WARNING + 1; i++) e.tick(s);
  assert.ok(Math.abs(hp - boss.hp - c.NEPTUNE_STRIKE_DAMAGE * PH) < 1, 'strike damage ' + (hp - boss.hp));
});

test('phase 3 hits steal life; meteors deal 10% of phase HP; tides speed movement with the flow', () => {
  const { s, boss } = fresh(); s.godMode = false;
  s.neptune.phase = 3; s.neptune.armed = [false, false, false]; boss.hp = .5 * PH;
  api.damageEnemy(s, boss, 0.0001);
  s.neptune.tides = [{ chamber: c.chamberOfTile(s.playerTileX, s.playerTileY), dirX: 1, dirY: 0, ticks: 100 }];
  s.playerTargetX = s.playerTileX + 1; s.playerTargetY = s.playerTileY;
  assert.equal(e.neptuneTideSpeed(s), c.NEPTUNE_TIDE_WITH);
  s.playerTargetX = s.playerTileX - 1; assert.equal(e.neptuneTideSpeed(s), c.NEPTUNE_TIDE_AGAINST);
  s.playerTargetX = s.playerTileX;
  // Her hits are 1.5x in phases 2-3 and, in phase 3, heal her for the damage dealt.
  s.playerHP = 100; const stolen = boss.hp; api.damagePlayer(s, 10, boss);
  assert.equal(s.playerHP, 100 - 10 * c.NEPTUNE_ATTACK_MULT[3]);
  assert.ok(Math.abs(boss.hp - (stolen + 10 * c.NEPTUNE_ATTACK_MULT[3] * c.NEPTUNE_LIFESTEAL)) < .01, 'life steal ' + boss.hp);
  // Meteors deal 10% of phase HP.
  boss.hp = .5 * PH; const room = c.chamberOfTile(boss.tileX, boss.tileY); boss.path = []; boss.pathTimer = 100000;
  s.meteoriteWarning = room; s.meteoriteStrikeIn = 1; s.playerHP = 100; e.tick(s);
  assert.ok(Math.abs(.5 * PH - boss.hp - c.NEPTUNE_STRIKE_DAMAGE * PH) < 1, 'meteor ' + boss.hp);
});

test('her HP pool is large: a single bomb is a small dent and never reaches the first dive point', () => {
  const { s, boss } = fresh();
  assert.equal(c.NEPTUNE_PHASE_HP, 2000);
  const hp = boss.hp; api.damageEnemy(s, boss, 45); assert.equal(hp - boss.hp, 45);
  api.damageEnemy(s, boss, 90); e.tick(s); assert.equal(s.neptune.dive, null, 'no dive from a couple of bombs');
});

test('God panel phase buttons jump to a phase at full phase HP, summoning her if needed', () => {
  const s = e.createModeState('trial', 'sea_chanter'); s.noMobs = true; s.godMode = true;
  e.godSetNeptunePhase(s, 3);
  const boss = s.enemies.find(x => x.type === 'sea_chanter'); assert.ok(boss, 'summoned');
  assert.equal(s.neptune.phase, 3); assert.ok(Math.abs(boss.hp - PH) < .1);
  e.godSetNeptunePhase(s, 1); assert.equal(s.neptune.phase, 1); assert.ok(Math.abs(boss.hp - 3 * PH) < .1);
  boss.hp = 2 * PH + .75 * PH - 1; e.tick(s); assert.ok(s.neptune.dive);
  e.godSetNeptunePhase(s, 2); assert.equal(s.neptune.dive, null); assert.equal(s.enemies.filter(x => x.type === 'water_clone').length, 0);
});

test('fish nearby never block manual healing', () => {
  const { s, boss } = fresh(); s.godMode = false; s.playerHP = 50;
  boss.tileX = boss.targetTileX = 40; boss.tileY = boss.targetTileY = 40;
  s.playerCarryingRuby = true; s.rubyTileX = s.rubyTileY = -1;
  for (const type of ['fish_blue', 'fish_red']) s.enemies.push({ ...boss, id: s.nextEnemyId++, type, hp: 1, maxHp: 1, sea: undefined, tileX: s.playerTileX + 1, tileY: s.playerTileY });
  assert.equal(e.canHealRuby(s), true);
});
