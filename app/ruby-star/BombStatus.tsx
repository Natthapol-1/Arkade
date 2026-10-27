'use client';

export default function BombStatus({ armed, cooldown, powered, totalCooldown }: {
  armed: boolean; cooldown: number; powered: boolean; totalCooldown: number;
}) {
  const cooling = !armed && cooldown > 0;
  const status = armed ? 'armed' : cooling ? 'cooldown' : 'ready';
  const label = armed ? 'Bomb armed — Q to detonate' : cooling ? `Bomb cooldown — ${Math.ceil(cooldown / 60)} seconds` : 'Bomb ready — Q to place';
  const color = cooling ? '#536176' : powered ? '#ffe079' : '#ffa34e';
  const progress = Math.max(0, Math.min(1, 1 - cooldown / totalCooldown));
  return <div className={`bomb-status ${status}`} role="img" aria-label={label} title={label} data-bomb-state={status}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="38" height="38" fill="#0b1424" stroke={armed ? '#ffb859' : '#314058'} strokeWidth="2" />
      {cooling && <path d="M20 1 H39 V39 H1 V1 H20" pathLength="100" fill="none" stroke="#ffb665" strokeWidth="2" strokeDasharray={`${progress * 100} 100`} />}
      <g className={cooling ? '' : 'bomb-glow'} style={{ color }}>
        <rect x="10" y="15" width="20" height="18" fill="currentColor" />
        <rect x="13" y="18" width="14" height="12" fill="#35221c" />
        <rect x="18" y="20" width="4" height="8" fill={cooling ? '#687080' : '#fff0b7'} />
        <rect x="16" y="22" width="8" height="4" fill={cooling ? '#687080' : '#fff0b7'} />
        <path d="M20 15 V9 H25 V6 H29" fill="none" stroke="currentColor" strokeWidth="3" />
      </g>
      {armed && <g className="fuse-spark" fill="#fff0ad">
        <rect x="28" y="4" width="4" height="4" /><rect x="28" y="0" width="2" height="2" />
        <rect x="34" y="5" width="3" height="2" /><rect x="30" y="10" width="2" height="3" />
      </g>}
      {!armed && !cooling && <path d="M27 32 H30 V35 H33 V29 H36" stroke="#9dffd1" strokeWidth="2" fill="none" />}
    </svg>
    <style jsx>{`
      .bomb-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .bomb-glow { filter: drop-shadow(0 0 2px currentColor); }
      .armed .bomb-glow, .fuse-spark { animation: bomb-pulse .6s ease-in-out infinite alternate; }
      @keyframes bomb-pulse { from { opacity: .65; } to { opacity: 1; filter: drop-shadow(0 0 4px #ffbe63); } }
      @media (prefers-reduced-motion: reduce) { .armed .bomb-glow, .fuse-spark { animation: none; } }
    `}</style>
  </div>;
}
