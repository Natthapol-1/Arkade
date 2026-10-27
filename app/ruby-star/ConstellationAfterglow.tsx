'use client';

import { CONSTELLATIONS, CONSTELLATION_REVEAL_TICKS, type Constellation } from './engine';
import { CONSTELLATION_STARS, constellationLinks } from './ConstellationChoice';

export default function ConstellationAfterglow({ kind, ticks }: { kind: Constellation; ticks: number }) {
  const points = CONSTELLATION_STARS[kind];
  const fade = Math.max(0, Math.min(1, (CONSTELLATION_REVEAL_TICKS - ticks) / 10, ticks / 36));
  return <div className="rs-constellation-afterglow" data-kind={kind} aria-hidden="true" style={{
    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
    width: 'min(340px, 46vw, 46vh)', aspectRatio: '80 / 68', color: CONSTELLATIONS[kind].color,
    opacity: .18 * fade, transition: 'opacity 100ms linear', pointerEvents: 'none', userSelect: 'none', zIndex: 8,
  }}>
    <svg viewBox="0 0 80 68" width="100%" height="100%" shapeRendering="crispEdges" style={{ overflow: 'visible' }}>
      <g fill="currentColor" opacity=".45">
        {constellationLinks(points).map(([x, y]) => <rect key={`${x},${y}`} x={x - 1} y={y - 1} width="2" height="2" />)}
      </g>
      {points.map(([x, y], i) => {
        const major = i === Math.floor(points.length / 2), size = major ? 12 : 8;
        return <g key={i} style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}>
          <rect x={x - size / 2} y={y - size / 2} width={size} height={size} fill="currentColor" />
          <rect x={x - size / 2 + 2} y={y - size / 2 + 2} width={size - 4} height={size - 4} fill="#17223a" />
          <rect x={x - 1} y={y - 1} width="2" height="2" fill="#fff8e5" />
          {major && <g fill="currentColor" opacity=".7">
            <rect x={x - 1} y={y - 11} width="2" height="4" /><rect x={x - 1} y={y + 7} width="2" height="4" />
            <rect x={x - 11} y={y - 1} width="4" height="2" /><rect x={x + 7} y={y - 1} width="4" height="2" />
          </g>}
        </g>;
      })}
    </svg>
  </div>;
}
