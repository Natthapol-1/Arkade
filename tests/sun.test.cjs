const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => {
  let src = fs.readFileSync(f, 'utf8');
  if (f.endsWith('engine.ts')) src += '\nexport const sunTest = { spawnEnemy, updateKingArenaAttack, updateEnemies };';
  m._compile(ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
};
const e = require('../app/ruby-star/engine.ts'), c = require('../app/ruby-star/constants.ts'), sun = require('../app/ruby-star/sun.ts');
const wisps = s => s.enemies.filter(e => e.type === 'cinder_wisp');
const near = (enemy, x, y) => { enemy.tileX = enemy.targetTileX = x; enemy.tileY = enemy.targetTileY = y; enemy.x = (x + .5) * c.TILE_SIZE; enemy.y = (y + .5) * c.TILE_SIZE; enemy.stepProgress = 0; };
function fresh() {
  const s = e.createModeState('trial', 'fiery_king'); e.godSpawnBoss(s, 'fiery_king');
  const boss = sun.sunBoss(s); near(boss, 39, 39); s.meteoriteTimer = 100000;
  s.sun.wispTimer = s.sun.bossWispTimer = 100000;
  return { s, boss };
}
const close = (a, b) => assert.ok(Math.abs(a-b) < 1e-7, `${a} != ${b}`);

test('Sun starts half hot, separated stations, independent wisps and three phases', () => {
  const {s,boss} = fresh(); assert.equal(s.sun.heat,50); assert.equal(s.sun.stations.length,c.SUN.stations);
  assert.equal(wisps(s).length,c.SUN.initialWisps); assert.equal(boss.maxHp,c.SUN.phaseHP*3);
  for(const station of s.sun.stations) assert.equal(s.map[station.y][station.x], c.T_FLOOR);
  for(const phase of [1,2,3]) { sun.godSetSunPhase(s,phase); assert.equal(boss.hp,(4-phase)*c.SUN.phaseHP); assert.equal(s.sun.phase,phase); }
});
test('stations cover every room initially and after repeated completions', () => {
  const random = Math.random;
  const covered = s => {
    assert.equal(s.sun.stations.length, c.SUN.stations);
    assert.deepEqual([...new Set(s.sun.stations.map(st => c.chamberOfTile(st.x, st.y)))].sort(), [0,1,2,3]);
  };
  try {
    for (const roll of [0, .5, .999999]) {
      Math.random = () => roll;
      const {s} = fresh(); covered(s); s.enemies=[];
      for (let i=0;i<36;i++) {
        const st=s.sun.stations[i%s.sun.stations.length], before=[st.x,st.y];
        const room=c.chamberOfTile(st.x,st.y);
        const lastInRoom=s.sun.stations.filter(other=>c.chamberOfTile(other.x,other.y)===room).length===1;
        s.playerTileX=st.x;s.playerTileY=st.y;
        s.playerX=(st.x+.5)*c.TILE_SIZE;s.playerY=(st.y+.5)*c.TILE_SIZE;
        s.sun.heat=90;s.sun.waveCooldown=0;st.charge=99;
        assert.equal(sun.useCoolingWave(s),true);
        assert.equal(st.charge,0);
        assert.ok(Math.hypot(st.x-before[0],st.y-before[1])>=8);
        if(lastInRoom) assert.equal(c.chamberOfTile(st.x,st.y),room);
        covered(s);
      }
    }
  } finally { Math.random=random; }
});

test('living wisps add heat; removing them stops heat gain without cooling', () => {
  const {s}=fresh(), n=wisps(s).length; sun.updateSun(s); close(s.sun.heat,50+n*c.SUN.heatPerWisp/60);
  s.enemies=s.enemies.filter(x=>x.type!=='cinder_wisp'); const before=s.sun.heat; sun.updateSun(s); close(s.sun.heat,before);
});
test('wisps do not use the ordinary alien population allowance or grant resources', () => {
  const {s}=fresh(); sun.spawnSunWisps(s,60); assert.ok(wisps(s).length>c.DIFFICULTY_TIERS[0].maxEnemies);
  const before=s.enemies.length; e.sunTest.spawnEnemy(s); assert.equal(s.enemies.length,before+1);
  s.playerHP=50; s.starEnergy=0; const w=wisps(s)[0]; e.killEnemy(s,s.enemies.indexOf(w));
  assert.equal(s.playerHP,50); assert.equal(s.starEnergy,0); assert.equal(s.killScore,0);
});
test('Solar Flare clears all wisps and deals its set share of one boss phase', () => {
  const {s,boss}=fresh(); const hp=boss.hp;
  const protectedWisp=wisps(s)[0]; protectedWisp.icyShieldHP=100;
  const shielder=e.createEncounterEnemy(s,'shielder',protectedWisp.tileX,protectedWisp.tileY,10);
  shielder.shieldTargetId=protectedWisp.id;s.enemies.push(shielder);
  e.useSpecialSkill(s);
  assert.equal(wisps(s).length,0); close(hp-boss.hp,c.SUN.phaseHP*c.SUN.solarShare); assert.equal(s.specialSkill,null);
  assert.equal(c.trialSkillCooldown('fiery_king'), 1620);
});
test('Cooling Wave clears only its radius, cools heat, calms rage and obeys cooldown', () => {
  const {s,boss}=fresh(); s.sun.stations=[]; s.enemies=[boss]; near(boss,12,10); s.sun.rage=50;
  const a=e.createEncounterEnemy(s,'cinder_wisp',11,10,3), b=e.createEncounterEnemy(s,'cinder_wisp',39,10,3); s.enemies.push(a,b);
  assert.equal(sun.useCoolingWave(s),true); assert.ok(!s.enemies.includes(a)); assert.ok(s.enemies.includes(b));
  close(s.sun.heat,48); close(s.sun.rage,50-c.SUN.rageCooling-c.SUN.waveDamage*c.SUN.rageOnHit); assert.equal(sun.useCoolingWave(s),false);
});
test('water reaches eight tiles and removes fifteen rage points from the King', () => {
  const {s,boss}=fresh();s.sun.stations=[];s.enemies=[boss];near(boss,18,10);s.sun.rage=50;
  const edge=e.createEncounterEnemy(s,'cinder_wisp',18,10,3),outside=e.createEncounterEnemy(s,'cinder_wisp',19,10,3);
  s.enemies.push(edge,outside);sun.useCoolingWave(s);
  assert.ok(!s.enemies.includes(edge));assert.ok(s.enemies.includes(outside));
  close(s.sun.rage,34.9); // fifteen from water, plus 0.1 from the normal one-HP hit
});
test('burning Emberling takes 10% damage; water leaves it unarmored and unable to move or attack', () => {
  const {s,boss}=fresh(); s.sun.stations=[]; s.enemies=[boss];
  const mob=e.createEncounterEnemy(s,'emberling',11,10,4); s.enemies.push(mob);
  e.damageEnemy(s,mob,1); close(mob.hp,3.9); sun.useCoolingWave(s); assert.equal(mob.extinguished,true); close(mob.hp,2.9);
  mob.attackTimer=0; const hp=s.playerHP; e.tick(s); close(mob.x,11.5*c.TILE_SIZE); close(s.playerHP,hp);
  e.damageEnemy(s,mob,3); assert.ok(mob.hp<=0);
});
test('burning Emberling attack knocks the player back two tiles', () => {
  const {s,boss}=fresh(); s.sun.stations=[]; s.enemies=[boss];
  const mob=e.createEncounterEnemy(s,'emberling',11,10,4); s.enemies.push(mob);
  mob.attackTimer=0; s.playerKnockback=null;
  e.tick(s);
  assert.ok(s.playerKnockback, 'player knocked back');
  assert.equal(s.playerKnockback.dirX, -1);
  assert.equal(s.playerKnockback.tilesLeft, c.SUN.emberlingKnockback);
});
test('holding Space trickles cooling; completion bursts and relocates the station', () => {
  const {s}=fresh(); s.enemies=s.enemies.filter(x=>x.type==='fiery_king');
  s.playerHP=50;s.rubyHP=50;
  const station=s.sun.stations[0]; station.x=11;station.y=10;s.sun.charging=true; const before=[station.x,station.y];
  for(let i=0;i<c.SUN.stationChargeTicks+1;i++)sun.updateSun(s);
  close(s.sun.heat,34); assert.equal(station.charge,0);assert.notDeepEqual([station.x,station.y],before); assert.ok(s.sun.ripples.length);
  assert.equal(s.playerHP,50+c.SUN.stationHealing);assert.equal(s.rubyHP,50+c.SUN.stationHealing);
  for(let i=0;i<10;i++)sun.updateSun(s);assert.equal(s.playerHP,50+c.SUN.stationHealing);
});
test('a Cooling Wave instantly adds station charge and can complete it', () => {
  const {s}=fresh(); const station=s.sun.stations[0]; station.x=11;station.y=10;station.charge=60;
  s.playerHP=95;s.rubyHP=50;
  sun.useCoolingWave(s);assert.equal(station.charge,0); close(s.sun.heat,35);assert.notDeepEqual([station.x,station.y],[11,10]);
  assert.equal(s.playerHP,100);assert.equal(s.rubyHP,50+c.SUN.stationHealing);
});
test('King proximity resets stations and blocks water charging', () => {
  const {s,boss}=fresh(); const station=s.sun.stations[0];station.x=11;station.y=10;station.charge=75;near(boss,12,10);s.sun.charging=true;
  sun.updateSun(s);assert.equal(station.charge,0);assert.equal(station.blocked,true);
  sun.useCoolingWave(s);assert.equal(station.charge,0);
});
test('full heat blasts player, placed Ruby and aliens, exempts King, resets to half', () => {
  const {s,boss}=fresh();s.rubyTileX=10;s.rubyTileY=10;s.sun.heat=100;
  const hp=boss.hp;sun.updateSun(s); assert.equal(s.sun.heat,50);assert.equal(s.playerHP,100-c.SUN.eruptionDamage);assert.equal(s.rubyHP,100-c.SUN.eruptionDamage);assert.equal(boss.hp,hp);
  assert.equal(wisps(s).length,0);assert.ok(s.sun.eruptionTicks>0);
});
test('zero heat stuns King and grants exactly five fast phase-based damage waves', () => {
  const {s,boss}=fresh();s.sun.stations=[];s.enemies=[boss];near(boss,12,10);
  sun.coolSun(s,100);assert.equal(s.sun.quenchedTicks,c.SUN.quenchTicks);assert.equal(s.sun.empoweredCasts,5);
  const hp=boss.hp, pos=[boss.x,boss.y];
  for(let i=0;i<5;i++) {
    const before=boss.hp;assert.equal(sun.useCoolingWave(s),true);close(before-boss.hp,c.SUN.phaseHP*c.SUN.empoweredDamage);
    if(i<4)for(let t=0;t<c.SUN.rapidCooldown;t++)e.tick(s);
  }
  close(hp-boss.hp,c.SUN.phaseHP*c.SUN.empoweredDamage*5);assert.deepEqual([boss.x,boss.y],pos);
  assert.equal(sun.useCoolingWave(s),false);
  assert.equal(s.sun.empoweredCasts,0);
  assert.equal(s.sun.quenchedTicks,c.SUN.quenchDelayTicks);
  for(let i=0;i<c.SUN.quenchDelayTicks-1;i++) {
    sun.updateSun(s);
    assert.equal(s.sun.heat,0);
    assert.ok(s.sun.quenchedTicks>0);
  }
  sun.updateSun(s);
  assert.equal(s.sun.heat,50);assert.equal(s.sun.quenchedTicks,0);
});
test('zero temperature halves enemy movement, including flaming enemies and station sappers', () => {
  for(const type of ['normal','fast','emberling','scorch_sapper']) {
    const {s}=fresh();s.enemies=[];s.playerCarryingRuby=true;
    const mob=e.createEncounterEnemy(s,type,11,10,20);
    mob.targetTileX=12;mob.targetTileY=10;mob.pathTimer=100;mob.attackTimer=100;
    s.enemies=[mob];s.sun.stations=[{id:0,x:16,y:10,charge:60,blocked:false}];
    const normal=structuredClone(s),cold=structuredClone(s);cold.sun.quenchedTicks=60;
    for(let t=1;t<=10;t++) {cold.gameTick=t;e.sunTest.updateEnemies(cold);}
    for(let t=1;t<=5;t++) {normal.gameTick=t;e.sunTest.updateEnemies(normal);}
    close(cold.enemies[0].x,normal.enemies[0].x);close(cold.enemies[0].y,normal.enemies[0].y);
    assert.ok(cold.enemies[0].stepProgress>0,type+' still moves');
    const before=cold.enemies[0].stepProgress;cold.sun.quenchedTicks=0;cold.gameTick=11;e.sunTest.updateEnemies(cold);
    assert.ok(cold.enemies[0].stepProgress>before,type+' resumes on the next tick');
  }
});

test('zero temperature halves melee and ranged cooldowns and charged attack windups, then restores them', () => {
  for(const type of ['normal','emberling','sniper','charger']) {
    const {s}=fresh();const mob=e.createEncounterEnemy(s,type,11,10,20);
    s.enemies=[mob];s.playerCarryingRuby=true;mob.attackTimer=40;
    if(type==='charger')mob.chargeWindupTicks=30;
    s.sun.quenchedTicks=60;
    for(let t=1;t<=20;t++){s.gameTick=t;e.sunTest.updateEnemies(s);}
    assert.equal(mob.attackTimer,30,type+' cooldown is half speed');
    if(type==='charger')assert.equal(mob.chargeWindupTicks,20);
    s.sun.quenchedTicks=0;s.gameTick=21;e.sunTest.updateEnemies(s);
    assert.equal(mob.attackTimer,29,type+' immediately returns to normal');
    if(type==='charger')assert.equal(mob.chargeWindupTicks,19);
  }
});

test('empowered wave at zero heat deals heavy damage to non-boss enemies', () => {
  const {s,boss}=fresh(); s.sun.stations=[]; s.enemies=[boss]; near(boss,12,10);
  const mob=e.createEncounterEnemy(s,'normal',11,10,20); s.enemies.push(mob);
  sun.coolSun(s,100);
  const before=mob.hp;
  assert.equal(sun.useCoolingWave(s),true);
  assert.equal(before - mob.hp, c.SUN.empoweredNormalDamage);
});
test('stun times out safely if the player does not cast; restart clears all temporary state', () => {
  const {s}=fresh(); sun.coolSun(s,100);for(let i=0;i<c.SUN.quenchTicks;i++)sun.updateSun(s);
  assert.equal(s.sun.heat,50);assert.equal(s.sun.empoweredCasts,0);
  const reset=e.createModeState('trial','fiery_king');assert.equal(reset.sun.heat,50);assert.equal(reset.sun.waveCooldown,0);assert.equal(reset.sun.quenchedTicks,0);
});
test('Sun mechanics and input are paused in menus and after loss', () => {
  const {s}=fresh();s.sun.charging=true;s.sun.waveCooldown=100;s.gamePhase='teleporting';const before=s.sun.heat;
  e.tick(s);sun.updateSun(s);assert.equal(s.sun.heat,before);assert.equal(s.sun.waveCooldown,100);assert.equal(s.sun.charging,false);assert.equal(sun.useCoolingWave(s),false);
});
test('arena attacks spawn many wisps, and HP damage interrupts them', () => {
  const {s,boss}=fresh();boss.king={untouchedTicks:0,arenaWindupTicks:1};const n=wisps(s).length;
  e.sunTest.updateKingArenaAttack(s,boss);assert.equal(wisps(s).length,n+c.SUN.arenaWisps);
  boss.king.arenaWindupTicks=2;e.damageEnemy(s,boss,1);e.sunTest.updateKingArenaAttack(s,boss);assert.equal(boss.king.arenaWindupTicks,0);
});
test('rage raises nearby wisp production without changing regular spawn timers', () => {
  for(const rage of [0,100]) {
    const {s}=fresh();s.sun.rage=rage;s.sun.bossWispTimer=1;const n=wisps(s).length,t=s.spawnTimer;sun.updateSun(s);
    assert.equal(wisps(s).length-n,1+Math.floor(rage/25));assert.equal(s.spawnTimer,t);
  }
});
test('King rage increases at the configured rate per second and is capped at 100', () => {
  const {s}=fresh(); s.sun.rage=0;
  for(let i=0;i<60;i++) sun.updateSun(s);
  close(s.sun.rage, c.SUN.ragePerSecond);
  s.sun.rage=99.8;
  for(let i=0;i<60;i++) sun.updateSun(s);
  assert.equal(s.sun.rage, 100);
});
test('phase transitions are forward only and only the third phase defeat wins', () => {
  const {s,boss}=fresh();boss.hp=c.SUN.phaseHP*2;sun.updateSun(s);assert.equal(s.sun.phase,2);assert.equal(s.gamePhase,'playing');
  boss.hp=c.SUN.phaseHP;sun.updateSun(s);assert.equal(s.sun.phase,3);assert.equal(s.gamePhase,'playing');
  boss.hp=0;e.killEnemy(s,s.enemies.indexOf(boss));assert.equal(s.gamePhase,'won');assert.equal(s.bossesKilled,1);assert.equal(wisps(s).length,0);assert.ok(!s.enemies.includes(boss));
});
test('Sun meteors remove one tenth of a phase rather than three quarters of total HP', () => {
  const {s,boss}=fresh();near(boss,39,39);s.godMode=true;
  s.meteoriteWarning=c.chamberOfTile(boss.tileX,boss.tileY);s.meteoriteStrikeIn=1;
  const hp=boss.hp;e.tick(s);close(hp-boss.hp,c.SUN.phaseHP*c.SUN.meteorShare);
});
test('Sun effects and wisps clean up when debug boss removal interrupts a stun', () => {
  const {s}=fresh();sun.coolSun(s,100);s.sun.charging=true;
  e.godSetNoBossSpawns(s,true);assert.equal(s.sun.quenchedTicks,0);assert.equal(s.sun.charging,false);assert.equal(wisps(s).length,0);
});
test('Zero Heat debug control summons a missing King and grants the full extinguished window', () => {
  const s=e.createModeState('trial','fiery_king');
  sun.godSetSunHeat(s,0);
  assert.ok(sun.sunBoss(s));assert.equal(s.sun.heat,0);assert.equal(s.sun.quenchedTicks,c.SUN.quenchTicks);assert.equal(s.sun.empoweredCasts,5);
  s.sun.empoweredCasts=2;sun.godSetSunHeat(s,0);assert.equal(s.sun.empoweredCasts,5);
});
test('Full Heat debug control leaves the extinguished window and triggers the normal eruption', () => {
  const {s,boss}=fresh();s.godMode=true;sun.godSetSunHeat(s,0);sun.godSetSunHeat(s,100);
  assert.equal(s.sun.quenchedTicks,0);assert.equal(s.sun.empoweredCasts,0);const hp=boss.hp;
  sun.updateSun(s);assert.equal(s.sun.heat,50);assert.equal(boss.hp,hp);assert.ok(s.sun.eruptionTicks>0);
  s.gamePhase='teleporting';sun.godSetSunHeat(s,0);assert.equal(s.sun.heat,50);
});
test('No Mobs preserves wisps and all independent wisp spawning', () => {
  const {s,boss}=fresh();s.enemies.push(e.createEncounterEnemy(s,'normal',15,10,5));const before=wisps(s).length;
  e.godSetNoMobs(s,true);assert.equal(wisps(s).length,before);assert.ok(!s.enemies.some(x=>x.type==='normal'));
  s.sun.wispTimer=s.sun.bossWispTimer=1;sun.updateSun(s);
  assert.equal(wisps(s).length,before+c.SUN.wispBatch+1);
  const n=wisps(s).length;boss.king={untouchedTicks:0,arenaWindupTicks:1};e.sunTest.updateKingArenaAttack(s,boss);
  assert.equal(wisps(s).length,n+c.SUN.arenaWisps);
});
test('No Wisps clears only wisps, grants no rewards, and blocks natural, boss and arena spawns', () => {
  const {s,boss}=fresh();const mob=e.createEncounterEnemy(s,'normal',15,10,5);s.enemies.push(mob);
  s.playerHP=50;s.starEnergy=0;sun.godSetNoWisps(s,true);
  assert.equal(wisps(s).length,0);assert.ok(s.enemies.includes(mob));assert.ok(s.enemies.includes(boss));assert.equal(s.noMobs,false);
  assert.equal(s.playerHP,50);assert.equal(s.starEnergy,0);assert.equal(s.killScore,0);assert.equal(s.sun.heat,50);
  s.sun.wispTimer=s.sun.bossWispTimer=1;sun.updateSun(s);assert.equal(wisps(s).length,0);
  boss.king={untouchedTicks:0,arenaWindupTicks:1};e.sunTest.updateKingArenaAttack(s,boss);assert.equal(wisps(s).length,0);
  const n=s.enemies.length;e.sunTest.spawnEnemy(s);assert.equal(s.enemies.length,n+1);
});
test('turning No Wisps off resumes wisps even while No Mobs stays enabled', () => {
  const {s}=fresh();e.godSetNoMobs(s,true);sun.godSetNoWisps(s,true);sun.godSetNoWisps(s,false);
  s.sun.wispTimer=1;sun.updateSun(s);assert.equal(wisps(s).length,c.SUN.wispBatch);assert.equal(s.noMobs,true);
});
test('heat adjustment buttons step by ten, respect endpoints and reject paused actions', () => {
  const {s}=fresh();s.godMode=true;
  sun.godAdjustSunHeat(s,10);assert.equal(s.sun.heat,60);
  sun.godAdjustSunHeat(s,-10);assert.equal(s.sun.heat,50);
  s.sun.heat=5;sun.godAdjustSunHeat(s,-10);assert.equal(s.sun.heat,0);assert.equal(s.sun.empoweredCasts,5);
  sun.godAdjustSunHeat(s,10);assert.equal(s.sun.heat,10);assert.equal(s.sun.quenchedTicks,0);assert.equal(s.sun.empoweredCasts,0);
  s.sun.heat=95;sun.godAdjustSunHeat(s,10);assert.equal(s.sun.heat,100);sun.updateSun(s);assert.equal(s.sun.heat,50);
  s.gamePhase='teleporting';sun.godAdjustSunHeat(s,-10);assert.equal(s.sun.heat,50);
});
test('station charging pulses immediately and at a bounded cadence, stopping when released, blocked or paused', () => {
  const ui=require('../app/ruby-star/ui-sfx.ts'),original=ui.playUiSfx,sounds=[];
  const originalAudio=e.playAudioOneShot,layers=[];
  ui.playUiSfx=kind=>sounds.push(kind);
  e.playAudioOneShot=(file,volume)=>layers.push({file,volume});
  try {
    const {s,boss}=fresh();sun.godSetNoWisps(s,true);
    const station=s.sun.stations[0];station.x=11;station.y=10;s.sun.charging=true;
    for(let i=0;i<41;i++)sun.updateSun(s);
    assert.equal(sounds.filter(x=>x==='stationCharge').length,3);
    assert.equal(s.healJiggleTicks,18);assert.equal(layers.length,3);
    assert.ok(layers.every(x=>x.file==='/sounds/deghost.wav'&&x.volume===.08));
    s.sun.charging=false;for(let i=0;i<25;i++)sun.updateSun(s);assert.equal(sounds.length,3);
    s.sun.charging=true;sun.updateSun(s);assert.equal(sounds.length,4);
    near(boss,12,10);for(let i=0;i<25;i++)sun.updateSun(s);assert.equal(sounds.length,4);
    near(boss,39,39);s.gamePhase='teleporting';for(let i=0;i<25;i++)sun.updateSun(s);assert.equal(sounds.length,4);
  } finally {ui.playUiSfx=original;e.playAudioOneShot=originalAudio;}
});
test('empowered waves shake and play an ultimate impact once, including a winning hit', () => {
  const ui=require('../app/ruby-star/ui-sfx.ts'),original=ui.playUiSfx,sounds=[];ui.playUiSfx=kind=>sounds.push(kind);
  try {
    const {s,boss}=fresh();s.sun.stations=[];
    sun.useCoolingWave(s);assert.equal(s.screenShakeTicks,0);assert.ok(!sounds.includes('coolingUltimate'));
    sun.coolSun(s,100);near(boss,12,10);boss.hp=10;
    assert.equal(sun.useCoolingWave(s),true);assert.equal(s.gamePhase,'won');
    assert.equal(sounds.filter(x=>x==='coolingUltimate').length,1);assert.equal(s.screenShakeTicks,18);assert.equal(s.screenShakeAmt,10);
    sun.useCoolingWave(s);assert.equal(sounds.filter(x=>x==='coolingUltimate').length,1);
  } finally {ui.playUiSfx=original;}
});
test('zero heat plays one heavy transition and clears the King’s lingering fire effects', () => {
  const ui=require('../app/ruby-star/ui-sfx.ts'),original=ui.playUiSfx,originalAudio=e.playAudioOneShot,sounds=[],layers=[];
  ui.playUiSfx=kind=>sounds.push(kind);e.playAudioOneShot=(file,volume)=>layers.push({file,volume});
  try {
    const {s,boss}=fresh();boss.shootTicks=22;s.kingArenaPulseTicks=30;
    s.laserBeams.push({color:'#cc0022',ticks:10});sun.coolSun(s,100);sun.coolSun(s,100);
    assert.equal(sounds.filter(x=>x==='sunExtinguish').length,1);
    assert.ok(layers.some(x=>x.file==='/sounds/sci-fi-explosion-09.mp3'&&x.volume===.9));
    assert.ok(layers.some(x=>x.file==='/sounds/frost-shield-break.mp3'&&x.volume===.8));
    assert.equal(boss.shootTicks,0);assert.equal(s.kingArenaPulseTicks,0);assert.equal(s.laserBeams.length,0);
    assert.equal(s.screenShakeTicks,12);assert.equal(s.screenShakeAmt,6);
  } finally {ui.playUiSfx=original;e.playAudioOneShot=originalAudio;}
});

test('hurting the King cools his rage a little', () => {
  const s = e.createModeState('trial', 'fiery_king');
  s.noMobs = true; s.meteoriteTimer = 100000;
  e.godSpawnBoss(s, 'fiery_king');
  const boss = s.enemies.find(x => x.type === 'fiery_king');
  s.sun.rage = 50;
  const api = e.sunTest; void api;
  const before = boss.hp;
  e.damageEnemy(s, boss, 20, 'player');
  const lost = before - boss.hp;
  assert.ok(lost > 0);
  assert.ok(Math.abs(s.sun.rage - (50 - lost * c.SUN.rageOnHit)) < 1e-9);
});

test('after the five big waves, C returns as an ordinary wave after a 1s cooldown', () => {
  const {s,boss}=fresh();s.sun.stations=[];s.enemies=[boss];near(boss,12,10);
  sun.coolSun(s,100);
  for(let i=0;i<5;i++){assert.equal(sun.useCoolingWave(s),true);for(let k=0;k<c.SUN.rapidCooldown;k++)sun.updateSun(s);}
  for(let k=0;k<c.SUN.quenchTicks&&s.sun.quenchedTicks>0;k++)sun.updateSun(s);
  assert.equal(s.sun.quenchedTicks,0);assert.equal(s.sun.empoweredCasts,0);assert.equal(s.sun.waveCooldown,c.SUN.afterQuenchCooldown,'short cooldown');
  assert.equal(sun.useCoolingWave(s),false);for(let k=0;k<c.SUN.afterQuenchCooldown;k++)sun.updateSun(s);assert.equal(s.sun.waveCooldown,0);
  const hp=boss.hp;assert.equal(sun.useCoolingWave(s),true);
  assert.ok(hp-boss.hp<10,'an ordinary wave, not a big hit');assert.equal(s.sun.waveCooldown,c.SUN.waveCooldown);
});

test('phase 2: above the rage threshold the King leaves a burning trail; phase 1 and low rage leave none', () => {
  for (const [phase, rage, expect] of [[1, 90, false], [2, 10, false], [2, 25, true], [2, 90, true]]) {
    const {s,boss}=fresh(); sun.godSetSunPhase(s, phase); s.sun.rage = rage; s.sun.burning = [];
    near(boss, 39, 39); sun.updateSun(s); near(boss, 40, 39); sun.updateSun(s);
    assert.equal(s.sun.burning.length > 0, expect, `phase ${phase} rage ${rage}`);
    if (expect) assert.ok(s.sun.burning.some(b => b.x === 40 && b.y === 39));
  }
});
test('the burning trail covers a centered 3 by 3 patch, refreshes overlaps and excludes walls and pads', () => {
  const {s,boss}=fresh();sun.godSetSunPhase(s,2);s.sun.rage=50;
  for(let y=37;y<=40;y++)for(let x=37;x<=40;x++)s.map[y][x]=c.T_FLOOR;
  near(boss,38,38);s.sun.burning=[];sun.updateSun(s);
  assert.equal(s.sun.burning.length,9);
  for(let y=37;y<=39;y++)for(let x=37;x<=39;x++)assert.ok(s.sun.burning.some(b=>b.x===x&&b.y===y));
  const overlap=s.sun.burning.find(b=>b.x===38&&b.y===38);overlap.ticks=10;
  s.map[37][39]=c.T_WALL;s.map[39][39]=c.T_TELEPORT;
  s.sun.burning=s.sun.burning.filter(b=>s.map[b.y][b.x]===c.T_FLOOR);
  near(boss,39,38);sun.updateSun(s);assert.equal(overlap.ticks,c.SUN.trailTicks);
  assert.ok(s.sun.burning.every(b=>s.map[b.y][b.x]===c.T_FLOOR));
  assert.equal(new Set(s.sun.burning.map(b=>`${b.x},${b.y}`)).size,s.sun.burning.length);
});
test('rage grows at 1.6 per second in phases two and three', () => {
  for(const phase of [2,3]) {
    const {s}=fresh();sun.godSetSunPhase(s,phase);s.sun.rage=0;
    for(let i=0;i<60;i++)sun.updateSun(s);
    close(s.sun.rage,1.6);
  }
});

test('standing on a burning tile hurts you and adds heat; Ruby on one is hurt too', () => {
  const {s}=fresh(); sun.godSetSunPhase(s, 2); s.sun.rage = 0; s.enemies = s.enemies.filter(x => x.type !== 'cinder_wisp');
  s.sun.burning = [{ x: s.playerTileX, y: s.playerTileY, ticks: 1000 }];
  s.rubyTileX = s.playerTileX + 2; s.rubyTileY = s.playerTileY; s.sun.burning.push({ x: s.rubyTileX, y: s.rubyTileY, ticks: 1000 });
  s.playerHP = s.rubyHP = 100; const heat = s.sun.heat; s.sun.trailPulse = 1;
  sun.updateSun(s);
  assert.equal(s.playerHP, 100 - c.SUN.trailDamage); assert.equal(s.rubyHP, 100 - c.SUN.trailRubyDamage);
  assert.ok(s.sun.heat >= heat + c.SUN.trailHeat - 1e-9);
});

test('water puts out burning tiles in range, and reaching zero heat puts out the whole trail', () => {
  const {s}=fresh(); sun.godSetSunPhase(s, 2);
  s.sun.burning = [{ x: s.playerTileX + 2, y: s.playerTileY, ticks: 1000 }, { x: s.playerTileX + 20, y: s.playerTileY, ticks: 1000 }];
  sun.useCoolingWave(s);
  assert.deepEqual(s.sun.burning.map(b => b.x), [s.playerTileX + 20], 'only the one in range goes out');
  sun.coolSun(s, 100);
  assert.equal(s.sun.burning.length, 0);
});

test('Cinder Wisps keep the same arrival rate in every phase', () => {
  const {s}=fresh(); sun.godSetSunPhase(s, 2); s.sun.wispTimer = 1; sun.updateSun(s);
  assert.equal(s.sun.wispTimer, c.SUN.wispGap);
});

test('phase 3: a room is marked, then flares and heats the arena; phase 2 has no flares', () => {
  const p2=fresh(); sun.godSetSunPhase(p2.s, 2); p2.s.sun.flareTimer = 1; sun.updateSun(p2.s);
  assert.equal(p2.s.sun.flare, null, 'none in phase 2');
  const {s}=fresh(); sun.godSetSunPhase(s, 3); s.sun.wispTimer = 1e6; s.enemies = s.enemies.filter(x => x.type !== 'cinder_wisp');
  s.sun.flareTimer = 1; sun.updateSun(s);
  assert.ok(s.sun.flare && s.sun.flare.ticks === c.SUN.flareWarning, 'a room is marked');
  s.sun.heat = 40; s.sun.flare.ticks = 1; sun.updateSun(s);
  assert.equal(s.sun.flare, null); assert.ok(s.sun.heat >= 40 + c.SUN.flareHeat - 1e-6, 'it flared'); assert.equal(s.sun.flareFlash.defused, false);
});

test('Sunburst warning sounds once globally even when another room is marked', () => {
  const ui=require('../app/ruby-star/ui-sfx.ts'), original=ui.playUiSfx, originalAudio=e.playAudioOneShot, random=Math.random;
  const cues=[], layers=[];
  ui.playUiSfx=kind=>cues.push(kind);e.playAudioOneShot=(file,volume)=>layers.push({file,volume});
  try {
    for(let room=0;room<4;room++) {
      Math.random=()=> (room+.5)/4;
      const {s}=fresh();sun.godSetSunPhase(s,3);
      const [r1,c1]=c.CHAMBER_BOUNDS[(room+1)%4];
      s.playerTileX=c1+3;s.playerTileY=r1+3;
      s.playerX=(s.playerTileX+.5)*c.TILE_SIZE;s.playerY=(s.playerTileY+.5)*c.TILE_SIZE;
      s.sun.flareTimer=1;s.gamePhase='teleporting';
      const before=cues.filter(k=>k==='sunburstWarning').length;
      sun.updateSun(s);assert.equal(cues.filter(k=>k==='sunburstWarning').length,before);
      s.gamePhase='playing';sun.updateSun(s);
      assert.equal(s.sun.flare.room,room);
      assert.notEqual(c.chamberOfTile(s.playerTileX,s.playerTileY),room);
      assert.equal(cues.filter(k=>k==='sunburstWarning').length,before+1);
      for(let i=0;i<20;i++)sun.updateSun(s);
      assert.equal(cues.filter(k=>k==='sunburstWarning').length,before+1);
    }
    assert.equal(layers.filter(k=>k.file==='/sounds/kingFireSpell.mp3'&&k.volume===.7).length,4);
  } finally {ui.playUiSfx=original;e.playAudioOneShot=originalAudio;Math.random=random;}
});

test('water landing in the marked room, or Solar Flare, defuses it and cools the arena', () => {
  const {s}=fresh(); sun.godSetSunPhase(s, 3);
  const mine = c.chamberOfTile(s.playerTileX, s.playerTileY);
  s.sun.flare = { room: (mine + 1) % 4, ticks: 200 }; sun.useCoolingWave(s);
  assert.ok(s.sun.flare, 'water in another room does not defuse it');
  s.sun.waveCooldown = 0; s.sun.flare = { room: mine, ticks: 200 }; s.sun.heat = 50;
  sun.useCoolingWave(s);
  assert.equal(s.sun.flare, null); assert.equal(s.sun.flareFlash.defused, true);
  assert.ok(s.sun.heat <= 50 - c.SUN.waveCooling - c.SUN.flareDefuseCool + 1e-6);
  s.sun.flare = { room: (mine + 2) % 4, ticks: 200 }; s.specialSkill = 'fiery_king'; e.useSpecialSkill(s);
  assert.equal(s.sun.flare, null, 'Solar Flare defuses it from anywhere');
});

test('extinguishing the King cancels a pending flare', () => {
  const {s}=fresh(); sun.godSetSunPhase(s, 3); s.sun.flare = { room: 0, ticks: 200 };
  sun.coolSun(s, 100);
  assert.equal(s.sun.flare, null);
});

test('a flare that goes off burns you and Ruby only if you are in that room', () => {
  for (const inside of [true, false]) {
    const {s}=fresh(); sun.godSetSunPhase(s, 3); s.enemies = s.enemies.filter(x => x.type !== 'cinder_wisp');
    const mine = c.chamberOfTile(s.playerTileX, s.playerTileY);
    s.rubyTileX = s.playerTileX; s.rubyTileY = s.playerTileY + 1; s.playerHP = s.rubyHP = 100;
    s.sun.flare = { room: inside ? mine : (mine + 1) % 4, ticks: 1 }; sun.updateSun(s);
    assert.equal(s.playerHP, inside ? 100 - c.SUN.flareDamage : 100);
    assert.equal(s.rubyHP, inside ? 100 - c.SUN.flareDamage : 100);
  }
});

test('Scorch Sappers arrive only from phase 2, up to a cap', () => {
  const p1=fresh(); p1.s.noMobs=false; p1.s.sun.sapperTimer=1; sun.updateSun(p1.s);
  assert.equal(p1.s.enemies.filter(x=>x.type==='scorch_sapper').length,0,'none in phase 1');
  const {s}=fresh(); s.noMobs=false; sun.godSetSunPhase(s,2);
  for (let i=0;i<c.SUN.sapperCap+2;i++){ s.sun.sapperTimer=1; sun.updateSun(s); }
  const n=s.enemies.filter(x=>x.type==='scorch_sapper').length;
  assert.ok(n>0 && n<=c.SUN.sapperCap, 'spawned, capped: '+n);
});

test('a Scorch Sapper walks to the nearest station and drains it, never hurting you; water destroys it', () => {
  const {s}=fresh(); sun.godSetSunPhase(s,2); s.enemies=s.enemies.filter(x=>x.type==='fiery_king');
  const st=s.sun.stations[0]; s.sun.stations=[st]; st.charge=60; st.blocked=false;
  const boss=sun.sunBoss(s); near(boss,1,1);
  const startX=[st.x-3,st.x+3,st.x].find(x=>s.map[st.y][x]===c.T_FLOOR) ?? st.x;
  const imp=e.createEncounterEnemy(s,'scorch_sapper',startX,st.y,3); s.enemies.push(imp);
  Object.assign(s,{playerTileX:startX,playerTileY:st.y,playerTargetX:startX,playerTargetY:st.y,playerX:(startX+.5)*c.TILE_SIZE,playerY:(st.y+.5)*c.TILE_SIZE});
  const hp=s.playerHP;
  for (let i=0;i<600&&imp.sapStation===undefined;i++) sun.updateScorchSapper(s,imp);
  assert.equal(imp.sapStation,st.id,'reached and draining');
  for (let i=0;i<60;i++) sun.updateScorchSapper(s,imp);
  assert.ok(st.charge<60,'charge drained'); assert.equal(s.playerHP,hp,'never attacks');
  Object.assign(s,{playerTileX:imp.tileX,playerTileY:imp.tileY,playerX:imp.x,playerY:imp.y}); s.sun.waveCooldown=0;
  sun.useCoolingWave(s);
  assert.ok(!s.enemies.includes(imp),'water destroys it');
});

test('reaching zero heat gives you a free speed burst', () => {
  const {s}=fresh(); s.speedActiveTicks=0;
  sun.coolSun(s,100);
  assert.ok(s.speedActiveTicks>0);
});
