const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function fresh(){const s=engine.createInitialState();s.noMobs=true;s.godMode=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;return s;}
function position(e,x,y){e.tileX=e.targetTileX=x;e.tileY=e.targetTileY=y;e.x=(x+.5)*c.TILE_SIZE;e.y=(y+.5)*c.TILE_SIZE;e.path=[];e.pathTimer=100000;e.attackTimer=100000;e.windupTicks=100000;e.phaseTimer=100000;}
function boss(s,type,x=11,y=10){engine.godSpawnBoss(s,type);const e=s.enemies.find(e=>e.type===type);position(e,x,y);return e;}
function grunt(s,template,x,y,hp=100){const e={...template,id:s.nextEnemyId++,type:'normal',hp,maxHp:hp,icyShieldHP:0,path:[]};position(e,x,y);s.enemies.push(e);return e;}
function close(a,b){assert.ok(Math.abs(a-b)<.00001,a+' != '+b);}

test('all specials unlock on tenth kill and replace one held reward',()=>{
 for(const kills of [8,9,15])for(const kind of Object.keys(c.SPECIAL_SKILLS)){
  const s=fresh();s.bossesKilled=kills;const e=boss(s,kind);e.hp=kind==='aegis_sentinel'?.01:1;if(kind==='devourer')e.chargeDirX=0; // a stackless Devourer leaves no copies
  // Both twins must fall together; line the partner up in the same laser row.
  if(kind==='astral_twins'){const partner=s.enemies.find(x=>x.type===kind&&x!==e);position(partner,12,10);partner.hp=1;}
  engine.useLaser(s);
  assert.equal(s.bossesKilled,kills+1);assert.equal(s.specialSkill,kills>=9?kind:null);
 }
 const s=fresh();s.bossesKilled=10;s.specialSkill='fiery_king';const e=boss(s,'frost_warden');e.hp=1;engine.useLaser(s);assert.equal(s.specialSkill,'frost_warden');
 s.laserCooldown=0;const dev=boss(s,'devourer');dev.hp=1;dev.chargeDirX=0;dev.devourer={generation:1};engine.useLaser(s);assert.equal(s.specialSkill,'devourer');
});
test('King special hits the entire arena for ten percent boss HP and twenty-five normal damage',()=>{
 const s=fresh(),e=boss(s,'fiery_king',40,40);e.maxHp=e.hp=400;const near=grunt(s,e,11,10),far=grunt(s,e,40,41);
 s.specialSkill='fiery_king';assert.equal(engine.useSpecialSkill(s),true);close(e.hp,360);assert.equal(near.hp,75);assert.equal(far.hp,75);
 assert.equal(s.specialSkill,null);assert.equal(engine.useSpecialSkill(s),false);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);
});
test('Reaper special has limited range and scales against bosses',()=>{
 const s=fresh(),e=boss(s,'fiery_king',15,10);e.hp=e.maxHp=400;const near=grunt(s,e,12,10),far=grunt(s,e,17,10);
 s.specialSkill='storm_reaper';engine.useSpecialSkill(s);close(e.hp,280);assert.equal(near.hp,40);assert.equal(far.hp,100);
});
test('Warden shields player and Ruby, cannot stack, and shields absorb damage',()=>{
 const s=fresh();s.godMode=false;s.specialSkill='frost_warden';engine.useSpecialSkill(s);assert.equal(s.playerShieldHP,40);assert.equal(s.rubyShieldHP,40);
 s.specialSkill='frost_warden';engine.useSpecialSkill(s);assert.equal(s.playerShieldHP,40);
 engine.useBomb(s);engine.useBomb(s);assert.equal(s.playerHP,100);assert.ok(s.playerShieldHP<40);assert.equal(s.rubyShieldHP,40);
});
test('Chanter heals both targets and pushes nearby enemies without damage',()=>{
 const s=fresh(),e=boss(s,'fiery_king',40,40),near=grunt(s,e,11,10),far=grunt(s,e,20,10);s.playerHP=30;s.rubyHP=40;s.specialSkill='sea_chanter';
 engine.useSpecialSkill(s);assert.equal(s.playerHP,65);assert.equal(s.rubyHP,75);assert.equal(near.pushTiles,3);assert.equal(near.pushDirX,1);assert.equal(far.pushTiles,0);assert.equal(near.hp,100);
 s.gamePhase='teleporting';engine.tick(s);assert.equal(near.pushTiles,3);s.gamePhase='playing';s.map[10][12]=c.T_WALL;engine.tick(s);assert.equal(near.tileX,11);
});
test('Neptune pushes enemies through eight tiles, including the new outer reach',()=>{
 const s=fresh(),template=boss(s,'fiery_king',40,40);
 const extended=grunt(s,template,17,10),edge=grunt(s,template,18,10),outside=grunt(s,template,19,10);
 s.specialSkill='sea_chanter';engine.useSpecialSkill(s);
 assert.equal(extended.pushTiles,3);assert.equal(edge.pushTiles,3);assert.equal(outside.pushTiles,0);
});

