import { ENEMY_CONFIGS, SUN, TILE_SIZE, T_FLOOR, MAP_COLS, MAP_ROWS, CHAMBER_LABELS, chamberOfTile } from './constants';
import { bfs, createEncounterEnemy, grantInstantSpeedBoost, damageEnemy, damagePlayer, damageRuby, godSpawnBoss, healCore, healPlayer, killEnemy, playAudioOneShot, playCelestialSound, type Enemy, type GameState } from './engine';
import { playUiSfx } from './ui-sfx';

export interface CoolingStation { id: number; x: number; y: number; charge: number; blocked: boolean }
export interface SunState {
  phase: 1 | 2 | 3; bossId: number; heat: number; rage: number;
  noWisps: boolean; // debug: independent from regular alien spawning
  stations: CoolingStation[]; charging: boolean; chargeSoundTimer: number; waveCooldown: number;
  quenchedTicks: number; empoweredCasts: number; eruptionTicks: number;
  wispTimer: number; bossWispTimer: number;
  ripples: { x: number; y: number; ticks: number; empowered: boolean }[];
  burning: { x: number; y: number; ticks: number }[]; // phase 2+: the King's burning trail
  trailPulse: number; kingTile: number; // ticks to the next burn check; the tile he last stood on
  flare: { room: number; ticks: number } | null; flareTimer: number; // phase 3: the marked room and its countdown
  flareFlash: { room: number; ticks: number; defused: boolean } | null; // visual: the flare going off, or defused
  sapperTimer: number; // phase 2+: ticks until the next Scorch Sapper
}

export function sunBoss(state: GameState) { return state.enemies.find(e => e.id === state.sun?.bossId && e.hp > 0); }
const distance = (x: number, y: number, e: Enemy) => Math.hypot(x - e.x / TILE_SIZE + .5, y - e.y / TILE_SIZE + .5);

function freeTile(state: GameState, exclude?: CoolingStation, room?: number): [number, number] | null {
  const options: [number, number][] = [];
  for (let y = 2; y < MAP_ROWS - 2; y++) for (let x = 2; x < MAP_COLS - 2; x++) {
    if (state.map[y]?.[x] !== T_FLOOR || chamberOfTile(x, y) < 0 ||
      (room !== undefined && chamberOfTile(x, y) !== room) ||
      Math.hypot(x - state.playerTileX, y - state.playerTileY) < 3 ||
      (x === state.rubyTileX && y === state.rubyTileY) ||
      state.sun?.stations.some(s => s !== exclude && Math.hypot(x - s.x, y - s.y) < 5) ||
      (exclude && Math.hypot(x - exclude.x, y - exclude.y) < 8) ||
      state.enemies.some(e => Math.hypot(x - e.x / TILE_SIZE + .5, y - e.y / TILE_SIZE + .5) < 2)) continue;
    options.push([x, y]);
  }
  return options.length ? options[Math.floor(Math.random() * options.length)] : null;
}

export function createSunState(state: GameState) {
  state.sun = { phase: 1, bossId: -1, heat: 50, rage: 0, noWisps: false, stations: [], charging: false, chargeSoundTimer: 0, waveCooldown: 0,
    quenchedTicks: 0, empoweredCasts: 0, eruptionTicks: 0, wispTimer: SUN.wispGap, bossWispTimer: SUN.bossWispGap, ripples: [], burning: [], trailPulse: SUN.trailGap, kingTile: -1,
    flare: null, flareTimer: SUN.flareGap[0], flareFlash: null, sapperTimer: SUN.sapperGap };
  for (let id = 0; id < SUN.stations; id++) {
    // Place one in each chamber before distributing the extra stations.
    const tile = freeTile(state, undefined, id < CHAMBER_LABELS.length ? id : undefined);
    if (tile) state.sun.stations.push({ id, x: tile[0], y: tile[1], charge: 0, blocked: false });
  }
  spawnSunWisps(state, SUN.initialWisps);
}

export function initializeSunBoss(state: GameState, boss: Enemy) {
  const sun = state.sun!; sun.bossId = boss.id; sun.phase = 1;
  sun.rage = 0; sun.quenchedTicks = 0; sun.empoweredCasts = 0;
  boss.hp = boss.maxHp = SUN.phaseHP * 3;
}

