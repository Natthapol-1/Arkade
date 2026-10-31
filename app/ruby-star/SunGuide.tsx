'use client';

import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawSunburstWarning, drawBurningTile, drawCoolingRipple, drawCoolingStation, drawSunUnit } from './sun-art';
import type { Enemy } from './engine';
import { SUN } from './constants';

const cards = [
  ['TEMPERATURE', 'Heat starts halfway. Charge cooling stations to reduce the heat. At full heat, an eruption devastates everyone except the King, then heat returns to half.'],
  ['CINDER WISPS', 'Each wisp slowly heats the arena. Clear them before they multiply; Solar Flare clears them everywhere.'],
  ['THE KING', 'He chases you and Ruby. Keep hitting him to interrupt his arena attack and its swarm of wisps.'],
  ['SPECIAL SKILL (PRESS C)', 'Cooling Wave: send out water to clear nearby wisps, cool the arena and calm the King. It also charges nearby stations.'],
  ['EMBERLINGS', 'Heavy and armored while burning, knocking you back on hit. Extinguish them with water to leave a helpless, fragile husk.'],
  ['COOLING STATIONS', 'Hold Space nearby to charge and cool. A full station heals you and Ruby 25 HP, releases water, removes heat and moves. The King resets nearby stations.'],
  ['RAGE', 'Rage builds over time, making the King faster and spawning more wisps. Water and hitting him calm it.'],
  ['BURNING TRAIL (PHASE 2)', 'When his rage is high, the King leaves burning ground that hurts you and adds heat. Water puts it out.'],
  ['EXTINGUISH THE KING', <>Reach zero heat to stun him and get a speed burst. Get close and press C <strong style={{ color: '#ffe6a6', fontWeight: 800, textShadow: '0 0 5px #ffc75e44' }}>FIVE TIMES</strong> for rapid waves that deal heavy damage.</>],
  ['SCORCH SAPPER (PHASE 2)', 'It ignores you and goes for your cooling stations, draining them. Water destroys it.'],
  ['SUNBURST (PHASE 3)', 'A gold sun marker counts down before the room bursts, burning anyone inside and heating the arena. Land water in it or cast Solar Flare to stop it.'],
] as const;

