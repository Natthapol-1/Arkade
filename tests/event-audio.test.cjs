const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const audio=require('../app/ruby-star/event-audio.ts'),events=require('../app/ruby-star/events.ts'),e=require('../app/ruby-star/engine.ts');
function mock(run){const previous=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;this.currentTime=0;}play(){this.paused=false;played.push(this);return Promise.resolve();}pause(){this.paused=true;}};try{run(played);}finally{audio.stopAmbientEventSounds();global.Audio=previous;}}
test('every event has distinct warning/arrival audio, valid assets, and no per-frame repeats',()=>mock(played=>{
 const warnings=new Set(),arrivals=new Set();
 for(const kind of Object.keys(events.AMBIENT_EVENTS)){
  const s=e.createInitialState();e.triggerAmbientEvent(s,kind);warnings.add(played.at(-1).src);
  const count=played.length;assert.equal(e.triggerAmbientEvent(s,kind),false);assert.equal(played.length,count);
  for(let i=0;i<180;i++)events.updateAmbientEvents(s);arrivals.add(played.slice(count).map(v=>v.src+'@'+v.playbackRate).join('|'));
  const after=played.length;for(let i=0;i<20;i++)events.updateAmbientEvents(s);assert.equal(played.length,after);
 }
 assert.equal(warnings.size,4);assert.equal(arrivals.size,4);
 for(const voice of played){assert.ok(fs.existsSync('public'+voice.src));assert.ok(voice.volume>0&&voice.volume<=1);assert.ok(voice.playbackRate>0);assert.equal(voice.preservesPitch,false);}
}));
test('Supernova charge cue plays once and event sounds stop on pause or explicit cleanup',()=>mock(played=>{
 const s=e.createInitialState();e.triggerAmbientEvent(s,'supernova');for(let i=0;i<180;i++)events.updateAmbientEvents(s);
 assert.equal(events.hitSupernova(s,()=>true),true);assert.ok(played.at(-1).src.endsWith('solar-flare-swoosh.wav'));
 const count=played.length;events.hitSupernova(s,()=>true);assert.equal(played.length,count);
 s.gamePhase='teleporting';e.tick(s);assert.ok(played.every(v=>v.paused&&v.currentTime===0));
 audio.playAmbientEventSound('shootingStar','active');const voice=played.at(-1);voice.currentTime=99;voice.ontimeupdate();assert.equal(voice.paused,true);
 audio.stopAmbientEventSounds();
}));
test('hidden pages suppress event audio and shooting-star pickup has a distinct cue',()=>mock(played=>{
 const previous=global.document;global.document={hidden:true};try{audio.playAmbientEventSound('supernova','active');assert.equal(played.length,0);}finally{global.document=previous;}
 const s=e.createInitialState();e.triggerAmbientEvent(s,'shootingStar');for(let i=0;i<180;i++)events.updateAmbientEvents(s);
 const a=s.ambientEvents.active,p=a.points[0];a.age=36;s.playerTileX=p.x;s.playerTileY=p.y;
 assert.equal(events.updateAmbientEvents(s),true);assert.ok(played.at(-1).src.endsWith('energy-pickup.wav'));
 const count=played.length;events.updateAmbientEvents(s);assert.equal(played.length,count);
}));


test('Black Hole warns with Solar swoosh and overlaps reverse pulses every 0.35s with bounded voices',()=>mock(played=>{
 const s=e.createInitialState();e.triggerAmbientEvent(s,'blackhole');assert.ok(played.at(-1).src.endsWith('/solar-flare-swoosh.wav'));
 for(let i=0;i<180;i++)events.updateAmbientEvents(s);
 let pulse=played.at(-1);assert.ok(pulse.src.endsWith('/reverse.mp3'));assert.ok(!pulse.loop);
 const count=played.length;for(let i=0;i<60;i++)events.updateAmbientEvents(s);assert.equal(played.length,count+2);
 assert.equal(played.filter(v=>v.src.endsWith('/reverse.mp3')&&!v.paused).length,3);
 for(let i=0;i<100;i++)events.updateAmbientEvents(s);
 assert.ok(played.filter(v=>v.src.endsWith('/reverse.mp3')&&!v.paused).length<=4);
 s.gamePhase='teleporting';events.updateAmbientEvents(s);assert.ok(played.filter(v=>v.src.endsWith('/reverse.mp3')).every(v=>v.paused));
 const pausedCount=played.length;events.updateAmbientEvents(s);assert.equal(played.length,pausedCount);
 const existing=new Set(played);s.gamePhase='playing';events.updateAmbientEvents(s);assert.ok(played.slice(pausedCount).every(v=>existing.has(v)));pulse=played.at(-1);
 pulse.currentTime=1.21;pulse.ontimeupdate();assert.equal(pulse.paused,true);
 for(let i=0;i<21;i++)events.updateAmbientEvents(s);pulse=played.at(-1);s.ambientEvents.active.ticks=1;events.updateAmbientEvents(s);assert.equal(pulse.paused,false);const volume=pulse.volume;for(let i=0;i<12;i++)events.updateAmbientEvents(s);assert.ok(pulse.volume<volume&&pulse.volume>0);for(let i=0;i<12;i++)events.updateAmbientEvents(s);assert.equal(pulse.paused,true);
}));


