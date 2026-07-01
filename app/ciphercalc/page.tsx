'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generatePuzzle,
  checkAnswer,
  opSymbol,
  getHiddenOps,
  isTargetVisible,
  Difficulty,
  Puzzle,
  Operation,
} from './engine';
import BGMController, { BGMControllerHandle } from '@/components/BGMController';
import RulesModal from '@/components/RulesModal';
import BackButton from '@/components/BackButton';

export default function CipherCalcPage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [playerNumbers, setPlayerNumbers] = useState<number[]>([0, 0, 0, 0]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<{ message: string; correct: boolean } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [shakeKey, setShakeKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const bgmRef = useRef<BGMControllerHandle>(null);

  // Initialize puzzle on mount
  useEffect(() => {
    setPuzzle(generatePuzzle());
  }, []);

  const playSound = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      const audio = new Audio(path);
      audio.volume = 0.4;
      audio.play().catch(() => { });
    }
  }, []);

  const handleNumber = useCallback((num: number) => {
    playSound('/sounds/numberClick.mp3');
    setPlayerNumbers(prev =>
      prev.map((n, i) => (i === selectedIdx ? num : n))
    );
  }, [selectedIdx, playSound]);

  const handleClear = useCallback(() => {
    playSound('/sounds/commandClick.mp3');
    setPlayerNumbers([0, 0, 0, 0]);
  }, [playSound]);

  const handleCheck = useCallback(() => {
    if (!puzzle) return;

    // No repeated numbers (all modes)
    const unique = new Set(playerNumbers);
    if (unique.size !== 4) {
      setStatus({ message: 'NO REPEATS ALLOWED', correct: false });
      setShakeKey(k => k + 1);
      playSound('/sounds/incorrect.mp3');
      return;
    }

    // Reject all zeros in medium/hard
    if (difficulty !== 'easy' && playerNumbers.every(n => n === 0)) {
      setStatus({ message: 'INPUT REJECTED', correct: false });
      setShakeKey(k => k + 1);
      playSound('/sounds/incorrect.mp3');
      return;
    }

    const result = checkAnswer(playerNumbers, puzzle.operations, puzzle.target);
    setStatus({ message: result.message, correct: result.correct });
    setShakeKey(k => k + 1);

    if (result.correct) {
      playSound('/sounds/correct.mp3');
      setScore(s => s + 1);
    } else {
      playSound('/sounds/incorrect.mp3');
    }
  }, [puzzle, playerNumbers, difficulty, playSound]);

  const handleNext = useCallback(() => {
    playSound('/sounds/commandClick.mp3');
    setPuzzle(generatePuzzle());
    setPlayerNumbers([0, 0, 0, 0]);
    setSelectedIdx(0);
    setStatus(null);
    setShowAnswer(false);
    setTimeLeft(120);
  }, [playSound]);

  const handleGiveUp = useCallback(() => {
    playSound('/sounds/hitHurt.wav');
    setShowAnswer(true);
    setScore(0);
    setStatus({ message: 'DECRYPTION FAILED', correct: false });
  }, [playSound]);

  // ─── Per-puzzle countdown timer ────────────
  useEffect(() => {
    if (showRules || showAnswer || status?.correct) return;
    if (timeLeft <= 0) {
      // Time's up — auto give-up
      playSound('/sounds/hitHurt.wav');
      setShowAnswer(true);
      setScore(0);
      setStatus({ message: "TIME'S UP", correct: false });
      return;
    }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, showRules, showAnswer, status?.correct, playSound]);

  const selectBox = useCallback((idx: number) => {
    playSound('/sounds/numberClick.mp3');
    setSelectedIdx(idx);
  }, [playSound]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showRules) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleNumber(Number(e.key));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        playSound('/sounds/numberClick.mp3');
        setSelectedIdx(prev => (prev < 3 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playSound('/sounds/numberClick.mp3');
        setSelectedIdx(prev => (prev > 0 ? prev - 1 : 3));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (status?.correct) {
          handleNext();
        } else {
          handleCheck();
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleNumber(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRules, handleNumber, handleCheck, handleNext, status, playSound]);

  if (!puzzle) return null;

  const hiddenOps = getHiddenOps(difficulty);
  const targetVisible = isTargetVisible(difficulty);
  const isCorrect = status?.correct === true;

  const diffColors: Record<Difficulty, { color: string; bg: string; class: string }> = {
    easy: { color: '#00d4ff', bg: 'rgba(0,212,255,0.05)', class: 'active-easy' },
    medium: { color: '#ffaa00', bg: 'rgba(255,170,0,0.05)', class: 'active-medium' },
    hard: { color: '#ff3366', bg: 'rgba(255,51,102,0.05)', class: 'active-hard' },
  };

  const currentDiff = diffColors[difficulty];

  return (
    <div style={{
      height: '100dvh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      fontFamily: 'var(--font-mono)',
    }}>
      {/* Rules Modal */}
      <RulesModal
        isOpen={showRules}
        onClose={() => {
          setShowRules(false);
          bgmRef.current?.playMusic();
        }}
        title=":: CIPHERCALC"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            <span style={{ color: 'red' }}>Choose your difficulty at the top bar.</span> Fill the boxes with digits to make the equation match the target result.
            Press <span style={{ color: 'var(--cyan)' }}>CHECK</span> to see how close you are.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>EASY:</span>
              <span style={{ color: 'var(--text-dim)' }}> Target visible. All operations shown.</span>
            </p>
            <p style={{ fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--warning)', fontWeight: 700 }}>MEDIUM:</span>
              <span style={{ color: 'var(--text-dim)' }}> Target hidden. One operation is hidden.</span>
            </p>
            <p style={{ fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 700 }}>HARD:</span>
              <span style={{ color: 'var(--text-dim)' }}> Target hidden. First and last operations hidden.</span>
            </p>
          </div>

          <ul className="rule-list">
            <li><span style={{ color: 'var(--text)' }}>Division:</span> Integer only (decimals are floored)</li>
            <li><span style={{ color: 'var(--text)' }}>Zero guard:</span> Division by zero = 0</li>
            <li><span style={{ color: 'var(--text)' }}>Feedback:</span> Shows absolute difference between your result and target</li>
            <li><span style={{ color: 'var(--text)' }}>No repeats:</span> Each digit can only be used once (all modes)</li>
            <li><span style={{ color: 'var(--text)' }}>Precedence:</span> × and ÷ are calculated before + and −</li>
            <li><span style={{ color: 'var(--warning)' }}>Timer:</span> Each question has 120 seconds.</li>
          </ul>
        </div>
      </RulesModal>

      <BGMController src="/sounds/calculatorBGM.mp3" volume={0.1} ref={bgmRef} />

      {/* Main container */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}>
          <BackButton />
          <button
            onClick={() => { playSound('/sounds/gameModeClick.mp3'); setShowRules(true); }}
            className="btn btn-ghost"
            style={{ fontSize: '0.55rem', padding: '6px 10px' }}
          >
            ? RULES
          </button>
        </div>

        {/* Calculator panel */}
        <div
          key={shakeKey}
          className={`crt-frame panel-dotmatrix ${status && !isCorrect ? 'anim-shake' : ''}`}
          style={{
            padding: '24px 20px',
            boxShadow: isCorrect
              ? `inset 0 0 30px rgba(0,0,0,0.5), var(--success-glow)`
              : `inset 0 0 30px rgba(0,0,0,0.5), 0 0 12px ${currentDiff.color}55, 0 0 28px ${currentDiff.color}30, 0 0 60px ${currentDiff.color}14`,
            transition: 'box-shadow 300ms ease',
          }}
        >
          {/* Difficulty selector + timer + score */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    playSound('/sounds/gameModeClick.mp3');
                  }}
                  className={`diff-tab ${difficulty === d ? diffColors[d].class : ''}`}
                >
                  {d}
                </button>
              ))}
              {/* ∑ Summation timer — right next to hard button */}
              <span
                title={`${timeLeft}s remaining`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  marginLeft: '4px',
                  transform: 'translate(4px, -2px)',
                  color: timeLeft > 15
                    ? 'var(--cyan)'
                    : timeLeft > 5
                      ? 'var(--warning)'
                      : 'var(--danger)',
                  textShadow: timeLeft <= 5
                    ? '0 0 8px var(--danger), 0 0 16px rgba(255,51,102,0.6)'
                    : timeLeft <= 15
                      ? '0 0 6px var(--warning)'
                      : '0 0 6px rgba(0,212,255,0.4)',
                  animation: timeLeft <= 5 ? 'sumPulse 0.5s ease-in-out infinite' : undefined,
                  WebkitMaskImage: `linear-gradient(to bottom, transparent ${100 - (timeLeft / 120) * 100}%, black ${100 - (timeLeft / 120) * 100}%)`,
                  maskImage: `linear-gradient(to bottom, transparent ${100 - (timeLeft / 120) * 100}%, black ${100 - (timeLeft / 120) * 100}%)`,
                  WebkitMaskSize: '100% 100%',
                  transition: 'color 500ms ease, text-shadow 500ms ease',
                }}
              >
                ∑
              </span>
            </div>

            <div className="led-display" style={{
              fontSize: '0.7rem',
              color: isCorrect ? 'var(--success)' : 'var(--cyan)',
              borderColor: isCorrect ? 'rgba(0,255,136,0.2)' : undefined,
            }}>
              {score}
            </div>
          </div>

          {/* Calculator screen */}
          <div style={{
            background: 'var(--void)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px 16px',
            marginBottom: '16px',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {showAnswer && puzzle ? (
              /* ── Answer reveal (replaces equation) ── */
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: 'var(--text-dim)',
                  marginBottom: '10px',
                }}>
                  ANSWER
                </div>
                <div className="font-pixel" style={{
                  fontSize: '1rem',
                  color: 'var(--success)',
                  textShadow: '0 0 8px rgba(0,255,136,0.4)',
                  letterSpacing: '0.12em',
                  marginBottom: '6px',
                }}>
                  {puzzle.numbers.map((n, i) => (
                    <span key={i}>
                      {n}
                      {i < puzzle.operations.length && (
                        <span style={{ color: '#cc44ff', margin: '0 4px' }}>
                          {opSymbol(puzzle.operations[i])}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="font-pixel" style={{
                  fontSize: '1.4rem',
                  color: 'var(--success)',
                  textShadow: '0 0 12px rgba(0,255,136,0.5), 0 0 30px rgba(0,255,136,0.2)',
                }}>
                  = {puzzle.target}
                </div>
              </div>
            ) : (
              /* ── Normal equation display ── */
              <>
                {/* Target */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.25em',
                    color: 'var(--text-dim)',
                    marginBottom: '6px',
                  }}>
                    Target Result
                  </div>
                  <div className="font-pixel" style={{
                    fontSize: '1.8rem',
                    color: isCorrect ? 'var(--success)' : targetVisible ? currentDiff.color : 'var(--text-dim)',
                    textShadow: (isCorrect || targetVisible)
                      ? `0 0 12px currentColor, 0 0 30px currentColor`
                      : 'none',
                    transition: 'all 300ms ease',
                  }}>
                    {(targetVisible || isCorrect) ? puzzle.target : '???'}
                  </div>
                </div>

                {/* Equation boxes */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  flexWrap: 'wrap',
                }}>
                  {playerNumbers.map((num, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => selectBox(idx)}
                        className={`eq-box ${selectedIdx === idx ? 'selected' : ''}`}
                        style={isCorrect ? {
                          borderColor: 'var(--success)',
                          color: 'var(--success)',
                          boxShadow: '0 0 8px rgba(0,255,136,0.3)',
                          animation: 'none',
                        } : undefined}
                      >
                        {num}
                      </button>
                      {idx < puzzle.operations.length && (
                        <span className={`eq-op ${hiddenOps.includes(idx) && !isCorrect ? 'eq-op-hidden' : ''}`}>
                          {(hiddenOps.includes(idx) && !isCorrect)
                            ? '?'
                            : opSymbol(puzzle.operations[idx])}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Status feedback */}
          <div
            className={status ? "anim-slide-up" : ""}
            style={{
              textAlign: 'center',
              padding: '8px 12px',
              marginBottom: '12px',
              fontFamily: 'var(--font-pixel)',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              color: status ? (status.correct ? 'var(--success)' : 'var(--danger)') : 'var(--text-dim)',
              textShadow: status ? `0 0 10px currentColor` : 'none',
              border: `1px solid ${status ? (status.correct ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)') : 'transparent'}`,
              background: status ? (status.correct ? 'rgba(0,255,136,0.05)' : 'rgba(255,51,102,0.05)') : 'transparent',
              borderRadius: 'var(--radius)',
              minHeight: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease',
            }}
          >
            {status ? status.message : 'AWAITING INPUT...'}
          </div>

          {/* Numpad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginBottom: '12px',
          }}>
            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
              <button
                key={num}
                onClick={() => handleNumber(num)}
                className="btn-numpad"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="btn-numpad"
              style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}
            >
              CLR
            </button>
            <button
              onClick={() => handleNumber(0)}
              className="btn-numpad"
            >
              0
            </button>
            <button
              onClick={handleCheck}
              className="btn-numpad"
              style={{
                background: `linear-gradient(180deg, ${currentDiff.color}22 0%, ${currentDiff.color}11 100%)`,
                borderColor: `${currentDiff.color}66`,
                color: currentDiff.color,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}
            >
              CHK
            </button>
          </div>

          {/* Action row — fixed height area so layout never shifts */}
          <div style={{ textAlign: 'center', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(isCorrect || showAnswer) && (
              <button
                onClick={handleNext}
                className="btn btn-success anim-slide-up"
                style={{ width: '100%' }}
              >
                NEXT CIPHER →
              </button>
            )}

            {!isCorrect && !showAnswer && (
              <button
                onClick={handleGiveUp}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'color 150ms ease',
                  padding: '8px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {'>'} GIVE UP {'<'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
