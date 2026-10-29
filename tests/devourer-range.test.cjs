const assert=require('node:assert/strict'),fs=require('fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function fresh(){
 const s=engine.createInitialState();s.noMobs=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;s.ambientEvents.nextEventTicks=100000;
 s.map=s.map.map(row=>row.map(()=>c.T_FLOOR));engine.godSpawnBoss(s,'devourer');return s;
}
function place(e,x,y){Object.assign(e,{tileX:x,targetTileX:x,tileY:y,targetTileY:y,x:(x+.5)*c.TILE_SIZE,y:(y+.5)*c.TILE_SIZE,path:[],pathTimer:1000,stepProgress:0});}
function encounter(stacks,distance,target='player'){
 const s=fresh();s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;
 s.playerTileX=s.playerTargetX=40;s.playerTileY=s.playerTargetY=10;s.playerX=40.5*c.TILE_SIZE;s.playerY=10.5*c.TILE_SIZE;
 const e=s.enemies[0];place(e,40-distance,10);e.attackTimer=0;e.windupTicks=1000;e.chargeDirX=stacks;
 if(target==='ruby'){s.playerCarryingRuby=false;s.rubyTileX=40;s.rubyTileY=10;s.playerTileY=s.playerTargetY=40;s.playerY=40.5*c.TILE_SIZE;}
 engine.tick(s);return s;
}
function grunt(s,x,y){
 const g={...s.enemies[0],id:s.nextEnemyId++,type:'normal',hp:10,maxHp:10,chargeDirX:0,devourer:undefined,windupTicks:0,attackTimer:1000,pathTimer:1000};
 place(g,x,y);s.enemies.push(g);return g;
}
function close(a,b){assert.ok(Math.abs(a-b)<1e-9,a+' != '+b);}
const devourers=s=>s.enemies.filter(e=>e.type==='devourer');
// The player starts at (10,10) facing right, so the laser hits a body standing at (11,10).
function laserKill(s,e){place(e,11,10);e.hp=1;s.laserCooldown=0;engine.useLaser(s);}

test('Devourer is swift; each stack adds half a point of damage but no reach',()=>{
 assert.equal(c.ENEMY_CONFIGS.devourer.speed,3.4);assert.equal(c.DEVOURER_MAX_STACKS,3);
 for(let stacks=0;stacks<=c.DEVOURER_MAX_STACKS;stacks++){
  const range=2;
  assert.equal(encounter(stacks,range).playerHP,100-(5+.5*stacks),'player hit with '+stacks+' stacks');
  assert.equal(encounter(stacks,range+1).playerHP,100,'misses beyond range with '+stacks+' stacks');
  assert.equal(encounter(stacks,range,'ruby').rubyHP,100-(1+.5*stacks));
 }
});

test('stacks do not slow her down',()=>{
 for(const stacks of [0,3]){
  const s=fresh(),e=s.enemies[0];s.godMode=true;place(e,20,20);e.chargeDirX=stacks;e.windupTicks=1000;e.attackTimer=1000;
  e.targetTileX=21;engine.tick(s);assert.equal(e.stepProgress,3.4);
 }
});

test('eating adds a stack and a little HP up to three, then only heals',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=true;place(e,20,20);e.attackTimer=1000;e.chargeDirX=0;
 for(let i=1;i<=4;i++){
  grunt(s,22,20);e.windupTicks=0;const max=e.maxHp;e.hp=e.maxHp-20;engine.tick(s);
  if(i<=3){assert.equal(e.chargeDirX,i);assert.equal(e.maxHp,max+Math.round(max*c.DEVOURER_STACK_HP_PCT));}
  else{assert.equal(e.chargeDirX,3);assert.equal(e.maxHp,max);assert.ok(e.hp>max-20);}
  assert.equal(e.windupTicks,360);
 }
 assert.equal(c.DEVOURER_ABSORB_COOLDOWN_PER_GEN,180);
});

test('each stack splits into a half-HP copy on death; only the last copy ends the encounter',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=true;s.bossesKilled=10;e.chargeDirX=3;e.maxHp=100;
 laserKill(s,e);
 const copies=devourers(s);assert.equal(copies.length,3);assert.equal(s.bossesKilled,10);assert.equal(s.specialSkill,null);
 for(const copy of copies){
  assert.equal(copy.maxHp,50);assert.equal(copy.chargeDirX,0);assert.deepEqual(copy.devourer,{generation:1,newbornTicks:c.DEVOURER_NEWBORN_TICKS,originMaxHp:35});
  assert.equal(copy.windupTicks,c.DEVOURER_COPY_FIRST_MEAL);
 }
 for(let i=0;i<3;i++){laserKill(s,devourers(s)[0]);assert.equal(s.bossesKilled,i<2?10:11);}
 assert.equal(devourers(s).length,0);assert.equal(s.specialSkill,'devourer');
});

