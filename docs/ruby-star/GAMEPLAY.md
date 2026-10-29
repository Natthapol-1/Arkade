# Gameplay

[Overview](README.md)

## Modes and lobby

`/ruby-star` opens the lobby: the RUBY STAR title and a carousel of big square mode cards. Left/right arrow buttons, the ← → keys or the dots rotate it; side cards are smaller and dimmed, and clicking one rotates to it. Clicking the centred card (or Enter) starts it. Debug query flags such as `?god=1` carry over to the chosen mode, and EXIT in a game returns to the lobby.

| Mode | Route | Start |
|---|---|---|
| First Orbit (TUTORIAL tag) | `/ruby-star/tutorial` | Guided sandbox (see below). Sits left of Endless Space; Endless Space is centred when the lobby opens |
| Endless Space | `/ruby-star/endless` | Standard run from stage 0 |
| Endless Space: Ascension | `/ruby-star/ascension` | Stage 10 (celestial skills unlocked, Ascension banner) with regular aliens at the hardest tier. Play pauses on a CHOOSE A CELESTIAL SKILL screen first: ten cards (suit preview, skill name, source boss, short effect); the pick becomes the held skill. Then three Constellation picks (two choices each) open one after another, starting 1s after play resumes. Restart keeps the mode |
| Celestial Challenge | `/ruby-star/challenge` | Opens the star map (below). Each world route `/ruby-star/challenge/<body>` is a prototype challenge (below); unknown bodies 404 |

Only the Neptune challenge opens a rule sheet on entry (its own, see [Neptune](NEPTUNE.md)); elsewhere the HUD RULES button opens it. Music starts on entry, or on the first key/click if the browser blocks autoplay.

**Celestial Challenge star map.** Ten blocky celestial bodies on a dashed route (data in `app/ruby-star/trials.ts`): The Sun (Fiery King), Venus (Aegis Sentinel), Gaia (Thorn Weaver), The Moon (Shadow Queen), Jupiter (Storm Reaper), Saturn (Frost Warden), Neptune (Sea Chanter), Sirius (Blind Prayer), Binary Star (Astral Twins) and The Singularity (Soul Devourer). Hover/focus or arrow keys select a body (pulsing corner frame); the panel shows CHALLENGE: <BODY>, guardian boss, celestial skill and a development note. Clicking the selected body, BEGIN CHALLENGE or Enter starts it. EXIT returns to the lobby. Planned: each trial is one long multi-phase fight against its guardian with its own non-boss aliens and a unique environment mechanic.

**Challenge rules (prototype).** Engine mode `trial`, created with the guardian boss: a normal stage 0 run on the standard map (regular aliens, meteors and events as usual), but the guardian is the only boss. Its arrival warning starts after 5s (`TRIAL_BOSS_DELAY`) regardless of difficulty tier. You start holding the guardian's celestial skill; after each cast it returns 20s later (`TRIAL_SKILL_COOLDOWN`). A HUD icon beside the bomb (`CelestialStatus.tsx`) shows the skill: a glowing four-point star in its color with an F hint when ready, dimmed with a filling perimeter while recharging; there is no text chip. The HUD centre replaces STAGE with the guardian HP bar, and bosses have no over-head HP bars (pylons keep theirs). The God panel in a challenge is trimmed to protection, Full HP/Energy, No Mobs/No Boss and RESET (no Stage +1, Constellations, space events, boss summons or skill grants). Defeating the whole guardian encounter (both Twins, every Devourer body) sets phase `won`, stopping play on a CHALLENGE CLEARED panel with STAR MAP and RETRY; losing uses the normal end panel. EXIT returns to the star map. Phases, new aliens and world mechanics come later; the Neptune challenge already has them ([Neptune](NEPTUNE.md)).

**First Orbit (tutorial).** Its lobby card shows a ruby with the player ship on a square orbit. A safe sandbox: no natural aliens, bosses, meteors or space events, and player and Ruby never drop below 1 HP. A panel under the HUD shows one step at a time (title, short instruction, goal pips) with a "✓ NICE!" pause between steps. Steps (from `TUTORIAL_STEPS` in `constants.ts`): move 8 tiles; laser and bullets (2 aliens each, defeat them using that weapon); charged wave; speed burst; bomb (drop and detonate); star energy (energy is topped up to 90 with 3 aliens; kills fill it and the next attack must turn powered); pick up and put down Ruby; heal 6 times (player and Ruby start at 50 HP, nearby aliens are cleared); teleport; meteor (a 5s warning on your room with 3 aliens; staying inside at impact restarts the step with a hint); cast a granted Solar Flare. The final panel (FIRST ORBIT COMPLETE) offers green pixel PLAY ENDLESS SPACE and outlined LOBBY buttons. The regular meteor countdown is hidden.

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
| X | Open teleport destination choice while on a pad or any of its eight neighboring tiles |
| 1–4 / click a chamber on the teleport map | Choose teleport destination |
| Escape / X during choice | Cancel teleport |
| F / SPECIAL button | Use held celestial skill |

