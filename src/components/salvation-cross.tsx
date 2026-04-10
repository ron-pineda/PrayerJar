'use client';

import React from 'react';

const ORB_SLOTS = [
  { top: 8, left: 25 }, { top: 5, left: 50 }, { top: 8, left: 72 },
  { top: 18, left: 15 }, { top: 15, left: 40 }, { top: 12, left: 62 },
  { top: 20, left: 80 }, { top: 28, left: 30 }, { top: 25, left: 55 },
  { top: 22, left: 75 }, { top: 35, left: 20 }, { top: 32, left: 45 },
  { top: 38, left: 68 }, { top: 30, left: 85 }, { top: 42, left: 35 },
];

const FLOAT_ANIMS = ['light-float-a', 'light-float-b', 'light-float-c'];
const SIZES = [8, 9, 10, 11, 12];
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function orbStyle(index: number, slot: { top: number; left: number }): React.CSSProperties {
  const floatAnim = FLOAT_ANIMS[index % FLOAT_ANIMS.length];
  const floatDur = 2.5 + (index * 0.18) % 1.3;
  const pulseDur = 1.6 + (index * 0.21) % 0.8;
  const delay = (index * 0.43) % 2;
  const size = SIZES[index % SIZES.length];

  return {
    position: 'absolute',
    top: `${slot.top}%`,
    left: `${slot.left}%`,
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, rgba(255,220,120,1), rgba(212,168,67,0.6) 50%, transparent 70%)',
    boxShadow: '0 0 8px 2px rgba(212,168,67,0.5), 0 0 20px 4px rgba(212,168,67,0.2)',
    animation: `${floatAnim} ${floatDur}s ease-in-out infinite ${delay}s, light-pulse ${pulseDur}s ease-in-out infinite ${delay * 0.7}s`,
  };
}

export function SalvationCross({ count }: { count: number }) {
  const orbCount = Math.max(3, Math.min(count, 15));

  return (
    <div
      className="relative overflow-hidden rounded-xl w-full mb-6"
      style={{
        background: 'linear-gradient(180deg, #04040a 0%, #080814 60%, #0c0c1a 100%)',
        minHeight: 280,
        maxWidth: 500,
      }}
      aria-hidden="true"
    >
      {/* Light rays from cross center */}
      {RAY_ANGLES.map((angle) => (
        <div
          key={angle}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 2,
            height: 90,
            background: 'linear-gradient(to top, rgba(212,168,67,0.5), transparent)',
            transformOrigin: 'top center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
          }}
        />
      ))}
      {/* Cross vertical bar */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 8,
          height: 120,
          background: 'rgba(212,168,67,0.9)',
          boxShadow: '0 0 30px 8px rgba(212,168,67,0.3)',
          borderRadius: 4,
        }}
      />
      {/* Cross horizontal bar */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, calc(-50% - 16px))',
          width: 80,
          height: 8,
          background: 'rgba(212,168,67,0.9)',
          boxShadow: '0 0 30px 8px rgba(212,168,67,0.3)',
          borderRadius: 4,
        }}
      />
      {/* Floating orbs */}
      {ORB_SLOTS.slice(0, orbCount).map((slot, i) => (
        <div key={i} className="prayer-jar-light" style={orbStyle(i, slot)} />
      ))}
    </div>
  );
}
