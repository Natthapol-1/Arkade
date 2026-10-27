# Development

[Overview](README.md)

## Code map

Ruby Star is a real-time top-down survival/defense game in Arkade, a Next.js 15 / React 19 / TypeScript app. Route: `/ruby-star`; local development normally uses `http://localhost:3000/ruby-star`. God panel: `/ruby-star?god=1`.

| File or directory | Responsibility |
| --- | --- |
| `app/ruby-star/constants.ts` | Tile map, enemy configurations, boss roster, difficulty tiers, ability tuning, celestial skill definitions |
| `app/ruby-star/event-audio.ts` | Event warning/arrival/charge cues, Black Hole/Eclipse loop lifecycle and cleanup |
| `app/ruby-star/events.ts` | Minor-event scheduling, gravity, star landing/pickup and Eclipse |
| `app/ruby-star/engine.ts` | Pure mutable game state, 60Hz tick, movement/pathfinding, attacks, damage, rewards, spawning, hazards, audio |
| `app/ruby-star/BombStatus.tsx` | Icon-only HUD bomb ready/armed/cooldown indicator |
| `app/ruby-star/page.tsx` | Canvas renderers, input, animation loop, camera, HUD, God panel, touch controls |
| `app/ruby-star/ConstellationAfterglow.tsx` | Faint non-blocking confirmation art, reusing the choice star positions and link geometry |
| `app/ruby-star/ConstellationChoice.tsx` | Paused run-upgrade interface, including the final single choice |
| `app/ruby-star/RubyStarGuide.tsx` | Simple main rules and Aliens & Bosses sheet |
| `tests/*.test.cjs` | Node gameplay regression tests; transpile TypeScript directly |
| `scripts/preview-*.cjs` | Render actual game drawing functions to PNG; no replacement mockup artwork |
| `scripts/check-ruby-*.cjs`, `scripts/check-charge-cycle.cjs` | Browser UI and repeated-charge checks |
| `public/sounds/`, `public/sounds/celestial/` | Audio assets; preserve the existing layered mix |
| `docs/ruby-star/visual-reference/` | Source-rendered visual references |

The simulation uses approximately 60 ticks/second, independent of monitor refresh rate. Positions have both tile coordinates and pixel interpolation. One tile = 48px; map = 51×51 tiles. Walls control pathfinding/collision. Prefer engine changes for gameplay and renderer changes for cosmetics.

## Implementation rules

- Inspect relevant current source and local changes before editing; preserve unrelated work.
- Keep gameplay in `engine.ts` and rendering/input in `page.tsx`. Cosmetic edits must not silently change damage, range, timing, collision, targeting or audio.
- Treat game state other than `playing` as paused for simulation and ability actions. Pause/stop persistent audio appropriately too. Both teleport and Constellation choices pause the game. Constellations are one-time choices; exclude owned entries, offer the final single entry, and stop when exhausted.
- Keep tile/pixel interpolation synchronized after knockback, pull, teleport or interrupted charge. Share field bounds between collision and drawing.
- Keep target-specific effects scoped: Lunar AI substitution must restore player state in `finally`. Boss removal must clean up its hazards, audio and global effects.
- Apply Shielder fractional reduction before absorb shields. Do not inflate small damage by rounding to a minimum of one. Cassiopeia reduces Ruby damage before Ruby's shield pool.
- Use snapshot target lists when resolving multi-target skills and kills so spawning children/removing echoes cannot cause skipped or repeated hits. Consume a celestial skill before resolving kills so replacement rewards survive.
- Input and UI must work on desktop and mobile. Modals need keyboard focus, clear actions and paused gameplay.

## God panel controls

The panel sits at the upper left of the battlefield, opposite the minimap, with scrollable controls.

`Stage +1` calls `godAdvanceStage`: increment the defeated-boss count once, update difficulty immediately, offer any third-defeat Constellation reward, and announce Ascension when crossing ten defeats. It preserves the live boss, HP, resources and celestial inventory; it does not simulate a boss kill or grant kill rewards. Only available while playing. `RESET` uses the same restart handler as PLAY AGAIN: starts at Stage 0, clears run upgrades/skills/hazards and input, and retains Immortal/No Mobs/No Boss debug toggles. Stage +1 and RESET share a compact two-column row. There is no separate Ascension button; advance stages to reach its unlock. Immortal and Full Energy share another row. Immortal, No Mobs and No Boss use color for visible toggle state, with `aria-pressed` for accessibility and no ON/OFF suffix. Three individual event buttons in a two-column grid trigger warned events; see [Space events](EVENTS.md).

## Verification

Run checks appropriate to the changed behavior from the repository root:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node --test tests/*.test.cjs
node scripts/check-ruby-guide.cjs <absolute-output-directory>
node scripts/check-ruby-visuals.cjs <absolute-output-directory>
node scripts/check-charge-cycle.cjs <absolute-output-directory>
node scripts/check-ruby-keyboard.cjs
node scripts/check-constellations.cjs <absolute-output-directory>
node scripts/check-ruby-hud.cjs <absolute-output-directory>
node scripts/check-ruby-game-over.cjs <absolute-output-directory>
node scripts/check-ruby-events.cjs <absolute-output-directory>
node scripts/check-ruby-supernova.cjs
```

Use meaningful regression tests for gameplay changes. For simple art edits, render the actual drawing functions and inspect rather than adding tests that only mirror implementation. Check actual gameplay scale, an enlarged view and several animation ages. A single static preview does not validate motion, priority or footprint.

## Render tools

| Script in `scripts/` | Output argument / purpose |
| --- | --- |
| `preview-player-celestial.cjs` | Output PNG; suits and player states |
| `preview-all-bosses.cjs` | Output PNG; boss model gallery |
| `preview-celestial-skills.cjs` | Output PNG; celestial cast gallery |
| `preview-normal-monsters.cjs` | Output directory, optional prefix; aliens and attack overlays |
| `preview-rewards.cjs` | Output directory; Ruby, bomb, reward effects and blast boundary |
| `preview-battlefield.cjs` | Output directory, optional prefix; overview, details and pads |
| `preview-space-events.cjs` | Output PNG; actual event warnings, early/active/fading stages and renderer immutability |
| `preview-charger.cjs` | Inspect script arguments; warning, rush and recovery frames |

Scripts use bundled `@napi-rs/canvas` and Playwright paths on this machine. Adapt dependency paths on another machine without replacing the renderer. Reference images live in [visual-reference/](visual-reference/).

## Documentation maintenance

As part of any meaningful change, update the relevant [topic document](README.md) in the same task. Mechanics/balance changes belong in Gameplay, Enemies or Skills; visual rules/palettes and affected reference images belong in Visuals; sound changes belong in Audio; architecture or tooling changes belong here. Update cross-links when moving files.

Replace outdated facts with the resulting current rules. Do not append chat history, approval history, change logs, completed-task reports or test-run snapshots. Keep detail in its owning topic and use links elsewhere. The overview must stay short enough to orient a new agent without loading every reference.
