/* ═══════════════════════════════════════════
   Outcast Assembly — Game Engine
   Pure logic: no React, no DOM, no side effects.
   ═══════════════════════════════════════════ */

import {
  BOARD_SIZE, OUTCASTS_TO_WIN, PIECES_LOST_TO_LOSE,
  Piece, Position, Side, GameState, GameStatus,
} from './constants';

export interface Move {
  pieceId: string;
  from: Position;
  to: Position;
  isCapture: boolean;
  capturedPieceId?: string;
  isSwap: boolean;
  swapPieceId?: string;
  /** Player attacked a Normal (non-outcast) medic: the medic is immune and survives, but the attacker is lost. */
  isMedicTrap?: boolean;
}

export function inBounds(pos: Position): boolean {
  return pos.x >= 0 && pos.x < BOARD_SIZE && pos.y >= 0 && pos.y < BOARD_SIZE;
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function pieceAt(pieces: Piece[], pos: Position): Piece | undefined {
  return pieces.find(p => !p.captured && positionsEqual(p.pos, pos));
}

/** A piece is a valid capture target unless it's a non-outcast (Normal) medic — those are immune. */
function isCapturableTarget(mover: Piece, target: Piece): boolean {
  if (target.side === mover.side) return false;
  if (target.kind === 'medic' && !target.isOutcast) return false;
  return true;
}

/** A player who attacks an immune Normal medic doesn't bounce off it — they walk into a trap and lose the piece. */
function isMedicTrap(mover: Piece, target: Piece): boolean {
  return mover.side === 'player' && target.side !== mover.side && target.kind === 'medic' && !target.isOutcast;
}

function slideMoves(piece: Piece, pieces: Piece[], directions: number[][]): Move[] {
  const moves: Move[] = [];
  for (const [dx, dy] of directions) {
    let step = 1;
    while (true) {
      const to: Position = { x: piece.pos.x + dx * step, y: piece.pos.y + dy * step };
      if (!inBounds(to)) break;
      const occupant = pieceAt(pieces, to);
      if (!occupant) {
        moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: false, isSwap: false });
        step++;
        continue;
      }
      if (occupant.side !== piece.side) {
        if (isCapturableTarget(piece, occupant)) {
          moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: true, capturedPieceId: occupant.id, isSwap: false });
        } else if (isMedicTrap(piece, occupant)) {
          moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: false, isSwap: false, isMedicTrap: true });
        }
      }
      // Blocked either way (own piece, capture, or an immune Normal medic acting as a wall).
      break;
    }
  }
  return moves;
}

function pawnMoves(piece: Piece, pieces: Piece[]): Move[] {
  const forward = piece.side === 'player' ? -1 : 1;
  const moves: Move[] = [];

  const step: Position = { x: piece.pos.x, y: piece.pos.y + forward };
  const stepClear = inBounds(step) && !pieceAt(pieces, step);
  if (stepClear) {
    moves.push({ pieceId: piece.id, from: piece.pos, to: step, isCapture: false, isSwap: false });

    // First-move-only double step (real chess) — lost the moment the pawn has
    // moved at all, including being relocated by a medic ring-swap.
    if (!piece.hasMoved) {
      const leap: Position = { x: piece.pos.x, y: piece.pos.y + forward * 2 };
      if (inBounds(leap) && !pieceAt(pieces, leap)) {
        moves.push({ pieceId: piece.id, from: piece.pos, to: leap, isCapture: false, isSwap: false });
      }
    }
  }

  for (const dx of [-1, 1]) {
    const to: Position = { x: piece.pos.x + dx, y: piece.pos.y + forward };
    if (!inBounds(to)) continue;
    const occupant = pieceAt(pieces, to);
    if (occupant && occupant.side !== piece.side) {
      if (isCapturableTarget(piece, occupant)) {
        moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: true, capturedPieceId: occupant.id, isSwap: false });
      } else if (isMedicTrap(piece, occupant)) {
        moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: false, isSwap: false, isMedicTrap: true });
      }
    }
  }
  return moves;
}

const KNIGHT_OFFSETS = [
  [1, 2], [2, 1], [-1, 2], [-2, 1],
  [1, -2], [2, -1], [-1, -2], [-2, -1],
];

function knightMoves(piece: Piece, pieces: Piece[]): Move[] {
  const moves: Move[] = [];
  for (const [dx, dy] of KNIGHT_OFFSETS) {
    const to: Position = { x: piece.pos.x + dx, y: piece.pos.y + dy };
    if (!inBounds(to)) continue;
    const occupant = pieceAt(pieces, to);
    if (!occupant) {
      moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: false, isSwap: false });
    } else if (occupant.side !== piece.side) {
      if (isCapturableTarget(piece, occupant)) {
        moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: true, capturedPieceId: occupant.id, isSwap: false });
      } else if (isMedicTrap(piece, occupant)) {
        moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: false, isSwap: false, isMedicTrap: true });
      }
    }
  }
  return moves;
}

const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const STEP_OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];
const RING_OFFSETS: number[][] = [];
for (let dx = -2; dx <= 2; dx++) {
  for (let dy = -2; dy <= 2; dy++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) === 2) RING_OFFSETS.push([dx, dy]);
  }
}

