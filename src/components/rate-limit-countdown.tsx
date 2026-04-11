'use client';

import { useEffect, useState } from 'react';

interface RateLimitCountdownProps {
  retryAfterMs: number;
  onReady?: () => void;
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function RateLimitCountdown({ retryAfterMs, onReady }: RateLimitCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil(retryAfterMs / 1000));

  useEffect(() => {
    if (secondsLeft <= 0) {
      onReady?.();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, onReady]);

  if (secondsLeft <= 0) return null;

  return (
    <p className="text-sm text-muted-foreground">
      You&apos;re praying a lot — take a breath.{' '}
      <span className="font-medium text-foreground">
        Try again in {formatSeconds(secondsLeft)}
      </span>
    </p>
  );
}