test('bomb and celestial cast poses pause and expire without locking abilities',()=>{
 const s=fresh();engine.useBomb(s);assert.equal(s.playerCastKind,'bomb');
 s.gamePhase='teleporting';engine.tick(s);assert.equal(s.playerCastTicks,24);
 s.gamePhase='playing';engine.useBomb(s);assert.equal(s.bomb,null);
 for(let i=0;i<24;i++)engine.tick(s);assert.equal(s.playerCastKind,null);
 for(const kind of Object.keys(c.SPECIAL_SKILLS)){
  s.specialSkill=kind;s.specialLockTicks=0;engine.useSpecialSkill(s);assert.equal(s.playerCastKind,kind);
  for(let i=0;i<24;i++)engine.tick(s);assert.equal(s.playerCastKind,null);
 }
});

test('Prayer grants six seconds of powered mode, does not restart on attacks, and pauses',()=>{
 const s=fresh();s.specialSkill='blind_prayer';engine.useSpecialSkill(s);assert.equal(s.poweredTicks,360);assert.equal(s.starEnergy,0);
 engine.useLaser(s);assert.equal(s.poweredTicks,360);engine.tick(s);assert.equal(s.poweredTicks,359);
 s.gamePhase='teleporting';engine.tick(s);assert.equal(s.poweredTicks,359);assert.equal(engine.useSpecialSkill(s),false);
});
test('Sirius Surge resets all player ability cooldowns and preserves a placed bomb',()=>{
 const s=fresh();engine.useBomb(s);const bomb=s.bomb;assert.ok(bomb);
 const cooldowns=['laserCooldown','bulletCooldown','waveCooldown','bombCooldown','speedCooldown'];
 for(const key of cooldowns)s[key]=120;
 s.specialSkill='blind_prayer';assert.equal(engine.useSpecialSkill(s),true);
 for(const key of cooldowns)assert.equal(s[key],0,key);
 assert.equal(s.bomb,bomb);assert.equal(s.specialSkill,null);assert.equal(s.poweredTicks,360);
});
test('specials do not heal Chanter or feed her ally support',()=>{
 const s=fresh(),sea=boss(s,'sea_chanter',40,40),ally=grunt(s,sea,41,40,100);ally.hp=30;sea.hp=sea.maxHp=100;s.specialSkill='fiery_king';engine.useSpecialSkill(s);assert.equal(sea.hp,90);assert.equal(ally.hp,5);
 sea.sea.mode='diving';sea.hp=40;s.specialSkill='fiery_king';s.specialLockTicks=0;engine.useSpecialSkill(s);close(sea.hp,24);assert.ok(!s.enemies.includes(ally));
});
test('boss killed by special can grant a replacement without losing it',()=>{
 const s=fresh();s.bossesKilled=9;const e=boss(s,'frost_warden');e.hp=1;s.specialSkill='fiery_king';engine.useSpecialSkill(s);
 assert.equal(s.bossesKilled,10);assert.equal(s.specialSkill,'frost_warden');assert.equal(s.enemies.includes(e),false);
});
test('boss meteor damage drops from seventy-five to forty-five percent after tenth kill',()=>{
 for(const [kills,remaining]of [[9,25],[10,55],[30,55]]){
  const s=fresh();s.bossesKilled=kills;const e=boss(s,'fiery_king',2,2);e.hp=e.maxHp=100;s.meteoriteWarning=0;s.meteoriteStrikeIn=1;engine.tick(s);assert.equal(e.hp,remaining);
 }
});
test('special cannot be spent during pause or game over, and restart clears inventory',()=>{
 const s=fresh();s.specialSkill='frost_warden';for(const phase of ['teleporting','lost']){s.gamePhase=phase;assert.equal(engine.useSpecialSkill(s),false);assert.equal(s.specialSkill,'frost_warden');}
 assert.equal(engine.createInitialState().specialSkill,null);
});

