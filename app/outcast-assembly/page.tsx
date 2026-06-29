'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  BOARD_SIZE, PIECE_LABEL, OUTCASTS_TO_WIN, PIECES_LOST_TO_LOSE,
  Piece, Position, GameState, createInitialGameState,
} from './constants';
import { Move, geometryMoves, positionsEqual, pieceAt, applyMove } from './engine';
import { computeOpponentMove } from './ai';
import PieceIcon from './PieceIcon';
import BGMController, { BGMControllerHandle } from '@/components/BGMController';
import RulesModal from '@/components/RulesModal';
import BackButton from '@/components/BackButton';

const AI_THINK_DELAY = 650;

function playSound(path: string, volume = 0.4) {
  if (typeof window === 'undefined') return;
  const audio = new Audio(path);
  audio.volume = volume;
  audio.play().catch(() => { });
}

/** Picks placeholder SFX based on what the move actually does. */
function playMoveSound(move: Move, pieces: Piece[], moverSide: 'player' | 'opponent') {
  if (move.isSwap) {
    playSound('/sounds/swap.mp3', 0.45);
    return;
  }
  if (move.isMedicTrap) {
    playSound('/sounds/shieldBreak.mp3', 0.5);
    return;
  }
  if (move.isCapture && move.capturedPieceId) {
    const captured = pieces.find(p => p.id === move.capturedPieceId);
    if (moverSide === 'player') {
      playSound(captured?.isOutcast ? '/sounds/coin2.wav' : '/sounds/hitHurt.wav', 0.5);
    } else {
      playSound('/sounds/incorrect.mp3', 0.4);
    }
    return;
  }
  playSound('/sounds/snakeMovement.mp3', 0.25);
}

type MarkType = 'suspect' | 'clear';

type LastMove = { pieceId: string; from: Position; to: Position; side: 'player' | 'opponent' };

