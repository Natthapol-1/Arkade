const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;exports.drawThornGround=drawThornGround;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

function squareReaper(ctx,tickN=40){
 // Use the clean square version from the reference, with a sharp four-blade pinwheel silhouette.
 ctx.save();ctx.shadowColor='#52ffd6';ctx.shadowBlur=7;
 ctx.strokeStyle='rgba(82,255,214,.3)';ctx.lineWidth=1.5;ctx.strokeRect(-37,-37,74,74);ctx.restore();
 // Broad stepped blades with a darker outer plate and a mint inset, like Chanter's fins.
 for(let i=0;i<4;i++){
  ctx.save();ctx.rotate(i*Math.PI/2);ctx.shadowColor='#52ffd6';ctx.shadowBlur=3;
  ctx.fillStyle='#236c69';ctx.beginPath();
  ctx.moveTo(-13,-23);ctx.lineTo(-13,-29);ctx.lineTo(-2,-29);ctx.lineTo(-2,-35);
  ctx.lineTo(9,-35);ctx.lineTo(9,-41);ctx.lineTo(19,-41);ctx.lineTo(19,-23);
  ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#299e87';ctx.beginPath();
  ctx.moveTo(-5,-23);ctx.lineTo(-5,-27);ctx.lineTo(5,-27);ctx.lineTo(5,-33);
  ctx.lineTo(13,-33);ctx.lineTo(13,-37);ctx.lineTo(16,-37);ctx.lineTo(16,-23);
  ctx.closePath();ctx.fill();ctx.restore();
 }
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=5;ctx.fillStyle='#35c9ad';ctx.fillRect(-25,-25,50,50);ctx.shadowBlur=0;
 ctx.fillStyle='#0d3a33';ctx.fillRect(-21,-21,42,42);ctx.fillStyle='#195c4d';ctx.fillRect(-17,-16,34,32);
 // Compact sideways lightning bolt, with short ends instead of full-width Z bars.
 ctx.fillStyle='#062f27';ctx.beginPath();
 ctx.moveTo(-13,-8);ctx.lineTo(3,-12);ctx.lineTo(-1,-6);
 ctx.lineTo(14,-6);ctx.lineTo(-6,0);ctx.lineTo(-2,-6);
 ctx.closePath();ctx.fill();
 // Unequal mint eyes sit just below the bolt; no separate mouth.
 ctx.fillStyle='#e4fff3';ctx.fillRect(-14,3,12,9);ctx.fillRect(5,5,8,7);
 ctx.fillStyle='#1ba88b';ctx.fillRect(-11,4,6,7);ctx.fillRect(7,6,4,5);
 ctx.fillStyle='#3a967d';ctx.fillRect(-16,-3,2,2);ctx.fillRect(14,-16,2,2);
 // Electric arcs and small motes stay outside the face.
 for(const[x,y]of [[-33,-24],[33,21],[-14,35],[17,-35]]){
  ctx.strokeStyle='#c2ffec';ctx.lineWidth=1.5;ctx.shadowColor='#52ffd6';ctx.shadowBlur=3;
  ctx.beginPath();ctx.moveTo(x-3,y-3);ctx.lineTo(x+2,y);ctx.lineTo(x-1,y+2);ctx.lineTo(x+3,y+4);ctx.stroke();
 }
 ctx.shadowBlur=0;
 for(let i=0;i<8;i++){const angle=tickN*.015+i*2.4;ctx.globalAlpha=.25+i%3*.1;ctx.fillStyle='#52ffd6';ctx.fillRect(Math.round(Math.cos(angle)*42),Math.round(Math.sin(angle)*40),2,2);}ctx.globalAlpha=1;
}
const canvas=createCanvas(1080,460),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,1080,460);
for(let i=0;i<3;i++){
 ctx.fillStyle='#111923';ctx.fillRect(i*360+10,10,340,440);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*360+10.5,10.5,339,439);
 ctx.save();ctx.translate(180+i*360,270);ctx.scale(2.65,2.65);
 if(i===1)squareReaper(ctx);else{const s=engine.createInitialState();engine.godSpawnBoss(s,i===0?'splitter_queen':'sea_chanter');const boss=s.enemies[0];boss.attackTimer=200;m.exports.drawEnemy(ctx,boss,0,0,40);}ctx.restore();
 ctx.shadowBlur=0;ctx.fillStyle=['#ddaaff','#8ce5ce','#8dc9f0'][i];ctx.font='18px monospace';ctx.textAlign='center';ctx.fillText(['QUEEN — REFERENCE','REAPER — FRESH PREVIEW','CHANTER — REFERENCE'][i],180+i*360,43);
}
fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/reaper-square-fresh-preview.png',canvas.toBuffer('image/png'));