test('Ascension announces once at the tenth boss kill and its banner pauses with the game',()=>{
 const s=fresh();s.bossesKilled=9;const e=boss(s,'fiery_king');e.hp=1;engine.useLaser(s);assert.equal(s.ascensionBannerTicks,360);
 s.gamePhase='teleporting';engine.tick(s);assert.equal(s.ascensionBannerTicks,360);s.gamePhase='playing';engine.tick(s);assert.equal(s.ascensionBannerTicks,359);
 s.laserCooldown=0;const next=boss(s,'frost_warden');next.hp=1;engine.useLaser(s);assert.equal(s.ascensionBannerTicks,359);
});

function player(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;s.playerStepProgress=0;}
test('Lunar Echo redirects bosses across all four chambers even when Ruby is closer',()=>{
 const pads=[[10,10],[39,10],[10,39],[39,39]];
 for(const [index,[x,y]]of pads.entries())for(const type of c.BOSS_TYPES){
  const s=fresh();player(s,x,y);const enemy=boss(s,type,x+1,y);
  s.specialSkill='splitter_queen';engine.useSpecialSkill(s);
  const [px,py]=pads[(index+3)%4];player(s,px,py);
  s.rubyTileX=x+1;s.rubyTileY=y;enemy.attackTimer=0;enemy.pathTimer=0;
  if(type==='splitter_queen')enemy.windupTicks=1;
  if(type==='blind_prayer'){enemy.prayer.escapeWindupTicks=1;enemy.prayer.rubyCooldown=100000;}
  if(type==='sea_chanter'){enemy.sea.songCooldown=0;enemy.sea.songWindupTicks=0;}
  if(type==='thorn_weaver'){enemy.thorn.cooldown=0;enemy.thorn.windupTicks=0;}
  const realX=s.playerX,realY=s.playerY;engine.tick(s);
  assert.equal(s.playerHP,100,type);assert.equal(s.rubyHP,100,type);
  assert.equal(s.playerX,realX,type);assert.equal(s.playerY,realY,type);assert.equal(s.enemyDecoyActive,false,type);
  assert.equal(s.playerCarryingRuby,false,type);assert.equal(s.rubyTileX,x+1,type);
  if(['fiery_king','devourer','storm_reaper','splitter_queen','blind_prayer'].includes(type))assert.equal(s.lunarDecoy.hitsLeft,11,type);
  if(type==='thorn_weaver'){
   assert.equal(enemy.thorn.aimX,c.getThornFieldBounds((x+.5)*c.TILE_SIZE,(y+.5)*c.TILE_SIZE).x);
   assert.equal(enemy.thorn.aimY,c.getThornFieldBounds((x+.5)*c.TILE_SIZE,(y+.5)*c.TILE_SIZE).y);
  }
  if(type==='sea_chanter'){assert.equal(enemy.sea.songAimX,(x+.5)*c.TILE_SIZE);assert.equal(enemy.sea.songAimY,(y+.5)*c.TILE_SIZE);}
 }
});
test('distant Lunar Echo attracts hunters and prevents nearby bosses attacking Ruby',()=>{
 for(const type of ['fiery_king','devourer','splitter_queen']){
  const s=fresh();s.specialSkill='splitter_queen';engine.useSpecialSkill(s);player(s,39,39);
  const enemy=boss(s,type,38,39);s.rubyTileX=38;s.rubyTileY=39;enemy.attackTimer=0;enemy.pathTimer=0;enemy.phaseTimer=100000;
  if(type==='splitter_queen')enemy.windupTicks=1;
  engine.tick(s);assert.equal(enemy.targeting,'player',type);assert.equal(s.rubyHP,100,type);assert.equal(s.playerHP,100,type);
  if(type!=='splitter_queen')assert.ok(enemy.path.length>0||enemy.targetTileX!==enemy.tileX||enemy.targetTileY!==enemy.tileY,type);
 }
});
test('Lunar Echo draws direct boss attacks away from player and Ruby, restoring targeting after destruction',()=>{
 const s=fresh(),king=boss(s,'fiery_king',11,10);s.specialSkill='splitter_queen';engine.useSpecialSkill(s);assert.equal(s.lunarDecoy.hitsLeft,12);
 player(s,14,10);const x=s.playerX,y=s.playerY;s.rubyTileX=11;s.rubyTileY=11;
 for(let i=0;i<11;i++){if(i>0){king.attackTimer=100000;for(let j=0;j<c.SPECIAL_QUEEN_DECOY_INVULNERABILITY;j++)engine.tick(s);}king.attackTimer=0;engine.tick(s);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);assert.equal(s.playerX,x);assert.equal(s.playerY,y);assert.equal(s.enemyDecoyActive,false);}
 assert.equal(s.lunarDecoy.hitsLeft,1);king.attackTimer=100000;for(let j=0;j<c.SPECIAL_QUEEN_DECOY_INVULNERABILITY;j++)engine.tick(s);king.attackTimer=0;engine.tick(s);assert.equal(s.lunarDecoy,null);assert.equal(s.playerHP,100);
 s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;position(king,11,10);king.attackTimer=0;s.godMode=false;engine.tick(s);assert.equal(s.playerHP,60);
});
test('Lunar Echo attracts ranged Queen and Sniper attacks and does not expire on a timer',()=>{
 for(const type of ['splitter_queen','sniper']){
  const s=fresh();let enemy;
  if(type==='splitter_queen')enemy=boss(s,type,12,10);else{const template=boss(s,'fiery_king',40,40);enemy=grunt(s,template,12,10);enemy.type='sniper';}
  s.specialSkill='splitter_queen';engine.useSpecialSkill(s);player(s,15,10);enemy.windupTicks=1;enemy.attackTimer=0;
  engine.tick(s);assert.equal(s.lunarDecoy.hitsLeft,11);assert.equal(s.playerHP,100);assert.equal(s.playerTileX,15);
 }
 const s=fresh();s.specialSkill='splitter_queen';engine.useSpecialSkill(s);for(let i=0;i<200;i++)engine.tick(s);assert.equal(s.lunarDecoy.hitsLeft,12);
 s.specialSkill='splitter_queen';const previous=s.lunarDecoy;engine.useSpecialSkill(s);assert.notEqual(previous,s.lunarDecoy);assert.equal(engine.createInitialState().lunarDecoy,null);
});
test('Gaia field spawns under player in a hallway, damages and slows enemies without hurting allies',()=>{
 const s=fresh(),king=boss(s,'fiery_king',25,10);king.hp=king.maxHp=1000;player(s,25,10);
 assert.notEqual(c.hallwayOfTile(25,10),-1);s.specialSkill='thorn_weaver';engine.useSpecialSkill(s);assert.equal(s.celestialField.x,Math.floor(s.playerX/c.TILE_SIZE)*c.TILE_SIZE);assert.equal(s.celestialField.y,Math.floor(s.playerY/c.TILE_SIZE)*c.TILE_SIZE);
 const enemy=grunt(s,king,25,11);enemy.targetTileX=26;enemy.targetTileY=11;
 engine.tick(s);close(enemy.stepProgress,c.ENEMY_CONFIGS.normal.speed*.6);
 enemy.targetTileX=enemy.tileX;enemy.targetTileY=enemy.tileY;enemy.stepProgress=0;
 for(let i=1;i<60;i++)engine.tick(s);close(king.hp,990);assert.equal(enemy.hp,96);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);
 const ticks=s.celestialField.ticks;s.gamePhase='teleporting';engine.tick(s);assert.equal(s.celestialField.ticks,ticks);
 s.gamePhase='playing';s.celestialField.ticks=1;engine.tick(s);assert.equal(s.celestialField,null);
});
test('God Mode Ascension shortcut sets the tenth-kill stage and hardest active mob tier',()=>{
 const s=fresh();engine.godEnterAscension(s);assert.equal(s.bossesKilled,10);assert.equal(s.difficultyLevel,c.DIFFICULTY_TIERS.length-1);assert.equal(s.noMobs,false);assert.equal(s.ascensionBannerTicks,360);
 s.bossesKilled=15;engine.godEnterAscension(s);assert.equal(s.bossesKilled,15);
});

