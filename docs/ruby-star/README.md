# Ruby Star development overview

Ruby Star is a top-down space-station survival/defense game at `/ruby-star`. Protect the player and Ruby, move between four chambers, defeat aliens and bosses, choose run upgrades, and unlock celestial skills after the tenth boss defeat.

## Read only the topics needed

| Topic | Reference |
| --- | --- |
| Controls, combat, Ruby, energy, teleport, meteors, difficulty | [Gameplay](GAMEPLAY.md) |
| Occasional black holes, shooting stars, eclipses and Supernovas | [Space events](EVENTS.md) |
| Normal aliens, bosses, targeting, shields and defeat rewards | [Enemies and bosses](ENEMIES.md) |
| Constellation run upgrades, Ascension and celestial skills | [Skills and upgrades](SKILLS.md) |
| Art direction, palettes, models, effects, battlefield and UI | [Visual style](VISUALS.md) |
| Sound assets, layers, mix and loop lifecycle | [Audio](AUDIO.md) |
| Code map, implementation constraints, checks and preview tools | [Development](DEVELOPMENT.md) |

## Development direction

- Keep the defense loop centered on protecting both player and Ruby. Carrying, teleporting, healing, meteor timing and enemy priorities should remain meaningful choices.
- Match the luminous square player and full-energy aura: crisp rectangular silhouettes, dark insets, pale cores, selective glow and readable pixel motion. Keep each alien, boss and celestial effect distinct.
- Keep player-facing rules short and clear; technical detail belongs in these references.
- Read the relevant source before editing. Documentation describes intended current behavior; resolve discrepancies against executable code and meaningful tests, then correct the documentation.

## Keep this reference current

When a change affects mechanics, balance, controls, progression, enemies, skills, architecture, audio behavior or visual direction enough to matter to future development, **update the relevant topic file in the same task**. Update this overview only when navigation or high-level direction changes. Refresh affected visual-reference images when model or style changes make them inaccurate.

Write the resulting current rules directly. Replace obsolete values instead of appending change notes. Do not record chat transcripts, version history, abandoned designs, approval history, task status, commit hashes or test-run diaries. Keep each fact in one topic and link to it elsewhere.
