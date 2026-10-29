const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),source=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');const {drawEncounterEnemy,drawEncounterTelegraphs,drawEncounterEffects}=require('./encounter-art.ts');"+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('// Challenge HUD centre: the guardian'))+';exports.drawEnemy=drawEnemy;exports.drawGame=drawGame;';
const renderer=new Module(path.resolve('app/ruby-star/mob-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/mob-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const output=process.argv[2]||'.',prefix=process.argv[3]||'normal-monsters';
const state=engine.createInitialState();engine.godSpawnBoss(state,'fiery_king');const template=state.enemies[0];
const types=['normal','armored','fast','bomber','sniper','healer','charger','ghost','splitter','mini_splitter','shielder','energy_leech'];
function enemy(type,extra={}){return {...template,type,hp:c.ENEMY_CONFIGS[type].maxHp,maxHp:c.ENEMY_CONFIGS[type].maxHp,phaseTimer:100000,path:[],shootTicks:0,attackTimer:100,windupTicks:0,chargeDirX:0,chargeDirY:0,icyShieldHP:0,shieldTargetId:-1,...extra};}
const samples=types.map(type=>[type.toUpperCase(),enemy(type),false]);
samples.push(['SHIELDED',enemy('normal'),true],['ICE SHIELD',enemy('normal',{icyShieldHP:15}),false],['HEAL FLASH',enemy('normal',{healFlashTicks:12}),false],['BOMBER WARNING',enemy('bomber',{exploding:true,explodeTick:24}),false],['SNIPER AIM',enemy('sniper',{windupTicks:20}),false]);
samples.push(['LEECH CHARGED',enemy('energy_leech',{stolenEnergy:60}),false]);
const height=Math.ceil(samples.length/4)*260;
const canvas=createCanvas(1200,height),ctx=canvas.getContext('2d');ctx.fillStyle='#101923';ctx.fillRect(0,0,1200,height);
for(const [i,[label,mob,shielded]]of samples.entries()){
 const x=i%4*300,y=Math.floor(i/4)*260;ctx.strokeStyle='#26303c';ctx.strokeRect(x+8,y+8,284,244);
 ctx.fillStyle=c.ENEMY_CONFIGS[mob.type].color;ctx.font='14px monospace';ctx.textAlign='center';ctx.fillText(label,x+150,y+35);
 ctx.save();ctx.translate(x+150,y+155);ctx.scale(2,2);renderer.exports.drawEnemy(ctx,mob,0,0,40,shielded);ctx.restore();
 ctx.globalAlpha=1;ctx.shadowBlur=0;
}
fs.writeFileSync(path.join(output,prefix+'.png'),canvas.toBuffer('image/png'));
if(prefix==='aliens'){
 const closeup=createCanvas(600,260),detail=closeup.getContext('2d');
 detail.fillStyle='#101923';detail.fillRect(0,0,600,260);
 for(const [i,charged] of [false,true].entries()){
  detail.strokeStyle='#26303c';detail.strokeRect(i*300+8,8,284,244);
  detail.fillStyle='#c77aff';detail.font='14px monospace';detail.textAlign='center';detail.fillText(charged?'LEECH CHARGED':'ENERGY LEECH',i*300+150,35);
  detail.save();detail.translate(i*300+150,155);detail.scale(2,2);
  renderer.exports.drawEnemy(detail,enemy('energy_leech',{stolenEnergy:charged?60:0}),0,0,40,false);detail.restore();
 }
 fs.writeFileSync(path.join(output,'energy-leech.png'),closeup.toBuffer('image/png'));
}
// Actual game renderer exercises attack overlays at several life stages.
const scene=createCanvas(1000,700);state.noMobs=true;state.frostIceTiles=[];state.screenShakeTicks=0;
state.playerTileX=state.playerTargetX=11;state.playerTileY=state.playerTargetY=10;state.playerX=11.5*c.TILE_SIZE;state.playerY=10.5*c.TILE_SIZE;
state.enemies=['normal','ghost','armored','splitter','sniper','energy_leech'].map((type,i)=>enemy(type,{id:100+i,x:(8.5+i%3*3)*c.TILE_SIZE,y:(8.5+Math.floor(i/3)*5)*c.TILE_SIZE,tileX:8+i%3*3,targetTileX:8+i%3*3,tileY:8+Math.floor(i/3)*5,targetTileY:8+Math.floor(i/3)*5,targeting:'player',shootTicks:8}));
state.laserBeams=[{fromX:state.enemies[4].x,fromY:state.enemies[4].y,endX:state.playerX,endY:state.playerY,dirX:0,dirY:0,ticks:16,color:'#ff3300'}];
for(const tick of [12,40,88])renderer.exports.drawGame(scene.getContext('2d'),state,1000,700,tick);
fs.writeFileSync(path.join(output,prefix+'-attacks.png'),scene.toBuffer('image/png'));
