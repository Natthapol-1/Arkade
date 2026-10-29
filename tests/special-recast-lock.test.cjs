const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
const e = require('../app/ruby-star/engine.ts'), c = require('../app/ruby-star/constants.ts');

test('endless: a fresh celestial skill cannot be fired until the recast lock ends', () => {
  const s = e.createInitialState(); s.gamePhase = 'playing'; s.noMobs = true;
  s.specialSkill = 'frost_warden';
  assert.equal(e.useSpecialSkill(s), true);
  s.specialSkill = 'frost_warden'; // as if the cast's kill granted a new one
  assert.equal(e.useSpecialSkill(s), false, 'blocked right after a cast');
  assert.equal(s.specialSkill, 'frost_warden', 'the new skill is kept');
  for (let i = 0; i < c.SPECIAL_RECAST_LOCK; i++) e.tick(s);
  assert.equal(e.useSpecialSkill(s), true, 'usable once the lock ends');
});

test('challenge skills are not affected by the recast lock', () => {
  const s = e.createModeState('trial', 'fiery_king'); s.gamePhase = 'playing';
  e.useSpecialSkill(s);
  assert.equal(s.specialLockTicks, 0);
});
