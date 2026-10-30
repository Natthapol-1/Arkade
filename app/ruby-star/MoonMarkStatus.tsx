'use client';

// HUD icon for the Moon Mark (Moon challenge, C), in the same style as CelestialStatus: the ice-blue mark sigil glows
// when ready, and dims with a filling perimeter while recharging.
const ICE = '#a9e6ff';

export default function MoonMarkStatus({ cooldown, totalCooldown }: { cooldown: number; totalCooldown: number }) {
  const cooling = cooldown > 0;
  const label = cooling ? `Moon Mark recharging — ${Math.ceil(cooldown / 60)} seconds` : 'Moon Mark ready — C marks the nearest Queen';
  const progress = Math.max(0, Math.min(1, 1 - cooldown / totalCooldown));
  const fill = cooling ? '#536176' : ICE;
  return <div className={`mark-status ${cooling ? 'cooldown' : 'ready'}`} role="img" aria-label={label} title={label}
    data-mark-state={cooling ? 'cooldown' : 'ready'}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="38" height="38" fill="#0b1424" stroke={cooling ? '#314058' : ICE} strokeWidth="2" />
      {cooling && <path d="M20 1 H39 V39 H1 V1 H20" pathLength="100" fill="none" stroke={ICE} strokeWidth="2" strokeDasharray={`${progress * 100} 100`} />}
      <g className={cooling ? '' : 'mark-glow'} style={{ color: fill }}>
        {/* four corner brackets around a small diamond, like the sigil over a marked target */}
        <path d="M7 7H15V10H10V15H7ZM25 7H33V15H30V10H25ZM7 25H10V30H15V33H7ZM30 25H33V33H25V30H30Z" fill="currentColor" />
        <path d="M18 13H22V15H24V18H26V22H24V25H22V27H18V25H16V22H14V18H16V15H18Z" fill="currentColor" />
        <rect x="18" y="18" width="4" height="4" fill={cooling ? '#687080' : '#ffffff'} />
      </g>
      <text x="33" y="37" textAnchor="middle" fontSize="8" fontFamily="var(--font-pixel)" fill={cooling ? '#687080' : '#e7e9f6'}>C</text>
    </svg>
    <style jsx>{`
      .mark-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .mark-glow { filter: drop-shadow(0 0 3px currentColor); animation: mark-pulse 1.2s ease-in-out infinite alternate; }
      @keyframes mark-pulse { from { opacity: .8; } to { opacity: 1; filter: drop-shadow(0 0 6px currentColor); } }
      @media (prefers-reduced-motion: reduce) { .mark-glow { animation: none; } }
    `}</style>
  </div>;
}
