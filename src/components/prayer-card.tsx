'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { markAnsweredAction, renewPrayerAction, deletePrayerAction, updatePrayerAction } from '@/app/actions/lifecycle.actions';
import { submitReportAction } from '@/app/actions/report.actions';
import type { Prayer } from '@/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { Share2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { CelebrationAnimation } from './celebration-animation';
import { ExpandableText } from './expandable-text';
import { AdoptPrayerButton } from './adopt-prayer-button';
import { PrayerCardMenu } from './prayer-card-menu';
import { PrayerEditDialog } from './prayer-edit-dialog';
import { PrayerTestimonyDialog } from './prayer-testimony-dialog';
import { PrayerDeleteDialog } from './prayer-delete-dialog';

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
  isOwnPrayer?: boolean;
}

export function PrayerCard({ prayer, isAdopted = false, adoptionCount = 0, showDelete = false, isOwnPrayer = false }: PrayerCardProps) {
  const icon = CATEGORY_ICONS[prayer.category] ?? '📖';
  const ago = formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [localStatus, setLocalStatus] = useState<Prayer['status']>(prayer.status);
  const [showCelebration, setShowCelebration] = useState(false);
  const [countKey, setCountKey] = useState(0);
  const [deleted, setDeleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [renewedAt, setRenewedAt] = useState<Date | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [testimonyDialogOpen, setTestimonyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const prevCountRef = useRef(prayer.prayerCount);

  // Compute days left from expiresAt
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(prayer.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  useEffect(() => {
    if (prayer.prayerCount !== prevCountRef.current) {
      prevCountRef.current = prayer.prayerCount;
      setCountKey((k) => k + 1);
    }
  }, [prayer.prayerCount]);

  async function handleRenew() {
    setPending(true);
    setError('');
    const formData = new FormData();
    formData.set('prayerId', prayer.id);
    const result = await renewPrayerAction(formData);
    setPending(false);
    if (result.success) {
      setRenewedAt(new Date());
      setTimeout(() => setRenewedAt(null), 4000);
    } else {
      setError(result.error);
    }
  }

  async function handleAdopt() {
    try {
      const res = await fetch('/api/v1/adoptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prayerId: prayer.id }),
      });
      if (!res.ok && res.status !== 409) {
        setError('Could not adopt this prayer. Please try again.');
      }
    } catch {
      setError('Could not adopt this prayer. Please try again.');
    }
  }

  async function handleReport() {
    const formData = new FormData();
    formData.set('prayerId', prayer.id);
    formData.set('reason', 'inappropriate');
    await submitReportAction(formData);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${prayer.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy link. Try long-pressing Share.');
    }
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

        {renewedAt && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            ✓ Renewed — expires in 30 days
          </p>
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

        {/* Own prayer card action area */}
        {isOwnPrayer && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              {localStatus === 'answered'
                ? 'Answered ✨'
                : localStatus === 'expired'
                ? 'Expired'
                : `Active · ${daysLeft} days left`}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={handleCopyLink} className="px-2">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">{copied ? 'Copied!' : 'Share Link'}</span>
              </Button>
              <PrayerCardMenu
                variant="own"
                onEdit={() => setEditDialogOpen(true)}
                onRenew={localStatus === 'active' ? handleRenew : undefined}
                onMarkAnswered={localStatus === 'active' ? () => setTestimonyDialogOpen(true) : undefined}
                onDelete={showDelete ? () => setDeleteDialogOpen(true) : undefined}
              />
            </div>
          </div>
        )}

        {/* Community prayer card action area */}
        {!isOwnPrayer && (
          <>
            {localStatus === 'active' && (
              <AdoptPrayerButton
                prayerId={prayer.id}
                initialAdopted={isAdopted}
                initialCount={adoptionCount}
              />
            )}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1" />
              <Button size="sm" variant="ghost" onClick={handleCopyLink} className="px-2">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">{copied ? 'Copied!' : 'Share Link'}</span>
              </Button>
              <Button size="sm" variant="ghost" className="px-2" render={<Link href={`/p/${prayer.id}`} />}>
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Button>
              <PrayerCardMenu
                variant="community"
                onAdopt={handleAdopt}
                onReport={handleReport}
              />
            </div>
          </>
        )}

        {/* Dialogs — own prayer only */}
        {isOwnPrayer && (
          <>
            <PrayerEditDialog
              prayer={{
                content: prayer.content,
                isUrgent: prayer.isUrgent ?? false,
                isAnonymous: prayer.isAnonymous ?? false,
              }}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onSave={async (data) => {
                const fd = new FormData();
                fd.set('prayerId', prayer.id);
                fd.set('content', data.content);
                fd.set('isUrgent', String(data.urgent));
                fd.set('isAnonymous', String(data.anonymous));
                const result = await updatePrayerAction(fd);
                if (!result.success) throw new Error(result.error);
                setEditDialogOpen(false);
              }}
            />
            <PrayerTestimonyDialog
              prayerId={prayer.id}
              open={testimonyDialogOpen}
              onOpenChange={setTestimonyDialogOpen}
              onConfirm={async (data) => {
                const fd = new FormData();
                fd.set('prayerId', prayer.id);
                if (data.testimony) fd.set('testimony', data.testimony);
                if (data.imageUrl) fd.set('imageUrl', data.imageUrl);
                if (data.videoUrl) {
                  fd.set('videoUrl', data.videoUrl);
                  if (data.videoDurationSeconds != null) {
                    fd.set('videoDurationSeconds', String(data.videoDurationSeconds));
                  }
                }
                const result = await markAnsweredAction(fd);
                if (!result.success) throw new Error(result.error);
                setLocalStatus('answered');
                setTestimonyDialogOpen(false);
                setShowCelebration(true);
              }}
            />
            {showDelete && (
              <PrayerDeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={async () => {
                  const fd = new FormData();
                  fd.set('prayerId', prayer.id);
                  const result = await deletePrayerAction(fd);
                  if (!result.success) {
                    setError(result.error);
                    throw new Error(result.error);
                  }
                  setDeleted(true);
                }}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