test('Lunar Echo counts hits rather than incoming damage',()=>{
 for(const kind of ['fiery_king','devourer']){
  const s=fresh(),e=boss(s,kind,11,10);s.specialSkill='splitter_queen';engine.useSpecialSkill(s);e.attackTimer=0;
  engine.tick(s);assert.equal(s.lunarDecoy.hitsLeft,11);
 }
});
test('Singularity has one fixed version: 18s, 6 per second to aliens and 1.5% boss max HP per second',()=>{
 const s=fresh(),e=boss(s,'fiery_king',11,10);e.hp=e.maxHp=1000;s.specialSkill='devourer';engine.useSpecialSkill(s);
 const normal=grunt(s,e,11,11,1000);
 assert.equal(s.singularity.maxTicks,1080);assert.equal('stacks' in s.singularity,false);assert.equal('specialDevourerStacks' in s,false);
 const hp=e.hp;for(let i=0;i<60;i++)engine.tick(s);
 close(e.hp,hp-1000*.015);close(normal.hp,1000-6);assert.ok(s.singularity.ticks>0);
 s.gamePhase='teleporting';const ticks=s.singularity.ticks;engine.tick(s);assert.equal(s.singularity.ticks,ticks);
});
test('Singularity pulls normal enemies without crossing walls and expires cleanly',()=>{
 const s=fresh(),e=boss(s,'fiery_king',40,40),normal=grunt(s,e,12,10);s.specialSkill='devourer';engine.useSpecialSkill(s);
 for(let i=0;i<15;i++)engine.tick(s);assert.equal(normal.tileX,11);
 normal.tileX=normal.targetTileX=12;normal.x=12.5*c.TILE_SIZE;normal.pushTiles=0;s.map[10][11]=c.T_WALL;s.singularity.pullTimer=1;
 engine.tick(s);assert.equal(normal.tileX,12);
 s.singularity.ticks=1;engine.tick(s);assert.equal(s.singularity,null);
});
test('Singularity pulls stationary bosses every half-second and pauses the pull timer',()=>{
 const s=fresh(),warden=boss(s,'frost_warden',13,10);s.map[10][11]=s.map[10][12]=s.map[10][13]=c.T_FLOOR;
 s.specialSkill='devourer';engine.useSpecialSkill(s);
 for(let i=0;i<29;i++)engine.tick(s);assert.equal(warden.tileX,13);
 s.gamePhase='teleporting';const remaining=s.singularity.pullTimer;engine.tick(s);assert.equal(s.singularity.pullTimer,remaining);
 s.gamePhase='playing';engine.tick(s);assert.equal(warden.tileX,12);
 for(let i=0;i<30;i++)engine.tick(s);assert.equal(warden.tileX,11);
});

