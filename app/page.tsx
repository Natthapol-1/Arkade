'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function playSound(path: string, volume = 0.45) {
  if (typeof window !== 'undefined') {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.play().catch(() => { });
  }
}

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    const bootTimer = setTimeout(() => setBooted(true), 800);
    const cardTimer = setTimeout(() => setShowCards(true), 1600);
    return () => {
      clearTimeout(bootTimer);
      clearTimeout(cardTimer);
    };
  }, []);

  const games = [
    {
      name: 'CipherCalc',
      path: '/ciphercalc',
      desc: 'Decrypt the equation',
      icon: '█',
      iconAnim: 'cursorBlink',
      iconScale: 1,
    },
    {
      name: 'Spectrum Snake',
      path: '/spectrum-snake',
      desc: 'Match colors by memory',
      icon: '◆',
      iconAnim: 'foodPulse',
      iconScale: 1.7,
    },
    {
      name: 'Outcast Gambit',
      path: '/outcast-gambit',
      desc: 'Hunt imposters on the board',
      icon: '♟',
      iconAnim: 'cursorBlink',
      iconScale: 1.5,
    },
  ];

  return (
    <div style={{
      height: '100dvh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-mono)',
      position: 'relative',
    }}>
      {/* Boot sequence overlay */}
      {!booted && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--void)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          gap: '16px',
        }}>
          <div style={{
            width: '200px',
            height: '2px',
            background: 'var(--border)',
            borderRadius: '1px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              background: 'var(--cyan)',
              boxShadow: '0 0 10px var(--cyan)',
              animation: 'bootBar 0.8s ease-out forwards',
              width: '0%',
            }} />
          </div>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--text-dim)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}>
            INITIALIZING SYSTEM...
          </p>
        </div>
      )}

      {/* Title block */}
      <div className={booted ? 'anim-boot' : ''} style={{
        textAlign: 'center',
        marginBottom: '48px',
        opacity: booted ? undefined : 0,
      }}>
        <h1 className="anim-breathe" style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          color: 'var(--text)',
          letterSpacing: '0.15em',
          marginBottom: '12px',
          position: 'relative',
        }}>
          ARKADE
        </h1>

        {/* Animated underline */}
        <div style={{
          width: '80px',
          height: '2px',
          background: 'var(--border)',
          margin: '0 auto 16px',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '1px',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
            animation: 'sweepLine 3s ease-in-out infinite',
          }} />
        </div>

        <p style={{
          fontSize: '0.55rem',
          textTransform: 'uppercase',
          letterSpacing: '0.35em',
          color: 'var(--text-dim)',
        }}>
          Terminal Console v2.0 // SYSTEM ONLINE
        </p>
      </div>

      {/* Game cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '16px',
        width: '100%',
        maxWidth: '420px',
        opacity: showCards ? 1 : 0,
        transform: showCards ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 600ms ease',
      }}>
        {games.map((game, index) => (
          <Link href={game.path} key={game.name} style={{ textDecoration: 'none' }} onClick={() => playSound('/sounds/gameModeClick.mp3')}>
            <div
              className="game-card"
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            >
              <div style={{
                width: '2.4rem',
                height: '2.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div className="game-card-icon" style={{
                  fontSize: `${2 * game.iconScale}rem`,
                  lineHeight: 1,
                  animation: `${game.iconAnim} 1.5s step-end infinite`,
                }}>
                  {game.icon}
                </div>
              </div>
              <div className="game-card-title">{game.name}</div>
              <div className="game-card-desc">{game.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '48px',
        fontSize: '0.5rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.3em',
        opacity: showCards ? 1 : 0,
        transition: 'opacity 600ms ease 400ms',
      }}>
        SELECT PROGRAM TO EXECUTE
      </div>

      {/* Boot bar animation style */}
      <style jsx>{`
        @keyframes bootBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
