const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');

test('Endless Space starts a standard run at stage 0',()=>{
 const s=engine.createModeState('endless');
 assert.equal(s.mode,'endless');assert.equal(s.bossesKilled,0);assert.equal(s.constellationChoices.length,0);assert.equal(s.ascensionBannerTicks,0);
 assert.deepEqual({...s,mode:undefined,ambientEvents:undefined},{...engine.createInitialState(),mode:undefined,ambientEvents:undefined});
});

test('Endless Space: Ascension starts at stage 10 with celestial skills unlocked and the hardest alien tier',()=>{
 const s=engine.createModeState('ascension');
 assert.equal(s.mode,'ascension');assert.equal(s.bossesKilled,c.SPECIAL_UNLOCK_KILLS);assert.equal(c.SPECIAL_UNLOCK_KILLS,10);
 assert.equal(s.difficultyLevel,c.DIFFICULTY_TIERS.length-1);assert.ok(s.ascensionBannerTicks>0);assert.equal(s.specialSkill,null);
});

test('Ascension opens with a celestial skill choice that pauses play until a skill is picked',()=>{
 const s=engine.createModeState('ascension');assert.equal(s.gamePhase,'skillChoice');
 const tick=s.gameTick;engine.tick(s);engine.tick(s);assert.equal(s.gameTick,tick,'paused while choosing');
 assert.equal(engine.chooseStartingSkill(s,'storm_reaper'),true);assert.equal(s.specialSkill,'storm_reaper');assert.equal(s.gamePhase,'playing');
 assert.equal(engine.chooseStartingSkill(s,'devourer'),false,'only once');assert.equal(s.specialSkill,'storm_reaper');
 assert.equal(engine.createModeState('endless').gamePhase,'playing');
});

test('Ascension offers three Constellation picks in a row at the start',()=>{
 const s=engine.createModeState('ascension');s.noMobs=true;s.meteoriteTimer=100000;engine.chooseStartingSkill(s,'fiery_king');
 assert.equal(s.constellationChoices.length,2);assert.equal(s.pendingConstellations,3);
 for(let pick=1;pick<=3;pick++){
  for(let i=0;i<70&&s.gamePhase!=='constellation';i++)engine.tick(s);
  assert.equal(s.gamePhase,'constellation','pick '+pick+' opens');
  assert.ok(engine.chooseConstellation(s,s.constellationChoices[0]));
  assert.equal(s.constellations.length,pick);
 }
 assert.equal(s.pendingConstellations,0);assert.equal(s.constellationChoices.length,0);
 for(let i=0;i<120;i++)engine.tick(s);assert.equal(s.gamePhase,'playing');
});

