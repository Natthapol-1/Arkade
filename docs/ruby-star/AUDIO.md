# Audio

[Overview](README.md)

Runtime mix in `app/ruby-star/engine.ts` is authoritative. `scripts/celestial-audio-map.json` identifies source assets; use the runtime gains below. Attack mix is 0.765. Game-over uses four descending sawtooth tones with peak gain 0.32 per tone. Current celestial gains before that mix: Solar .75 + swoosh .8; Lunar 1.1; Jupiter plasma .8 + laser shot .75 + Queen attack .55; Singularity .8 loop; Saturn .7; Neptune .9 + electric .6; Sirius 1.3 + full-energy cue; Gaia construction .45 + occupied-field click .4 loop.

Source layers: Jupiter/Solar plasma `mixkit-sci-fi-plasma-gun-power-up-1679`, Solar swoosh `mixkit-long-sweeping-air-swoosh-167`, Gaia cast `mixkit-sci-fi-construction-complete-811`, Gaia occupancy `mixkit-sci-fi-click-900`, Jupiter shot `mixkit-laser-weapon-shot-1681`, Neptune layer `mixkit-screechy-electified-item-3213`. Jupiter also uses `bossQueenAttack1.mp3`. Runtime files use renamed copies under `public/sounds/celestial`.

Singularity sound repeats until field expiry; use its gapless 1.046s loop with short edge fades. Gaia occupancy sound repeats only while at least one living enemy occupies its field. Loops stop on pause/hidden page, expiry, game over, restart and unmount. Audio should not continue through paused gameplay. Supernova detonation layers the bomb impact at volume 1 (ordinary bombs use about .636), `meteorExplode.mp3` at volume .85, and a 65Hz sawtooth tail at gain .3. Local sound preview: `/ruby-star-sound-preview.html`.


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

## Reserved sound assets

- Public sound asset: sci-fi-explosion-09.mp3. Original user-supplied filename: daviddumaisaudio-sci-fi-explosion-09-190268.mp3. Reserved for future use; no gameplay cue currently references it.
- Public sound asset: nexawave-whoosh-transition.mp3. Original user-supplied filename: rescopicsound-cinematic-designed-sci-fi-whoosh-transition-nexawave-228295_cX0J7na3.mp3. Reserved for future use; no gameplay cue currently references it.
