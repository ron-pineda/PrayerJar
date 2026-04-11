'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { submitPrayerAction } from '@/app/actions/prayer.actions';
import { CrisisResources } from './crisis-resources';
import { PhotoUpload } from './photo-upload';
import { SubmissionPrompt } from './submission-prompt';
import { RateLimitCountdown } from './rate-limit-countdown';

export function PrayerForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [retryAfterMs, setRetryAfterMs] = useState<number | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [content, setContent] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('isAnonymous', String(isAnonymous));
    formData.set('isUrgent', String(isUrgent));
    if (imageUrl) formData.set('imageUrl', imageUrl);

    const result = await submitPrayerAction(formData);
    setPending(false);

    if (result.success) {
      onSuccess?.(result.prayerId);
      (e.target as HTMLFormElement).reset();
      setContent('');
      setImageUrl(null);
    } else if (result.selfHarm) {
      setShowCrisis(true);
    } else if (result.rateLimited && result.retryAfterMs) {
      setRetryAfterMs(result.retryAfterMs);
    } else {
      setError(result.error);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="content">Your prayer request</Label>
          {content === '' && (
            <SubmissionPrompt onSelect={setContent} />
          )}
          <Textarea
            id="content"
            name="content"
            placeholder="Share what's on your heart..."
            rows={5}
            required
            minLength={10}
            maxLength={1000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <PhotoUpload
          url={imageUrl}
          onUpload={setImageUrl}
          onRemove={() => setImageUrl(null)}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label htmlFor="anonymous">Keep me anonymous</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="urgent" checked={isUrgent} onCheckedChange={setIsUrgent} />
            <Label htmlFor="urgent">Urgent</Label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {retryAfterMs !== null && (
          <RateLimitCountdown
            retryAfterMs={retryAfterMs}
            onReady={() => setRetryAfterMs(null)}
          />
        )}

        <Button type="submit" disabled={pending || retryAfterMs !== null} className="w-full">
          {pending ? 'Submitting...' : 'Add to the Prayer Jar'}
        </Button>
      </form>

      <CrisisResources open={showCrisis} onClose={() => setShowCrisis(false)} />
    </>
  );
}
