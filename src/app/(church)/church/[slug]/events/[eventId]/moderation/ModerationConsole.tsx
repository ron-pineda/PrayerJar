'use client';

import { useEffect, useRef, useState } from 'react';

interface EventPrayer {
  id: string;
  content: string;
  submitterName: string | null;
  isAnonymous: boolean;
  category: string | null;
  createdAt: string;
  status: string;
}

interface Props {
  eventId: string;
  churchSlug: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  healing: 'Healing',
  guidance: 'Guidance',
  praise: 'Praise',
  family: 'Family',
  financial: 'Financial',
  relationships: 'Relationships',
  salvation: 'Salvation',
  other: 'Other',
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ModerationConsole({ eventId, churchSlug }: Props) {
  const [prayers, setPrayers] = useState<EventPrayer[]>([]);
  const [status, setStatus] = useState<'connecting' | 'live' | 'reconnecting'>('connecting');
  const [actioning, setActioning] = useState<Set<string>>(new Set());
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      setStatus('connecting');
      const es = new EventSource(`/api/v1/sse/event/${eventId}`);
      esRef.current = es;

      es.onopen = () => setStatus('live');

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { type: string; prayers: EventPrayer[] };
          if (data.type === 'pending') {
            setPrayers(data.prayers);
          }
        } catch {
          // malformed frame — ignore
        }
      };

      es.onerror = () => {
        setStatus('reconnecting');
        es.close();
        retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      esRef.current?.close();
    };
  }, [eventId]);

  async function act(prayerId: string, newStatus: 'approved' | 'spotlighted' | 'hidden') {
    setActioning((prev) => new Set(prev).add(prayerId));
    try {
      await fetch(`/api/v1/events/${eventId}/prayers/${prayerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      // Remove from pending queue regardless of exact response
      setPrayers((prev) => prev.filter((p) => p.id !== prayerId));
    } finally {
      setActioning((prev) => {
        const next = new Set(prev);
        next.delete(prayerId);
        return next;
      });
    }
  }

  return (
    <div>
      {/* Connection status */}
      <div className="flex items-center gap-2 mb-6">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            status === 'live'
              ? 'bg-green-500'
              : status === 'reconnecting'
              ? 'bg-yellow-400 animate-pulse'
              : 'bg-gray-400 animate-pulse'
          }`}
        />
        <span className="text-sm font-medium capitalize">
          {status === 'live' ? 'Live' : status === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
        </span>
      </div>

      {prayers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground text-sm">
          No pending prayers — you&apos;re all caught up.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {prayers.map((prayer) => {
            const busy = actioning.has(prayer.id);
            return (
              <li
                key={prayer.id}
                className="rounded-lg border bg-card p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed flex-1">{prayer.content}</p>
                  {prayer.category && (
                    <span className="shrink-0 text-xs rounded-full bg-muted px-2.5 py-0.5 font-medium capitalize">
                      {CATEGORY_LABEL[prayer.category] ?? prayer.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {prayer.isAnonymous ? 'Anonymous' : (prayer.submitterName ?? 'Unknown')}
                    {' · '}
                    {formatTime(prayer.createdAt)}
                  </span>

                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() => act(prayer.id, 'approved')}
                      className="rounded-md px-3 py-1.5 text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => act(prayer.id, 'spotlighted')}
                      className="rounded-md px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 disabled:opacity-50 transition-colors"
                    >
                      Spotlight
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => act(prayer.id, 'hidden')}
                      className="rounded-md px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
