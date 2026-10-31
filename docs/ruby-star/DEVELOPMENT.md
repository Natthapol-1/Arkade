# Development

[Overview](README.md)

## Code map

Ruby Star is a real-time top-down survival/defense game in Arkade, a Next.js 15 / React 19 / TypeScript app. Routes: `/ruby-star` (lobby), `/ruby-star/tutorial`, `/ruby-star/endless`, `/ruby-star/ascension`, `/ruby-star/challenge` (star map) and `/ruby-star/challenge/<body>`; local development normally uses `http://localhost:3000/ruby-star`. God panel: shown only with `?god=1` (`RubyStarGame.tsx`), which the lobby passes through. See the push rule below for restoring always-on local testing after a push. It provides a five-column boss summon grid and a five-column celestial skill grid, with matching BOSSES and CELESTIAL SKILLS headings and bosses directly above skills; skill buttons preview the matching player suit and highlight the held skill. Constellations opens a paused all-upgrade toggle editor. Protection controls pair Immortal (player/Ruby HP minimum 1) with Invincible (ignore damage); refill controls pair Full HP with Full Energy. These modes are mutually exclusive and persist through reset.

| File or directory | Responsibility |
| --- | --- |
| `app/ruby-star/constants.ts` | Tile map, enemy configurations, boss roster, difficulty tiers, ability tuning, celestial skill definitions |
| `app/ruby-star/event-audio.ts` | Event warning/arrival/charge cues, Black Hole/Eclipse loop lifecycle and cleanup |
| `app/ruby-star/events.ts` | Minor-event scheduling, gravity, star landing/pickup and Eclipse |
| `app/ruby-star/encounter-art.ts` | Approved Sentinel/pylon/twin sprites, attack/revival effects and floor/chamber warnings |
| `app/ruby-star/engine.ts` | Pure mutable game state, 60Hz tick, movement/pathfinding, attacks, damage, rewards, spawning, hazards, audio |
| `app/ruby-star/neptune.ts`, `app/ruby-star/gaia.ts`, `app/ruby-star/moon.ts`, `app/ruby-star/sun.ts` | Challenge logic and state types (`NeptuneState`, `GaiaState`, `MoonState`, `SunState`); the core engine calls in through `updateNeptune`/`updateGaia` and exported helpers, and the modules import engine helpers back |
| `app/ruby-star/neptune-art.ts` | Neptune challenge art: fish, stingers, jellyfish, sharks, water clones, water balls, tides, Trident (sky laser) |
| `app/ruby-star/sun-art.ts`, `app/ruby-star/SunGuide.tsx` | Sun units, stations, temperature atmosphere, water effects and animated rule sheet; Sun debug controls include Wave Ready, Full Heat, Zero Heat, Phase 1/2/3 and independent No Wisps (preserved on restart; No Mobs leaves wisps alone) |
| `app/ruby-star/BombStatus.tsx` | Icon-only HUD bomb ready/armed/cooldown indicator |
| `app/ruby-star/CelestialStatus.tsx`, `app/ruby-star/MoonMarkStatus.tsx`, `app/ruby-star/CoolingWaveStatus.tsx` | Icon-only HUD ready/recharging indicators: the celestial skill (Celestial Challenge), the Moon Mark (Moon challenge) and Cooling Wave (Sun challenge) |
| `app/ruby-star/page.tsx` | Mode lobby: title, carousel of mode cards, routing |
| `app/ruby-star/RubyStarGame.tsx` | The game for a given mode: canvas renderers, input, animation loop, camera, HUD, God panel, touch controls |
| `app/ruby-star/tutorial/page.tsx`, `endless/page.tsx`, `ascension/page.tsx` | Mode routes; each renders `RubyStarGame` with its mode, started by `createModeState` in `engine.ts` |
| `app/ruby-star/trials.ts`, `challenge/page.tsx`, `challenge/[body]/page.tsx` | Celestial Challenge data (body, guardian boss, map position), star map page and per-world route (`trial` mode in the engine) |
| `app/ruby-star/ui-sfx.ts` | Synthesized sci-fi menu cues for the lobby, rule sheet, EXIT and teleport menu |
| `app/ruby-star/CelestialSkillGuideCard.tsx` | Shared animated F-skill card for all four challenge rule sheets, using the real celestial cast renderer |
| `app/ruby-star/ConstellationAfterglow.tsx` | Faint non-blocking confirmation art, reusing the choice star positions and link geometry |
| `app/ruby-star/ConstellationChoice.tsx` | Paused run-upgrade interface, including the final single choice |
| `app/ruby-star/RubyStarGuide.tsx` | Simple main rules and Aliens & Bosses sheet |
| `app/ruby-star/NeptuneGuide.tsx` | Neptune challenge rule sheet: animated picture cards for what is new on that map |
| `app/ruby-star/gaia-art.ts` | Gaia challenge art: overgrowth, Sunstones, pods, blossoms, sporelings, crawlers, Ragecaps, root binds, Sunfire, forest backdrop |
| `app/ruby-star/moon-art.ts` | Moon challenge art: room palette, crystal cover blocks, polished crystal floor (sheen, reflections, mist, runes), motes, crystal-cavern backdrop, the Queen's floor reflection, shards, arrival and unmask effects |
| `app/ruby-star/GaiaGuide.tsx`, `app/ruby-star/MoonGuide.tsx` | Gaia and Moon challenge rule sheets (same picture-card format) |
| `app/ruby-star/VictoryScreen.tsx` | Full-screen challenge victory celebration (canvas burst, fanfare, buttons) |
| `tests/*.test.cjs` | Node gameplay regression tests; transpile TypeScript directly |
| `scripts/preview-*.cjs` | Render actual game drawing functions to PNG; no replacement mockup artwork |
| `scripts/check-ruby-*.cjs`, `scripts/check-charge-cycle.cjs` | Browser UI and repeated-charge checks |
| `public/sounds/`, `public/sounds/celestial/` | Audio assets; preserve the existing layered mix |
| `docs/ruby-star/visual-reference/` | Source-rendered visual references |
| `docs/ruby-star/boss-remodels/` | Archived boss remodels (code, renders and notes), not used by the game |