export default function SunGuide({ drawCelestial, drawKing }: { drawCelestial: CelestialGuidePainter; drawKing: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) => void }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let tick = 0, raf = 0;
    const frame = () => {
      tick++;
      const rippleTick = tick / 3;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.clearRect(0, 0, 200, 120); ctx.fillStyle = '#1b1112'; ctx.fillRect(0, 0, 200, 120);
        if (i === 0) {
          ctx.fillStyle = '#41261f'; ctx.fillRect(25, 46, 150, 24); ctx.fillStyle = '#ff8a47'; ctx.fillRect(25, 46, 150 * (.5 + (tick % 180) / 360), 24);
        } else if (i === 5) drawCoolingStation(ctx, { id: 0, x: 0, y: 0, charge: tick % 100, blocked: false }, 100, 65, tick, true);
        else if (i === 3) drawCoolingRipple(ctx, 100, 65, 36 - rippleTick % 36, false, 65);
        else if (i === 8) { // the heat bar drains to zero, then flashes icy white
          const k = tick % 200, heat = k < 130 ? .5 * (1 - k / 130) : 0, flash = k >= 130 ? Math.max(0, 1 - (k - 130) / 50) : 0;
          ctx.fillStyle = '#41261f'; ctx.fillRect(25, 46, 150, 24); ctx.fillStyle = '#ff8a47'; ctx.fillRect(25, 46, 150 * heat, 24);
          if (k >= 130) { ctx.globalAlpha = .35 + .65 * flash; ctx.strokeStyle = '#d8fbff'; ctx.lineWidth = 3; ctx.strokeRect(23, 44, 154, 28); ctx.globalAlpha = flash * .5; ctx.fillStyle = '#bff4ff'; ctx.fillRect(0, 0, 200, 120); ctx.globalAlpha = 1;
            ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#d8fbff'; ctx.fillText('0', 100, 63); }
        }
        else if (i === 7) { // a short burning trail, put out by a water ripple
          const k = tick % 200, out = k >= 140;
          if (!out) for (let j = 0; j < 4; j++) drawBurningTile(ctx, 8 + j * 48, 40, tick, 1, j, 0);
          else drawCoolingRipple(ctx, 100, 64, 36 - (k - 140) / 60 * 36, false, 70);
        }
        else if (i === 6) { // the King's rage glow builds, then a water ripple calms it
          const k = tick % 240, rage = k < 180 ? k / 180 : 1 - (k - 180) / 60 * .6, pulse = .6 + .4 * Math.sin(tick * .2);
          for (let r = 3; r >= 1; r--) { ctx.globalAlpha = rage * pulse * .22 * r / 3; ctx.fillStyle = '#ff4a3a'; const g = 6 + r * 7 * rage; ctx.fillRect(79 - g, 38 - g, 42 + g * 2, 42 + g * 2); }
          ctx.globalAlpha = 1; drawKing(ctx, 100, 59, tick);
          if (k >= 180) drawCoolingRipple(ctx, 100, 59, 36 - (k - 180) / 60 * 36, false, 45);
        }
        else if (i === 10) { // a room glows gold, then water lands in it and it is defused
          const k = tick % 220;
          if (k < 150) drawSunburstWarning(ctx, 20, 16, 160, 88, Math.ceil((1 - k / 150) * SUN.flareWarning), tick, true);
          else drawCoolingRipple(ctx, 100, 60, 36 - (k - 150) / 70 * 36, false, 70);
        }
        else if (i === 9) { // a sapper drains a station until a water ripple snuffs it out
          const k = tick % 240, alive = k < 170;
          drawCoolingStation(ctx, { id: 0, x: 0, y: 0, charge: alive ? Math.max(0, 80 - k * .45) : 4, blocked: false }, 70, 62, tick, false);
          if (alive) { drawSunUnit(ctx, { id: 7, type: 'scorch_sapper', flashTicks: 0, sapStation: 0 } as Enemy, 128, 62, tick); ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(116, 62); ctx.lineTo(88, 62); ctx.stroke(); }
          else drawCoolingRipple(ctx, 128, 62, 36 - (k - 170) / 70 * 36, false, 50);
        }
        else if (i === 1 || i === 4) {
          const cold = i === 4 && tick % 180 > 90;
          drawSunUnit(ctx, { id: 1, type: i === 1 ? 'cinder_wisp' : 'emberling', extinguished: cold, flashTicks: 0 } as Enemy, 100, 65, tick);
          if (cold) drawCoolingRipple(ctx, 100, 65, 36 - rippleTick % 36, false, 55);
        } else {
          drawKing(ctx, 100, 55, tick);
          for (let j = 0; j < 3; j++) drawSunUnit(ctx, { id: j, type: 'cinder_wisp', flashTicks: 0 } as Enemy, 40 + j * 60, 100, tick);
        }
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="rs-guide">
    <div className="rs-guide-nav"><h3>SUN CHALLENGE</h3></div>
    <p className="rs-guide-intro">Cool the station and defeat the Fiery King through three phases.</p>
    <div className="rs-nep-grid">
      <CelestialSkillGuideCard name="Solar Flare" description="Burns every enemy, clears all Cinder Wisps and deals 2% of one boss phase." color="#ff8c80" draw={drawCelestial} />
      {cards.map(([title, text], i) => <article key={title} className="rs-nep-card" style={{ borderColor: '#ffac5a66' }}>
      <canvas ref={el => { refs.current[i] = el; }} width={200} height={120} aria-hidden="true" />
      <h5 style={{ color: i === 3 || i === 5 || i === 8 ? '#a5efff' : '#ffb46b' }}>{title}</h5><p>{text}</p>
    </article>)}</div>
  </div>;
}
