'use client';

import {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef
} from 'react';

export interface BGMControllerHandle {
  toggleMusic: () => void;
  playMusic: () => void;
  pauseMusic: () => void;
  isPlaying: boolean;
}

interface BGMControllerProps {
  src: string | string[];
  volume?: number | number[];
  visible?: boolean;
}

const BGMController = forwardRef<BGMControllerHandle, BGMControllerProps>(
  ({ src, volume = 0.1, visible = true }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

    const srcs = Array.isArray(src) ? src : [src];
    const vols = Array.isArray(volume) ? volume : srcs.map(() => volume);

    useEffect(() => {
      audioRefs.current.forEach((a, i) => {
        if (a) a.volume = vols[i] ?? 0.1;
      });
    }, [volume]);

    useImperativeHandle(ref, () => ({
      toggleMusic,
      playMusic,
      pauseMusic,
      isPlaying,
    }));

    const toggleMusic = () => {
      if (isPlaying) {
        audioRefs.current.forEach(a => a?.pause());
      } else {
        audioRefs.current.forEach(a => a?.play().catch(() => {}));
      }
      setIsPlaying(!isPlaying);
    };

    const playMusic = () => {
      audioRefs.current.forEach(a => {
        a?.play().catch(() => {});
      });
      setIsPlaying(true);
    };

    const pauseMusic = () => {
      audioRefs.current.forEach(a => a?.pause());
      setIsPlaying(false);
    };

    return (
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 200,
        display: visible ? 'block' : 'none',
      }}>
        {srcs.map((s, i) => (
          <audio key={s} ref={el => { audioRefs.current[i] = el; }} loop src={s} />
        ))}
        <button
          onClick={toggleMusic}
          style={{
            background: 'linear-gradient(180deg, #1a1a28 0%, #0e0e18 100%)',
            border: `1px solid ${isPlaying ? 'var(--cyan-dim)' : 'var(--border)'}`,
            color: isPlaying ? 'var(--cyan)' : 'var(--text-dim)',
            padding: '8px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            boxShadow: isPlaying ? '0 0 10px rgba(0,212,255,0.15)' : 'none',
          }}
          aria-label={isPlaying ? 'Mute background music' : 'Play background music'}
        >
          {isPlaying ? '♪ ON' : '♪ OFF'}
        </button>
      </div>
    );
  }
);

BGMController.displayName = 'BGMController';

export default BGMController;
