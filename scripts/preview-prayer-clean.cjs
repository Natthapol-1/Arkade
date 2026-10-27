const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;exports.drawThornGround=drawThornGround;exports.drawPrayerGlyph=drawPrayerGlyph;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

function proposedPrayer(ctx){
 const gold='#ffdd22',rim='#d7b82d';
 // Compact translucent temple ornaments, attached directly to the square shell.
 ctx.fillStyle='rgba(255,221,34,.24)';
 for(const side of [-1,1]){
  ctx.save();ctx.scale(side,1);ctx.beginPath();ctx.moveTo(24,-17);ctx.lineTo(31,-17);ctx.lineTo(31,-23);ctx.lineTo(35,-23);ctx.lineTo(35,-10);ctx.lineTo(29,-10);ctx.lineTo(29,9);ctx.lineTo(24,9);ctx.closePath();ctx.fill();
  ctx.fillStyle='#b99b27';ctx.fillRect(30,-20,3,3);ctx.restore();
 }
 // The body follows Chanter/Queen: one square rim and a calm, flat inner panel.
 ctx.shadowColor=gold;ctx.shadowBlur=7;ctx.fillStyle=rim;ctx.fillRect(-25,-25,50,50);ctx.shadowBlur=0;
 ctx.fillStyle='#393426';ctx.fillRect(-21,-21,42,42);ctx.fillStyle='#4f452e';ctx.fillRect(-17,-16,34,32);
 // A few tiny marks inside the forehead; no separate hood or neck.
 ctx.fillStyle='#928044';for(const x of [-11,-1,9])ctx.fillRect(x,-18,2,2);
 // Single broad ancient cloth wrap, faintly showing three closed eyelids.
 ctx.fillStyle='#bdaa67';ctx.fillRect(-23,-10,46,12);ctx.fillStyle='#211b08';
 for(const x of [-13,0,13]){ctx.fillRect(x-4,-6,9,3);}
 ctx.fillStyle='rgba(0,0,0,.86)';ctx.fillRect(-27,-10,54,12);ctx.fillStyle='#17150f';ctx.fillRect(-29,-7,3,7);ctx.fillRect(26,-7,5,5);
 // Three white inscriptions are the face/body signature, kept compact and readable.
 for(let i=0;i<3;i++){ctx.save();ctx.translate((i-1)*13,12);ctx.scale(.78,.78);m.exports.drawPrayerGlyph(ctx,i,0,0);ctx.restore();}
 // Short embedded horn tips, and a small floating halo with a quiet centre gap.
 for(const side of [-1,1]){ctx.fillStyle='#15130d';ctx.fillRect(side*18-2,-30,4,7);ctx.fillStyle='#a78e21';ctx.fillRect(side*18-2,-30,2,3);}
 ctx.shadowColor=gold;ctx.shadowBlur=5;ctx.fillStyle=gold;
 ctx.fillRect(-13,-45,26,2);ctx.fillRect(-18,-42,7,2);ctx.fillRect(11,-42,7,2);
 ctx.fillRect(-19,-40,2,5);ctx.fillRect(17,-40,2,5);ctx.fillRect(-16,-34,9,2);ctx.fillRect(1,-34,15,2);ctx.shadowBlur=0;
 ctx.fillStyle='rgba(255,221,34,.3)';ctx.fillRect(-15,29,4,4);ctx.fillRect(10,31,3,3);
 for(let i=0;i<12;i++){const side=i%2?1:-1;ctx.globalAlpha=.2+(i%3)*.15;ctx.fillStyle=i%4?gold:'#6f6127';ctx.fillRect(side*(36+(i*7)%9),-31+(i*17)%69,2+(i%2),2+(i%2));}ctx.globalAlpha=1;
 ctx.fillStyle='#6f6127';ctx.fillRect(-27,-57,54,4);ctx.fillStyle=gold;ctx.fillRect(-27,-57,54,4);
}
const canvas=createCanvas(1080,460),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,1080,460);
for(let i=0;i<3;i++){
 ctx.fillStyle='#111923';ctx.fillRect(i*360+10,10,340,440);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*360+10.5,10.5,339,439);
 ctx.save();ctx.translate(180+i*360,270);ctx.scale(2.65,2.65);
 if(i===1)proposedPrayer(ctx);else{const s=engine.createInitialState();engine.godSpawnBoss(s,i===0?'splitter_queen':'sea_chanter');const boss=s.enemies[0];boss.attackTimer=200;m.exports.drawEnemy(ctx,boss,0,0,40);}ctx.restore();
 ctx.shadowBlur=0;ctx.fillStyle=['#ddaaff','#ffdd22','#8dc9f0'][i];ctx.font='18px monospace';ctx.textAlign='center';ctx.fillText(['QUEEN — REFERENCE','PRAYER — NEW PREVIEW','CHANTER — REFERENCE'][i],180+i*360,43);
}
fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/prayer-clean-preview.png',canvas.toBuffer('image/png'));
