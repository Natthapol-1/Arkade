const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } },
).outputText, filename);
const engine = require('../app/ruby-star/engine.ts');
const constants = require('../app/ruby-star/constants.ts');

function fresh() {
  const state = engine.createInitialState();
  state.godMode = true; state.noMobs = true;
  state.meteoriteTimer = 100000;
  state.resourceTimer = -100000;
  engine.godSpawnBoss(state, 'sea_chanter');
  return { state, sea: state.enemies[0] };
}

function position(enemy, x, y) {
  enemy.tileX = enemy.targetTileX = x; enemy.tileY = enemy.targetTileY = y;
  enemy.x = x * constants.TILE_SIZE + constants.TILE_SIZE / 2;
  enemy.y = y * constants.TILE_SIZE + constants.TILE_SIZE / 2;
  enemy.path = []; enemy.pathTimer = 100000; enemy.stepProgress = 0;
}


function dive(sea) { sea.hp = 50; sea.sea.mode = 'diving'; }
function close(a,b) { assert.ok(Math.abs(a-b)<0.00001, a+' != '+b); }

test('health thresholds, no passive regeneration, hysteresis, and teleport pause', () => {
 const {state,sea}=fresh(); sea.hp=sea.maxHp*0.4; engine.tick(state);
 assert.equal(engine.isSeaChanterDiving(sea),true); close(sea.hp,sea.maxHp*0.4);
 sea.hp=sea.maxHp*0.6; engine.tick(state); assert.equal(engine.isSeaChanterDiving(sea),true);
 state.gamePhase='teleporting';const hp=sea.hp;engine.tick(state);close(sea.hp,hp);
 state.gamePhase='playing';sea.hp=sea.maxHp*0.75;engine.tick(state);assert.equal(engine.isSeaChanterDiving(sea),false);
 assert.ok(sea.sea.resurfaceTicks>0);const splash=sea.sea.resurfaceTicks;state.gamePhase='teleporting';engine.tick(state);assert.equal(sea.sea.resurfaceTicks,splash);state.gamePhase='playing';
 sea.hp=sea.maxHp*0.6;engine.tick(state);assert.equal(engine.isSeaChanterDiving(sea),false);
});

test('diving speed exceeds hunting speed', () => {
 for(const submerged of [false,true]) {const {state,sea}=fresh();position(sea,11,10);if(submerged)dive(sea);sea.targetTileX=12;engine.tick(state);close(sea.stepProgress,submerged?4.2:3.8);}
});

test('bullets skip underwater targets, including bullets already in flight',()=>{
 const {state,sea}=fresh();position(sea,11,10);dive(sea);
 const other={...sea,id:state.nextEnemyId++,type:'normal',sea:undefined,path:[]};position(other,10,14);state.enemies.push(other);
 engine.useBullet(state);assert.equal(state.laserBullets[0].dx,0);assert.ok(state.laserBullets[0].dy>0);
 state.laserBullets=[{x:11.5,y:10.5,dx:0,dy:0,powered:false,ticks:0}];engine.tick(state);close(sea.hp,50);assert.equal(state.laserBullets.length,1);
 sea.sea.mode='hunting';sea.hp=sea.maxHp;engine.tick(state);close(sea.hp,sea.maxHp-constants.BULLET_DMG);assert.equal(state.laserBullets.length,0);
});

test('wave, bomb and laser retain underwater damage',()=>{
 for(const [action,damage] of [[s=>engine.activateWave(s),constants.WAVE_DMG],[s=>{engine.useBomb(s);engine.useBomb(s);},constants.BOMB_DMG],[s=>engine.useLaser(s),constants.LASER_DMG]]){
 const {state,sea}=fresh();position(sea,11,10);dive(sea);action(state);close(sea.hp,50-damage*1.6);
 }
});

test('meteor can kill underwater boss and preserves rewards and respawn delay',()=>{
 const {state,sea}=fresh();position(sea,2,2);dive(sea);state.meteoriteWarning=0;state.meteoriteStrikeIn=1;engine.tick(state);
 assert.equal(state.bossesKilled,1);assert.ok(!state.enemies.includes(sea));assert.equal(state.bossTimer+constants.BOSS_WARNING_TICKS,42*60);
});

