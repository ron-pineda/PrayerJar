'use client';

import { useState, useEffect, useRef } from 'react';

export function PrayingNowCounter() {
  const [count, setCount] = useState<number>(0);
  const [connected, setConnected] = useState(false);
  const [displayed, setDisplayed] = useState<number>(0);
  const lastKnown = useRef<number>(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);

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
    function connect() {
      const es = new EventSource('/api/v1/sse/praying-now');
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { count: number };
          lastKnown.current = data.count;
          setCount(data.count);
        } catch {
          // Ignore malformed frames
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        // Keep showing last known count, reconnect after 5s
        retryTimeout.current = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      esRef.current?.close();
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span
        className={[
          'h-2 w-2 rounded-full flex-shrink-0',
          connected
            ? 'bg-green-500 animate-pulse'
            : 'bg-muted-foreground/40',
        ].join(' ')}
        aria-hidden="true"
      />
      <span>
        <span className="font-semibold tabular-nums text-foreground">{displayed}</span>
        {' '}
        {displayed === 1 ? 'person' : 'people'} praying now
      </span>
    </div>
  );
}
