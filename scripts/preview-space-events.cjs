const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),e=require('../app/ruby-star/engine.ts'),source=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(e).filter(key=>!(key in c)).join(',')+"}=require('./engine.ts');"+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('function BossSpawnButton('))+';exports.drawGame=drawGame;';
const renderer=new Module(path.resolve('app/ruby-star/event-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/event-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const output=process.argv[2]||'docs/ruby-star/visual-reference/space-events-stages.png';
const cw=620,ch=390,canvas=createCanvas(cw*Object.keys(e.AMBIENT_EVENTS).length,ch*4),ctx=canvas.getContext('2d');
for(const [col,kind]of Object.keys(e.AMBIENT_EVENTS).entries()){
 const s=e.createInitialState();s.noMobs=s.noBossSpawns=s.godMode=true;s.resources=[];e.triggerAmbientEvent(s,kind);
 const warning=JSON.parse(JSON.stringify(s.ambientEvents.warning));
 let x=19,y=19;
 if(kind==='shootingStar'){
  const point=warning.points[0];outer:for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(Math.abs(dx)+Math.abs(dy)>=3&&s.map[point.y+dy]?.[point.x+dx]===c.T_FLOOR){x=point.x+dx;y=point.y+dy;break outer;}
 }
 s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*48;s.playerY=(y+.5)*48;
 for(let row=0;row<4;row++){
  const duration=e.AMBIENT_EVENTS[kind].duration,age=row===1?(kind==='shootingStar'?12:18):row===2?(kind==='shootingStar'?52:120):duration-12;
  s.ambientEvents.warning=row===0?{...warning,ticks:40}:null;
  s.ambientEvents.active=row===0?null:{kind,points:warning.points,maxTicks:duration,ticks:duration-age,age,pullTimer:30};
  const before=JSON.stringify(s.ambientEvents);
  ctx.save();ctx.translate(col*cw,row*ch+26);ctx.beginPath();ctx.rect(0,0,cw,ch-26);ctx.clip();renderer.exports.drawGame(ctx,s,cw,ch-26,age,0,true);ctx.restore();
  if(JSON.stringify(s.ambientEvents)!==before)throw Error('Event rendering mutated simulation');
  ctx.fillStyle='#111b2b';ctx.fillRect(col*cw,row*ch,cw,26);ctx.fillStyle=e.AMBIENT_EVENTS[kind].color;ctx.font='bold 14px monospace';ctx.textAlign='center';
  ctx.fillText(`${e.AMBIENT_EVENTS[kind].name} / ${['WARNING','EARLY','ACTIVE','FADING'][row]}`,col*cw+cw/2,row*ch+18);
 }
}
fs.writeFileSync(output,canvas.toBuffer('image/png'));
console.log('Rendered actual game effects at warning, early, active and fading ages without mutating event state:',output);