function medicMoves(piece: Piece, pieces: Piece[]): Move[] {
  const moves: Move[] = [];

  for (const [dx, dy] of STEP_OFFSETS) {
    const to: Position = { x: piece.pos.x + dx, y: piece.pos.y + dy };
    if (inBounds(to) && !pieceAt(pieces, to)) {
      moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: false, isSwap: false });
    }
  }

  // Ring "jump": swaps with an ally anywhere on the outer ring, ignoring anything in between.
  for (const [dx, dy] of RING_OFFSETS) {
    const to: Position = { x: piece.pos.x + dx, y: piece.pos.y + dy };
    if (!inBounds(to)) continue;
    const ally = pieceAt(pieces, to);
    if (ally && ally.side === piece.side) {
      moves.push({ pieceId: piece.id, from: piece.pos, to, isCapture: false, isSwap: true, swapPieceId: ally.id });
    }
  }

  return moves;
}

/** Raw movement geometry for a piece, ignoring any Normal-type behavioral restrictions. */
export function geometryMoves(piece: Piece, pieces: Piece[]): Move[] {
  switch (piece.kind) {
    case 'pawn': return pawnMoves(piece, pieces);
    case 'knight': return knightMoves(piece, pieces);
    case 'rook': return slideMoves(piece, pieces, ROOK_DIRS);
    case 'bishop': return slideMoves(piece, pieces, BISHOP_DIRS);
    case 'medic': return medicMoves(piece, pieces);
  }
}

function diagonalDistance(from: Position, to: Position): number {
  return Math.abs(to.x - from.x);
}

function hasOrthogonalAlly(pos: Position, side: Side, pieces: Piece[]): boolean {
  return ROOK_DIRS.some(([dx, dy]) => {
    const neighbor = pieceAt(pieces, { x: pos.x + dx, y: pos.y + dy });
    return !!neighbor && neighbor.side === side;
  });
}

/**
 * Legal moves honoring each Normal piece's behavioral quirk (the player's bait-able "tell").
 * Outcasts and all player pieces skip these restrictions entirely.
 */
export function legalMovesForPiece(piece: Piece, pieces: Piece[], turnNumber: number): Move[] {
  const geo = geometryMoves(piece, pieces);
  if (piece.side === 'player' || piece.isOutcast) return geo;

  switch (piece.kind) {
    case 'pawn':
      return turnNumber % 2 === 0 ? [] : geo;
    case 'medic':
      return turnNumber % 2 === 1 ? [] : geo;
    case 'bishop':
      return geo.filter(m => diagonalDistance(m.from, m.to) <= 2);
    case 'knight':
      return geo.filter(m => (m.to.x < BOARD_SIZE / 2) === (piece.startX < BOARD_SIZE / 2));
    case 'rook':
      return geo.filter(m => {
        if (!m.isCapture || !m.capturedPieceId) return true;
        const target = pieces.find(p => p.id === m.capturedPieceId)!;
        return !hasOrthogonalAlly(target.pos, target.side, pieces);
      });
  }
}

export function isSquareThreatenedByPlayer(pos: Position, pieces: Piece[]): boolean {
  return pieces
    .filter(p => p.side === 'player' && !p.captured)
    .some(p => geometryMoves(p, pieces).some(m => m.isCapture && positionsEqual(m.to, pos)));
}

function describePiece(piece: Piece): string {
  return `${piece.side === 'player' ? 'your' : 'their'} ${piece.kind}`;
}

export function applyMove(state: GameState, move: Move): GameState {
  const pieces = state.pieces.map(p => ({ ...p, pos: { ...p.pos } }));
  const mover = pieces.find(p => p.id === move.pieceId)!;
  let outcastsCaptured = state.outcastsCaptured;
  let piecesLost = state.piecesLost;
  const log = [...state.log];

  if (move.isSwap && move.swapPieceId) {
    const other = pieces.find(p => p.id === move.swapPieceId)!;
    const tmp = mover.pos;
    mover.pos = other.pos;
    other.pos = tmp;
    mover.hasMoved = true;
    other.hasMoved = true;
    log.push(`${describePiece(mover)} swapped places with ${describePiece(other)}`);
  } else if (move.isMedicTrap) {
    mover.captured = true;
    piecesLost += 1;
    log.push(`${describePiece(mover)} was lost attacking an immune Medic — it didn't budge`);
  } else {
    if (move.isCapture && move.capturedPieceId) {
      const captured = pieces.find(p => p.id === move.capturedPieceId)!;
      captured.captured = true;
      if (mover.side === 'player') {
        if (captured.isOutcast) {
          outcastsCaptured += 1;
          log.push(`Captured an OUTCAST ${captured.kind}!`);
        } else {
          mover.captured = true;
          piecesLost += 1;
          log.push(`Your ${mover.kind} and their ${captured.kind} eliminated each other`);
        }
      } else {
        piecesLost += 1;
        log.push(`Your ${captured.kind} was captured`);
      }
    }
    if (!mover.captured) {
      mover.pos = move.to;
      mover.hasMoved = true;
    }
  }

  let status: GameStatus = state.status;
  if (outcastsCaptured >= OUTCASTS_TO_WIN) status = 'won';
  else if (piecesLost >= PIECES_LOST_TO_LOSE) status = 'lost';

  return {
    ...state,
    pieces,
    outcastsCaptured,
    piecesLost,
    status,
    turn: mover.side === 'player' ? 'opponent' : 'player',
    turnNumber: mover.side === 'opponent' ? state.turnNumber + 1 : state.turnNumber,
    log,
  };
}
