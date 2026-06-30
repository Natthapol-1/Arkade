'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ALL_KINDS, KIND_STYLE, KIND_UNLOCK_LEVEL, LIVES_START, TICK_MS, ENCRYPTED_REVEAL_Y,
  FallingWord, GameState, WordKind, createInitialState,
} from './constants';
import { tick, submitInput, fallSpeedForLevel, chainPairs } from './engine';
import BGMController, { BGMControllerHandle } from '@/components/BGMController';
import RulesModal from '@/components/RulesModal';
import BackButton from '@/components/BackButton';

function playSound(path: string, volume = 0.4) {
  if (typeof window === 'undefined') return;
  const audio = new Audio(path);
  audio.volume = volume;
  audio.play().catch(() => { });
}

function reversedText(word: string): string {
  return word.split('').reverse().join('');
}

/** Testing aid: append ?god=1 to the URL for unlimited lives. */
function readGodMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('god') === '1';
}

function WordGlyphs({ word, inputValue }: { word: FallingWord; inputValue: string }) {
  if (word.kind === 'skipLetter') {
    return (
      <>
        {word.text.split('').map((ch, i) => (
          <span
            key={i}
            style={i === word.skipIndex ? {
              color: 'var(--danger)',
              textDecoration: 'line-through',
              textShadow: '0 0 6px rgba(255,51,102,0.6)',
            } : undefined}
          >
            {ch}
          </span>
        ))}
      </>
    );
  }
  if (word.kind === 'reversed') return <>{reversedText(word.text)}</>;
  if (word.kind === 'encrypted') return <>{word.y < ENCRYPTED_REVEAL_Y ? word.garbledText : word.text}</>;
  if (word.kind === 'vanish') {
    const typing = inputValue.trim().length > 0 && word.text.startsWith(inputValue.trim().toUpperCase());
    return <>{typing ? '*'.repeat(word.text.length) : word.text}</>;
  }
  return <>{word.text}</>;
}

function wordAccent(word: FallingWord): string {
  if (word.kind === 'shielded' && word.shieldBroken) return 'var(--text-dim)';
  if (word.kind === 'encrypted' && word.y < ENCRYPTED_REVEAL_Y) return 'var(--text-muted)';
  return KIND_STYLE[word.kind].accent;
}

function kindIcon(kind: WordKind, shieldBroken: boolean): string {
  switch (kind) {
    case 'shielded': return shieldBroken ? '' : '🛡';
    case 'virus': return '☣';
    case 'reversed': return '⇄';
    case 'slow': return '❄';
    case 'boost': return '⚡';
    case 'erratic': return '◇';
    case 'chained': return '🔗';
    case 'shifting': return '⟳';
    case 'spawner': return '✱';
    case 'vanish': return '👻';
    case 'encrypted': return '🔒';
    default: return '';
  }
}