test('regular enemy HP increases ten percent without changing boss HP',()=>{
 const s=fresh();s.noMobs=false;s.spawnTimer=c.DIFFICULTY_TIERS[0].spawnInterval-1;
 const old=Math.random;Math.random=()=>0;try{engine.tick(s);}finally{Math.random=old;}
 const normal=s.enemies.find(e=>e.type==='normal');close(normal.hp,Math.ceil(c.ENEMY_CONFIGS.normal.maxHp*c.DIFFICULTY_TIERS[0].hpMult)*1.1);
 const king=boss(s,'fiery_king');assert.equal(king.maxHp,c.ENEMY_CONFIGS.fiery_king.maxHp);
 const split=grunt(s,king,11,10);split.type='splitter';split.hp=1;s.laserCooldown=0;engine.useLaser(s);
 const minis=s.enemies.filter(e=>e.type==='mini_splitter');assert.equal(minis.length,2);minis.forEach(e=>close(e.maxHp,c.ENEMY_CONFIGS.mini_splitter.maxHp*1.1));
});

test('No Boss removes bosses, freezes natural spawning, and manual spawning exits the mode',()=>{
 const s=fresh();s.difficultyLevel=1;s.bossTimer=1;engine.godSetNoBossSpawns(s,true);
 for(let i=0;i<300;i++)engine.tick(s);assert.equal(s.bossTimer,c.BOSS_SPAWN_INTERVAL);assert.equal(s.bossWarningTicks,0);assert.ok(!s.enemies.some(e=>c.isBossType(e.type)));
 engine.godSpawnBoss(s,'fiery_king');assert.ok(s.enemies.some(e=>e.type==='fiery_king'));assert.equal(s.noBossSpawns,false);engine.godSetNoBossSpawns(s,true);assert.ok(!s.enemies.some(e=>c.isBossType(e.type)));assert.equal(s.bossesKilled,0);
 s.enemies=[];engine.godSetNoBossSpawns(s,false);s.bossWarningTicks=1;engine.tick(s);assert.ok(s.enemies.some(e=>c.isBossType(e.type)));
 s.enemies=[];s.bossWarningTicks=1;engine.godSetNoBossSpawns(s,true);assert.equal(s.bossWarningTicks,0);assert.equal(s.bossTimer,c.BOSS_SPAWN_INTERVAL);
});

