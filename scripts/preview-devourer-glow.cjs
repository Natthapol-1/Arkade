const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;exports.drawThornGround=drawThornGround;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

function r(ctx,color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function p(ctx,color,points){ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<points.length;i++){const[x,y]=points[i];if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();}
function diamond(ctx,color,x,y,size){p(ctx,color,[[x,y-size],[x+size,y],[x,y+size],[x-size,y]]);}
function dust(ctx,color,n,rx,ry){for(let i=0;i<n;i++){const angle=i*2.4+.6;ctx.globalAlpha=.25+(i%3)*.12;r(ctx,color,Math.round(Math.cos(angle)*rx),Math.round(Math.sin(angle)*ry),2+(i%2),2+(i%2));}ctx.globalAlpha=1;}
function reaper(ctx){
 // Keep the signature diamond, with the clear rim/panel treatment of the approved bosses.
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=5;diamond(ctx,'#35c9ad',0,0,28);ctx.shadowBlur=0;
 diamond(ctx,'#123c37',0,0,23);diamond(ctx,'#1c6154',0,0,18);
 // Two short sickle-like blade brackets, distinct from Chanter's fan fins.
 p(ctx,'rgba(53,201,173,.34)',[[-19,-8],[-30,-12],[-34,-23],[-35,-4],[-26,1],[-20,9]]);
 p(ctx,'rgba(53,201,173,.34)',[[19,8],[30,12],[34,23],[35,4],[26,-1],[20,-9]]);
 r(ctx,'#78dfc8',-34,-15,2,8);r(ctx,'#78dfc8',32,7,2,8);
 // Offset eyes and two blunt fangs preserve the alien expression without a busy split mask.
 r(ctx,'#d9fff0',-12,-5,8,6);r(ctx,'#0b2e29',-10,-4,3,4);
 r(ctx,'#d9fff0',6,-9,6,9);r(ctx,'#0b2e29',8,-7,3,5);
 r(ctx,'#123c37',-7,7,15,6);r(ctx,'#b2f5dd',-5,7,3,5);r(ctx,'#b2f5dd',3,9,3,5);
 // Sparse inner charge marks, equivalent in density to Chanter's gills and scales.
 r(ctx,'#38a88e',-15,3,3,2);r(ctx,'#38a88e',-12,7,2,2);r(ctx,'#38a88e',12,2,3,2);
 for(const[x,y]of [[-35,24],[30,-29]]){ctx.strokeStyle='#94f2d7';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-3,y-3);ctx.lineTo(x+2,y);ctx.lineTo(x-1,y+2);ctx.lineTo(x+3,y+4);ctx.stroke();}
 dust(ctx,'#52ffd6',9,39,37);
}
function oldDevourerEffects(ctx,tickN=40){
 const sx=0,sy=0,vSz=Math.floor(c.TILE_SIZE*c.ENEMY_CONFIGS.devourer.bodyFraction),vH=vSz/2;
 const pulse=.6+.4*Math.abs(Math.sin(tickN*.09)),vHealFlash=false,e={healFlashTicks:0};
    // Big absorb shockwave — blocky expanding square ring, the moment she eats
    if (vHealFlash) {
      const shockProgress = 1 - e.healFlashTicks / 26; // 0 -> 1
      ctx.save();
      ctx.globalAlpha = 1 - shockProgress;
      ctx.shadowColor = '#c8ff88'; ctx.shadowBlur = 24;
      const ringSz1 = vSz * (1 + shockProgress * 2.2);
      ctx.strokeStyle = '#88ff44'; ctx.lineWidth = 5;
      ctx.strokeRect(sx - ringSz1 / 2, sy - ringSz1 / 2, ringSz1, ringSz1);
      const ringSz2 = vSz * (0.7 + shockProgress * 1.8);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.strokeRect(sx - ringSz2 / 2, sy - ringSz2 / 2, ringSz2, ringSz2);
      ctx.restore();
      ctx.shadowBlur = 0;
    }

    // Always-on violet aura ring — matches her minimap glow, gives her the same idle
    // presence the other three bosses have (King's ground-fire, Queen's motes, Reaper's halo)
    ctx.save();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.strokeStyle = '#6b2fa8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#6b2fa8'; ctx.shadowBlur = 18;
    ctx.strokeRect(sx - vH * 1.5, sy - vH * 1.5, vH * 3, vH * 3);
    ctx.restore();

    // Orbiting spore particles — blocky squares drifting around her, the persistent
    // "consuming aura" tell she was missing (King has embers, Queen has motes, Reaper has arcs)
    const sporeCount = 5;
    for (let i = 0; i < sporeCount; i++) {
      const ang = tickN * 0.025 + (Math.PI * 2 * i) / sporeCount;
      const orbitR = vH + 10 + 3 * Math.sin(tickN * 0.06 + i);
      const spx = sx + Math.cos(ang) * orbitR;
      const spy = sy + Math.sin(ang) * orbitR;
      const sporeAlpha = 0.5 + 0.4 * Math.abs(Math.sin(tickN * 0.1 + i * 1.3));
      ctx.fillStyle = i % 2 === 0 ? `rgba(136,255,68,${sporeAlpha})` : `rgba(107,47,168,${sporeAlpha})`;
      ctx.shadowColor = '#88ff44'; ctx.shadowBlur = 5;
      ctx.fillRect(spx - 2, spy - 2, 4, 4);
    }
    ctx.shadowBlur = 0;

    // Ground corruption pool — a sickly wash beneath her, bigger with more stacks
    ctx.shadowColor = '#88ff44'; ctx.shadowBlur = Math.floor(16 * pulse);
    ctx.fillStyle = `rgba(107,47,168,${0.22 * pulse})`;
    ctx.fillRect(sx - vH - 6, sy + vH - 4, vSz + 12, 10);
    ctx.shadowBlur = 0;


}
function devourer(ctx){
 oldDevourerEffects(ctx);
 // Dark purple extensions inherit the body's violet glow, like King's shoulders and Queen's ornaments.
 ctx.save();ctx.shadowColor='#9945c7';ctx.shadowBlur=9;
 r(ctx,'#50206a',-31,-13,10,21);r(ctx,'#50206a',21,-20,10,15);
 r(ctx,'#50206a',-20,24,14,8);r(ctx,'#50206a',8,24,17,5);ctx.restore();
 // Short rectangular side antennae give the silhouette a pufferfish rhythm.
 ctx.save();ctx.shadowColor='#9945c7';ctx.shadowBlur=7;
 for(const side of [-1,1]){
  ctx.save();ctx.scale(side,1);
  r(ctx,'#7134a2',24,-20,12,5);r(ctx,'#7134a2',24,-3,16,5);r(ctx,'#7134a2',24,15,12,5);
  ctx.restore();
 }
 ctx.restore();
 ctx.shadowColor='#8e45c0';ctx.shadowBlur=5;r(ctx,'#7134a2',-25,-25,50,50);ctx.shadowBlur=0;
 r(ctx,'#32153e',-21,-21,42,42);r(ctx,'#482153',-17,-16,34,32);
 // One large flat eye and a simple hungry mouth: no reflections, plates, or intricate shading.
 r(ctx,'#9dd959',-8,-14,16,14);r(ctx,'#18311b',-3,-12,6,10);
 r(ctx,'#19211b',-15,7,30,11);
 for(const[x,h]of [[-12,7],[-5,5],[2,7],[9,5]])r(ctx,'#c4ee8b',x,7,4,h);
 r(ctx,'#78a647',-17,-3,3,3);r(ctx,'#78a647',14,-6,3,2);r(ctx,'#78a647',15,0,2,2);
 // Small swallowed-creature eyes sit inside the lopsided side chunk.
 r(ctx,'#28402b',-29,-7,6,8);r(ctx,'#b9d97c',-28,-5,2,2);r(ctx,'#b9d97c',-25,-2,2,2);
 r(ctx,'#432149',23,-16,6,6);r(ctx,'#96be60',25,-15,2,2);
 ctx.save();ctx.shadowColor='#9945c7';ctx.shadowBlur=8;
 r(ctx,'#7134a2',-18,-29,5,6);r(ctx,'#7134a2',12,-31,6,7);ctx.restore();

}
function warden(ctx){
 // Small attached crystal brackets replace the old white-out cloud of shards.
 p(ctx,'rgba(166,219,243,.32)',[[-21,4],[-29,4],[-32,12],[-29,21],[-22,17]]);
 p(ctx,'rgba(166,219,243,.32)',[[21,-17],[28,-21],[32,-11],[29,0],[22,-1]]);
 ctx.shadowColor='#a7ddf4';ctx.shadowBlur=4;r(ctx,'#8ecbe3',-24,-24,48,48);ctx.shadowBlur=0;
 r(ctx,'#153d52',-20,-20,40,40);r(ctx,'#24546a',-16,-15,32,30);
 // A clear square spiral eye retains Warden's original identity.
 r(ctx,'#d8f4ff',-9,-12,17,15);r(ctx,'#1a4055',-6,-9,11,9);
 r(ctx,'#b4e2f2',-3,-6,7,5);r(ctx,'#31596c',0,-4,3,2);
 r(ctx,'#102f44',-11,8,22,8);r(ctx,'#d8f4ff',-8,8,4,6);r(ctx,'#d8f4ff',1,8,4,9);r(ctx,'#d8f4ff',8,8,3,5);
 // Tiny frost markings remain inside the panel, at Chanter/Queen's detail level.
 r(ctx,'#5b92ac',-16,-6,3,2);r(ctx,'#5b92ac',13,-11,2,3);r(ctx,'#5b92ac',13,-4,3,2);
 // Three compact stepped icicles, with no elaborate crown detailing.
 r(ctx,'#a7ddf4',-17,-31,6,8);r(ctx,'#a7ddf4',-15,-35,3,5);
 r(ctx,'#d8f4ff',-3,-38,7,15);r(ctx,'#d8f4ff',-1,-43,3,6);
 r(ctx,'#a7ddf4',12,-32,6,9);r(ctx,'#a7ddf4',14,-36,3,5);
 r(ctx,'rgba(166,219,243,.4)',-15,24,5,7);r(ctx,'rgba(166,219,243,.4)',-1,24,4,10);r(ctx,'rgba(166,219,243,.4)',10,24,6,5);
 for(const[x,y]of [[-35,-27],[34,27],[-32,32],[35,-33]])diamond(ctx,'rgba(187,229,248,.7)',x,y,3);
 dust(ctx,'#b9e8fa',8,40,39);
}
const canvas=createCanvas(480,440),ctx=canvas.getContext('2d');ctx.fillStyle='#111923';ctx.fillRect(0,0,480,440);ctx.fillStyle='#b5de7e';ctx.font='22px monospace';ctx.textAlign='center';ctx.fillText('SOUL DEVOURER — PREVIEW',240,42);ctx.save();ctx.translate(240,255);ctx.scale(3.5,3.5);devourer(ctx);ctx.restore();fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/devourer-glow-preview.png',canvas.toBuffer('image/png'));