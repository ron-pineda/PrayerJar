'use client';

import { useState, useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 30_000;

export function PrayingNowCounter() {
  const [count, setCount] = useState<number>(0);
  const [displayed, setDisplayed] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tween displayed value when count changes
  useEffect(() => {
    if (count === displayed) return;
    const start = displayed;
    const end = count;
    const duration = 600;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/v1/praying-now', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json() as { count: number };
          setCount(data.count);
        }
      } catch {
        // Keep last known count on network error
      }
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="h-2 w-2 rounded-full flex-shrink-0 bg-green-500 animate-pulse" aria-hidden="true" />
      <span>
        <span className="font-semibold tabular-nums text-foreground">{displayed}</span>
        {' '}
        {displayed === 1 ? 'person' : 'people'} praying now
      </span>
    </div>
  );
}
