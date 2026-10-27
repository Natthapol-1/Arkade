const fs=require('fs'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts');
const original=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const begin=original.indexOf("  if (e.type === 'splitter_queen') {\n    const qSz"),end=original.indexOf('\n  //',original.indexOf('    return;',begin));
if(begin<0||end<0)throw Error('Queen boundaries missing');
let queen=original.slice(begin,end);
// Preview-only: preserve the live model, border, shading, crown, and three-eyed face.
const innerAnchor='      // Twinkling center gem — brightness pulses independently for a "living jewel" feel';
const detail=`      // A few tiny jewel markings inside the face, like Sea Chanter's sparse scales.
      ctx.fillStyle = '#a84ac5';
      for (const side of [-1, 1]) {
        ctx.fillRect(sx + side * (qH - qPad - 2) - 1, sy + 2, 2, 3);
        ctx.fillRect(sx + side * (qH - qPad - 4) - 1, sy + 8, 2, 2);
      }
      ctx.fillStyle = '#c76ce2';
      for (const offset of [-6, 0, 6]) {
        ctx.fillRect(sx + offset - 1, sy + qH - qPad - 2, 2, 2);
      }

`;
if(!queen.includes(innerAnchor))throw Error('Queen inner anchor missing');queen=queen.replace(innerAnchor,detail+innerAnchor);
const bodyAnchor='    // Main body';
const ornaments=`    // Short stepped royal tassels hang from the shoulder edges, rather than a fin or large cloak.
    ctx.save(); ctx.translate(sx, sy); ctx.shadowBlur = 0;
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      ctx.fillStyle = 'rgba(136,0,204,0.42)'; ctx.beginPath();
      ctx.moveTo(qH, -6); ctx.lineTo(qH + 8, -6); ctx.lineTo(qH + 8, 7);
      ctx.lineTo(qH + 12, 7); ctx.lineTo(qH + 12, 18); ctx.lineTo(qH + 6, 18);
      ctx.lineTo(qH + 6, 9); ctx.lineTo(qH + 3, 9); ctx.lineTo(qH + 3, 0);
      ctx.lineTo(qH, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#bf62d9'; ctx.fillRect(qH + 7, 14, 4, 3);
      ctx.restore();
    }
    ctx.restore();

`;
if(!queen.includes(bodyAnchor))throw Error('Queen body anchor missing');queen=queen.replace(bodyAnchor,ornaments+bodyAnchor);
const proposed=original.slice(0,begin)+queen+original.slice(end);
function renderer(src){const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);return m.exports.drawEnemy;}
const canvas=createCanvas(900,460),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,900,460);
for(const[i,src]of [original,proposed].entries()){
 ctx.fillStyle='#111923';ctx.fillRect(i*450+10,10,430,440);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*450+10.5,10.5,429,439);
 const s=engine.createInitialState();engine.godSpawnBoss(s,'splitter_queen');const boss=s.enemies[0];boss.attackTimer=200;
 ctx.save();ctx.translate(225+i*450,257);ctx.scale(3.3,3.3);renderer(src)(ctx,boss,0,0,40);ctx.restore();
 ctx.shadowBlur=0;ctx.fillStyle='#dfa1f7';ctx.font='20px monospace';ctx.textAlign='center';ctx.fillText(i?'INNER DETAILS + TASSELS':'ORIGINAL QUEEN',225+i*450,47);
}
fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/queen-subtle-preview.png',canvas.toBuffer('image/png'));

module.exports = { proposed };
