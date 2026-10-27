const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),e=require('../app/ruby-star/engine.ts'),source=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(e).filter(key=>!(key in c)).join(',')+"}=require('./engine.ts');"+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('function BossSpawnButton('))+';exports.drawGame=drawGame;exports.drawAmbientEvents=drawAmbientEvents;';
const renderer=new Module(path.resolve('app/ruby-star/event-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/event-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const output=process.argv[2]||'docs/ruby-star/visual-reference/space-events-stages.png';
const cw=620,ch=390,canvas=createCanvas(cw*Object.keys(e.AMBIENT_EVENTS).length,ch*4),ctx=canvas.getContext('2d');
for(const [col,kind]of Object.keys(e.AMBIENT_EVENTS).entries()){
 const s=e.createInitialState();s.noMobs=s.noBossSpawns=s.godMode=true;s.resources=[];e.triggerAmbientEvent(s,kind);
 const warning=JSON.parse(JSON.stringify(s.ambientEvents.warning));
 let x=19,y=19;
 if(kind==='shootingStar'||kind==='supernova'){
  const point=warning.points[0];outer:for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(Math.abs(dx)+Math.abs(dy)>=3&&s.map[point.y+dy]?.[point.x+dx]===c.T_FLOOR){x=point.x+dx;y=point.y+dy;break outer;}
 }
 s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*48;s.playerY=(y+.5)*48;
 for(let row=0;row<4;row++){
  const duration=e.AMBIENT_EVENTS[kind].duration,age=row===1?(kind==='shootingStar'?12:18):row===2?(kind==='shootingStar'?52:120):duration-12;
  s.ambientEvents.warning=row===0?{...warning,ticks:40}:null;
  s.ambientEvents.active=row===0?null:{kind,points:warning.points,maxTicks:duration,ticks:duration-age,age,pullTimer:30};
  if(kind==='supernova' && row>=2){s.ambientEvents.active.chargeTicks=row===2?90:0;if(row===3)s.ambientEvents.active.blastTicks=142;}
  const before=JSON.stringify(s.ambientEvents);
  ctx.save();ctx.translate(col*cw,row*ch+26);ctx.beginPath();ctx.rect(0,0,cw,ch-26);ctx.clip();renderer.exports.drawGame(ctx,s,cw,ch-26,age,0,true);ctx.restore();
  if(JSON.stringify(s.ambientEvents)!==before)throw Error('Event rendering mutated simulation');
  ctx.fillStyle='#111b2b';ctx.fillRect(col*cw,row*ch,cw,26);ctx.fillStyle=e.AMBIENT_EVENTS[kind].color;ctx.font='bold 14px monospace';ctx.textAlign='center';
  ctx.fillText(`${e.AMBIENT_EVENTS[kind].name} / ${(kind==='supernova'?['WARNING','DORMANT','CHARGING','EXPLOSION']:['WARNING','EARLY','ACTIVE','FADING'])[row]}`,col*cw+cw/2,row*ch+18);
 }
}
fs.writeFileSync(output,canvas.toBuffer('image/png'));
console.log('Rendered actual game effects at warning, early, active and fading ages without mutating event state:',output);

// Dedicated close views of the rare star, using the same live renderer.
const novaCanvas=createCanvas(1400,1080),novaCtx=novaCanvas.getContext('2d');
for(const [i,label] of ['WARNING','DORMANT','COMPRESSING','FINAL CHARGE','RELEASE','AFTERGLOW'].entries()){
 const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.resources=[];s.screenShakeTicks=0;s.rubyTileX=15;s.rubyTileY=13;
 s.playerTileX=s.playerTargetX=14;s.playerTileY=s.playerTargetY=10;s.playerX=14.5*48;s.playerY=10.5*48;
 const event={kind:'supernova',points:[{x:10,y:10}],ticks:1200,maxTicks:2700,age:120,pullTimer:0};
 s.ambientEvents.warning=i===0?{kind:'supernova',points:event.points,ticks:40}:null;
 s.ambientEvents.active=i===0?null:event;
 if(i===2)event.chargeTicks=90;if(i===3)event.chargeTicks=12;if(i>=4){event.chargeTicks=0;event.blastTicks=i===4?142:85;}
 novaCtx.save();novaCtx.translate(i%2*700,Math.floor(i/2)*360+26);novaCtx.beginPath();novaCtx.rect(0,0,700,334);novaCtx.clip();
 renderer.exports.drawGame(novaCtx,s,700,334,120,0,false);novaCtx.restore();
 novaCtx.fillStyle='#111b2b';novaCtx.fillRect(i%2*700,Math.floor(i/2)*360,700,26);novaCtx.fillStyle='#ffbd91';novaCtx.font='bold 14px monospace';novaCtx.textAlign='center';novaCtx.fillText(label,i%2*700+350,Math.floor(i/2)*360+18);
}
fs.writeFileSync(path.join(path.dirname(output),'supernova-stages.png'),novaCanvas.toBuffer('image/png'));

const birthCanvas=createCanvas(1400,1080),birthCtx=birthCanvas.getContext('2d');
for(const [i,[warning,age,label]]of [[true,35,'STELLAR DUST'],[true,110,'FUSION CURRENTS'],[true,172,'CORE COLLAPSE'],[false,8,'IGNITION'],[false,30,'CORONA RELEASE'],[false,100,'STABLE STAR']].entries()){
 const s=e.createInitialState();s.resources=[];s.screenShakeTicks=0;s.rubyTileX=15;s.rubyTileY=13;
 s.playerTileX=s.playerTargetX=12;s.playerTileY=s.playerTargetY=10;s.playerX=12.5*48;s.playerY=10.5*48;
 const point={x:10,y:10};s.ambientEvents.warning=warning?{kind:'supernova',ticks:180-age,points:[point]}:null;
 s.ambientEvents.active=warning?null:{kind:'supernova',points:[point],ticks:2700-age,maxTicks:2700,age,pullTimer:0};
 const before=JSON.stringify(s);
 birthCtx.save();birthCtx.translate(i%2*700,Math.floor(i/2)*360+26);birthCtx.beginPath();birthCtx.rect(0,0,700,334);birthCtx.clip();renderer.exports.drawGame(birthCtx,s,700,334,age,0,false);birthCtx.restore();
 if(JSON.stringify(s)!==before)throw Error('Supernova formation rendering mutated state');
 birthCtx.fillStyle='#111b2b';birthCtx.fillRect(i%2*700,Math.floor(i/2)*360,700,26);birthCtx.fillStyle='#ffbd91';birthCtx.font='bold 14px monospace';birthCtx.textAlign='center';birthCtx.fillText(label,i%2*700+350,Math.floor(i/2)*360+18);
}
fs.writeFileSync(path.join(path.dirname(output),'supernova-formation.png'),birthCanvas.toBuffer('image/png'));

const prepCanvas=createCanvas(1200,1080),prepCtx=prepCanvas.getContext('2d');
for(const [row,age]of [35,100,165].entries())for(const [col,kind]of ['blackhole','shootingStar'].entries()){
 const s=e.createInitialState(),point={x:25,y:25};s.ambientEvents.warning={kind,points:[point],ticks:180-age};s.ambientEvents.active=null;
 const before=JSON.stringify(s);prepCtx.save();prepCtx.translate(col*600,row*360+26);prepCtx.beginPath();prepCtx.rect(0,0,600,334);prepCtx.clip();
 prepCtx.fillStyle='#0b1424';prepCtx.fillRect(0,0,600,334);prepCtx.strokeStyle='#142237';prepCtx.lineWidth=1;
 for(let x=0;x<600;x+=48){prepCtx.beginPath();prepCtx.moveTo(x,0);prepCtx.lineTo(x,334);prepCtx.stroke();}
 for(let y=0;y<334;y+=48){prepCtx.beginPath();prepCtx.moveTo(0,y);prepCtx.lineTo(600,y);prepCtx.stroke();}
 renderer.exports.drawAmbientEvents(prepCtx,s,25.5*48-300,25.5*48-190,600,334);prepCtx.restore();
 if(JSON.stringify(s)!==before)throw Error('Warning renderer mutated simulation');
 prepCtx.fillStyle='#111b2b';prepCtx.fillRect(col*600,row*360,600,26);prepCtx.fillStyle=e.AMBIENT_EVENTS[kind].color;prepCtx.font='bold 14px monospace';prepCtx.textAlign='center';prepCtx.fillText(`${e.AMBIENT_EVENTS[kind].name} / ${age} TICKS`,col*600+300,row*360+18);
}
fs.writeFileSync(path.join(path.dirname(output),'event-warning-identities.png'),prepCanvas.toBuffer('image/png'));

const coreCanvas=createCanvas(1200,420),coreCtx=coreCanvas.getContext('2d');
for(const [col,age]of [46,57,77].entries()){
 const s=e.createInitialState();s.ambientEvents.active={kind:'blackhole',points:[{x:25,y:25}],age,ticks:420-age,maxTicks:420,pullTimer:45};s.ambientEvents.warning=null;
 const before=JSON.stringify(s);coreCtx.save();coreCtx.translate(col*400,26);coreCtx.beginPath();coreCtx.rect(0,0,400,394);coreCtx.clip();coreCtx.fillStyle='#0b1424';coreCtx.fillRect(0,0,400,394);
 renderer.exports.drawAmbientEvents(coreCtx,s,25.5*48-200,25.5*48-197,400,394);coreCtx.restore();if(JSON.stringify(s)!==before)throw Error('Core rendering mutated state');
 coreCtx.fillStyle='#111b2b';coreCtx.fillRect(col*400,0,400,26);coreCtx.fillStyle='#d4acff';coreCtx.font='bold 14px monospace';coreCtx.textAlign='center';coreCtx.fillText(['PULL','RECOVERY','IDLE'][col],col*400+200,18);
}
fs.writeFileSync(path.join(path.dirname(output),'blackhole-core-motion.png'),coreCanvas.toBuffer('image/png'));

const transitionCanvas=createCanvas(1200,1080),transitionCtx=transitionCanvas.getContext('2d');
for(const [i,age]of [-1,0,12,24,35,36].entries()){
 const s=e.createInitialState(),point={x:25,y:25};s.ambientEvents.warning=age<0?{kind:'shootingStar',points:[point],ticks:1}:null;
 s.ambientEvents.active=age<0?null:{kind:'shootingStar',points:[point],age,ticks:1836-age,maxTicks:1836,pullTimer:0};
 const before=JSON.stringify(s);transitionCtx.save();transitionCtx.translate(i%2*600,Math.floor(i/2)*360+26);transitionCtx.beginPath();transitionCtx.rect(0,0,600,334);transitionCtx.clip();transitionCtx.fillStyle='#0b1424';transitionCtx.fillRect(0,0,600,334);
 renderer.exports.drawAmbientEvents(transitionCtx,s,25.5*48-300,25.5*48-240,600,334);transitionCtx.restore();if(JSON.stringify(s)!==before)throw Error('Transition renderer mutated state');
 transitionCtx.fillStyle='#111b2b';transitionCtx.fillRect(i%2*600,Math.floor(i/2)*360,600,26);transitionCtx.fillStyle='#ffe4a0';transitionCtx.font='bold 14px monospace';transitionCtx.textAlign='center';transitionCtx.fillText(age<0?'FINAL WARNING':`DESCENT / ${age} TICKS`,i%2*600+300,Math.floor(i/2)*360+18);
}
fs.writeFileSync(path.join(path.dirname(output),'shooting-star-warning-transition.png'),transitionCanvas.toBuffer('image/png'));

const atmosphereCanvas=createCanvas(1400,1080),atmosphereCtx=atmosphereCanvas.getContext('2d');
for(const [col,kind]of ['blackhole','eclipse'].entries())for(const [row,stage]of ['ARRIVAL','ACTIVE','ENDING'].entries()){
 const s=e.createInitialState(),duration=e.AMBIENT_EVENTS[kind].duration,age=row===0?18:row===1?150:duration-18;
 s.playerTileX=s.playerTargetX=19;s.playerTileY=s.playerTargetY=19;s.playerX=s.playerY=19.5*48;s.resources=[];s.screenShakeTicks=0;
 s.ambientEvents.warning=null;s.ambientEvents.active={kind,points:[{x:25,y:25}],age,ticks:duration-age,maxTicks:duration,pullTimer:45};
 const before=JSON.stringify(s);atmosphereCtx.save();atmosphereCtx.translate(col*700,row*360+26);atmosphereCtx.beginPath();atmosphereCtx.rect(0,0,700,334);atmosphereCtx.clip();renderer.exports.drawGame(atmosphereCtx,s,700,334,age,0,true);atmosphereCtx.restore();
 if(JSON.stringify(s)!==before)throw Error('Atmosphere renderer mutated state');
 atmosphereCtx.fillStyle='#111b2b';atmosphereCtx.fillRect(col*700,row*360,700,26);atmosphereCtx.fillStyle=e.AMBIENT_EVENTS[kind].color;atmosphereCtx.font='bold 14px monospace';atmosphereCtx.textAlign='center';atmosphereCtx.fillText(`${e.AMBIENT_EVENTS[kind].name} / ${stage}`,col*700+350,row*360+18);
}
fs.writeFileSync(path.join(path.dirname(output),'gravity-eclipse-atmosphere.png'),atmosphereCanvas.toBuffer('image/png'));
