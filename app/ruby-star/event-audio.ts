import type { AmbientEventKind } from './events';

type Stage = 'warning' | 'active' | 'charge' | 'collect';
type Layer = readonly [file: string, gain: number, rate: number, seconds: number];
const cues: Record<AmbientEventKind, Partial<Record<Stage, readonly Layer[]>>> = {
  blackhole: {
    warning: [['celestial/solar-flare-swoosh.wav', .35, 1, 1.6]],
    active: [['reverse.mp3', .22, 1, 1.2]],
  },
  shootingStar: {
    warning: [['light.mp3', .32, 1.25, 1.4]],
    active: [['celestial/solar-flare-swoosh.wav', .35, 1.5, 1.2]],
    collect: [['celestial/energy-pickup.wav', .4, 1.2, 1.2]],
  },
  eclipse: {
    warning: [['celestial/skill-ready.wav', .3, .65, 3]],
    active: [['seaDive.mp3', .28, .65, 4.8]],
  },
  supernova: {
    warning: [['kingFireSpell.mp3', .35, .65, 2.4]],
    active: [['celestial/solar-flare.wav', .45, .75, 1.8], ['celestial/solar-flare-swoosh.wav', .4, .85, 1.5]],
    charge: [['celestial/solar-flare-swoosh.wav', .4, 1, 3]],
  },
};
const voices = new Set<HTMLAudioElement>();
const fadingVoices = new Map<HTMLAudioElement, { gain: number; ticks: number }>();
type RepeatKind = 'blackhole' | 'eclipse';
const repeaters: Record<RepeatKind, { voices: Set<HTMLAudioElement>; lastAge: number | null; interval: number; limit: number }> = {
  blackhole: { voices: new Set(), lastAge: null, interval: 21, limit: 4 },
  eclipse: { voices: new Set(), lastAge: null, interval: 120, limit: 3 },
};
let paused = false;

function releaseVoice(voice: HTMLAudioElement) {
  voice.pause(); voices.delete(voice); fadingVoices.delete(voice);
  for (const repeat of Object.values(repeaters)) repeat.voices.delete(voice);
  voice.onended = voice.ontimeupdate = voice.onerror = null;
}

export function pauseAmbientEventSounds() {
  if (paused) return;
  paused = true;
  for (const voice of voices) voice.pause();
}

export function resumeAmbientEventSounds() {
  if (!paused || (typeof document !== 'undefined' && document.hidden)) return;
  paused = false;
  for (const voice of voices) voice.play().catch(() => releaseVoice(voice));
}

export function syncAmbientEventLoop(kind: AmbientEventKind | undefined, age = 0) {
  for (const [voice, fade] of fadingVoices) {
    if (--fade.ticks <= 0) releaseVoice(voice);
    else voice.volume = fade.gain * (fade.ticks / 24) ** 2;
  }
  for (const key of Object.keys(repeaters) as RepeatKind[]) {
    const repeat = repeaters[key];
    if (key === kind) {
      if (repeat.lastAge === null || age < repeat.lastAge || age - repeat.lastAge >= repeat.interval) {
        playAmbientEventSound(key, 'active'); repeat.lastAge = age;
      }
    } else {
      for (const voice of repeat.voices) {
        fadingVoices.set(voice, { gain: voice.volume, ticks: 24 });
        repeat.voices.delete(voice);
      }
      repeat.lastAge = null;
    }
  }
}

export function stopAmbientEventSounds() {
  for (const voice of voices) { releaseVoice(voice); voice.currentTime = 0; }
  for (const repeat of Object.values(repeaters)) repeat.lastAge = null;
  paused = false;
}

export function playAmbientEventSound(kind: AmbientEventKind, stage: Stage) {
  if (typeof Audio === 'undefined' || (typeof document !== 'undefined' && document.hidden)) return;
  const repeat = stage === 'active' && (kind === 'blackhole' || kind === 'eclipse') ? repeaters[kind] : null;
  if (repeat) {
    repeat.lastAge ??= 0;
    if (repeat.voices.size >= repeat.limit) releaseVoice(repeat.voices.values().next().value!);
  }
  for (const [file, gain, rate, seconds] of cues[kind][stage] ?? []) {
    try {
      const voice = new Audio('/sounds/' + file);
      if (repeat) repeat.voices.add(voice);
      voice.volume = gain; voice.playbackRate = rate; voice.preservesPitch = false;
      const release = () => releaseVoice(voice);
      voice.onended = voice.onerror = release;
      voice.ontimeupdate = () => {
        const remaining = seconds - voice.currentTime / rate;
        if (remaining <= 0) release();
        else if (repeat && remaining < .25 && !fadingVoices.has(voice)) voice.volume = gain * (remaining / .25) ** 2;
      };
      voices.add(voice); if (!paused) voice.play().catch(release);
    } catch { /* Audio permission/device errors must not interrupt gameplay. */ }
  }
}
