'use client';

import { useRouter } from 'next/navigation';

function playClick() {
  if (typeof window !== 'undefined') {
    const audio = new Audio('/sounds/commandClick.mp3');
    audio.volume = 0.45;
    audio.play().catch(() => {});
  }
}

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => { playClick(); router.push('/'); }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase' as const,
        color: 'var(--text-dim)',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '6px 14px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--cyan-dim)';
        e.currentTarget.style.color = 'var(--cyan)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = 'var(--text-dim)';
      }}
      aria-label="Back to lobby"
    >
      ← EXIT
    </button>
  );
}