test('a body with no stacks leaves no copies',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=true;e.chargeDirX=0;laserKill(s,e);
 assert.equal(devourers(s).length,0);assert.equal(s.bossesKilled,1);
});

test('copies eat and split again; newborns wait only a short first meal',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=true;e.chargeDirX=1;e.maxHp=80;laserKill(s,e);
 const [copy]=devourers(s);assert.equal(copy.devourer.generation,1);
 place(copy,30,30);copy.attackTimer=1000;grunt(s,32,30);copy.windupTicks=0;engine.tick(s);
 assert.equal(copy.chargeDirX,1);assert.equal(copy.windupTicks,540);
 laserKill(s,copy);
 const next=devourers(s);assert.equal(next.length,1);assert.equal(next[0].devourer.generation,2);
 assert.equal(next[0].windupTicks,c.DEVOURER_COPY_FIRST_MEAL);assert.equal(s.bossesKilled,0);
});

test('meteors hit every Devourer body for the boss share of the original max HP',()=>{
 for(const [late,share] of [[false,.75],[true,.45]]){
  const s=fresh(),e=s.enemies[0];s.godMode=true;if(late)s.bossesKilled=c.SPECIAL_UNLOCK_KILLS;
  e.devourer.originMaxHp=100;e.maxHp=e.hp=200;place(e,5,5);e.chargeDirX=2;e.windupTicks=100000;e.attackTimer=100000;
  s.meteoriteWarning=c.chamberOfTile(5,5);s.meteoriteStrikeIn=1;engine.tick(s);
  close(e.hp,200-100*share);
  const copy={...e,id:s.nextEnemyId++,maxHp:40,hp:40,chargeDirX:1,devourer:{generation:1,newbornTicks:0,originMaxHp:100}};place(copy,6,5);s.enemies.push(copy);
  s.meteoriteWarning=c.chamberOfTile(6,5);s.meteoriteStrikeIn=1;engine.tick(s);
  assert.ok(!s.enemies.includes(copy),'a copy dies to the original-sized hit');assert.equal(s.bossesKilled,late?c.SPECIAL_UNLOCK_KILLS:0);
 }
});

test('at 0-1 stacks she heads for the nearest alien to eat; at 2+ she chases the player',()=>{
 for(const [stacks,huntsFood] of [[0,true],[1,true],[2,false]]){
  const s=fresh(),e=s.enemies[0];s.godMode=true;s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;
  place(e,20,20);e.chargeDirX=stacks;e.pathTimer=1;e.windupTicks=1000;e.attackTimer=1000;
  grunt(s,20,35);
  engine.tick(s);const last=e.path.at(-1);
  if(huntsFood)assert.deepEqual(last,[20,35],stacks+' stacks');else assert.deepEqual(last,[s.playerTileX,s.playerTileY],stacks+' stacks');
 }
});

test('newborn copies flee the player at boosted speed without biting, then return to normal',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=false;s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;e.chargeDirX=1;laserKill(s,e);
 const [copy]=devourers(s);place(copy,14,10);copy.attackTimer=0;copy.pathTimer=1;
 const hp=s.playerHP;engine.tick(s);
 assert.equal(s.playerHP,hp,'no bite while newborn');
 const away=copy.path.length&&Math.hypot(copy.path.at(-1)[0]-s.playerTileX,copy.path.at(-1)[1]-s.playerTileY)>Math.hypot(14-s.playerTileX,10-s.playerTileY);
 assert.ok(away,'flee path leads away from the player');
 copy.devourer.newbornTicks=1;place(copy,12,10);copy.attackTimer=0;copy.windupTicks=1000;engine.tick(s);
 assert.equal(copy.devourer.newbornTicks,0);engine.tick(s);assert.ok(s.playerHP<hp,'bites once grown');
});

test('newborn speed boost is 1.5x and ends with the newborn window',()=>{
 for(const [ticks,mult] of [[c.DEVOURER_NEWBORN_TICKS,c.DEVOURER_NEWBORN_SPEED_MULT],[0,1]]){
  const s=fresh(),e=s.enemies[0];s.godMode=true;place(e,20,20);e.devourer={generation:1,newbornTicks:ticks};
  e.windupTicks=1000;e.attackTimer=1000;e.targetTileX=21;e.pathTimer=1000;engine.tick(s);
  assert.ok(Math.abs(e.stepProgress-3.4*c.DEVOURER_GEN_SPEED_MULT*mult)<1e-9,`${e.stepProgress}`);
 }
});

test('the original is born with one stack and eats the moment an alien comes in reach; the cooldown starts only after a meal',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=true;place(e,20,20);e.attackTimer=1000;
 assert.equal(e.windupTicks,0);assert.equal(e.chargeDirX,c.DEVOURER_START_STACKS,'the original is born with one stack');
 for(let i=0;i<30;i++)engine.tick(s);
 assert.equal(e.windupTicks,0,'no cooldown without food');assert.equal(e.chargeDirX,1);
 grunt(s,22,20);engine.tick(s);
 assert.equal(e.chargeDirX,2);assert.equal(e.windupTicks,360);
});

