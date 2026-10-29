'use client';

import { useEffect, useRef } from 'react';
import type { Enemy } from './engine';
import type { EnemyType } from './constants';
import { NEPTUNE_BOMB_FUSE } from './constants';
import { drawNeptuneUnit, drawWaterBurst } from './neptune-art';

// Neptune challenge rule sheet: only what is new on this map, one small animated picture and one line per card.

type Paint = (ctx: CanvasRenderingContext2D, tick: number) => void;
const W = 200, H = 120;

function unit(type: EnemyType, id: number, extra: Partial<Enemy> = {}): Enemy {
  return { id, type, tileX: 0, tileY: 0, targetTileX: 1, targetTileY: 0, hp: 8, maxHp: 8, flashTicks: 0, shootTicks: 0, windupTicks: 0, ...extra } as Enemy;
}

function player(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = '#e5e05a'; ctx.shadowBlur = 4; ctx.fillStyle = '#e5e05a'; ctx.fillRect(-12, -12, 24, 24); ctx.shadowBlur = 0;
  ctx.fillStyle = '#6d6a2c'; ctx.fillRect(-8, -8, 16, 16); ctx.fillStyle = '#48c8ff'; ctx.fillRect(-6, 0, 12, 5);
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(text, x, y);
}

function cross(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(x - 2, y - 6, 4, 12); ctx.fillRect(x - 6, y - 2, 12, 4);
}

