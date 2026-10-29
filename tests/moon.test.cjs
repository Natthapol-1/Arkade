const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => {
  let source = fs.readFileSync(f, 'utf8');
  if (f.endsWith('engine.ts')) source += '\nexport const moonTest = { damageEnemy, killEnemy };';
  m._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
};
const e = require('../app/ruby-star/engine.ts'), c = require('../app/ruby-star/constants.ts'), moon = require('../app/ruby-star/moon.ts'), api = e.moonTest;

function fresh() {
  const s = e.createModeState('trial', 'splitter_queen');
  s.noMobs = true; s.meteoriteTimer = 100000;
  e.godSpawnBoss(s, 'splitter_queen');
  const boss = s.enemies.find(x => x.type === 'splitter_queen');
  return { s, boss };
}
const illusions = s => s.enemies.filter(x => x.type === 'moon_illusion');
const jump = (s, boss) => { boss.phaseTimer = 1; e.tick(s); };

test('the Moon guardian has one phase of HP and starts alone', () => {
  const { s, boss } = fresh();
  assert.equal(boss.maxHp, c.MOON_PHASE_HP);
  assert.equal(s.moon.bossId, boss.id);
  assert.equal(illusions(s).length, 0);
});

test('her first jump brings four illusions, later jumps two, up to the cap; no permanent echoes', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  assert.equal(illusions(s).length, c.MOON_FIRST_CLONES);
  jump(s, boss);
  assert.equal(illusions(s).length, c.MOON_FIRST_CLONES + c.MOON_CLONES_PER_JUMP);
  for (let i = 0; i < 4; i++) jump(s, boss);
  assert.equal(illusions(s).length, c.MOON_CLONE_CAP);
  assert.equal(s.enemies.filter(x => x.type === 'queen_echo').length, 0);
  assert.equal(boss.hp, boss.maxHp, 'no jump heal');
});

test('one illusion lands in her new chamber, and none in yours', () => {
  for (let run = 0; run < 20; run++) {
    const { s, boss } = fresh();
    jump(s, boss);
    const mine = c.chamberOfTile(s.playerTileX, s.playerTileY), hers = c.chamberOfTile(boss.tileX, boss.tileY);
    assert.ok(illusions(s).some(x => c.chamberOfTile(x.tileX, x.tileY) === hers));
    assert.ok(illusions(s).every(x => c.chamberOfTile(x.tileX, x.tileY) !== mine));
  }
});

test('she takes extra damage only while revealed, just before a jump', () => {
  const { s, boss } = fresh();
  boss.phaseTimer = c.MOON_REVEAL_TICKS + 1;
  api.damageEnemy(s, boss, 10, 'player');
  assert.equal(boss.maxHp - boss.hp, 10);
  assert.ok(moon.moonWearsGuise(s, boss));
  boss.phaseTimer = c.MOON_REVEAL_TICKS;
  const before = boss.hp;
  api.damageEnemy(s, boss, 10, 'player');
  assert.equal(before - boss.hp, 10 * c.MOON_REVEAL_DAMAGE_MULT);
  assert.ok(!moon.moonWearsGuise(s, boss));
});

test('her hits are softened; illusions use their own lighter damage', () => {
  const { s, boss } = fresh();
  e.damagePlayer(s, 10, boss);
  assert.equal(c.PLAYER_MAX_HP - s.playerHP, 10 * c.MOON_QUEEN_DAMAGE_MULT);
  assert.equal(c.ENEMY_CONFIGS.moon_illusion.attackCooldown, c.ENEMY_CONFIGS.splitter_queen.attackCooldown);
});

test('an illusion shot down shatters into a ring of shards that cut you; a meteor wipes it without shards', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  const victim = illusions(s)[0];
  // Put it right next to you so the shards fly through you.
  victim.x = s.playerX + c.TILE_SIZE * 1.2; victim.y = s.playerY;
  api.killEnemy(s, s.enemies.indexOf(victim));
  assert.equal(s.moon.shards.length, c.MOON_SHARD_COUNT);
  const hp = s.playerHP;
  for (let i = 0; i < 20; i++) e.tick(s);
  assert.equal(hp - s.playerHP, c.MOON_SHARD_DAMAGE, 'one shard hits once');
  s.moon.shards = [];
  const score = s.score, energy = s.starEnergy;
  api.killEnemy(s, s.enemies.indexOf(illusions(s)[0]), true);
  assert.equal(s.moon.shards.length, 0);
  api.killEnemy(s, s.enemies.indexOf(illusions(s)[0]));
  assert.deepEqual([s.score, s.starEnergy], [score, energy], 'illusions give no rewards');
});

test('defeating her clears every illusion and wins', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  boss.hp = 1;
  api.damageEnemy(s, boss, 5, 'player');
  api.killEnemy(s, s.enemies.indexOf(boss));
  assert.equal(illusions(s).length, 0);
  e.tick(s);
  assert.equal(s.gamePhase, 'won');
});

test('C marks the nearest Queen or illusion; the mark follows her jump, lasts a while, then recharges', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  const near = [boss, ...illusions(s)].sort((a, b) => Math.hypot(a.x - s.playerX, a.y - s.playerY) - Math.hypot(b.x - s.playerX, b.y - s.playerY))[0];
  assert.equal(moon.useMoonMark(s), true);
  assert.equal(s.moon.mark.id, near.id);
  assert.equal(moon.useMoonMark(s), false, 'on cooldown');
  // Mark the Queen herself: it rides along when she jumps.
  s.moon.mark = { id: boss.id, ticks: c.MOON_MARK_TICKS };
  const from = [boss.tileX, boss.tileY];
  jump(s, boss);
  assert.notDeepEqual([boss.tileX, boss.tileY], from);
  assert.equal(s.moon.mark.id, boss.id);
  for (let i = 0; i < c.MOON_MARK_TICKS; i++) e.tick(s);
  assert.equal(s.moon.mark, null, 'expires');
  for (let i = 0; i < c.MOON_MARK_COOLDOWN; i++) e.tick(s);
  assert.equal(moon.canUseMoonMark(s), true);
});
