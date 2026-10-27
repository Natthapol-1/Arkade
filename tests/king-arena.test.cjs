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

function position(king, x, y) {
  king.tileX = king.targetTileX = x;
  king.tileY = king.targetTileY = y;
  king.x = x * constants.TILE_SIZE + constants.TILE_SIZE / 2;
  king.y = y * constants.TILE_SIZE + constants.TILE_SIZE / 2;
  king.pathTimer = 1000000;
  king.attackTimer = 1000000;
  king.path = [];
  king.stepProgress = 0;
}

function fresh() {
  const state = engine.createInitialState();
  state.noMobs = true;
  state.meteoriteTimer = 1000000;
  state.resourceTimer = -1000000;
  state.playerCarryingRuby = false;
  state.rubyTileX = 39; state.rubyTileY = 10;
  engine.godSpawnBoss(state, 'fiery_king');
  const king = state.enemies[0];
  position(king, 47, 46);
  return { state, king };
}

function ticks(state, count) { for (let i = 0; i < count; i++) engine.tick(state); }

test('earlier warning preserves the 16.5s total delay, then deals 15 damage', () => {
  const { state, king } = fresh();
  assert.equal(constants.KING_UNTOUCHED_TICKS, 600);
  assert.equal(constants.KING_ARENA_WINDUP, 390);
  assert.equal(constants.KING_UNTOUCHED_TICKS + constants.KING_ARENA_WINDUP, 990);
  ticks(state, constants.KING_UNTOUCHED_TICKS - 1);
  assert.equal(king.king.arenaWindupTicks, 0);
  engine.tick(state);
  assert.equal(king.king.arenaWindupTicks, constants.KING_ARENA_WINDUP);
  ticks(state, constants.KING_ARENA_WINDUP - 1);
  assert.equal(state.playerHP, 100); assert.equal(state.rubyHP, 100);
  engine.tick(state);
  assert.equal(state.playerHP, 85); assert.equal(state.rubyHP, 85);
  assert.equal(state.kingArenaPulseTicks, constants.KING_ARENA_FX_TICKS);
  assert.equal(king.king.untouchedTicks, 0);
  ticks(state, constants.KING_UNTOUCHED_TICKS + constants.KING_ARENA_WINDUP);
  assert.equal(state.playerHP, 69); assert.equal(state.rubyHP, 69); // second pulse has grown to 16
});

test('pulse reaches hallways and respects damage-absorption shields', () => {
  const { state, king } = fresh();
  state.playerTileX = state.playerTargetX = 25;
  state.playerTileY = state.playerTargetY = 10;
  state.playerX = 25 * constants.TILE_SIZE + constants.TILE_SIZE / 2;
  state.playerShieldHP = state.rubyShieldHP = 10;
  king.king.arenaWindupTicks = 1;
  engine.tick(state);
  assert.equal(state.playerChamber, -1);
  assert.equal(state.playerHP, 95); assert.equal(state.rubyHP, 95);
  assert.equal(state.playerShieldHP, 0); assert.equal(state.rubyShieldHP, 0);
});

test('pulse damage grows with King age, caps at 30, and resets for a new King', () => {
  for (const [seconds, damage] of [[0, 15], [175, 22], [350, 30], [700, 30]]) {
    const { state, king } = fresh();
    king.phaseTimer = seconds * 60;
    king.king.arenaWindupTicks = 1;
    engine.tick(state);
    assert.equal(state.playerHP, 100 - damage);
    assert.equal(state.rubyHP, 100 - damage);
  }
  const { state, king } = fresh();
  king.phaseTimer = constants.KING_RAMP_SECONDS * 60;
  position(king, 11, 10);
  engine.useLaser(state);
  assert.equal(king.phaseTimer, constants.KING_RAMP_SECONDS * 60); // hits reset the warning, not age
  assert.equal(king.king.arenaWindupTicks, 0);
  engine.godSpawnBoss(state, 'fiery_king');
  assert.equal(state.enemies[0].phaseTimer, 0);
});

