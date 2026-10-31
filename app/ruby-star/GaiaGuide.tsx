'use client';

import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import type { Enemy } from './engine';
import type { EnemyType } from './constants';
import { GAIA_POD_FUSE } from './constants';
import { drawGaiaUnit, drawGrowthTile, drawStone } from './gaia-art';

// Gaia challenge rule sheet: only what is new on this map, one small animated picture and one line per card.

type Paint = (ctx: CanvasRenderingContext2D, tick: number) => void;
const W = 200, H = 120;

function unit(type: EnemyType, id: number, extra: Partial<Enemy> = {}): Enemy {
  return { id, type, tileX: 0, tileY: 0, targetTileX: 1, targetTileY: 0, hp: 8, maxHp: 8, flashTicks: 0, shootTicks: 0, windupTicks: 0, ...extra } as Enemy;
}
function player(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = '#ffe14a'; ctx.shadowBlur = 4; ctx.fillStyle = '#fff07a'; ctx.fillRect(-10, -10, 20, 20); ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8c93a'; ctx.fillRect(-6, -6, 12, 12); ctx.fillStyle = '#48c8ff'; ctx.fillRect(-5, 0, 10, 4);
  ctx.restore();
}
function ruby(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y); ctx.shadowColor = '#ff4d7a'; ctx.shadowBlur = 5;
  // A square gem: crisp outer square, darker inset and a pale corner highlight.
  ctx.fillStyle = '#e8326a'; ctx.fillRect(-11, -11, 22, 22); ctx.shadowBlur = 0;
  ctx.fillStyle = '#a8183f'; ctx.fillRect(-7, -7, 14, 14);
  ctx.fillStyle = '#ff6a8f'; ctx.fillRect(-4, -4, 8, 8);
  ctx.fillStyle = '#ffd0dc'; ctx.fillRect(-9, -9, 5, 5); ctx.restore();
}
// A small patch of overgrowth tiles at half scale.
function tiles(ctx: CanvasRenderingContext2D, x0: number, y0: number, levels: number[][], tick: number) {
  ctx.save(); ctx.translate(x0, y0); ctx.scale(.5, .5);
  levels.forEach((row, y) => row.forEach((level, x) => { ctx.fillStyle = '#0c1a0e'; ctx.fillRect(x * 48, y * 48, 48, 48); if (level) drawGrowthTile(ctx, level, x * 48, y * 48, x, y, tick); }));
  ctx.restore();
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(text, x, y);
}

