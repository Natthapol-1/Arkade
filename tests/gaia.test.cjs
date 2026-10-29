const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => {
  let source = fs.readFileSync(f, 'utf8');
  if (f.endsWith('engine.ts')) source += '\nexport const gaiaTest = { damageEnemy, eruptThornField, killEnemy };';
  m._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
};
const e = require('../app/ruby-star/engine.ts'), c = require('../app/ruby-star/constants.ts'), api = e.gaiaTest, g = require('../app/ruby-star/gaia.ts');
const PH = c.GAIA_PHASE_HP, idx = (x, y) => y * c.MAP_COLS + x;

function fresh() {
  const s = e.createModeState('trial', 'thorn_weaver');
  s.noMobs = true; s.godMode = true; s.meteoriteTimer = 100000; s.gaia.pollenTimer = 100000; s.gaia.podTimer = 100000;
  e.godSpawnBoss(s, 'thorn_weaver');
  const boss = s.enemies.find(x => x.type === 'thorn_weaver');
  boss.thorn.cooldown = 100000;
  return { s, boss };
}
const roomTiles = (s, room) => {
  const [r1, c1, r2, c2] = c.CHAMBER_BOUNDS[room], out = [];
  for (let y = r1; y <= r2; y++) for (let x = c1; x <= c2; x++) if (s.map[y][x] === c.T_FLOOR) out.push([x, y]);
  return out;
};

test('the Gaia guardian carries three phases, with eight Sunstones two per room', () => {
  const { s, boss } = fresh();
  assert.equal(boss.maxHp, 3 * PH);
  assert.equal(s.gaia.stones.length, 8);
  for (let room = 0; room < 4; room++) assert.equal(s.gaia.stones.filter(st => c.chamberOfTile(st.x, st.y) === room).length, 2);
});

test('she grows vines around her, and the laser clears them and charges Sunfire', () => {
  const { s, boss } = fresh();
  for (let i = 0; i < c.GAIA_TRAIL_GAP * 2 + 1; i++) e.tick(s);
  assert.ok(s.gaia.growth.some(g => g >= 1), 'growth appeared');
  // A row of vines next to the player is cleared by one laser.
  const y = s.playerTileY;
  for (let x = s.playerTileX + 1; x <= s.playerTileX + 3; x++) s.gaia.growth[idx(x, y)] = 2;
  e.useLaser(s);
  assert.equal(s.gaia.growth[idx(s.playerTileX + 1, y)], 1);
  assert.ok(s.gaia.sunCharge >= 3);
  void boss;
});

test('a field landing on a lit Sunstone burns away, costs the boss its Sunstone share and the stone moves room', () => {
  const { s, boss } = fresh();
  const stone = s.gaia.stones[0], room = c.chamberOfTile(stone.x, stone.y), hp = boss.hp;
  api.eruptThornField(s, boss, (stone.x + .5) * c.TILE_SIZE, (stone.y + .5) * c.TILE_SIZE);
  assert.equal(s.thornPatches.length, 0, 'no thorn patch');
  assert.ok(Math.abs(hp - boss.hp - c.GAIA_STONE_SELF_DAMAGE * PH) < .01);
  assert.notEqual(c.chamberOfTile(stone.x, stone.y), room);
  assert.equal(stone.lit, false);
  for (let i = 0; i < c.GAIA_STONE_TRAVEL + c.GAIA_STONE_RELIGHT + 2; i++) e.tick(s);
  assert.equal(stone.lit, true);
});

test('damage cannot skip a phase; at the floor she withers, then phase 2 begins', () => {
  const { s, boss } = fresh();
  api.damageEnemy(s, boss, 5000);
  assert.ok(boss.hp > 2 * PH && boss.hp < 2 * PH + 1);
  e.tick(s); assert.ok(s.gaia.wither > 0);
  const before = boss.hp; api.damageEnemy(s, boss, 100); assert.equal(boss.hp, before, 'immune while withering');
  for (let i = 0; i < c.GAIA_WITHER_TICKS + 2; i++) e.tick(s);
  assert.equal(s.gaia.phase, 2);
});

