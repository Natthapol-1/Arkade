const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function fresh(){const s=e.createInitialState();s.noMobs=true;s.noBossSpawns=true;s.godMode=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;return s;}
function close(actual,expected){assert.ok(Math.abs(actual-expected)<1e-7,actual+' != '+expected);}
function target(s,type,x,y){
 e.godSpawnBoss(s,'frost_warden');const template=s.enemies[0];s.noBossSpawns=true;s.frostIceTiles=[];
 return {...template,id:s.nextEnemyId++,type,x:(x+.5)*c.TILE_SIZE,y:(y+.5)*c.TILE_SIZE,tileX:x,tileY:y,targetTileX:x,targetTileY:y,hp:100,maxHp:100,path:[],pathTimer:100000,attackTimer:100000,windupTicks:100000,icyShieldHP:0};
}
function shot(shielded,bullet){
 const s=fresh(),victim=target(s,'normal',11,10),protector={...victim,id:s.nextEnemyId++,type:'shielder',tileY:11,targetTileY:11,y:11.5*c.TILE_SIZE,shieldTargetId:victim.id};
 s.enemies=shielded?[victim,protector]:[victim];
 if(bullet){e.useBullet(s);for(let i=0;i<8;i++)e.tick(s);}else e.useLaser(s);
 return 100-victim.hp;
}

test('Shielder halves fractional bullet and laser damage rather than rounding hits up',()=>{
 close(shot(false,true),c.BULLET_DMG);close(shot(true,true),c.BULLET_DMG/2);
 close(shot(false,false),c.LASER_DMG);close(shot(true,false),c.LASER_DMG/2);
});
test('fractional Shielder reduction is applied before an icy absorb shield',()=>{
 const s=fresh(),victim=target(s,'normal',11,10),protector={...victim,id:s.nextEnemyId++,type:'shielder',shieldTargetId:victim.id,tileY:11,targetTileY:11,y:11.5*c.TILE_SIZE};
 victim.icyShieldHP=2;s.enemies=[victim,protector];e.useLaser(s);close(victim.hp,100);close(victim.icyShieldHP,2-c.LASER_DMG/2);
});
test('opening difficulty rises at 10, 25 and 45 seconds then waits for boss progression',()=>{
 const s=fresh();let elapsed=0;
 for(const [tick,tier]of [[599,0],[600,1],[1499,1],[1500,2],[2699,2],[2700,3],[6000,3]]){
  while(elapsed<tick){e.tick(s);elapsed++;}assert.equal(s.difficultyLevel,tier);
 }
});
test('later difficulty tiers follow stages 1 through 4, pause and respect the cap',()=>{
 const s=fresh();s.difficultyTimer=599;s.gamePhase='teleporting';e.tick(s);assert.equal(s.difficultyLevel,0);assert.equal(s.difficultyTimer,599);
 s.gamePhase='playing';
 for(const [kills,tier]of [[1,4],[2,5],[3,6],[4,7],[20,7]]){s.bossesKilled=kills;e.tick(s);assert.equal(s.difficultyLevel,tier);}
});
test('smoother difficulty preserves the first boss at about one minute',()=>{
 const s=fresh();s.noBossSpawns=false;
 for(let i=0;i<3590;i++)e.tick(s);assert.equal(s.enemies.some(x=>c.isBossType(x.type)),false);
 for(let i=0;i<20;i++)e.tick(s);assert.equal(s.enemies.filter(x=>c.isBossType(x.type)).length,1);
});
test('natural boss pools cover all eight before repeating and avoid repeats across pools',()=>{
 for(const roll of [0,.47,.9999]){
  const s=fresh(),seen=[],original=Math.random;Math.random=()=>roll;
  try{
   for(let i=0;i<24;i++){
    s.enemies=[];s.noBossSpawns=false;s.difficultyLevel=1;s.bossWarningTicks=1;e.tick(s);
    const boss=s.enemies.find(x=>c.isBossType(x.type));assert.ok(boss);seen.push(boss.type);
   }
  }finally{Math.random=original;}
  for(let i=0;i<24;i+=8)assert.equal(new Set(seen.slice(i,i+8)).size,8);
  for(let i=1;i<seen.length;i++)assert.notEqual(seen[i],seen[i-1]);
 }
});
test('debug spawns do not consume the natural pool and restart clears it',()=>{
 const s=fresh();s.bossPool=['fiery_king','blind_prayer'];e.godSpawnBoss(s,'sea_chanter');assert.deepEqual(s.bossPool,['fiery_king','blind_prayer']);
 assert.deepEqual(e.createInitialState().bossPool,[]);
});
test('carried movement is sixty percent of normal and still respects walls',()=>{
 const s=fresh();e.toggleCarryRuby(s);const start=s.playerX;s.playerQueuedDirX=1;
 e.tick(s);e.tick(s);close(s.playerX-start,c.PLAYER_BASE_SPEED*.6);
 const wall=fresh();e.toggleCarryRuby(wall);wall.map[10][11]=c.T_WALL;wall.playerQueuedDirX=1;const originalX=wall.playerX;
 for(let i=0;i<30;i++)e.tick(wall);close(wall.playerX,originalX);
});
test('teleport auto-placement feedback pauses, expires and clears on pickup',()=>{
 const s=fresh();e.toggleCarryRuby(s);assert.equal(e.tryActivateTeleport(s),true);e.doTeleport(s,1);
 assert.equal(s.playerCarryingRuby,false);assert.equal(s.rubyTileX,39);assert.equal(s.rubyTileY,10);assert.equal(s.rubyPlacedFlashTicks,120);
 s.gamePhase='teleporting';e.tick(s);assert.equal(s.rubyPlacedFlashTicks,120);
 s.gamePhase='playing';e.tick(s);assert.equal(s.rubyPlacedFlashTicks,119);
 e.toggleCarryRuby(s);assert.equal(s.rubyPlacedFlashTicks,0);assert.equal(s.playerCarryingRuby,true);
 const reset=e.createInitialState();assert.equal(reset.rubyPlacedFlashTicks,0);
});
