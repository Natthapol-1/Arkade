# Arkade - Working Memory & Architecture

## Project Overview
**Name:** Arkade
**Stack:** Next.js 15+, React 19, TypeScript
**Design Philosophy:** A professional retro-futuristic terminal/CRT aesthetic. High-performance styling using CSS variables, custom glows, CRT scanlines, and pixel/monospace typography (Press Start 2P, Share Tech Mono).

## Core Architecture
- **Web App Setup:** Built as a single-page style Next.js application using the App Router.
- **Global Styles:** Handled centrally in `app/globals.css`, defining all CRT shaders, scanlines, animations (breathing glows, slides), and design tokens.
- **Layout Constraints:** The entire app is strictly designed to fit within a single viewport (`100dvh`, `overflow: hidden`). Games have dynamic sizing logic so they scale properly on mobile and desktop without requiring scrolling.
- **Lobby (`/app/page.tsx`):** Renders the 4 game cards in a CSS grid. **Gotcha:** with 3 items in a 2-column grid, one column ends up with 2 cards stacked and the other with only 1 — plain `gridTemplateColumns: 'repeat(2, 1fr)'` lets each column's *own* content set an independent minimum width (the `auto` basis of a bare `1fr` track), so the lone-card column can size differently from the two-card column even though `.game-card` has `aspect-ratio: 1`. Use `repeat(2, minmax(0, 1fr))` to force genuinely equal columns regardless of how many/which cards land in each.

## Shared Components (`/components`)
- **`BGMController`:** A terminal-style audio widget that handles background music looping and volume control. Every game wires it up the same way: a `bgmRef` starts paused, and `RulesModal`'s `onClose` calls `bgmRef.current?.playMusic()` so music only starts once the player dismisses the rules (autoplay-policy friendly).
- **`RulesModal`:** A reusable, animated CRT-style overlay to display game instructions before a session starts.
- **`BackButton`:** A standard navigation widget to return to the main lobby.
- **Game-over pattern:** Painting Python, Outcast Assembly, and Type:Script all share one visual pattern for "run ended" — the global `.game-over-overlay` class rendered with `position: 'fixed'` (full-viewport, not clipped to a grid container), a `.game-over-title`, a small stats block, and a `btn btn-primary` "PLAY AGAIN" button. CipherCalc's win-state and the lobby don't need this; CipherCalc shows its "answer reveal" inline instead since there's no real "loss" state.

## Game 1: CipherCalc (`/app/ciphercalc`)
A math puzzle game disguised as a decryption terminal.
- **Architecture:** 
  - `engine.ts`: Pure math evaluation logic, number generation, difficulty scaling.
  - `page.tsx`: UI layer handling the calculator display, numpad inputs, and difficulty tabs.
- **Mechanics:** 
  - Players are given 4 numbers and must find the target result using basic operations (+, -, *, /).
  - **Rules:** Integer division only, division by zero equals 0, standard operator precedence.
  - **No Repeats:** Players cannot reuse the same digit twice across all difficulties.
  - **Difficulty Scaling:** Easy (target & ops visible) -> Medium (target visible, ops hidden) -> Hard (target hidden, ops hidden).
- **UI Details:** The calculator screen is a fixed size. The "Answer Reveal" dynamically swaps into the equation box area, and the "Status Feedback" area is a permanently fixed-height box (shows "AWAITING INPUT..." when idle) to ensure zero layout shifting.
- **Difficulty glow:** The `.crt-frame` panel border stays the neutral `var(--border)` at all times — difficulty is communicated only through the `box-shadow` glow color (`#00d4ff` easy / `#ffaa00` medium / `#ff3366` hard), matching the glow-only treatment used by Painting Python's grid and Outcast Assembly's board. **Gotcha:** `diffColors` must store plain hex strings, not `var(--cyan)`-style CSS variable references — the glow and the CHK button background both build colors via string concatenation (e.g. `` `${color}55` ``), which silently produces an invalid color (and a no-op box-shadow) if `color` is a `var()` reference instead of a hex literal.

## Game 2: Painting Python (`/app/painting-python`)
A memory-based color-matching twist on classic Snake.
- **Architecture:**
  - `constants.ts`: Grid size (30x30), power-up definitions, speed, initial state.
  - `page.tsx`: The primary game loop (using `setInterval`), grid rendering, and input handling.