test("Ruby's ward keeps ground clean, and a closed ring of vines squeezes Ruby", () => {
  const { s } = fresh();
  s.godMode = false; s.rubyShieldHP = 0;
  const rx = s.rubyTileX, ry = s.rubyTileY;
  s.gaia.growth[idx(rx + 1, ry)] = 3;
  for (let y = ry - 3; y <= ry + 3; y++) for (let x = rx - 3; x <= rx + 3; x++) if (Math.max(Math.abs(x - rx), Math.abs(y - ry)) === 3) s.gaia.growth[idx(x, y)] = 2;
  const ruby = s.rubyHP;
  for (let i = 0; i < 61; i++) e.tick(s);
  assert.equal(s.gaia.growth[idx(rx + 1, ry)], 0, 'ward cleared');
  assert.equal(s.gaia.ringClosure, 1);
  assert.ok(s.rubyHP < ruby, 'ring squeezes Ruby');
});

test('a partial Sunfire bursts around you at once; more charge reaches further and hurts her more', () => {
  const { s, boss } = fresh();
  // Put her right next to you.
  boss.tileX = boss.targetTileX = s.playerTileX + 1; boss.tileY = boss.targetTileY = s.playerTileY;
  assert.equal(g.useSunfire(s), false, 'needs a minimum charge');
  const burst = charge => {
    const { s: t, boss: b } = fresh();
    b.tileX = b.targetTileX = t.playerTileX + 1; b.tileY = b.targetTileY = t.playerTileY;
    for (let x = t.playerTileX - 8; x <= t.playerTileX + 8; x++) if (t.map[t.playerTileY][x] === c.T_FLOOR) t.gaia.growth[idx(x, t.playerTileY)] = 2;
    t.gaia.sunCharge = charge; const hp = b.hp;
    assert.equal(g.useSunfire(t), true);
    const cleared = [...Array(9).keys()].filter(d => t.gaia.growth[idx(t.playerTileX + d, t.playerTileY)] === 0).length;
    return { lost: hp - b.hp, cleared, left: t.gaia.sunCharge, wound: t.gaia.sunfire };
  };
  const small = burst(c.GAIA_SUN_MIN), big = burst(c.GAIA_SUN_MAX - 1);
  assert.ok(big.lost > small.lost, 'more damage'); assert.ok(big.cleared > small.cleared, 'more reach');
  assert.equal(small.left, 0); assert.equal(small.wound, null, 'partial is instant');
});

test('a full Sunfire winds up, then burns the chosen room: you take damage if inside, and she is hit hard there', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.playerShieldHP = 0;
  const room = c.chamberOfTile(s.playerTileX, s.playerTileY);
  const tiles = roomTiles(s, room).filter(([x, y]) => x !== s.playerTileX || y !== s.playerTileY);
  for (const [x, y] of tiles) s.gaia.growth[idx(x, y)] = 2;
  const spot = tiles.find(([x, y]) => Math.abs(x - s.playerTileX) + Math.abs(y - s.playerTileY) > 3);
  boss.tileX = boss.targetTileX = spot[0]; boss.tileY = boss.targetTileY = spot[1];
  s.gaia.sunCharge = c.GAIA_SUN_MAX;
  assert.equal(g.useSunfire(s), true);
  assert.equal(s.gamePhase, 'laserTarget', 'a full charge opens the room picker');
  assert.equal(e.chooseSkyLaser(s, room), true);
  assert.equal(s.gaia.sunfire.chamber, room); assert.equal(s.gaia.sunCharge, 0);
  assert.equal(g.useSunfire(s), false, 'cannot fire again while winding up');
  const hp = boss.hp, playerHP = s.playerHP;
  for (let i = 0; i < c.GAIA_SUN_WARNING + 1; i++) e.tick(s);
  assert.equal(g.gaiaRoomShare(s, room), 0);
  assert.ok(Math.abs(hp - boss.hp - c.GAIA_STRIKE_DAMAGE * PH) < 1, 'full Sunfire: ' + (hp - boss.hp));
  assert.ok(playerHP - s.playerHP >= c.GAIA_SUN_SELF_DAMAGE - .01, 'self damage');
});

test('seed pods burst into thicket unless broken; breaking one charges Sunfire', () => {
  const { s } = fresh();
  s.gaia.podTimer = 1; e.tick(s);
  const pod = s.enemies.find(x => x.type === 'seed_pod'); assert.ok(pod);
  const charge = s.gaia.sunCharge;
  api.damageEnemy(s, pod, 100);
  assert.equal(s.gaia.sunCharge, charge + c.GAIA_POD_CHARGE);
  s.gaia.podTimer = 1; e.tick(s);
  const pod2 = s.enemies.find(x => x.type === 'seed_pod' && x.hp > 0); pod2.windupTicks = 1;
  s.playerCarryingRuby = true; s.rubyTileX = -1; // no ward in the way of a random pod
  s.gaia.stones = []; e.tick(s);
  assert.equal(s.gaia.growth[idx(pod2.tileX, pod2.tileY)], 3);
});

