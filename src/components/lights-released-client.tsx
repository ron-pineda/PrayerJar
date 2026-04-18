'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LightsSky } from '@/components/lights-sky';
import { PraiseCard } from '@/components/praise-card';
import { ScrollReveal } from '@/components/scroll-reveal';
import { getFilteredPraisesAction } from '@/app/actions/praise.actions';

type Prayer = Awaited<ReturnType<typeof getFilteredPraisesAction>>[number];

type Period = 'week' | 'month' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

export function LightsReleasedClient({
  initialPrayers,
  category,
}: {
  initialPrayers: Prayer[];
  category?: string;
}) {
  const [period, setPeriod] = useState<Period>('month');
  const [prayers, setPrayers] = useState(initialPrayers);
  const [loading, setLoading] = useState(false);
  const initialCategoryRef = useRef(category);

  useEffect(() => {
    // Reuse initial server-fetched data only when both period and category are unchanged
    if (period === 'month' && category === initialCategoryRef.current) {
      setPrayers(initialPrayers);
      return;
    }

    setLoading(true);
    getFilteredPraisesAction(period, category)
      .then((result) => { setPrayers(result); })
      .catch(() => {/* ignore — loading will be cleared by finally */})
      .finally(() => { setLoading(false); });
  }, [period, category, initialPrayers]);

  return (
    <>
      <LightsSky count={prayers.length} />

      {/* Time filter */}
      <div className="flex gap-2 mb-8">
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
          <Button
            key={key}
            variant={period === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(key)}
            disabled={loading}
          >
            {label}
          </Button>
        ))}
      </div>

      {prayers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No answered prayers in this time period.</p>
          <p className="text-muted-foreground">
            Try a different filter or check back later!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {prayers.map((prayer, i) => (
            <ScrollReveal key={prayer.id} delay={Math.min(i, 5) * 80}>
              <div className="relative">
                <div className="animate-light-escape" style={{ animationDelay: `${Math.min(i, 5) * 0.08}s` }} />
                <PraiseCard prayer={prayer} />
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </>
  );
}
