const assert=require('node:assert/strict'),fs=require('fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function encounter(stacks,distance,target='player'){
 const s=engine.createInitialState();s.noMobs=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;
 engine.godSpawnBoss(s,'devourer');s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;
 s.playerTileX=s.playerTargetX=48;s.playerTileY=s.playerTargetY=10;s.playerX=48.5*c.TILE_SIZE;s.playerY=10.5*c.TILE_SIZE;
 const e=s.enemies[0];e.tileX=e.targetTileX=48-distance;e.tileY=e.targetTileY=10;e.x=(e.tileX+.5)*c.TILE_SIZE;e.y=10.5*c.TILE_SIZE;
 e.path=[];e.pathTimer=1000;e.stepProgress=0;e.attackTimer=0;e.windupTicks=1000;e.chargeDirX=stacks;
 if(target==='ruby'){
  s.playerCarryingRuby=false;s.rubyTileX=48;s.rubyTileY=10;
  s.playerTileY=s.playerTargetY=48;s.playerY=48.5*c.TILE_SIZE;
 }
 engine.tick(s);return s;
}
test('Devourer attack reach grows slowly early and exponentially to two chambers',()=>{
 for(const [stacks,range] of [[0,1],[5,3],[10,8],[15,19],[20,40]]){
 assert.ok(encounter(stacks,range).playerHP<100,'hits at '+range+' tiles with '+stacks+' stacks');
 assert.equal(encounter(stacks,range+1).playerHP,100,'misses beyond range at '+stacks+' stacks');
 }
 assert.equal(c.DEVOURER_ABSORB_RANGE,5);
});


test('long-range damage remains bounded for both player and Ruby as stacks grow',()=>{
 for(const [stacks,range,playerDamage,rubyDamage] of [[0,1,10,8],[5,3,11,9],[10,8,13,10],[15,19,16,13],[20,40,20,16]]){
  const player=encounter(stacks,range);assert.equal(player.playerHP,100-playerDamage);assert.equal(player.rubyHP,100);
  const ruby=encounter(stacks,range,'ruby');assert.equal(ruby.rubyHP,100-rubyDamage);assert.equal(ruby.playerHP,100);
 }
});

test('meteor survival floor stays small after Devourer grows and player attacks can finish her',()=>{
 for(const [maxHp,expected]of [[60,1],[100,1],[200,2],[1000,10],[10000,50]]){
  const s=engine.createInitialState();s.godMode=true;s.noMobs=true;engine.godSpawnBoss(s,'devourer');const e=s.enemies[0];
  e.maxHp=maxHp;e.hp=Math.floor(maxHp*.2);e.tileX=e.targetTileX=11;e.tileY=e.targetTileY=10;e.x=11.5*c.TILE_SIZE;e.y=10.5*c.TILE_SIZE;e.path=[];e.pathTimer=100000;e.windupTicks=100000;
  s.meteoriteWarning=0;s.meteoriteStrikeIn=1;engine.tick(s);
  assert.equal(e.hp,expected);assert.ok(s.enemies.includes(e));
  for(let i=0;i<Math.ceil(expected/c.LASER_DMG);i++){s.laserCooldown=0;engine.useLaser(s);}
  assert.ok(!s.enemies.includes(e));
 }
});