export function spawnSunWisps(state: GameState, count: number, near?: Enemy) {
  const sun = state.sun; if (!sun || sun.quenchedTicks > 0 || sun.noWisps) return;
  for (let i = 0; i < count && state.enemies.filter(e => e.type === 'cinder_wisp' && e.hp > 0).length < SUN.wispCap; i++) {
    let tile: [number, number] | null = null;
    if (near) {
      const options: [number, number][] = [];
      for (let y = near.tileY - 4; y <= near.tileY + 4; y++) for (let x = near.tileX - 4; x <= near.tileX + 4; x++) {
        if (state.map[y]?.[x] === T_FLOOR && Math.hypot(x - near.tileX, y - near.tileY) <= 4 &&
          !sun.stations.some(s => s.x === x && s.y === y) && !state.enemies.some(e => e.tileX === x && e.tileY === y) &&
          Math.hypot(x - state.playerTileX, y - state.playerTileY) >= 2 && !(x === state.rubyTileX && y === state.rubyTileY)) options.push([x, y]);
      }
      if (options.length) tile = options[Math.floor(Math.random() * options.length)];
    } else tile = freeTile(state);
    if (tile) state.enemies.push(createEncounterEnemy(state, 'cinder_wisp', tile[0], tile[1], SUN.wispHP));
  }
}

export function sunStationNearPlayer(state: GameState) {
  return state.sun?.stations.filter(s => Math.hypot(s.x - state.playerX / TILE_SIZE + .5, s.y - state.playerY / TILE_SIZE + .5) <= SUN.stationReach)
    .sort((a, b) => Math.hypot(a.x - state.playerTileX, a.y - state.playerTileY) - Math.hypot(b.x - state.playerTileX, b.y - state.playerTileY))[0];
}

function quenchBoss(state: GameState) {
  const sun = state.sun!, boss = sunBoss(state); if (!boss || sun.quenchedTicks > 0) return;
  sun.heat = 0; sun.quenchedTicks = SUN.quenchTicks; sun.empoweredCasts = 5; sun.waveCooldown = 0; sun.rage = 0; sun.burning = []; // his trail goes out with him
  sun.flare = null; sun.flareTimer = nextFlareGap(); // and no flare is pending while he is out
  boss.king = { untouchedTicks: 0, arenaWindupTicks: 0 }; boss.path = []; boss.pushTiles = 0;
  boss.shootTicks = 0; state.kingArenaPulseTicks = 0;
  state.laserBeams = state.laserBeams.filter(beam => beam.color !== '#cc0022');
  boss.tileX = boss.targetTileX = Math.round(boss.x / TILE_SIZE - .5);
  boss.tileY = boss.targetTileY = Math.round(boss.y / TILE_SIZE - .5);
  boss.x = (boss.tileX + .5) * TILE_SIZE; boss.y = (boss.tileY + .5) * TILE_SIZE; boss.stepProgress = 0;
  state.bossSpawnName = 'EXTINGUISHED · C ×5'; state.bossSpawnTicks = 180;
  grantInstantSpeedBoost(state); // a free speed burst to close in for the five waves
  const shaking = state.screenShakeTicks > 0;
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 12);
  state.screenShakeAmt = Math.max(shaking ? state.screenShakeAmt : 0, 6);
  playUiSfx('sunExtinguish');
  playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', .9);
  playAudioOneShot('/sounds/frost-shield-break.mp3', .8);
  playCelestialSound('sea_chanter', 1.2);
}

export function coolSun(state: GameState, amount: number) {
  const sun = state.sun; if (!sun || sun.quenchedTicks > 0) return;
  sun.heat = Math.max(0, sun.heat - amount);
  if (sun.heat === 0) quenchBoss(state);
}

