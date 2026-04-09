'use client';

import React from 'react';

const LIGHT_SLOTS = [
  { left: 15, bottom: 14 }, { left: 40, bottom: 22 }, { left: 65, bottom: 11 },
  { left: 25, bottom: 39 }, { left: 54, bottom: 36 }, { left: 79, bottom: 30 },
  { left: 35, bottom: 56 }, { left: 60, bottom: 52 }, { left: 16, bottom: 67 },
  { left: 47, bottom: 72 }, { left: 77, bottom: 69 }, { left: 29, bottom: 83 },
  { left: 10, bottom: 45 }, { left: 72, bottom: 48 }, { left: 50, bottom: 15 },
  { left: 20, bottom: 28 }, { left: 82, bottom: 18 }, { left: 45, bottom: 44 },
  { left: 68, bottom: 60 }, { left: 12, bottom: 55 }, { left: 56, bottom: 78 },
  { left: 38, bottom: 65 }, { left: 75, bottom: 82 }, { left: 22, bottom: 76 },
  { left: 48, bottom: 90 }, { left: 85, bottom: 55 }, { left: 32, bottom: 10 },
  { left: 62, bottom: 88 }, { left: 8, bottom: 85 }, { left: 42, bottom: 50 },
];

const FLOAT_ANIMS = ['light-float-a', 'light-float-b', 'light-float-c'];
const SIZES = [10, 12, 14, 16, 18, 20, 22, 24];

function lightStyle(index: number, slot: { left: number; bottom: number }): React.CSSProperties {
  const floatAnim = FLOAT_ANIMS[index % FLOAT_ANIMS.length];
  const floatDur = 2.5 + (index * 0.13) % 1.3;
  const pulseDur = 1.6 + (index * 0.17) % 0.8;
  const delay = (index * 0.37) % 2;
  const size = SIZES[index % SIZES.length];

  return {
    position: 'absolute',
    left: `${slot.left}%`,
    bottom: `${slot.bottom}%`,
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, rgba(255,220,120,1), rgba(212,168,67,0.6) 50%, transparent 70%)',
    boxShadow: '0 0 12px 4px rgba(212,168,67,0.5), 0 0 30px 8px rgba(212,168,67,0.2)',
    animation: `${floatAnim} ${floatDur}s ease-in-out infinite ${delay}s, light-pulse ${pulseDur}s ease-in-out infinite ${delay * 0.7}s`,
  };
}

export function PrayerJar({ count }: { count: number }) {
  const lightCount = Math.min(count, 30);

  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      {/* Neck */}
      <div
        style={{
          width: 'min(200px, 52vw)',
          height: 55,
          border: '2.5px solid rgba(212,168,67,0.5)',
          borderBottom: 'none',
          borderRadius: '12px 12px 0 0',
          background: 'rgba(255,255,255,0.02)',
        }}
      />
      {/* Body */}
      <div
        style={{
          position: 'relative',
          width: 'min(350px, 90vw)',
          height: 'min(450px, 115vw)',
          border: '2.5px solid rgba(212,168,67,0.5)',
          borderTop: 'none',
          borderRadius: '0 0 80px 80px',
          background: 'rgba(10,10,20,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Glass shine highlights */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 22,
            width: 28,
            height: 110,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 14,
            transform: 'rotate(-8deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 36,
            width: 14,
            height: 55,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 7,
            transform: 'rotate(5deg)',
          }}
        />
        {/* Lights */}
        {LIGHT_SLOTS.slice(0, lightCount).map((slot, i) => (
          <div key={i} className="prayer-jar-light" style={lightStyle(i, slot)} />
        ))}
      </div>
    </div>
  );
}
