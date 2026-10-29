# Skills and upgrades

[Overview](README.md)

## Constellations

After every third actual boss defeat (3, 6, 9, 12, 15, ...), wait one second of unpaused play for defeat effects, then pause and offer two distinct random unowned Constellations. Each can be chosen only once per run; there are no ranks or repeat picks. Choices continue after Ascension. When one remains, offer it alone; after all 20 are owned, stop offering Constellations. Restart clears owned upgrades and pending choices. The God-panel Constellations button opens a paused editor with all 20 upgrades as independent toggles; click an active card to remove its effect, then use Done or Escape to resume. This does not advance stages or consume milestone rewards.

Click, tap, keys 1/2, or focused-button Enter/Space selects. Keyboard focus stays in the dialog. `gamePhase='constellation'` freezes simulation and rejects gameplay actions. Boss restoration, hazard cleanup and celestial rewards still resolve, including meteor/special defeats. Choosing clears held mouse/touch movement and attack input. The chosen star pattern briefly appears as a faint, non-interactive afterglow for 96 gameplay ticks (1.6s) while play continues; it pauses with gameplay and clears on restart. The HUD lists owned constellations, with descriptions available on hover.

| Constellation / internal key | Effect |
| --- | --- |
| Ophiuchus / `healing` | Manual healing recharges 20% faster: 15-tick cooldown rather than 18 |
| Lyra / `laser` | Normal/powered laser damage ×1.2 |
| Pegasus / `speed` | Movement ×1.08, including carrying and speed burst; forced knockback unchanged |
| Aquarius / `energy` | Ordinary kill and blue-shard energy ×1.2, including Runner bonus; Leech stored-energy refunds are not multiplied |
| Perseus / `bomb` | Normal/powered bomb radius +1 tile, including visible range and self-damage reach |
| Orion / `bullets` | Normal/powered bullet damage ×1.25 |
| Draco / `wave` | Normal/powered wave damage ×1.25 |
| Cassiopeia / `ruby` | Incoming Ruby damage ×0.85 before its shield, including meteors |
| Phoenix / `power` | Powered duration +60 ticks, including Sirius Surge; firing during active power does not extend it |
| Aquila / `laserRate` | Laser cooldown ×0.85 |
| Cygnus / `waveReach` | Normal/powered wave radius +1 tile and push +1 tile; visible wave matches actual reach |
| Scorpius / `bombDamage` | Normal/powered bomb damage ×1.2, including its self-damage calculation |
| Taurus / `burstDuration` | Manual/powered/free speed-burst duration ×1.25 |
| Vela / `burstRate` | Manual speed-burst cooldown ×0.8 |
| Centaurus / `waveRate` | Wave cooldown ×0.85; hold-to-charge time unchanged |
| Delphinus / `playerGuard` | Incoming player damage ×0.9 before shields, including meteors, poison and bomb self-damage; Ruby unchanged |
| Libra / `manualHealing` | Manual healing adds +2 Ruby HP and +1 player HP per use |
| Hercules / `killHealing` | Ordinary kill healing adds +2 player HP; meteor defeats give none |
| Cepheus / `bombRate` | Bomb cooldown ×0.8 |
| Crux / `laserRange` | Normal/powered laser range +2 tiles; bullets unchanged |

Healing safety checks, HP/energy caps and bomb Ruby immunity remain. Upgrades affecting different aspects of the same ability combine. No upgrade changes celestial skill damage. Existing fields and placed bombs retain their rules; Perseus updates the shared bomb radius calculation for both gameplay and the indicator.

New regular aliens and Splitter children gain +5% HP per third-boss milestone, capped at +30% after defeat 18. The factor multiplies existing tier/global HP scaling and does not retroactively rescale existing enemies. Bosses retain their existing +15 HP per prior defeat, without an extra Constellation multiplier; Queen echoes are unchanged. See [Difficulty](GAMEPLAY.md#difficulty-progression).

## Ascension and celestial skills

The **tenth boss defeat** unlocks Ascension and grants that defeated boss's skill. Every subsequent encounter grants its mapped skill. Aegis Sentinel grants Venus Veil; Astral Twins grants Binary Star, awarded once after defeating the pair. Hold one single-use skill; the next reward replaces it. F activates it. Consume the old skill before resolving its kills, so a boss killed by that skill can immediately grant a replacement. A held skill changes the suit; carrying Ruby takes model priority without deleting the skill. Celestial colors and shapes follow the player planet/star theme; see [Visual style](VISUALS.md).

| Boss reward | Skill | Effect |
| --- | --- | --- |
| King | Solar Flare | Entire arena: 25 normal damage / 10% boss max HP. Regular Solar kills grant no energy, including Runner bonuses and Leech refunds; ordinary non-energy rewards remain. Boss kills still restore player/Ruby HP and energy fully |
| Queen | Lunar Echo | Stationary decoy with 12 connected hits; 21-tick invulnerability after each hit; no time limit |
| Reaper | Jupiter Storm | Within 6 tiles: 60 normal damage / 30% boss max HP |
| Devourer | Singularity | One fixed version: 5-tile-radius field for 18s. Normal pull one tile/15 ticks; boss pull one tile/30 ticks, walls respected. Enemies inside cannot teleport; overdue Queen/Warden relocation waits until they leave or the field expires, without spawning echoes or granting jump healing while blocked. Damage once per second: 6 to regular aliens, 1.5% max HP to bosses |
| Warden | Saturn Guard | Player and Ruby absorb shields refilled to at least 40 each, with celestial appearance until depleted; not +40 stacking |
| Prayer | Sirius Surge | At least 6s powered mode, clears star gauge, free speed burst, resets laser/bullet/wave/bomb/speed cooldowns. Existing placed bomb remains |
| Chanter | Neptune's Tide | Heals player/Ruby +35 each; pushes enemies within 8 tiles 3 tiles away |
| Aegis | Venus Veil | For 10s, damage to player and placed Ruby is cut to 30% (after Delphinus/Cassiopeia, before shields). Direct enemy attacks also return their full pre-reduction damage to the attacker; bosses take at most 3% max HP per reflected hit. Meteors, explosions, poison, Thorn fields, Supernova, pylon overloads and the player's own bomb are reduced but not reflected. Reflection still happens under Invincible, but not when Lunar Echo takes the hit |
| Twins | Binary Star | For 15s, an untargetable mirror twin stands on the first open tile beside placed Ruby (beside the player while carrying). Every laser, bullet and wave also fires from the twin, and each bomb detonation adds a twin blast there, all at 60% damage. Twin attacks use the same powered state, push, Supernova triggers and kill rewards; the twin blast never hurts the player |
| Weaver | Gaia's Roots | Stationary tile-aligned 12×12 field for 30s, floor only; enemies move 40% slower, take 4 normal damage/sec or 1% boss max HP/sec |

Skill damage respects shields and enemy vulnerabilities, but does not feed diving Chanter. Persistent fields pulse once per second and expire before a pulse on the exact expiry tick; listed DPS×duration is not necessarily the exact total. For example, max Singularity lasts 24s but delivers 23 whole pulses: 46% boss max HP before shields/vulnerability if continuously inside. Gaia also excludes the exact-expiry pulse. Recasts replace the existing field/decoy of that type.

Values in the celestial table are before applicable Constellation modifiers.