function ripple(state: GameState, x: number, y: number, empowered: boolean) {
  const sun = state.sun!;
  sun.ripples.push({ x: (x + .5) * TILE_SIZE, y: (y + .5) * TILE_SIZE, ticks: 36, empowered });
  sun.burning = sun.burning.filter(b => Math.hypot(b.x - x, b.y - y) > SUN.waveRadius); // water puts out burning tiles
  if (sun.flare && chamberOfTile(Math.round(x), Math.round(y)) === sun.flare.room) defuseSunFlare(state); // water in a marked room defuses it
  for (const enemy of [...state.enemies]) {
    if (enemy.hp <= 0 || distance(x, y, enemy) > SUN.waveRadius) continue;
    if (enemy.type === 'cinder_wisp' || enemy.type === 'scorch_sapper') enemy.hp = 0; // water snuffs out wisps and sappers
    else {
      if (enemy.type === 'emberling') {
        enemy.extinguished = true; enemy.path = []; enemy.pushTiles = 0;
        enemy.tileX = enemy.targetTileX = Math.round(enemy.x / TILE_SIZE - .5);
        enemy.tileY = enemy.targetTileY = Math.round(enemy.y / TILE_SIZE - .5);
        enemy.x = (enemy.tileX + .5) * TILE_SIZE; enemy.y = (enemy.tileY + .5) * TILE_SIZE; enemy.stepProgress = 0;
      }
      const dmg = enemy.id === sun.bossId
        ? (empowered ? SUN.phaseHP * SUN.empoweredDamage : SUN.waveDamage)
        : (empowered ? SUN.empoweredNormalDamage : SUN.waveDamage);
      damageEnemy(state, enemy, dmg, 'special');
    }
  }
  // Resolve casualties from a snapshot: boss cleanup may remove other targets.
  for (const enemy of [...state.enemies]) { const i = state.enemies.indexOf(enemy); if (i >= 0 && enemy.hp <= 0) killEnemy(state, i); }
  const boss = sunBoss(state);
  if (boss && distance(x, y, boss) <= SUN.waveRadius) sun.rage = Math.max(0, sun.rage - SUN.rageCooling);
}

function completeStation(state: GameState, station: CoolingStation) {
  healPlayer(state, SUN.stationHealing);
  healCore(state, SUN.stationHealing);
  ripple(state, station.x, station.y, false);
  coolSun(state, SUN.stationCooling);
  station.charge = 0;
  const room = chamberOfTile(station.x, station.y);
  const lastInRoom = !state.sun!.stations.some(s => s !== station && chamberOfTile(s.x, s.y) === room);
  const tile = freeTile(state, station, lastInRoom ? room : undefined);
  if (tile) { station.x = tile[0]; station.y = tile[1]; }
  playCelestialSound('sea_chanter');
}

export function useCoolingWave(state: GameState): boolean {
  const sun = state.sun; if (!sun || state.gamePhase !== 'playing' || sun.waveCooldown > 0) return false;
  const empowered = sun.quenchedTicks > 0 && sun.empoweredCasts > 0;
  if (sun.quenchedTicks > 0 && !empowered) return false;
  // Consume before resolving kills; the fifth wave retains its empowered damage.
  if (empowered) {
    sun.empoweredCasts--;
    if (sun.empoweredCasts === 0) sun.quenchedTicks = Math.min(sun.quenchedTicks, SUN.quenchDelayTicks);
  }
  sun.waveCooldown = empowered ? SUN.rapidCooldown : SUN.waveCooldown;
  if (empowered) {
    const shaking = state.screenShakeTicks > 0;
    state.screenShakeTicks = Math.max(state.screenShakeTicks, 18);
    state.screenShakeAmt = Math.max(shaking ? state.screenShakeAmt : 0, 10);
    playUiSfx('coolingUltimate');
    playCelestialSound('sea_chanter', 1.25);
    playCelestialSound('neptune_electric', .9);
  }
  const stations = sun.stations.filter(s => Math.hypot(s.x - state.playerX / TILE_SIZE + .5, s.y - state.playerY / TILE_SIZE + .5) <= SUN.waveRadius);
  ripple(state, state.playerX / TILE_SIZE - .5, state.playerY / TILE_SIZE - .5, empowered);
  if (state.gamePhase !== 'playing') return true;
  coolSun(state, SUN.waveCooling);
  const boss = sunBoss(state);
  for (const station of stations) {
    station.blocked = !!boss && sun.quenchedTicks === 0 && distance(station.x, station.y, boss) <= SUN.stationBossReach;
    if (station.blocked) { station.charge = 0; continue; }
    station.charge = Math.min(100, station.charge + SUN.waveStationCharge);
    if (station.charge >= 100) completeStation(state, station);
  }
  if (!empowered) playCelestialSound('sea_chanter');
  return true;
}

