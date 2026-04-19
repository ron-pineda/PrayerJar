'use client';

import React, { useEffect } from 'react';

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

const SLIP_SLOTS = [
  { left: 12, bottom: 10, rotate: -12 }, { left: 40, bottom: 15, rotate: 6 },
  { left: 64, bottom: 8, rotate: -4 },  { left: 22, bottom: 38, rotate: 10 },
  { left: 55, bottom: 35, rotate: -8 }, { left: 30, bottom: 58, rotate: 4 },
  { left: 68, bottom: 62, rotate: -14 },{ left: 12, bottom: 68, rotate: 7 },
  { left: 47, bottom: 80, rotate: -6 }, { left: 75, bottom: 75, rotate: 9 },
];

const FLOAT_ANIMS = ['light-float-a', 'light-float-b', 'light-float-c'];
const SIZES = [10, 12, 14, 16, 18, 20, 22, 24];

type JarSize = 'sm' | 'md' | 'lg';
type JarMode = 'lights' | 'slips';

const SIZE_DIMS: Record<JarSize, {
  neckW: string; neckH: number; bodyW: string; bodyH: string;
}> = {
  sm: { neckW: '60px',             neckH: 18, bodyW: '100px',           bodyH: '120px' },
  md: { neckW: 'min(200px, 52vw)', neckH: 55, bodyW: 'min(350px, 90vw)', bodyH: 'min(450px, 115vw)' },
  lg: { neckW: 'min(210px, 54vw)', neckH: 58, bodyW: 'min(370px, 91vw)', bodyH: 'min(470px, 116vw)' },
};

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

function SlipItem({ slot, index }: { slot: typeof SLIP_SLOTS[0]; index: number }) {
  const w = 26 + (index % 3) * 4;
  const h = 16 + (index % 3) * 2;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${slot.left}%`,
        bottom: `${slot.bottom}%`,
        width: w,
        height: h,
        borderRadius: 2,
        background: 'rgba(254,243,199,0.88)',
        transform: `rotate(${slot.rotate}deg)`,
      }}
    >
      <div style={{ position: 'absolute', top: 3, left: 4, right: 4 }}>
        <div style={{ height: 1.5, background: 'rgba(120,80,20,0.3)', borderRadius: 1, marginBottom: 2.5 }} />
        <div style={{ height: 1.5, background: 'rgba(120,80,20,0.2)', borderRadius: 1, width: '70%' }} />
      </div>
    </div>
  );
}

export function PrayerJar({
  count,
  size = 'md',
  mode = 'lights',
  countLabel,
}: {
  count: number;
  size?: JarSize;
  mode?: JarMode;
  countLabel?: string;
}) {
  const dims = SIZE_DIMS[size];
  const lightCount = Math.min(count, 30);
  const slipCount = Math.min(count, SLIP_SLOTS.length);

  return (
    <div className="flex flex-col items-center">
      <div aria-hidden="true" className="flex flex-col items-center">
        <div
          style={{
            width: dims.neckW,
            height: dims.neckH,
            border: '2.5px solid rgba(212,168,67,0.5)',
            borderBottom: 'none',
            borderRadius: '12px 12px 0 0',
            background: 'rgba(255,255,255,0.02)',
          }}
        />
        <div
          style={{
            position: 'relative',
            width: dims.bodyW,
            height: dims.bodyH,
            border: '2.5px solid rgba(212,168,67,0.5)',
            borderTop: 'none',
            borderRadius: '0 0 80px 80px',
            background: 'rgba(10,10,20,0.8)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 24, left: 22, width: 28, height: 110, background: 'rgba(255,255,255,0.05)', borderRadius: 14, transform: 'rotate(-8deg)' }} />
          <div style={{ position: 'absolute', top: 16, right: 36, width: 14, height: 55, background: 'rgba(255,255,255,0.03)', borderRadius: 7, transform: 'rotate(5deg)' }} />

          {mode === 'lights' && LIGHT_SLOTS.slice(0, lightCount).map((slot, i) => (
            <div key={i} className="prayer-jar-light" style={lightStyle(i, slot)} />
          ))}

          {mode === 'slips' && SLIP_SLOTS.slice(0, slipCount).map((slot, i) => (
            <SlipItem key={i} slot={slot} index={i} />
          ))}
        </div>
      </div>

      {countLabel && (
        <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
          {countLabel}
        </p>
      )}
    </div>
  );
}

export function SlipDropAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      onComplete();
    }
  }, [onComplete]);

  return (
    <div
      className="animate-slip-drop"
      style={{
        position: 'fixed',
        top: '28vh',
        left: '50%',
        width: 36,
        height: 22,
        borderRadius: 2,
        background: 'rgba(254,243,199,0.92)',
        zIndex: 100,
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      onAnimationEnd={onComplete}
    />
  );
}
