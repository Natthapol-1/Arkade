# Audio

[Overview](README.md)

Runtime mix in `app/ruby-star/engine.ts` is authoritative. `scripts/celestial-audio-map.json` identifies source assets; use the runtime gains below. Attack mix is 0.765. Current celestial gains before that mix: Solar .75 + swoosh .8; Lunar 1.1; Jupiter plasma .8 + laser shot .75 + Queen attack .55; Singularity .8 loop; Saturn .7; Neptune .9 + electric .6; Sirius 1.3 + full-energy cue; Gaia construction .45 + occupied-field click .4 loop.

Source layers: Jupiter/Solar plasma `mixkit-sci-fi-plasma-gun-power-up-1679`, Solar swoosh `mixkit-long-sweeping-air-swoosh-167`, Gaia cast `mixkit-sci-fi-construction-complete-811`, Gaia occupancy `mixkit-sci-fi-click-900`, Jupiter shot `mixkit-laser-weapon-shot-1681`, Neptune layer `mixkit-screechy-electified-item-3213`. Jupiter also uses `bossQueenAttack1.mp3`. Runtime files use renamed copies under `public/sounds/celestial`.

Singularity sound repeats until field expiry; use its gapless 1.046s loop with short edge fades. Gaia occupancy sound repeats only while at least one living enemy occupies its field. Loops stop on pause/hidden page, expiry, game over, restart and unmount. Audio should not continue through paused gameplay. Local sound preview: `/ruby-star-sound-preview.html`.
