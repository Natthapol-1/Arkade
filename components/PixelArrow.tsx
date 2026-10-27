export default function PixelArrow({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"
    style={{ flexShrink: 0, verticalAlign: 'middle' }}>
    <path d="M8 2H11V5H14V7H16V9H14V11H11V14H8V10H1V6H8Z"
      fill="currentColor" transform={direction === 'left' ? 'translate(16 0) scale(-1 1)' : undefined} />
  </svg>;
}
