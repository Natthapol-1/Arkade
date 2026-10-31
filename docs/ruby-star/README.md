# Ruby Star development overview

Ruby Star is a top-down space-station survival/defense game. `/ruby-star` is the mode lobby; modes are listed in [Gameplay](GAMEPLAY.md#modes-and-lobby). Protect the player and Ruby, move between four chambers, defeat aliens and bosses, choose run upgrades, and unlock celestial skills after the tenth boss defeat.

## Read only the topics needed

| Topic | Reference |
| --- | --- |
| Controls, combat, Ruby, energy, teleport, meteors, difficulty | [Gameplay](GAMEPLAY.md) |
| Occasional black holes, shooting stars, eclipses and Supernovas | [Space events](EVENTS.md) |
| Normal aliens, bosses, targeting, shields and defeat rewards | [Enemies and bosses](ENEMIES.md) |
| Constellation run upgrades, Ascension and celestial skills | [Skills and upgrades](SKILLS.md) |
| Art direction, palettes, models, effects, battlefield and UI | [Visual style](VISUALS.md) |
| Sound assets, layers, mix and loop lifecycle | [Audio](AUDIO.md) |
| Sun challenge: temperature, Cinder Wisps, Cooling Wave, stations, rage and extinguishing | [Sun](SUN.md) |
| Neptune challenge: phases, dives, fish, tides, Trident | [Neptune](NEPTUNE.md) |
| Gaia challenge: overgrowth, Sunfire, Sunstones, plants and aliens | [Gaia](GAIA.md) |
| Moon challenge: illusions, reveal, shattering clones, mirror mites, Moon Mark, crystal cavern | [Moon](MOON.md) |
| Code map, implementation constraints, checks and preview tools | [Development](DEVELOPMENT.md) |

## Development direction

- Keep the defense loop centered on protecting both player and Ruby. Carrying, teleporting, healing, meteor timing and enemy priorities should remain meaningful choices.
- Style is **blocky neon-vector** ([Visual style](VISUALS.md#style-blocky-neon-vector)): match the luminous square player and full-energy aura with crisp rectangular silhouettes, dark insets, pale cores and selective glow; moving parts rotate as whole solid shapes, never as pixel staircases. Keep each alien, boss and celestial effect distinct.
- Target desktop only; do not implement or verify mobile unless explicitly asked.
- Playable Celestial Challenges: [Sun](SUN.md), [Neptune](NEPTUNE.md), [Gaia](GAIA.md) and [Moon](MOON.md). The Sun currently repeats the same mechanics across all three phases. Other worlds are locked on the star map.
- New modes get their own route and a lobby card. **Celestial Challenge** has its star map and routes; planned: one mode per celestial boss with a long multi-phase fight against that boss, plus its own non-boss aliens and a unique environment/map mechanic.
- Keep player-facing rules short and clear; technical detail belongs in these references.
- Read the relevant source before editing. Documentation describes intended current behavior; resolve discrepancies against executable code and meaningful tests, then correct the documentation.

## Keep this reference current

When a change affects mechanics, balance, controls, progression, enemies, skills, architecture, audio behavior or visual direction enough to matter to future development, **update the relevant topic file in the same task**. Update this overview only when navigation or high-level direction changes. Refresh affected visual-reference images when model or style changes make them inaccurate.

Write the resulting current rules directly. Replace obsolete values instead of appending change notes. Do not record chat transcripts, version history, abandoned designs, approval history, task status, commit hashes or test-run diaries. Keep each fact in one topic and link to it elsewhere.
