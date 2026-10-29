const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function fresh(){const s=engine.createInitialState();s.noMobs=true;s.godMode=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;s.specialSkill='astral_twins';return s;}
function place(e,x,y){e.tileX=e.targetTileX=x;e.tileY=e.targetTileY=y;e.x=(x+.5)*c.TILE_SIZE;e.y=(y+.5)*c.TILE_SIZE;e.path=[];e.pathTimer=100000;e.phaseTimer=100000;e.attackTimer=100000;}
function target(s,x,y,hp=100){engine.godSpawnBoss(s,'fiery_king');const e=s.enemies.at(-1);e.hp=e.maxHp=hp;place(e,x,y);return e;}
function close(a,b){assert.ok(Math.abs(a-b)<.00001,a+' != '+b);}
// Ruby and player in separate places so the twin's attacks can be told apart from the player's.
function split(s){s.playerTileX=s.playerTileY=40;s.playerX=s.playerY=40.5*c.TILE_SIZE;s.rubyTileX=s.rubyTileY=10;s.enemies=[];}

test('Twins grant Binary Star; the twin lasts fifteen seconds, pauses and clears on restart',()=>{
 assert.equal(c.BOSS_SKILL_REWARDS.astral_twins,'astral_twins');assert.equal(c.SPECIAL_SKILLS.astral_twins.name,'BINARY STAR');
 const s=fresh();assert.equal(engine.useSpecialSkill(s),true);assert.equal(s.mirrorTwinTicks,900);
 engine.tick(s);assert.equal(s.mirrorTwinTicks,899);
 s.gamePhase='teleporting';engine.tick(s);assert.equal(s.mirrorTwinTicks,899);
 s.gamePhase='playing';for(let i=0;i<899;i++)engine.tick(s);assert.equal(s.mirrorTwinTicks,0);assert.equal(engine.getMirrorTwinTile(s),null);
 assert.equal(engine.createInitialState().mirrorTwinTicks,0);
});

test('twin stands on an open tile beside placed Ruby, or beside the player while carrying',()=>{
 const s=fresh();split(s);engine.useSpecialSkill(s);
 const twin=engine.getMirrorTwinTile(s);assert.equal(Math.abs(twin.tileX-10)+Math.abs(twin.tileY-10),1);
 s.rubyTileX=s.rubyTileY=-1;s.playerCarryingRuby=true;
 const carried=engine.getMirrorTwinTile(s);assert.equal(Math.abs(carried.tileX-40)+Math.abs(carried.tileY-40),1);
});

test('laser fires again from the twin at sixty percent damage',()=>{
 const s=fresh();split(s);engine.useSpecialSkill(s);const twin=engine.getMirrorTwinTile(s);
 // Ruby's own tile is always orthogonally next to the twin, so the twin's laser crosses it.
 const nearTwin=target(s,s.rubyTileX,s.rubyTileY,100);
 engine.useLaser(s);close(nearTwin.hp,100-c.LASER_DMG*.6);
 assert.equal(s.laserBeams.length,8);
});

test('wave and bullets repeat from the twin at reduced damage',()=>{
 const s=fresh();split(s);engine.useSpecialSkill(s);const twin=engine.getMirrorTwinTile(s);
 const e=target(s,twin.tileX,twin.tileY-2,100);engine.activateWave(s);close(e.hp,100-c.WAVE_DMG*.6);
 assert.equal(s.waveEffects.length,2);
 const b=fresh();split(b);engine.useSpecialSkill(b);engine.useBullet(b);
 assert.equal(b.laserBullets.length,2);assert.equal(b.laserBullets.filter(x=>x.mirror).length,1);
});

test('bomb detonation adds a twin blast that never hurts the player',()=>{
 const s=fresh();s.godMode=false;split(s);engine.useSpecialSkill(s);const twin=engine.getMirrorTwinTile(s);
 const e=target(s,twin.tileX+1,twin.tileY,500);
 engine.useBomb(s);s.playerTileX=s.playerTileY=45;engine.useBomb(s);
 close(e.hp,500-c.BOMB_DMG*.6);assert.equal(s.bombBlasts.length,2);assert.equal(s.playerHP,100);
});

test('attacks are not repeated without an active twin',()=>{
 const s=engine.createInitialState();s.noMobs=true;s.godMode=true;split(s);engine.useLaser(s);assert.equal(s.laserBeams.length,4);
});
