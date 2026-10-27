const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;exports.drawThornGround=drawThornGround;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

function squareReaper(ctx,tickN=40){
 ctx.save();ctx.shadowBlur=0;
 // Offset rectangular blade plates form a compact, asymmetric silhouette.
 ctx.fillStyle='#24756c';
 ctx.fillRect(-34,-31,10,40);ctx.fillRect(-29,-36,15,10);
 ctx.fillRect(24,-9,10,40);ctx.fillRect(14,26,15,10);
 ctx.fillRect(-30,9,6,10);ctx.fillRect(24,-19,6,10);
 ctx.fillStyle='#39bca0';ctx.fillRect(-31,-28,4,29);ctx.fillRect(27,1,4,27);
 // Small opposing rectangular prongs continue the offset silhouette.
 ctx.fillStyle='rgba(53,201,173,.65)';ctx.fillRect(8,-32,7,10);ctx.fillRect(-15,22,7,10);
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=6;ctx.fillStyle='#35c9ad';ctx.fillRect(-24,-24,48,48);ctx.shadowBlur=0;
 ctx.fillStyle='#0d3a33';ctx.fillRect(-20,-20,40,40);
 ctx.fillStyle='#195c4d';ctx.fillRect(-16,-16,32,32);
 // One severe rectangular alien eye beneath a stepped brow.
 ctx.fillStyle='#082e29';ctx.fillRect(-17,-11,30,5);ctx.fillRect(-4,-8,21,5);
 ctx.fillStyle='#d6fff0';ctx.fillRect(-14,-4,28,8);
 ctx.fillStyle='#159c81';ctx.fillRect(3,-4,6,8);
 ctx.fillStyle='#082e29';ctx.fillRect(-14,4,28,3);
 // Offset mouth slit and sparse inner markings, all rectangular.
 ctx.fillStyle='#082e29';ctx.fillRect(-8,12,20,4);ctx.fillRect(8,8,4,4);
 ctx.fillStyle='#77dac0';ctx.fillRect(-7,12,9,2);
 ctx.fillStyle='#348775';ctx.fillRect(-17,10,3,6);ctx.fillRect(12,-17,5,3);
 // Broken square electrical aura and rectangular sparks.
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=4;ctx.fillStyle='rgba(82,255,214,.3)';
 ctx.fillRect(-41,-39,20,1.5);ctx.fillRect(-41,-39,1.5,60);ctx.fillRect(-41,21,10,1.5);
 ctx.fillRect(21,38,20,1.5);ctx.fillRect(39.5,-21,1.5,60);ctx.fillRect(31,-21,10,1.5);
 ctx.shadowBlur=0;
 for(let i=0;i<13;i++){const angle=tickN*.015+i*2.4;ctx.globalAlpha=.2+i%3*.13;ctx.fillStyle='#52ffd6';ctx.fillRect(Math.round(Math.cos(angle)*46),Math.round(Math.sin(angle)*43),i%3===0?5:2,2);}
 ctx.restore();
}
const canvas=createCanvas(1080,460),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,1080,460);
for(let i=0;i<3;i++){
 ctx.fillStyle='#111923';ctx.fillRect(i*360+10,10,340,440);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*360+10.5,10.5,339,439);
 ctx.save();ctx.translate(180+i*360,270);ctx.scale(2.65,2.65);
 if(i===1)squareReaper(ctx);else{const s=engine.createInitialState();engine.godSpawnBoss(s,i===0?'splitter_queen':'sea_chanter');const boss=s.enemies[0];boss.attackTimer=200;m.exports.drawEnemy(ctx,boss,0,0,40);}ctx.restore();
 ctx.shadowBlur=0;ctx.fillStyle=['#ddaaff','#8ce5ce','#8dc9f0'][i];ctx.font='18px monospace';ctx.textAlign='center';ctx.fillText(['QUEEN — REFERENCE','REAPER — FRESH PREVIEW','CHANTER — REFERENCE'][i],180+i*360,43);
}
fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/reaper-rectangular-preview.png',canvas.toBuffer('image/png'));
