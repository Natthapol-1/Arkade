const fs=require('fs'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts');
const original=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const start=original.indexOf("  if (e.type === 'splitter_queen') {\n    const qSz"),stop=original.indexOf('    // HP bar above her',start);
if(start<0||stop<0)throw Error('Queen crown anchor missing');
const crown=`    // Foreground crown base, raised around her lower body at 75% opacity with no aura glow.
    ctx.save(); ctx.translate(sx, sy + qH - 6); ctx.scale(.88, .75);
    const crownHalf = qSz * 0.8;
    const baseY = 14;
    ctx.shadowBlur = 0;
    ctx.fillStyle = qFlash ? 'rgba(255,255,255,.75)' : 'rgba(86,0,133,.75)'; ctx.beginPath();
    ctx.moveTo(-crownHalf, baseY); ctx.lineTo(-crownHalf, -12);
    ctx.lineTo(-crownHalf + 5, -12); ctx.lineTo(-crownHalf + 5, -4);
    ctx.lineTo(-crownHalf + 10, -4); ctx.lineTo(-crownHalf + 10, 6);
    ctx.lineTo(-qSz * .34, 6); ctx.lineTo(-qSz * .34, -4);
    ctx.lineTo(-qSz * .22, -4); ctx.lineTo(-qSz * .22, 5);
    ctx.lineTo(-3, 5); ctx.lineTo(-3, -2); ctx.lineTo(3, -2);
    ctx.lineTo(3, 5); ctx.lineTo(qSz * .22, 5);
    ctx.lineTo(qSz * .22, -4); ctx.lineTo(qSz * .34, -4);
    ctx.lineTo(qSz * .34, 6); ctx.lineTo(crownHalf - 10, 6);
    ctx.lineTo(crownHalf - 10, -4); ctx.lineTo(crownHalf - 5, -4);
    ctx.lineTo(crownHalf - 5, -12); ctx.lineTo(crownHalf, -12);
    ctx.lineTo(crownHalf, baseY); ctx.closePath(); ctx.fill();
    ctx.restore();
    // Forehead gemstone beneath the central tiara spike, matching the corner gems.
    ctx.save(); ctx.translate(sx, sy - qH + 1); ctx.rotate(Math.PI / 4);
    const foreheadGem = Math.max(6, Math.floor(qSz * .18));
    ctx.shadowColor = '#dd77ff'; ctx.shadowBlur = 3;
    ctx.fillStyle = qFlash ? '#ffffff' : '#edb2ff';
    ctx.fillRect(-foreheadGem / 2, -foreheadGem / 2, foreheadGem, foreheadGem);
    ctx.shadowBlur = 0; ctx.fillStyle = qFlash ? '#ffffff' : '#b546d3';
    ctx.fillRect(-foreheadGem / 2 + 1, -foreheadGem / 2 + 1, foreheadGem - 2, foreheadGem - 2);
    ctx.restore();

`;
const proposed=original.slice(0,stop)+crown+original.slice(stop);
function renderer(src){const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);return m.exports.drawEnemy;}
const canvas=createCanvas(900,500),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,900,500);for(const[i,src]of [original,proposed].entries()){ctx.fillStyle='#111923';ctx.fillRect(i*450+10,10,430,480);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*450+10.5,10.5,429,479);const s=engine.createInitialState();engine.godSpawnBoss(s,'splitter_queen');const boss=s.enemies[0];boss.attackTimer=200;ctx.save();ctx.translate(225+i*450,270);ctx.scale(3.3,3.3);renderer(src)(ctx,boss,0,0,40);ctx.restore();ctx.shadowBlur=0;ctx.fillStyle='#dfa1f7';ctx.font='20px monospace';ctx.textAlign='center';ctx.fillText(i?'CROWN BASE — PREVIEW':'CURRENT QUEEN',225+i*450,47);}fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/queen-crown-base-preview.png',canvas.toBuffer('image/png'));module.exports={proposed};