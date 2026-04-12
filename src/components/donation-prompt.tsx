'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type DonationPromptProps = {
  onDismiss?: () => void;
};

export function DonationPrompt({ onDismiss }: DonationPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div className="relative rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm dark:border-amber-400/20 dark:bg-amber-400/5">
      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>

      <p className="font-medium text-foreground pr-6">
        PrayerJar is free, but not free to run.
      </p>
      <p className="mt-1 text-muted-foreground leading-relaxed">
        If this app has blessed you, consider supporting it.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          render={<Link href="/give?amount=5" />}
        >
          Give $5
        </Button>
        <Button
          size="sm"
          variant="outline"
          render={<Link href="/give?amount=10" />}
        >
          Give $10
        </Button>
      </div>
    </div>
  );
}
