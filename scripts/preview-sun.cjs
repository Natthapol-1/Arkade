// Render the actual Sun game and unit animation ages. Usage: node scripts/preview-sun.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas, loadImage } = require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c = require('../app/ruby-star/constants.ts'), engine = require('../app/ruby-star/engine.ts');
const source = fs.readFileSync('app/ruby-star/RubyStarGame.tsx', 'utf8');
// Local art modules keep their real imports; React/UI imports are dropped since only canvas drawing runs.
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;exports.drawMinimap=drawMinimap;exports.drawGuideCelestial=drawGuideCelestial;';
const renderer = new Module(path.resolve('app/ruby-star/sun-preview.cjs'), module);
renderer.filename = path.resolve('app/ruby-star/sun-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);


const out = process.argv[2];
if (!out) throw new Error('Provide an output directory');
fs.mkdirSync(out, {recursive:true});
const sun = require('../app/ruby-star/sun.ts'), art = require('../app/ruby-star/sun-art.ts');
const W=1280,H=720;
for(const [name, heat, quenched] of [['sun-warm',50,false],['sun-hot',95,false],['sun-quenched',0,true]]) {
  const state=engine.createModeState('trial','fiery_king');
  engine.godSpawnBoss(state,'fiery_king');
  const boss=sun.sunBoss(state);
  boss.tileX=boss.targetTileX=14;boss.tileY=boss.targetTileY=10;boss.x=14.5*c.TILE_SIZE;boss.y=10.5*c.TILE_SIZE;
  state.gameTick=120;
  state.sun.heat=heat;state.sun.rage=heat;state.sun.stations[0].x=11;state.sun.stations[0].y=11;state.sun.stations[0].charge=65;
  state.enemies.push(engine.createEncounterEnemy(state,'emberling',12,12,4));
  if(quenched) {state.sun.quenchedTicks=300;state.sun.empoweredCasts=5;state.sun.ripples.push({x:state.playerX,y:state.playerY,ticks:20,empowered:true});}
  state.resources=[];
  const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
  renderer.exports.drawGame(ctx,state,W,H,120,0,false);
  // drawGame updates camera caches; world state stays pure in the Sun drawing functions.
  fs.writeFileSync(path.join(out,name+'.png'),canvas.toBuffer('image/png'));
  const clean=JSON.stringify(state);art.drawSunBackdrop(ctx,state,W,H,200,300,200);art.drawSunFloorTile(ctx,state,10,9,0,0,200);art.drawSunCover(ctx,state,6,5,0,0,200);art.drawSunPad(ctx,0,0,200,0);art.drawSunGround(ctx,state,0,0,200);art.drawSunEffects(ctx,state,0,0);art.drawSunAtmosphere(ctx,state,W,H,200);
  if(JSON.stringify(state)!==clean)throw new Error('Sun rendering mutated simulation');
}
const gallery=createCanvas(1080,300),ctx=gallery.getContext('2d');ctx.fillStyle='#180f13';ctx.fillRect(0,0,1080,300);
for(const [i,age] of [0,18,36,54].entries()) {
 ctx.save();ctx.translate(i*270+110,130);ctx.scale(2,2);
 art.drawSunUnit(ctx,{id:1,type:'cinder_wisp',flashTicks:0},-20,0,age);
 art.drawSunUnit(ctx,{id:2,type:'emberling',flashTicks:0},25,0,age);
 art.drawSunUnit(ctx,{id:3,type:'emberling',flashTicks:0,extinguished:true},70,0,age);
 ctx.restore();
}
fs.writeFileSync(path.join(out,'sun-units.png'),gallery.toBuffer('image/png'));
console.log('Rendered Sun world at three temperatures and unit animation ages; Sun rendering is read-only.');

// The central bridge exposes the Sun's photosphere; three animation ages validate its motion.
const state=engine.createModeState('trial','fiery_king');state.enemies=[];state.resources=[];
state.playerTileX=state.playerTargetX=25;state.playerTileY=state.playerTargetY=10;
state.playerX=25.5*c.TILE_SIZE;state.playerY=10.5*c.TILE_SIZE;state.sun.heat=75;
const ages=[0,180,420], sheet=createCanvas(1280,720*ages.length),sc=sheet.getContext('2d');
for (const [i,age] of ages.entries()) {
 state.gameTick=age;
 const canvas=createCanvas(1280,720),ctx=canvas.getContext('2d');
 renderer.exports.drawGame(ctx,state,1280,720,age,0,false);sc.drawImage(canvas,0,i*720);
 if(i===1)fs.writeFileSync(path.join(out,'sun-forge.png'),canvas.toBuffer('image/png'));
}
fs.writeFileSync(path.join(out,'sun-world.png'),sheet.toBuffer('image/png'));
// Material detail at actual game scale and enlarged: the tile art and real reservoir renderer.
const detail=createCanvas(1200,420),dc=detail.getContext('2d');dc.fillStyle='#100d19';dc.fillRect(0,0,1200,420);
for(const [i,age] of [0,120,300].entries()) {
 dc.save();dc.translate(i*400+40,65);dc.scale(2.3,2.3);
 art.drawSunCover(dc,state,6,5,0,0,age);art.drawSunCover(dc,state,6,6,0,48,age);
 art.drawSunFloorTile(dc,state,9,9,48,0,age);art.drawSunFloorTile(dc,state,9,10,48,48,age);
 art.drawCoolingStation(dc,{id:i,x:0,y:0,charge:[0,50,95][i],blocked:false},120,45,age);
 dc.restore();
}
fs.writeFileSync(path.join(out,'sun-materials.png'),detail.toBuffer('image/png'));

// Render the actual HUD component in its three states, rather than a duplicate icon drawing.
(async () => {
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const filename=path.resolve('app/ruby-star/CoolingWaveStatus.tsx'), component=new Module(filename,module);
 component.filename=filename;component.paths=module.paths;
 const src=fs.readFileSync(filename,'utf8').replace('<style jsx>','<style>');
 component._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017,jsx:ts.JsxEmit.ReactJSX}}).outputText,filename);
 const canvas=createCanvas(600,180),ctx=canvas.getContext('2d');ctx.fillStyle='#0c0c18';ctx.fillRect(0,0,600,180);
 for(const [i,props] of [{cooldown:0,empowered:false,casts:0},{cooldown:180,empowered:false,casts:0},{cooldown:0,empowered:true,casts:3}].entries()) {
  const markup=renderToStaticMarkup(React.createElement(component.exports.default,props));
  const svg=markup.match(/<svg[\s\S]*?<\/svg>/)[0].replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" ');
  const img=await loadImage(Buffer.from(svg));ctx.drawImage(img,i*200+40,15,120,120);
  ctx.fillStyle='#a8b9cb';ctx.font='13px monospace';ctx.textAlign='center';ctx.fillText(['READY','RECHARGING','3 CASTS LEFT'][i],i*200+100,162);
 }
 fs.writeFileSync(path.join(out,'sun-cooling-hud.png'),canvas.toBuffer('image/png'));
})().catch(error=>{console.error(error);process.exitCode=1;});

