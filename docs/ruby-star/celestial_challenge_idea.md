# Celestial Challenge: ideas brief

A short brief for discussing new Celestial Challenge worlds. Ruby Star is a top-down survival/defense game: you protect yourself and Ruby (a gem you can carry or place) across four rooms (ALPHA, BETA, DELTA, GAMMA) joined by hallways, with teleport pads, meteors falling on one room at a time, and regular aliens spawning throughout.

**Celestial Challenge** is a mode with a star map of ten worlds, one per boss. Each world is one long fight against that boss (its guardian), with its own map look, new non-boss enemies, a world mechanic, and usually three phases. You always hold the guardian's celestial skill (F) on a recharge, and most worlds add a C ability.

## The ten bosses (their standard mechanics)

| Boss | World | Core mechanic |
| --- | --- | --- |
| **Fiery King** | The Sun | Chases the nearer of you or Ruby with a short red beam. Speeds up the longer he lives. If left untouched for 10s, he winds up a map-wide wrath hit. |
| **Shadow Queen** | The Moon | Stationary. Shoots through cover inside her room. Every 8s she jumps to another room (never yours) and leaves a 1-HP Echo that keeps shooting. |
| **Storm Reaper** | Jupiter | Very fast melee hunter that only targets you. Seals both ends of a hallway when you share it. |
| **Soul Devourer** | The Singularity | Eats regular aliens to gain stacks. On death she splits into copies per stack. The fight is chasing down the whole swarm. |
| **Frost Warden** | Saturn | Stationary support. Slows you and your attacks in her room, freezes floor tiles, and shields her allies. Relocates every 30s. |
| **Blind Prayer** | Sirius | Reverses your movement controls while alive. Flees from you, and periodically teleports Ruby to another room. |
| **Sea Chanter** | Neptune | Hunts with travelling water attacks and heals her allies. At low HP she dives and flees, healing from damage you deal to other aliens. |
| **Thorn Weaver** | Gaia | Flees while dropping aimed thorn fields on you. The fields slow and poison. She also has an instant field when you get close. |
| **Aegis Sentinel** | Venus | Shielded hunter that reflects your damage back at you. Two pylons in other rooms must be destroyed to expose her core, and they overload if ignored. |
| **Astral Twins** | Binary Star | Two linked bosses, one melee and one ranged. Killing one starts a revive timer, so both must die close together. They share HP back and forth. |

Each boss grants a celestial skill: Solar Flare, Lunar Echo (decoy), Jupiter Storm, Singularity, Saturn Guard, Sirius Surge, Neptune's Tide, Gaia's Roots, Venus Veil and Binary Star.

## Worlds built so far

Every challenge world turns off random space events and gives the boss a big multi-phase HP pool on a segmented guardian bar.

### Neptune (Sea Chanter): finding things

- **Phases:** three phases built around **dives**. At set HP points she dives, becomes nearly untouchable and very fast, and releases water clones hidden across the rooms. Destroy them all in time and she resurfaces at the dive point. Clones left alive heal her.
- **Trident (C):** healing you and Ruby charges it. When full, pick a room for a meteor-like strike.
- **Hazards and enemies:** fish that heal you or hurt you when hit, poison stingers, jellyfish whose death marks a clone, charging sharks, pufferfish that burst, water balls (phase 2+), and room-wide tides that push you.
- **Look:** ocean theme with kelp, caustic light and an open-ocean backdrop.

### Gaia (Thorn Weaver): holding ground

- **Overgrowth:** every floor tile can grow moss, vines or thicket. Overgrowth slows you and heals her, and spreads from her trail and from vine crawlers. Your attacks cut it back, and meteors scorch rooms clean. Placed Ruby keeps a clean ring around itself, and gets squeezed if vines close that ring.
- **Sunfire (C):** clearing vines charges it. Fire early for a burst around you, or wait for full charge and burn a whole room.
- **Sunstones:** baiting her thorn field onto a Sunstone hurts her.
- **Phases:** she withers between phases. Later phases add healing blossoms, root snares, twin fields and drifting stones.
- **Enemies:** sporelings (slowing spore clouds), vine crawlers, knockback Ragecaps, pollen haze, and friendly lifeblooms that heal you.
- **Look:** forest theme.

### The Moon (Shadow Queen): reading which one is real

- **Illusions:** she wears her Echo's look and hides among illusions that look and shoot exactly like her. Her first jump brings 4 illusions, later jumps 2 more each, capped at 6 in phase 1 and 8 from phase 2. Destroyed illusions burst into a ring of crystal shards. Her own damage is low.
- **Tells:**
  - She **reveals her true self** just before each jump and takes extra damage then.
  - **Only she ignores your Lunar Echo decoy**; illusions take the bait.
  - She casts a faint floor reflection (not mentioned on the rule sheet).
  - The guardian bar doesn't move while she's disguised. It catches up when she reveals or jumps.
- **Rewards and tools:**
  - Damage you deal to her heals you, and Ruby if it's in your room, but only when she next jumps, so a hit never gives her away.
  - **Moon Mark (C):** tag the nearest Queen-like target. The mark follows her if it was really her.
  - **Mirror mites:** fragile. Killing one heals you and highlights two rooms on the minimap, one of which holds her.
- **Ruby pressure:** **shades** go straight for a placed Ruby.
- **Phase 2+:**
  - **Mirror tiles:** walkable, but they bounce your laser and bullets back into you, and they move every 20s.
  - **Mimics:** harmless aliens that walk to a wall spot and pose as illusions at 1 HP. The tell is that they never shoot.
- **Phase 3:** one random room is completely dark and the dark moves every 10s. Inside it you see only walls, the room outline, yourself, Ruby and attack effects; enemies appear briefly when hit.
- **Look:** a shadowy crystal cavern with crystal cover blocks and a polished floor with moving sheens.

## Not built yet

The Sun, Venus, Jupiter, Saturn, Sirius, Binary Star and The Singularity are locked on the star map. Each needs its own multi-phase fight, a world mechanic, a C ability and new aliens that fit its guardian. The design rule so far: each world tests a different skill, and each later phase changes how you read the fight rather than just adding damage.