The simulation uses approximately 60 ticks/second, independent of monitor refresh rate. Positions have both tile coordinates and pixel interpolation. One tile = 48px; map = 51×51 tiles. Walls control pathfinding/collision. Prefer engine changes for gameplay and renderer changes for cosmetics.

## Implementation rules

- Inspect relevant current source and local changes before editing; preserve unrelated work.
- Keep gameplay in `engine.ts` and rendering/input in `RubyStarGame.tsx`. Each Celestial Challenge keeps its logic in its own module (`neptune.ts`, `gaia.ts`, `moon.ts`, `sun.ts`); give new challenges their own module too, leaving only short hooks in `engine.ts`. The modules and engine import each other, so they must not use each other's values at module load time, only inside functions. The shared room picker for full-charge room strikes (`chooseSkyLaser`, `cancelSkyLaser`) stays in `engine.ts`. Tests reach private engine helpers by appending an export to `engine.ts` when transpiling it, so moved code is imported from its own module. Cosmetic edits must not silently change damage, range, timing, collision, targeting or audio.
- Treat game state other than `playing` as paused for simulation and ability actions. Pause/stop persistent audio appropriately too. Both teleport and Constellation choices pause the game. Constellations are one-time choices; exclude owned entries, offer the final single entry, and stop when exhausted.
- Keep tile/pixel interpolation synchronized after knockback, pull, teleport or interrupted charge. Share field bounds between collision and drawing.
- Keep target-specific effects scoped: Lunar AI substitution must restore player state in `finally`. Boss removal must clean up its hazards, audio and global effects.
- Apply Shielder fractional reduction before absorb shields. Do not inflate small damage by rounding to a minimum of one. Cassiopeia reduces Ruby damage before Ruby's shield pool.
- Use snapshot target lists when resolving multi-target attacks and kills so spawning children/removing echoes, constructs or a twin partner cannot cause skipped or repeated hits. Consume a celestial skill before resolving kills so replacement rewards survive.
- **Push rule (God panel):** pushed code must show the God panel only with `?god=1`. Before every push, switch `setIsGodQuery(true)` to the query check (`setIsGodQuery(new URLSearchParams(window.location.search).get('god') === '1')`) and the God panel sentence in the code map above to match, commit and push; then restore the always-on line and this local wording without committing them.
- Desktop only: do not implement, adapt, test or screenshot mobile/touch layouts or controls unless explicitly asked. Existing mobile code may stay but does not need updating, and mobile steps in browser checks can be skipped. Modals need keyboard focus, clear actions and paused gameplay.

## Linked boss encounters

