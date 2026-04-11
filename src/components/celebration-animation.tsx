'use client';

import { useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  distance: number;
  duration: number;
  size: number;
}

const COLORS = [
  '#f59e0b',
  '#fbbf24',
  '#fcd34d',
  '#fde68a',
  '#fff7ed',
  '#fdba74',
  '#f97316',
  '#fef3c7',
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50,
    y: 50,
    color: COLORS[i % COLORS.length],
    angle: (i / count) * 360,
    distance: 40 + Math.random() * 35,
    duration: 1200 + Math.random() * 600,
    size: 4 + Math.random() * 5,
  }));
}

const particles = generateParticles(18);

export function CelebrationAnimation({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      <style>{`
        @keyframes burst {
          0% {
            transform: translate(-50%, -50%) translate(0px, 0px) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(0.2);
            opacity: 0;
          }
        }
      `}</style>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.distance;
        const dy = Math.sin(rad) * p.distance;
        return (
          <span
            key={p.id}
            style={
              {
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: p.color,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
                animation: `burst ${p.duration}ms ease-out forwards`,
                boxShadow: `0 0 4px ${p.color}`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
