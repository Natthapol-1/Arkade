# Enemies and bosses

[Overview](README.md)

## Normal aliens and rewards

HP below is the configuration base, before [difficulty scaling](GAMEPLAY.md#difficulty-progression). Movement is px/tick. Standard direct damage is shown player / placed Ruby; special mechanics can use their own damage values.

| Alien / internal type | Base HP | Speed | Damage | Behavior and additional defeat reward |
| --- | ---: | ---: | --- | --- |
| Normal / `normal` | 5 | 0.68 | 10 / 6 | Chases player or Ruby; basic melee threat |
| Armored / `armored` | 22 | 0.47 | 15 / 10 | Toughest regular base HP; no inherent damage reduction. Grants player absorb shield of at least 10 |
| Runner / `fast` | 4 | 5.5 | 6 / 3 | Very fast and fragile; +8 additional energy |
| Bomber / `bomber` | 6 | 0.53 | Explosion | Winds up close to its target; explodes on ordinary defeat too. Explosion can damage player, placed Ruby and other aliens |
| Sniper / `sniper` | 5 | 0.34 | 13 / 13 | 10-tile ranged shot, 50-tick warning. Grants 5 seconds of chain lightning; chain range 4 tiles, damage 8 |
| Healer / `healer` | 11 | 0.42 | None | Restores nearby allies 2 HP each second within 3 tiles. Grants +24 player HP in addition to the usual +5 |
| Charger / `charger` | 17 | 0.75 idle | 20 / 14 | Locks a cardinal lane, warns 30 ticks, rushes at 7.5px/tick for up to 8 tiles. Wall stun 55 ticks, shorter hit/miss recovery; push interrupts. Grants 2-second speed burst |
| Ghost / `ghost` | 4 | 0.89 | 12 / 9 | Passes through walls. Grants +15 HP to a placed Ruby |
| Splitter / `splitter` | 17 | 0.82 | 11 / 8 | Defeat creates two Mini Splitters |
| Mini Splitter / `mini_splitter` | 4 | 0.95 | 6 / 4 | Small attacker produced by a Splitter |
| Shielder / `shielder` | 10 | 0.44 | None | Follows/protects an ally within 8 tiles; halves damage exactly, including fractions. Grants Ruby absorb shield of at least 10 |
| Energy Leech / `energy_leech` | 8 | 1.8 | Energy theft only | Always hunts player. At one-tile range steals up to 20 available energy about every 75 ticks; stores the actual amount. Defeat returns it, capped at gauge maximum, plus ordinary rewards |
| Queen Echo / `queen_echo` | 1 | Stationary | 5 / 4 | Permanent shooting copy left by Queen; defeat it or kill Queen to clear it. Not a natural spawn-pool alien |

Most ordinary attackers choose player versus placed Ruby by proximity; carrying directs them toward the player. Healer/Shielder retain support AI; Leech explicitly ignores Ruby as a target. Charger damage occurs on actual tile arrival, not before contact. Its committed lane can be dodged sideways.

Leech deals no HP damage, does not drain shields or active powered time, and never creates energy from an empty gauge. Lunar Echo takes a decoy hit instead of losing real energy. God mode prevents theft. Meteor defeat returns only its stored energy, without standard kill rewards. Devourer absorption and debug removal are not defeats and give no refund. Storage is `Enemy.stolenEnergy`; display cells saturate at 60, but stored energy itself can exceed that.

Absorb shields take damage before HP; ordinary reward shields refill a minimum pool, rather than stacking. Shielder's 50% reduction is separate from these pools and is applied before a Frost shield. Keep fractional damage; do not round low damage up to 1.

## Boss encounters

Eight mutually exclusive boss types. First natural boss appears around 60 seconds. After defeat, next boss arrives after about 42 seconds (38.5s countdown + 3.5s warning). Timer freezes while a boss is alive. The natural random pool covers all eight before refilling and avoids immediately repeating the previous boss at a pool boundary. Explicit God spawns do not consume that pool.

Spawn HP = `base HP + 15 * prior bosses defeated`. Boss defeat restores player and Ruby HP fully, fills star energy and grants the appropriate celestial skill starting at the tenth defeat. Boss defeat rewards also apply to meteor kills. Removal must clean up that boss's curse/hazards; Queen death clears her echoes.

| Boss | Base HP | Current mechanics |
| --- | ---: | --- |
| Fiery King / `fiery_king` | 121 | Hunts whichever of player/Ruby is nearer, unless diverted by Echo. Red ranged attack, 40 player / 35 Ruby damage, 45-tick cooldown, 3-tile range. Base speed 0.48 grows with this King's age to 6 over about 350s. After 10s without actual HP damage, warns for 6.5s before a global wrath hit (15–30 to player and placed Ruby, age-scaled). HP damage interrupts the warning; absorbed shield damage does not |
| Shadow Queen / `splitter_queen` | 50 | Stationary; shoots through cover in her chamber within 16 tiles, with 40-tick windup. Every 8s jumps to a different chamber excluding the player's, leaves a permanent Echo and heals 7% max HP capped at 8. Direct damage 7 player / 10 Ruby |
| Storm Reaper / `storm_reaper` | 60 | Hunts player only at speed 4. Close slash for 20 damage, 24-tick cooldown. When both are in the same hallway, seals its end caps for 4s, 8s seal cooldown; floor remains traversable inside. Death immediately lifts seal |
| Soul Devourer / `devourer` | 60 | Eats nearest eligible regular ally within 5 tiles every 9s, up to 20 growth stacks. Each stack compounds max HP by 12% and heals the gained HP, enlarges body and lowers speed. At cap she keeps eating and heals to full. Range grows exponentially from 1 to 40 tiles. Damage = `round(base * (1+(stacks/20)^2))`, with base 10 player / 8 Ruby, so cap is 20/16. Movement starts 0.5, loses 4% base per stack, floors at 0.15 |
| Frost Warden / `frost_warden` | 100 | Stationary support controller, no direct damage. Sharing her chamber slows movement to 65% and LASER/BULLET/WAVE cooldown/charge progression to half speed. Seven random interior ice tiles freeze player for 90 ticks. Relocates every 30s. Every 5s gives an eligible ally in her chamber a 15-HP ice shield, prioritizing unshielded allies. Her ice shield completely blocks meteors until broken by other attacks |
| Blind Prayer / `blind_prayer` | 80 | Globally reverses movement while alive. Flees at speed 2. Escape attack: 6-tile reach, 36-tick warning, 6 damage, one-tile push, 12s cooldown, 3s spawn grace; grants her 2.5s at speed 5.4. Ruby ritual every 30s while placed: 1.5s warning, moves core to another chamber pad avoiding active meteor warnings. Carrying/moving Ruby cancels it. No direct Ruby damage |
| Sea Chanter / `sea_chanter` | 90 | Hunts at speed 3.8 with warned traveling water attacks and 6-tile splash (15 center / 5 edge); traveling water hits deal 10 damage. Surface support heals normal allies +3 every 3s within 12 tiles; player HP hits on her heal nearby allies +10. At <=40% HP she dives/flees at the same 3.8 speed; resurfaces at >=75%. While diving takes 1.6× HP damage, including meteor, and heals from player damage to regular aliens anywhere: 80% actual HP lost, max 25 per hit/alien. Taking actual HP damage while already diving blocks this recovery for 3 seconds of gameplay; further hits refresh the delay. Fully absorbed hits do not trigger it. Overkill/shields/meteor/enemy damage/specials do not feed her. Hidden on minimap 7s then revealed 1s while diving; bullets cannot target/hit her |
| Thorn Weaver / `thorn_weaver` | 80 | Flees at speed 2.8 and aims at player anywhere on map. First cast after 2s, 1.5s locked ground warning, then 12 damage in a tile-aligned 4×4 square; 4s between casts. Patch lasts 14s, max four patches. While inside: 80% movement, +1 contact damage per 45 ticks, refreshes non-stacking 4s poison (2 damage/sec). Walls excluded; Ruby/enemies unaffected. Leaving removes slow, poison lingers; death clears patches/poison |

Lunar Echo attracts all direct enemy targeting across the map, including bosses. Attraction does not give unlimited attack range, chamber access or line of sight. Support/stationary bosses retain their behavior. Area hazards, real meteors and Prayer's Ruby ritual remain dangerous. AI temporarily substitutes the decoy target, then restores real player state in `finally`; never permanently move or hide the actual player/Ruby to implement decoy attraction.

See [Skills and upgrades](SKILLS.md) for boss celestial rewards and [Visual style](VISUALS.md#aliens-and-bosses) for model identities.
