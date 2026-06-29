'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  GRID_SIZE,
  SPEED,
  MAX_COLORS,
  FoodColor,
  COLOR_ORDER,
  COLOR_DEFS,
  GREEN_GROWTH,
  BLUE_FREEZE,
  GRAY_GHOST,
  PURPLE_REVERSE,
  PINK_SWAP_DELAY,
  PINK_REVEAL_DURATION,
  GROWTH_GLOW_DURATION,
  SHAKE_DURATION,
  Coordinate,
  Food,
  GameState,
  INITIAL_SNAKE,
  createInitialGameState
} from './constants';
import BGMController, { BGMControllerHandle } from '@/components/BGMController';
import RulesModal from '@/components/RulesModal';
import BackButton from '@/components/BackButton';

type Snake = Coordinate[];

export default function SpectrumSnakePage() {
  const [snake, setSnake] = useState<Snake>([...INITIAL_SNAKE]);
  const snakeRef = useRef<Snake>(snake);
  const [foodList, setFoodList] = useState<Food[]>([]);
  const foodListRef = useRef<Food[]>(foodList);
  const [consumeTick, setConsumeTick] = useState(0);
  const [renderTick, setRenderTick] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [showRules, setShowRules] = useState(true);

  const touchStartRef = useRef<Coordinate | null>(null);
  const gameRef = useRef<GameState>(createInitialGameState());
  const bgmRef = useRef<BGMControllerHandle>(null);

  // ─── Sound ─────────────────────────────
  const playSound = useCallback((path: string, volume?: number) => {
    if (typeof window !== 'undefined') {
      const audio = new Audio(path);
      audio.volume = volume ?? 0.4;
      audio.play().catch(() => { });
    }
  }, []);

  // ─── Food map for O(1) lookup ──────────
  const foodMap = useMemo(() => {
    const map = new Map<string, FoodColor>();
    foodList.forEach((f) => map.set(`${f.coord.x},${f.coord.y}`, f.color));
    return map;
  }, [foodList]);

  // ─── Helpers ───────────────────────────
  const isSnakeCell = useCallback(
    (x: number, y: number) => snake.some((s) => s.x === x && s.y === y),
    [snake]
  );

  const nearHead = useCallback(
    (x: number, y: number) =>
      Math.abs(snake[0].x - x) <= 2 && Math.abs(snake[0].y - y) <= 3,
    [snake]
  );

  const nearFood = useCallback(
    (x: number, y: number, foods: Food[]) =>
      foods.some(
        (f) => Math.abs(f.coord.x - x) <= 1 && Math.abs(f.coord.y - y) <= 1
      ),
    []
  );

  const isOccupied = useCallback(
    (x: number, y: number, foods: Food[]) =>
      isSnakeCell(x, y) || nearFood(x, y, foods) || nearHead(x, y),
    [isSnakeCell, nearFood, nearHead]
  );

  const randomCoord = useCallback(
    (foods: Food[]): Coordinate => {
      let coord: Coordinate;
      let attempts = 0;
      do {
        coord = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        };
        attempts++;
      } while (isOccupied(coord.x, coord.y, foods) && attempts < 200);
      return coord;
    },
    [isOccupied]
  );

  // ─── Food color visibility ─────────────
  const isFoodVisible = useCallback((food: Food): boolean => {
    const g = gameRef.current;
    if (!g.isBlind) return true;
    if (g.yellowFilter) return true;
    if (
      g.visibleFoodCoords.some(
        (c) => c.x === food.coord.x && c.y === food.coord.y
      )
    )
      return true;
    return false;
  }, []);

  // ─── Generate level food ───────────────
  const generateLevelFood = useCallback(
    (level: number): Food[] => {
      const newFoods: Food[] = [];
      const colorCount = Math.min(level, MAX_COLORS);
      for (let i = 0; i < colorCount; i++) {
        const color = COLOR_ORDER[i];
        for (let j = 0; j < 2; j++) {
          newFoods.push({ color, coord: randomCoord(newFoods) });
        }
      }
      return newFoods;
    },
    [randomCoord]
  );

  // ─── Level transition ──────────────────
  const moveToNextLevel = useCallback(() => {
    gameRef.current.level += 1;
    gameRef.current.isBlind = false;
    playSound('/sounds/levelup.mp3');
    const newFoods = generateLevelFood(gameRef.current.level);
    setFoodList(newFoods);
  }, [generateLevelFood, playSound]);

  // ─── Swap two foods ────────────────────
  const swapFoods = useCallback(() => {
    const foods = foodListRef.current;
    if (foods.length < 2) return;
    const i = Math.floor(Math.random() * foods.length);
    let j: number;
    do {
      j = Math.floor(Math.random() * foods.length);
    } while (i === j);

    setFoodList((prev) => {
      const next = [...prev];
      const coordI = next[i].coord;
      const coordJ = next[j].coord;
      next[i] = { ...next[i], coord: coordJ };
      next[j] = { ...next[j], coord: coordI };
      gameRef.current.visibleFoodCoords = [coordI, coordJ];
      return next;
    });
    setRenderTick((t) => t + 1);

    setTimeout(() => {
      if (!gameRef.current.isOver) {
        gameRef.current.visibleFoodCoords = [];
        setRenderTick((t) => t + 1);
      }
    }, 2000);
  }, []);

  // ─── Color power-up effects ────────────
  const applyEffect = useCallback(
    (color: FoodColor) => {
      const g = gameRef.current;
      if (!g.isMatching) return;

      switch (color) {
        case FoodColor.Green:
          g.growthRemaining += GREEN_GROWTH;
          g.growthGlowEffect += GROWTH_GLOW_DURATION;
          playSound('/sounds/grow.wav');
          break;
        case FoodColor.Blue:
          g.freezeDuration += BLUE_FREEZE;
          playSound('/sounds/freeze.mp3', 0.8);
          playSound('/sounds/ice.mp3');
          break;
        case FoodColor.Red:
          g.hasShield = true;
          g.shieldUses = 1;
          g.shakeEffect = SHAKE_DURATION;
          playSound('/sounds/shield.mp3');
          break;
        case FoodColor.Yellow:
          g.yellowToken = true;
          g.isBlind = false;
          playSound('/sounds/light.mp3');
          break;
        case FoodColor.Pink:
          if (g.swapCooldown === 0) {
            g.swapCooldown = PINK_REVEAL_DURATION;
          }
          playSound('/sounds/swap.mp3', 0.9);
          break;
        case FoodColor.Gray:
          g.ghostWalkDuration += GRAY_GHOST;
          playSound('/sounds/ghostwalk.mp3');
          break;
        case FoodColor.Purple:
          g.reverseDuration += PURPLE_REVERSE;
          playSound('/sounds/reverse.mp3');
          break;
      }
    },
    [playSound]
  );

  // ─── Reset game ────────────────────────
  const resetGame = useCallback((): Snake => {
    if (maxScore < gameRef.current.score) {
      setMaxScore(gameRef.current.score);
    }
    gameRef.current = createInitialGameState();
    playSound('/sounds/hitHurt.wav');
    setFoodList([]);
    return [...INITIAL_SNAKE];
  }, [maxScore, playSound]);

  // ─── Consume food ──────────────────────
  useEffect(() => {
    if (gameRef.current.isOver) return;
    const g = gameRef.current;

    if (g.isMatching) {
      g.score += 1;
      playSound('/sounds/coin2.wav');
    } else {
      playSound('/sounds/coin1.mp3');
    }
    g.isMatching = !g.isMatching;

    if (g.yellowToken) {
      g.yellowToken = false;
      g.yellowFilter = true;
    } else {
      g.yellowFilter = false;
      g.isBlind = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumeTick]);

  // ─── Sync foodList ref ─────────────────
  useEffect(() => {
    foodListRef.current = foodList;
  }, [foodList]);

  // ─── Sync snake ref ────────────────────
  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  // ─── Direction commands ────────────────
  const goUp = useCallback(() => {
    if (gameRef.current.direction.y === 0) {
      gameRef.current.isOver = false;
      gameRef.current.isStarted = true;
      playSound('/sounds/snakeMovement.mp3');
      gameRef.current.direction = { x: 0, y: -1 };
    }
  }, [playSound]);

  const goDown = useCallback(() => {
    if (gameRef.current.direction.y === 0) {
      gameRef.current.isOver = false;
      gameRef.current.isStarted = true;
      playSound('/sounds/snakeMovement.mp3');
      gameRef.current.direction = { x: 0, y: 1 };
    }
  }, [playSound]);

  const goLeft = useCallback(() => {
    if (gameRef.current.direction.x === 0) {
      gameRef.current.isOver = false;
      gameRef.current.isStarted = true;
      playSound('/sounds/snakeMovement.mp3');
      gameRef.current.direction = { x: -1, y: 0 };
    }
  }, [playSound]);

  const goRight = useCallback(() => {
    if (gameRef.current.direction.x === 0) {
      gameRef.current.isOver = false;
      gameRef.current.isStarted = true;
      playSound('/sounds/snakeMovement.mp3');
      gameRef.current.direction = { x: 1, y: 0 };
    }
  }, [playSound]);

  const applyDirection = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      const reversed = gameRef.current.reverseDuration > 0;
      switch (dir) {
        case 'up':
          reversed ? goDown() : goUp();
          break;
        case 'down':
          reversed ? goUp() : goDown();
          break;
        case 'left':
          reversed ? goRight() : goLeft();
          break;
        case 'right':
          reversed ? goLeft() : goRight();
          break;
      }
    },
    [goUp, goDown, goLeft, goRight]
  );

  // ─── Move snake (game tick) ────────────
  const moveSnake = useCallback(() => {
    const g = gameRef.current;
    if (g.isOver) {
      setSnake([...INITIAL_SNAKE]);
      setRenderTick((t) => t + 1);
      return;
    }

    const prevSnake = snakeRef.current;

    // Decrement timers
    if (g.ghostWalkDuration > 0) {
      playSound('/sounds/deghost.wav', 0.1);
      g.ghostWalkDuration -= 1;
    }
    if (g.reverseDuration > 0) {
      if (g.reverseDuration % 10 === 0) playSound('/sounds/reverse.mp3');
      g.reverseDuration -= 1;
    }
    if (g.swapCooldown > 0) {
      if (g.swapCooldown === PINK_REVEAL_DURATION - PINK_SWAP_DELAY) {
        swapFoods();
      }
      g.swapCooldown -= 1;
    }
    if (g.growthGlowEffect > 0) g.growthGlowEffect -= 1;
    if (g.shakeEffect > 0) g.shakeEffect -= 1;

    // Freeze
    if (g.freezeDuration > 0) {
      g.freezeDuration -= 1;
      if (g.freezeDuration === 0) playSound('/sounds/thaw.wav', 0.2);
      setRenderTick((t) => t + 1);
      return;
    }

    // Calculate new head position
    const head = prevSnake[0];
    const newHead = {
      x: head.x + g.direction.x,
      y: head.y + g.direction.y
    };

    // Wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      setSnake(resetGame());
      setRenderTick((t) => t + 1);
      return;
    }

    // Body collision
    if (
      g.ghostWalkDuration === 0 &&
      prevSnake.some((s) => s.x === newHead.x && s.y === newHead.y)
    ) {
      if (g.hasShield || g.shieldUses > 0) {
        g.hasShield = false;
        g.shieldUses = 0;
        g.shakeEffect = SHAKE_DURATION;
        playSound('/sounds/hitHurt.wav', 1);
      } else {
        setSnake(resetGame());
        setRenderTick((t) => t + 1);
        return;
      }
    }

    // Food collision
    const foodIdx = foodListRef.current.findIndex(
      (f) => f.coord.x === newHead.x && f.coord.y === newHead.y
    );

    if (foodIdx !== -1) {
      const food = foodListRef.current[foodIdx];

      // Check mismatch
      if (g.isMatching && g.color !== food.color) {
        if (g.hasShield || g.shieldUses > 0) {
          g.hasShield = false;
          g.shieldUses = 0;
          g.shakeEffect = SHAKE_DURATION;
          playSound('/sounds/hitHurt.wav', 1);
        } else {
          setSnake(resetGame());
          setRenderTick((t) => t + 1);
          return;
        }
      } else {
        // Consume — remove only this exact food entry
        setFoodList(foodListRef.current.filter((_, i) => i !== foodIdx));
        g.color = food.color;
        applyEffect(food.color);
        setConsumeTick((t) => t + 1);
      }
    }

    // Growth
    let newSnake: Snake;
    if (g.growthRemaining > 0) {
      g.growthRemaining -= 1;
      newSnake = [newHead, ...prevSnake];
    } else {
      newSnake = [newHead, ...prevSnake.slice(0, -1)];
    }

    setSnake(newSnake);
    setRenderTick((t) => t + 1);
  }, [resetGame, applyEffect, swapFoods, playSound]);

  // ─── Game loop ─────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const g = gameRef.current;
      if (!g.isMatching && foodListRef.current.length === 0 && g.isStarted) {
        moveToNextLevel();
      }
      if (!g.isOver) {
        moveSnake();
      }
    }, SPEED);
    return () => clearInterval(interval);
  }, [moveSnake, moveToNextLevel]);

  // ─── Keyboard input ────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showRules) return;
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        applyDirection('up');
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        applyDirection('down');
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        applyDirection('left');
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        applyDirection('right');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showRules, applyDirection]);

  // ─── Touch input ───────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) applyDirection(dx > 0 ? 'right' : 'left');
    } else {
      if (Math.abs(dy) > 30) applyDirection(dy > 0 ? 'down' : 'up');
    }
    touchStartRef.current = null;
  };

  // ─── Grid rendering ───────────────────
  const g = gameRef.current;
  const isReversed = g.reverseDuration > 0;
  const isFrozen = g.freezeDuration > 0;
  const isGhost = g.ghostWalkDuration > 0;
  const isSwapping = g.swapCooldown > 0;
  const isGrowing = g.growthGlowEffect > 0;
  const isShaking = g.shakeEffect > 0;
  const matchColorHex = g.isMatching ? COLOR_DEFS[g.color].hex : null;

  // Calculate cell size to fit within viewport (account for HUD ~50px, top bar ~40px, padding ~24px)
  const cellSize = `min(calc((100vw - 28px) / ${GRID_SIZE}), calc((100dvh - 120px) / ${GRID_SIZE}), 16px)`;

  const snakeSet = useMemo(() => {
    const set = new Set<string>();
    snake.forEach((s) => set.add(`${s.x},${s.y}`));
    return set;
  }, [snake]);

  const snakeColor =
    g.color !== FoodColor.Blank ? COLOR_DEFS[g.color].hex : '#ffffff';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        fontFamily: 'var(--font-mono)',
        touchAction: 'none',
        transition: 'background 500ms ease',
        background: isReversed ? '#f0f0f0' : undefined,
        color: isReversed ? '#0a0a12' : undefined
      }}
    >
      <BGMController src="/sounds/snakeBGM.mp3" volume={0.1} ref={bgmRef} />

      {/* Rules Modal */}
      <RulesModal
        isOpen={showRules}
        onClose={() => {
          setShowRules(false);
          bgmRef.current?.playMusic();
        }}
        title=":: SPECTRUM SNAKE"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              lineHeight: 1.6
            }}
          >
            Eat blocks in{' '}
            <span style={{ color: 'var(--cyan)' }}>matching color pairs</span>.
            Colors are shown at level start but{' '}
            <span style={{ color: 'var(--danger)' }}>hidden</span> after you eat
            the first block. Memorize them!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                lineHeight: 1.6
              }}
            >
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>
                Matching:
              </span>{' '}
              Starting with no color, eat any block to lock into that color. The
              next block must be the same color. Success = +1 point. Mismatch =
              game over.
            </p>

          </div>

          <div
            style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}
          >
            <p
              style={{
                fontSize: '0.6rem',
                color: 'var(--text-dim)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '10px',
                fontWeight: 700
              }}
            >
              COLOR POWERS (activate on matched pair)
            </p>
            <ul className="rule-list">
              {COLOR_ORDER.map((c) => (
                <li key={c}>
                  <span
                    className="rule-color"
                    style={{ color: COLOR_DEFS[c].hex }}
                  >
                    {COLOR_DEFS[c].label}:
                  </span>{' '}
                  {COLOR_DEFS[c].description}
                </li>
              ))}
            </ul>
          </div>

          <p
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-dim)',
              lineHeight: 1.6
            }}
          >
            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>
              Controls:
            </span>{' '}
            WASD / Arrow keys or swipe on mobile.
          </p>
        </div>
      </RulesModal>

      {/* Game container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          maxWidth: '95vw'
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '8px'
          }}
        >
          <BackButton />
          <button
            onClick={() => setShowRules(true)}
            className="btn btn-ghost"
            style={{ fontSize: '0.55rem', padding: '6px 10px' }}
          >
            ? RULES
          </button>
        </div>

        {/* HUD */}
        <div
          className={`hud-bar${isShaking ? ' anim-shake' : ''}`}
          style={{
            width: '100%',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            borderColor: matchColorHex ? matchColorHex + '88' : undefined,
            boxShadow: matchColorHex
              ? `0 0 20px ${matchColorHex}33`
              : undefined,
            transition: 'border-color 300ms ease, box-shadow 300ms ease'
          }}
        >
          <div className="hud-item">
            <span className="hud-label">Score</span>
            <span className="hud-value">{g.score}</span>
          </div>
          <div className="hud-divider" />
          <div className="hud-item">
            <span className="hud-label">Level</span>
            <span className="hud-value">{g.level}</span>
          </div>
          <div className="hud-divider" />
          <div className="hud-item">
            <span className="hud-label">Best</span>
            <span className="hud-value" style={{ color: 'var(--warning)' }}>
              {maxScore}
            </span>
          </div>
          <div className="hud-divider" />
          <div className="hud-item">
            <span className="hud-label">Color</span>
            <div
              className={[
                'color-swatch',
                g.yellowFilter && 'anim-solar-flare',
                isGrowing && 'anim-jelly',
                isFrozen && 'anim-frost-intense',
                isGhost && 'anim-ghost-shiver',
                isReversed && 'anim-reverse-shake'
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                background: isFrozen
                  ? 'rgba(34, 211, 238, 0.35)'
                  : isGrowing
                    ? 'rgba(74, 222, 128, 0.28)'
                    : isReversed
                      ? 'rgba(124, 58, 237, 0.30)'
                      : g.isMatching && g.color !== FoodColor.Blank
                        ? COLOR_DEFS[g.color].hex
                        : isGhost
                          ? 'rgba(148, 163, 184, 0.13)'
                          : 'transparent',
                borderColor: isFrozen
                  ? '#22d3ee'
                  : isGrowing
                    ? '#4ade80'
                    : isReversed
                      ? '#7c3aed'
                      : g.isMatching && g.color !== FoodColor.Blank
                        ? COLOR_DEFS[g.color].hex + '88'
                        : isGhost
                          ? 'rgba(148, 163, 184, 0.30)'
                          : 'rgba(255,255,255,0.38)',
                boxShadow: isFrozen
                  ? '0 0 10px #22d3eeaa, inset 0 0 6px rgba(34,211,238,0.3)'
                  : isGrowing
                    ? '0 0 16px #4ade80cc, 0 0 32px #4ade8055, inset 0 0 8px rgba(74,222,128,0.3)'
                    : isReversed
                      ? '0 0 12px #7c3aed99, inset 0 0 8px rgba(124,58,237,0.35)'
                      : g.isMatching && g.color !== FoodColor.Blank
                        ? `0 0 8px ${COLOR_DEFS[g.color].hex}55`
                        : '0 0 4px rgba(255,255,255,0.12)'
              }}
            >
              {isFrozen && <div className="swatch-frost-crystals" />}
              {isGrowing && (
                <div className="swatch-heal-particles">
                  <span className="heal-plus hp1">+</span>
                  <span className="heal-plus hp2">+</span>
                  <span className="heal-plus hp3">+</span>
                </div>
              )}
              {g.yellowFilter && (
                <div className="swatch-core swatch-core-sun" />
              )}
              {isGhost && <div className="swatch-core swatch-core-ghost" />}
              {isReversed && <div className="swatch-core swatch-core-void" />}
              {g.hasShield && (
                <div className="swatch-ring swatch-ring-shield" />
              )}
              {isSwapping && (
                <div className="swatch-ring swatch-ring-swap anim-swap-spin" />
              )}
            </div>
          </div>

          {/* Active effects */}
          {g.hasShield && (
            <span
              className="effect-badge"
              style={{
                borderColor: COLOR_DEFS[FoodColor.Red].hex + '88',
                color: COLOR_DEFS[FoodColor.Red].hex
              }}
            >
              🛡
            </span>
          )}
          {isGhost && (
            <span
              className="effect-badge"
              style={{
                borderColor: COLOR_DEFS[FoodColor.Gray].hex + '88',
                color: COLOR_DEFS[FoodColor.Gray].hex
              }}
            >
              👻
            </span>
          )}
          {isReversed && (
            <span
              className="effect-badge"
              style={{
                borderColor: COLOR_DEFS[FoodColor.Purple].hex + '88',
                color: COLOR_DEFS[FoodColor.Purple].hex
              }}
            >
              ⟲
            </span>
          )}
          {isFrozen && (
            <span
              className="effect-badge"
              style={{
                borderColor: COLOR_DEFS[FoodColor.Blue].hex + '88',
                color: COLOR_DEFS[FoodColor.Blue].hex
              }}
            >
              ❄
            </span>
          )}
        </div>

        {/* Grid */}
        <div
          className={`snake-grid-container${isShaking ? ' anim-shake' : ''}`}
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize})`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize})`,
            gap: '0px',
            transition:
              'border-color 300ms ease, box-shadow 300ms ease, filter 500ms ease',
            filter: isReversed ? 'invert(1)' : undefined,
            borderColor: matchColorHex
              ? matchColorHex
              : isReversed
                ? COLOR_DEFS[FoodColor.Purple].hex
                : isFrozen
                  ? COLOR_DEFS[FoodColor.Blue].hex + '88'
                  : undefined,
            boxShadow: matchColorHex
              ? `inset 0 0 30px rgba(0, 0, 0, 0.5), 0 0 24px ${matchColorHex}55`
              : undefined
          }}
        >
          {/* Yellow "unblind" overlay */}
          {g.yellowFilter && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(253, 224, 71, 0.07)',
                boxShadow: 'inset 0 0 50px rgba(253, 224, 71, 0.5)',
                zIndex: 3,
                pointerEvents: 'none',
                borderRadius: 'var(--radius)',
                animation: 'pulseGlow 1.1s ease-in-out infinite'
              }}
            />
          )}

          {/* Pink swap overlay */}
          {isSwapping && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(249, 168, 212, 0.08)',
                boxShadow: 'inset 0 0 50px rgba(249, 168, 212, 0.55)',
                zIndex: 3,
                pointerEvents: 'none',
                borderRadius: 'var(--radius)',
                animation: 'pulseGlow 0.5s ease-in-out infinite'
              }}
            />
          )}

          {/* Frost overlay */}
          {isFrozen && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(34, 211, 238, 0.06)',
                zIndex: 2,
                pointerEvents: 'none',
                borderRadius: 'var(--radius)'
              }}
            />
          )}

          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const key = `${x},${y}`;

            // Snake cell?
            const isHead = snake[0].x === x && snake[0].y === y;
            const isSnakeBody = !isHead && snakeSet.has(key);
            const isTail =
              snake[snake.length - 1].x === x &&
              snake[snake.length - 1].y === y &&
              snake.length > 1;

            // Food cell?
            const foodColor = foodMap.get(key);
            const food = foodColor
              ? foodList.find((f) => f.coord.x === x && f.coord.y === y)
              : null;
            const visible = food ? isFoodVisible(food) : false;

            let bg = 'transparent';
            let shadow = 'none';
            let opacity = 1;
            let cellClass = 'snake-cell';

            // Determine snake display color based on active effect
            const effectSnakeColor = isFrozen
              ? '#22d3ee'
              : isGrowing
                ? '#4ade80'
                : snakeColor;

            // Which CSS body-effect class to attach
            const bodyEffectClass = isFrozen
              ? 'snake-frozen-body'
              : isGhost
                ? 'snake-ghost-body'
                : isGrowing
                  ? 'snake-growing-body'
                  : g.hasShield
                    ? 'snake-shielded-body'
                    : '';

            if (isHead) {
              bg = effectSnakeColor;
              if (isFrozen) {
                shadow = `0 0 8px #22d3ee, 0 0 22px #22d3eeaa, 0 0 40px #22d3ee44, inset 2px 2px 0 rgba(255,255,255,0.65), inset -2px -2px 0 rgba(0,60,100,0.40)`;
              } else if (isGrowing) {
                shadow = `0 0 8px #4ade80, 0 0 22px #4ade80cc, 0 0 40px #4ade8066`;
              } else {
                shadow = `0 0 6px ${snakeColor}, 0 0 14px ${snakeColor}`;
              }
              if (g.hasShield) {
                shadow += `, 0 0 14px #ff3366cc, 0 0 30px #ff336666`;
              }
              cellClass = `snake-cell snake-head${bodyEffectClass ? ' ' + bodyEffectClass : ''}`;
            } else if (isSnakeBody) {
              bg = effectSnakeColor;
              if (isFrozen) {
                shadow = `0 0 4px #22d3ee99, inset 1px 1px 0 rgba(255,255,255,0.60), inset -1px -1px 0 rgba(0,60,100,0.35)`;
                opacity = isTail ? 0.65 : 0.90;
              } else if (isGrowing) {
                shadow = `0 0 6px #4ade8099, 0 0 14px #4ade8055`;
                opacity = isGhost ? 0.45 : isTail ? 0.4 : 0.7;
              } else if (g.hasShield) {
                shadow = `0 0 6px #ff336677`;
                opacity = isGhost ? 0.45 : isTail ? 0.4 : 0.7;
              } else {
                opacity = isGhost ? 0.45 : isTail ? 0.4 : 0.7;
              }
              cellClass = `snake-cell snake-body${isTail ? ' snake-tail' : ''}${bodyEffectClass ? ' ' + bodyEffectClass : ''}`;
            } else if (food) {
              if (visible) {
                bg = COLOR_DEFS[food.color].hex;
                const isPinkSwapHighlight =
                  isSwapping &&
                  g.visibleFoodCoords.some(
                    (c) => c.x === x && c.y === y
                  );
                shadow = isPinkSwapHighlight
                  ? `0 0 0 1px #f9a8d4, 0 0 10px #f9a8d4cc, 0 0 20px #f9a8d488, 0 0 4px ${COLOR_DEFS[food.color].hex}`
                  : `0 0 4px ${COLOR_DEFS[food.color].hex}`;
                cellClass = 'snake-cell food-cell';
              } else {
                bg = '#ffffff';
                cellClass = 'snake-cell food-hidden';
              }
            }

            return (
              <div
                key={key}
                className={cellClass}
                style={{
                  backgroundColor: bg,
                  boxShadow: shadow,
                  opacity
                }}
              />
            );
          })}

          {/* Game Over overlay */}
          {g.isOver && g.isStarted && (
            <div className="game-over-overlay">
              <div className="game-over-title">SIGNAL LOST</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)',
                  textAlign: 'center'
                }}
              >
                <div>
                  SCORE: <span style={{ color: 'var(--cyan)' }}>{g.score}</span>
                </div>
                <div>
                  BEST:{' '}
                  <span style={{ color: 'var(--warning)' }}>{maxScore}</span>
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  animation: 'pulseGlow 2s ease-in-out infinite'
                }}
              >
                PRESS ANY DIRECTION TO REBOOT
              </div>
            </div>
          )}

          {/* Initial start prompt */}
          {g.isOver && !g.isStarted && (
            <div
              className="game-over-overlay"
              style={{ background: 'rgba(5,5,8,0.8)' }}
            >
              <div
                className="font-pixel anim-breathe"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--cyan)',
                  textAlign: 'center',
                  letterSpacing: '0.1em'
                }}
              >
                PRESS ANY DIRECTION
              </div>
              <div
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase'
                }}
              >
                TO INITIALIZE
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