test('Tutorial walks through every step in order and finishes',()=>{
 const s=engine.createModeState('tutorial');
 assert.equal(s.mode,'tutorial');assert.ok(s.noMobs&&s.noBossSpawns&&s.immortal);
 const id=()=>c.TUTORIAL_STEPS[s.tutorial.step].id;
 const advance=()=>{for(let i=0;i<c.TUTORIAL_STEP_PAUSE+2;i++)engine.tick(s);};
 const setTile=(x,y)=>Object.assign(s,{playerTileX:x,playerTileY:y,playerTargetX:x,playerTargetY:y,playerX:(x+.5)*c.TILE_SIZE,playerY:(y+.5)*c.TILE_SIZE,playerStepProgress:0});
 const clearAliens=()=>{for(const a of s.enemies)a.hp=0;engine.tick(s);};
 // move
 assert.equal(id(),'move');for(let i=0;i<8;i++){setTile(5+(i%2),5);engine.tick(s);}advance();
 assert.equal(id(),'laser');assert.equal(s.enemies.length,2);
 s.laserCooldown=0;engine.useLaser(s);engine.tick(s);clearAliens();advance();
 assert.equal(id(),'bullet');s.bulletCooldown=0;engine.useBullet(s);engine.tick(s);clearAliens();advance();
 assert.equal(id(),'wave');s.waveCooldown=0;engine.activateWave(s);engine.tick(s);clearAliens();advance();
 assert.equal(id(),'speed');s.speedCooldown=0;engine.useSpeedBoost(s);engine.tick(s);advance();
 assert.equal(id(),'bomb');s.bombCooldown=0;engine.useBomb(s);engine.tick(s);engine.useBomb(s);engine.tick(s);clearAliens();advance();
 assert.equal(id(),'energy');assert.ok(s.starEnergy>=90);assert.equal(s.poweredTicks,0);clearAliens();assert.ok(s.starEnergy>=100,'kills fill energy: '+s.starEnergy);
 s.laserCooldown=0;engine.useLaser(s);engine.tick(s);assert.ok(s.poweredTicks>0);advance();
 assert.equal(id(),'carry');setTile(s.rubyTileX,s.rubyTileY);engine.toggleCarryRuby(s);engine.tick(s);engine.toggleCarryRuby(s);engine.tick(s);advance();
 assert.equal(id(),'heal');assert.ok(s.playerHP<=50&&s.rubyHP<=50);
 for(let i=0;i<6;i++){for(let k=0;k<40&&s.rubyHealCooldown>0;k++)engine.tick(s);assert.ok(engine.healRuby(s),'heal '+i);engine.tick(s);}advance();
 assert.equal(id(),'teleport');setTile(c.TELEPORT_PADS[0][0],c.TELEPORT_PADS[0][1]);s.playerChamber=0;
 assert.ok(engine.tryActivateTeleport(s));engine.doTeleport(s,s.teleportDestOptions[0]);engine.tick(s);advance();
 assert.equal(id(),'meteor');const room=s.meteoriteWarning;assert.ok(room>=0);
 // Staying inside restarts the step; leaving before impact completes it.
 for(let i=0;i<c.METEORITE_WARNING+2;i++)engine.tick(s);
 assert.equal(id(),'meteor');assert.ok(s.tutorial.retry);assert.ok(s.meteoriteWarning>=0);
 const other=[0,1,2,3].find(ch=>ch!==s.meteoriteWarning);setTile(c.TELEPORT_PADS[other][0],c.TELEPORT_PADS[other][1]);
 for(let i=0;i<c.METEORITE_WARNING+2;i++)engine.tick(s);advance();
 assert.equal(id(),'celestial');assert.equal(s.specialSkill,'fiery_king');
 assert.ok(engine.useSpecialSkill(s));engine.tick(s);advance();
 assert.equal(id(),'done');assert.ok(s.playerHP>=1&&s.rubyHP>=1);assert.equal(s.gamePhase,'playing');
});

test('Trial: only the guardian spawns, its skill recharges after each cast, and defeating it wins',()=>{
 const s=engine.createModeState('trial','storm_reaper');s.noMobs=true;s.godMode=true;s.meteoriteTimer=100000;s.ambientEvents.timer=100000;
 assert.equal(s.mode,'trial');assert.equal(s.bossesKilled,0);assert.equal(s.specialSkill,'storm_reaper');
 for(let i=0;i<c.TRIAL_BOSS_DELAY+c.BOSS_WARNING_TICKS+5&&!s.enemies.some(e=>c.isBossType(e.type));i++)engine.tick(s);
 const boss=s.enemies.find(e=>c.isBossType(e.type));assert.ok(boss,'guardian arrives');assert.equal(boss.type,'storm_reaper');
 assert.ok(engine.useSpecialSkill(s));assert.equal(s.specialSkill,null);
 engine.tick(s);assert.equal(s.trial.cooldown,c.TRIAL_SKILL_COOLDOWN-0);
 for(let i=0;i<c.TRIAL_SKILL_COOLDOWN;i++)engine.tick(s);
 assert.equal(s.specialSkill,'storm_reaper','skill returns after the cooldown');
 const guardian=s.enemies.find(e=>e.type==='storm_reaper');guardian.hp=0;engine.tick(s);
 assert.equal(s.gamePhase,'won');const t=s.gameTick;engine.tick(s);assert.equal(s.gameTick,t,'play stops after winning');
});

test('Trial: multi-body guardians win only when the whole encounter is defeated',()=>{
 const s=engine.createModeState('trial','astral_twins');s.noMobs=true;s.godMode=true;
 engine.godSpawnBoss(s,'astral_twins');const [a,b]=s.enemies.filter(e=>e.type==='astral_twins');
 a.hp=0;engine.tick(s);assert.equal(s.gamePhase,'playing','one twin down is not a win');
 b.hp=0;engine.tick(s);assert.equal(s.gamePhase,'won');
});
