# Arkade - Working Memory & Architecture

## Project Overview
**Name:** Arkade
**Stack:** Next.js 15+, React 19, TypeScript
**Design Philosophy:** A professional retro-futuristic terminal/CRT aesthetic. High-performance styling using CSS variables, custom glows, CRT scanlines, and pixel/monospace typography (Press Start 2P, Share Tech Mono).

## Core Architecture
- **Web App Setup:** Built as a single-page style Next.js application using the App Router.
- **Global Styles:** Handled centrally in `app/globals.css`, defining all CRT shaders, scanlines, animations (breathing glows, slides), and design tokens.
- **Layout Constraints:** The entire app is strictly designed to fit within a single viewport (`100dvh`, `overflow: hidden`). Games have dynamic sizing logic so they scale properly on mobile and desktop without requiring scrolling.

## Shared Components (`/components`)
- **`BGMController`:** A terminal-style audio widget that handles background music looping and volume control.
- **`RulesModal`:** A reusable, animated CRT-style overlay to display game instructions before a session starts.
- **`BackButton`:** A standard navigation widget to return to the main lobby.

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

## Asset Management
- **Audio (`/public/sounds/`):** Contains all required SFX and BGMs (coin, movement, hits, game-specific tracks).
- **Fonts:** Managed via `next/font/google` in the root layout to avoid render-blocking delays.

---
*This document serves as the active memory and architectural blueprint for the Arkade project.*
