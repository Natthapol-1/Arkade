'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { CONSTELLATIONS, type Constellation } from './engine';

export const CONSTELLATION_STARS: Record<Constellation, [number, number][]> = {
  laserRate: [[12, 40], [28, 12], [44, 36], [64, 20]],
  waveReach: [[12, 16], [28, 40], [44, 20], [60, 44]],
  bombDamage: [[16, 16], [60, 52], [20, 52], [60, 16]],
  burstDuration: [[12, 40], [28, 20], [52, 20], [68, 40], [40, 52]],
  burstRate: [[12, 24], [32, 40], [52, 24], [64, 48]],
  waveRate: [[12, 52], [32, 32], [52, 48], [64, 16]],
  playerGuard: [[12, 24], [28, 12], [44, 32], [60, 24], [44, 56]],
  manualHealing: [[12, 32], [32, 16], [64, 32], [48, 52], [32, 16]],
  killHealing: [[12, 16], [28, 36], [52, 36], [68, 16], [52, 56]],
  bombRate: [[12, 52], [12, 20], [44, 12], [68, 32], [44, 52]],
  laserRange: [[40, 12], [40, 56], [12, 32], [68, 32]],
  healing: [[16, 24], [32, 12], [48, 24], [36, 44], [60, 56]],
  laser: [[20, 16], [60, 16], [24, 52], [56, 52], [20, 16]],
  speed: [[12, 40], [28, 20], [52, 20], [68, 40], [40, 52]],
  energy: [[12, 24], [28, 44], [40, 24], [52, 44], [68, 24]],
  bomb: [[12, 52], [28, 32], [40, 40], [52, 16], [68, 28]],
  bullets: [[16, 16], [60, 12], [28, 32], [40, 32], [52, 32], [20, 52], [60, 56]],
  wave: [[12, 48], [24, 28], [40, 40], [56, 20], [68, 28]],
  ruby: [[12, 20], [24, 48], [40, 24], [56, 48], [68, 16]],
  power: [[12, 44], [28, 24], [40, 44], [52, 24], [68, 44], [40, 12]],
};

// Two-unit cells join through square elbows, never smooth diagonal strokes.
export function constellationLinks(points: [number, number][]): [number, number][] {
  const cells = new Map<string, [number, number]>();
  const add = (x: number, y: number) => cells.set(`${x},${y}`, [x, y]);
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) / 2;
    let px = ax, py = ay;
    for (let step = 0; step <= steps; step++) {
      const x = Math.round((ax + (bx - ax) * step / steps) / 2) * 2;
      const y = Math.round((ay + (by - ay) * step / steps) / 2) * 2;
      if (x !== px && y !== py) add(x, py);
      add(x, y); px = x; py = y;
    }
  }
  return Array.from(cells.values());
}

