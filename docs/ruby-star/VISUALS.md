# Visual style

[Overview](README.md)

**Use the luminous square player and the full-energy aura as the baseline.** New visuals should belong beside the current player, Solar, Sirius and Singularity. Keep silhouettes crisp and blocky, glow selective, and detail restrained. Avoid blurred bodies, smooth curvy attack splashes and flat faceted replacement models.

## Shape, shading and glow recipe

1. Build the main silhouette from clean axis-aligned rectangles and bold stair steps. Keep square corners and a readable face at actual gameplay scale. For circles/planets/waves, use block-built stepped boundaries; the Saturn polygon hoop is an intentional exception.
2. Use a luminous colored rim, a flat darker inset, a few medium shade patches and a pale core/highlight. Keep the solid silhouette fully readable without the glow. The rim and inset should remain uninterrupted enough to read as a simple square.
3. Apply soft colored glow around the rim and a few selected energy accents. Keep the actual fill pixels and steps sharp. Do not blur the whole sprite, use a huge haze to create its silhouette, or glow every adjacent cell independently. Sparse separated sparks preserve negative space.
4. Vary opacity and lightness within one established color family. Eye visibility comes from light/dark contrast; it need not use a complementary hue. Preserve explicit exceptions such as Lunar's mint visor.
5. Use `drawFullEnergyAura` and `drawEnergyPixelRay` as motion baselines: staggered elongated cardinal rays, stepped diagonal sparks, small separated fragments. Quantize positions with `Math.round`/`Math.floor`; use stable geometry rather than fresh random jitter every frame.
6. Preserve an individual effect identity. Shared construction and glow do not mean every cast gets identical rings, spokes or the same central motif. Show anticipation, release, travel/field and fade where appropriate. Existing cast pose compresses/releases over 24 ticks and never locks player input.
7. Match visual footprints to actual damage/slow tiles. Use the same helpers/bounds for membership and drawing. Clip fields to floor and leave walls clear. Never change collision/range to make a cosmetic preview easier.

Useful render helpers in `page.tsx`: `drawPlayer`, `drawMobBody`, `drawEnemy`, `drawFullEnergyAura`, `drawEnergyPixelRay`, `drawCelestialCast`, `drawPixelBeam`, `drawMobBrackets`, `drawBossHealthBar`, `drawBattlefield`, `drawRewardSpark`. Extend these patterns rather than inventing a second art system.

## Player suits

Keep the square shell, simple inset, bright visor and antenna. Held celestial details are accents around that silhouette. Base visor stays blue. Direction/attack/charge/cast animation must preserve the same model. Use the beam and bullet sizes specified below.

| Skill | Rim/theme | Panel / visor / detail | Identity |
| --- | --- | --- | --- |
| Solar | Red `#ff5252` | `#a8323c` / `#fff0b5` / `#ff9e80` | Large orange mantle, dark ember core `#8c2836`, white-hot eye; side solar fins |
| Lunar | Purple `#b278f3` | `#8b67a8` / `#8fffe0` / `#c6a2f2` | Dark hemisphere `#544669`, light crescent `#d5bbf6`, small crescent crest. Mint eye and lighter purple body |
| Jupiter | Orange `#ffad4d` | `#b77535` / `#fff0c8` / `#f4c18b` | Warm horizontal cloud belts, subtle snapped drift, complete square peach/coral storm moving within body. Storm outer `#d9774d`, inner `#ffb77b`, highlight `#ffe3b5` |
| Singularity | Black/silver | `#08080d` / `#bcbccd` / `#71717f` | Lightless inset, silver lip, detached void fragments |
| Saturn | Turquoise `#68e0c9` | `#327f76` / `#e1fff5` / `#a8e8d7` | Fixed continuous tilted polygon hoop at body height; draw rear/front halves around body. Light travels around hoop at tick×0.12 segments (~1.1s/revolution); do not rotate the entire plane |
| Sirius | Yellow `#ffe45c` | `#b19832` / `#fffbe3` / `#fff2a3` | Dark gold cross/core, bright yellow-white eye, star antenna and pale inlays. Uses the same dark-core/bright-eye contrast as Solar |
| Neptune | Blue `#5d9fff` | `#315fba` / `#c7e4ff` / `#91baff` | Moving blue cloud bands, side thrusters, pale foam details |
| Gaia | Green `#a5de65` | `#5b8246` / `#f2f7eb` / `#c1e398` | Blue ocean interior, green land patches and pale polar caps; whitish eye |