// Compare ordinary water with the empowered pressure burst at several actual animation ages.
const waveSheet=createCanvas(1200,600),wc=waveSheet.getContext('2d');wc.fillStyle='#100e1b';wc.fillRect(0,0,1200,600);
for(const [row,empowered] of [false,true].entries())for(const [col,age] of [3,10,20,30].entries()) {
 const x=col*300+150,y=row*300+155;art.drawCoolingRipple(wc,x,y,36-age,empowered,120);
 wc.fillStyle='#9db9cc';wc.font='12px monospace';wc.textAlign='center';wc.fillText((empowered?'EMPOWERED':'NORMAL')+' · '+age+' ticks',x,row*300+285);
}
fs.writeFileSync(path.join(out,'sun-cooling-wave-stages.png'),waveSheet.toBuffer('image/png'));
const skills=createCanvas(800,155),sk=skills.getContext('2d');sk.fillStyle='#0b1020';sk.fillRect(0,0,800,155);
for(const [i,kind] of ['fiery_king','sea_chanter','thorn_weaver','splitter_queen'].entries()) {
 sk.save();sk.translate(i*200,0);renderer.exports.drawGuideCelestial(sk,kind,.35,80);sk.restore();
 sk.fillStyle='#b8c6d9';sk.font='12px monospace';sk.textAlign='center';sk.fillText(['SOLAR FLARE',"NEPTUNE’S TIDE","GAIA’S ROOTS",'LUNAR ECHO'][i],i*200+100,140);
}
fs.writeFileSync(path.join(out,'celestial-guide-casts.png'),skills.toBuffer('image/png'));

const onset=engine.createModeState('trial','fiery_king');engine.godSpawnBoss(onset,'fiery_king');
const king=sun.sunBoss(onset);king.x=14.5*c.TILE_SIZE;king.y=10.5*c.TILE_SIZE;king.tileX=king.targetTileX=14;king.tileY=king.targetTileY=10;
onset.sun.heat=0;onset.sun.empoweredCasts=5;onset.resources=[];
const quenchSheet=createCanvas(1280,720),qc=quenchSheet.getContext('2d');
for(const [i,age] of [0,12,30,65].entries()) {
 onset.sun.quenchedTicks=c.SUN.quenchTicks-age;onset.gameTick=age;
 const cv=createCanvas(1280,720);renderer.exports.drawGame(cv.getContext('2d'),onset,1280,720,age,0,false);
 qc.drawImage(cv,(i%2)*640,Math.floor(i/2)*360,640,360);
}
fs.writeFileSync(path.join(out,'sun-zero-heat-stages.png'),quenchSheet.toBuffer('image/png'));

// Battlefield and enlarged actual minimap: solar, meteor, and simultaneous warnings.
const warnings=createCanvas(1280,1440),warn=warnings.getContext('2d');
for(const [i,label] of ['SUNBURST · 8s','METEOR · 3s','BOTH · SAME ROOM'].entries()) {
 const st=engine.createModeState('trial','fiery_king'); st.enemies=[];st.resources=[];st.gameTick=120;
 st.sun.flare=i===1?null:{room:0,ticks:i===2?120:480};
 st.meteoriteWarning=i===0?-1:0;st.meteoriteStrikeIn=180;
 const before=JSON.stringify(st);const purity=createCanvas(1280,720).getContext('2d');
 art.drawSunGround(purity,st,0,0,120);
 if(JSON.stringify(st)!==before)throw new Error('Sunburst warning mutated simulation');
 const cv=createCanvas(1280,720);renderer.exports.drawGame(cv.getContext('2d'),st,1280,720,120,0,false);
 warn.fillStyle='#0b0e19';warn.fillRect(0,i*480,1280,480);warn.drawImage(cv,0,i*480+24,832,468);
 const mini=createCanvas(220,220);renderer.exports.drawMinimap(mini.getContext('2d'),st,220,120);
 warn.imageSmoothingEnabled=false;warn.drawImage(mini,840,i*480+25,432,432);
 warn.fillStyle='#ffe778';warn.font='bold 16px monospace';warn.textAlign='left';warn.fillText(label,16,i*480+20);
}
fs.writeFileSync(path.join(out,'sun-warning-comparison.png'),warnings.toBuffer('image/png'));