- **Mechanics:** 
  - **Color Matching:** Players eat a colored block, which locks them into that color. All colors hide, and the player must rely on memory to find the matching pair. Success grants points and triggers a color-specific power-up. Mismatches cause a game over.
  - **Power-ups:**
    - Green: Grow snake by 2
    - Blue: Freeze snake briefly
    - Red: 1-time collision shield
    - Yellow: Reveal all colors until next eat
    - Pink: Swap positions of two random blocks
    - Gray: Ghost walk (pass through own body)
    - Purple: Reverse controls
- **UI Details:** The 30x30 grid dynamically scales `cellSize` using `calc` logic to fit precisely within the remaining vertical space under the HUD and Top Bar. Mobile controls are handled via swipe gestures rather than on-screen buttons to preserve screen real estate.
- **Game over:** A collision triggers `resetGame()`, which snapshots the run's final score into `finalScore` state and flips `showGameOver` true *before* clearing `gameRef.current` back to a fresh `createInitialGameState()`. This snapshot exists because `gameRef` (a mutable ref, not React state) gets wiped immediately on death — reading `gameRef.current.score` from the render after that point would always show `0`. The fixed-position popup (title "SIGNAL LOST", score/best, "PLAY AGAIN") is separate from the in-grid "PRESS ANY DIRECTION TO INITIALIZE" prompt; `handlePlayAgain` (and every directional key press) clears `showGameOver` so the two never stack.

## Game 3: Outcast Assembly (`/app/outcast-assembly`)
A deduction game wearing chess's clothes: 8x8 board, real chess movement, but the win condition is about reading behavior, not material.
- **Architecture:**
  - `constants.ts`: Board size (8x8), piece kinds, win/loss thresholds (`OUTCASTS_TO_WIN`, `PIECES_LOST_TO_LOSE`), initial board setup, random Outcast assignment.
  - `engine.ts`: Pure move generation (`geometryMoves`) and the Normal-piece quirk filter (`legalMovesForPiece`) layered on top of it, plus `applyMove` which is the only place game state actually mutates.
  - `ai.ts`: Opponent decision-making — priority order is medic rescue > mandatory capture > free move.
  - `PieceIcon.tsx`: SVG glyphs per piece kind.
