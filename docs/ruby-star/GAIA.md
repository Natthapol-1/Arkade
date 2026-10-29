# Gaia challenge

[Overview](README.md) · [Gameplay](GAMEPLAY.md#modes-and-lobby) · [Neptune](NEPTUNE.md)

The second full Celestial Challenge (`/ruby-star/challenge/gaia`): a territory fight against the Thorn Weaver over an overgrowing station. Neptune is about finding things; Gaia is about clearing and holding ground. Everything shared by challenges (stage 0, guardian-only boss, recharging celestial skill, win on defeat) is in [Gameplay](GAMEPLAY.md). Values live in `constants.ts` as `GAIA_*`. Logic is `gaia.ts` (`state.gaia`, with short hooks in `engine.ts`), art is `gaia-art.ts`, and the rule sheet is `GaiaGuide.tsx`.

## Overgrowth

- Every floor tile has a growth level: 0 clean, 1 moss, 2 vines, 3 thicket. Walls and pads never grow.
- **Vines** slow you to 0.6×. She heals 0.5% of the phase per second while standing on them.
- **Thicket** slows you to 0.45× and deals 1 damage per second. She heals 1% per second on it and takes only 75% damage there.
- **Spreading:**
  - **Her trail:** tiles within 2 of her grow +1 every 1.5s, up to vines.
  - **Creep:** every 3s, vines have a 15% chance to spread moss into a clean neighbour, and moss beside vines can thicken. Capped at 120 upgrades per pass.
  - **Vine crawlers:** they thicken the tiles they walk on.
- **Clearing:**
  - Lasers and bullets take 1 level off each tile they hit.
  - Waves and bombs clear their whole radius.
  - Gaia's Roots (your challenge skill, F; 30s field, returns 40s after a cast) clears its whole field when cast (any level) and stops growth inside it while it lasts.
  - Meteors **scorch** their whole room: growth goes to 0 and nothing regrows for 10s.
- **Ruby:** placed Ruby keeps every tile within 2 (Chebyshev distance) clean. If every floor tile in the ring at distance 3 reaches vines, the ring closes and squeezes Ruby for 3 per second. The ring is outlined orange at 80% coverage and red when closed. Carried Ruby has no ward.
- **Minimap:** vine and thicket tiles show green, so you can see which rooms are feeding her. Healing blossoms show as pulsing pink flower icons, and she has a bright gold marker with a white ring so she stays visible over vines.

## Sunfire (C)

- **Charging:** every growth level you clear with an attack adds 1.2 charge, up to 100. Breaking a seed pod adds 10. Scorching does not charge it.
- **Firing:** press C at any charge of 10 or more.
- **Partial charge:** an instant burst around you. Its radius grows from 2 to 7 tiles with the charge. It scorches tiles, burns aliens and her plants inside it, and costs her up to 10% of the phase, scaled by the charge.
- **Full charge:**
  - C opens the minimap room picker (like Neptune's Trident; Esc or C cancels and keeps the charge). The chosen room glows gold for a 3s wind-up, then burns: scorched, aliens and plants destroyed.
  - Like the Trident it can be dodged: **you and placed Ruby take 50 each only if still inside** the burning room.
  - She takes 10% of the phase (300) if she is in that room, the same as a meteor, ignoring her armor.
  - It also draws a Sunstone into the chamber if it has fewer than two.
- **The choice:** a small burst early for safety, or wait for the big hit.

## Sunstones

- There are 8 gold crystal tiles, 2 per room at the start. They sit on interior floor away from walls and pads, and never overgrow.
- **Fields:** when one of her thorn fields lands on a lit stone (aimed or proximity), the field burns away harmlessly and she takes 5% of the phase.
- **After one hit:** each stone takes one hit, then shatters and flies (1s, visible arc) to a random spot in a different room, at least 4 tiles from you. It relights 1s after landing. The minimap shows lit stones as gold dots.

## Phases

She has 9000 HP in three 3000-HP phases on a three-segment guardian bar (phase 3 left, phase 1 right). The name line reads THORN WEAVER · PHASE n, plus WITHERING between phases. Damage cannot push her past phase 1 or 2: at the end of each she **withers** into the soil for 3s (immune, her blossoms die), then returns in the next phase. Phase 3 ends when its HP runs out.

1. **Phase 1:** her usual Thorn Weaver behaviour, except that when she is not fleeing she walks to the best vine or thicket tile within 8 (thicket preferred) and lingers there to heal (aimed fields, cast faster here: every 1.5s after one lands instead of 4s; the proximity field, keeping her distance) plus her growth trail.
   - **Seed pods** (6 HP) land at a random spot at least 5 tiles from you every 15s. They swell for 8s, then burst into a 3-tile radius of thicket.
2. **Phases 2 and 3:** the same, with pods every 18s, plus:
   - **Blossoms** (12 HP, at most 3): one is planted every 20s on overgrowth near her (at 3, the oldest withers to make room), never within 2 of a Sunstone. Each heals her 0.5% of the phase per second, and every 3s fires pollen at you within 7 tiles (4 damage, 0.7× speed for 1s). On cleared ground they wilt, losing 2 HP per second. Breaking one yourself costs her 8% of the phase and heals you 15 (wilting does neither).
   - **Root snares** every 6s: a red crack under you (roots never target Ruby). After 1s it erupts for 6. If you are still on it, you are rooted in place for 1.5s.
3. **Phase 3 extras:**
   - **Twin fields:** each aimed cast also drops a second field 4 tiles from you toward your nearest lit Sunstone, blocking the way there (skipped if it would cover a stone or a wall). Both erupt together.
   - **Drifting stones:** every 4s each lit Sunstone hops 2 tiles in a random direction, staying on open floor in its room (another direction is tried if cover blocks the way).

## World rules

- **Lifeblooms (help):** friendly mint flowers sprout on random tiles at least 4 from you: every 25s in phase 1 (at most 1), every 15s in phase 2 (at most 2), every 6s in phase 3 (at most 3). Any hit breaks one and heals you and Ruby 20 each; unbroken ones fade after 15s. They are not enemies: they never block healing at Ruby and auto-aimed bullets ignore them. Shown on the minimap as mint crosses.
- **No space events.** Meteors still fall: they deal 10% of the phase (300) in every phase, ignoring her armor and thicket, and scorch their room.
- **Aliens spawn more:** about 1.7× as often (every 1.8s at stage 0 instead of 3s), with 3 more allowed alive at once.
- **Aliens:** half of normal alien spawns are replaced by Gaia aliens: 40% of those are Ragecaps and 30% each sporelings and vine crawlers.
  - **Sporelings** (5 HP, slow, melee) leave a 2-tile spore cloud for 4s when killed. The cloud slows you to 0.7× and mosses the floor.
  - **Vine crawlers** (8 HP) roam without attacking and thicken the ground they walk on.
  - **Ragecaps** (8 HP, very fast 3, melee 3, 2 to Ruby): a hit knocks you back two tiles along its main direction, with a small shake. They leave vines where they run, like crawlers.
- **Pollen drift:** every 45s a yellow haze fills one room for 8s. Inside it you walk at 0.75× and your laser range is halved.
- **His thorn fields hurt more:** standing in one costs 3 every 0.75s (1 elsewhere), on top of the usual poison. A field erupting on a placed Ruby cuts it for 3 (you take 12); after that Ruby takes a small 1 every 0.75s while inside (no poison).
- **God panel extras:** Full Sunfire, Skill Ready, and Phase 1/2/3 buttons.

## Look

- **Theme:** forest. Green and gold room colours, a dark mossy floor and roots and leaves on cover blocks. Fireflies drift over the station. Behind it is a dusky forest backdrop with two parallax tree lines, light shafts, drifting pollen and blinking fireflies.
- **Overgrowth tiles:**
  - Kept plain: a flat green wash that darkens with each level, plus one simple motif. Moss is a faint tint with two dots.
  - Vines are one straight 6px vine (horizontal or vertical per tile) with a leaf.
  - Thicket is a darker wash with a crossed vine and two pale thorns. No wiggle or extra detail.
  - Scorched tiles are dark ash with embers.
- **Sunstones:** a gold block crystal with a soft pulse; dim grey-gold with a filling ring while relighting.
- **Rooted in place:** when a snare catches you, four blocky roots burst up from the tile, curl over and grip with a vine band, trembling, then sink back as the hold ends. While a closed ring squeezes Ruby, the roots hold it with a red band.
- **Sunfire:** a partial burst is a gold flash with expanding square rings. A full charge shows a gold column with a SUNFIRE countdown, then a sun beam and ring shockwaves.

## Rule sheet

The map opens its own rule sheet on entry (also on RULES): animated cards using the game art, one short line each, covering only what is new here. The cards cover overgrowth, Sunfire, Sunstones, the Ruby ward, seed pods, blossoms, root snares, phase 3, lifeblooms, pollen drift, the Ragecap, and sporelings with vine crawlers.
