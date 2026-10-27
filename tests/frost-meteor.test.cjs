const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } },
).outputText, filename);
const engine = require('../app/ruby-star/engine.ts');
const constants = require('../app/ruby-star/constants.ts');

function position(enemy, x, y) {
  enemy.tileX = enemy.targetTileX = x;
  enemy.tileY = enemy.targetTileY = y;
  enemy.x = x * constants.TILE_SIZE + constants.TILE_SIZE / 2;
  enemy.y = y * constants.TILE_SIZE + constants.TILE_SIZE / 2;
  enemy.pathTimer = enemy.attackTimer = enemy.phaseTimer = enemy.windupTicks = 100000;
  enemy.path = [];
}

function fresh() {
  const state = engine.createInitialState();
  state.godMode = true; state.noMobs = true;
  engine.godSpawnBoss(state, 'frost_warden');
  const warden = state.enemies[0];
  position(warden, 2, 2);
  const ally = { ...warden, id: state.nextEnemyId++, type: 'normal', hp: 5, maxHp: 5, path: [] };
  position(ally, 11, 10);
  state.enemies.push(ally);
  return { state, warden, ally };
}

function strike(state) {
  state.meteoriteWarning = 0; state.meteoriteStrikeIn = 1;
  engine.tick(state);
}

test('even one remaining ice-shield point prevents meteor damage without consuming the shield', () => {
  for (const shield of [1, constants.FROST_SHIELD_HP]) {
    const { state, ally } = fresh();
    ally.icyShieldHP = shield;
    strike(state);
    assert.ok(state.enemies.includes(ally));
    assert.equal(ally.hp, 5);
    assert.equal(ally.icyShieldHP, shield);
    assert.equal(state.killScore, 0);
  }
});

test('breaking the ice shield with a player attack restores normal meteor vulnerability', () => {
  const { state, ally } = fresh();
  ally.icyShieldHP = 1;
  engine.useLaser(state);
  assert.equal(ally.icyShieldHP, 0);
  assert.ok(ally.hp > 0);
  strike(state);
  assert.ok(!state.enemies.includes(ally));
});

test('unshielded enemies die and Frost Warden still takes normal boss meteor damage', () => {
  const { state, warden, ally } = fresh();
  strike(state);
  assert.ok(!state.enemies.includes(ally));
  assert.equal(warden.hp, 25);
});

test('ordinary Shielder protection does not grant meteor immunity', () => {
  const { state, warden, ally } = fresh();
  const shielder = { ...warden, id: state.nextEnemyId++, type: 'shielder', shieldTargetId: ally.id, path: [] };
  position(shielder, 12, 10);
  state.enemies.push(shielder);
  strike(state);
  assert.ok(!state.enemies.includes(ally));
  assert.ok(!state.enemies.includes(shielder));
});

test('active ice shields block all normal and powered bomb overflow, even with one point left', () => {
  for (const powered of [false, true]) {
    for (const shield of [1, constants.FROST_SHIELD_HP]) {
      const { state, ally } = fresh();
      ally.icyShieldHP = shield;
      if (powered) state.starEnergy = constants.STAR_ENERGY_MAX;
      engine.useBomb(state);
      engine.useBomb(state);
      assert.equal(ally.hp, 5);
      assert.equal(ally.icyShieldHP, 0);
      assert.ok(state.enemies.includes(ally));
      state.bombCooldown = 0;
      engine.useBomb(state); engine.useBomb(state);
      assert.ok(!state.enemies.includes(ally)); // next bomb can kill after the shield is gone
    }
  }
});

test('bomb-triggered lightning cannot bypass protection after the same blast breaks the shield', () => {
  for (const reverseOrder of [false, true]) {
    const { state, ally } = fresh();
    ally.icyShieldHP = 1;
    const neighbor = { ...ally, id: state.nextEnemyId++, hp: 200, maxHp: 200, icyShieldHP: 0, path: [] };
    position(neighbor, 12, 10);
    if (reverseOrder) state.enemies.unshift(neighbor);
    else state.enemies.push(neighbor);
    state.electricBuffTicks = 300;
    state.starEnergy = constants.STAR_ENERGY_MAX;
    engine.useBomb(state); engine.useBomb(state);
    assert.equal(ally.hp, 5);
    assert.equal(ally.icyShieldHP, 0);
    assert.ok(state.enemies.includes(ally));
  }
});

test('unshielded enemies take full bomb damage and laser damage is unchanged', () => {
  let setup = fresh();
  setup.ally.hp = setup.ally.maxHp = 100;
  engine.useBomb(setup.state); engine.useBomb(setup.state);
  assert.equal(setup.ally.hp, 100 - constants.BOMB_DMG);
  setup = fresh();
  setup.ally.icyShieldHP = constants.FROST_SHIELD_HP;
  engine.useLaser(setup.state);
  assert.equal(setup.ally.icyShieldHP, constants.FROST_SHIELD_HP - constants.LASER_DMG);
});


test('Warden shields an unprotected ally before refreshing an existing shield', () => {
  const originalRandom = Math.random;
  try {
    for (const roll of [0, .999]) {
      const { state, warden, ally } = fresh();
      ally.icyShieldHP = 1;
      const unprotected = { ...ally, id: state.nextEnemyId++, icyShieldHP: 0, path: [] };
      state.enemies.push(unprotected);
      Math.random = () => roll;
      warden.windupTicks = 1;
      engine.tick(state);
      assert.equal(ally.icyShieldHP, 1);
      assert.equal(unprotected.icyShieldHP, constants.FROST_SHIELD_HP);
      assert.equal(warden.shootTicks, 20);
    }
  } finally { Math.random = originalRandom; }
});

test('Warden can refresh an existing shield when all eligible allies are shielded', () => {
  const { state, warden, ally } = fresh();
  ally.icyShieldHP = 1;
  warden.windupTicks = 1;
  engine.tick(state);
  assert.equal(ally.icyShieldHP, constants.FROST_SHIELD_HP);
});
