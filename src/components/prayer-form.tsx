'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitPrayerAction } from '@/app/actions/prayer.actions';
import { CrisisResources } from './crisis-resources';
import { PhotoUpload } from './photo-upload';
import { AudioRecorder } from './audio-recorder';
import { SubmissionPrompt } from './submission-prompt';
import { RateLimitCountdown } from './rate-limit-countdown';

const CATEGORIES = [
  'general',
  'healing',
  'relationships',
  'grief',
  'finances',
  'guidance',
  'praise',
  'other',
] as const;

type Category = (typeof CATEGORIES)[number];

export function PrayerForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [retryAfterMs, setRetryAfterMs] = useState<number | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [griefLabel, setGriefLabel] = useState('');
  const [griefDate, setGriefDate] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('isAnonymous', String(isAnonymous));
    formData.set('isUrgent', String(isUrgent));
    if (imageUrl) formData.set('imageUrl', imageUrl);
    if (audioUrl) formData.set('audioUrl', audioUrl);

    const result = await submitPrayerAction(formData);
    setPending(false);

    if (result.success) {
      // If grief category and both grief fields are filled, save the anniversary date
      if (category === 'grief' && griefLabel.trim() && griefDate) {
        try {
          await fetch('/api/v1/grief-dates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prayerId: result.prayerId,
              label: griefLabel.trim(),
              anniversaryDate: griefDate,
            }),
          });
        } catch {
          // Non-blocking — grief date save failure should not block the prayer submission success
        }
      }

      onSuccess?.(result.prayerId);
      (e.target as HTMLFormElement).reset();
      setContent('');
      setImageUrl(null);
      setAudioUrl(null);
      setCategory('general');
      setGriefLabel('');
      setGriefDate('');
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

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" value={category} onValueChange={(v) => setCategory((v ?? 'general') as Category)}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {category === 'grief' && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              You can optionally save a date so we can send you a gentle remembrance each year.
            </p>
            <div className="space-y-2">
              <Label htmlFor="griefLabel">What are we remembering? <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="griefLabel"
                type="text"
                placeholder="e.g. Dad, Baby Emma, Our marriage"
                maxLength={255}
                value={griefLabel}
                onChange={(e) => setGriefLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="griefDate">Anniversary date <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="griefDate"
                type="date"
                value={griefDate}
                onChange={(e) => setGriefDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <PhotoUpload
          url={imageUrl}
          onUpload={setImageUrl}
          onRemove={() => setImageUrl(null)}
        />

        <AudioRecorder
          url={audioUrl}
          onUpload={setAudioUrl}
          onRemove={() => setAudioUrl(null)}
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
