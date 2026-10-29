const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving,devourerBodyScale}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;exports.drawThornGround=drawThornGround;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

function newReaper(ctx,tickN=40){
 // Stepped square glow: no circular ring or smooth curves.
 const halo=[[-29,-43],[29,-43],[29,-37],[38,-37],[38,-29],[43,-29],[43,29],[37,29],[37,38],[29,38],[29,43],[-29,43],[-29,37],[-38,37],[-38,29],[-43,29],[-43,-29],[-37,-29],[-37,-38],[-29,-38]];
 ctx.save();ctx.shadowColor='#52ffd6';ctx.shadowBlur=7;ctx.strokeStyle='rgba(82,255,214,.32)';ctx.lineWidth=2;
 ctx.beginPath();halo.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();ctx.restore();
 // Straight stepped dagger blades mounted directly beside the shell: no bent arms or hands.
 for(const side of [-1,1]){
  ctx.save();if(side<0)ctx.rotate(Math.PI);ctx.shadowColor='#52ffd6';ctx.shadowBlur=5;
  ctx.fillStyle='#176e5b';ctx.beginPath();
  ctx.moveTo(22,7);ctx.lineTo(27,7);ctx.lineTo(27,-18);ctx.lineTo(30,-18);
  ctx.lineTo(30,-27);ctx.lineTo(33,-27);ctx.lineTo(33,-33);ctx.lineTo(36,-33);
  ctx.lineTo(36,-23);ctx.lineTo(39,-23);ctx.lineTo(39,7);ctx.lineTo(42,7);
  ctx.lineTo(42,11);ctx.lineTo(35,11);ctx.lineTo(35,20);ctx.lineTo(31,20);
  ctx.lineTo(31,11);ctx.lineTo(22,11);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='#8de8cd';ctx.fillRect(33,-23,3,28);ctx.fillRect(30,-17,3,22);
  ctx.restore();
 }
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=5;ctx.fillStyle='#35c9ad';ctx.beginPath();
 ctx.moveTo(-18,-24);ctx.lineTo(18,-24);ctx.lineTo(18,-19);ctx.lineTo(24,-19);
 ctx.lineTo(24,18);ctx.lineTo(18,18);ctx.lineTo(18,24);ctx.lineTo(-18,24);
 ctx.lineTo(-18,19);ctx.lineTo(-24,19);ctx.lineTo(-24,-18);ctx.lineTo(-18,-18);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
 ctx.fillStyle='#0d3a33';ctx.fillRect(-19,-19,38,38);ctx.fillStyle='#1a5c4c';ctx.fillRect(-15,-14,30,29);
 // A large pixel-stepped lightning insignia runs through the entire face panel.
 const bolt=[[3,-17],[13,-17],[13,-12],[9,-12],[9,-7],[5,-7],[5,-2],[13,-2],[13,3],[9,3],[9,8],[4,8],[4,13],[-2,13],[-2,18],[-8,18],[-8,12],[-4,12],[-4,7],[0,7],[0,2],[-9,2],[-9,-3],[-5,-3],[-5,-8],[-1,-8],[-1,-13],[3,-13]];
 ctx.fillStyle='rgba(126,235,202,.65)';ctx.beginPath();bolt.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
 // Keep the eyes clear on top of the insignia; the old little Z mouth is removed.
 for(const[x,y,w]of [[-13,-10,10],[4,-4,10],[-7,7,9]]){
  ctx.fillStyle='#0c3930';ctx.fillRect(x-1,y-1,w+2,7);
  ctx.fillStyle='#d6ffed';ctx.fillRect(x,y,w,5);ctx.fillStyle='#0b3029';ctx.fillRect(x+Math.floor(w/2),y+1,3,3);
 }
 ctx.fillStyle='#3c9a7f';ctx.fillRect(-15,0,3,2);ctx.fillRect(13,10,2,3);
 // Outside crackle also uses stair-step blocks, matching the symbol and blades.
 for(const[x,y]of [[-39,-22],[36,25],[-13,40],[18,-41]]){
  ctx.shadowColor='#52ffd6';ctx.shadowBlur=3;ctx.fillStyle='#c0ffe8';
  ctx.fillRect(x-3,y-4,6,2);ctx.fillRect(x+1,y-2,2,3);ctx.fillRect(x-1,y+1,4,2);ctx.fillRect(x-1,y+3,6,2);
 }
 ctx.shadowBlur=0;
 for(let i=0;i<8;i++){const angle=tickN*.015+i*2.4;ctx.globalAlpha=.25+(i%3)*.1;ctx.fillStyle='#52ffd6';ctx.fillRect(Math.round(Math.cos(angle)*47),Math.round(Math.sin(angle)*44),2,2);}ctx.globalAlpha=1;
}
const canvas=createCanvas(520,490),ctx=canvas.getContext('2d');ctx.fillStyle='#111923';ctx.fillRect(0,0,520,490);ctx.fillStyle='#8ce5ce';ctx.font='22px monospace';ctx.textAlign='center';ctx.fillText('STORM REAPER — NEW PREVIEW',260,42);ctx.save();ctx.translate(260,280);ctx.scale(3.3,3.3);newReaper(ctx);ctx.restore();fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/reaper-hooked-preview.png',canvas.toBuffer('image/png'));