## Celestial cast and field identities

- **Solar:** larger layered red/orange core and eight tapered rectangle-built flame streams with side tongues/bright tips. Cast lasts 48 ticks; red tint uses same fade. Screen shake 14 ticks, strength 6. Keep flames readable rather than a white blurred explosion.
- **Lunar:** visible 54-tick purple crescent/ring/ray cast. Decoy is an 80%-opacity copy of Lunar suit, 95% on hit and 50–70% in invulnerability. It must remain readable across the battlefield.
- **Jupiter:** striped orange planet remains prominent, with two expanding orange wave bands/energy streams and short thunder accents/trailing shockwave. Keep its planetary shape; do not replace it with a generic lightning symbol. Shake 18 ticks, strength 8.
- **Neptune:** larger blue planet with moving pale/blue bands, three short block currents and foam chips/droplets on tide; expanding blue wave/trailing ripple. Distinguish from Jupiter with cool flowing chevrons and foam, without thunder spokes. Avoid a bland single ring or overwhelming particle cloud.
- **Sirius:** yellow/white star burst with dark gold contrast. Bright yellow screen flash fades quadratically over 21 ticks with peak opacity 0.42.
- **Gaia:** Earth, roots, leaves and sprouts. Branching right-angle roots, sparse green growth and varied tile opacity. Do not copy Lunar's rings/radial stars. Field has crisp 4px exposed-tile edges and excludes walls.
- **Singularity:** black core/silver rim, grey fragments moving inward, visible affected tiles. Exposed field boundary uses the same 4px geometry and pulsing opacity as Gaia, in grey. Motion points inward rather than outward.
- **Saturn:** continuous polygon hoop with depth (rear before body/front after), broad stepped cast bands, sparse pale moving glints. Active guard has faceted turquoise shell, faint interior and four orbiting lights; shield radii are player .62 tile, placed Ruby .7, carried Ruby .82, with 4px shell pixels.

Broad stepped cast rings generally use 12px rectangle steps, light/dark halves, clear gaps and sparse highlights. Their width should not erase the central planet. Preserve stronger overlapping screen shake rather than resetting it to a weaker one.

## Aliens and bosses

Maintain the model identities below. Ordinary aliens use a glowing square rim, dark inset and restrained antenna/eye glints. Healer is pink, Shielder teal, Armored blue, Runner orange, Ghost violet/translucent, Splitter green with two separated boxes. Energy Leech uses lavender `#c77aff`, inward collector prongs, two pale slit eyes a slim collector slit and three inset storage lights, dim lavender when empty and gold at 20/40/60+ stored energy; drain sparks travel inward along an angular tether.

Boss model identities:

- King: red square armor, crown/shoulder flames, tiny lower armor flame marks, rising/side embers.
- Queen: purple square face/body, tiara/large forehead jewel, three eyes, restrained stepped shoulder tassels and raised smaller crown base. Echo is translucent/glitching and shares her identity.
- Reaper: mint-cyan model and rectangular electric slash; preserve her silhouette.
- Devourer: violet square, large green eye, four-fang mouth, fused side chunks with swallowed eyes, three rectangular antennae on each side. Body grows 6% per stack; preserve feeding expression/aura/stack counter.
- Warden: pale ice square, navy right-angle spiral eye, jagged crack mouth, small pink cheeks, six-sided crystal/snowflake backing and revolving segmented ice belt.
- Prayer: gold square with charcoal/warm inset, translucent ancient blindfold with three blocky X eyes, compact halo, mirrored side hooks and uneven hanging hems. No added arms/feet/mouth.
- Chanter: blue square siren model, pale eyes and blocky water details. Underwater view is faint/narrow back-and-fin silhouette with bubbles, no face; health bar dims with her.
- Weaver: square olive/green bark body, leafy crooked hood, off-center pink flower, vines/root feet. **Five eyes total: one main eye and one small eye in each cardinal direction.**

Boss attacks use pale luminous cores and selective matching glow. King has stepped flames; Queen jewel/sigil corners; Devourer violet/lime inward fragments and square waves; Warden traveling ice splinters and a block crystal frame. **Chanter uses pixel-chevron pressure fronts, square burst frames and rising rectangular water columns. Prayer uses open gold corner seals, four light spears and descending cross seals.** Ground warnings have readable block-cell footprints. All bosses use a consistent health-bar helper; attack expression briefly follows actual windup/release, not arbitrary cooldowns.

