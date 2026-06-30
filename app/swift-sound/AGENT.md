# Swift & Sound — Agent Reference

## File Responsibilities

### `constants.ts`
- Note definitions: `NOTES = ['C','D','E','F','G','A','B']`, `NOTE_FREQUENCIES`, `NOTE_COLORS`, `NOTE_KEY_MAP` (keys 1–7 → C–B)
- **4 melodies** (`MELODIES[]`) with shortened sequences (6–8 notes). Melody count is hardcoded in three places: `MELODIES.length`, `tileMelodyId` (`idx < 4`), and `createInitialState()` (`melodiesCompleted: Array(4).fill(false)`). Change all three together.
- **6 chord power-ups** (`CHORDS[]`): speed / vision / immune / invisible / slow_ghosts / reveal
- Tile type constants: `T_WALL=0, T_PATH=1, T_DOT=2, T_NOTE_C=3…T_NOTE_B=9, T_MELODY_0=10…T_MELODY_3=13, T_CHORD_0=17…T_CHORD_5=22`. T_MELODY_4–6 (14–16) are defined but unused.
- Helper functions: `tileToNote(tile)`, `noteToTile(note)`, `tileMelodyId(tile)` (returns null for id ≥ 4), `tileChordId(tile)`
- `TILE_SIZE = 48` — changing this scales everything (tiles, Pac-Man, ghosts, fog radius) automatically
- `generateMap()`: iterative DFS on 41×41 grid (cells at odd coords, corridors at even coords), 80 extra connection attempts, then **6-pass dead-end removal** (carve closed corridors from dead-end cells to neighboring path cells), then scatter melody/chord/note tiles. Note pickups every 8th path tile — rest stay as T_DOT.
- `getPlayerStart()`, `getGhostStarts()` (4 corners)

### `engine.ts`
**`GameState` shape:**
```
map: number[][]            — mutable tile grid
playerX/Y: number         — pixel center (interpolated)
playerTileX/Y: number     — current tile
playerTargetX/Y: number   — tile being moved toward
playerDirX/Y: number      — last direction taken (used for Pac-Man mouth angle)
playerQueuedDirX/Y: number — direction from currently held key (0 when key released)
playerStepProgress: number — pixels advanced toward target (0..TILE_SIZE)
vision/speed: number       — decay each tick; restored by dots/notes/melodies
lives: number              — 3 max; god mode bypasses reduction
godMode: boolean           — no HP loss; survives restart (preserved in handleRestart)
noteInventory: Record<NoteName, number>
melodiesCompleted: boolean[4]
activeMelodyId/activeChordId: number | null
melodyProgress: number     — notes correctly played so far
heldNotes: Set<NoteName>   — accumulate in chord mode
activeEffects: ActiveEffect[]
ghosts: Ghost[]
invincibleTicks: number    — post-hit grace period (120 ticks)
gamePhase: 'playing'|'melody'|'chord'|'won'|'lost'
```

**`tick()` — 3-step movement:**
1. **Arrival** (`playerStepProgress >= TILE_SIZE`): snap to target tile, reset progress, call `handleTileInteraction`. Returns early if phase changed.
2. **Apply input** (`playerTargetX === playerTileX` — at centre): try `playerQueuedDirX/Y` if non-zero. **No fallback to last direction** — player stops when key released.
3. **Advance** toward target: add `effectiveSpeed` to `playerStepProgress`, interpolate pixel position.

**Ghost movement:** BFS pathfinding (`bfsPath`), `pathUpdateTimer` staggered by `i * 15` ticks so all 4 ghosts don't recalculate the same frame. Ghost collision: `if (invincibleTicks === 0 && !state.godMode && !immune && !invisible)` → decrement lives, 120-tick grace, reset queued dir.

**`handleNoteKey(state, note)`:**
- In melody mode: advance `melodyProgress` if correct note, play `playMelodyComplete` on finish
- In chord mode: add to `heldNotes`, fire `applyChordEffect` + `playSFX_chordSuccess` when all required notes held
- Normal play: check player tile **and tiles up to 2 away** (cardinal directions, distance 1 and 2) for matching note tile (collects the first found)

