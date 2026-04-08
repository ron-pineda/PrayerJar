'use client';

import { use, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GuidedPrayer } from '@/components/guided-prayer';
import { Button } from '@/components/ui/button';
import type { Prayer } from '@/db/schema';

async function fetchRandomPrayer(category: string, urgent?: string): Promise<Prayer | null> {
  const params = new URLSearchParams({ category });
  if (urgent) params.set('urgent', urgent);
  const res = await fetch(`/api/v1/prayers/random?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.prayer ?? null;
}

export default function PrayByCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ urgent?: string }>;
}) {
  const { category } = use(params);
  const { urgent } = use(searchParams);

  const router = useRouter();
  const [prayer, setPrayer] = useState<Prayer | null | 'loading' | 'empty'>('loading');

  // Kick off the fetch on first render via a resource pattern
  const [fetchKey, setFetchKey] = useState(0);

  // Use a simple approach: render a loader that fetches on mount
  const PrayerLoader = useCallback(() => {
    if (prayer === 'loading') {
      fetchRandomPrayer(category, urgent)
        .then((p) => setPrayer(p ?? 'empty'))
        .catch(() => setPrayer('empty'));
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  if (prayer === 'loading') {
    return (
      <>
        <PrayerLoader />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground animate-pulse">Finding a prayer request...</p>
        </div>
      </>
    );
  }

  if (prayer === 'empty' || prayer === null) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-lg font-medium">No prayer requests found in this category.</p>
        <p className="text-muted-foreground">Check back later or try another category.</p>
        <Button onClick={() => router.push('/pray')}>Back to Categories</Button>
      </div>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <GuidedPrayer
        prayer={prayer}
        onPrayForAnother={() => {
          setPrayer('loading');
          setFetchKey((k) => k + 1);
        }}
      />
      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={() => router.push('/pray')}>
          Change Category
        </Button>
      </div>
    </main>
  );
}
