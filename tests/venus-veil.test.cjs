const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function fresh(){const s=engine.createInitialState();s.noMobs=true;s.godMode=false;s.meteoriteTimer=100000;s.resourceTimer=-100000;s.specialSkill='aegis_sentinel';return s;}
function place(e,x,y){e.tileX=e.targetTileX=x;e.tileY=e.targetTileY=y;e.x=(x+.5)*c.TILE_SIZE;e.y=(y+.5)*c.TILE_SIZE;e.path=[];e.pathTimer=100000;e.phaseTimer=100000;}
function boss(s,type,x,y){engine.godSpawnBoss(s,type);const e=s.enemies.find(e=>e.type===type);place(e,x,y);return e;}
function close(a,b){assert.ok(Math.abs(a-b)<.00001,a+' != '+b);}

test('Aegis grants Venus Veil',()=>{
 assert.equal(c.BOSS_SKILL_REWARDS.aegis_sentinel,'aegis_sentinel');assert.equal(c.SPECIAL_SKILLS.aegis_sentinel.name,'VENUS VEIL');
});

test('veil lasts ten seconds, pauses with gameplay and clears on restart',()=>{
 const s=fresh();assert.equal(engine.useSpecialSkill(s),true);assert.equal(s.specialSkill,null);assert.equal(s.venusVeilTicks,600);
 engine.tick(s);assert.equal(s.venusVeilTicks,599);
 s.gamePhase='teleporting';engine.tick(s);assert.equal(s.venusVeilTicks,599);
 s.gamePhase='playing';for(let i=0;i<599;i++)engine.tick(s);assert.equal(s.venusVeilTicks,0);
 assert.equal(engine.createInitialState().venusVeilTicks,0);
});

test('King hit is reduced to the Venus share on player and Ruby and reflects a capped boss share',()=>{
 const s=fresh();engine.useSpecialSkill(s);s.enemies=[];
 const king=boss(s,'fiery_king',s.playerTileX+1,s.playerTileY);king.hp=king.maxHp=1000;king.attackTimer=0;king.targeting='player';
 const before=s.playerHP;engine.tick(s);
 close(before-s.playerHP,c.ENEMY_CONFIGS.fiery_king.damageToPlayer*c.SPECIAL_VENUS_DAMAGE_MULT);
 close(king.hp,1000-Math.min(c.ENEMY_CONFIGS.fiery_king.damageToPlayer,1000*.03));
 assert.ok(s.venusReflects.length>=1);
});

test('reflection returns the full hit to regular aliens and kills them through the normal sweep',()=>{
 const s=fresh();s.noMobs=false;s.spawnTimer=-100000;engine.useSpecialSkill(s);s.enemies=[];
 engine.godSpawnBoss(s,'fiery_king');const template=s.enemies[0];s.enemies=[];
 const make=hp=>{const e={...template,id:s.nextEnemyId++,type:'normal',hp,maxHp:hp,icyShieldHP:0,king:undefined,attackTimer:0,targeting:'player'};place(e,s.playerTileX+1,s.playerTileY);s.enemies=[e];return e;};
 const tough=make(100);engine.tick(s);
 close(100-s.playerHP,c.ENEMY_CONFIGS.normal.damageToPlayer*c.SPECIAL_VENUS_DAMAGE_MULT);close(tough.hp,100-c.ENEMY_CONFIGS.normal.damageToPlayer);
 const fragile=make(8);engine.tick(s);assert.equal(s.enemies.includes(fragile),false);
});

test('hazards without an attacker are reduced but not reflected; shields absorb the reduced amount',()=>{
 const s=fresh();engine.useSpecialSkill(s);s.playerShieldHP=10;
 engine.useBomb(s);engine.useBomb(s);
 const blast=Math.floor(c.BOMB_DMG*.35)*c.SPECIAL_VENUS_DAMAGE_MULT;close(10-s.playerShieldHP,Math.min(10,blast));
 assert.equal(s.venusReflects.length,0);
});

test('Invincible still reflects attacks without taking damage',()=>{
 const s=fresh();s.godMode=true;engine.useSpecialSkill(s);s.enemies=[];
 const king=boss(s,'fiery_king',s.playerTileX+1,s.playerTileY);king.hp=king.maxHp=1000;king.attackTimer=0;king.targeting='player';
 engine.tick(s);assert.equal(s.playerHP,100);assert.ok(king.hp<1000);
});
