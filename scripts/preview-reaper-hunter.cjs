const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving,devourerBodyScale}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;exports.drawThornGround=drawThornGround;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

function squareReaper(ctx,tickN=40){
 const poly=(pts,color)=>{ctx.fillStyle=color;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
 ctx.save();ctx.shadowBlur=0;
 // A pair of broad hooked carapace blades grow directly from the shoulders.
 for(const side of [-1,1]){
  ctx.save();ctx.scale(side,1);
  ctx.shadowColor='#52ffd6';ctx.shadowBlur=4;
  poly([[19,-18],[30,-26],[38,-26],[38,12],[33,23],[27,32],[27,11],[23,6]],'#24756c');
  ctx.shadowBlur=0;
  poly([[30,-19],[34,-19],[34,10],[30,18],[30,6],[27,2]],'#39bca0');
  // Small backward crest, broad and flat rather than a horn.
  poly([[10,-23],[10,-32],[22,-38],[22,-27],[19,-21]],'#24756c');
  poly([[14,-25],[14,-30],[18,-32],[18,-25]],'#39bca0');
  ctx.restore();
 }
 // Compact square body, with an inset flat face like Queen and Chanter.
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=6;ctx.fillStyle='#35c9ad';ctx.fillRect(-24,-24,48,48);ctx.shadowBlur=0;
 ctx.fillStyle='#0d3a33';ctx.fillRect(-20,-20,40,40);
 ctx.fillStyle='#195c4d';ctx.fillRect(-16,-16,32,32);
 // A lowered brow and inward-cut eyes form a focused, aggressive expression.
 poly([[-16,-10],[-3,-6],[-3,1],[-16,-2]],'#d6fff0');
 poly([[3,-6],[16,-10],[16,-2],[3,1]],'#d6fff0');
 ctx.fillStyle='#179b80';ctx.fillRect(-8,-5,4,5);ctx.fillRect(4,-5,4,5);
 poly([[-17,-14],[-2,-9],[-2,-5],[-17,-10]],'#082e29');
 poly([[2,-9],[17,-14],[17,-10],[2,-5]],'#082e29');
 // An angular jaw plate with three separated mint slits, not a smiling mouth.
 poly([[-11,7],[11,7],[11,14],[6,19],[-6,19],[-11,14]],'#092f29');
 ctx.fillStyle='#77dac0';ctx.fillRect(-7,9,3,5);ctx.fillRect(-1,9,3,7);ctx.fillRect(5,9,3,5);
 ctx.fillStyle='#348775';ctx.fillRect(-17,3,4,2);ctx.fillRect(13,3,4,2);
 ctx.fillStyle='#24756c';ctx.fillRect(-10,24,6,4);ctx.fillRect(4,24,6,4);
 // Short angular electrical trails leave the silhouette readable.
 ctx.strokeStyle='rgba(82,255,214,.36)';ctx.lineWidth=1.4;ctx.shadowColor='#52ffd6';ctx.shadowBlur=4;
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*24,-43);ctx.lineTo(side*42,-32);ctx.lineTo(side*42,15);ctx.lineTo(side*33,32);ctx.stroke();}
 ctx.shadowBlur=0;
 for(let i=0;i<13;i++){const angle=tickN*.015+i*2.4;ctx.globalAlpha=.2+i%3*.13;ctx.fillStyle='#52ffd6';ctx.fillRect(Math.round(Math.cos(angle)*46),Math.round(Math.sin(angle)*43),2,2);}
 ctx.restore();
}
const canvas=createCanvas(1080,460),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,1080,460);
for(let i=0;i<3;i++){
 ctx.fillStyle='#111923';ctx.fillRect(i*360+10,10,340,440);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*360+10.5,10.5,339,439);
 ctx.save();ctx.translate(180+i*360,270);ctx.scale(2.65,2.65);
 if(i===1)squareReaper(ctx);else{const s=engine.createInitialState();engine.godSpawnBoss(s,i===0?'splitter_queen':'sea_chanter');const boss=s.enemies[0];boss.attackTimer=200;m.exports.drawEnemy(ctx,boss,0,0,40);}ctx.restore();
 ctx.shadowBlur=0;ctx.fillStyle=['#ddaaff','#8ce5ce','#8dc9f0'][i];ctx.font='18px monospace';ctx.textAlign='center';ctx.fillText(['QUEEN — REFERENCE','REAPER — FRESH PREVIEW','CHANTER — REFERENCE'][i],180+i*360,43);
}
fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/reaper-new-hunter-preview.png',canvas.toBuffer('image/png'));