test('surfaced hits heal nearby allies; diving feeds only actual alien HP damage',()=>{
 const {state,sea}=fresh();position(sea,11,10);
 const ally={...sea,id:state.nextEnemyId++,type:'normal',sea:undefined,hp:10,maxHp:100,path:[]};position(ally,11,11);state.enemies.push(ally);
 engine.useLaser(state);close(ally.hp,20);
 dive(sea);position(sea,40,40);position(ally,11,10);state.laserCooldown=0;engine.useLaser(state);close(sea.hp,50+constants.LASER_DMG*0.8);
 sea.hp=50;ally.hp=100;engine.useBomb(state);engine.useBomb(state);close(sea.hp,75);
});

test('song locks aim, travels before hitting, and deals center splash damage without melee',()=>{
 const {state,sea}=fresh();state.godMode=false;position(sea,10,5);sea.sea.songCooldown=0;engine.tick(state);
 assert.equal(sea.sea.songWindupTicks,constants.SEA_SONG_WINDUP);const aim=sea.sea.songAimX;assert.equal(state.playerHP,100);
 for(let i=0;i<constants.SEA_SONG_WINDUP;i++)engine.tick(state);assert.ok(state.seaSongWaves.length>0);assert.equal(sea.sea.songAimX,aim);assert.equal(state.playerHP,100);
 for(let i=0;i<45;i++)engine.tick(state);assert.equal(state.playerHP,83);assert.equal(state.rubyHP,100);
});

test('diving cancels singing and dead casters cannot regenerate',()=>{
 const {state,sea}=fresh();sea.sea.songWindupTicks=20;dive(sea);engine.tick(state);assert.equal(state.seaSongWaves.length,0);
 sea.hp=0;engine.tick(state);assert.ok(!state.enemies.includes(sea));
});

test('normal and debug spawning recognize Sea Chanter in the exclusive boss registry', () => {
  const { state } = fresh();
  assert.equal(constants.BOSS_TYPES.length, 8);
  assert.equal(constants.ENEMY_CONFIGS.sea_chanter.maxHp, 90);
  assert.equal(state.bossSpawnName, 'SEA CHANTER');
  assert.equal(state.bossSpawnColor, constants.ENEMY_CONFIGS.sea_chanter.color);
  engine.godSpawnBoss(state, 'fiery_king');
  assert.equal(state.enemies.length, 1);
  assert.equal(state.enemies[0].type, 'fiery_king');
  state.enemies = []; state.difficultyLevel = 1; state.bossWarningTicks = 1;
  const random = Math.random; Math.random = () => (constants.BOSS_TYPES.indexOf('sea_chanter') + 0.5) / constants.BOSS_TYPES.length;
  try { engine.tick(state); } finally { Math.random = random; }
  assert.equal(state.enemies[0].type, 'sea_chanter');
  assert.ok(state.enemies[0].sea);
});

test('clockwise meteor room names now read Alpha, Beta, Gamma, Delta', () => {
  assert.deepEqual(engine.METEOR_CLOCKWISE_ORDER.map(ch => constants.CHAMBER_LABELS[ch]), ['ALPHA', 'BETA', 'GAMMA', 'DELTA']);
  assert.deepEqual(constants.TELEPORT_PADS[constants.CH_GAMMA], [39, 39]);
  assert.deepEqual(constants.TELEPORT_PADS[constants.CH_DELTA], [10, 39]);
});


