// Synthesized sci-fi UI cues for Ruby Star menus (lobby and rule sheet). No audio files needed.
let ctx: AudioContext | null = null;
const UI_VOLUME = 5; // master boost for every menu cue

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

// One oscillator voice with a pitch sweep and a quick attack/decay envelope.
function blip(type: OscillatorType, from: number, to: number, start: number, dur: number, vol: number) {
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + start, osc = ac.createOscillator(), gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.min(.6, vol * UI_VOLUME), t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain); gain.connect(ac.destination);
  osc.start(t); osc.stop(t + dur + 0.02);
}

export type UiSfx = 'hover' | 'endless' | 'ascension' | 'locked' | 'page' | 'back' | 'close' | 'confirm' | 'teleport' | 'victory' | 'charged';

export function playUiSfx(kind: UiSfx) {
  switch (kind) {
    case 'hover': // tiny scanner tick
      blip('triangle', 2400, 1800, 0, .035, .035); break;
    case 'endless': // warp-in: rising sweep with a bright landing ping
      blip('sawtooth', 220, 880, 0, .16, .05); blip('square', 880, 880, .14, .09, .045); blip('triangle', 1760, 1320, .2, .14, .05); break;
    case 'ascension': // brighter three-note ascent with a shimmer
      blip('square', 523, 523, 0, .07, .04); blip('square', 784, 784, .07, .07, .04); blip('square', 1047, 1047, .14, .08, .045);
      blip('triangle', 2093, 2637, .2, .22, .04); break;
    case 'locked': // low denied buzz
      blip('square', 150, 110, 0, .09, .05); blip('square', 150, 110, .11, .09, .045); break;
    case 'page': // data-panel slide: full-bodied sweep up and a bright landing ping
      blip('square', 260, 1040, 0, .12, .07); blip('sawtooth', 520, 2080, 0, .12, .04); blip('triangle', 1600, 1600, .11, .09, .08); break;
    case 'back': // reverse slide: sweep down and a low landing ping
      blip('square', 1040, 260, 0, .12, .07); blip('sawtooth', 2080, 520, 0, .12, .04); blip('triangle', 800, 800, .11, .09, .08); break;
    case 'close': // power-down chirp
      blip('triangle', 1320, 440, 0, .12, .05); blip('square', 220, 160, .08, .06, .025); break;
    case 'teleport': // pad power-up: rising warble with a scanner shimmer
      blip('sine', 180, 720, 0, .22, .07); blip('triangle', 360, 1440, .04, .2, .04);
      blip('square', 1760, 2350, .18, .12, .03); blip('square', 2350, 1760, .27, .1, .025); break;
    case 'victory': // challenge fanfare: rising arpeggio, a held major chord and a high shimmer
      blip('square', 523, 523, 0, .11, .05); blip('square', 659, 659, .11, .11, .05); blip('square', 784, 784, .22, .11, .05);
      blip('square', 1047, 1047, .33, .55, .05); blip('triangle', 784, 784, .33, .55, .04); blip('triangle', 659, 659, .33, .55, .035);
      blip('sawtooth', 262, 262, .33, .5, .025); blip('triangle', 2093, 3136, .5, .4, .03); blip('triangle', 3136, 2093, .7, .35, .025); break;
    case 'charged': // a room strike is ready: bright rising chime with a sustained shimmer
      blip('square', 784, 784, 0, .08, .05); blip('square', 1175, 1175, .08, .08, .05); blip('square', 1568, 1568, .16, .18, .055);
      blip('triangle', 3136, 2637, .2, .35, .035); break;
    case 'confirm': // two-tone acknowledge
      blip('square', 988, 988, 0, .06, .04); blip('square', 1480, 1480, .06, .1, .045); break;
  }
}
