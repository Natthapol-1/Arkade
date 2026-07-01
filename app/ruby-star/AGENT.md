# Ruby Star — Agent Notes

A top-down, grid-based shooter where you defend a central Ruby from approaching aliens. The player can move, shoot lasers, unleash a charge wave, place bombs, and use a speed boost.

## Files

- **`engine.ts`** — The core game logic and state management. Contains the `GameState` interface, the main `tick()` loop, and all ability handlers (e.g., `useLaser`, `useBomb`, `activateWave`, `tryActivateTeleport`). Operates independently of rendering.
- **`constants.ts`** — Configuration variables such as grid dimensions, tile definitions, enemy stats, ability cooldowns and durations.
- **`page.tsx`** — The React component that manages the game loop (via `requestAnimationFrame`), handles keyboard/mouse/touch inputs, plays sound effects, and renders the game state onto an HTML5 `<canvas>`.

## State shape (`engine.ts`)

- `GameState`: Contains `gamePhase` ('playing', 'teleporting', 'lost'), player coordinates and stats (`playerX`, `playerY`, `hp`, `starEnergy`), the `ruby` state (health, position, placement), `enemies`, ability cooldowns, active effects (`laserBeams`, `waveEffects`, `bomb`, `bombBlasts`), and teleportation state (`teleportDestOptions`, `teleportCooldown`).

## Non-obvious behavior

- **Power-up Window:** When the player reaches max `starEnergy`, it is immediately consumed to grant a 2-second power-up window (`state.poweredTicks = 120`). During this window, *any* ability used (Laser, Wave, Bomb, Speed Boost) is enhanced. This is a time-based buff, not a single-use charge.
- **Teleportation:** Players can teleport between chambers using the ✦ teleport pads. Pressing `Spacebar` while standing on a pad activates the teleport menu (changing `gamePhase` to 'teleporting'). The player then presses 1-4 to choose a destination. If the spacebar is pressed while *not* on a teleport pad, it falls back to attempting to heal the ruby.
- **Bomb Visuals:** The bomb is rendered in `page.tsx` as a blocky, dark orange-ish square (drawn via `ctx.roundRect` with small border radii). Its blast radius is visualized with a translucent fill covering all tiles within Euclidean distance of the blast, rather than just highlighting the origin tile.
- **Ruby Carrying:** The player can pick up and carry the Ruby (using E or F). When carrying the Ruby, the player's movement speed is halved.
- **Canvas Rendering:** `page.tsx` uses a single `drawGame` function to render everything to the canvas, relying heavily on `ctx.save()`, `ctx.translate()`, and standard primitives (`fillRect`, `strokeRect`, `roundRect`).
