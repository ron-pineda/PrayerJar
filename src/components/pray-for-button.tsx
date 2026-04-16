'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HandHeart, Check } from 'lucide-react';
import { prayForRequestAction } from '@/app/actions/interaction.actions';

type Props = {
  prayerId: string;
  initialCount: number;
};

export function PrayForButton({ prayerId, initialCount }: Props) {
  const [prayed, setPrayed] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handlePray() {
    if (prayed || pending) return;
    setPending(true);

    // Optionally collect geolocation — never blocks the pray action
    let latitude: number | null = null;
    let longitude: number | null = null;
    const country: string | null =
      Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1] ?? null;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // Fuzz to ±0.5° for region-level privacy
            latitude = pos.coords.latitude + (Math.random() - 0.5);
            longitude = pos.coords.longitude + (Math.random() - 0.5);
            resolve();
          },
          () => resolve(), // denied or error — proceed without geo
          { enableHighAccuracy: false, timeout: 5000 },
        );
      });
    }

    const formData = new FormData();
    formData.set('prayerId', prayerId);
    formData.set('isAnonymous', 'true');
    if (latitude !== null) formData.set('latitude', String(latitude));
    if (longitude !== null) formData.set('longitude', String(longitude));
    if (country) formData.set('country', country);

    const result = await prayForRequestAction(formData);
    setPending(false);
    if (result.success) {
      setPrayed(true);
      setCount((c) => c + 1);
    }
  }

  if (prayed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button size="lg" className="w-full" disabled>
          <Check className="h-5 w-5 mr-2" aria-hidden="true" />
          I Prayed for This
        </Button>
        <p className="text-sm text-muted-foreground">
          {count} {count === 1 ? 'person has' : 'people have'} prayed for this
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button size="lg" className="w-full" onClick={handlePray} disabled={pending}>
        <HandHeart className="h-5 w-5 mr-2" aria-hidden="true" />
        {pending ? 'Praying...' : 'Pray for This Request'}
      </Button>
      <p className="text-sm text-muted-foreground">
        {count} {count === 1 ? 'person has' : 'people have'} prayed for this
      </p>
    </div>
  );
}
