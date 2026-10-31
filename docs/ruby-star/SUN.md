# Sun challenge

[Overview](README.md) · [Gameplay](GAMEPLAY.md#modes-and-lobby)

`/ruby-star/challenge/sun` is a temperature fight against the Fiery King. Phase 2 adds the King's burning trail and Scorch Sappers; phase 3 keeps it and adds sunbursts on rooms. Tuning is grouped in `constants.ts` as `SUN`; logic and state live in `sun.ts`, art in `sun-art.ts`, and the entry rule sheet in `SunGuide.tsx`.

## Guardian and rage

- Three phases of 3000 HP (9000 total), shown in a three-segment guardian bar, phase 3 on the left. The phase follows lost HP and never reverses during normal play. Only the final defeat wins; there are no intermediate rewards.
- Rage starts at 0 and rises by 1.4 per second in phase 1 (`SUN.ragePerSecond`) and 1.6 per second in phases 2–3 (`SUN.lateRagePerSecond`), capped at 100. A vertical bottom-filling meter next to the guardian HP segments shows rage, with a percentage underneath; its amber color turns coral at 75%. His speed is .8 + .035 × rage pixels per tick. Water within eight tiles removes 15 rage, and every HP he loses removes 0.1 rage (`SUN.rageOnHit`).
- He retains his ordinary nearest-player/Ruby targeting and direct attacks. His existing arena wrath warns after ten seconds without HP damage, with a 6.5-second wind-up. Any HP damage interrupts it. If it lands, it also spawns 18 Cinder Wisps around the map.
- Every six seconds he spawns 1 + floor(rage / 25) wisps within four tiles of himself: one at no rage, five at full rage. Occupied or blocked tiles are skipped.
- Solar Flare (F) returns after a 27-second challenge cooldown. Here it deals exactly 2% of one phase (60, `SUN.solarShare`) to him and destroys all Cinder Wisps, including shielded ones. Other ordinary aliens use normal Solar damage and reward rules.
- Meteors deal 10% of one phase (300) to him and retain ordinary effects on the rest of the chamber. No minor space events occur.

## Temperature and Cinder Wisps

- Temperature ranges from 0 to 100 and starts at 50. A visible HUD bar with a blocky thermometer icon and warm edge light show it.
- Twelve wisps start scattered on open interior floor. Four more appear every four seconds on an independent timer, up to 80 living wisps total. They do not consume the ordinary alien spawn allowance. The separate No Wisps debug toggle suppresses them; No Mobs affects regular aliens only and leaves living wisps and every wisp spawn source alone.
- A Cinder Wisp has 3 HP, never moves or attacks, and adds .06 temperature per second while alive. Killing it stops that contribution without removing existing temperature. It gives no score, healing or energy and does not prevent manual Ruby healing.
- At 100 temperature a thermal eruption immediately deals 75 damage throughout the arena to the player, placed Ruby and all enemies except the King, then temperature returns to 50. Normal player/Ruby protection and shields apply; carried Ruby keeps its normal immunity. Alien defeats use meteor rewards. The eruption has a bright flash, orange afterglow and camera shake.

## Cooling Wave (C)

- Eight-tile radius around the player's current position, 7-second cooldown. A ready chime (`waveReady`) plays when the cooldown ends, but not between the rapid casts of the extinguished window. Clears every wisp in range, removes 2 temperature globally, deals 1 damage to other nearby targets, reduces nearby King's rage by 15, and extinguishes Emberlings. Cover does not block the ripple.
- It adds 45 percentage points to each cooling station in range, unless the King is within 2.5 tiles of that station. A station reaching full charge completes immediately.
- Water first extinguishes an Emberling, then applies its damage without the flame armor.

## Cooling stations (hold Space)

- Six stations coexist on separated open floor tiles, with at least one in each of the four rooms. A room's last station relocates within that room when completed, preserving coverage; extra stations can relocate between rooms. If no eligible destination is available, the station stays in place. They appear as cyan reservoir tiles with charge bars and cyan crosses on the minimap.
- Hold Space within 1.6 tiles to charge the nearest station over five seconds and remove .6 temperature per second. An audible coolant-pump pulse plays while charge is being added, about three times per second, layered with the quiet Ruby-healing sound and the same player jiggle. Partial progress persists when released or when moving away. Near a station, Space takes priority over manual Ruby healing; elsewhere Space retains normal healing.
- At 100% charge the station heals the player and Ruby 25 HP (capped at maximum), sends out the same eight-tile ripple as normal Cooling Wave, removes 13 temperature, resets to empty and relocates at least eight tiles away, avoiding other stations and occupied floor. Healing happens once per completion, whether charged with Space or completed by C. The station ripple does not charge other stations, so completions cannot chain indefinitely.
- When the King is within 2.5 tiles, progress resets to zero and charging is blocked. This is based on his current interpolated position. A red station and KING NEARBY cue show the interruption.
- Releasing Space, blur, hidden pages and dialogs clear held charging. Simulation, station progress, temperature, cooldowns and water effects pause with gameplay.

## Emberlings

35% of regular alien spawns become Emberlings. Base HP 4 (ordinary alien scaling applies), speed 2.5, damage 9 to the player / 7 to Ruby, 70-tick attack cooldown. Melee hits knock you back two tiles. While burning, they take only 10% damage. Water permanently extinguishes them: movement and attacks stop, flame armor disappears, and they become a cold, fragile husk. Ordinary kill rewards apply. Extinguished Emberlings do not prevent manual healing.

## Zero temperature

At zero temperature with a living King, he is extinguished and stunned for up to ten seconds: no movement, attacks, rage growth or new wisps. All other enemies move and attack at half speed throughout the zero-temperature window, including attack windups, cooldowns and Scorch Sapper actions (`SUN.quenchEnemyTickInterval = 2`). Normal rates return immediately when the window ends; player movement and attacks retain their normal rates. Temperature stays at zero during this window. His arena warning is cancelled and rage resets to zero.

The player gets a free speed burst (the normal 2s burst, with its sound) and five empowered Cooling Waves with a .2-second cooldown between casts. Each keeps the normal local cooling/extinguishing effects, deals 10 damage to non-boss targets within eight tiles, and deals 3% of one phase (90) to the King if he is within eight tiles. The fifth cast retains its damage. After spending all five casts, the King remains stunned for a 2-second recovery delay (or until the 10-second window expires); then temperature returns to 50, the King resumes and C returns as an ordinary Cooling Wave after a 2-second cooldown (`SUN.afterQuenchCooldown`, with its ready chime); using it starts the normal 7-second cooldown. Missed waves still spend a cast.

## God controls

Sun uses the same dark filled buttons, colored two-pixel borders and active phase highlighting as the other challenges. Wave Ready recharges C. Full Heat exits an extinguished window and sets temperature to 100, so the next tick runs the normal eruption. Zero Heat summons the King if absent, sets temperature to zero and grants a fresh full extinguished window with five empowered casts. Heat Up and Cool Down adjust temperature by 10 points per click, clamped to 0–100; reaching an endpoint uses the same extinguish/eruption behavior as Zero Heat/Full Heat. Heating above zero exits the extinguished window and restores the normal C cooldown. All heat buttons require playing state. Phase 1/2/3 controls retain their existing behavior. No Wisps clears living Cinder Wisps without rewards or temperature loss and blocks natural, King-proximity and arena-attack wisp spawns. It leaves regular aliens alone, works independently of No Mobs, and persists through restart. Disabling it resumes the independent wisp timers.

## Phase 2: burning trail

- From phase 2, while rage is at least 20 (`SUN.trailRage`), each floor tile the King steps onto ignites a centered 3×3 patch (`SUN.trailRadius = 1`) for 10s, excluding walls and teleport pads (`trailTicks`, refreshed if he steps there again; at most 80 burning tiles, oldest dropped first). Below 20 rage, or in phase 1, he leaves none.
- Every 0.5s (`trailGap`), standing on a burning tile costs 3 HP (`trailDamage`) and adds 0.5 heat; a placed Ruby on one takes 2. Normal protection and shields apply.
- Water puts it out: every Cooling Wave ripple (including station bursts and empowered waves) clears burning tiles within its eight-tile radius, and reaching zero heat puts out the whole trail.
- **Look:** a dark ember plate with a pulsing orange inset, three stepped tapering flames (wide base, narrower body, pale tip) that flicker and sway, and an orange rim; it fades over its last second. The minimap shows burning tiles in orange. `drawBurningTile` in `sun-art.ts` draws it for both the battlefield and the rule sheet.

## Phase 2: Scorch Sappers

- From phase 2, a Scorch Sapper (`scorch_sapper`, 3 HP, speed 1.6) arrives every 8s (`SUN.sapperGap`) on open floor at least 6 tiles from you, with at most 2 alive (`sapperCap`). They never count toward the regular alien cap and never stop manual Ruby healing.
- It ignores you and Ruby and never attacks. It walks to the nearest cooling station; once beside it, it drains 12% of the station's charge per second (`sapperDrain`) and adds 0.5 heat per second (`sapperHeat`, not while the King is extinguished). A spark tether links it to the station, and that station blinks orange on the minimap.
- Any Cooling Wave ripple destroys it, like a Cinder Wisp; normal attacks also kill it, with ordinary alien rewards.
- **Look:** deliberately not a flame: a dark armoured siphon beetle with a bronze outline (so it reads on the dark floor), a basalt shell with thin molten seams, two small ember eyes, six stepping legs, a brass siphon nozzle on the side it faces (towards the station while draining), and a glass tank of stolen cyan coolant on its back that sloshes, fills and glows while draining, with small steam puffs. Its drain tether is a cyan coolant line.

## Phase 3: sunbursts

- From phase 3, every 12–17s (`SUN.flareGap`) one random room is marked: it gains persistent gold corner brackets, a draining strip of solar cells, and a dark SUNBURST countdown panel with a blocky sun emblem in its upper third. The minimap shows matching gold corner brackets and a dark sun-icon countdown badge, including when a meteor marks the same room. A SUNBURST: ROOM banner also shows. A loud three-pulse rising warning alarm, layered with the King's fire spell, plays once across the whole map when marking starts, regardless of your chamber. After 8s (`flareWarning`) it flares: the arena gains 25 heat (`flareHeat`, which can trigger the eruption), you and a placed Ruby take 25 damage if inside that room (`flareDamage`; normal protection applies), and it shows an orange room flash and a short shake, with the Solar Flare cue layered over the King's fire-spell sound. The countdown uses the same Press Start 2P pixel font as the other warnings, with compact sizing and crisp dark-inset UI framing. The pale gold panel and solar emblem distinguish it from the orange flashing meteor warning.
- **Defusing:** any Cooling Wave ripple landing in that room (including a station burst there), or casting Solar Flare from anywhere, stops it and cools the arena by 10 (`flareDefuseCool`), with a cyan room flash.
- No flares while the King is extinguished; a pending one is cancelled then. The burning trail from phase 2 continues.

## Rule sheet

The Sun sheet also has a RAGE card (rage builds over time, makes him faster and spawns more wisps; water and hitting him calm it) a BURNING TRAIL (PHASE 2) card, a SCORCH SAPPER (PHASE 2) card and a SUNBURST (PHASE 3) card.

Each challenge has an animated CELESTIAL SKILL (PRESS F) card alongside its SPECIAL SKILL (PRESS C) card. Sun describes Solar Flare, Neptune describes Neptune’s Tide, Gaia describes Gaia’s Roots (including clearing vines and preventing regrowth), and Moon describes Lunar Echo and the real Queen’s immunity to its bait. These cards reuse the actual celestial cast renderer.

## Look and checks

An obsidian solar forge suspended over the Sun's photosphere:

- **Backdrop:** near-black plum and a soft ember horizon, three broad drifting plasma currents with thin warm cores and a few travelling glints, five widely spaced stepped magnetic plumes in a deeper parallax layer, one faint low prominence, broad solar-cloud silhouettes and sparse ember clusters. The large currents and distant silhouettes provide visible detail while retaining open dark space; avoid repeated convection-cell outlines and overlapping bright arches. The world itself is the Sun; there is no separate sun in its sky.
- **Chamber colors:** ALPHA gold `#ffd35c`, BETA coral `#ff727e`, DELTA orange `#ff9a45`, GAMMA dawn rose `#eeb1d6`. The same palette drives borders, teleport pads, floor inlays, minimap and destination picker.
- **Floor:** dark plum/charcoal heat-shield plates, sparse brass rivets and inlaid seals, and joined molten seams that slowly carry light. The seams brighten with temperature and are decorative, not damage tiles. Engraved sun-wheel lines surround each teleport pad; pads keep their original gameplay footprint and destination colors.
- **Cover:** solid raised basalt blocks with joined brass caps, dark recessed faces and either a carved solar seal or a narrow caged molten core. Exposed rims remain clear; the art uses the existing collision map.
- **Cooling stations:** glass cyan reservoirs on four brass clamps, with an animated waterline rising with charge, small bubbles, glass reflections and a segmented progress strip. The KING NEARBY blocked warning and cyan minimap crosses remain; there is no HOLD SPACE label above stations. Blocked reservoirs turn warm red.
- **Temperature:** heat strengthens the glowing seams, horizon haze and distant prominence light. A restrained edge vignette replaces the flat orange arena wash, keeping actors readable. Reaching zero starts a 75-tick arena-wide cyan-white extinguishing flash, expanding pressure fronts, frost streaks and a pulse over every minimap chamber, with a 12-tick impact shake at strength 6. During the extinguished window the King retains his armor, shoulders, crown and four eyes in pale brown/bone colors, with no flames, glow, orbiting accents or particles. His old fire-shot trail and wrath pulse clear immediately; a small remaining-cast label stays above him. Eruption uses a bright initial flash and three expanding square fronts.
- **Cooling Wave HUD:** a stepped cyan droplet above two angular ripple bands, inside the same 42px frame as the celestial and Moon Mark icons. A small C hint identifies the key. Cooldown dims the glyph and fills the perimeter; empowered mode turns it pale and shows five small remaining-cast pips. No text-only skill tile.
- **Units and water:** wisps retain their pale flame core and ember fragments. Emberlings use a larger, heavy armored silhouette (body fraction 0.72) and become slate-blue husks when extinguished. Water has expanding angular rings and droplets, with pale empowered casts. Empowered waves add a fast cyan-white pressure front, three trailing rings, larger directional spray, a brief central geyser and a compact impact flare; their radius, damage and 36-tick lifetime stay the same. Each empowered cast adds an 18-tick camera shake at strength 10, a short icy viewport flash, a larger geyser with eight water jets, and a layered bass/pressure impact sound.

Sun scenery uses `gameTick` so its motion pauses with the simulation. Rendering is deterministic and does not mutate game state.

`tests/sun.test.cjs` covers the heat loop, independent spawns, rewards, Solar, water, station completion/proximity, stun casts, phases, victory, pause and reset. `scripts/preview-sun.cjs <output-directory>` renders actual game drawing code and checks that Sun art does not mutate simulation. References: [Sunburst and meteor warning comparison](visual-reference/sun-warning-comparison.png), [empowered wave animation stages](visual-reference/sun-cooling-wave-stages.png), [celestial guide cast art](visual-reference/celestial-guide-casts.png), [Cooling Wave HUD states](visual-reference/sun-cooling-hud.png), [forge and photosphere](visual-reference/sun-forge.png), [world at three animation ages](visual-reference/sun-world.png), [materials and reservoir charge](visual-reference/sun-materials.png), [warm](visual-reference/sun-warm.png), [hot](visual-reference/sun-hot.png), [extinguished](visual-reference/sun-quenched.png), [units at four ages](visual-reference/sun-units.png).
