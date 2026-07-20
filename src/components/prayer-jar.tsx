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

const FLOAT_ANIMS = ['light-float-a', 'light-float-b', 'light-float-c'];
const SIZES = [10, 12, 14, 16, 18, 20, 22, 24];

type JarSize = 'sm' | 'md' | 'lg';

/**
 * @deprecated `mode` is retained for API compatibility with existing callers.
 * The clay vessel is lights-only; `mode='slips'` silently collapses to the
 * lights rendering. Will be removed once call sites are swept (Sprint 23+).
 */
type JarMode = 'lights' | 'slips';

type SizeDim = {
  rimW: number;
  rimH: number;
  bodyW: number;
  bodyH: number;
  overflowW: number;
  overflowH: number;
  innerHighlightW: number;
  innerHighlightH: number;
  suppressThrowingLines: boolean;
  suppressMidWarmMottle: boolean;
  intensifyWarm: boolean;
};

const SIZE_DIMS: Record<JarSize, SizeDim> = {
  sm: {
    rimW: 100, rimH: 16, bodyW: 170, bodyH: 210,
    overflowW: 120, overflowH: 40,
    innerHighlightW: 12, innerHighlightH: 72,
    suppressThrowingLines: true,
    suppressMidWarmMottle: true,
    intensifyWarm: false,
  },
  md: {
    rimW: 150, rimH: 22, bodyW: 260, bodyH: 320,
    overflowW: 180, overflowH: 70,
    innerHighlightW: 20, innerHighlightH: 140,
    suppressThrowingLines: false,
    suppressMidWarmMottle: false,
    intensifyWarm: false,
  },
  lg: {
    rimW: 170, rimH: 26, bodyW: 300, bodyH: 370,
    overflowW: 210, overflowH: 82,
    innerHighlightW: 24, innerHighlightH: 162,
    suppressThrowingLines: false,
    suppressMidWarmMottle: false,
    intensifyWarm: true,
  },
};

type OverflowLevel = { base: number; peak: number };

function overflowLevel(count: number): OverflowLevel {
  if (count <= 0) return { base: 0, peak: 0 };
  if (count <= 2) return { base: 0.10, peak: 0.15 };
  if (count <= 8) return { base: 0.30, peak: 0.45 };
  if (count <= 19) return { base: 0.50, peak: 0.75 };
  if (count <= 29) return { base: 0.65, peak: 0.90 };
  return { base: 0.80, peak: 1.00 };
}

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
    // NOTE: --primary is stored as a full oklch(...) expression, so we cannot
    // write oklch(var(--primary) / α) — that nests invalidly. Use color-mix for
    // alpha, and var(--primary) directly at full opacity.
    background:
      'radial-gradient(circle at 35% 35%, var(--primary) 0%, color-mix(in oklch, var(--primary) 60%, transparent) 50%, transparent 70%)',
    boxShadow:
      '0 0 12px 4px color-mix(in oklch, var(--primary) 50%, transparent), 0 0 30px 8px color-mix(in oklch, var(--primary) 20%, transparent)',
    animation: `${floatAnim} ${floatDur}s ease-in-out infinite ${delay}s, light-pulse ${pulseDur}s ease-in-out infinite ${delay * 0.7}s`,
  };
}

function rimStyle(dims: SizeDim): React.CSSProperties {
  return {
    position: 'relative',
    width: dims.rimW,
    height: dims.rimH,
    // Overlap body top by 6px so rim + body read as one piece.
    marginBottom: -6,
    zIndex: 2,
    borderRadius: '50% / 50%',
    background:
      'linear-gradient(180deg,' +
      ' oklch(var(--clay-rim-hi)) 0%,' +
      ' oklch(var(--clay-rim-mid)) 15%,' +
      ' oklch(var(--clay-rim-lo)) 50%,' +
      ' oklch(var(--clay-rim-mid)) 85%,' +
      ' oklch(var(--clay-rim-hi)) 100%)',
    boxShadow: '0 2px 4px oklch(var(--clay-shadow) / var(--clay-shadow-a))',
  };
}

function rimMouthStyle(dims: SizeDim): React.CSSProperties {
  // Dark inner ellipse: the mouth of the vessel reads like looking into a jar.
  return {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: dims.rimW * 0.9,
    height: 8,
    borderRadius: '50%',
    background: 'oklch(var(--clay-rim-lo) / 0.80)',
    pointerEvents: 'none',
  };
}