test('supplied water cues mix singing with attack, throttle healing, fade and clean up',()=>{
 const played=[];const previous=global.Audio;
 global.Audio=class {constructor(path){this.path=path;this.currentTime=0;}play(){played.push(this);return Promise.resolve();}pause(){this.paused=true;}};
 try {
 const {state,sea}=fresh();position(sea,10,5);sea.sea.songCooldown=0;engine.tick(state);
 const singing=played.find(a=>a.path.endsWith('seaSinging.mp3'));assert.ok(singing);assert.equal(singing.playbackRate,1);
 for(let i=0;i<60;i++)engine.tick(state);assert.ok(!singing.paused);assert.ok(played.some(a=>a.path.endsWith('seaSong.mp3')));
 sea.hp=sea.maxHp*0.4;engine.tick(state);assert.ok(played.some(a=>a.path.endsWith('seaDive.mp3')));
 const diveVoice=played.find(a=>a.path.endsWith('seaSinging4.mp3'));assert.ok(diveVoice);
 const ally={...sea,id:state.nextEnemyId++,type:'normal',sea:undefined,hp:10,maxHp:20,path:[]};position(ally,11,10);state.enemies.push(ally);state.laserCooldown=0;engine.useLaser(state);
 const heals=played.filter(a=>a.path.endsWith('seaHeal.mp3'));assert.equal(heals.length,1);
 const heal=heals[0];const initial=heal.volume;heal.currentTime=1.4;heal.ontimeupdate();assert.ok(heal.volume<initial);
 heal.currentTime=1.7;heal.ontimeupdate();assert.ok(heal.paused);
 sea.hp=sea.maxHp*0.75;engine.tick(state);assert.ok(diveVoice.paused);
 engine.godSpawnBoss(state,'fiery_king');assert.ok(played.filter(a=>a.path.includes('/sea')).every(a=>a.paused));
 }finally{engine.createInitialState();global.Audio=previous;}
});


test('aim-point splash hits nearby player once, fades, and passes through projectile walls',()=>{
 const {state,sea}=fresh();state.godMode=false;position(sea,10,5);
 const x=state.playerX+3*constants.TILE_SIZE,y=state.playerY;
 state.seaSongWaves.push({x:x-1,y,dx:1,dy:0,rangeLeft:1,aimX:x,aimY:y,hitPlayer:false,ownerId:sea.id});
 engine.tick(state);assert.equal(state.playerHP,88);assert.equal(state.seaSongWaves.length,0);assert.equal(state.seaSongBursts.length,1);
 for(let i=0;i<constants.SEA_SONG_BLAST_TICKS;i++)engine.tick(state);assert.equal(state.seaSongBursts.length,0);assert.equal(state.playerHP,88);
 state.playerHP=100;
 state.seaSongWaves.push({x:state.playerX-30,y,dx:1,dy:0,rangeLeft:30+2*constants.TILE_SIZE,aimX:state.playerX+2*constants.TILE_SIZE,aimY:y,hitPlayer:false,ownerId:sea.id});
 for(let i=0;i<12;i++)engine.tick(state);assert.equal(state.playerHP,88);assert.equal(state.seaSongWaves.length,0);
 state.seaSongBursts=[];state.map[12][12]=constants.T_WALL;
 const wallX=12*constants.TILE_SIZE,wallY=12.5*constants.TILE_SIZE;
 state.seaSongWaves.push({x:wallX-1,y:wallY,dx:1,dy:0,rangeLeft:40,aimX:wallX+39,aimY:wallY,hitPlayer:false,ownerId:sea.id});
 engine.tick(state);assert.equal(state.seaSongWaves.length,1);
 for(let i=0;i<2;i++)engine.tick(state);assert.equal(state.seaSongWaves.length,0);assert.equal(state.seaSongBursts.length,1);
});


test('six-tile splash damage falls from 17 at center to 7 at edge and misses outside',()=>{
 for(const [distance,damage] of [[0,17],[1.5,15],[3,12],[4.5,10],[6,7],[6.1,0]]) {
  const {state,sea}=fresh();state.godMode=false;position(sea,10,5);
  const x=state.playerX+distance*constants.TILE_SIZE,y=state.playerY;
  state.seaSongWaves.push({x:x-1,y,dx:1,dy:0,rangeLeft:1,aimX:x,aimY:y,hitPlayer:false,ownerId:sea.id});
  engine.tick(state);assert.equal(state.playerHP,100-damage,'distance '+distance);
 }
});


test('surfaced healing reaches 12 tiles, crosses into hallways, and stops outside radius',()=>{
 const {state,sea}=fresh();position(sea,19,10);
 const ally=(x,y)=>{const a={...sea,id:state.nextEnemyId++,type:'normal',sea:undefined,hp:1,maxHp:20,path:[]};position(a,x,y);state.enemies.push(a);return a;};
 const far=ally(8,11),hallway=ally(25,10),edge=ally(31,10),outside=ally(32,10);
 state.playerTileX=19;state.playerTileY=9;state.playerX=19.5*constants.TILE_SIZE;state.playerY=9.5*constants.TILE_SIZE;
 engine.useLaser(state);assert.equal(far.hp,11);assert.equal(hallway.hp,11);assert.equal(edge.hp,11);assert.equal(outside.hp,1);
});


