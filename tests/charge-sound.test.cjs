const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } },
).outputText, filename);

const sounds = [];
global.Audio = class {
  constructor(path) { this.path = path; this.paused = true; this.currentTime = 0; this.plays = 0; sounds.push(this); }
  play() { this.paused = false; this.plays++; return Promise.resolve(); }
  pause() { this.paused = true; }
};
const engine = require('../app/ruby-star/engine.ts');
const charge = () => sounds.find(sound => sound.path === '/sounds/charging.wav');

test('holding charge stretches one sample without looping or restarting each tick', () => {
  for (let i = 0; i < 100; i++) engine.startChargeSound();
  assert.equal(sounds.filter(sound => sound.path === '/sounds/charging.wav').length, 1);
  assert.equal(charge().plays, 1);
  assert.equal(charge().loop, false);
  assert.ok(charge().playbackRate > 0.73 && charge().playbackRate < 0.75);
  assert.ok(charge().volume > 0 && charge().volume <= 1);
});

test('finishing the sample early does not replay its intro before the wave fires', () => {
  charge().paused = true;
  const before = charge().plays;
  engine.startChargeSound();
  assert.equal(charge().plays, before);
});

test('release stops and resets the sample; the next charge starts fresh', () => {
  charge().currentTime = 0.3;
  engine.stopChargeSound();
  assert.equal(charge().paused, true);
  assert.equal(charge().currentTime, 0);
  assert.equal(charge().loop, false);
  engine.startChargeSound();
  assert.equal(charge().plays, 2);
});

test('wave firing and game reset stop the charge audio', () => {
  const state = engine.createInitialState();
  engine.startChargeSound();
  engine.activateWave(state);
  assert.equal(charge().paused, true);
  engine.startChargeSound();
  engine.createInitialState();
  assert.equal(charge().paused, true);
});

test('tap charges use a single non-looping instance of the same sample', () => {
  engine.stopChargeSound();
  const before = charge().plays;
  engine.playSFX_charge(); engine.playSFX_charge();
  assert.equal(charge().plays, before + 1);
  assert.equal(charge().loop, false);
  engine.stopChargeSound();
});

test('Frost Warden charge uses a slower single playback for its longer buildup', () => {
  engine.startChargeSound(1.3);
  assert.ok(charge().playbackRate > 0.45 && charge().playbackRate < 0.46);
  assert.equal(charge().loop, false);
  engine.stopChargeSound();
});
