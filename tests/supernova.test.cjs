const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts'),events=require('../app/ruby-star/events.ts');
function position(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*48;s.playerY=(y+.5)*48;s.playerStepProgress=0;}
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;s.ambientEvents.timer=100000;position(s,8,10);return s;}
function active(s){assert.equal(e.triggerAmbientEvent(s,'supernova'),true);for(let i=0;i<180;i++)events.updateAmbientEvents(s);const a=s.ambientEvents.active;a.points=[{x:10,y:10}];s.map[10][10]=c.T_FLOOR;return a;}
function ticks(s,n){for(let i=0;i<n;i++)e.tick(s);}
function mob(s,x,y,type='normal',hp=500){e.godSpawnBoss(s,'frost_warden');const a={...s.enemies[0],type,id:s.nextEnemyId++,hp,maxHp:hp,x:(x+.5)*48,y:(y+.5)*48,tileX:x,tileY:y,targetTileX:x,targetTileY:y,path:[],pathTimer:100000,attackTimer:100000,windupTicks:100000};s.enemies=[];return a;}
test('Supernova is the rarest natural event and uses safe floor placement',()=>{
 const s=fresh();s.ambientEvents.timer=0;events.updateAmbientEvents(s);
 const bag=[...s.ambientEvents.pool,s.ambientEvents.warning.kind],counts={};for(const k of bag)counts[k]=(counts[k]||0)+1;
 assert.deepEqual(counts,{...Object.fromEntries(Object.keys(e.AMBIENT_EVENTS).map(k=>[k,k==='supernova'?1:6]))});
 const t=fresh();e.triggerAmbientEvent(t,'supernova');const p=t.ambientEvents.warning.points[0];assert.equal(t.map[p.y][p.x],c.T_FLOOR);assert.ok(Math.hypot(p.x-t.playerTileX,p.y-t.playerTileY)>=3);
});
test('bullets cannot arm or auto-target the star; lasers, wave and bomb can',()=>{
 for(const action of [e.useBullet]){const s=fresh(),a=active(s);action(s);ticks(s,5);assert.equal(a.chargeTicks,undefined);assert.equal(s.enemies.length,0);}
 for(const action of [e.useLaser,e.activateWave,s=>{s.bomb={tileX:8,tileY:10,powered:false};e.useBomb(s);}]){
  const s=fresh(),a=active(s);action(s);assert.equal(a.chargeTicks,180);events.hitSupernova(s,()=>true);assert.equal(a.chargeTicks,180);
 }
 const s=fresh(),a=active(s);position(s,35,35);e.activateWave(s);assert.equal(a.chargeTicks,undefined);
});
test('damaging celestial AoE, Singularity and Gaia pulses can trigger it',()=>{
 for(const kind of ['fiery_king','storm_reaper','devourer','thorn_weaver']){
  const s=fresh(),a=active(s);s.specialSkill=kind;e.useSpecialSkill(s);if(kind==='devourer'||kind==='thorn_weaver')ticks(s,60);assert.equal(a.chargeTicks,180);
 }
});
test('charge shrinks for three seconds, cannot be refreshed, pauses, explodes once, and expires',()=>{
 const s=fresh(),a=active(s);e.activateWave(s);position(s,32,10);s.playerHP=100;
 s.gamePhase='teleporting';ticks(s,90);assert.equal(a.chargeTicks,180);s.gamePhase='playing';
 ticks(s,179);assert.equal(a.blastTicks,undefined);assert.equal(s.playerHP,100);
 e.tick(s);assert.equal(a.blastTicks,150);const hp=s.playerHP;assert.ok(hp<100);
 ticks(s,120);assert.equal(s.playerHP,hp);ticks(s,31);assert.equal(s.ambientEvents.active,null);
 const t=fresh(),b=active(t);b.ticks=1;e.tick(t);assert.equal(t.playerHP,100);assert.equal(t.ambientEvents.active,null);
});
test('one explosion damages the whole enemy field with falloff and bosses, respects shields, and spares Ruby',()=>{
 const s=fresh(),a=active(s);position(s,39,39);s.rubyHP=40;
 const near=mob(s,11,10),far={...near,id:2,x:40.5*48,y:40.5*48,tileX:40,tileY:40},boss={...far,id:3,type:'fiery_king',king:{untouchedTicks:0,arenaWindupTicks:0}},shielded={...near,id:4,icyShieldHP:200};
 s.enemies=[near,far,boss,shielded];events.hitSupernova(s,()=>true);a.chargeTicks=1;e.tick(s);
 assert.ok(500-near.hp>500-far.hp);assert.ok(far.hp<500);assert.ok(boss.hp<500);assert.equal(shielded.hp,500);assert.ok(shielded.icyShieldHP<200);
 assert.equal(s.playerHP,100);assert.equal(s.rubyHP,40);assert.equal(s.starEnergy,0);
});
test('player falloff is shorter, opposite chamber is always safe, and God/shields work',()=>{
 for(const [x,y,damage]of [[10,10,100],[14,10,100],[20,10,100],[35,10,52],[40,10,22],[49,10,2]]){
  const s=fresh(),a=active(s);position(s,x,y);events.hitSupernova(s,()=>true);a.chargeTicks=1;e.tick(s);assert.equal(s.playerHP,100-damage);
 }
 const s=fresh(),a=active(s);a.points=[{x:19,y:19}];position(s,31,31);events.hitSupernova(s,()=>true);a.chargeTicks=1;e.tick(s);assert.equal(s.playerHP,100);
 for(const god of [false,true]){const s=fresh(),a=active(s);position(s,20,10);s.godMode=god;s.playerShieldHP=100;events.hitSupernova(s,()=>true);a.chargeTicks=1;e.tick(s);assert.equal(s.playerHP,100);assert.equal(s.playerShieldHP,god?100:0);}
});
test('environmental defeat rewards do not feed Chanter and boss progression resolves normally',()=>{
 const s=fresh(),a=active(s);position(s,39,39);const boss=mob(s,10,10,'frost_warden',100);boss.hp=1;s.enemies=[boss];s.bossesKilled=2;
 events.hitSupernova(s,()=>true);a.chargeTicks=1;e.tick(s);assert.equal(s.bossesKilled,3);assert.equal(s.constellationDelayTicks,60);assert.equal(s.enemies.length,0);
 assert.equal(e.createInitialState().ambientEvents.active,null);
});