test('diving minimap reveals last one second of each eight-second cycle and pause with gameplay',()=>{
 const {state,sea}=fresh();assert.equal(engine.isEnemyVisibleOnMinimap(sea),true);dive(sea);
 for(let i=0;i<419;i++)engine.tick(state);assert.equal(engine.isEnemyVisibleOnMinimap(sea),false);
 engine.tick(state);assert.equal(engine.isEnemyVisibleOnMinimap(sea),true);
 state.gamePhase='teleporting';for(let i=0;i<90;i++)engine.tick(state);assert.equal(sea.sea.diveElapsedTicks,420);assert.equal(engine.isEnemyVisibleOnMinimap(sea),true);
 state.gamePhase='playing';for(let i=0;i<59;i++)engine.tick(state);assert.equal(engine.isEnemyVisibleOnMinimap(sea),true);
 engine.tick(state);assert.equal(engine.isEnemyVisibleOnMinimap(sea),false);
 sea.hp=sea.maxHp*0.75;engine.tick(state);assert.equal(engine.isEnemyVisibleOnMinimap(sea),true);
 sea.hp=sea.maxHp*0.4;engine.tick(state);assert.equal(sea.sea.diveElapsedTicks,1);assert.equal(engine.isEnemyVisibleOnMinimap(sea),false);
});


test('song can target through walls and splash damages through cover',()=>{
 const {state,sea}=fresh();state.godMode=false;position(sea,10,5);state.map[7][10]=constants.T_WALL;sea.sea.songCooldown=0;
 engine.tick(state);assert.equal(sea.sea.songWindupTicks,constants.SEA_SONG_WINDUP);
 state.map[10][11]=constants.T_WALL;
 const x=state.playerX+2*constants.TILE_SIZE,y=state.playerY;
 state.seaSongWaves.push({x:x-1,y,dx:1,dy:0,rangeLeft:1,aimX:x,aimY:y,hitPlayer:false,ownerId:sea.id});
 engine.tick(state);assert.equal(state.playerHP,86);
});


test('diving roams when safe, flees nearby player, and resumes roaming once player leaves range',()=>{
 const {state,sea}=fresh();position(sea,39,39);sea.pathTimer=0;dive(sea);
 engine.tick(state);assert.equal(sea.sea.diveFleeing,false);assert.ok(sea.path.length>0);
 const destination=sea.path.at(-1);assert.ok(Math.hypot(destination[0]-39,destination[1]-39)<=10);
 const startX=sea.x,startY=sea.y;for(let i=0;i<180;i++)engine.tick(state);assert.ok(Math.hypot(sea.x-startX,sea.y-startY)>constants.TILE_SIZE);
 position(sea,15,10);sea.pathTimer=0;engine.tick(state);assert.equal(sea.sea.diveFleeing,true);
 const end=sea.path.at(-1);assert.ok(Math.hypot(end[0]-state.playerTileX,end[1]-state.playerTileY)>18);
 state.playerTileX=state.playerTargetX=39;state.playerTileY=state.playerTargetY=39;state.playerX=39.5*constants.TILE_SIZE;state.playerY=39.5*constants.TILE_SIZE;
 for(let i=0;i<21;i++)engine.tick(state);assert.equal(sea.sea.diveFleeing,false);assert.ok(sea.path.length>0);
 for(const [x,y] of sea.path)assert.notEqual(state.map[y][x],constants.T_WALL);
});



test('Sea Chanter no longer reduces player healing, Ruby healing or shields',()=>{
 for(const diving of [false,true]) {
 const {state,sea}=fresh();position(sea,40,40);if(diving)dive(sea);state.playerHP=10;
 state.resources=[{type:'health',tileX:10,tileY:10}];engine.tick(state);close(state.playerHP,43);
 const victim={...sea,id:state.nextEnemyId++,type:'healer',sea:undefined,hp:1,maxHp:11,path:[]};position(victim,11,10);state.enemies.push(victim);
 state.playerHP=10;engine.useLaser(state);close(state.playerHP,39);
 state.playerCarryingRuby=false;state.rubyTileX=10;state.rubyTileY=10;state.rubyHP=20;state.enemies=state.enemies.filter(e=>e.type==='sea_chanter');
 state.playerHP=20;assert.equal(engine.healRuby(state),true);close(state.playerHP,23);assert.equal(state.rubyHP,25);
 }
});