Aegis constructs are stationary `Enemy` objects with `constructOwnerId`; they use ordinary attack collision/targeting, but have no rewards or regular-alien support effects. `Enemy.aegis` holds shield/exposure/reflection state. `initializeNewEncounter` runs for both natural and debug spawns. Twins share `Enemy.twin.pairId`; index 0 is melee and index 1 is ranged. `updateAstralTwin` handles their attacks and movement; `twinRangedPath` scores reachable firing positions for 6–10-tile spacing, cover and diagonal approach, while `twinStepFits` enforces the 10-tile movement tether against both ends of partner interpolation. Dusk uses its own 3.2 movement speed and Queen-style chamber/range-gated tracking, including current pixel endpoints and Lunar Echo targeting; Dawn retains 2.6 movement speed. `downedTicks > 0` marks an inert, untargetable body (its internal HP sentinel is 1 so generic casualty sweeps terminate). The final twin defeat removes its partner and resolves boss rewards once. `updateBossEncounters` advances revival/exposure timers once per playing tick, including Eclipse, while twin transfers pause under Eclipse. Transfers use a random 10–14s interval and randomly choose either eligible donor, moving up to 30% of current donor HP; one-second effects follow the live donor/receiver IDs. `EncounterEffect` stores bounded cosmetic cues from real attacks, shield transitions, pylon overloads and revival; repeated reflections refresh one streak. `visualSpawnTicks`, `aegis.openAmount`, `twin.fallTicks` and `twin.reviveTicks` are updated once per playing tick, never by rendering. Pylon lifetime/overload timers advance only outside Eclipse; damage never resets them. Overload relocates the same objective at full HP, restarting its lifetime without rewards or changing its owner. `BOSS_SKILL_REWARDS` maps the ten encounters to the ten celestial skills. Binary Star routes laser, wave and bomb damage through origin-parameterized helpers (`withMirrorTwin`, the bomb `blastAt`, `fireBulletFrom`) so the twin reuses the player's exact attack code; `getMirrorTwinTile` is shared by gameplay and rendering. Venus Veil passes the attacking `Enemy` into `damagePlayer`/`damageRuby`; only direct attacks supply it, so hazards are reduced without reflection. Reflected damage uses the `special` source and is cleaned up by the end-of-tick casualty sweep.

## God panel controls

The panel sits at the upper left of the battlefield, opposite the minimap, with scrollable controls.

`Stage +1` calls `godAdvanceStage`: increment the defeated-boss count once, update difficulty immediately, offer any third-defeat Constellation reward, and announce Ascension when crossing ten defeats. It preserves the live boss, HP, resources and celestial inventory; it does not simulate a boss kill or grant kill rewards. Only available while playing. `RESET` uses the same restart handler as PLAY AGAIN: starts at Stage 0, clears run upgrades/skills/hazards and input, and retains Immortal, Invincible, No Mobs and No Boss debug toggles. Stage +1 and RESET share a compact two-column row. There is no separate Ascension button; advance stages to reach its unlock. Immortal and Invincible share a protection row; Full HP and Full Energy share a refill row. Immortal, Invincible, No Mobs and No Boss use color for visible toggle state, with `aria-pressed` for accessibility and no ON/OFF suffix. Four individual event buttons in a two-column grid trigger warned events; see [Space events](EVENTS.md).

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
node scripts/check-ruby-celestial-controls.cjs
node scripts/check-ruby-new-bosses.cjs
node scripts/preview-linked-bosses.cjs
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
| `preview-sun.cjs` | Output directory; Sun at three temperatures, bridge backdrop at three animation ages, materials/reservoir charge, units, actual Cooling Wave HUD states and Sunburst/meteor battlefield and minimap comparison; checks read-only art |
| `preview-moon.cjs` | Output directory; Moon world at three ages, crystal cover close-up, and disguised Queen among illusions vs revealed |
| `preview-charger.cjs` | Inspect script arguments; warning, rush and recovery frames |

Full-page source-extraction previews must also bind the three exported render helpers from `encounter-art.ts`.

Scripts use bundled `@napi-rs/canvas` and Playwright paths on this machine. Adapt dependency paths on another machine without replacing the renderer. Reference images live in [visual-reference/](visual-reference/).

## Documentation maintenance

As part of any meaningful change, update the relevant [topic document](README.md) in the same task. Mechanics/balance changes belong in Gameplay, Enemies or Skills; visual rules/palettes and affected reference images belong in Visuals; sound changes belong in Audio; architecture or tooling changes belong here. Update cross-links when moving files.

Replace outdated facts with the resulting current rules. Do not append chat history, approval history, change logs, completed-task reports or test-run snapshots. Keep detail in its owning topic and use links elsewhere. The overview must stay short enough to orient a new agent without loading every reference.