## World, combat objects, rewards and HUD

- Battlefield: dark subdued chamber-tinted floor; 1px floor seams, 2px cover borders, 4px exposed battlefield edges. Keep open doorways visibly open. Pads are square/chamber-colored with restrained glints. Frost tiles retain the stepped right-angle fracture symbol.
- Reaper seal: mint tint across hallway tiles and brighter pulsing blocked end-cap tiles. **No seal text**; clear tint immediately when reopened/dead.
- Player lasers: larger luminous pale-core beams (18px normal / 27px powered bodies), crisp stepped geometry. Bullet heads 18px / 30px powered with square tapering trails. Chain lightning uses stable angular steps. Charged wave remains square, with layered cyan/violet or gold/orange fronts, isolated sparks and release star; visibly stronger than the laser.
- Ruby: pink glowing square rim, dark inset, small pale central star, sparse pink fragments. Bomb: orange/gold equivalent with stepped fuse and isolated glowing spark. Bomb affected-tile overlay has a 4px exposed stepped perimeter; explosion has square fronts/flame fragments and a bright center.
- Heal pickup/reward: red/pink shaded pixel cross. Energy: blue shaded bolt/pale core; rewards use full-energy rays/rising pixel star. Speed: turquoise rays/trails. Electric: separated yellow bolts. Full restore: larger gold rays/rising star. Avoid smooth generic particle circles.
- Normal shields: **plain single square**, 4px crisp edges, shaded opacity/faint fill and one small border glint. Player blue, Ruby teal. Saturn's faceted ward remains distinct.
- HUD: square corners, restrained luminous borders. Buttons use filled blue panels, clearly visible 2px borders, pale bold 15px labels and distinct hover/focus states; avoid faint ghost buttons against the dark battlefield. Keep HP, Ruby and energy on the left, labeled by simple luminous pixel icons: solid green plus, solid pink stepped diamond Ruby icon, and solid blue stepped energy bolt (gold while powered), with no inner shading or highlights; **Stage** is exactly centered and visually dominant with a larger pale number and subtle purple text glow, without a border or background panel. Time sits to its right, followed by an icon-only bomb indicator and controls. Bomb states use a glowing orange ready case/green corner, a pulsing lit fuse when armed, and a dim case with a filling square perimeter during cooldown. Accessible labels/tooltips describe the state. Remove the celestial skill slot from the top bar; F and the mobile SPECIAL control remain. Remove score from top panel. God panel sits at the upper left of the battlefield and scrolls; the minimap stays upper right. Minimap uses brighter chamber floor tints, blue-gray hallway floors, crisp chamber-colored room boundaries and pale-blue corridor edges, following connected geometry with open doorways; internal cover does not add boundary clutter. Teleport pads and ritual destination frames are absent from the minimap; labels sit near chamber corners. Retain enemy/boss indicators.
- Game-over: a square dark-blue panel with a pale pixel RUBY STAR title, large purple stage number, four clear blue stat tiles and a high-contrast full-width PLAY AGAIN button. Use bold readable labels and a compact landscape layout; place it above the God panel. Display stage reached; no “lost” in title and no “bosses defeated” replacing stage. Prayer spawning shows a prominent four-second MOVEMENT REVERSED warning above other announcements, including during Eclipse and Ascension; the reversal status tag remains while she lives. Status tags appear only when applicable (chill/freeze, reversal, reduced healing, temporary Ruby placement).
- Navigation arrows are filled stepped pixel SVG icons, not font arrow glyphs. Rules sheets use a blue panel/header, strong dividers, filled control-key cells, larger bold text and high-contrast square buttons.
- Rules: keep main sheet simple (controls, Ruby, meteor, teleport, energy, Ascension, hints). Prominent filled **ALIENS & BOSSES** button opens 13 alien entries and 8 bosses. Each boss labels reward **“Celestial skill: NAME”**. Both sheets pause gameplay; reopening starts on main rules.

## Visual references

Inspect relevant source-rendered images before changing art. These are design references, not textures loaded by the game. Refresh affected images when the model or style changes. Use current source to judge motion and state priority.

