'use client';

import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import type { Enemy } from './engine';
import { drawMoonUnit } from './moon-art';

// Moon challenge rule sheet: only what is new on this map, one small animated picture and one line per card.

type Paint = (ctx: CanvasRenderingContext2D, tick: number) => void;
type DrawQueen = (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, disguised: boolean) => void;
const W = 200, H = 120;

function player(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = '#ffe14a'; ctx.shadowBlur = 4; ctx.fillStyle = '#fff07a'; ctx.fillRect(-10, -10, 20, 20); ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8c93a'; ctx.fillRect(-6, -6, 12, 12); ctx.fillStyle = '#48c8ff'; ctx.fillRect(-5, 0, 10, 4);
  ctx.restore();
}
function shard(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, alpha: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#8f5fe0'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(0, -4); ctx.lineTo(-6, 0); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4eaff'; ctx.fillRect(-2, -1, 8, 2); ctx.restore();
}

export default function MoonGuide({ drawQueen, drawCelestial }: { drawQueen: DrawQueen; drawCelestial: CelestialGuidePainter }) {
  const cards: { title: string; color: string; text: string; paint: Paint }[] = [
    { title: 'HIDDEN QUEEN', color: '#dd88ff', text: 'She hides among illusions that look just like her. Hitting the real one heals you based on the damage you deal, once she jumps, and Ruby too if it is in the same chamber as you.', paint: (ctx, t) => {
      const shown = 1 + Math.min(3, Math.floor((t % 200) / 50));
      [[40, 60], [100, 44], [160, 64], [100, 92]].slice(0, shown).forEach(([x, y]) => drawQueen(ctx, x, y, t, true));
    } },
    { title: 'DECOY', color: '#cc88ff', text: 'Only the real Queen ignores your decoy. Her illusions take the bait.', paint: (ctx, t) => {
      const fire = t % 80 < 16;
      ctx.globalAlpha = .75; ctx.fillStyle = '#b278f3'; ctx.fillRect(88, 82, 22, 22); ctx.fillStyle = '#8fffe0'; ctx.fillRect(93, 90, 12, 4); ctx.globalAlpha = 1; // your Lunar Echo
      player(ctx, 172, 92);
      drawQueen(ctx, 40, 34, t, true); drawQueen(ctx, 156, 30, t, true);
      if (fire) { ctx.fillStyle = '#dd88ff'; ctx.fillRect(48, 44, 4, 4);
        ctx.strokeStyle = '#dd88ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(44, 42); ctx.lineTo(96, 88); ctx.moveTo(158, 42); ctx.lineTo(172, 84); ctx.stroke(); }
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#8a7aa8'; ctx.fillText('FAKE', 40, 64); ctx.fillStyle = '#f4eaff'; ctx.fillText('REAL', 132, 64);
    } },
    { title: 'REVEAL', color: '#ff9cf0', text: 'Just before she jumps, she shows her true self and takes more damage. She never jumps into your room.', paint: (ctx, t) => {
      const cycle = t % 160, revealed = cycle >= 90;
      drawQueen(ctx, 110, 60, t, !revealed);
      if (revealed && cycle < 110) { const k = (cycle - 90) / 20; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#f4eaff'; ctx.lineWidth = 3; ctx.strokeRect(110 - 20 - k * 20, 60 - 20 - k * 20, 40 + k * 40, 40 + k * 40); ctx.globalAlpha = 1; }
      player(ctx, 30, 60); if (revealed) { ctx.fillStyle = '#ffe14a'; ctx.fillRect(40, 58, 52, 4); }
    } },
    { title: 'SPECIAL SKILL (PRESS C)', color: '#a9e6ff', text: 'Moon Mark: tag the nearest Queen for a few seconds. If it is her, the mark follows her jump.', paint: (ctx, t) => {
      const cycle = t % 200, jumped = cycle >= 110, x = jumped ? 160 : 60, y = jumped ? 70 : 50;
      if (!jumped) drawQueen(ctx, x, y, t, true); else { drawQueen(ctx, 60, 50, t, true); drawQueen(ctx, x, y, t, true); }
      if (cycle > 20 && (cycle < 180 || Math.floor(t / 6) % 2 === 0)) {
        const mx = jumped ? x : 60, my = jumped ? y : 50; ctx.fillStyle = '#a9e6ff';
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.fillRect(mx + dx * 20 - (dx > 0 ? 6 : 0), my + dy * 20 - (dy > 0 ? 2 : 0), 6, 2); ctx.fillRect(mx + dx * 20 - (dx > 0 ? 2 : 0), my + dy * 20 - (dy > 0 ? 6 : 0), 2, 6); }
      }
      if (cycle < 30) { ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#e8fbff'; ctx.fillText('C', 100, 104); }
    } },
    { title: 'MIRROR MITE', color: '#c6b8ff', text: 'Fragile. Killing one heals you and shows two rooms on the map. She is in one of them.', paint: (ctx, t) => {
      const cycle = t % 120, x = 60 + Math.min(50, cycle * .8);
      if (cycle < 70) { ctx.save(); ctx.translate(x, 60); ctx.scale(1.4, 1.4); drawMoonUnit(ctx, { id: 1, type: 'mirror_mite', flashTicks: cycle > 62 ? 4 : 0, attackTimer: 30 } as Enemy, 0, 0, t); ctx.restore(); }
      player(ctx, 160, 60);
      if (cycle >= 70) { const rise = (cycle - 70) / 50; ctx.globalAlpha = 1 - rise; ctx.fillStyle = '#ff5a8a'; ctx.fillRect(157, 34 - rise * 18, 6, 16); ctx.fillRect(152, 39 - rise * 18, 16, 6); ctx.globalAlpha = 1; }
    } },
    { title: 'SHADE', color: '#9f86e0', text: 'Goes straight for Ruby. Guard it.', paint: (ctx, t) => {
      const x = 40 + (t % 120) * .7;
      ctx.save(); ctx.translate(x, 60); ctx.scale(1.3, 1.3); drawMoonUnit(ctx, { id: 3, type: 'moon_shade', flashTicks: 0, attackTimer: t % 120 > 100 ? 8 : 30 } as Enemy, 0, 0, t); ctx.restore();
      ctx.save(); ctx.translate(160, 62); ctx.shadowColor = '#ff4d7a'; ctx.shadowBlur = 5; ctx.fillStyle = '#e8326a'; ctx.fillRect(-11, -11, 22, 22); ctx.shadowBlur = 0;
      ctx.fillStyle = '#a8183f'; ctx.fillRect(-7, -7, 14, 14); ctx.fillStyle = '#ffd0dc'; ctx.fillRect(-9, -9, 5, 5); ctx.restore();
    } },
    { title: 'MIRRORS', color: '#e6dcff', text: 'You can walk through them, but they bounce your laser and bullets back into you.', paint: (ctx, t) => {
      for (let k = 0; k < 3; k++) { const y = 26 + k * 24; ctx.globalAlpha = .45; ctx.fillStyle = '#2c2450'; ctx.fillRect(118, y, 22, 22); ctx.globalAlpha = .4; ctx.fillStyle = '#8f86c8'; ctx.fillRect(121, y + 3, 16, 16); ctx.globalAlpha = .8; ctx.strokeStyle = '#e6dcff'; ctx.lineWidth = 2; ctx.strokeRect(119, y + 1, 20, 20); ctx.globalAlpha = 1; }
      player(ctx, 40, 62);
      const k = (t % 60) / 60;
      if (k < .5) { ctx.fillStyle = '#ffe14a'; ctx.fillRect(50, 60, 68 * k * 2, 4); }
      else { ctx.globalAlpha = 2 - k * 2; ctx.fillStyle = '#f4eaff'; ctx.fillRect(118 - 68 * (k - .5) * 2, 60, 12, 4); ctx.fillRect(122, 50, 4, 24); ctx.globalAlpha = 1; }
    } },
    { title: 'MIMIC', color: '#b6a8e8', text: 'Wanders, then poses as an illusion. It never attacks, and one hit breaks it.', paint: (ctx, t) => {
      const posing = t % 160 >= 80;
      if (posing) drawQueen(ctx, 70, 60, t, true);
      else { ctx.save(); ctx.translate(70, 64); ctx.scale(1.3, 1.3); drawMoonUnit(ctx, { id: 2, type: 'moon_mimic', flashTicks: 0, attackTimer: 30 } as Enemy, 0, 0, t); ctx.restore(); }
      drawQueen(ctx, 150, 60, t, true);
      if (t % 80 < 14) { ctx.strokeStyle = '#dd88ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(150, 70); ctx.lineTo(176, 104); ctx.stroke(); }
      player(ctx, 180, 104);
    } },
    { title: 'DARKNESS (PHASE 3)', color: '#8a7aa8', text: 'One room goes dark and it keeps moving. Enemies inside show only when hit.', paint: (ctx, t) => {
      ctx.fillStyle = '#030108'; ctx.fillRect(16, 12, 168, 96); ctx.strokeStyle = '#b98cff99'; ctx.lineWidth = 3; ctx.strokeRect(16, 12, 168, 96);
      player(ctx, 40, 60);
      const hit = t % 90 < 30;
      if (hit) { ctx.fillStyle = '#ffe14a'; ctx.fillRect(50, 58, 84, 4); drawQueen(ctx, 146, 60, t, true); }
    } },
    { title: 'SHATTER', color: '#b98cff', text: 'Destroyed illusions burst into crystal shards. Keep your distance.', paint: (ctx, t) => {
      const cycle = t % 120;
      if (cycle < 40) drawQueen(ctx, 100, 60, t, true);
      else for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .2, d = (cycle - 40) * 1.2; shard(ctx, 100 + Math.cos(a) * d, 60 + Math.sin(a) * d, a, 1 - (cycle - 40) / 80); }
      player(ctx, 176, 96);
    } },
  ];

  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let frame = 0, raf = 0;
    const loop = () => {
      frame++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.save(); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0b0717'; ctx.fillRect(0, 0, W, H);
        cards[i].paint(ctx, frame); ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  return <div className="rs-guide">
    <div className="rs-guide-nav"><h3>MOON CHALLENGE</h3></div>
    <p className="rs-guide-intro">Find and defeat the Shadow Queen to win.</p>
    <div className="rs-nep-grid">
      <CelestialSkillGuideCard name="Lunar Echo" description="Creates a decoy that draws enemy attacks. The real Queen ignores it, but her illusions take the bait." color="#c6a2f2" draw={drawCelestial} />

      {cards.map((card, i) => <article key={card.title} className="rs-nep-card" style={{ borderColor: card.color + '66' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={W} height={H} aria-hidden="true" />
        <h5 style={{ color: card.color }}>{card.title}</h5>
        <p>{card.text}</p>
      </article>)}
    </div>
  </div>;
}