export default function GaiaGuide({ drawBoss, drawCelestial }: { drawCelestial: CelestialGuidePainter; drawBoss: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) => void }) {
  const cards: { title: string; color: string; text: string; paint: Paint }[] = [
    { title: 'OVERGROWTH', color: '#8fdc4a', text: 'Vines slow you and heal the boss. Shoot them away.', paint: (ctx, t) => {
      const cut = Math.floor((t % 120) / 20);
      tiles(ctx, 4, 24, [[1, 2, 2, 3, 3, 2, 2, 1].map((l, x) => x < cut + 2 && x > 0 ? 0 : l), [2, 3, 3, 2, 2, 3, 2, 2], [1, 2, 2, 2, 3, 2, 1, 1]], t);
      player(ctx, 16, 36); ctx.fillStyle = '#ffe14a'; ctx.fillRect(26, 34, 30 + cut * 24, 4);
    } },
    { title: 'SPECIAL SKILL (PRESS C)', color: '#ffd36a', text: 'Sunfire: clearing vines charges it. Press to damage everything nearby and burn vines, or once fully charged, pick a room for a bigger hit.', paint: (ctx, t) => {
      const fill = Math.min(1, (t % 160) / 120);
      ctx.fillStyle = '#1a140a'; ctx.fillRect(14, 98, 72, 10); ctx.fillStyle = fill >= 1 ? '#fff3b8' : '#e0a83a'; ctx.fillRect(15, 99, 70 * fill, 8);
      player(ctx, 140, 58);
      const burst = fill >= 1 ? ((t % 160) - 120) / 40 : 0;
      if (burst > 0) { const half = 10 + burst * 50; ctx.globalAlpha = 1 - burst; ctx.strokeStyle = '#fff3b8'; ctx.lineWidth = 6; ctx.strokeRect(140 - half, 58 - half, half * 2, half * 2); ctx.globalAlpha = 1; }
      label(ctx, 'C', 50, 90, '#fff3b8');
    } },
    { title: 'SUNSTONES', color: '#ffd36a', text: 'Bait the boss field onto a gold stone. It burns away and hurts the boss.', paint: (ctx, t) => {
      const phase = t % 120;
      drawBoss(ctx, 40, 62, t);
      drawStone(ctx, 140, 62, phase < 70, 0, t);
      if (phase < 70) { ctx.globalAlpha = .25 + .2 * Math.sin(t * .3); ctx.fillStyle = '#7fd35a'; ctx.fillRect(112, 34, 56, 56); ctx.globalAlpha = 1; }
      else if (phase < 90) { ctx.globalAlpha = (90 - phase) / 20; ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(140, 62); ctx.lineTo(48, 62); ctx.stroke(); ctx.globalAlpha = 1; }
    } },
    { title: 'RUBY WARD', color: '#ff8aa8', text: "Ruby keeps ground clean. Don't let vines surround it.", paint: (ctx, t) => {
      const ring = Math.min(7, Math.floor((t % 180) / 20));
      const grid = Array.from({ length: 5 }, (_, y) => Array.from({ length: 7 }, (_, x) => (x === 0 || x === 6 || y === 0 || y === 4) && (x + y * 7) % 8 < ring + 1 ? 2 : 0));
      tiles(ctx, 16, 0, grid, t);
      ruby(ctx, 100, 60);
      if (ring >= 6) { ctx.globalAlpha = .5 + .5 * Math.sin(t * .3); ctx.strokeStyle = '#ff3b4f'; ctx.lineWidth = 4; ctx.strokeRect(18, 2, 164, 116); ctx.globalAlpha = 1; }
    } },
    { title: 'SEED PODS', color: '#c6e86a', text: 'Break them before they burst into thicket.', paint: (ctx, t) => {
      const cycle = t % 200;
      if (cycle < 160) { ctx.save(); ctx.translate(100, 70); ctx.scale(1.6, 1.6); drawGaiaUnit(ctx, unit('seed_pod', 1, { hp: 6, maxHp: 6, windupTicks: GAIA_POD_FUSE * (1 - cycle / 160) }), 0, 0, t); ctx.restore(); }
      else tiles(ctx, 64, 24, [[0, 3, 3, 0], [3, 3, 3, 3], [0, 3, 3, 0]], t);
    } },
    { title: 'BLOSSOMS', color: '#ff8fc8', text: 'They heal the boss. Destroying one hurts the boss and heals you.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(70, 70); ctx.scale(1.4, 1.4); drawGaiaUnit(ctx, unit('blossom', 2, { hp: 12, maxHp: 12, shootTicks: t % 60 < 12 ? 12 - t % 60 : 0 }), 0, 0, t); ctx.restore();
      player(ctx, 160, 64);
      const u = (t % 60) / 60; ctx.fillStyle = '#ffb7dc'; ctx.fillRect(80 + u * 74, 56, 8, 8);
    } },
    { title: 'ROOT SNARE', color: '#ff6a7a', text: 'Step off the red crack.', paint: (ctx, t) => {
      const cycle = t % 120;
      ctx.globalAlpha = cycle < 60 ? .6 + .4 * Math.sin(t * .4) : .3; ctx.fillStyle = '#ff4d5a';
      for (let k = 0; k < 6; k++) ctx.fillRect(76 + k * 8, 62 + (k % 2 ? 6 : 0), 8, 4);
      ctx.globalAlpha = 1;
      player(ctx, cycle < 50 ? 100 : 100 + Math.min(50, (cycle - 50) * 2), 64);
    } },
    { title: 'PHASE 3', color: '#e0c44a', text: 'Two fields at once, and Sunstones keep hopping around.', paint: (ctx, t) => {
      const pulse = .25 + .2 * Math.sin(t * .3);
      ctx.globalAlpha = pulse; ctx.fillStyle = '#b5bd50'; ctx.fillRect(40, 34, 52, 52); ctx.fillRect(96, 34, 52, 52); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffd68b'; ctx.lineWidth = 2; ctx.strokeRect(40, 34, 52, 52); ctx.strokeRect(96, 34, 52, 52);
      player(ctx, 66, 60);
      drawStone(ctx, 178 - ((t % 120) / 120) * 12, 60, true, 0, t);
    } },
    { title: 'LIFEBLOOM', color: '#9fffc8', text: 'Break it to heal you and Ruby.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(70, 70); ctx.scale(1.5, 1.5); drawGaiaUnit(ctx, unit('lifebloom', 6, { hp: 1, maxHp: 1, windupTicks: 900 }), 0, 0, t); ctx.restore();
      ruby(ctx, 150, 66);
      const rise = (t % 60) / 60; ctx.globalAlpha = 1 - rise; ctx.fillStyle = '#7dffb0'; ctx.fillRect(148, 40 - rise * 20, 4, 12); ctx.fillRect(144, 44 - rise * 20, 12, 4); ctx.globalAlpha = 1;
    } },
    { title: 'POLLEN', color: '#f2d64a', text: 'Yellow haze slows you and shortens your laser.', paint: (ctx, t) => {
      ctx.globalAlpha = .18; ctx.fillStyle = '#f2d64a'; ctx.fillRect(0, 0, W, H);
      for (let k = 0; k < 24; k++) {
        const x = (k * 37 + t * (.4 + (k % 3) * .2)) % W, y = (k * 53 + Math.sin(t * .03 + k) * 10 + H) % H;
        ctx.globalAlpha = .75; ctx.fillStyle = k % 4 ? '#ffe680' : '#fff8cc'; ctx.fillRect(Math.round(x), Math.round(y), 4, 4);
      }
      ctx.globalAlpha = 1; player(ctx, 40, 60);
      const reach = 60 + 20 * Math.sin(t * .05); // the short beam stops early
      ctx.fillStyle = '#ffe14a'; ctx.fillRect(50, 58, reach, 4);
      ctx.globalAlpha = .25; ctx.fillRect(50 + reach, 58, 140 - reach, 4); ctx.globalAlpha = 1;
    } },
    { title: 'RAGECAP', color: '#ff5a4a', text: 'Fast. Its hit knocks you back, and it spreads vines.', paint: (ctx, t) => {
      const x = 40 + (t * 1.2) % 90;
      tiles(ctx, 0, 76, [[0, 0, 0, 0, 0, 0, 0, 0].map((_, k) => k * 24 + 12 < x - 10 ? 2 : 0)], t);
      ctx.save(); ctx.translate(x, 60); ctx.scale(1.4, 1.4); drawGaiaUnit(ctx, unit('angry_mushroom', 5, { hp: 8, maxHp: 8 }), 0, 0, t); ctx.restore();
      player(ctx, 170, 60);
    } },
    { title: 'SPORELING · VINE CRAWLER', color: '#b9a8ff', text: 'Spores slow you. Crawlers spread vines.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(60, 64); ctx.scale(1.6, 1.6); drawGaiaUnit(ctx, unit('sporeling', 3, { hp: 5, maxHp: 5 }), 0, 0, t); ctx.restore();
      ctx.save(); ctx.translate(145, 66); ctx.scale(1.4, 1.4); drawGaiaUnit(ctx, unit('vine_crawler', 4), 0, 0, t); ctx.restore();
    } },
  ];

  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let frame = 0, raf = 0;
    const loop = () => {
      frame++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.save(); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0c1a10'; ctx.fillRect(0, 0, W, H);
        cards[i].paint(ctx, frame); ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  return <div className="rs-guide">
    <div className="rs-guide-nav"><h3>GAIA CHALLENGE</h3></div>
    <p className="rs-guide-intro">Defeat the Thorn Weaver to win.</p>
    <div className="rs-nep-grid">
      <CelestialSkillGuideCard name="Gaia’s Roots" description="Clears vines and prevents regrowth in its field while slowing and damaging enemies." color="#a5de65" draw={drawCelestial} />

      {cards.map((card, i) => <article key={card.title} className="rs-nep-card" style={{ borderColor: card.color + '66' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={W} height={H} aria-hidden="true" />
        <h5 style={{ color: card.color }}>{card.title}</h5>
        <p>{card.text}</p>
      </article>)}
    </div>
  </div>;
}
