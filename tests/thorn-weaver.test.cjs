const assert=require('node:assert/strict'),fs=require('fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function position(enemy,x,y){enemy.tileX=enemy.targetTileX=x;enemy.tileY=enemy.targetTileY=y;enemy.x=(x+.5)*c.TILE_SIZE;enemy.y=(y+.5)*c.TILE_SIZE;enemy.path=[];enemy.pathTimer=100000;enemy.stepProgress=0;}
function player(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;s.playerStepProgress=0;}
function fresh(){const s=e.createInitialState();s.noMobs=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;e.godSpawnBoss(s,'thorn_weaver');const boss=s.enemies[0];position(boss,40,40);boss.thorn.cooldown=100000;return {s,boss};}
function ticks(s,n){for(let i=0;i<n;i++)e.tick(s);}
function cast(s,boss){boss.thorn.cooldown=0;e.tick(s);assert.equal(boss.thorn.windupTicks,c.THORN_WINDUP);}
function patch(s,boss,ticks=c.THORN_LIFETIME){s.thornPatches.push({x:s.playerX,y:s.playerY,ticks,ownerId:boss.id});}

test('off-grid thorn aims cover four complete tiles per side with matching exclusive edges',()=>{
 const {s,boss}=fresh();s.playerX+=7;s.playerY-=5;cast(s,boss);
 const bounds=c.getThornFieldBounds(boss.thorn.aimX,boss.thorn.aimY);
 for(const value of [bounds.left,bounds.top,bounds.right,bounds.bottom])assert.equal(value%c.TILE_SIZE,0);
 assert.equal(bounds.right-bounds.left,4*c.TILE_SIZE);assert.equal(bounds.bottom-bounds.top,4*c.TILE_SIZE);
 s.thornPatches=[{x:boss.thorn.aimX,y:boss.thorn.aimY,ticks:100,ownerId:boss.id}];
 for(const [x,y]of [[bounds.left+.01,bounds.top+.01],[bounds.right-.01,bounds.bottom-.01]]){
  s.map[Math.floor(y/c.TILE_SIZE)][Math.floor(x/c.TILE_SIZE)]=c.T_FLOOR;s.playerX=x;s.playerY=y;assert.equal(e.isPlayerInThorns(s),true);
 }
 s.playerX=bounds.right;assert.equal(e.isPlayerInThorns(s),false);
 s.playerX=bounds.left-0.01;assert.equal(e.isPlayerInThorns(s),false);
 s.playerX=bounds.left+1;s.playerY=bounds.bottom;assert.equal(e.isPlayerInThorns(s),false);
 s.playerY=bounds.top+1;s.map[Math.floor(s.playerY/c.TILE_SIZE)][Math.floor(s.playerX/c.TILE_SIZE)]=c.T_WALL;assert.equal(e.isPlayerInThorns(s),false);
});

test('global ground attack locks aim, warns for 1.5 seconds, and can be dodged',()=>{
 const {s,boss}=fresh();cast(s,boss);const aim=boss.thorn.aimX;player(s,14,10);ticks(s,c.THORN_WINDUP-1);
 assert.equal(s.playerHP,100);assert.equal(s.thornPatches.length,0);assert.equal(boss.thorn.aimX,aim);
 e.tick(s);assert.equal(s.playerHP,100);assert.equal(s.thornPoisonTicks,0);assert.equal(s.thornPatches.length,1);assert.equal(s.thornPatches[0].x,aim);
 assert.equal(boss.thorn.cooldown,c.ENEMY_CONFIGS.thorn_weaver.attackCooldown);
});
test('eruption deals 12, plants inflict lingering non-stacking poison, Ruby stays safe',()=>{
 const {s,boss}=fresh();cast(s,boss);ticks(s,c.THORN_WINDUP);assert.equal(s.playerHP,88);assert.ok(s.thornPoisonTicks>0);assert.equal(s.rubyHP,100);
 player(s,16,10);ticks(s,239);assert.equal(s.playerHP,80);assert.equal(s.thornPoisonTicks,0);assert.equal(s.rubyHP,100);
});
test('entering plants applies poison and slows movement without creating solid walls',()=>{
 const {s,boss}=fresh();patch(s,boss);s.playerQueuedDirX=1;e.tick(s);e.tick(s);
 assert.equal(s.playerStepProgress,c.PLAYER_BASE_SPEED*c.THORN_SLOW_MULT);assert.ok(s.thornPoisonTicks>0);assert.equal(s.map[10][11],c.T_FLOOR);
 assert.equal(s.playerHP,100);
});
test('overlapping plants refresh poison without multiplying damage, shields absorb ticks',()=>{
 const {s,boss}=fresh();patch(s,boss);patch(s,boss);s.playerShieldHP=5;ticks(s,60);assert.equal(s.playerHP,100);assert.equal(s.playerShieldHP,2);
 ticks(s,60);assert.equal(s.playerShieldHP,0);assert.equal(s.playerHP,99);
 ticks(s,60);assert.equal(s.playerShieldHP,0);assert.equal(s.playerHP,95);
});
test('casts, plant lifetime and poison pause in teleport menu; plants expire',()=>{
 const {s,boss}=fresh();patch(s,boss,10);cast(s,boss);const duration=s.thornPatches[0].ticks,poison=s.thornPoisonTicks;
 s.gamePhase='teleporting';ticks(s,120);assert.equal(boss.thorn.windupTicks,c.THORN_WINDUP);assert.equal(s.thornPatches[0].ticks,duration);assert.equal(s.thornPoisonTicks,poison);
 s.gamePhase='playing';boss.thorn.windupTicks=0;boss.thorn.cooldown=100000;player(s,16,10);ticks(s,10);assert.equal(s.thornPatches.length,0);
});
test('boss flees on legal routes and continues casting while escaping',()=>{
 const {s,boss}=fresh();position(boss,13,10);boss.pathTimer=0;cast(s,boss);assert.ok(boss.thorn.fleeing);assert.ok(boss.path.length>0);
 const end=boss.path.at(-1);assert.ok(Math.hypot(end[0]-s.playerTileX,end[1]-s.playerTileY)>c.THORN_FLEE_RANGE);
 const x=boss.x;ticks(s,30);assert.notEqual(boss.x,x);assert.equal(boss.thorn.windupTicks,60);
 for(const [tx,ty] of boss.path)assert.notEqual(s.map[ty][tx],c.T_WALL);
});
test('patch count is bounded and boss death/replacement clears plants and poison',()=>{
 const {s,boss}=fresh();s.godMode=true;
 for(let i=0;i<8;i++){boss.thorn.cooldown=0;boss.thorn.windupTicks=0;e.tick(s);ticks(s,c.THORN_WINDUP);}
 assert.ok(s.thornPatches.length<=c.THORN_MAX_PATCHES);position(boss,11,10);boss.hp=1;e.useLaser(s);
 assert.equal(s.bossesKilled,1);assert.equal(s.thornPatches.length,0);assert.equal(s.thornPoisonTicks,0);assert.equal(s.playerHP,100);
 e.godSpawnBoss(s,'thorn_weaver');patch(s,s.enemies[0]);s.thornPoisonTicks=100;e.godSpawnBoss(s,'fiery_king');assert.equal(s.thornPatches.length,0);assert.equal(s.thornPoisonTicks,0);
});
test('meteor uses boss damage and usual rewards and respawn timing',()=>{
 const {s,boss}=fresh();position(boss,2,2);s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.tick(s);assert.equal(boss.hp,20);
 s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.tick(s);assert.equal(s.bossesKilled,1);assert.equal(s.thornPatches.length,0);assert.equal(s.bossTimer+c.BOSS_WARNING_TICKS,42*60);
});
test('natural spawning and No Mobs recognize Thorn Weaver in the encounter roster',()=>{
 const {s,boss}=fresh();assert.ok(c.BOSS_TYPES.includes('thorn_weaver'));assert.equal(boss.maxHp,80);assert.equal(s.bossSpawnName,'THORN WEAVER');e.godSetNoMobs(s,true);assert.ok(s.enemies.includes(boss));
 s.enemies=[];s.difficultyLevel=1;s.bossWarningTicks=1;const random=Math.random;Math.random=()=>(c.BOSS_TYPES.indexOf('thorn_weaver')+.5)/c.BOSS_TYPES.length;try{e.tick(s);}finally{Math.random=random;}
 assert.equal(s.enemies[0].type,'thorn_weaver');assert.ok(s.enemies[0].thorn);
 e.godSpawnBoss(s,'sea_chanter');assert.equal(s.enemies.filter(x=>c.isBossType(x.type)).length,1);
});

test('square eruption and plants include diagonal corners but exclude points beyond either edge',()=>{
 const {s,boss}=fresh();player(s,10,10);cast(s,boss);player(s,12,12);
 ticks(s,c.THORN_WINDUP);assert.equal(s.playerHP,88);assert.ok(e.isPlayerInThorns(s));assert.ok(s.thornPoisonTicks>0);
 player(s,13,12);assert.equal(e.isPlayerInThorns(s),false);
 player(s,12,13);assert.equal(e.isPlayerInThorns(s),false);
});

test('cut sound plays on entry and periodic plant hits, without doubling eruption',()=>{
 const oldAudio=global.Audio, played=[];
 global.Audio=class{constructor(src){this.src=src;}play(){played.push(this.src);return Promise.resolve();}pause(){}};
 try{
  const {s,boss}=fresh();patch(s,boss);e.tick(s);
  assert.equal(played.filter(x=>x==='/sounds/cut.mp3').length,1);
  ticks(s,65);assert.equal(played.filter(x=>x==='/sounds/cut.mp3').length,2);
  player(s,16,10);e.tick(s);player(s,10,10);e.tick(s);
  assert.equal(played.filter(x=>x==='/sounds/cut.mp3').length,3);
  const next=fresh();cast(next.s,next.boss);ticks(next.s,c.THORN_WINDUP);
  assert.equal(played.filter(x=>x==='/sounds/cut.mp3').length,4);
 }finally{e.stopPoisonSound();global.Audio=oldAudio;}
});

test('poison audio finishes each sample, waits briefly, repeats, and stops on expiry and pause',()=>{
 const oldAudio=global.Audio, voices=[];
 global.Audio=class{constructor(src){this.src=src;if(src==='/sounds/poisoned.wav')voices.push(this);}play(){return Promise.resolve();}pause(){this.stopped=true;}};
 try{
  const {s,boss}=fresh();patch(s,boss);e.tick(s);assert.equal(voices.length,1);assert.equal(voices[0].loop,false);
  ticks(s,10);assert.equal(voices.length,1);voices[0].onended();ticks(s,36);assert.equal(voices.length,1);
  e.tick(s);assert.equal(voices.length,2);player(s,16,10);s.thornPoisonTicks=1;e.tick(s);assert.ok(voices[1].stopped);
  player(s,10,10);e.tick(s);assert.equal(voices.length,3);s.gamePhase='teleporting';e.tick(s);assert.ok(voices[2].stopped);
  s.gamePhase='playing';e.tick(s);assert.equal(voices.length,4);e.createInitialState();assert.ok(voices[3].stopped);
 }finally{e.stopPoisonSound();global.Audio=oldAudio;}
});

test('standing plants deal one contact damage per 45 ticks, pause, and stop on leaving',()=>{
 const {s,boss}=fresh();patch(s,boss);patch(s,boss);ticks(s,44);assert.equal(s.playerHP,100);
 s.gamePhase='teleporting';ticks(s,100);assert.equal(s.playerHP,100);
 s.gamePhase='playing';e.tick(s);assert.equal(s.playerHP,99);
 player(s,16,10);s.thornPoisonTicks=0;ticks(s,90);assert.equal(s.playerHP,99);assert.equal(s.thornContactTimer,0);
});

test('the field plays falling-thing.wav once, timed to land with the eruption, never the player charge sound',()=>{
 const oldAudio=global.Audio,played=[];
 global.Audio=class{constructor(src){this.src=src;}play(){played.push(this.src);return Promise.resolve();}pause(){}};
 try{
  const {s,boss}=fresh();cast(s,boss);
  assert.equal(played.filter(x=>x==='/sounds/charging.wav').length,0,'not the player charge sound');
  assert.equal(played.filter(x=>x==='/sounds/falling-thing.wav').length,0,'not yet');
  ticks(s,c.THORN_WINDUP-1);
  assert.equal(played.filter(x=>x==='/sounds/falling-thing.wav').length,1,'falls before impact');
  assert.equal(played.filter(x=>x==='/sounds/place-plant.mp3').length,0);
  e.tick(s);assert.equal(played.filter(x=>x==='/sounds/place-plant.mp3').length,1);
 }finally{e.stopPoisonSound();global.Audio=oldAudio;}
});


test('nearby player triggers instant larger defensive field independently of aimed windup',()=>{
 const {s,boss}=fresh();player(s,10,10);position(boss,12,10);
 boss.thorn.windupTicks=50;boss.thorn.aimX=1500;boss.thorn.aimY=1500;
 e.tick(s);
 assert.equal(s.thornPatches.length,1);const p=s.thornPatches[0];
 assert.equal(p.radius,c.THORN_DEFENSE_RADIUS);assert.equal(s.playerHP,88);
 assert.equal(boss.thorn.windupTicks,49);assert.equal(boss.thorn.cooldown,100000);
 assert.equal(boss.thorn.defenseCooldown,c.THORN_DEFENSE_COOLDOWN);
 const bounds=c.getThornFieldBounds(p.x,p.y,p.radius);
 assert.equal(bounds.right-bounds.left,6*c.TILE_SIZE);
 player(s,Math.floor(bounds.left/c.TILE_SIZE),Math.floor(bounds.top/c.TILE_SIZE));
 assert.equal(e.isPlayerInThorns(s),true);s.playerX=bounds.right;assert.equal(e.isPlayerInThorns(s),false);
});

test('defensive cooldown persists out of range, pauses, and recasts only when nearby',()=>{
 const {s,boss}=fresh();s.godMode=true;position(boss,12,10);e.tick(s);
 player(s,40,40);ticks(s,120);assert.equal(boss.thorn.defenseCooldown,600);
 s.gamePhase='teleporting';ticks(s,120);assert.equal(boss.thorn.defenseCooldown,600);
 s.gamePhase='playing';ticks(s,600);assert.equal(boss.thorn.defenseCooldown,0);
 assert.equal(s.thornPatches.length,1);player(s,10,10);e.tick(s);
 assert.equal(s.thornPatches.length,2);assert.equal(boss.thorn.defenseCooldown,c.THORN_DEFENSE_COOLDOWN);
});
