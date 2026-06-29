'use client';

import React from 'react';

function playClick() {
  if (typeof window !== 'undefined') {
    const audio = new Audio('/sounds/commandClick.mp3');
    audio.volume = 0.45;
    audio.play().catch(() => {});
  }
}

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function RulesModal({ isOpen, onClose, title, children }: RulesModalProps) {
  if (!isOpen) return null;

  function handleClose() {
    playClick();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            onClick={handleClose}
            style={{
              color: 'var(--text-dim)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              padding: '4px 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--danger)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-dim)';
            }}
            aria-label="Close rules"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button
            onClick={handleClose}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            UNDERSTOOD
          </button>
        </div>
      </div>
    </div>
  );
}
