'use client';

import { SUN } from './constants';

// Shares the celestial/Moon HUD frame, perimeter recharge and small keyboard hint.
export default function CoolingWaveStatus({ cooldown, empowered, casts }: {
  cooldown: number; empowered: boolean; casts: number;
}) {
  const cooling = cooldown > 0, total = empowered ? SUN.rapidCooldown : SUN.waveCooldown;
  const progress = Math.max(0, Math.min(1, 1 - cooldown / total));
  const label = empowered ? `Cooling Wave empowered — ${casts} casts left${cooling ? ', recharging' : ' — C to cast'}`
    : cooling ? `Cooling Wave recharging — ${Math.ceil(cooldown / 60)} seconds` : 'Cooling Wave ready — C to cast';
  const color = cooling ? '#526b7e' : empowered ? '#dcffff' : '#8be7f7';
  return <div className="cooling-status" role="img" aria-label={label} title={label}
    data-cooling-state={cooling ? 'cooldown' : empowered ? 'empowered' : 'ready'}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="38" height="38" fill="#0b1424" stroke={cooling ? '#314058' : color} strokeWidth="2" />
      {cooling && <path d="M20 1H39V39H1V1H20" pathLength="100" fill="none" stroke="#8be7f7" strokeWidth="2" strokeDasharray={`${progress * 100} 100`} />}
      <g className={cooling ? '' : 'water-glow'}>
        <path d="M18 7H22V11H25V15H27V21H24V24H16V21H13V15H15V11H18Z" fill={color} />
        <path d="M18 13H20V17H17V20H16V16H18Z" fill={cooling ? '#73899b' : '#efffff'} />
        <path d="M7 23V27H11V30H29V27H33V23M12 24V26H28V24" fill="none" stroke={color} strokeWidth="2" />
      </g>
      {empowered && Array.from({ length: 5 }, (_, i) => <rect key={i} x={7 + i * 5} y="4" width="3" height="2" fill={i < casts ? '#e5ffff' : '#304353'} />)}
      <text x="33" y="37" textAnchor="middle" fontSize="8" fontFamily="var(--font-pixel)" fill={cooling ? '#687080' : '#e7e9f6'}>C</text>
    </svg>
    <style jsx>{`
      .cooling-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .water-glow { filter: drop-shadow(0 0 3px #8be7f7); }
    `}</style>
  </div>;
}
