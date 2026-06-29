/* ═══════════════════════════════════════════
   Outcast Gambit — Opponent AI
   Decision priority: medic rescue > mandatory capture > free move.
   ═══════════════════════════════════════════ */

import { Piece, GameState } from './constants';
import { Move, legalMovesForPiece, isSquareThreatenedByPlayer } from './engine';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Medics "want" to rescue an endangered ally above all else — Normal medics only on even turns. */
function findRescueMove(opponentPieces: Piece[], pieces: Piece[], turnNumber: number): Move | null {
  const medics = opponentPieces.filter(p => p.kind === 'medic');
  for (const medic of medics) {
    const moves = legalMovesForPiece(medic, pieces, turnNumber).filter(m => m.isSwap);
    const rescue = moves.find(m => isSquareThreatenedByPlayer(m.to, pieces));
    if (rescue) return rescue;
  }
  return null;
}

function findMandatoryCapture(opponentPieces: Piece[], pieces: Piece[], turnNumber: number): Move | null {
  const captures: Move[] = [];
  for (const piece of opponentPieces) {
    const moves = legalMovesForPiece(piece, pieces, turnNumber).filter(m => m.isCapture);
    captures.push(...moves);
  }
  return captures.length > 0 ? pickRandom(captures) : null;
}

function findFreeMove(opponentPieces: Piece[], pieces: Piece[], turnNumber: number): Move | null {
  const all: Move[] = [];
  for (const piece of opponentPieces) {
    all.push(...legalMovesForPiece(piece, pieces, turnNumber));
  }
  return all.length > 0 ? pickRandom(all) : null;
}

/** Computes the opponent's move for the current turn, or null if it has nothing legal to do. */
export function computeOpponentMove(state: GameState): Move | null {
  const opponentPieces = state.pieces.filter(p => p.side === 'opponent' && !p.captured);

  const rescue = findRescueMove(opponentPieces, state.pieces, state.turnNumber);
  if (rescue) return rescue;

  const capture = findMandatoryCapture(opponentPieces, state.pieces, state.turnNumber);
  if (capture) return capture;

  return findFreeMove(opponentPieces, state.pieces, state.turnNumber);
}