K/L mirror mouse hold/release behavior, including charge cooldowns and automatic bullet fire. Held attacks cancel on rules/teleport/upgrade pauses, window blur, hidden page, restart and loss. Mouse and keyboard hold sources release independently.

Mobile uses joystick and separate ability buttons, including HEAL and TP. Healing and teleport use separate controls.

Player base speed is 4.5px/tick. Carrying Ruby multiplies normal movement by **0.6**. An active speed burst bypasses that carry penalty. Placed Ruby can be attacked; carried Ruby cannot be directly damaged. Its model takes visual priority over a held celestial suit and speed colors, without consuming the held skill.

Manual healing: +5 Ruby HP and +3 player HP, cooldown 18 ticks, within 3 tiles of a placed Ruby or while carrying. No enemy may be within 6 tiles of the player. Player healing modifiers still apply. Healing is disabled during teleport selection and after game over.

Teleport has no cooldown. Destinations are picked by clicking a chamber on the enlarged minimap; the current chamber is dimmed and not clickable. Selection pauses the entire simulation: enemies, boss/meteor timers, cooldowns, hazards and FX. A carried Ruby is automatically placed on the destination pad; show the existing 2-second Ruby placement cue. Space remains healing, including while standing on a pad; it does not choose a teleport destination.

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

Star gauge maximum is 100. Ordinary non-meteor kills give +5 energy and +5 player HP (Solar Flare kills give no energy, including their bomber cascades); Runner adds 8 more energy. Filling the gauge does **not** immediately spend it: the next supported ordinary ability consumes it and starts a 120-tick powered window plus a speed burst. All abilities used during that window are powered. Shooting Star adds two seconds to its next full-gauge activation; Sirius starts its own longer window.

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

Natural normal-enemy HP = `ceil(config.maxHp * tier.hpMult) * 1.1 * constellationAlienHPMult(state)`. The final factor is `1 + .05 * min(6, floor(bossesKilled / 3)) + .02 * max(0, bossesKilled - 18)`: 1.0 before three defeats, +.05 every third defeat to 1.30 at defeat 18, then +.02 per further defeat with no cap (endless runs keep getting slightly harder); it affects newly spawned regular aliens, including Splitter children. See [Skills and upgrades](SKILLS.md) for milestone upgrades. The spawn pool repeats `normal` in later tiers to weight grunts more heavily. Spawn batches respect the existing overall enemy-array cap; do not describe the cap as a separate population allowance per chamber. Tier-based spawn pressure reaches its cap at Stage 4. The separate milestone HP factor slows to +2% per boss after 18 defeats but never stops growing. Boss HP scales independently and keeps increasing.

## Meteors

Meteors move clockwise: ALPHA → BETA → GAMMA → DELTA. In player-facing quick rules, simply say **“Meteors move clockwise.”** A chamber warns for 5 seconds. Between warnings, the timer is roughly 30s with ±2.5s jitter; warning time is additional.

Impact deals 75 to player and placed Ruby in that chamber, clears unprotected regular aliens, and deals 75% max HP to bosses before Ascension or 45% afterward. Every Devourer body, copies included, takes 75% (45% after Ascension) of the original Devourer's spawn max HP, so a meteor usually wipes copies; a killed body still splits into its copies. A Frost-granted icy shield blocks meteor damage completely. Diving Chanter takes her usual 1.6× vulnerability. Regular meteor kills skip normal score/heal/energy/type rewards, except Leech's stored-energy refund. Boss full restoration/skill rewards still apply. Landing also starts a purely cosmetic one-second chamber explosion that pauses with gameplay.

## Occasional space events

Meteors remain the main recurring hazard. Less frequent black holes, shooting stars and eclipses give advance warnings. See [Space events](EVENTS.md) for their timing, effects and controls.