test('eating cooldown adds 3s, then 4s, then 5s ... per copy generation',()=>{
 for(const [generation,seconds] of [[0,6],[1,9],[2,13],[3,18],[4,24]]){
  const s=fresh(),e=s.enemies[0];s.godMode=true;place(e,20,20);e.attackTimer=1000;e.chargeDirX=0;
  if(generation)e.devourer={generation};grunt(s,22,20);e.windupTicks=0;engine.tick(s);
  assert.equal(e.windupTicks,seconds*60,'generation '+generation);
 }
});

test('each copy generation moves 10% slower than the one before',()=>{
 for(const generation of [0,1,3]){
  const s=fresh(),e=s.enemies[0];s.godMode=true;place(e,20,20);e.chargeDirX=3;e.windupTicks=1000;e.attackTimer=1000;
  if(generation)e.devourer={generation,newbornTicks:0};e.targetTileX=21;engine.tick(s);
  assert.ok(Math.abs(e.stepProgress-3.4*.9**generation)<1e-9,'generation '+generation+': '+e.stepProgress);
 }
});

test('each copy generation bites for 80% of the previous generation',()=>{
 for(const generation of [0,1,2]){
  const s=fresh();s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;
  s.playerTileX=s.playerTargetX=40;s.playerTileY=s.playerTargetY=10;s.playerX=40.5*c.TILE_SIZE;s.playerY=10.5*c.TILE_SIZE;
  const e=s.enemies[0];place(e,38,10);e.attackTimer=0;e.windupTicks=1000;e.chargeDirX=2;
  if(generation)e.devourer={generation,newbornTicks:0};engine.tick(s);
  assert.ok(Math.abs(s.playerHP-(100-6*.8**generation))<1e-9,'generation '+generation+': '+s.playerHP);
 }
});

test('the whole family shares a cap of ten living bodies',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=true;
 for(let i=0;i<8;i++){const other={...e,id:s.nextEnemyId++,devourer:{generation:1,newbornTicks:0}};place(other,30+i,30);s.enemies.push(other);}
 e.chargeDirX=3;laserKill(s,e);
 assert.equal(devourers(s).length,c.DEVOURER_FAMILY_CAP,'8 others + 2 copies');
 const full=devourers(s)[0];full.chargeDirX=3;laserKill(s,full);
 assert.equal(devourers(s).length,c.DEVOURER_FAMILY_CAP,'a full family only replaces the body that died');
});

test('a body left alive for 20s spends a stack to bud a copy on its own',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=true;place(e,20,20);e.chargeDirX=2;e.windupTicks=100000;e.attackTimer=100000;e.pathTimer=100000;
 for(let i=0;i<c.DEVOURER_SELF_SPLIT_TICKS-1;i++)engine.tick(s);
 assert.equal(devourers(s).length,1);
 engine.tick(s);
 assert.equal(devourers(s).length,2);assert.equal(e.chargeDirX,1);assert.equal(e.devourer.splitTicks,0);
 const bud=devourers(s).find(x=>x!==e);assert.equal(bud.devourer.generation,1);assert.equal(bud.maxHp,Math.round(e.maxHp*.5));
 assert.equal(s.bossesKilled,0);
});

test('a body with no stacks or a full family does not self-split',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=true;e.chargeDirX=0;e.devourer={generation:0,splitTicks:c.DEVOURER_SELF_SPLIT_TICKS};e.windupTicks=100000;
 engine.tick(s);assert.equal(devourers(s).length,1);
 for(let i=0;i<9;i++){const other={...e,id:s.nextEnemyId++,devourer:{generation:1,newbornTicks:0}};place(other,30+i,30);s.enemies.push(other);}
 e.chargeDirX=2;engine.tick(s);assert.equal(devourers(s).length,c.DEVOURER_FAMILY_CAP);assert.equal(e.chargeDirX,2);
});

test('killing a non-final Devourer body heals the player 8 HP',()=>{
 const s=fresh(),e=s.enemies[0];s.godMode=false;s.playerHP=50;e.chargeDirX=2;laserKill(s,e);
 assert.equal(devourers(s).length,2);assert.equal(s.playerHP,58);
});

test('Devourer gains 6 HP per prior boss defeat instead of the usual 15',()=>{
 for(const defeats of [0,5,10]){
  const s=engine.createInitialState();s.noMobs=true;s.bossesKilled=defeats;engine.godSpawnBoss(s,'devourer');
  const e=s.enemies.find(x=>x.type==='devourer');assert.equal(e.maxHp,35+6*defeats);assert.equal(e.hp,e.maxHp);
 }
});
