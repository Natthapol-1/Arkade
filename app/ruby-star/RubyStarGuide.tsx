'use client';

import { useEffect, useRef, useState } from 'react';
import { BOSS_NAMES, BOSS_TYPES, ENEMY_CONFIGS, SPECIAL_SKILLS, type BossType, type EnemyType } from './constants';

const controls = [
  ['WASD / Arrows', 'Move'],
  ['Left-click', 'Fire lasers'],
  ['Hold left-click', 'Charge a wave'],
  ['Right-click', 'Fire a bullet'],
  ['R / Shift / Ctrl', 'Speed burst'],
  ['Q', 'Place bomb · press again to explode'],
  ['E', 'Carry or place Ruby'],
  ['Space', 'Heal, including on a pad'],
  ['X', 'Teleport when on a pad'],
  ['F', 'Use your celestial skill'],
];

const aliens: { type: EnemyType; name: string; description: string }[] = [
  { type: 'normal', name: 'Normal', description: 'Chases you or Ruby. Easy to defeat.' },
  { type: 'armored', name: 'Armored', description: 'Tough and shielded. Defeat it for a player shield.' },
  { type: 'fast', name: 'Runner', description: 'Very fast but fragile. Gives extra star energy.' },
  { type: 'bomber', name: 'Bomber', description: 'Explodes up close or when defeated. Keep your distance.' },
  { type: 'sniper', name: 'Sniper', description: 'Charges a long-range shot. Defeat it for chain lightning.' },
  { type: 'healer', name: 'Healer', description: 'Heals nearby aliens. Defeat it to recover HP.' },
  { type: 'charger', name: 'Charger', description: 'Rushes straight at you. Dodge sideways; defeat it for a speed burst.' },
  { type: 'ghost', name: 'Ghost', description: 'Moves through walls. Defeat it to heal a placed Ruby.' },
  { type: 'splitter', name: 'Splitter', description: 'Splits into two smaller aliens when defeated.' },
  { type: 'mini_splitter', name: 'Mini Splitter', description: 'A small, quick attacker left by a Splitter.' },
  { type: 'shielder', name: 'Shielder', description: 'Protects another alien. Defeat it for a Ruby shield.' },
  { type: 'queen_echo', name: 'Queen Echo', description: 'A Queen copy that keeps shooting until defeated.' },
];

const bosses: Record<BossType, { description: string; skill: string }> = {
  fiery_king: {
    description: 'Grows faster and stronger over time. Keep attacking to interrupt his arena blast.',
    skill: 'Burns every enemy in the arena.',
  },
  splitter_queen: {
    description: 'Teleports between chambers and leaves shooting copies. Defeat her to clear them all.',
    skill: 'Creates a decoy that draws enemy attacks.',
  },
  storm_reaper: {
    description: 'Hunts you and seals hallways. Keep moving to avoid her strikes.',
    skill: 'Strikes nearby enemies with a powerful storm.',
  },
  devourer: {
    description: 'Eats other aliens to grow stronger. A meteor can hurt her, but cannot finish her.',
    skill: 'Creates a field that pulls enemies inward.',
  },
  frost_warden: {
    description: 'Slows you, freezes floor tiles and shields aliens. Her ice shields block meteors.',
    skill: 'Shields both you and Ruby.',
  },
  blind_prayer: {
    description: 'Reverses your movement, moves a placed Ruby and blasts you back when cornered.',
    skill: 'Grants a longer power boost and refreshes your abilities.',
  },
  sea_chanter: {
    description: 'Sends bursting water attacks, heals aliens and weakens your healing. When hurt, she dives. Dealing damage to other aliens while she is diving heals her. She takes extra damage underwater.',
    skill: 'Heals you and Ruby, and pushes enemies away.',
  },
  thorn_weaver: {
    description: 'Marks the ground, then grows thorns that slow and poison you. Step out before they erupt.',
    skill: 'Plants a field that slows and damages enemies.',
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
      <button type="button" className="btn rs-guide-link" onClick={() => setSheet(sheet === 'main' ? 'aliens' : 'main')}>
        {sheet === 'main' ? 'ALIENS & BOSSES →' : '← MAIN RULES'}
      </button>
    </div>

    {sheet === 'main' ? <>
      <p className="rs-guide-intro">Survive the station and defeat bosses to advance stages. If you or Ruby run out of HP, the run ends.</p>
      <section className="rs-guide-section" aria-labelledby="rs-controls-title">
        <h4 id="rs-controls-title">CONTROLS</h4>
        <dl className="rs-guide-controls">
          {controls.map(([key, action]) => <div key={key}><dt>{key}</dt><dd>{action}</dd></div>)}
        </dl>
        <p className="rs-guide-note">On mobile, use the joystick and ability buttons.</p>
      </section>

      <div className="rs-guide-grid">
        <section className="rs-guide-section"><h4>RUBY & HEALING</h4>
          <p>Carry Ruby to protect it, at the cost of speed. Place it to move faster.</p>
          <p>With enemies clear, press Space while carrying or near Ruby to heal both of you.</p>
        </section>
        <section className="rs-guide-section"><h4>METEORS</h4>
          <p>Meteors move clockwise.</p>
          <p>A chamber flashes before a meteor hits. You have five seconds to leave—with Ruby.</p>
          <p>Meteors clear most aliens and deal heavy damage to bosses.</p>
        </section>
        <section className="rs-guide-section"><h4>TELEPORT</h4>
          <p>Stand on a chamber pad and press X (TP on mobile). Choose a destination with 1–4 or tap it. Esc or X cancels.</p>
          <p>A carried Ruby is placed on the destination pad.</p>
          <p>The game pauses while you choose.</p>
        </section>
        <section className="rs-guide-section"><h4>STAR ENERGY</h4>
          <p>Defeat aliens and collect blue shards to fill the star gauge. Your next ability starts a short power boost.</p>
          <p>Red shards restore health.</p>
        </section>
      </div>

      <section className="rs-guide-section"><h4>ASCENSION</h4>
        <p>Defeat your tenth boss to unlock celestial skills. Each boss then grants its own skill. Press F to use it; a new skill replaces the one you hold.</p>
        <p className="rs-guide-note">Find each skill in the Aliens & Bosses sheet.</p>
      </section>
      <section className="rs-guide-hints"><h4>HINTS</h4>
        <ul>
          <li>Use teleport pads to escape a meteor and leave enemies behind.</li>
          <li>Place a bomb, move away, then detonate—it can hurt you too.</li>
          <li>Make room to heal before the next boss arrives.</li>
        </ul>
      </section>
    </> : <>
      <p className="rs-guide-intro">Learn the threats. Boss skills become yours after Ascension.</p>
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
            <p className="rs-guide-skill"><strong style={{ color: type === 'devourer' ? '#c3c3d4' : SPECIAL_SKILLS[type].color }}>Ascension skill: {SPECIAL_SKILLS[type].name}</strong>{bosses[type].skill}</p>
          </article>)}
        </div>
      </section>
      <button type="button" className="btn btn-ghost rs-guide-back" onClick={() => setSheet('main')}>← MAIN RULES</button>
    </>}
  </div>;
}