test('meteors scorch their room', () => {
  const { s } = fresh();
  for (const [x, y] of roomTiles(s, 1)) s.gaia.growth[idx(x, y)] = 2;
  s.meteoriteWarning = 1; s.meteoriteStrikeIn = 1; e.tick(s);
  assert.equal(g.gaiaRoomShare(s, 1), 0);
});

test("Gaia's Roots comes back 40s after a cast in this challenge", () => {
  const { s } = fresh();
  assert.equal(s.specialSkill, 'thorn_weaver');
  e.useSpecialSkill(s); e.tick(s);
  assert.equal(s.trial.cooldown, 2400);
  for (let i = 0; i < 2400; i++) e.tick(s);
  assert.equal(s.specialSkill, 'thorn_weaver');
});

test('standing in his thorn field hurts more on this map', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.playerShieldHP = 0; s.gaia.stones = [];
  s.thornPatches = [{ x: s.playerX, y: s.playerY, radius: c.THORN_RADIUS, ticks: 500, ownerId: boss.id }];
  e.tick(s); const hp = s.playerHP;
  for (let i = 0; i < c.THORN_CONTACT_INTERVAL; i++) e.tick(s);
  assert.ok(hp - s.playerHP >= c.GAIA_THORN_CONTACT_DAMAGE, 'contact: ' + (hp - s.playerHP));
});

test('a placed Ruby inside his thorn field takes a small continuous damage', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.rubyShieldHP = 0; s.gaia.stones = [];
  s.thornPatches = [{ x: (s.rubyTileX + .5) * c.TILE_SIZE, y: (s.rubyTileY + .5) * c.TILE_SIZE, radius: c.THORN_RADIUS, ticks: 500, ownerId: boss.id }];
  const ruby = s.rubyHP;
  for (let i = 0; i < c.THORN_CONTACT_INTERVAL + 1; i++) e.tick(s);
  assert.equal(ruby - s.rubyHP, c.GAIA_THORN_RUBY_DAMAGE);
});

test('a field erupting on placed Ruby cuts it for less than you; staying inside is small', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.rubyShieldHP = 0; s.gaia.stones = [];
  const ruby = s.rubyHP;
  api.eruptThornField(s, boss, (s.rubyTileX + .5) * c.TILE_SIZE, (s.rubyTileY + .5) * c.TILE_SIZE);
  assert.equal(ruby - s.rubyHP, c.GAIA_THORN_RUBY_CUT);
});

test('a full Sunfire on another room spares you and Ruby', () => {
  const { s } = fresh();
  s.godMode = false; s.playerShieldHP = 0; s.rubyShieldHP = 0;
  const mine = c.chamberOfTile(s.playerTileX, s.playerTileY), other = (mine + 1) % 4;
  s.gaia.sunCharge = c.GAIA_SUN_MAX; g.useSunfire(s); e.chooseSkyLaser(s, other);
  const hp = s.playerHP, ruby = s.rubyHP;
  for (let i = 0; i < c.GAIA_SUN_WARNING + 1; i++) e.tick(s);
  assert.equal(s.playerHP, hp); assert.equal(s.rubyHP, ruby);
});

test('an angry mushroom hit knocks you back two tiles, and it leaves vines where it runs', () => {
  const { s } = fresh();
  s.enemies = s.enemies.filter(x => x.type !== 'thorn_weaver');
  const tile = [s.playerTileX - 1, s.playerTileY];
  const m = { ...s.enemies[0] ?? {}, id: 500, type: 'angry_mushroom', x: (tile[0] + .5) * c.TILE_SIZE, y: (tile[1] + .5) * c.TILE_SIZE, tileX: tile[0], tileY: tile[1],
    targetTileX: tile[0], targetTileY: tile[1], stepProgress: 0, hp: 8, maxHp: 8, path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
    pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0, shootTicks: 0, exploding: false, explodeTick: 0, windupTicks: 0,
    chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1, phaseTimer: 0, icyShieldHP: 0 };
  s.enemies.push(m);
  const startX = s.playerTileX;
  for (let i = 0; i < 40 && !s.playerKnockback; i++) e.tick(s);
  assert.ok(s.playerKnockback, 'knocked back'); assert.equal(s.playerKnockback.tilesLeft, c.GAIA_MUSHROOM_KNOCKBACK);
  for (let i = 0; i < 60; i++) e.tick(s);
  assert.ok(s.playerTileX - startX >= 2, 'pushed two tiles: ' + (s.playerTileX - startX));
  // Away from Ruby's ward (which keeps its own ground clean), it grows the tile it stands on.
  const far = [s.rubyTileX + 6, s.rubyTileY]; m.tileX = m.targetTileX = far[0]; m.tileY = m.targetTileY = far[1]; m.x = (far[0] + .5) * c.TILE_SIZE; m.y = (far[1] + .5) * c.TILE_SIZE;
  s.gaia.growth.fill(0); m.attackTimer = 1e9; m.pathTimer = 1e9; m.path = [];
  for (let i = 0; i < 31; i++) { e.tick(s); m.tileX = m.targetTileX = far[0]; m.tileY = m.targetTileY = far[1]; }
  assert.ok(s.gaia.growth[idx(far[0], far[1])] >= 1, 'vines where it runs');
});

