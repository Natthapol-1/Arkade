import { useId } from 'react';
import { PieceKind } from './constants';

interface PieceIconProps {
  kind: PieceKind;
  size: number | string;
}

/**
 * Two-tone outlined silhouettes (white-to-gray fill + currentColor stroke) so the
 * outline still inherits each side's color while the body reads like a real chess set.
 */
export default function PieceIcon({ kind, size }: PieceIconProps) {
  const gradId = useId();
  const fillId = `${gradId}-fill`;
  const fill = `url(#${fillId})`;
  const stroke = {
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  };

  const defs = (
    <defs>
      <linearGradient id={fillId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ccd1da" />
      </linearGradient>
    </defs>
  );

  switch (kind) {
    case 'pawn':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          {defs}
          <circle cx="12" cy="7.6" r="3.6" fill={fill} {...stroke} />
          <path d="M9 12.2h6l1.7 4.2H7.3z" fill={fill} {...stroke} />
          <rect x="6" y="17.6" width="12" height="2.8" rx="0.6" fill={fill} {...stroke} />
        </svg>
      );

    case 'knight':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          {defs}
          <path
            d="M2.8,10.5 C3,8.9 3.9,7.3 5.4,6 C6.9,4.7 8.4,4.1 9.7,4.3 C10.5,4.1 11.4,4 12.3,4.2 C14.3,4.6 15.9,5.8 16.8,7.6 C17.5,9 17.6,10.6 17.1,12 C17.9,13.2 18.3,14.8 18,16.3 C17.9,16.8 17.4,17.1 16.8,17.1 L9,17.1 C8.9,15.6 8.3,14.1 7.2,13 C6.3,12.1 5.2,11.9 4.4,12.3 C3.7,12.6 3.1,12 2.8,11.2 C2.7,11 2.7,10.7 2.8,10.5 Z"
            fill={fill}
            {...stroke}
          />
          <path
            d="M9.9,4.3 C9.6,3.3 10.2,2 11.3,1.1 C11.8,0.7 12.4,0.9 12.6,1.5 C13.1,2.6 13.1,3.7 12.7,4.5 C11.8,4.1 10.8,4 9.9,4.3 Z"
            fill={fill}
            {...stroke}
          />
          <circle cx="7" cy="6.6" r="0.6" fill="currentColor" stroke="none" />
          <ellipse
            cx="3.5"
            cy="10.3"
            rx="0.5"
            ry="0.35"
            fill="currentColor"
            stroke="none"
            transform="rotate(-30 3.5 10.3)"
          />
          <rect x="6.5" y="17.6" width="11" height="2.8" rx="0.6" fill={fill} {...stroke} />
        </svg>
      );

    case 'rook':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          {defs}
          <path
            d="M6,8 L6,5 L8,5 L8,6.4 L10.3,6.4 L10.3,5 L13.7,5 L13.7,6.4 L16,6.4 L16,5 L18,5 L18,8 L16.6,9.4 L16.6,14.6 L18,16 L6,16 L7.4,14.6 L7.4,9.4 Z"
            fill={fill}
            {...stroke}
          />
          <rect x="6" y="17.4" width="12" height="2.6" rx="0.5" fill={fill} {...stroke} />
        </svg>
      );

    case 'bishop':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          {defs}
          <circle cx="12" cy="4.2" r="1.1" fill={fill} {...stroke} />
          <path
            d="M12,6.1 C14.4,7.8 15.7,10.5 15.1,13.7 C14.8,15.2 13.7,16.1 12,16.1 C10.3,16.1 9.2,15.2 8.9,13.7 C8.3,10.5 9.6,7.8 12,6.1 Z"
            fill={fill}
            {...stroke}
          />
          <rect x="9.2" y="16.4" width="5.6" height="1.3" rx="0.4" fill={fill} {...stroke} />
          <rect x="6" y="17.6" width="12" height="2.8" rx="0.6" fill={fill} {...stroke} />
        </svg>
      );

    case 'medic':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          {defs}
          <circle cx="12" cy="9" r="6" fill={fill} {...stroke} />
          <path
            d="M10.8,5.8 h2.4 v2.4 h2.4 v2.4 h-2.4 v2.4 h-2.4 v-2.4 h-2.4 v-2.4 h2.4 Z"
            fill="currentColor"
            stroke="none"
          />
          <rect x="10.2" y="15" width="3.6" height="2" fill={fill} {...stroke} />
          <rect x="6" y="17.6" width="12" height="2.8" rx="0.6" fill={fill} {...stroke} />
        </svg>
      );
  }
}