test('Lunar Echo invulnerability prevents simultaneous and rapid hits, pauses and expires',()=>{
 const s=fresh(),king=boss(s,'fiery_king',11,10);s.specialSkill='splitter_queen';engine.useSpecialSkill(s);
 const a=grunt(s,king,11,10),b=grunt(s,king,11,10);a.attackTimer=b.attackTimer=king.attackTimer=0;
 engine.tick(s);assert.equal(s.lunarDecoy.hitsLeft,11);assert.equal(s.lunarDecoy.invulnerableTicks,21);
 s.gamePhase='teleporting';engine.tick(s);assert.equal(s.lunarDecoy.invulnerableTicks,21);s.gamePhase='playing';
 a.attackTimer=b.attackTimer=king.attackTimer=0;engine.tick(s);assert.equal(s.lunarDecoy.hitsLeft,11);
 a.attackTimer=b.attackTimer=king.attackTimer=10000;for(let i=0;i<20;i++)engine.tick(s);
 a.attackTimer=0;engine.tick(s);assert.equal(s.lunarDecoy.hitsLeft,10);
});

test('Gaia uses twelve full tiles per side and excludes the next tile and walls',()=>{
 const s=fresh(),template=boss(s,'fiery_king',40,40);s.map[10][15]=s.map[10][16]=c.T_FLOOR;s.map[10][14]=c.T_WALL;
 const inside=grunt(s,template,15,10),outside=grunt(s,template,16,10),wall=grunt(s,template,14,10);s.specialSkill='thorn_weaver';engine.useSpecialSkill(s);
 assert.equal(s.celestialField.x%c.TILE_SIZE,0);assert.equal(s.celestialField.y%c.TILE_SIZE,0);
 s.celestialField.damageTimer=1;engine.tick(s);assert.equal(inside.hp,96);assert.equal(outside.hp,100);assert.equal(wall.hp,100);
});
test('Singularity whole-tile effect range includes the highlighted edge tile but not the next',()=>{
 const s=fresh(),template=boss(s,'fiery_king',40,40);s.map[10][15]=s.map[10][16]=c.T_FLOOR;
 const edge=grunt(s,template,15,10),outside=grunt(s,template,16,10);edge.x=15.95*c.TILE_SIZE;
 s.specialSkill='devourer';engine.useSpecialSkill(s);s.singularity.damageTimer=1;s.singularity.pullTimer=1000;engine.tick(s);
 close(edge.hp,100-c.SPECIAL_SINGULARITY_NORMAL_DAMAGE);assert.equal(outside.hp,100);
});


test('supplied Ascension cue plays once at unlock through boss, meteor or God progression',()=>{
 const previous=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this);return Promise.resolve();}pause(){}};
 try{
  for(const mode of ['laser','meteor','stage','direct']){
   played.length=0;const s=fresh();s.bossesKilled=9;
   if(mode==='stage')engine.godAdvanceStage(s);
   else if(mode==='direct')engine.godEnterAscension(s);
   else{const target=boss(s,'fiery_king');target.hp=1;if(mode==='laser')engine.useLaser(s);else{s.meteoriteWarning=0;s.meteoriteStrikeIn=1;engine.tick(s);}}
   const cues=()=>played.filter(v=>v.src.endsWith('/ascension-unlock.mp3'));
   assert.equal(s.bossesKilled,10,mode);assert.equal(cues().length,1,mode);assert.equal(cues()[0].volume,.7);
   engine.tick(s);engine.godEnterAscension(s);assert.equal(cues().length,1);
   const next=boss(s,'fiery_king');next.hp=1;s.laserCooldown=0;engine.useLaser(s);assert.equal(s.bossesKilled,11);assert.equal(cues().length,1);
  }
 }finally{global.Audio=previous;}
});
