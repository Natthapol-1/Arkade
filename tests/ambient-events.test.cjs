const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts'),events=require('../app/ruby-star/events.ts');
function player(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*48;s.playerY=(y+.5)*48;s.playerStepProgress=0;s.playerChamber=c.chamberOfTile(x,y);}
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;return s;}
function activate(s,kind){assert.equal(e.triggerAmbientEvent(s,kind),true);for(let i=0;i<events.AMBIENT_WARNING_TICKS;i++)events.updateAmbientEvents(s);assert.equal(s.ambientEvents.active.kind,kind);}
function ticks(s,n){for(let i=0;i<n;i++)e.tick(s);}
function enemy(s,type='normal',x=10,y=10){e.godSpawnBoss(s,'frost_warden');const template=s.enemies[0];s.noBossSpawns=true;const a={...template,type,x:(x+.5)*48,y:(y+.5)*48,tileX:x,tileY:y,targetTileX:x,targetTileY:y,stepProgress:0,path:[],pathTimer:0,attackTimer:0,windupTicks:0,hp:100,maxHp:100};s.enemies=[a];return a;}

test('all three events warn for three seconds, refuse overlap and honor teleport/choice/loss pause',()=>{
 for(const kind of Object.keys(e.AMBIENT_EVENTS)){
  const s=fresh();assert.equal(e.triggerAmbientEvent(s,kind),true);assert.equal(e.triggerAmbientEvent(s,kind),false);
  for(const phase of ['teleporting','constellation','lost']){s.gamePhase=phase;const before=JSON.stringify(s.ambientEvents);ticks(s,10);assert.equal(JSON.stringify(s.ambientEvents),before);assert.equal(e.triggerAmbientEvent(s,kind),false);}
  s.gamePhase='playing';for(let i=0;i<179;i++)events.updateAmbientEvents(s);assert.equal(s.ambientEvents.active,null);
  events.updateAmbientEvents(s);assert.equal(s.ambientEvents.warning,null);assert.equal(s.ambientEvents.active.kind,kind);
  s.gamePhase='teleporting';const before=JSON.stringify(s.ambientEvents);ticks(s,30);assert.equal(JSON.stringify(s.ambientEvents),before);
 }
});
test('natural events are infrequent, defer announcements, cycle all types and restart cleanly',()=>{
 const s=fresh();assert.ok(s.ambientEvents.timer>=4500&&s.ambientEvents.timer<=6900);s.ambientEvents.timer=1;s.meteoriteWarning=0;
 events.updateAmbientEvents(s);assert.equal(s.ambientEvents.warning,null);s.meteoriteWarning=-1;s.bossWarningTicks=10;events.updateAmbientEvents(s);assert.equal(s.ambientEvents.warning,null);
 s.bossWarningTicks=0;s.bossSpawnTicks=10;events.updateAmbientEvents(s);assert.equal(s.ambientEvents.warning,null);s.bossSpawnTicks=0;
 const seen=new Set();for(let i=0;i<3;i++){
  s.ambientEvents.timer=0;events.updateAmbientEvents(s);seen.add(s.ambientEvents.warning.kind);
  for(let n=0;n<180;n++)events.updateAmbientEvents(s);s.ambientEvents.active.ticks=1;events.updateAmbientEvents(s);
  assert.ok(s.ambientEvents.timer>=5400&&s.ambientEvents.timer<=9000);
 }assert.equal(seen.size,3);assert.equal(e.createInitialState().ambientEvents.active,null);assert.equal(e.createInitialState().ambientEvents.rewardTicks,0);
});
test('black hole pulls player and aliens toward center without moving Ruby or crossing walls',()=>{
 const s=fresh();for(let y=16;y<=22;y++)for(let x=16;x<=22;x++)s.map[y][x]=c.T_FLOOR;
 player(s,18,18);const a=enemy(s,'normal',18,19);s.rubyTileX=17;s.rubyTileY=17;activate(s,'blackhole');e.tick(s);
 assert.ok(s.playerKnockback);assert.equal(a.tileY,19);assert.equal(a.tileX,19);ticks(s,10);assert.equal(s.playerTileX,19);assert.equal(s.playerTileY,18);
 assert.equal(s.rubyTileX,17);assert.equal(s.rubyTileY,17);
 const blocked=fresh();player(blocked,19,19);activate(blocked,'blackhole');blocked.map[19][20]=blocked.map[20][19]=c.T_WALL;
 e.tick(blocked);assert.equal(blocked.playerKnockback,null);assert.equal(blocked.playerTileX,19);assert.equal(blocked.playerTileY,19);
});
test('black hole does no direct damage and expires after seven seconds',()=>{
 const s=fresh();s.playerHP=s.rubyHP=100;activate(s,'blackhole');ticks(s,420);
 assert.equal(s.ambientEvents.active,null);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);
});
test('star landing is telegraphed on floor away from a warned chamber; reward occurs once after landing',()=>{
 const s=fresh();s.meteoriteWarning=0;activate(s,'shootingStar');const point=s.ambientEvents.active.points[0];
 assert.notEqual(c.chamberOfTile(point.x,point.y),0);assert.equal(s.map[point.y][point.x],c.T_FLOOR);s.meteoriteWarning=-1;
 player(s,point.x,point.y);s.playerHP=40;s.rubyHP=30;s.starEnergy=0;s.seaHealingDebuffTicks=180;
 ticks(s,35);assert.equal(s.playerHP,40);assert.equal(s.starEnergy,0);e.tick(s);
 assert.equal(s.playerHP,54);assert.equal(s.rubyHP,50);assert.equal(s.starEnergy,100);assert.ok(s.speedActiveTicks>0);assert.equal(s.ambientEvents.active,null);assert.equal(s.ambientEvents.rewardTicks,180);assert.equal(e.triggerAmbientEvent(s,'eclipse'),false);
 e.tick(s);assert.equal(s.playerHP,54);assert.equal(s.rubyHP,50);
});
test('uncollected stellar shard expires and never modifies the ordinary resource cap',()=>{
 const s=fresh();activate(s,'shootingStar');const resources=JSON.stringify(s.resources);s.ambientEvents.active.ticks=1;e.tick(s);
 assert.equal(s.ambientEvents.active,null);assert.equal(s.ambientEvents.rewardTicks,0);assert.equal(JSON.stringify(s.resources),resources);
});
test('Eclipse stops enemy attacks/movement and hostile waves/poison while player actions and meteors still work',()=>{
 const s=fresh();player(s,10,10);const a=enemy(s,'normal',10,10);a.targeting='player';activate(s,'eclipse');
 const hp=s.playerHP,position=[a.x,a.y],timer=a.attackTimer;s.thornPoisonTicks=120;s.thornPoisonTimer=1;
 ticks(s,120);assert.equal(s.playerHP,hp);assert.deepEqual([a.x,a.y],position);assert.equal(a.attackTimer,timer);assert.equal(s.thornPoisonTimer,1);
 e.useLaser(s);assert.ok(s.laserCooldown>0);
 s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.tick(s);assert.equal(s.playerHP,hp-c.METEORITE_PLAYER_DMG);
});
test('Eclipse pauses real boss mechanics but expires and resumes AI',()=>{
 const s=fresh();const a=enemy(s,'fiery_king',10,10);a.king={untouchedTicks:0,arenaWindupTicks:0};activate(s,'eclipse');
 ticks(s,100);assert.equal(a.king.untouchedTicks,0);s.ambientEvents.active.ticks=1;e.tick(s);assert.equal(s.ambientEvents.active,null);assert.ok(a.king.untouchedTicks>0);
});
test('meteor landing starts a cosmetic impact that pauses, expires and clears on restart',()=>{
 const s=fresh();s.godMode=true;s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.tick(s);
 assert.deepEqual(s.meteoriteImpact,{chamber:0,ticks:60});assert.equal(s.meteoriteWarning,-1);
 s.gamePhase='teleporting';ticks(s,20);assert.equal(s.meteoriteImpact.ticks,60);
 s.gamePhase='playing';ticks(s,59);assert.equal(s.meteoriteImpact.ticks,1);e.tick(s);assert.equal(s.meteoriteImpact,null);
 assert.equal(e.createInitialState().meteoriteImpact,null);
});
