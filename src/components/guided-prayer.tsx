'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Flag } from 'lucide-react';
import { prayForRequestAction } from '@/app/actions/interaction.actions';
import { generateEncouragementAction } from '@/app/actions/ai.actions';
import { submitReportAction } from '@/app/actions/report.actions';
import type { Prayer } from '@/db/schema';
import { ShareButtons } from '@/components/share-buttons';

type Stage = 'reading' | 'prayed' | 'message' | 'done';

export function GuidedPrayer({
  prayer,
  onPrayForAnother,
}: {
  prayer: Prayer;
  onPrayForAnother: () => void;
}) {
  const [stage, setStage] = useState<Stage>('reading');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [encouragementLoading, setEncouragementLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  // Fetch AI encouragement when we reach the done stage
  useEffect(() => {
    if (stage !== 'done') return;
    if (!prayer.suggestedVerse) return;
    let cancelled = false;
    setEncouragementLoading(true);
    generateEncouragementAction(prayer.content, prayer.suggestedVerse)
      .then(({ encouragement: text }) => {
        if (!cancelled) setEncouragement(text);
      })
      .catch(() => {
        if (!cancelled)
          setEncouragement('Your prayer matters. Thank you for interceding for others.');
      })
      .finally(() => {
        if (!cancelled) setEncouragementLoading(false);
      });
    return () => { cancelled = true; };
  }, [stage, prayer.content, prayer.suggestedVerse]);

  async function handleReport(reason: string) {
    setReportOpen(false);
    const formData = new FormData();
    formData.set('prayerId', prayer.id);
    formData.set('reason', reason);
    await submitReportAction(formData);
    setReported(true);
  }

  // "I Prayed" is a local-only state change — no server call yet.
  // The interaction is created exactly once on the final submit (with or without a message).
  function handlePrayed() {
    setStage('message');
  }

  async function handleMessageSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set('prayerId', prayer.id);
    formData.set('isAnonymous', String(isAnonymous));
    const result = await prayForRequestAction(formData);
    setPending(false);

    if (result.success) setStage('done');
    else setError(result.error);
  }

  async function handleSkip() {
    setPending(true);
    const formData = new FormData();
    formData.set('prayerId', prayer.id);
    formData.set('isAnonymous', String(isAnonymous));
    const result = await prayForRequestAction(formData);
    setPending(false);

    if (result.success) setStage('done');
    else setError(result.error);
  }

  if (stage === 'done') {
    return (
      <div className="space-y-6 py-4 max-w-xl mx-auto">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Thank you for praying! 🙏</p>
          <p className="text-muted-foreground">Your encouragement has been delivered.</p>
        </div>

        {/* AI Encouragement card — only shown when a verse is available */}
        {prayer.suggestedVerse && (
          <Card className="bg-amber-50/70 dark:bg-amber-950/25 border-amber-200/70 dark:border-amber-800/40">
            <CardContent className="pt-5 pb-5 space-y-3">
              {encouragementLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                    {encouragement ?? 'Your prayer matters. Thank you for interceding for others.'}
                  </p>
                  <p className="text-xs text-amber-700/70 dark:text-amber-400/70 italic">
                    — {prayer.suggestedVerse}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <ShareButtons
          url={`/p/${prayer.id}`}
          text="I just prayed for someone on Prayer Jar. Will you join me?"
          variant="bar"
        />
        <div className="text-center">
          <Button onClick={onPrayForAnother}>Pray for Another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Prayer request */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-2">
            {prayer.isAnonymous ? 'Anonymous' : 'Someone'} is asking for prayer:
          </p>
          <p className="text-lg leading-relaxed animate-prayer-text-in">{prayer.content}</p>
          {prayer.isUrgent && (
            <span className="inline-block mt-3 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded">
              Urgent
            </span>
          )}
          {prayer.imageUrl && (
            <img
              src={prayer.imageUrl}
              alt="Prayer photo"
              className="w-full h-48 object-cover rounded-lg mt-4"
              loading="lazy"
            />
          )}

          {/* Report button — subtle, bottom-right */}
          <div className="flex justify-end mt-3">
            {reported ? (
              <span className="text-xs text-muted-foreground/60">Thanks for reporting</span>
            ) : reportOpen ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground mb-0.5">Why are you reporting this?</span>
                {[
                  { value: 'spam', label: 'Spam' },
                  { value: 'inappropriate', label: 'Inappropriate content' },
                  { value: 'not_a_prayer', label: 'Not a prayer request' },
                  { value: 'harassment', label: 'Harassment' },
                  { value: 'other', label: 'Other' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleReport(value)}
                    className="text-xs text-muted-foreground hover:text-foreground text-right"
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => setReportOpen(false)}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground mt-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                aria-label="Report this prayer"
              >
                <Flag className="h-3 w-3" />
                Report
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guided pause + scripture */}
      {stage === 'reading' && prayer.suggestedVerse && (
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-muted-foreground italic">
            Take a moment to pause and bring this before God.
          </p>
          <p className="text-sm font-medium">
            <span className="animate-candle">🕯</span> {prayer.suggestedVerse}
          </p>

          <div className="flex items-center justify-center gap-2 pt-4">
            <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label htmlFor="anon">Keep me anonymous</Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handlePrayed} size="lg" className="mt-4 active:animate-pray-ripple hover:animate-pray-ring transition-shadow">
            I Prayed for This 🙏
          </Button>
        </div>
      )}

      {/* Optional message */}
      {stage === 'message' && (
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            Want to leave an encouragement message?
          </p>
          <form onSubmit={handleMessageSubmit} className="space-y-3">
            <Textarea
              name="message"
              placeholder="Leave a short message of encouragement... (optional)"
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center gap-2">
              <Switch id="msg-anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <Label htmlFor="msg-anon">Keep me anonymous</Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? 'Sending...' : 'Send Message'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={handleSkip}
              >
                {pending ? 'Saving...' : 'Skip'}
              </Button>
            </div>
          </form>
          <Button variant="outline" onClick={onPrayForAnother} className="w-full">
            Pray for Another
          </Button>
        </div>
      )}
    </div>
  );
}
