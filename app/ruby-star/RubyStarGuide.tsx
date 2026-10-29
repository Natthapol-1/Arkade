'use client';

import { playUiSfx } from './ui-sfx';
import { useEffect, useRef, useState } from 'react';
import PixelArrow from '@/components/PixelArrow';
import { BOSS_NAMES, BOSS_TYPES, BOSS_SKILL_REWARDS, ENEMY_CONFIGS, SPECIAL_SKILLS, type BossType, type EnemyType } from './constants';

const controls = [
  ['WASD / Arrows', 'Move'],
  ['Left-click / K', 'Fire lasers'],
  ['Hold left-click / K', 'Charge a wave'],
  ['Right-click / L', 'Fire a bullet'],
  ['R / Shift / Ctrl', 'Speed burst'],
  ['Q', 'Place bomb · press again to explode'],
  ['E', 'Carry or place Ruby'],
  ['Space', 'Heal, including on a pad'],
  ['X', 'Teleport on or next to a pad'],
  ['F', 'Use your celestial skill'],
];

const aliens: { type: EnemyType; name: string; description: string }[] = [
  { type: 'normal', name: 'Normal', description: 'Chases you or Ruby.' },
  { type: 'armored', name: 'Armored', description: 'Tough. Drops a shield.' },
  { type: 'fast', name: 'Runner', description: 'Fast and fragile. Extra energy.' },
  { type: 'bomber', name: 'Bomber', description: 'Explodes up close or on death.' },
  { type: 'sniper', name: 'Sniper', description: 'Charges a long shot. Drops chain lightning.' },
  { type: 'healer', name: 'Healer', description: 'Heals aliens. Kill it to heal.' },
  { type: 'charger', name: 'Charger', description: 'Marks a lane, then rushes. Dodge sideways. Drops a speed burst.' },
  { type: 'ghost', name: 'Ghost', description: 'Moves through walls. Kill it to heal Ruby.' },
  { type: 'splitter', name: 'Splitter', description: 'Splits in two on death.' },
  { type: 'mini_splitter', name: 'Mini Splitter', description: 'Small and quick.' },
  { type: 'shielder', name: 'Shielder', description: 'Shields another alien. Drops a Ruby shield.' },
  { type: 'energy_leech', name: 'Energy Leech', description: 'Steals energy up close. Kill it to get it back.' },
  { type: 'queen_echo', name: 'Queen Echo', description: 'Keeps shooting until killed.' },
];

export const bosses: Record<BossType, { description: string; skill: string }> = {
  fiery_king: {
    description: 'Grows stronger over time. Keep hitting him to stop his arena blast.',
    skill: 'Burns all enemies. Kills give no energy.',
  },
  splitter_queen: {
    description: 'Teleports and leaves shooting copies. Kill her to clear them.',
    skill: 'A decoy draws attacks.',
  },
  storm_reaper: {
    description: 'Hunts you and seals hallways. Keep moving.',
    skill: 'Storm strike on nearby enemies.',
  },
  devourer: {
    description: 'Eats aliens to grow. Splits into copies when killed or ignored. Kill every copy.',
    skill: 'Pulls enemies in and damages them.',
  },
  frost_warden: {
    description: 'Slows you, freezes tiles and shields aliens from meteors.',
    skill: 'Shields you and Ruby.',
  },
  blind_prayer: {
    description: 'Reverses your controls, moves Ruby and blasts you back when cornered.',
    skill: 'Longer power boost. Refreshes abilities.',
  },
  sea_chanter: {
    description: 'Heals aliens. Dives when hurt; hitting other aliens then heals her. Hit her underwater for extra damage.',
    skill: 'Heals you and Ruby. Pushes enemies away.',
  },
  thorn_weaver: {
    description: 'Leaves slowing, poisonous thorns. Grows a bigger field when you get close.',
    skill: 'A field that slows and damages enemies.',
  },
  aegis_sentinel: {
    description: 'Break both pylons to expose its core. Its shield reflects damage.',
    skill: 'Cuts damage to you and Ruby. Reflects attacks.',
  },
  astral_twins: {
    description: 'One fights close, one shoots. Kill both within 12s or the fallen one revives.',
    skill: 'A twin by Ruby copies your attacks.',
  },
};

