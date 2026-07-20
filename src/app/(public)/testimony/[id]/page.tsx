import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { BookOpen, ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { CopyButton } from '@/components/group/copy-button';
import { getTestimonyById } from '@/services/prayer.service';

export const metadata: Metadata = { title: 'Testimony | The Prayer Jar' };

export default async function TestimonyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTestimonyById(id);
  if (!data) notFound();

  const { prayer, author } = data;
  const answeredDate = format(new Date(prayer.answeredAt!), 'MMMM d, yyyy');
  const categoryLabel = prayer.category.replace(/_/g, ' ');
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org'}/testimony/${id}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Back */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" render={<Link href="/praise-wall" />}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Lights Released
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Answered Prayer
          </span>
          <Badge variant="secondary" className="capitalize">{categoryLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Answered on {answeredDate}</p>
        {author?.name && (
          <p className="text-sm text-muted-foreground mt-1">Shared by {author.name}</p>
        )}
      </div>

      {/* Original prayer */}
      <div className="rounded-xl border bg-muted/40 p-5 mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          The Prayer
        </p>
        <p className="text-base leading-relaxed">{prayer.content}</p>
      </div>

      {/* Testimony story */}
      {prayer.testimonyStory ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-5 mb-8">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Their Testimony
          </p>
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {prayer.testimonyStory}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/20 p-5 mb-8 text-center text-muted-foreground">
          <p className="text-sm">No testimony written yet.</p>
        </div>
      )}

      {/* Video testimony */}
      {prayer.videoUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video controls src={prayer.videoUrl} className="w-full rounded-lg mt-4" />
      )}

      {/* Share */}
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Share this testimony</span>
        <CopyButton text={shareUrl} />
      </div>
    </main>
  );
}
