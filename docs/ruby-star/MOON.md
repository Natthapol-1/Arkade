# Moon challenge

[Overview](README.md) · [Gameplay](GAMEPLAY.md#modes-and-lobby)

`/ruby-star/challenge/moon`: an illusion fight against the Shadow Queen. Neptune is about finding things and Gaia about holding ground; the Moon is about reading which Queen is real. Everything shared by challenges (stage 0, guardian-only boss, recharging celestial skill, win on defeat) is in [Gameplay](GAMEPLAY.md). Values live in `constants.ts` as `MOON_*`. Logic is `moon.ts` (`state.moon`, with short hooks in `engine.ts`), art is `moon-art.ts` (the theme switches on via `isMoonMap`), and the rule sheet is `MoonGuide.tsx`.

**Only the first phase exists so far**; defeating it wins. More phases are planned.

## The fight

- **HP:** 2000 on one guardian bar. Her own hits deal 0.6× of the usual Queen damage. Her jumps never heal her.
- **Disguise:** she wears her Echo's look (model, flicker, bolt colour and minimap dot), so she looks exactly like her illusions.
- **Illusions** (`moon_illusion`, 4 HP):
  - Her first jump brings 4 and every jump after brings 2, appearing the same instant she lands: one in her new chamber and the rest in chambers other than yours.
  - At most 8 are alive; past that the oldest fades out.
  - They are stationary and run her exact AI (target choice, range, 40-tick windup, 70-tick cooldown), shooting for 3 to you and 2 to Ruby.
  - They give no score, energy or kill rewards. Her jump no longer leaves permanent Echoes.
- **Reveal:** for the last 1.5s (90 ticks) before each jump, she shows her true model with a breaking-mask burst, and takes 2.5× damage.
- **Shatter:** an illusion destroyed by anything other than a meteor bursts into a ring of 8 crystal shards. They fly about 9 tiles at 5px/tick and stop at walls. A shard deals 6 to you or 4 to a placed Ruby, once.
- **Tell:** only the real Queen casts a reflection on the crystal floor: a faint violet glow and a mirrored tiara below her.
- **Moon Mark (C):** marks the nearest Queen or illusion for 6s (blinking in the last second), then recharges 12s from the cast. A HUD icon after the energy bar shows it, in the celestial skill icon style: ice-blue sigil glowing with a C hint when ready, dimmed with a filling perimeter while recharging. The mark rides on whoever wears it: an ice-blue sigil on the battlefield and an ice-blue frame on the minimap. If it was her, it follows her to her next chamber; an illusion's mark stays put when she jumps. It reveals nothing by itself.
- **Meteors** deal 8% of the phase (160) to her and wipe illusions in that room without shards.
- **No space events.** Her defeat clears every illusion and shard.

## Rule sheet

The map opens its own rule sheet on entry (also on RULES): five animated cards with one short line each. They cover the hidden Queen, the reflection, the reveal, the Moon Mark and shattering illusions.

## Look

A shadowy crystal cavern under the lunar surface: crystalline, magical and mysterious. There is no moon in the sky, since you are already on it.

- **Room colours:** amethyst, violet, orchid and ice blue (`MOON_CHAMBER_COLORS`), used on the battlefield borders, minimap and teleport picker. Ice blue `#a9e6ff` is the magic accent throughout.
- **Cover blocks:** every block is solid crystal (`drawMoonCrystalBlock`). Each tile is cut differently (a diagonal split either way, or an off-centre point) and lit from the top left, mostly in the room colour with some orchid tiles. Some tiles hold a deeper inner facet that pulses with an ice-blue spark. Thin pale facet edges, a bright rim only where a block meets open floor, and a pale glint that sweeps diagonally across all crystal at once.
- **Floor:** near-black polished crystal. Two soft diagonal sheens sweep across it (a broad violet one and a thin ice-blue one), faint grain lines brighten as the sheen passes, and each crystal block reflects a fading glow into the floor tile below it. Large dark mist patches drift slowly over the floor. A few tiles hold a small set gem that twinkles, and rare runes (a square frame, a turning diamond, four corner marks) fade in and out. Pads stay clean.
- **Motes:** violet and ice-blue motes with short tails rise through the rooms on fixed world columns.
- **Backdrop:** the dark of a vast geode. Stepped crystal spires rise from below and hang from above in two parallax layers; the near ones have glowing tips and pulsing veins. Faint prism shafts sway, deep violet mist drifts, lone crystal shards turn slowly, crystal dust twinkles, and a shadow vignette closes in at the top and bottom.

References, rendered from the real drawing code by `scripts/preview-moon.cjs`: [world at three animation ages](visual-reference/moon-world.png) [crystal cover glint sweep](visual-reference/moon-crystal-cover.png), and [disguised Queen among illusions vs revealed](visual-reference/moon-illusions.png).
