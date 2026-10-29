const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');const {drawEncounterEnemy,drawEncounterTelegraphs,drawEncounterEffects}=require('./encounter-art.ts');"+src.slice(src.indexOf('const BG_COLOR'),src.indexOf('// Challenge HUD centre: the guardian'))+';exports.drawGame=drawGame;';
const renderer=new Module(path.resolve('app/ruby-star/reaper-seal-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/reaper-seal-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
for(const [index,[r1,c1,r2,c2]]of c.HALLWAY_BOUNDS.entries()){
 const s=engine.createInitialState(),x=Math.floor((c1+c2)/2),y=Math.floor((r1+r2)/2),horizontal=c2-c1>r2-r1;
 s.noMobs=true;s.godMode=true;s.meteoriteTimer=100000;
 s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;
 engine.godSpawnBoss(s,'storm_reaper');const boss=s.enemies[0];
 boss.tileX=boss.targetTileX=x+(horizontal?1:0);boss.tileY=boss.targetTileY=y+(horizontal?0:1);
 boss.x=(boss.tileX+.5)*c.TILE_SIZE;boss.y=(boss.tileY+.5)*c.TILE_SIZE;boss.path=[];boss.pathTimer=10000;boss.attackTimer=10000;
 engine.tick(s);assert.equal(s.hallwaySeal,index);
 for(const remaining of [240,120,10]){
  s.hallwaySealTicks=remaining;const before=JSON.stringify(s),canvas=createCanvas(1000,700);
  renderer.exports.drawGame(canvas.getContext('2d'),s,1000,700,40);
  assert.equal(JSON.stringify(s),before,'Renderer mutated seal state');
  fs.writeFileSync(path.join(process.argv[2],`reaper-seal-${index}-${remaining}.png`),canvas.toBuffer('image/png'));
 }
}
console.log('All four actual hallway seals rendered at three timer stages without state mutation.');
