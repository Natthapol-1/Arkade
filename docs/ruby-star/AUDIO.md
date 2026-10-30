# Audio

[Overview](README.md)

Runtime mix in `app/ruby-star/engine.ts` is authoritative. `scripts/celestial-audio-map.json` identifies source assets; use the runtime gains below. Attack mix is 0.765. Game-over uses four descending sawtooth tones with peak gain 0.32 per tone. Current celestial gains before that mix: Solar .75 + swoosh .8; Lunar 1.1; Jupiter plasma .8 + laser shot .75 + Queen attack .55; Singularity .8 loop; Saturn .85; Venus .8 (`celestial/venus-veil.wav`); Binary Star .8 (`celestial/binary-star.mp3`, the user-supplied `binary_star.mp3`) + `celestial/gaia-reach.mp3` .45; Neptune .9 + electric .6; Sirius 1.3 + full-energy cue; Gaia construction .45 + occupied-field click .4 loop.

Source layers: Jupiter/Solar plasma `mixkit-sci-fi-plasma-gun-power-up-1679`, Solar swoosh `mixkit-long-sweeping-air-swoosh-167`, Gaia cast `mixkit-sci-fi-construction-complete-811`, Gaia occupancy `mixkit-sci-fi-click-900`, Jupiter shot `mixkit-laser-weapon-shot-1681`, Neptune layer `mixkit-screechy-electified-item-3213`, Venus the user-supplied `mixkit-sci-fi-positive-item-grab-3173`. Jupiter also uses `bossQueenAttack1.mp3`. Runtime files use renamed copies under `public/sounds/celestial`.

Singularity sound repeats until field expiry; use its gapless 1.046s loop with short edge fades. Gaia occupancy sound repeats only while at least one living enemy occupies its field. Loops stop on pause/hidden page, expiry, game over, restart and unmount. Audio should not continue through paused gameplay. Supernova detonation layers the bomb impact at volume 1 (ordinary bombs use about .636), `meteorExplode.mp3` at volume .85, and a 65Hz sawtooth tail at gain .3. Local sound preview: `/ruby-star-sound-preview.html`.


## Menu sounds

`ui-sfx.ts` synthesizes every menu cue with Web Audio (no files), boosted ×5 with a .6 peak cap. Lobby: hover/focus tick on cards and arrows, distinct select cues for Endless Space (warp-in sweep) and Ascension (three-note ascent with shimmer), a low denied buzz on the locked card, and page/back slides when rotating. Rule sheet: page slide when the HUD RULES button opens it and to Aliens & Bosses, back slide to Main Rules, power-down chirp on ✕ and a two-tone acknowledge on UNDERSTOOD (other arcade games keep the shared click). EXIT uses the back slide. Teleport: a rising warble when X/TP opens the menu, hover ticks on available chambers and the power-down chirp when cancelled; arrival keeps its existing cue. Tutorial: the acknowledge cue when a step is cleared and the Ascension cue on completion. Room strike ready (Neptune's Trident or Gaia's Sunfire reaching full): a bright rising chime with a shimmer (`charged`) layered with `strike-charged.wav` (a 2.7s sci-fi "item acquired" cue, gain .55; played from `engine.ts`). Challenge victory: a fanfare (rising C–E–G arpeggio into a held major chord with a high shimmer).

## Space events

`event-audio.ts` owns distinct event cues. All gains below are final HTML Audio volumes; playback rate changes intentionally shift pitch.

| Event | Warning | Active |
| --- | --- | --- |
| Black Hole | `celestial/solar-flare-swoosh.wav`, gain .35, rate 1 | Retriggers `reverse.mp3` every 0.35s of event time, gain .22, rate 1; overlapping tails up to 1.2s, maximum four voices |
| Shooting Star | `light.mp3`, gain .32, rate 1.25 | Solar swoosh, gain .35, rate 1.5; pickup adds energy-pickup cue at .4/rate 1.2 |
| Eclipse | `celestial/skill-ready.wav`, gain .3, rate .65 (full cue, about 1.6s) | Retriggers `seaDive.mp3` every 2s, gain .28, rate .65, tails up to 4.8s; maximum three voices |
| Supernova | `kingFireSpell.mp3`, gain .35, rate .65 | Formation layers Solar flare (.45/rate .75) and swoosh (.4/rate .85). Triggered charge uses `celestial/solar-flare-swoosh.wav` (.4/rate 1), followed by the detonation mix above |

Warning/arrival cues are bounded one-shots; Supernova charge lasts up to 3 seconds. One-shot event cues play on transitions. Black Hole repeats on its 21-tick cadence with bounded overlapping voices; Eclipse retriggers every 120 ticks so the sound's fading tail does not leave silence before expiry. Event voices pause in place during teleport selection, rules, Constellations and hidden pages, then resume from the same playback position alongside the simulation. At expiry, repeating voices finish with a 24-tick (0.4s) quadratic volume fade; individual repeated cue tails also fade through their final 0.25s rather than cutting off abruptly. Fades pause with gameplay; game over, restart and unmount cancel all voices. Hidden pages and unavailable audio cannot interrupt gameplay. `tests/event-audio.test.cjs` verifies assets, cue identity, overlap, pause/resume and cleanup.

Constellation choices play the user-supplied `mixkit-magic-sparkle-whoosh-2350.wav`, stored as `public/sounds/constellation-choice.wav`, once at volume .6 when the delayed selection screen opens. Paused ticks do not retrigger it.

