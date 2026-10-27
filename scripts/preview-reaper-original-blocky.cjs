const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {isSeaChanterDiving}=require('./engine.ts');"+src.slice(src.indexOf('const PRAYER_GLYPHS'),src.indexOf('function drawRewardSpark('))+src.slice(src.indexOf('function drawEnemy('),src.indexOf('function drawGame('))+';exports.drawEnemy=drawEnemy;exports.drawThornGround=drawThornGround;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

function blockDiamond(ctx,radius,color,ring=false){
 const unit=3,rows=Math.floor(radius/unit);ctx.fillStyle=color;
 for(let row=-rows;row<=rows;row++){
  const span=(rows-Math.abs(row))*unit,y=row*unit;
  if(ring&&span>unit){ctx.fillRect(-span,y,unit,unit);ctx.fillRect(span,y,unit,unit);}
  else ctx.fillRect(-span,y,span*2+unit,unit);
 }
}
function blockPolygon(ctx,color,points){
 ctx.fillStyle=color;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 for(let y=Math.floor(Math.min(...ys)/3)*3;y<=Math.max(...ys);y+=3){
  const covered=[];
  for(let x=Math.floor(Math.min(...xs)/3)*3;x<=Math.max(...xs);x+=3){
   let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
    const[a,b]=points[i],[d,e]=points[j];if((b>y+1.5)!==(e>y+1.5)&&(x+1.5)<(d-a)*(y+1.5-b)/(e-b)+a)inside=!inside;
   }
   if(inside)covered.push(x);
  }
  if(covered.length)ctx.fillRect(covered[0],y,covered.at(-1)-covered[0]+3,3);
 }
}
function blockBolt(ctx,x,y){
 ctx.fillStyle='#c2ffec';for(const[dx,dy,w,h]of [[-3,-4,6,2],[1,-2,2,3],[-1,1,4,2],[-1,3,6,2]])ctx.fillRect(x+dx,y+dy,w,h);
}
function originalBlockyReaper(ctx,tickN=40){
 // Original diamond body, blade fins, swept spikes and uneven face; pixel-stepped construction.
 ctx.save();ctx.shadowColor='#52ffd6';ctx.shadowBlur=8;ctx.globalAlpha=.42;
 blockDiamond(ctx,44,'#52ffd6',true);ctx.restore();
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=7;ctx.fillStyle='rgba(82,255,214,.13)';ctx.fillRect(-31,24,62,6);ctx.shadowBlur=0;
 blockPolygon(ctx,'#129c91',[[-13,-8],[-33,0],[-13,8]]);
 blockPolygon(ctx,'#129c91',[[13,-8],[33,0],[13,8]]);
 blockPolygon(ctx,'#36dbc1',[[-9,-14],[-18,-33],[-3,-16]]);
 blockPolygon(ctx,'#36dbc1',[[9,-14],[18,-33],[3,-16]]);
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=5;blockDiamond(ctx,27,'#36dbc1');ctx.shadowBlur=0;
 blockDiamond(ctx,18,'#06463f');
 // Original small cracked-carapace markings, rebuilt from short right-angle blocks.
 ctx.fillStyle='#278f7c';ctx.fillRect(-12,-3,3,3);ctx.fillRect(-9,-6,6,3);ctx.fillRect(-3,-9,3,3);
 ctx.fillRect(9,3,3,3);ctx.fillRect(3,6,6,3);ctx.fillRect(0,9,3,3);
 // Original unequal white insect eyes and four uneven mandible teeth.
 ctx.fillStyle='#ffffff';ctx.fillRect(-9,-6,8,6);ctx.fillRect(3,-3,4,4);
 ctx.fillStyle='#c2ffec';for(const[x,w,h]of [[-15,4,3],[-7,3,5],[1,5,3],[10,4,5]])ctx.fillRect(x,4,w,h);
 // Five orbiting stair-step bolts and four pixel sparks retain the old electric activity.
 for(let i=0;i<5;i++){
  const a=tickN*.1+i*Math.PI*2/5;
  const x=Math.round(Math.cos(a)*39/3)*3,y=Math.round(Math.sin(a)*39/3)*3;
  ctx.save();ctx.globalAlpha=.5+.35*Math.abs(Math.sin(tickN*.3+i));ctx.shadowColor='#c2ffec';ctx.shadowBlur=4;blockBolt(ctx,x,y);ctx.restore();
 }
 for(let i=0;i<4;i++){
  const a=tickN*.07+i*2.4,r=24+(i%2)*4;ctx.globalAlpha=.45;
  ctx.fillStyle='#e8fff7';ctx.fillRect(Math.round(Math.cos(a)*r/3)*3,Math.round(Math.sin(a)*r/3)*3,3,3);
 }ctx.globalAlpha=1;ctx.shadowBlur=0;
}
const canvas=createCanvas(900,510),ctx=canvas.getContext('2d');ctx.fillStyle='#0b111b';ctx.fillRect(0,0,900,510);
for(let i=0;i<2;i++){
 ctx.fillStyle='#111923';ctx.fillRect(i*450+10,10,430,490);ctx.strokeStyle='#ffffff12';ctx.strokeRect(i*450+10.5,10.5,429,489);
 ctx.save();ctx.translate(225+i*450,285);ctx.scale(2.9,2.9);
 if(i)originalBlockyReaper(ctx);else{const s=engine.createInitialState();engine.godSpawnBoss(s,'storm_reaper');const boss=s.enemies[0];boss.attackTimer=200;m.exports.drawEnemy(ctx,boss,0,0,40);}ctx.restore();
 ctx.shadowBlur=0;ctx.fillStyle='#8ce5ce';ctx.font='20px monospace';ctx.textAlign='center';ctx.fillText(i?'BLOCKY ORIGINAL — PREVIEW':'ORIGINAL REAPER',225+i*450,44);
}
fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/reaper-blocky-original-preview.png',canvas.toBuffer('image/png'));
