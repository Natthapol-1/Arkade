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
  src: string;
  volume?: number;
}

const BGMController = forwardRef<BGMControllerHandle, BGMControllerProps>(
  ({ src, volume = 0.1 }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
    }, [volume]);

    useImperativeHandle(ref, () => ({
      toggleMusic,
      playMusic,
      pauseMusic,
      isPlaying,
    }));

    const toggleMusic = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
      }
    };

    const playMusic = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    };

    const pauseMusic = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 200,
      }}>
        <audio ref={audioRef} loop src={src} />
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
