import { BOSS_NAMES, BOSS_SKILL_REWARDS, BossType, SPECIAL_SKILLS } from './constants';

// Celestial Challenge: one long, multi-phase fight per boss on its own world, named for the celestial body
// behind that boss's skill. Until a challenge is built, its route is a stage 0 run against that boss only.
export type TrialBody = 'sun' | 'moon' | 'jupiter' | 'singularity' | 'saturn' | 'sirius' | 'neptune' | 'gaia' | 'venus' | 'binary';

export interface Trial {
  id: TrialBody;
  name: string;   // shown on the star map
  boss: BossType;
  x: number; y: number; // position on the star map, 0–100 of its width/height
  size: number;   // body size in px on the map
}

export const TRIALS: Trial[] = [
  { id: 'sun', name: 'THE SUN', boss: 'fiery_king', x: 12, y: 52, size: 86 },
  { id: 'venus', name: 'VENUS', boss: 'aegis_sentinel', x: 27, y: 26, size: 46 },
  { id: 'gaia', name: 'GAIA', boss: 'thorn_weaver', x: 33, y: 70, size: 50 },
  { id: 'moon', name: 'THE MOON', boss: 'splitter_queen', x: 43, y: 86, size: 28 },
  { id: 'jupiter', name: 'JUPITER', boss: 'storm_reaper', x: 50, y: 40, size: 72 },
  { id: 'saturn', name: 'SATURN', boss: 'frost_warden', x: 64, y: 70, size: 58 },
  { id: 'neptune', name: 'NEPTUNE', boss: 'sea_chanter', x: 73, y: 24, size: 50 },
  { id: 'sirius', name: 'SIRIUS', boss: 'blind_prayer', x: 84, y: 62, size: 40 },
  { id: 'binary', name: 'BINARY STAR', boss: 'astral_twins', x: 90, y: 30, size: 44 },
  { id: 'singularity', name: 'THE SINGULARITY', boss: 'devourer', x: 89, y: 84, size: 54 },
];

export function trialSkill(trial: Trial) {
  return SPECIAL_SKILLS[BOSS_SKILL_REWARDS[trial.boss]];
}

export function trialBossName(trial: Trial) {
  return BOSS_NAMES[trial.boss];
}

export function findTrial(id: string): Trial | undefined {
  return TRIALS.find(trial => trial.id === id);
}
