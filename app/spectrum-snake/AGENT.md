# Spectrum Snake — Agent Notes

Classic Snake with a memory-game twist: eating a block locks you into its
color; every other block on the board then hides its color until your next
eat. You have to remember where the matching color was.

## Files

- **`constants.ts`** — all types, tunables (`GRID_SIZE = 30`, `SPEED = 150`ms/tick, effect durations), the `FoodColor` enum + `COLOR_DEFS` (hex/label/description per color, doubling as the in-game power-up legend), and `createInitialGameState()`.
- **`page.tsx`** — everything else: game loop, input, rendering, sound. No `engine.ts` split here (unlike the other two games) — the loop and rules are small enough to live inline, and most of the "logic" is really just `GameState` field mutation.

## The single most important fact: `gameRef` vs React state

`gameRef = useRef<GameState>(...)` holds the authoritative live game state and is **mutated directly** (`g.score += 1`, `g.freezeDuration -= 1`, etc.) all over `moveSnake` and `applyEffect`. Mutating a ref does **not** trigger a re-render. Every code path that changes `gameRef.current` and needs the screen to update also bumps `renderTick` (`setRenderTick(t => t + 1)`) or goes through an actual state setter (`setSnake`, `setFoodList`, `setConsumeTick`). If you add a new mutable field to `GameState` and a new effect that changes it, **you must also force a re-render** or the UI will silently desync from the ref.

`snake` (the body) and `foodList` *are* real React state (so they can re-render the grid), but are also mirrored into `snakeRef`/`foodListRef` so the game-loop closures (`moveSnake`, captured once per `setInterval` tick via `useCallback` deps) always read the latest value instead of a stale closure snapshot.

## Game loop

One `setInterval(..., SPEED)` in a `useEffect` calls `moveSnake()` every tick (150ms). `moveSnake` does, in order: if `isOver`, reset the rendered snake and bail; decrement all the active effect timers (ghost, reverse, swap-cooldown, growth-glow, shake); if frozen, bail without moving; compute the new head; check wall collision → `resetGame()`; check body collision → shield-absorb or `resetGame()`; check food collision → mismatch (shield-absorb or `resetGame()`) or consume; then grow-or-slide the body.

## Color-matching mechanic — exact firing order

This is the part most likely to confuse a future edit. Eating food does two separate things, at two separate times, both keyed off `consumeTick`:

1. **Synchronously, inside `moveSnake`** (same tick as the collision): `g.color = food.color`, then `applyEffect(food.color)` runs — but `applyEffect` immediately returns if `!g.isMatching`. So on the *first* eat of a new pair (`isMatching` is still `false` from before), the power-up switch never executes — only color-locking happens.
2. **In the next render's `useEffect` keyed on `consumeTick`**: reads `g.isMatching` (still the *pre-toggle* value), plays `coin1.mp3` (first eat) or awards `+1` score and plays `coin2.wav` (second/matching eat), *then* flips `g.isMatching = !g.isMatching`.

Net effect: the power-up (steps in `applyEffect`'s `switch`) only actually fires on the **second** eat of a pair — i.e. on a successful match — because that's the only time `g.isMatching` is `true` when `applyEffect` runs. If you add a new color/power-up, put the effect logic in `applyEffect`'s switch; don't duplicate the "first vs second eat" gating elsewhere.

Separately, in that same `consumeTick` effect, `yellowToken` (set by a yellow match) controls whether the *next* eat — any color — briefly reveals all food (`yellowFilter = true`) or goes back to hidden (`isBlind = true`). This runs on every consume, independent of the match/no-match power-up gating above.

## Power-ups (`COLOR_DEFS`, `applyEffect`)

Green = grow +2 (`growthRemaining`), Blue = freeze (`freezeDuration`, blocks movement entirely while >0), Red = 1 collision shield (`hasShield`/`shieldUses`, consumed on the next would-be-fatal hit instead of dying), Yellow = reveal-all-until-next-eat (see above), Pink = swaps two random foods after a short delay (`swapCooldown` / `PINK_SWAP_DELAY`, see `swapFoods`), Gray = ghost walk through own body (`ghostWalkDuration`), Purple = reverses control input (`reverseDuration`; `applyDirection` flips up↔down/left↔right while active).

## Food placement & level scaling

`generateLevelFood(level)` spawns `min(level, MAX_COLORS)` colors, 2 of each, via `randomCoord` which rejects squares too close to the snake head, existing food, or the snake body (`isOccupied`/`nearHead`/`nearFood`) — up to 200 attempts before giving up and placing anyway. Levels advance (`moveToNextLevel`) once `foodList` is empty and `isMatching` is false (i.e., you cleared all pairs on the board cleanly).

## Game over flow

A collision calls `resetGame()`, which: updates `maxScore` if beaten, **snapshots the final score into `finalScore` React state and sets `showGameOver = true` before wiping `gameRef.current`** back to a fresh `createInitialGameState()`. The snapshot exists because `gameRef` gets cleared synchronously — reading `gameRef.current.score` in the post-death render would always show `0` otherwise. The game-over popup (`.game-over-overlay`, `position: fixed`, title "SIGNAL LOST", score/best, "PLAY AGAIN" button calling `handlePlayAgain`) is intentionally separate from the in-grid "PRESS ANY DIRECTION TO INITIALIZE" prompt (`g.isOver && !g.isStarted && !showGameOver`) — every path that resumes play (the button, or any directional key/swipe) clears `showGameOver` so the two never render on top of each other.

## Input

Keyboard (`WASD`/arrows) and touch swipe (`handleTouchStart`/`handleTouchEnd`, 30px threshold) both funnel into `applyDirection`, which applies the Purple reverse-controls flip, then `goUp`/`goDown`/`goLeft`/`goRight`. Each of those guards on the *perpendicular* axis being zero (`direction.y === 0` for up/down) — this is what prevents an instant 180° self-collision, and it's also what (re)starts the game: the very first valid directional input flips `isOver = false`, `isStarted = true`. `handlePlayAgain` reproduces this manually (forcing `direction = {0,-1}`) so the "PLAY AGAIN" button can restart play without waiting for a keypress.

## If extending

- New power-up color: add to `FoodColor` enum, `COLOR_ORDER` (unlock order — also caps at `MAX_COLORS`), `COLOR_DEFS` (hex/label/description — description doubles as the in-game rules text), a duration/flag field on `GameState`, a case in `applyEffect`'s switch, and decrement/visual-effect handling in `moveSnake`/the render section as needed.
- Remember the ref/state split above before adding any new "timer" field — decrementing it in `moveSnake` is silent unless something also bumps `renderTick`.
