'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PixelArrow from '@/components/PixelArrow';
import { playUiSfx, UiSfx } from './ui-sfx';

type ModeCard = { id: string; title: string; tag?: string; description: string; path?: string; color: string; sound: UiSfx };

const MODES: ModeCard[] = [
  {
    id: 'tutorial', title: 'FIRST ORBIT', tag: 'TUTORIAL', color: '#7fd7ff', sound: 'confirm', path: '/ruby-star/tutorial',
    description: 'Learn to move, fight, power up with star energy, protect Ruby, teleport, dodge meteors and cast a celestial skill.',
  },
  {
    id: 'endless', title: 'ENDLESS SPACE', color: '#ff4f8b', sound: 'endless', path: '/ruby-star/endless',
    description: 'Guard the Ruby across four chambers. Aliens, bosses, meteors and space events keep coming.',
  },
  {
    id: 'ascension', title: 'ENDLESS SPACE', tag: 'ASCENSION', color: '#c99bff', sound: 'ascension', path: '/ruby-star/ascension',
    description: 'Start at stage 10 with celestial skills unlocked, three Constellations to pick and the toughest alien waves.',
  },
  {
    id: 'trials', title: 'CELESTIAL CHALLENGE', color: '#9aa8ff', sound: 'ascension', path: '/ruby-star/challenge',
    description: 'Pick a world on the star map and face its guardian boss. Full challenges are in development.',
  },
];

// Square pixel emblems for each mode, drawn with CSS blocks.
function Emblem({ id }: { id: string }) {
  if (id === 'tutorial') return <div className="rs-emblem">
    <span className="rs-orbit-path" /><span className="rs-gem rs-gem-small" />
    <span className="rs-orbit-arm"><span className="rs-orbit-ship" /></span>
  </div>;
  if (id === 'trials') return <div className="rs-emblem">
    <span className="rs-tp">
      <span className="rs-tp-ring rs-tp-ring-back" /><span className="rs-tp-planet" /><span className="rs-tp-ring rs-tp-ring-front" />
    </span>
    <span className="rs-tp-moon" /><span className="rs-tp-spark rs-tp-spark-a" /><span className="rs-tp-spark rs-tp-spark-b" />
  </div>;
  return <div className="rs-emblem">
    {id === 'ascension' && <><span className="rs-ray rs-ray-a" /><span className="rs-ray rs-ray-b" /><span className="rs-crown" /></>}
    <span className={id === 'ascension' ? 'rs-gem rs-gem-ascended' : 'rs-gem'} />
  </div>;
}

