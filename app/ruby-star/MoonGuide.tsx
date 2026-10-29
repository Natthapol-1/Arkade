'use client';

import { useEffect, useRef } from 'react';
import { drawMoonReflection } from './moon-art';

// Moon challenge rule sheet: only what is new on this map, one small animated picture and one line per card.

type Paint = (ctx: CanvasRenderingContext2D, tick: number) => void;
type DrawQueen = (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, disguised: boolean) => void;
const W = 200, H = 120;

function player(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = '#e5e05a'; ctx.shadowBlur = 4; ctx.fillStyle = '#e5e05a'; ctx.fillRect(-10, -10, 20, 20); ctx.shadowBlur = 0;
  ctx.fillStyle = '#6d6a2c'; ctx.fillRect(-6, -6, 12, 12); ctx.fillStyle = '#48c8ff'; ctx.fillRect(-5, 0, 10, 4);
  ctx.restore();
}
function shard(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, alpha: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#8f5fe0'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(0, -4); ctx.lineTo(-6, 0); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4eaff'; ctx.fillRect(-2, -1, 8, 2); ctx.restore();
}

export default function MoonGuide({ drawQueen }: { drawQueen: DrawQueen }) {
  const cards: { title: string; color: string; text: string; paint: Paint }[] = [
    { title: 'HIDDEN QUEEN', color: '#dd88ff', text: 'She looks just like her illusions. Every jump brings more.', paint: (ctx, t) => {
      const shown = 1 + Math.min(3, Math.floor((t % 200) / 50));
      [[40, 60], [100, 44], [160, 64], [100, 92]].slice(0, shown).forEach(([x, y]) => drawQueen(ctx, x, y, t, true));
    } },
    { title: 'REFLECTION', color: '#cc88ff', text: 'Only the real Queen casts a reflection on the floor.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(56, 50); ctx.scale(.8, .8); drawMoonReflection(ctx, 0, 0, t); drawMoonReflection(ctx, 0, 0, t); ctx.restore(); // doubled to read at card size
      drawQueen(ctx, 56, 54, t, true); drawQueen(ctx, 144, 54, t, true);
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#f4eaff'; ctx.fillText('REAL', 56, 108); ctx.fillStyle = '#8a7aa8'; ctx.fillText('FAKE', 144, 108);
    } },
    { title: 'REVEAL', color: '#ff9cf0', text: 'Just before she jumps, she shows her true self. Hit hard then.', paint: (ctx, t) => {
      const cycle = t % 160, revealed = cycle >= 90;
      drawQueen(ctx, 110, 60, t, !revealed);
      if (revealed && cycle < 110) { const k = (cycle - 90) / 20; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#f4eaff'; ctx.lineWidth = 3; ctx.strokeRect(110 - 20 - k * 20, 60 - 20 - k * 20, 40 + k * 40, 40 + k * 40); ctx.globalAlpha = 1; }
      player(ctx, 30, 60); if (revealed) { ctx.fillStyle = '#ffe14a'; ctx.fillRect(40, 58, 52, 4); }
    } },
    { title: 'MOON MARK', color: '#a9e6ff', text: 'C marks the nearest Queen for a few seconds. If it is her, the mark follows her jump.', paint: (ctx, t) => {
      const cycle = t % 200, jumped = cycle >= 110, x = jumped ? 160 : 60, y = jumped ? 70 : 50;
      if (!jumped) drawQueen(ctx, x, y, t, true); else { drawQueen(ctx, 60, 50, t, true); drawQueen(ctx, x, y, t, true); }
      if (cycle > 20 && (cycle < 180 || Math.floor(t / 6) % 2 === 0)) {
        const mx = jumped ? x : 60, my = jumped ? y : 50; ctx.fillStyle = '#a9e6ff';
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.fillRect(mx + dx * 20 - (dx > 0 ? 6 : 0), my + dy * 20 - (dy > 0 ? 2 : 0), 6, 2); ctx.fillRect(mx + dx * 20 - (dx > 0 ? 2 : 0), my + dy * 20 - (dy > 0 ? 6 : 0), 2, 6); }
      }
      if (cycle < 30) { ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#e8fbff'; ctx.fillText('C', 100, 104); }
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
      {cards.map((card, i) => <article key={card.title} className="rs-nep-card" style={{ borderColor: card.color + '66' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={W} height={H} aria-hidden="true" />
        <h5 style={{ color: card.color }}>{card.title}</h5>
        <p>{card.text}</p>
      </article>)}
    </div>
  </div>;
}
