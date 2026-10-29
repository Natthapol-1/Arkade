'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PixelArrow from '@/components/PixelArrow';
import { playUiSfx } from '../ui-sfx';
import { TRIALS, Trial, trialBossName, trialSkill } from '../trials';

// Three-tone pixel shading like the lobby emblems: dark lower-right edge, pale upper-left highlight.
const shade = (size: number, dark: string, light: string) =>
  `inset ${-Math.round(size * .2)}px ${-Math.round(size * .2)}px 0 ${dark}, inset ${Math.round(size * .14)}px ${Math.round(size * .14)}px 0 ${light}`;

// A flat ring with depth: the back half is drawn before the body, the front half after it.
function Ring({ size, color, back, tilt = -14 }: { size: number; color: string; back: string; tilt?: number }) {
  const style = { width: size * 1.9, height: size * .46, borderWidth: Math.max(4, Math.round(size * .09)), transform: `translate(-50%, -50%) rotate(${tilt}deg)` };
  return <><span className="sm-ring sm-ring-back" style={{ ...style, borderColor: back }} /><span className="sm-ring-slot" /><span className="sm-ring sm-ring-front" style={{ ...style, borderColor: color }} /></>;
}

// Blocky pixel art for each celestial body, built from CSS blocks.
function Body({ trial }: { trial: Trial }) {
  const s = trial.size;
  switch (trial.id) {
    case 'sun': return <>
      <span className="sm-ray sm-ray-h sm-pulse" /><span className="sm-ray sm-ray-v sm-pulse" />
      <span className="sm-orb" style={{ background: '#ff8a2a', boxShadow: shade(s, '#c94a16', '#ffc06a') }} />
      <span className="sm-core" style={{ width: s * .4, height: s * .4, background: '#fff1a8', boxShadow: 'inset -5px -5px 0 #ffd36a' }} />
    </>;
    case 'venus': return <span className="sm-orb" style={{ background: 'repeating-linear-gradient(170deg, #f5dcc8 0 8px, #e9c3ad 8px 14px)', boxShadow: shade(s, '#b98a72', '#fff3e8') }} />;
    case 'gaia': return <span className="sm-orb" style={{ background:
      'linear-gradient(#78cc4f, #78cc4f) 22% 24% / 34% 22% no-repeat, linear-gradient(#78cc4f, #78cc4f) 62% 66% / 30% 26% no-repeat, linear-gradient(#ffffff, #ffffff) 70% 14% / 22% 8% no-repeat, #2f6fd0',
      boxShadow: shade(s, '#1c4790', '#7fb0ff') }} />;
    case 'moon': return <>
      <span className="sm-orb" style={{ background: '#c6a2ff', boxShadow: `inset ${-Math.round(s * .36)}px 0 0 #4a2d8c, inset 3px 3px 0 #f3e6ff` }} />
      <span className="sm-spot" style={{ left: '22%', top: '30%', width: s * .2, height: s * .2, background: '#a27ee8' }} />
    </>;
    case 'jupiter': return <>
      <span className="sm-orb" style={{ background: 'repeating-linear-gradient(180deg, #e0a36a 0 9px, #b9713f 9px 15px, #f2cf9a 15px 20px)', boxShadow: shade(s, '#7a4322', '#ffe2b8') }} />
      <span className="sm-spot" style={{ left: '56%', top: '56%', width: s * .22, height: s * .13, background: '#c8452f', boxShadow: 'inset -3px -3px 0 #8f2b1c' }} />
    </>;
    case 'saturn': return <>
      <Ring size={s} color="#c4f3e8" back="#5fb3a2" />
      <span className="sm-orb" style={{ background: 'repeating-linear-gradient(180deg, #68e0c9 0 8px, #4fb9a5 8px 13px)', boxShadow: shade(s, '#2a7c6d', '#c4f7ec') }} />
    </>;
    case 'neptune': return <>
      <span className="sm-orb" style={{ background: '#3f78e8', boxShadow: shade(s, '#1f3e9a', '#9fc0ff') }} />
      <span className="sm-spot" style={{ left: '30%', top: '42%', width: s * .24, height: s * .14, background: '#1b2f78' }} />
    </>;
    case 'sirius': return <>
      <span className="sm-ray sm-ray-h sm-pulse" style={{ background: '#fff6b0' }} /><span className="sm-ray sm-ray-v sm-pulse" style={{ background: '#fff6b0' }} />
      <span className="sm-diamond" style={{ width: s * .56, height: s * .56, background: '#ffe45c', boxShadow: 'inset -6px -6px 0 #c99d1f, inset 4px 4px 0 #fff8c8' }} />
    </>;
    case 'binary': return <>
      <span className="sm-twin-link" />
      <span className="sm-twin sm-orbit-a" style={{ left: '0%', top: '34%', width: s * .5, height: s * .5, background: '#ff8f7a', boxShadow: shade(s * .5, '#b8452f', '#ffd0c4') }} />
      <span className="sm-twin sm-orbit-b" style={{ left: '56%', top: '6%', width: s * .38, height: s * .38, background: '#83cfff', boxShadow: shade(s * .38, '#3f7fb8', '#d8f1ff') }} />
    </>;
    case 'singularity': return <>
      <Ring size={s} color="#ece7ff" back="#8a86a6" tilt={-10} />
      <span className="sm-orb" style={{ background: '#050508', boxShadow: 'inset 0 0 0 3px #bcbccd, inset 0 0 0 7px #1a1826' }} />
    </>;
  }
}

