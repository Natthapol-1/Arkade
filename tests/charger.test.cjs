const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function player(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;s.playerStepProgress=0;}
function fresh(){
 const s=e.createInitialState();s.noMobs=true;s.noBossSpawns=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;
 for(let y=5;y<=15;y++)for(let x=5;x<=20;x++)s.map[y][x]=c.T_FLOOR;
 player(s,15,10);s.rubyTileX=s.rubyTileY=40;
 e.godSpawnBoss(s,'storm_reaper');const template=s.enemies[0];s.noBossSpawns=true;
 const charger={...template,type:'charger',tileX:10,tileY:10,targetTileX:10,targetTileY:10,x:10.5*c.TILE_SIZE,y:10.5*c.TILE_SIZE,hp:100,maxHp:100,path:[],pathTimer:10000,attackTimer:0,windupTicks:0,chargeDirX:0,chargeDirY:0};
 s.enemies=[charger];return {s,charger};
}
function ticks(s,n){for(let i=0;i<n;i++)e.tick(s);}

test('Charger warns for half a second, pauses and rushes faster than the player',()=>{
 const {s,charger}=fresh(),start=charger.x;e.tick(s);assert.equal(charger.chargeWindupTicks,c.CHARGER_WINDUP_TICKS);
 s.gamePhase='teleporting';ticks(s,20);assert.equal(charger.chargeWindupTicks,c.CHARGER_WINDUP_TICKS);s.gamePhase='playing';
 ticks(s,c.CHARGER_WINDUP_TICKS);assert.equal(charger.x,start);
 e.tick(s);e.tick(s);assert.equal(charger.x-start,c.CHARGER_CHARGE_SPEED);assert.ok(c.CHARGER_CHARGE_SPEED>c.PLAYER_BASE_SPEED);
});
test('locked rush can be dodged sideways and ends after its maximum distance',()=>{
 const {s,charger}=fresh();e.tick(s);player(s,15,11);ticks(s,c.CHARGER_WINDUP_TICKS+80);
 assert.equal(s.playerHP,100);assert.equal(charger.tileY,10);assert.equal(charger.tileX,10+c.CHARGER_CHARGE_TILES);
 assert.equal(charger.chargeDirX,0);assert.ok(charger.attackTimer>0);
});
test('a wall stops the rush on the last floor tile and grants a stun window',()=>{
 const {s,charger}=fresh();e.tick(s);s.map[10][12]=c.T_WALL;
 for(let i=0;i<100&&charger.windupTicks===0;i++)e.tick(s);
 assert.equal(charger.tileX,11);assert.equal(charger.x,11.5*c.TILE_SIZE);assert.equal(charger.chargeDirX,0);assert.equal(charger.windupTicks,c.CHARGER_STUN_TICKS);
});
test('Charger deals damage on contact, not before entering the player tile',()=>{
 const {s,charger}=fresh();player(s,11,10);e.tick(s);ticks(s,c.CHARGER_WINDUP_TICKS);e.tick(s);
 assert.equal(s.playerHP,100);ticks(s,6);assert.equal(s.playerHP,100);
 e.tick(s);assert.equal(charger.tileX,11);assert.equal(s.playerHP,100-c.ENEMY_CONFIGS.charger.damageToPlayer);assert.ok(charger.windupTicks>0);
});
test('push interrupts the windup and clears the locked lane',()=>{
 const {s,charger}=fresh();e.tick(s);assert.ok(charger.chargeWindupTicks>0);e.activateWave(s);e.tick(s);
 assert.equal(charger.chargeWindupTicks,0);assert.equal(charger.chargeDirX,0);assert.equal(charger.chargeTilesLeft,0);
});
test('Charger hits Lunar Echo without damaging the real player or Ruby beneath it',()=>{
 const {s}=fresh();player(s,11,10);s.specialSkill='splitter_queen';e.useSpecialSkill(s);player(s,15,15);s.rubyTileX=11;s.rubyTileY=10;
 ticks(s,c.CHARGER_WINDUP_TICKS+10);assert.equal(s.lunarDecoy.hitsLeft,11);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);assert.equal(s.playerTileX,15);
});