function bodyStyle(dims: SizeDim): React.CSSProperties {
  // Alphas come from the per-theme --clay-*-a tokens (clay-vessel-spec §2);
  // intensifyWarm bumps the warm wash slightly above the theme base.
  const warmAlpha = dims.intensifyWarm
    ? 'calc(var(--clay-mottle-warm-a) + 0.05)'
    : 'var(--clay-mottle-warm-a)';
  const coolAlpha = 'var(--clay-mottle-cool-a)';
  const mottling = [
    `radial-gradient(ellipse at 22% 18%, oklch(var(--clay-mottle-warm) / ${warmAlpha}) 0%, transparent 35%)`,
    `radial-gradient(ellipse at 78% 30%, oklch(var(--clay-mottle-cool) / ${coolAlpha}) 0%, transparent 40%)`,
    dims.suppressMidWarmMottle
      ? null
      : `radial-gradient(ellipse at 35% 62%, oklch(var(--clay-mottle-warm) / var(--clay-mottle-warm-a)) 0%, transparent 30%)`,
    `radial-gradient(ellipse at 72% 78%, oklch(var(--clay-mottle-cool) / ${coolAlpha}) 0%, transparent 45%)`,
  ].filter(Boolean) as string[];

  const base =
    'linear-gradient(180deg,' +
    ' oklch(var(--clay-body-hi)) 0%,' +
    ' oklch(var(--clay-body-mid)) 40%,' +
    ' oklch(var(--clay-body-lo)) 100%)';

  return {
    position: 'relative',
    width: dims.bodyW,
    height: dims.bodyH,
    border: '1.5px solid oklch(var(--clay-edge))',
    borderRadius: '40% 40% 48% 48% / 16% 16% 58% 58%',
    // Stacked: mottle washes painted on top of the base gradient.
    backgroundImage: [...mottling, base].join(', '),
    boxShadow:
      'inset -14px 0 24px oklch(var(--clay-shadow) / var(--clay-shadow-a)),' +
      ' inset 14px 0 20px oklch(var(--clay-mottle-warm) / var(--clay-mottle-warm-a)),' +
      ' 0 8px 18px oklch(var(--clay-shadow) / var(--clay-shadow-a))',
    overflow: 'hidden',
  };
}

function throwingLinesStyle(): React.CSSProperties {
  // Horizontal throwing-line striations — a ::before via inline div.
  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage:
      'repeating-linear-gradient(180deg, transparent 0px, transparent 10px, oklch(var(--clay-throwing) / var(--clay-throwing-a)) 10px, oklch(var(--clay-throwing) / var(--clay-throwing-a)) 11px)',
    opacity: 1,
    zIndex: 0,
  };
}

function innerHighlightStyle(dims: SizeDim): React.CSSProperties {
  return {
    position: 'absolute',
    top: 16,
    left: 26,
    width: dims.innerHighlightW,
    height: dims.innerHighlightH,
    borderRadius: '50%',
    background:
      'linear-gradient(180deg, oklch(var(--clay-mottle-warm) / var(--clay-mottle-warm-a)) 0%, transparent 100%)',
    transform: 'rotate(-8deg)',
    pointerEvents: 'none',
    zIndex: 1,
  };
}

function overflowGlowStyle(dims: SizeDim, level: OverflowLevel): React.CSSProperties {
  return {
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: 'translateX(-50%)',
    width: dims.overflowW,
    height: dims.overflowH,
    background:
      'radial-gradient(ellipse at 50% 100%, color-mix(in oklch, var(--primary) 50%, transparent) 0%, color-mix(in oklch, var(--primary) 20%, transparent) 40%, transparent 70%)',
    filter: 'blur(10px)',
    pointerEvents: 'none',
    zIndex: 3,
    opacity: level.base,
    // CSS custom properties consumed by @keyframes clay-overflow-pulse.
    ['--overflow-base' as string]: level.base,
    ['--overflow-peak' as string]: level.peak,
    animation: 'clay-overflow-pulse 3.5s ease-in-out infinite',
  };
}

export function PrayerJar({
  count,
  size = 'md',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mode = 'lights',
  countLabel,
}: {
  count: number;
  size?: JarSize;
  /**
   * @deprecated Clay vessel is lights-only. `mode='slips'` silently collapses
   * to the lights rendering. Will be removed once call sites are swept.
   */
  mode?: JarMode;
  countLabel?: string;
}) {
  const dims = SIZE_DIMS[size];
  const lightCount = Math.min(count, 30);
  const level = overflowLevel(count);
  const showOverflow = count > 0;

  return (
    <div className="flex flex-col items-center">
      <div aria-hidden="true" className="relative flex flex-col items-center">
        {/* Overflow glow — sits above the rim, scaled to count. Hidden entirely when empty. */}
        {showOverflow && (
          <div className="clay-overflow-glow" style={overflowGlowStyle(dims, level)} />
        )}

        {/* Rim */}
        <div className="clay-rim" style={rimStyle(dims)}>
          <div style={rimMouthStyle(dims)} />
        </div>

        {/* Body */}
        <div className="clay-body" style={bodyStyle(dims)}>
          {!dims.suppressThrowingLines && <div style={throwingLinesStyle()} />}
          <div style={innerHighlightStyle(dims)} />

          {LIGHT_SLOTS.slice(0, lightCount).map((slot, i) => (
            <div key={i} className="prayer-jar-light" style={lightStyle(i, slot)} />
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