export default function OutcastAssemblyPage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [marks, setMarks] = useState<Map<string, MarkType>>(new Map());
  const [markMode, setMarkMode] = useState<MarkType | null>(null);
  const [showRules, setShowRules] = useState(true);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgmRef = useRef<BGMControllerHandle>(null);

  function toggleMark(id: string, type: MarkType) {
    playSound('/sounds/gameModeClick.mp3', 0.35);
    setMarks(prev => {
      const next = new Map(prev);
      if (next.get(id) === type) next.delete(id);
      else next.set(id, type);
      return next;
    });
    setMarkMode(null);
  }

  useEffect(() => {
    setGame(createInitialGameState());
  }, []);

  // Opponent's turn: think for a beat, then play its move.
  useEffect(() => {
    if (!game || game.status !== 'playing' || game.turn !== 'opponent' || showRules) return;
    aiTimer.current = setTimeout(() => {
      const move = computeOpponentMove(game);
      if (move) {
        playMoveSound(move, game.pieces, 'opponent');
        setLastMove({ pieceId: move.pieceId, from: move.from, to: move.to, side: 'opponent' });
        setGame(applyMove(game, move));
      } else {
        setGame({ ...game, turn: 'player' });
      }
    }, AI_THINK_DELAY);
    return () => {
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
  }, [game, showRules]);

  // Win/loss stingers, fired once when the status actually changes.
  useEffect(() => {
    if (game?.status === 'won') playSound('/sounds/levelup.mp3', 0.5);
    else if (game?.status === 'lost') playSound('/sounds/shieldBreak.mp3', 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  const selectedPiece = useMemo(
    () => (game && selectedId ? game.pieces.find(p => p.id === selectedId) ?? null : null),
    [game, selectedId]
  );

  const legalMoves = useMemo<Move[]>(
    () => (game && selectedPiece ? geometryMoves(selectedPiece, game.pieces) : []),
    [game, selectedPiece]
  );

  if (!game) return null;

  const canInteract = game.status === 'playing' && game.turn === 'player' && !showRules;

  function handleCellClick(pos: Position) {
    if (!game) return;
    const occupant = pieceAt(game.pieces, pos);

    if (markMode) {
      if (occupant && occupant.side === 'opponent') {
        toggleMark(occupant.id, markMode);
      }
      return;
    }

    if (!canInteract) return;

    if (selectedPiece) {
      if (occupant?.id === selectedPiece.id) {
        setSelectedId(null);
        return;
      }
      const move = legalMoves.find(m => positionsEqual(m.to, pos));
      if (move) {
        playMoveSound(move, game.pieces, 'player');
        setLastMove({ pieceId: move.pieceId, from: move.from, to: move.to, side: 'player' });
        setGame(applyMove(game, move));
        setSelectedId(null);
        return;
      }
      if (occupant && occupant.side === 'player') {
        playSound('/sounds/commandClick.mp3', 0.35);
        setSelectedId(occupant.id);
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (occupant && occupant.side === 'player') {
      playSound('/sounds/commandClick.mp3', 0.35);
      setSelectedId(occupant.id);
    }
  }

  function handleContextMenu(e: React.MouseEvent, pos: Position) {
    e.preventDefault();
    if (!game) return;
    const occupant = pieceAt(game.pieces, pos);
    if (!occupant || occupant.side !== 'opponent') return;
    toggleMark(occupant.id, 'suspect');
  }

  function handleRestart() {
    setGame(createInitialGameState());
    setSelectedId(null);
    setMarks(new Map());
    setMarkMode(null);
    setLastMove(null);
  }

  const cellSize = `min(calc((100vw - 32px) / ${BOARD_SIZE}), calc((100dvh - 230px) / ${BOARD_SIZE}), 58px)`;
  const lastLog = game.log[game.log.length - 1];
  const statusText = game.status !== 'playing'
    ? undefined
    : markMode
      ? `TAP AN OPPONENT UNIT TO MARK IT ${markMode === 'suspect' ? 'SUSPICIOUS' : 'CLEARED'}`
      : lastLog ?? (game.turn === 'player'
        ? (selectedPiece ? 'CHOOSE A DESTINATION' : 'SELECT A UNIT TO MOVE')
        : 'OPPONENT IS MOVING...');

  return (
    <div
      style={{
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <BGMController src="/sounds/outcastChessBGM.mp3" volume={0.2} ref={bgmRef} />

      <RulesModal
        isOpen={showRules}
        onClose={() => {
          setShowRules(false);
          bgmRef.current?.playMusic();
        }}
        title=":: OUTCAST ASSEMBLY"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Six of the opponent&apos;s 16 pieces are hidden <span style={{ color: 'var(--danger)' }}>Outcasts</span>.
            Capture <span style={{ color: 'var(--cyan)' }}>3 Outcasts</span> to win. Lose{' '}
            <span style={{ color: 'var(--danger)' }}>{PIECES_LOST_TO_LOSE} pieces</span> of your team and you lose.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>Capturing:</span> Capture a Normal piece and
              both it and your piece are eliminated. Capture an Outcast and only it is removed — free progress.
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>The tell:</span> Normal opponent pieces must
              capture whenever they legally can, but each piece type has one quirk it never breaks. Outcasts ignore
              every quirk. Bait a piece into breaking its own rule and you&apos;ve found an Outcast.
              Use medic wisely to protect your pieces.
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>
              NORMAL-PIECE QUIRKS
            </p>
            <ul className="rule-list">
              <li><span className="rule-color" style={{ color: 'var(--cyan)' }}>Pawn:</span> never moves on even turns.</li>
              <li><span className="rule-color" style={{ color: 'var(--cyan)' }}>Knight:</span> never crosses to the other half of the board (left and right).</li>
              <li><span className="rule-color" style={{ color: 'var(--cyan)' }}>Bishop:</span> never moves more than 2 squares.</li>
              <li><span className="rule-color" style={{ color: 'var(--cyan)' }}>Rook:</span> won&apos;t capture a target that has an orthogonal ally next to it.</li>
              <li><span className="rule-color" style={{ color: 'var(--cyan)' }}>Medic:</span> never acts on odd turns, but always rescue-swaps an endangered ally above all else when it can act.</li>
            </ul>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>
              THE MEDIC
            </p>
            <ul className="rule-list">
              <li>
                <span className="rule-color" style={{ color: 'var(--cyan)' }}>Movement:</span>{' '}
                Steps 1 square in any direction (including diagonals) — like a king in chess.
              </li>
              <li>
                <span className="rule-color" style={{ color: 'var(--cyan)' }}>Immune:</span>{' '}
                Cannot capture enemies and <span style={{ color: 'var(--danger)' }}>cannot be captured</span> — unless the Medic is an Outcast.
                Attack a Normal Medic anyway and your piece is the one that&apos;s lost; the Medic doesn&apos;t budge.
              </li>
              <li>
                <span className="rule-color" style={{ color: 'var(--cyan)' }}>Ring Swap:</span>{' '}
                Can instantly swap positions with any ally that is <span style={{ color: 'var(--warning)' }}>exactly 2 squares away</span> (the outer ring — any direction, including diagonals), jumping over everything in between.
              </li>
            </ul>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>Controls:</span> Click a unit, then a highlighted
            square to move. Right-click an opponent unit to mark it suspicious (desktop), or use the{' '}
            <span style={{ color: 'var(--warning)' }}>⚑ SUSPECT</span> / <span style={{ color: 'var(--success)' }}>✓ CLEAR</span>{' '}
            buttons above the board, then tap a unit. Marks are just notes for you, no effect on play.
          </p>
        </div>
      </RulesModal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', maxWidth: '95vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
          <BackButton />
          <button onClick={() => { playSound('/sounds/gameModeClick.mp3', 0.45); setShowRules(true); }} className="btn btn-ghost" style={{ fontSize: '0.55rem', padding: '6px 10px' }}>
            ? RULES
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '8px' }}>
          <button
            onClick={() => { playSound('/sounds/gameModeClick.mp3', 0.45); setMarkMode(m => (m === 'suspect' ? null : 'suspect')); }}
            className="btn btn-ghost"
            style={{
              fontSize: '0.55rem',
              padding: '6px 10px',
              borderColor: markMode === 'suspect' ? 'var(--warning)' : undefined,
              color: markMode === 'suspect' ? 'var(--warning)' : undefined,
              boxShadow: markMode === 'suspect' ? '0 0 10px rgba(255,170,0,0.3)' : undefined,
            }}
          >
            ⚑ SUSPECT
          </button>
          <button
            onClick={() => { playSound('/sounds/gameModeClick.mp3', 0.45); setMarkMode(m => (m === 'clear' ? null : 'clear')); }}
            className="btn btn-ghost"
            style={{
              fontSize: '0.55rem',
              padding: '6px 10px',
              borderColor: markMode === 'clear' ? 'var(--success)' : undefined,
              color: markMode === 'clear' ? 'var(--success)' : undefined,
              boxShadow: markMode === 'clear' ? '0 0 10px rgba(0,255,136,0.3)' : undefined,
            }}
          >
            ✓ CLEAR
          </button>
        </div>

        <div className="hud-bar" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="hud-item">
            <span className="hud-label">Outcasts</span>
            <span className="hud-value">{game.outcastsCaptured}/{OUTCASTS_TO_WIN}</span>
          </div>
          <div className="hud-divider" />
          <div className="hud-item">
            <span className="hud-label">Lost</span>
            <span className="hud-value" style={{ color: 'var(--danger)' }}>{game.piecesLost}/{PIECES_LOST_TO_LOSE}</span>
          </div>
          <div className="hud-divider" />
          <div className="hud-item">
            <span className="hud-label">Round</span>
            <span className="hud-value" style={{ color: game.turnNumber % 2 === 0 ? 'var(--warning)' : 'var(--cyan)' }}>
              #{game.turnNumber} {game.turnNumber % 2 === 0 ? 'EVEN' : 'ODD'}
            </span>
          </div>
          <div className="hud-divider" />
          <div className="hud-item">
            <span className="hud-label">Acting</span>
            <span className="hud-value" style={{ color: game.turn === 'player' ? 'var(--cyan)' : 'var(--danger)' }}>
              {game.turn === 'player' ? 'YOU' : 'THEM'}
            </span>
          </div>
        </div>

        <div
          className="snake-grid-container"
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize})`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize})`,
            gap: '1px',
          }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
            const x = i % BOARD_SIZE;
            const y = Math.floor(i / BOARD_SIZE);
            const pos: Position = { x, y };
            const occupant = pieceAt(game.pieces, pos);
            const isSelected = selectedPiece && positionsEqual(selectedPiece.pos, pos);
            const move = legalMoves.find(m => positionsEqual(m.to, pos));
            const mark = occupant ? marks.get(occupant.id) : undefined;
            const isDark = (x + y) % 2 === 1;
            const reveal = game.status !== 'playing' && occupant?.side === 'opponent';
            const markColor = mark === 'suspect' ? 'var(--warning)' : mark === 'clear' ? 'var(--success)' : undefined;
            const isLastFrom = lastMove && positionsEqual(lastMove.from, pos);
            const isLastTo = lastMove && positionsEqual(lastMove.to, pos);
            const isLastMoved = lastMove && occupant?.id === lastMove.pieceId;
            const lastMoveColor = lastMove?.side === 'player' ? 'rgba(0,212,255,' : 'rgba(255,51,102,';

            return (
              <div
                key={`${x},${y}`}
                onClick={() => handleCellClick(pos)}
                onContextMenu={(e) => handleContextMenu(e, pos)}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  background: isLastTo
                    ? `${lastMoveColor}0.12)`
                    : isLastFrom
                      ? `${lastMoveColor}0.06)`
                      : isDark ? 'rgba(255,255,255,0.10)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canInteract || markMode ? 'pointer' : 'default',
                  boxShadow: isSelected
                    ? 'inset 0 0 0 2px var(--cyan)'
                    : markColor
                      ? `inset 0 0 0 2px ${markColor}`
                      : isLastTo
                        ? `inset 0 0 0 1px ${lastMoveColor}0.4)`
                        : undefined,
                }}
              >
                {occupant && !occupant.captured && (
                  <div
                    style={{
                      position: 'relative',
                      width: '78%',
                      height: '78%',
                      color: occupant.side === 'player' ? 'var(--cyan)' : 'var(--danger)',
                      filter: occupant.side === 'player'
                        ? 'drop-shadow(0 0 3px rgba(0,212,255,0.5))'
                        : 'drop-shadow(0 0 3px rgba(255,51,102,0.5))',
                      outline: reveal ? `2px solid ${occupant.isOutcast ? 'var(--warning)' : 'var(--text-dim)'}` : undefined,
                      outlineOffset: '2px',
                      borderRadius: '2px',
                    }}
                    title={PIECE_LABEL[occupant.kind]}
                  >
                    <PieceIcon kind={occupant.kind} size="100%" />
                    {isLastMoved && (
                      <div style={{
                        position: 'absolute',
                        bottom: '1px',
                        right: '1px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: lastMove?.side === 'player' ? 'var(--cyan)' : 'var(--danger)',
                        boxShadow: lastMove?.side === 'player'
                          ? '0 0 6px var(--cyan), 0 0 12px rgba(0,212,255,0.6)'
                          : '0 0 6px var(--danger), 0 0 12px rgba(255,51,102,0.6)',
                      }} />
                    )}
                  </div>
                )}

                {mark && (
                  <div style={{
                    position: 'absolute',
                    top: '1px',
                    right: '1px',
                    fontSize: '0.55rem',
                    lineHeight: 1,
                    color: markColor,
                    textShadow: `0 0 4px ${markColor}`,
                  }}>
                    {mark === 'suspect' ? '⚑' : '✓'}
                  </div>
                )}

                {move && !move.isCapture && !move.isMedicTrap && (
                  <div style={{
                    position: 'absolute',
                    width: '26%',
                    height: '26%',
                    borderRadius: '50%',
                    background: move.isSwap ? 'var(--warning)' : 'var(--cyan)',
                    opacity: 0.55,
                  }} />
                )}
                {move && (move.isCapture || move.isMedicTrap) && (
                  <div style={{
                    position: 'absolute',
                    inset: '6%',
                    borderRadius: '2px',
                    boxShadow: 'inset 0 0 0 3px var(--danger)',
                    opacity: 0.75,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="led-display" style={{ width: '100%', textAlign: 'center', minHeight: '2.2em', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', letterSpacing: '0.08em' }}>
          {statusText ?? ' '}
        </div>

        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'center' }}>
          CLICK TO MOVE · USE ⚑ SUSPECT / ✓ CLEAR THEN TAP A UNIT TO MARK IT
        </div>
      </div>

      {game.status !== 'playing' && (
        <div className="game-over-overlay" style={{ position: 'fixed' }}>
          <div style={{
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: game.status === 'won' ? 'var(--success)' : 'var(--danger)',
            textTransform: 'uppercase',
            marginBottom: '4px',
            opacity: 0.7,
          }}>
            {game.status === 'won' ? '[ OPERATION SUCCESSFUL ]' : '[ CRITICAL FAILURE ]'}
          </div>
          <div className="game-over-title" style={{ color: game.status === 'won' ? 'var(--success)' : 'var(--danger)' }}>
            {game.status === 'won' ? 'INFILTRATION COMPLETE' : 'FIREWALL BREACHED'}
          </div>
          <div style={{
            fontSize: '0.6rem',
            color: game.status === 'won' ? 'rgba(0,255,136,0.6)' : 'rgba(255,51,102,0.6)',
            letterSpacing: '0.1em',
            marginBottom: '12px',
          }}>
            {game.status === 'won' ? 'All outcasts have been purged from the system.' : 'Enemy agents have compromised the network.'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 2 }}>
            <div>
              <span style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TARGETS_NEUTRALIZED  </span>
              <span style={{ color: 'var(--cyan)' }}>{game.outcastsCaptured}/{OUTCASTS_TO_WIN}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>UNITS_LOST           </span>
              <span style={{ color: 'var(--danger)' }}>{game.piecesLost}/{PIECES_LOST_TO_LOSE}</span>
            </div>
          </div>
          <button onClick={handleRestart} className="btn btn-primary">
            {game.status === 'won' ? 'RUN AGAIN' : 'RETRY HACK'}
          </button>
        </div>
      )}
    </div>
  );
}