export default function CelestialTrialsMap() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => Math.max(0, TRIALS.findIndex(t => t.ready)));
  const [notReady, setNotReady] = useState<{ name: string; key: number } | null>(null);
  useEffect(() => { if (!notReady) return; const timer = setTimeout(() => setNotReady(null), 1600); return () => clearTimeout(timer); }, [notReady]);
  const ready = TRIALS.map((t, i) => t.ready ? i : -1).filter(i => i >= 0);
  useEffect(() => { setQuery(window.location.search); }, []);
  const trial = TRIALS[selected], skill = trialSkill(trial);

  const select = useCallback((index: number) => {
    if (!TRIALS[index].ready) { playUiSfx('locked'); setNotReady({ name: TRIALS[index].name, key: Date.now() }); return; }
    setSelected(current => { if (current !== index) playUiSfx('page'); return index; });
  }, []);
  const begin = useCallback(() => {
    playUiSfx('ascension');
    setTimeout(() => router.push(`/ruby-star/challenge/${TRIALS[selected].id}${query}`), 180);
  }, [router, query, selected]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const at = ready.indexOf(selected);
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); select(ready[(at + 1) % ready.length]); }
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); select(ready[(at - 1 + ready.length) % ready.length]); }
      else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) begin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, select, begin, ready]);

  return (
    <main className="ruby-star-ui sm-page">
      <style>{`
        body:has(.ruby-star-ui)::after { display: none; }
        .sm-page { min-height: 100vh; box-sizing: border-box; padding: 20px 24px 32px; color: #e7e9f6;
          background: radial-gradient(circle at 20% 50%, #3a1a10 0%, transparent 35%), radial-gradient(circle at 85% 80%, #14142a 0%, transparent 40%), #06070d; }
        .sm-stars { position: fixed; inset: 0; pointer-events: none; opacity: .6;
          background-image: radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#9fb6ff 1px, transparent 1px), radial-gradient(#ffd6e6 1px, transparent 1px);
          background-size: 83px 79px, 131px 127px, 197px 173px; background-position: 7px 19px, 53px 3px, 101px 67px; }
        .sm-inner { position: relative; max-width: 1200px; margin: 0 auto; }
        .sm-title { margin: 16px 0 2px; text-align: center; font-family: var(--font-pixel); font-size: clamp(1.4rem, 3.4vw, 2.2rem); letter-spacing: .1em;
          color: #c9cfff; text-shadow: 0 0 16px #7f8cff88, 3px 3px 0 #1a1d3a; }
        .sm-sub { text-align: center; font-family: var(--font-mono); font-size: .78rem; letter-spacing: .28em; color: #8d93b3; margin: 0 0 10px; }
        .sm-map { position: relative; width: 100%; aspect-ratio: 16 / 7.4; border: 2px solid #262c48; background: #0a0c18cc; overflow: hidden; }
        .sm-route { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; filter: drop-shadow(0 0 3px #7f8cff); }
        .sm-node { position: absolute; transform: translate(-50%, -50%); padding: 0; background: none; border: 0; cursor: pointer; color: inherit; font: inherit;
          filter: drop-shadow(0 0 10px var(--glow)); transition: filter 160ms ease, transform 160ms ease; }
        .sm-node:hover, .sm-node:focus-visible { outline: none; filter: drop-shadow(0 0 18px var(--glow)); transform: translate(-50%, -50%) scale(1.08); }
        .sm-art { position: relative; display: block; width: var(--s); height: var(--s); animation: smFloat 3.2s ease-in-out infinite; animation-delay: var(--delay); }
        @keyframes smFloat { 0%, 100% { translate: 0 0; } 50% { translate: 0 -5px; } }
        .sm-pulse { animation: smRays 2.4s ease-in-out infinite; }
        @keyframes smRays { 0%, 100% { opacity: .65; } 50% { opacity: 1; } }
        .sm-twin-link { position: absolute; left: 22%; top: 30%; width: 56%; height: 34%; border-top: 2px dashed #ffffff55; transform: rotate(-30deg); }
        .sm-orbit-a { animation: smBob 2.6s ease-in-out infinite; } .sm-orbit-b { animation: smBob 2.6s ease-in-out infinite reverse; }
        @keyframes smBob { 0%, 100% { translate: 0 0; } 50% { translate: 0 3px; } }
        .sm-spark { position: absolute; width: 10px; height: 10px; pointer-events: none; animation: smTwinkle 2.2s ease-in-out infinite;
          background: linear-gradient(#ffffff, #ffffff) 50% 0 / 2px 100% no-repeat, linear-gradient(#ffffff, #ffffff) 0 50% / 100% 2px no-repeat; }
        @keyframes smTwinkle { 0%, 100% { opacity: .15; transform: scale(.5); } 50% { opacity: .9; transform: scale(1); } }
        .sm-orb { position: absolute; inset: 0; z-index: 1; clip-path: polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%); }
        .sm-core { position: absolute; left: 50%; top: 50%; z-index: 1; transform: translate(-50%, -50%);
          clip-path: polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%); }
        .sm-spot { position: absolute; z-index: 2; }
        .sm-ray { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: #ffcf5a; }
        .sm-ray-h { width: 150%; height: 6px; } .sm-ray-v { width: 6px; height: 150%; }
        .sm-diamond { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(45deg); }
        .sm-twin { position: absolute; }
        .sm-ring { position: absolute; left: 50%; top: 50%; box-sizing: border-box; border-style: solid; }
        .sm-ring-back { clip-path: inset(0 0 50% 0); }
        .sm-ring-front { clip-path: inset(50% 0 0 0); z-index: 2; }
        .sm-ring-slot { display: none; }
        .sm-label { position: absolute; left: 50%; top: calc(100% + 10px); transform: translateX(-50%); white-space: nowrap;
          font-family: var(--font-pixel); font-size: 9px; letter-spacing: .08em; color: #8d93b3; }
        .sm-node[aria-pressed="true"] .sm-label { color: var(--glow); }
        .sm-select { position: absolute; left: 50%; top: 50%; width: calc(var(--s) + 26px); height: calc(var(--s) + 26px); transform: translate(-50%, -50%);
          pointer-events: none; animation: smPulse 1.2s ease-in-out infinite; background:
          linear-gradient(var(--glow), var(--glow)) 0 0 / 14px 3px no-repeat, linear-gradient(var(--glow), var(--glow)) 0 0 / 3px 14px no-repeat,
          linear-gradient(var(--glow), var(--glow)) 100% 0 / 14px 3px no-repeat, linear-gradient(var(--glow), var(--glow)) 100% 0 / 3px 14px no-repeat,
          linear-gradient(var(--glow), var(--glow)) 0 100% / 14px 3px no-repeat, linear-gradient(var(--glow), var(--glow)) 0 100% / 3px 14px no-repeat,
          linear-gradient(var(--glow), var(--glow)) 100% 100% / 14px 3px no-repeat, linear-gradient(var(--glow), var(--glow)) 100% 100% / 3px 14px no-repeat; }
        @keyframes smPulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
        .sm-panel { display: flex; align-items: center; gap: 24px; margin-top: 16px; padding: 16px 20px; background: #10131ff2;
          border: 2px solid var(--glow); box-shadow: 0 0 16px color-mix(in srgb, var(--glow) 30%, transparent); }
        .sm-panel-name { font-family: var(--font-pixel); font-size: 1rem; line-height: 1.6; color: var(--glow); }
        .sm-panel-row { margin-top: 4px; font-family: var(--font-mono); font-size: .85rem; color: #b9bdd6; }
        .sm-panel-row strong { color: #e7e9f6; }
        .sm-panel-note { margin-top: 6px; font-family: var(--font-mono); font-size: .75rem; color: #7d84a3; }
        .sm-begin { margin-left: auto; padding: 14px 20px; font-family: var(--font-pixel); font-size: .8rem; cursor: pointer; white-space: nowrap;
          color: #0b0c14; background: var(--glow); border: 2px solid #ffffffaa; box-shadow: 0 0 14px color-mix(in srgb, var(--glow) 50%, transparent); }
        .sm-begin:hover, .sm-begin:focus-visible { outline: none; filter: brightness(1.12); box-shadow: 0 0 22px var(--glow); }
        /* EXIT stands out against the dark map: brighter frame, panel fill and a soft glow (overrides the shared button's inline style). */
        .sm-exit button { padding: 12px 22px !important; font-size: 1rem !important; gap: 10px !important; color: #e7e9f6 !important; background: #161b36 !important;
          border: 2px solid #7f8cff !important; border-radius: 0 !important; box-shadow: 0 0 12px #7f8cff55; }
        .sm-exit button:hover, .sm-exit button:focus-visible { outline: none; color: #ffffff !important; background: #222a52 !important; border-color: #c9cfff !important; box-shadow: 0 0 18px #7f8cffaa; }
        .sm-node.sm-locked { filter: grayscale(1) brightness(.45); }
        .sm-node.sm-locked:hover, .sm-node.sm-locked:focus-visible { filter: grayscale(1) brightness(.6); transform: translate(-50%, -50%); }
        .sm-node.sm-locked .sm-art { animation: none; }
        .sm-lock { position: absolute; left: 50%; top: 50%; z-index: 3; width: 14px; height: 11px; transform: translate(-50%, -30%); background: #c9cde0;
          box-shadow: inset -3px -3px 0 #7d84a3; }
        .sm-lock::before { content: ''; position: absolute; left: 3px; top: -7px; width: 8px; height: 8px; box-sizing: border-box; border: 2px solid #c9cde0; border-bottom: 0; }
        .sm-toast { position: absolute; left: 50%; bottom: 18px; z-index: 5; transform: translateX(-50%); padding: 10px 16px; font-family: var(--font-pixel); font-size: .7rem;
          letter-spacing: .08em; color: #ffd6d6; background: #1a0f16f2; border: 2px solid #c75b6b; box-shadow: 0 0 14px #c75b6b55; animation: smToast 1.6s ease forwards; }
        @keyframes smToast { 0%, 80% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>
      <div className="sm-stars" aria-hidden="true" />
      <div className="sm-inner">
        <div className="sm-exit"><BackButton href={'/ruby-star' + query} playSound={() => playUiSfx('back')} arrow={<PixelArrow direction="left" />} /></div>
        <h1 className="sm-title">CELESTIAL CHALLENGE</h1>
        <p className="sm-sub">CHOOSE A WORLD</p>
        <div className="sm-map" role="group" aria-label="Star map">
          <svg className="sm-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={TRIALS.map(t => `${t.x},${t.y}`).join(' ')} fill="none" stroke="#5a64a0" strokeWidth=".35" strokeDasharray="1.2 1.2" vectorEffect="non-scaling-stroke" />
          </svg>
          {[[6, 14], [19, 86], [38, 12], [58, 88], [66, 10], [80, 44], [97, 12], [44, 54], [24, 46], [76, 90]].map(([x, y], i) =>
            <span key={'spark' + i} className="sm-spark" aria-hidden="true" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * .53}s` }} />)}
          {TRIALS.map((body, i) => {
            const glow = trialSkill(body).color === '#303036' ? '#bcbccd' : trialSkill(body).color;
            return (
              <button key={body.id} type="button" className={'sm-node' + (body.ready ? '' : ' sm-locked')} aria-pressed={i === selected} aria-label={`Challenge: ${body.name}${body.ready ? '' : ' (not ready)'}`}
                style={{ left: `${body.x}%`, top: `${body.y}%`, ['--glow' as string]: glow, ['--s' as string]: `${body.size}px`, ['--delay' as string]: `${-i * .37}s` }}
                onMouseEnter={() => playUiSfx('hover')} onFocus={() => { if (body.ready) select(i); }}
                onClick={() => i === selected ? begin() : select(i)}>
                <span className="sm-art"><Body trial={body} /></span>
                {!body.ready && <span className="sm-lock" aria-hidden="true" />}
                {i === selected && <span className="sm-select" aria-hidden="true" />}
                <span className="sm-label" style={{ top: `calc(100% + ${body.id === 'sun' || body.id === 'sirius' ? Math.round(body.size * .3) + 10 : 18}px)` }}>{body.name}</span>
              </button>
            );
          })}
          {notReady && <div key={notReady.key} className="sm-toast" role="status">{notReady.name} · CHALLENGE NOT READY</div>}
        </div>
        <section className="sm-panel" aria-live="polite" style={{ ['--glow' as string]: skill.color === '#303036' ? '#bcbccd' : skill.color }}>
          <div>
            <div className="sm-panel-name">CHALLENGE: {trial.name}</div>
            <div className="sm-panel-row">Guardian: <strong>{trialBossName(trial)}</strong> · Celestial skill: <strong>{skill.name}</strong></div>
          </div>
          <button type="button" className="sm-begin" onMouseEnter={() => playUiSfx('hover')} onClick={begin}>BEGIN CHALLENGE ▶</button>
        </section>
      </div>
    </main>
  );
}