test('Eclipse overlaps the same slowed dive sound every two seconds through expiry',()=>mock(played=>{
 const s=e.createInitialState();e.triggerAmbientEvent(s,'eclipse');const warning=played.at(-1);assert.equal(warning.playbackRate,.65);
 for(let i=0;i<180;i++)events.updateAmbientEvents(s);
 const first=played.at(-1),count=played.length;assert.ok(first.src.endsWith('/seaDive.mp3'));assert.equal(first.playbackRate,.65);
 for(let i=0;i<200;i++)events.updateAmbientEvents(s);assert.equal(played.length,count+1);assert.ok(!first.paused);
 assert.equal(played.filter(v=>v.src.endsWith('/seaDive.mp3')&&!v.paused).length,2);
 s.ambientEvents.active.ticks=1;events.updateAmbientEvents(s);for(let i=0;i<24;i++)events.updateAmbientEvents(s);assert.ok(played.filter(v=>v.src.endsWith('/seaDive.mp3')).every(v=>v.paused));
}));

test('teleport and rules pause event cues without rewinding, then resume the same charge voice',()=>mock(played=>{
 const s=e.createInitialState();e.triggerAmbientEvent(s,'supernova');for(let i=0;i<180;i++)events.updateAmbientEvents(s);events.hitSupernova(s,()=>true);
 const charge=played.at(-1);charge.currentTime=.7;const remaining=s.ambientEvents.active.chargeTicks;
 s.gamePhase='teleporting';e.tick(s);assert.equal(charge.paused,true);assert.equal(charge.currentTime,.7);assert.equal(s.ambientEvents.active.chargeTicks,remaining);
 s.gamePhase='playing';e.tick(s);assert.equal(charge.paused,false);assert.equal(charge.currentTime,.7);assert.equal(s.ambientEvents.active.chargeTicks,remaining-1);
 audio.pauseAmbientEventSounds();assert.equal(charge.currentTime,.7);audio.resumeAmbientEventSounds();assert.equal(charge.paused,false);
 audio.stopAmbientEventSounds();assert.equal(charge.paused,true);assert.equal(charge.currentTime,0);
}));


test('repeated cue tails fade before their cap and event-end fades pause with gameplay',()=>mock(played=>{
 const s=e.createInitialState();e.triggerAmbientEvent(s,'blackhole');for(let i=0;i<180;i++)events.updateAmbientEvents(s);
 const first=played.at(-1),gain=first.volume;first.currentTime=1.1;first.ontimeupdate();assert.ok(first.volume<gain);
 s.ambientEvents.active.ticks=1;events.updateAmbientEvents(s);events.updateAmbientEvents(s);const fading=first.volume;
 s.gamePhase='teleporting';for(let i=0;i<30;i++)events.updateAmbientEvents(s);assert.equal(first.volume,fading);assert.equal(first.paused,true);
 s.gamePhase='playing';events.updateAmbientEvents(s);assert.ok(first.volume<fading);for(let i=0;i<24;i++)events.updateAmbientEvents(s);assert.equal(first.paused,true);
}));


test('Supernova blast is louder than the ordinary bomb impact',()=>mock(played=>{
 e.playSFX_bomb();const normal=played.at(-1),start=played.length;e.playSFX_supernova();const layers=played.slice(start);
 const nova=layers.find(v=>v.src.endsWith('/bombExplode.wav')),meteor=layers.find(v=>v.src.endsWith('/meteorExplode.mp3'));
 assert.equal(layers.length,2);assert.equal(nova.volume,1);assert.ok(nova.volume>normal.volume);assert.equal(meteor.volume,.85);
}));
