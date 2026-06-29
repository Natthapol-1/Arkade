/* ═══════════════════════════════════════════
   Outcast Assembly — Types & Setup
   ═══════════════════════════════════════════ */

export const BOARD_SIZE = 8;
export const OUTCASTS_TO_WIN = 3;
export const TOTAL_OUTCASTS = 6;
export const PIECES_LOST_TO_LOSE = 8;

export type Side = 'player' | 'opponent';
export type PieceKind = 'pawn' | 'knight' | 'rook' | 'bishop' | 'medic';

export interface Position {
  x: number; // file, 0-7
  y: number; // rank, 0 = opponent back rank, 7 = player back rank
}

export interface Piece {
  id: string;
  kind: PieceKind;
  side: Side;
  pos: Position;
  startX: number; // file the piece spawned on — knights are locked to this half of the board
  isOutcast: boolean; // only ever true for opponent pieces
  captured: boolean;
  hasMoved: boolean; // true after any move OR being relocated by a medic swap
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  pieces: Piece[];
  turn: Side;
  turnNumber: number; // increments once per full round, checked for parity rules
  status: GameStatus;
  outcastsCaptured: number;
  piecesLost: number;
  log: string[];
}

// Back rank order, mirrored across the centerline (medics sit where king/queen would).
const BACK_RANK: PieceKind[] = ['rook', 'knight', 'bishop', 'medic', 'medic', 'bishop', 'knight', 'rook'];

export const PIECE_GLYPH: Record<PieceKind, string> = {
  pawn: 'P',
  knight: 'N',
  rook: 'R',
  bishop: 'B',
  medic: '+',
};

export const PIECE_LABEL: Record<PieceKind, string> = {
  pawn: 'Pawn',
  knight: 'Knight',
  rook: 'Rook',
  bishop: 'Bishop',
  medic: 'Medic',
};

function makePiece(kind: PieceKind, side: Side, pos: Position, idx: number): Piece {
  return {
    id: `${side}-${kind}-${idx}`,
    kind,
    side,
    pos,
    startX: pos.x,
    isOutcast: false,
    captured: false,
    hasMoved: false,
  };
}

function setupSide(side: Side): Piece[] {
  const backRankY = side === 'opponent' ? 0 : 7;
  const pawnRankY = side === 'opponent' ? 1 : 6;
  const pieces: Piece[] = [];

  BACK_RANK.forEach((kind, x) => {
    pieces.push(makePiece(kind, side, { x, y: backRankY }, x));
  });
  for (let x = 0; x < BOARD_SIZE; x++) {
    pieces.push(makePiece('pawn', side, { x, y: pawnRankY }, x));
  }
  return pieces;
}

/** Randomly flags TOTAL_OUTCASTS opponent pieces as outcasts (any kind, including medics). */
function assignOutcasts(opponentPieces: Piece[]): void {
  const pool = [...opponentPieces];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  pool.slice(0, TOTAL_OUTCASTS).forEach(p => { p.isOutcast = true; });
}

export function createInitialGameState(): GameState {
  const playerPieces = setupSide('player');
  const opponentPieces = setupSide('opponent');
  assignOutcasts(opponentPieces);

  return {
    pieces: [...playerPieces, ...opponentPieces],
    turn: 'player',
    turnNumber: 1,
    status: 'playing',
    outcastsCaptured: 0,
    piecesLost: 0,
    log: [],
  };
}