**SFX exports:** `playNote`, `playRandomDotNote`, `playMelodyComplete`, `playDotEat`, `playSFX_lifeLost`, `playSFX_gameOver`, `playSFX_win`, `playSFX_chordSuccess` — all use Web Audio API with try/catch (safe in SSR).

### `page.tsx`
**Canvas rendering (`drawGame`):**
- Camera: `camX = playerX - canvasW/2` — player always centered
- Per-tile alpha: `max(0, min(1, visionTiles - distTiles + 0.5))` + radial fog gradient overlay
- **Dot:** small square (`fillRect`, side = `TILE_SIZE * 0.22`), `DOT_COLOR = '#5555aa'`
- **Note tile:** black background, glowing colored border (`ctx.shadowColor`/`shadowBlur`), blocky number label (`'900 Npx Arial Black, Impact, monospace'`)
- **Melody spot:** colored background + pulsing ♪/✓ icon
- **Chord spot:** colored background + ♫ icon
- **Ghost:** blocky rectangle body + 2 pixel teeth at bottom + square white eyes with square blue pupils (all `fillRect`, no curves)
- **Pac-Man:** yellow square, black `fillRect` mouth cutout based on `playerDirX/Y`, black square eye positioned per direction. Glow via `ctx.shadowColor`

**Movement (keyboard):**
- `keydown` → set `playerQueuedDirX/Y`; in melody/chord mode also calls `exitInteractionMode`
- `keyup` → clear `playerQueuedDirX/Y` if it matches the released key (stop on release)
- D-pad: `onPointerDown` sets dir, `onPointerUp`/`onPointerLeave` clears it (hold = continuous)
- Canvas swipe: sets direction on touchend (keeps moving until next swipe)

**God mode:** `toggleGodMode()` flips `stateRef.current.godMode`; HUD shows ∞ battery and GOD button glows green. `handleRestart` reads `wasGod` before resetting state so mode survives restarts.

**BGM:** `bgmRef` → `BGMController` at `/sounds/swiftSoundBGM.mp3` volume 0.1. Starts on `RulesModal` close.

**HUD:** HP as `.battery`/`.battery-fill`/`.battery-nub` (globals.css classes, same as Type:Script), green→yellow→red at 60%/30%. 4 melody completion dots. VIS/SPD bars. GOD and ? RULES buttons.

## Non-obvious Gotchas

**Dead-end removal only works on odd-coordinate cells.** The 6-pass loop iterates `y += 2, x += 2` starting at 1. If a path tile at even coordinates (from extra connections or note placement) ends up as a dead end, it won't be caught. In practice this is fine — extra connections always connect two existing path cells and never create new dead ends.

**Chord mode doesn't prevent ghost movement.** While in melody or chord mode, `tick()` is NOT called (page.tsx checks `gamePhase === 'playing'` before calling tick). Ghosts freeze, vision/speed don't decay. Pressing a direction key calls `exitInteractionMode` → returns to 'playing' → tick resumes.

**`melodiesCompleted` must be `Array(4)`** — if you increase melody count, also update `tileMelodyId` (`idx < 4`) and the HUD dot loop (`length: 4`).

**Adjacent note collection breaks "must be on the tile" rule** by design — `handleNoteKey` checks player tile + 4 neighbors. The note collected is removed from whichever tile it was found on.

**playerDirX/Y vs playerQueuedDirX/Y:** `playerDirX/Y` stores the last direction a `tryDir` succeeded — used only for Pac-Man mouth angle rendering. `playerQueuedDirX/Y` is the live held-key direction fed into `tick()`. They often differ while turning: the mouth faces the last successful direction until the new one clears the corner.

**Ghost collision clears queued dir** (`playerQueuedDirX = 0; playerQueuedDirY = 0`) to prevent the player from tunneling through the invincibility window.
