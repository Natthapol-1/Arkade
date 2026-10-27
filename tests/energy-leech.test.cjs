const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function player(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;s.playerStepProgress=0;}
function fresh(){
 const s=e.createInitialState();s.noMobs=true;s.noBossSpawns=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;
 for(let y=5;y<=15;y++)for(let x=5;x<=20;x++)s.map[y][x]=c.T_FLOOR;
 player(s,10,10);s.starEnergy=60;s.rubyTileX=12;s.rubyTileY=10;
 e.godSpawnBoss(s,'frost_warden');const template=s.enemies[0];s.noBossSpawns=true;s.frostIceTiles=[];
 const leech={...template,type:'energy_leech',id:s.nextEnemyId++,tileX:11,tileY:10,targetTileX:11,targetTileY:10,x:11.5*c.TILE_SIZE,y:10.5*c.TILE_SIZE,hp:8,maxHp:8,path:[],pathTimer:0,attackTimer:0,windupTicks:0,shootTicks:0};
 s.enemies=[leech];return {s,leech};
}
function ticks(s,n){for(let i=0;i<n;i++)e.tick(s);}

test('Leech steals energy up close, without damaging HP, shields, Ruby or powered time',()=>{
 const {s,leech}=fresh();s.playerShieldHP=20;s.poweredTicks=100;e.tick(s);
 assert.equal(s.starEnergy,40);assert.equal(leech.stolenEnergy,20);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);assert.equal(s.playerShieldHP,20);assert.equal(s.poweredTicks,99);
 ticks(s,c.ENEMY_CONFIGS.energy_leech.attackCooldown);assert.equal(s.starEnergy,40);
 e.tick(s);assert.equal(s.starEnergy,20);assert.equal(leech.stolenEnergy,40);
});
test('partial and empty gauges never create stored energy or go negative',()=>{
 const {s,leech}=fresh();s.starEnergy=7;e.tick(s);assert.equal(s.starEnergy,0);assert.equal(leech.stolenEnergy,7);
 ticks(s,c.ENEMY_CONFIGS.energy_leech.attackCooldown+1);assert.equal(s.starEnergy,0);assert.equal(leech.stolenEnergy,7);
});
test('Leech hunts the player even when Ruby is closer, and respects walls and attack range',()=>{
 const {s,leech}=fresh();player(s,18,10);s.rubyTileX=11;s.map[10][12]=c.T_WALL;e.tick(s);
 assert.equal(leech.targeting,'player');assert.equal(s.starEnergy,60);assert.equal(s.rubyHP,100);assert.notEqual(leech.targetTileX,12);
 ticks(s,20);assert.equal(s.starEnergy,60);assert.equal(s.rubyHP,100);
});
test('Lunar decoy absorbs the bite without losing real energy or creating a refund',()=>{
 const {s,leech}=fresh();s.specialSkill='splitter_queen';e.useSpecialSkill(s);player(s,18,10);e.tick(s);
 assert.equal(s.lunarDecoy.hitsLeft,11);assert.equal(s.starEnergy,60);assert.equal(leech.stolenEnergy??0,0);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);
});
test('teleport pauses both drains and cooldowns, and God mode prevents theft',()=>{
 const {s,leech}=fresh();s.gamePhase='teleporting';ticks(s,100);assert.equal(s.starEnergy,60);assert.equal(leech.attackTimer,0);
 s.gamePhase='playing';s.godMode=true;e.tick(s);assert.equal(s.starEnergy,60);assert.equal(leech.stolenEnergy??0,0);
 s.godMode=false;leech.attackTimer=0;e.tick(s);assert.equal(s.starEnergy,40);
});
test('defeating a Leech returns its actual stored energy plus the ordinary kill reward only once',()=>{
 const {s,leech}=fresh();e.tick(s);assert.equal(s.starEnergy,40);leech.hp=.1;e.useLaser(s);
 assert.equal(s.enemies.length,0);assert.equal(s.starEnergy,60+c.STAR_ENERGY_PER_KILL);assert.ok(s.runnerEnergyFlashTicks>0);
 s.laserCooldown=0;e.useLaser(s);assert.equal(s.starEnergy,60+c.STAR_ENERGY_PER_KILL);
});
test('refund clamps to the gauge maximum and an empty Leech gives no bonus energy',()=>{
 const {s,leech}=fresh();s.starEnergy=95;leech.stolenEnergy=80;leech.hp=.1;e.useLaser(s);assert.equal(s.starEnergy,c.STAR_ENERGY_MAX);
 const other=fresh();other.s.starEnergy=10;other.leech.hp=.1;e.useLaser(other.s);assert.equal(other.s.starEnergy,10+c.STAR_ENERGY_PER_KILL);
});
test('meteor defeat returns stored energy but grants no ordinary kill rewards',()=>{
 const {s,leech}=fresh();leech.stolenEnergy=35;s.starEnergy=10;s.playerHP=50;s.meteoriteWarning=c.chamberOfTile(leech.tileX,leech.tileY);s.meteoriteStrikeIn=1;
 player(s,40,40);s.rubyTileX=40;s.rubyTileY=40;leech.attackTimer=100;e.tick(s);
 assert.equal(s.enemies.length,0);assert.equal(s.starEnergy,45);assert.equal(s.killScore,0);assert.equal(s.playerHP,50);
});
test('Leech first joins Stage 1 spawn pools and uses normal HP scaling',()=>{
 for(let i=0;i<c.DIFFICULTY_TIERS.length;i++)assert.equal(c.DIFFICULTY_TIERS[i].spawnTypes.includes('energy_leech'),i>=4);
 const {s}=fresh();s.enemies=[];s.noMobs=false;s.bossesKilled=1;s.spawnTimer=80;const original=Math.random;Math.random=()=>.99999;
 try{e.tick(s);}finally{Math.random=original;}
 assert.equal(s.enemies.length,2);for(const mob of s.enemies){assert.equal(mob.type,'energy_leech');assert.equal(mob.maxHp,Math.ceil(8*1.3)*c.REGULAR_ENEMY_HP_MULT);assert.equal(mob.stolenEnergy??0,0);}
});
