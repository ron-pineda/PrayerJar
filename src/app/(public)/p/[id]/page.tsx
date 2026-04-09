import type { Metadata } from 'next';
import { getPrayerById } from '@/services/prayer.service';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { ShareButtons } from '@/components/share-buttons';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const prayer = await getPrayerById(id);
  if (!prayer) return { title: 'Prayer Not Found' };

  const ogUrl = prayer.status === 'answered'
    ? `/api/og/testimony/${id}`
    : `/api/og/prayer/${id}`;

  return {
    title: 'A Prayer Request | Prayer Jar',
    description: prayer.content.slice(0, 155),
    openGraph: {
      title: 'A Prayer Request | Prayer Jar',
      description: prayer.content.slice(0, 155),
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'A Prayer Request | Prayer Jar',
      description: prayer.content.slice(0, 155),
      images: [ogUrl],
    },
  };
}

export default async function SharedPrayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prayer = await getPrayerById(id);
  if (!prayer || prayer.status === 'expired') notFound();

  const categoryLabel = PRAYER_CATEGORIES.find((c) => c.value === prayer.category)?.label;

  return (
    <main className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">A Prayer Request</h1>
        <p className="text-muted-foreground">Someone shared this with you. Would you pray for them?</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{categoryLabel}</Badge>
            {prayer.isUrgent && <Badge variant="destructive">Urgent</Badge>}
            <span className="text-xs text-muted-foreground">
              {prayer.prayerCount} {prayer.prayerCount === 1 ? 'person' : 'people'} prayed
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">{prayer.content}</p>
          {prayer.suggestedVerse && (
            <p className="mt-4 text-sm text-muted-foreground italic">✝️ {prayer.suggestedVerse}</p>
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

      <ShareButtons
        url={`/p/${prayer.id}`}
        text={prayer.isAnonymous ? 'Someone needs your prayer' : 'Please pray for this request'}
        variant="bar"
      />

      <div className="flex flex-col gap-3">
        <Button size="lg" render={<Link href="/pray/any" />}>I Prayed — Pray for Another</Button>
        <Button variant="outline" render={<Link href="/" />}>Visit Prayer Jar</Button>
      </div>
    </main>
  );
}
