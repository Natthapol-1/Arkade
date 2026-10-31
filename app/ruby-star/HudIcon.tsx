export default function HudIcon({ kind, powered = false, carrying = false }: {
  kind: 'hp' | 'ruby' | 'energy' | 'temperature'; powered?: boolean; carrying?: boolean;
}) {
  const color = kind === 'hp' ? '#6be0a5' : kind === 'ruby' ? '#ff568c' : kind === 'temperature' ? '#ffab63' : powered ? '#ffe079' : '#70b9ff';
  const label = kind === 'hp' ? 'Player health' : kind === 'ruby' ? carrying ? 'Ruby — carried safely' : 'Ruby health' : kind === 'temperature' ? 'Temperature' : powered ? 'Energy — powered' : 'Energy';
  return <svg viewBox="0 0 24 24" width="22" height="22" role="img" aria-label={label}
    style={{ color, flexShrink: 0, filter: `drop-shadow(0 0 3px ${color}66)` }} shapeRendering="crispEdges">
    <title>{label}</title>
    {kind === 'hp' ? <>
      <path d="M8 2H16V8H22V16H16V22H8V16H2V8H8Z" fill="currentColor" />
    </> : kind === 'ruby' ? <>
      <path d="M10 1H14V4H17V7H20V10H23V14H20V17H17V20H14V23H10V20H7V17H4V14H1V10H4V7H7V4H10Z" fill="currentColor" />
    </> : kind === 'temperature' ? <>
      <path d="M10 2H14V4H16V14H18V20H16V22H8V20H6V14H8V4H10Z" fill="currentColor" />
      <path d="M10 5H14V15H16V19H8V15H10Z" fill="#593329" />
      <path d="M11 8H13V16H15V19H9V16H11Z" fill="#ffe9be" />
      <path d="M18 5H22V7H18ZM18 9H21V11H18Z" fill="currentColor" />
    </> : <>
      <path d="M11 2H20V6H17V9H14V12H19V15H15V18H11V22H5V15H8V11H5V8H8V5H11Z" fill="currentColor" />
    </>}
  </svg>;
}
