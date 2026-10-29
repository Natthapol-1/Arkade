const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
const { createCanvas } = require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const constants = require('../app/ruby-star/constants.ts'), engine = require('../app/ruby-star/engine.ts');
const src = fs.readFileSync('app/ruby-star/RubyStarGame.tsx', 'utf8');
const code = 'const {' + Object.keys(constants).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in constants)).join(',') + "}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');" + src.slice(src.indexOf('const BG_COLOR'), src.indexOf('// Challenge HUD centre: the guardian')) + ';exports.render={drawRubyGem,drawBombDevice,drawResourcePickup,drawRewardShield,drawPlayer,drawRewardPulses,drawGame};';
const renderer = new Module(path.resolve('app/ruby-star/preview-rewards.cjs'), module);
renderer.filename = path.resolve('app/ruby-star/preview-rewards.cjs'); renderer.paths = module.paths;
renderer._compile(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, renderer.filename);
const draw = renderer.exports.render;
const output = process.argv[2] || '.';
const canvas = createCanvas(1200, 540), ctx = canvas.getContext('2d');
ctx.fillStyle = '#101923'; ctx.fillRect(0, 0, canvas.width, canvas.height);
function label(text, column, row) {
  const x = column * 200, y = row * 270;
  ctx.strokeStyle = '#26303c'; ctx.lineWidth = 1; ctx.strokeRect(x + 8, y + 8, 184, 254);
  ctx.fillStyle = '#b8c8d9'; ctx.font = '13px monospace'; ctx.textAlign = 'center'; ctx.fillText(text, x + 100, y + 34);
}
['RUBY CORE', 'BOMB', 'POWERED BOMB', 'HEALTH PICKUP', 'ENERGY PICKUP', 'NORMAL SHIELD'].forEach((name, i) => label(name, i, 0));
draw.drawRubyGem(ctx, 100, 145, 40); draw.drawBombDevice(ctx, 300, 145, false, 40); draw.drawBombDevice(ctx, 500, 145, true, 40);
draw.drawResourcePickup(ctx, 700, 145, true, 40); draw.drawResourcePickup(ctx, 900, 145, false, 40); draw.drawRewardShield(ctx, 1100, 145, 30, 40, '#6c9ce0');
for (const [i, kind] of ['heal', 'energy', 'shield', 'speed', 'electric', 'restore'].entries()) {
  label(kind.toUpperCase() + ' REWARD', i, 1);
  const state = engine.createInitialState(), x = i * 200 + 100, y = 420;
  state.runnerEnergyFlashTicks = kind === 'energy' ? 35 : 0; state.speedActiveTicks = kind === 'speed' ? 100 : 0;
  state.electricBuffTicks = kind === 'electric' ? 100 : 0; state.playerShieldHP = kind === 'shield' ? 20 : 0;
  draw.drawPlayer(ctx, x, y, state, 40);
  state.rewardEffects = [{ target: 'player', kind, ticks: 24 }];
  draw.drawRewardPulses(ctx, state, state.playerX - x, state.playerY - y);
}
fs.writeFileSync(path.join(output, 'ruby-bomb-rewards.png'), canvas.toBuffer('image/png'));
const scene = createCanvas(1000, 700), state = engine.createInitialState();
state.noMobs = true; state.godMode = true; state.resources = [{type:'health',tileX:9,tileY:9},{type:'energy',tileX:11,tileY:9}];
engine.useBomb(state); state.playerX += 96; state.playerTileX += 2; state.playerTargetX = state.playerTileX;
draw.drawGame(scene.getContext('2d'), state, 1000, 700, 40);
fs.writeFileSync(path.join(output, 'bomb-range-border.png'), scene.toBuffer('image/png'));
