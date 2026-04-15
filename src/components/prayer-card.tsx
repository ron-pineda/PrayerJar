'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { markAnsweredAction, renewPrayerAction, deletePrayerAction, updatePrayerAction } from '@/app/actions/lifecycle.actions';
import type { Prayer } from '@/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { Share2 } from 'lucide-react';
import { PhotoUpload } from './photo-upload';
import { VideoRecorder } from './video-recorder';
import { CelebrationAnimation } from './celebration-animation';
import { ExpandableText } from './expandable-text';
import { AdoptPrayerButton } from './adopt-prayer-button';

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

interface PrayerCardProps {
  prayer: Prayer;
  isAdopted?: boolean;
  adoptionCount?: number;
  showDelete?: boolean;
}

export function PrayerCard({ prayer, isAdopted = false, adoptionCount = 0, showDelete = false }: PrayerCardProps) {
  const icon = CATEGORY_ICONS[prayer.category] ?? '📖';
  const ago = formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true });

  const [showTestimony, setShowTestimony] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [localStatus, setLocalStatus] = useState<Prayer['status']>(prayer.status);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [countKey, setCountKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editContent, setEditContent] = useState(prayer.content);
  const [editUrgent, setEditUrgent] = useState(prayer.isUrgent);
  const [editAnonymous, setEditAnonymous] = useState(prayer.isAnonymous);
  const prevCountRef = useRef(prayer.prayerCount);

  useEffect(() => {
    if (prayer.prayerCount !== prevCountRef.current) {
      prevCountRef.current = prayer.prayerCount;
      setCountKey((k) => k + 1);
    }
  }, [prayer.prayerCount]);

  async function handleMarkAnswered(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    if (imageUrl) formData.set('imageUrl', imageUrl);
    if (videoUrl) {
      formData.set('videoUrl', videoUrl);
      formData.set('videoDurationSeconds', String(videoDurationSeconds ?? 0));
    }
    const result = await markAnsweredAction(formData);
    setPending(false);
    if (result.success) {
      setLocalStatus('answered');
      setShowTestimony(false);
      setImageUrl(null);
      setVideoUrl(null);
      setVideoDurationSeconds(null);
      setShowCelebration(true);
    } else {
      setError(result.error);
    }
  }

  async function handleEditSave() {
    setPending(true);
    setError('');
    const formData = new FormData();
    formData.set('prayerId', prayer.id);
    formData.set('content', editContent);
    formData.set('isUrgent', String(editUrgent));
    formData.set('isAnonymous', String(editAnonymous));
    const result = await updatePrayerAction(formData);
    setPending(false);
    if (result.success) setShowEdit(false);
    else setError(result.error);
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setPending(true);
    const formData = new FormData();
    formData.set('prayerId', prayer.id);
    const result = await deletePrayerAction(formData);
    setPending(false);
    if (result.success) setDeleted(true);
    else { setError(result.error); setConfirmDelete(false); }
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

  if (deleted) return null;

  return (
    <Card className="relative animate-card-entry transition-shadow duration-300 hover:shadow-amber-500/10 hover:shadow-lg">
      {showCelebration && (
        <CelebrationAnimation onComplete={() => setShowCelebration(false)} />
      )}
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl">{icon}</span>
          <Badge variant="secondary" className="capitalize">
            {prayer.category.replace('_', ' ')}
          </Badge>
          {prayer.isUrgent && (
            <Badge variant="destructive" className="text-xs">Urgent</Badge>
          )}
          {prayer.isAnonymous && (
            <Badge variant="outline" className="text-xs text-muted-foreground">Anonymous</Badge>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[localStatus]}`}>
            {localStatus}
          </span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{ago}</span>
      </CardHeader>

      <CardContent className="space-y-3">
        <ExpandableText text={prayer.content} maxLines={4} />

        {prayer.imageUrl && (
          <img
            src={prayer.imageUrl}
            alt="Prayer photo"
            className="w-full h-48 object-cover rounded-lg"
            loading="lazy"
          />
        )}

        {prayer.audioUrl && (
          <audio controls src={prayer.audioUrl} className="w-full mt-2" />
        )}

        {prayer.suggestedVerse && (
          <p className="text-xs text-muted-foreground italic">✝️ {prayer.suggestedVerse}</p>
        )}

        <p className="text-xs text-muted-foreground">
          <span key={countKey} className={countKey > 0 ? 'animate-count-flash inline-block' : 'inline-block'}>
            {prayer.prayerCount}
          </span>
          {' '}{prayer.prayerCount === 1 ? 'person has' : 'people have'} prayed for this
        </p>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {localStatus === 'active' && (
          <AdoptPrayerButton
            prayerId={prayer.id}
            initialAdopted={isAdopted}
            initialCount={adoptionCount}
          />
        )}

        {showEdit && localStatus === 'active' && (
          <div className="space-y-2 pt-1">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editUrgent} onChange={(e) => setEditUrgent(e.target.checked)} />
                Urgent
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editAnonymous} onChange={(e) => setEditAnonymous(e.target.checked)} />
                Anonymous
              </label>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEditSave} disabled={pending}>
                {pending ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowEdit(false); setEditContent(prayer.content); setEditUrgent(prayer.isUrgent); setEditAnonymous(prayer.isAnonymous); }} disabled={pending}>
                Cancel
              </Button>
            </div>
          </div>
        )}

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
              onClick={() => setShowEdit((v) => !v)}
            >
              Edit
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
            {showDelete && (
              confirmDelete ? (
                <>
                  <Button size="sm" variant="destructive" onClick={handleDelete} disabled={pending}>
                    {pending ? 'Deleting…' : 'Confirm delete'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={pending}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )
            )}
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
            <VideoRecorder
              url={videoUrl}
              onUpload={(url, secs) => { setVideoUrl(url); setVideoDurationSeconds(secs); }}
              onRemove={() => { setVideoUrl(null); setVideoDurationSeconds(null); }}
            />
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
