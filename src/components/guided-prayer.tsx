'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { prayForRequestAction } from '@/app/actions/interaction.actions';
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

  async function handlePrayed() {
    setPending(true);
    const formData = new FormData();
    formData.set('prayerId', prayer.id);
    formData.set('isAnonymous', String(isAnonymous));
    const result = await prayForRequestAction(formData);
    setPending(false);

    if (result.success) {
      setStage('message');
    } else {
      setError(result.error);
    }
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

  if (stage === 'done') {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-lg font-medium">Thank you for praying! 🙏</p>
        <p className="text-muted-foreground">Your encouragement has been delivered.</p>
        <ShareButtons
          url={`/p/${prayer.id}`}
          text="I just prayed for someone on Prayer Jar. Will you join me?"
          variant="bar"
        />
        <Button onClick={onPrayForAnother}>Pray for Another</Button>
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
          <p className="text-lg leading-relaxed">{prayer.content}</p>
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

          <Button onClick={handlePrayed} disabled={pending} size="lg" className="mt-4 active:animate-pray-ripple">
            {pending ? 'Recording...' : 'I Prayed for This 🙏'}
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
                onClick={() => setStage('done')}
              >
                Skip
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
