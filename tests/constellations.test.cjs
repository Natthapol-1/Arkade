const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('God Stage +1 advances once, respects pause and triggers Constellations and Ascension',()=>{
 const s=e.createInitialState();s.bossesKilled=1;s.playerHP=40;
 e.godAdvanceStage(s);assert.equal(s.bossesKilled,2);assert.equal(s.difficultyLevel,5);assert.equal(s.playerHP,40);
 e.godAdvanceStage(s);assert.equal(s.bossesKilled,3);assert.equal(s.gamePhase,'constellation');assert.equal(s.constellationChoices.length,2);
 e.godAdvanceStage(s);assert.equal(s.bossesKilled,3);e.chooseConstellation(s,s.constellationChoices[0]);
 s.bossesKilled=9;e.godAdvanceStage(s);assert.equal(s.bossesKilled,10);assert.equal(s.ascensionBannerTicks,360);assert.equal(s.specialSkill,null);
 for(const phase of ['teleporting','lost']){s.gamePhase=phase;e.godAdvanceStage(s);assert.equal(s.bossesKilled,10);}
});
function fresh(upgrades=[]){
 const s=e.createInitialState();s.constellations=[...upgrades];s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;
 for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;
 s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*c.TILE_SIZE;s.playerStepProgress=0;
 s.rubyTileX=s.rubyTileY=30;return s;
}
function enemy(s,type='normal',hp=100,x=11){
 e.godSpawnBoss(s,'frost_warden');const template=s.enemies.find(a=>a.type==='frost_warden');s.enemies=[];s.noBossSpawns=true;
 const a={...template,type,id:s.nextEnemyId++,x:(x+.5)*c.TILE_SIZE,y:10.5*c.TILE_SIZE,tileX:x,tileY:10,targetTileX:x,targetTileY:10,hp,maxHp:hp,path:[],pathTimer:100000,windupTicks:100000};s.enemies.push(a);return a;
}
function defeat(s){enemy(s,'frost_warden',.01);s.laserCooldown=0;e.useLaser(s);}
function ticks(s,n){for(let i=0;i<n;i++)e.tick(s);}
test('every third boss defeat offers two distinct eligible choices; tenth still unlocks Ascension',()=>{
 const s=fresh();for(let n=1;n<=66;n++){
  defeat(s);assert.equal(s.bossesKilled,n);
  if(n%3===0&&n<=60){
   assert.equal(s.gamePhase,'constellation');assert.equal(new Set(s.constellationChoices).size,n===60?1:2);
   assert.ok(s.constellationChoices.every(k=>!s.constellations.includes(k)));assert.equal(e.chooseConstellation(s,s.constellationChoices[0]),true);
  }else assert.equal(s.gamePhase,'playing');
  if(n===10){assert.equal(s.specialSkill,'frost_warden');assert.equal(s.ascensionBannerTicks,360);}
 }assert.equal(s.constellations.length,20);assert.equal(Object.keys(e.CONSTELLATIONS).length,20);
});
test('choice freezes simulation and all gameplay; invalid/duplicate picks fail; restart clears upgrades',()=>{
 const s=fresh();s.bossesKilled=2;defeat(s);const before=JSON.stringify(s);ticks(s,120);
 for(const fn of [e.useLaser,e.useBullet,e.activateWave,e.pressCharge,e.useBomb,e.useSpeedBoost,e.toggleCarryRuby,e.cancelTeleport])fn(s);
 assert.equal(e.useSpecialSkill(s),false);assert.equal(e.healRuby(s),false);assert.equal(e.tryActivateTeleport(s),false);assert.equal(JSON.stringify(s),before);
 assert.equal(e.chooseConstellation(s,Object.keys(e.CONSTELLATIONS).find(k=>!s.constellationChoices.includes(k))),false);
 const choice=s.constellationChoices[0];assert.equal(e.chooseConstellation(s,choice),true);assert.equal(e.chooseConstellation(s,choice),false);
 e.tick(s);assert.equal(s.gameTick,1);assert.deepEqual(e.createInitialState().constellations,[]);assert.deepEqual(e.createInitialState().constellationChoices,[]);
});
test('laser and bullet damage upgrades work for normal/powered shots',()=>{
 for(const powered of [false,true])for(const kind of ['laser','bullets']){
  const s=fresh([kind]),a=enemy(s);s.poweredTicks=powered?100:0;
  if(kind==='laser'){e.useLaser(s);near(100-a.hp,(powered?c.LASER_DMG_PWR:c.LASER_DMG)*1.2);}
  else{e.useBullet(s);ticks(s,5);near(100-a.hp,(powered?c.BULLET_DMG_PWR:c.BULLET_DMG)*1.25);}
 }
});
test('Cygnus adds exactly one push tile at both power levels',()=>{
 for(const powered of [false,true]){const s=fresh(['waveReach']),a=enemy(s);s.poweredTicks=powered?100:0;e.activateWave(s);assert.equal(a.pushTiles,(powered?c.WAVE_PUSH_TILES_PWR:c.WAVE_PUSH_TILES)+1);}
});
test('Ruby protection reduces meteor damage before shields while player damage remains unchanged',()=>{
 const s=fresh(['ruby']);s.rubyTileX=s.rubyTileY=10;s.rubyShieldHP=20;s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.tick(s);
 near(s.rubyHP,100-(c.METEORITE_RUBY_DMG*.85-20));assert.equal(s.rubyShieldHP,0);assert.equal(s.playerHP,100-c.METEORITE_PLAYER_DMG);
});
test('Delphinus reduces incoming player damage before shields without protecting Ruby or increasing shards',()=>{
 for(const shield of [0,20]){
  const s=fresh(['playerGuard']);s.rubyTileX=s.rubyTileY=10;s.playerShieldHP=shield;s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.tick(s);
  near(s.playerHP,100-(c.METEORITE_PLAYER_DMG*.9-shield));assert.equal(s.playerShieldHP,0);assert.equal(s.rubyHP,100-c.METEORITE_RUBY_DMG);
 }
 const s=fresh(['playerGuard']);s.playerHP=20;s.resources=[{type:'health',tileX:10,tileY:10}];e.tick(s);assert.equal(s.playerHP,20+c.HEAL_AMOUNT);
 s.bomb={tileX:10,tileY:10,powered:false};e.useBomb(s);near(s.playerHP,20+c.HEAL_AMOUNT-Math.floor(c.BOMB_DMG*.35)*.9);
});
test('power adds one second to gauge activation and Sirius without extending on each attack',()=>{
 const s=fresh(['power']);s.starEnergy=100;e.useBullet(s);assert.equal(s.poweredTicks,180);e.useLaser(s);assert.equal(s.poweredTicks,180);
 s.specialSkill='blind_prayer';e.useSpecialSkill(s);assert.equal(s.poweredTicks,c.SPECIAL_PRAYER_DURATION+60);
});
test('manual healing is twenty percent faster with unchanged amounts and enemy-clear rules',()=>{
 const s=fresh(['healing']);s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;s.playerHP=s.rubyHP=50;
 assert.equal(e.healRuby(s),true);assert.equal(s.rubyHP,55);assert.equal(s.playerHP,53);assert.equal(s.rubyHealCooldown,15);
 ticks(s,14);assert.equal(e.healRuby(s),false);e.tick(s);assert.equal(e.healRuby(s),true);
 enemy(s);s.rubyHealCooldown=0;assert.equal(e.healRuby(s),false);
});
test('speed scales normal, carrying and burst movement by eight percent',()=>{
 for(const carry of [false,true])for(const burst of [false,true]){
  const distance=[];for(const upgraded of [false,true]){const s=fresh(upgraded?['speed']:[]);s.playerCarryingRuby=carry;s.speedActiveTicks=burst?100:0;s.playerQueuedDirX=1;const start=s.playerX;ticks(s,3);distance.push(s.playerX-start);}
  near(distance[1],distance[0]*1.08);
 }
});
test('energy boosts kills and shards without multiplying stolen-energy refunds',()=>{
 const s=fresh(['energy']);enemy(s,'normal',.01);e.useLaser(s);near(s.starEnergy,c.STAR_ENERGY_PER_KILL*1.2);
 s.resources=[{type:'energy',tileX:10,tileY:10}];e.tick(s);near(s.starEnergy,(c.STAR_ENERGY_PER_KILL+c.ENERGY_AMOUNT)*1.2);
 const a=enemy(s,'energy_leech',.01);a.stolenEnergy=20;s.starEnergy=0;s.laserCooldown=0;e.useLaser(s);near(s.starEnergy,20+c.STAR_ENERGY_PER_KILL*1.2);
});
test('bomb gains one tile matching blast visuals, preserves self damage and Ruby immunity',()=>{
 for(const powered of [false,true]){const s=fresh(['bomb']),radius=(powered?c.BOMB_RADIUS_PWR:c.BOMB_RADIUS)+1,a=enemy(s,'normal',100,10+radius);
  s.bomb={tileX:10,tileY:10,powered};s.rubyTileX=s.rubyTileY=10;e.useBomb(s);near(a.hp,100-(powered?c.BOMB_DMG_PWR:c.BOMB_DMG));
  assert.equal(s.bombBlasts[0].maxRadius,radius*c.TILE_SIZE);assert.equal(e.getBombRadius(s,powered),radius);assert.equal(s.rubyHP,100);assert.ok(s.playerHP<100);
 }
});
test('regular spawn and split-child HP gain five percent per milestone, capped at thirty',()=>{
 for(const kills of [0,2,3,5,6,8,9,20]){
  const s=fresh();s.bossesKilled=kills;const mult=1+Math.min(6,Math.floor(kills/3))*.05;near(e.constellationAlienHPMult(s),mult);
  enemy(s,'splitter',.01);e.useLaser(s);assert.equal(s.enemies.length,2);for(const a of s.enemies)near(a.maxHp,c.ENEMY_CONFIGS.mini_splitter.maxHp*c.REGULAR_ENEMY_HP_MULT*mult);
  s.enemies=[];s.noMobs=false;s.spawnTimer=100000;e.tick(s);assert.ok(s.enemies.length>0);
  for(const a of s.enemies)near(a.maxHp,Math.ceil(c.ENEMY_CONFIGS[a.type].maxHp*c.DIFFICULTY_TIERS[s.difficultyLevel].hpMult)*c.REGULAR_ENEMY_HP_MULT*mult);
 }
});
test('owned choices are rejected and never offered again, including the final single choice',()=>{
 const s=fresh();s.constellations=Object.keys(e.CONSTELLATIONS).filter(k=>k!=='wave');s.bossesKilled=59;defeat(s);
 assert.deepEqual(s.constellationChoices,['wave']);assert.equal(e.chooseConstellation(s,'laser'),false);
 assert.equal(e.chooseConstellation(s,'wave'),true);s.bossesKilled=62;defeat(s);
 assert.equal(s.gamePhase,'playing');assert.deepEqual(s.constellationChoices,[]);assert.equal(new Set(s.constellations).size,20);
});
test('Draco changes only damage, Cygnus changes reach/push, and both combine at either power level',()=>{
 for(const powered of [false,true])for(const upgrades of [[],['wave'],['waveReach'],['wave','waveReach']]){
  const reach=upgrades.includes('waveReach')?1:0,damageMult=upgrades.includes('wave')?1.25:1;
  const s=fresh(upgrades),radius=(powered?c.WAVE_RADIUS_PWR:c.WAVE_RADIUS)+reach,a=enemy(s,'normal',100,10+radius);
  s.poweredTicks=powered?100:0;e.activateWave(s);near(100-a.hp,(powered?c.WAVE_DMG_PWR:c.WAVE_DMG)*damageMult);
  assert.equal(a.pushTiles,(powered?c.WAVE_PUSH_TILES_PWR:c.WAVE_PUSH_TILES)+reach);assert.equal(s.waveEffects[0].maxRadius,radius*c.TILE_SIZE);
 }
});
test('meteor defeat at a later milestone preserves boss restoration and Ascension rewards',()=>{
 const s=fresh();s.bossesKilled=11;const a=enemy(s,'frost_warden',1,12);a.maxHp=100;
 s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=35;s.playerX=s.playerY=35.5*c.TILE_SIZE;
 s.playerHP=s.rubyHP=10;s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.tick(s);
 assert.equal(s.bossesKilled,12);assert.equal(s.gamePhase,'constellation');assert.equal(s.specialSkill,'frost_warden');assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);
});
test('attack recharge upgrades shorten only their matching cooldowns',()=>{
 const s=fresh(['laserRate','waveReach','waveRate','burstRate','bombRate']);
 e.useLaser(s);near(s.laserCooldown,c.LASER_COOLDOWN*.85);e.useBullet(s);near(s.bulletCooldown,c.BULLET_COOLDOWN);
 e.activateWave(s);near(s.waveCooldown,c.WAVE_COOLDOWN*.85);e.useSpeedBoost(s);near(s.speedCooldown,c.SPEED_COOLDOWN*.8);
 s.bomb={tileX:10,tileY:10,powered:false};e.useBomb(s);assert.equal(s.bombCooldown,240);
});
test('laser range extends its actual hit footprint and rendered beam without changing bullet range',()=>{
 for(const powered of [false,true]){
  const s=fresh(['laserRange']),range=(powered?c.LASER_RANGE_PWR:c.LASER_RANGE)+2,a=enemy(s,'normal',100,10+range);
  s.poweredTicks=powered?100:0;e.useLaser(s);near(100-a.hp,powered?c.LASER_DMG_PWR:c.LASER_DMG);
  assert.equal(s.laserBeams[0].endX,(10+range+.5)*c.TILE_SIZE);
 }
});
test('bomb damage upgrade affects enemy damage and self damage while preserving Ruby immunity',()=>{
 const s=fresh(['bombDamage']),a=enemy(s);s.bomb={tileX:10,tileY:10,powered:false};s.rubyTileX=s.rubyTileY=10;e.useBomb(s);
 near(a.hp,100-c.BOMB_DMG*1.2);assert.equal(s.playerHP,100-Math.floor(c.BOMB_DMG*1.2*.35));assert.equal(s.rubyHP,100);
});
test('longer speed bursts apply to manual, powered and free energy-shard boosts',()=>{
 for(const powered of [false,true]){const s=fresh(['burstDuration']);s.poweredTicks=powered?100:0;e.useSpeedBoost(s);assert.equal(s.speedActiveTicks,(powered?c.SPEED_DURATION_PWR:c.SPEED_DURATION)*1.25);}
 const s=fresh(['burstDuration']);s.resources=[{type:'energy',tileX:10,tileY:10}];e.tick(s);assert.equal(s.speedActiveTicks,c.SPEED_DURATION*1.25);
});
test('healing alternatives improve only their intended sources and meteor kills skip kill healing',()=>{
 const s=fresh(['manualHealing','playerGuard','killHealing']);s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;s.playerHP=s.rubyHP=20;
 e.healRuby(s);assert.equal(s.playerHP,24);assert.equal(s.rubyHP,27);
 s.resources=[{type:'health',tileX:10,tileY:10}];e.tick(s);near(s.playerHP,24+c.HEAL_AMOUNT);
 enemy(s,'normal',.01);s.laserCooldown=0;const before=s.playerHP;e.useLaser(s);near(s.playerHP,before+7);
 enemy(s,'normal',.01);s.meteoriteWarning=0;s.meteoriteStrikeIn=1;s.godMode=true;const preMeteor=s.playerHP;e.tick(s);near(s.playerHP,preMeteor);
});
