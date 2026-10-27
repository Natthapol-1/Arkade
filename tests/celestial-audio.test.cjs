const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
const expected={fiery_king:'solar-flare.wav',storm_reaper:'jupiter-storm.wav',splitter_queen:'lunar-echo.wav',devourer:'singularity.wav',frost_warden:'saturn-guard.wav',sea_chanter:'neptune-tide.wav',blind_prayer:'sirius-surge.wav',thorn_weaver:'gaia-reach.wav'};
test('celestial casts play their assigned clips and requested layers',()=>{
 const old=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push({src:this.src,volume:this.volume,loop:this.loop});return Promise.resolve();}pause(){}};
 try{for(const [kind,file]of Object.entries(expected)){
  const s=engine.createInitialState();s.specialSkill=kind;const start=played.length;engine.useSpecialSkill(s);
  const cast=played[start];
  assert.equal(played.length,start+(kind==='storm_reaper'?3:['blind_prayer','fiery_king','sea_chanter'].includes(kind)?2:1));assert.equal(cast.src,'/sounds/celestial/'+file);assert.ok(cast.volume>0&&cast.volume<=1);assert.equal(cast.loop,kind==='devourer');assert.ok(fs.existsSync('public/sounds/celestial/'+file));
  if(kind==='storm_reaper'){assert.equal(cast.volume,.8*.765);assert.equal(played[start+1].volume,.75*.765);assert.equal(played[start+2].src,'/sounds/bossQueenAttack1.mp3');assert.equal(played[start+2].volume,.55*.765);}
  if(kind==='fiery_king'){
   assert.equal(cast.volume,.75*.765);assert.equal(played[start+1].src,'/sounds/celestial/solar-flare-swoosh.wav');assert.equal(played[start+1].volume,.8*.765);assert.equal(played[start+1].loop,false);assert.ok(fs.existsSync('public/sounds/celestial/solar-flare-swoosh.wav'));
  }
  if(kind==='storm_reaper'||kind==='sea_chanter'){
   const file=kind==='storm_reaper'?'jupiter-shot.wav':'neptune-electric.wav';
   assert.equal(played[start+1].src,'/sounds/celestial/'+file);assert.equal(played[start+1].loop,false);assert.ok(fs.existsSync('public/sounds/celestial/'+file));
  }
  if(kind==='blind_prayer'){
   assert.equal(cast.volume,1.3*.765);assert.equal(played[start+1].src,'/sounds/powerUpBoost.mp3');assert.equal(played[start+1].volume,.38);
  }
 }}finally{global.Audio=old;}
});
test('Singularity audio loops once per field and stops on expiry, pause, and restart',()=>{
 const old=global.Audio,voices=[];global.Audio=class{constructor(src){this.src=src;voices.push(this);}play(){return Promise.resolve();}pause(){this.stopped=true;}};
 try{
  const s=engine.createInitialState();s.specialSkill='devourer';engine.useSpecialSkill(s);
  const first=voices.at(-1);assert.equal(first.loop,true);
  engine.tick(s);assert.equal(voices.at(-1),first);assert.ok(!first.stopped);
  s.gamePhase='teleporting';engine.tick(s);assert.equal(first.stopped,true);
  s.gamePhase='playing';engine.tick(s);const resumed=voices.at(-1);assert.notEqual(resumed,first);
  s.singularity.ticks=1;engine.tick(s);assert.equal(s.singularity,null);assert.equal(resumed.stopped,true);
  s.specialSkill='devourer';engine.useSpecialSkill(s);const restarted=voices.at(-1);
  engine.createInitialState();assert.equal(restarted.stopped,true);
 }finally{engine.stopSingularitySound();global.Audio=old;}
});
test('all celestial skills have distinct colors independent of their source bosses',()=>{
 const colors=Object.values(c.SPECIAL_SKILLS).map(s=>s.color);assert.equal(new Set(colors).size,8);
 for(const [boss,skill]of Object.entries(c.SPECIAL_SKILLS))assert.notEqual(skill.color,c.ENEMY_CONFIGS[boss].color);
});
test('Gaia click repeats only with living enemies in the field and stops on pause or expiry',()=>{
 const old=global.Audio,voices=[];global.Audio=class{constructor(src){this.src=src;voices.push(this);}play(){return Promise.resolve();}pause(){this.stopped=true;}};
 try{
  const s=engine.createInitialState();s.noMobs=true;s.godMode=true;s.meteoriteTimer=100000;
  s.specialSkill='thorn_weaver';engine.useSpecialSkill(s);engine.tick(s);
  const clicks=()=>voices.filter(v=>v.src.endsWith('gaia-field-click.wav'));
  assert.equal(clicks().length,0);
  engine.godSpawnBoss(s,'frost_warden');const enemy=s.enemies.find(e=>e.type==='frost_warden');
  const place=(x,y)=>{enemy.x=x;enemy.y=y;enemy.tileX=enemy.targetTileX=Math.floor(x/c.TILE_SIZE);enemy.tileY=enemy.targetTileY=Math.floor(y/c.TILE_SIZE);};
  place(s.playerX,s.playerY);engine.tick(s);const first=clicks().at(-1);assert.equal(first.loop,true);
  engine.tick(s);assert.equal(clicks().at(-1),first);
  place(39.5*c.TILE_SIZE,39.5*c.TILE_SIZE);engine.tick(s);assert.equal(first.stopped,true);
  place(s.playerX,s.playerY);engine.tick(s);const second=clicks().at(-1);assert.notEqual(second,first);
  s.gamePhase='teleporting';engine.tick(s);assert.equal(second.stopped,true);
  s.gamePhase='playing';engine.tick(s);const third=clicks().at(-1);
  s.celestialField.ticks=1;engine.tick(s);assert.equal(third.stopped,true);
 }finally{engine.stopGaiaFieldSound();global.Audio=old;}
});
