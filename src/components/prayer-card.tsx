'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { markAnsweredAction, renewPrayerAction } from '@/app/actions/lifecycle.actions';
import type { Prayer } from '@/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { Share2 } from 'lucide-react';
import { PhotoUpload } from './photo-upload';

const CATEGORY_ICONS: Record<string, string> = {
  health: '🩺', family: '👨‍👩‍👧', financial: '💼', grief: '🕊️',
  gratitude: '🙏', guidance: '🧭', relationships: '❤️',
  work_career: '⚡', spiritual_growth: '✨', other: '📖',
};

const STATUS_COLORS: Record<Prayer['status'], string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  answered: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function PrayerCard({ prayer }: { prayer: Prayer }) {
  const icon = CATEGORY_ICONS[prayer.category] ?? '📖';
  const ago = formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true });

  const [showTestimony, setShowTestimony] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [localStatus, setLocalStatus] = useState<Prayer['status']>(prayer.status);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function handleMarkAnswered(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    if (imageUrl) formData.set('imageUrl', imageUrl);
    const result = await markAnsweredAction(formData);
    setPending(false);
    if (result.success) {
      setLocalStatus('answered');
      setShowTestimony(false);
      setImageUrl(null);
    } else {
      setError(result.error);
    }
  }

  async function handleRenew() {
    setPending(true);
    setError('');
    const formData = new FormData();
    formData.set('prayerId', prayer.id);
    const result = await renewPrayerAction(formData);
    setPending(false);
    if (!result.success) setError(result.error);
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl">{icon}</span>
          <Badge variant="secondary" className="capitalize">
            {prayer.category.replace('_', ' ')}
          </Badge>
          {prayer.isUrgent && (
            <Badge variant="destructive" className="text-xs">Urgent</Badge>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[localStatus]}`}>
            {localStatus}
          </span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{ago}</span>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">{prayer.content}</p>

        {prayer.imageUrl && (
          <img
            src={prayer.imageUrl}
            alt="Prayer photo"
            className="w-full h-48 object-cover rounded-lg"
            loading="lazy"
          />
        )}

        {prayer.suggestedVerse && (
          <p className="text-xs text-muted-foreground italic">✝️ {prayer.suggestedVerse}</p>
        )}

        <p className="text-xs text-muted-foreground">
          {prayer.prayerCount} {prayer.prayerCount === 1 ? 'person has' : 'people have'} prayed for this
        </p>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {localStatus === 'active' && (
          <div className="flex gap-2 flex-wrap pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTestimony((v) => !v)}
            >
              Mark as Answered
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRenew}
              disabled={pending}
            >
              {pending ? 'Renewing...' : 'Renew (30 days)'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/p/${prayer.id}`);
              }}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share Link
            </Button>
          </div>
        )}

        {showTestimony && localStatus === 'active' && (
          <form onSubmit={handleMarkAnswered} className="space-y-2 pt-1">
            <input type="hidden" name="prayerId" value={prayer.id} />
            <Textarea
              name="testimony"
              placeholder="Share how God answered this prayer... (optional)"
              rows={3}
              maxLength={2000}
            />
            <PhotoUpload url={imageUrl} onUpload={setImageUrl} onRemove={() => setImageUrl(null)} variant="warm" />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? 'Saving...' : 'Confirm Answered'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowTestimony(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {localStatus === 'answered' && prayer.testimony && (
          <div className="border-l-4 border-amber-400 pl-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Testimony</p>
            <p className="text-sm">{prayer.testimony}</p>
            {prayer.imageUrl && (
              <img
                src={prayer.imageUrl}
                alt="Testimony photo"
                className="w-full h-48 object-cover rounded-lg mt-2"
                loading="lazy"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