Confirming a valid Constellation choice plays the separate user-supplied `constellation_choosing.wav`, stored as `public/sounds/constellation-chosen.wav`, once at volume .6. Invalid, duplicate or out-of-dialog selections do not play it.

Ascension unlock plays the user-supplied `47313572-sci-fi-launch-5-351240_dIxRlzHd.mp3`, stored as `public/sounds/ascension-unlock.mp3`, once at volume .7 on the tenth boss defeat. God Stage +1 and the direct debug Ascension helper also play it when first crossing the unlock threshold; later rewards do not retrigger it.

Charger rush contact plays a heavy impact: `hitHurt.wav` at volume .55, playback rate .7 with pitch shifting, plus a short 90Hz triangle thud. It replaces the generic alien firing cue for Charger hits and also plays when shields absorb the hit or a Lunar Echo is struck. Missed rushes do not play it.

## Reserved sound assets

- Public sound asset: nexawave-whoosh-transition.mp3. Original user-supplied filename: rescopicsound-cinematic-designed-sci-fi-whoosh-transition-nexawave-228295_cX0J7na3.mp3. Reserved for future use; no gameplay cue currently references it.
- Public sound asset: sci-fi-explosion-09.mp3. Original user-supplied filename: daviddumaisaudio-sci-fi-explosion-09-190268.mp3. Reserved for future use; no gameplay cue currently references it.

## Pylon overload

Pylons reuse meteor-warning pulses once per second during their three-second overload warning, with the urgent pulse in the final second. The chamber blast plays the user-supplied `pylon-explode.mp3`, stored as `public/sounds/pylon-explode.mp3`, once at .9 before the shared .765 attack mix (.6885 final), replacing the bomb explosion cue. Overload warnings pause in menus and during Eclipse along with their timers.

## Aegis attack

Aegis uses the user-supplied `Aegis-attack.mp3`, stored as `public/sounds/aegis-attack.mp3`. It plays once when its existing strike connects with the player, Ruby or a Lunar Echo, in both shielded and exposed states. Gain is .8 before the shared .765 attack mix (.612 final); it replaces the generic alien shooting cue for Aegis.

## Shield and pylon breaks

User-supplied assets under `public/sounds/`: `frost-shield-break.mp3` plays once when damage depletes an enemy's Frost Warden ice-shield pool (.7 before the attack mix); `pylon-break.wav` replaces the generic alien death cue when a pylon is destroyed (.85); `aegis-shield-break.wav` plays once when the last living pylon is destroyed and Aegis's barrier actually breaks (gain 3 before the .765 mix, or 2.295 final). A Web Audio gain node boosts this cue beyond the HTML volume limit, roughly 3.3 times its earlier level; nodes disconnect when playback ends or fails. The final pylon plays its own break and the barrier break together. Partial damage, pylon overload/relocation and debug cleanup do not play these break cues.

## Aegis shield return

During the last 3 seconds of exposure, a synthesized two-note triangle chime plays at 3, 2 and 1 seconds (660→990 Hz, then 990→1480 Hz on the final second). It is deliberately softer and rounder than the square meteor/pylon beep.

## Twin attacks, sharing and revival

Dawn's melee hits use `public/sounds/celestial/jupiter-storm.wav` at gain 1.3 before the .765 mix (.9945 final). The user-supplied `dawn_attack.mp3` remains stored as `public/sounds/dawn-attack.mp3` for future use. Dusk's user-supplied `dusk_attack.mp3` is stored as `public/sounds/dusk-attack.mp3` and plays once when its tracking charge fires at .8 before the mix (.612 final), layered with `celestial/neptune-electric.wav` at a Dusk-only multiplier of 3.5 on the normal .6 gain (1.6065 final after the .765 mix), using Web Audio amplification. Neptune's own skill keeps its normal electric-layer gain. `public/sounds/twin-revive.mp3` plays once when a fallen twin actually returns, at .85 before the mix (.65025 final). Downing a twin, paused ticks and final encounter completion do not play revival audio.

Each actual HP transfer plays `celestial/skill-ready.wav` once at the normal ready-cue gain (.5 before the .765 mix, .3825 final). Failed transfer attempts, full recipients, pauses and downed partners do not trigger it.

## Thorn Weaver field

The aimed field plays `falling-thing.wav` (0.75s, gain .6) starting 45 ticks before it erupts, so it lands with the falling seed; then the thorns erupt with `place-plant.mp3` (.4 gain). It never uses the player's `charging.wav`. Seed pods bursting in the Gaia challenge reuse `place-plant.mp3` at .5.

## Neptune Trident

1.6s before the Trident lands, `meteorFalling.mp3` plays at rate 1.6 with pitch raised (`preservesPitch = false`, gain .5) so its fall ends on the strike; Neptune's electric cue (`celestial/neptune-electric.wav`) adds a crackle 0.5s before impact. The strike itself uses the meteor impact sound.

## Gaia Sunfire

The blast layers the Solar Flare cue (`celestial/solar-flare.wav`, ×1–1.6 with charge) with `sci-fi-explosion-09.mp3` (gain .45–.95 with charge). A full chamber burn plays both at their strongest plus `bombExplode.wav` (.9), with a heavier screen shake.

## Moon reveal

When the Moon Queen's disguise breaks before a jump, the Lunar Echo cue (`celestial/lunar-echo.wav`, gain .99) plays from 0.1s in (skipping its silent start) at rate 1.6 with pitch raised (`preservesPitch = false`), so it lands with the reveal, over `frost-shield-break.mp3` at .4; both before the .765 attack mix.