test('carried Ruby stays safe while the player is still hit', () => {
  const { state, king } = fresh();
  state.playerCarryingRuby = true; state.rubyTileX = state.rubyTileY = -1;
  king.king.arenaWindupTicks = 1;
  engine.tick(state);
  assert.equal(state.playerHP, 85); assert.equal(state.rubyHP, 100);
});

test('ordinary hits reset inactivity and cancel an active warning', () => {
  const { state, king } = fresh();
  position(king, 11, 10);
  king.king.untouchedTicks = 700;
  engine.useLaser(state);
  assert.ok(king.hp < king.maxHp);
  assert.equal(king.king.untouchedTicks, 0);
  king.king.untouchedTicks = constants.KING_UNTOUCHED_TICKS;
  king.king.arenaWindupTicks = 20;
  state.laserCooldown = 0;
  engine.useLaser(state);
  assert.equal(king.king.arenaWindupTicks, 0);
  position(king, 47, 46);
  ticks(state, 30);
  assert.equal(state.playerHP, 100); assert.equal(state.rubyHP, 100);
  assert.equal(king.king.untouchedTicks, 30);
});

test('meteor damage also cancels the warning', () => {
  const { state, king } = fresh();
  king.king.untouchedTicks = constants.KING_UNTOUCHED_TICKS;
  king.king.arenaWindupTicks = 30;
  state.meteoriteWarning = 3; state.meteoriteStrikeIn = 1;
  engine.tick(state);
  assert.ok(king.hp < king.maxHp && king.hp > 0);
  assert.equal(king.king.arenaWindupTicks, 0);
  assert.equal(king.king.untouchedTicks, 0);
});

test('King death or replacement removes the pending attack', () => {
  const { state, king } = fresh();
  position(king, 11, 10);
  king.king.arenaWindupTicks = 1;
  king.hp = 1;
  engine.useLaser(state);
  assert.equal(state.bossesKilled, 1);
  ticks(state, 2);
  assert.equal(state.kingArenaPulseTicks, 0);
  const next = fresh();
  next.king.king.arenaWindupTicks = 1;
  engine.godSpawnBoss(next.state, 'frost_warden');
  engine.tick(next.state);
  assert.equal(next.state.kingArenaPulseTicks, 0);
  assert.equal(next.state.playerHP, 100);
});

test('teleport menu pauses both inactivity and the warning', () => {
  const { state, king } = fresh();
  king.king.untouchedTicks = 500;
  state.gamePhase = 'teleporting';
  ticks(state, 100);
  assert.equal(king.king.untouchedTicks, 500);
  king.king.arenaWindupTicks = 30;
  ticks(state, 100);
  assert.equal(king.king.arenaWindupTicks, 30);
  assert.equal(state.kingArenaPulseTicks, 0);
});

test('warning and pulse use the selected fire cues without an extra explosion layer', () => {
  const played = [];
  const previousAudio = global.Audio;
  global.Audio = class {
    constructor(path) { this.path = path; }
    play() { played.push({ path: this.path, volume: this.volume }); return Promise.resolve(); }
  };
  try {
    const { state, king } = fresh();
    king.king.untouchedTicks = constants.KING_UNTOUCHED_TICKS - 1;
    engine.tick(state);
    king.king.arenaWindupTicks = 1;
    engine.tick(state);
    assert.ok(played.some(sound => sound.path === '/sounds/kingFireWarning.wav'));
    assert.ok(played.some(sound => sound.path === '/sounds/kingFireSpell.mp3'));
    assert.ok(!played.some(sound => /explod|explosion/i.test(sound.path)));
    for (const sound of played) assert.ok(sound.volume > 0 && sound.volume <= 1);
    for (const name of ['kingFireWarning.wav']) {
      const file = fs.readFileSync(require('node:path').join(__dirname, '../public/sounds', name));
      assert.equal(file.toString('ascii', 0, 4), 'RIFF');
      assert.equal(file.toString('ascii', 8, 12), 'WAVE');
    }
    assert.ok(fs.statSync(require('node:path').join(__dirname, '../public/sounds/kingFireSpell.mp3')).size > 0);
  } finally { global.Audio = previousAudio; }
});