export default function RubyStarGuide() {
  const [sheet, setSheet] = useState<'main' | 'aliens'>('main');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = root.current?.closest('.modal-body');
    if (scroller) scroller.scrollTop = 0;
  }, [sheet]);

  return <div ref={root} className="rs-guide">
    <div className="rs-guide-nav">
      <h3>{sheet === 'main' ? 'HOW TO PLAY' : 'ALIENS & BOSSES'}</h3>
      <button type="button" className="btn rs-guide-link" onMouseEnter={() => playUiSfx('hover')}
        onClick={() => { playUiSfx(sheet === 'main' ? 'page' : 'back'); setSheet(sheet === 'main' ? 'aliens' : 'main'); }}>
        {sheet !== 'main' && <PixelArrow direction="left" />}
        <span>{sheet === 'main' ? 'ALIENS & BOSSES' : 'MAIN RULES'}</span>
        {sheet === 'main' && <PixelArrow />}
      </button>
    </div>

    {sheet === 'main' ? <>
      <p className="rs-guide-intro">Defeat bosses. Keep yourself and Ruby alive.</p>
      <section className="rs-guide-section" aria-labelledby="rs-controls-title">
        <h4 id="rs-controls-title">CONTROLS</h4>
        <dl className="rs-guide-controls">
          {controls.map(([key, action]) => <div key={key}><dt>{key}</dt><dd>{action}</dd></div>)}
        </dl>
        <p className="rs-guide-note">On mobile, use the joystick and ability buttons.</p>
      </section>

      <div className="rs-guide-grid">
        <section className="rs-guide-section"><h4>RUBY & HEALING</h4>
          <p>Carrying Ruby slows you. With no enemies near, press Space by Ruby to heal both.</p>
        </section>
        <section className="rs-guide-section"><h4>METEORS</h4>
          <p>Meteors move clockwise and hit everything in the chamber. Get Ruby out of the flashing one.</p>
        </section>
        <section className="rs-guide-section"><h4>TELEPORT</h4>
          <p>Press X at a pad to pick a chamber. Carried Ruby comes along.</p>
        </section>
        <section className="rs-guide-section"><h4>STAR ENERGY</h4>
          <p>Kills and blue shards fill energy. When full, your next ability is boosted. Red shards heal.</p>
        </section>
      </div>

      <section className="rs-guide-section"><h4>SPACE EVENTS</h4>
        <p><strong>Black Hole:</strong> Pulls everything in.</p>
        <p><strong>Shooting Star:</strong> Grab its shard to heal and recharge.</p>
        <p><strong>Eclipse:</strong> Briefly freezes enemies.</p>
        <p><strong>Supernova:</strong> Hit it, then escape the blast.</p>
      </section>
      <section className="rs-guide-section"><h4>CONSTELLATIONS</h4>
        <p>Every 3 stages, pick an upgrade for the run.</p>
      </section>
      <section className="rs-guide-section"><h4>ASCENSION</h4>
        <p>From stage 10, boss kills give a one-use celestial skill (F). Hold one at a time.</p>
      </section>
      <section className="rs-guide-hints"><h4>HINTS</h4>
        <ul>
          <li>Teleport out with Ruby and leave aliens in the meteor blast.</li>
          <li>Step away before detonating your bomb.</li>
        </ul>
      </section>
    </> : <>
      <p className="rs-guide-intro">Boss skills become yours after Ascension.</p>
      <section aria-labelledby="rs-aliens-title"><h4 id="rs-aliens-title" className="rs-guide-group-title">ALIENS</h4>
        <div className="rs-guide-grid">
          {aliens.map(alien => <article key={alien.type} className="rs-guide-entry" style={{ borderLeftColor: ENEMY_CONFIGS[alien.type].color }}>
            <h5 style={{ color: ENEMY_CONFIGS[alien.type].color }}>{alien.name}</h5><p>{alien.description}</p>
          </article>)}
        </div>
      </section>
      <section aria-labelledby="rs-bosses-title"><h4 id="rs-bosses-title" className="rs-guide-group-title">BOSSES</h4>
        <div className="rs-guide-grid">
          {BOSS_TYPES.map(type => <article key={type} className="rs-guide-entry" style={{ borderLeftColor: ENEMY_CONFIGS[type].color }}>
            <h5 style={{ color: ENEMY_CONFIGS[type].color }}>{BOSS_NAMES[type]}</h5>
            <p>{bosses[type].description}</p>
            <p className="rs-guide-skill"><strong style={{ color: type === 'devourer' ? '#c3c3d4' : SPECIAL_SKILLS[BOSS_SKILL_REWARDS[type]].color }}>Celestial skill: {SPECIAL_SKILLS[BOSS_SKILL_REWARDS[type]].name}</strong>{bosses[type].skill}</p>
          </article>)}
        </div>
      </section>
      <button type="button" className="btn btn-ghost rs-guide-back" onMouseEnter={() => playUiSfx('hover')} onClick={() => { playUiSfx('back'); setSheet('main'); }}><PixelArrow direction="left" /> MAIN RULES</button>
    </>}
  </div>;
}