- **Mechanics:**
  - 6 of the opponent's 16 pieces are secretly flagged `isOutcast`. Capture 3 Outcasts to win; lose `PIECES_LOST_TO_LOSE` of your own pieces and you lose.
  - Capturing a Normal (non-outcast) piece eliminates both the attacker and the target (mutual elimination). Capturing an Outcast removes only the Outcast — free progress.
  - **The tell:** every Normal opponent piece type obeys one quirk it can never break, and Normal pieces are *forced* to capture whenever geometry allows it. Baiting a piece into skipping a capture it should have taken — or taking one it shouldn't — reveals it's an Outcast. Quirks live in `legalMovesForPiece` (`engine.ts`): pawns never act on even turns, knights never cross the board's center line, bishops never move more than 2 squares, rooks won't capture a target that has an orthogonal ally, medics only act on even turns but always prioritize a rescue swap.
  - **Medic:** moves like a king (1 square, any direction) and can also ring-swap instantly with an ally exactly 2 squares away (jumping over anything in between). A Normal medic is immune — it cannot capture and cannot be captured. Critically, the *attacker* still loses the piece they sent in: this is the "medic trap" (`isMedicTrap` on `Move`, resolved in `applyMove`) — the move is legal and shown on the board exactly like a normal capture (`move.isCapture || move.isMedicTrap` get the same red-square marker, intentionally, since the player shouldn't be able to visually distinguish a trap from a real capture), but it only ever fires for the *player's* attacks on the opponent's Normal medic; the AI's interactions with the player's Normal medic stay a hard block (no move generated at all), since the opponent doesn't need this risk/reward gameplay element.
  - Marking system (⚑ SUSPECT / ✓ CLEAR) is purely a player note-taking tool (`Map<pieceId, MarkType>` in component state) — it has zero effect on game logic.
- **UI Details:** Board cell size scales via the same `calc(min(...))` pattern as Painting Python's grid. Last-move highlighting (`lastMove` state) tints the from/to squares cyan (player) or red (opponent) and adds a small dot on the piece that just moved.

## Game 4: Type:Script (`/app/type-script`)
A typing-defense game: words fall toward a "Core" at the bottom of the field; type a word exactly and hit Enter to destroy it before it breaches. Fourteen word "kinds" layer different twists on the same loop, unlocking one every `WORDS_PER_LEVEL` (4) destroys.
- **Architecture:**
  - `constants.ts`: types, the word banks (3 length tiers + `CHAIN_PAIRS` two-word collocations + `WORDS_CASE_SENSITIVE` mixed-case literals), per-kind display metadata (`KIND_STYLE` — doubles as the rules-modal content), unlock levels, all timing/difficulty tunables, and `requiredInput(word)` (the one place "what string actually destroys this word" is computed — matters because `skipLetter` words require typing the word *minus* one marked character).
  - `engine.ts`: pure `spawnWord`/`spawnChainedPair`/`tick`/`submitInput`/`chainPairs`, no React/DOM.
  - `page.tsx`: the game loop (same `gameRef` + `renderTick` ref/state-split pattern as Painting Python, at a faster `TICK_MS = 50` tick), a single controlled `<input>` as the entire control scheme (also passed into word rendering, since `vanish` reacts live to what's currently typed), and per-kind rendering.
- **Mechanics:** `normal` (baseline) / `shielded` (two type+Enter passes) / `reversed` (displayed backwards, typed normally) / `erratic` (sine-wave drift) / `virus` (typing it is the mistake; ignoring it is free) / `slow` (temporary *global* fall-speed multiplier via `state.effects`) / `boost` (not global — permanently falls faster, per-word) / `skipLetter` (omit one highlighted letter from input) / `chained` (two `FallingWord`s sharing a `chainId`, always in lockstep, typed as `"first second"`, one life for the pair) / `shifting` (text mutates to a new word every `SHIFT_INTERVAL_MS`; finish typing before it shifts or your input goes stale) / `spawner` (destroying it spawns `SPAWNER_CHILD_COUNT` 1-letter words at its last position, already partway down) / `vanish` (masks to asterisks the instant your input becomes a prefix of it — type the rest from memory) / `encrypted` (falls as random symbols, `requiredInput` always the real word regardless, decrypts visually at `ENCRYPTED_REVEAL_Y`) / `caseSensitive` (the one kind matched against the *untouched* input — every other kind upper-cases before comparing).
  - Loss: `LIVES_START = 10`; any non-virus breach or any virus-mistyped submission costs exactly one life (no graded damage). Unlike Painting Python, the engine does *not* reset `gameRef.current` on loss — `page.tsx` reads the final `score`/`level` straight off the frozen state for the game-over popup, only `handlePlayAgain` calls `createInitialState` again. A `?god=1` URL param (`GameState.godMode`) is a testing-only cheat that disables all life loss and reveals a "⏩ LV+5" button (`handleLevelJump`) next to "? RULES" for jumping levels without grinding.
  - **Pause gotcha:** the tick loop pauses while the rules modal is open (same `[showRules]`-gated `useEffect` pattern as other games), but resuming explicitly shifts every absolute timestamp in `GameState` (`now`, `lastSpawnAt`, each word's `spawnedAt`, each effect's `expiresAt`) forward by the paused duration *before* restarting the interval — otherwise the first tick after closing the modal sees a huge elapsed time and floods spawns / jumps positions / expires effects early.
- **UI Details:** Falling words are positioned by percentage (`left`/`top`) inside `.breach-field`, with a pulsing `.breach-core-line` marking the breach line at the bottom — no grid, continuous coordinates (unlike Painting Python/Outcast Assembly's cell grids). Word boxes are centered on their lane via `translate(-50%)`, so lanes are kept within an `EDGE_MARGIN`-reserved band (not the full 0–100%) to stop wide words clipping against the field's `overflow: hidden` at the edges. Lives are shown as a `.battery`/`.battery-fill` bar (color-graded green/yellow/red by remaining fraction), not hearts.

## Game 5: Swift & Sound (`/app/swift-sound`)
A Pac-Man-style music maze game: navigate a large dark 41×41 maze, collect note pickups (C–B, keys 1–7), and complete 4 hidden melodies in the map's corners.
- **Architecture:**
  - `constants.ts`: Notes, 4 melodies (6–8 notes each), 6 chord power-ups, all tile type constants (`T_WALL=0` through `T_CHORD_5=22`), seeded DFS maze generator (seed 42) with 6-pass dead-end removal, `getPlayerStart`/`getGhostStarts`.
  - `engine.ts`: `GameState` type, `tick()` (3-step tile-to-tile movement), `handleNoteKey()`, BFS ghost pathfinding, Web Audio synthesis (triangle oscillators, ADSR envelopes), placeholder SFX exports.
  - `page.tsx`: Canvas rendering (camera follows player, fog-of-war dual-layer), blocky Pac-Man and ghost shapes (all `fillRect`, no curves), keyboard hold-to-move (keydown sets dir, keyup clears), D-pad mobile controls, battery HP bar, god mode toggle.
- **Mechanics:**
  - Fog of war: per-tile alpha + radial gradient overlay; vision decays over time, restored by eating dots/notes/melodies.
  - Movement: discrete stop-on-release (player moves while key held, stops when released). Pac-Man auto-continue removed.
  - Note collection: pressing 1–7 checks player tile + tiles up to 2 away (cardinal directions) for matching note.
  - Melody spots (♪): stand on tile, play sequence via 1–7 keys. Ghosts do not freeze while in melody mode.
  - Chord spots (♫): stand on tile, press all required notes to activate a power-up.
  - God mode: toggle via GOD button, survives restart, shows ∞ battery.
- **Gotchas:** `melodiesCompleted: Array(4)` and `tileMelodyId (idx < 4)` must stay in sync with `MELODIES.length`. `playerDirX/Y` = mouth angle only; `playerQueuedDirX/Y` = live held input. See `app/swift-sound/AGENT.md` for full details.

## Game 6: Go, Went, Gone (`/app/go-went-gone`)
A timeline-shifting flappy-bird: three parallel timelines (GONE=past, WENT=present, GO=future) scroll simultaneously. The player flies through whichever is active and switches to avoid obstacles.
- **Architecture:**
  - `constants.ts`: Timeline themes (color, bg, character), per-timeline physics configs, all tuning constants (gap size, scroll speed, energy drain, buff durations, etc.).
  - `engine.ts`: Pure `GameState` type, `createInitialState`, `tick(prev, deltaMs, input, now, canvasW)`. Obstacle sets spawn all 3 timeline gaps at once — at least one gap is always reachable. Energy pickups and buffs attach to a specific timeline and are only collectable when that timeline is active.
  - `page.tsx`: Canvas-based rendering (no DOM game elements). `gameRef` + `requestAnimationFrame` loop pattern. All drawing in standalone functions (`drawBg`, `drawPillars`, `drawPillarSolid/Ghost`, `drawPlayer`, `drawPickups`, `drawHUD`).
- **Timelines:**
  - **GONE (past)** — amber/gold (#C8A84B), dark forest bg, rock pillar obstacles, pterodactyl character. Gentle gravity, big lazy flaps. Native buff: SHIELD.
  - **WENT (present)** — sky blue (#5BC8F5), pipe obstacles, classic yellow bird with wing-flap animation. Standard snappy physics. Native buff: SCORE SURGE (2× points).
  - **GO (future)** — neon cyan (#00E5FF), dark space bg, laser barrier obstacles, jet character with flame. Heavy gravity; tap for burst, hold SPACE for sustained thrust. Native buff: ENERGY BURST.
- **Multi-timeline visibility:** Current timeline draws solid. Other timelines draw as outlines (14% opacity normally, 32% in slow-mo) — player always sees where obstacles are in ghost timelines so they can plan switches.
- **Slow-motion:** Tab toggles ~0.12× time scale. Physics and scroll slow; energy drains at real-time rate (no free ride). HUD shows `[1] GONE [2] WENT [3] GO` shortcuts. Pressing a number exits slow-mo.
- **Energy:** Drains 5/sec in real time. Pickups (lightning bolt shape) appear mid-gap every ~2 pillar sets, tied to a specific timeline. Run dry = instant game over.
- **HP:** 3 lives. Hitting an obstacle or the floor costs 1 HP + 2-second invincibility (player flickers). Active buff `shield` blocks damage entirely.
- **Difficulty ramp:** Scroll speed starts at 175 px/s and increases 1.6 px/s per point, capped at 290 px/s.
- **Guarantee:** `spawnObstacleSet` picks one `clearTL` whose gap is always in the reachable vertical band. The other two timelines are biased toward edges 55% of the time, making them harder but not impossible.
- **Controls:** SPACE/↑ = flap, Tab = slow-mo, 1/2/3 = switch timeline. Mobile: tap canvas = flap; on-screen SLOW, GONE, WENT, GO buttons.

## Game 7: Ruby Star (`/app/ruby-star`)
A space-station defense game: 4 interconnected chambers (ALPHA/BETA/GAMMA/DELTA) in a 2×2 grid linked by hallways. Guard the Ruby Core — if either you or the ruby hits 0 HP it's game over.
- **Architecture:**
  - `constants.ts`: Tile types, 51×51 map generator, chamber bounds, per-chamber spawn points, enemy configs (normal/armored/fast/bomber), all ability & difficulty tuning constants.
  - `engine.ts`: Full `GameState` type, `tick()`, BFS enemy pathfinding, `useLaser` / `pressCharge` / `useSpeedBoost` / `useBomb` / `toggleCarryRuby` / `doTeleport` / `cancelTeleport` exports, meteorite system, resource spawning.
  - `page.tsx`: Canvas rendering with camera-follow + pixel-art drawPlayer/drawEnemy/drawRubyGem helpers, minimap (top-right, 2px/tile), teleport overlay modal, meteorite warning banner, bottom HUD ability bar.
- **Mechanics:**
  - Ruby carry vs place: carry slows movement (0.62×) but enemies only target player; placing lets enemies split attention.
  - 4 abilities: LASER (J) — 4-dir beam, WAVE (K, instant shockwave + pushback; or hold left-click ~1s to auto-fire), SPEED (L) — 2.2× sprint, BOMB (B) — place/detonate.
  - Star energy gauge fills from kills + crystal pickups; when full next ability fires powered-up (more range/damage/duration).
  - Teleport pads (✦) at center of each chamber — step on to pause and jump to any other chamber.
  - Every ~30 s a random chamber is targeted (5 s warning on minimap + main canvas); meteorite wipes all enemies there but kills player/harms ruby if caught.
  - Difficulty ramps every 10 s: faster spawns, more enemies, more types (bomber appears at tier 5).
- **Gotchas:** `chamberOfTile` returns -1 for hallway tiles — enemy targeting logic handles -1 gracefully. Wave `ticks` denominator hardcoded to 30 (matches `waveEffects` init). Bomb blast denominator hardcoded to 28 (matches `bombBlasts` init). `doTeleport` teleport destinations are hardcoded `[[10,10],[39,10],[10,39],[39,39]]` — must match `TELEPORT_PADS` in constants.ts if ever changed.

## Asset Management
- **Audio (`/public/sounds/`):** Contains all required SFX and BGMs (coin, movement, hits, game-specific tracks). Each game's BGM file: `calculatorBGM.mp3` (CipherCalc), `snakeBGM.mp3` (Painting Python), `outcastChessBGM.mp3` (Outcast Assembly), `typingGameBGM.mp3` (Type:Script), `swiftSoundBGM.mp3` (Swift & Sound), `goWentGoneBGM.mp3` (Go, Went, Gone).
- **Fonts:** Managed via `next/font/google` in the root layout to avoid render-blocking delays.

## Per-game deep-dive docs
Each game folder under `app/` now has its own `AGENT.md` written for an AI agent picking up further work — file-by-file responsibilities, data flow, state shape, and the non-obvious gotchas. This `working.md` stays the high-level map; the per-game `AGENT.md` files are where to look before touching engine logic. Games: `app/ciphercalc/AGENT.md`, `app/painting-python/AGENT.md`, `app/outcast-assembly/AGENT.md`, `app/type-script/AGENT.md`, `app/swift-sound/AGENT.md`.

---
*This document serves as the active memory and architectural blueprint for the Arkade project.*
