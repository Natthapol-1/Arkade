const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),source=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');"+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('function BossSpawnButton('))+';exports.draw={drawPrayerCircle,drawChanterWave,drawSeaRipple,drawPlayer,drawCelestialCast,drawGame};';
const renderer=new Module(path.resolve('app/ruby-star/cast-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/cast-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const draw=renderer.exports.draw,output=process.argv[2]||'.';
const gallery=createCanvas(1000,450),ctx=gallery.getContext('2d');ctx.fillStyle='#101923';ctx.fillRect(0,0,1000,450);
for(let i=0;i<4;i++){ctx.fillStyle='#b8c8d9';ctx.font='15px monospace';ctx.textAlign='center';ctx.fillText(['CHANTER BOLT','CHANTER BURST','PRAYER SEAL','LUNAR CAST'][i],125+i*250,32);}
draw.drawChanterWave(ctx,150,200,1,0,40);draw.drawSeaRipple(ctx,375,200,105,.9,40);draw.drawSeaRipple(ctx,375,200,65,.35,40);
draw.drawPrayerCircle(ctx,625,200,105,40,.9);draw.drawCelestialCast(ctx,'splitter_queen',875,200,.4,40);
fs.writeFileSync(path.join(output,'attack-redesign.png'),gallery.toBuffer('image/png'));
const poses=createCanvas(1000,720),pc=poses.getContext('2d');pc.fillStyle='#101923';pc.fillRect(0,0,1000,720);
for(const [row,kind]of ['bomb','splitter_queen','thorn_weaver','devourer'].entries())for(const [col,ticks]of [24,18,10,1].entries()){
 const s=engine.createInitialState(),x=col*250+125,y=row*180+100;s.playerCastKind=kind;s.playerCastTicks=ticks;
 pc.fillStyle='#b8c8d9';pc.font='14px monospace';pc.textAlign='center';pc.fillText(kind+' '+ticks,x,y-60);
 pc.save();pc.translate(x,y);pc.scale(1.7,1.7);draw.drawPlayer(pc,0,0,s,40);pc.restore();
}
fs.writeFileSync(path.join(output,'player-cast-poses.png'),poses.toBuffer('image/png'));
for(const kind of ['splitter_queen','devourer','thorn_weaver','sea_chanter']){
 const s=engine.createInitialState();s.specialSkill=kind;engine.useSpecialSkill(s);
 for(let frame=0;frame<3;frame++){
  if(frame)for(let i=0;i<12;i++)engine.tick(s);
  const image=createCanvas(1000,700),before=JSON.stringify(s);draw.drawGame(image.getContext('2d'),s,1000,700,40+frame*12);
  if(before!==JSON.stringify(s))throw new Error('Cast rendering mutated state');
  fs.writeFileSync(path.join(output,`cast-${kind}-${frame}.png`),image.toBuffer('image/png'));
 }
}
console.log('Boss attack samples, cast poses and twelve live cast stages rendered without state mutation.');