export function clearSunEncounter(state: GameState) {
  if (!state.sun) return;
  state.sun.charging = false; state.sun.ripples = []; state.sun.burning = []; state.sun.flare = null; state.sun.flareFlash = null; state.sun.quenchedTicks = 0; state.sun.empoweredCasts = 0; state.sun.eruptionTicks = 0;
  state.enemies = state.enemies.filter(e => e.type !== 'cinder_wisp');
}

export function updateSun(state: GameState) {
  const sun = state.sun; if (!sun || state.gamePhase !== 'playing') return;
  state.ambientEvents.timer = Math.max(state.ambientEvents.timer, 3600);
  sun.ripples = sun.ripples.filter(r => --r.ticks > 0);
  if (sun.eruptionTicks > 0) sun.eruptionTicks--;
  if (sun.waveCooldown > 0 && --sun.waveCooldown === 0 && !sun.quenchedTicks) playUiSfx('waveReady'); // ready again (silent during the extinguished window's rapid casts)
  const boss = sunBoss(state);
  if (boss) {
    const phase = Math.min(3, 3 - Math.ceil(boss.hp / SUN.phaseHP) + 1) as 1 | 2 | 3;
    if (phase > sun.phase) { sun.phase = phase; state.bossSpawnName = `PHASE ${phase}`; state.bossSpawnTicks = 120; }
  }
  if (sun.quenchedTicks > 0) {
    if (--sun.quenchedTicks === 0) {
      // The window ends with C back as an ordinary wave after a short 1s cooldown (its ready chime plays then).
      sun.quenchedTicks = 0; sun.empoweredCasts = 0; sun.heat = 50; sun.waveCooldown = SUN.afterQuenchCooldown;
    }
    return;
  }
  if (!sun.noWisps && --sun.wispTimer <= 0) { spawnSunWisps(state, SUN.wispBatch); sun.wispTimer = SUN.wispGap; }
  updateBurningTrail(state, boss);
  updateSunFlare(state, boss);
  if (boss && sun.phase >= 2 && !state.noMobs && --sun.sapperTimer <= 0) { sun.sapperTimer = SUN.sapperGap; spawnScorchSapper(state); }
  if (boss) {
    sun.rage = Math.min(100, sun.rage + (sun.phase >= 2 ? SUN.lateRagePerSecond : SUN.ragePerSecond) / 60);
    if (!sun.noWisps && --sun.bossWispTimer <= 0) { spawnSunWisps(state, 1 + Math.floor(sun.rage / 25), boss); sun.bossWispTimer = SUN.bossWispGap; }
  }
  const station = sun.charging ? sunStationNearPlayer(state) : undefined;
  let filling = false;
  for (const s of sun.stations) {
    s.blocked = !!boss && distance(s.x, s.y, boss) <= SUN.stationBossReach;
    if (s.blocked) s.charge = 0;
    else if (station === s) {
      filling = true;
      if ((sun.chargeSoundTimer ?? 0) <= 0) {
        playUiSfx('stationCharge'); sun.chargeSoundTimer = 20;
        playAudioOneShot('/sounds/deghost.wav', .08); // quiet layer from Space-healing Ruby
        state.healJiggleTicks = 18; // reuse the player animation from manual Ruby healing
      }
      sun.chargeSoundTimer--;
      s.charge = Math.min(100, s.charge + 100 / SUN.stationChargeTicks);
      coolSun(state, SUN.stationTrickle / 60);
      if (s.charge >= 100 - 1e-6) completeStation(state, s);
    }
  }
  if (!filling) sun.chargeSoundTimer = 0;
  if (sun.quenchedTicks > 0) return;
  sun.heat = Math.min(100, sun.heat + state.enemies.filter(e => e.type === 'cinder_wisp' && e.hp > 0).length * SUN.heatPerWisp / 60);
  if (sun.heat >= 100) {
    sun.heat = 50; sun.eruptionTicks = 90;
    state.screenShakeTicks = 30; state.screenShakeAmt = 10;
    state.bossSpawnName = 'THERMAL ERUPTION'; state.bossSpawnTicks = 120;
    damagePlayer(state, SUN.eruptionDamage); damageRuby(state, SUN.eruptionDamage);
    for (const e of [...state.enemies]) {
      if (e.id === sun.bossId) continue;
      damageEnemy(state, e, SUN.eruptionDamage, 'meteor');
      const i = state.enemies.indexOf(e); if (i >= 0 && e.hp <= 0) killEnemy(state, i, true);
    }
    playCelestialSound('solar_swoosh');
  }
}