test('laser activation respects its tile footprint, range upgrades and walls',()=>{
 for(const [x,y,wall,reach,expected]of [[8,9,false,false,false],[8,10,true,false,false],[8,10,false,false,true],[1,10,false,false,false],[1,10,false,true,true]]){
  const s=fresh(),a=active(s);position(s,x,y);
  for(let tx=x;tx<=10;tx++)s.map[y][tx]=c.T_FLOOR;
  if(wall)s.map[10][9]=c.T_WALL;if(reach)s.constellations=['laserRange'];
  e.useLaser(s);assert.equal(a.chargeTicks,expected?180:undefined);
 }
});


test('full-strength Supernova deals 100 damage with normal guard, shield and God protection',()=>{
 for(const [guard,shield,god,hp,remaining]of [[false,0,false,0,0],[true,0,false,10,0],[false,40,false,40,0],[true,100,false,100,10],[false,0,true,100,0]]){
  const s=fresh(),a=active(s);position(s,14,10);s.godMode=god;s.playerShieldHP=shield;if(guard)s.constellations=['playerGuard'];
  events.hitSupernova(s,()=>true);a.chargeTicks=1;e.tick(s);assert.equal(s.playerHP,hp);assert.equal(s.playerShieldHP,remaining);assert.equal(s.gamePhase,hp===0?'lost':'playing');
 }
});

test('distance falloff works across chamber borders and the opposite chamber is immune',()=>{
 for(const [x,y,expected]of [[31,19,100],[39,19,100],[49,19,22],[31,31,0]]){
  const s=fresh(),a=active(s);a.points=[{x:19,y:19}];position(s,x,y);events.hitSupernova(s,()=>true);a.chargeTicks=1;e.tick(s);assert.equal(s.playerHP,100-expected);
 }
});
