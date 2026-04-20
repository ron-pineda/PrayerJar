import React from 'react';

/**
 * PrayerJarMark — 24x24 simplified silhouette of the clay vessel.
 *
 * Renders as a two-path SVG using `currentColor` so it inherits the surrounding
 * text color (works in any theme, any surface). A single amber dot inside the
 * body uses oklch(var(--primary)) — the only accent color on the mark.
 *
 * Intended for chrome-sized surfaces (nav, 404, error boundary, email header).
 * For hero-sized presentation use <PrayerJar>.
 */
export function PrayerJarMark({
  size = 20,
  className,
  title,
}: {
  size?: number;
  className?: string;
  /** Optional accessible label; when omitted the mark is aria-hidden. */
  title?: string;
}) {
  const labelled = typeof title === 'string' && title.length > 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
    >
      {/* Body — amphora silhouette: narrow shoulder, rounded base. */}
      <path
        d="M6 6 C6 10, 4 13, 4 16 C4 19.5, 7 21, 12 21 C17 21, 20 19.5, 20 16 C20 13, 18 10, 18 6 Z"
        fill="currentColor"
        fillOpacity="0.7"
      />
      {/* Rim — rounded rectangle across the top. */}
      <rect x="4" y="3" width="16" height="3" rx="1.5" fill="currentColor" />
      {/* Single amber light inside. */}
      <circle cx="12" cy="15" r="1.5" fill="oklch(var(--primary))" />
    </svg>
  );
}