test('when not fleeing she walks to nearby overgrowth and lingers there', () => {
  const { s, boss } = fresh();
  s.gaia.growth.fill(0); s.gaia.trailTimer = 1e9; s.gaia.creepTimer = 1e9;
  s.playerCarryingRuby = true; s.rubyTileX = -1; s.gaia.stones = []; // no ward or stone in the way of the test thicket
  const px = boss.tileX > 25 ? 5 : 45, py = boss.tileY > 25 ? 5 : 45; // the opposite room, out of her flee range
  s.playerTileX = s.playerTargetX = px; s.playerTileY = s.playerTargetY = py; s.playerX = (px + .5) * c.TILE_SIZE; s.playerY = (py + .5) * c.TILE_SIZE;
  // A floor tile 4 away in some direction (a room edge can put walls on one side).
  const goal = [[4, 0], [-4, 0], [0, 4], [0, -4]].map(([dx, dy]) => [boss.tileX + dx, boss.tileY + dy]).find(([x, y]) => s.map[y]?.[x] === c.T_FLOOR);
  s.gaia.growth[idx(goal[0], goal[1])] = 3;
  boss.pathTimer = 0;
  for (let i = 0; i < 1500 && (boss.tileX !== goal[0] || boss.tileY !== goal[1]); i++) e.tick(s);
  assert.deepEqual([boss.tileX, boss.tileY], goal, 'reached the thicket');
  for (let i = 0; i < 120; i++) e.tick(s);
  assert.deepEqual([boss.tileX, boss.tileY], goal, 'lingers there');
});

test('phase 3 plays like phase 2 (she walks, pods, blossoms and snares) and ends when her HP runs out', () => {
  const { s, boss } = fresh();
  g.godSetGaiaPhase(s, 3);
  assert.equal(s.gaia.phase, 3);
  s.gaia.snareTimer = 1; s.gaia.blossomTimer = 1; s.gaia.podTimer = 1; e.tick(s);
  assert.ok(s.gaia.snares.length > 0, 'snares');
  assert.ok(s.enemies.some(x => x.type === 'blossom'), 'blossoms');
  assert.ok(s.enemies.some(x => x.type === 'seed_pod'), 'pods');
  api.damageEnemy(s, boss, boss.hp + 10);
  for (let i = s.enemies.length - 1; i >= 0; i--) if (s.enemies[i].hp <= 0) api.killEnemy(s, i);
  assert.equal(s.gamePhase, 'won');
});

test('meteors deal a share of the phase and ignore thicket armor', () => {
  const { s, boss } = fresh();
  s.gaia.growth[idx(boss.tileX, boss.tileY)] = 3;
  const room = c.chamberOfTile(boss.tileX, boss.tileY), hp = boss.hp;
  s.meteoriteWarning = room; s.meteoriteStrikeIn = 1; e.tick(s);
  assert.ok(Math.abs(hp - boss.hp - c.GAIA_STRIKE_DAMAGE * PH) < 2, 'meteor: ' + (hp - boss.hp));
});

test('at three blossoms a new one replaces the oldest', () => {
  const { s, boss } = fresh();
  g.godSetGaiaPhase(s, 2); s.gaia.snareTimer = 1e9;
  for (let i = 0; i < 3; i++) { s.gaia.blossomTimer = 1; e.tick(s); }
  const before = s.enemies.filter(x => x.type === 'blossom').map(x => x.id);
  assert.equal(before.length, 3);
  s.gaia.blossomTimer = 1; e.tick(s);
  const after = s.enemies.filter(x => x.type === 'blossom').map(x => x.id);
  assert.equal(after.length, 3); assert.ok(!after.includes(Math.min(...before)), 'oldest removed');
  void boss;
});

