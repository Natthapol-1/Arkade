const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),source=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');"+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('// Challenge HUD centre: the guardian'))+';exports.draw={drawPlayer,drawCelestialCast};';
const renderer=new Module(path.resolve('app/ruby-star/celestial-gallery.cjs'),module);renderer.filename=path.resolve('app/ruby-star/celestial-gallery.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const draw=renderer.exports.draw,output=process.argv[2],frames=path.join(output,'celestial-cast-frames');fs.mkdirSync(frames,{recursive:true});
const kinds=['fiery_king','splitter_queen','storm_reaper','devourer','frost_warden','blind_prayer','sea_chanter','thorn_weaver','aegis_sentinel','astral_twins'];
const states=kinds.map(kind=>{const s=engine.createInitialState();s.noMobs=true;s.godMode=true;s.noBossSpawns=true;s.specialSkill=kind;engine.useSpecialSkill(s);return s;});
for(let frame=0;frame<34;frame++){
 const canvas=createCanvas(1440,1200),ctx=canvas.getContext('2d');ctx.fillStyle='#0b1320';ctx.fillRect(0,0,1440,1200);
 for(const [i,kind]of kinds.entries()){
  const x=i%4*360,y=Math.floor(i/4)*400,s=states[i],duration=kind==='splitter_queen'?54:kind==='fiery_king'?48:36,age=frame*2/duration;
  ctx.strokeStyle='#243141';ctx.lineWidth=1;ctx.strokeRect(x+8,y+8,344,384);
  ctx.fillStyle=kind==='devourer'?'#d5d5e6':c.SPECIAL_SKILLS[kind].color;ctx.font='17px monospace';ctx.textAlign='center';ctx.fillText(c.SPECIAL_SKILLS[kind].name,x+180,y+36);
  ctx.save();ctx.beginPath();ctx.rect(x+10,y+50,340,340);ctx.clip();ctx.translate(x+180,y+220);
  const scale=kind==='sea_chanter'?.4:kind==='storm_reaper'?.55:1;ctx.scale(scale,scale);
  draw.drawPlayer(ctx,0,0,s,frame*2);
  if(age<1)draw.drawCelestialCast(ctx,kind,0,0,age,frame*2);
  ctx.restore();
 }
 fs.writeFileSync(path.join(frames,`frame-${String(frame).padStart(2,'0')}.png`),canvas.toBuffer('image/png'));
 if(frame===6)fs.writeFileSync(path.join(output,'all-celestial-casts.png'),canvas.toBuffer('image/png'));
 states.forEach(s=>{engine.tick(s);engine.tick(s);});
}
console.log('Rendered all ten live cast effects and player poses across 34 frames.');
