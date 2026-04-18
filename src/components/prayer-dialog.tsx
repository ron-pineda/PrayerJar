'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PrayerForm } from '@/components/prayer-form';
import { SlipDropAnimation } from '@/components/prayer-jar';

export function PrayerDialog() {
  const [open, setOpen] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const router = useRouter();

  function handleSuccess(_id: string) {
    setShowDrop(true);
  }

  function handleDropComplete() {
    setShowDrop(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {showDrop && <SlipDropAnimation onComplete={handleDropComplete} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="lg" />}>
          Add a Prayer Request
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share your prayer request</DialogTitle>
          </DialogHeader>
          <PrayerForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
