# Gameplay

[Overview](README.md)

## Core loop, map and controls

Protect both yourself and Ruby. Each has 100 maximum HP; either reaching zero ends the run. Stage = bosses defeated, starting at Stage 0. This is display numbering; progression thresholds use the same defeated-boss counts. The run continues through escalating boss encounters; Ascension is a late-run reward system, not a separate map.

Four connected chambers in a 2×2 grid: ALPHA top-left, BETA top-right, GAMMA bottom-right, DELTA bottom-left. Internal indices are `[ALPHA, BETA, DELTA, GAMMA]`, so clockwise order is `[0,1,3,2]`. Each has a central teleport pad. Hallways and internal cover remain meaningful obstacles.

| Input | Action |
| --- | --- |
| WASD / arrows | Move |
| Left-click / K | Laser; hold to charge/release a wave |
| Right-click / L | Bullet; hold to keep firing |
| R / Shift / Ctrl | Speed burst |
| Q | Place bomb; press again to detonate |
| E | Carry/place Ruby |
| Space | Heal while carrying or near Ruby, including on teleport pads |
| X | Open teleport destination choice while on a pad |
| 1–4 / destination buttons | Choose teleport destination |
| Escape / X during choice | Cancel teleport |
| F / SPECIAL button | Use held celestial skill |

K/L mirror mouse hold/release behavior, including charge cooldowns and automatic bullet fire. Held attacks cancel on rules/teleport/upgrade pauses, window blur, hidden page, restart and loss. Mouse and keyboard hold sources release independently.

Mobile uses joystick and separate ability buttons, including HEAL and TP. Healing and teleport use separate controls.

Player base speed is 4.5px/tick. Carrying Ruby multiplies normal movement by **0.6**. An active speed burst bypasses that carry penalty. Placed Ruby can be attacked; carried Ruby cannot be directly damaged. Its model takes visual priority over a held celestial suit and speed colors, without consuming the held skill.

Manual healing: +5 Ruby HP and +3 player HP, cooldown 18 ticks, within 3 tiles of a placed Ruby or while carrying. No enemy may be within 6 tiles of the player. Player healing modifiers still apply. Healing is disabled during teleport selection and after game over.

Teleport has no cooldown. Destination buttons match the 2×2 map: Alpha/Beta above Delta/Gamma; the current chamber is dimmed. Selection pauses the entire simulation: enemies, boss/meteor timers, cooldowns, hazards and FX. A carried Ruby is automatically placed on the destination pad; show the existing 2-second Ruby placement cue. Space remains healing, including while standing on a pad; it does not choose a teleport destination.

## Player combat, energy and resources

The following values are the base behavior before [Constellation upgrades](SKILLS.md#constellations).

| Ability | Normal | Powered | Cooldown |
| --- | --- | --- | --- |
| Laser | 2.1 damage, 8-tile range | 6.3 damage, 14 tiles | 40 ticks |
| Bullet | 0.35 damage | 1.05 damage | 11 ticks |
| Charged wave | 8 damage, 6-tile radius, 3-tile push | 14 damage, 10-tile radius, 6-tile push | 120 ticks |
| Speed burst | 2.2× speed for 120 ticks | 240 ticks | 270 ticks |
| Bomb | 45 damage, 4-tile radius | 90 damage, 5-tile radius | 300 ticks after detonation |

Bullet aiming/range uses the engine's nearest eligible target and travel allowance; diving Chanter is excluded from bullet targeting/collisions. Laser/wave/bomb and area attacks can still hit her. A bomb damages its user for 35% of its damage if they remain in range; it never damages Ruby. A placed bomb remains placed when cooldowns are refreshed.

Star gauge maximum is 100. Ordinary non-meteor kills give +5 energy and +5 player HP; Runner adds 8 more energy. Filling the gauge does **not** immediately spend it: the next supported ordinary ability consumes it and starts a 120-tick powered window plus a speed burst. All abilities used during that window are powered. Sirius starts its own longer window.

Resources spawn about every 9.1 seconds, with up to five on the map. Heal shard: +33 player HP. Blue energy shard: +42 energy plus a free speed burst. Amounts clamp to maximums. Collecting resources and return effects must retain their existing crisp symbols.

Player charging visibly shrinks the model before release. Holding through cooldown/paused gameplay resets the charge start time; the next ready cycle must charge afresh, so repeated waves show their shrink animation.

## Difficulty progression

Opening tiers follow elapsed unpaused gameplay time. Later tiers follow defeated bosses. Difficulty does not decrease. Waiting alone reaches tier 3, not the maximum.

| Tier | Unlock | Spawn batch / interval | Enemy cap | HP multiplier | Newly available natural types |
| --- | --- | --- | ---: | ---: | --- |
| 0 | Start | 1 / 180 ticks (3s) | 7 | 1.0 | Normal |
| 1 | 10 seconds | 1 / 150 ticks (2.5s) | 9 | 1.0 | Same |
| 2 | 25 seconds | 1 / 120 ticks (2s) | 11 | 1.0 | Armored, Healer |
| 3 | 45 seconds | 1 / 100 ticks (1.67s) | 16 | 1.2 | Runner, Charger |
| 4 | Stage 1: 1 boss defeated | 2 / 80 ticks (1.33s) | 18 | 1.3 | Sniper, Ghost, Shielder, Energy Leech |
| 5 | Stage 2: 2 defeated | 2 / 65 ticks (1.08s) | 21 | 1.5 | Bomber, Splitter |
| 6 | Stage 3: 3 defeated | 2 / 50 ticks (0.83s) | 25 | 1.7 | Same pool |
| 7 | Stage 4+: 4 defeated | 3 / 38 ticks (0.63s) | 31 | 2.0 | Same pool; hardest regular tier |

Natural normal-enemy HP = `ceil(config.maxHp * tier.hpMult) * 1.1 * constellationAlienHPMult(state)`. The final factor is `1 + .05 * min(6, floor(bossesKilled / 3))`: 1.0 before three defeats, increasing by .05 every third defeat to a 1.30 cap after defeat 18; it affects newly spawned regular aliens, including Splitter children. See [Skills and upgrades](SKILLS.md) for milestone upgrades. The spawn pool repeats `normal` in later tiers to weight grunts more heavily. Spawn batches respect the existing overall enemy-array cap; do not describe the cap as a separate population allowance per chamber. Tier-based spawn pressure reaches its cap at Stage 4. The separate milestone HP factor reaches its cap after 18 boss defeats. Boss HP scales independently and keeps increasing.

## Meteors

Meteors move clockwise: ALPHA → BETA → GAMMA → DELTA. In player-facing quick rules, simply say **“Meteors move clockwise.”** A chamber warns for 5 seconds. Between warnings, the timer is roughly 30s with ±2.5s jitter; warning time is additional.

Impact deals 75 to player and placed Ruby in that chamber, clears unprotected regular aliens, and deals 75% max HP to bosses before Ascension or 45% afterward. Devourer survives meteor damage at a floor of 1% max HP capped at 50; a meteor cannot finish her. A Frost-granted icy shield blocks meteor damage completely. Diving Chanter takes her usual 1.6× vulnerability. Regular meteor kills skip normal score/heal/energy/type rewards, except Leech's stored-energy refund. Boss full restoration/skill rewards still apply. Landing also starts a purely cosmetic one-second chamber explosion that pauses with gameplay.

## Occasional space events

Meteors remain the main recurring hazard. Less frequent black holes, shooting stars and eclipses give advance warnings. See [Space events](EVENTS.md) for their timing, effects and controls.
