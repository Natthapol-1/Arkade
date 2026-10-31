'use client';

import { useEffect, useRef } from 'react';
import { playUiSfx } from './ui-sfx';

// Challenge victory: a blocky celebration in the world's colour. Expanding stepped rings, a pulsing pixel star
// behind the title and rising sparks, with a short fanfare. The buttons slide in once the title has landed.
export default function VictoryScreen({ title, world, color, onPlayAgain, onStarMap }: {
  title: string; world: string; color: string; onPlayAgain: () => void; onStarMap: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { playUiSfx('victory'); }, []);

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let raf = 0, tick = 0;
    const start = performance.now();
    const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
    resize(); window.addEventListener('resize', resize);
    const hash = (i: number, k: number) => { const n = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return n - Math.floor(n); };
    const block = (x: number, y: number, s: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x / 6) * 6, Math.round(y / 6) * 6, s, s); };
    const draw = () => {
      tick = (performance.now() - start) / (1000 / 60); // time-based, so throttled frames never stall it
      const w = canvas.width, h = canvas.height, cx = w / 2, cy = h * .42;
      ctx.clearRect(0, 0, w, h);
      // Stepped square rings pulse outward from the title.
      for (let i = 0; i < 4; i++) {
        const t = ((tick + i * 45) % 180) / 180, half = Math.round((60 + t * Math.max(w, h) * .6) / 12) * 12;
        ctx.globalAlpha = (1 - t) * .5; ctx.strokeStyle = i % 2 ? '#ffffff' : color; ctx.lineWidth = i % 2 ? 4 : 8;
        ctx.strokeRect(cx - half, cy - half * .6, half * 2, half * 1.2);
      }
      // Big four-point pixel star behind the title, slowly breathing.
      const pulse = 1 + .06 * Math.sin(tick * .05), arm = 150 * pulse, bar = 24;
      ctx.globalAlpha = .22; ctx.fillStyle = color;
      ctx.fillRect(cx - bar / 2, cy - arm, bar, arm * 2); ctx.fillRect(cx - arm * 1.6, cy - bar / 2, arm * 3.2, bar);
      ctx.globalAlpha = .35; ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - bar / 6, cy - arm * .7, bar / 3, arm * 1.4); ctx.fillRect(cx - arm * 1.1, cy - bar / 6, arm * 2.2, bar / 3);
      // Sparks rise from below and twinkle out.
      for (let i = 0; i < 46; i++) {
        const life = ((tick * (.4 + hash(i, 1) * .5) + hash(i, 2) * 400) % 400) / 400;
        const x = hash(i, 3) * w + Math.sin(tick * .02 + i) * 14, y = h * (1.05 - life * 1.1);
        ctx.globalAlpha = Math.sin(life * Math.PI) * .9;
        const size = i % 5 === 0 ? 12 : 6;
        block(x, y, size, i % 3 ? color : '#ffffff');
        if (size === 12) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x / 6) * 6 - 6, Math.round(y / 6) * 6 + 4, 24, 4); ctx.fillRect(Math.round(x / 6) * 6 + 4, Math.round(y / 6) * 6 - 6, 4, 24); }
      }
      // A one-time flash as the screen opens.
      if (tick < 30) { ctx.globalAlpha = (1 - tick / 30) * .55; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [color]);

  return <div className="game-over-overlay rs-game-over rs-victory" style={{ ['--win' as string]: color }} role="dialog" aria-modal="true" aria-labelledby="rs-win-title">
    <style>{`
      .rs-victory { position: fixed; z-index: 120; background: radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--win) 22%, #050a14) 0%, #050a14f2 60%); display: flex; align-items: center; justify-content: center; }
      .rs-victory canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; image-rendering: pixelated; }
      .rs-victory-inner { position: relative; box-sizing: border-box; max-width: min(1000px, 100%); text-align: center; padding: 24px; }
      .rs-victory-kicker { font-family: var(--font-pixel); font-size: 13px; letter-spacing: .3em; color: #e8fbff; opacity: 0; animation: rsWinUp .5s ease .25s forwards; }
      .rs-victory h2 { margin: 18px 0 0; font-family: var(--font-pixel); font-size: clamp(22px, 3.6vw, 44px); line-height: 1.4; color: #ffffff;
        text-shadow: 0 0 18px var(--win), 0 0 42px var(--win), 4px 4px 0 color-mix(in srgb, var(--win) 45%, #000);
        animation: rsWinSlam .55s cubic-bezier(.2, 1.6, .4, 1) .1s both, rsWinGlow 2.4s ease-in-out 1s infinite; }
      .rs-victory-actions { display: flex; gap: 12px; justify-content: center; margin-top: 40px; opacity: 0; animation: rsWinUp .45s ease .9s forwards; }
      .rs-victory-actions button { min-width: 210px; min-height: 50px; padding: 12px 20px; font-family: var(--font-pixel); font-weight: 400; font-size: 12px; line-height: 1.4; letter-spacing: .06em; text-transform: none;
        color: #f1fbff; background: #10233a; border: 2px solid var(--win); box-shadow: 0 0 12px color-mix(in srgb, var(--win) 40%, transparent); cursor: pointer; border-radius: 0; }
      .rs-victory-actions button:first-child { color: #06101c; background: var(--win); }
      .rs-victory-actions button:hover, .rs-victory-actions button:focus-visible { outline: none; filter: brightness(1.15); box-shadow: 0 0 22px var(--win); }
      @keyframes rsWinSlam { 0% { opacity: 0; transform: scale(2.2); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes rsWinUp { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes rsWinGlow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.25); } }
    `}</style>
    <canvas ref={canvasRef} aria-hidden="true" />
    <div className="rs-victory-inner">
      <div className="rs-victory-kicker">★ {world} CLEARED ★</div>
      <h2 id="rs-win-title">{title}</h2>
      <div className="rs-victory-actions">
        <button type="button" autoFocus onClick={onPlayAgain}>PLAY AGAIN</button>
        <button type="button" onClick={onStarMap}>BACK TO STAR MAP</button>
      </div>
    </div>
  </div>;
}
