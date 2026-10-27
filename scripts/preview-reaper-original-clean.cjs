const fs=require('fs'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts');
const original=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const start=original.indexOf("  if (e.type === 'storm_reaper') {\n    const rSz"),end=original.indexOf("  if (e.type === 'devourer') {",start);if(start<0||end<0)throw Error('Original Reaper not found');let model=original.slice(start,end);
model=model.replace("ctx.lineWidth = 3;\n    ctx.shadowColor = '#52ffd6'; ctx.shadowBlur = 18;\n    ctx.beginPath();\n    ctx.arc(sx, sy, rH * 1.55, 0, Math.PI * 2);\n    ctx.stroke();","ctx.lineWidth = 2;\n    ctx.shadowColor = '#52ffd6'; ctx.shadowBlur = 8;\n    const auraHalf = rH * 1.55;\n    ctx.strokeRect(sx - auraHalf, sy - auraHalf, auraHalf * 2, auraHalf * 2);");
model=model.replace("// Outer soft halo — big, always-on aura ring so she reads as boss-scale even at rest","// Square electric aura, matching Queen's clean geometry without pixelating the body");
model=model.replace("Math.floor(20 * pulse)","Math.floor(14 * pulse)");
const detailStart=model.indexOf('      // Cracked exoskeleton veins across the inset plate'),detailEnd=model.indexOf('    }\n    ctx.restore();',detailStart);if(detailStart<0||detailEnd<0)throw Error('Inner body details not found');
model=model.slice(0,detailStart)+`      // A flat inner panel and a few small charge marks, like Chanter's sparse inner details.
      ctx.fillStyle = '#145e50';
      ctx.fillRect(-rH * .37, -rH * .37, rH * .74, rH * .74);
      ctx.fillStyle = '#287c68';
      ctx.fillRect(-rH * .47, -rH * .15, rH * .13, rH * .06);
      ctx.fillRect(rH * .31, rH * .12, rH * .13, rH * .06);
`+model.slice(detailEnd);
model=model.replace("ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;","ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 2;").replace("ctx.shadowColor = '#c2ffec'; ctx.shadowBlur = 5;","ctx.shadowColor = '#c2ffec'; ctx.shadowBlur = 2;");
if(model.includes('ctx.arc(sx, sy, rH * 1.55'))throw Error('Circular aura still present');
// Replace the square glow with a rounded-looking, eight-facet crystal outline.
const squareAura='    const auraHalf = rH * 1.55;\n    ctx.strokeRect(sx - auraHalf, sy - auraHalf, auraHalf * 2, auraHalf * 2);';
const crystalAura=`    const auraHalf = rH * 1.55;
    const corner = auraHalf * .47;
    ctx.beginPath();
    ctx.moveTo(sx - corner, sy - auraHalf); ctx.lineTo(sx + corner, sy - auraHalf);
    ctx.lineTo(sx + auraHalf, sy - corner); ctx.lineTo(sx + auraHalf, sy + corner);
    ctx.lineTo(sx + corner, sy + auraHalf); ctx.lineTo(sx - corner, sy + auraHalf);
    ctx.lineTo(sx - auraHalf, sy + corner); ctx.lineTo(sx - auraHalf, sy - corner);
    ctx.closePath(); ctx.stroke();`;
if(!model.includes(squareAura))throw Error('Square aura not found');model=model.replace(squareAura,crystalAura);
// Remove the separate lower glow bar; keep only the square aura.
const groundStart=model.indexOf('    // Ground electric crackle'),groundEnd=model.indexOf('    // Square electric aura',groundStart);
if(groundStart<0||groundEnd<0)throw Error('Lower bar boundaries missing');model=model.slice(0,groundStart)+model.slice(groundEnd);
// Enlarge the diamond itself, keeping the outer aura at its original size.
model=model.replace('ctx.fillRect(-rH * 0.72, -rH * 0.72, rH * 1.44, rH * 1.44);','ctx.fillRect(-rH * .82, -rH * .82, rH * 1.64, rH * 1.64);');
model=model.replace('ctx.fillRect(-rH * 0.5, -rH * 0.5, rH, rH);','ctx.fillRect(-rH * .58, -rH * .58, rH * 1.16, rH * 1.16);');
model=model.replace('ctx.fillRect(-rH * .37, -rH * .37, rH * .74, rH * .74);','ctx.fillRect(-rH * .44, -rH * .44, rH * .88, rH * .88);');
const eyeStart=model.indexOf('    // Alien eyes —'),eyeEnd=model.indexOf('    // Chitinous mandible maw',eyeStart);
if(eyeStart<0||eyeEnd<0)throw Error('Reaper eyes missing');
model=model.slice(0,eyeStart)+`    // Larger uneven eyes, with flat mint pupils like the approved Queen/Chanter faces.
    if (!rFlash) {
      const leftX = sx - rH * .40, leftY = sy - rH * .25;
      const rightX = sx + rH * .10, rightY = sy - rH * .12;
      ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff';
      ctx.fillRect(leftX, leftY, rH * .38, rH * .30);
      ctx.fillRect(rightX, rightY, rH * .22, rH * .20);
      ctx.fillStyle = '#19aa8a';
      ctx.fillRect(leftX + 2, leftY + 1, Math.max(3, rH * .18), Math.max(3, rH * .20));
      ctx.fillRect(rightX + 1, rightY + 1, Math.max(2, rH * .12), Math.max(2, rH * .12));
    }

`+model.slice(eyeEnd);
// Replace the original pointed fins and swept horns with rectangular antennae on every diamond edge.
const antennaStart=model.indexOf('    // Blade fins —'),antennaEnd=model.indexOf('    // Diamond core body',antennaStart);
if(antennaStart<0||antennaEnd<0)throw Error('Reaper antenna boundaries missing');
model=model.slice(0,antennaStart)+`    // One full rectangular antenna attached to each corner of the diamond.
    ctx.save(); ctx.translate(sx, sy);
    const antennaCorner = rH * .82 * Math.SQRT2;
    const antennaLength = Math.max(7, rH * .25);
    const antennaWidth = Math.max(4, rH * .16);
    ctx.fillStyle = rFlash ? '#ffffff' : '#259f89';
    ctx.fillRect(-antennaCorner - antennaLength + 3, -antennaWidth / 2, antennaLength, antennaWidth);
    ctx.fillRect(antennaCorner - 3, -antennaWidth / 2, antennaLength, antennaWidth);
    ctx.fillRect(-antennaWidth / 2, -antennaCorner - antennaLength + 3, antennaWidth, antennaLength);
    ctx.fillRect(-antennaWidth / 2, antennaCorner - 3, antennaWidth, antennaLength);
    ctx.restore();

`+model.slice(antennaEnd);
const mouthStart=model.indexOf('    // Chitinous mandible maw'),mouthEnd=model.indexOf('    // Crackling electric arcs',mouthStart);
if(mouthStart<0||mouthEnd<0)throw Error('Old mouth boundaries missing');
model=model.slice(0,mouthStart)+`    // Two opposed angular mandibles replace the old row of teeth; no small Z symbol.
    if (!rFlash) {
      ctx.strokeStyle = '#b5f3df'; ctx.lineWidth = 2.5; ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(sx - 7, sy + 6); ctx.lineTo(sx - 3, sy + 9); ctx.lineTo(sx - 7, sy + 12);
      ctx.moveTo(sx + 7, sy + 6); ctx.lineTo(sx + 3, sy + 9); ctx.lineTo(sx + 7, sy + 12);
      ctx.stroke();
    }

`+model.slice(mouthEnd);
const proposed=original.slice(0,start)+model+original.slice(end);
function renderer(src){const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);return m.exports.drawEnemy;}
const canvas=createCanvas(1080,460),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,1080,460);for(const[i,type]of ['splitter_queen','storm_reaper','sea_chanter'].entries()){ctx.fillStyle='#111923';ctx.fillRect(i*360+10,10,340,440);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*360+10.5,10.5,339,439);const s=engine.createInitialState();engine.godSpawnBoss(s,type);const boss=s.enemies[0];boss.attackTimer=200;ctx.save();ctx.translate(180+i*360,270);ctx.scale(2.65,2.65);renderer(i===1?proposed:original)(ctx,boss,0,0,40);ctx.restore();ctx.shadowBlur=0;ctx.fillStyle=['#ddaaff','#8ce5ce','#8dc9f0'][i];ctx.font='18px monospace';ctx.textAlign='center';ctx.fillText(['QUEEN — REFERENCE','REAPER — NEW PREVIEW','CHANTER — REFERENCE'][i],180+i*360,43);}fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/reaper-original-clean-preview.png',canvas.toBuffer('image/png'));module.exports={proposed};