# Space events

[Overview](README.md)

Meteors remain the regular main hazard. Three minor events occur occasionally and never overlap each other. Every event gives a three-second warning, its name/countdown and minimap markers before activating. Warnings and events pause with rules, teleport selection and Constellation choices, and stop advancing after game over. Restart clears them.

Natural first warning is scheduled after 150–210 seconds of unpaused play. After an event finishes or its shard is collected, the next warning waits 180–300 seconds. Due events wait for active meteor warnings and boss warning/spawn announcements to clear. A shuffled pool presents all three event types before refilling. Meteors continue independently and may happen during an already-active minor event. Manual God triggers retain the warning, reject overlapping events and do not consume the natural pool.

| Event | Active duration | Behavior |
| --- | --- | --- |
| Black hole | 7 seconds | Fixed at tile (25,25), in the central void between chambers. Every 45 ticks, pulls player and all eligible aliens/bosses one cardinal tile toward the center, respecting walls. Uses normal forced-movement interpolation for the player, waits for existing steps/knockback and does not move a frozen player. Push interrupts Charger lanes. No direct damage and no movement of placed Ruby. Players can continue controlling movement between pulls. |
| Shooting star | 0.6-second fall, then about 30 seconds to collect | Warns a random interior floor tile outside the currently warned meteor chamber. Falls without dealing damage, leaving a golden stellar shard. Collect it for +20 player HP, +20 Ruby HP, full star energy and a free speed burst. Existing player-healing reductions, HP/energy caps and burst-duration upgrades apply. Cannot collect before landing; expires unclaimed. Separate from ordinary resources and their five-item cap. |
| Eclipse | 6 seconds | Pauses hostile AI movement, attack windups, boss abilities, traveling Sea Chanter attacks and Thorn/poison hazard updates. Player movement, abilities, friendly fields, ordinary cooldowns and meteors continue. AI resumes when it ends. Reactive bomber death explosions and the player's own bomb remain dangerous. |

Event placement uses walkable interior floor, avoids pads and placed Ruby, and starts at least three tiles from the player. Black hole/Eclipse use the center as a visual/minimap anchor rather than a walkable spawn.

## Implementation

`events.ts` owns scheduling, warning/active state and gravity. `GameState.ambientEvents` stores timers, pool, active positions and shard reward feedback. `updateAmbientEvents` returns a one-time shard-collection signal; `engine.ts` applies existing heal/energy/speed reward helpers. Event updates run against the real player before Lunar AI target substitution. Eclipse gates hostile updates without pausing player-owned fields or meteors. `page.tsx` draws actual event state with crisp glowing rectangles and shows warnings/active feedback.

The God panel is at the upper left, opposite the minimap, and groups Immortal and Full Energy in a two-column row. Black Hole, Shooting Star and Eclipse each have a dedicated button in a compact two-column grid. Event buttons are disabled while a minor event/warning or brief pickup-feedback interval is active, so event triggers do not interrupt pickup feedback. The debug panel draws above touch ability controls so its scrolled controls remain usable.

Meaningful checks: `tests/ambient-events.test.cjs` covers scheduling, pause, wall-safe pulls, rewards and Eclipse; `scripts/check-ruby-events.cjs` verifies all God triggers, rules pause, reset, shard collection and desktop/mobile rendering. Actual reference images are in [visual-reference](visual-reference/).