export default function TypeScriptPage() {
  const [showRules, setShowRules] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [renderTick, setRenderTick] = useState(0);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const gameRef = useRef<GameState | null>(null);
  const bgmRef = useRef<BGMControllerHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFlash = useCallback((kind: 'hit' | 'miss') => {
    setFlash(kind);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 200);
  }, []);

  // Focus the input once it's actually enabled. Calling .focus() inside the
  // RulesModal's onClose handler is too early — `disabled` is still true in
  // the DOM until this state update commits, so a synchronous focus() there
  // is a no-op. This effect runs after the re-render, once disabled={false}.
  useEffect(() => {
    if (!showRules) inputRef.current?.focus({ preventScroll: true });
  }, [showRules]);

  // Lock the entire page from scrolling while this game is mounted.
  // Without this, the browser auto-scrolls to centre the focused input
  // when the on-screen keyboard opens, which pushes the game field off-screen.
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
      document.body.style.overflow = '';
    };
  }, []);

  // Track Visual Viewport height so we can detect when the on-screen keyboard
  // opens on mobile. When the keyboard appears, visualViewport.height shrinks;
  // we compute the difference from the window height and store it as keyboardHeight
  // so the breach-field can shrink accordingly, preventing dead space.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const kbH = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(kbH);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // The input must never lose focus while playing — clicking anything else
  // on the page (buttons, the field itself, etc.) steals focus first, then
  // this immediately steals it back so typing always lands in the box.
  const handleInputBlur = useCallback(() => {
    if (showRules) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [showRules]);

  // Game loop — paused while the rules modal is open. Resuming compensates
  // all absolute timestamps for however long the pause lasted, so words
  // don't jump/flood the instant the modal closes.
  useEffect(() => {
    if (showRules) return;
    const now0 = Date.now();
    if (!gameRef.current) {
      gameRef.current = createInitialState(now0, readGodMode());
    } else {
      const paused = now0 - gameRef.current.now;
      gameRef.current = {
        ...gameRef.current,
        now: now0,
        lastSpawnAt: gameRef.current.lastSpawnAt + paused,
        words: gameRef.current.words.map(w => ({ ...w, spawnedAt: w.spawnedAt + paused })),
        effects: gameRef.current.effects.map(e => ({ ...e, expiresAt: e.expiresAt + paused })),
      };
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const wasPlaying = gameRef.current!.status === 'playing';
      const { state, breached } = tick(gameRef.current!, now);
      gameRef.current = state;

      for (const w of breached) {
        if (w.kind !== 'virus') {
          playSound('/sounds/hitHurt.wav', 0.45);
          triggerFlash('miss');
        }
      }
      if (wasPlaying && state.status === 'lost') {
        playSound('/sounds/shieldBreak.mp3', 0.5);
        setShowGameOver(true);
      }
      setRenderTick(t => t + 1);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [showRules]);

  const handleSubmit = useCallback(() => {
    if (!gameRef.current || gameRef.current.status !== 'playing') return;
    const { state, outcome } = submitInput(gameRef.current, inputValue);
    gameRef.current = state;
    setInputValue('');

    switch (outcome.type) {
      case 'destroyed':
        playSound('/sounds/coin1.mp3', 0.5);
        triggerFlash('hit');
        break;
      case 'shieldHit':
        playSound('/sounds/shieldBreak.mp3', 0.4);
        triggerFlash('hit');
        break;
      case 'virusPenalty':
        playSound('/sounds/hitHurt.wav', 0.55);
        triggerFlash('miss');
        break;
      case 'miss':
        if (inputValue.trim()) {
          playSound('/sounds/incorrect.mp3', 0.25);
          triggerFlash('miss');
        }
        break;
    }
    if (gameRef.current.status === 'lost') {
      playSound('/sounds/shieldBreak.mp3', 0.5);
      setShowGameOver(true);
    }
    setRenderTick(t => t + 1);
  }, [inputValue, triggerFlash]);

  const handlePlayAgain = useCallback(() => {
    gameRef.current = createInitialState(Date.now(), readGodMode());
    setInputValue('');
    setShowGameOver(false);
    setRenderTick(t => t + 1);
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // godMode-only testing aid — jump several levels at once instead of grinding
  // WORDS_PER_LEVEL destroys per level to reach high-level kinds/speeds.
  const handleLevelJump = useCallback(() => {
    if (!gameRef.current) return;
    gameRef.current = { ...gameRef.current, level: gameRef.current.level + 5, destroyedThisLevel: 0 };
    setRenderTick(t => t + 1);
  }, []);

  const game = gameRef.current;
  const unlockedKinds = ALL_KINDS.filter(k => !game || KIND_UNLOCK_LEVEL[k] <= game.level);
  const slowActive = !!game?.effects.some(e => e.kind === 'slow' && e.expiresAt > game.now);
  const lives = game?.lives ?? LIVES_START;
  const livesPct = Math.max(0, Math.min(100, (lives / LIVES_START) * 100));
  const batteryColor = livesPct > 60 ? 'var(--success)' : livesPct > 30 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="type-script-page">
      <BGMController src="/sounds/typingGameBGM.mp3" volume={0.15} ref={bgmRef} />

      <RulesModal
        isOpen={showRules}
        onClose={() => { setShowRules(false); bgmRef.current?.playMusic(); }}
        title=":: TYPE:SCRIPT"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Words fall toward your <span style={{ color: 'var(--cyan)' }}>Core</span>. Type a word exactly as it
            appears and press <span style={{ color: 'var(--cyan)' }}>Enter</span> to destroy it before it breaches.
            You start with <span style={{ color: 'var(--danger)' }}>{LIVES_START} lives</span> — most breaches cost one.
          </p>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>
              WORD TYPES (unlock as you level up)
            </p>
            <ul className="rule-list">
              {ALL_KINDS.map(k => (
                <li key={k} style={{ opacity: KIND_UNLOCK_LEVEL[k] <= (game?.level ?? 1) ? 1 : 0.45 }}>
                  <span className="rule-color" style={{ color: KIND_STYLE[k].accent }}>
                    {KIND_STYLE[k].label}{KIND_UNLOCK_LEVEL[k] > 1 ? ` (Lv ${KIND_UNLOCK_LEVEL[k]})` : ''}:
                  </span>{' '}
                  {KIND_STYLE[k].hint}
                </li>
              ))}
            </ul>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>Controls:</span> Just type and press Enter —
            the box is always focused. Typos don&apos;t cost you anything, they just don&apos;t match.
          </p>
        </div>
      </RulesModal>

      <div className="ts-layout" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '520px' }}>
        <div className="ts-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
          <BackButton />
          <div style={{ display: 'flex', gap: '8px' }}>
            {game?.godMode && (
              <button
                onClick={handleLevelJump}
                className="btn btn-ghost"
                style={{ fontSize: '0.55rem', padding: '6px 10px', borderColor: 'var(--success)', color: 'var(--success)' }}
              >
                ⏩ LV+5
              </button>
            )}
            <button onClick={() => setShowRules(true)} className="btn btn-ghost" style={{ fontSize: '0.55rem', padding: '6px 10px' }}>
              ? RULES
            </button>
          </div>
        </div>

        <div className="hud-bar ts-hud" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="hud-item">
            <span className="hud-label">Lives</span>
            {game?.godMode ? (
              <span className="hud-value" style={{ color: 'var(--success)' }}>∞</span>
            ) : (
              <div className="battery" title={`${lives}/${LIVES_START} lives`}>
                <div
                  className="battery-fill"
                  style={{ width: `${livesPct}%`, background: batteryColor, boxShadow: `0 0 6px ${batteryColor}` }}
                />
                <div className="battery-nub" />
              </div>
            )}
          </div>
          <div className="hud-divider" />
          <div className="hud-item">
            <span className="hud-label">Score</span>
            <span className="hud-value">{game?.score ?? 0}</span>
          </div>
          <div className="hud-divider" />
          <div className="hud-item">
            <span className="hud-label">Level</span>
            <span className="hud-value" style={{ color: 'var(--cyan)' }}>{game?.level ?? 1}</span>
          </div>
          {slowActive && (
            <span className="effect-badge" style={{ borderColor: 'rgba(186,230,253,0.5)', color: '#bae6fd' }}>❄ SLOWED</span>
          )}
        </div>

        <div
          className="breach-field"
          onClick={() => inputRef.current?.focus()}
          style={{
            boxShadow: flash === 'hit'
              ? 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 16px rgba(0,255,136,0.5), 0 0 40px rgba(0,255,136,0.25)'
              : flash === 'miss'
                ? 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 16px rgba(255,51,102,0.5), 0 0 40px rgba(255,51,102,0.25)'
                : undefined,
            transition: 'box-shadow 150ms ease, height 200ms ease',
            ...(keyboardHeight > 0 ? {
              height: `calc(100dvh - ${keyboardHeight}px - 200px)`,
              minHeight: '120px',
            } : {}),
          }}
        >
          {chainPairs(game?.words ?? []).map(([first, second]) => (
            <div
              key={`${first.chainId}-link`}
              className="breach-chain-link"
              style={{
                top: `${first.y}%`,
                left: `${first.x}%`,
                width: `${second.x - first.x}%`,
              }}
            />
          ))}

          {game?.words.map(w => {
            const broken = w.kind === 'shielded' && w.shieldBroken;
            const accent = wordAccent(w);
            const icon = kindIcon(w.kind, w.shieldBroken);
            return (
              <div
                key={w.id}
                className="breach-word"
                style={{
                  left: `${w.x}%`,
                  top: `${w.y}%`,
                  color: accent,
                  borderColor: `${accent}66`,
                  boxShadow: `0 0 10px ${accent}33`,
                  opacity: broken ? 0.75 : 1,
                }}
              >
                {icon && <span className="breach-word-icon">{icon}</span>}
                <span className="breach-word-text">
                  <WordGlyphs word={w} inputValue={inputValue} />
                </span>
              </div>
            );
          })}

          <div className="breach-core-line" />
        </div>

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          onBlur={handleInputBlur}
          className="breach-input ts-input"
          placeholder="TYPE THE WORD..."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={showRules}
        />

        <div className="ts-hint" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'center' }}>
          {unlockedKinds.length < ALL_KINDS.length
            ? `NEXT UNLOCK: LV ${Math.min(...ALL_KINDS.filter(k => KIND_UNLOCK_LEVEL[k] > (game?.level ?? 1)).map(k => KIND_UNLOCK_LEVEL[k]))} — ${KIND_STYLE[ALL_KINDS.find(k => KIND_UNLOCK_LEVEL[k] === Math.min(...ALL_KINDS.filter(kk => KIND_UNLOCK_LEVEL[kk] > (game?.level ?? 1)).map(kk => KIND_UNLOCK_LEVEL[kk])))!].label.toUpperCase()}`
            : `FALL SPEED ${fallSpeedForLevel(game?.level ?? 1).toFixed(1)}%/s — ALL WORD TYPES ACTIVE`}
        </div>
      </div>

      {showGameOver && (
        <div className="game-over-overlay" style={{ position: 'fixed' }}>
          <div className="game-over-title">SYNTAX ERROR</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            <div>SCORE: <span style={{ color: 'var(--cyan)' }}>{game?.score ?? 0}</span></div>
            <div>LEVEL REACHED: <span style={{ color: 'var(--warning)' }}>{game?.level ?? 1}</span></div>
          </div>
          <button onClick={handlePlayAgain} className="btn btn-primary">
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
