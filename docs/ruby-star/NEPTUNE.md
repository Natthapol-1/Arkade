# Neptune challenge

[Overview](README.md) · [Gameplay](GAMEPLAY.md#modes-and-lobby)

The first full Celestial Challenge (`/ruby-star/challenge/neptune`): a long fight against the Sea Chanter built around healing, HP swings and diving. Everything else about a challenge (stage 0, guardian-only boss, recharging celestial skill, win on defeat) is in [Gameplay](GAMEPLAY.md). Values live in `constants.ts` as `NEPTUNE_*`; logic is the "Neptune challenge" section of `engine.ts`; art is `neptune-art.ts`.

## Guardian: three phases

- 6000 HP split into three 2000-HP phases, shown as a three-segment guardian bar (phase 3 on the left, phase 1 on the right) with the current phase's dive points marked. The name line reads SEA CHANTER · PHASE n (· DIVING).
- Phases never reverse: damage cannot push her below the current phase, and healing cannot lift her above it. A phase ends only through its final dive.
- **Dive points** (fractions of the current phase): phase 1 at 75/50/25/0%, phase 2 at 50/0%, phase 3 at 66/33/0%. When her HP reaches an armed point she dives at speed 6.5 and releases water clones one every 2.5s, each at a random spot in a room that has no clone yet, so they must be hunted down: 3 per dive, except 4 on phase 3's final (0%) dive.
- **Clones** (8 HP) swim around like fish. Hitting one stops her ally-feeding heal for 4s. Destroy them all before the timer (20s, or 16s in phase 3) and she resurfaces at once and her HP snaps down to the dive point, cancelling any healing she gained. Each clone left when time runs out restores 10% of the phase. A point re-arms once she is healed above it, so dives can repeat. Clearing the 0% dive starts the next phase (full phase HP). Clearing phase 3's leaves her surfaced and exposed at almost 0 HP with no more dives or healing; the next damage of any kind defeats her and wins the challenge.
- God panel extras: Full Heal Bar (charges the sky laser) and Phase 1/2/3 buttons that put her straight into that phase at full phase HP (summoning her if needed, cancelling any dive). Phase changes show a PHASE n banner.
- Her usual Sea Chanter rules still apply between dives (ally support healing, songs, healing while diving from hits on regular aliens). Fish, clones and water balls never feed her.
- **Phase 2+:** her hits deal 1.5×. While surfaced she drops a water ball on your position every 6s: a 3s fuse, then a 4-tile water burst for 25 to you and Ruby. Destroying it first makes her take 5% of the phase instead.
- **Phase 3 "Maelstrom":** her hits also heal her for the damage dealt (still capped by the phase), and two rooms always have tides, moving every 15s.

## Rule sheet

The map opens its own rule sheet on entry (also on RULES) instead of the general one: animated cards using the game art, one short line each, covering only what is new here (phases, dives and clones, final dive, fish, stingers, water balls, tides, Maelstrom, sky laser). Built in `NeptuneGuide.tsx`.

## World rules

- No space events. Meteors still fall, but deal only 10% of the phase to her.
- **Sky laser:** a healing bar beside energy fills with all healing you and Ruby receive (120). When full, C opens the minimap room picker; the chosen room blinks pale cyan on the minimap (like a meteor warning) and is struck 3s later like a meteor: regular aliens, fish, clones and water balls there are destroyed (a ball destroyed this way still hurts her), she takes 10% of the phase, and you and Ruby take meteor damage if inside.
- **Fish** (1 HP, about 12 at a time) only roam: they never chase or attack. Blue fish heal you 8 when hit, or heal her 3% of the phase if she is diving. Red fish cost you 6 HP when hit. Only direct hits (laser, bullets, wave, bomb) trigger them; celestial skills, meteors, the sky laser and enemy attacks pop them harmlessly. Bullets never auto-aim at fish. Fish give no score, energy or kill healing, never block alien spawns and never count as nearby enemies for manual healing.
- **Stingers** (fish-like alien, 6 HP, speed 0.95, replaces 35% of alien spawns) bite for 4 and poison you for 2 damage per second over 4s.
- **Tides:** in phases 1–2 a 10s current flows through one room every 40–60s. Moving with it is 1.4× faster, against it 0.7×, and anyone not swimming with it is pushed one tile along it every 50 ticks, like the black hole.

## Look

Water clones are 75%-size see-through echoes of her silhouette (square shell, stepped fan fins, crest, fluke and pearl eyes) in flat water tones, with one light band sweeping down and no face details. Ocean palette: blue-teal room colors, deep blue floor with drifting light caustics, sandy specks, swaying kelp on interior cover and rising bubbles; and the void behind the station is open ocean: a depth gradient, swaying light shafts, a blocky reef along the lower view with bioluminescent tips, glowing pink/cyan jellyfish, distant fish schools, rising bubble columns and drifting marine snow, each layer with its own parallax. Tides show a blue wash with chevrons drifting along the current. The sky laser target room pulses pale cyan with a narrowing column and a SKY LASER countdown. Its impact has its own effect (not the meteor explosion): a white-cyan beam from far above fills the room then narrows to a core, square water shockwaves ripple out, and blocky droplets splash up and fall back. A water ball bursts as a water effect (not the bomb blast): a pale wash over the hit area, a stepped crest ring sweeping out to the edge with a deeper blue ring behind, a short splash column and eight arcing 12px droplets. The minimap and teleport/laser pickers use the same ocean room colors, and tide rooms show a faint blue wash with pale chevrons drifting in the current's direction.
