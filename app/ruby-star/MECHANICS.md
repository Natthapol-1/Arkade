# Ruby Star mechanics reference

This is the current reference for Ascension and celestial skills. Older entries in `AGENT.md` record how the design evolved; use this page and the game code for current behavior.

**Latest visual preference:** the user prefers the original glowing player model and asked for all completed Groups 1–3 to match it. The player-model trial and flat/faceted group treatments described later are superseded. Current group style uses luminous colored outlines, simple flat dark inset panels and bright cores with soft colored glow. Player bullets/lasers keep their requested larger sizes; battlefield boundaries keep open doorways; monster identities remain. Earlier celestial skill effects and gameplay fixes are retained. See `AGENT.md`'s current-style section for the scope.

**Latest follow-up adjustments:** Group 4 boss attacks now use the same luminous palette/core treatment while retaining their elemental shapes, warning footprints and lifetimes. Boss models are unchanged. Battlefield lines are 1px floor/2px cover/4px perimeter; frost tiles retain the stepped fracture symbol. Saturn shields are smaller with 4px shell pixels (player .62-tile radius, placed Ruby .7, carried Ruby .82). Charged waves add brighter cyan/violet or gold/orange layered fronts, white energy sparks and a release star; the charging indicator adds violet accents and inward sparks. Armed bombs glow more and detonation has bright orange/gold fronts, flame fragments and a central starburst. These latest values supersede earlier descriptions. All changes are cosmetic; shield amounts, damage and range remain unchanged.

**Completed consistency pass:** the user authorized all remaining visual groups. Boss models retain their identities with simpler particles, matching glow and uniform health bars; HUD panels and ability buttons have square corners and restrained glow. Chanter splash and Prayer rings have stepped, rectangle-built boundaries with colored glow and pale highlights; Prayer's beam and Chanter's wave have luminous cores. Ruby and bombs use glowing square rims and dark insets; energy keeps a blue bolt silhouette and heal a pink/red cross, each with a pale pixel core. Keep these solid shapes sharp and use glow around them. These details supersede the earlier note that boss models were unchanged.

## Ascension

Normal-enemy pressure now eases in at 10, 25 and 45 seconds. Later increases follow boss defeats: stages 2–5 unlock the remaining four difficulty tiers. Waiting alone no longer reaches maximum pressure. The first boss still appears around one minute. Natural encounters cover all eight boss types before repeating, without an immediate repeat across pools.

Shielder protection halves incoming damage exactly, including fractional bullets and damage-over-time hits. Carrying Ruby now uses 60% of normal movement speed. Active status tags explain freezing/chill, reversed controls and reduced healing; teleport auto-placement briefly highlights Ruby and shows “Ruby placed.” Game-over displays RUBY STAR and the stage reached.

Manual healing also works while carrying Ruby: Space/mobile HEAL restores 5 Ruby HP and 3 player HP when enemies are clear, with the existing 18-tick cooldown and healing modifiers. Placed Ruby still requires proximity. Space heals even on a teleport pad; X/mobile TP separately opens teleporting. Escape or X cancels the destination menu. Jupiter's suit is back to its original bands/storm spot, without the later tiny cloud details.

- Defeating the **10th boss** enters Ascension and grants that boss's celestial skill. Each later boss kill grants its own skill.
- The player can hold **one use**. A new reward replaces the held skill. Press **F** (or the on-screen SPECIAL button) to activate it. **E** carries or places Ruby.
- Spending a skill happens before its damage resolves, so defeating a boss with a skill can immediately grant a replacement. Skills and their timers pause with the game.
- Bosses take **45% of maximum HP** from a meteor in Ascension, down from 75% before it. Existing boss-specific damage rules still apply.
- God Mode can enter Ascension directly, grant a chosen skill, and toggle **No Boss** to remove current bosses and prevent natural boss spawns.

## Celestial skills

