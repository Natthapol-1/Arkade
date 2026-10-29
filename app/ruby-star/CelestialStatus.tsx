'use client';

// HUD icon beside the bomb for a recharging celestial skill (Celestial Challenge): a four-point star in the
// skill's color that glows when ready, and dims with a filling perimeter while recharging.
export default function CelestialStatus({ name, color, cooldown, totalCooldown }: {
  name: string; color: string; cooldown: number; totalCooldown: number;
}) {
  const cooling = cooldown > 0;
  const label = cooling ? `${name} recharging — ${Math.ceil(cooldown / 60)} seconds` : `${name} ready — F to cast`;
  const progress = Math.max(0, Math.min(1, 1 - cooldown / totalCooldown));
  const fill = cooling ? '#536176' : color;
  return <div className={`celestial-status ${cooling ? 'cooldown' : 'ready'}`} role="img" aria-label={label} title={label}
    data-celestial-state={cooling ? 'cooldown' : 'ready'}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="38" height="38" fill="#0b1424" stroke={cooling ? '#314058' : color} strokeWidth="2" />
      {cooling && <path d="M20 1 H39 V39 H1 V1 H20" pathLength="100" fill="none" stroke={color} strokeWidth="2" strokeDasharray={`${progress * 100} 100`} />}
      <g className={cooling ? '' : 'celestial-glow'} style={{ color: fill }}>
        <rect x="17" y="6" width="6" height="28" fill="currentColor" />
        <rect x="6" y="17" width="28" height="6" fill="currentColor" />
        <rect x="13" y="13" width="14" height="14" fill="currentColor" />
        <rect x="16" y="16" width="8" height="8" fill={cooling ? '#687080' : '#ffffff'} />
      </g>
      <text x="33" y="37" textAnchor="middle" fontSize="8" fontFamily="var(--font-pixel)" fill={cooling ? '#687080' : '#e7e9f6'}>F</text>
    </svg>
    <style jsx>{`
      .celestial-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .celestial-glow { filter: drop-shadow(0 0 3px currentColor); animation: celestial-pulse 1.2s ease-in-out infinite alternate; }
      @keyframes celestial-pulse { from { opacity: .8; } to { opacity: 1; filter: drop-shadow(0 0 6px currentColor); } }
      @media (prefers-reduced-motion: reduce) { .celestial-glow { animation: none; } }
    `}</style>
  </div>;
}
