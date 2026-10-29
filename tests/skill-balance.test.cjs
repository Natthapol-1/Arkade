const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts'),events=require('../app/ruby-star/events.ts');
function position(a,x,y){a.tileX=a.targetTileX=x;a.tileY=a.targetTileY=y;a.x=(x+.5)*48;a.y=(y+.5)*48;a.path=[];a.pathTimer=100000;a.stepProgress=0;}
function player(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*48;s.playerY=(y+.5)*48;s.playerStepProgress=0;}
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=s.godMode=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;return s;}
function boss(s,type){e.godSpawnBoss(s,type);s.noBossSpawns=true;const a=s.enemies.find(a=>a.type===type);position(a,11,10);a.windupTicks=100000;return a;}
function ticks(s,n){for(let i=0;i<n;i++)e.tick(s);}

test('Solar kills give no energy, including Runner bonus and Leech refunds; other specials still do',()=>{
 const s=fresh(),template=boss(s,'frost_warden');s.enemies=[];
 for(let i=0;i<24;i++)s.enemies.push({...template,id:i+100,type:i===0?'fast':i===1?'energy_leech':'normal',hp:1,maxHp:10,stolenEnergy:60});
 s.starEnergy=17;s.playerHP=20;s.specialSkill='fiery_king';e.useSpecialSkill(s);
 assert.equal(s.enemies.length,0);assert.equal(s.starEnergy,17);assert.equal(s.killScore>0,true);assert.equal(s.playerHP,100);
 const a={...template,type:'normal',hp:1,maxHp:10};s.enemies=[a];s.specialSkill='storm_reaper';s.specialLockTicks=0;e.useSpecialSkill(s);assert.equal(s.starEnergy,17+c.STAR_ENERGY_PER_KILL);
});

test('Solar boss defeat still fully restores player, Ruby and energy, with normal boss rewards',()=>{
 const s=fresh(),a=boss(s,'fiery_king');a.hp=1;s.bossesKilled=9;s.playerHP=20;s.rubyHP=30;s.starEnergy=0;s.specialSkill='fiery_king';
 e.useSpecialSkill(s);assert.equal(s.bossesKilled,10);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);assert.equal(s.starEnergy,100);assert.equal(s.specialSkill,'fiery_king');
});

test('Singularity blocks Queen/Frost teleport and side effects until leaving or field expiry',()=>{
 for(const kind of ['splitter_queen','frost_warden'])for(const escape of ['leave','expire']){
  const s=fresh(),a=boss(s,kind);a.phaseTimer=1;s.specialSkill='devourer';e.useSpecialSkill(s);const original=[a.tileX,a.tileY];
  ticks(s,3);assert.deepEqual([a.tileX,a.tileY],original);assert.equal(s.enemies.length,1);
  if(escape==='leave')position(a,18,10);else s.singularity.ticks=1;
  e.tick(s);assert.notEqual(c.chamberOfTile(a.tileX,a.tileY),0);if(kind==='splitter_queen')assert.ok(s.enemies.some(a=>a.type==='queen_echo'));
 }
});

test('Shooting Star grants four-second next power, combines with Phoenix, and Sirius consumes its bonus',()=>{
 for(const phoenix of [false,true]){
  const s=fresh();if(phoenix)s.constellations=['power'];e.triggerAmbientEvent(s,'shootingStar');for(let i=0;i<180;i++)events.updateAmbientEvents(s);
  const active=s.ambientEvents.active;active.age=36;player(s,active.points[0].x,active.points[0].y);e.tick(s);
  assert.equal(s.starEnergy,100);assert.equal(s.stellarPowerBonusTicks,120);e.useLaser(s);assert.equal(s.poweredTicks,phoenix?300:240);assert.equal(s.stellarPowerBonusTicks,0);
 }
 const s=fresh();s.starEnergy=100;s.stellarPowerBonusTicks=120;s.specialSkill='blind_prayer';e.useSpecialSkill(s);assert.equal(s.poweredTicks,360);assert.equal(s.stellarPowerBonusTicks,0);
});

test('God Constellation screen freezes play and toggles every upgrade without progression or duplicates',()=>{
 const s=fresh();assert.equal(e.openGodConstellations(s),true);assert.equal(s.constellationChoices.length,20);assert.equal(s.gamePhase,'constellation');
 const before=s.gameTick;ticks(s,60);assert.equal(s.gameTick,before);
 for(const kind of Object.keys(e.CONSTELLATIONS)){assert.equal(e.chooseConstellation(s,kind),true);assert.ok(s.constellations.includes(kind));}
 assert.equal(new Set(s.constellations).size,20);assert.equal(s.bossesKilled,0);assert.equal(e.chooseConstellation(s,'invalid'),false);
 for(const kind of Object.keys(e.CONSTELLATIONS))e.chooseConstellation(s,kind);assert.deepEqual(s.constellations,[]);
 assert.equal(e.closeGodConstellations(s),true);assert.equal(s.gamePhase,'playing');assert.deepEqual(s.constellationChoices,[]);assert.equal(s.godConstellationMode,false);
 s.gamePhase='lost';assert.equal(e.openGodConstellations(s),false);assert.equal(e.createInitialState().godConstellationMode,false);
});


test('Solar bomber cascades give no energy even when they finish an earlier surviving target',()=>{
 const s=fresh(),template=boss(s,'frost_warden');
 const armor={...template,id:100,type:'armored',hp:40,maxHp:40},bomber={...template,id:101,type:'bomber',hp:1,maxHp:10};position(armor,11,10);position(bomber,11,11);
 s.enemies=[armor,bomber];s.starEnergy=0;s.specialSkill='fiery_king';e.useSpecialSkill(s);assert.equal(s.enemies.length,0);assert.equal(s.starEnergy,0);
});
