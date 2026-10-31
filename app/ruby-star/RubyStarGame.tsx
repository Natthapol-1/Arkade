'use client';

import { stopAmbientEventSounds, pauseAmbientEventSounds } from './event-audio';
import { useEffect, useRef, useState, useCallback } from 'react';
import { drawEncounterEnemy, drawEncounterTelegraphs, drawEncounterEffects } from './encounter-art';
import { drawNeptuneUnit, drawNeptuneOverlay, drawNeptuneRock, drawSkyLaserImpact, drawWaterBurst } from './neptune-art';
import { drawGaiaUnit, drawGaiaGround, drawGaiaOverlay, drawForestBackdrop, drawForestAmbience, drawGaiaStone, GAIA_CHAMBER_COLORS } from './gaia-art';
import { drawMoonBackdrop, drawMoonAmbience, drawMoonCrystalBlock, drawMoonReflection, drawMoonEffects, drawMoonUnit, isMoonMap, MOON_CHAMBER_COLORS } from './moon-art';
import { SUN } from './constants';
import { godAdjustSunHeat, godSetNoWisps, godSetSunHeat, godSetSunPhase, sunStationNearPlayer, useCoolingWave } from './sun';
import { drawSunburstEmblem, drawQuenchedKing, drawSunUnit, drawSunBackdrop, drawSunFloorTile, drawSunCover, drawSunPad, drawSunGround, drawSunEffects, drawSunAtmosphere, SUN_CHAMBER_COLORS } from './sun-art';
import SunGuide from './SunGuide';
import CoolingWaveStatus from './CoolingWaveStatus';
import { godSetMoonPhase, isMoonBoss, isMoonRevealed, moonHiddenInDark, moonWearsGuise, useMoonMark } from './moon';
import BackButton from '@/components/BackButton';
import { useRouter } from 'next/navigation';
import PixelArrow from '@/components/PixelArrow';
import RulesModal from '@/components/RulesModal';
import RubyStarGuide, { bosses as BOSS_GUIDE } from './RubyStarGuide';
import NeptuneGuide from './NeptuneGuide';
import GaiaGuide from './GaiaGuide';
import MoonGuide from './MoonGuide';
import VictoryScreen from './VictoryScreen';
import { playUiSfx } from './ui-sfx';
import { findTrial, TrialBody } from './trials';
import ConstellationChoice from './ConstellationChoice';
import ConstellationAfterglow from './ConstellationAfterglow';
import BombStatus from './BombStatus';
import CelestialStatus from './CelestialStatus';
import MoonMarkStatus from './MoonMarkStatus';
import HudIcon from './HudIcon';
import BGMController, { BGMControllerHandle } from '@/components/BGMController';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  SPECIAL_SKILLS, SPECIAL_UNLOCK_KILLS, SPECIAL_REAPER_RADIUS, SPECIAL_CHANTER_RADIUS, SPECIAL_WEAVER_RADIUS, SPECIAL_SINGULARITY_RADIUS,
  T_WALL, T_TELEPORT,
  CHAMBER_BOUNDS, CHAMBER_LABELS, CHAMBER_COLORS, HALLWAY_BOUNDS, DEVOURER_SELF_SPLIT_TICKS, DEVOURER_SELF_SPLIT_WARNING, TUTORIAL_STEPS, trialSkillCooldown,
  NEPTUNE_PHASE_HPS, neptunePhaseFloorHP, NEPTUNE_DIVE_POINTS, NEPTUNE_HEAL_CHARGE_MAX, GAIA_PHASE_HP, GAIA_SUN_MAX, GAIA_SUN_MIN, MOON_MARK_COOLDOWN, MOON_PHASE_HP,
  chamberOfTile,
  ENEMY_CONFIGS, isBossType, BOSS_TYPES, BOSS_NAMES, BossType, BOSS_SKILL_REWARDS, SpecialSkill,
  PLAYER_MAX_HP, RUBY_MAX_HP,
  LASER_COOLDOWN,
  STAR_ENERGY_MAX,
  METEORITE_WARNING, METEORITE_CYCLE, BULLET_COOLDOWN, BULLET_SPEED,
  HEALER_HEAL_INTERVAL, QUEEN_WINDUP_TICKS, QUEEN_PHASE_TELEGRAPH, CHARGER_WINDUP_TICKS, CHARGER_CHARGE_TILES,
  PRAYER_RUBY_WINDUP, PRAYER_ESCAPE_WINDUP, SEA_SONG_WINDUP, SEA_SONG_BLAST_RADIUS, SEA_SONG_BLAST_TICKS, SEA_ALLY_HEAL_RADIUS,
  KING_ARENA_WINDUP, KING_ARENA_FX_TICKS,
  THORN_WINDUP, THORN_RADIUS, THORN_LIFETIME, getThornFieldBounds,
} from './constants';
import {
  GameState, RubyStarMode, createModeState, tick, CONSTELLATIONS, chooseConstellation, openGodConstellations, closeGodConstellations, getBombRadius,
  AMBIENT_EVENTS, STAR_FALL_TICKS, SUPERNOVA_CHARGE_TICKS, SUPERNOVA_BLAST_TICKS, triggerAmbientEvent, AmbientEventKind,
  useLaser, useBullet, activateWave, useSpeedBoost, useBomb, useSpecialSkill, godSpawnBoss, createInitialState, godSetNoMobs, godSetNoBossSpawns, godAdvanceStage,
  chooseStartingSkill, chooseSkyLaser, cancelSkyLaser, toggleCarryRuby, tryActivateTeleport, isNearTeleportPad, doTeleport, cancelTeleport,
  healRuby, isPlayerChilled, isMovementReversed, isSeaChanterDiving, isEnemyVisibleOnMinimap, startChargeSound, stopChargeSound, stopPoisonSound, stopSingularitySound, stopGaiaFieldSound,
  METEOR_CLOCKWISE_ORDER, getMirrorTwinTile, devourerBodyScale,
} from './engine';
import { godSetNeptunePhase, openSkyLaser, canOpenSkyLaser } from './neptune';
import { godSetGaiaPhase, useSunfire, playStrikeCharged } from './gaia';

// ─── Canvas colors ────────────────────────────────────────────────────────────
const BG_COLOR = '#000010';
const RUBY_COLOR = '#ff1155';
const BOMB_COLOR = '#ff6600';
const COOLDOWN_GRAY = '#5a5a66'; // mobile ability buttons dim to this while their ability is on cooldown

// ─── Drawing ──────────────────────────────────────────────────────────────────

function drawStellarStar(ctx: CanvasRenderingContext2D, x: number, y: number, pixel: number, color: string) {
  x = Math.round(x); y = Math.round(y); const p = Math.max(1, Math.round(pixel));
  ctx.fillStyle = color;
  ctx.fillRect(x - 5 * p, y - p, 10 * p, 2 * p);
  ctx.fillRect(x - 3 * p, y - 2 * p, 6 * p, 4 * p);
  ctx.fillRect(x - 2 * p, y - 3 * p, 4 * p, 6 * p);
  ctx.fillRect(x - p, y - 5 * p, 2 * p, 10 * p);
}

function drawAmbientMinimap(ctx: CanvasRenderingContext2D, state: GameState, mx: number, my: number, scale: number) {
  const event = state.ambientEvents.warning || state.ambientEvents.active;
  if (!event) return;
  ctx.save(); ctx.strokeStyle = AMBIENT_EVENTS[event.kind].color; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2;
  for (const point of event.points) {
    const x = mx + (point.x + .5) * scale, y = my + (point.y + .5) * scale;
    if (event.kind === 'supernova') {
      const px=Math.round(x),py=Math.round(y);
      ctx.shadowColor='#ff956f';ctx.shadowBlur=5;ctx.fillStyle='#ffaf7a';
      ctx.fillRect(px-4,py-3,8,6);ctx.fillRect(px-3,py-4,6,8);ctx.shadowBlur=0;
      ctx.fillStyle='#66283e';ctx.fillRect(px-2,py-2,4,4);ctx.fillStyle='#fff3cf';ctx.fillRect(px-1,py-1,2,2);
      ctx.fillStyle='#ffca94';ctx.fillRect(px-1,py-7,2,2);ctx.fillRect(px-1,py+5,2,2);ctx.fillRect(px-7,py-1,2,2);ctx.fillRect(px+5,py-1,2,2);continue;
    }
    if (event.kind === 'shootingStar') {
      ctx.shadowColor = '#ffc95c'; ctx.shadowBlur = 3;
      drawStellarStar(ctx, x, y, 1, '#ffe49b');
      ctx.shadowBlur = 0; continue;
    }
    ctx.strokeRect(Math.round(x - 4), Math.round(y - 4), 8, 8);
    if (event.kind === 'blackhole') { ctx.fillStyle = '#070411'; ctx.fillRect(x - 2, y - 2, 4, 4); }
  }
  ctx.restore();
}

function drawEventSquare(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, step: number, color: string) {
  const half = Math.floor(size / 2), p = step;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - half + p * 2, y - half); ctx.lineTo(x + half - p * 2, y - half);
  ctx.lineTo(x + half - p * 2, y - half + p); ctx.lineTo(x + half - p, y - half + p);
  ctx.lineTo(x + half - p, y - half + p * 2); ctx.lineTo(x + half, y - half + p * 2);
  ctx.lineTo(x + half, y + half - p * 2); ctx.lineTo(x + half - p, y + half - p * 2);
  ctx.lineTo(x + half - p, y + half - p); ctx.lineTo(x + half - p * 2, y + half - p);
  ctx.lineTo(x + half - p * 2, y + half); ctx.lineTo(x - half + p * 2, y + half);
  ctx.lineTo(x - half + p * 2, y + half - p); ctx.lineTo(x - half + p, y + half - p);
  ctx.lineTo(x - half + p, y + half - p * 2); ctx.lineTo(x - half, y + half - p * 2);
  ctx.lineTo(x - half, y - half + p * 2); ctx.lineTo(x - half + p, y - half + p * 2);
  ctx.lineTo(x - half + p, y - half + p); ctx.lineTo(x - half + p * 2, y - half + p);
  ctx.closePath(); ctx.fill();
}

function drawSupernovaCore(ctx: CanvasRenderingContext2D, x: number, y: number, half: number, age: number) {
  const h = Math.max(6, Math.round(half / 2) * 2), notch = Math.max(2, Math.round(h / 6));
  ctx.shadowColor = '#ff885b'; ctx.shadowBlur = 18;
  drawEventSquare(ctx, x, y, h * 2, notch, '#ffad72');ctx.shadowBlur = 0;
  drawEventSquare(ctx, x, y, h * 1.65, notch, '#8e3545');
  drawEventSquare(ctx, x, y, h * 1.3, Math.max(2, notch - 1), '#321c36');
  // Detached, asymmetric stellar prominences surround a dark fusion chamber.
  for (let side = 0; side < 4; side++) {
    ctx.save();ctx.translate(x,y);ctx.rotate(side*Math.PI/2);
    const reach = Math.round((.28 + .12 * Math.sin(age * .065 + side * 1.7)) * h / 2) * 2;
    ctx.fillStyle = side % 2 ? '#ffd79a' : '#ff805f';ctx.fillRect(-h*.25,-h-reach,h*.5,reach);
    ctx.fillStyle = '#ffedc2';ctx.fillRect(-h*.12,-h-reach-6,h*.24,4);ctx.restore();
  }
  ctx.shadowColor='#fff0bd';ctx.shadowBlur=9;ctx.fillStyle='#ffd38d';ctx.fillRect(x-h*.35,y-h*.35,h*.7,h*.7);
  ctx.shadowBlur=0;ctx.fillStyle='#fff9e1';ctx.fillRect(x-h*.17,y-h*.17,h*.34,h*.34);
}

function drawSupernovaBirth(ctx: CanvasRenderingContext2D, x: number, y: number, age: number, warning: boolean) {
  const snap = (v: number) => Math.round(v / 4) * 4;
  ctx.save();
  if (warning) {
    const t = Math.min(1,age/180);
    // Eight broken stellar currents bend inward along snapped, angular paths.
    for (let lane=0;lane<8;lane++) for(let chip=0;chip<8;chip++) {
      const life=((age*(1+t*1.4)+lane*19+chip*24)%190)/190;
      const angle=lane*Math.PI/4+(1-life)*.5, radius=24+(1-life)**1.6*(180+t*110);
      const px=x+snap(Math.cos(angle)*radius),py=y+snap(Math.sin(angle)*radius);
      ctx.globalAlpha=(.2+t*.65)*Math.sin(life*Math.PI);ctx.fillStyle=chip%3?'#a6d8ff':'#ffc68d';
      ctx.fillRect(px,py,chip%2?8:16,chip%2?16:8);
      if(chip%3===0){ctx.globalAlpha*=.35;ctx.fillRect(px-8,py-8,24,24);}
    }
    for(let frame=0;frame<3;frame++) {
      const life=((age+frame*50)%150)/150, half=snap(30+(1-life)**2*180);
      ctx.globalAlpha=.28*life;drawEventSquare(ctx,x,y,half*2,Math.max(4,snap(half*.15)),'#29405c');
      ctx.globalAlpha=.45*life;ctx.strokeStyle=frame%2?'#ffb789':'#a6d8ff';ctx.lineWidth=3;ctx.stroke();
    }
    ctx.globalAlpha=1;drawSupernovaCore(ctx,x,y,8+t*t*20,age);
    // A narrow fusion seam brightens once as the seed finishes forming.
    ctx.globalAlpha=t**4*.65;ctx.fillStyle='#fff2c9';ctx.fillRect(x-2,y-snap(70+t*60),4,snap(140+t*120));
  } else {
    const t=Math.min(1,age/72),fade=(1-t)**1.5;
    for(let front=0;front<3;front++) {
      const travel=Math.max(0,t-front*.12),half=snap(35+Math.sqrt(travel)*(front?150:240));
      ctx.globalAlpha=0;drawEventSquare(ctx,x,y,half*2,Math.max(4,snap(half*.16)),'#ffc68d');
      ctx.globalAlpha=fade*(front?.45:.8);ctx.strokeStyle=front%2?'#a6e2ff':'#ffd7a2';ctx.lineWidth=front?4:8;ctx.stroke();
    }
    for(let i=0;i<24;i++) {
      const angle=i*Math.PI/12,d=snap(44+Math.sqrt(t)*(90+i%4*42));
      ctx.globalAlpha=fade;drawEnergyPixelRay(ctx,x+snap(Math.cos(angle)*d),y+snap(Math.sin(angle)*d),Math.round(Math.cos(angle)),Math.round(Math.sin(angle)),i%3?'#ffbe84':'#dcf3ff',2);
    }
    ctx.globalAlpha=fade*.7;ctx.fillStyle='#fff1cb';ctx.fillRect(x-3,y-snap(230*fade),6,snap(460*fade));
    ctx.fillRect(x-snap(230*fade),y-3,snap(460*fade),6);
  }
  ctx.restore();
}

function drawSupernova(ctx: CanvasRenderingContext2D, state: GameState, x: number, y: number) {
  const event = state.ambientEvents.active!;
  const snap = (v: number) => Math.round(v / 4) * 4;
  const age = event.age;
  if (event.blastTicks !== undefined) {
    const t = (SUPERNOVA_BLAST_TICKS - event.blastTicks) / SUPERNOVA_BLAST_TICKS;
    // Broad stepped fronts cross the entire station, with a hot stellar core.
    for (let front = 0; front < 4; front++) {
      const travel = Math.max(0, t - front * .045), radius = snap(28 + Math.sqrt(travel) * TILE_SIZE * 72);
      ctx.globalAlpha = 0;
      drawEventSquare(ctx, x, y, radius * 2, Math.max(8, snap(radius * .12)), '#ffdbab');
      ctx.globalAlpha = (1 - t) * (front ? .4 : .85);
      ctx.strokeStyle = front % 2 ? '#ffa180' : '#fff3cf'; ctx.lineWidth = front ? 8 : 16;ctx.stroke();
    }
    for (let i = 0; i < 48; i++) {
      const angle = i * Math.PI / 24, distance = snap(30 + Math.sqrt(t) * (260 + i % 7 * 150));
      ctx.globalAlpha = (1 - t) ** 1.5; ctx.fillStyle = i % 3 ? '#ffb27b' : '#fff3cd';
      ctx.fillRect(x + snap(Math.cos(angle) * distance), y + snap(Math.sin(angle) * distance), i % 2 ? 8 : 16, i % 2 ? 16 : 8);
    }
    const core = snap(140 * (1 - t) ** 2);
    ctx.globalAlpha = (1 - t) ** 2; ctx.shadowColor = '#ff9f6e'; ctx.shadowBlur = 24;
    if (core > 8) { drawEventSquare(ctx, x, y, core * 2, 12, '#ff976e'); drawEventSquare(ctx, x, y, core, 8, '#fff2ce'); }
  } else {
    const charging = event.chargeTicks !== undefined;
    if (!charging && age < 72) drawSupernovaBirth(ctx,x,y,age,false);
    const compression = charging ? 1 - event.chargeTicks! / SUPERNOVA_CHARGE_TICKS : 0;
    const pixel = Math.max(2, Math.round(11 - compression * 9));
    for (let i = 0; i < 16; i++) {
      const dx = Math.round(Math.cos(i * Math.PI / 8)), dy = Math.round(Math.sin(i * Math.PI / 8));
      const life = ((age * (charging ? 3 : 1) + i * 13) % 90) / 90;
      const distance = snap(pixel * 5 + (charging ? 1 - life : life) * (charging ? 140 : 50));
      ctx.globalAlpha = .7 * (charging ? life : 1 - life);
      drawEnergyPixelRay(ctx, x + dx * distance, y + dy * distance, dx, dy, i % 2 ? '#a4e7ff' : '#ffb67e', charging ? 1.8 : 1.2);
    }
    ctx.globalAlpha = 1;
    const ignition = !charging && age < 72 ? Math.sin(age / 72 * Math.PI) * 12 : 0;
    drawSupernovaCore(ctx,x,y,pixel*4+ignition,age);
    if (charging) {
      // A single contracting frame reinforces compression without strobing.
      const half = snap(70 - compression * 48);
      ctx.globalAlpha = .4 + compression * .5;ctx.strokeStyle = '#bbebff';ctx.lineWidth = 4;ctx.strokeRect(x-half,y-half,half*2,half*2);
    }
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function drawSupernovaSky(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number) {
  const event = state.ambientEvents.active;
  if (event?.kind !== 'supernova') return;
  if (event.blastTicks === undefined) {
    if(event.chargeTicks === undefined && event.age < 48){ctx.save();ctx.globalAlpha=.13*(1-event.age/48)**2;ctx.fillStyle='#ffdbac';ctx.fillRect(0,0,width,height);ctx.restore();}
    return;
  }
  const age = SUPERNOVA_BLAST_TICKS - event.blastTicks, fade = event.blastTicks / SUPERNOVA_BLAST_TICKS;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - age / 20) * .62 + fade * .10;
  ctx.fillStyle = age < 12 ? '#fff3d5' : '#e97265';ctx.fillRect(0,0,width,height);
  // Far chambers still see the stellar release as long rushing light fragments.
  for (let i = 0; i < 56; i++) {
    const x = Math.round(((i * 137 + age * (i % 2 ? 10 : -10)) % (width + 160) + width + 160) % (width + 160) - 80);
    const y = Math.round((i * 239 % 991) / 991 * height);
    ctx.globalAlpha = fade * fade * (i % 3 ? .4 : .7);ctx.fillStyle = i % 3 ? '#ffc396' : '#fff4cf';
    ctx.fillRect(x,y,24 + i % 4 * 12,3 + i % 2 * 3);
  }
  ctx.globalAlpha = fade * .65;ctx.strokeStyle = '#ffbc91';ctx.lineWidth = 4;ctx.strokeRect(3,3,width-6,height-6);ctx.restore();
}

function drawBlackholeSky(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number, sourceX: number, sourceY: number) {
  const event=state.ambientEvents.active;if(event?.kind!=='blackhole')return;
  const age=event.age,ending=1-Math.min(1,event.ticks/36),entry=Math.max(0,1-age/45);
  const fade=Math.min(1,event.ticks/16),pull=Math.max(0,1-((age+44)%45)/24);
  const x=Math.max(-width,Math.min(width*2,sourceX)),y=Math.max(-height,Math.min(height*2,sourceY));
  ctx.save();
  ctx.globalAlpha=fade*(.055+entry*.12+ending*.08);ctx.fillStyle='#583b88';ctx.fillRect(0,0,width,height);
  // Converging streaks are visible from every chamber, pointing at the actual well.
  for(let i=0;i<44;i++){
    const side=i%4,along=(i*137%997)/997;
    const sx=side===0?-48:side===1?width+48:along*width,sy=side===2?-48:side===3?height+48:along*height;
    const life=((age*(1+ending*2)+i*17)%115)/115,travel=life*life;
    const px=Math.round(sx+(x-sx)*travel),py=Math.round(sy+(y-sy)*travel);
    const dx=Math.sign(x-sx),dy=Math.sign(y-sy);
    ctx.globalAlpha=fade*(.15+pull*.25+entry*.3)*Math.sin(life*Math.PI);
    drawEnergyPixelRay(ctx,px,py,dx,dy,i%4?'#bd91ed':'#e5d9ff',1+life);
  }
  // The field edge strains inward with each gravity pulse.
  for(let band=0;band<3;band++){
    const inset=4+band*7+Math.round(pull*5);ctx.globalAlpha=fade*(.11+pull*.19)*(1-band*.22);ctx.strokeStyle=band%2?'#89a6ef':'#d3abff';ctx.lineWidth=band?2:4;
    ctx.strokeRect(inset,inset,width-inset*2,height-inset*2);
  }
  ctx.restore();
}

function drawBlackholeWarning(ctx: CanvasRenderingContext2D, x: number, y: number, age: number) {
  const t=Math.min(1,age/180),snap=(v:number)=>Math.round(v/4)*4;
  ctx.save();
  // Space tears into four right-angle gravity lanes around a widening dark aperture.
  for(let side=0;side<4;side++) {
    ctx.save();ctx.translate(x,y);ctx.rotate(side*Math.PI/2);
    for(let band=0;band<3;band++) {
      const life=((age*(1+t)+band*57+side*19)%170)/170,r=snap(135+(1-life)*220);
      ctx.globalAlpha=(.25+t*.5)*life;ctx.strokeStyle=band%2?'#b98aff':'#e8cbff';ctx.lineWidth=band?3:5;
      ctx.beginPath();ctx.moveTo(-r,-r*.35);ctx.lineTo(-r,-r);ctx.lineTo(-r*.3,-r);ctx.lineTo(-r*.3,-r+20);ctx.lineTo(r*.2,-r+20);ctx.stroke();
    }
    for(let chip=0;chip<14;chip++) {
      const life=((age*(1+t)+chip*17+side*11)%180)/180,r=snap(110+(1-life)**2*320),offset=snap(Math.sin(chip*2.4+life*2)*r*.55);
      ctx.globalAlpha=Math.sin(life*Math.PI)*(.3+t*.6);ctx.fillStyle=chip%4?'#9e6de0':'#eedbff';
      ctx.fillRect(-r,offset,8+snap(life*24),chip%3?4:8);
    }
    ctx.restore();
  }
  const half=snap(14+112*t*t);
  ctx.globalAlpha=.4+t*.6;ctx.shadowColor='#a96aff';ctx.shadowBlur=18;
  drawEventSquare(ctx,x,y,half*2,Math.max(4,snap(half*.09)),'#8651bc');ctx.shadowBlur=0;
  drawEventSquare(ctx,x,y,Math.max(8,half*2-10),Math.max(2,snap(half*.08)),'#090513');
  ctx.globalAlpha=.3+t*.55;ctx.strokeStyle='#d8b1ff';ctx.lineWidth=3;ctx.stroke();
  // Tiny fragments are stretched across the lip, then disappear into darkness.
  for(let i=0;i<12;i++) {
    const life=((age*2+i*15)%180)/180,side=i%4,offset=snap((i/12-.5)*half*1.6),r=half+snap((1-life)*40);
    const px=x+(side===0?-r:side===2?r:offset),py=y+(side===1?-r:side===3?r:offset);
    ctx.globalAlpha=(1-life)*t;ctx.fillStyle='#f0dbff';ctx.fillRect(px,py,side%2?4:12,side%2?12:4);
  }
  ctx.restore();
}

function drawShootingStarWarning(ctx: CanvasRenderingContext2D, x: number, y: number, age: number, visibility = 1) {
  const t=Math.min(1,age/180),snap=(v:number)=>Math.round(v/2)*2;
  ctx.save();
  // Keep the original grounded landing marker; enrich it with stellar light.
  ctx.globalAlpha=(.08+t*.1)*visibility;ctx.fillStyle='#f3c969';ctx.fillRect(x-28,y-28,56,56);
  ctx.globalAlpha=(.2+t*.25)*visibility;ctx.strokeStyle='#e6c98a';ctx.lineWidth=2;ctx.strokeRect(x-30,y-30,60,60);
  // Finish closing at impact, including the 36-tick flight after the warning.
  const approach = Math.min(1, age / (180 + STAR_FALL_TICKS));
  const radius = 30 + Math.round((1 - approach) * 82);
  ctx.shadowColor='#ffd47d';ctx.shadowBlur=8;ctx.fillStyle='#ffe7af';ctx.globalAlpha=(.45+t*.45)*visibility;
  for(const dx of [-1,1])for(const dy of [-1,1]){
    const px=x+dx*radius,py=y+dy*radius;
    ctx.fillRect(px-(dx>0?16:0),py,16,4);ctx.fillRect(px,py-(dy>0?16:0),4,16);
  }
  ctx.shadowBlur=0;
  // Square glints orbit the landing site; separated rays share the energy aura's rhythm.
  for(let i=0;i<12;i++){
    const life=((age+i*17)%100)/100,angle=i*Math.PI/6+age*.006;
    const distance=38+snap((1-life)*44),px=x+snap(Math.cos(angle)*distance),py=y+snap(Math.sin(angle)*distance*.7-life*12);
    ctx.globalAlpha=(Math.sin(life*Math.PI)*(.35+t*.55))*visibility;ctx.shadowColor=i%3?'#ffd47d':'#a6ddff';ctx.shadowBlur=i%3?4:0;
    drawStellarStar(ctx,px,py,i%4?1:1.5,i%3?'#ffe6a4':'#bdeaff');
  }
  ctx.shadowBlur=0;
  for(const [i,[dx,dy]]of [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]].entries()){
    const life=((age*1.3+i*11)%70)/70,d=snap(15+life*28);
    ctx.globalAlpha=((1-life)*(.2+t*.45))*visibility;drawEnergyPixelRay(ctx,x+dx*d,y+dy*d,dx,dy,i%2?'#addfff':'#ffe6a6',.8);
  }
  const pulse=.75+.25*Math.sin(age*.065);
  ctx.globalAlpha=(.6+t*.35)*visibility;ctx.shadowColor='#ffcf72';ctx.shadowBlur=12+6*pulse;
  drawStellarStar(ctx,x,y,3,'#ffd783');ctx.shadowBlur=0;
  drawStellarStar(ctx,x,y,1.7,'#fff4d4');ctx.fillStyle='#fffdf0';ctx.fillRect(x-2,y-2,4,4);
  ctx.restore();
}

function drawAmbientEvents(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, width: number, height: number) {
  const event = state.ambientEvents.warning || state.ambientEvents.active;
  if (!event || event.kind === 'eclipse') return;
  const warning = !!state.ambientEvents.warning;
  const age = state.ambientEvents.active?.age ?? 180 - state.ambientEvents.warning!.ticks;
  const color = AMBIENT_EVENTS[event.kind].color;
  const snap = (v: number) => Math.round(v / 4) * 4;
  const fade = warning ? 1 : event.kind === 'blackhole' ? Math.min(1,.8+age/72,event.ticks/12) : Math.min(1, age / 18, event.ticks / 36);
  ctx.save();
  for (let index = 0; index < event.points.length; index++) {
    const point = event.points[index], x = Math.round((point.x + .5) * TILE_SIZE - camX), y = Math.round((point.y + .5) * TILE_SIZE - camY);
    ctx.fillStyle = color; ctx.strokeStyle = color;
    if (warning && event.kind === 'blackhole') { drawBlackholeWarning(ctx,x,y,age); continue; }
    if (warning && event.kind === 'shootingStar') { drawShootingStarWarning(ctx,x,y,age); continue; }
    if (warning && event.kind === 'supernova') { drawSupernovaBirth(ctx,x,y,age,true); continue; }
    if (event.kind === 'supernova') {
      drawSupernova(ctx, state, x, y);
    } else if (event.kind === 'blackhole') {
      const entry=Math.max(0,1-age/60),collapse=1-Math.min(1,event.ticks/36);
      // Delayed stepped fronts slam inward as the aperture tears fully open.
      for(let front=0;front<4;front++){
        const travel=Math.min(1,Math.max(0,(age-front*7)/52));
        if(age<front*7||travel>=1)continue;
        const half=snap(128+(1-travel)**1.5*(900+front*180));
        ctx.globalAlpha=0;drawEventSquare(ctx,x,y,half*2,Math.max(12,snap(half*.12)),'#b88aed');
        ctx.globalAlpha=fade*(1-travel)*.65;ctx.strokeStyle=front%2?'#c5d5ff':'#e2c4ff';ctx.lineWidth=front?5:10;ctx.stroke();
      }
      for(let lane=0;lane<8;lane++){
        const angle=lane*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle);
        for(let chip=0;chip<12;chip++){
          const life=((age*(4.5+collapse*3)+chip*17+lane*11)%200)/200,d=110+(1-life)**2*1450;
          const px=x+snap(dx*d),py=y+snap(dy*d);
          if(px<-60||py<-60||px>width+60||py>height+60)continue;
          ctx.globalAlpha=fade*Math.sin(life*Math.PI)*(.25+entry*.25+collapse*.3);
          drawEnergyPixelRay(ctx,px,py,-Math.sign(dx),-Math.sign(dy),chip%3?'#a98ce6':'#e9ddff',1.5+life*1.4);
        }
      }
      // A broad, inward-moving gravity field surrounds a much larger central void.
      for (let i = 0; i < 144; i++) {
        const life = ((age * 3.6 + i * 23) % 180) / 180, angle = i * 2.4 + life * 1.8;
        const radius = 110 + (1 - life) * TILE_SIZE * 27;
        const px = x + snap(Math.cos(angle) * radius), py = y + snap(Math.sin(angle) * radius);
        if (px < -30 || py < -30 || px > width + 30 || py > height + 30) continue;
        ctx.globalAlpha = fade * (.3 + life * .6);
        drawEnergyPixelRay(ctx, px, py, Math.round(Math.cos(angle)), Math.round(Math.sin(angle)), i % 4 ? '#bc8aef' : '#f6dbff', 1.6 + life);
      }
      for (let i = 0; i < 3; i++) {
        const life = ((age * 4.5 + i * 80) % 240) / 240, half = snap(130 + (1 - life) * 480);
        ctx.globalAlpha = fade * (.05 + life * .14); ctx.strokeStyle = '#a66ae8'; ctx.lineWidth = 4;
        ctx.strokeRect(x - half, y - half, half * 2, half * 2);
      }
      const pullPulse = Math.max(0, 1 - ((age + 44) % 45) / 18);
      // Fast uneven throbbing and a two-axis wobble keep the core violently unstable.
      const breathing = Math.sin(age * .42) * .035 + Math.sin(age * 1.13) * .018;
      ctx.save();ctx.translate(x,y);
      const collapseScale=event.ticks<36?Math.max(.06,(event.ticks/36)**.7):1;
      const arrival=1+entry*.14;
      ctx.scale((1 - pullPulse * .08 + breathing)*collapseScale*arrival, (1 - pullPulse * .08 - breathing)*collapseScale*arrival);
      ctx.translate(-x,-y);
      ctx.globalAlpha = fade; ctx.shadowColor = '#bd72ff'; ctx.shadowBlur = 18+entry*12;
      drawEventSquare(ctx, x, y, 256, 12, '#b075ed');
      ctx.shadowBlur = 0;
      drawEventSquare(ctx, x, y, 232, 10, '#1b0c2e');
      // A stepped stellar mantle and dark hot core echo the Solar suit construction.
      drawEventSquare(ctx, x, y, 176, 12, '#47205f');
      drawEventSquare(ctx, x, y, 152, 10, '#7b3b9f');
      const contraction = snap(pullPulse * 12 + Math.abs(Math.sin(age * .32)) * 16);
      ctx.shadowColor = '#d49bff'; ctx.shadowBlur = 6 + pullPulse * 12;
      drawEventSquare(ctx, x, y, 128 - contraction, 8, '#c17bec');
      ctx.shadowBlur = 0;
      drawEventSquare(ctx, x, y, 104 - contraction, 8, pullPulse > .5 || Math.floor(age / 3) % 4 === 0 ? '#f9e2ff' : '#edb8ff');
      drawEventSquare(ctx, x, y, 80 - contraction, 6, '#77358f');
      drawEventSquare(ctx, x, y, 56 - contraction, 4, '#190b28');
      // Small accretion fragments spiral inward and vanish inside the core.
      for (let chip = 0; chip < 16; chip++) {
        const life = ((age * 3 + chip * 6) % 45) / 45;
        const angle = chip * Math.PI / 8 + life * 2.6, distance = 8 + (1 - life) * 64;
        ctx.globalAlpha = fade * (1 - life) * .85; ctx.fillStyle = chip % 3 ? '#b77be8' : '#f5dcff';
        const size = life < .55 ? 4 : 2;
        ctx.fillRect(x + snap(Math.cos(angle) * distance), y + snap(Math.sin(angle) * distance), size, size);
      }
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#ffe9ff'; ctx.fillRect(x - 48, y - 48, 24, 8); ctx.fillRect(x - 48, y - 40, 8, 16);
      ctx.fillStyle = '#bc7cdc'; ctx.fillRect(x + 20, y + 32, 20, 8);
      for (let i = 0; i < 20; i++) {
        const along = (age * 5 + i * 60) % 1200, side = Math.floor(along / 300), offset = snap(along % 300 - 150);
        const px = x + (side === 1 ? 150 : side === 3 ? -158 : offset);
        const py = y + (side === 0 ? -158 : side === 2 ? 150 : offset);
        ctx.globalAlpha = fade * (i % 3 ? .6 : 1); ctx.fillStyle = i % 3 ? '#ae76dd' : '#ffe0ff';
        ctx.fillRect(px, py, side % 2 ? 8 : 16, side % 2 ? 16 : 8);
      }
      ctx.restore();
    } else if (event.kind === 'shootingStar') {
      if (age < STAR_FALL_TICKS) {
        // Carry the final warning through descent until the comet is on screen.
        drawShootingStarWarning(ctx,x,y,180+age,1-age/STAR_FALL_TICKS*.25);
        const t = age / STAR_FALL_TICKS, remaining = 1 - t * t;
        const sx = x + snap(remaining * 240), sy = y - snap(remaining * 450);
        const pixel = Math.round(3 + t * 4);
        // Tapered, separated comet fragments follow the descent; the head is a star.
        for (let i = 13; i >= 0; i--) {
          const opacity = 1 - i / 15, px = sx + i * 12, py = sy - i * 24;
          const width = Math.max(4, 16 - Math.floor(i / 3) * 2), length = 24 - Math.floor(i / 3) * 2;
          ctx.globalAlpha = opacity * .8; ctx.fillStyle = i % 3 ? '#ffc95d' : '#fff0bd';
          ctx.fillRect(px - width / 2, py - length / 2, width, length);
          ctx.globalAlpha = opacity * .45; ctx.fillStyle = '#9bd9ff';
          ctx.fillRect(px + 14 + i % 3 * 4, py - 12, 4, 10);
          if (i % 2 === 0) { ctx.fillStyle = '#f5e1a3'; ctx.fillRect(px - 18, py + 6, 6, 6); }
        }
        ctx.globalAlpha = 1; ctx.shadowColor = '#ffcd66'; ctx.shadowBlur = 14;
        drawStellarStar(ctx, sx, sy, pixel, '#ffd16a'); ctx.shadowBlur = 0;
        drawStellarStar(ctx, sx, sy, Math.max(1, pixel - 2), '#fff3c7');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(sx - 3, sy - 3, 6, 6);
        for (const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
          const distance = pixel * 6 + Math.floor(age % 6) * 2;
          ctx.globalAlpha = .75; drawEnergyPixelRay(ctx,sx+dx*distance,sy+dy*distance,dx,dy,'#fff1b0',1.4);
        }
        ctx.globalAlpha = 1;
        ctx.globalAlpha = .15 + t * .2; ctx.lineWidth = 3; ctx.strokeStyle = '#ffe1a1'; ctx.strokeRect(x - 24, y - 24, 48, 48);
      } else {
        const landingAge = age - STAR_FALL_TICKS;
        if (landingAge < 6) drawShootingStarWarning(ctx,x,y,180+age,.75*(1-landingAge/6));
        if (landingAge < 42) {
          const t = landingAge / 42;
          for (let front = 0; front < 2; front++) {
            const half = snap(20 + t * (front ? 90 : 145));
            ctx.globalAlpha = (1 - t) * (front ? .4 : .7); ctx.strokeStyle = front ? '#9ddcff' : '#ffe4a5'; ctx.lineWidth = front ? 3 : 5;
            ctx.strokeRect(x - half, y - half, half * 2, half * 2);
          }
          for (let i = 0; i < 12; i++) {
            const angle = i * Math.PI / 6, d = 25 + t * (85 + i % 3 * 25);
            ctx.globalAlpha = (1 - t) * .9;
            drawEnergyPixelRay(ctx, x + snap(Math.cos(angle) * d), y + snap(Math.sin(angle) * d - t * 22), Math.round(Math.cos(angle)), Math.round(Math.sin(angle)), i % 2 ? '#ffe6a1' : '#a6dcff', 2);
          }
        }
        const bob = snap(Math.sin(age * .065) * 5), shardY = y + bob;
        const visible = event.ticks < 180 ? .4 + .6 * Math.abs(Math.sin(age * .13)) : 1;
        // Match the full-energy aura: staggered pale/gold rays with sharp leading chips.
        const directions = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
        for (let direction = 0; direction < directions.length; direction++) {
          const [dx,dy] = directions[direction];
          for (let fragment = 0; fragment < 2; fragment++) {
            const life = ((age * 2 + direction * 5 + fragment * 18) % 36) / 36;
            const distance = 34 + Math.floor(life * 9) * 4;
            ctx.globalAlpha = visible * (1-life) * .95; ctx.shadowColor = '#ffcb57'; ctx.shadowBlur = fragment ? 8 : 4;
            drawEnergyPixelRay(ctx, x + dx * distance, shardY + dy * distance, dx, dy, fragment ? '#fff4bf' : '#ffc648', 1.5);
          }
        }
        ctx.globalAlpha = visible; ctx.shadowColor = '#ffcf5f'; ctx.shadowBlur = 16;
        drawStellarStar(ctx, x, shardY, 5, '#ffd867'); ctx.shadowBlur = 0;
        drawStellarStar(ctx, x, shardY, 3, '#fff1bc');
        ctx.fillStyle = '#fffef1'; ctx.fillRect(x - 5, shardY - 5, 10, 10);

      }
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function eclipseVisualStrength(state: GameState): number {
  const event = state.ambientEvents.warning || state.ambientEvents.active;
  if (event?.kind !== 'eclipse') return 0;
  const age = state.ambientEvents.active?.age ?? 180 - event.ticks;
  return state.ambientEvents.warning ? age / 180 * .35 : Math.min(1, .35 + age / 30, event.ticks / 45);
}

function drawEclipseShadow(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number) {
  const event = state.ambientEvents.warning || state.ambientEvents.active;
  if (event?.kind !== 'eclipse') return;
  const strength = eclipseVisualStrength(state);
  ctx.save();
  // Shade all world layers after rendering, leaving HUD and minimap outside the shadow.
  ctx.globalAlpha = strength * .22; ctx.fillStyle = '#4a3e9c'; ctx.fillRect(0, 0, width, height);
  const age=state.ambientEvents.active?.age ?? 180-event.ticks;
  const progress=state.ambientEvents.active?age/360:age/180*.12;
  const moonX=Math.round(width*(.76+progress*.05)),moonY=Math.round(height*.25),size=Math.round(Math.min(width,height)*.55/8)*8;
  ctx.shadowBlur=0;ctx.globalAlpha=strength*.055;
  drawEventSquare(ctx,moonX,moonY,size,Math.max(8,size*.08),'#bdc7ff');
  ctx.globalAlpha=strength*.22;ctx.strokeStyle='#b5c4ff';ctx.lineWidth=3;ctx.stroke();
  ctx.globalAlpha=strength*.1;drawEventSquare(ctx,moonX+Math.round(size*.14),moonY-Math.round(size*.09),size,Math.max(8,size*.08),'#171b41');
  // A broad broken shadow band sweeps across the station, with a cool illuminated edge.
  for(let row=0;row<height;row+=24){
    const left=Math.round(width*(progress*.8-.25)+row*.4),span=Math.round(width*.28);
    ctx.globalAlpha=strength*.07;ctx.fillStyle='#111b3c';ctx.fillRect(left,row,span,24);
    ctx.globalAlpha=strength*.11;ctx.fillStyle='#a8baff';ctx.fillRect(left+span,row,4,20);
  }
  for(let i=0;i<32;i++){
    const px=Math.round((i*137%997)/997*width),py=Math.round((i*239%991)/991*height);
    const glint=.25+.75*Math.sin(age*.025+i*1.8)**2;
    ctx.globalAlpha=strength*glint*(i%4?.23:.4);ctx.fillStyle=i%3?'#b9c8ff':'#e2e9ff';
    ctx.fillRect(px-2,py,5,1);ctx.fillRect(px,py-2,1,5);
  }
  ctx.globalAlpha = strength * .55; ctx.strokeStyle = '#b1abff'; ctx.lineWidth = 4; ctx.strokeRect(4, 4, width - 8, height - 8);
  ctx.globalAlpha = strength * .35; ctx.fillStyle = '#a5a8df';
  for (let i = 0; i < 16; i++) {
    const px = Math.floor((i + .5) * width / 16);
    ctx.fillRect(px, 0, 14, 2); ctx.fillRect(width - px, height - 2, 14, 2);
  }
  ctx.restore();
}

function drawMeteorImpact(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number) {
  const impact = state.meteoriteImpact;
  if (!impact) return;
  const age = 60 - impact.ticks, progress = age / 60;
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[impact.chamber];
  const left = c1 * TILE_SIZE - camX, top = r1 * TILE_SIZE - camY;
  const width = (c2 - c1 + 1) * TILE_SIZE, height = (r2 - r1 + 1) * TILE_SIZE;
  const x = left + width / 2, y = top + height / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(left, top, width, height); ctx.clip();
  ctx.globalAlpha = Math.max(0, 1 - age / 16) * .35; ctx.fillStyle = '#ffd28b'; ctx.fillRect(left, top, width, height);
  for (let i = 0; i < 3; i++) {
    const t = Math.max(0, Math.min(1, (age - i * 6) / 48));
    if (age < i * 6) continue;
    const half = Math.floor((35 + t * width * .62) / 12) * 12;
    ctx.globalAlpha = (1 - t) * (i ? .5 : .9); ctx.strokeStyle = i % 2 ? '#ff963e' : '#ffe2a0'; ctx.lineWidth = i ? 6 : 10;
    ctx.shadowColor = '#ff742e'; ctx.shadowBlur = i ? 0 : 10;
    ctx.strokeRect(x - half, y - half, half * 2, half * 2); ctx.shadowBlur = 0;
  }
  if (age < 22) {
    const half = 40 + Math.floor(age / 2) * 12;
    ctx.globalAlpha = (1 - age / 22) * .85; ctx.fillStyle = '#ff963e'; ctx.fillRect(x - half, y - half, half * 2, half * 2);
    ctx.fillStyle = '#fff0bd'; ctx.fillRect(x - half / 2, y - half / 2, half, half);
  }
  for (let i = 0; i < 64; i++) {
    const angle = i * 2.4, speed = 4 + i % 7, distance = age * speed;
    const px = Math.round((x + Math.cos(angle) * distance) / 4) * 4;
    const py = Math.round((y + Math.sin(angle) * distance - age * .8) / 4) * 4;
    ctx.globalAlpha = (1 - progress) * (i % 3 ? .8 : .5);
    drawEnergyPixelRay(ctx, px, py, Math.round(Math.cos(angle)), Math.round(Math.sin(angle)), i % 4 ? '#ff9b42' : '#ffe9aa', 2 + i % 3);
  }
  ctx.restore();
}

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  tickN: number,
  isMobileTouch = false,
) {
  const S = isMobileTouch ? 3 : 4; // px per tile — smaller on mobile, unchanged on desktop
  const ROOM_COLORS: readonly string[] = state.sun ? SUN_CHAMBER_COLORS : state.neptune ? OCEAN_CHAMBER_COLORS : state.gaia ? GAIA_CHAMBER_COLORS : isMoonMap(state) ? MOON_CHAMBER_COLORS : CHAMBER_COLORS; // challenge worlds use their own palette
  const MW = MAP_COLS * S;
  const MH = MAP_ROWS * S;
  const PAD = 8;
  const MX = canvasW - MW - PAD;
  const MY = PAD;

  // Border + bg
  ctx.fillStyle = 'rgba(0,0,8,0.85)';
  ctx.fillRect(MX - 2, MY - 2, MW + 4, MH + 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(MX - 1.5, MY - 1.5, MW + 3, MH + 3);

  // Tiles
  for (let ty = 0; ty < MAP_ROWS; ty++) {
    for (let tx = 0; tx < MAP_COLS; tx++) {
      const tile = state.map[ty][tx];
      const px = MX + tx * S;
      const py = MY + ty * S;
      if (tile === T_WALL) {
        ctx.fillStyle = state.neptune ? '#020d18' : state.gaia ? '#04120a' : isMoonMap(state) ? '#0a0614' : '#060615';
      } else {
        const ch = chamberOfTile(tx, ty);
        ctx.fillStyle = ch >= 0 ? ROOM_COLORS[ch] + '28' : '#17283c';
      }
      ctx.fillRect(px, py, S, S);
      // Gaia: overgrowth shows tile by tile, so you can read which rooms are feeding her.
      const growth = state.gaia?.growth[ty * MAP_COLS + tx] ?? 0;
      if (growth >= 2) { ctx.fillStyle = growth >= 3 ? '#2f7a1fcc' : '#4fae2f99'; ctx.fillRect(px, py, S, S); }
    }
  }

  const mirrorTwin=getMirrorTwinTile(state);
  if(mirrorTwin){ctx.save();ctx.fillStyle='#7fb4ff';ctx.fillRect(MX+mirrorTwin.tileX*S-1,MY+mirrorTwin.tileY*S-1,S+2,S+2);ctx.restore();}
  if(state.lunarDecoy){
    ctx.save();ctx.strokeStyle='#d3aaff';ctx.lineWidth=1;
    ctx.strokeRect(MX+state.lunarDecoy.tileX*S-2,MY+state.lunarDecoy.tileY*S-2,S+4,S+4);ctx.restore();
  }
  const carryingRuby = state.playerCarryingRuby || state.rubyTileX === -1;
  const rubyX = carryingRuby ? state.playerTileX : state.rubyTileX;
  const rubyY = carryingRuby ? state.playerTileY : state.rubyTileY;
  const rubyChamber = chamberOfTile(rubyX, rubyY);
  const rubyPulse = 0.65 + 0.35 * Math.abs(Math.sin(tickN * 0.07));
  if (rubyChamber >= 0) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[rubyChamber];
    ctx.save();
    ctx.fillStyle = 'rgba(255,17,85,0.12)';
    ctx.fillRect(MX + c1 * S, MY + r1 * S, (c2 - c1 + 1) * S, (r2 - r1 + 1) * S);
    ctx.strokeStyle = `rgba(255,85,136,${rubyPulse})`;
    ctx.shadowColor = '#ff1155'; ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.strokeRect(MX + c1 * S + 1, MY + r1 * S + 1, (c2 - c1 + 1) * S - 2, (r2 - r1 + 1) * S - 2);
    ctx.restore();
  }

  // Meteor warnings remain visible over the Ruby chamber tint.
  if (state.meteoriteWarning >= 0) {
    const pulse = Math.floor(tickN / 6) % 2 === 0;
    if (pulse) {
      const [r1, c1, r2, c2] = CHAMBER_BOUNDS[state.meteoriteWarning];
      ctx.fillStyle = 'rgba(255,80,0,0.45)';
      ctx.fillRect(MX + c1 * S, MY + r1 * S, (c2 - c1 + 1) * S, (r2 - r1 + 1) * S);
    }
  }
  // Moon phase 3: the dark room is a black wash on the map too.
  if (state.moon && state.moon.dark >= 0) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[state.moon.dark];
    ctx.fillStyle = 'rgba(3,1,8,0.85)'; ctx.fillRect(MX + c1 * S, MY + r1 * S, (c2 - c1 + 1) * S, (r2 - r1 + 1) * S);
  }
  // Moon phase 2+: mirror tiles as faint silver marks, so you can plan where to stand.
  if (state.moon?.mirrors.length) {
    ctx.fillStyle = 'rgba(230,220,255,0.55)';
    for (const i of state.moon.mirrors) if (!moonHiddenInDark(state, i % MAP_COLS, Math.floor(i / MAP_COLS))) ctx.fillRect(MX + (i % MAP_COLS) * S, MY + Math.floor(i / MAP_COLS) * S, S, S);
  }
  // Moon: after a mite kill, two rooms glow violet (one of them hers), fading over the last second.
  const moonHint = state.moon?.hint;
  if (moonHint) {
    ctx.save(); ctx.globalAlpha = Math.min(1, moonHint.ticks / 60) * (.75 + .25 * Math.sin(tickN * .15));
    for (const room of moonHint.rooms) {
      const [r1, c1, r2, c2] = CHAMBER_BOUNDS[room];
      ctx.fillStyle = 'rgba(204,51,255,0.28)'; ctx.fillRect(MX + c1 * S, MY + r1 * S, (c2 - c1 + 1) * S, (r2 - r1 + 1) * S);
      ctx.strokeStyle = '#e6b8ff'; ctx.lineWidth = 2; ctx.strokeRect(MX + c1 * S + 1, MY + r1 * S + 1, (c2 - c1 + 1) * S - 2, (r2 - r1 + 1) * S - 2);
    }
    ctx.restore();
  }
  if (state.sun && state.sun.quenchedTicks > SUN.quenchTicks - 75) {
    const glow = (state.sun.quenchedTicks - (SUN.quenchTicks - 75)) / 75;
    ctx.save();ctx.globalAlpha=glow*.45;
    for(const [r1,c1,r2,c2] of CHAMBER_BOUNDS){
      ctx.fillStyle='#b5f3ff';ctx.fillRect(MX+c1*S,MY+r1*S,(c2-c1+1)*S,(r2-r1+1)*S);
      ctx.strokeStyle='#e8ffff';ctx.lineWidth=2;ctx.strokeRect(MX+c1*S,MY+r1*S,(c2-c1+1)*S,(r2-r1+1)*S);
    }
    ctx.restore();
  }
  // Neptune sky laser countdown blinks its target room the same way, in pale cyan.
  const skyLaser = state.neptune?.laser;
  if (skyLaser && Math.floor(tickN / 6) % 2 === 0) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[skyLaser.chamber];
    ctx.fillStyle = 'rgba(160,236,255,0.5)';
    ctx.fillRect(MX + c1 * S, MY + r1 * S, (c2 - c1 + 1) * S, (r2 - r1 + 1) * S);
  }
  // Gaia: Sunfire's target blinks gold, and lit Sunstones show as gold dots.
  const sunfire = state.gaia?.sunfire;
  if (sunfire && Math.floor(tickN / 6) % 2 === 0) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[sunfire.chamber];
    ctx.fillStyle = 'rgba(255,211,106,0.5)';
    ctx.fillRect(MX + c1 * S, MY + r1 * S, (c2 - c1 + 1) * S, (r2 - r1 + 1) * S);
  }
  for (const stone of state.gaia?.stones ?? []) {
    if (stone.travel > 0) continue;
    ctx.fillStyle = stone.lit ? '#ffd36a' : '#7a7258';
    ctx.fillRect(MX + stone.x * S - 1, MY + stone.y * S - 1, S + 2, S + 2);
  }
  // Neptune: a clone revealed by a jellyfish blinks pink.
  const revealed = state.neptune?.reveal && state.enemies.find(c => c.id === state.neptune!.reveal!.cloneId);
  if (revealed && Math.floor(tickN / 8) % 2 === 0) {
    ctx.save(); ctx.strokeStyle = '#ff9ce6'; ctx.lineWidth = 2; ctx.strokeRect(MX + revealed.tileX * S - 4, MY + revealed.tileY * S - 4, S + 8, S + 8);
    ctx.fillStyle = '#ffd6f4'; ctx.fillRect(MX + revealed.tileX * S - 1, MY + revealed.tileY * S - 1, S + 2, S + 2); ctx.restore();
  }
  // Tide rooms: a faint blue wash with chevrons drifting along the current, like the tide on the floor.
  for (const tide of state.neptune?.tides ?? []) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[tide.chamber];
    const x = MX + c1 * S, y = MY + r1 * S, w = (c2 - c1 + 1) * S, h = (r2 - r1 + 1) * S;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = 'rgba(89,200,255,0.2)'; ctx.fillRect(x, y, w, h);
    ctx.translate(Math.round(x + w / 2), Math.round(y + h / 2)); ctx.rotate(Math.atan2(tide.dirY, tide.dirX));
    const span = Math.max(w, h), gap = span / 3, arm = Math.max(3, Math.round(S * 1.5)), bar = Math.max(1.5, S * .5);
    ctx.fillStyle = 'rgba(216,244,255,0.85)';
    for (let i = -2; i <= 2; i++) {
      const cx = Math.round(i * gap + (tickN * .25) % gap);
      for (let k = 0; k < arm; k++) { ctx.fillRect(cx - k * bar, -k * bar - bar / 2, bar, bar); ctx.fillRect(cx - k * bar, k * bar - bar / 2, bar, bar); }
    }
    ctx.restore();
  }

  // Outline room interiors and connecting corridors as one region, leaving
  // doorways open. Ignore internal cover so it does not clutter the room outline.
  const inRegion = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= MAP_COLS || y >= MAP_ROWS) return false;
    const chamber = chamberOfTile(x, y);
    if (chamber >= 0) {
      const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamber];
      if (x > c1 && x < c2 && y > r1 && y < r2) return true;
    }
    return state.map[y][x] !== T_WALL && (chamber >= 0 || HALLWAY_BOUNDS.some(
      ([r1, c1, r2, c2]) => y >= r1 && y <= r2 && x >= c1 && x <= c2,
    ));
  };
  ctx.save();
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      if (!inRegion(x, y)) continue;
      const chamber = chamberOfTile(x, y), px = MX + x * S, py = MY + y * S;
      ctx.fillStyle = chamber >= 0 ? ROOM_COLORS[chamber] + 'b0' : '#83afcf';
      if (!inRegion(x, y - 1)) ctx.fillRect(px, py, S, 1);
      if (!inRegion(x, y + 1)) ctx.fillRect(px, py + S - 1, S, 1);
      if (!inRegion(x - 1, y)) ctx.fillRect(px, py, 1, S);
      if (!inRegion(x + 1, y)) ctx.fillRect(px + S - 1, py, 1, S);
    }
  }
  ctx.restore();

  drawAmbientMinimap(ctx, state, MX, MY, S);

  // Bomb
  if (state.bomb) {
    const pulse = Math.floor(tickN / 8) % 2 === 0;
    ctx.fillStyle = pulse ? '#ff6600' : '#ffaa00';
    ctx.fillRect(MX + state.bomb.tileX * S - 1, MY + state.bomb.tileY * S - 1, 3, 3);
  }

  // Enemies
  for (const e of state.enemies) {
    if (!isEnemyVisibleOnMinimap(e) || (moonHiddenInDark(state, e.tileX, e.tileY, e.id) && !isMoonRevealed(state, e))) continue; // she still shows on the map while revealed
    ctx.fillStyle = state.moon && moonWearsGuise(state, e) ? ENEMY_CONFIGS.moon_illusion.color : ENEMY_CONFIGS[e.type].color; // the Moon Queen hides among her illusions
    ctx.fillRect(MX + e.tileX * S, MY + e.tileY * S, S, S);
  }

  // Moon Mark: an ice-blue frame around the marked dot, so you can follow her across the map.
  if (state.sun) {
    ctx.save();
    if (state.sun.flare) {
      const [r1, c1, r2, c2] = CHAMBER_BOUNDS[state.sun.flare.room];
      const x = MX + c1 * S, y = MY + r1 * S, w = (c2 - c1 + 1) * S, h = (r2 - r1 + 1) * S;
      ctx.strokeStyle = '#ffe778'; ctx.lineWidth = 2;
      for (const sx of [0, 1]) for (const sy of [0, 1]) {
        const cx = x + (sx ? w - 2 : 2), cy = y + (sy ? h - 2 : 2);
        ctx.beginPath(); ctx.moveTo(cx + (sx ? -12 : 12), cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + (sy ? -12 : 12)); ctx.stroke();
      }
      // Opaque badge remains readable even when a meteor marks the same chamber.
      const bx = Math.round(x + w / 2), by = Math.round(y + h * .24);
      ctx.fillStyle = '#191521'; ctx.fillRect(bx - 24, by - 10, 48, 20);
      drawSunburstEmblem(ctx, bx - 12, by, 15);
      ctx.fillStyle = '#fff9d5'; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.ceil(state.sun.flare.ticks / 60) + 's', bx, by);
    }
    ctx.fillStyle = '#ff7a3a'; // phase 2+ burning trail
    for (const b of state.sun.burning) ctx.fillRect(MX + b.x * S, MY + b.y * S, S, S);
    for (const station of state.sun.stations) {
      const x = MX + (station.x + .5) * S, y = MY + (station.y + .5) * S;
      const sapped = state.enemies.some(e => e.type === 'scorch_sapper' && e.sapStation === station.id);
      ctx.fillStyle = sapped && Math.floor(tickN / 8) % 2 === 0 ? '#ffa23a' : station.blocked ? '#ff7956' : '#9af1ff'; // a drained station blinks orange
      ctx.fillRect(x - 3, y - 1, 6, 2); ctx.fillRect(x - 1, y - 3, 2, 6);
    }
    ctx.restore();
  }
  const markedOnMap = state.moon?.mark && state.enemies.find(e => e.id === state.moon!.mark!.id);
  if (state.moon?.mark && markedOnMap && (state.moon.mark.ticks > 60 || Math.floor(tickN / 6) % 2 === 0)) {
    const x = Math.round(MX + (markedOnMap.tileX + .5) * S), y = Math.round(MY + (markedOnMap.tileY + .5) * S), r = 6 + Math.floor(Math.abs(Math.sin(tickN * .1)) * 2);
    ctx.save(); ctx.strokeStyle = '#a9e6ff'; ctx.shadowColor = '#a9e6ff'; ctx.shadowBlur = 6; ctx.lineWidth = 2; ctx.strokeRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }

  // Gaia phase 3: lifeblooms (your heal) show as mint crosses.
  for (const e of state.enemies) {
    if (e.type !== 'lifebloom' || e.hp <= 0) continue;
    const x = Math.round(MX + (e.tileX + .5) * S), y = Math.round(MY + (e.tileY + .5) * S);
    ctx.save(); ctx.globalAlpha = .75 + .25 * Math.abs(Math.sin(tickN * .12)); ctx.fillStyle = '#9fffc8'; ctx.shadowColor = '#9fffc8'; ctx.shadowBlur = 5;
    ctx.fillRect(x - 2, y - 6, 4, 12); ctx.fillRect(x - 6, y - 2, 12, 4); ctx.restore();
  }
  // Gaia: healing blossoms stand out as pulsing pink flowers, so you can find and cut them.
  for (const e of state.enemies) {
    if (e.type !== 'blossom' || e.hp <= 0) continue;
    const x = Math.round(MX + (e.tileX + .5) * S), y = Math.round(MY + (e.tileY + .5) * S);
    ctx.save(); ctx.globalAlpha = .75 + .25 * Math.abs(Math.sin(tickN * .12)); ctx.shadowColor = '#ff8fc8'; ctx.shadowBlur = 5;
    ctx.fillStyle = '#ff8fc8'; ctx.fillRect(x - 2, y - 6, 4, 4); ctx.fillRect(x - 2, y + 2, 4, 4); ctx.fillRect(x - 6, y - 2, 4, 4); ctx.fillRect(x + 2, y - 2, 4, 4);
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffd36a'; ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.restore();
  }

  // Pylons sit above ordinary alien dots, with the same gold/cyan silhouette as their model.
  for (const e of state.enemies) {
    if (e.type !== 'aegis_construct' || e.hp <= 0) continue;
    const x = Math.round(MX + (e.tileX + .5) * S), y = Math.round(MY + (e.tileY + .5) * S);
    const overload = (e.pylon?.overloadTicks ?? 0) > 0;
    const pulse = .75 + .25 * Math.abs(Math.sin(tickN * (overload ? .3 : .08)));
    ctx.save(); ctx.globalAlpha = pulse; ctx.shadowColor = overload ? '#ffc47c' : '#78dedf'; ctx.shadowBlur = overload ? 9 : 5;
    ctx.fillStyle = '#e3c581'; ctx.fillRect(x - 4, y - 5, 8, 10);
    ctx.fillRect(x - 5, y - 7, 10, 2); ctx.fillRect(x - 5, y + 5, 10, 2);
    ctx.shadowBlur = 0; ctx.fillStyle = '#293b3e'; ctx.fillRect(x - 2, y - 4, 4, 8);
    ctx.fillStyle = overload ? '#fff1c9' : '#d9ffff'; ctx.fillRect(x - 1, y - 3, 2, 6);
    if (overload) {
      const size = 13 + Math.floor(pulse * 3); ctx.strokeStyle = '#ffce8a'; ctx.lineWidth = 2;
      ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    }
    ctx.restore();
  }

  // A shield adds a blue outline while keeping the player marker visible.
  if (state.playerShieldHP > 0) {
    ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 1;
    ctx.strokeRect(MX + state.playerTileX * S - 2, MY + state.playerTileY * S - 2, 6, 6);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(MX + state.playerTileX * S - 1, MY + state.playerTileY * S - 1, 4, 4);

  // Boss on minimap — huge pulsing dot with glowing core and border
  for (const e of state.enemies) {
    if (isBossType(e.type) && isEnemyVisibleOnMinimap(e) && !(state.moon && moonWearsGuise(state, e)) && !(moonHiddenInDark(state, e.tileX, e.tileY, e.id) && !isMoonRevealed(state, e))) {
      if (e.type === 'aegis_sentinel' || e.type === 'astral_twins') {
        const x = MX + e.tileX * S, y = MY + e.tileY * S;
        ctx.fillStyle = e.twin?.downedTicks ? '#65657a' : e.twin?.index === 1 ? '#83cfff' : ENEMY_CONFIGS[e.type].color;
        ctx.fillRect(x - 2, y - 2, 6, 6);
        ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 1; ctx.strokeRect(x - 3, y - 3, 8, 8);
        continue;
      }
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.12));
      const bx = MX + e.tileX * S;
      const by = MY + e.tileY * S;
      // Gaia: the green Weaver would vanish against green vines, so it gets a dark backing, a bright gold
      // body and an expanding white ring, readable even in a fully overgrown room.
      if (state.gaia && e.type === 'thorn_weaver') {
        const cx = bx + S / 2, cy = by + S / 2, ring = 8 + ((tickN * .3) % 8);
        ctx.save();
        ctx.globalAlpha = 1 - ((tickN * .3) % 8) / 8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.strokeRect(cx - ring, cy - ring, ring * 2, ring * 2);
        ctx.globalAlpha = 1; ctx.fillStyle = '#05080a'; ctx.fillRect(cx - 7, cy - 7, 14, 14);
        ctx.shadowColor = '#ffd36a'; ctx.shadowBlur = 6; ctx.fillStyle = `rgba(255,${200 + Math.round(40 * pulse)},106,1)`; ctx.fillRect(cx - 5, cy - 5, 10, 10);
        ctx.shadowBlur = 0; ctx.fillStyle = '#294525'; ctx.fillRect(cx - 2, cy - 2, 4, 4);
        ctx.restore();
        continue;
      }

      // Deep purple for the Queen, cyan for the Reaper (glow matches her own color), the
      // Devourer's dot fills toxic green (her veins) but glows violet (her body color), white
      // glow + light blue fill for the Frost Warden, red for the King
      const colorGlow = e.type === 'thorn_weaver' ? '#88bc45' : e.type === 'sea_chanter' ? '#3998d6' : e.type === 'blind_prayer' ? '#ffdd22' : e.type === 'splitter_queen' ? '#8800ff' : e.type === 'storm_reaper' ? '#52ffd6' : e.type === 'devourer' ? '#6b2fa8' : e.type === 'frost_warden' ? '#ffffff' : '#ff0033';
      const colorFill = e.type === 'thorn_weaver' ? 'rgba(136,188,69,' + pulse + ')' : e.type === 'sea_chanter' ? 'rgba(57,152,214,' + pulse + ')' : e.type === 'blind_prayer' ? `rgba(255,221,34,${pulse})` : e.type === 'splitter_queen' ? `rgba(136,0,255,${pulse})` : e.type === 'storm_reaper' ? `rgba(82,255,214,${pulse})` : e.type === 'devourer' ? `rgba(136,255,68,${pulse})` : e.type === 'frost_warden' ? `rgba(102,204,255,${pulse})` : `rgba(255,0,34,${pulse})`;

      // Devourer gets an explicit painted violet halo behind her green dot — canvas
      // shadowBlur alone reads too faint to register as purple at this icon size
      if (e.type === 'devourer') {
        ctx.globalAlpha = 0.55 * pulse;
        ctx.fillStyle = '#6b2fa8';
        ctx.fillRect(bx - 7, by - 7, 16, 16);
        ctx.globalAlpha = 1;
      }

      ctx.shadowColor = colorGlow; ctx.shadowBlur = Math.floor(15 * pulse);
      ctx.fillStyle = colorFill;
      ctx.fillRect(bx - 3, by - 3, 8, 8);

      // Inner core is gold for every boss except the Frost Warden, whose icon is white/white-blue
      // through and through — a gold core there read too similar to the Devourer's violet+gold combo
      ctx.fillStyle = e.type === 'thorn_weaver' ? '#294525' : e.type === 'storm_reaper' ? '#06463f' : e.type === 'sea_chanter' ? '#8dc9f0' : e.type === 'blind_prayer' ? '#080808' : e.type === 'frost_warden' ? '#ffffff' : '#ffcc00';
      ctx.fillRect(bx - 1, by - 1, 4, 4);

      ctx.strokeStyle = e.type === 'thorn_weaver' ? 'rgba(216,239,155,' + pulse + ')' : e.type === 'storm_reaper' ? `rgba(82,255,214,${pulse})` : e.type === 'sea_chanter' ? `rgba(141,201,240,${pulse})` : e.type === 'frost_warden' ? `rgba(255,255,255,${pulse})` : `rgba(255,204,0,${pulse})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 4, by - 4, 10, 10);
      ctx.shadowBlur = 0;

    }
  }

  // Chamber labels on minimap
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelPts = [[3, 3], [32, 3], [3, 32], [32, 32]];
  for (let i = 0; i < 4; i++) {
    const [lx, ly] = labelPts[i];
    ctx.fillStyle = ROOM_COLORS[i] + 'cc';
    ctx.fillText(CHAMBER_LABELS[i][0], MX + lx * S + S / 2, MY + ly * S + S / 2);
  }

  // Draw the Ruby last so enemies, boss dots, and chamber labels cannot hide it.
  ctx.save();
  const rx = Math.round(MX + rubyX * S + S / 2);
  const ry = Math.round(MY + rubyY * S + S / 2);
  const half = isMobileTouch ? 5 : 7;
  ctx.shadowColor = '#ff1155'; ctx.shadowBlur = 14 + rubyPulse * 8;
  ctx.fillStyle = '#ff1155';
  ctx.fillRect(rx - 2, ry - half, 4, half * 2);
  ctx.fillRect(rx - half + 2, ry - half + 3, half * 2 - 4, half * 2 - 6);
  ctx.fillRect(rx - half, ry - 2, half * 2, 4);
  ctx.shadowBlur = 0;
  ctx.fillStyle = carryingRuby ? '#ffffff' : '#ffddee';
  ctx.fillRect(rx - 2, ry - 2, 4, 4);
  ctx.restore();
}

// Shared ray shape: long cardinal pixels, square diagonal sparks and a tiny leading chip.
function drawEnergyPixelRay(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, scale=1) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);ctx.fillStyle=color;
  if(dx===0)ctx.fillRect(-2,-5,4,10);
  else if(dy===0)ctx.fillRect(-5,-2,10,4);
  else {ctx.fillRect(-3,-3,6,6);ctx.fillRect(dx*4-1,dy*4-1,2,2);}
  ctx.restore();
}

function drawFullEnergyAura(ctx: CanvasRenderingContext2D, x: number, y: number, tickN: number, active: boolean) {
  ctx.save();
  x = Math.round(x); y = Math.round(y);
  const clock = tickN * (active ? 2 : 1);
  const directions = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  // Eight outward streams form a starburst, rather than the Sniper buff's square ring.
  ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = active ? 12 : 8;
  for (let i = 0; i < directions.length; i++) {
    const [dx, dy] = directions[i];
    for (let shard = 0; shard < 2; shard++) {
      const life = ((clock + i * 5 + shard * 18) % 36) / 36;
      const distance = 22 + Math.floor(life * (active ? 6 : 4)) * 4;
      const px = x + dx * distance, py = y + dy * distance;
      ctx.globalAlpha = (1 - life) * 0.9;
      ctx.fillStyle = shard ? '#fff2aa' : '#ffbb22';
      // Elongated cardinal rays and stepped corner sparks keep the silhouette blocky.
      drawEnergyPixelRay(ctx,px,py,dx,dy,shard?'#fff2aa':'#ffbb22');
    }
  }
  // A persistent eight-point pixel star makes "energy full" readable at a glance.
  const starY = y - 48;
  ctx.globalAlpha = 0.85 + 0.15 * Math.abs(Math.sin(tickN * 0.06));
  ctx.fillStyle = '#ffcc22';
  ctx.fillRect(x - 2, starY - 9, 4, 18);
  ctx.fillRect(x - 9, starY - 2, 18, 4);
  ctx.fillRect(x - 5, starY - 5, 10, 10);
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) ctx.fillRect(x + dx * 6 - 1, starY + dy * 6 - 1, 2, 2);
  ctx.fillStyle = active ? '#ffffff' : '#fff3b0';
  ctx.fillRect(x - 2, starY - 2, 4, 4);
  ctx.restore();
}

const PLAYER_CELESTIAL_PALETTES: Record<keyof typeof SPECIAL_SKILLS, { panel: string; visor: string; detail: string }> = {
  fiery_king:{panel:'#a8323c',visor:'#fff0b5',detail:'#ff9e80'},
  splitter_queen:{panel:'#8b67a8',visor:'#8fffe0',detail:'#c6a2f2'},
  storm_reaper:{panel:'#b77535',visor:'#fff0c8',detail:'#f4c18b'},
  devourer:{panel:'#08080d',visor:'#bcbccd',detail:'#71717f'},
  frost_warden:{panel:'#327f76',visor:'#e1fff5',detail:'#a8e8d7'},
  blind_prayer:{panel:'#b19832',visor:'#fffbe3',detail:'#fff2a3'},
  sea_chanter:{panel:'#315fba',visor:'#c7e4ff',detail:'#91baff'},
  thorn_weaver:{panel:'#5b8246',visor:'#f2f7eb',detail:'#c1e398'},
  aegis_sentinel:{panel:'#9a7468',visor:'#fff6ec',detail:'#e8b29c'},
  astral_twins:{panel:'#6f4250',visor:'#e9f6ff',detail:'#8fc8ff'},
};

function drawPlayerCelestialFeature(ctx: CanvasRenderingContext2D, kind: keyof typeof SPECIAL_SKILLS, sx: number, sy: number, size: number, layer: 'back'|'body'|'front', tick: number) {
  ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.scale(size/36,size/36);ctx.shadowBlur=0;
  const detail=PLAYER_CELESTIAL_PALETTES[kind].detail;
  const rect=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  if(kind==='frost_warden' && layer!=='body'){
    ctx.save();ctx.translate(0,1);ctx.globalAlpha=layer==='front'?.85:.45;
    drawCelestialPolygonRing(ctx,27,10,detail,5.5,.15,layer==='front');
    // Light travels around a fixed hoop: its centre, tilt and silhouette never rotate.
    for(let trail=3;trail>=0;trail--){
      const travel=((tick*.12-trail*.16)%8+8)%8,index=Math.floor(travel),t=travel-index;
      if((index<4)!==(layer==='front'))continue;
      const angle=index*Math.PI/4,nextAngle=(index+1)*Math.PI/4;
      const px=(Math.cos(angle)*(1-t)+Math.cos(nextAngle)*t)*27;
      const py=(Math.sin(angle)*(1-t)+Math.sin(nextAngle)*t)*10;
      const x=px*Math.cos(.15)-py*Math.sin(.15),y=px*Math.sin(.15)+py*Math.cos(.15);
      ctx.globalAlpha=(1-trail*.22)*(layer==='front'?.9:.5);ctx.shadowColor=detail;ctx.shadowBlur=4;
      rect(Math.round(x)-2,Math.round(y)-2,4,4,trail?'#a8e8d7':'#edfff8');
    }
    ctx.restore();
  }
  if(layer==='body'){
    if(kind==='fiery_king'){
      // A glowing orange mantle surrounds a darker ember core; the visor is white-hot.
      ctx.globalAlpha=.8;rect(-22,-7,5,11,'#dc4348');rect(17,-7,5,11,'#dc4348');
      ctx.globalAlpha=1;rect(-21,-11,3,6,detail);rect(18,-11,3,6,detail);
      rect(-10,-12,20,24,'#ff7947');rect(-12,-8,24,16,'#ff7947');
      rect(-8,-9,16,18,'#d65b34');rect(-10,-5,20,10,'#d65b34');
      ctx.shadowColor='#ef793d';ctx.shadowBlur=4+Math.abs(Math.sin(tick*.08))*2;
      rect(-5,-6,10,12,'#a83b2c');rect(-6,-4,12,8,'#a83b2c');
      ctx.shadowBlur=0;rect(-3,-3,6,6,'#8c2836');
    }else if(kind==='splitter_queen'){
      // The illuminated crescent wraps around a quiet dark lunar hemisphere.
      rect(-13,-13,26,26,'#544669');rect(-12,-9,7,18,'#d5bbf6');
      rect(-9,-12,17,5,'#d5bbf6');rect(-9,7,17,5,'#d5bbf6');
      rect(-6,-8,5,16,'#b48edb');rect(-1,-8,14,16,'#544669');
      rect(-10,-5,3,3,'#8e6caf');rect(-7,5,3,3,'#ead8ff');
    }else if(kind==='storm_reaper'){
      // Layered cloud belts drift gently around a square Great Red Spot.
      const cloudDrift=Math.round(Math.sin(tick*.045)*2);
      rect(-13,-11,26,4,detail);rect(-13,-6,26,2,'#d99656');
      rect(-13,-2,26,5,'#9b582f');rect(-13,6,26,3,detail);
      rect(-11+cloudDrift,-10,10,2,'#ffe0b0');
      rect(-11-cloudDrift,-1,10,2,'#c68a51');rect(-5+cloudDrift,2,8,2,'#a96536');
      rect(-12,9,10,2,'#cf9455');
      // A lighter square storm drifts around the cloud belts, staying inside the body.
      const stormX=Math.round(Math.sin(tick*.02)*8)-4;
      const stormY=Math.round(-3+Math.cos(tick*.02)*5)-4;
      rect(stormX,stormY,8,8,'#d9774d');rect(stormX+2,stormY+2,4,4,'#ffb77b');
      rect(stormX+2,stormY+2,2,2,'#ffe3b5');
    }else if(kind==='devourer'){
      // A large lightless core with a sharp silver lip and detached void fragments.
      rect(-9,-9,18,18,'#646477');rect(-7,-7,14,14,'#020205');
      rect(-9,-9,9,2,'#c0c0d4');rect(5,5,4,4,'#3c3c50');
      const drift=Math.round(Math.sin(tick*.06)*2);
      rect(-22,-4+drift,4,4,'#73738a');rect(19,5-drift,4,4,'#73738a');
    }else if(kind==='frost_warden'){
      rect(-11,-10,22,3,'#4da89a');rect(-7,-3,14,3,detail);
    }else if(kind==='blind_prayer'){
      // Bright stellar inlays frame a darker gold core and a white-hot visor.
      rect(-13,-12,5,3,detail);rect(-13,-12,3,6,detail);
      rect(8,8,5,3,detail);rect(10,5,3,6,detail);
      rect(-3,-10,6,20,'#8f7428');rect(-10,-3,20,6,'#8f7428');
      rect(-4,-4,8,8,'#675021');rect(-2,-2,4,4,'#4e411d');
    }else if(kind==='sea_chanter'){
      rect(-13,-10,26,3,'#4c80d9');rect(-13,4,26,3,'#234e9d');
      const drift=Math.round(Math.sin(tick*.08)*2)*2;
      rect(-11+drift,-7,15,4,'#8ec9f4');rect(-4-drift,1,13,4,'#559ee6');
      rect(-10,8,17,3,'#70b5ee');rect(-7+drift,-6,4,2,'#d4f0ff');
      rect(-22,-5,5,10,'#4483ef');rect(17,-5,5,10,'#4483ef');
      rect(-21,-3,2,6,detail);rect(19,-3,2,6,detail);
    }else if(kind==='astral_twins'){
      // A coral/blue split rim and two half-star emblems joined at a pale seam.
      rect(14,-18,4,36,'#7fb4ff');rect(-18,14,32,4,'#7fb4ff');
      rect(-9,-2,9,4,'#ffb39f');rect(-5,-7,5,14,'#ffb39f');
      rect(0,-2,9,4,'#a9d4ff');rect(0,-7,5,14,'#a9d4ff');rect(-1,-9,2,18,'#ffffff');
    }else if(kind==='aegis_sentinel'){
      // Venus's sideways-Y cloud chevron drifts over a rose cloud deck.
      rect(-13,-11,26,3,'#b98a7c');rect(-13,8,26,3,'#b98a7c');
      const drift=Math.round(Math.sin(tick*.05)*2);
      rect(-11+drift,-7,8,3,detail);rect(-4+drift,-4,7,3,detail);rect(2+drift,-1,9,3,'#fbe7d8');
      rect(-4+drift,2,7,3,detail);rect(-11+drift,5,8,3,detail);rect(5+drift,-1,3,3,'#fff6ec');
    }else if(kind==='thorn_weaver'){
      // Blue oceans, green land and pale polar caps inside Gaia's green suit rim.
      rect(-13,-13,26,26,'#345b88');rect(-8,-12,16,3,'#d4edce');
      rect(-11,-8,10,5,'#9dc778');rect(-8,-3,6,6,'#9dc778');
      rect(-5,2,4,5,'#719e55');rect(3,1,8,4,'#b5d68c');rect(6,5,4,5,'#b5d68c');
      rect(-6,10,13,3,'#b8dbbd');
    }
  }
  if(layer==='front' && kind==='splitter_queen'){
    // One small crescent beside the helmet antenna.
    rect(6,-28,4,10,detail);rect(9,-31,6,4,detail);rect(9,-20,6,4,detail);
  }
  if(layer==='front' && kind==='aegis_sentinel'){
    // A small stepped mirror facet beside the antenna.
    ctx.shadowColor='#f5dcc8';ctx.shadowBlur=4;
    rect(-10,-30,3,3,'#fff6ec');rect(-13,-27,9,3,detail);rect(-10,-24,3,3,'#c99482');rect(-10,-27,3,3,'#ffffff');
  }
  if(layer==='front' && kind==='blind_prayer'){
    // The antenna tip becomes a bright, block-built stellar crest.
    ctx.shadowColor='#fff0a8';ctx.shadowBlur=5;
    rect(-1,-30,3,11,'#fff4b8');rect(-5,-26,11,3,'#fff4b8');rect(-1,-26,3,3,'#ffffff');
  }
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, sx: number, sy: number, state: GameState, tickN: number, chargingMs = 0) {
  sx=Math.round(sx);sy=Math.round(sy);
  const shielded = state.playerShieldHP > 0;
  const energyFull = state.starEnergy >= STAR_ENERGY_MAX || state.poweredTicks > 0;
  if (energyFull) drawFullEnergyAura(ctx, sx, sy, tickN, state.poweredTicks > 0);

  const speeding = state.speedActiveTicks > 0;
  const carrying = state.playerCarryingRuby;
  const celestialKind = carrying ? null : state.specialSkill;
  const celestial = celestialKind ? SPECIAL_SKILLS[celestialKind] : null;
  const palette = celestialKind ? PLAYER_CELESTIAL_PALETTES[celestialKind] : null;
  const suitColor = carrying ? '#ff3366' : celestial?.color ?? (speeding ? '#00ffee' : '#d8d870');
  const suitDark = carrying ? '#aa0033' : palette?.panel ?? (speeding ? '#00aaaa' : '#a0a040');
  const glowColor = carrying ? '#ff1155' : celestial?.color ?? (speeding ? '#00ffee' : '#eeee44');
  const visorColor = carrying ? '#ff88aa' : palette?.visor ?? (speeding ? '#ffffff' : '#44ccff');

  // Shrink on laser fire
  const laserFired = state.laserCooldown >= LASER_COOLDOWN - 10;
  const laserShrink = laserFired
    ? 0.75 + 0.25 * (1 - (state.laserCooldown - (LASER_COOLDOWN - 10)) / 10)
    : 1.0;

  // Shrink on bullet fire
  const bulletShrink = state.bulletCooldown > 0
    ? 0.8 + 0.2 * (1 - state.bulletCooldown / BULLET_COOLDOWN)
    : 1.0;

  // Gradually shrink to tiny while charging (200ms → full charge collapses to 30%) — full
  // charge takes longer while chilled by a Frost Warden sharing the player's chamber
  const waveChargeMs = isPlayerChilled(state) ? 1500 : 1000;
  const chargeProgress = (chargingMs >= 200 && state.waveCooldown <= 0)
    ? Math.min(1, (chargingMs - 200) / (waveChargeMs - 200))
    : 0;
  const chargeShrink = 1 - chargeProgress * 0.70;
  const castProgress=state.playerCastTicks>0?1-state.playerCastTicks/24:1;
  const castPulse=state.playerCastTicks>0?Math.sin(castProgress*Math.PI):0;
  const recovery=Math.max(0,(castProgress-.3)/.7);
  const castScale=castProgress<.3?1-castProgress*.7:.79+.21*recovery+Math.sin(recovery*Math.PI)*.18;
  const scaleFactor = Math.min(laserShrink, chargeShrink, bulletShrink)*castScale;

  const sz = Math.floor(TILE_SIZE * 0.74 * scaleFactor);
  const h = Math.floor(sz / 2);
  const { playerDirX: dx, playerDirY: dy } = state;

  if(state.playerCastTicks>0 && state.playerCastKind){
    const castColor=state.playerCastKind==='bomb'?'#ff9b45':state.playerCastKind==='devourer'?'#c6c6df':SPECIAL_SKILLS[state.playerCastKind].color;
    ctx.save();ctx.globalAlpha=castPulse*.85;ctx.shadowColor=castColor;ctx.shadowBlur=10;
    ctx.strokeStyle=castColor;ctx.lineWidth=3;
    const radius=h+5+Math.round(castProgress*16),arm=8;
    for(const sideX of [-1,1])for(const sideY of [-1,1]){
      ctx.beginPath();ctx.moveTo(sx+sideX*(radius-arm),sy+sideY*radius);ctx.lineTo(sx+sideX*radius,sy+sideY*radius);ctx.lineTo(sx+sideX*radius,sy+sideY*(radius-arm));ctx.stroke();
    }
    for(const [rx,ry]of [[0,-1],[1,0],[0,1],[-1,0]])drawEnergyPixelRay(ctx,sx+rx*(radius+8),sy+ry*(radius+8),rx,ry,castColor,.75);
    ctx.restore();
  }

  if(celestialKind){
    drawPlayerCelestialFeature(ctx,celestialKind,sx,sy,sz,'back',tickN);
    ctx.save();ctx.globalAlpha=.45;ctx.fillStyle=celestialKind==='devourer'?'#aaaab6':celestial!.color;
    for(let i=0;i<3;i++){const angle=tickN*.025+i*Math.PI*2/3,r=h+12;ctx.fillRect(sx+Math.cos(angle)*r,sy+Math.sin(angle)*r,2,2);}ctx.restore();
  }

  // Original luminous suit: one colored square rim and a flat darker panel.
  const burstGlow=state.speedFlashTicks>0?Math.floor(12*state.speedFlashTicks/30):0;
  ctx.shadowColor=glowColor;ctx.shadowBlur=speeding?(burstGlow||8):14;

  ctx.fillStyle = suitColor;
  ctx.fillRect(sx - h, sy - h, sz, sz);
  ctx.shadowBlur = 0;

  // ── Inner suit detail — slightly darker inset panel ───────────────────
  const pad = Math.max(2, Math.floor(sz * 0.12));
  ctx.fillStyle = suitDark;
  ctx.fillRect(sx - h + pad, sy - h + pad, sz - pad * 2, sz - pad * 2);
  if(celestialKind)drawPlayerCelestialFeature(ctx,celestialKind,sx,sy,sz,'body',tickN);

  // ── Helmet / visor on the facing side ────────────────────────────────
  const vw = Math.floor(sz * 0.56); // visor width
  const vh = Math.floor(sz * 0.30); // visor height
  let vx = sx - vw / 2, vy = sy - vh / 2;

  if (dx === 1) { vx = sx + h - pad - Math.floor(vh * 0.1) - vh; vy = sy - vw / 2; }
  else if (dx === -1) { vx = sx - h + pad + Math.floor(vh * 0.1); vy = sy - vw / 2; }
  else if (dy === -1) { vx = sx - vw / 2; vy = sy - h + pad + Math.floor(vh * 0.1); }
  else { vx = sx - vw / 2; vy = sy + h - pad - Math.floor(vh * 0.1) - vh; }

  const vwFinal = (dx !== 0) ? vh : vw;
  const vhFinal = (dx !== 0) ? vw : vh;

  ctx.shadowColor=visorColor;ctx.shadowBlur=10;ctx.fillStyle=visorColor+'cc';
  ctx.fillRect(vx,vy,vwFinal,vhFinal);
  ctx.fillStyle='#ffffff55';ctx.fillRect(vx+1,vy+1,Math.floor(vwFinal*.4),Math.floor(vhFinal*.4));ctx.shadowBlur=0;

  const antH = Math.max(3, Math.floor(sz * 0.22));
  ctx.fillStyle = suitColor;
  ctx.fillRect(sx - 1, sy - h - antH, 2, antH);
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - 2, sy - h - antH - 2, 4, 4);
  ctx.shadowBlur = 0;

  if(celestialKind)drawPlayerCelestialFeature(ctx,celestialKind,sx,sy,sz,'front',tickN);

  // ── Wave charge ring ──────────────────────────────────────────────────
  if(chargingMs>=40&&state.waveCooldown<=0){
    drawPlayerCharge(ctx,sx,sy,h,Math.min(1,chargingMs/waveChargeMs),tickN);
  }

  // Blue shield from Armored kills; teal is reserved for Ruby protection.
  if (shielded) {
    if(state.playerSaturnShield)drawSaturnShield(ctx,sx,sy,TILE_SIZE*.62,tickN);
    else drawRewardShield(ctx, sx, sy, TILE_SIZE * 0.6, tickN, '#4488ff');
  }
  if(state.venusVeilTicks>0)drawVenusVeil(ctx,sx,sy,TILE_SIZE*(carrying?.88:.68),tickN,state.venusVeilTicks);
  if (carrying && state.rubyShieldHP > 0) {
    if(state.rubySaturnShield)drawSaturnShield(ctx,sx,sy,TILE_SIZE*.82,tickN);
    else drawRewardShield(ctx, sx, sy, TILE_SIZE * 0.85, tickN, '#00ddcc');
  }
  if (state.runnerEnergyFlashTicks > 0) {
    ctx.save();
    const progress = 1 - state.runnerEnergyFlashTicks / 60;
    ctx.globalAlpha = Math.min(1, state.runnerEnergyFlashTicks / 15);
    const directions=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
    ctx.shadowColor='#ed9a61';ctx.shadowBlur=5;
    for(const [dx,dy] of directions){
      const radius=21+Math.floor(progress*8)*3;
      drawEnergyPixelRay(ctx,sx+dx*radius,sy+dy*radius,dx,dy,'#ed9a61');
    }
    ctx.restore();
  }

  // Blind Prayer's curse: paired block arrows point opposite ways around the player.
  if (isMovementReversed(state)) {
    ctx.save();
    ctx.fillStyle = '#ffdd22'; ctx.shadowColor = '#ffdd22'; ctx.shadowBlur = 6;
    ctx.globalAlpha = 0.65 + 0.25 * Math.abs(Math.sin(tickN * 0.08));
    for (const direction of [-1, 1]) {
      const ax = Math.round(sx + direction * TILE_SIZE * 0.8);
      const ay = Math.round(sy);
      ctx.fillRect(ax - 5, ay - 2, 10, 4);
      ctx.fillRect(ax + direction * 5 - 2, ay - 6, 4, 12);
      ctx.fillRect(ax + direction * 9 - 2, ay - 2, 4, 4);
    }
    ctx.restore();
  }

  if (state.thornPoisonTicks > 0) {
    ctx.save(); ctx.shadowColor = '#88bc45'; ctx.shadowBlur = 6;
    for (let i = 0; i < 5; i++) {
      const life = ((tickN + i * 13) % 55) / 55;
      ctx.globalAlpha = (1 - life) * 0.8; ctx.fillStyle = i % 2 ? '#d8ef9b' : '#88bc45';
      ctx.fillRect(Math.round(sx - 24 + i * 11), Math.round(sy + 19 - life * 46), 4, 5);
    }
    // A small leaf beside the suit indicates lingering poison without status text.
    ctx.globalAlpha = 0.8; ctx.fillStyle = '#88bc45'; ctx.fillRect(sx - 39, sy - 6, 8, 8); ctx.fillRect(sx - 35, sy + 2, 3, 8);
    ctx.fillStyle = '#d8ef9b'; ctx.fillRect(sx - 37, sy - 4, 3, 3); ctx.restore();
  }

  if(speeding){
    ctx.save();ctx.shadowColor='#60d8c7';ctx.shadowBlur=5;
    for(let i=0;i<3;i++){
      const life=((tickN+i*9)%30)/30,reach=h+9+Math.floor(life*5)*3;
      ctx.globalAlpha=(1-life)*.5;ctx.fillStyle=i%2?'#d7fff4':'#60d8c7';
      const px=Math.round(sx-dx*reach),py=Math.round(sy-dy*reach);
      ctx.fillRect(px-(dx?3:9),py-(dy?3:9),dx?6:18,dy?6:18);
    }
    ctx.restore();
  }
  // Small separated pixel bolts replace the Sniper buff's broad glowing box.
  if(state.electricBuffTicks>0){
    ctx.save();ctx.shadowColor='#e6cf65';ctx.shadowBlur=5;
    for(let i=0;i<4;i++){
      const angle=i*Math.PI/2,reach=h+(shielded?19:12);
      ctx.globalAlpha=.45+.35*Math.abs(Math.sin(tickN*.13+i));
      drawPixelBolt(ctx,Math.round(sx+Math.cos(angle)*reach),Math.round(sy+Math.sin(angle)*reach),16,i%2?'#fff1ac':'#dabc56');
    }
    ctx.restore();
  }

}

const PRAYER_GLYPHS = [
  [[-1, -6, 2, 13], [-5, -6, 4, 2], [-5, -8, 2, 4], [1, -3, 4, 2], [3, -5, 2, 4], [-3, 5, 6, 2]],
  [[-5, -8, 10, 2], [-5, -8, 2, 12], [3, -4, 2, 12], [-1, -2, 6, 2], [-5, 6, 4, 2]],
  [[-3, -8, 2, 16], [3, -6, 2, 10], [-5, -6, 10, 2], [-3, 0, 8, 2], [-1, 6, 6, 2]],
];

function drawPrayerGlyph(ctx: CanvasRenderingContext2D, glyph: number, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0;
  for (const [dx, dy, width, height] of PRAYER_GLYPHS[glyph % PRAYER_GLYPHS.length]) {
    ctx.fillRect(Math.round(x) + dx, Math.round(y) + dy, width, height);
  }
  ctx.restore();
}

function drawBlockRing(ctx: CanvasRenderingContext2D, x: number, y: number, radiusX: number, radiusY: number, color: string, light: string, alpha: number) {
  ctx.save();const grid=Math.max(radiusX,radiusY)>90?12:6,rx=Math.max(grid,Math.round(radiusX/grid)*grid),ry=Math.max(grid,Math.round(radiusY/grid)*grid);
  const span=(py:number)=>Math.abs(py)>ry?-grid:Math.floor(Math.sqrt(Math.max(0,1-(py/ry)**2))*rx/grid)*grid;
  ctx.beginPath();
  for(let py=-ry;py<=ry;py+=grid){
    const outer=span(py),inner=Math.min(outer-grid,span(py-grid),span(py+grid));
    if(inner<0)ctx.rect(Math.round(x-outer-grid/2),Math.round(y+py-grid/2),outer*2+grid,grid);
    else{
      const edge=outer-inner;ctx.rect(Math.round(x-outer-grid/2),Math.round(y+py-grid/2),edge,grid);
      ctx.rect(Math.round(x+inner+grid/2),Math.round(y+py-grid/2),edge,grid);
    }
  }
  ctx.globalAlpha=alpha*.5;ctx.shadowColor=color;ctx.shadowBlur=6;ctx.fillStyle=color;ctx.fill();
  ctx.globalAlpha=alpha*.9;ctx.shadowBlur=5;ctx.fill();
  ctx.globalAlpha=alpha*.9;ctx.fillStyle=light;ctx.shadowColor=light;ctx.shadowBlur=6;
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])ctx.fillRect(Math.round(x+dx*rx-3),Math.round(y+dy*ry-3),6,6);
  ctx.restore();
}

function drawPrayerCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, tickN: number, alpha: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  ctx.globalAlpha=alpha;ctx.shadowColor='#ffc34d';ctx.shadowBlur=4;
  const half=Math.round(radius*.7),arm=Math.max(10,Math.min(30,radius*.2));
  // An open square seal with four outward-facing light spears.
  ctx.strokeStyle='#dca647';ctx.lineWidth=4;
  for(const sx of [-1,1])for(const sy of [-1,1]){
    ctx.beginPath();ctx.moveTo(sx*(half-arm),sy*half);ctx.lineTo(sx*half,sy*half);ctx.lineTo(sx*half,sy*(half-arm));ctx.stroke();
  }
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
    for(let i=0;i<3;i++){
      const distance=radius*(.48+i*.2),length=Math.max(6,Math.round(radius*.12));
      ctx.fillStyle=i===2?'#fff6cf':'#eebf56';
      ctx.fillRect(Math.round(dx*distance)-(dx?length/2:3),Math.round(dy*distance)-(dy?length/2:3),dx?length:6,dy?length:6);
    }
  }
  ctx.fillStyle='#fff5cb';ctx.fillRect(-9,-3,18,6);ctx.fillRect(-3,-9,6,18);
  ctx.restore();
}

function drawAttackFootprint(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number, glintTick?: number) {
  ctx.save();ctx.shadowBlur=0;const grid=24,extent=Math.ceil(radius/grid),inside=(a:number,b:number)=>Math.hypot(a*grid,b*grid)<=radius;
  ctx.translate(Math.round(x),Math.round(y));ctx.fillStyle=color;
  for(let row=-extent;row<=extent;row++)for(let col=-extent;col<=extent;col++){
    if(!inside(col,row))continue;
    const px=col*grid-grid/2,py=row*grid-grid/2;
    ctx.globalAlpha=alpha*.14;ctx.fillRect(px,py,grid,grid);
    ctx.globalAlpha=alpha*.65;
    if(!inside(col-1,row))ctx.fillRect(px,py,3,grid);
    if(!inside(col+1,row))ctx.fillRect(px+grid-3,py,3,grid);
    if(!inside(col,row-1))ctx.fillRect(px,py,grid,3);
    if(!inside(col,row+1))ctx.fillRect(px,py+grid-3,grid,3);
  }
  // Optional star glints turn a water footprint into a cosmic tide.
  if(glintTick!==undefined)for(let i=0;i<7;i++){
    const a=i*2.4,d=radius*(.25+(i*.37)%.6),twinkle=(i+Math.floor(glintTick/6))%3===0;
    const gx=Math.round(Math.cos(a)*d/3)*3,gy=Math.round(Math.sin(a)*d/3)*3;
    ctx.globalAlpha=alpha*(twinkle?.95:.45);ctx.fillStyle=twinkle?'#ffffff':'#bfe6ff';
    ctx.fillRect(gx-3,gy-1,7,2);ctx.fillRect(gx-1,gy-3,2,7);
  }
  ctx.restore();
}

function drawSeaRipple(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number, tick: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.globalAlpha=alpha;
  const half=Math.round(radius*.7);ctx.shadowColor='#408eff';ctx.shadowBlur=3;ctx.strokeStyle='#56adf2';ctx.lineWidth=5;
  ctx.strokeRect(-half,-half,half*2,half*2);ctx.shadowBlur=0;ctx.fillStyle='#d5f7ff';
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])ctx.fillRect(dx*half-4,dy*half-4,8,8);
  ctx.restore();
}

function drawChanterWave(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, tick: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  const length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length;
  // Three spaced sonic fronts, built from axis-aligned pixels in every direction.
  for(let front=2;front>=0;front--){
    ctx.globalAlpha=1-front*.25;ctx.shadowColor='#419aff';ctx.shadowBlur=front?2:4;
    for(let step=-3;step<=3;step++){
      const along=-front*18-Math.abs(step)*5,across=step*7;
      const px=Math.round((ux*along-uy*across)/3)*3,py=Math.round((uy*along+ux*across)/3)*3;
      ctx.fillStyle=front?'#397ed4':Math.abs(step)<2?'#e3fbff':'#70c9ff';ctx.fillRect(px-3,py-3,7,7);
    }
  }
  ctx.globalAlpha=.7;ctx.shadowBlur=0;ctx.fillStyle='#2b5c9b';
  for(let i=0;i<4;i++){const distance=60+((tick+i*13)%40);ctx.fillRect(Math.round(-ux*distance/3)*3,Math.round(-uy*distance/3)*3,4,4);}
  ctx.restore();
}

function drawThornGround(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tickN: number) {
  ctx.save();
  const areas = (state.thornPatches ?? []).map(p => ({ x: p.x, y: p.y, ticks: p.ticks, radius: p.radius ?? THORN_RADIUS, warning: false }));
  for (const e of state.enemies) {
    if (e.type === 'thorn_weaver' && e.hp > 0 && (e.thorn?.windupTicks ?? 0) > 0)
      areas.push({ x: e.thorn!.aimX, y: e.thorn!.aimY, ticks: e.thorn!.windupTicks, radius: THORN_RADIUS, warning: true });
    if (e.type === 'thorn_weaver' && e.hp > 0 && (e.thorn?.windupTicks ?? 0) > 0 && e.thorn!.aim2) // Gaia phase 3 twin cast
      areas.push({ x: e.thorn!.aim2.x, y: e.thorn!.aim2.y, ticks: e.thorn!.windupTicks, radius: THORN_RADIUS, warning: true });
  }
  for (const rawArea of areas) {
    const bounds=getThornFieldBounds(rawArea.x,rawArea.y,rawArea.radius),area={...rawArea,x:bounds.x,y:bounds.y};
    ctx.save();ctx.beginPath();
    for(let ty=bounds.top/TILE_SIZE;ty<bounds.bottom/TILE_SIZE;ty++)for(let tx=bounds.left/TILE_SIZE;tx<bounds.right/TILE_SIZE;tx++){
      if((state.map[ty]?.[tx]??T_WALL)!==T_WALL)ctx.rect(tx*TILE_SIZE-camX,ty*TILE_SIZE-camY,TILE_SIZE,TILE_SIZE);
    }
    ctx.clip();
    const age = area.warning ? 0 : THORN_LIFETIME - area.ticks;
    const fade = area.warning ? 1 : Math.min(1, area.ticks / 90);
    const growth = area.warning ? 0 : Math.min(1, age / 24);
    const progress = area.warning ? 1 - area.ticks / THORN_WINDUP : 1;
    // A continuous translucent wash tints floor tiles, keeping walls clear and no grid seams.
    ctx.globalAlpha = fade * (area.warning ? .09 + progress * .05 : .26);
    ctx.fillStyle = area.warning ? '#b5bd50' : '#729d3d'; // the defence field shares the normal field's green
    for(let ty=bounds.top/TILE_SIZE;ty<bounds.bottom/TILE_SIZE;ty++){
      for(let tx=bounds.left/TILE_SIZE;tx<bounds.right/TILE_SIZE;tx++){
        if((state.map[ty]?.[tx] ?? T_WALL)!==T_WALL)ctx.fillRect(tx*TILE_SIZE-camX,ty*TILE_SIZE-camY,TILE_SIZE,TILE_SIZE);
      }
    }
    // One simple thorn sprout per tile, matching the plain overgrowth style: a stem that grows in, then a pale tip.
    for(let ty=bounds.top/TILE_SIZE;!area.warning&&ty<bounds.bottom/TILE_SIZE;ty++)for(let tx=bounds.left/TILE_SIZE;tx<bounds.right/TILE_SIZE;tx++){
      if((state.map[ty]?.[tx]??T_WALL)===T_WALL)continue;
      const n=Math.sin(tx*127.1+ty*311.7)*43758.5453,h=n-Math.floor(n);
      const x=tx*TILE_SIZE-camX+12+Math.floor(h*22),y=ty*TILE_SIZE-camY+34,height=Math.round(18*growth);
      ctx.globalAlpha=fade;ctx.fillStyle='#4f8f3c';ctx.fillRect(x-3,y-height,6,height);
      ctx.fillStyle='#85c76a';ctx.fillRect(x+3,y-Math.round(height*.6),6,4);
      if(height>6){ctx.fillStyle='#e0f4a8';ctx.fillRect(x-2,y-height-4,4,4);}
    }
    // One luminous boundary marks the actual walkable hazard tiles.
    ctx.globalAlpha=fade*(area.warning?.6+progress*.3:.45);ctx.strokeStyle=area.warning?'#ffd68b':'#99cf68';ctx.shadowColor=area.warning?'#ffbc65':'#88bc45';ctx.shadowBlur=4;ctx.lineWidth=3;
    const floor=(tx:number,ty:number)=>tx>=bounds.left/TILE_SIZE&&tx<bounds.right/TILE_SIZE&&ty>=bounds.top/TILE_SIZE&&ty<bounds.bottom/TILE_SIZE&&(state.map[ty]?.[tx]??T_WALL)!==T_WALL;
    ctx.beginPath();
    for(let ty=bounds.top/TILE_SIZE;ty<bounds.bottom/TILE_SIZE;ty++)for(let tx=bounds.left/TILE_SIZE;tx<bounds.right/TILE_SIZE;tx++){
      if(!floor(tx,ty))continue;const x=tx*TILE_SIZE-camX,y=ty*TILE_SIZE-camY;
      if(!floor(tx-1,ty)){ctx.moveTo(x+1,y);ctx.lineTo(x+1,y+TILE_SIZE);}
      if(!floor(tx+1,ty)){ctx.moveTo(x+TILE_SIZE-1,y);ctx.lineTo(x+TILE_SIZE-1,y+TILE_SIZE);}
      if(!floor(tx,ty-1)){ctx.moveTo(x,y+1);ctx.lineTo(x+TILE_SIZE,y+1);}
      if(!floor(tx,ty+1)){ctx.moveTo(x,y+TILE_SIZE-1);ctx.lineTo(x+TILE_SIZE,y+TILE_SIZE-1);}
    }
    ctx.stroke();ctx.shadowBlur=0;
    if (area.warning) {
      const x = Math.round(area.x - camX), y = Math.round(area.y - camY), size = 14 + Math.round(progress * 10);
      ctx.globalAlpha = 0.7 + Math.sin(tickN * 0.15) * 0.2; ctx.strokeStyle = '#ffd68b'; ctx.lineWidth = 3;
      ctx.strokeRect(x - size, y - size, size * 2, size * 2);
      ctx.fillStyle = '#ffd68b'; ctx.fillRect(x - 2, y - 10, 4, 14); ctx.fillRect(x - 2, y + 8, 4, 4);
    }
    ctx.restore();
    // Airborne seed is drawn outside the ground clip so its descent starts above the field.
    if(area.warning && area.ticks <= 30){
      const fall=1-area.ticks/30, x=Math.round(area.x-camX), groundY=Math.round(area.y-camY);
      const y=Math.round(groundY-220*(1-fall*fall));
      ctx.save();ctx.shadowBlur=0;
      // Growing square landing shadow anchors the falling object to the marked floor.
      ctx.globalAlpha=.15+fall*.25;ctx.fillStyle='#132b16';
      const shadow=7+fall*8;ctx.fillRect(x-shadow,groundY-shadow*.35,shadow*2,shadow*.7);
      // A compact orbital energy bolt: stepped plasma tail and a pale luminous core.
      ctx.shadowColor='#a7e66c';ctx.shadowBlur=9;
      for(let i=4;i>=1;i--){
        ctx.globalAlpha=(5-i)*.12;ctx.fillStyle=i%2?'#88bc45':'#c9ed9a';
        ctx.fillRect(x-4-i,y-i*13,8+i*2,12);
      }
      ctx.globalAlpha=.35;ctx.fillStyle='#88bc45';ctx.fillRect(x-10,y-22,20,31);
      ctx.globalAlpha=1;ctx.fillStyle='#a9d866';ctx.fillRect(x-6,y-17,12,24);
      ctx.shadowBlur=3;ctx.fillStyle='#eaffc8';ctx.fillRect(x-3,y-15,6,23);
      ctx.fillStyle='#ffffff';ctx.fillRect(x-2,y-3,4,13);
      ctx.shadowBlur=0;ctx.fillStyle='#bb688b';ctx.fillRect(x-7,y-8,2,5);ctx.fillRect(x+5,y-8,2,5);
      ctx.restore();
    }else if(!area.warning && age<16){
      const hit=age/16,x=area.x-camX,y=area.y-camY;
      ctx.save();ctx.globalAlpha=(1-hit)*.8;ctx.shadowBlur=0;
      for(let i=0;i<8;i++){
        const angle=i*Math.PI/4, r=10+hit*30;
        ctx.fillStyle=i%2?'#7e9c43':'#b9cb87';
        ctx.fillRect(Math.round(x+Math.cos(angle)*r),Math.round(y+Math.sin(angle)*r*.5-Math.sin(hit*Math.PI)*13),4,5);
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawSeaSongEffects(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tickN: number) {
  ctx.save(); ctx.shadowColor = '#3998d6'; ctx.shadowBlur = 8;
  for (const e of state.enemies) {
    if (e.type !== 'sea_chanter' || e.hp <= 0 || !e.sea) continue;
    const sea = e.sea, x = e.x - camX, y = e.y - camY;
    if (sea.supportPulseTicks > 0) {
      const size = (1 - sea.supportPulseTicks / 24) * SEA_ALLY_HEAL_RADIUS * TILE_SIZE;
      ctx.globalAlpha = sea.supportPulseTicks / 48; ctx.strokeStyle = '#8dc9f0';
      ctx.lineWidth = 3; ctx.strokeRect(x - size, y - size, size * 2, size * 2);
    }
    if (sea.resurfaceTicks > 0) {
      const progress = 1 - sea.resurfaceTicks / 36;
      const rx = sea.resurfaceX - camX, ry = sea.resurfaceY - camY;
      drawSeaRipple(ctx, rx, ry + 12, 30 + progress * 95, (1 - progress) * 0.9, tickN);
      drawSeaRipple(ctx, rx, ry + 12, 20 + progress * 60, (1 - progress) * 0.6, tickN);
      // Eight 12px droplets rise and fall around the emergence point.
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4, radius = 30 * progress + 10;
        const px = Math.round((rx + Math.cos(angle) * radius) / 6) * 6;
        const py = Math.round((ry + 12 + Math.sin(angle) * radius * 0.5 - Math.sin(progress * Math.PI) * 30) / 6) * 6;
        ctx.globalAlpha = (1 - progress) * 0.9; ctx.fillStyle = i % 2 ? '#68b7f2' : '#d6eeff'; ctx.fillRect(px - 6, py - 6, 12, 12);
      }
    }
    if (sea.songWindupTicks <= 0) continue;
    const progress = 1 - sea.songWindupTicks / SEA_SONG_WINDUP;
    drawAttackFootprint(ctx,sea.songAimX-camX,sea.songAimY-camY,SEA_SONG_BLAST_RADIUS,'#579fe9',.5+progress*.4);
    drawSeaRipple(ctx, sea.songAimX - camX, sea.songAimY - camY, 20+progress*30, .5+progress*.4, tickN);
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 3; i++) {
      const nx=x-18+i*18,height=8+Math.round((.5+.5*Math.sin(tickN*.18+i))*18);
      ctx.fillStyle='#60a7e5';ctx.fillRect(nx-3,y-38-height,6,height);ctx.fillStyle='#e3f9ff';ctx.fillRect(nx-3,y-38-height,6,4);
    }
  }
  ctx.lineWidth = 4;
  for(const wave of state.seaSongWaves??[]){
    drawAttackFootprint(ctx,wave.aimX-camX,wave.aimY-camY,SEA_SONG_BLAST_RADIUS,'#579fe9',.6);
    drawChanterWave(ctx,wave.x-camX,wave.y-camY,wave.dx,wave.dy,tickN);
  }
  for(const burst of state.seaSongBursts??[]){
    const progress=1-burst.ticks/SEA_SONG_BLAST_TICKS,x=burst.x-camX,y=burst.y-camY,fade=1-progress;
    drawAttackFootprint(ctx,x,y,SEA_SONG_BLAST_RADIUS,'#579fe9',fade*.65);
    drawSeaRipple(ctx,x,y,SEA_SONG_BLAST_RADIUS*(.3+progress*.7),fade,tickN);
    drawSeaRipple(ctx,x,y,SEA_SONG_BLAST_RADIUS*progress*.75,fade*.5,tickN);
    ctx.save();
    // Eight 12px droplets thrown outward on a short arc (no tall columns).
    ctx.shadowBlur=0;
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,r=SEA_SONG_BLAST_RADIUS*(.2+progress*.6),lift=Math.sin(progress*Math.PI)*18;
      const px=Math.round((x+Math.cos(a)*r)/6)*6,py=Math.round((y+Math.sin(a)*r*.8-lift)/6)*6;
      ctx.globalAlpha=fade*.9;ctx.fillStyle=i%2?'#68b7f2':'#d6eeff';ctx.fillRect(px-6,py-6,12,12);
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawPrayerMagic(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tickN: number) {
  const boss = state.enemies.find(e => e.type === 'blind_prayer');
  if (boss && (boss.prayer?.escapeWindupTicks ?? 0) > 0) {
    const progress = 1 - boss.prayer!.escapeWindupTicks / PRAYER_ESCAPE_WINDUP;
    drawAttackFootprint(ctx,boss.x-camX,boss.y-camY,ENEMY_CONFIGS.blind_prayer.attackRange*TILE_SIZE,'#e8bd5c',.45+progress*.4);
    drawPrayerCircle(ctx, boss.x - camX, boss.y - camY,
      ENEMY_CONFIGS.blind_prayer.attackRange * TILE_SIZE, tickN, 0.25 + progress * 0.5);
  }
  for (const wave of state.prayerWaves ?? []) {
    const progress = 1 - wave.ticks / 30;
    drawPrayerCircle(ctx, wave.x - camX, wave.y - camY,
      wave.radius * (0.2 + progress * 0.8), tickN, wave.ticks / 30);
  }
}

function drawKingArenaEffects(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number) {
  const warning = state.enemies.find(e => e.type === 'fiery_king' && e.hp > 0)?.king?.arenaWindupTicks ?? 0;
  const pulse = (state.kingArenaPulseTicks ?? 0) / KING_ARENA_FX_TICKS;
  if (!warning && pulse <= 0) return;
  ctx.save();
  const charge = warning ? 1 - warning / KING_ARENA_WINDUP : 0;
  ctx.fillStyle = `rgba(255,55,0,${warning ? 0.025 + charge * 0.045 : pulse * 0.18})`;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = `rgba(255,100,30,${warning ? 0.35 + charge * 0.4 : pulse * 0.9})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, width - 8, height - 8);
  if(warning){
    // Small warm cinders gather at the edges as the existing warning builds.
    for(let i=0;i<12;i++){
      const life=((state.gameTick+i*23)%100)/100,x=((i*131)%997)/997*width;
      ctx.globalAlpha=charge*Math.sin(life*Math.PI)*.45;ctx.fillStyle=i%3?'#ff9740':'#ffd68b';
      ctx.fillRect(x,height-8-life*(14+charge*25),3,5);
    }
    ctx.globalAlpha=1;
  }
  if (pulse > 0) {
    const spread=1-pulse;
    // Short staggered flame tongues replace the evenly spaced impact dots.
    for(let i=0;i<32;i++){
      const x=Math.round(((i*137.5)%997)/997*width),y=Math.round(((i*241.3)%991)/991*height);
      const burn=Math.max(0,Math.sin(Math.min(1,spread*1.8+(i%5)*.07)*Math.PI));
      const h=8+burn*(10+i%4*5),lift=spread*18;
      ctx.globalAlpha=pulse*.35;ctx.fillStyle='#ef5918';ctx.fillRect(x-5,y-lift-h,10,h);
      ctx.globalAlpha=pulse*.55;ctx.fillStyle='#ffab32';ctx.fillRect(x-3,y-lift-h-4,6,h);
      ctx.shadowColor='#ffab32';ctx.shadowBlur=6;ctx.fillStyle='#ffe4a0';ctx.fillRect(x-1,y-lift-h+3,3,Math.max(3,h*.4));
    }
    // Two soft open square fronts ripple outward with the fire release.
    for(let i=0;i<2;i++){
      const front=Math.min(1,spread*1.7+i*.18);
      ctx.globalAlpha=pulse*(1-front)*.4;ctx.strokeStyle=i?'#ffd085':'#ff7d29';ctx.lineWidth=3;
      ctx.strokeRect(width*.5*(1-front),height*.5*(1-front),width*front,height*front);
    }
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

// Extra attack accents share the beam lifetime: cosmetic, bounded, and paused with combat.
// Enemy beams match the player laser: straight layered bands with a bright core; only the outer band glows, lightly.
function drawEnemyLaser(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, fade: number, colors: readonly string[], widths: readonly number[]) {
  ctx.save();ctx.lineCap='square';ctx.shadowColor=colors[0];
  [[widths[0],colors[0],.4,6],[widths[1],colors[1],.9,0],[widths[2],colors[2],1,0]].forEach(([w,c,a,g])=>{
    ctx.globalAlpha=fade*(a as number);ctx.shadowBlur=g as number;ctx.strokeStyle=c as string;ctx.lineWidth=w as number;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  });
  ctx.restore();
}

function drawBossBeam(ctx: CanvasRenderingContext2D, kind: 'king'|'queen'|'devourer'|'warden', fromX: number, fromY: number, toX: number, toY: number, remaining: number, tick: number) {
  ctx.save();ctx.lineCap='square';const fade=Math.max(0,Math.min(1,remaining)),dx=toX-fromX,dy=toY-fromY,len=Math.hypot(dx,dy)||1;
  const palette={king:['#dc3822','#ff9b35','#fff0ac'],queen:['#bd3ae7','#e99bfa','#ffedff'],devourer:['#6b2fa8','#9bdc65','#e3ffc0'],warden:['#5eaed8','#b5e7fb','#f3fcff']}[kind];
  if(kind==='devourer'){
    // Stepped crescent bites travel down a faint pixel tether, kept axis-aligned like the casts.
    ctx.globalAlpha=fade*.5;ctx.strokeStyle=palette[0];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fromX,fromY);ctx.lineTo(toX,toY);ctx.stroke();
    const ux=dx/len,uy=dy/len;
    for(let i=0;i<5;i++){
      const t=((tick*.04+i*.2)%1),r=12+t*14,cx=fromX+dx*t,cy=fromY+dy*t;
      ctx.globalAlpha=fade*(.65+.35*Math.sin(t*Math.PI));
      for(let k=-4;k<=4;k++){
        const a=k*.36,ax=Math.cos(a)*r,ay=Math.sin(a)*r,px=cx+ux*ax-uy*ay,py=cy+uy*ax+ux*ay;
        ctx.fillStyle=Math.abs(k)<2?palette[2]:Math.abs(k)<4?palette[1]:'#a264cd';ctx.fillRect(Math.round(px/3)*3-4,Math.round(py/3)*3-4,8,8);
      }
      ctx.fillStyle=palette[2];ctx.fillRect(Math.round((cx+ux*r)/3)*3-2,Math.round((cy+uy*r)/3)*3-2,4,4);
    }
  }else{
    const flicker=kind==='king'?.85+.15*Math.abs(Math.sin(tick*.7)):1;
    const widths=kind==='king'?[Math.round(30*flicker),14,5]:kind==='warden'?[16,7,3]:[20,8,3];
    drawEnemyLaser(ctx,fromX,fromY,toX,toY,fade,palette,widths);
    ctx.shadowBlur=0;
    // Snapped plasma, jewel or ice fragments travel along each beam.
    for(let i=0;i<6;i++){
      const t=((tick*.025+i/6)%1),offset=Math.round((kind==='king'?Math.sin(i*2.4+tick*.1)*12:Math.sin(t*Math.PI*4+tick*.12)*(kind==='queen'?9:5))/3)*3;
      const x=fromX+dx*t-dy/len*offset,y=fromY+dy*t+dx/len*offset,size=kind==='king'?9:6;
      ctx.globalAlpha=fade*.8;ctx.fillStyle=i%2?palette[1]:palette[2];
      ctx.fillRect(Math.round(x/3)*3-size/2,Math.round(y/3)*3-size/2,size,size);
    }
  }
  ctx.restore();drawBossAttackAccent(ctx,kind,fromX,fromY,toX,toY,1-fade);
}

function drawBossAttackAccent(ctx: CanvasRenderingContext2D, kind: 'king' | 'queen' | 'devourer' | 'warden', fromX: number, fromY: number, toX: number, toY: number, progress: number) {
  const fade = 1 - progress;
  ctx.save(); ctx.shadowColor={king:'#ff8833',queen:'#d96af0',devourer:'#95d85f',warden:'#a3ddf5'}[kind];ctx.shadowBlur=6;ctx.globalAlpha=fade*.85;
  if (kind === 'king') {
    // Short stepped tongues of flame climb from the landing point.
    for (let i = 0; i < 6; i++) {
      const x = Math.round(toX + (i - 2.5) * (5 + progress * 3));
      const y = Math.round(toY + Math.sin(i * 2.4) * 10 - progress * 23);
      const h = Math.round((12 + i % 3 * 5) * (1 - progress * .6));
      ctx.fillStyle = '#d94412'; ctx.fillRect(x - 4, y - h, 8, h + 5);
      ctx.fillStyle = '#ff9a23'; ctx.fillRect(x - 3, y - h - 4, 5, h);
      ctx.fillStyle = '#ffe991'; ctx.fillRect(x - 1, y - h + 3, 3, Math.max(3, h - 7));
    }
    // A small cross-shaped flare at the caster marks the fire release.
    ctx.globalAlpha = fade * fade * .8; ctx.fillStyle = '#ffbc46';
    ctx.fillRect(fromX - 22, fromY - 3, 44, 6);ctx.fillRect(fromX - 3, fromY - 22, 6, 44);
  } else if (kind === 'queen') {
    // Four open sigil corners unfold at impact; square jewel shards scatter outwards.
    const r = 12 + progress * 23;
    ctx.strokeStyle = '#f2b6ff'; ctx.lineWidth = 2;
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      ctx.beginPath();ctx.moveTo(toX + x * (r - 7), toY + y * r);
      ctx.lineTo(toX + x * r, toY + y * r);ctx.lineTo(toX + x * r, toY + y * (r - 7));ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3, dist = 9 + progress * 36;
      const x = Math.round(toX + Math.cos(angle) * dist), y = Math.round(toY + Math.sin(angle) * dist);
      ctx.fillStyle = i % 2 ? '#c64ee5' : '#ffddff';ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    ctx.strokeStyle = '#ee99ff';ctx.strokeRect(fromX - 15 - progress * 10, fromY - 15 - progress * 10, 30 + progress * 20, 30 + progress * 20);
  } else if (kind === 'warden') {
    // Rectangular ice splinters travel down the support beam, never toward the player.
    for (let i = 0; i < 6; i++) {
      const t = Math.min(1, progress * 1.3 + i * .045);
      const x = Math.round(fromX + (toX - fromX) * t);
      const y = Math.round(fromY + (toY - fromY) * t + (i % 2 ? -5 : 5));
      ctx.fillStyle = i % 2 ? '#e5faff' : '#79c9ed';
      ctx.fillRect(x - 2, y - 4, 4, 8);
    }
    // Six stepped crystal branches bloom around the newly shielded ally.
    const reach = 18 + progress * 20;
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const x = Math.round(toX + Math.cos(angle) * reach);
      const y = Math.round(toY + Math.sin(angle) * reach);
      ctx.fillStyle = '#83cde9'; ctx.fillRect(x - 4, y - 4, 8, 8);
      ctx.fillStyle = '#e5faff'; ctx.fillRect(x - 2, y - 7, 4, 14);ctx.fillRect(x - 7, y - 2, 14, 4);
    }
    ctx.strokeStyle = '#b9eeff';ctx.lineWidth = 2;
    const frame = 17 + progress * 9;
    ctx.strokeRect(toX - frame, toY - frame, frame * 2, frame * 2);
  } else {
    // Dark square soul fragments collapse inward at the victim, while green waves fan from the maw.
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3, dist = 10 + fade * 34;
      const x = Math.round(toX + Math.cos(angle) * dist), y = Math.round(toY + Math.sin(angle) * dist);
      ctx.fillStyle = '#44205f';ctx.fillRect(x - 4, y - 4, 8, 8);
      ctx.fillStyle = i % 3 ? '#9dd959' : '#d1ff9c';ctx.fillRect(x - 1, y - 1, 3, 3);
    }
    for (let i = 0; i < 3; i++) {
      const t = Math.min(1, progress * .65 + i * .16), r = 5 + t * 16;
      const x = fromX + (toX - fromX) * t, y = fromY + (toY - fromY) * t;
      ctx.globalAlpha = fade * (1 - i * .2);ctx.strokeStyle = i % 2 ? '#8d4aba' : '#b2e877';ctx.lineWidth = 2;
      ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    }
  }
  ctx.restore();
}

function drawStormReaperModel(ctx: CanvasRenderingContext2D, tickN: number, flash: boolean, striking: boolean, release = 0){
 ctx.save();ctx.shadowBlur=0;
 // Blades and broken square glow share one fan rotation; the face stays upright.
 const fanAngle = tickN * .12;
 ctx.save();ctx.rotate(fanAngle);
 // Angular electric wake: open corners leave the silhouette and face clear.
 ctx.strokeStyle='rgba(82,255,214,.45)';ctx.lineWidth=2;ctx.shadowBlur=0;
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*16,-40);ctx.lineTo(side*40,-40);ctx.lineTo(side*40,-23);ctx.moveTo(side*40,22);ctx.lineTo(side*40,39);ctx.lineTo(side*21,39);ctx.stroke();}
 ctx.shadowBlur=0;
 // Four compact swept blades attach to every side of the square.
 for(let i=0;i<4;i++){
  ctx.save();ctx.rotate(i*Math.PI/2);ctx.translate(release * 5,0);ctx.translate(23,-3);ctx.scale(.72,.72);ctx.translate(-23,3);
  ctx.shadowColor='#52ffd6';ctx.shadowBlur=3;
  ctx.fillStyle='#237a68';
  ctx.fillRect(19,-19,12,25);ctx.fillRect(26,-28,10,19);ctx.fillRect(32,-35,9,17);
  ctx.shadowBlur=0;ctx.fillStyle='#3ac5a5';ctx.fillRect(25,-18,4,16);ctx.fillRect(30,-26,4,14);ctx.fillRect(35,-32,3,11);
  ctx.restore();
 }
 ctx.restore();
 // Approved plain square body, with no hat or hanging lower pieces.
 ctx.shadowColor='#52ffd6';ctx.shadowBlur=5;ctx.fillStyle=flash?'#ffffff':'#35c9ad';ctx.fillRect(-24,-24,48,48);ctx.shadowBlur=0;
 ctx.fillStyle='#0d3a33';ctx.fillRect(-20,-20,40,40);
 ctx.fillStyle=flash?'#eeeeee':'#195c4d';ctx.fillRect(-16,-15,32,29);
 ctx.fillStyle='#082e29';ctx.fillRect(-15,-12,30,6);ctx.fillRect(-19,-5,4,17);ctx.fillRect(15,-5,4,17);
 // A single offset eye gives the hunter an alien, intent stare.
 ctx.fillStyle='#082e29';ctx.fillRect(-16,-13,32,17);
 ctx.fillStyle=release > 0 ? '#f0fff9' : '#d6fff0';ctx.fillRect(-13,striking ? -5 : -8,26,striking ? 5 : 8);
 ctx.fillStyle='#24af92';ctx.fillRect(striking ? 0 : 3,striking ? -5 : -8,striking ? 3 : 6,striking ? 5 : 8);
 // Dark stepped lid narrows one side of the eye, without a separate eyebrow.
 ctx.fillStyle='#082e29';ctx.fillRect(-13,-8,10,3);ctx.fillRect(-3,-8,6,1);
 // One short lightning-shaped jaw mark replaces the exposed teeth and forehead rune.
 ctx.fillStyle=striking ? '#e4fff1' : '#81d9bd';ctx.fillRect(-5,8,13,3);ctx.fillRect(1,11,4,3);ctx.fillRect(-5,14,10,3);
 ctx.fillStyle='#348775';ctx.fillRect(-16,4,3,2);ctx.fillRect(13,4,3,2);
 // Broad isolated lightning fragments replace the cloud of tiny sparks.
 for(let i=0;i<6;i++){
  const angle=fanAngle*.45+i*Math.PI/3, radius=47+(i%2)*8;
  ctx.save();ctx.translate(Math.round(Math.cos(angle)*radius),Math.round(Math.sin(angle)*radius));
  ctx.globalAlpha=.45+.45*Math.abs(Math.sin(tickN*.12+i*2));ctx.shadowBlur=0;
  ctx.fillStyle=i%2?'#87ddbe':'#caffea';ctx.fillRect(-6,-8,10,3);ctx.fillRect(1,-8,3,8);ctx.fillRect(-3,-2,7,3);ctx.fillRect(-3,-2,3,8);ctx.fillRect(-3,4,11,3);ctx.restore();
 }
 // A few soft pixel motes complement the larger lightning fragments.
 for(let i=0;i<8;i++){
  const life=((tickN+i*17)%100)/100, side=i%2?1:-1;
  const x=side*(43+i%3*6), y=Math.round(40-life*82);
  ctx.save();ctx.shadowBlur=0;ctx.globalAlpha=Math.sin(life*Math.PI)*.45;
  ctx.fillStyle=i%3?'#52ffd6':'#baffdf';ctx.fillRect(x,y,2,2);ctx.restore();
 }
 // Charged state: a bright rim, traveling edge current and blade-tip discharge.
 if(striking){
  ctx.save();ctx.shadowColor='#6affcf';ctx.shadowBlur=6;ctx.strokeStyle='#baffdf';ctx.lineWidth=3;
  ctx.globalAlpha=.65+release*.3;ctx.strokeRect(-25,-25,50,50);
  ctx.shadowBlur=0;ctx.strokeStyle='#effff7';ctx.lineWidth=1;ctx.strokeRect(-23,-23,46,46);
  for(let i=0;i<8;i++){
   const t=((tickN*.07+i*.5)%4),edge=Math.floor(t),v=(t-edge)*44-22;
   const x=edge===0?v:edge===1?22:edge===2?-v:-22;
   const y=edge===0?-22:edge===1?v:edge===2?22:-v;
   ctx.fillStyle='#e2fff0';ctx.fillRect(x-2,y-2,4,4);
  }
  ctx.rotate(fanAngle);ctx.strokeStyle='#aaffdb';ctx.lineWidth=2;
  for(let i=0;i<4;i++){
   ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.moveTo(30,-22);ctx.lineTo(40,-22);ctx.lineTo(40,-29);ctx.lineTo(47,-29);ctx.stroke();ctx.restore();
  }
  ctx.restore();
 }
 ctx.restore();
}

function drawStormReaperStrike(ctx: CanvasRenderingContext2D, x: number, y: number, rawAngle: number, remaining: number) {
 // Snap to the nearest right angle: the stepped cut stays axis-aligned instead of a diagonal scribble.
 const angle=Math.round(rawAngle/(Math.PI/2))*(Math.PI/2);
 const age=1-remaining, reach=TILE_SIZE*(.6+age*.7),cos=Math.cos(angle),sin=Math.sin(angle);
 const at=(px: number,py: number)=>[x+px*cos-py*sin,y+px*sin+py*cos] as const;
 ctx.save();
 // Twin stepped plasma cuts cross the victim, drawn as axis-aligned pixel beams.
 for(const side of [-1,1]){
  const pts=[[-reach,-.45],[-.45,-.45],[-.45,-.15],[.1,-.15],[.1,.2],[.6,.2],[.6,.45],[1,.45]].map(([u,v],i)=>at(i===0?u:u*reach,v*reach*side));
  for(const [width,color,alpha] of [[9,'#2fa58c',.55],[6,'#52ffd6',.95],[3,'#e2fff0',1]] as const){
   ctx.globalAlpha=remaining*alpha;
   for(let i=1;i<pts.length;i++)drawPixelBeam(ctx,pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1],width,color);
  }
 }
 // An axis-aligned square shock front and four stepped ion bolts.
 const r=10+age*43;ctx.globalAlpha=remaining*.6;ctx.strokeStyle='#35c9ad';ctx.lineWidth=4;
 ctx.strokeRect(Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const inner=12+age*22,tip=inner+12+age*18;
  ctx.globalAlpha=remaining*.85;
  drawPixelBeam(ctx,x+dx*inner,y+dy*inner,x+dx*(inner+8),y+dy*(inner+8),6,'#52ffd6');
  drawPixelBeam(ctx,x+dx*(inner+8)-dy*6,y+dy*(inner+8)+dx*6,x+dx*tip-dy*6,y+dy*tip+dx*6,3,'#e2fff0');
 }
 ctx.globalAlpha=Math.max(0,1-age*4)*.65;ctx.fillStyle='#ebfff4';ctx.fillRect(Math.round(x)-11,Math.round(y)-11,22,22);
 ctx.restore();
}

// Small elemental space accents tie the approved boss silhouettes to the cosmic setting.
function drawCosmicBossAccents(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number, tick: number) {
  ctx.save();ctx.translate(x,y);ctx.shadowBlur=0;
  const baseAlpha=ctx.globalAlpha;
  const star=(px: number,py: number,color: string,alpha: number)=>{
    ctx.globalAlpha=alpha*baseAlpha;ctx.fillStyle=color;ctx.fillRect(Math.round(px)-3,Math.round(py)-1,7,2);ctx.fillRect(Math.round(px)-1,Math.round(py)-3,2,7);
  };
  if(type==='fiery_king'){
    // Solar plasma fragments sweep around the fiery corona.
    for(let i=0;i<5;i++){
      const a=tick*.018+i*Math.PI*2/5,r=size*.68+9;
      const px=Math.cos(a)*r,py=Math.sin(a)*r;
      star(px,py,i%2?'#ffbb59':'#ffe9a5',.4);
    }
  }else if(type==='splitter_queen'){
    // A sparse four-star constellation sits beyond her existing magic aura.
    const points=[];
    for(let i=0;i<4;i++){const a=tick*.009+i*Math.PI/2;points.push([Math.cos(a)*(size*.8+10),Math.sin(a)*(size*.8+10)]);}
    ctx.globalAlpha=.14;ctx.strokeStyle='#d991f0';ctx.lineWidth=1;ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.stroke();
    points.forEach(([px,py],i)=>star(px,py,i%2?'#dfa4f2':'#ffe3ff',.4));
  }else if(type==='devourer'){
    // Dark matter fragments spiral inward, suggesting a hungry gravity well.
    for(let i=0;i<6;i++){
      const life=((tick+i*19)%110)/110,a=-tick*.013+i*2.4,r=size*.65+22-life*13;
      const px=Math.round(Math.cos(a)*r),py=Math.round(Math.sin(a)*r);
      ctx.globalAlpha=Math.sin(life*Math.PI)*.65;ctx.fillStyle='#24122f';ctx.fillRect(px-4,py-4,8,8);
      ctx.strokeStyle='#a264cd';ctx.lineWidth=1;ctx.strokeRect(px-4,py-4,8,8);
      ctx.fillStyle='#b9e878';ctx.fillRect(px-1,py-1,2,2);
    }
  }else if(type==='frost_warden'){
    // Frozen starlets follow a wide tilted orbital plane around her crystal.
    for(let i=0;i<3;i++){
      const a=tick*.014+i*Math.PI*2/3,r=size*1.1;
      star(Math.cos(a)*r,Math.sin(a)*r*.5+Math.cos(a)*9,'#d9f6ff',.42);
    }
  }else if(type==='blind_prayer'){
    // Luminous ritual satellites frame the halo and never cover the cloth or glyphs.
    for(let i=0;i<4;i++){
      const side=i%2?1:-1,px=side*(36+i%2*7),py=-35+Math.sin(tick*.025+i*2)*14;
      ctx.globalAlpha=.35;ctx.strokeStyle='#e1c343';ctx.lineWidth=1;ctx.strokeRect(px-4,py-4,8,8);
      star(px,py,'#fff2ad',.5);
    }
  }else if(type==='sea_chanter'){
    // Tiny ocean-blue star droplets complement the square bubbles.
    for(let i=0;i<4;i++){
      const life=((tick+i*27)%120)/120,side=i%2?1:-1;
      star(side*(51+i%3*4),35-life*78,i%2?'#98cffa':'#d8f4ff',Math.sin(life*Math.PI)*.38);
    }
  }else if(type==='thorn_weaver'){
    // Pale seed stars drift over the leafy silhouette like bioluminescent spores.
    for(let i=0;i<3;i++){
      const life=((tick+i*37)%130)/130;
      star((i%2?1:-1)*(size*.7+8),18-life*72,i===1?'#e8b6df':'#d6f5a6',Math.sin(life*Math.PI)*.4);
    }
  }
  ctx.restore();
}

// One connected octagonal crystal band for every celestial orbit; optional halves give models depth.
function drawCelestialPolygonRing(ctx: CanvasRenderingContext2D, rx: number, ry: number, color: string, width: number, tilt: number, front: boolean | null = null) {
  const vertices=Array.from({length:8},(_,i)=>{
    const angle=i*Math.PI/4,x=Math.cos(angle)*rx,y=Math.sin(angle)*ry;
    return [Math.round(x*Math.cos(tilt)-y*Math.sin(tilt)),Math.round(x*Math.sin(tilt)+y*Math.cos(tilt))];
  });
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='miter';ctx.lineCap='butt';ctx.shadowColor=color;ctx.shadowBlur=width*1.5;
  const start=front===false?4:0,end=front===true?4:8;
  ctx.beginPath();ctx.moveTo(vertices[start%8][0],vertices[start%8][1]);
  for(let i=start+1;i<=end;i++)ctx.lineTo(vertices[i%8][0],vertices[i%8][1]);
  if(front===null)ctx.closePath();ctx.stroke();ctx.restore();
}

function drawCelestialCast(ctx: CanvasRenderingContext2D, kind: keyof typeof SPECIAL_SKILLS, x: number, y: number, age: number, tick: number) {
  const fade=Math.max(0,1-age)*ctx.globalAlpha,color=SPECIAL_SKILLS[kind].color;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.globalAlpha=fade*.9;ctx.shadowColor=color;
  ctx.shadowBlur=['fiery_king','blind_prayer','devourer'].includes(kind)?5+4*Math.abs(Math.sin(tick*.075)):0;
  const block=(px: number,py: number,w: number,h: number,c: string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(px/3)*3,Math.round(py/3)*3,Math.max(3,Math.round(w/3)*3),Math.max(3,Math.round(h/3)*3));};
  const star=(px: number,py: number,size: number,c: string)=>{
    const arm=Math.max(6,Math.round(size/12)*3),half=size/2;
    block(px-arm/2,py-half,arm,size,c);block(px-half,py-arm/2,size,arm,c);block(px-arm,py-arm,arm*2,arm*2,c);
    for(const dx of [-1,1])for(const dy of [-1,1])block(px+dx*half*.55-3,py+dy*half*.55-3,6,6,c);
  };
  // Broad 12px stair steps keep cast rings as chunky as the full-energy sparks.
  // Keep the held Saturn suit's separate polygon hoop unchanged.
  const ring=(r: number,flat: number,c: string,shear=0,front: boolean | null=null,band=18)=>{
    const rx=Math.max(24,Math.round(r/12)*12),ry=Math.max(24,Math.round(r*flat/12)*12);
    ctx.save();ctx.shadowBlur=0;ctx.globalAlpha*=.8+.2*Math.abs(Math.sin(tick*.075));
    const ringAlpha=ctx.globalAlpha;
    for(let py=-ry;py<=ry;py+=12)for(let px=-rx;px<=rx;px+=12){
      if(front!==null && (py>=0)!==front)continue;
      const outer=(px*px)/(rx*rx)+(py*py)/(ry*ry);
      const inner=(px*px)/((rx-band)*(rx-band))+(py*py)/(Math.max(6,ry-band+6)**2);
      if(outer<=1 && inner>=1){
        ctx.globalAlpha=ringAlpha*(py<0?.7:1);
        const glint=(Math.round(px/12)+Math.round(py/12)+Math.floor(tick/8))%13===0;
        block(px-6,Math.round((py+px*shear)/12)*12-6,12,12,glint?'#dce9ed':c);
      }
    }
    ctx.restore();
  };
  const planet=(base: string,shade: string)=>{
    ctx.save();ctx.shadowBlur=0;
    for(let row=-4;row<=4;row++)for(let col=-4;col<=4;col++)if(col*col+row*row<=19)block(col*6-3,row*6-3,6,6,col<-1?shade:base);
    ctx.restore();
  };
  const disc=(r: number,c: string)=>{const n=Math.ceil(r/6);for(let row=-n;row<=n;row++)for(let col=-n;col<=n;col++)if((col*6)**2+(row*6)**2<=r*r)block(col*6-3,row*6-3,6,6,c);};
  const energyStreams=(radius: number,base: string,light: string)=>{
    ctx.save();ctx.shadowColor=base;ctx.shadowBlur=8;
    const directions=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
    for(let i=0;i<directions.length;i++){
      const [dx,dy]=directions[i];
      for(let shard=0;shard<2;shard++){
        const life=((tick*2+i*5+shard*18)%36)/36;
        const distance=radius+Math.floor(life*6)*4;
        ctx.globalAlpha=fade*(1-life)*.9;
        drawEnergyPixelRay(ctx,dx*distance,dy*distance,dx,dy,shard?light:base,1.5);
      }
    }
    ctx.restore();
  };
  if(kind==='fiery_king'){
    // A round stepped sun disc with corona tongues; Sirius keeps the cross-shaped star.
    const sun=30+age*24;
    ctx.save();ctx.shadowBlur=0;
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6+tick*.01,flicker=(i+Math.floor(tick/5))%3,length=(i%2?12:21)+flicker*3;
      for(let step=0;step<length;step+=6){
        ctx.globalAlpha=fade*(.9-step/length*.5);
        const r=sun+3+step,size=step+6>=length?6:9;block(Math.cos(angle)*r-size/2,Math.sin(angle)*r-size/2,size,size,step?'#ff7a4a':'#ff4545');
      }
    }
    ctx.globalAlpha=fade*.95;disc(sun,'#e8353f');disc(sun*.72,'#ff7a4a');disc(sun*.42,'#ffc08a');disc(Math.max(6,sun*.18),'#fff0dc');
    ctx.restore();
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle);
      ctx.save();ctx.shadowBlur=0;
      for(let trail=0;trail<5;trail++){
        const r=48+age*145-trail*12,size=trail===0?6:trail<3?12:9;
        const px=dx*r,py=dy*r;
        ctx.globalAlpha=fade*(.95-trail*.14);
        block(px-size/2,py-size/2,size,size,trail===0?'#ffe0bd':trail<3?'#ff7360':'#ed333d');
        if(trail===1||trail===3){
          const side=(i+trail)%2?1:-1;
          block(px-dy*side*9-3,py+dx*side*9-3,6,6,'#ff9c80');
        }
        if(trail===2){ctx.globalAlpha=fade*.8;block(px-3,py-3,6,6,'#ffe7d2');}
      }
      ctx.restore();
    }
  }else if(kind==='storm_reaper'){
    const G=12,reachAge=Math.min(1,age*1.6),b6=(px: number,py: number,w: number,h: number,c: string)=>{const sn=(v: number)=>Math.round(v/6)*6;ctx.fillStyle=c;ctx.fillRect(sn(px),sn(py),Math.max(6,sn(w)),Math.max(6,sn(h)));};
    // Stepped disc of 12px cells with dark lower-right edge and pale upper-left highlight.
    const orb=(r: number,base: string,dark: string,light: string)=>{const n=Math.ceil(r/G);for(let row=-n;row<=n;row++)for(let col=-n;col<=n;col++){const cx=col*G,cy=row*G;if(cx*cx+cy*cy>r*r)continue;const edge=(cx+G)*(cx+G)+(cy+G)*(cy+G)>r*r,top=(cx-G)*(cx-G)+(cy-G)*(cy-G)>r*r;b6(cx-G/2,cy-G/2,G,G,edge&&(col>0||row>0)?dark:top&&(col<0||row<0)?light:base);}};
    const ring6=(r: number,c: string)=>{const rr=Math.max(G*2,Math.round(r/G)*G);for(let py=-rr;py<=rr;py+=G)for(let px=-rr;px<=rr;px+=G){const outer=(px*px+py*py)/(rr*rr),inner=(px*px+py*py)/((rr-G)*(rr-G));if(outer<=1&&inner>=1)b6(px-G/2,py-G/2,G,G,c);}};
    ctx.shadowBlur=0;
    // Jupiter: banded planet, one reach ring and four stepped lightning bolts.
    const reach=36+reachAge*(SPECIAL_REAPER_RADIUS-36);
    ctx.globalAlpha=fade*.6;ring6(reach,'#ffa34d');
    ctx.globalAlpha=fade*.9;
    for(let side=0;side<4;side++){
      const a2=side*Math.PI/2,dx=Math.round(Math.cos(a2)),dy=Math.round(Math.sin(a2)),len=48+reachAge*36;
      for(let step=0;step<4;step++){const d=48+step*len/4,off=step%2?G:0;b6(dx*d-dy*off-G/2,dy*d+dx*off-G/2,G,G,step===3?'#fff0c7':'#ffc066');}
    }
    ctx.globalAlpha=fade;orb(36,'#f0a058','#a85a28','#ffe0a8');b6(-30,-12,60,6,'#ffe0a8');b6(-30,6,60,6,'#c86a30');b6(6,0,G,6,'#c9452a');
  }else if(kind==='frost_warden'){
    const orbitRadius=72+age*42,pulse=.8+.2*Math.abs(Math.sin(tick*.075));
    ctx.globalAlpha=fade*.6*pulse;ring(orbitRadius,.6,'#4baf9e',-.25,false);
    ctx.save();ctx.globalAlpha=fade*.95;ctx.scale(1.2,1.2);planet('#76cbbb','#3c877b');block(-21,-3,42,6,'#b9fae8');ctx.restore();
    ctx.globalAlpha=fade*.9*pulse;ring(orbitRadius,.6,'#9bf0db',-.25,true);
    energyStreams(56+age*40,'#76cbbb','#d4fff3');
  }else if(kind==='sea_chanter'){
    const G=12,reachAge=Math.min(1,age*1.6),b6=(px: number,py: number,w: number,h: number,c: string)=>{const sn=(v: number)=>Math.round(v/6)*6;ctx.fillStyle=c;ctx.fillRect(sn(px),sn(py),Math.max(6,sn(w)),Math.max(6,sn(h)));};
    // Stepped disc of 12px cells with dark lower-right edge and pale upper-left highlight.
    const orb=(r: number,base: string,dark: string,light: string)=>{const n=Math.ceil(r/G);for(let row=-n;row<=n;row++)for(let col=-n;col<=n;col++){const cx=col*G,cy=row*G;if(cx*cx+cy*cy>r*r)continue;const edge=(cx+G)*(cx+G)+(cy+G)*(cy+G)>r*r,top=(cx-G)*(cx-G)+(cy-G)*(cy-G)>r*r;b6(cx-G/2,cy-G/2,G,G,edge&&(col>0||row>0)?dark:top&&(col<0||row<0)?light:base);}};
    const ring6=(r: number,c: string)=>{const rr=Math.max(G*2,Math.round(r/G)*G);for(let py=-rr;py<=rr;py+=G)for(let px=-rr;px<=rr;px+=G){const outer=(px*px+py*py)/(rr*rr),inner=(px*px+py*py)/((rr-G)*(rr-G));if(outer<=1&&inner>=1)b6(px-G/2,py-G/2,G,G,c);}};
    ctx.shadowBlur=0;
    // Neptune: blue planet with its dark spot, two push rings and three rising heal crosses.
    const reach=48+reachAge*(SPECIAL_CHANTER_RADIUS-48);
    ctx.globalAlpha=fade*.45;ring6(Math.max(G*3,reach-36),color);
    ctx.globalAlpha=fade*.8;ring6(reach,'#b6ddff');
    ctx.globalAlpha=fade;orb(36,'#4a86e8','#26478f','#a9d8ff');b6(0,0,18,G,'#1b2f78');
    for(let i=0;i<3;i++){const cx=(i-1)*36,cy=-60-age*48;ctx.globalAlpha=fade*(1-age);b6(cx-6,cy-15,12,30,'#d8f6ff');b6(cx-15,cy-6,30,12,'#d8f6ff');b6(cx-6,cy-6,12,12,'#ffffff');}
  }else if(kind==='blind_prayer'){
    // The Dog Star: long diffraction spikes, a twinkling halo and its small white-dwarf companion.
    const spike=48+age*156;
    ctx.save();ctx.shadowBlur=0;
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])for(let step=18;step<spike;step+=6){
      const t=step/spike,width=t<.3?12:t<.6?9:t<.85?6:3;
      ctx.globalAlpha=fade*(1-t*.5);block(dx*step-width/2,dy*step-width/2,width,width,t>.85?'#ffffff':'#fff6c2');
    }
    for(const [dx,dy] of [[1,-1],[1,1],[-1,1],[-1,-1]])for(let step=12;step<spike*.36;step+=6){
      ctx.globalAlpha=fade*.7*(1-step/(spike*.36));block(dx*step*.72-3,dy*step*.72-3,6,6,'#ffe45c');
    }
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6+.26,r=36+age*96,twinkle=(i+Math.floor(tick/4))%4===0;
      ctx.globalAlpha=fade*(twinkle?1:.5);block(Math.cos(angle)*r-3,Math.sin(angle)*r-3,twinkle?9:6,twinkle?9:6,twinkle?'#ffffff':'#ffe45c');
    }
    ctx.restore();
    ctx.globalAlpha=fade;star(0,0,54+age*18,'#ffe45c');star(0,0,30,'#fff3a4');star(0,0,12,'#ffffff');
    ctx.save();ctx.shadowColor='#cfe8ff';ctx.shadowBlur=4;
    for(let trail=3;trail>=0;trail--){
      const angle=tick*.09-trail*.14,r=48+age*24;ctx.globalAlpha=fade*(1-trail*.25);
      const size=trail?6:9;block(Math.cos(angle)*r-size/2,Math.sin(angle)*r*.6-size/2,size,size,trail?'#cfe8ff':'#ffffff');
    }
    ctx.restore();
  }else if(kind==='splitter_queen'){
    // Crescent cut from a stepped pixel disc; no smooth curves or boss ornaments.
    for(let row=-4;row<=4;row++)for(let col=-4;col<=4;col++)if(col*col+row*row<=19 && (col-2)*(col-2)+(row+1)*(row+1)>16)block(col*6-3,row*6-3,6,6,col<-1?'#8052ba':'#c89aff');
    star(27,-15,18,'#f4e9ff');
    ctx.globalAlpha=fade*.85;ring(36+age*100,1,'#b383f0');
    ctx.globalAlpha=fade*.45;ring(24+age*74,1,'#eddaff');
    energyStreams(42+age*85,'#bd8cff','#f5e9ff');
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,r=42+age*100;ctx.globalAlpha=fade*.9;
      drawEnergyPixelRay(ctx,Math.cos(angle)*r,Math.sin(angle)*r,Math.cos(angle),Math.sin(angle),'#e4c9ff',1.5);
    }
  }else if(kind==='astral_twins'){
    // Coral and blue half-rings split apart while two small stars orbit outward from one seam.
    const reach=30+age*84;
    ctx.globalAlpha=fade*.85;ring(reach,1,'#ff8f7a',0,false);ring(reach,1,'#7fb4ff',0,true);
    ctx.globalAlpha=fade*.35;ring(Math.max(24,reach-30),1,'#ffe1d8',0,false);ring(Math.max(24,reach-30),1,'#d8ecff',0,true);
    const spin=age*5+tick*.05,distance=12+age*54;
    for(const [side,base,light] of [[1,'#ff8f7a','#ffe1d8'],[-1,'#7fb4ff','#e9f6ff']] as const){
      const px=Math.cos(spin)*distance*side,py=Math.sin(spin)*distance*side;
      for(let trail=4;trail>=1;trail--){
        const a=spin-trail*.22,tx=Math.cos(a)*distance*side,ty=Math.sin(a)*distance*side;
        ctx.globalAlpha=fade*(.6-trail*.12);block(tx-3,ty-3,6,6,base);
      }
      ctx.globalAlpha=fade;star(px,py,30,base);star(px,py,12,light);
    }
    ctx.globalAlpha=fade*.8;block(-3,-18,6,36,'#ffffff');
  }else if(kind==='aegis_sentinel'){
    // Square mirror frames open outward around a cloud-veiled Venus; no round rings.
    for(const [r,c,a] of [[30+age*84,'#ffe4d2',.95],[18+age*54,'#f0a58c',.7]] as const){
      const extent=Math.round(r/12)*12;ctx.save();ctx.shadowColor='#ffb89c';ctx.shadowBlur=2;
      for(let i=-extent;i<extent;i+=12){
        if(Math.round((i+extent)/12)%4===3)continue;
        const glint=(Math.round((i+extent)/12)+Math.floor(tick/6))%9===0;
        ctx.globalAlpha=fade*a;
        for(const [px,py] of [[i,-extent],[extent,i],[-i,extent],[-extent,-i]])block(px-6,py-6,12,12,glint?'#ffffff':c);
      }
      ctx.restore();
    }
    ctx.globalAlpha=fade;planet('#ffe2cc','#c98a76');
    const drift=Math.round(Math.sin(tick*.1)*2)*3;
    block(-21+drift,-12,18,6,'#e8b29c');block(-6+drift,-6,15,6,'#fbe7d8');block(-6+drift,3,15,6,'#e8b29c');block(-21+drift,9,18,6,'#d9a492');
    block(9+drift,-3,9,6,'#fff6ec');
    for(let i=0;i<4;i++){
      const angle=i*Math.PI/2+Math.PI/4,r=36+age*70,dx=Math.cos(angle),dy=Math.sin(angle);
      ctx.globalAlpha=fade*.9;block(dx*r-6,dy*r-3,12,6,'#fff6ec');block(dx*r-3,dy*r-6,6,12,'#fff6ec');
      ctx.globalAlpha=fade*.55;block(dx*(r-15)-3,dy*(r-15)-3,6,6,'#e8b29c');
    }
  }else if(kind==='thorn_weaver'){
    ctx.save();ctx.scale(1.3,1.3);planet('#4b8057','#315b47');block(-18,-15,18,12,'#b6da75');block(-6,-3,24,9,'#78b777');block(-3,6,12,15,'#d9edac');ctx.restore();
    // Grounded roots grow outward in branches; Gaia has no orbiting rings or star rays.
    for(let side=0;side<4;side++){
      ctx.save();ctx.rotate(side*Math.PI/2);
      const reach=42+age*105;
      for(let step=0;step<6;step++){
        const along=39+step*18;if(along>reach)continue;
        ctx.globalAlpha=fade*(.9-step*.07);
        block(along,-3,18,6,step%2?'#6b9e58':'#96c777');
        const branch=step%2?1:-1;
        block(along+9,branch>0?3:-15,6,12,'#80b569');
        block(along+9,branch>0?12:-21,12,9,'#c4e9a0');
      }
      ctx.restore();
    }
  }else{
    // A black stellar rift with a silver edge and inward-moving fragments; no boxed rings.
    const reach=36+age*110;
    ctx.globalAlpha=fade*.7;ring(reach,1,'#5c5c6c');ctx.globalAlpha=fade*.35;ring(Math.max(24,reach-30),1,'#b4b4c6');
    ctx.shadowColor='#aaaab6';ctx.shadowBlur=8;ctx.globalAlpha=fade*.8;star(0,0,66+age*40,'#70707e');
    ctx.shadowBlur=0;ctx.globalAlpha=Math.min(1,fade*2.5);star(0,0,54+age*30,'#050507');star(0,0,24+age*12,'#000000');
    ctx.save();ctx.shadowColor='#c7c7e2';ctx.shadowBlur=8;
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,distance=reach+24-age*40,dx=Math.cos(angle),dy=Math.sin(angle);
      ctx.globalAlpha=fade*.85;drawEnergyPixelRay(ctx,dx*distance,dy*distance,-dx,-dy,i%2?'#858598':'#e0e0ef',1.25);
    }
    ctx.restore();
    for(let i=0;i<8;i++){
      const life=((tick+i*11)%70)/70,angle=i*Math.PI/4+life*.35,r=20+(1-life)*45;
      ctx.globalAlpha=fade*Math.sin(life*Math.PI)*.7;block(Math.cos(angle)*r-3,Math.sin(angle)*r-3,6,6,i%2?'#646470':'#d0d0da');
    }
  }
  ctx.restore();
}

// Square samples are filled as one path to avoid overlapping opacity.
function drawPixelBeam(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, color: string) {
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/3)),size=Math.max(3,Math.round(width/3)*3);
  ctx.beginPath();
  for(let i=0;i<=steps;i++){
    const t=i/steps;ctx.rect(Math.round((x1+(x2-x1)*t-size/2)/3)*3,Math.round((y1+(y2-y1)*t-size/2)/3)*3,size,size);
  }
  ctx.fillStyle=color;ctx.fill();
}

function drawPlayerLaser(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, powered: boolean, ticks: number) {
  ctx.save();ctx.lineCap='square';const fade=Math.min(1,ticks/18),base=powered?'#ffcc00':'#44ddff',light=powered?'#ffee88':'#aaffff';
  for(const [width,color,alpha,glow]of [[powered?60:48,base,.4,18],[powered?27:18,light,.85,10],[powered?6:3,'#ffffff',1,0]] as const){
    ctx.globalAlpha=fade*alpha;ctx.shadowColor=base;ctx.shadowBlur=glow;ctx.strokeStyle=color;ctx.lineWidth=width;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  ctx.restore();
}

function drawPlayerChain(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, ticks: number) {
  ctx.save();ctx.lineJoin='miter';ctx.lineCap='butt';const fade=Math.min(1,ticks/22),dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
  const points=Array.from({length:5},(_,i)=>{const t=i/4,off=i===0||i===4?0:(i%2?1:-1)*12;return [x1+dx*t-dy/len*off,y1+dy*t+dx/len*off];});
  for(const [width,color,glow,alpha]of [[12,'#ffcc33',26,.65],[7,'#ffff88',8,.9],[3,'#ffffff',0,1]] as const){
    ctx.globalAlpha=fade*alpha;ctx.shadowColor='#ffff44';ctx.shadowBlur=glow;ctx.strokeStyle=color;ctx.lineWidth=width;
    ctx.beginPath();ctx.moveTo(x1,y1);for(const point of points.slice(1))ctx.lineTo(point[0],point[1]);ctx.stroke();
  }
  ctx.restore();
}

function drawPlayerWave(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, powered: boolean, ticks: number) {
  ctx.save();const fade=Math.min(1,ticks/30),base=powered?'#ffbb22':'#22cfff',light=powered?'#fff4b8':'#e4ffff',accent=powered?'#ff6d37':'#9b7cff';
  ctx.shadowColor=base;ctx.shadowBlur=Math.min(6,32);ctx.globalAlpha=fade*.85;ctx.strokeStyle=base;ctx.lineWidth=18;ctx.strokeRect(x-radius,y-radius,radius*2,radius*2);
  ctx.shadowBlur=Math.min(6,10);ctx.globalAlpha=fade;ctx.strokeStyle=light;ctx.lineWidth=6;ctx.strokeRect(x-radius,y-radius,radius*2,radius*2);
  for(const [ratio,color,alpha]of [[.76,accent,.65],[.5,base,.35]] as const){
    const r=radius*ratio;ctx.shadowColor=color;ctx.shadowBlur=Math.min(6,12);ctx.globalAlpha=fade*alpha;ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(x-r,y-r,r*2,r*2);
  }
  ctx.shadowBlur=Math.min(6,0);ctx.globalAlpha=fade*.1;ctx.fillStyle=base;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  ctx.shadowColor=base;ctx.shadowBlur=Math.min(6,10);
  for(const [dx,dy]of [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]){
    ctx.globalAlpha=fade*.9;drawEnergyPixelRay(ctx,x+dx*radius,y+dy*radius,dx,dy,light,powered?2:1.5);
  }
  if(ticks>20){ctx.globalAlpha=(ticks-20)/10*.6;drawCompassStar(ctx,x,y,60,light);}
  ctx.restore();
}

function drawPlayerCharge(ctx: CanvasRenderingContext2D, x: number, y: number, half: number, progress: number, tick: number) {
  ctx.save();const r=half+Math.floor(half*(.15+progress*1.6));
  ctx.shadowColor='#00ccff';ctx.shadowBlur=Math.min(6,Math.floor(20*progress));ctx.globalAlpha=.15+.7*progress;
  ctx.strokeStyle='#00ccff';ctx.lineWidth=Math.max(1,Math.floor(4*progress));ctx.strokeRect(x-r,y-r,r*2,r*2);
  if(progress>=.98){ctx.globalAlpha=.3+.3*Math.abs(Math.sin(tick*.2));ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.shadowBlur=Math.min(6,8);const outer=r*1.2;ctx.strokeRect(x-outer,y-outer,outer*2,outer*2);}
  if(progress>.5){
    ctx.shadowColor='#8c72ff';ctx.shadowBlur=Math.min(6,8);ctx.globalAlpha=(progress-.5)*1.2;ctx.strokeStyle='#ad93ff';ctx.lineWidth=2;
    const inner=r*.75;ctx.strokeRect(x-inner,y-inner,inner*2,inner*2);
    for(let i=0;i<4;i++){
      const angle=i*Math.PI/2,life=((tick+i*9)%36)/36,reach=r+15-Math.floor(life*4)*3;
      ctx.globalAlpha=progress*(1-life)*.8;drawEnergyPixelRay(ctx,x+Math.cos(angle)*reach,y+Math.sin(angle)*reach,Math.round(Math.cos(angle)),Math.round(Math.sin(angle)),'#e4ffff',1.5);
    }
  }
  ctx.restore();
}

function drawPlayerBullet(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, powered: boolean, ticks: number) {
  ctx.save();ctx.lineCap='square';const len=Math.hypot(dx,dy)||1,nx=dx/len,ny=dy/len;
  const tail=Math.min(TILE_SIZE*1.5,Math.max(0,ticks)*BULLET_SPEED*TILE_SIZE),width=powered?30:18;
  const base=powered?'#ffcc00':'#44ddff',light=powered?'#ffee88':'#aaffff';
  for(const [w,color,alpha,glow]of [[width*1.8,base,.3,22],[width,base,.8,10],[Math.max(4,width*.4),light,1,0]] as const){
    ctx.globalAlpha=alpha;ctx.shadowColor=base;ctx.shadowBlur=glow;ctx.strokeStyle=color;ctx.lineWidth=w;
    ctx.beginPath();ctx.moveTo(x-nx*tail,y-ny*tail);ctx.lineTo(x+nx*TILE_SIZE*.4,y+ny*TILE_SIZE*.4);ctx.stroke();
  }
  ctx.restore();
}

function drawRewardSpark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  // Keep the 4px particle size; crisp 2px steps and a square core replace the soft halo.
  const px = Math.round(x / 2) * 2;
  const py = Math.round(y / 2) * 2;
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.fillRect(px - 2, py - 2, 4, 4);
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha *= 0.6;
  ctx.fillRect(px - 1, py - 1, 2, 2);
  ctx.restore();
}

function drawPrayerRitual(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tickN: number) {
  const ability = state.enemies.find(e => e.type === 'blind_prayer')?.prayer;
  if (!ability || ability.rubyCastTicks <= 0 || state.rubyTileX === -1 || ability.rubyDestination < 0) return;
  const destination = [[10, 10], [39, 10], [10, 39], [39, 39]][ability.rubyDestination];
  const progress = 1 - ability.rubyCastTicks / PRAYER_RUBY_WINDUP;
  ctx.save();
  for (const [tx, ty] of [[state.rubyTileX, state.rubyTileY], destination]) {
    const x = Math.round(tx * TILE_SIZE + TILE_SIZE / 2 - camX);
    const y = Math.round(ty * TILE_SIZE + TILE_SIZE / 2 - camY);
    const radius = Math.round(TILE_SIZE * (0.55 + progress * 0.25));
    ctx.globalAlpha = 0.65 + 0.25 * Math.abs(Math.sin(tickN * 0.2));
    ctx.strokeStyle = '#ffdd22'; ctx.shadowColor = '#ffdd22'; ctx.shadowBlur = 10;
    ctx.lineWidth = 3; ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0;
    for (const dx of [-1, 1]) for (const dy of [-1, 1]) ctx.fillRect(x + dx * radius - 3, y + dy * radius - 3, 6, 6);
    const lift=(1-progress)*36;
    ctx.globalAlpha=.5+progress*.4;ctx.fillStyle='#ffda77';ctx.fillRect(x-3,y-radius-28-lift,6,18);
    ctx.fillStyle='#fff5cd';ctx.fillRect(x-9,y-radius-24-lift,18,6);
  }
  ctx.restore();
}

function drawSaturnShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, tick: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;
  const extent=Math.ceil(radius/4)*4,pulse=.75+.25*Math.abs(Math.sin(tick*.055));
  // A faceted turquoise ward, with sharp steps and a dim translucent interior.
  for(let py=-extent;py<=extent;py+=4)for(let px=-extent;px<=extent;px+=4){
    const ax=Math.abs(px),ay=Math.abs(py),edge=Math.max(ax,ay)+Math.min(ax,ay)*.4;
    if(edge>extent)continue;
    const rim=edge>extent-4;
    ctx.globalAlpha=rim?pulse*(py<0?.5:.8):.035;
    ctx.fillStyle=rim?(py<0?'#67b8aa':'#b6f8e4'):'#76cbbb';ctx.fillRect(px-2,py-2,4,4);
  }
  // Moving orbit lights carry the Saturn identity without blurring the shell.
  for(let i=0;i<4;i++){
    const angle=tick*.025+i*Math.PI/2;
    const px=Math.round(Math.cos(angle)*(extent+6)/3)*3,py=Math.round(Math.sin(angle)*(extent+6)*.55/3)*3;
    ctx.globalAlpha=.55+.25*Math.sin(angle)**2;ctx.shadowColor='#76cbbb';ctx.shadowBlur=6;
    ctx.fillStyle='#dbfff2';ctx.fillRect(px-2,py-2,4,4);
  }
  ctx.restore();
}

// Venus Veil: a pearl square shell of mirror plates; one bright glint sweeps around it.
function drawVenusVeil(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, tick: number, ticksLeft: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  const extent=Math.ceil(radius/4)*4,ending=ticksLeft<120,blink=ending&&Math.floor(ticksLeft/8)%2===0;
  const base=blink?.4:1,perimeter=extent*8,sweep=(tick*3)%perimeter;
  ctx.globalAlpha=base*.07;ctx.fillStyle='#ffd9c4';ctx.fillRect(-extent+4,-extent+4,extent*2-8,extent*2-8);
  const plates: Record<'pearl'|'rose'|'glint',[number,number][]>={pearl:[],rose:[],glint:[]};
  for(let i=0;i<perimeter;i+=4){
    if((i+extent)%16===12)continue; // narrow gaps keep separate mirror plates readable
    const side=Math.floor(i/(extent*2)),t=i%(extent*2)-extent;
    const px=side===0?t:side===1?extent:side===2?-t:-extent,py=side===0?-extent:side===1?t:side===2?extent:-t;
    const near=Math.min(Math.abs(i-sweep),perimeter-Math.abs(i-sweep));
    (near<10?plates.glint:Math.floor((i+extent)/16)%2?plates.pearl:plates.rose).push([px,py]);
  }
  // One filled path per color glows as a shell instead of per-pixel halos.
  const fillPlates=(cells: [number,number][],color: string,alpha: number,glow: number)=>{
    ctx.beginPath();for(const [px,py]of cells)ctx.rect(px-2,py-2,4,4);
    ctx.globalAlpha=base*alpha;ctx.fillStyle=color;ctx.shadowBlur=glow;ctx.fill();
  };
  ctx.shadowColor='#ffc2a8';
  fillPlates(plates.pearl,'#ffe9da',.95,6);fillPlates(plates.rose,'#f0a58c',.9,6);fillPlates(plates.glint,'#ffffff',1,10);
  ctx.shadowBlur=4;ctx.fillStyle='#fff6ec';
  for(const [cx,cy]of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    const ox=cx*(extent+6),oy=cy*(extent+6);ctx.fillRect(ox-2,oy-4,4,8);ctx.fillRect(ox-4,oy-2,8,4);
  }
  ctx.restore();
}

// Dotted coral-to-blue link with a travelling white pulse, shared by Binary Star and the Astral Twins.
function drawTwinLink(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, tickN: number, alpha: number) {
  ctx.save();ctx.shadowBlur=0;
  const length=Math.hypot(x2-x1,y2-y1),steps=Math.floor(length/12),pulse=(tickN*.6)%Math.max(1,steps);
  for(let i=1;i<steps;i++){
    const t=i/steps,near=Math.abs(i-pulse)<1.5;
    ctx.globalAlpha=alpha+(near?.45:0);ctx.fillStyle=near?'#ffffff':t<.5?'#ff8f7a':'#7fb4ff';
    ctx.fillRect(Math.round((x1+(x2-x1)*t)/3)*3-2,Math.round((y1+(y2-y1)*t)/3)*3-2,4,4);
  }
  ctx.restore();
}

// Astral Twins: Dawn and Dusk stay joined by the same link; it dims while one twin is down.
function drawAstralTwinLinks(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tickN: number) {
  const dawn=state.enemies.find(e=>e.twin?.index===0&&e.hp>0),dusk=state.enemies.find(e=>e.twin?.index===1&&e.hp>0);
  if(!dawn||!dusk||dawn.twin!.pairId!==dusk.twin!.pairId)return;
  const down=(dawn.twin!.downedTicks??0)>0||(dusk.twin!.downedTicks??0)>0;
  drawTwinLink(ctx,dawn.x-camX,dawn.y-camY,dusk.x-camX,dusk.y-camY,tickN,down?.15:.4);
}

// Binary Star: a translucent blue copy of the player beside Ruby, joined to the player by a dotted coral/blue link.
function drawMirrorTwin(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tickN: number) {
  const twin=getMirrorTwinTile(state);if(!twin)return;
  const x=(twin.tileX+.5)*TILE_SIZE-camX,y=(twin.tileY+.5)*TILE_SIZE-camY,px=state.playerX-camX,py=state.playerY-camY;
  const ending=state.mirrorTwinTicks<120,blink=ending&&Math.floor(state.mirrorTwinTicks/8)%2===0;
  drawTwinLink(ctx,px,py,x,y,tickN,blink?.15:.35);
  ctx.save();ctx.globalAlpha=blink?.3:.62;
  drawPlayer(ctx,x,y,{...state,specialSkill:'astral_twins',playerCastTicks:0,playerCastKind:null,runnerEnergyFlashTicks:0,starEnergy:0,poweredTicks:0,speedActiveTicks:0,speedFlashTicks:0,playerCarryingRuby:false,playerShieldHP:0,rubyShieldHP:0,venusVeilTicks:0,laserCooldown:0,bulletCooldown:0,electricBuffTicks:0,thornPoisonTicks:0,healJiggleTicks:0},tickN);
  ctx.restore();
  // A cool blue wash keeps the twin readable as a copy rather than a second player.
  ctx.save();ctx.globalAlpha=blink?.08:.18;ctx.fillStyle='#7fb4ff';const h=Math.floor(TILE_SIZE*.37);ctx.fillRect(Math.round(x)-h,Math.round(y)-h,h*2,h*2);ctx.restore();
}

function drawVenusReflects(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number) {
  ctx.save();
  for(const fx of state.venusReflects){
    const fade=fx.ticks/18,x1=fx.fromX-camX,y1=fx.fromY-camY,x2=fx.toX-camX,y2=fx.toY-camY;
    // The returned hit travels outward as a short angular pearl streak, then flashes on the attacker.
    const head=Math.min(1,(1-fade)*2.2),tail=Math.max(0,head-.45);
    const ax=x1+(x2-x1)*tail,ay=y1+(y2-y1)*tail,bx=x1+(x2-x1)*head,by=y1+(y2-y1)*head;
    ctx.globalAlpha=fade*.5;ctx.shadowColor='#f5dcc8';ctx.shadowBlur=6;drawPixelBeam(ctx,ax,ay,bx,by,9,'#d9a492');
    ctx.globalAlpha=fade;ctx.shadowBlur=0;drawPixelBeam(ctx,ax,ay,bx,by,3,'#fff6ec');
    if(head>=1){
      const r=6+Math.round((1-fade)*18/3)*3;ctx.globalAlpha=fade*.9;ctx.fillStyle='#fff6ec';
      ctx.fillRect(Math.round(x2)-r,Math.round(y2)-1,r*2,3);ctx.fillRect(Math.round(x2)-1,Math.round(y2)-r,3,r*2);
      ctx.fillStyle='#e8b29c';for(const [dx,dy]of [[-1,-1],[1,-1],[1,1],[-1,1]])ctx.fillRect(Math.round(x2+dx*r*.6)-2,Math.round(y2+dy*r*.6)-2,4,4);
    }
  }
  ctx.restore();
}

function drawRewardShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number,
  tickN: number, color: string) {
  ctx.save();
  x = Math.round(x); y = Math.round(y); radius = Math.round(radius);
  const alpha=ctx.globalAlpha,pulse=.75+.25*Math.abs(Math.sin(tickN*.055));
  const left=x-radius,top=y-radius,size=radius*2,border=4;
  ctx.shadowBlur=0;ctx.fillStyle=color;
  ctx.globalAlpha=alpha*.035;ctx.fillRect(left+border,top+border,size-border*2,size-border*2);
  // One plain square, with shaded flat edges and no protruding corners.
  ctx.globalAlpha=alpha*pulse*.55;
  ctx.fillRect(left,top,size,border);ctx.fillRect(left,top+border,border,size-border*2);
  ctx.globalAlpha=alpha*pulse*.85;
  ctx.fillRect(left,top+size-border,size,border);ctx.fillRect(left+size-border,top+border,border,size-border*2);
  ctx.fillStyle='#e4f5ff';ctx.globalAlpha=alpha*pulse*.25;
  ctx.fillRect(left+border,top+size-border,size-border*2,1);
  // A small glint stays within the border; only this isolated accent glows.
  const travel=Math.floor(tickN/4)%(size-8);
  ctx.fillStyle='#e4f5ff';ctx.globalAlpha=alpha*.65;ctx.shadowColor=color;ctx.shadowBlur=4;
  ctx.fillRect(left+4+travel,top,4,border);
  ctx.restore();
}

function drawRewardPulses(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number) {
  const directions=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
  for(const fx of state.rewardEffects){
    const onPlayer=fx.target==='player'||state.rubyTileX===-1;
    const x=Math.round((onPlayer?state.playerX:(state.rubyTileX+.5)*TILE_SIZE)-camX);
    const y=Math.round((onPlayer?state.playerY:(state.rubyTileY+.5)*TILE_SIZE)-camY);
    const progress=1-fx.ticks/36,fade=Math.min(1,fx.ticks/18),radius=18+Math.floor(progress*9)*3;
    const color=fx.kind==='heal'?(fx.target==='ruby'?'#ff88aa':'#66cc88'):fx.kind==='shield'?(fx.target==='ruby'?'#49bfb1':'#6c9ce0'):fx.kind==='speed'?'#60d8c7':fx.kind==='electric'?'#e6cf65':fx.kind==='restore'?'#edc75b':'#82b7ef';
    ctx.save();ctx.shadowBlur=0;
    if(fx.kind==='heal'){
      for(let i=0;i<3;i++){
        const px=x+(i-1)*21,py=Math.round(y-28-progress*36-i%2*9);
        ctx.globalAlpha=fade*(i===1?.9:.55);ctx.fillStyle=color;
        ctx.fillRect(px-8,py-3,16,6);ctx.fillRect(px-3,py-8,6,16);
        ctx.fillStyle='#eaffef';ctx.fillRect(px-2,py-6,2,5);ctx.fillRect(px-6,py-2,5,2);
      }
    }else if(fx.kind==='shield'){
      // Four square corner brackets echo the plain shield without a blurry extra box.
      ctx.fillStyle=color;ctx.globalAlpha=fade*.6;
      for(const dx of [-1,1])for(const dy of [-1,1]){
        const px=x+dx*radius,py=y+dy*radius;
        ctx.fillRect(px-(dx>0?12:0),py-2,12,4);ctx.fillRect(px-2,py-(dy>0?12:0),4,12);
      }
    }else{
      // The full-energy ray vocabulary, with distinct patterns for each reward.
      ctx.shadowColor=color;ctx.shadowBlur=6;
      for(let i=0;i<8;i++){
        const [dx,dy]=directions[i];
        ctx.globalAlpha=fade*(i%2?.5:.85);
        const reach=radius+(fx.kind==='restore'?12:0);
        drawEnergyPixelRay(ctx,x+dx*reach,y+dy*reach,dx,dy,color,fx.kind==='restore'?1.5:1);
        if(fx.kind==='electric'&&i%2===0){
          ctx.shadowBlur=0;drawPixelBolt(ctx,x+dx*reach,y+dy*reach,16,'#fff1ac');ctx.shadowBlur=6;
        }
      }
      if(fx.kind==='energy'||fx.kind==='restore'){
        ctx.shadowBlur=0;ctx.globalAlpha=fade*.8;
        drawCompassStar(ctx,x,y-36-Math.floor(progress*6)*3,fx.kind==='restore'?24:16,color);
        ctx.fillStyle='#fff4dc';ctx.fillRect(x-2,y-38-Math.floor(progress*6)*3,4,4);
      }
      if(fx.kind==='speed'){
        ctx.shadowBlur=0;ctx.fillStyle='#d7fff4';ctx.globalAlpha=fade*.65;
        for(let i=0;i<3;i++){const px=x-12+i*12,py=y+24+Math.floor(progress*7)*3;ctx.fillRect(px-3,py,6,12-i*3);}
      }
    }
    ctx.restore();
  }
}

// Blocky diamond shape (like playing card diamond) centered at (cx,cy) fitting in `sz`
function drawPixelDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string) {
  const p = Math.max(2, Math.floor(sz / 10)); // pixel unit
  const rows = 9;   // must be odd for a symmetric diamond
  const mid = Math.floor(rows / 2);
  ctx.fillStyle = color;
  for (let i = 0; i < rows; i++) {
    const dist = Math.abs(i - mid);
    const w = (mid - dist + 1) * 2 * p;
    const x = cx - w / 2;
    const y = cy - mid * p + i * p;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), p);
  }
}

// 8-pointed compass/north star — 4 long cardinal tips, 4 shorter diagonal tips
function drawCompassStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string) {
  const u=Math.max(2,Math.round(sz/12));cx=Math.round(cx);cy=Math.round(cy);ctx.fillStyle=color;
  ctx.fillRect(cx-u,cy-u*5,u*2,u*10);ctx.fillRect(cx-u*5,cy-u,u*10,u*2);
  ctx.fillRect(cx-u*2,cy-u*2,u*4,u*4);
  for(const dx of [-1,1])for(const dy of [-1,1])ctx.fillRect(cx+dx*u*3-1,cy+dy*u*3-1,2,2);
}

// Pixel lightning bolt centered at (cx,cy) fitting inside `sz` — classic ⚡ shape
function drawPixelBolt(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, color: string) {
  const cols = 8, rows = 10;
  const p = Math.max(1, Math.floor(sz / rows));
  const ox = Math.round(cx - (cols * p) / 2);
  const oy = Math.round(cy - (rows * p) / 2);
  const grid = [
    [0, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0],
  ];
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c]) ctx.fillRect(ox + c * p, oy + r * p, p, p);
    }
  }
}


function drawRubyGem(ctx: CanvasRenderingContext2D, sx: number, sy: number, tickN: number) {
  ctx.save();ctx.translate(Math.round(sx),Math.round(sy));const pulse=.7+.3*Math.abs(Math.sin(tickN*.06));
  ctx.shadowColor=RUBY_COLOR;ctx.shadowBlur=Math.min(6,14*pulse);ctx.fillStyle=RUBY_COLOR;ctx.fillRect(-18,-18,36,36);
  ctx.shadowBlur=Math.min(6,0);ctx.fillStyle='#780d30';ctx.fillRect(-14,-14,28,28);
  ctx.shadowColor='#ff6e99';ctx.shadowBlur=Math.min(6,5);drawCompassStar(ctx,0,0,24,'#ff88aa');
  ctx.shadowBlur=Math.min(6,0);ctx.fillStyle='#ffe6eb';ctx.fillRect(-2,-2,4,4);ctx.fillStyle='#ffb6ca';ctx.fillRect(-12,-12,3,3);
  for(let i=0;i<3;i++){
    const life=((tickN+i*23)%72)/72;ctx.globalAlpha=(1-life)*.45;ctx.fillStyle='#ff88aa';ctx.shadowBlur=Math.min(6,4);
    ctx.fillRect((i%2?1:-1)*23-1,12-Math.floor(life*12)*3,3,3);
  }
  ctx.restore();
}

function drawBombDevice(ctx: CanvasRenderingContext2D, x: number, y: number, powered: boolean, tick: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  const base=powered?'#ffcc22':'#ff8833',light=powered?'#fff1ae':'#ffd0a6',dark=powered?'#6b4b13':'#713511';
  ctx.shadowColor=base;ctx.shadowBlur=Math.min(6,12);ctx.fillStyle=base;ctx.fillRect(-18,-15,36,33);
  ctx.shadowBlur=Math.min(6,0);ctx.fillStyle=dark;ctx.fillRect(-14,-11,28,25);
  ctx.shadowColor=base;ctx.shadowBlur=Math.min(6,5);drawCompassStar(ctx,0,1,20,base);
  ctx.shadowBlur=Math.min(6,0);ctx.fillStyle=light;ctx.fillRect(-2,-1,4,4);ctx.fillRect(-12,-9,3,3);
  ctx.fillStyle='#bb9961';ctx.fillRect(3,-23,4,8);ctx.fillRect(7,-27,8,4);
  ctx.globalAlpha=.6+.4*Math.abs(Math.sin(tick*.23));ctx.shadowColor=base;ctx.shadowBlur=Math.min(6,8);
  drawCompassStar(ctx,15,-27,12,light);ctx.fillStyle='#ffffff';ctx.fillRect(14,-28,2,2);ctx.restore();
}

function drawBombBlast(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, ticks: number) {
  ctx.save();const fade=Math.min(1,ticks/28),progress=1-fade,r=Math.max(0,radius);
  ctx.shadowColor='#ff6a25';ctx.shadowBlur=Math.min(6,30);ctx.globalAlpha=fade*.8;ctx.strokeStyle='#ff9c38';ctx.lineWidth=18;ctx.strokeRect(x-r,y-r,r*2,r*2);
  ctx.shadowBlur=Math.min(6,10);ctx.globalAlpha=fade;ctx.strokeStyle='#fff1b6';ctx.lineWidth=5;ctx.strokeRect(x-r,y-r,r*2,r*2);
  const inner=r*.65;ctx.globalAlpha=fade*.6;ctx.strokeStyle='#ffce53';ctx.lineWidth=6;ctx.strokeRect(x-inner,y-inner,inner*2,inner*2);
  ctx.shadowBlur=Math.min(6,0);ctx.globalAlpha=fade*.14;ctx.fillStyle='#ff6a25';ctx.fillRect(x-r,y-r,r*2,r*2);
  ctx.shadowColor='#ff8833';ctx.shadowBlur=Math.min(6,10);
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6,reach=r*(.6+progress*.4),px=x+Math.cos(angle)*reach,py=y+Math.sin(angle)*reach;
    const height=9+Math.sin(progress*Math.PI)*(12+i%3*6);ctx.globalAlpha=fade*.8;ctx.fillStyle=i%2?'#ff833d':'#ffcf6c';
    ctx.fillRect(Math.round(px)-4,Math.round(py-height),8,height);ctx.fillStyle='#fff2c7';ctx.fillRect(Math.round(px)-1,Math.round(py-height)+3,3,Math.max(3,height*.45));
  }
  ctx.globalAlpha=fade*.75;drawCompassStar(ctx,x,y,66+progress*54,'#ffb744');ctx.globalAlpha=fade*fade*.9;drawCompassStar(ctx,x,y,36,'#fff2c7');ctx.restore();
}

function drawResourcePickup(ctx: CanvasRenderingContext2D, x: number, y: number, health: boolean, tick: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));const pulse=.7+.3*Math.abs(Math.sin(tick*.07));
  ctx.shadowColor=health?'#ff4466':'#66aaff';ctx.shadowBlur=Math.min(6,10*pulse);
  if(health){
    ctx.fillStyle='#ff4466';ctx.fillRect(-15,-6,30,12);ctx.fillRect(-6,-15,12,30);
    ctx.shadowBlur=Math.min(6,0);ctx.fillStyle='#bd3052';ctx.fillRect(-12,-3,24,6);ctx.fillRect(-3,-12,6,24);
    ctx.fillStyle='#ffb4c8';ctx.fillRect(-3,-11,3,6);
  }else{
    drawPixelBolt(ctx,0,0,32,'#66aaff');ctx.shadowBlur=Math.min(6,0);drawPixelBolt(ctx,0,0,24,'#2e65a6');
    ctx.fillStyle='#cde5ff';ctx.fillRect(3,-12,3,6);
  }
  ctx.shadowBlur=Math.min(6,5);ctx.fillStyle=health?'#fff0f3':'#e6f3ff';ctx.fillRect(-2,-2,4,4);
  for(let i=0;i<2;i++){
    const life=((tick+i*32)%64)/64;ctx.globalAlpha=(1-life)*.45;
    ctx.fillRect((i?1:-1)*19-1,10-Math.floor(life*8)*3,3,3);
  }
  ctx.restore();
}

function drawMobBody(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, flash: boolean) {
  ctx.save();ctx.shadowColor=color;ctx.shadowBlur=8;ctx.fillStyle=color;ctx.fillRect(x,y,width,height);
  if(!flash){const pad=Math.max(2,Math.floor(Math.min(width,height)*.12));ctx.shadowBlur=0;ctx.fillStyle='#00000044';ctx.fillRect(x+pad,y+pad,width-pad*2,height-pad*2);}
  ctx.restore();
}

function drawMobBrackets(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number, width=3) {
  ctx.save();ctx.shadowColor=color;ctx.shadowBlur=Math.min(6,12);ctx.strokeStyle=color;ctx.globalAlpha*=alpha;ctx.lineWidth=width;ctx.strokeRect(x-radius,y-radius,radius*2,radius*2);ctx.restore();
}

// Ice shield: a stepped octagonal frame of solid ice blocks with four pale corner crystals and a small glow.
function drawMobIceShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, tick: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  const pulse=.75+.25*Math.abs(Math.sin(tick*.15)),r=Math.round(radius*1.3/6)*6,cut=Math.round(r*.36/6)*6,w=6;
  ctx.globalAlpha=pulse;ctx.shadowColor='#aaeeff';ctx.shadowBlur=4;ctx.fillStyle='#aaeeff';
  // Four straight sides and four 45° corner steps, all axis-aligned blocks.
  ctx.fillRect(-r+cut,-r,(r-cut)*2,w);ctx.fillRect(-r+cut,r-w,(r-cut)*2,w);
  ctx.fillRect(-r,-r+cut,w,(r-cut)*2);ctx.fillRect(r-w,-r+cut,w,(r-cut)*2);
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]])for(let k=0;k<cut;k+=w)
    ctx.fillRect(sx>0?r-cut+k:-r+cut-k-w,sy>0?r-w-k:-r+k,w,w);
  ctx.shadowBlur=0;ctx.fillStyle='#ffffff';
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]])ctx.fillRect(sx*(r-cut/2)-3,sy*(r-cut/2)-3,6,6);
  ctx.restore();
}

function drawMobAttack(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, targetX: number, targetY: number, ticks: number, color: string) {
  if(type==='sniper'||type==='healer'||type==='shielder'||type==='bomber')return;
  ctx.save();ctx.shadowColor=color;ctx.shadowBlur=3;
  const fade=Math.min(1,ticks/14),progress=1-fade,dx=targetX-x,dy=targetY-y,len=Math.hypot(dx,dy)||1;
  if(type==='energy_leech'){
    // Energy travels into the collector, with an angular tether and square sparks.
    ctx.globalAlpha=fade*.4;ctx.strokeStyle='#c77aff';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(targetX,targetY);ctx.lineTo(x,targetY);ctx.lineTo(x,y);ctx.stroke();
    for(let i=0;i<4;i++){
      const t=(progress+i/4)%1,px=Math.round(targetX-dx*t),py=Math.round(targetY-dy*t);
      ctx.globalAlpha=fade;ctx.shadowBlur=5;ctx.fillStyle=i%2?'#fff1ad':'#e7baff';ctx.fillRect(px-2,py-2,4,4);
    }
  }else if(type==='ghost'){
    const px=x+dx*progress,py=y+dy*progress;ctx.globalAlpha=.8;ctx.strokeStyle=color;ctx.lineWidth=7;ctx.lineCap='square';
    ctx.beginPath();ctx.moveTo(px-dx/len*18,py-dy/len*18);ctx.lineTo(px,py);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#eee4ff';ctx.lineWidth=3;ctx.stroke();
  }else if(type==='armored'||type==='splitter'){
    const px=x+dx*progress,py=y+dy*progress;ctx.globalAlpha=.9;ctx.fillStyle=color;ctx.fillRect(px-9,py-9,18,18);
    ctx.shadowBlur=0;ctx.fillStyle='#00000044';ctx.fillRect(px-6,py-6,12,12);ctx.fillStyle='#ffffff';ctx.fillRect(px-3,py-3,6,6);
  }else if(type==='normal'||type==='mini_splitter'){
    const reach=18+progress*30,angle=Math.atan2(dy,dx);ctx.globalAlpha=fade*.85;
    for(let i=-2;i<=2;i++){const a=angle+i*.24,px=x+Math.cos(a)*reach,py=y+Math.sin(a)*reach;ctx.fillStyle=color;ctx.fillRect(Math.round(px)-3,Math.round(py)-3,6,6);}
  }else{
    ctx.globalAlpha=fade*.75;ctx.strokeStyle=color;ctx.lineWidth=10;ctx.lineCap='square';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(targetX,targetY);ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.stroke();
  }
  ctx.restore();
}

// Challenges show the guardian's HP only in the top bar, so the over-head bars are hidden there.
let hideBossHeadBars = false;

function drawBossHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, hp: number, maxHp: number, baseColor: string) {
  if (hideBossHeadBars) return;
  ctx.save();ctx.shadowBlur=0;x=Math.round(x);y=Math.round(y);width=Math.round(width);
  const pct=Math.max(0,Math.min(1,hp/Math.max(1,maxHp))),color=pct>.5?baseColor:pct>.25?'#ff983d':'#ffe17b';
  ctx.fillStyle='#0a101b';ctx.fillRect(x-1,y-1,width+2,7);
  ctx.strokeStyle=baseColor+'88';ctx.lineWidth=1;ctx.strokeRect(x-.5,y-.5,width+1,6);
  ctx.shadowColor=color;ctx.shadowBlur=4;ctx.fillStyle=color;ctx.fillRect(x,y,Math.floor(width*pct),5);
  ctx.restore();
}

// Neptune rule sheet pictures: a stand-in Sea Chanter drawn with the real boss renderer.
let guideBoss: GameState['enemies'][0] | null = null;
function drawGuideCelestial(ctx: CanvasRenderingContext2D, kind: SpecialSkill, age: number, tick: number) {
  ctx.save(); ctx.translate(100, 60);
  const scale = kind === 'sea_chanter' ? .14 : .32;
  ctx.scale(scale, scale);
  drawCelestialCast(ctx, kind, 0, 0, age, tick);
  ctx.restore();
}

function drawGuideBoss(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, diving: boolean) {
  if (!guideBoss) { const s = createInitialState(); godSpawnBoss(s, 'sea_chanter'); guideBoss = s.enemies.find(e => e.type === 'sea_chanter') ?? null; }
  if (!guideBoss?.sea) return;
  guideBoss.sea.mode = diving ? 'diving' : 'hunting'; guideBoss.hp = guideBoss.maxHp; guideBoss.targetTileX = guideBoss.tileX + 1; guideBoss.targetTileY = guideBoss.tileY;
  const hide = hideBossHeadBars; hideBossHeadBars = true;
  ctx.save(); ctx.translate(x, y); ctx.scale(.8, .8); drawEnemy(ctx, guideBoss, 0, 0, tick); ctx.restore();
  hideBossHeadBars = hide;
}

// Moon rule sheet: the Queen disguised as her Echo, or showing her true self.
let guideQueen: GameState['enemies'][0] | null = null;
function drawGuideQueen(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, disguised: boolean) {
  if (!guideQueen) { const s = createInitialState(); godSpawnBoss(s, 'splitter_queen'); guideQueen = s.enemies.find(e => e.type === 'splitter_queen') ?? null; }
  if (!guideQueen) return;
  guideQueen.hp = guideQueen.maxHp; guideQueen.phaseTimer = 999;
  const hide = hideBossHeadBars; hideBossHeadBars = true;
  ctx.save(); ctx.translate(x, y); ctx.scale(.6, .6); drawEnemy(ctx, disguised ? { ...guideQueen, type: 'queen_echo' } : guideQueen, 0, 0, tick); ctx.restore();
  hideBossHeadBars = hide;
}

// Sun rule sheet: the Fiery King with his real model.
let guideKing: GameState['enemies'][0] | null = null;
function drawGuideKing(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  if (!guideKing) { const s = createInitialState(); godSpawnBoss(s, 'fiery_king'); guideKing = s.enemies.find(e => e.type === 'fiery_king') ?? null; }
  if (!guideKing) return;
  guideKing.hp = guideKing.maxHp; guideKing.targetTileX = guideKing.tileX + 1; guideKing.targetTileY = guideKing.tileY;
  const hide = hideBossHeadBars; hideBossHeadBars = true;
  ctx.save(); ctx.translate(x, y); ctx.scale(.6, .6); drawEnemy(ctx, guideKing, 0, 0, tick); ctx.restore();
  hideBossHeadBars = hide;
}

let guideWeaver: GameState['enemies'][0] | null = null;
function drawGuideWeaver(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  if (!guideWeaver) { const s = createInitialState(); godSpawnBoss(s, 'thorn_weaver'); guideWeaver = s.enemies.find(e => e.type === 'thorn_weaver') ?? null; }
  if (!guideWeaver) return;
  guideWeaver.hp = guideWeaver.maxHp; guideWeaver.targetTileX = guideWeaver.tileX + 1; guideWeaver.targetTileY = guideWeaver.tileY;
  const hide = hideBossHeadBars; hideBossHeadBars = true;
  ctx.save(); ctx.translate(x, y); ctx.scale(.6, .6); drawEnemy(ctx, guideWeaver, 0, 0, tick); ctx.restore();
  hideBossHeadBars = hide;
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: GameState['enemies'][0], sx: number, sy: number, tickN: number, shielded = false) {
  const cfg = ENEMY_CONFIGS[e.type];
  if (e.type === 'aegis_sentinel' || e.type === 'aegis_construct' || e.type === 'astral_twins') {
    drawEncounterEnemy(ctx, e, sx, sy, tickN, !(hideBossHeadBars && e.type !== 'aegis_construct')); return;
  }
  if (drawNeptuneUnit(ctx, e, sx, sy, tickN)) return;
  if (drawGaiaUnit(ctx, e, sx, sy, tickN)) return;
  if (drawMoonUnit(ctx, e, sx, sy, tickN)) return;
  if (drawSunUnit(ctx, e, sx, sy, tickN)) return;
  const size = Math.floor(TILE_SIZE * cfg.bodyFraction);
  const half = size / 2;
  const pad = Math.max(2, Math.floor(size * 0.12));
  const flash = e.flashTicks > 0;
  // Custom casters animate their real windup, rather than an unrelated cooldown.
  const castProgress = e.type === 'splitter_queen' || e.type === 'queen_echo'
    ? (e.windupTicks > 0 ? 1 - e.windupTicks / QUEEN_WINDUP_TICKS : 0)
    : e.type === 'thorn_weaver'
      ? ((e.thorn?.windupTicks ?? 0) > 0 ? 1 - e.thorn!.windupTicks / THORN_WINDUP : 0)
      : e.type === 'blind_prayer'
        ? ((e.prayer?.escapeWindupTicks ?? 0) > 0 ? 1 - e.prayer!.escapeWindupTicks / PRAYER_ESCAPE_WINDUP : 0)
        : e.type === 'frost_warden'
          ? (e.windupTicks > 0 && e.windupTicks <= 30 ? 1 - e.windupTicks / 30 : 0)
          : e.type==='charger'
            ? ((e.chargeWindupTicks??0)>0?1-e.chargeWindupTicks!/CHARGER_WINDUP_TICKS:0)
            : e.attackTimer > 0 && e.attackTimer <= 15 && !e.exploding ? 1 - e.attackTimer / 15 : 0;
  const attacking = castProgress > 0;
  const attackScale = 1 + 0.15 * castProgress;
  // Bomber explode animation: gradually swell up as fuse ticks down from 60
  const explodeScale = (e.type === 'bomber' && e.exploding) ? (1 + 0.5 * (1 - Math.max(0, e.explodeTick) / 60)) : 1;
  // Attack-impact animation: punchy bloat-then-squash the instant a hit actually lands (driven by shootTicks,
  // the same timer that drives the per-type attack-projectile visuals), decaying back to normal size.
  const impactMax = e.type === 'sea_chanter' ? 24 : e.type === 'splitter_queen' || e.type === 'queen_echo' || e.type === 'frost_warden' ? 20 : e.type === 'devourer' ? 16 : (e.type === 'sniper' || e.type === 'fiery_king') ? 22 : 14;
  const impactT = e.shootTicks > 0 ? 1 - e.shootTicks / impactMax : 1;
  const impactScale = e.shootTicks > 0 ? 1 + 0.35 * Math.exp(-impactT * 4) * Math.cos(impactT * Math.PI * 2.2) : 1;
  const drawSz = Math.floor(size * attackScale * explodeScale * impactScale);
  const drawH = drawSz / 2;
  const color = flash ? '#ffffff' : cfg.color;

  // Heal aura — pink glow ring pulsing outward when a healer's pulse just landed on this enemy
  if (e.healFlashTicks > 0 && (isBossType(e.type)||e.type==='queen_echo')) {
    const hProgress = e.healFlashTicks / 20; // 1 -> 0
    const auraSz = drawSz + 8 + 16 * (1 - hProgress);
    const auraH = auraSz / 2;
    ctx.save();
    ctx.globalAlpha = hProgress * 0.85;
    ctx.shadowColor = '#ff44cc';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#ff77dd';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx - auraH, sy - auraH, auraSz, auraSz);
    ctx.restore();
  }

  // Glow — brightens during attack wind-up
  if(e.healFlashTicks>0&&!isBossType(e.type)&&e.type!=='queen_echo'){
    const fade=e.healFlashTicks/20;drawMobBrackets(ctx,sx,sy,half+4+(1-fade)*8,'#ff77dd',fade*.85,3);
  }
  ctx.shadowColor = e.exploding ? '#ff4400' : color;
  ctx.shadowBlur = e.exploding ? (14 + 6 * Math.abs(Math.sin(tickN * 0.3)))
    : attacking ? (16 + 8 * (1 - e.attackTimer / 15))
      : 8;

  if(isBossType(e.type) && e.type !== 'storm_reaper'){
    const cosmicSize=size*(e.type==='devourer'?devourerBodyScale(e):1);
    ctx.save();if(isSeaChanterDiving(e))ctx.globalAlpha=.34;
    drawCosmicBossAccents(ctx,e.type,sx,sy,cosmicSize,tickN);ctx.restore();
  }

  if (e.type === 'thorn_weaver') {
    ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
    const spriteScale = Math.floor(TILE_SIZE * cfg.bodyFraction) / 60 * attackScale * impactScale;
    ctx.scale(spriteScale, spriteScale);
    const casting = (e.thorn?.windupTicks ?? 0) > 0;
    const erupting = e.shootTicks > 0;
    const leaf = flash ? '#ffffff' : '#88bc45';
    const bark = flash ? '#eeeecc' : '#565033';
    const sway = Math.round(Math.sin(tickN * 0.045) * 2);
    ctx.save(); ctx.translate(sway, 0);
    ctx.shadowBlur = 0;
    // Crooked root tendrils, deliberately unequal and open rather than broad side fans.
    ctx.fillStyle = '#526e32';
    ctx.fillRect(-37, -6, 16, 6); ctx.fillRect(-42, -19, 6, 18);
    ctx.fillRect(-38, -24, 13, 5); ctx.fillRect(-29, -20, 4, 8);
    ctx.fillStyle = bark;
    ctx.fillRect(21, 7, 14, 6); ctx.fillRect(31, -6, 6, 17);
    ctx.fillRect(34, -11, 13, 5); ctx.fillRect(43, -21, 5, 13);
    ctx.fillStyle = leaf; ctx.fillRect(-45, -14, 5, 6); ctx.fillRect(44, -27, 5, 9);
    ctx.fillRect(49, -26, 6, 4);
    ctx.fillStyle = '#d8ef9b'; ctx.fillRect(-42, -25, 4, 4); ctx.fillRect(35, 2, 4, 3);
    // Saturated green square rim surrounding a single rectangular bark inset.
    ctx.shadowColor = '#718b35'; ctx.shadowBlur = casting ? 6 : 4;
    ctx.fillStyle = flash ? '#ffffff' : '#718b35'; ctx.fillRect(-30, -30, 60, 60); ctx.shadowBlur = 0;
    ctx.fillStyle = bark; ctx.fillRect(-25, -25, 50, 50);
    // Brown grain stays inside the rectangle instead of breaking its outline into green ribs.
    ctx.fillStyle = '#7d7543'; ctx.fillRect(-15, -17, 3, 30); ctx.fillRect(13, -19, 3, 34);
    ctx.fillStyle = '#3f3c24'; ctx.fillRect(-3, -24, 4, 13); ctx.fillRect(1, 11, 4, 13);
    // One luminous slit eye in a split seed. No paired siren eyes, mouth, or cheek markings.
    ctx.shadowColor = '#d8ef9b'; ctx.shadowBlur = 0;
    ctx.fillStyle = flash ? '#ffffff' : '#cfdf87';
    ctx.fillRect(-8, erupting ? -12 : -10, 17, erupting ? 21 : 17);
    ctx.shadowBlur = 0; ctx.fillStyle = '#14261f';
    ctx.fillRect(casting ? -1 : -4, erupting ? -10 : -8, casting ? 4 : 9, erupting ? 17 : 13);
    // Four smaller eyes frame the main eye: above, below, left and right.
    for (const [eyeX, eyeY] of [[-3, -21], [-3, 14], [-21, -4], [16, -4]]) {
      ctx.shadowColor = '#d8ef9b'; ctx.shadowBlur = casting ? 6 : 3;
      ctx.fillStyle = flash ? '#ffffff' : '#cfdf87'; ctx.fillRect(eyeX - 2, eyeY - 2 + (casting ? 3 : 0), 11, casting ? 4 : 9);
      ctx.shadowBlur = 0; ctx.fillStyle = '#14261f'; ctx.fillRect(eyeX + 2, eyeY + (casting ? 1 : 0), 4, casting ? 2 : 5);
    }
    // Asymmetric leafy hood grows up and over the pod, like a crooked seed husk.
    ctx.fillStyle = leaf; ctx.beginPath();
    ctx.moveTo(-29, -6); ctx.lineTo(-35, -6); ctx.lineTo(-35, -24); ctx.lineTo(-40, -24);
    ctx.lineTo(-40, -33); ctx.lineTo(-30, -33); ctx.lineTo(-30, -40); ctx.lineTo(-19, -40);
    ctx.lineTo(-19, -47); ctx.lineTo(-7, -47); ctx.lineTo(-7, -42); ctx.lineTo(6, -42);
    ctx.lineTo(6, -35); ctx.lineTo(16, -35); ctx.lineTo(16, -29); ctx.lineTo(2, -29);
    ctx.lineTo(2, -33); ctx.lineTo(-10, -33); ctx.lineTo(-10, -29); ctx.lineTo(-20, -29);
    ctx.lineTo(-20, -20); ctx.lineTo(-26, -20); ctx.lineTo(-26, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c4dd7a'; ctx.fillRect(-28, -34, 13, 3); ctx.fillRect(-18, -39, 12, 3);
    ctx.fillStyle = '#537d35'; ctx.fillRect(-31, -23, 4, 12); ctx.fillRect(-21, -30, 9, 4);
    // A single off-centre flower on a bent stalk replaces the three-pronged crown.
    ctx.fillStyle = '#526e32'; ctx.fillRect(11, -40, 5, 14); ctx.fillRect(13, -44, 13, 5);
    const bloom = casting || erupting ? 3 : 0;
    ctx.fillStyle = casting ? '#e99ab9' : '#bb688b';
    ctx.fillRect(19 - bloom, -52, 10 + bloom * 2, 14); ctx.fillRect(15, -48 - bloom, 18, 7 + bloom * 2);
    ctx.fillStyle = '#f0c9bd'; ctx.fillRect(22, -47, 5, 5);
    // Three splayed, crooked roots continue the pod contour into the ground.
    ctx.fillStyle = bark;
    ctx.fillRect(-10, 24, 6, 12); ctx.fillRect(-22, 32, 15, 5); ctx.fillRect(-25, 35, 7, 4);
    ctx.fillRect(3, 27, 6, 12); ctx.fillRect(7, 36, 10, 5);
    ctx.fillRect(14, 20, 5, 11); ctx.fillRect(17, 28, 12, 5); ctx.fillRect(26, 25, 5, 6);
    ctx.fillStyle = '#88bc45'; ctx.fillRect(-25, 34, 6, 3); ctx.fillRect(13, 38, 5, 3);
    ctx.restore();
    // Falling leaf fragments and pink pollen retain his original woodland atmosphere.
    for (let i = 0; i < 8; i++) {
      const life = ((tickN + i * 37) % 80) / 80, x = Math.sin(i * 2.4 + life) * 53;
      ctx.globalAlpha = Math.sin(life * Math.PI) * 0.8; ctx.fillStyle = i % 3 ? leaf : '#dda3bb';
      let px = Math.round(x / 3) * 3;
      const py = Math.round((25 - life * 80) / 3) * 3;
      if (Math.abs(px) < 32 && py > -32 && py < 28) px = (px < 0 ? -1 : 1) * (32 + i % 4 * 3);
      ctx.fillRect(px, py, 6, 3); if (i % 3) ctx.fillRect(px + 3, py - 3, 3, 3);
    }
    // Small rising pollen motes add density without obscuring the eyes.
    for (let i = 0; i < 3; i++) {
      const life = ((tickN + i * 23) % 100) / 100;
      const px = (i % 2 ? 1 : -1) * (35 + i % 4 * 5);
      ctx.globalAlpha = Math.sin(life * Math.PI) * 0.6;
      ctx.fillStyle = i % 3 ? '#b5c67b' : '#d99bb3';
      ctx.fillRect(px, Math.round((38 - life * 85) / 3) * 3, 2, 2);
    }
    ctx.globalAlpha=1;drawBossHealthBar(ctx,-28,-66,56,e.hp,e.maxHp,leaf);
    ctx.restore(); return;
  }

  if (e.type === 'sea_chanter') {
    ctx.save();
    const diving = isSeaChanterDiving(e);
    const preparing = !diving && e.hp <= e.maxHp * 0.5;
    const singing = !diving && (e.sea?.songWindupTicks ?? 0) > 0;
    const water = flash ? '#ffffff' : '#3998d6';
    const pearl = flash ? '#ffffff' : '#d6eeff';
    const bob = diving ? 3 : Math.round(Math.sin(tickN * 0.05) * 2);
    ctx.translate(Math.round(sx), Math.round(sy) + bob);
    if (!diving) ctx.scale(impactScale, impactScale);
    // A faint stepped wake remains visible while the submerged alien swims away.
    ctx.shadowBlur = 0; ctx.strokeStyle = '#6bb8e8'; ctx.lineWidth = 2;
    const moveX = e.targetTileX - e.tileX, moveY = e.targetTileY - e.tileY;
    for (let i = 0; i < (diving ? 5 : 1); i++) {
      ctx.globalAlpha = diving ? 0.24 - i * 0.035 : 0.13;
      const spread = 28 + i * 7 + Math.floor(tickN / 8) % 3 * 2;
      ctx.strokeRect(-spread - moveX * i * 8, -15 - moveY * i * 8, spread * 2, 32);
    }
    ctx.globalAlpha = diving ? 0.28 : 1;
    if (!diving) {
      // Fan-like side fins: violet edges, aqua membranes, and crisp pearl fin rays.
      ctx.fillStyle = '#5264a0';
      for (const side of [-1, 1]) {
        ctx.fillRect(side * 27 - 5, -23, 10, 36);
        ctx.fillRect(side * 35 - 4, -28, 8, 31);
        ctx.fillRect(side * 41 - 3, -31, 6, 21);
        ctx.fillStyle = water;
        ctx.fillRect(side * 27 - 3, -21, 6, 31);
        ctx.fillRect(side * 35 - 2, -25, 4, 24);
        ctx.fillStyle = '#a8d8ff';
        ctx.fillRect(side * 30 - 1, -18, 2, 16);
        ctx.fillStyle = '#5264a0';
      }
      // A fish-tail fluke replaces feet, keeping the silhouette aquatic and alien.
      ctx.fillStyle = '#5264a0'; ctx.fillRect(-8, 20, 16, 12);
      ctx.fillRect(-20, 29, 16, 7); ctx.fillRect(4, 29, 16, 7);
      ctx.fillStyle = water; ctx.fillRect(-5, 20, 10, 12);
      ctx.fillRect(-17, 28, 12, 5); ctx.fillRect(5, 28, 12, 5);
      // Fin crest and one broad shell, in the same block construction as other bosses.
      ctx.fillStyle = '#5264a0'; ctx.fillRect(-10, -35, 20, 12);
      ctx.fillRect(-5, -41, 10, 10);
      ctx.fillStyle = water; ctx.fillRect(-2, -38, 4, 13);
      ctx.shadowColor = water; ctx.shadowBlur = diving ? 0 : 12;
      ctx.fillStyle = water; ctx.fillRect(-25, -24, 50, 48);
      ctx.shadowBlur = 0;
      ctx.fillStyle = flash ? '#eeeeff' : '#123f72'; ctx.fillRect(-21, -20, 42, 40);
      ctx.fillStyle = flash ? '#ffffff' : '#2d719e'; ctx.fillRect(-17, -14, 34, 29);
      // Original symmetrical pearl eyes and short lashes.
      ctx.fillStyle = '#0b294d'; ctx.fillRect(-18, -10, 14, 4); ctx.fillRect(4, -10, 14, 4);
      ctx.fillRect(-20, -13, 3, 5); ctx.fillRect(17, -13, 3, 5);
      ctx.fillStyle = pearl;
      ctx.fillRect(-16, -8, 11, 6); ctx.fillRect(5, -8, 11, 6);
      ctx.fillStyle = singing || e.shootTicks > 0 ? '#ff435d' : '#0b294d';
      ctx.fillRect(-10, -8, 3, 6); ctx.fillRect(7, -8, 3, 6);
      // Original gills, pearl scales and small singing mouth.
      ctx.fillStyle = '#123f72';
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) ctx.fillRect(side * 15 - 2, 2 + i * 4, 4, 2);
      ctx.fillStyle = singing ? '#e9f8ff' : '#a8d8ff'; ctx.fillRect(singing ? -4 : -2, 2, singing ? 8 : 4, singing ? 8 : 4);
      ctx.fillRect(-7, 10, 3, 3); ctx.fillRect(4, 10, 3, 3); ctx.fillRect(-2, 15, 4, 3);
    } else {
      // Underwater she turns away: a narrow fish-back silhouette with folded fins,
      // no face, and a dorsal ridge. Cardinal rotation follows the swimming direction.
      ctx.save();
      const angle = moveX || moveY ? Math.atan2(moveY, moveX) + Math.PI / 2 : 0;
      ctx.rotate(angle);
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = '#275a91'; ctx.fillRect(-16, -20, 32, 38);
      ctx.fillRect(-10, -26, 20, 8);
      ctx.fillStyle = '#123f72'; ctx.fillRect(-12, -19, 24, 34);
      ctx.fillStyle = '#5264a0';
      ctx.fillRect(-26, -7, 10, 16); ctx.fillRect(16, -7, 10, 16);
      ctx.fillStyle = '#3998d6';
      ctx.fillRect(-23, -5, 7, 9); ctx.fillRect(16, -5, 7, 9);
      ctx.fillRect(-2, -20, 4, 31); // dorsal ridge seen from above
      ctx.fillRect(-6, 17, 12, 12);
      ctx.fillRect(-16, 26, 12, 6); ctx.fillRect(4, 26, 12, 6);
      ctx.fillStyle = '#a8d8ff';
      for (let i = 0; i < 4; i++) ctx.fillRect(-6, -12 + i * 6, 12, 2);
      ctx.restore();
    }
    // Low health bubbles and brief pixel crosses show recovery underwater.
    if ((e.sea?.healPulseTicks ?? 0) > 0) {
      for (let i = 0; i < 3; i++) {
        const y = 15 - (tickN + i * 20) % 60;
        ctx.globalAlpha = diving ? 0.4 : 0.8; ctx.fillStyle = pearl;
        ctx.fillRect(-19 + i * 19, y, 6, 2); ctx.fillRect(-17 + i * 19, y - 2, 2, 6);
      }
    }
    for (let i = 0; i < (preparing ? 18 : diving ? 16 : 12); i++) {
      const life = ((tickN + i * 11) % 55) / 55;
      ctx.globalAlpha = (diving ? 0.24 : 0.6) * (1 - life);
      ctx.strokeStyle = pearl; ctx.lineWidth = 1;
      const x = (i % 2 ? 1 : -1) * (29 + i % 5 * 5);
      const y = Math.round((28 - life * 80) / 2) * 2;
      const size = i % 3 === 0 ? 5 : 3;
      if (i % 3) ctx.strokeRect(x, y, size, size);
      else {
        ctx.fillStyle = water; ctx.fillRect(x, y, 3, 5);
        ctx.fillStyle = pearl; ctx.fillRect(x, y, 2, 2);
      }
    }
    {
      ctx.globalAlpha = diving ? 0.34 : 1;
      drawBossHealthBar(ctx,-27,-51,54,e.hp,e.maxHp,water);
    }
    ctx.restore();
    return;
  }

  if (e.type === 'blind_prayer') {
    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy));
    const gold = flash ? '#ffffff' : '#ffdd22';
    const invoking = (e.prayer?.escapeWindupTicks ?? 0) > 0 || (e.prayer?.rubyCastTicks ?? 0) > 0;
    const prayerRelease = e.shootTicks > 0;
    const pulse = 0.65 + 0.35 * Math.abs(Math.sin(tickN * 0.055));
    const bob = Math.round(Math.sin(tickN * 0.045) * 2);
    ctx.translate(0, bob);
    ctx.scale(attackScale * impactScale, attackScale * impactScale);
    // A white expanding frame telegraphs the escape attack; golden afterimages
    // distinguish the temporary speed burst from the normal fleeing movement.
    if ((e.prayer?.escapeWindupTicks ?? 0) > 0) {
      const radius = Math.round(33 + 10 * (1 - e.prayer!.escapeWindupTicks / PRAYER_ESCAPE_WINDUP));
      ctx.strokeStyle = '#fff5aa'; ctx.lineWidth = 3; ctx.shadowBlur = 0;
      ctx.strokeRect(-radius, -radius, radius * 2, radius * 2);
    }
    if ((e.prayer?.escapeBoostTicks ?? 0) > 0) {
      const dx = e.targetTileX - e.tileX, dy = e.targetTileY - e.tileY;
      ctx.strokeStyle = '#ffdd22'; ctx.lineWidth = 2; ctx.shadowBlur = 0;
      for (let i = 3; i >= 1; i--) {
        ctx.globalAlpha = (4 - i) * 0.12;
        ctx.strokeRect(-25 - dx * i * 8, -25 - dy * i * 8, 50, 50);
      }
      ctx.globalAlpha = 1;
    }

 const rim=flash ? '#ffffff' : '#d7b82d';
 ctx.shadowBlur=0;
 // Matching translucent corner ornaments above and below the body.
 ctx.fillStyle='rgba(255,221,34,.24)';
 for(const vertical of [-1,1]){
 for(const side of [-1,1]){
  ctx.save();ctx.scale(side,vertical);ctx.beginPath();ctx.moveTo(24,-17);ctx.lineTo(31,-17);ctx.lineTo(31,-23);ctx.lineTo(35,-23);ctx.lineTo(35,-10);ctx.lineTo(29,-10);ctx.lineTo(29,9);ctx.lineTo(24,9);ctx.closePath();ctx.fill();
  ctx.fillStyle='#b99b27';ctx.fillRect(30,-20,3,3);ctx.restore();
 }
 }
 // Uneven translucent hanging hems give the lower edge a ghost-like silhouette.
 ctx.shadowColor=gold;ctx.shadowBlur=3;
 ctx.fillStyle=flash?'rgba(255,255,255,.4)':'rgba(215,184,45,.4)';
 for(const [x,length] of [[-21,10],[-12,17],[-3,7],[6,13],[15,9]])ctx.fillRect(x,23,7,length);
 ctx.shadowBlur=0;
 // The body follows Chanter/Queen: one square rim and a calm, flat inner panel.
 ctx.shadowColor=gold;ctx.shadowBlur=10*pulse;ctx.fillStyle=rim;ctx.fillRect(-25,-25,50,50);ctx.shadowBlur=0;
 ctx.fillStyle='#393426';ctx.fillRect(-21,-21,42,42);ctx.fillStyle='#4f452e';ctx.fillRect(-17,-16,34,32);
 // A few tiny marks inside the forehead; no separate hood or neck.
 ctx.fillStyle='#928044';for(const x of [-11,-1,9])ctx.fillRect(x,-18,2,2);
 // Single broad ancient cloth wrap, faintly showing three closed eyelids.
 ctx.fillStyle='#bdaa67';ctx.fillRect(-23,-10,46,12);
 ctx.fillStyle='rgba(0,0,0,.86)';ctx.fillRect(-27,-10,54,12);
 // Three muted yellow pixel X eyes remain visible through the black cloth.
 ctx.fillStyle=invoking || prayerRelease ? '#fff1a0' : 'rgba(255,221,34,.55)';
 for(const x of [-13,0,13]){
  for(const [dx,dy] of [[-3,-3],[1,-3],[-1,-1],[-3,1],[1,1]])ctx.fillRect(x+dx,-5+dy,2,2);
 }
 ctx.fillStyle='#17150f';ctx.fillRect(-29,-7,3,7);ctx.fillRect(26,-7,5,5);
 // Three white inscriptions are the face/body signature, kept compact and readable.
 for(let i=0;i<3;i++){ctx.save();ctx.translate((i-1)*13,invoking ? 8 : prayerRelease ? 10 : 12);ctx.scale(.78,invoking ? .95 : .78);drawPrayerGlyph(ctx,i,0,0);ctx.restore();}
 // Short embedded horn tips, and a small floating halo with a quiet centre gap.
 for(const side of [-1,1]){ctx.fillStyle='#15130d';ctx.fillRect(side*18-2,-30,4,7);ctx.fillStyle='#a78e21';ctx.fillRect(side*18-2,-30,2,3);}
 ctx.save();ctx.translate(0,invoking ? -4 : 0);
 ctx.shadowColor=gold;ctx.shadowBlur=5;ctx.fillStyle=gold;
 ctx.fillRect(-13,-45,26,2);ctx.fillRect(-18,-42,7,2);ctx.fillRect(11,-42,7,2);
 ctx.fillRect(-19,-40,2,5);ctx.fillRect(17,-40,2,5);ctx.fillRect(-16,-34,9,2);ctx.fillRect(1,-34,15,2);ctx.shadowBlur=0;ctx.restore();
 // Falling holy light and rising black fragments occupy lanes outside the blindfold and scripture.
 for(let i=0;i<16;i++){
  const side=i%2?1:-1, life=((tickN+i*19)%90)/90, sinful=i%4===0;
  const px=side*(34+(i*7)%23), py=Math.round((sinful?40-life*85:-47+life*88)/2)*2;
  const size=i%3===0?3:2;
  ctx.globalAlpha=Math.sin(life*Math.PI)*.78;
  if(sinful){
   ctx.shadowBlur=0;ctx.fillStyle='#75601d';ctx.fillRect(px-1,py-1,size+2,size+2);
   ctx.fillStyle='#090806';ctx.fillRect(px,py,size,size);
  }else{
   ctx.shadowColor=gold;ctx.shadowBlur=3;ctx.fillStyle=gold;ctx.fillRect(px,py,size,size);
   if(i%5===0){ctx.shadowBlur=0;ctx.fillStyle='#fff2b0';ctx.fillRect(px,py,1,1);}
  }
 }
 ctx.shadowBlur=0;ctx.globalAlpha=1;
 drawBossHealthBar(ctx,-27,-57,54,e.hp,e.maxHp,gold);
    ctx.restore();
    return;
  }

  // ── Boss: fully custom draw ───────────────────────────────────────────
  if (e.type === 'fiery_king') {
    const bSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const bH = bSz / 2;
    const bPad = Math.max(3, Math.floor(bSz * 0.10));
    const pulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.06));
    const hpPct = e.hp / e.maxHp;
    const bFlash = e.flashTicks > 0;
    const bodyColor = bFlash ? '#ffffff' : '#cc0022';

    // Outer crimson glow
    ctx.shadowColor = '#ff0033'; ctx.shadowBlur = Math.floor(6 * pulse);

    // Shoulder spikes (left and right) - they extend further during attack
    const spikeW = Math.max(4, Math.floor(bSz * 0.18));
    const spikeH = Math.max(6, Math.floor(bSz * (attacking ? 0.50 : 0.30)));
    ctx.fillStyle = bFlash ? '#ffffff' : '#880011';
    ctx.fillRect(sx - bH - spikeW, sy - Math.floor(spikeH * 0.6), spikeW, spikeH); // left spike
    ctx.fillRect(sx + bH, sy - Math.floor(spikeH * 0.6), spikeW, spikeH); // right spike
    // Spike tips (gold)
    ctx.fillStyle = bFlash ? '#ffffff' : '#ffcc00';
    ctx.fillRect(sx - bH - spikeW - 2, sy - Math.floor(spikeH * 0.6), 3, 3);
    ctx.fillRect(sx + bH + spikeW, sy - Math.floor(spikeH * 0.6), 3, 3);

    // Main body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx - bH, sy - bH, bSz, bSz);
    ctx.shadowBlur = 0;

    // Inner armor plate (dark inset)
    if (!bFlash) {
      ctx.fillStyle = '#4d0d1a';
      ctx.fillRect(sx - bH + bPad, sy - bH + bPad, bSz - bPad * 2, bSz - bPad * 2);
      // Gold cross/X armor detail
      ctx.fillStyle = '#ffcc0044';
      const cx = bSz - bPad * 2, gH = Math.max(1, Math.floor(bSz * 0.07));
      ctx.fillRect(sx - bH + bPad, sy - Math.floor(gH / 2), cx, gH); // horizontal bar
      ctx.fillRect(sx - Math.floor(gH / 2), sy - bH + bPad, gH, cx); // vertical bar

      // Corner rivet studs — small gold rivets bolting the armor plate, one per corner
      const rivetSz = Math.max(2, Math.floor(bSz * 0.07));
      const rivetInset = bPad + Math.floor(rivetSz * 0.8);
      ctx.fillStyle = '#ffcc00cc';
      for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) {
        ctx.fillRect(sx + ox * (bH - rivetInset) - rivetSz / 2, sy + oy * (bH - rivetInset) - rivetSz / 2, rivetSz, rivetSz);
      }
    }

    // Crown (5 spikes on top)
    if (!bFlash) {
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 4;
      const crownW = bSz;
      const crownX = sx - bH;
      const crownBase = sy - bH;
      const crownH = Math.max(5, Math.floor(bSz * (attacking ? 0.35 : 0.22)));
      // 5 alternating-height spikes: tall, short, tall, short, tall
      const spW = Math.floor(crownW / 5);
      const heights = [crownH, Math.floor(crownH * 0.55), crownH, Math.floor(crownH * 0.55), crownH];
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(crownX + i * spW, crownBase - heights[i], spW - 1, heights[i]);
      }
      ctx.shadowBlur = 0;

      // Twinkling ruby gem set into the center spike tip — a "living jewel" like the Queen's
      const gemTwinkle = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.09));
      ctx.shadowColor = '#ff0033'; ctx.shadowBlur = Math.floor(4 * gemTwinkle);
      ctx.fillStyle = `rgba(255,51,102,${gemTwinkle})`;
      ctx.fillRect(sx - 2, crownBase - heights[2] - 3, 4, 4);
      ctx.shadowBlur = 0;
    }

    // 4 eyes (2 rows of 2)
    if (!bFlash) {
      const eSz = Math.max(3, Math.floor(bSz * 0.16));
      const pSz = Math.max(2, Math.floor(eSz * 0.6));
      const ex1 = sx - bH + bPad + 2;
      const ex2 = sx + bH - bPad - eSz - 2;
      const ey1 = sy - bH + bPad + 2;
      const ey2 = ey1 + eSz + 3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, ey1, eSz, eSz); ctx.fillRect(ex2, ey1, eSz, eSz);
      ctx.fillRect(ex1, ey2, eSz, eSz); ctx.fillRect(ex2, ey2, eSz, eSz);
      // Eyes glow yellow when attacking
      ctx.fillStyle = attacking ? '#ffcc00' : '#ff0000';
      ctx.shadowColor = attacking ? '#ffcc00' : '#ff0000'; ctx.shadowBlur = attacking ? 6 : 3;
      ctx.fillRect(ex1 + 1, ey1 + 1, pSz, pSz); ctx.fillRect(ex2 + 1, ey1 + 1, pSz, pSz);
      ctx.fillRect(ex1 + 1, ey2 + 1, pSz, pSz); ctx.fillRect(ex2 + 1, ey2 + 1, pSz, pSz);
      ctx.shadowBlur = 0;

      // Wide jagged mouth with teeth
      const mW = Math.max(8, Math.floor(bSz * 0.70));
      const mH = Math.max(2, Math.floor(bSz * (attacking ? 0.18 : 0.10)));
      const mX = sx - Math.floor(mW / 2);
      const mY = ey2 + eSz + 3 + (attacking ? 4 : 0); // Drop jaw slightly when attacking
      const toothW = Math.max(2, Math.floor(mW / 6));
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(mX, mY, mW, mH);
      ctx.fillStyle = '#ffffff';
      for (let t = 0; t < 5; t++) {
        ctx.fillRect(mX + toothW * t + 1, mY - mH, Math.max(1, toothW - 2), mH + 1);
      }
    }

    // Three compact pixel flames decorate the lower armor without changing his silhouette.
    if (!bFlash) {
      const flameBase = sy + bH - bPad - 4;
      const flameWidth = Math.max(7, Math.floor(bSz * .13));
      for (let i = 0; i < 3; i++) {
        const fx = sx + Math.round((i - 1) * bSz * .23);
        const height = Math.max(8, Math.floor(bSz * (i === 1 ? .20 : .14)) + Math.round(Math.sin(tickN * .08 + i) * 1));
        const lean = i === 1 ? 1 : -1;
        ctx.shadowBlur = 0; ctx.fillStyle = '#b92d0b';
        ctx.fillRect(fx - Math.floor(flameWidth / 2), flameBase - 4, flameWidth, 4);
        ctx.fillRect(fx - Math.floor(flameWidth / 2) - 1, flameBase - 8, flameWidth + 2, 4);
        ctx.fillRect(fx - Math.floor(flameWidth / 2) + 1, flameBase - height + 2, flameWidth - 2, Math.max(2, height - 7));
        ctx.fillRect(fx + lean * 2 - 1, flameBase - height - 2, 3, 5);
        ctx.fillStyle = '#ed6414'; ctx.fillRect(fx - 2, flameBase - 5, 4, 5);
        ctx.fillRect(fx - 1, flameBase - 8, 2, 4);
      }
    }

    // HP bar above boss
    drawBossHealthBar(ctx,sx-bSz/2-5,sy-bH-16,bSz+10,e.hp,e.maxHp,'#ff334c');

    const groundPulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.08));
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = Math.floor(20 * groundPulse);
    ctx.fillStyle = `rgba(255,68,0,${0.25 * groundPulse})`;
    ctx.fillRect(sx - bH - 6, sy + bH - 4, bSz + 12, 10);
    ctx.shadowBlur = 0;

    // Orange fiery aura — a guttering flame-outline around his whole body, jittering in size/
    // brightness like unstable heat haze rather than the Queen's smooth magic-breathing pulse
    const auraFlicker = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.5) * Math.sin(tickN * 0.23 + 1));
    const fAuraR = bH + 8 + Math.floor(6 * auraFlicker);
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = Math.floor(14 * auraFlicker);
    ctx.strokeStyle = `rgba(255,${120 + Math.floor(60 * auraFlicker)},0,${0.2 + 0.15 * auraFlicker})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - fAuraR, sy - fAuraR, fAuraR * 2, fAuraR * 2);
    ctx.shadowBlur = 0;

    // Rising embers — sparks kicking off his body and drifting upward, flickering out like real
    // cinders off a flame (not orbiting him — fire doesn't circle, it rises and dies)
    const emberCount = 14;
    for (let m = 0; m < emberCount; m++) {
      const cycle = 60 + (m % 3) * 15; // varied lifespans so they don't pulse in lockstep
      const phase = (tickN + m * (cycle / emberCount) * 5.3) % cycle;
      const riseT = phase / cycle; // 0 (spawn, at his base) -> 1 (fully risen, faded out)
      const jitterX = Math.sin(tickN * 0.22 + m * 2.1) * (bH * 0.7);
      const ex = sx + (m % 2 ? 1 : -1) * (bH + 4 + m % 3 * 3) + jitterX * riseT * .15;
      const ey = sy + bH - riseT * (bSz + 22);
      const emberSz = Math.max(1, 4 - Math.floor(riseT * 2.5));
      const emberAlpha = Math.sin(riseT * Math.PI); // fades in, peaks mid-rise, fades out
      ctx.globalAlpha = emberAlpha;
      ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10;
      ctx.fillStyle = riseT < 0.4 ? '#ffee00' : riseT < 0.7 ? '#ff8800' : '#ff3300';
      ctx.fillRect(ex - emberSz / 2, ey - emberSz / 2, emberSz, emberSz);
    }
    // Extra cinders travel up the sides, adding fire without obscuring his eyes and mouth.
    for (let i = 0; i < 6; i++) {
      const life = ((tickN + i * 17) % 95) / 95;
      const side = i % 2 ? 1 : -1;
      const px = sx + side * (bH + 7 + i % 3 * 4);
      const py = sy + bH - life * (bSz + 16);
      ctx.globalAlpha = Math.sin(life * Math.PI) * .75;
      ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 5;
      ctx.fillStyle = life < .45 ? '#ffbd35' : '#e84d16';
      ctx.fillRect(Math.round(px), Math.round(py / 2) * 2, 2 + i % 2, 2 + i % 2);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Flickering flame licks — shoulder spike tips (bigger/brighter) plus the crown peak,
    // an actual guttering-fire flicker rather than a steady glow
    const flicker1 = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.45));
    const flicker2 = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.45 + 1.3));
    const flicker3 = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.5 + 2.4));
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = Math.floor(16 * flicker1);
    ctx.fillStyle = `rgba(255,${140 + Math.floor(90 * flicker1)},0,${0.75 + 0.25 * flicker1})`;
    ctx.fillRect(sx - bH - spikeW - 2, sy - Math.floor(spikeH * 0.6) - 5, 7, 6);
    ctx.shadowBlur = Math.floor(16 * flicker2);
    ctx.fillStyle = `rgba(255,${140 + Math.floor(90 * flicker2)},0,${0.75 + 0.25 * flicker2})`;
    ctx.fillRect(sx + bH + spikeW - 3, sy - Math.floor(spikeH * 0.6) - 5, 7, 6);
    ctx.shadowBlur = Math.floor(14 * flicker3);
    ctx.fillStyle = `rgba(255,${150 + Math.floor(80 * flicker3)},0,${0.7 + 0.3 * flicker3})`;
    ctx.fillRect(sx - 3, sy - bH - Math.floor(bSz * 0.30) - 6, 6, 6);
    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // ── Storm Reaper: fully custom draw (sleek angular striker, electric theme —
  // no crown/tiara since she's a rogue, not royalty like the King/Queen) ──
  if (e.type === 'storm_reaper') {
    const rSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const modelScale = rSz / 48;
    // Square afterimages preserve the fast hunter's movement tell.
    if(e.tileX !== e.targetTileX || e.tileY !== e.targetTileY){
      const dx=e.targetTileX-e.tileX, dy=e.targetTileY-e.tileY;
      ctx.save();ctx.shadowBlur=0;ctx.fillStyle='#52ffd6';
      for(let i=2;i>=1;i--){ctx.globalAlpha=.1/i;ctx.fillRect(Math.round(sx-dx*i*8-rSz/2),Math.round(sy-dy*i*8-rSz/2),rSz,rSz);}
      ctx.restore();
    }
    ctx.save();ctx.translate(sx,sy);ctx.scale(modelScale,modelScale);
    drawStormReaperModel(ctx,tickN,flash,attacking || e.shootTicks>0,Math.max(0,e.shootTicks/14));
    ctx.restore();
    drawBossHealthBar(ctx,sx-(rSz+10)/2,sy-53*modelScale,rSz+10,e.hp,e.maxHp,'#52ffd6');
    ctx.globalAlpha=1;ctx.shadowBlur=0;return;
  }

  // ── Devourer: fully custom draw (blocky, matching the rest of the game's pixel-art
  // language — grows via literal fused blocks stuck to her body, not organic curves) ──
  if (e.type === 'devourer') {
    const stacks = e.chargeDirX; // absorb-stack counter, reused from the charger's unused field
    const stackGrowth = devourerBodyScale(e); // stacks swell her; each copy generation is smaller
    // Brief feeding swell settles into the permanent stack-grown size.
    const feedingScale = 1 + 0.12 * Math.sin(Math.PI * Math.min(1, e.healFlashTicks / 26));
    const vSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale * stackGrowth * feedingScale);
    const vH = vSz / 2;
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.09));
    const hpPct = e.hp / e.maxHp;
    const vFlash = e.flashTicks > 0;
    const vHealFlash = e.healFlashTicks > 0; // pulses brightly right when she absorbs something

    // Self-split warning: a body about to bud flashes a pulsing green split frame that tightens.
    const splitLeft = DEVOURER_SELF_SPLIT_TICKS - (e.devourer?.splitTicks ?? 0);
    if (stacks > 0 && splitLeft <= DEVOURER_SELF_SPLIT_WARNING) {
      const warn = 1 - splitLeft / DEVOURER_SELF_SPLIT_WARNING, blink = Math.floor(tickN / (warn > .5 ? 3 : 6)) % 2 === 0;
      const half = Math.round(vH + 16 - warn * 8);
      ctx.save();
      ctx.globalAlpha = blink ? .95 : .4; ctx.strokeStyle = '#c6ff8a'; ctx.lineWidth = 3;
      ctx.shadowColor = '#9dd959'; ctx.shadowBlur = 6;
      ctx.strokeRect(Math.round(sx - half), Math.round(sy - half), half * 2, half * 2);
      ctx.shadowBlur = 0; ctx.fillStyle = '#c6ff8a';
      ctx.fillRect(Math.round(sx - 1), Math.round(sy - half - 6), 3, 12); ctx.fillRect(Math.round(sx - 1), Math.round(sy + half - 6), 3, 12);
      ctx.restore();
    }

    // Newborn copies scatter at a sprint: short violet/green streaks race along both flanks.
    if ((e.devourer?.newbornTicks ?? 0) > 0) {
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const run = (tickN * 2 + i * 9) % 24, y = Math.round(sy - vH * .6 + i * vH * .6);
        ctx.globalAlpha = .95 * (1 - run / 32); ctx.fillStyle = i === 1 ? '#c6ff8a' : '#b98af0';
        ctx.fillRect(Math.round(sx - vH - 18 - run), y, 14, 3); ctx.fillRect(Math.round(sx + vH + 4 + run), y, 14, 3);
      }
      ctx.restore();
    }

    // Big absorb shockwave — blocky expanding square ring, the moment she eats
    if (vHealFlash) {
      const shockProgress = 1 - e.healFlashTicks / 26; // 0 -> 1
      ctx.save();
      ctx.globalAlpha = 1 - shockProgress;
      ctx.shadowColor = '#c8ff88'; ctx.shadowBlur = 24;
      const ringSz1 = vSz * (1 + shockProgress * 2.2);
      ctx.strokeStyle = '#88ff44'; ctx.lineWidth = 5;
      ctx.strokeRect(sx - ringSz1 / 2, sy - ringSz1 / 2, ringSz1, ringSz1);
      const ringSz2 = vSz * (0.7 + shockProgress * 1.8);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.strokeRect(sx - ringSz2 / 2, sy - ringSz2 / 2, ringSz2, ringSz2);
      ctx.restore();
      ctx.shadowBlur = 0;
    }

    // Always-on violet aura ring — matches her minimap glow, gives her the same idle
    // presence the other three bosses have (King's ground-fire, Queen's motes, Reaper's halo)
    ctx.save();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.strokeStyle = '#6b2fa8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#6b2fa8'; ctx.shadowBlur = 12;
    ctx.strokeRect(sx - vH * 1.5, sy - vH * 1.5, vH * 3, vH * 3);
    ctx.restore();

    // Orbiting spore particles — blocky squares drifting around her, the persistent
    // "consuming aura" tell she was missing (King has embers, Queen has motes, Reaper has arcs)
    const sporeCount = 5;
    for (let i = 0; i < sporeCount; i++) {
      const ang = tickN * 0.025 + (Math.PI * 2 * i) / sporeCount;
      const orbitR = vH + 10 + 3 * Math.sin(tickN * 0.06 + i);
      const spx = sx + Math.cos(ang) * orbitR;
      const spy = sy + Math.sin(ang) * orbitR;
      const sporeAlpha = 0.5 + 0.4 * Math.abs(Math.sin(tickN * 0.1 + i * 1.3));
      ctx.fillStyle = i % 2 === 0 ? `rgba(136,255,68,${sporeAlpha})` : `rgba(107,47,168,${sporeAlpha})`;
      ctx.shadowColor = '#88ff44'; ctx.shadowBlur = 5;
      ctx.fillRect(spx - 2, spy - 2, 4, 4);
    }
    ctx.shadowBlur = 0;

    // Ground corruption pool — a sickly wash beneath her, bigger with more stacks
    ctx.shadowColor = '#88ff44'; ctx.shadowBlur = Math.floor(16 * pulse);
    ctx.fillStyle = `rgba(107,47,168,${0.22 * pulse})`;
    ctx.fillRect(sx - vH - 6, sy + vH - 4, vSz + 12, 10);
    ctx.shadowBlur = 0;

    // Approved square pufferfish model. Ambient spores/aura/pool above stay unchanged.
    ctx.save(); ctx.translate(sx, sy);
    const modelScale = vSz / 50;
    ctx.scale(modelScale, modelScale);
    const part = (color: string, x: number, y: number, width: number, height: number) => {
      ctx.fillStyle = vFlash ? '#ffffff' : vHealFlash && color === '#7134a2' ? '#c8a0ff' : color;
      ctx.fillRect(x, y, width, height);
    };


 // Dark purple extensions inherit the body's violet glow, like King's shoulders and Queen's ornaments.
 ctx.save();ctx.shadowColor='#9945c7';ctx.shadowBlur=9;
 part('#50206a',-31,-13,10,21);part('#50206a',21,-20,10,15);
 part('#50206a',-20,24,14,8);part('#50206a',8,24,17,5);ctx.restore();
 // Short rectangular side antennae give the silhouette a pufferfish rhythm.
 ctx.save();ctx.shadowColor='#9945c7';ctx.shadowBlur=7;
 for(const side of [-1,1]){
  ctx.save();ctx.scale(side,1);
  part('#7134a2',24,-20,12,5);part('#7134a2',24,-3,16,5);part('#7134a2',24,15,12,5);
  ctx.restore();
 }
 ctx.restore();
 ctx.shadowColor='#8e45c0';ctx.shadowBlur=9;part('#7134a2',-25,-25,50,50);ctx.shadowBlur=0;
 part('#32153e',-21,-21,42,42);part('#482153',-17,-16,34,32);
 // One large flat eye and a simple hungry mouth: no reflections, plates, or intricate shading.
 part('#9dd959',-8,-14,16,14);part('#18311b',attacking ? -1 : -3,-12,attacking ? 3 : 6,10);
 part('#19211b',-15,e.shootTicks > 0 || vHealFlash ? 4 : 7,30,e.shootTicks > 0 || vHealFlash ? 19 : attacking ? 15 : 11);
 for(const[x,h]of [[-12,7],[-5,5],[2,7],[9,5]])part('#c4ee8b',x,e.shootTicks > 0 || vHealFlash ? 4 : 7,4,h);
 if(e.shootTicks > 0 || vHealFlash)for(const x of [-10,-1,8])part('#c4ee8b',x,19,4,4);
 part('#78a647',-17,-3,3,3);part('#78a647',14,-6,3,2);part('#78a647',15,0,2,2);
 // Small swallowed-creature eyes sit inside the lopsided side chunk.
 part('#28402b',-29,-7,6,8);part('#b9d97c',-28,-5,2,2);part('#b9d97c',-25,-2,2,2);
 part('#432149',23,-16,6,6);part('#96be60',25,-15,2,2);
 ctx.save();ctx.shadowColor='#9945c7';ctx.shadowBlur=8;
 part('#7134a2',-18,-29,5,6);part('#7134a2',12,-31,6,7);ctx.restore();

    ctx.restore();

    // Absorb-stack counter, small text above the HP bar
    ctx.font = '9px monospace';
    ctx.fillStyle = '#c8ff88';
    ctx.textAlign = 'center';
    ctx.fillText(`x${stacks}`, sx, sy - vH - 20);
    ctx.textAlign = 'left';

    // HP bar above her
    drawBossHealthBar(ctx,sx-(vSz+10)/2,sy-vH-14,vSz+10,e.hp,e.maxHp,'#9dd959');

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // ── Frost Warden: fully custom draw (icy blocky theme — crystalline crown, frosty aura,
  // matches the game's rectangle-based sprite style like the rest of the bosses) ──
  if (e.type === 'frost_warden') {
    const wSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const hpPct = e.hp / e.maxHp;
    const wFlash = e.flashTicks > 0;
    ctx.save(); ctx.translate(sx, sy);
    const modelScale = wSz / 48;
    ctx.scale(modelScale, modelScale);
    ctx.shadowBlur = 0;
    const part = (color: string, x: number, y: number, width: number, height: number) => {
      ctx.fillStyle = wFlash ? '#ffffff' : color;
      ctx.fillRect(x, y, width, height);
    };

 // Two depth layers give the tilted shard belt a Saturn-like orbit around the body.
 function ringLayer(front: boolean){
  ctx.save();ctx.translate(0,6);ctx.rotate(.25);
  for(let i=0;i<24;i++){
   const angle=tickN*.012+i*Math.PI*2/24;
   if((Math.sin(angle)>=0)!==front)continue;
   ctx.save();ctx.translate(Math.cos(angle)*47,Math.sin(angle)*15);ctx.rotate(angle+Math.PI/2);
   ctx.globalAlpha=front?.8:.45;ctx.shadowColor='#aaeeff';ctx.shadowBlur=5;
   part(i%3?'#a7ddf4':'#e7f8ff',-3.5,-1.75,7,3.5);ctx.restore();
  }
  ctx.restore();
 }

 // Six-sided crystal aura, behind the face so the spiral stays legible.
 const corners: [number, number][]=[];
 for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;corners.push([Math.cos(a)*37,Math.sin(a)*37]);}
 function crystalPath(){ctx.beginPath();corners.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
 ctx.save();ctx.shadowColor='#9fe3ff';ctx.shadowBlur=8;
 crystalPath();ctx.strokeStyle='rgba(138,219,250,.28)';ctx.lineWidth=10;ctx.stroke();
 ctx.shadowBlur=5;ctx.strokeStyle='rgba(222,247,255,.8)';ctx.lineWidth=4;ctx.stroke();
 // Each crystal vertex extends into a branched snowflake ray.
 for(let i=0;i<6;i++){
  const angle=-Math.PI/2+i*Math.PI/3,ux=Math.cos(angle),uy=Math.sin(angle),px=-uy,py=ux;
  ctx.beginPath();ctx.moveTo(ux*36,uy*36);ctx.lineTo(ux*55,uy*55);
  for(const side of [-1,1]){ctx.moveTo(ux*46,uy*46);ctx.lineTo(ux*41+px*side*6,uy*41+py*side*6);}
  ctx.strokeStyle='rgba(141,211,240,.3)';ctx.lineWidth=8;ctx.shadowBlur=7;ctx.stroke();
  ctx.strokeStyle='#dff7ff';ctx.lineWidth=3;ctx.shadowBlur=3;ctx.stroke();
 }
 ctx.restore();
 ringLayer(false);
 // Shield release sends a crisp square frost pulse out through the crystal.
 if(e.shootTicks > 0){
  const release=1-e.shootTicks/20, radius=28+release*25;
  ctx.save();ctx.globalAlpha=(1-release)*.85;ctx.strokeStyle='#e4faff';ctx.lineWidth=3;
  ctx.strokeRect(-radius,-radius,radius*2,radius*2);ctx.restore();
 }
 // Calm icy square body, with light inner panels matching the old Warden palette.
 ctx.shadowColor='#a7ddf4';ctx.shadowBlur=9;part('#8ecbe3',-24,-24,48,48);ctx.shadowBlur=0;
 part('#d8eff7',-20,-20,40,40);part('#c4e4ef',-16,-15,32,30);
 // Old continuous right-angle spiral, in cold navy rather than nested eye rectangles.
 ctx.save();ctx.translate(0,-5);ctx.scale(attacking ? 1.1 : 1,attacking ? .65 : e.shootTicks > 0 ? 1.15 : 1);ctx.strokeStyle='#003844';ctx.lineWidth=2.5;
 let x=0,y=0,dir=0,length=1,turns=0;const dirs=[[1,0],[0,1],[-1,0],[0,-1]];
 ctx.beginPath();ctx.moveTo(0,0);
 for(let i=0;i<8;i++){x+=dirs[dir][0]*length*3.3;y+=dirs[dir][1]*length*3.3;ctx.lineTo(x,y);dir=(dir+1)%4;if(++turns===2){length++;turns=0;}}
 ctx.stroke();ctx.restore();
 // Closed frozen crack, not the rectangular toothed mouth used by Devourer.
 if(e.shootTicks > 0){part('#174a60',-5,9,10,10);part('#dff7ff',-2,12,4,4);}else{
 ctx.strokeStyle='#174a60';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-10,10);ctx.lineTo(-7,10);ctx.lineTo(-7,13);ctx.lineTo(0,13);ctx.lineTo(0,16);ctx.lineTo(8,16);ctx.lineTo(8,12);ctx.lineTo(11,12);ctx.stroke();
 }
 // Two soft pink cheek marks on each side, kept as short blocky bars.
 for(const cheekX of [-18,14]){part('#d995b7',cheekX,1,4,2);part('#d995b7',cheekX,5,4,2);}
 // Three tiny frost marks inside the body, with compact stepped icicle growths.
 part('#91bfce',-16,-5,3,2);part('#91bfce',13,-12,2,3);part('#91bfce',13,-4,3,2);
 part('#c5e6f3',-17,-30,6,7);part('#c5e6f3',-15,-34,3,5);
 part('#d8f4ff',-3,-36,7,13);part('#d8f4ff',-1,-41,3,6);
 part('#c5e6f3',12,-30,6,7);part('#c5e6f3',14,-34,3,5);
 ringLayer(true);
 // Small drifting snowflakes stay around the crystal rather than washing out the face.
 for(let i=0;i<8;i++){
  const angle=tickN*.008+i*2.4+.6;
  ctx.globalAlpha=.25+(i%3)*.12;
  part('#b9e8fa',Math.round(Math.cos(angle)*48),Math.round(Math.sin(angle)*45),2+(i%2),2+(i%2));
 }
 ctx.globalAlpha=1;
    ctx.restore();

    // HP bar above her
    drawBossHealthBar(ctx,sx-(wSz+10)/2,sy-modelScale*64,wSz+10,e.hp,e.maxHp,'#a7ddf4');

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // Ghost is semi-transparent
  if (e.type === 'ghost') ctx.globalAlpha = 0.55 + 0.2 * Math.abs(Math.sin(tickN * 0.08));
  // Queen echo — unstable, flickers faster and dimmer than a ghost (it's decaying)
  if (e.type === 'queen_echo') ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(tickN * 0.28));
  // Splitter Queen destabilizes visually just before she phase-jumps away
  if (e.type === 'splitter_queen' && e.phaseTimer <= QUEEN_PHASE_TELEGRAPH) {
    const jProgress = 1 - e.phaseTimer / QUEEN_PHASE_TELEGRAPH; // 0 -> 1 as jump nears
    ctx.globalAlpha = 1 - jProgress * 0.5 * (0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.5)));
  }

  // ── Splitter Queen: fully custom draw (regal counterpart to the King boss) ──
  if (e.type === 'splitter_queen') {
    const qSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const qH = qSz / 2;
    const qPad = Math.max(3, Math.floor(qSz * 0.10));
    const pulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.06));
    const hpPct = e.hp / e.maxHp;
    const qFlash = e.flashTicks > 0;
    const bodyColor = qFlash ? '#ffffff' : '#8800cc';

    // Outer violet glow
    ctx.shadowColor = '#dd44ff'; ctx.shadowBlur = Math.floor(16 * pulse);

    // Slender epaulettes (tapered, unlike the King's blunt shoulder spikes)
    const epW = Math.max(3, Math.floor(qSz * 0.13));
    const epH = Math.max(6, Math.floor(qSz * (attacking ? 0.42 : 0.24)));
    ctx.fillStyle = qFlash ? '#ffffff' : '#5a0088';
    ctx.fillRect(sx - qH - epW, sy - Math.floor(epH * 0.55), epW, epH);
    ctx.fillRect(sx + qH, sy - Math.floor(epH * 0.55), epW, epH);
    ctx.fillStyle = qFlash ? '#ffffff' : '#ee99ff';
    ctx.fillRect(sx - qH - epW - 2, sy - Math.floor(epH * 0.55), 2, 2);
    ctx.fillRect(sx + qH + epW, sy - Math.floor(epH * 0.55), 2, 2);

    // Short stepped royal tassels hang from the shoulder edges, rather than a fin or large cloak.
    ctx.save(); ctx.translate(sx, sy); ctx.shadowBlur = 0;
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      ctx.fillStyle = 'rgba(136,0,204,0.42)'; ctx.beginPath();
      ctx.moveTo(qH, -6); ctx.lineTo(qH + 8, -6); ctx.lineTo(qH + 8, 7);
      ctx.lineTo(qH + 12, 7); ctx.lineTo(qH + 12, 18); ctx.lineTo(qH + 6, 18);
      ctx.lineTo(qH + 6, 9); ctx.lineTo(qH + 3, 9); ctx.lineTo(qH + 3, 0);
      ctx.lineTo(qH, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#bf62d9'; ctx.fillRect(qH + 7, 14, 4, 3);
      ctx.restore();
    }
    ctx.restore();

    // Main body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx - qH, sy - qH, qSz, qSz);
    ctx.shadowBlur = 0;

    // Cloak hem — stepped, alternating-height fringe along her lower edge (pixel-art zigzag)
    if (!qFlash) {
      const hemSegW = Math.max(2, Math.floor(qSz / 5));
      const hemH1 = Math.max(3, Math.floor(qSz * 0.12));
      const hemH2 = Math.max(2, Math.floor(qSz * 0.06));
      ctx.fillStyle = '#5a0088';
      for (let i = 0; i < 5; i++) {
        const hh = i % 2 === 0 ? hemH1 : hemH2;
        ctx.fillRect(sx - qH + i * hemSegW, sy + qH, hemSegW - 1, hh);
      }
    }

    // Inner plate + diamond gem motif (silver, not the King's gold cross)
    if (!qFlash) {
      ctx.fillStyle = '#4a0066';
      ctx.fillRect(sx - qH + qPad, sy - qH + qPad, qSz - qPad * 2, qSz - qPad * 2);

      // A few tiny jewel markings inside the face, like Sea Chanter's sparse scales.
      ctx.fillStyle = '#a84ac5';
      for (const side of [-1, 1]) {
        ctx.fillRect(sx + side * (qH - qPad - 2) - 1, sy + 2, 2, 3);
        ctx.fillRect(sx + side * (qH - qPad - 4) - 1, sy + 8, 2, 2);
      }
      ctx.fillStyle = '#c76ce2';
      for (const offset of [-6, 0, 6]) {
        ctx.fillRect(sx + offset - 1, sy + qH - qPad - 2, 2, 2);
      }

      // Twinkling center gem — brightness pulses independently for a "living jewel" feel
      const gemTwinkle = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.09));
      ctx.fillStyle = `rgba(255,255,255,${gemTwinkle})`;
      const gemSz = Math.max(3, Math.floor(qSz * 0.14));
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-gemSz / 2, -gemSz / 2, gemSz, gemSz);
      ctx.restore();

      // Corner gem studs — small diamonds echoing the center gem, one per plate corner
      const studSz = Math.max(2, Math.floor(qSz * 0.07));
      const studInset = qPad + Math.floor(studSz * 0.8);
      ctx.fillStyle = '#ee99ffcc';
      for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) {
        const stx = sx + ox * (qH - studInset);
        const sty = sy + oy * (qH - studInset);
        ctx.save();
        ctx.translate(stx, sty);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-studSz / 2, -studSz / 2, studSz, studSz);
        ctx.restore();
      }
    }

    // Tiara (3 spikes: tall center gem-spike, shorter sides) — regal vs. the King's 5-spike crown
    if (!qFlash) {
      ctx.fillStyle = '#ddaaff';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
      const tiaraH = Math.max(6, Math.floor(qSz * (attacking ? 0.40 : 0.26)));
      const sideH = Math.floor(tiaraH * 0.55);
      const tW = Math.max(3, Math.floor(qSz * 0.12));
      ctx.fillRect(sx - Math.floor(tW / 2), sy - qH - tiaraH, tW, tiaraH); // center spike
      ctx.fillRect(sx - qH + qPad, sy - qH - sideH, tW, sideH); // left spike
      ctx.fillRect(sx + qH - qPad - tW, sy - qH - sideH, tW, sideH); // right spike
      // Gem tip on center spike — twinkles out of sync with the center gem
      const tipTwinkle = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.09 + Math.PI / 2));
      ctx.shadowColor = '#ff66ee'; ctx.shadowBlur = Math.floor(6 * tipTwinkle);
      ctx.fillStyle = '#ff66ee';
      ctx.fillRect(sx - 2, sy - qH - tiaraH - 3, 4, 4);
      ctx.shadowBlur = 0;
    }

    // 2 large almond eyes — fewer/larger than the King's 4, glow gold when attacking
    if (!qFlash) {
      const eSz = Math.max(4, Math.floor(qSz * 0.20));
      const pSz = Math.max(2, Math.floor(eSz * 0.55));
      const focused = attacking || e.shootTicks > 0;
      const eyeY = sy - qH + qPad + Math.floor(qSz * 0.20);
      const ex1 = sx - Math.floor(qSz * 0.22) - Math.floor(eSz / 2);
      const ex2 = sx + Math.floor(qSz * 0.22) - Math.floor(eSz / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eSz, eSz); ctx.fillRect(ex2, eyeY, eSz, eSz);
      ctx.fillStyle = attacking ? '#ffcc00' : '#ee44ff';
      ctx.shadowColor = attacking ? '#ffcc00' : '#ee44ff'; ctx.shadowBlur = attacking ? 12 : 6;
      const pupilW = focused ? Math.max(2, Math.floor(pSz * .5)) : pSz;
      ctx.fillRect(ex1 + (focused ? Math.floor(eSz / 2) : 1), eyeY + 1, pupilW, focused ? eSz - 2 : pSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pupilW, focused ? eSz - 2 : pSz);
      ctx.shadowBlur = 0;

      // Third eye — central eye below the main pair, sitting where her nose would be,
      // same construction as the other two
      const eyeGap = Math.max(4, Math.floor(qSz * 0.12));
      const eSz3 = Math.max(4, Math.floor(eSz * (e.shootTicks > 0 ? 1.15 : 0.9)));
      const pSz3 = Math.max(2, Math.floor(eSz3 * 0.55));
      const eye3Y = eyeY + eSz + eyeGap;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - Math.floor(eSz3 / 2), eye3Y, eSz3, eSz3);
      ctx.fillStyle = attacking ? '#ffcc00' : '#ee44ff';
      ctx.shadowColor = attacking ? '#ffcc00' : '#ee44ff'; ctx.shadowBlur = attacking ? 12 : 6;
      ctx.fillRect(sx - Math.floor(eSz3 / 2) + 1, eye3Y + 1, pSz3, pSz3);
      ctx.shadowBlur = 0;

      // Thin, closed regal mouth (no teeth, unlike the King), pushed down below the third eye
      const mW = Math.max(6, Math.floor(qSz * 0.42));
      const mH = Math.max(1, Math.floor(qSz * 0.05));
      const mouthGap = Math.max(3, Math.floor(qSz * 0.08));
      ctx.fillStyle = '#4a0066';
      ctx.fillRect(sx - Math.floor(mW / 2), eye3Y + eSz3 + mouthGap, mW, mH);
    }

    // Foreground crown base, raised around her lower body at 75% opacity with no aura glow.
    ctx.save(); ctx.translate(sx, sy + qH - 6); ctx.scale(.88, .75);
    const crownHalf = qSz * 0.8;
    const baseY = 14;
    ctx.shadowBlur = 0;
    ctx.fillStyle = qFlash ? 'rgba(255,255,255,.75)' : 'rgba(86,0,133,.75)'; ctx.beginPath();
    ctx.moveTo(-crownHalf, baseY); ctx.lineTo(-crownHalf, -12);
    ctx.lineTo(-crownHalf + 5, -12); ctx.lineTo(-crownHalf + 5, -4);
    ctx.lineTo(-crownHalf + 10, -4); ctx.lineTo(-crownHalf + 10, 6);
    ctx.lineTo(-qSz * .34, 6); ctx.lineTo(-qSz * .34, -4);
    ctx.lineTo(-qSz * .22, -4); ctx.lineTo(-qSz * .22, 5);
    ctx.lineTo(-3, 5); ctx.lineTo(-3, -2); ctx.lineTo(3, -2);
    ctx.lineTo(3, 5); ctx.lineTo(qSz * .22, 5);
    ctx.lineTo(qSz * .22, -4); ctx.lineTo(qSz * .34, -4);
    ctx.lineTo(qSz * .34, 6); ctx.lineTo(crownHalf - 10, 6);
    ctx.lineTo(crownHalf - 10, -4); ctx.lineTo(crownHalf - 5, -4);
    ctx.lineTo(crownHalf - 5, -12); ctx.lineTo(crownHalf, -12);
    ctx.lineTo(crownHalf, baseY); ctx.closePath(); ctx.fill();
    ctx.restore();
    // Forehead gemstone beneath the central tiara spike, matching the corner gems.
    ctx.save(); ctx.translate(sx, sy - qH + 1); ctx.rotate(Math.PI / 4);
    const foreheadGem = Math.max(6, Math.floor(qSz * .18));
    ctx.shadowColor = '#dd77ff'; ctx.shadowBlur = 3;
    ctx.fillStyle = qFlash ? '#ffffff' : '#edb2ff';
    ctx.fillRect(-foreheadGem / 2, -foreheadGem / 2, foreheadGem, foreheadGem);
    ctx.shadowBlur = 0; ctx.fillStyle = qFlash ? '#ffffff' : '#b546d3';
    ctx.fillRect(-foreheadGem / 2 + 1, -foreheadGem / 2 + 1, foreheadGem - 2, foreheadGem - 2);
    ctx.restore();

    // HP bar above her
    drawBossHealthBar(ctx,sx-(qSz+10)/2,sy-qH-16,qSz+10,e.hp,e.maxHp,'#d96af0');

    if (e.windupTicks > 0) {
      const progress = 1 - e.windupTicks / QUEEN_WINDUP_TICKS;
      const ringR = qH + 6 + Math.floor(progress * 10);
      const ringPulse = 0.5 + 0.5 * Math.abs(Math.sin(Date.now() * 0.018));
      ctx.shadowColor = '#cc33ff';
      ctx.shadowBlur = 10 + Math.floor(progress * 16);
      ctx.strokeStyle = `rgba(221,${Math.floor(80 + 100 * progress)},255,${0.6 + 0.4 * ringPulse})`;
      ctx.lineWidth = 2 + Math.floor(progress * 2);
      ctx.strokeRect(sx - ringR, sy - ringR, ringR * 2, ringR * 2);
      ctx.shadowBlur = 0;
    }

    // Idle aura ring — subtle constant breathing glow so she reads as magical even at rest
    const auraR = qH + 10 + Math.floor(4 * pulse);
    ctx.shadowColor = '#dd44ff'; ctx.shadowBlur = 6;
    ctx.strokeStyle = `rgba(221,68,255,${0.18 + 0.12 * pulse})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - auraR, sy - auraR, auraR * 2, auraR * 2);
    ctx.shadowBlur = 0;

    // Revolving magic ring — a segmented halo of tick marks spinning continuously around her,
    // on a tilted ellipse so it reads as a ring orbiting in 3D, not a flat static circle
    const ringR = qH + 21;
    const ringSegs = 8;
    const ringSpin = tickN * 0.06;
    for (let r = 0; r < ringSegs; r++) {
      const ang = ringSpin + (r * Math.PI * 2) / ringSegs;
      const rx = sx + Math.cos(ang) * ringR;
      const ry = sy + Math.sin(ang) * ringR * 0.42;
      const depthFade = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(ang)); // segments at the "back" dim out
      const segSz = 2.5;
      ctx.globalAlpha = depthFade;
      ctx.shadowColor = '#ee66ff'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffbbff';
      ctx.fillRect(rx - segSz / 2, ry - segSz / 2, segSz, segSz);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Orbiting magic motes — inner ring (3, faster/closer) + outer ring (2, slower/wider)
    // for a layered "boss presence" that's always alive, not tied to any event
    const orbitR = qH + 16;
    for (let m = 0; m < 3; m++) {
      const ang = tickN * 0.05 + (m * Math.PI * 2) / 3;
      const mx = sx + Math.cos(ang) * orbitR;
      const my = sy + Math.sin(ang) * orbitR * 0.6; // flattened ellipse orbit
      const moteSz = 3;
      ctx.shadowColor = '#ff88ee'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffccff';
      ctx.fillRect(mx - moteSz / 2, my - moteSz / 2, moteSz, moteSz);
      ctx.shadowBlur = 0;
    }
    const outerOrbitR = qH + 26;
    for (let m = 0; m < 2; m++) {
      const ang = -tickN * 0.025 + (m * Math.PI) + Math.PI / 4; // opposite direction, slower
      const mx = sx + Math.cos(ang) * outerOrbitR;
      const my = sy + Math.sin(ang) * outerOrbitR * 0.6;
      const moteSz = 2;
      ctx.shadowColor = '#dd44ff'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#ee99ff';
      ctx.fillRect(mx - moteSz / 2, my - moteSz / 2, moteSz, moteSz);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // ── Queen Echo: a paler, simplified fragment of the Queen's silhouette ─
  if (e.type === 'queen_echo') {
    const qSz = Math.floor(TILE_SIZE * cfg.bodyFraction * attackScale * impactScale);
    const qH = qSz / 2;
    const qPad = Math.max(2, Math.floor(qSz * 0.10));
    const eFlash = e.flashTicks > 0;

    ctx.shadowColor = '#dd44ff'; ctx.shadowBlur = 6;

    // Epaulettes with tips — same shape/colors as the real Queen (the flicker/translucency
    // already established earlier is what reads as "echo", not a separate off-palette color)
    const epW = Math.max(3, Math.floor(qSz * 0.13));
    const epH = Math.max(6, Math.floor(qSz * 0.24));
    ctx.fillStyle = eFlash ? '#ffffff' : '#5a0088';
    ctx.fillRect(sx - qH - epW, sy - Math.floor(epH * 0.55), epW, epH);
    ctx.fillRect(sx + qH, sy - Math.floor(epH * 0.55), epW, epH);
    ctx.fillStyle = eFlash ? '#ffffff' : '#ee99ff';
    ctx.fillRect(sx - qH - epW - 2, sy - Math.floor(epH * 0.55), 2, 2);
    ctx.fillRect(sx + qH + epW, sy - Math.floor(epH * 0.55), 2, 2);

    // Main body — the Queen's real color, not a separate hue; alpha flicker sells the "echo" read
    ctx.fillStyle = eFlash ? '#ffffff' : '#8800cc';
    ctx.fillRect(sx - qH, sy - qH, qSz, qSz);
    ctx.shadowBlur = 0;

    if (!eFlash) {
      // Inner plate + diamond gem motif — same as the Queen's
      ctx.fillStyle = '#4a0066';
      ctx.fillRect(sx - qH + qPad, sy - qH + qPad, qSz - qPad * 2, qSz - qPad * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      const gemSz = Math.max(3, Math.floor(qSz * 0.14));
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-gemSz / 2, -gemSz / 2, gemSz, gemSz);
      ctx.restore();

      // Glitch scanlines — a couple of horizontally-shifted slivers, the one thing that tells
      // her apart from the real Queen up close (an unstable copy, not just a dimmer one)
      const glitchY1 = sy - qH + Math.floor(qSz * (0.35 + 0.1 * Math.sin(tickN * 0.2)));
      const glitchY2 = sy - qH + Math.floor(qSz * (0.65 + 0.1 * Math.cos(tickN * 0.17)));
      const glitchH = Math.max(1, Math.floor(qSz * 0.05));
      const glitchShift = Math.floor(qSz * 0.12 * Math.sin(tickN * 0.3));
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(sx - qH + glitchShift, glitchY1, qSz, glitchH);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(sx - qH - glitchShift, glitchY2, qSz, glitchH);

      // Tiara (3 spikes + gem tip) — same shape as the Queen's
      ctx.fillStyle = '#ddaaff';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
      const tiaraH = Math.max(6, Math.floor(qSz * 0.26));
      const sideH = Math.floor(tiaraH * 0.55);
      const tW = Math.max(3, Math.floor(qSz * 0.12));
      ctx.fillRect(sx - Math.floor(tW / 2), sy - qH - tiaraH, tW, tiaraH);
      ctx.fillRect(sx - qH + qPad, sy - qH - sideH, tW, sideH);
      ctx.fillRect(sx + qH - qPad - tW, sy - qH - sideH, tW, sideH);
      ctx.fillStyle = '#ff66ee';
      ctx.fillRect(sx - 2, sy - qH - tiaraH - 3, 4, 4);
      ctx.shadowBlur = 0;

      // 2 large almond eyes, same glow color as the Queen's — no mouth (she's a silent fragment)
      const eSz = Math.max(4, Math.floor(qSz * 0.20));
      const pSz = Math.max(2, Math.floor(eSz * 0.55));
      const eyeY = sy - qH + qPad + Math.floor(qSz * 0.20);
      const ex1 = sx - Math.floor(qSz * 0.22) - Math.floor(eSz / 2);
      const ex2 = sx + Math.floor(qSz * 0.22) - Math.floor(eSz / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eSz, eSz); ctx.fillRect(ex2, eyeY, eSz, eSz);
      ctx.fillStyle = '#ee44ff';
      ctx.shadowColor = '#ee44ff'; ctx.shadowBlur = 5;
      ctx.fillRect(ex1 + 1, eyeY + 1, pSz, pSz); ctx.fillRect(ex2 + 1, eyeY + 1, pSz, pSz);
      ctx.shadowBlur = 0;

      // Third eye — same enlarged central eye as the real Queen's, below the main pair
      const eyeGap = Math.max(4, Math.floor(qSz * 0.12));
      const eSz3 = Math.max(4, Math.floor(eSz * 0.9));
      const pSz3 = Math.max(2, Math.floor(eSz3 * 0.55));
      const eye3Y = eyeY + eSz + eyeGap;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - Math.floor(eSz3 / 2), eye3Y, eSz3, eSz3);
      ctx.fillStyle = '#ee44ff';
      ctx.shadowColor = '#ee44ff'; ctx.shadowBlur = 5;
      ctx.fillRect(sx - Math.floor(eSz3 / 2) + 1, eye3Y + 1, pSz3, pSz3);
      ctx.shadowBlur = 0;
    }

    // Attack wind-up aiming ring (same treatment as the real Queen's)
    if (e.windupTicks > 0) {
      const progress = 1 - e.windupTicks / QUEEN_WINDUP_TICKS;
      const ringR = qH + 6 + Math.floor(progress * 10);
      const ringPulse = 0.5 + 0.5 * Math.abs(Math.sin(Date.now() * 0.018));
      ctx.shadowColor = '#cc33ff';
      ctx.shadowBlur = 10 + Math.floor(progress * 16);
      ctx.strokeStyle = `rgba(221,${Math.floor(80 + 100 * progress)},255,${0.6 + 0.4 * ringPulse})`;
      ctx.lineWidth = 2 + Math.floor(progress * 2);
      ctx.strokeRect(sx - ringR, sy - ringR, ringR * 2, ringR * 2);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return;
  }

  // Ordinary monsters keep their silhouettes, with flat shaded pixel facets.
  ctx.shadowBlur=0;
  if(e.type==='splitter'&&!flash){
    const boxH=Math.floor(drawSz*.44),gap=Math.max(2,drawSz-boxH*2);
    drawMobBody(ctx,sx-drawH,sy-drawH,drawSz,boxH,color,false);
    drawMobBody(ctx,sx-drawH,sy-drawH+boxH+gap,drawSz,boxH,'#aaffcc',false);
  }else drawMobBody(ctx,sx-drawH,sy-drawH,drawSz,drawSz,color,flash);

  const antH = Math.max(3, Math.floor(size * 0.28));
  const dotSz = 3;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  if (e.type === 'bomber') {
    // No antenna — bald, dangerous look
  } else if (e.type === 'energy_leech') {
    // Inward-facing collector prongs; flat ends keep the silhouette crisp.
    ctx.shadowBlur=4;
    for(const side of [-1,1]){
      const ax=sx+side*Math.floor(size*.3);
      ctx.fillStyle=color;ctx.fillRect(ax-1,sy-half-antH,3,antH);
      ctx.fillStyle='#e7baff';ctx.fillRect(side<0?ax-1:ax-5,sy-half-antH,7,3);
    }
    ctx.shadowBlur=0;
  } else if (e.type === 'fast') {
    // Twin antennas
    const fw = 2, fgap = Math.floor(size * 0.17);
    ctx.fillRect(sx - fgap - fw, sy - half - antH, fw, antH);
    ctx.fillRect(sx + fgap, sy - half - antH, fw, antH);
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - fgap - 1, sy - half - antH - dotSz, dotSz, dotSz);
    ctx.fillRect(sx + fgap, sy - half - antH - dotSz, dotSz, dotSz);
    ctx.shadowBlur = 0;
  } else if (e.type === 'healer') {
    // Triple fan antennas
    const hw = 2, hgap = Math.floor(size * 0.20);
    const sideH = Math.max(2, Math.floor(antH * 0.70));
    ctx.fillRect(sx - Math.floor(hw / 2), sy - half - antH, hw, antH);
    ctx.fillRect(sx - hgap - hw, sy - half - sideH, hw, sideH);
    ctx.fillRect(sx + hgap, sy - half - sideH, hw, sideH);
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - Math.floor(dotSz / 2), sy - half - antH - dotSz, dotSz, dotSz);
    const sd = dotSz - 1;
    ctx.fillRect(sx - hgap - hw + Math.floor(hw / 2) - Math.floor(sd / 2), sy - half - sideH - sd, sd, sd);
    ctx.fillRect(sx + hgap + Math.floor(hw / 2) - Math.floor(sd / 2), sy - half - sideH - sd, sd, sd);
    ctx.shadowBlur = 0;
  } else if (e.type === 'sniper') {
    // Tall single antenna with crosshair tip
    const tallH = Math.floor(antH * 1.5);
    ctx.fillRect(sx - 1, sy - half - tallH, 2, tallH);
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - Math.floor(dotSz / 2), sy - half - tallH - dotSz, dotSz, dotSz);
    ctx.fillRect(sx - dotSz - 1, sy - half - tallH - 1, dotSz * 2 + 3, 1); // horizontal tick
    ctx.shadowBlur = 0;
  } else if (e.type === 'charger') {
    // Side antennas — one extends left, one extends right from mid-body
    const antLen = Math.max(5, Math.floor(size * 0.38));
    const antThk = 2;
    const midY = sy - Math.floor(antThk / 2);
    ctx.shadowColor = color; ctx.shadowBlur = 5;
    ctx.fillRect(sx - half - antLen, midY, antLen, antThk); // left
    ctx.fillRect(sx + half, midY, antLen, antThk); // right
    // Tips
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(sx - half - antLen - 2, midY - 1, 2, antThk + 2);
    ctx.fillRect(sx + half + antLen, midY - 1, 2, antThk + 2);
    ctx.shadowBlur = 0;
  } else if (e.type === 'mini_splitter') {
    // No antenna
  } else if (e.type === 'ghost') {
    // 3 antennas hanging from the bottom (ghost tendrils)
    const gw = 2, ggap = Math.floor(size * 0.22);
    const botY = sy + half;
    const tentH = Math.floor(antH * 1.1);
    const sideH = Math.floor(antH * 0.75);
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 5;
    ctx.fillRect(sx - Math.floor(gw / 2), botY, gw, tentH);       // center
    ctx.fillRect(sx - ggap - gw, botY, gw, sideH);      // left
    ctx.fillRect(sx + ggap, botY, gw, sideH);      // right
    // Tip dots
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - Math.floor(dotSz / 2), botY + tentH, dotSz, dotSz);
    ctx.fillRect(sx - ggap - gw, botY + sideH, dotSz - 1, dotSz - 1);
    ctx.fillRect(sx + ggap, botY + sideH, dotSz - 1, dotSz - 1);
    ctx.shadowBlur = 0;
  } else if (e.type === 'shielder') {
    // 3 antennas with flat shield-like tips
    const hw = 2, hgap = Math.floor(size * 0.20);
    const sideH = Math.max(2, Math.floor(antH * 0.75));
    ctx.fillRect(sx - 1, sy - half - antH, 2, antH); // center
    ctx.fillRect(sx - hgap - hw, sy - half - sideH, hw, sideH); // left
    ctx.fillRect(sx + hgap, sy - half - sideH, hw, sideH); // right
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    // tips
    ctx.fillRect(sx - Math.floor(dotSz * 1.5), sy - half - antH - dotSz, dotSz * 3, dotSz); // center tip
    const sTip = dotSz * 2;
    ctx.fillRect(sx - hgap - hw - Math.floor((sTip - hw) / 2), sy - half - sideH - dotSz, sTip, dotSz); // left tip
    ctx.fillRect(sx + hgap - Math.floor((sTip - hw) / 2), sy - half - sideH - dotSz, sTip, dotSz); // right tip
    ctx.shadowBlur = 0;
  } else if (e.type === 'splitter') {
    // Twin antennas (same as fast but spaced for the wider body)
    const sw = 2, sgap = Math.floor(size * 0.20);
    ctx.fillRect(sx - sgap - sw, sy - half - antH, sw, antH);
    ctx.fillRect(sx + sgap, sy - half - antH, sw, antH);
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - sgap - 1, sy - half - antH - dotSz, dotSz, dotSz);
    ctx.fillRect(sx + sgap, sy - half - antH - dotSz, dotSz, dotSz);
    ctx.shadowBlur = 0;
  } else {
    // normal / armored: single centered antenna
    const aw = e.type === 'armored' ? 3 : 2;
    ctx.fillRect(sx - Math.floor(aw / 2), sy - half - antH, aw, antH);
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - Math.floor(dotSz / 2), sy - half - antH - dotSz, dotSz, dotSz);
    ctx.shadowBlur = 0;
  }

  // ── Eyes / face ───────────────────────────────────────────────────────
  if (!flash) {
    const eyeY = sy - half + pad + 1;
    if (e.type === 'energy_leech') {
      const width = Math.floor(size * .6), left = Math.round(sx - width / 2);
      ctx.fillStyle = '#f4dfff';
      ctx.fillRect(left, eyeY, 5, 3); ctx.fillRect(left + width - 5, eyeY, 5, 3);
      // Lavender collector slit with inset storage lights, contained within the shell.
      const mouthY = Math.round(sy + 1), cells = Math.min(3, Math.ceil((e.stolenEnergy ?? 0) / 20));
      ctx.fillStyle = '#b48bd0'; ctx.fillRect(left + 2, mouthY, width - 4, 3);
      for (let i = 0; i < 3; i++) {
        ctx.shadowColor = '#ffe58b'; ctx.shadowBlur = i < cells ? 3 : 0;
        ctx.fillStyle = i < cells ? '#ffe58b' : '#82549e';
        ctx.fillRect(Math.round(sx) - 6 + i * 5, mouthY + 5, 3, 2);
      }
      ctx.shadowBlur = 0;
    } else if (e.type === 'sniper') {
      // 1 large central cycloptic eye
      const eyeSz = Math.max(4, Math.floor(size * 0.34));
      const pupSz = Math.max(2, Math.floor(eyeSz * 0.55));
      const ex = sx - Math.floor(eyeSz / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex, eyeY, eyeSz, eyeSz);
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff2200';
      ctx.fillRect(ex + Math.floor((eyeSz - pupSz) / 2), eyeY + Math.floor((eyeSz - pupSz) / 2), pupSz, pupSz);
      ctx.shadowBlur = 0;
    } else if (e.type === 'fast') {
      // No eyes — just a wide mouth (aggressive horizontal slit)
      const mouthW = Math.max(4, Math.floor(size * 0.55));
      const mouthH = Math.max(2, Math.floor(size * 0.12));
      const mouthY = sy - half + Math.floor(size * 0.52);
      ctx.fillStyle = '#ff2200';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 5;
      ctx.fillRect(sx - Math.floor(mouthW / 2), mouthY, mouthW, mouthH);
      ctx.shadowBlur = 0;
    } else if (e.type === 'healer') {
      // 2 normal top eyes + 1 centered mouth-eye embedded in body
      const eyeSz = Math.max(2, Math.floor(size * 0.18));
      const pupSz = Math.max(1, eyeSz - 1);
      const eyeClr = '#ff55cc';
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eyeSz - 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex2, eyeY, eyeSz, eyeSz);
      ctx.fillStyle = eyeClr;
      ctx.fillRect(ex1 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pupSz, pupSz);
      // mouth-eye: centered, below the top eyes
      const mEyeY = eyeY + eyeSz + Math.max(2, Math.floor(size * 0.10));
      const mEx = sx - Math.floor(eyeSz / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mEx, mEyeY, eyeSz, eyeSz);
      ctx.shadowColor = eyeClr;
      ctx.shadowBlur = 8;
      ctx.fillStyle = eyeClr;
      ctx.fillRect(mEx + 1, mEyeY + 1, pupSz, pupSz);
      ctx.shadowBlur = 0;
    } else if (e.type === 'charger') {
      // Smile mouth (U-shape) at the top
      const mW = Math.max(6, Math.floor(size * 0.45));
      const mH = Math.max(1, Math.floor(size * 0.10));
      const mX = sx - Math.floor(mW / 2);
      const mY = sy - half + pad + 2 + Math.max(2, Math.floor(size * 0.15));
      const cW = Math.max(1, Math.floor(mW * 0.15));
      const cH = Math.max(2, Math.floor(mH * 2.5));

      ctx.fillStyle = '#ff2200';
      ctx.fillRect(mX, mY, mW, mH);           // bottom bar
      ctx.fillRect(mX, mY - cH, cW, cH);      // left corner
      ctx.fillRect(mX + mW - cW, mY - cH, cW, cH); // right corner

      // Diagonal slanted eyes (\ /) at the bottom
      const eSz = Math.max(2, Math.floor(size * 0.12));
      const bottomEyeY = sy + half - pad - eSz * 2 - 2;
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eSz * 2 - 1;

      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 5;
      // Left eye: \
      ctx.fillRect(ex1, bottomEyeY, eSz, eSz);
      ctx.fillRect(ex1 + eSz, bottomEyeY + eSz, eSz, eSz);
      // Right eye: /
      ctx.fillRect(ex2 + eSz, bottomEyeY, eSz, eSz);
      ctx.fillRect(ex2, bottomEyeY + eSz, eSz, eSz);
      ctx.shadowBlur = 0;
    } else if (e.type === 'ghost') {
      // Large hollow eyes — white outline with strong glow
      const eSz = Math.max(4, Math.floor(size * 0.30));
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eSz - 1;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.shadowColor = '#aa88ff'; ctx.shadowBlur = 6;
      ctx.strokeRect(ex1, eyeY, eSz, eSz);
      ctx.strokeRect(ex2, eyeY, eSz, eSz);
      ctx.shadowBlur = 0;
    } else if (e.type === 'splitter') {
      // 2 green eyes on top box, 2 on bottom box
      const eSz = Math.max(2, Math.floor(size * 0.18));
      const pSz = Math.max(1, eSz - 1);
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eSz - 1;

      const unscaledBoxH = Math.floor(size * 0.44);
      const unscaledGap = Math.max(2, size - unscaledBoxH * 2);
      const bottomEyeY = sy - half + unscaledBoxH + unscaledGap + pad;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eSz, eSz);
      ctx.fillRect(ex2, eyeY, eSz, eSz);
      ctx.fillRect(ex1, bottomEyeY, eSz, eSz);
      ctx.fillRect(ex2, bottomEyeY, eSz, eSz);

      ctx.fillStyle = '#00ff44';
      ctx.fillRect(ex1 + 1, eyeY + 1, pSz, pSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pSz, pSz);
      ctx.fillRect(ex1 + 1, bottomEyeY + 1, pSz, pSz);
      ctx.fillRect(ex2 + 1, bottomEyeY + 1, pSz, pSz);
    } else if (e.type === 'mini_splitter') {
      // 2 tiny eyes — no pupils, just small white squares
      const eSz = Math.max(1, Math.floor(size * 0.22));
      const ex1 = sx - half + pad;
      const ex2 = sx + half - pad - eSz;
      ctx.fillStyle = '#aaffcc';
      ctx.fillRect(ex1, eyeY, eSz, eSz);
      ctx.fillRect(ex2, eyeY, eSz, eSz);
    } else if (e.type === 'shielder') {
      // A pair of vertical eyes (2 eyes stacked on top of each other) above 1 smile mouth
      const eSz = Math.max(2, Math.floor(size * 0.15));
      const pSz = Math.max(1, eSz - 1);
      const eX = sx - Math.floor(eSz / 2);
      const eY1 = sy - half + pad + 1;
      const eY2 = eY1 + eSz + Math.max(3, Math.floor(size * 0.15));

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eX, eY1, eSz, eSz);
      ctx.fillRect(eX, eY2, eSz, eSz);
      ctx.fillStyle = '#00ddcc';
      ctx.fillRect(eX + 1, eY1 + 1, pSz, pSz);
      ctx.fillRect(eX + 1, eY2 + 1, pSz, pSz);

      const mW = Math.max(6, Math.floor(size * 0.56));
      const mH = Math.max(1, Math.floor(size * 0.10));
      const mX = sx - Math.floor(mW / 2);
      const cW = Math.max(1, Math.floor(mW * 0.13));
      const cH = Math.max(2, Math.floor(mH * 2.5));
      const mY = eY2 + eSz + Math.max(1, Math.floor(size * 0.04)) + cH;

      ctx.fillStyle = '#00ddcc';
      ctx.shadowColor = '#00ddcc'; ctx.shadowBlur = 5;
      ctx.fillRect(mX, mY, mW, mH);
      ctx.fillRect(mX, mY - cH, cW, cH);
      ctx.fillRect(mX + mW - cW, mY - cH, cW, cH);
      ctx.shadowBlur = 0;
    } else if (e.type === 'bomber') {
      // 3 eyes in a row
      const eyeSz = Math.max(3, Math.floor(size * 0.21));
      const pupSz = Math.max(2, eyeSz - 1);
      const gap = Math.floor((size - pad * 2 - eyeSz * 3) / 2);
      const ex1 = sx - half + pad;
      const ex2 = ex1 + eyeSz + gap;
      const ex3 = ex2 + eyeSz + gap;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex2, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex3, eyeY, eyeSz, eyeSz);
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(ex1 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex3 + 1, eyeY + 1, pupSz, pupSz);
      // Smile mouth (U-shape): bottom bar + two corner uprights
      const mW = Math.max(6, Math.floor(size * 0.55));
      const mH = Math.max(1, Math.floor(size * 0.10));
      const mX = sx - Math.floor(mW / 2);
      const mY = eyeY + eyeSz + Math.max(2, Math.floor(size * 0.10));
      const cW = Math.max(1, Math.floor(mW * 0.13));
      const cH = Math.max(2, Math.floor(mH * 2.5));
      ctx.fillStyle = e.exploding ? '#ff2200' : '#cc3300';
      ctx.fillRect(mX, mY, mW, mH);           // bottom bar
      ctx.fillRect(mX, mY - cH, cW, cH);      // left corner upright
      ctx.fillRect(mX + mW - cW, mY - cH, cW, cH); // right corner upright
    } else {
      // normal / armored: 2 eyes
      const eyeSz = Math.max(2, Math.floor(size * 0.18));
      const pupSz = Math.max(1, eyeSz - 1);
      const eyeClr = e.type === 'armored' ? '#ffff00' : '#ff2200';
      const ex1 = sx - half + pad + 1;
      const ex2 = sx + half - pad - eyeSz - 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex1, eyeY, eyeSz, eyeSz);
      ctx.fillRect(ex2, eyeY, eyeSz, eyeSz);
      ctx.fillStyle = eyeClr;
      ctx.fillRect(ex1 + 1, eyeY + 1, pupSz, pupSz);
      ctx.fillRect(ex2 + 1, eyeY + 1, pupSz, pupSz);
    }
  }

  // ── Type-specific details ─────────────────────────────────────────────
  if(e.type==='armored'&&e.hp>e.maxHp/2){
    drawMobBrackets(ctx,sx,sy,half+4,cfg.shieldColor,.85,3);
  }
  if (e.type === 'armored' && !flash) {
    // Wavy/squiggly mouth below the eyes
    const wW = Math.max(8, Math.floor(size * 0.60));
    const segW = Math.max(2, Math.floor(wW / 6));
    const wH = Math.max(1, Math.floor(size * 0.09));
    const amp = Math.max(2, Math.floor(size * 0.12));
    const wX = sx - Math.floor(wW / 2);
    const wY = sy - half + Math.floor(size * 0.55);
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 6;
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(wX + i * segW, wY + (i % 2 === 0 ? 0 : amp), segW, wH);
    }
    ctx.shadowBlur = 0;
  }
  if (e.type === 'bomber') {
    // X danger mark across body
    const x1 = sx - half + pad * 2, y1 = sy - half + pad * 2;
    const x2 = sx + half - pad * 2, y2 = sy + half - pad * 2;
    const xs = Math.max(2, Math.floor(size * 0.08));
    ctx.fillStyle = e.exploding ? '#ff2200' : '#880000';
    ctx.fillRect(x1, y1, xs, xs);
    ctx.fillRect(x2 - xs, y1, xs, xs);
    ctx.fillRect(sx - xs / 2, sy - xs / 2, xs, xs);
    ctx.fillRect(x1, y2 - xs, xs, xs);
    ctx.fillRect(x2 - xs, y2 - xs, xs, xs);
  }
  if(e.type==='bomber'&&e.exploding){
    const pulse=.55+.45*Math.abs(Math.sin(tickN*.3));
    drawMobBrackets(ctx,sx,sy,drawH+6,'#f39a65',pulse,3);
    ctx.save();ctx.shadowBlur=0;ctx.fillStyle='#ffe0b2';ctx.globalAlpha=pulse;
    for(let i=0;i<Math.ceil(Math.max(0,e.explodeTick)/15);i++)ctx.fillRect(Math.round(sx-10+i*6),Math.round(sy-drawH-12),3,3);
    ctx.restore();
  }

  if (e.type === 'charger') {
    if((e.chargeWindupTicks??0)>0){
      const progress=1-e.chargeWindupTicks!/CHARGER_WINDUP_TICKS;
      drawMobBrackets(ctx,sx,sy,half+5,'#ffc37a',.45+progress*.5,3);
    }else if (e.chargeDirX !== 0 || e.chargeDirY !== 0) {
      // Motion trail — two faint rects trailing behind
      for (let t = 1; t <= 2; t++) {
        const alpha = 0.25 / t;
        ctx.fillStyle = `rgba(255,68,0,${alpha})`;
        ctx.fillRect(sx - drawH - e.chargeDirX * TILE_SIZE * t * 0.4,
          sy - drawH - e.chargeDirY * TILE_SIZE * t * 0.4, drawSz, drawSz);
      }
    } else if (e.windupTicks > 0) {
      // Dizzy stars
      const dAngle = (tickN * 0.15) % (Math.PI * 2);
      for (let d = 0; d < 3; d++) {
        const a = dAngle + (d * Math.PI * 2 / 3);
        const dx2 = Math.cos(a) * (half + 5), dy2 = Math.sin(a) * (half + 4);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(sx + Math.floor(dx2) - 2, sy + Math.floor(dy2) - 2, 3, 3);
      }
    }
  }

  // ── Shielder: shield arc toward shielded target (drawn per-enemy; shielded overlay is separate) ──
  if(e.type==='shielder'&&e.shieldTargetId!==-1){
    drawMobBrackets(ctx,sx,sy,half+4,'#6dd3c2',.65,2);
  }
  if(shielded){
    drawMobBrackets(ctx,sx,sy,half+5,'#00ddcc',.75,3);
  }
  if(e.icyShieldHP>0)drawMobIceShield(ctx,sx,sy,half+7,tickN);

  if(e.type==='healer'){
    const ready=Math.max(0,Math.min(1,1-e.attackTimer/HEALER_HEAL_INTERVAL)),pulse=.4+.6*Math.abs(Math.sin(tickN*.1));
    drawMobBrackets(ctx,sx,sy,half+4+Math.floor(ready*10),'#ff55cc',(.2+.6*ready)*pulse,2);
  }

  if(e.type==='sniper'&&e.windupTicks>0){
    const progress=Math.max(0,Math.min(1,1-e.windupTicks/50));
    drawMobBrackets(ctx,sx,sy,half+15-Math.floor(progress*8),'#eb745b',.55+progress*.35,3);
    ctx.save();ctx.shadowBlur=0;ctx.fillStyle='#ffe1bd';ctx.globalAlpha=.5+.35*Math.abs(Math.sin(tickN*.15));
    ctx.fillRect(Math.round(sx)-2,Math.round(sy-half-18),4,4);ctx.restore();
  }

  // ── HP bar ────────────────────────────────────────────────────────────
  if (e.hp < e.maxHp) {
    const barW = size + 4;
    const barH = Math.max(5, Math.floor(size * 0.13));
    const bx = sx - barW / 2;
    const by = sy - half - antH - dotSz - barH - 3;
    const pct = e.hp / e.maxHp;
    ctx.fillStyle = '#330000';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = pct > 0.5 ? '#00cc44' : pct > 0.25 ? '#ffaa00' : '#ff3300';
    ctx.fillRect(bx, by, barW * pct, barH);
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);
  }
}

// Battlefield geometry stays in the map; these helpers only paint its surfaces.
function drawBattlefieldPad(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, tick: number, phase: number) {
  const cx=Math.round(x+TILE_SIZE/2),cy=Math.round(y+TILE_SIZE/2);
  const pulse=.7+.3*Math.sin(tick*.035+phase),age=tick+phase*17;
  ctx.save();
  // A low-profile station platform: crisp luminous shell, dark recessed interior.
  ctx.shadowColor=color;ctx.shadowBlur=5+3*pulse;
  ctx.fillStyle=color;ctx.fillRect(cx-22,cy-22,44,44);ctx.shadowBlur=0;
  ctx.fillStyle='#1b2c43';ctx.fillRect(cx-17,cy-17,34,34);
  ctx.fillStyle='#142239';ctx.fillRect(cx-13,cy-13,26,26);
  ctx.strokeStyle=color+'45';ctx.lineWidth=4;ctx.strokeRect(cx-12,cy-12,24,24);
  // Paired square fronts flow inward rather than blinking like a pickup.
  for(let front=0;front<2;front++){
    const life=((age+front*35)%70)/70,half=14-Math.floor(life*9);
    ctx.globalAlpha=(1-life)*.5;ctx.strokeStyle=color;ctx.lineWidth=4;
    ctx.strokeRect(cx-half,cy-half,half*2,half*2);
  }
  ctx.globalAlpha=1;
  const nodes=[[0,-18],[18,0],[0,18],[-18,0]],lit=Math.floor(age/14)%4;
  for(const [i,[dx,dy]]of nodes.entries()){
    ctx.fillStyle=i===lit?'#e0f7ff':color;ctx.shadowColor=color;ctx.shadowBlur=i===lit?5:0;
    ctx.fillRect(cx+dx-2,cy+dy-2,4,4);
  }
  ctx.shadowBlur=0;ctx.fillStyle=color+'99';ctx.fillRect(cx-2,cy-2,4,4);
  ctx.restore();
}

function drawBattlefieldIce(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  ctx.save();const pulse=.6+.4*Math.abs(Math.sin(tick*.06)),size=TILE_SIZE;
  ctx.shadowColor='#aaeeff';ctx.shadowBlur=10*pulse;ctx.fillStyle='rgba(170,238,255,'+.4*pulse+')';ctx.fillRect(x,y,size,size);
  ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,'+.7*pulse+')';ctx.lineWidth=2;ctx.strokeRect(x+2,y+2,size-4,size-4);
  ctx.shadowBlur=0;ctx.globalAlpha=.55*pulse;ctx.fillStyle='#d4edf6';
  for(const [px,py,w,h]of [[9,12,12,3],[18,12,3,12],[18,21,12,3],[27,21,3,12],[12,30,9,3],[12,30,3,9]])ctx.fillRect(x+px,y+py,w,h);
  ctx.globalAlpha=.8*pulse;ctx.shadowColor='#d4edf6';ctx.shadowBlur=4;ctx.fillStyle='#f0fcff';ctx.fillRect(x+9,y+9,3,3);
  ctx.restore();
}

function drawBattlefield(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, viewW: number, viewH: number, tick: number) {
  ctx.save();const size=TILE_SIZE,ice=new Set(state.frostIceTiles.map(([x,y])=>x+','+y)),eclipse=eclipseVisualStrength(state);
  const x0=Math.max(0,Math.floor(camX/size)-1),y0=Math.max(0,Math.floor(camY/size)-1),x1=Math.min(MAP_COLS-1,Math.ceil((camX+viewW)/size)+1),y1=Math.min(MAP_ROWS-1,Math.ceil((camY+viewH)/size)+1);
  const ocean=!!state.neptune,solar=!!state.sun,forest=!!state.gaia,moon=isMoonMap(state);
  const battlefieldColor=(ch:number)=>{
    const base=solar?(ch>=0?SUN_CHAMBER_COLORS[ch]:'#ffb86b'):ocean?(ch>=0?OCEAN_CHAMBER_COLORS[ch]:'#5fb8ff'):forest?(ch>=0?GAIA_CHAMBER_COLORS[ch]:'#b8d86a'):moon?(ch>=0?MOON_CHAMBER_COLORS[ch]:'#d8c2ff'):ch>=0?CHAMBER_COLORS[ch]:'#8899ff';
    if(eclipse<=0)return base;
    const night=ch>=0?['#7986d7','#a185c8','#748dba','#aa95cc'][ch]:'#8b8fcf';
    const channel=(offset:number)=>Math.round(parseInt(base.slice(offset,offset+2),16)*(1-eclipse)+parseInt(night.slice(offset,offset+2),16)*eclipse).toString(16).padStart(2,'0');
    return '#'+channel(1)+channel(3)+channel(5);
  };
  const wall=(x:number,y:number)=>(state.map[y]?.[x]??T_WALL)===T_WALL;
  const cover=(x:number,y:number)=>{const ch=chamberOfTile(x,y);if(ch<0||!wall(x,y))return false;const [t,l,b,r]=CHAMBER_BOUNDS[ch];return x>l&&x<r&&y>t&&y<b;};
  // All base tiles are flat dark panels, keeping actors' neon silhouettes dominant.
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const x=tx*size-camX,y=ty*size-camY,ch=chamberOfTile(tx,ty),color=battlefieldColor(ch);ctx.shadowBlur=0;
    if(wall(tx,ty)){
      if(!cover(tx,ty))continue;
      if(solar){drawSunCover(ctx,state,tx,ty,x,y,state.gameTick);continue;}
      if(moon){drawMoonCrystalBlock(ctx,state,tx,ty,x,y,color,tick);continue;} // the Moon: every cover block is crystal
      if(forest){drawGaiaStone(ctx,state,tx,ty,x,y,color);continue;} // Gaia: mossy stone
      if(ocean){drawNeptuneRock(ctx,state,tx,ty,x,y,color);continue;} // Neptune: reef rock with barnacles and coral
      ctx.fillStyle=ocean?'#06263a':forest?'#102a14':moon?'#1c1236':'#0f0f28';ctx.fillRect(x,y,size,size);ctx.fillStyle=color+'22';ctx.fillRect(x,y,size,size);
      ctx.shadowColor=color;ctx.shadowBlur=3;ctx.strokeStyle=color+'55';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,size-2,size-2);continue;
    }
    if(solar){drawSunFloorTile(ctx,state,tx,ty,x,y,state.gameTick);continue;}
    ctx.fillStyle=solar?(ch>=0?'#201313':'#160d0f'):ocean?(ch>=0?'#04192c':'#031424'):forest?(ch>=0?'#0c1a0e':'#0a160c'):moon?(ch>=0?'#0b0717':'#090614'):ch>=0?'#0d0d22':'#0a0a1a';ctx.fillRect(x,y,size,size);
    if(ch>=0){ctx.fillStyle=color+(ocean||forest||moon?'14':'10');ctx.fillRect(x,y,size,size);}
    ctx.strokeStyle=ocean?'#9fe4ff0d':forest?'#d8f0a00d':moon?'#e9d8ff10':'#ffffff0f';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,size-1,size-1);
  }
  // Glowing colored borders follow the map's exposed edges, preserving door openings.
  const drawBorders=(onlyRoom?:number)=>{for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    if(wall(tx,ty))continue;
    const x=tx*size-camX,y=ty*size-camY,ch=chamberOfTile(tx,ty),color=battlefieldColor(ch);
    if(onlyRoom!==undefined&&ch!==onlyRoom)continue;
    ctx.shadowColor=color;ctx.shadowBlur=14;ctx.strokeStyle=color+'99';ctx.lineWidth=4;ctx.beginPath();
    if(wall(tx-1,ty)&&!cover(tx-1,ty)){ctx.moveTo(x+1,y);ctx.lineTo(x+1,y+size);}
    if(wall(tx+1,ty)&&!cover(tx+1,ty)){ctx.moveTo(x+size-1,y);ctx.lineTo(x+size-1,y+size);}
    if(wall(tx,ty-1)&&!cover(tx,ty-1)){ctx.moveTo(x,y+1);ctx.lineTo(x+size,y+1);}
    if(wall(tx,ty+1)&&!cover(tx,ty+1)){ctx.moveTo(x,y+size-1);ctx.lineTo(x+size,y+size-1);}
    ctx.stroke();ctx.shadowBlur=0;
    if(state.map[ty][tx]===T_TELEPORT){if(solar)drawSunPad(ctx,x,y,state.gameTick,ch);else drawBattlefieldPad(ctx,x,y,color,tick,ch);} // pads stay visible in the dark too
    if(onlyRoom!==undefined)continue; // a redraw over the dark keeps only the outline and pad
    if(ice.has(tx+','+ty))drawBattlefieldIce(ctx,x,y,tick);
  }};
  drawBorders();
  if(ocean)drawOceanAmbience(ctx,state,camX,camY,x0,y0,x1,y1,tick);
  else if(forest)drawForestAmbience(ctx,state,camX,camY,x0,y0,x1,y1,tick);
  else if(moon)drawMoonAmbience(ctx,state,camX,camY,x0,y0,x1,y1,tick);
  else if(!solar)drawFloorStars(ctx,state,camX,camY,x0,y0,x1,y1,tick);
  // Moon phase 3: the dark room's floor goes black (cover blocks stay), then its outline is drawn again on top.
  const darkRooms=state.moon?[[state.moon.dark,1-state.moon.darkFade/30],[state.moon.oldDark,state.moon.darkFade/30]]:[];
  for(const [room,alpha] of darkRooms){
    if(room<0||alpha<=0)continue;
    ctx.globalAlpha=alpha;ctx.fillStyle='#030108';ctx.shadowBlur=0;
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(!wall(tx,ty)&&chamberOfTile(tx,ty)===room)ctx.fillRect(tx*size-camX,ty*size-camY,size,size);
    ctx.globalAlpha=1;drawBorders(room);
  }
  ctx.restore();
}

// Endless backdrop: deliberately quiet. Two parallax star layers, a few twinkling stars and two very faint
// blocky nebula patches in the room colors; nothing competes with the battlefield.
function drawSpaceBackdrop(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, camX: number, camY: number, tick: number) {
  const hash = (i: number, k: number) => { const n = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return n - Math.floor(n); };
  ctx.save();
  ctx.fillStyle = BG_COLOR; ctx.fillRect(0, 0, viewW, viewH);
  // Nebula: stacked translucent blocks drifting very slowly.
  for (let n = 0; n < 2; n++) {
    const color = n ? CHAMBER_COLORS[1] : CHAMBER_COLORS[2], span = viewW + 800;
    const nx = ((hash(n, 1) * span - camX * .05 + tick * .01) % span + span) % span - 400, ny = viewH * (.25 + n * .45) - ((camY * .05) % 200);
    ctx.fillStyle = color;
    for (let b = 0; b < 7; b++) {
      ctx.globalAlpha = .025 + hash(n, 10 + b) * .02;
      const w = 120 + hash(n, 20 + b) * 220, h = 40 + hash(n, 30 + b) * 90;
      ctx.fillRect(Math.round(nx + (hash(n, 40 + b) - .5) * 260), Math.round(ny + (hash(n, 50 + b) - .5) * 140), Math.round(w), Math.round(h));
    }
  }
  // Stars in two depth layers; a few twinkle.
  for (let i = 0; i < 110; i++) {
    const far = i % 3 !== 0, par = far ? .08 : .2;
    const x = ((hash(i, 2) * viewW * 1.5 - camX * par) % viewW + viewW) % viewW, y = ((hash(i, 3) * viewH * 1.5 - camY * par) % viewH + viewH) % viewH;
    const twinkle = i % 9 === 0 ? .5 + .5 * Math.sin(tick * .05 + i) : 1;
    ctx.globalAlpha = (far ? .22 : .45) * twinkle; ctx.fillStyle = i % 7 === 0 ? '#c9b8ff' : '#dfe6ff';
    const size = far ? 2 : 3; ctx.fillRect(Math.round(x), Math.round(y), size, size);
    if (!far && i % 9 === 0) { ctx.globalAlpha = .25 * twinkle; ctx.fillRect(Math.round(x) - 3, Math.round(y) + 1, 9, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - 3, 1, 9); }
  }
  ctx.restore();
}

// Endless floors: a very sparse scatter of faint star specks, fixed to the tiles.
function drawFloorStars(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number, tick: number) {
  ctx.save(); ctx.shadowBlur = 0;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if ((state.map[ty]?.[tx] ?? T_WALL) === T_WALL) continue;
    const n = Math.sin(tx * 127.1 + ty * 311.7) * 43758.5453, h = n - Math.floor(n);
    if (h < .9) continue;
    const ox = Math.floor(h * 997) % 36 + 6, oy = Math.floor(h * 7919) % 36 + 6;
    ctx.globalAlpha = .12 + .06 * Math.sin(tick * .03 + tx + ty); ctx.fillStyle = '#dfe6ff';
    ctx.fillRect(tx * TILE_SIZE - camX + ox, ty * TILE_SIZE - camY + oy, 2, 2);
  }
  ctx.restore();
}

// Neptune challenge backdrop behind the station: an open ocean seen through the void. Layers scroll at
// different parallax rates: depth gradient, swaying light shafts, distant blocky reef silhouettes,
// slow fish schools, drifting marine snow and a faint glow from the deep. Purely cosmetic.
function drawOceanBackdrop(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, camX: number, camY: number, tick: number) {
  const hash = (i: number, k: number) => { const n = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return n - Math.floor(n); };
  const worldH = MAP_ROWS * TILE_SIZE, depth = Math.max(0, Math.min(1, (camY + viewH / 2) / worldH));
  ctx.save();
  // Depth gradient: brighter blue near the top of the map, near-black in the deep.
  const gradient = ctx.createLinearGradient(0, 0, 0, viewH);
  gradient.addColorStop(0, depth < .5 ? '#0a3a66' : '#062a4c');
  gradient.addColorStop(.55, '#04192f');
  gradient.addColorStop(1, '#01060e');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, viewW, viewH);
  // Glow welling up from the abyss.
  const abyss = ctx.createRadialGradient(viewW / 2, viewH * 1.15, 40, viewW / 2, viewH * 1.15, viewW * .7);
  abyss.addColorStop(0, 'rgba(40,140,200,.18)'); abyss.addColorStop(1, 'rgba(40,140,200,0)');
  ctx.fillStyle = abyss; ctx.fillRect(0, 0, viewW, viewH);
  // Light shafts from the surface: slanted pale bands that sway and drift with a slow parallax.
  for (let i = 0; i < 7; i++) {
    const baseX = ((hash(i, 1) * 1.6 - .3) * viewW - camX * .12 + tick * .05 * (i % 2 ? 1 : -1)) % (viewW * 1.4);
    const x = baseX < -viewW * .2 ? baseX + viewW * 1.4 : baseX, width = 40 + hash(i, 2) * 90;
    const sway = Math.sin(tick * .008 + i) * 30, alpha = (.08 + hash(i, 3) * .07) * (1 - depth * .5);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x + sway, -20); ctx.transform(1, 0, -.35, 1, 0, 0);
    const shaft = ctx.createLinearGradient(0, 0, 0, viewH);
    shaft.addColorStop(0, '#bfe9ff'); shaft.addColorStop(1, 'rgba(191,233,255,0)');
    ctx.fillStyle = shaft; ctx.fillRect(0, 0, width, viewH * .95); ctx.restore();
  }
  // Distant reef: blocky stepped silhouettes along the seabed band, scrolling at half speed.
  const reefParallax = .45, spacing = 260;
  const first = Math.floor((camX * reefParallax) / spacing) - 1;
  for (let i = first; i < first + Math.ceil(viewW / spacing) + 3; i++) {
    const x = i * spacing - camX * reefParallax, height = 90 + hash(i, 4) * 170;
    const floorY = viewH * .86 + hash(i, 5) * 70 - ((camY * .06) % 50); // the reef stays along the lower part of the view
    ctx.fillStyle = '#03182b';
    for (let step = 0; step < 5; step++) {
      const w = 34 + hash(i, 10 + step) * 70, h = height * (1 - step * .17);
      ctx.fillRect(Math.round(x + step * 26 - w / 2), Math.round(floorY - h), Math.round(w), Math.round(h + 400));
    }
    // Faint bioluminescent tips on the reef.
    if (hash(i, 6) > .4) {
      const glow = .35 + .35 * Math.sin(tick * .03 + i);
      ctx.globalAlpha = glow; ctx.fillStyle = hash(i, 7) > .5 ? '#3fe0c0' : '#7f9bff';
      ctx.fillRect(Math.round(x + 4), Math.round(floorY - height - 6), 6, 6); ctx.fillRect(Math.round(x + 40), Math.round(floorY - height * .75), 4, 4);
      ctx.globalAlpha = 1;
    }
  }
  // Bubble columns rising from vents in the reef.
  for (let v = 0; v < 4; v++) {
    const vx = ((hash(v, 20) * viewW * 1.3 - camX * .3) % (viewW * 1.3) + viewW * 1.3) % (viewW * 1.3) - viewW * .15;
    for (let b = 0; b < 7; b++) {
      const rise = ((tick * (.6 + hash(v, 21) * .4) + b * 70) % 500) / 500;
      const bx = vx + Math.sin(tick * .04 + b * 2 + v) * 6, by = viewH * (1 - rise) + 10;
      ctx.globalAlpha = .45 * (1 - rise * .7); ctx.strokeStyle = '#bfeaff'; ctx.lineWidth = 1.5;
      const size = 4 + (b % 3) * 2; ctx.strokeRect(Math.round(bx), Math.round(by), size, size);
    }
  }
  ctx.globalAlpha = 1;
  // Jellyfish drifting in the middle water: pulsing blocky bells with trailing tentacles.
  for (let j = 0; j < 4; j++) {
    const color = j % 2 ? '#ff8fd0' : '#7fe8ff', pulse = Math.sin(tick * .05 + j * 1.7);
    const span = viewW + 300, jx = ((hash(j, 30) * span + tick * .12 * (j % 2 ? 1 : -1) - camX * .3) % span + span) % span - 150;
    const jy = ((hash(j, 31) * viewH * .7 + viewH * .1 - tick * .1 - camY * .15 + pulse * 6) % viewH + viewH) % viewH;
    const w = 22 + pulse * 3;
    ctx.globalAlpha = .55; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = color;
    ctx.fillRect(Math.round(jx - w / 2), Math.round(jy), Math.round(w), 10); ctx.fillRect(Math.round(jx - w / 2 + 4), Math.round(jy - 5), Math.round(w - 8), 5);
    ctx.shadowBlur = 0; ctx.globalAlpha = .35;
    for (let t = 0; t < 4; t++) {
      const tx = jx - w / 2 + 4 + t * (w - 8) / 3, wave = Math.sin(tick * .08 + t + j) * 3;
      for (let seg = 0; seg < 4; seg++) ctx.fillRect(Math.round(tx + wave * seg / 3), Math.round(jy + 12 + seg * 6), 2, 5);
    }
    ctx.globalAlpha = .8; ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(jx - 3), Math.round(jy + 2), 3, 3);
  }
  ctx.globalAlpha = 1;
  // Fish schools far away: small dark chevrons swimming across slowly.
  for (let school = 0; school < 3; school++) {
    const dir = school % 2 ? -1 : 1, speed = .25 + hash(school, 8) * .2;
    const span = viewW + 400, sx = ((tick * speed * dir + hash(school, 9) * span - camX * .25) % span + span) % span - 200;
    const sy = viewH * (.2 + school * .22) - camY * .1 % 60;
    ctx.fillStyle = 'rgba(8,40,70,.85)';
    for (let f = 0; f < 9; f++) {
      const fx = sx + (f % 3) * 16 * -dir + Math.sin(tick * .05 + f) * 2, fy = sy + Math.floor(f / 3) * 10 + (f % 3) * 4;
      ctx.fillRect(Math.round(fx), Math.round(fy), 8, 4); ctx.fillRect(Math.round(fx - 4 * dir), Math.round(fy - 2), 4, 8);
    }
  }
  // Marine snow: tiny pale specks drifting down, closer ones faster and brighter.
  for (let i = 0; i < 90; i++) {
    const layer = i % 3, speed = .15 + layer * .12, par = .15 + layer * .15;
    const x = ((hash(i, 11) * viewW * 1.2 - camX * par + Math.sin(tick * .01 + i) * 12) % viewW + viewW) % viewW;
    const y = ((hash(i, 12) * viewH + tick * speed - camY * par) % viewH + viewH) % viewH;
    ctx.globalAlpha = .18 + layer * .14; ctx.fillStyle = '#d8f2ff';
    const size = layer === 2 ? 3 : 2; ctx.fillRect(Math.round(x), Math.round(y), size, size);
  }
  ctx.restore();
}

// Neptune challenge palette: blue-teal rooms in place of the station's chamber colors.
const OCEAN_CHAMBER_COLORS = ['#3fd0ff', '#5b8cff', '#2fe0c0', '#7d7bff'] as const;

// Underwater dressing for the Neptune challenge: drifting light caustics, sandy floor specks,
// kelp swaying on cover blocks and bubbles rising through the water. Purely cosmetic.
function drawOceanAmbience(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number, tick: number) {
  const size=TILE_SIZE,hash=(x:number,y:number,k:number)=>{const n=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return n-Math.floor(n);};
  const wall=(x:number,y:number)=>(state.map[y]?.[x]??T_WALL)===T_WALL;
  ctx.save();ctx.shadowBlur=0;
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const x=tx*size-camX,y=ty*size-camY;
    if(wall(tx,ty)){
      // Kelp: two stepped stalks swaying on interior cover blocks.
      const ch=chamberOfTile(tx,ty);if(ch<0||hash(tx,ty,9)>.45)continue;
      const [t,l,b,r]=CHAMBER_BOUNDS[ch];if(!(tx>l&&tx<r&&ty>t&&ty<b))continue; // interior cover only, never the outer walls
      ctx.globalAlpha=1; // the floor caustics/specks/bubbles leave a faint alpha behind; kelp is always fully drawn
      for(let k=0;k<2;k++){
        const base=x+10+k*22,sway=Math.round(Math.sin(tick*.04+tx+k*1.7)*3);
        ctx.fillStyle=k?'#2fbf8a':'#1f9a74';
        for(let seg=0;seg<4;seg++)ctx.fillRect(base+Math.round(sway*seg/3),y+size-8-seg*9,5,9);
        ctx.fillStyle='#7cf0c2';ctx.fillRect(base+sway+1,y+size-44,3,4);
      }
      continue;
    }
    // Caustics: soft diagonal light bands that drift slowly across the floor.
    const wave=Math.sin(tx*.55+ty*.35+tick*.025)+Math.sin(tx*.21-ty*.47+tick*.018);
    if(wave>1.1){ctx.globalAlpha=Math.min(.12,(wave-1.1)*.14);ctx.fillStyle='#9fe8ff';ctx.fillRect(x+4,y+4,size-8,size-8);}
    // Sandy specks.
    if(hash(tx,ty,1)>.82){ctx.globalAlpha=.28;ctx.fillStyle='#7fa8c4';ctx.fillRect(x+Math.floor(hash(tx,ty,2)*36)+4,y+Math.floor(hash(tx,ty,3)*36)+4,3,3);}
    // Rising bubbles loop upward from fixed vents.
    if(hash(tx,ty,4)>.93){
      const period=240,phase=(tick+Math.floor(hash(tx,ty,5)*period))%period,rise=phase/period;
      const bx=x+12+Math.round(Math.sin(tick*.05+tx)*4)+Math.floor(hash(tx,ty,6)*20),by=y+size-rise*size*2.4;
      ctx.globalAlpha=.5*(1-rise);ctx.strokeStyle='#c9f2ff';ctx.lineWidth=1.5;ctx.strokeRect(bx,by,6,6);
      ctx.fillStyle='#ffffff';ctx.fillRect(bx+1,by+1,2,2);
    }
  }
  ctx.globalAlpha=1;ctx.restore();
}

function drawReaperHallwaySeal(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tick: number) {
  const bounds=HALLWAY_BOUNDS[state.hallwaySeal];
  if(!bounds||state.hallwaySealTicks<=0)return;
  const [r1,c1,r2,c2]=bounds,horizontal=c2-c1>r2-r1;
  const fade=Math.min(1,state.hallwaySealTicks/30),pulse=.7+.3*Math.abs(Math.sin(tick*.1)),size=TILE_SIZE;
  ctx.save();
  for(let row=r1;row<=r2;row++)for(let col=c1;col<=c2;col++){
    const x=Math.round(col*size-camX),y=Math.round(row*size-camY);
    const blocked=horizontal?col===c1||col===c2:row===r1||row===r2;
    ctx.shadowBlur=0;ctx.fillStyle='#52ffd6';ctx.globalAlpha=fade*(blocked?.25+.12*pulse:.07);
    ctx.fillRect(x,y,size,size);
    ctx.globalAlpha=fade*(blocked?.8*pulse:.18);ctx.strokeStyle=blocked?'#91ffe4':'#52ffd6';ctx.lineWidth=blocked?4:2;
    if(blocked){ctx.shadowColor='#52ffd6';ctx.shadowBlur=10;}
    ctx.strokeRect(x+2,y+2,size-4,size-4);
    if(blocked){
      ctx.shadowBlur=0;ctx.fillStyle='#d6fff3';ctx.globalAlpha=fade*.8*pulse;
      ctx.fillRect(x+size/2-3,y+size/2-3,6,6);
    }
  }
  ctx.restore();
}

function drawChargerWarnings(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number) {
  ctx.save();
  for(const enemy of state.enemies){
    if(enemy.type!=='charger'||enemy.hp<=0||(enemy.chargeWindupTicks??0)<=0)continue;
    const progress=1-enemy.chargeWindupTicks!/CHARGER_WINDUP_TICKS;
    for(let step=1;step<=CHARGER_CHARGE_TILES;step++){
      const tx=enemy.tileX+enemy.chargeDirX*step,ty=enemy.tileY+enemy.chargeDirY*step;
      if((state.map[ty]?.[tx]??T_WALL)===T_WALL)break;
      const x=Math.round(tx*TILE_SIZE-camX),y=Math.round(ty*TILE_SIZE-camY);
      ctx.globalAlpha=.07+progress*.08;ctx.fillStyle='#ff913f';ctx.fillRect(x+6,y+6,TILE_SIZE-12,TILE_SIZE-12);
      ctx.globalAlpha=(.35+progress*.45)*(1-step*.045);ctx.strokeStyle='#ffc37a';ctx.lineWidth=2;
      ctx.strokeRect(x+6,y+6,TILE_SIZE-12,TILE_SIZE-12);
      ctx.fillStyle='#ffe0ae';ctx.fillRect(x+TILE_SIZE/2-2,y+TILE_SIZE/2-2,4,4);
    }
  }
  ctx.restore();
}

function drawMeteor(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, progress: number, tick: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  const half=Math.round(size/2),pixel=Math.max(6,Math.round(size/36)*6);
  // Separated, stepped flame tongues leave a sharp silhouette at every size.
  for(let i=-2;i<=2;i++){
    const width=Math.max(pixel,Math.round(size*.15/pixel)*pixel);
    const length=Math.round(size*(1.2+.25*Math.abs(i)+.16*Math.sin(tick*.14+i*2))/pixel)*pixel;
    const px=i*width,top=-half-length;
    ctx.globalAlpha=.3+progress*.2;ctx.fillStyle=i%2?'#ff973d':'#ff4d22';
    ctx.fillRect(px-width/2,top,width,length+pixel);
    ctx.globalAlpha=.65;ctx.fillStyle='#ffc46b';
    ctx.fillRect(px-width/2,top+length*.5,width*.5,length*.5+pixel);
  }
  ctx.globalAlpha=1;ctx.shadowColor='#ff6622';ctx.shadowBlur=18;
  ctx.fillStyle='#ff7638';ctx.fillRect(-half,-half,size,size);
  ctx.shadowBlur=0;const rim=Math.max(6,Math.round(size*.05));
  ctx.fillStyle='#4d1514';ctx.fillRect(-half+rim,-half+rim,size-rim*2,size-rim*2);
  // A few molten stair steps, with a pale core, echo the other glowing square bodies.
  ctx.fillStyle='#ffae55';
  ctx.fillRect(-pixel,-half+rim,pixel,size*.4);
  ctx.fillRect(-pixel,-size*.15,pixel*3,pixel);
  ctx.fillRect(pixel,-size*.15,pixel,size*.4);
  ctx.fillRect(-pixel,size*.2,pixel*3,pixel);
  ctx.fillRect(-pixel,size*.2,pixel,size*.3-rim);
  ctx.fillStyle='#ffe8bc';ctx.fillRect(-pixel,-pixel,pixel,pixel);
  ctx.fillRect(-half+rim,-half+rim,pixel*2,pixel);
  for(let i=0;i<6;i++){
    const life=((tick+i*17)%75)/75,side=i%2?1:-1;
    ctx.globalAlpha=(1-life)*.75;ctx.fillStyle=i%3?'#ff773b':'#ffdb8a';
    ctx.shadowColor='#ff6622';ctx.shadowBlur=6;
    ctx.fillRect(side*(half+pixel*(1+life*3)),-half-size*life,pixel,pixel);
  }
  ctx.restore();
}

function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
  tickN: number,
  chargingMs = 0,
  isMobileTouch = false,
): void {
  // Mobile sees more of the map (zoomed out); desktop is untouched. The whole world is drawn
  // in a scaled coordinate space (viewW/viewH), then we restore back to true pixel space
  // before the minimap so it isn't affected by this — it gets its own independent mobile sizing.
  hideBossHeadBars = !!state.trial;
  const worldZoom = isMobileTouch ? 0.4 : 1;
  const viewW = canvasW / worldZoom;
  const viewH = canvasH / worldZoom;

  let camX = state.playerX - viewW / 2;
  let camY = state.playerY - viewH / 2;
  const gravityEvent=state.ambientEvents.active;
  if(gravityEvent?.kind==='blackhole'){
    const tremor=Math.max(0,1-gravityEvent.age/36,1-gravityEvent.ticks/30)*4;
    camX+=Math.round(Math.sin(gravityEvent.age*2.3)*tremor);camY+=Math.round(Math.cos(gravityEvent.age*2.9)*tremor);
  }
  if (state.screenShakeTicks > 0) {
    const shakeStr = state.screenShakeAmt * (state.screenShakeTicks / 22);
    camX += Math.round((Math.random() - 0.5) * shakeStr * 2);
    camY += Math.round((Math.random() - 0.5) * shakeStr * 2);
  }

  ctx.save();
  ctx.scale(worldZoom, worldZoom);

  if (state.sun) drawSunBackdrop(ctx, state, viewW, viewH, camX, camY, state.gameTick);
  else if (state.neptune) drawOceanBackdrop(ctx, viewW, viewH, camX, camY, tickN); // Neptune: the void becomes open ocean
  else if (state.gaia) drawForestBackdrop(ctx, viewW, viewH, camX, camY, tickN); // Gaia: a dusky forest
  else if (isMoonMap(state)) drawMoonBackdrop(ctx, viewW, viewH, camX, camY, tickN); // the Moon: a shadowy crystal cavern
  else drawSpaceBackdrop(ctx, viewW, viewH, camX, camY, tickN); // endless: a quiet starfield behind the station

  drawBattlefield(ctx,state,camX,camY,viewW,viewH,tickN);
  drawAmbientEvents(ctx,state,camX,camY,viewW,viewH);
  drawReaperHallwaySeal(ctx,state,camX,camY,tickN);
  drawChargerWarnings(ctx,state,camX,camY);

  // Frost Warden chill field — persistent icy wash + frosty border over whichever chamber
  // she currently occupies, so the chill debuff is visible, not just felt
  const frostWarden = state.enemies.find(e => e.type === 'frost_warden');
  if (frostWarden) {
    const fwChamber = chamberOfTile(frostWarden.tileX, frostWarden.tileY);
    if (fwChamber >= 0) {
      const [r1, c1, r2, c2] = CHAMBER_BOUNDS[fwChamber];
      const frostPulse = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.03));
      ctx.fillStyle = `rgba(170,238,255,${0.06 + 0.05 * frostPulse})`;
      ctx.fillRect(c1 * TILE_SIZE - camX, r1 * TILE_SIZE - camY,
        (c2 - c1 + 1) * TILE_SIZE, (r2 - r1 + 1) * TILE_SIZE);
      ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.2 * frostPulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(c1 * TILE_SIZE - camX + 1, r1 * TILE_SIZE - camY + 1,
        (c2 - c1 + 1) * TILE_SIZE - 2, (r2 - r1 + 1) * TILE_SIZE - 2);
    }
  }

  drawSunGround(ctx, state, camX, camY, state.gameTick);
  drawGaiaGround(ctx, state, camX, camY, viewW, viewH, tickN);
  drawThornGround(ctx, state, camX, camY, tickN);
  drawNeptuneOverlay(ctx, state, camX, camY, tickN);
  drawEncounterTelegraphs(ctx, state, camX, camY);
  if(state.singularity){
    const field=state.singularity,x=field.x-camX,y=field.y-camY,fade=Math.min(1,field.ticks/90);
    ctx.save();ctx.shadowBlur=0;
    const radius=SPECIAL_SINGULARITY_RADIUS/TILE_SIZE,centerX=Math.floor(field.x/TILE_SIZE),centerY=Math.floor(field.y/TILE_SIZE);
    const affected=(dx:number,dy:number)=>Math.hypot(dx,dy)<=radius && (state.map[centerY+dy]?.[centerX+dx]??T_WALL)!==T_WALL;
    for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
      if(!affected(dx,dy))continue;
      const tx=(centerX+dx)*TILE_SIZE-camX,ty=(centerY+dy)*TILE_SIZE-camY;
      ctx.globalAlpha=fade*(.09+.025*Math.abs(Math.sin(tickN*.04)));ctx.fillStyle='#b1b1c1';ctx.fillRect(tx+1,ty+1,TILE_SIZE-2,TILE_SIZE-2);
      const pulse=.5+.5*Math.sin(tickN*.065-(Math.abs(dx)+Math.abs(dy))*.9);
      ctx.globalAlpha=fade*(.4+pulse*.25);ctx.fillStyle='#a1a1b1';
      if(!affected(dx-1,dy))ctx.fillRect(tx,ty,4,TILE_SIZE);
      if(!affected(dx+1,dy))ctx.fillRect(tx+TILE_SIZE-4,ty,4,TILE_SIZE);
      if(!affected(dx,dy-1))ctx.fillRect(tx,ty,TILE_SIZE,4);
      if(!affected(dx,dy+1))ctx.fillRect(tx,ty+TILE_SIZE-4,TILE_SIZE,4);
    }
    ctx.restore();
    ctx.save();ctx.translate(x,y);ctx.shadowBlur=0;
    ctx.globalAlpha=fade;drawCelestialCast(ctx,'devourer',0,0,0,tickN);
    for(let i=0;i<16;i++){
      const life=((tickN+i*19)%100)/100,angle=i*2.4-life*3,r=20+(1-life)*SPECIAL_SINGULARITY_RADIUS;
      ctx.globalAlpha=fade*Math.sin(life*Math.PI)*.65;ctx.fillStyle=i%4?'#494952':'#aaaab3';
      ctx.fillRect(Math.round(Math.cos(angle)*r/3)*3,Math.round(Math.sin(angle)*r*.65/3)*3,6,6);
    }
    ctx.shadowColor='#b7b7d6';ctx.shadowBlur=6;
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,life=((tickN+i*13)%96)/96,distance=35+(1-life)*(SPECIAL_SINGULARITY_RADIUS-55),dx=Math.cos(angle),dy=Math.sin(angle);
      ctx.globalAlpha=fade*Math.sin(life*Math.PI)*.65;
      drawEnergyPixelRay(ctx,Math.round(dx*distance/3)*3,Math.round(dy*distance/3)*3,-dx,-dy,i%2?'#88889e':'#d9d9eb',.8);
    }
    ctx.restore();
  }
  if(state.celestialField){
    const field=state.celestialField,r=SPECIAL_WEAVER_RADIUS,x=field.x-camX,y=field.y-camY;
    ctx.save();ctx.shadowBlur=0;
    const fade=Math.min(1,field.ticks/90),left=(field.x-r)/TILE_SIZE,top=(field.y-r)/TILE_SIZE,side=r*2/TILE_SIZE;
    const affected=(tx:number,ty:number)=>tx>=left&&tx<left+side&&ty>=top&&ty<top+side&&(state.map[ty]?.[tx]??T_WALL)!==T_WALL;
    for(let ty=top;ty<top+side;ty++)for(let tx=left;tx<left+side;tx++){
      if(!affected(tx,ty))continue;
      const px=Math.round(tx*TILE_SIZE-camX),py=Math.round(ty*TILE_SIZE-camY);
      const pulse=.5+.5*Math.sin(tickN*.065-(Math.abs(tx-left-(side-1)/2)+Math.abs(ty-top-(side-1)/2))*.9);
      ctx.globalAlpha=fade*(.07+pulse*.07);ctx.fillStyle=(tx+ty)%2?'#83c965':'#b0e582';ctx.fillRect(px,py,TILE_SIZE,TILE_SIZE);
      ctx.globalAlpha=fade*(.4+pulse*.25);ctx.fillStyle='#a8e77b';
      if(!affected(tx-1,ty))ctx.fillRect(px,py,4,TILE_SIZE);
      if(!affected(tx+1,ty))ctx.fillRect(px+TILE_SIZE-4,py,4,TILE_SIZE);
      if(!affected(tx,ty-1))ctx.fillRect(px,py,TILE_SIZE,4);
      if(!affected(tx,ty+1))ctx.fillRect(px,py+TILE_SIZE-4,TILE_SIZE,4);
      if((tx+ty)%3===0){
        const growth=.5+.5*Math.sin(tickN*.05+tx*2+ty),cx=px+TILE_SIZE/2,cy=py+TILE_SIZE/2;
        ctx.globalAlpha=fade*(.15+growth*.22);ctx.fillStyle='#c8efa5';
        ctx.fillRect(cx-2,cy-6,4,14);ctx.fillRect(cx-8,cy-5,6,4);ctx.fillRect(cx+2,cy,6,4);
      }
    }
    const directions=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
    ctx.shadowColor='#8bcd65';ctx.shadowBlur=8;
    for(let i=0;i<8;i++)for(let shard=0;shard<2;shard++){
      const [dx,dy]=directions[i],life=((tickN+i*9+shard*48)%96)/96;
      const distance=18+Math.floor(life*((r-30)/6))*6,px=Math.round(x+dx*distance),py=Math.round(y+dy*distance);
      if(!affected(Math.floor((px+camX)/TILE_SIZE),Math.floor((py+camY)/TILE_SIZE)))continue;
      ctx.globalAlpha=fade*(1-life)*.75;
      drawEnergyPixelRay(ctx,px,py,dx,dy,shard?'#e4fac8':'#8bcd65',1.5);
    }
    ctx.restore();
  }


  // Meteorite warning: flash chamber on main canvas
  if (state.meteoriteWarning >= 0) {
    const pulse = Math.floor(tickN / 8) % 2 === 0;
    if (pulse) {
      const [r1, c1, r2, c2] = CHAMBER_BOUNDS[state.meteoriteWarning];
      ctx.fillStyle = 'rgba(255,60,0,0.12)';
      ctx.fillRect(c1 * TILE_SIZE - camX, r1 * TILE_SIZE - camY,
        (c2 - c1 + 1) * TILE_SIZE, (r2 - r1 + 1) * TILE_SIZE);
      // Chamber border flash
      ctx.strokeStyle = 'rgba(255,80,0,0.7)';
      ctx.lineWidth = 4;
      ctx.strokeRect(c1 * TILE_SIZE - camX + 1, r1 * TILE_SIZE - camY + 1,
        (c2 - c1 + 1) * TILE_SIZE - 2, (r2 - r1 + 1) * TILE_SIZE - 2);
    }
    // Warning text in chamber
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[state.meteoriteWarning];
    const cx2 = ((c1 + c2) / 2) * TILE_SIZE - camX + TILE_SIZE / 2;
    const cy2 = ((r1 + r2) / 2) * TILE_SIZE - camY + TILE_SIZE / 2;
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff6600';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const warning = Math.ceil(state.meteoriteStrikeIn / 60);
    ctx.fillText(`INCOMING! ${warning}s`, cx2, cy2);
    ctx.shadowBlur = 0;

    // GIGANTIC falling meteor — grows from tiny dot to nearly chamber-sized
    const strikeProg = 1 - state.meteoriteStrikeIn / METEORITE_WARNING;
    // meteor grows from 2 tiles to 11 tiles wide as it falls
    const metSz = Math.floor(TILE_SIZE * (2 + 9 * strikeProg));
    const startY = (r1 - 1) * TILE_SIZE - camY - metSz;
    const endY = cy2;
    const metY = Math.round(startY + (endY - startY) * strikeProg);
    const metX = Math.round(cx2);
    if (metY < endY) {
      drawMeteor(ctx,metX,metY,metSz,strikeProg,tickN);
    }
  }

  // Resource bodies stay sharp; only isolated glints glow.
  for(const resource of state.resources){
    if(moonHiddenInDark(state,resource.tileX,resource.tileY))continue;
    drawResourcePickup(ctx,(resource.tileX+.5)*TILE_SIZE-camX,(resource.tileY+.5)*TILE_SIZE-camY,resource.type==='health',tickN+resource.tileX);
  }

  // Placed bomb
  if (state.bomb) {
    const bsx = state.bomb.tileX * TILE_SIZE - camX;
    const bsy = state.bomb.tileY * TILE_SIZE - camY;
    // Highlight all the area that bomb can affect
    const radiusTiles = getBombRadius(state, state.bomb.powered);
    const inRange=(dx:number,dy:number)=>Math.hypot(dx,dy)<=radiusTiles;
    ctx.save();ctx.shadowBlur=0;
    ctx.fillStyle = (state.bomb.powered ? '#ffcc00' : '#ff6600') + '22';
    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        if (Math.hypot(dx, dy) <= radiusTiles) {
          const hx = bsx + dx * TILE_SIZE;
          const hy = bsy + dy * TILE_SIZE;
          ctx.fillRect(hx + 1, hy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }
    }
    ctx.globalAlpha=.6+.15*Math.abs(Math.sin(tickN*.06));
    ctx.fillStyle=state.bomb.powered?'#edc75b':'#ee925b';
    for(let dy=-radiusTiles;dy<=radiusTiles;dy++)for(let dx=-radiusTiles;dx<=radiusTiles;dx++){
      if(!inRange(dx,dy))continue;
      const px=Math.round(bsx+dx*TILE_SIZE),py=Math.round(bsy+dy*TILE_SIZE);
      if(!inRange(dx-1,dy))ctx.fillRect(px,py,4,TILE_SIZE);
      if(!inRange(dx+1,dy))ctx.fillRect(px+TILE_SIZE-4,py,4,TILE_SIZE);
      if(!inRange(dx,dy-1))ctx.fillRect(px,py,TILE_SIZE,4);
      if(!inRange(dx,dy+1))ctx.fillRect(px,py+TILE_SIZE-4,TILE_SIZE,4);
    }
    ctx.restore();

    drawBombDevice(ctx,bsx+TILE_SIZE/2,bsy+TILE_SIZE/2,state.bomb.powered,tickN);
  }

  // Ruby (placed)
  if (state.rubyTileX !== -1) {
    const rsx = state.rubyTileX * TILE_SIZE - camX + TILE_SIZE / 2;
    const rsy = state.rubyTileY * TILE_SIZE - camY + TILE_SIZE / 2;
    drawRubyGem(ctx, rsx, rsy, tickN);
    if(state.rubyPlacedFlashTicks>0){
      const progress=1-state.rubyPlacedFlashTicks/120,half=25+Math.floor(progress*5)*3;
      ctx.save();ctx.globalAlpha=(1-progress)*.8;ctx.strokeStyle='#ff88ad';ctx.lineWidth=3;
      ctx.shadowColor='#ff3366';ctx.shadowBlur=8;ctx.strokeRect(rsx-half,rsy-half,half*2,half*2);
      ctx.shadowBlur=0;ctx.fillStyle='#ffe4ed';
      for(const dx of [-1,1])for(const dy of [-1,1])ctx.fillRect(rsx+dx*half-3,rsy+dy*half-3,6,6);
      ctx.restore();
    }
    // Ruby HP bar
    const barW = TILE_SIZE - 2;
    const bx = rsx - barW / 2;
    const by = rsy - TILE_SIZE / 2 - 8;
    ctx.fillStyle = '#330011';
    ctx.fillRect(bx, by, barW, 4);
    const pct = state.rubyHP / RUBY_MAX_HP;
    ctx.fillStyle = pct > 0.5 ? '#ff1155' : pct > 0.25 ? '#ff6622' : '#ff3300';
    ctx.fillRect(bx, by, barW * pct, 4);
    if (state.rubyShieldHP > 0) {
      if(state.rubySaturnShield)drawSaturnShield(ctx,rsx,rsy,TILE_SIZE*.7,tickN);
      else drawRewardShield(ctx, rsx, rsy, TILE_SIZE * 0.7, tickN, '#00ddcc');
    }
    if(state.venusVeilTicks>0)drawVenusVeil(ctx,rsx,rsy,TILE_SIZE*.78,tickN,state.venusVeilTicks);
  }

  drawAstralTwinLinks(ctx, state, camX, camY, tickN);

  // Enemies
  const shieldedIds = new Set(
    state.enemies.filter(e => e.type === 'shielder' && e.shieldTargetId !== -1).map(e => e.shieldTargetId)
  );
  for (const e of state.enemies) {
    const sx = e.x - camX;
    const sy = e.y - camY;
    if (state.sun?.bossId === e.id && state.sun.quenchedTicks > 0) {
      drawQuenchedKing(ctx, e, sx, sy); continue;
    }
    // Gaia: she fades into the soil while withering between phases.
    if (state.gaia && e.id === state.gaia.bossId && state.gaia.wither > 0) ctx.globalAlpha = .25 + .2 * Math.abs(Math.sin(tickN * .1));
    if (moonHiddenInDark(state, e.tileX, e.tileY, e.id)) continue; // Moon phase 3: unseen in the dark unless just hit
    // Moon: she and her illusions share the Echo look; only she casts a reflection on the crystal floor.
    if (state.moon && moonWearsGuise(state, e)) {
      if (isMoonBoss(state, e)) drawMoonReflection(ctx, sx, sy, tickN);
      drawEnemy(ctx, { ...e, type: 'queen_echo' }, sx, sy, tickN, shieldedIds.has(e.id));
    } else drawEnemy(ctx, e, sx, sy, tickN, shieldedIds.has(e.id));
    ctx.globalAlpha = 1; // reset in case ghost modified it
  }
  drawMoonEffects(ctx, state, camX, camY, tickN);

  // Death particles — blocky debris burst on enemy kill
  for (const p of state.deathParticles) {
    const alpha = p.ticks / p.maxTicks;
    const px = p.x - camX, py = p.y - camY;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Ordinary attacks only: each boss has a dedicated beam, strike, wave or field.
  for(const enemy of state.enemies){
    if(enemy.shootTicks<=0||isBossType(enemy.type)||enemy.type==='queen_echo'||enemy.type==='moon_illusion')continue;
    const x=enemy.x-camX,y=enemy.y-camY;
    const targetX=enemy.targeting==='ruby'&&state.rubyTileX!==-1?(state.rubyTileX+.5)*TILE_SIZE-camX:(state.lunarDecoy?.x??state.playerX)-camX;
    const targetY=enemy.targeting==='ruby'&&state.rubyTileY!==-1?(state.rubyTileY+.5)*TILE_SIZE-camY:(state.lunarDecoy?.y??state.playerY)-camY;
    drawMobAttack(ctx,enemy.type,x,y,targetX,targetY,enemy.shootTicks,ENEMY_CONFIGS[enemy.type].color);
  }

  if(state.lunarDecoy){
    const decoy=state.lunarDecoy,x=decoy.x-camX,y=decoy.y-camY;
    ctx.save();ctx.globalAlpha=decoy.flashTicks>0?.95:decoy.invulnerableTicks>0?.5+.2*Math.abs(Math.sin(tickN*.7)):.8;
    drawPlayer(ctx,x,y,{...state,specialSkill:'splitter_queen',playerCastTicks:0,playerCastKind:null,runnerEnergyFlashTicks:0,starEnergy:0,poweredTicks:0,speedActiveTicks:0,playerCarryingRuby:false,playerShieldHP:0,laserCooldown:0,bulletCooldown:0,electricBuffTicks:0,thornPoisonTicks:0},tickN);
    ctx.restore();ctx.save();ctx.shadowBlur=0;ctx.fillStyle='#39214e';ctx.fillRect(x-23,y-35,46,4);ctx.fillStyle='#b278f3';ctx.fillRect(x-23,y-35,46*decoy.hitsLeft/decoy.maxHits,4);ctx.restore();
  }

  drawMirrorTwin(ctx, state, camX, camY, tickN);

  // Player
  const jiggle = state.healJiggleTicks > 0
    ? Math.sin(state.healJiggleTicks * 1.8) * 3
    : 0;
  const psx = state.playerX - camX + jiggle;
  const psy = state.playerY - camY;
  drawPlayer(ctx, psx, psy, state, tickN, chargingMs);
  drawRewardPulses(ctx, state, camX, camY);
  drawPrayerRitual(ctx, state, camX, camY, tickN);
  drawPrayerMagic(ctx, state, camX, camY, tickN);
  drawSeaSongEffects(ctx, state, camX, camY, tickN);
  drawEncounterEffects(ctx, state, camX, camY);
  drawVenusReflects(ctx, state, camX, camY);

  // Frozen by a Frost Warden ice tile — blocky ice-block overlay encasing the player
  if (state.playerFrozenTicks > 0) {
    const fSz = Math.floor(TILE_SIZE * 0.9);
    const fH = fSz / 2;
    const fPulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.2));
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = Math.floor(16 * fPulse);
    ctx.fillStyle = '#cceeff';
    ctx.fillRect(psx - fH, psy - fH, fSz, fSz);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(psx - fH, psy - fH, fSz, fSz);
    ctx.restore();
  }

  // Player bullets use the same crisp pixel vocabulary as celestial effects.
  for(const bullet of state.laserBullets || []){
    drawPlayerBullet(ctx,bullet.x*TILE_SIZE-camX,bullet.y*TILE_SIZE-camY,bullet.dx,bullet.dy,bullet.powered,bullet.ticks);
  }

  // Player electric buff chains have stable pixel steps and pale cores.
  for(const arc of state.lightningArcs){
    drawPlayerChain(ctx,arc.fromX-camX,arc.fromY-camY,arc.toX-camX,arc.toY-camY,arc.ticks);
  }

  // Storm Reaper melee: crisp stepped lightning cuts replace curved crescents.
  for(const slash of state.slashEffects){
    drawStormReaperStrike(ctx,slash.x-camX,slash.y-camY,slash.angle,slash.ticks/slash.maxTicks);
  }

  // Laser beams — player=cyan, powered=gold, sniper=red, boss=dark red
  for (const beam of state.laserBeams) {
    if(beam.color==='#ff3300'){
      drawEnemyLaser(ctx,beam.fromX-camX,beam.fromY-camY,beam.endX-camX,beam.endY-camY,Math.min(1,beam.ticks/22),['#ff3300','#ff7a40','#ffe0c8'],[16,6,2]);continue;
    }
    if(!beam.color){
      drawPlayerLaser(ctx,beam.fromX-camX,beam.fromY-camY,beam.endX-camX,beam.endY-camY,!!beam.powered,beam.ticks);
      continue;
    }
    if(beam.color==='#ffdd22'){
      drawEnemyLaser(ctx,beam.fromX-camX,beam.fromY-camY,beam.endX-camX,beam.endY-camY,Math.min(1,beam.ticks/18),['#ffcc22','#ffe680','#fffbe6'],[16,6,2]);continue;
    }
    const kind=beam.color==='#cc0022'?'king':beam.color==='#cc33ff'||beam.color==='#dd88ff'?'queen':beam.color==='#6b2fa8'?'devourer':beam.color==='#aaeeff'?'warden':null;
    if(kind){
      const duration=kind==='queen'?20:kind==='devourer'?20:kind==='warden'?30:22;
      drawBossBeam(ctx,kind,beam.fromX-camX,beam.fromY-camY,beam.endX-camX,beam.endY-camY,beam.ticks/duration,tickN);
    }else{
      drawEnemyLaser(ctx,beam.fromX-camX,beam.fromY-camY,beam.endX-camX,beam.endY-camY,Math.min(1,beam.ticks/22),[beam.color,beam.color,'#ffffff'],[12,5,2]);
    }
  }

  // Player charge waves keep square silhouettes and sharp layered bands.
  for(const wave of state.waveEffects){
    drawPlayerWave(ctx,wave.cx-camX,wave.cy-camY,wave.radius,!!wave.powered,wave.ticks);
  }

  // Crisp stepped blast and separated ember rays, with no blanket blur.
  for(const blast of state.bombBlasts){
    if(blast.water)drawWaterBurst(ctx,blast.cx-camX,blast.cy-camY,blast.maxRadius,blast.ticks);
    else drawBombBlast(ctx,blast.cx-camX,blast.cy-camY,blast.radius,blast.ticks);
  }

  for(const fx of state.specialEffects){
    const age=1-fx.ticks/(fx.kind==='splitter_queen'?54:fx.kind==='fiery_king'?48:36);
    const x=fx.kind==='blind_prayer'?state.playerX:fx.x,y=fx.kind==='blind_prayer'?state.playerY:fx.y;
    drawCelestialCast(ctx,fx.kind,x-camX,y-camY,age,tickN);
    if((fx.kind==='frost_warden'||fx.kind==='aegis_sentinel') && state.rubyTileX!==-1)drawCelestialCast(ctx,fx.kind,(state.rubyTileX+.5)*TILE_SIZE-camX,(state.rubyTileY+.5)*TILE_SIZE-camY,age,tickN);
  }

  drawSunEffects(ctx, state, camX, camY);
  drawGaiaOverlay(ctx, state, camX, camY, tickN);
  drawMeteorImpact(ctx, state, camX, camY);
  drawSkyLaserImpact(ctx, state, camX, camY);

  ctx.restore(); // back to true physical-pixel space — unaffected by the world zoom above
  drawKingArenaEffects(ctx, state, canvasW, canvasH);
  for(const fx of state.specialEffects)if(fx.kind==='blind_prayer'&&fx.ticks>15){
    const remaining=(fx.ticks-15)/21;
    ctx.save();ctx.globalAlpha=.42*remaining*remaining;ctx.fillStyle='#ffe45c';ctx.fillRect(0,0,canvasW,canvasH);ctx.restore();
  }
  for(const fx of state.specialEffects)if(fx.kind==='fiery_king'){
    ctx.save();const alpha=fx.ticks/48;ctx.fillStyle='rgba(255,72,72,'+alpha*.09+')';ctx.fillRect(0,0,canvasW,canvasH);
    ctx.shadowColor='#ff6666';ctx.shadowBlur=8;
    for(let i=0;i<24;i++){
      const x=(i*137%997)/997*canvasW,y=(i*239%991)/991*canvasH;
      ctx.globalAlpha=alpha*.65;ctx.fillStyle=i%3?'#ff8c85':'#ffe5df';ctx.fillRect(x-4,y-1,9,2);ctx.fillRect(x-1,y-4,2,9);
    }
    ctx.restore();
  }

  drawSunAtmosphere(ctx, state, canvasW, canvasH, state.gameTick);
  drawEclipseShadow(ctx, state, canvasW, canvasH);
  drawSupernovaSky(ctx, state, canvasW, canvasH);
  if(state.ambientEvents.active?.kind==='blackhole'){
    const origin=state.ambientEvents.active.points[0];
    drawBlackholeSky(ctx,state,canvasW,canvasH,((origin.x+.5)*TILE_SIZE-camX)*worldZoom,((origin.y+.5)*TILE_SIZE-camY)*worldZoom);
  }

  // Minimap — drawn in true pixel space, with its own independent (smaller) mobile sizing
  drawMinimap(ctx, state, canvasW, tickN, isMobileTouch);
}

// ─── Mobile ability button ────────────────────────────────────────────────────

// Challenge HUD centre: the guardian's name and one HP bar for the whole encounter (both Twins, every Devourer body).
function GuardianBar({ state }: { state: GameState }) {
  const boss = state.trial!.boss, color = ENEMY_CONFIGS[boss].color;
  const bodies = state.enemies.filter(e => e.type === boss && e.hp > 0);
  const hp = bodies.reduce((sum, e) => sum + ((e.twin?.downedTicks ?? 0) > 0 ? 0 : e.hp), 0);
  const max = bodies.reduce((sum, e) => sum + e.maxHp, 0);
  const present = bodies.length > 0, pct = present && max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
  const sun = state.sun;
  if (sun) return <div className="rs-guardian rs-sun-guardian" style={{ ['--guardian' as string]: '#ff9560' }}>
    <div className="rs-sun-health" role="meter" aria-label="Fiery King health" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
      <span className="rs-guardian-name">{present ? `FIERY KING · PHASE ${sun.phase}` : 'GUARDIAN INCOMING'}</span>
      <span className="rs-guardian-segments">{[3, 2, 1].map(phase => <span key={phase} className="rs-guardian-bar" data-active={phase === sun.phase || undefined}>
        <span className="rs-guardian-fill" style={{ width: `${present ? Math.max(0, Math.min(1, (hp - (3 - phase) * SUN.phaseHP) / SUN.phaseHP)) * 100 : 0}%`, opacity: phase === sun.phase ? 1 : .55 }} />
      </span>)}</span>
      {sun.quenchedTicks > 0 && <span className="rs-sun-extinguished">EXTINGUISHED · C ×{sun.empoweredCasts}</span>}
    </div>
    <div className="rs-rage" role="meter" aria-label="Fiery King rage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(sun.rage)} title={`Rage: ${Math.round(sun.rage)}%`}
      style={{color:sun.rage>=75?'#ff6a5d':'#ffb263'}}>
      <span className="rs-rage-track"><span className="rs-rage-fill" style={{height:`${Math.max(0,Math.min(100,sun.rage))}%`}} /></span>
      <span className="rs-rage-value">{Math.round(sun.rage)}%</span>
    </div>
  </div>;
  const neptune = state.neptune;
  if (neptune) {
    // Three phase segments, phase 3 on the left and phase 1 on the right; dive points marked inside the active one.
    const segments = [3, 2, 1].map(phase => {
      const floor = neptunePhaseFloorHP(phase as 1 | 2 | 3), fill = present ? Math.max(0, Math.min(1, (hp - floor) / NEPTUNE_PHASE_HPS[phase as 1 | 2 | 3])) : 0;
      return { phase, fill: phase < neptune.phase ? 0 : phase > neptune.phase ? (present ? 1 : 0) : fill };
    });
    return <div className="rs-guardian" role="meter" aria-label={`${BOSS_NAMES[boss]} health`} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)} style={{ ['--guardian' as string]: color }}>
      <span className="rs-guardian-name">{present ? `${BOSS_NAMES[boss]} · PHASE ${neptune.phase}${neptune.dive ? ` · DIVING · CLONES ${state.enemies.filter(c => neptune.dive!.cloneIds.includes(c.id) && c.hp > 0).length}/${neptune.dive.cloneIds.length + neptune.dive.dropsLeft}` : ''}` : 'GUARDIAN INCOMING'}</span>
      <span className="rs-guardian-segments">
        {segments.map(seg => <span key={seg.phase} className="rs-guardian-bar" data-active={seg.phase === neptune.phase || undefined}>
          <span className="rs-guardian-fill" style={{ width: `${seg.fill * 100}%`, opacity: seg.phase === neptune.phase ? 1 : .55 }} />
          {seg.phase === neptune.phase && NEPTUNE_DIVE_POINTS[neptune.phase].filter(point => point > 0).map(point =>
            <span key={point} className="rs-guardian-mark" style={{ left: `${point * 100}%` }} />)}
        </span>)}
      </span>
    </div>;
  }
  const gaia = state.gaia;
  if (gaia) {
    // Three phase segments like Neptune's; the name line shows what she is doing.
    const segments = [3, 2, 1].map(phase => {
      const floor = (3 - phase) * GAIA_PHASE_HP, fill = present ? Math.max(0, Math.min(1, (hp - floor) / GAIA_PHASE_HP)) : 0;
      return { phase, fill: phase < gaia.phase ? 0 : phase > gaia.phase ? (present ? 1 : 0) : fill };
    });
    const status = gaia.wither > 0 ? ' · WITHERING' : '';
    return <div className="rs-guardian" role="meter" aria-label={`${BOSS_NAMES[boss]} health`} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)} style={{ ['--guardian' as string]: color }}>
      <span className="rs-guardian-name">{present ? `${BOSS_NAMES[boss]} · PHASE ${gaia.phase}${status}` : 'GUARDIAN INCOMING'}</span>
      <span className="rs-guardian-segments">
        {segments.map(seg => <span key={seg.phase} className="rs-guardian-bar" data-active={seg.phase === gaia.phase || undefined}>
          <span className="rs-guardian-fill" style={{ width: `${seg.fill * 100}%`, opacity: seg.phase === gaia.phase ? 1 : .55 }} />
        </span>)}
      </span>
    </div>;
  }
  const moon = state.moon;
  if (moon) {
    // Three phase segments like Gaia's, showing her HP as of her last reveal or jump (not live while she is disguised).
    const shown = moon.shownHp;
    const segments = [3, 2, 1].map(phase => {
      const floor = (3 - phase) * MOON_PHASE_HP, fill = present ? Math.max(0, Math.min(1, (shown - floor) / MOON_PHASE_HP)) : 0;
      return { phase, fill: phase < moon.phase ? 0 : phase > moon.phase ? (present ? 1 : 0) : fill };
    });
    return <div className="rs-guardian" role="meter" aria-label={`${BOSS_NAMES[boss]} health`} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={present && max > 0 ? Math.round(shown / max * 100) : 0} style={{ ['--guardian' as string]: color }}>
      <span className="rs-guardian-name">{present ? `${BOSS_NAMES[boss]} · PHASE ${moon.phase}` : 'GUARDIAN INCOMING'}</span>
      <span className="rs-guardian-segments">
        {segments.map(seg => <span key={seg.phase} className="rs-guardian-bar" data-active={seg.phase === moon.phase || undefined}>
          <span className="rs-guardian-fill" style={{ width: `${seg.fill * 100}%`, opacity: seg.phase === moon.phase ? 1 : .55 }} />
        </span>)}
      </span>
    </div>;
  }
  const extra = boss === 'devourer' && bodies.length > 1 ? ` ×${bodies.length}` : '';
  return <div className="rs-guardian" role="meter" aria-label={`${BOSS_NAMES[boss]} health`} aria-valuemin={0} aria-valuemax={100}
    aria-valuenow={Math.round(pct * 100)} style={{ ['--guardian' as string]: color }}>
    <span className="rs-guardian-name">{present ? BOSS_NAMES[boss] + extra : 'GUARDIAN INCOMING'}</span>
    <span className="rs-guardian-bar"><span className="rs-guardian-fill" style={{ width: `${pct * 100}%` }} /></span>
  </div>;
}

// Tutorial prompt: current step, its instruction, a goal counter and a cue when each step is done.
function TutorialPanel({ tutorial }: { tutorial: NonNullable<GameState['tutorial']> }) {
  const router = useRouter();
  const step = TUTORIAL_STEPS[tutorial.step], done = step.id === 'done', cleared = tutorial.pauseTicks > 0;
  const lastCue = useRef('');
  useEffect(() => {
    const cue = cleared ? 'clear-' + tutorial.step : done ? 'done' : '';
    if (cue && cue !== lastCue.current) playUiSfx(done ? 'ascension' : 'confirm');
    lastCue.current = cue;
  }, [cleared, done, tutorial.step]);
  return (
    <div role="status" aria-label="Tutorial" style={{ position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 85,
      width: 'min(560px, calc(100% - 24px))', boxSizing: 'border-box', padding: '12px 18px', textAlign: 'center',
      background: 'rgba(10,12,24,.93)', border: `2px solid ${cleared || done ? '#9dd959' : '#ff6f9f'}`, boxShadow: '0 0 20px rgba(255,79,139,.25)',
      pointerEvents: done ? 'auto' : 'none' }}>
      <div style={{ color: '#8d93b3', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.2em' }}>
        FIRST ORBIT · {done ? 'TUTORIAL COMPLETE' : `STEP ${tutorial.step + 1}/${TUTORIAL_STEPS.length - 1}`}
      </div>
      <div style={{ marginTop: 4, color: cleared || done ? '#c6ff8a' : '#ff8fb3', fontFamily: 'var(--font-pixel)', fontSize: 15, lineHeight: 1.7 }}>
        {cleared ? '✓ NICE!' : step.title}
      </div>
      <div style={{ color: '#e1e4f4', fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1.5 }}>
        {tutorial.retry && step.id === 'meteor' ? 'Too close! The meteor hit you. Try again: leave the room this time.' : step.text}
      </div>
      {!done && step.goal > 1 && <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        {Array.from({ length: step.goal }, (_, i) => <span key={i} style={{ width: 10, height: 10, background: i < tutorial.count ? '#c6ff8a' : 'transparent', border: '2px solid #5f6a8f' }} />)}
      </div>}
      {done && <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14 }}>
        <button type="button" className="rs-tut-btn rs-tut-btn-main" onMouseEnter={() => playUiSfx('hover')}
          onClick={() => { playUiSfx('endless'); router.push('/ruby-star/endless'); }}>PLAY ENDLESS SPACE ▶</button>
        <button type="button" className="rs-tut-btn" onMouseEnter={() => playUiSfx('hover')}
          onClick={() => { playUiSfx('back'); router.push('/ruby-star'); }}>LOBBY</button>
      </div>}
      <style>{`
        .rs-tut-btn { padding: 10px 16px; font-family: var(--font-pixel); font-size: 11px; letter-spacing: .06em; cursor: pointer;
          color: #c6ff8a; background: transparent; border: 2px solid #5f7a45; transition: border-color 120ms, box-shadow 120ms, background 120ms; }
        .rs-tut-btn-main { color: #0b1208; background: #9dd959; border-color: #c6ff8a; box-shadow: 0 0 12px #9dd95966; }
        .rs-tut-btn:hover, .rs-tut-btn:focus-visible { outline: none; border-color: #c6ff8a; box-shadow: 0 0 16px #9dd95988; }
        .rs-tut-btn:not(.rs-tut-btn-main):hover, .rs-tut-btn:not(.rs-tut-btn-main):focus-visible { background: #1a2a12; }
        .rs-tut-btn-main:hover, .rs-tut-btn-main:focus-visible { background: #b4ec6f; }
      `}</style>
    </div>
  );
}

// The teleport menu is the minimap, enlarged; each chamber on it is the destination button.
function TeleportMinimap({ state, onPick, available: availableRooms }: { state: GameState; onPick: (chamber: number) => void; available?: number[] }) {
  const ref=useRef<HTMLCanvasElement>(null);
  const w=MAP_COLS*4+16,h=MAP_ROWS*4+16,scale=1.5;
  useEffect(()=>{
    let frame=0,tick=0;
    const draw=()=>{
      const ctx=ref.current?.getContext('2d');
      if(ctx){ctx.clearRect(0,0,w,h);drawMinimap(ctx,state,w,tick++);}
      frame=requestAnimationFrame(draw);
    };
    draw();
    return ()=>cancelAnimationFrame(frame);
  },[state,w,h]);
  // drawMinimap places the map 8px from the canvas's top-right corner at 4px per tile.
  const mapX=w-MAP_COLS*4-8,mapY=8;
  return (
    <div className="rs-teleport-grid" style={{ position: 'relative', width: w*scale, height: h*scale }}>
      <canvas ref={ref} width={w} height={h} aria-label="Map" style={{ width: w*scale, height: h*scale, imageRendering: 'pixelated', display: 'block' }} />
      {[0, 1, 2, 3].map(ch => {
        const [r1, c1, r2, c2] = CHAMBER_BOUNDS[ch];
        const available = (availableRooms ?? state.teleportDestOptions).includes(ch), color = (state.sun ? SUN_CHAMBER_COLORS : state.neptune ? OCEAN_CHAMBER_COLORS : state.gaia ? GAIA_CHAMBER_COLORS : isMoonMap(state) ? MOON_CHAMBER_COLORS : CHAMBER_COLORS)[ch];
        return (
          <button key={ch} className="rs-teleport-room" disabled={!available} aria-label={`[${ch + 1}] ${CHAMBER_LABELS[ch]}`}
            title={available ? `Teleport to ${CHAMBER_LABELS[ch]} (${ch + 1})` : undefined}
            style={{ left: (mapX + c1 * 4) * scale, top: (mapY + r1 * 4) * scale, width: (c2 - c1 + 1) * 4 * scale, height: (r2 - r1 + 1) * 4 * scale,
              ['--room' as string]: color }}
            onMouseEnter={() => { if (available) playUiSfx('hover'); }} onClick={() => { if (available) onPick(ch); }} />
        );
      })}
    </div>
  );
}

function BossSpawnButton({ type, onSpawn }: { type: BossType; onSpawn: () => void }) {
  const iconRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const ctx=iconRef.current?.getContext('2d');if(!ctx)return;
    const cfg=ENEMY_CONFIGS[type];
    const enemy: GameState['enemies'][number]={
      id:0,type,x:0,y:0,tileX:0,tileY:0,targetTileX:0,targetTileY:0,stepProgress:0,hp:cfg.maxHp,maxHp:cfg.maxHp,
      path:[],pathTimer:0,attackTimer:200,targeting:'player',pushDirX:0,pushDirY:0,pushTiles:0,
      flashTicks:0,healFlashTicks:0,shootTicks:0,exploding:false,explodeTick:0,windupTicks:0,
      chargeDirX:0,chargeDirY:0,shieldTargetId:-1,phaseTimer:10000,icyShieldHP:0,
    };
    ctx.clearRect(0,0,72,72);ctx.save();ctx.scale(72/44,72/44);ctx.imageSmoothingEnabled=false;
    if(type==='aegis_sentinel'){
      enemy.aegis={shielded:true,exposedUntilTick:0,constructsLeft:2,openAmount:0};
      ctx.save();ctx.translate(22,22);ctx.scale(.48,.48);drawEncounterEnemy(ctx,enemy,0,0,40,false);ctx.restore();
    }else if(type==='astral_twins'){
      for(const index of [1,0]){
        enemy.twin={pairId:0,index,downedTicks:0,partnerDownTicks:0,transferTicks:0};
        ctx.save();ctx.translate(index?31:12,index?15:30);ctx.scale(.42,.42);drawEncounterEnemy(ctx,enemy,0,0,40,false);ctx.restore();
      }
    }else{
      ctx.save();ctx.translate(22,25);const scale=type==='splitter_queen'?.54:.37;ctx.scale(scale,scale);drawEnemy(ctx,enemy,0,0,40);ctx.restore();
    }
    ctx.restore();
  },[type,drawEncounterEnemy]);
  return <button title={'Spawn '+BOSS_NAMES[type]} aria-label={'Spawn '+BOSS_NAMES[type]} onClick={onSpawn}
    style={{ width:40,height:40,padding:1,background:'#242830',border:'1px solid '+ENEMY_CONFIGS[type].color,borderRadius:3,cursor:'pointer',display:'grid',placeItems:'center' }}>
    <canvas ref={iconRef} width={72} height={72} aria-hidden="true" style={{width:36,height:36}} />
  </button>;
}

// Ascension's opening choice: every celestial skill as a card with the suit it gives, its source boss and a short effect.
function StartingSkillCard({ type, state, onChoose }: { type: BossType; state: GameState; onChoose: () => void }) {
  const iconRef = useRef<HTMLCanvasElement>(null);
  const kind = BOSS_SKILL_REWARDS[type], skill = SPECIAL_SKILLS[kind], color = kind === 'devourer' ? '#bcbccd' : skill.color;
  useEffect(() => {
    const ctx = iconRef.current?.getContext('2d'); if (!ctx) return;
    const preview: GameState = { ...state, specialSkill: kind, playerCarryingRuby: false, starEnergy: 0, poweredTicks: 0, playerShieldHP: 0,
      playerSaturnShield: false, playerCastTicks: 0, playerCastKind: null, speedActiveTicks: 0, runnerEnergyFlashTicks: 0, electricBuffTicks: 0,
      playerFrozenTicks: 0, thornPoisonTicks: 0, laserCooldown: 0, bulletCooldown: 0 };
    ctx.clearRect(0, 0, 72, 72); ctx.save(); ctx.translate(36, 40); drawPlayer(ctx, 0, 0, preview, 40); ctx.restore();
  }, [kind, state]);
  return <button type="button" className="rs-skill-card" style={{ ['--skill' as string]: color }} aria-label={'Choose ' + skill.name}
    onMouseEnter={() => playUiSfx('hover')} onClick={onChoose}>
    <canvas ref={iconRef} width={72} height={72} aria-hidden="true" />
    <span className="rs-skill-name">{skill.name}</span>
    <span className="rs-skill-from">from {BOSS_NAMES[type]}</span>
    <span className="rs-skill-text">{BOSS_GUIDE[type].skill}</span>
  </button>;
}

function StartingSkillChoice({ state, onChoose }: { state: GameState; onChoose: (kind: SpecialSkill) => void }) {
  return <div role="dialog" aria-label="Choose a celestial skill" style={{ position: 'absolute', inset: 0, zIndex: 120, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 18, padding: 16, background: 'rgba(4,4,12,.86)' }}>
    <style>{`
      .rs-skill-grid { display: grid; grid-template-columns: repeat(5, 170px); gap: 12px; }
      .rs-skill-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 10px; min-height: 196px; box-sizing: border-box;
        background: #10131ff2; color: inherit; font: inherit; text-align: center; cursor: pointer; border: 2px solid var(--skill);
        box-shadow: 0 0 10px color-mix(in srgb, var(--skill) 30%, transparent); transition: transform 120ms, box-shadow 120ms; }
      .rs-skill-card:hover, .rs-skill-card:focus-visible { outline: none; transform: translateY(-3px); box-shadow: 0 0 20px color-mix(in srgb, var(--skill) 65%, transparent); }
      .rs-skill-name { font-family: var(--font-pixel); font-size: 11px; line-height: 1.5; color: var(--skill); }
      .rs-skill-from { font-family: var(--font-mono); font-size: 11px; color: #8d93b3; }
      .rs-skill-text { font-family: var(--font-mono); font-size: 12px; line-height: 1.4; color: #c9cde2; }
    `}</style>
    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.1rem', color: '#d7a5ff', textShadow: '0 0 16px #a56bff', letterSpacing: '.08em' }}>CHOOSE A CELESTIAL SKILL</div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#b9bdd6' }}>Ascension starts you with one. Press F to cast it; defeated bosses grant new ones.</div>
    <div className="rs-skill-grid">
      {BOSS_TYPES.map(type => <StartingSkillCard key={type} type={type} state={state} onChoose={() => onChoose(BOSS_SKILL_REWARDS[type])} />)}
    </div>
  </div>;
}

function CelestialSkillButton({ kind, state, selected, onGrant }: {
  kind: keyof typeof SPECIAL_SKILLS; state: GameState; selected: boolean; onGrant: () => void;
}) {
  const iconRef=useRef<HTMLCanvasElement>(null);
  const skill=SPECIAL_SKILLS[kind],color=kind==='devourer'?'#bcbccd':skill.color;
  useEffect(()=>{
    const ctx=iconRef.current?.getContext('2d');if(!ctx)return;
    const preview: GameState={...state,specialSkill:kind,playerCarryingRuby:false,starEnergy:0,poweredTicks:0,playerShieldHP:0,
      playerSaturnShield:false,playerCastTicks:0,playerCastKind:null,speedActiveTicks:0,runnerEnergyFlashTicks:0,electricBuffTicks:0,
      playerFrozenTicks:0,thornPoisonTicks:0,laserCooldown:0,bulletCooldown:0};
    ctx.clearRect(0,0,36,36);ctx.save();ctx.translate(18,21);ctx.scale(.5,.5);drawPlayer(ctx,0,0,preview,40);ctx.restore();
  },[kind,state]);
  return <button type="button" title={'Grant '+skill.name} aria-label={'Grant '+skill.name} aria-pressed={selected} onClick={onGrant}
    style={{width:40,height:40,padding:1,background:selected?'#394363':'#242830',border:(selected?'2px':'1px')+' solid '+color,
      boxShadow:selected?'0 0 8px '+color+'66':'none',borderRadius:3,cursor:'pointer',display:'grid',placeItems:'center'}}>
    <canvas ref={iconRef} width={36} height={36} aria-hidden="true" style={{width:36,height:36}} />
  </button>;
}

function TouchAbilityButton({ label, color, size = 56, onDown, onUp, className, style }: {
  label: React.ReactNode; color: string; size?: number; onDown: () => void; onUp?: () => void;
  className?: string; style?: React.CSSProperties;
}) {
  return (
    <button
      className={className}
      onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: size, height: size, borderRadius: '3px', flexShrink: 0,
        border: `2px solid ${color}`, background: '#172b42',
        color, fontFamily: 'var(--font-pixel)', fontWeight: 700, fontSize: size < 44 ? '0.48rem' : '0.72rem',
        boxShadow: `0 0 12px ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none', padding: 0, lineHeight: 1.1, textAlign: 'center',
        ...style,
      }}
    >
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RubyStarGame({ mode, trialId }: { mode: RubyStarMode; trialId?: TrialBody }) {
  const trialInfo = trialId ? findTrial(trialId) : undefined;
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const tickRef = useRef(0);
  const rafRef = useRef(0);
  const bgmRef = useRef<BGMControllerHandle>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const musicEnabledRef = useRef(true);
  const startMusic = () => { if (musicEnabledRef.current) bgmRef.current?.playMusic(); };
  const toggleMusic = () => {
    const enabled = !musicEnabledRef.current; musicEnabledRef.current = enabled; setMusicEnabled(enabled);
    try { localStorage.setItem('rubyStar.music', enabled ? 'on' : 'off'); } catch {}
    if (enabled) bgmRef.current?.playMusic(); else bgmRef.current?.pauseMusic();
  };
  // Music starts on entry; if the browser blocks autoplay, the first key or click starts it.
  useEffect(() => {
    try { musicEnabledRef.current = localStorage.getItem('rubyStar.music') !== 'off'; } catch {}
    setMusicEnabled(musicEnabledRef.current);
    const start = () => { if (musicEnabledRef.current) bgmRef.current?.playMusic(); };
    const timer = setTimeout(start, 0);
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => { clearTimeout(timer); window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start); };
  }, []);
  const sunMap = trialInfo?.boss === 'fiery_king';
  const neptuneMap = trialInfo?.boss === 'sea_chanter', gaiaMap = trialInfo?.boss === 'thorn_weaver', moonMap = trialInfo?.boss === 'splitter_queen';
  const [showRules, setShowRules] = useState(sunMap || neptuneMap || gaiaMap || moonMap); // play starts at once (Neptune opens its own sheet first); RULES opens the sheet
  const [, forceRender] = useState(0);
  const [isGodQuery, setIsGodQuery] = useState(false);
  // Ref (not state) — read imperatively inside the rAF draw loop, whose effect doesn't
  // re-run on state changes, so a plain useState here would risk a stale closure.
  const isMobileTouchRef = useRef(false);
  const teleportOpenedAtRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownTimeRef = useRef<number>(0);
  const rightMouseHeldRef = useRef<boolean>(false);
  const pointerLaserHeldRef = useRef(false);
  const keyboardLaserHeldRef = useRef(false);
  const keyboardBulletHeldRef = useRef(false);

  // ── Mobile virtual joystick ──────────────────────────────────────────────
  const [joyThumb, setJoyThumb] = useState({ x: 0, y: 0 });
  const joyPointerIdRef = useRef<number | null>(null);
  const JOY_RADIUS = 64;
  const JOY_DEADZONE = 12;

  const updateJoyFromPointer = useCallback((clientX: number, clientY: number, baseEl: HTMLElement) => {
    const rect = baseEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOY_RADIUS) { dx = (dx / dist) * JOY_RADIUS; dy = (dy / dist) * JOY_RADIUS; }
    setJoyThumb({ x: dx, y: dy });

    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    if (dist < JOY_DEADZONE) {
      state.playerQueuedDirX = 0; state.playerQueuedDirY = 0;
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      state.playerQueuedDirX = dx > 0 ? 1 : -1;
      state.playerQueuedDirY = 0;
    } else {
      state.playerQueuedDirX = 0;
      state.playerQueuedDirY = dy > 0 ? 1 : -1;
    }
  }, []);

  const handleJoyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    joyPointerIdRef.current = e.pointerId;
    updateJoyFromPointer(e.clientX, e.clientY, e.currentTarget);
  };
  const handleJoyPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    updateJoyFromPointer(e.clientX, e.clientY, e.currentTarget);
  };
  const handleJoyPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    joyPointerIdRef.current = null;
    setJoyThumb({ x: 0, y: 0 });
    const state = stateRef.current;
    if (state) { state.playerQueuedDirX = 0; state.playerQueuedDirY = 0; }
  };

  // ── Mobile ability buttons — reuse the exact same engine calls as mouse/keyboard ──
  const handleTouchLaserDown = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    pointerLaserHeldRef.current = true;
    if (!mouseDownTimeRef.current) mouseDownTimeRef.current = Date.now();
    useLaser(state);
    rerender();
  };
  const handleTouchLaserUp = () => { pointerLaserHeldRef.current = false; if (!keyboardLaserHeldRef.current) { mouseDownTimeRef.current = 0; stopChargeSound(); } };
  const handleTouchBullet = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    useBullet(state); rerender();
  };
  const handleTouchSpeed = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    useSpeedBoost(state); rerender();
  };
  const handleTouchBomb = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    useBomb(state); rerender();
  };
  // RUBY and HEAL are separate single-tap buttons — no hold-duration timing involved.
  const handleTouchRuby = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    toggleCarryRuby(state); rerender();
  };
  // Healing and teleporting have separate controls, including on a pad.
  const handleTouchHeal = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    healRuby(state);
    rerender();
  };
  const handleTouchTeleport = () => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    // Stamp the opening time immediately, before the tap's trailing click can reach the new backdrop.
    if (tryActivateTeleport(state)) { teleportOpenedAtRef.current = Date.now(); playUiSfx('teleport'); }
    rerender();
  };

  const rerender = useCallback(() => forceRender(n => n + 1), []);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    stateRef.current = createModeState(mode, trialInfo?.boss);
    if (typeof window !== 'undefined') {
      setIsGodQuery(new URLSearchParams(window.location.search).get('god') === '1');
      // Require all three signals — some desktop setups (touchscreen laptops/monitors)
      // misreport hover/pointer and still have maxTouchPoints > 0, so also require a
      // phone/tablet-sized viewport (a real desktop display is essentially never this narrow,
      // even resized, since resizing a window doesn't add touch hardware or change these
      // media features on its own).
      isMobileTouchRef.current =
        window.matchMedia('(hover: none) and (pointer: coarse)').matches &&
        navigator.maxTouchPoints > 0 &&
        window.innerWidth <= 1024;
    }
    if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
      (screen.orientation as any).lock('landscape').catch(() => { });
    }
  }, []);

  useEffect(() => {
    const cancelCharge = () => { if (stateRef.current?.sun) stateRef.current.sun.charging = false; mouseDownTimeRef.current = 0; rightMouseHeldRef.current = pointerLaserHeldRef.current = keyboardLaserHeldRef.current = keyboardBulletHeldRef.current = false; stopChargeSound(); };
    const onVisibility = () => { if (document.hidden) { cancelCharge(); stopPoisonSound(); stopSingularitySound(); stopGaiaFieldSound(); pauseAmbientEventSounds(); } };
    window.addEventListener('blur', cancelCharge);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', cancelCharge);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelCharge();
      stopAmbientEventSounds();
    };
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (showRules) { if (stateRef.current?.sun) stateRef.current.sun.charging = false; mouseDownTimeRef.current = 0; rightMouseHeldRef.current = pointerLaserHeldRef.current = keyboardLaserHeldRef.current = keyboardBulletHeldRef.current = false; stopChargeSound(); stopPoisonSound(); stopSingularitySound(); stopGaiaFieldSound(); pauseAmbientEventSounds(); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const TARGET_MS = 1000 / 60;
    let lastTime = 0;
    let accumulator = 0;

    // Runs exactly one 60Hz game tick's worth of logic — pulled out of loop() so it can be
    // invoked 0, 1, or several times per rendered frame depending on real elapsed time,
    // instead of being tied to however often requestAnimationFrame happens to fire.
    function runOneTick(state: GameState) {
      tickRef.current++;
      if (state.gamePhase !== 'playing') {
        if (state.sun) state.sun.charging = false;
        mouseDownTimeRef.current = 0; rightMouseHeldRef.current = pointerLaserHeldRef.current = keyboardLaserHeldRef.current = keyboardBulletHeldRef.current = false;
      }
      // A held click must charge afresh after cooldown; waiting out cooldown is not charging.
      if(mouseDownTimeRef.current>0&&(state.waveCooldown>0||state.gamePhase!=='playing'))mouseDownTimeRef.current=Date.now();
      const chargingMsNow = mouseDownTimeRef.current > 0 ? Date.now() - mouseDownTimeRef.current : 0;
      // Full charge takes longer while chilled by a Frost Warden sharing the player's chamber
      const waveChargeMsNow = isPlayerChilled(state) ? 1500 : 1000;
      // Auto-fire wave once the hold reaches full charge (only if wave not on cooldown)
      if (chargingMsNow >= waveChargeMsNow && state.gamePhase === 'playing' && state.waveCooldown <= 0) {
        activateWave(state);
        mouseDownTimeRef.current = Date.now();
      }
      // One slowed play fills the remaining charge window, without looping its intro.
      if (chargingMsNow >= 200 && state.waveCooldown <= 0 && state.gamePhase === 'playing') {
        startChargeSound((waveChargeMsNow - 200) / 1000);
      } else stopChargeSound();
      // Lock movement while ACTIVELY charging (not during cooldown)
      if (chargingMsNow >= 200 && state.waveCooldown <= 0) {
        state.playerQueuedDirX = 0;
        state.playerQueuedDirY = 0;
      }
      // Auto-fire bullet while right mouse button is held — fires at exactly the same rate
      // as spam-clicking, since useBullet is already self-gated by the raw bulletCooldown.
      if ((rightMouseHeldRef.current || keyboardBulletHeldRef.current) && state.gamePhase === 'playing' && state.bulletCooldown <= 0) {
        useBullet(state);
      }
      if (state.gamePhase !== 'lost') tick(state);
      if (state.gamePhase !== 'playing') stopChargeSound();
    }

    function loop(ts: number) {
      rafRef.current = requestAnimationFrame(loop);
      const state = stateRef.current;
      if (!state) return;

      if (lastTime === 0) lastTime = ts;
      let delta = ts - lastTime;
      lastTime = ts;
      // Cap a single frame's catch-up so a backgrounded tab / debugger pause doesn't dump
      // a huge burst of ticks the instant the tab regains focus.
      if (delta > TARGET_MS * 5) delta = TARGET_MS * 5;
      accumulator += delta;

      // Fixed-timestep: run exactly as many 60Hz ticks as real time has actually elapsed,
      // regardless of the display's refresh rate — the previous "skip if too soon" heuristic
      // (ts - lastTime < TARGET_MS * 0.8) wasn't a clean divisor of every refresh rate (144Hz
      // in particular), so ticks — and everything timed in ticks: boss spawns, cooldowns,
      // ice-tile freezes, all of it — ran up to ~20% faster than intended on those displays.
      while (accumulator >= TARGET_MS) {
        accumulator -= TARGET_MS;
        runOneTick(state);
      }

      const t = tickRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      if (W === 0 || H === 0) return;
      ctx.imageSmoothingEnabled = false;
      const chargingMs = mouseDownTimeRef.current > 0 ? Date.now() - mouseDownTimeRef.current : 0;
      drawGame(ctx, state, W, H, t, chargingMs, isMobileTouchRef.current);
      if (t % 6 === 0) rerender();
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); stopChargeSound(); stopPoisonSound(); stopSingularitySound(); stopGaiaFieldSound(); pauseAmbientEventSounds(); };
  }, [showRules, rerender]);

  // ── Canvas resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement!;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Keyboard input ────────────────────────────────────────────────────────
  useEffect(() => {
    if (showRules) return;
    const onKey = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state || state.gamePhase === 'lost') return;

      if (state.gamePhase === 'constellation') return;

      // Sky laser target menu (Neptune challenge)
      if (state.gamePhase === 'laserTarget') {
        e.preventDefault();
        if (e.repeat) return;
        if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') { cancelSkyLaser(state); playUiSfx('close'); rerender(); return; }
        const room = ({ '1': 0, '2': 1, '3': 2, '4': 3 } as Record<string, number>)[e.key];
        if (room !== undefined && chooseSkyLaser(state, room)) { playUiSfx('ascension'); rerender(); }
        return;
      }

      // Teleport menu
      if (state.gamePhase === 'teleporting') {
        if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          if(!e.repeat){cancelTeleport(state);playUiSfx('close');rerender();}
          return;
        }
        if(e.code==='Space'){e.preventDefault();return;}
        const numMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
        const dest = numMap[e.key];
        if (dest !== undefined && state.teleportDestOptions.includes(dest)) {
          doTeleport(state, dest); rerender(); return;
        }
        return;
      }

      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (e.repeat || keyboardLaserHeldRef.current) return;
        keyboardLaserHeldRef.current = true;
        if (!mouseDownTimeRef.current) mouseDownTimeRef.current = Date.now();
        useLaser(state); rerender(); return;
      }
      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (e.repeat || keyboardBulletHeldRef.current) return;
        keyboardBulletHeldRef.current = true;
        useBullet(state); rerender(); return;
      }

      // Movement
      const dirMap: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      const dir = dirMap[e.key];
      if (dir) {
        e.preventDefault();
        state.playerQueuedDirX = dir[0];
        state.playerQueuedDirY = dir[1];
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (state.sun) state.sun.charging = true;
        if (!sunStationNearPlayer(state)) healRuby(state);
        rerender();
        return;
      }
      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        if(!e.repeat){if(tryActivateTeleport(state))playUiSfx('teleport');rerender();}
        return;
      }
      if ((e.key === 'c' || e.key === 'C') && state.sun) {
        e.preventDefault(); if (!e.repeat) { if (!useCoolingWave(state)) playUiSfx('locked'); rerender(); } return;
      }
      if ((e.key === 'c' || e.key === 'C') && state.gaia) { // Gaia: Sunfire fires at once with whatever is charged
        e.preventDefault();
        if (!e.repeat) { if (!useSunfire(state)) playUiSfx('locked'); else if ((state.gamePhase as string) === 'laserTarget') playUiSfx('teleport'); rerender(); }
        return;
      }
      if ((e.key === 'c' || e.key === 'C') && state.moon) { // Moon: mark the nearest Queen or illusion
        e.preventDefault();
        if (!e.repeat) { if (!useMoonMark(state)) playUiSfx('locked'); rerender(); }
        return;
      }
      if ((e.key === 'c' || e.key === 'C') && state.neptune) {
        e.preventDefault();
        if (!e.repeat) { if (canOpenSkyLaser(state) && openSkyLaser(state)) playUiSfx('teleport'); else playUiSfx('locked'); rerender(); }
        return;
      }
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'r' || e.key === 'R') { e.preventDefault(); useSpeedBoost(state); rerender(); return; }
      if (e.key === 'e' || e.key === 'E') {
        toggleCarryRuby(state); rerender(); return;
      }
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); if (!e.repeat) useSpecialSkill(state); rerender(); return; }
      if (e.key === 'q' || e.key === 'Q') { useBomb(state); rerender(); return; }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && stateRef.current?.sun) stateRef.current.sun.charging = false;
      if (e.key.toLowerCase() === 'k') {
        keyboardLaserHeldRef.current = false;
        if (!pointerLaserHeldRef.current) { mouseDownTimeRef.current = 0; stopChargeSound(); }
        return;
      }
      if (e.key.toLowerCase() === 'l') { keyboardBulletHeldRef.current = false; return; }
      const state = stateRef.current;
      if (!state) return;
      const dirMap: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      const dir = dirMap[e.key];
      if (dir && state.playerQueuedDirX === dir[0] && state.playerQueuedDirY === dir[1]) {
        state.playerQueuedDirX = 0;
        state.playerQueuedDirY = 0;
      }
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [showRules, rerender]);

  // ── Mouse input ───────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    const state = stateRef.current;
    if (!state || state.gamePhase !== 'playing') return;
    if (e.button === 0) {

      pointerLaserHeldRef.current = true;
      if (!mouseDownTimeRef.current) mouseDownTimeRef.current = Date.now();
      useLaser(state);
      rerender();
    } else if (e.button === 2) {
      e.preventDefault();
      rightMouseHeldRef.current = true;
      useBullet(state);
      rerender();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2) { rightMouseHeldRef.current = false; return; }
    if (e.button !== 0) return;
    pointerLaserHeldRef.current = false;
    if (!keyboardLaserHeldRef.current) { mouseDownTimeRef.current = 0; stopChargeSound(); }
  };

  const handleMouseLeave = () => {
    rightMouseHeldRef.current = false; pointerLaserHeldRef.current = false;
    if (!keyboardLaserHeldRef.current) { mouseDownTimeRef.current = 0; stopChargeSound(); }
  };

  // ── Touch swipe ───────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (document.fullscreenElement === null && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => { });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const state = stateRef.current;
    if (!state || !touchStartRef.current || state.gamePhase !== 'playing') return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 14 || Math.abs(dy) > 14) {
      if (Math.abs(dx) > Math.abs(dy)) {
        state.playerQueuedDirX = dx > 0 ? 1 : -1;
        state.playerQueuedDirY = 0;
      } else {
        state.playerQueuedDirX = 0;
        state.playerQueuedDirY = dy > 0 ? 1 : -1;
      }
    }
  };
  const handleTouchEnd = () => {
    const state = stateRef.current;
    touchStartRef.current = null;
    if (!state) return;
    state.playerQueuedDirX = 0;
    state.playerQueuedDirY = 0;
  };

  const handleRestart = () => {
    stopAmbientEventSounds();
    const s = createModeState(mode, trialInfo?.boss);
    s.godMode = stateRef.current?.godMode ?? false;
    s.immortal = stateRef.current?.immortal ?? false;
    s.noMobs = stateRef.current?.noMobs ?? false;
    if (s.sun) godSetNoWisps(s, stateRef.current?.sun?.noWisps ?? false);
    s.noBossSpawns = stateRef.current?.noBossSpawns ?? false;
    stateRef.current = s;
    tickRef.current = 0;
    rightMouseHeldRef.current = pointerLaserHeldRef.current = keyboardLaserHeldRef.current = keyboardBulletHeldRef.current = false;
    mouseDownTimeRef.current = 0;
    touchStartRef.current = null;
    joyPointerIdRef.current = null;
    setJoyThumb({ x: 0, y: 0 });
    rerender();
  };

  const state = stateRef.current;
  const phase = state?.gamePhase ?? 'playing';
  const timeSurvived = Math.floor(state?.score ?? 0);

  // Guards the teleport overlay's backdrop-tap-to-cancel against the mobile "ghost click":
  // the same touch that opened the menu (tapping TP) can generate a trailing synthetic
  // click at the same screen coordinates, landing on the backdrop that just appeared there
  // and instantly cancelling it. Ignore backdrop clicks within a short window of opening.
  useEffect(() => {
    if (phase === 'teleporting') teleportOpenedAtRef.current = Date.now();
  }, [phase]);

  const powered = (state?.poweredTicks ?? 0) > 0 || (state?.starEnergy ?? 0) >= STAR_ENERGY_MAX;
  const carrying = state?.playerCarryingRuby ?? true;
  const godPanelTop = 8;
  const godPanelWidth = 254;
  const prayerSpawnWarning = phase === 'playing' && (state?.bossSpawnTicks ?? 0) > 0 && !!state && isMovementReversed(state);
  const playerStatuses: { key: string; label: string; color: string; seconds?: number; progress?: number }[] = [];
  if(state){
    if(state.playerFrozenTicks>0)playerStatuses.push({key:'frozen',label:'FROZEN',color:'#b4eaff',seconds:state.playerFrozenTicks/60,progress:state.playerFrozenTicks/90});
    else if(isPlayerChilled(state))playerStatuses.push({key:'chilled',label:'CHILLED · MOVE & ATTACK SLOW',color:'#8ecfe9'});
    if(isMovementReversed(state))playerStatuses.push({key:'reversed',label:'CONTROLS REVERSED',color:'#ffe477'});
    if(state.rubyPlacedFlashTicks>0)playerStatuses.push({key:'ruby-placed',label:'RUBY PLACED',color:'#ffa5c3',progress:state.rubyPlacedFlashTicks/120});
  }

  // HP percentages
  const playerHpPct = Math.max(0, Math.min(100, ((state?.playerHP ?? PLAYER_MAX_HP) / PLAYER_MAX_HP) * 100));
  const rubyHpPct = Math.max(0, Math.min(100, ((state?.rubyHP ?? RUBY_MAX_HP) / RUBY_MAX_HP) * 100));
  const energyPct = Math.max(0, Math.min(100, ((state?.starEnergy ?? 0) / STAR_ENERGY_MAX) * 100));

  // God-mode invincibility keeps the normal bars but paints them gold.
  const INVINCIBLE_COLOR = '#ffd34d';
  const playerBattColor = state?.godMode ? INVINCIBLE_COLOR : playerHpPct > 60 ? 'var(--success)' : playerHpPct > 30 ? 'var(--warning)' : 'var(--danger)';
  const rubyBattColor = state?.godMode ? INVINCIBLE_COLOR : rubyHpPct > 60 ? '#ff4488' : rubyHpPct > 30 ? '#ff7700' : '#ff2200';

  return (
    <div className="ruby-star-ui" style={{
      display: 'flex', flexDirection: 'column',
      position: 'fixed', inset: 0,
      background: 'var(--void)', overflow: 'hidden', touchAction: 'none',
    }}>
      <style>{`
        body:has(.ruby-star-ui)::after { display: none; }
        .ruby-star-ui .btn, .ruby-star-ui .modal-content { border-radius: 2px; }
        .ruby-star-ui .battery { border-width: 2px; border-radius: 2px; background: #090f1c; }
        .ruby-star-ui .battery-fill, .ruby-star-ui .battery-nub { border-radius: 0; }
        .ruby-star-ui .modal-content { border-width: 2px; background: #0b1120; box-shadow: 0 0 18px rgba(0,212,255,.16); }
        .ruby-star-ui .modal-content { max-width: 720px; max-height: 88dvh; display: flex; flex-direction: column; overflow: hidden; }
        .ruby-star-ui .modal-header, .ruby-star-ui .modal-footer { flex-shrink: 0; }
        .ruby-star-ui .modal-body { overflow-y: auto; min-height: 0; overscroll-behavior: contain; touch-action: pan-y; }
        .rs-guide { font-family: var(--font-mono); color: #bcc9db; font-size: .88rem; line-height: 1.6; }
        .rs-guide h3, .rs-guide h4, .rs-guide h5, .rs-guide p { margin: 0; }
        .rs-guide-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .rs-guide-nav h3 { font-family: var(--font-pixel); font-size: .64rem; color: #dbeaff; }
        .rs-guide-nav .btn, .rs-guide-back { font-size: .67rem; padding: 8px 10px; }
        .rs-guide-nav .rs-guide-link { min-height: 44px; padding: 11px 14px; font-size: .72rem; color: #d4f7ff; background: #12384b; border: 2px solid #45cce9; box-shadow: 0 0 12px #30c7ef33; }
        .rs-guide-nav .rs-guide-link:hover { background: #194b61; border-color: #a1eeff; color: #fff; box-shadow: 0 0 16px #30c7ef55; }
        .rs-guide-intro { padding: 14px 0; }
        .rs-guide h4 { color: #8ad7ef; font-size: .75rem; letter-spacing: .08em; font-weight: 700; }
        .rs-guide-section { border-top: 1px solid #263346; padding: 12px 0; }
        .rs-guide-section p { margin-top: 6px; }
        .rs-guide-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 22px; margin: 10px 0; }
        .rs-guide-controls > div { display: grid; grid-template-columns: minmax(105px, .8fr) 1fr; gap: 8px; align-items: baseline; }
        .rs-guide-controls dt { color: #e6edf7; font-weight: 700; font-size: .8rem; }
        .rs-guide-controls dd { margin: 0; }
        .rs-guide .rs-guide-note { color: #8d9eb5; font-size: .8rem; }
        .rs-guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 22px; }
        .rs-guide-hints { padding: 12px; border: 1px solid #68552c; background: #dba84808; }
        .rs-guide-hints h4 { color: #f1cd75; }
        .rs-guide-hints ul { padding-left: 18px; margin: 6px 0 0; }
        .rs-guide-group-title { padding: 12px 0 8px; }
        .rs-guide-entry { border-left: 3px solid; padding: 9px 12px; margin-bottom: 12px; background: #111b2b; }
        .rs-guide-entry h5 { font-size: .88rem; font-weight: 700; margin-bottom: 4px; }
        .rs-guide .rs-guide-skill { margin-top: 9px; padding-top: 8px; border-top: 1px solid #263346; font-size: .8rem; }
        .rs-guide-skill strong { display: block; font-size: .73rem; letter-spacing: .025em; }
        .rs-guide-back { margin-top: 4px; }
        .rs-nep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .rs-nep-card { border: 1px solid; background: #0e1a2a; padding: 8px 8px 10px; }
        .rs-nep-card canvas { display: block; width: 100%; height: auto; image-rendering: pixelated; margin-bottom: 8px; }
        .rs-nep-card h5 { font-size: .8rem; font-weight: 700; letter-spacing: .05em; margin-bottom: 4px; }
        .rs-nep-card p { font-size: .8rem; line-height: 1.45; }
        @media (max-width: 600px) {
          .rs-guide-controls, .rs-guide-grid { grid-template-columns: 1fr; }
          .ruby-star-ui .modal-body { padding: 14px; }
          .rs-guide-nav h3 { font-size: .58rem; }
        }
        .ruby-star-ui .modal-content { background: #0d192b; border: 2px solid #668eaf; border-radius: 0; box-shadow: 0 12px 50px #0009; }
        .ruby-star-ui .modal-header { background: #15283e; border-bottom: 2px solid #385c7e; padding: 18px 22px; }
        .ruby-star-ui .modal-header h2 { color: #dbf2ff; line-height: 1.7; }
        .ruby-star-ui .modal-body { padding: 22px; }
        .ruby-star-ui .modal-footer { background: #101f33; border-top: 2px solid #385c7e; }
        .ruby-star-ui .modal-footer button { min-height: 44px; background: #23516b; color: #edfcff; border: 2px solid #75d6ec; font-size: 15px; font-weight: 700; }
        .rs-guide { color: #d0ddec; font-size: 16px; font-weight: 600; line-height: 1.65; }
        .rs-guide-nav h3 { font-size: 12px; line-height: 1.7; }
        .rs-guide h4 { color: #a2e7f8; font-size: 15px; }
        .rs-guide-entry h5 { font-size: 17px; }
        .rs-guide-section { border-top: 2px solid #2a435e; padding: 16px 0; }
        .rs-guide-controls > div { background: #14263d; border: 1px solid #294560; padding: 8px 10px; }
        .rs-guide-controls dt { font-size: 14px; color: #f1f7ff; }
        .rs-guide-controls dd { font-size: 15px; }
        .rs-guide .rs-guide-note { color: #aabed5; font-size: 14px; }
        .rs-guide-entry { background: #15273e; padding: 12px 14px; }
        .rs-guide .rs-guide-skill { font-size: 15px; }
        .rs-guide-skill strong { font-size: 14px; }
        .rs-guide-nav button, .rs-guide-back { display: inline-flex; align-items: center; justify-content: center; gap: 12px; min-height: 44px; }
        .rs-guide .rs-guide-back { background: #203b58; border: 2px solid #7198be; color: #eff7ff; padding: 10px 14px; }
        .rs-god-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
        .ruby-star-ui .rs-god-panel { z-index: 80 !important; }
        .ruby-star-ui .rs-game-over { z-index: 120; background: #050a14ed; padding: 12px; box-sizing: border-box; overflow: auto; }
        .rs-end-panel { box-sizing: border-box; width: min(620px, 100%); max-height: 100%; overflow: auto; padding: 24px; background: #0e1a2d; border: 2px solid #9a86c5; box-shadow: 0 0 28px #9966cc22; }
        .rs-end-panel h2 { margin: 0 0 22px; color: #f1e8ff; font-family: var(--font-pixel); font-size: 22px; line-height: 1.5; text-align: center; text-shadow: 0 0 14px #b976ff55; }
        .rs-end-body { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 22px; align-items: center; }
        .rs-end-stage { text-align: center; color: #e8cbff; }
        .rs-end-stage > span { display: block; font-family: var(--font-mono); font-size: 15px; font-weight: 700; letter-spacing: .15em; margin-bottom: 12px; }
        .rs-end-stage > strong { display: block; font-family: var(--font-pixel); font-size: 54px; line-height: 1.3; color: #f0dfff; text-shadow: 0 0 18px #b978ff66; }
        .rs-end-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; font-family: var(--font-mono); font-weight: 700; }
        .rs-end-stats > div { padding: 10px 12px; background: #182c45; border: 1px solid #3b5877; }
        .rs-end-stats dt { font-size: 13px; letter-spacing: .05em; color: #b6cee5; margin-bottom: 5px; }
        .rs-end-stats dd { margin: 0; color: #f0f7ff; font-size: 23px; line-height: 1.2; }
        .rs-end-stats small { font-size: 14px; color: #a5bdd5; }
        .rs-end-stats > div:last-child dd { color: #ff99bc; }
        .rs-end-restart { width: 100%; min-height: 46px; margin-top: 22px; padding: 10px 16px; border: 2px solid #82b7d9; border-radius: 0; background: #244865; color: #f1fbff; font-family: var(--font-mono); font-size: 17px; font-weight: 700; letter-spacing: .08em; cursor: pointer; box-shadow: 0 3px 0 #030811; }
        .rs-end-restart:hover { background: #315f81; border-color: #c4ebff; }
        @media (max-height: 520px) { .rs-end-panel { padding: 16px 20px; } .rs-end-panel h2 { font-size: 18px; margin-bottom: 12px; } .rs-end-stage > strong { font-size: 42px; } .rs-end-stage > span { margin-bottom: 7px; } .rs-end-stats > div { padding: 7px 10px; } .rs-end-stats dd { font-size: 19px; } .rs-end-restart { margin-top: 12px; min-height: 42px; } }
        @media (max-width: 440px) { .rs-end-body { grid-template-columns: 90px minmax(0, 1fr); gap: 12px; } .rs-end-stage > strong { font-size: 34px; } .rs-end-panel { padding: 14px; } .rs-end-stats > div { padding: 7px; } .rs-end-stats dt { font-size: 11px; } }
        .rs-event-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
        .rs-event-controls button { min-height: 42px; border-radius: 0; cursor: pointer; background: #34304e; border: 2px solid #bdabf5; color: #eee5ff; font-weight: 700; padding: 5px; }
        .rs-event-controls button:last-child:nth-child(odd) { grid-column: 1 / -1; }
        .rs-event-controls button:disabled { opacity: .4; cursor: default; }
        .rs-teleport-room { position: absolute; padding: 0; background: transparent; border: 2px solid var(--room); box-shadow: 0 0 10px var(--room); cursor: pointer; }
        .rs-teleport-room:hover, .rs-teleport-room:focus-visible { background: color-mix(in srgb, var(--room) 28%, transparent); box-shadow: 0 0 18px var(--room); outline: none; }
        .rs-teleport-room:disabled { border-color: transparent; box-shadow: none; background: rgba(0,0,8,.55); cursor: default; }
        .rs-event-banner { position: absolute; top: 64px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 4px; max-width: calc(100% - 32px); width: max-content; padding: 7px 12px; border: 2px solid; background: #11182bef; font-family: var(--font-mono); font-weight: 700; text-align: center; pointer-events: none; }
        .rs-event-banner strong { font-size: 14px; letter-spacing: .05em; }
        .rs-event-banner span { color: #d9e4f4; font-size: 13px; }
        .rs-god-actions button { min-height: 34px; padding: 5px 3px; border-radius: 0; }
        .ruby-star-ui .rs-hud { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 12px; flex-shrink: 0; padding: var(--bar-pad); background: #090f1c; border-bottom: 1px solid rgba(124,158,196,.24); }
        .rs-hud-left, .rs-hud-right, .rs-hud-vitals { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .rs-hud-left > :first-child { flex-shrink: 0; white-space: nowrap; }
        .rs-hud-vitals { flex-wrap: nowrap; gap: 8px 10px; }
        .rs-hud-right { justify-content: flex-end; gap: 10px; }
        .rs-stage { min-width: 100px; padding: 7px 16px; text-align: center; }
        .rs-guardian { width: min(330px, 24vw); padding: 6px 0; text-align: center; }
        .rs-guardian-name { display: block; margin-bottom: 7px; white-space: nowrap; font-family: var(--font-pixel); font-size: 11px; letter-spacing: .1em; color: var(--guardian); text-shadow: 0 0 10px var(--guardian); }
        .rs-guardian-bar { display: block; height: 16px; box-sizing: border-box; padding: 2px; border: 2px solid color-mix(in srgb, var(--guardian) 70%, #ffffff); background: #0b1020; }
        .rs-guardian-segments { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
        .rs-guardian-bar { position: relative; }
        .rs-guardian-bar[data-active] { border-color: #ffffff; }
        .rs-guardian-mark { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #e8fbff; box-shadow: 0 0 4px #9fe4ff; }
        .rs-guardian-fill { display: block; height: 100%; background: var(--guardian); box-shadow: 0 0 10px var(--guardian), inset 0 -4px 0 rgba(0,0,0,.25), inset 0 3px 0 rgba(255,255,255,.3); transition: width 160ms linear; }
        .rs-sun-guardian { display: flex; align-items: center; gap: 10px; }
        .rs-sun-health { flex: 1; min-width: 0; }
        .rs-rage { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 28px; flex-shrink: 0; }
        .rs-rage-track { display: flex; align-items: flex-end; width: 14px; height: 34px; padding: 2px; box-sizing: border-box; border: 2px solid currentColor; background: #0b1020; }
        .rs-rage-fill { display: block; width: 100%; background: currentColor; box-shadow: 0 0 5px currentColor; transition: height 160ms linear; }
        .rs-rage-value { font-family: var(--font-mono); font-size: 9px; line-height: 1; }
        .rs-sun-extinguished { display: block; margin-top: 3px; font-family: var(--font-mono); font-size: 10px; color: #d5eff5; }
        .rs-stage > span { display: block; color: #dfc4ff; font-size: 12px; font-weight: 700; letter-spacing: .22em; margin-bottom: 5px; }
        .rs-stage > strong { display: block; font-family: var(--font-pixel); font-size: 30px; line-height: 1.15; color: #f4e7ff; text-shadow: 0 0 14px #bb75ff99; }
        .rs-time { display: flex; gap: 6px; align-items: center; font-size: var(--font-stat); color: #b8cce0; font-weight: 700; }
        .rs-time > span:last-child { font-family: var(--font-pixel); font-size: var(--font-score); color: #a5bfd7; }
        @media (max-width: 1000px) {
          .ruby-star-ui .rs-hud { gap: 8px; }
          .rs-hud-left, .rs-hud-right { gap: 8px; }
          .rs-stage { min-width: 72px; padding: 6px 10px; }
          .rs-stage > strong { font-size: 24px; }
          .rs-hud-vitals { gap: 6px 10px; }
          .rs-time { flex-direction: column; gap: 4px; }
        }
        .rs-player-status { position: absolute; top: 12px; left: 12px; display: flex; flex-wrap: wrap; gap: 7px; max-width: calc(100% - 240px); pointer-events: none; }
        .rs-status-tag { position: relative; padding: 6px 9px 8px; background: #0b1320ed; border: 1px solid; font-family: var(--font-mono); font-size: .78rem; font-weight: 700; line-height: 1.4; }
        .rs-status-time { margin-left: 8px; opacity: .8; font-weight: 400; }
        .rs-status-progress { position: absolute; bottom: 0; left: 0; height: 2px; background: currentColor; }
        .ruby-star-ui .rs-hud button {
          min-height: 42px; padding: 9px 12px !important; border: 2px solid #7198be !important;
          border-radius: 0 !important; background: #203b58 !important; color: #f0f7ff !important;
          font-size: 15px !important; font-weight: 700 !important; letter-spacing: .045em !important;
          line-height: 1.2; box-shadow: inset 0 1px 0 #ffffff16, 0 3px 0 #030811;
          text-shadow: 0 1px 0 #0008;
        }
        .ruby-star-ui .rs-hud button:hover { background: #2d5175 !important; border-color: #b6e4ff !important; }
        .ruby-star-ui .rs-hud button[aria-pressed="true"] { background: #19513b !important; border-color: #86efb0 !important; color: #dcffea !important; }
        .ruby-star-ui .rs-hud button:active { transform: translateY(1px); box-shadow: inset 0 1px 0 #ffffff16, 0 1px 0 #030811; }
        .ruby-star-ui .rs-god-panel button, .ruby-star-ui .rs-god-panel select { font-size: 13px !important; font-weight: 700; }
        .ruby-star-ui .rs-god-panel > button { min-height: 34px; border-width: 2px !important; }
        .ruby-star-ui .rs-guide button { font-size: 14px; font-weight: 700; }
        .ruby-star-ui button:focus-visible { outline: 2px solid #cceeff; outline-offset: 3px; }

        :root {
          --bar-pad: 8px 12px;
          --font-stat: 0.75rem;
          --font-score: 0.85rem;
          --batt-w: 64px; --batt-h: 16px;
          --bot-bar-h: 56px;
          --font-abl: 0.65rem;
          --font-abs: 0.5rem;
        }
        @media (min-width: 1024px) {
          :root {
            --bar-pad: 10px 16px;
            --font-stat: 0.9rem;
            --font-score: 1rem;
            --batt-w: 76px; --batt-h: 20px;
            --bot-bar-h: 72px;
            --font-abl: 0.78rem;
            --font-abs: 0.6rem;
          }
        }
        .rotate-overlay { display: none; }
        @media (orientation: portrait) and (max-width: 768px) {
          .rotate-overlay { display: flex !important; }
        }
        /* Touch controls (joystick + ability buttons) only ever show on devices whose
           primary input has no hover and no fine pointer — i.e. touch, never desktop mouse.
           !important on both rules: several of these elements (TouchAbilityButton) also set
           display:flex inline for their own centering, which would otherwise always beat a
           plain (non-important) class rule regardless of media query. */
        .rs-touch-controls { display: none !important; }
        @media (hover: none) and (pointer: coarse) {
          .rs-touch-controls { display: flex !important; }
        }
      `}</style>

      <BGMController ref={bgmRef} visible={false} src={['/sounds/rubyStarBGM.mp3']} volume={[0.29]} />

      {/* Rotate prompt */}
      <div className="rotate-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--void)',
        color: 'white', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '20px',
      }}>
        <span style={{ fontSize: '4rem', marginBottom: '20px' }}>📱➔🔄</span>
        <h2 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.2rem', marginBottom: '16px', lineHeight: 1.5 }}>
          PLEASE ROTATE<br />YOUR DEVICE
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          Ruby Star is designed for landscape mode.
        </p>
      </div>

      <RulesModal
        isOpen={showRules}
        onClose={() => { setShowRules(false); startMusic(); }}
        title={sunMap ? ':: THE SUN' : neptuneMap ? ':: NEPTUNE' : gaiaMap ? ':: GAIA' : moonMap ? ':: THE MOON' : ':: RUBY STAR'}
        playSound={button => playUiSfx(button)}
      >
        {sunMap ? <SunGuide drawKing={drawGuideKing} drawCelestial={(ctx, age, tick) => drawGuideCelestial(ctx, 'fiery_king', age, tick)} /> : neptuneMap ? <NeptuneGuide drawBoss={drawGuideBoss} drawCelestial={(ctx, age, tick) => drawGuideCelestial(ctx, 'sea_chanter', age, tick)} /> : gaiaMap ? <GaiaGuide drawBoss={drawGuideWeaver} drawCelestial={(ctx, age, tick) => drawGuideCelestial(ctx, 'thorn_weaver', age, tick)} /> : moonMap ? <MoonGuide drawQueen={drawGuideQueen} drawCelestial={(ctx, age, tick) => drawGuideCelestial(ctx, 'splitter_queen', age, tick)} /> : <RubyStarGuide />}
      </RulesModal>

      {state?.gamePhase === 'skillChoice' && !showRules && <StartingSkillChoice state={state}
        onChoose={kind => { if (chooseStartingSkill(state, kind)) rerender(); }} />}

      {state?.gamePhase === 'constellation' && !showRules && <ConstellationChoice
        choices={state.constellationChoices} toggleMode={state.godConstellationMode} active={state.constellations}
        onClose={() => { closeGodConstellations(state); rerender(); }}
        onChoose={kind => {
          if (chooseConstellation(state, kind)) {
            mouseDownTimeRef.current = 0; rightMouseHeldRef.current = pointerLaserHeldRef.current = keyboardLaserHeldRef.current = keyboardBulletHeldRef.current = false;
            touchStartRef.current = null; setJoyThumb({ x: 0, y: 0 }); rerender();
          }
        }}
      />}

      {!!state?.constellations.length && <div aria-label="Active constellations" style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 16px', padding: '5px 12px',
        background: '#0b1120', fontFamily: 'var(--font-mono)', fontSize: '11px',
      }}>
        {Array.from(new Set(state.constellations)).map(kind => <span key={kind} title={CONSTELLATIONS[kind].description} style={{ color: CONSTELLATIONS[kind].color }}>
          ✦ {CONSTELLATIONS[kind].name}
        </span>)}
      </div>}

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="rs-hud">
        <div className="rs-hud-left">
          <BackButton href={trialInfo ? '/ruby-star/challenge' : '/ruby-star'} playSound={() => playUiSfx('back')} arrow={<PixelArrow direction="left" />} />
          <div className="rs-hud-vitals">
          {/* Player HP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HudIcon kind="hp" />
            <div className="battery" title={state?.godMode ? 'Invincible' : undefined} style={{ width: 'var(--batt-w)', height: 'var(--batt-h)' }}>
              <div className="battery-fill" style={{ width: `${playerHpPct}%`, background: playerBattColor, boxShadow: `0 0 8px ${playerBattColor}` }} />
              <div className="battery-nub" />
            </div>
          </div>

          {/* Ruby HP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HudIcon kind="ruby" carrying={carrying} />
            <div className="battery" style={{ width: 'var(--batt-w)', height: 'var(--batt-h)', borderColor: RUBY_COLOR + '99' }}>
              <div className="battery-fill" style={{ width: `${rubyHpPct}%`, background: rubyBattColor, boxShadow: `0 0 8px ${rubyBattColor}` }} />
              <div className="battery-nub" style={{ borderLeftColor: RUBY_COLOR + '66' }} />
            </div>
          </div>

          {state?.sun && <div role="meter" aria-label="Temperature" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.sun.heat)} title="Temperature — cool it with stations and Cooling Wave" style={{display:'flex',alignItems:'center',gap:6}}>
            <HudIcon kind="temperature" />
            <div className="battery" style={{width:'var(--batt-w)',height:'var(--batt-h)',borderColor:'#ff985b'}}><div className="battery-fill" style={{width:`${state.sun.heat}%`,background:state.sun.heat>80?'#ff4538':'#ffab55'}} /><div className="battery-nub" /></div>
          </div>}
          {state?.neptune && (() => {
            const charge = state.neptune.healCharge / NEPTUNE_HEAL_CHARGE_MAX, ready = charge >= 1;
            return <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} role="meter" aria-label="Trident charge"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(charge * 100)} title={ready ? 'Trident ready — press C' : 'Healing charges the Trident'}>
              <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
                <path d="M7 1H9V4H11V7H13V12H11V14H5V12H3V7H5V4H7Z" fill={ready ? '#e8fbff' : '#59c8ff'} />
              </svg>
              <div style={{ width: 'calc(var(--batt-w) * .8)', height: 'var(--batt-h)', border: `1px solid ${ready ? '#e8fbff' : 'rgba(89,200,255,.45)'}`,
                borderRadius: '2px', background: 'rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${charge * 100}%`, background: ready ? '#e8fbff' : '#2f9be0',
                  boxShadow: ready ? '0 0 10px #9fe4ff' : 'none', animation: ready ? 'pulseGlow 0.8s ease-in-out infinite' : undefined }} />
              </div>
              {ready && <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: '#e8fbff' }}>C</span>}
            </div>;
          })()}

          {state?.gaia && (() => {
            const charge = state.gaia.sunCharge / GAIA_SUN_MAX, ready = charge >= 1, usable = state.gaia.sunCharge >= GAIA_SUN_MIN && !state.gaia.sunfire;
            return <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} role="meter" aria-label="Sunfire charge"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(charge * 100)} title={ready ? 'Full Sunfire: C picks a room to burn' : 'Clearing vines charges Sunfire. C fires a smaller burst now, or wait for a full charge'}>
              <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
                <path d="M7 0H9V3H7ZM7 13H9V16H7ZM0 7H3V9H0ZM13 7H16V9H13ZM5 4H11V5H12V11H11V12H5V11H4V5H5Z" fill={ready ? '#fff3b8' : '#ffd36a'} />
              </svg>
              <div style={{ width: 'calc(var(--batt-w) * .8)', height: 'var(--batt-h)', border: `1px solid ${ready ? '#fff3b8' : 'rgba(255,211,106,.45)'}`,
                borderRadius: '2px', background: 'rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${charge * 100}%`, background: ready ? '#fff3b8' : '#e0a83a',
                  boxShadow: ready ? '0 0 10px #ffd36a' : 'none', animation: ready ? 'pulseGlow 0.8s ease-in-out infinite' : undefined }} />
              </div>
              {usable && <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: ready ? '#fff3b8' : '#c9a24a' }}>C</span>}
            </div>;
          })()}

          {/* Star energy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HudIcon kind="energy" powered={powered} />
            <div style={{
              width: 'var(--batt-w)', height: 'var(--batt-h)', border: `1px solid ${powered ? '#00ffff' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '2px', background: 'rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', width: `${energyPct}%`,
                background: powered ? '#ffffff' : '#66aaff',
                boxShadow: powered ? '0 0 10px #00ffff' : '0 0 8px #4488ff66', transition: 'background 0.3s'
              }} />
              <div style={{
                position: 'absolute', right: -2, top: '25%', width: 4, height: '50%',
                background: powered ? '#ffffff' : 'rgba(255,255,255,0.2)', borderRadius: '0 2px 2px 0'
              }} />
            </div>
          </div>

          </div>
        </div>
        {state?.trial ? <GuardianBar state={state} /> : <div className="rs-stage" aria-label={`Stage ${state?.bossesKilled ?? 0}`}>
          <span>STAGE</span>
          <strong>{state?.bossesKilled ?? 0}</strong>
        </div>}
        <div className="rs-hud-right">
          <div className="rs-time">
            <span>TIME</span>
            <span>{timeSurvived}s</span>
          </div>
          <BombStatus armed={!!state?.bomb} cooldown={state?.bombCooldown ?? 0}
            powered={!!state?.bomb?.powered}
            totalCooldown={state?.constellations.includes('bombRate') ? 240 : 300} />
          {state?.trial && <CelestialStatus name={SPECIAL_SKILLS[state.trial.skill].name}
            color={state.trial.skill === 'devourer' ? '#bcbccd' : SPECIAL_SKILLS[state.trial.skill].color}
            cooldown={state.specialSkill ? 0 : state.trial.cooldown || trialSkillCooldown(state.trial.skill)} totalCooldown={trialSkillCooldown(state.trial.skill)} />}
          {state?.sun && <CoolingWaveStatus cooldown={state.sun.waveCooldown} empowered={state.sun.quenchedTicks > 0} casts={state.sun.empoweredCasts} />}
          {state?.moon && <MoonMarkStatus cooldown={state.moon.markCooldown} totalCooldown={MOON_MARK_COOLDOWN} />}
          {isGodQuery && (
            <button
              className="btn btn-ghost"
              aria-pressed={state?.godMode ?? false}
              style={{
                fontSize: '0.7rem', padding: '4px 10px',
                color: state?.godMode ? 'var(--success)' : undefined,
                borderColor: state?.godMode ? 'var(--success)' : undefined
              }}
              onClick={() => { if (stateRef.current) { stateRef.current.godMode = !stateRef.current.godMode; if(stateRef.current.godMode)stateRef.current.immortal=false; rerender(); } }}
            >GOD</button>
          )}
          <button className="btn btn-ghost" aria-pressed={musicEnabled} title={musicEnabled ? 'Mute background music' : 'Play background music'} style={{ fontSize: '0.7rem', padding: '4px 10px' }} onClick={toggleMusic}>MUSIC</button>
          <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '4px 10px' }}
            onClick={() => { playUiSfx('page'); setShowRules(true); }}>RULES</button>
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {phase === 'playing' && !showRules && state?.constellationReveal && <ConstellationAfterglow kind={state.constellationReveal.kind} ticks={state.constellationReveal.ticks} />}
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        {phase==='playing'&&playerStatuses.length>0&&<div className="rs-player-status" role="status" aria-live="polite" style={{left:isGodQuery?godPanelWidth+24:12,maxWidth:isGodQuery?`calc(100% - ${godPanelWidth+244}px)`:undefined}}>
          {playerStatuses.map(status=><div key={status.key} className="rs-status-tag" data-status={status.key} style={{color:status.color,borderColor:status.color+'88'}}>
            {status.label}
            {status.seconds!==undefined&&<span className="rs-status-time" aria-hidden="true">{status.seconds.toFixed(1)}s</span>}
            {status.progress!==undefined&&<span className="rs-status-progress" aria-hidden="true" style={{width:Math.min(100,status.progress*100)+'%'}} />}
          </div>)}
        </div>}

      {/* God Mode UI */}
      {isGodQuery && (
        <div className="rs-god-panel" aria-label="God mode controls"
          onMouseDown={e => e.stopPropagation()} onMouseUp={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          style={{
          position: 'absolute', top: godPanelTop, left: 8,
          background: 'rgba(0,0,0,0.85)', border: '1px solid #ffcc00',
          padding: '8px', width:godPanelWidth, boxSizing:'border-box', maxHeight:`calc(100% - ${godPanelTop + 8}px)`, overflowY:'auto', touchAction:'pan-y', borderRadius: '2px', zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'center' }}>{trialInfo ? 'GOD MODE · CHALLENGE' : 'GOD MODE'}</div>
          <div className="rs-god-actions" role="group" aria-label="Protection modes">
            <button type="button" aria-pressed={state?.immortal ?? false} title="Take damage, but player and Ruby HP cannot fall below 1"
              style={{background:state?.immortal?'#ffcc00':'#34303a',color:state?.immortal?'#111':'#f4dda0',border:'2px solid #bfa544',cursor:'pointer'}}
              onClick={() => { const current=stateRef.current;if(current){current.immortal=!current.immortal;if(current.immortal)current.godMode=false;}rerender(); }}>Immortal</button>
            <button type="button" aria-pressed={state?.godMode ?? false} title="Ignore damage"
              style={{background:state?.godMode?'#59d8a1':'#25382f',color:state?.godMode?'#10251c':'#c6f4dc',border:'2px solid #65bd91',cursor:'pointer'}}
              onClick={() => { const current=stateRef.current;if(current){current.godMode=!current.godMode;if(current.godMode)current.immortal=false;}rerender(); }}>Invincible</button>
          </div>
          <div className="rs-god-actions" role="group" aria-label="Restore health and energy">
            <button type="button" disabled={phase === 'lost'}
              style={{cursor:phase==='lost'?'default':'pointer',background:'#203e34',color:'#bdffda',border:'2px solid #68cd96',fontWeight:700,opacity:phase==='lost'?.5:1}}
              onClick={() => {const current=stateRef.current;if(current&&current.gamePhase!=='lost'){current.playerHP=PLAYER_MAX_HP;current.rubyHP=RUBY_MAX_HP;}rerender();}}>Full HP</button>
            <button type="button" style={{background:'#283b51',color:'#c9e9ff',border:'2px solid #72b5e7',cursor:'pointer'}}
              onClick={() => {if(stateRef.current)stateRef.current.starEnergy=STAR_ENERGY_MAX;rerender();}}>Full Energy</button>
          </div>
          {state?.trial && <div className="rs-god-actions" role="group" aria-label="Celestial skill and C bar">
          {state?.trial && <button type="button" title="Give the celestial skill back now, skipping its cooldown"
            style={{background:'#2c2347',color:'#e6dcff',border:'2px solid #a58cff',padding:'7px',fontWeight:700,cursor:'pointer'}}
            onClick={() => {const current=stateRef.current;if(current?.trial){current.trial.cooldown=0;current.specialLockTicks=0;if(!current.specialSkill){current.specialSkill=current.trial.skill;playStrikeCharged();}}rerender();}}>Skill Ready</button>}
          {state?.neptune && <button type="button" title="Fill the healing bar so C fires the Trident"
            style={{background:'#123a52',color:'#c9f2ff',border:'2px solid #59c8ff',padding:'7px',fontWeight:700,cursor:'pointer'}}
            onClick={() => {const current=stateRef.current;if(current?.neptune){current.neptune.healCharge=NEPTUNE_HEAL_CHARGE_MAX;playStrikeCharged();}rerender();}}>Full Trident</button>}
          {state?.gaia && <button type="button" title="Fill the Sunfire bar so C picks a room to burn"
            style={{background:'#3a2f12',color:'#fff3b8',border:'2px solid #ffd36a',padding:'7px',fontWeight:700,cursor:'pointer'}}
            onClick={() => {const current=stateRef.current;if(current?.gaia){current.gaia.sunCharge=GAIA_SUN_MAX;playStrikeCharged();}rerender();}}>Full Sunfire</button>}
          {state?.sun && <>
            <button type="button" title="Recharge Cooling Wave now" disabled={phase !== 'playing'}
              style={{background:'#123a52',color:'#c9f2ff',border:'2px solid #59c8ff',padding:'7px',fontWeight:700,cursor:phase==='playing'?'pointer':'default',opacity:phase==='playing'?1:.5}}
              onClick={() => {const current=stateRef.current;if(current?.sun&&current.gamePhase==='playing')current.sun.waveCooldown=0;rerender();}}>Wave Ready</button>
            <button type="button" title="Fill temperature and trigger a thermal eruption" disabled={phase !== 'playing'}
              style={{background:'#4a261d',color:'#ffe0b8',border:'2px solid #f6a568',padding:'7px',fontWeight:700,cursor:phase==='playing'?'pointer':'default',opacity:phase==='playing'?1:.5}}
              onClick={() => {const current=stateRef.current;if(current)godSetSunHeat(current,100);rerender();}}>Full Heat</button>
            <button type="button" title="Extinguish the King and grant five empowered Cooling Waves" disabled={phase !== 'playing'}
              style={{background:'#153b46',color:'#d8fbff',border:'2px solid #83dce9',padding:'7px',fontWeight:700,cursor:phase==='playing'?'pointer':'default',opacity:phase==='playing'?1:.5}}
              onClick={() => {const current=stateRef.current;if(current)godSetSunHeat(current,0);rerender();}}>Zero Heat</button>
          </>}
          {state?.moon && <button type="button" title="Recharge the Moon Mark so C marks at once"
            style={{background:'#1c2c40',color:'#e8fbff',border:'2px solid #a9e6ff',padding:'7px',fontWeight:700,cursor:'pointer'}}
            onClick={() => {const current=stateRef.current;if(current?.moon){current.moon.markCooldown=0;playStrikeCharged();}rerender();}}>Mark Ready</button>}
          </div>}
          {state?.sun && <div className="rs-god-actions" role="group" aria-label="Adjust temperature">
            <button type="button" title="Increase temperature by 10 points" disabled={phase !== 'playing'}
              style={{background:'#4a261d',color:'#ffe0b8',border:'2px solid #f6a568',cursor:phase==='playing'?'pointer':'default',opacity:phase==='playing'?1:.5}}
              onClick={() => {const current=stateRef.current;if(current)godAdjustSunHeat(current,10);rerender();}}>Heat Up</button>
            <button type="button" title="Decrease temperature by 10 points" disabled={phase !== 'playing'}
              style={{background:'#153b46',color:'#d8fbff',border:'2px solid #83dce9',cursor:phase==='playing'?'pointer':'default',opacity:phase==='playing'?1:.5}}
              onClick={() => {const current=stateRef.current;if(current)godAdjustSunHeat(current,-10);rerender();}}>Cool Down</button>
          </div>}
          {state?.sun && <div className="rs-god-actions" role="group" aria-label="Guardian phase" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
            {([1, 2, 3] as const).map(phase => <button key={phase} type="button" aria-pressed={state.sun?.phase === phase}
              style={{background:state.sun?.phase===phase?'#e6ad62':'#36251f',color:state.sun?.phase===phase?'#251609':'#ffe1b6',border:'2px solid #e8b878',cursor:'pointer'}}
              onClick={() => {const current=stateRef.current;if(current)godSetSunPhase(current,phase);rerender();}}>Phase {phase}</button>)}
          </div>}
          {state?.gaia && <div className="rs-god-actions" role="group" aria-label="Guardian phase" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
            {([1, 2, 3] as const).map(phase => <button key={phase} type="button" aria-pressed={state.gaia?.phase === phase}
              style={{background:state.gaia?.phase===phase?'#88bc45':'#16281a',color:state.gaia?.phase===phase?'#0b1a0c':'#dff3c0',border:'2px solid #8fdc4a',cursor:'pointer'}}
              onClick={() => {if(stateRef.current)godSetGaiaPhase(stateRef.current, phase);rerender();}}>Phase {phase}</button>)}
          </div>}
          {state?.moon && <div className="rs-god-actions" role="group" aria-label="Guardian phase" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
            {([1, 2, 3] as const).map(phase => <button key={phase} type="button" aria-pressed={state.moon?.phase === phase}
              style={{background:state.moon?.phase===phase?'#9f6dff':'#1e1438',color:state.moon?.phase===phase?'#120a26':'#e6d8ff',border:'2px solid #c49bff',cursor:'pointer'}}
              onClick={() => {if(stateRef.current)godSetMoonPhase(stateRef.current, phase);rerender();}}>Phase {phase}</button>)}
          </div>}
          {state?.neptune && <div className="rs-god-actions" role="group" aria-label="Guardian phase" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
            {([1, 2, 3] as const).map(phase => <button key={phase} type="button" aria-pressed={state.neptune?.phase === phase}
              style={{background:state.neptune?.phase===phase?'#3998d6':'#14283d',color:state.neptune?.phase===phase?'#04111e':'#c9f2ff',border:'2px solid #59c8ff',cursor:'pointer'}}
              onClick={() => {if(stateRef.current)godSetNeptunePhase(stateRef.current, phase);rerender();}}>Phase {phase}</button>)}
          </div>}
          <div style={{display:'flex',gap:4}}>
            <button aria-pressed={state?.noMobs ?? false} style={{flex:1,minWidth:0,padding:'6px 2px',fontSize:'.65rem',cursor:'pointer',background:state?.noMobs?'#b89b12':'#333',color:'#fff',border:'1px solid #ffcc00',borderRadius:3}}
              onClick={()=>{if(stateRef.current)godSetNoMobs(stateRef.current,!stateRef.current.noMobs);rerender();}}>
              No Mobs
            </button>
            <button aria-pressed={state?.noBossSpawns ?? false} style={{flex:1,minWidth:0,padding:'6px 2px',fontSize:'.65rem',cursor:'pointer',background:state?.noBossSpawns?'#744395':'#333',color:'#fff',border:'1px solid #bb88ee',borderRadius:3}}
              onClick={()=>{if(stateRef.current)godSetNoBossSpawns(stateRef.current,!stateRef.current.noBossSpawns);rerender();}}>
              No Boss
            </button>
            {state?.sun && <button type="button" aria-pressed={state.sun.noWisps} title="Clear Cinder Wisps and stop every wisp spawn without affecting aliens"
              style={{flex:1,minWidth:0,padding:'6px 2px',fontSize:'.65rem',cursor:'pointer',background:state.sun.noWisps?'#b86a32':'#333',color:'#fff',border:'1px solid #f5ad69',borderRadius:3}}
              onClick={() => {const current=stateRef.current;if(current?.sun)godSetNoWisps(current,!current.sun.noWisps);rerender();}}>No Wisps</button>}
          </div>


          {!trialInfo && <button type="button" disabled={phase!=='playing'||!!state?.constellationChoices.length}
            style={{background:'#352949',color:'#e8d6ff',border:'2px solid #b68ee9',padding:'7px',fontWeight:700,cursor:'pointer'}}
            onClick={() => {if(stateRef.current)openGodConstellations(stateRef.current);rerender();}}>Constellations</button>}
          <div className="rs-god-actions">
            {!trialInfo && <button type="button" disabled={phase !== 'playing' || !!state?.constellationChoices.length}
              style={{ cursor: phase === 'playing' ? 'pointer' : 'default', background: '#243148', color: '#bce2ff', border: '2px solid #72baff', opacity: phase === 'playing' ? 1 : 0.5 }}
              onClick={() => { if (stateRef.current) godAdvanceStage(stateRef.current); rerender(); }}>Stage +1</button>}
            <button type="button" aria-label="Reset game" onClick={handleRestart}
              style={{ background: '#422936', color: '#ffd3dc', border: '2px solid #e895ac', cursor: 'pointer' }}>RESET</button>
          </div>

          {!trialInfo && <div className="rs-event-controls">
            {(Object.keys(AMBIENT_EVENTS) as AmbientEventKind[]).map(kind => <button key={kind} type="button"
              aria-label={'Create ' + AMBIENT_EVENTS[kind].name}
              style={{ color: AMBIENT_EVENTS[kind].color, borderColor: AMBIENT_EVENTS[kind].color }}
              disabled={phase !== 'playing' || !!state?.ambientEvents.warning || !!state?.ambientEvents.active || (state?.ambientEvents.rewardTicks ?? 0) > 0}
              onClick={() => { if (stateRef.current) triggerAmbientEvent(stateRef.current, kind); rerender(); }}>
              {AMBIENT_EVENTS[kind].name}
            </button>)}
          </div>}

          {!trialInfo && <>
          <div style={{color:'#cbd6ef',fontSize:'.65rem',fontWeight:700,textAlign:'center'}}>BOSSES</div>
          <div className="rs-boss-controls" role="group" aria-label="Summon bosses" style={{ display:'grid',gridTemplateColumns:'repeat(5, 40px)',gap:4,justifyContent:'center' }}>
            {BOSS_TYPES.map(type => <BossSpawnButton key={type} type={type} onSpawn={() => {
              if(stateRef.current)godSpawnBoss(stateRef.current,type);rerender();
            }} />)}
          </div>
          <div style={{color:'#cbd6ef',fontSize:'.65rem',fontWeight:700,textAlign:'center'}}>CELESTIAL SKILLS</div>
          <div className="rs-celestial-controls" role="group" aria-label="Grant celestial skills"
            style={{display:'grid',gridTemplateColumns:'repeat(5, 40px)',gap:4,justifyContent:'center'}}>
            {state && (Object.keys(SPECIAL_SKILLS) as (keyof typeof SPECIAL_SKILLS)[]).map(kind => <CelestialSkillButton
              key={kind} kind={kind} state={state} selected={state.specialSkill===kind} onGrant={() => {
                const current=stateRef.current;if(current)current.specialSkill=kind;rerender();
              }} />)}
          </div>
          </>}
        </div>
      )}


        {/* Teleport overlay */}
        {phase === 'teleporting' && state && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,10,0.82)', zIndex: 100,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px',
            }}
            onClick={(e) => {
              if (e.target !== e.currentTarget) return;
              if (Date.now() - teleportOpenedAtRef.current < 400) return; // ignore the opening tap's ghost click (buttons below share this guard)
              cancelTeleport(state); playUiSfx('close'); rerender();
            }}
          >
            <p style={{
              fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: 'var(--cyan)',
              textShadow: '0 0 16px var(--cyan)', letterSpacing: '0.12em'
            }}>
              TELEPORT — SELECT CHAMBER
            </p>
            <TeleportMinimap state={state} onPick={ch => { if (Date.now() - teleportOpenedAtRef.current < 400) return; doTeleport(state, ch); rerender(); }} />
            <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '6px 14px' }}
              onClick={() => { if (Date.now() - teleportOpenedAtRef.current < 400) return; cancelTeleport(state); playUiSfx('close'); rerender(); }}>
              ESC / X — STAY
            </button>
          </div>
        )}

        {state?.tutorial && <TutorialPanel tutorial={state.tutorial} />}
        {phase === 'laserTarget' && state && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,4,16,0.84)', zIndex: 100, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '20px' }}
            onClick={(event) => { if (event.target !== event.currentTarget) return; cancelSkyLaser(state); playUiSfx('close'); rerender(); }}>
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: state.gaia ? '#ffe680' : '#9fe4ff', textShadow: `0 0 16px ${state.gaia ? '#ffd36a' : '#59c8ff'}`, letterSpacing: '0.12em' }}>
              {state.gaia ? 'SUNFIRE' : 'TRIDENT'} — CHOOSE A ROOM
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#b9bdd6', marginTop: -10 }}>{state.gaia ? 'It burns 3s later. Get yourself and Ruby out of that room!' : 'It strikes 3s later. Get out of that room!'}</p>
            <TeleportMinimap state={state} available={[0, 1, 2, 3]} onPick={ch => { if (chooseSkyLaser(state, ch)) { playUiSfx('ascension'); rerender(); } }} />
            <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '6px 14px' }}
              onClick={() => { cancelSkyLaser(state); playUiSfx('close'); rerender(); }}>ESC / C — CANCEL</button>
          </div>
        )}

        {prayerSpawnWarning && (
          <div role="alert" className="rs-prayer-warning" style={{ position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)',
            zIndex: 90, maxWidth: 'calc(100% - 24px)', width: 'max-content', boxSizing: 'border-box', padding: '10px 16px',
            background: '#201b0af5', border: '2px solid #ffe477', boxShadow: '0 0 24px #d8ac3244', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ color: '#cbb775', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{BOSS_NAMES.blind_prayer} SPAWNED</div>
            <div style={{ color: '#fff0ac', fontFamily: 'var(--font-pixel)', fontSize: 16, lineHeight: 1.8 }}>MOVEMENT REVERSED</div>
          </div>
        )}

        {phase === 'playing' && !prayerSpawnWarning && (state?.ascensionBannerTicks ?? 0) > 0 && (
          <div role="status" style={{ position: 'absolute', top: '72px', left: '50%', transform: 'translateX(-50%)',
            width: 'max-content', maxWidth: 'calc(100% - 24px)', boxSizing: 'border-box', textAlign: 'center', pointerEvents: 'none',
            padding: '14px 22px', background: 'rgba(12,9,22,.94)', border: '2px solid #d7a5ff', boxShadow: '0 0 24px rgba(180,100,255,.3)', borderRadius: '2px' }}>
            <div style={{ fontFamily: 'var(--font-pixel)', color: '#ebcbff', fontSize: '1rem', lineHeight: 1.8 }}>ASCENSION</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: '#e5d4f4', fontSize: '0.75rem', lineHeight: 1.7 }}>
              10 BOSSES DEFEATED<br />Celestial skills unlocked · Press F to use<br />Meteors now deal 45% damage to bosses
            </div>
          </div>
        )}

        {phase === 'playing' && !prayerSpawnWarning && (state?.bossSpawnTicks ?? 0) > 0 && (state?.ascensionBannerTicks ?? 0) <= 0 && (
          <div role="status" style={{
            position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)',
            width: 'max-content', maxWidth: 'calc(100% - 24px)', boxSizing: 'border-box',
            background: 'rgba(5,5,10,0.92)', border: `2px solid ${state?.bossSpawnColor}`,
            boxShadow: `0 0 28px ${state?.bossSpawnColor}88`, borderRadius: '2px', padding: '8px 24px',
            fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: state?.bossSpawnColor,
            textAlign: 'center', lineHeight: 1.6, pointerEvents: 'none',
          }}>
            {state?.bossSpawnName}{(Object.values(BOSS_NAMES) as string[]).includes(state?.bossSpawnName ?? '') ? ' SPAWNED' : ''}
          </div>
        )}

        {phase === 'playing' && (state?.enemies.find(e => e.type === 'fiery_king' && e.hp > 0)?.king?.arenaWindupTicks ?? 0) > 0 && (
          <div role="status" style={{
            position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)',
            width: 'max-content', maxWidth: 'calc(100% - 24px)', boxSizing: 'border-box',
            background: 'rgba(25,0,0,0.92)', border: '2px solid #ff6622',
            borderRadius: '2px', padding: '8px 16px', textAlign: 'center',
            fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', lineHeight: 1.6,
            color: '#ffbb66', pointerEvents: 'none',
          }}>
            KING’S WRATH — HIT THE KING!
          </div>
        )}

        {/* Boss warning banner */}
        {phase === 'playing' && (state?.bossWarningTicks ?? 0) > 0 && (
          <div style={{
            position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(20,0,0,0.92)', border: '2px solid #cc0022',
            boxShadow: '0 0 28px #cc002288',
            borderRadius: '2px', padding: '8px 24px',
            display: 'flex', alignItems: 'center', gap: '14px',
            animation: 'pulseGlow 0.35s ease-in-out infinite',
            pointerEvents: 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: '#ff2244' }}>
              ⚠ BOSS APPROACHING
            </span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: '#ffcc00' }}>
              {Math.ceil((state?.bossWarningTicks ?? 0) / 60)}s
            </span>
          </div>
        )}

        {phase === 'playing' && (state?.meteoriteWarning ?? -1) < 0 && state && !state.tutorial && (
          <div style={{
            position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(5,0,0,0.7)', border: '1px solid #884400',
            borderRadius: '2px', padding: '5px 14px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            pointerEvents: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: '#cc7733' }}>
                ☄ NEXT: {CHAMBER_LABELS[METEOR_CLOCKWISE_ORDER[state.meteoriteChamberSeq % 4]]}
              </span>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: '#996633' }}>
                {Math.max(0, Math.ceil(state.meteoriteTimer / 60))}s
              </span>
            </div>
            <div style={{
              width: '100px', height: '4px', borderRadius: '2px',
              background: 'rgba(255,255,255,0.12)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, (state.meteoriteTimer / METEORITE_CYCLE) * 100))}%`,
                background: '#cc7733', transition: 'width 0.1s linear',
              }} />
            </div>
          </div>
        )}

        {phase === 'playing' && (state?.meteoriteWarning ?? -1) >= 0 && (
          <div style={{
            position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(5,0,0,0.9)', border: '2px solid #ff4400',
            boxShadow: '0 0 20px #ff440088',
            borderRadius: '2px', padding: '8px 20px',
            display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'pulseGlow 0.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', color: '#ff4400' }}>
              ☄ METEORITE — {CHAMBER_LABELS[state!.meteoriteWarning]} CHAMBER
            </span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', color: '#ffaa00' }}>
              {Math.ceil((state?.meteoriteStrikeIn ?? 0) / 60)}s
            </span>
          </div>
        )}

        {state && (state.ambientEvents.warning || state.ambientEvents.active) && <div className="rs-event-banner" role="status"
          style={{ top: prayerSpawnWarning ? 148 : (state.ascensionBannerTicks > 0 ? 212 : state.bossSpawnTicks > 0 ? 140 : 64), color: state.ambientEvents.rewardTicks > 0 ? '#ffe18c' : AMBIENT_EVENTS[(state.ambientEvents.warning || state.ambientEvents.active)!.kind].color,
            borderColor: state.ambientEvents.rewardTicks > 0 ? '#ffe18c' : AMBIENT_EVENTS[(state.ambientEvents.warning || state.ambientEvents.active)!.kind].color }}>
          {state.ambientEvents.rewardTicks > 0 ? <strong>STELLAR SHARD COLLECTED</strong> : (() => {
            const event = state.ambientEvents.warning || state.ambientEvents.active!;
            if (state.ambientEvents.warning) return <strong>INCOMING: {AMBIENT_EVENTS[event.kind].name} {Math.ceil(event.ticks / 60)}s</strong>;
            const location = (event.kind === 'shootingStar' || event.kind === 'supernova') ? ' · ' + CHAMBER_LABELS[chamberOfTile(event.points[0].x, event.points[0].y)] : '';
            const nova = state.ambientEvents.active;
            if (nova?.kind === 'supernova' && nova.chargeTicks !== undefined) return <strong>SUPERNOVA · {nova.blastTicks !== undefined ? 'DETONATED' : 'CHARGING · ' + Math.ceil(nova.chargeTicks / 60) + 's'}</strong>;
            return <><strong>{state.ambientEvents.warning ? 'INCOMING · ' : ''}{state.ambientEvents.active?.kind === 'shootingStar' && state.ambientEvents.active.age >= STAR_FALL_TICKS ? 'STELLAR SHARD' : AMBIENT_EVENTS[event.kind].name}{location} · {Math.ceil(event.ticks / 60)}s</strong>
              </>;
          })()}
        </div>}

        {/* Game over */}
        {phase === 'won' && trialInfo && (
          <VictoryScreen title={`${BOSS_NAMES[trialInfo.boss]} DEFEATED`} world={trialInfo.name}
            color={SPECIAL_SKILLS[BOSS_SKILL_REWARDS[trialInfo.boss]].color === '#303036' ? '#bcbccd' : SPECIAL_SKILLS[BOSS_SKILL_REWARDS[trialInfo.boss]].color}
            onPlayAgain={handleRestart} onStarMap={() => { playUiSfx('back'); router.push('/ruby-star/challenge'); }} />
        )}

        {phase === 'lost' && (
          <div className="game-over-overlay rs-game-over">
            <section className="rs-end-panel" role="dialog" aria-modal="true" aria-labelledby="rs-end-title">
              <h2 id="rs-end-title">{trialInfo ? 'GAME OVER' : 'RUBY STAR'}</h2>
              {!trialInfo && <div className="rs-end-body">
                <div className="rs-end-stage"><span>STAGE</span><strong>{state?.bossesKilled ?? 0}</strong></div>
                <dl className="rs-end-stats">
                  <div><dt>TIME</dt><dd>{timeSurvived}<small>s</small></dd></div>
                  <div><dt>KILLS</dt><dd>{state?.killScore ?? 0}</dd></div>
                  <div><dt>PLAYER HP</dt><dd>{Math.round((state?.playerHP ?? 0) * 10) / 10}<small> / {PLAYER_MAX_HP}</small></dd></div>
                  <div><dt>RUBY HP</dt><dd>{Math.round((state?.rubyHP ?? 0) * 10) / 10}<small> / {RUBY_MAX_HP}</small></dd></div>
                </dl>
              </div>}
              <button type="button" autoFocus onClick={handleRestart} className="rs-end-restart">PLAY AGAIN</button>
              {trialInfo && <button type="button" onClick={() => { playUiSfx('back'); router.push('/ruby-star'); }} className="rs-end-restart" style={{ marginTop: 8 }}>BACK TO LOBBY</button>}
            </section>
          </div>
        )}
      </div>

      {/* ── Mobile touch controls — joystick (movement) + ability buttons ──────
          CSS-hidden whenever the device has a real mouse (hover:hover + pointer:fine),
          so desktop input/behavior is completely unchanged. Siblings of the canvas
          wrapper (not descendants), so they never interfere with its own touch/mouse
          handlers — a touch starting here simply never bubbles into that div. */}
      {phase === 'playing' && (
        <>
          <div
            className="rs-touch-controls"
            style={{
              position: 'fixed', left: '30px', bottom: '30px', zIndex: 60,
              width: '160px', height: '160px', borderRadius: '50%',
              border: '2px solid rgba(0,212,255,0.35)', background: 'rgba(0,20,30,0.35)',
              touchAction: 'none', alignItems: 'center', justifyContent: 'center',
            }}
            onPointerDown={handleJoyPointerDown}
            onPointerMove={handleJoyPointerMove}
            onPointerUp={handleJoyPointerUp}
            onPointerCancel={handleJoyPointerUp}
          >
            <div style={{
              position: 'absolute',
              left: `calc(50% + ${joyThumb.x}px - 35px)`,
              top: `calc(50% + ${joyThumb.y}px - 35px)`,
              width: '70px', height: '70px', borderRadius: '50%',
              background: 'rgba(0,212,255,0.35)', border: '2px solid rgba(0,212,255,0.8)',
              boxShadow: '0 0 12px rgba(0,212,255,0.5)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Ability cluster — scattered arc layout (mirrors a Genshin-style mobile HUD):
              LASER in the center, BULLET low-and-left of it, BOMB above-right of that,
              RUBY to bullet's left, and a small SPEED/dash button in the very corner.
              Each button grays out while its ability is on cooldown. */}
          <TouchAbilityButton
            label="LASER" color={(state?.laserCooldown ?? 0) > 0 ? COOLDOWN_GRAY : '#ffcc44'} size={64}
            onDown={handleTouchLaserDown} onUp={handleTouchLaserUp}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '68px', bottom: '80px', zIndex: 60 }}
          />
          <TouchAbilityButton
            label="BULLET" color={(state?.bulletCooldown ?? 0) > 0 ? COOLDOWN_GRAY : '#ff9944'} size={64}
            onDown={handleTouchBullet}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '96px', bottom: '16px', zIndex: 60 }}
          />
          <TouchAbilityButton
            label="BOMB" color={(!state?.bomb && (state?.bombCooldown ?? 0) > 0) ? COOLDOWN_GRAY : BOMB_COLOR} size={64}
            onDown={handleTouchBomb}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '8px', bottom: '110px', zIndex: 60 }}
          />
          {state?.specialSkill && <TouchAbilityButton label="SPECIAL" color={SPECIAL_SKILLS[state.specialSkill].color} size={60}
            onDown={() => { if (stateRef.current) useSpecialSkill(stateRef.current); rerender(); }} className="rs-touch-controls"
            style={{ position: 'fixed', right: '176px', bottom: '96px', zIndex: 61 }} />}
          {/* RUBY — carry/place toggle, identical to E */}
          <TouchAbilityButton
            label="RUBY" color={RUBY_COLOR} size={60}
            onDown={handleTouchRuby}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '176px', bottom: '16px', zIndex: 60 }}
          />
          {/* HEAL — always heals, including on teleport pads. */}
          <TouchAbilityButton
            label="HEAL" color="#ff88aa" size={60}
            onDown={handleTouchHeal}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '252px', bottom: '16px', zIndex: 60 }}
          />
          <TouchAbilityButton
            label="TP" color={state&&isNearTeleportPad(state)?'#8ad7ef':COOLDOWN_GRAY} size={48}
            onDown={handleTouchTeleport}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '252px', bottom: '92px', zIndex: 60 }}
          />
          <TouchAbilityButton
            label="SPD" color={(state?.speedCooldown ?? 0) > 0 ? COOLDOWN_GRAY : '#ffee44'} size={48}
            onDown={handleTouchSpeed}
            className="rs-touch-controls"
            style={{ position: 'fixed', right: '16px', bottom: '16px', zIndex: 61 }}
          />
        </>
      )}

    </div>
  );
}