test('breaking a blossom costs the boss a little of the phase', () => {
  const { s, boss } = fresh();
  g.godSetGaiaPhase(s, 2); s.gaia.snareTimer = 1e9; s.gaia.blossomTimer = 1; e.tick(s);
  const blossom = s.enemies.find(x => x.type === 'blossom'); assert.ok(blossom);
  s.playerHP = 50; const hp = boss.hp; api.damageEnemy(s, blossom, 100);
  assert.ok(Math.abs(hp - boss.hp - c.GAIA_BLOSSOM_SELF_DAMAGE * PH) < 1, 'self damage: ' + (hp - boss.hp));
  assert.equal(s.playerHP, 50 + c.GAIA_BLOSSOM_KILL_HEAL, 'heals you');
});

test('phase 3 casts two fields: one on you, one blocking the way to your nearest Sunstone', () => {
  const { s, boss } = fresh();
  g.godSetGaiaPhase(s, 3); s.gaia.snareTimer = s.gaia.blossomTimer = s.gaia.podTimer = 1e9;
  s.gaia.stones = [{ x: s.playerTileX + 8, y: s.playerTileY, fromX: 0, fromY: 0, lit: true, travel: 0, relight: 0 }];
  boss.thorn.cooldown = 0; e.tick(s);
  assert.ok(boss.thorn.aim2, 'second field');
  assert.ok(boss.thorn.aim2.x > boss.thorn.aimX, 'toward the stone');
  const patches = s.thornPatches.length;
  for (let i = 0; i < c.THORN_WINDUP; i++) e.tick(s);
  assert.ok(s.thornPatches.length >= patches + 2, 'both erupted');
});

test('in phase 3 lit Sunstones hop two tiles every couple of seconds', () => {
  const { s } = fresh();
  g.godSetGaiaPhase(s, 3);
  // A tile with open floor around it and at least one clear two-tile hop.
  const open3 = (x, y) => { for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (s.map[y + oy]?.[x + ox] !== c.T_FLOOR) return false; return true; };
  let spot = null;
  for (let y = 3; y < 48 && !spot; y++) for (let x = 3; x < 48 && !spot; x++) {
    if (c.chamberOfTile(x, y) < 0 || !open3(x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => [1, 2].every(k => open3(x + dx * k, y + dy * k) && c.chamberOfTile(x + dx * k, y + dy * k) === c.chamberOfTile(x, y)))) spot = [x, y];
  }
  assert.ok(spot, 'open area');
  s.gaia.stones = [{ x: spot[0], y: spot[1], fromX: spot[0], fromY: spot[1], lit: true, travel: 0, relight: 0 }];
  for (let i = 0; i < c.GAIA_STONE_DRIFT_GAP + 1; i++) e.tick(s);
  const st = s.gaia.stones[0];
  assert.equal(Math.abs(st.x - spot[0]) + Math.abs(st.y - spot[1]), c.GAIA_STONE_DRIFT_STEP, 'moved two tiles');
});

test('phase 3 lifeblooms sprout; breaking one heals you and Ruby; unbroken ones fade', () => {
  const { s } = fresh();
  g.godSetGaiaPhase(s, 3); s.gaia.snareTimer = s.gaia.blossomTimer = s.gaia.podTimer = 1e9;
  s.gaia.lifebloomTimer = 1; e.tick(s);
  const bloom = s.enemies.find(x => x.type === 'lifebloom'); assert.ok(bloom, 'sprouted');
  s.playerHP = 50; s.rubyHP = 50;
  api.damageEnemy(s, bloom, 1);
  assert.equal(s.playerHP, 50 + c.GAIA_LIFEBLOOM_HEAL); assert.equal(s.rubyHP, 50 + c.GAIA_LIFEBLOOM_HEAL);
  s.gaia.lifebloomTimer = 1; e.tick(s);
  const next = s.enemies.find(x => x.type === 'lifebloom' && x.hp > 0); assert.ok(next);
  s.gaia.lifebloomTimer = 1e9; for (let i = 0; i < c.GAIA_LIFEBLOOM_LIFE + 1; i++) e.tick(s);
  assert.ok(!s.enemies.includes(next), 'faded');
});