| Defeated boss | Skill | Effect |
| --- | --- | --- |
| Fiery King | **Solar Flare** | Hits every enemy in the arena: 25 damage to normal enemies, 10% of maximum HP to bosses. |
| Shadow Queen | **Lunar Echo** | Places a stationary decoy that draws direct enemy attacks. It lasts for 12 connected hits, regardless of attack damage, and ignores further hits for 0.35 seconds after each hit. There is no time limit. Area attacks and ground hazards can still threaten the real player. |
| Storm Reaper | **Jupiter Storm** | Hits enemies within six tiles of the player: 60 damage to normal enemies, 30% of maximum HP to bosses. |
| Soul Devourer | **Singularity** | Creates a five-tile-radius pull field under the player for 12–24 seconds. It pulls normal enemies one tile every 0.25 seconds and bosses every 0.5 seconds, without crossing walls. Deals 1.5–8 damage per second to normal enemies or 0.3–2% of maximum HP per second to bosses. Damage ramps quadratically with the defeated Devourer's absorption stacks (0–20), rewarding the harder high-stack fight. |
| Frost Warden | **Saturn Guard** | Refills both the player and Ruby's damage-absorbing shields to at least 40. It does not add 40 to an existing stronger shield. |
| Blind Prayer | **Sirius Surge** | Immediately grants six seconds of full-energy mode and a speed burst. **Resets laser, bullet, charge-wave, bomb, and speed cooldowns** on activation. A bomb already placed stays placed. |
| Sea Chanter | **Neptune's Tide** | Heals the player and Ruby by 35 each and pushes enemies within eight tiles three tiles away. Existing reductions to player healing still apply. |
| Thorn Weaver | **Gaia's Roots** | Places a twelve-by-twelve-tile field below the player for 30 seconds, including in hallways. Enemies inside move 40% slower and take 4 damage per second, or 1% of maximum HP per second for bosses. The field fills whole floor tiles and excludes walls. |

Special damage follows normal enemy shield and vulnerability rules. It does not trigger Sea Chanter's healing reaction to player attacks.

## Visual rules

Jupiter Storm's latest cast impact has stronger 18-tick screen shake at strength 8, with louder sound layers: .8 plasma, .75 laser shot and .55 Queen-attack cue before the attack mix.

The Ruby-carrying player model takes priority over celestial suits and speed colors. A held celestial skill stays available and its suit returns when Ruby is placed; active shields and ability effects remain visible.

Reaper's hallway seal is shown by mint-tinted hallway tiles and brighter pulsing mint tiles at its blocked entrances, without a text message. The tint follows the active seal and clears when the hallway reopens.

The top HUD shows Stage (bosses defeated + 1) in place of the boss counter and omits kill score. Elapsed time remains visible.

The in-game rules use two simple sheets: a main quick guide for controls, Ruby, meteors, teleport, energy, Ascension and hints; an Aliens & Bosses sheet explains each enemy and lists each boss's celestial skill. Both keep the game paused. The God panel sits on the right below the minimap and scrolls when space is limited.

Saturn's latest player-ring light speed is .12 segments/tick, approximately 1.1 seconds per revolution at 60Hz.

Sirius now follows Solar's contrast arrangement: a darker gold core with a bright yellow-white visor. Its antenna star and pale corner details remain.

Jupiter's square storm is now lighter peach/coral and slowly moves around the body on a pixel-snapped oval, with a pale warm centre/highlight. It stays inside the existing suit silhouette.

Latest Lunar body lightness: panel #8b67a8, shaded hemisphere #544669, crescent #d5bbf6; mint visor remains.

Solar's latest player palette has a darker orange-red core with a dark ember centre and a bright yellow-white visor, swapping the earlier core/eye brightness.

Jupiter's red storm spot uses a complete square outline and square warm centre, replacing the stepped spot.

Latest Jupiter player model adds layered warm cloud bands, subtly drifting cloud highlights and a larger stepped red storm with a pale warm core above the usual visor position. The orange square silhouette and cream visor remain.

