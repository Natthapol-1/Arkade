const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),source=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');"+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('// Challenge HUD centre: the guardian'))+';exports.render={drawPlayerBullet,drawPlayerLaser,drawPlayerChain,drawPlayerWave,drawPlayerCharge,drawGame};';
const renderer=new Module(path.resolve('app/ruby-star/attack-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/attack-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const draw=renderer.exports.render,output=process.argv[2]||'.';
const canvas=createCanvas(1200,720),ctx=canvas.getContext('2d');ctx.fillStyle='#101923';ctx.fillRect(0,0,1200,720);
const labels=['NORMAL BULLET · 2×','POWERED BULLET · 2×','NORMAL LASER','POWERED LASER','CHAIN LIGHTNING','NORMAL WAVE','POWERED WAVE','FULL CHARGE'];
labels.forEach((text,i)=>{const x=i%4*300,y=Math.floor(i/4)*360;ctx.strokeStyle='#26303c';ctx.strokeRect(x+8,y+8,284,344);ctx.fillStyle='#b8c8d9';ctx.font='14px monospace';ctx.textAlign='center';ctx.fillText(text,x+150,y+35);});
for(let i=0;i<2;i++){ctx.save();ctx.translate(i*300+150,180);ctx.scale(2,2);draw.drawPlayerBullet(ctx,18,0,1,0,Boolean(i),10);ctx.restore();}
draw.drawPlayerLaser(ctx,640,225,860,140,false,14);draw.drawPlayerLaser(ctx,940,225,1160,140,true,14);
draw.drawPlayerChain(ctx,40,600,260,490,18);
draw.drawPlayerWave(ctx,450,540,78,false,24);draw.drawPlayerWave(ctx,750,540,78,true,24);
draw.drawPlayerCharge(ctx,1050,540,17,1,40);ctx.fillStyle='#7aaebd';ctx.fillRect(1036,526,28,28);ctx.fillStyle='#d6f7ff';ctx.fillRect(1044,536,12,6);
fs.writeFileSync(path.join(output,'player-attacks-group1.png'),canvas.toBuffer('image/png'));
// Exercise all updated rendering paths together at early, middle and fading ages.
const scene=createCanvas(1000,700),state=engine.createInitialState();state.noMobs=true;
for(const ticks of [18,10,1]){
  state.laserBullets=[{x:12,y:10,dx:1,dy:.5,powered:true,ticks:10}];
  state.laserBeams=[{fromX:state.playerX,fromY:state.playerY,endX:state.playerX+220,endY:state.playerY-70,dirX:1,dirY:0,ticks,powered:false}];
  state.lightningArcs=[{fromX:state.playerX,fromY:state.playerY+40,toX:state.playerX+160,toY:state.playerY+100,ticks}];
  state.waveEffects=[{cx:state.playerX,cy:state.playerY,radius:80,powered:true,ticks}];
  draw.drawGame(scene.getContext('2d'),state,1000,700,40,1000);
  if(ticks===10)fs.writeFileSync(path.join(output,'player-attacks-game.png'),scene.toBuffer('image/png'));
}
