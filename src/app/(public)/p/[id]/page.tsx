import type { Metadata } from 'next';
import { getPrayerById } from '@/services/prayer.service';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { ShareButtons } from '@/components/share-buttons';
import { PrayForButton } from '@/components/pray-for-button';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const prayer = await getPrayerById(id);
  if (!prayer) return { title: 'Prayer Not Found' };

  const categoryLabel = PRAYER_CATEGORIES.find((c) => c.value === prayer.category)?.label;
  const truncatedContent = prayer.content.slice(0, 120);

  const ogUrl = prayer.status === 'answered'
    ? `/api/og/card/answered?text=${encodeURIComponent(truncatedContent)}&category=${encodeURIComponent(categoryLabel ?? '')}`
    : `/api/og/card/prayer?text=${encodeURIComponent(truncatedContent)}&category=${encodeURIComponent(categoryLabel ?? '')}&count=${prayer.prayerCount}`;

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
    <main className="max-w-lg mx-auto px-4 py-10 space-y-8">

      <div className="text-center space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Someone shared a prayer with you
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          Will you stand with them?
        </h1>
        <p className="text-muted-foreground text-base">
          This person asked Prayer Jar to carry their need before God. You can join them right now.
        </p>
      </div>

      <Card className="border-2">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {categoryLabel && <Badge variant="secondary">{categoryLabel}</Badge>}
            {prayer.isUrgent && <Badge variant="destructive">Urgent</Badge>}
          </div>

          <p className="text-lg leading-relaxed font-medium">{prayer.content}</p>

          {prayer.imageUrl && (
            <img
              src={prayer.imageUrl}
              alt="Prayer photo"
              className="w-full h-56 object-cover rounded-lg"
              loading="lazy"
            />
          )}

          {prayer.suggestedVerse && (
            <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
              {prayer.suggestedVerse}
            </p>
          )}
        </CardContent>
      </Card>

      <PrayForButton prayerId={prayer.id} initialCount={prayer.prayerCount} />

      <div className="space-y-3">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          render={<Link href="/" />}
        >
          Submit Your Own Prayer
        </Button>
      </div>

      <div className="border-t pt-6 space-y-3">
        <ShareButtons
          url={`/p/${prayer.id}`}
          text={prayer.isAnonymous ? 'Someone needs your prayer' : 'Please pray for this request'}
          variant="bar"
        />
      </div>

      <div className="rounded-xl bg-muted/50 px-5 py-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">What is Prayer Jar?</p>
        <p>
          Prayer Jar is a quiet place online where people bring their real burdens — health, family,
          grief, hope — and ask others to pray. No accounts required to pray. Just you, this moment,
          and someone who needs to know they are not alone.
        </p>
        <Button
          variant="link"
          size="sm"
          className="px-0 h-auto"
          render={<Link href="/" />}
        >
          Learn more at PrayerJar.org
        </Button>
      </div>

    </main>
  );
}