Latest suit refinement: Lunar body has a further small lightness lift (panel #835fa0, shaded side #4c3e61, crescent #d1b5f4); its mint visor remains. Saturn's orbiting light runs 1.75× faster around the same fixed hoop. Jupiter has a small cloud curl and storm-spot highlight.

Newest palette adjustment: Sirius has a lighter grey visor (#666670), Solar a deeper red visor (#8c2836) for visibility against its hot core. Lunar retains the mint visor/reference design with another small body-lightness increase (panel #7b5798, shaded hemisphere #443659 and crescent #cdaff2).

Latest Lunar selection (27 October): match the supplied reference's original purple crescent body and bright mint visor (#8fffe0). This supersedes the darker-purple visor trial; other suits retain their current palettes.

Neptune's latest detail pass adds moving blue/pale cloud bands, three short curling block currents around its planet, and brighter foam chips with trailing droplets along the tide. Its eight-tile push radius and healing remain unchanged.

Latest Jupiter preference: original striped planet, two expanding orange wave bands and energy streams, combined with the newer short thunder accents. Its planet is back to the original size; Neptune keeps its current larger blue planet and tide.

Latest distinction pass: Gaia's Reach is renamed **Gaia's Roots**. Its field has grown to 12×12 tiles (36% of a 20×20 chamber before wall clipping); renderer bounds derive from the same radius as gameplay. The user prefers Jupiter and Neptune's earlier planet-focused casts: keep their larger striped orange/blue planets prominent. Jupiter has four short lightning accents and a faint expanding attack wave; Neptune has a soft blue tide band with sparse pale foam, without lightning spokes. Avoid effects overwhelming the planets. Singularity pulls twice as frequently, with unchanged damage and duration.

Latest updates: player casts have a 24-tick compress/release pose with colored corner sparks for bomb placement/detonation and every celestial skill; it never locks inputs and pauses with gameplay. Lunar Echo's brighter cast lasts 54 ticks with purple pixel rings/rays. Keep each skill distinct: Gaia represents Earth and uses branching roots, blocky leaves and field sprouts, **not Lunar's rings or radial stars**. Singularity has silver fragments drawing inward. Neptune's expanding wave follows its new eight-tile reach. Bomb appears before Special in the top HUD.

Chanter and Prayer attacks have been redesigned beyond the earlier ring treatment. Chanter uses three pixel-chevron pressure fronts, square burst frames and rising blue water columns. Prayer uses open gold corner seals, four light spears and descending cross seals for its Ruby ritual. Both use subtle block-cell floor footprints for warning areas; original damage, timing and hit rules remain. Older ring descriptions are superseded.

Celestial skills belong to the **player's star and planet theme**, so their colors and effects do not have to match the boss that grants them. The held skill changes the player's suit, visor, and a small identifying feature. All effects use the game's thick, blocky pixel style with glow and opacity.

| Skill | Main color | Player detail |
| --- | --- | --- |
| Solar Flare | Red | Solar fins and core |
| Lunar Echo | Purple | Crescent crest; decoy is a translucent copy of this suit |
| Jupiter Storm | Orange | Bands and storm spot |
| Singularity | Black and silver | Gravity core and void fragments; active field shows its affected tiles |
| Saturn Guard | Turquoise | One thick continuous polygon hoop at body height; light travels around its fixed plane like a hula hoop |
| Sirius Surge | Yellow | Star crest and white inlays |
| Neptune's Tide | Blue | Side thrusters and bands |
| Gaia's Roots | Green | Planet surface patches; field covers full tiles |

Player suit details now emphasize the celestial bodies: Solar has a large hot core, Lunar a pale crescent around a darker side, Singularity a black core with silver edging, Sirius a bright stellar cross, Neptune moving cloud bands, and Gaia blue oceans with green continents/polar caps. The approved Jupiter and Saturn models and the base player are unchanged.

For visor visibility, use the suit's own color family with lightness contrast: Solar deeper ember red, Lunar dark purple on its restored original purple/crescent body, Singularity pale silver, Sirius darker gold, Neptune pale blue and Gaia whitish. Jupiter, Saturn and the base visor retain their approved colors. This supersedes the complementary-color visor trial, lighter Lunar body trial and earlier pale Lunar/green Gaia visors.

The sound mapping is in `scripts/celestial-audio-map.json`; the local sound preview is at `/ruby-star-sound-preview.html`.

Sirius Surge layers its cast cue (gain 1.3 before the attack mix) with the full-energy `powerUpBoost.mp3` cue. Singularity loops its cast sound while its field is active; audio stops during pauses, on expiry, game over, restart, and leaving the page.
Singularity's loop asset has its silent ends trimmed with 3ms edge fades (1.046s). Jupiter Storm uses `mixkit-sci-fi-plasma-gun-power-up-1679.wav`, also used by Solar Flare.
Solar Flare's primary cast gain is 0.75 and its `mixkit-long-sweeping-air-swoosh-167.wav` layer gain is 0.8 before the attack mix (latest volume increase).
Lunar Echo cast gain is 1.1 before the attack mix. Gaia loops `mixkit-sci-fi-click-900.wav` at gain 0.4 while at least one living enemy occupies its floor-tile field; it stops when empty, expired, paused, or the run ends.

Lunar, Jupiter, Saturn, Neptune, and Gaia casts reuse the full-energy aura's cardinal rays and stepped diagonal sparks, including its staggered outward motion, shades, opacity and isolated glow. Planets and crescents have sharp unblurred fills. Cast rings use broad 12px stair steps, shaded halves and moving pale glints; Jupiter also shows an expanding radial attack wave. The held Saturn suit retains its continuous polygon hoop.

## Approved effects style — 26 October 2026

Use **the full-energy effect as the visual baseline** for new or revised celestial skills. The user also likes Solar Flare, Sirius Surge and Singularity; preserve their visual character.

- **Shape:** clean, blocky, pixelated silhouettes made of rectangles. Use bold stair steps and spaced fragments rather than smooth curves, thin lines or dense decorative details.
- **Motion:** staggered outward streams like `drawFullEnergyAura`, using elongated cardinal rays and stepped diagonal sparks from `drawEnergyPixelRay`. Keep each skill's distinct central planet, crescent, star or rift.
- **Depth:** vary opacity and light/dark shades within each established skill palette. Reserve glow for isolated energy sparks and selected accents; keep solid planet, crescent and ring pixels sharp. Never build a solid silhouette from many individually glowing adjacent pixels.
- **Rings and waves:** broad 12px rectangle steps, readable negative space, shaded halves and sparse moving highlights. Saturn's cast ring layers behind/in front of the planet; Neptune's ring expands in blue; Jupiter's orange attack wave expands radially. The stored Saturn suit keeps its separately approved polygon hoop.
- **Review:** generate the skill gallery with `scripts/preview-celestial-skills.cjs` and visually inspect it. When changing animation, inspect several ages, checking pixel edges, spacing, fading and ring depth.

These approved rules take precedence over older visual experiments recorded in `AGENT.md`.

Latest audiovisual adjustments: Gaia's cast now uses `mixkit-sci-fi-construction-complete-811.wav` (gain 0.45), replacing the door clip; its occupied-field click loop is separate. Jupiter additionally layers `mixkit-laser-weapon-shot-1681.wav` (0.55), and Neptune layers `mixkit-screechy-electified-item-3213.wav` (0.4). Gains are before the attack mix.

Gaia's persistent field uses subtle pulsing green tile shades, crisp 6px exposed floor edges (including around walls) and sparse outward full-energy pixel rays. The previous scattered crosses and rectangular outline are replaced. Lunar decoy opacity is 80% idle, 95% on hit and 50–70% during invulnerability. Solar Flare adds a tiny 10-tick screen shake (amplitude 3 in the existing decaying camera system); Sirius adds a bright yellow screen flash fading quadratically over 12 ticks (0.2 seconds).

Neptune volume update: cast gain 0.9 and electric layer gain 0.6 before the attack mix (both increased 50%).
Sirius flash duration update: yellow screen flash now fades quadratically over 21 ticks (0.35 seconds), with the same peak opacity of 0.42.
Solar Flare cast now lasts 48 ticks (0.8 seconds, up from 0.6). Larger layered red/pale core and eight tapered pixel-flame streams with small side tongues and bright tips intensify the flame while keeping crisp rectangular edges. Screen tint uses the same 48-tick fade; damage and shake are unchanged.

Latest polish: Gaia's exposed field edges are 4px (formerly 6px). Solar shake is 14 ticks/amplitude 6 and Jupiter shake is 12 ticks/amplitude 5 in the existing decaying camera system; stronger active shakes are preserved. Jupiter retains its laser-shot layer and adds a trailing shockwave plus four pixel-lightning spokes. Neptune retains its electric layer and adds a trailing ripple and four outward pixel chevrons.

Saturn Guard marks the player and Ruby shields as celestial until each shield is depleted. While shielded they render a sharp, faceted turquoise ward with shaded edges, a faint interior and four orbiting pale lights, replacing the ordinary reward-shield square. Carried Ruby shows its larger ward around the player. Shield amounts and absorption are unchanged; restart clears the celestial appearance flags.
Normal reward shields use a single plain square with crisp 4px rectangular edges, shaded opacity, a faint tinted interior and one small glowing glint confined to the border. No double outline, protruding corner blocks or broad blur. Player shields remain blue and Ruby shields teal, including when carried; Saturn keeps its distinct celestial ward.
Saturn shield preference: the thinner-shell experiment was reverted at the user's request. Keep the original 6px pixel grid and faceted rim, with its shades, faint interior and orbiting lights. Normal square shields retain their separate 4px borders.

## Ruby, bomb, pickups and kill-reward style

Ruby and placed bombs keep square silhouettes with sharply shaded edges, dark inset panels, rectangle-built compass stars and small pale cores. Ruby has sparse drifting pink fragments; the bomb has a stepped fuse with a selectively glowing pixel spark. Normal bombs stay orange and powered bombs gold. The bomb's affected-tile overlay has a crisp 4px stepped perimeter following the same tile-distance test as its fill. Its explosion uses sharp square bands, a faint fill and separated ember rays instead of a broad blurred flash.

Health pickups use a shaded pixel cross; energy pickups use a shaded blue bolt with small isolated highlights. Healing rewards show rising shaded crosses; energy rewards show outward full-energy-style rays and a rising pixel star; shield rewards use square corner brackets; speed rewards use turquoise rays and short trailing pixels; electric rewards use separated yellow pixel bolts; full restore uses larger golden rays and a rising star. Runner energy sparks use straight outward rays. The speed burst's broad body glow is reduced, with small fading directional trails added. All reward timers and gameplay amounts are unchanged.

Jupiter's cast additionally layers `bossQueenAttack1.mp3` at gain 0.4 before the attack mix, alongside its plasma cast and laser-shot layer. It does not use the Queen attack's separate click layer.

For visual review, run `node scripts/preview-rewards.cjs <absolute-output-directory>` to render the object/reward gallery and full-game bomb range preview.

Field alignment update: Singularity uses Gaia's 4px exposed-tile boundary and pulsing border opacity, in grey. Thorn Weaver's hostile warning and plant patches snap to the nearest tile-grid intersection and cover exactly 4×4 whole tiles. `getThornFieldBounds` is shared by targeting, rendering and damage/slow membership; right/bottom edges are exclusive. Ground art is clipped to the affected walkable tiles, so walls remain clear. This supersedes older half-tile or unsnapped-square descriptions.

Group 1 player-attack visual pass: normal/powered bullets have 18px/30px heads with tapering square trails. Player lasers use stepped square-sample beams, pale cores and small endpoint glints. Chain lightning uses stable zigzag steps rather than rounded, randomly jittering strokes. Charged waves retain their expanding square silhouette with sharp cyan/gold bands, a dim trailing band and isolated energy sparks; charging uses a crisp square indicator with inward-moving rays and pale full-charge corner stars. Broad blur is removed from solid shapes; damage, ranges, cooldowns and effect lifetimes are unchanged. Enemy and boss attack renderers are outside this group. Review using `scripts/preview-player-attacks.cjs`.

Lunar Echo attracts direct targeting map-wide, including bosses, while preserving their usual attack ranges, line of sight and chamber rules. King, Devourer and Queen cannot prefer Ruby over the decoy even when Ruby is closer. Charger collisions ignore Ruby while targeting the decoy. All eight bosses are tested across the four chambers; real player position/carry state is restored after scoped AI updates. Stationary/support bosses retain their movement/support behavior. Area attacks, ground hazards and Prayer's Ruby ritual retain their existing mechanics.

Group 2 battlefield visual pass: floors use subdued dark panels, subtle chamber tint and sparse small marks. Cover walls use solid shaded square blocks and small inset highlights. Chamber and hallway boundaries are crisp 4px rectangular edges drawn where walkable tiles meet walls; actual openings remain clear. Broad perimeter glow is removed. Teleport pads keep their chamber color with a shaded square frame, stable pixel diamond, varied opacity and an isolated small glint. Frost tiles have a pale shaded square surface, crisp edges, stepped right-angle fractures and one small glint. No map, pathfinding, collision, teleport or freezing rules change. Review with `scripts/preview-battlefield.cjs`.

Group 3 normal-monster visual pass: established colors, faces, antennae and silhouettes are retained, with sharply shaded body facets and reduced glow. Splitter keeps two separated boxes and Ghost retains translucent pulsing. Healing flashes use rising pink pixel crosses; Healer readiness uses small cross satellites. Armored plates, Bomber countdown and Sniper aiming use clear pixel brackets. Shielder protection uses a plain shaded square; Frost shields on normal monsters use a stepped pale shell with isolated glints. Ordinary attacks use rectangular Ghost bolts, shaded faceted Armored/Splitter projectiles, stepped Normal/Mini slash fans and pixel strikes. Sniper's actual red beam has a sharp pale core and no duplicate generic body-attack line. Timers, collision, health, damage, movement and targeting are unchanged. Boss/Queen-echo models and attack visuals remain for their separate review group. Review with `scripts/preview-normal-monsters.cjs`.

Separately authorized player-model trial: suit bodies use crisp shaded top/left and bottom/right edges with no broad body glow. Visors have a dark 1px frame, shaded lower strip and small pale highlight; antenna glow is 6px. Base/carry/speed colors, all eight celestial features, full-energy aura, facing and fire/charge shrink behavior remain. Lunar's decoy inherits the same polished model. Review the suits and state gallery using `scripts/preview-player-celestial.cjs`.

Player laser size preference: normal and powered bright beam bodies are now 18px and 27px (both 50% wider than the initial Group 1 pass), with broader shaded silhouettes, pale cores and larger endpoint glints. Gameplay range and damage are unchanged.
