'use client';

import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function RulesModal({ isOpen, onClose, title, children }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            onClick={onClose}
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
            onClick={onClose}
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