| Reference | What to match |
| --- | --- |
| [Player suits](visual-reference/player-suits.png) | Palette, square shell, visor contrast, planet motifs |
| [Player states](visual-reference/player-model-states.png) | Base model, carrying priority, full-energy aura, charging |
| [Celestial casts](visual-reference/celestial-casts.png) | Different motifs with shared crisp energy construction |
| [Aliens](visual-reference/aliens.png) | Ordinary silhouettes, Leech empty/charged, support cues |
| [Bosses](visual-reference/bosses.png) | Preserve faces, accessories, body proportions and palettes |
| [Ruby, bombs, rewards](visual-reference/ruby-bomb-rewards.png) | Object rims, symbols and reward language |
| [Battlefield detail](visual-reference/battlefield-detail.png) | Quiet floor, weight of boundaries, cover, pad/ice treatment |
| [Leech close-up](visual-reference/energy-leech.png) | Empty and stored-energy cells at matching scale |


## Constellation interface

Use square dark panels, colored crisp borders, large square-rimmed stars with dark insets/pale cores and chunky two-unit rectangle-built stair-step connections. Stars have a visible soft matching-color halo around their sharp square rims; connections carry a weaker colored glow. The main star has separated cardinal chips; use sharp filled pixels rather than thin diagonal SVG strokes. Constellation artwork is 160px high on desktop and 120px on short landscape screens. Keep the two choices distinct and legible on desktop and mobile; the last unowned constellation uses a single card. Show only the option buttons with their constellation art, names, effects and selection keys. No heading, introduction, milestone text, footer, balance text or surrounding panel. Gameplay remains paused and keyboard focus stays within the options. Use filled blue option cards with 3px colored borders, pixel-font names and bold 15px effect text so actions stand clearly apart from the backdrop. Preserve restrained glow and pixel/monospace typography.

Current interface references: [desktop](visual-reference/constellations-desktop.png), [mobile](visual-reference/constellations-mobile.png), and [final single choice](visual-reference/constellation-final-mobile.png).

HUD references: [desktop ready](visual-reference/hud-desktop-ready.png), [mobile armed](visual-reference/hud-mobile-armed.png), [cooldown](visual-reference/hud-desktop-cooldown.png).

## Occasional event visuals

Use the meteorite's strong anticipation, luminous rim/dark inset/pale core, deliberate pixel fragments and clear release/fade as the event baseline. Preserve each identity and gameplay footprint.

- Black hole: large 256px almost-square violet body with stepped pixel corners, a layered stellar mantle/dark hot core inspired by the Solar suit, detached square accretion chips, broad inward square fronts and visible inward pixel streams across the arena. No smooth circular ring; force and duration stay separate from cosmetic size.
- Shooting star: a clear four-point stepped gold star on the minimap, without a surrounding box. The falling head shares that stellar silhouette, with a tapered detached gold/pale trail and sparse blue side fragments. Landing releases two square shock fronts and separated rays; the collectible is a bobbing gold four-point star with a bright pale core and the full-energy aura's eight staggered outward gold/white pixel streams, distinct from healing crosses.
- Eclipse: a visible violet-blue full-field color overlay, like the King eruption tint, rather than a dark multiplication mask. Chamber/cover/hallway boundaries and pads blend into distinct indigo/lavender night palettes, with a pale night-colored viewport frame. Keep actors readable and HUD/minimap unchanged; blend warning and expiry smoothly.
- Meteor landing: 60-tick chamber-clipped explosion with a brief bright flash, hot square core, three expanding blocky shock fronts and separated orange/gold debris. It is cosmetic and pauses with simulation; damage and timing are unchanged.

Event banners show only event name/location/countdown, with no explanatory sentence. Collecting a stellar shard shows no banner; its normal reward effects remain. Motion uses event age so it freezes with gameplay. Review warning, early, active and fading frames with `preview-space-events.cjs`; it renders actual source and checks that drawing does not mutate event state.

Teleport destinations use a 2×2 grid in map order: Alpha/Beta, Delta/Gamma. Keep the current chamber dimmed without a YOU ARE HERE caption. Selection overlays the debug panel and touch controls.

References: [black hole](visual-reference/event-blackhole-desktop-active.png), [stellar shard](visual-reference/event-shootingStar-mobile-active.png), [Eclipse](visual-reference/event-eclipse-mobile-active.png).

Animation reference: [four event stages](visual-reference/space-events-stages.png). Meteor impact: [early](visual-reference/meteor-impact-desktop-early.png), [middle](visual-reference/meteor-impact-desktop-middle.png), [late](visual-reference/meteor-impact-desktop-late.png). Teleport: [2×2 layout](visual-reference/teleport-grid-mobile.png).

Game-over references: [desktop](visual-reference/game-over-desktop.png), [mobile](visual-reference/game-over-mobile.png).
