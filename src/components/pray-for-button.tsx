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
    const formData = new FormData();
    formData.set('prayerId', prayerId);
    formData.set('isAnonymous', 'true');
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
          <Check className="h-5 w-5 mr-2" />
          Prayer Sent
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
        <HandHeart className="h-5 w-5 mr-2" />
        {pending ? 'Praying...' : 'Pray for This Person'}
      </Button>
      <p className="text-sm text-muted-foreground">
        {count} {count === 1 ? 'person has' : 'people have'} prayed for this
      </p>
    </div>
  );
}