export default function ConstellationChoice({ choices, onChoose, toggleMode=false, active=[], onClose }: {
  choices: Constellation[]; onChoose: (kind: Constellation) => void; toggleMode?: boolean; active?: Constellation[]; onClose?: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector('button')?.focus();
    return () => previous?.focus();
  }, []);

  return <div className={"constellation-backdrop"+(toggleMode?" toggle-mode":"")} onContextMenu={e => e.preventDefault()}
    onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
    <div ref={panel} className="constellation-panel" role="dialog" aria-modal="true"
      aria-label="CONSTELLATIONS"
      onKeyDown={e => {
        if (e.key === 'Tab') {
          const buttons = panel.current?.querySelectorAll('button');
          if (!buttons?.length) return;
          const target = e.shiftKey ? buttons[0] : buttons[buttons.length - 1];
          if (document.activeElement === target) { e.preventDefault(); (e.shiftKey ? buttons[buttons.length - 1] : buttons[0]).focus(); }
        }
        if (toggleMode && e.key === 'Escape') { e.preventDefault(); onClose?.(); }
        if (!toggleMode && !e.repeat && (e.key === '1' || e.key === '2')) {
          e.preventDefault(); const choice = choices[Number(e.key) - 1]; if (choice) onChoose(choice);
        }
        e.stopPropagation();
      }}>
      {toggleMode && <div className="toggle-header"><strong>CONSTELLATIONS</strong><button type="button" onClick={onClose}>DONE</button></div>}
      <div className="constellation-cards">
        {choices.map((kind, index) => {
          const upgrade = CONSTELLATIONS[kind];
          const points = CONSTELLATION_STARS[kind];
          return <button key={kind} type="button" data-constellation={kind} aria-pressed={toggleMode?active.includes(kind):undefined} className={toggleMode&&active.includes(kind)?"is-active":undefined} onClick={() => onChoose(kind)} style={{ '--star-color': upgrade.color } as CSSProperties}>
            <svg viewBox="0 0 80 68" aria-hidden="true" shapeRendering="crispEdges">
              <g className="constellation-links" fill="currentColor" opacity=".65">
                {constellationLinks(points).map(([x, y]) => <rect key={`${x},${y}`} x={x - 1} y={y - 1} width="2" height="2" />)}
              </g>
              {points.map(([x, y], i) => {
                const major = i === Math.floor(points.length / 2), size = major ? 12 : 8;
                return <g key={i} className="constellation-star">
                  <rect x={x - size / 2 - 2} y={y - size / 2 - 2} width={size + 4} height={size + 4} fill="currentColor" opacity=".16" />
                  {major && <g fill="currentColor" opacity=".65">
                    <rect x={x - 1} y={y - 11} width="2" height="4" />
                    <rect x={x - 1} y={y + 7} width="2" height="4" />
                    <rect x={x - 11} y={y - 1} width="4" height="2" />
                    <rect x={x + 7} y={y - 1} width="4" height="2" />
                  </g>}
                  <rect x={x - size / 2} y={y - size / 2} width={size} height={size} fill="currentColor" />
                  <rect x={x - size / 2 + 2} y={y - size / 2 + 2} width={size - 4} height={size - 4} fill="#17223a" />
                  <rect x={x - 1} y={y - 1} width="2" height="2" fill="#fff8e5" />
                  <rect x={x - size / 2} y={y - size / 2} width="2" height="2" fill="#fff8e5" opacity=".8" />
                </g>;
              })}
            </svg>
            <strong>{upgrade.name}</strong>
            <span>{upgrade.description}</span>
            <small>{toggleMode?(active.includes(kind)?'REMOVE':'ACTIVATE'):'CHOOSE · '+(index+1)}</small>
          </button>;
        })}
      </div>

    </div>
    <style jsx>{`
      .constellation-backdrop { position: fixed; inset: 0; z-index: 2000; background: #030611e8; display: grid; place-items: center; padding: 16px; overflow: auto; }
      .constellation-panel { width: min(680px, 100%); max-height: calc(100dvh - 32px); overflow: auto; box-sizing: border-box; padding: 6px; text-align: center; color: #dbe5ff; font-family: var(--font-mono); }
      .constellation-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
      button { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px 12px; border: 3px solid var(--star-color); border-radius: 0; background: #1a2d47; box-shadow: inset 0 1px 0 #ffffff18, 0 4px 0 #030811; color: var(--star-color); cursor: pointer; font-family: inherit; }
      button:hover, button:focus-visible { background: #1b2942; outline: 3px solid #f5f0ff; outline-offset: 3px; box-shadow: 0 0 16px color-mix(in srgb, var(--star-color) 25%, transparent); }
      svg { height: 160px; width: 200px; flex-shrink: 0; overflow: visible; }
      .constellation-links { filter: drop-shadow(0 0 2px var(--star-color)); }
      .constellation-star { filter: drop-shadow(0 0 2px var(--star-color)) drop-shadow(0 0 5px color-mix(in srgb, var(--star-color) 65%, transparent)); }
      strong { font-family: var(--font-pixel); text-transform: uppercase; font-size: 13px; line-height: 1.5; letter-spacing: .025em; }
      button span { color: #f1f6ff; font-size: 15px; font-weight: 700; line-height: 1.5; flex: 1; }
      small { font-size: 13px; font-weight: 700; margin-top: 4px; }
      .toggle-mode .constellation-panel { width: min(960px, 100%); }
      .toggle-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .toggle-header button { padding: 8px 14px; border-color: #aabfe5; color: #e5efff; }
      .toggle-mode .constellation-cards { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
      .toggle-mode .constellation-cards button { gap: 6px; padding: 10px; opacity: .7; }
      .toggle-mode .constellation-cards button.is-active { opacity: 1; background: #30405d; box-shadow: inset 0 0 0 2px var(--star-color); }
      .toggle-mode svg { height: 85px; width: 110px; }
      .toggle-mode button span { font-size: 13px; }
      @media (max-height: 500px) { svg { height: 120px; width: 150px; } button { gap: 6px; padding: 10px; } }
      @media (max-width: 400px) { .constellation-cards { gap: 10px; } strong { font-size: 11px; } }
    `}</style>
  </div>;
}
