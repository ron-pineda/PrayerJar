'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PostEventCta } from '@/components/event/post-event-cta';

interface EventPrayer {
  id: string;
  content: string;
  submitterName: string | null;
  isAnonymous: boolean;
  category: string | null;
  createdAt: string;
  status: string;
}

interface Event {
  id: string;
  name: string;
  status: string;
  displayMode: string | null;
  churchName: string | null;
  churchSlug: string | null;
}

type DisplayMode = 'stream' | 'spotlight' | 'category';

const REFRESH_INTERVAL = 5;

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
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StreamView({ prayers }: { prayers: EventPrayer[] }) {
  if (prayers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No approved prayers yet.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {prayers.map((p) => (
        <li key={p.id} className="rounded-lg border bg-card p-4">
          <p className="text-sm leading-relaxed mb-2">{p.content}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {p.isAnonymous ? 'Anonymous' : (p.submitterName ?? 'Unknown')}
            </span>
            {p.category && (
              <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">
                {CATEGORY_LABEL[p.category] ?? p.category}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{formatTime(p.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SpotlightView({ prayers }: { prayers: EventPrayer[] }) {
  const spotlighted = prayers.filter((p) => p.status === 'spotlighted');
  const latest = spotlighted[0];

  if (!latest) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-2xl text-muted-foreground font-light italic">
          Waiting for spotlight...
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center"
      style={{ color: '#d4a843' }}
    >
      <p className="text-4xl font-semibold leading-snug max-w-2xl">{latest.content}</p>
      <p className="mt-6 text-base text-muted-foreground">
        {latest.isAnonymous ? 'Anonymous' : (latest.submitterName ?? 'Unknown')}
      </p>
    </div>
  );
}

function CategoryView({ prayers }: { prayers: EventPrayer[] }) {
  const grouped = prayers.reduce<Record<string, EventPrayer[]>>((acc, p) => {
    const cat = p.category ?? 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categories = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No approved prayers yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map(([cat, catPrayers]) => (
        <div key={cat} className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium capitalize text-sm">
              {CATEGORY_LABEL[cat] ?? cat}
            </span>
            <span className="text-xs text-muted-foreground">{catPrayers.length}</span>
          </div>
          <ul className="flex flex-col gap-2">
            {catPrayers.slice(0, 3).map((p) => (
              <li key={p.id} className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {p.content}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function DisplayPage() {
  const params = useParams<{ slug: string; eventId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = params.slug;
  const eventId = params.eventId;

  const rawMode = searchParams.get('mode') as DisplayMode | null;
  const mode: DisplayMode = rawMode === 'spotlight' || rawMode === 'category' ? rawMode : 'stream';

  const [prayers, setPrayers] = useState<EventPrayer[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [updatingMode, setUpdatingMode] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrayers = useCallback(async () => {
    try {
      // Fetch both approved and spotlighted prayers
      const [approvedRes, spotlightedRes] = await Promise.all([
        fetch(`/api/v1/events/${eventId}/prayers?status=approved&limit=50`),
        fetch(`/api/v1/events/${eventId}/prayers?status=spotlighted&limit=10`),
      ]);
      const results: EventPrayer[] = [];
      if (approvedRes.ok) {
        const data = await approvedRes.json() as { prayers?: EventPrayer[] };
        results.push(...(data.prayers ?? []));
      }
      if (spotlightedRes.ok) {
        const data = await spotlightedRes.json() as { prayers?: EventPrayer[] };
        results.push(...(data.prayers ?? []));
      }
      setPrayers(results);
    } catch {
      // retain last state on error
    }
  }, [eventId]);

  // One-time fetch on mount to get event metadata
  useEffect(() => {
    fetch(`/api/v1/events/${eventId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.event) setEvent(data.event); })
      .catch(() => {});
  }, [eventId]);

  // Initial load + polling
  useEffect(() => {
    fetchPrayers();

    const pollInterval = setInterval(() => {
      fetchPrayers();
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);

    // Countdown ticker
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : REFRESH_INTERVAL));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchPrayers]);

  function switchMode(newMode: DisplayMode) {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    router.replace(url.pathname + url.search);
  }

  async function updateDisplayMode() {
    setUpdatingMode(true);
    try {
      await fetch(`/api/v1/church/${slug}/events/${eventId}/display-mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
    } finally {
      setUpdatingMode(false);
    }
  }

  const approvedPrayers = prayers.filter((p) => p.status === 'approved');

  return (
    <div className="min-h-screen bg-background">
      {/* Operator top bar */}
      <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {event && (
            <>
              <span className="font-semibold text-sm">{event.name}</span>
              <span className="text-xs capitalize text-muted-foreground">{event.status}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switcher */}
          {(['stream', 'spotlight', 'category'] as DisplayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors
                ${mode === m
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                }`}
            >
              {m}
            </button>
          ))}

          <button
            onClick={updateDisplayMode}
            disabled={updatingMode}
            className="rounded-md px-3 py-1.5 text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors ml-2"
          >
            {updatingMode ? 'Saving...' : 'Update Display Mode'}
          </button>

          <span className="text-xs text-muted-foreground ml-2">
            Refreshing in {countdown}s
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {mode === 'stream' && <StreamView prayers={approvedPrayers} />}
        {mode === 'spotlight' && <SpotlightView prayers={prayers} />}
        {mode === 'category' && <CategoryView prayers={approvedPrayers} />}

        {event?.status === 'ended' && (
          <PostEventCta
            churchName={event.churchName ?? event.name}
            churchSlug={event.churchSlug ?? slug}
          />
        )}
      </div>
    </div>
  );
}
