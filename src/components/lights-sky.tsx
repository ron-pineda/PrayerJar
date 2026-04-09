'use client';

import React from 'react';

const SKY_SLOTS = [
  { top: 30, left: 10 }, { top: 38, left: 35 }, { top: 25, left: 60 }, { top: 42, left: 80 },
  { top: 18, left: 50 }, { top: 55, left: 15 }, { top: 48, left: 70 }, { top: 22, left: 25 },
  { top: 60, left: 45 }, { top: 35, left: 90 }, { top: 50, left: 5 }, { top: 28, left: 75 },
  { top: 45, left: 55 }, { top: 65, left: 30 }, { top: 15, left: 40 }, { top: 58, left: 85 },
  { top: 40, left: 20 }, { top: 32, left: 65 }, { top: 52, left: 50 }, { top: 20, left: 8 },
  { top: 62, left: 72 }, { top: 36, left: 42 }, { top: 46, left: 88 }, { top: 26, left: 58 },
  { top: 56, left: 28 }, { top: 44, left: 12 }, { top: 34, left: 78 }, { top: 68, left: 48 },
  { top: 24, left: 92 }, { top: 54, left: 62 }, { top: 16, left: 18 }, { top: 64, left: 82 },
  { top: 42, left: 38 }, { top: 30, left: 52 }, { top: 58, left: 8 }, { top: 48, left: 68 },
  { top: 22, left: 45 }, { top: 66, left: 22 }, { top: 38, left: 58 }, { top: 50, left: 78 },
];

const STAR_POSITIONS = [
  { top: 8, left: 15 }, { top: 12, left: 70 }, { top: 5, left: 45 }, { top: 20, left: 85 },
  { top: 15, left: 30 }, { top: 25, left: 60 }, { top: 3, left: 80 }, { top: 10, left: 52 },
  { top: 18, left: 10 }, { top: 7, left: 38 }, { top: 22, left: 72 }, { top: 14, left: 22 },
  { top: 28, left: 48 }, { top: 6, left: 65 }, { top: 30, left: 92 },
];

const FLOAT_ANIMS = ['light-float-a', 'light-float-b', 'light-float-c'];
const SIZES = [10, 12, 14, 16, 18, 20, 22];

function skyLightStyle(index: number, slot: { top: number; left: number }): React.CSSProperties {
  const floatAnim = FLOAT_ANIMS[index % FLOAT_ANIMS.length];
  const floatDur = 2.5 + (index * 0.15) % 1.3;
  const pulseDur = 1.6 + (index * 0.19) % 0.8;
  const delay = (index * 0.41) % 2;
  const size = SIZES[index % SIZES.length];

  return {
    position: 'absolute',
    top: `${slot.top}%`,
    left: `${slot.left}%`,
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, rgba(255,230,140,1), rgba(212,168,67,0.5) 50%, transparent 70%)',
    boxShadow: '0 0 10px 3px rgba(212,168,67,0.4), 0 0 25px 6px rgba(212,168,67,0.15)',
    animation: `${floatAnim} ${floatDur}s ease-in-out infinite ${delay}s, light-pulse ${pulseDur}s ease-in-out infinite ${delay * 0.7}s`,
  };
}

export function LightsSky({ count }: { count: number }) {
  const lightCount = Math.min(count, 40);

  return (
    <div
      className="relative overflow-hidden rounded-xl mb-8"
      style={{
        background: 'linear-gradient(180deg, #04040a 0%, #080814 50%, #0c0c1a 100%)',
        minHeight: 500,
      }}
      aria-hidden="true"
    >
      {/* Star dots */}
      {STAR_POSITIONS.map((star, i) => {
        const twinkleDur = 2.4 + (i * 0.3) % 1.6;
        const delay = (i * 0.5) % 2;
        const size = i % 2 === 0 ? 2 : 1;
        return (
          <div
            key={`star-${i}`}
            className="sky-star"
            style={{
              position: 'absolute',
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'white',
              animation: `star-twinkle ${twinkleDur}s ease-in-out infinite ${delay}s`,
            }}
          />
        );
      })}
      {/* Floating lights */}
      {SKY_SLOTS.slice(0, lightCount).map((slot, i) => (
        <div key={i} className="sky-light" style={skyLightStyle(i, slot)} />
      ))}
    </div>
  );
}