// Phase 2+: while his rage is high, each tile the King steps onto burns for a while. Every trailGap ticks, standing
// on a burning tile hurts you (and a placed Ruby on one) and adds a little heat.
function updateBurningTrail(state: GameState, boss: Enemy | undefined) {
  const sun = state.sun!;
  sun.burning = sun.burning.filter(b => --b.ticks > 0);
  if (boss && sun.phase >= 2 && sun.rage >= SUN.trailRage) {
    const tile = boss.tileY * MAP_COLS + boss.tileX;
    if (tile !== sun.kingTile && state.map[boss.tileY]?.[boss.tileX] === T_FLOOR) {
      for (let y = boss.tileY - SUN.trailRadius; y <= boss.tileY + SUN.trailRadius; y++) {
        for (let x = boss.tileX - SUN.trailRadius; x <= boss.tileX + SUN.trailRadius; x++) {
          if (state.map[y]?.[x] !== T_FLOOR) continue;
          const lit = sun.burning.find(b => b.x === x && b.y === y);
          if (lit) lit.ticks = SUN.trailTicks; else sun.burning.push({ x, y, ticks: SUN.trailTicks });
          if (sun.burning.length > SUN.trailCap) sun.burning.shift();
        }
      }
    }
    sun.kingTile = tile;
  } else sun.kingTile = -1;
  if (--sun.trailPulse > 0) return;
  sun.trailPulse = SUN.trailGap;
  const on = (x: number, y: number) => sun.burning.some(b => b.x === x && b.y === y);
  if (on(state.playerTileX, state.playerTileY)) { damagePlayer(state, SUN.trailDamage); sun.heat = Math.min(100, sun.heat + SUN.trailHeat); }
  if (state.rubyTileX !== -1 && on(state.rubyTileX, state.rubyTileY)) damageRuby(state, SUN.trailRubyDamage);
}

// Phase 2+: a Scorch Sapper appears on open floor away from you and the stations (at most sapperCap alive).
function spawnScorchSapper(state: GameState) {
  if (state.enemies.filter(e => e.type === 'scorch_sapper' && e.hp > 0).length >= SUN.sapperCap) return;
  const tile = freeTile(state);
  if (tile && Math.hypot(tile[0] - state.playerTileX, tile[1] - state.playerTileY) >= 6) state.enemies.push(createEncounterEnemy(state, 'scorch_sapper', tile[0], tile[1], SUN.sapperHP));
}

// It ignores you and Ruby: it walks to the nearest cooling station and, once beside it, drains its charge and heats the arena.
export function updateScorchSapper(state: GameState, e: Enemy) {
  const sun = state.sun; e.sapStation = undefined; if (!sun) return;
  const station = [...sun.stations].sort((a, b) => Math.hypot(a.x - e.tileX, a.y - e.tileY) - Math.hypot(b.x - e.tileX, b.y - e.tileY))[0];
  if (!station) return;
  const settled = e.tileX === e.targetTileX && e.tileY === e.targetTileY;
  if (settled && Math.max(Math.abs(e.tileX - station.x), Math.abs(e.tileY - station.y)) <= 1) {
    e.sapStation = station.id; e.path = []; e.chargeDirX = Math.sign(station.x - e.tileX) || 1; // nozzle faces the station (visual)
    station.charge = Math.max(0, station.charge - SUN.sapperDrain / 60);
    if (sun.quenchedTicks === 0) sun.heat = Math.min(100, sun.heat + SUN.sapperHeat / 60);
    return;
  }
  if (settled) {
    if (e.pathTimer-- <= 0 || !e.path.length) { e.path = bfs(state.map, e.tileX, e.tileY, station.x, station.y); e.pathTimer = 30; }
    const next = e.path.shift(); if (next) { [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0; }
    return;
  }
  e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + ENEMY_CONFIGS.scorch_sapper.speed);
  e.x = (e.tileX + .5) * TILE_SIZE + (e.targetTileX - e.tileX) * e.stepProgress;
  e.y = (e.tileY + .5) * TILE_SIZE + (e.targetTileY - e.tileY) * e.stepProgress;
  if (e.stepProgress >= TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
}

const nextFlareGap = () => SUN.flareGap[0] + Math.floor(Math.random() * (SUN.flareGap[1] - SUN.flareGap[0] + 1));

// Phase 3: a room glows gold, then flares and heats the arena, unless water lands there or Solar Flare is cast first.
function updateSunFlare(state: GameState, boss: Enemy | undefined) {
  const sun = state.sun!;
  if (sun.flareFlash && --sun.flareFlash.ticks <= 0) sun.flareFlash = null;
  if (!boss || sun.phase < 3) return;
  if (!sun.flare) {
    if (--sun.flareTimer > 0) return;
    const room = Math.floor(Math.random() * 4);
    sun.flare = { room, ticks: SUN.flareWarning };
    state.bossSpawnName = 'SUNBURST: ' + CHAMBER_LABELS[room]; state.bossSpawnTicks = 120;
    playUiSfx('sunburstWarning'); // global cue: never gated by the player's room or camera
    playAudioOneShot('/sounds/kingFireSpell.mp3', .7);
    return;
  }
  if (--sun.flare.ticks > 0) return;
  sun.heat = Math.min(100, sun.heat + SUN.flareHeat); // the eruption check below handles a full arena
  // It also burns you and a placed Ruby if you are inside that room.
  if (chamberOfTile(state.playerTileX, state.playerTileY) === sun.flare.room) damagePlayer(state, SUN.flareDamage);
  if (state.rubyTileX !== -1 && chamberOfTile(state.rubyTileX, state.rubyTileY) === sun.flare.room) damageRuby(state, SUN.flareDamage);
  sun.flareFlash = { room: sun.flare.room, ticks: 45, defused: false };
  sun.flare = null; sun.flareTimer = nextFlareGap();
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 14); state.screenShakeAmt = Math.max(state.screenShakeAmt, 6);
  playCelestialSound('fiery_king', .8);
  playAudioOneShot('/sounds/kingFireSpell.mp3', .7); // the King's fire spell under the flare
}

