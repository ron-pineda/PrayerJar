'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Mood = 'struggling' | 'okay' | 'better' | 'breakthrough';

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'struggling', label: 'Struggling', emoji: '😔' },
  { value: 'okay',       label: 'Okay',       emoji: '🙂' },
  { value: 'better',     label: 'Better',     emoji: '😊' },
  { value: 'breakthrough', label: 'Breakthrough', emoji: '🎉' },
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface CheckInPulseProps {
  prayerId: string;
  prayerCreatedAt: Date;
}

type UIState = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

export function CheckInPulse({ prayerId, prayerCreatedAt }: CheckInPulseProps) {
  const [uiState, setUiState] = useState<UIState>('idle');
  // Tracks which mood button was clicked (for visual feedback)
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  // Don't render at all if <7 days old
  const isOldEnough = Date.now() - new Date(prayerCreatedAt).getTime() >= SEVEN_DAYS_MS;

  // Suppress on client if already submitted (localStorage hydration)
  const storageKey = `checkin_${prayerId}`;
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAlreadySubmitted(localStorage.getItem(storageKey) === 'done');
    }
  }, [storageKey]);

  if (!isOldEnough || alreadySubmitted) return null;

  async function handleMoodClick(mood: Mood) {
    if (uiState === 'loading') return;
    setSelectedMood(mood);
    setUiState('loading');

    try {
      const res = await fetch('/api/v1/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prayerId, mood }),
      });

      if (res.ok) {
        localStorage.setItem(storageKey, 'done');
        setUiState('success');
      } else if (res.status === 409) {
        localStorage.setItem(storageKey, 'done');
        setUiState('duplicate');
      } else {
        setUiState('error');
        setSelectedMood(null);
      }
    } catch {
      setUiState('error');
      setSelectedMood(null);
    }
  }

  // --- Success / duplicate / error states replace the card ---
  if (uiState === 'success') {
    return (
      <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/30">
        <CardContent className="pt-5 pb-5 text-center">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Thank you for sharing. We&apos;re praying for you. 🙏
          </p>
        </CardContent>
      </Card>
    );
  }

  if (uiState === 'duplicate') {
    return (
      <Card className="bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/30">
        <CardContent className="pt-5 pb-5 text-center">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            You&apos;ve already shared how you&apos;re doing 💙
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/40 border-muted/60">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            A little while has passed since you shared your prayer request.
          </p>
          <p className="text-sm text-muted-foreground">
            How are you doing today?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MOODS.map(({ value, label, emoji }) => (
            <Button
              key={value}
              variant="outline"
              size="lg"
              onClick={() => handleMoodClick(value)}
              disabled={uiState === 'loading'}
              className={[
                'flex flex-col gap-1 h-auto min-h-[56px] py-3 text-sm font-medium',
                'transition-all duration-150',
                selectedMood === value && uiState === 'loading'
                  ? 'opacity-60 scale-95'
                  : 'hover:bg-amber-50/60 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700',
              ].join(' ')}
              aria-label={label}
            >
              <span className="text-xl leading-none">{emoji}</span>
              <span>{label}</span>
            </Button>
          ))}
        </div>

        {uiState === 'error' && (
          <p className="text-center text-xs text-destructive">
            Something went wrong. Please try again.
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Anonymous — your name is never attached to this.
        </p>
      </CardContent>
    </Card>
  );
}
