'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cancelSubscriptionAction, createCheckoutAction } from '@/app/actions/billing.actions';

// ---------------------------------------------------------------------------
// Cancel button — shown when the user has an active, non-cancelling sub
// ---------------------------------------------------------------------------
export function CancelSubscriptionButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleCancelClick() {
    setConfirming(true);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      if ('error' in result) {
        setError(result.error);
        setConfirming(false);
      }
      // On success, revalidatePath in the action refreshes the page
    });
  }

  function handleDismiss() {
    setConfirming(false);
    setError(null);
  }

  if (confirming) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Your access continues until the end of the billing period.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Cancelling…' : 'Confirm Cancel'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDismiss} disabled={isPending}>
            Keep Plan
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" onClick={handleCancelClick}>
        Cancel Subscription
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upgrade button — shown on plan cards for non-current paid plans
// ---------------------------------------------------------------------------
export function UpgradeButton({
  tier,
  billing,
  label,
  className,
}: {
  tier: string;
  billing: 'monthly' | 'yearly';
  label?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutAction(tier, billing);
      if ('error' in result) {
        setError(result.error);
      } else {
        router.push(result.url);
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        className={className}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? 'Redirecting…' : (label ?? 'Get Started')}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
