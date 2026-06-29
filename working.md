# Arkade - Working Memory & Architecture

## Project Overview
**Name:** Arkade
**Stack:** Next.js 15+, React 19, TypeScript
**Design Philosophy:** A professional retro-futuristic terminal/CRT aesthetic. High-performance styling using CSS variables, custom glows, CRT scanlines, and pixel/monospace typography (Press Start 2P, Share Tech Mono).

## Core Architecture
- **Web App Setup:** Built as a single-page style Next.js application using the App Router.
- **Global Styles:** Handled centrally in `app/globals.css`, defining all CRT shaders, scanlines, animations (breathing glows, slides), and design tokens.
- **Layout Constraints:** The entire app is strictly designed to fit within a single viewport (`100dvh`, `overflow: hidden`). Games have dynamic sizing logic so they scale properly on mobile and desktop without requiring scrolling.
- **Lobby (`/app/page.tsx`):** Renders the 3 game cards in a CSS grid. **Gotcha:** with 3 items in a 2-column grid, one column ends up with 2 cards stacked and the other with only 1 — plain `gridTemplateColumns: 'repeat(2, 1fr)'` lets each column's *own* content set an independent minimum width (the `auto` basis of a bare `1fr` track), so the lone-card column can size differently from the two-card column even though `.game-card` has `aspect-ratio: 1`. Use `repeat(2, minmax(0, 1fr))` to force genuinely equal columns regardless of how many/which cards land in each.

## Shared Components (`/components`)
- **`BGMController`:** A terminal-style audio widget that handles background music looping and volume control. Every game wires it up the same way: a `bgmRef` starts paused, and `RulesModal`'s `onClose` calls `bgmRef.current?.playMusic()` so music only starts once the player dismisses the rules (autoplay-policy friendly).
- **`RulesModal`:** A reusable, animated CRT-style overlay to display game instructions before a session starts.
- **`BackButton`:** A standard navigation widget to return to the main lobby.
- **Game-over pattern:** All three games now share one visual pattern for "run ended" — the global `.game-over-overlay` class rendered with `position: 'fixed'` (full-viewport, not clipped to a grid container), a `.game-over-title`, a small stats block, and a `btn btn-primary` "PLAY AGAIN" button. CipherCalc's win-state and the lobby don't need this; CipherCalc shows its "answer reveal" inline instead since there's no real "loss" state.

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
- **Difficulty glow:** The `.crt-frame` panel border stays the neutral `var(--border)` at all times — difficulty is communicated only through the `box-shadow` glow color (`#00d4ff` easy / `#ffaa00` medium / `#ff3366` hard), matching the glow-only treatment used by Spectrum Snake's grid and Outcast Gambit's board. **Gotcha:** `diffColors` must store plain hex strings, not `var(--cyan)`-style CSS variable references — the glow and the CHK button background both build colors via string concatenation (e.g. `` `${color}55` ``), which silently produces an invalid color (and a no-op box-shadow) if `color` is a `var()` reference instead of a hex literal.

## Game 2: Spectrum Snake (`/app/spectrum-snake`)
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

## Game 3: Outcast Gambit (`/app/outcast-gambit`)
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
- **UI Details:** Board cell size scales via the same `calc(min(...))` pattern as Spectrum Snake's grid. Last-move highlighting (`lastMove` state) tints the from/to squares cyan (player) or red (opponent) and adds a small dot on the piece that just moved.

## Asset Management
- **Audio (`/public/sounds/`):** Contains all required SFX and BGMs (coin, movement, hits, game-specific tracks). Each game's BGM file: `calculatorBGM.mp3` (CipherCalc), `snakeBGM.mp3` (Spectrum Snake), `outcastChessBGM.mp3` (Outcast Gambit).
- **Fonts:** Managed via `next/font/google` in the root layout to avoid render-blocking delays.

## Per-game deep-dive docs
Each game folder under `app/` now has its own `AGENT.md` (`app/ciphercalc/AGENT.md`, `app/spectrum-snake/AGENT.md`, `app/outcast-gambit/AGENT.md`) written for an AI agent picking up further work — file-by-file responsibilities, data flow, state shape, and the non-obvious gotchas that aren't visible from a quick read of the code. This `working.md` stays the high-level map; the per-game `AGENT.md` files are where to look before touching engine logic.

---
*This document serves as the active memory and architectural blueprint for the Arkade project.*