// Water in the marked room, a station burst there, or Solar Flare stops the flare and cools the arena a little.
export function defuseSunFlare(state: GameState) {
  const sun = state.sun; if (!sun?.flare) return;
  sun.flareFlash = { room: sun.flare.room, ticks: 45, defused: true };
  sun.flare = null; sun.flareTimer = nextFlareGap();
  coolSun(state, SUN.flareDefuseCool);
  playUiSfx('confirm');
}

export function godSetSunPhase(state: GameState, phase: 1 | 2 | 3) {
  if (!state.sun || state.gamePhase !== 'playing') return;
  if (!sunBoss(state)) godSpawnBoss(state, 'fiery_king');
  const boss = sunBoss(state); if (!boss) return;
  boss.hp = (4 - phase) * SUN.phaseHP; state.sun.phase = phase;
  if (phase < 2) state.sun.burning = [];
  if (phase < 3) state.sun.flare = null;
  state.sun.flareTimer = nextFlareGap();
  state.bossSpawnName = `PHASE ${phase}`; state.bossSpawnTicks = 120;
}

export function godSetSunHeat(state: GameState, heat: 0 | 100) {
  if (!state.sun || state.gamePhase !== 'playing') return;
  // Zero Heat is a direct way to test the King's extinguished window, even before arrival.
  if (heat === 0 && !sunBoss(state)) godSpawnBoss(state, 'fiery_king');
  state.sun.quenchedTicks = 0; state.sun.empoweredCasts = 0;
  if (heat === 0) coolSun(state, 100);
  else state.sun.heat = 100; // the next simulation tick resolves the eruption normally
}

export function godSetNoWisps(state: GameState, enabled: boolean) {
  if (!state.sun) return;
  state.sun.noWisps = enabled;
  state.sun.wispTimer = SUN.wispGap; state.sun.bossWispTimer = SUN.bossWispGap;
  if (enabled) state.enemies = state.enemies.filter(e => e.type !== 'cinder_wisp');
}

export function godAdjustSunHeat(state: GameState, delta: -10 | 10) {
  const sun = state.sun; if (!sun || state.gamePhase !== 'playing') return;
  const heat = Math.max(0, Math.min(100, sun.heat + delta));
  if (heat === 0 || heat === 100) { godSetSunHeat(state, heat); return; }
  if (sun.quenchedTicks > 0) {
    sun.quenchedTicks = 0; sun.empoweredCasts = 0; sun.waveCooldown = SUN.waveCooldown;
  }
  sun.heat = heat;
}