test('diving recovery requires alien damage, clamps overkill, and respects shield absorption',()=>{
 const {state,sea}=fresh();position(sea,40,40);dive(sea);
 for(let i=0;i<600;i++)engine.tick(state);close(sea.hp,50);assert.equal(engine.isSeaChanterDiving(sea),true);
 position(sea,40,40);const victim={...sea,id:state.nextEnemyId++,type:'normal',sea:undefined,hp:1,maxHp:20,path:[],icyShieldHP:10};position(victim,11,10);state.enemies.push(victim);
 engine.useLaser(state);close(sea.hp,50);victim.icyShieldHP=0;state.laserCooldown=0;engine.useLaser(state);close(sea.hp,50.8);
});


test('surface support pulses every three seconds and on-hit healing stacks independently',()=>{
 const {state,sea}=fresh();position(sea,11,10);
 const ally={...sea,id:state.nextEnemyId++,type:'normal',sea:undefined,hp:1,maxHp:100,path:[]};position(ally,11,11);state.enemies.push(ally);
 for(let i=0;i<179;i++)engine.tick(state);assert.equal(ally.hp,1);
 state.gamePhase='teleporting';for(let i=0;i<20;i++)engine.tick(state);assert.equal(sea.sea.allyHealCooldown,1);state.gamePhase='playing';
 engine.tick(state);assert.equal(ally.hp,4);assert.ok(sea.sea.supportPulseTicks>0);
 position(ally,11,11);engine.useLaser(state);assert.equal(ally.hp,14);assert.equal(sea.sea.allyHealCooldown,180);
 for(let i=0;i<180;i++)engine.tick(state);assert.equal(ally.hp,17);
 dive(sea);for(let i=0;i<200;i++)engine.tick(state);assert.equal(ally.hp,17);close(sea.hp,50);
 sea.hp=sea.maxHp*0.75;engine.tick(state);assert.equal(ally.hp,17);assert.equal(sea.sea.allyHealCooldown,179);
});


test('periodic pulse applies local timed healing reduction; hits alone do not refresh it',()=>{
 const {state,sea}=fresh();position(sea,11,10);sea.sea.allyHealCooldown=1;engine.tick(state);assert.equal(state.seaHealingDebuffTicks,180);
 state.playerHP=10;state.resources=[{type:'health',tileX:10,tileY:10}];engine.tick(state);close(state.playerHP,33.1);
 const duration=state.seaHealingDebuffTicks;engine.useLaser(state);assert.equal(state.seaHealingDebuffTicks,duration);
 state.gamePhase='teleporting';engine.tick(state);assert.equal(state.seaHealingDebuffTicks,duration);state.gamePhase='playing';
 position(sea,40,40);for(let i=0;i<duration;i++)engine.tick(state);assert.equal(state.seaHealingDebuffTicks,0);
 state.playerHP=10;state.resources=[{type:'health',tileX:10,tileY:10}];engine.tick(state);close(state.playerHP,43);
 position(sea,11,10);sea.sea.allyHealCooldown=1;engine.tick(state);assert.equal(state.seaHealingDebuffTicks,180);
 sea.hp=1;state.laserCooldown=0;engine.useLaser(state);assert.equal(state.seaHealingDebuffTicks,0);assert.equal(state.playerHP,100);
});


test('diving vulnerability increases laser damage by 60 percent without affecting surfaced hits',()=>{
 const {state,sea}=fresh();assert.equal(sea.maxHp,90);position(sea,11,10);
 engine.useLaser(state);close(sea.hp,90-constants.LASER_DMG);
 dive(sea);state.laserCooldown=0;engine.useLaser(state);close(sea.hp,50-constants.LASER_DMG*1.6);
 sea.icyShieldHP=10;const before=sea.hp;state.laserCooldown=0;engine.useLaser(state);close(sea.hp,before);close(sea.icyShieldHP,10-constants.LASER_DMG);
});