export default function RubyStarLobby() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(1); // Endless Space starts centred; Tutorial sits to its left
  // Debug query flags such as ?god=1 carry through to the chosen mode.
  useEffect(() => { setQuery(window.location.search); }, []);

  const rotate = useCallback((step: number) => {
    playUiSfx(step > 0 ? 'page' : 'back');
    setIndex(i => (i + step + MODES.length) % MODES.length);
  }, []);

  const choose = useCallback((mode: ModeCard) => {
    playUiSfx(mode.sound);
    if (mode.path) setTimeout(() => router.push(mode.path + query), 180);
  }, [router, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); rotate(-1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); rotate(1); }
      else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) choose(MODES[index]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rotate, choose, index]);

  return (
    <main className="ruby-star-ui rs-lobby">
      <style>{`
        body:has(.ruby-star-ui)::after { display: none; }
        .rs-lobby { min-height: 100vh; box-sizing: border-box; padding: 20px 24px 40px; color: #e7e9f6; overflow: hidden;
          background: radial-gradient(circle at 50% 18%, #2a1230 0%, transparent 42%), radial-gradient(circle at 80% 85%, #10203a 0%, transparent 45%), #07080f; }
        .rs-lobby-stars { position: fixed; inset: 0; pointer-events: none; opacity: .55;
          background-image: radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#9fb6ff 1px, transparent 1px);
          background-size: 97px 89px, 151px 137px; background-position: 13px 29px, 61px 7px; }
        .rs-lobby-inner { position: relative; max-width: 1100px; margin: 0 auto; }
        .rs-lobby-title { margin: 28px 0 6px; text-align: center; font-family: var(--font-pixel); font-size: clamp(2rem, 5vw, 3.2rem);
          letter-spacing: .12em; color: #ff6f9f; text-shadow: 0 0 18px #ff2f6f88, 4px 4px 0 #3a0f22; }
        .rs-lobby-sub { text-align: center; font-family: var(--font-mono); font-size: .8rem; letter-spacing: .3em; color: #8d93b3; margin: 0 0 18px; }
        .rs-carousel { position: relative; height: 470px; display: flex; align-items: center; justify-content: center; }
        .rs-card { position: absolute; width: 400px; height: 400px; box-sizing: border-box; padding: 24px; display: flex; flex-direction: column;
          align-items: center; text-align: center; background: #10131ff2; color: inherit; font: inherit; cursor: pointer;
          border: 3px solid var(--mode); box-shadow: 0 0 18px color-mix(in srgb, var(--mode) 35%, transparent);
          transition: transform 320ms cubic-bezier(.2,.8,.2,1), opacity 320ms ease, box-shadow 200ms ease, filter 320ms ease; }
        .rs-card[data-slot="0"] { z-index: 3; transform: translateX(0) scale(1); }
        .rs-card[data-slot="0"]:hover, .rs-card[data-slot="0"]:focus-visible { outline: none; box-shadow: 0 0 34px color-mix(in srgb, var(--mode) 70%, transparent); }
        .rs-card[data-slot="-1"] { z-index: 2; transform: translateX(-370px) scale(.72); opacity: .45; filter: saturate(.6); }
        .rs-card[data-slot="1"] { z-index: 2; transform: translateX(370px) scale(.72); opacity: .45; filter: saturate(.6); }
        .rs-card[data-slot="-1"]:hover, .rs-card[data-slot="1"]:hover { opacity: .7; }
        .rs-card[aria-disabled][data-slot="0"] { border-style: dashed; }
        .rs-card[data-hidden] { z-index: 1; transform: scale(.5); opacity: 0; pointer-events: none; }
        .rs-card-name { margin-top: 18px; font-family: var(--font-pixel); font-size: 1.1rem; line-height: 1.6; color: var(--mode); }
        .rs-card-tag { display: inline-block; margin-top: 8px; font-family: var(--font-pixel); font-size: .7rem; padding: 4px 8px; color: #10131f; background: var(--mode); }
        .rs-card-desc { margin-top: 12px; font-family: var(--font-mono); font-size: .85rem; line-height: 1.5; color: #b9bdd6; }
        .rs-card-go { margin-top: auto; font-family: var(--font-pixel); font-size: .8rem; color: var(--mode); }
        .rs-arrow { position: absolute; top: 50%; z-index: 4; transform: translateY(-50%); width: 64px; height: 64px; display: grid; place-items: center; transform-origin: center;
          background: #141a2bf0; color: #e7e9f6; border: 2px solid #4a5478; cursor: pointer; transition: border-color 150ms, color 150ms, box-shadow 150ms; }
        .rs-arrow svg { width: 28px; height: 28px; }
        .rs-arrow:hover, .rs-arrow:focus-visible { outline: none; border-color: #ff6f9f; color: #ff6f9f; box-shadow: 0 0 16px #ff2f6f66; }
        .rs-arrow-left { left: calc(50% - 610px); }
        .rs-arrow-right { right: calc(50% - 610px); }
        .rs-dots { display: flex; justify-content: center; gap: 10px; }
        .rs-dot { width: 12px; height: 12px; padding: 0; border: 2px solid #4a5478; background: transparent; cursor: pointer; }
        .rs-dot[aria-current="true"] { background: var(--mode); border-color: var(--mode); }
        .rs-emblem { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
        .rs-gem { position: absolute; left: 42px; top: 42px; width: 56px; height: 56px; background: #ff4f8b; transform: rotate(45deg);
          box-shadow: 0 0 26px #ff2f6f, inset -12px -12px 0 #b8255a, inset 10px 10px 0 #ffb3cc; animation: rsGemFloat 2.4s ease-in-out infinite; }
        .rs-gem-ascended { background: #c99bff; box-shadow: 0 0 30px #a56bff, inset -12px -12px 0 #7a45c8, inset 10px 10px 0 #efe0ff; }
        .rs-crown { position: absolute; left: 46px; top: 4px; width: 48px; height: 16px; background:
          linear-gradient(#ffe477, #ffe477) 0 8px / 48px 8px no-repeat, linear-gradient(#ffe477, #ffe477) 0 0 / 8px 8px no-repeat,
          linear-gradient(#ffe477, #ffe477) 20px 0 / 8px 8px no-repeat, linear-gradient(#ffe477, #ffe477) 40px 0 / 8px 8px no-repeat; filter: drop-shadow(0 0 6px #ffcb3a); }
        .rs-ray { position: absolute; left: 66px; top: 6px; width: 8px; height: 128px; background: linear-gradient(transparent, #c99bff66, transparent); }
        .rs-ray-a { transform: rotate(45deg); } .rs-ray-b { transform: rotate(-45deg); }
        .rs-tp { position: absolute; inset: 0; filter: drop-shadow(0 0 14px #7f8cff); animation: rsGemFloat 2.8s ease-in-out infinite; }
        .rs-tp-planet { position: absolute; left: 38px; top: 38px; width: 64px; height: 64px; background: #8f9cff;
          clip-path: polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%);
          box-shadow: inset -14px -14px 0 #5560c8, inset 10px 10px 0 #d6dbff; }
        .rs-tp-planet::after { content: ''; position: absolute; left: 14px; top: 34px; width: 34px; height: 6px; background: #6e79e0; }
        .rs-tp-ring { position: absolute; left: 6px; top: 55px; width: 128px; height: 30px; box-sizing: border-box; border: 6px solid #e3e6ff; transform: rotate(-14deg); }
        .rs-tp-ring-back { clip-path: inset(0 0 50% 0); border-color: #a9b1ee; }
        .rs-tp-ring-front { clip-path: inset(50% 0 0 0); }
        .rs-tp-moon { position: absolute; left: 112px; top: 20px; width: 16px; height: 16px; background: #c9cfe6;
          clip-path: polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%); box-shadow: inset -4px -4px 0 #7d84a3; }
        .rs-tp-spark { position: absolute; width: 14px; height: 14px; background:
          linear-gradient(#ffffff, #ffffff) 50% 0 / 2px 100% no-repeat, linear-gradient(#ffffff, #ffffff) 0 50% / 100% 2px no-repeat;
          animation: rsTwinkle 1.8s ease-in-out infinite; }
        .rs-tp-spark-a { left: 14px; top: 18px; } .rs-tp-spark-b { left: 114px; top: 108px; animation-delay: .9s; }
        @keyframes rsTwinkle { 0%, 100% { opacity: .25; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes rsGemFloat { 0%, 100% { translate: 0 0; } 50% { translate: 0 -6px; } }
      `}</style>
      <div className="rs-lobby-stars" aria-hidden="true" />
      <div className="rs-lobby-inner">
        <BackButton playSound={() => playUiSfx('back')} arrow={<PixelArrow direction="left" />} />
        <h1 className="rs-lobby-title">RUBY STAR</h1>
        <p className="rs-lobby-sub">SELECT MODE</p>
        <div className="rs-carousel" role="group" aria-label="Game modes">
          <button type="button" className="rs-arrow rs-arrow-left" aria-label="Previous mode"
            onMouseEnter={() => playUiSfx('hover')} onClick={() => rotate(-1)}><PixelArrow direction="left" /></button>
          {MODES.map((mode, i) => {
            let slot = i - index;
            if (slot > 1) slot -= MODES.length;
            if (slot < -1) slot += MODES.length;
            const center = slot === 0;
            return (
              <button key={mode.id} type="button" className="rs-card" data-slot={slot} data-hidden={Math.abs(slot) > 1 || undefined} aria-hidden={Math.abs(slot) > 1 || undefined} aria-disabled={!mode.path || undefined}
                aria-label={`${mode.title}${mode.tag ? ' ' + mode.tag : ''}${mode.path ? '' : ' (coming soon)'}`}
                tabIndex={center ? 0 : -1} style={{ ['--mode' as string]: mode.color }}
                onMouseEnter={() => playUiSfx('hover')}
                onClick={() => center ? choose(mode) : rotate(slot)}>
                <Emblem id={mode.id} />
                <span className="rs-card-name">{mode.title}</span>
                {mode.tag && <span className="rs-card-tag">{mode.tag}</span>}
                <span className="rs-card-desc">{mode.description}</span>
                <span className="rs-card-go" aria-hidden="true">{mode.path ? 'PLAY ▶' : 'COMING SOON'}</span>
              </button>
            );
          })}
          <button type="button" className="rs-arrow rs-arrow-right" aria-label="Next mode"
            onMouseEnter={() => playUiSfx('hover')} onClick={() => rotate(1)}><PixelArrow /></button>
        </div>
        <div className="rs-dots">
          {MODES.map((mode, i) => <button key={mode.id} type="button" className="rs-dot" aria-label={`Show ${mode.title}${mode.tag ? ' ' + mode.tag : ''}`}
            aria-current={i === index} style={{ ['--mode' as string]: mode.color }}
            onClick={() => { if (i !== index) { playUiSfx(i > index ? 'page' : 'back'); setIndex(i); } }} />)}
        </div>
      </div>
    </main>
  );
}
