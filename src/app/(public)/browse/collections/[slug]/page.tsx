import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookMarked } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

interface CollectionData {
  collection: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    coverEmoji: string | null;
  };
  prayers: Array<{
    id: string;
    content: string;
    category: string;
    isUrgent: boolean;
    prayerCount: number;
    createdAt: string;
    answeredAt: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
}

async function getCollection(slug: string, page: number): Promise<CollectionData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org';
  const res = await fetch(
    `${baseUrl}/api/v1/collections/${slug}?page=${page}&limit=20`,
    { cache: 'no-store' }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));

  const data = await getCollection(slug, page);
  if (!data) notFound();

  const { collection, prayers, total, limit } = data;
  const totalPages = Math.ceil(total / limit);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Back */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/browse" />}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Browse
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          {collection.coverEmoji ? (
            <span className="text-4xl">{collection.coverEmoji}</span>
          ) : (
            <BookMarked className="h-8 w-8 text-muted-foreground" />
          )}
          <h1 className="text-3xl font-bold">{collection.title}</h1>
        </div>
        {collection.description && (
          <p className="text-muted-foreground">{collection.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">{total} {total === 1 ? 'prayer' : 'prayers'}</p>
      </div>

      {/* Prayer list */}
      {prayers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No prayers in this collection yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prayers.map((prayer) => (
            <div
              key={prayer.id}
              className="rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="capitalize text-xs">
                  {prayer.category.replace(/_/g, ' ')}
                </Badge>
                {prayer.isUrgent && (
                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                )}
                {prayer.answeredAt && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    ✨ Answered
                  </Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed line-clamp-3">{prayer.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {prayer.prayerCount} {prayer.prayerCount === 1 ? 'prayer' : 'prayers'} •{' '}
                {formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/browse/collections/${slug}?page=${page - 1}`} />}
            >
              Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/browse/collections/${slug}?page=${page + 1}`} />}
            >
              Next
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
