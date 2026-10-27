const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;exports.drawThornGround=drawThornGround;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

function squareReaper(ctx,tickN=40){
 ctx.save();ctx.shadowBlur=0;
 // Angular electric wake: open corners leave the silhouette and face clear.
 ctx.strokeStyle='rgba(82,255,214,.32)';ctx.lineWidth=1.5;ctx.shadowColor='#52ffd6';ctx.shadowBlur=5;
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*16,-40);ctx.lineTo(side*40,-40);ctx.lineTo(side*40,-23);ctx.moveTo(side*40,22);ctx.lineTo(side*40,39);ctx.lineTo(side*21,39);ctx.stroke();}
 ctx.shadowBlur=0;
 // Four compact swept blades attach to every side of the square.
 for(let i=0;i<4;i++){
  ctx.save();ctx.rotate(i*Math.PI/2);ctx.translate(23,-3);ctx.scale(.72,.72);ctx.translate(-23,3);
  ctx.shadowColor='#52ffd6';ctx.shadowBlur=5;
  ctx.fillStyle='rgba(35,132,112,.75)';
  ctx.fillRect(19,-19,12,25);ctx.fillRect(26,-28,10,19);ctx.fillRect(32,-35,9,17);
  ctx.shadowBlur=0;ctx.fillStyle='#3ac5a5';ctx.fillRect(25,-18,4,16);ctx.fillRect(30,-26,4,14);ctx.fillRect(35,-32,3,11);
  ctx.restore();
 }
 // Square hood rim, its stepped top and long lower corners frame a dark alien face.
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=6;ctx.fillStyle='#35c9ad';ctx.fillRect(-24,-24,48,48);ctx.shadowBlur=0;
 ctx.fillStyle='#0d3a33';ctx.fillRect(-20,-20,40,40);
 ctx.fillStyle='#195c4d';ctx.fillRect(-16,-15,32,29);
 ctx.fillStyle='#082e29';ctx.fillRect(-15,-12,30,6);ctx.fillRect(-19,-5,4,17);ctx.fillRect(15,-5,4,17);
 // A single offset eye gives the hunter an alien, intent stare.
 ctx.fillStyle='#082e29';ctx.fillRect(-16,-13,32,17);
 ctx.fillStyle='#d6fff0';ctx.fillRect(-13,-8,26,8);
 ctx.fillStyle='#24af92';ctx.fillRect(3,-8,6,8);
 // Dark stepped lid narrows one side of the eye, without a separate eyebrow.
 ctx.fillStyle='#082e29';ctx.fillRect(-13,-8,10,3);ctx.fillRect(-3,-8,6,1);
 // One short lightning-shaped jaw mark replaces the exposed teeth and forehead rune.
 ctx.fillStyle='#81d9bd';ctx.fillRect(-5,8,13,3);ctx.fillRect(1,11,4,3);ctx.fillRect(-5,14,10,3);
 ctx.fillStyle='#348775';ctx.fillRect(-16,4,3,2);ctx.fillRect(13,4,3,2);
 // Thin rectangular lightning forks and drifting square sparks.
 for(const side of [-1,1]){ctx.save();ctx.scale(side,1);ctx.fillStyle='#baffdf';ctx.fillRect(38,5,7,2);ctx.fillRect(35,7,5,3);ctx.fillRect(38,10,6,2);ctx.restore();}
 for(let i=0;i<15;i++){const angle=tickN*.025+i*2.4;ctx.globalAlpha=.2+i%3*.13;ctx.fillStyle='#52ffd6';ctx.fillRect(Math.round(Math.cos(angle)*52),Math.round(Math.sin(angle)*43),i%4===0?5:2,2);}
 ctx.restore();
}
const canvas=createCanvas(1080,460),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,1080,460);
for(let i=0;i<3;i++){
 ctx.fillStyle='#111923';ctx.fillRect(i*360+10,10,340,440);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*360+10.5,10.5,339,439);
 ctx.save();ctx.translate(180+i*360,270);ctx.scale(2.65,2.65);
 if(i===1)squareReaper(ctx);else{const s=engine.createInitialState();engine.godSpawnBoss(s,i===0?'splitter_queen':'sea_chanter');const boss=s.enemies[0];boss.attackTimer=200;m.exports.drawEnemy(ctx,boss,0,0,40);}ctx.restore();
 ctx.shadowBlur=0;ctx.fillStyle=['#ddaaff','#8ce5ce','#8dc9f0'][i];ctx.font='18px monospace';ctx.textAlign='center';ctx.fillText(['QUEEN — REFERENCE','REAPER — FRESH PREVIEW','CHANTER — REFERENCE'][i],180+i*360,43);
}
fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/reaper-storm-hunter-preview.png',canvas.toBuffer('image/png'));
