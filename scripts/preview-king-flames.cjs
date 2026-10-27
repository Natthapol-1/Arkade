const fs=require('fs'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts');
const original=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const start=original.indexOf("  if (e.type === 'fiery_king') {\n    const bSz"),stop=original.indexOf('    // HP bar above boss',start);if(start<0||stop<0)throw Error('King detail anchor missing');
const flames=`    // Three compact pixel flames decorate the lower armor without changing his silhouette.
    if (!bFlash) {
      const flameBase = sy + bH - bPad - 4;
      const flameWidth = Math.max(7, Math.floor(bSz * .13));
      for (let i = 0; i < 3; i++) {
        const fx = sx + Math.round((i - 1) * bSz * .23);
        const height = Math.max(8, Math.floor(bSz * (i === 1 ? .20 : .14)) + Math.round(Math.sin(tickN * .08 + i) * 1));
        const lean = i === 1 ? 1 : -1;
        ctx.shadowBlur = 0; ctx.fillStyle = '#b92d0b';
        ctx.fillRect(fx - Math.floor(flameWidth / 2), flameBase - 4, flameWidth, 4);
        ctx.fillRect(fx - Math.floor(flameWidth / 2) - 1, flameBase - 8, flameWidth + 2, 4);
        ctx.fillRect(fx - Math.floor(flameWidth / 2) + 1, flameBase - height + 2, flameWidth - 2, Math.max(2, height - 7));
        ctx.fillRect(fx + lean * 2 - 1, flameBase - height - 2, 3, 5);
        ctx.fillStyle = '#ed6414'; ctx.fillRect(fx - 2, flameBase - 5, 4, 5);
        ctx.fillRect(fx - 1, flameBase - 8, 2, 4);
      }
    }

`;
const proposed=original.slice(0,stop)+flames+original.slice(stop);
function renderer(src){const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);return m.exports.drawEnemy;}
const canvas=createCanvas(900,520),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,900,520);for(const[i,src]of [original,proposed].entries()){ctx.fillStyle='#111923';ctx.fillRect(i*450+10,10,430,500);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*450+10.5,10.5,429,499);const s=engine.createInitialState();engine.godSpawnBoss(s,'fiery_king');const boss=s.enemies[0];boss.attackTimer=200;ctx.save();ctx.translate(225+i*450,290);ctx.scale(2.6,2.6);renderer(src)(ctx,boss,0,0,40);ctx.restore();ctx.shadowBlur=0;ctx.fillStyle='#ff9958';ctx.font='20px monospace';ctx.textAlign='center';ctx.fillText(i?'LOWER FLAMES — PREVIEW':'CURRENT KING',225+i*450,47);}fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/king-lower-flame-preview.png',canvas.toBuffer('image/png'));module.exports={proposed};