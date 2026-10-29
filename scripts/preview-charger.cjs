const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),e=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(e).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');const {drawEncounterEnemy,drawEncounterTelegraphs,drawEncounterEffects}=require('./encounter-art.ts');"+src.slice(src.indexOf('const BG_COLOR'),src.indexOf('// Challenge HUD centre: the guardian'))+';exports.drawGame=drawGame;';
const renderer=new Module(path.resolve('app/ruby-star/charger-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/charger-preview.cjs');renderer.paths=module.paths;renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const s=e.createInitialState();s.noMobs=true;s.noBossSpawns=true;s.godMode=true;s.meteoriteTimer=100000;
for(let y=7;y<=13;y++)for(let x=6;x<=19;x++)s.map[y][x]=c.T_FLOOR;
e.godSpawnBoss(s,'storm_reaper');s.noBossSpawns=true;const template=s.enemies[0];
s.enemies=[{...template,type:'charger',tileX:7,tileY:10,targetTileX:7,targetTileY:10,x:7.5*c.TILE_SIZE,y:10.5*c.TILE_SIZE,path:[],pathTimer:10000,attackTimer:0,windupTicks:0,chargeDirX:0,chargeDirY:0}];
s.playerTileX=s.playerTargetX=13;s.playerTileY=s.playerTargetY=10;s.playerX=13.5*c.TILE_SIZE;s.playerY=10.5*c.TILE_SIZE;s.rubyTileX=13;s.rubyTileY=11;
for(let tick=1;tick<=105;tick++){
 e.tick(s);
 if([15,40,95].includes(tick)){
  const before=JSON.stringify(s),canvas=createCanvas(1000,700);renderer.exports.drawGame(canvas.getContext('2d'),s,1000,700,tick);
  assert.equal(JSON.stringify(s),before);fs.writeFileSync(path.join(process.argv[2],`charger-${tick}.png`),canvas.toBuffer('image/png'));
 }
}
console.log('Warning, rush and recovery rendered without changing gameplay state.');