export default function NeptuneGuide({ drawBoss }: { drawBoss: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, diving: boolean) => void }) {
  const cards: { title: string; color: string; text: string; paint: Paint }[] = [
    { title: 'THREE PHASES', color: '#6fb6ff', text: 'Her bar has 3 phases, emptying right to left. Ticks mark her dives.', paint: (ctx, t) => {
      drawBoss(ctx, 100, 50, t, false);
      for (let i = 0; i < 3; i++) {
        const x = 22 + i * 54; ctx.fillStyle = '#0a1422'; ctx.fillRect(x, 96, 50, 10);
        ctx.fillStyle = i === 2 ? '#3998d6' : '#6fb6ff'; ctx.fillRect(x + 1, 97, i === 2 ? 30 : 48, 8);
      }
      ctx.fillStyle = '#ffffff'; for (const f of [.25, .5, .75]) ctx.fillRect(130 + f * 50, 93, 2, 16);
    } },
    { title: 'DIVE & CLONES', color: '#6fc7ff', text: 'At each tick she dives and hides water clones around the station. Break them all.', paint: (ctx, t) => {
      drawBoss(ctx, 46, 62, t, true);
      [[112, 40], [160, 76]].forEach(([x, y], i) => drawNeptuneUnit(ctx, unit('water_clone', i + 2), x, y, t));
    } },
    { title: 'MISSED CLONES', color: '#ff8a9a', text: 'Clones left when time runs out heal her. Hitting one pauses her healing.', paint: (ctx, t) => {
      drawNeptuneUnit(ctx, unit('water_clone', 4), 70, 66, t);
      const rise = (t % 60) / 60; ctx.globalAlpha = 1 - rise;
      cross(ctx, 140, 70 - rise * 30, '#7dffb0'); label(ctx, '+10%', 140, 100 - rise * 30, '#7dffb0'); ctx.globalAlpha = 1;
    } },
    { title: 'FINAL DIVE', color: '#d8f2ff', text: 'Her last dive drops 4 clones. Break them, then land the final hit.', paint: (ctx, t) => {
      [30, 77, 124, 171].forEach((x, i) => { ctx.save(); ctx.translate(x, 66 + (i % 2 ? 10 : -6)); ctx.scale(.75, .75); drawNeptuneUnit(ctx, unit('water_clone', 5 + i), 0, 0, t); ctx.restore(); });
    } },
    { title: 'FISH', color: '#59c8ff', text: 'Harmless swimmers. Blue heals you when hit, red hurts you.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(60, 54); ctx.scale(1.8, 1.8); drawNeptuneUnit(ctx, unit('fish_blue', 9), 0, 0, t); ctx.restore();
      ctx.save(); ctx.translate(140, 54); ctx.scale(1.8, 1.8); drawNeptuneUnit(ctx, unit('fish_red', 10), 0, 0, t); ctx.restore();
      label(ctx, '+HP', 60, 104, '#7dffb0'); label(ctx, '-HP', 140, 104, '#ff6a7a');
    } },
    { title: 'STINGER', color: '#3fd6b0', text: 'A fish-like alien. Its bite poisons you for a few seconds.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(100, 60); ctx.scale(1.8, 1.8); drawNeptuneUnit(ctx, unit('stinger', 11, { hp: 6, maxHp: 6 }), 0, 0, t); ctx.restore();
    } },
    { title: 'WATER BALL · PHASE 2+', color: '#7fd0ff', text: 'Pop it to hurt her, or get 4 tiles away before it bursts.', paint: (ctx, t) => {
      const cycle = t % 150;
      if (cycle < 122) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); ctx.translate(100, 60); ctx.scale(1.4, 1.4);
        drawNeptuneUnit(ctx, unit('water_bomb', 12, { windupTicks: NEPTUNE_BOMB_FUSE * (1 - cycle / 122), hp: 6, maxHp: 6 }), 0, 0, t); ctx.restore();
      } else { ctx.save(); ctx.translate(100, 60); ctx.scale(.45, .45); drawWaterBurst(ctx, 0, 0, 192, 28 - (cycle - 122)); ctx.restore(); }
    } },
    { title: 'TIDES', color: '#59c8ff', text: 'Currents push you along. Swim with them. The minimap shows tide rooms.', paint: (ctx, t) => {
      ctx.fillStyle = 'rgba(89,200,255,.16)'; ctx.fillRect(10, 14, 180, 92);
      ctx.fillStyle = 'rgba(216,244,255,.8)';
      for (let i = 0; i < 4; i++) {
        const x = 14 + ((i * 50 + t * .8) % 180);
        for (let k = 0; k < 5; k++) { ctx.fillRect(x - k * 3, 58 - k * 3, 3, 3); ctx.fillRect(x - k * 3, 58 + k * 3, 3, 3); }
      }
      player(ctx, 40 + ((t * .5) % 120), 60);
    } },
    { title: 'PHASE 3 · MAELSTROM', color: '#9a7dff', text: 'Her hits heal her, and two rooms always have tides.', paint: (ctx, t) => {
      drawBoss(ctx, 100, 54, t, false);
      const rise = (t % 50) / 50; ctx.globalAlpha = 1 - rise; cross(ctx, 150, 40 - rise * 20, '#7dffb0'); cross(ctx, 52, 50 - rise * 20, '#7dffb0'); ctx.globalAlpha = 1;
    } },
    { title: 'SKY LASER', color: '#a0ecff', text: 'Healing fills the laser bar. Press C and pick a room to strike it like a meteor.', paint: (ctx, t) => {
      ctx.fillStyle = '#0a1422'; ctx.fillRect(14, 96, 70, 10);
      const fill = Math.min(1, (t % 120) / 90); ctx.fillStyle = fill >= 1 ? '#e8fbff' : '#59c8ff'; ctx.fillRect(15, 97, 68 * fill, 8);
      label(ctx, 'C', 50, 84, '#ffffff');
      ctx.strokeStyle = '#59c8ff'; ctx.lineWidth = 2; ctx.strokeRect(112, 50, 70, 56);
      if (fill >= 1) {
        const beam = 30 * (1 - ((t % 120) - 90) / 30);
        ctx.fillStyle = 'rgba(159,228,255,.7)'; ctx.fillRect(147 - beam / 2, 0, beam, 78); ctx.fillStyle = '#ffffff'; ctx.fillRect(147 - beam / 6, 0, beam / 3, 78);
      } else if (Math.floor(t / 6) % 2) { ctx.fillStyle = 'rgba(160,236,255,.35)'; ctx.fillRect(113, 51, 68, 54); }
    } },
  ];

  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let frame = 0, raf = 0;
    const loop = () => {
      frame++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.save(); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0b1d30'; ctx.fillRect(0, 0, W, H);
        cards[i].paint(ctx, frame); ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  return <div className="rs-guide">
    <div className="rs-guide-nav"><h3>NEPTUNE CHALLENGE</h3></div>
    <p className="rs-guide-intro">Defeat Neptune to win. Only what is new on this map.</p>
    <div className="rs-nep-grid">
      {cards.map((card, i) => <article key={card.title} className="rs-nep-card" style={{ borderColor: card.color + '66' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={W} height={H} aria-hidden="true" />
        <h5 style={{ color: card.color }}>{card.title}</h5>
        <p>{card.text}</p>
      </article>)}
    </div>
  </div>;
}
