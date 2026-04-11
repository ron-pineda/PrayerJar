import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getWrappedStats } from '@/services/wrapped.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Year in Prayer | The Prayer Jar' };

export default async function WrappedPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/?message=sign-in-required');
  }

  const userId = session.user.id;
  const stats = await getWrappedStats(userId, year);

  if (!stats) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mb-6 text-5xl">🙏</div>
        <h1 className="text-3xl font-bold mb-4">No prayers found for {year}</h1>
        <p className="text-muted-foreground mb-8">
          It looks like you didn&apos;t submit any prayers in {year}. Start your prayer journey today.
        </p>
        <Button render={<Link href="/pray" />} size="lg">
          Start Praying
        </Button>
      </main>
    );
  }

  const ogUrl = `/api/og/wrapped/${userId}?year=${year}`;

  const statItems = [
    { label: 'Prayers Submitted', value: stats.totalPrayers.toString(), emoji: '📖' },
    { label: 'Total Interactions', value: stats.totalInteractions.toString(), emoji: '✨' },
    { label: 'Prayers Answered', value: stats.answeredCount.toString(), emoji: '🌟' },
    { label: 'Longest Streak', value: `${stats.longestStreak} days`, emoji: '🔥' },
    { label: 'Prayer Partners', value: stats.partnerCount.toString(), emoji: '🤝' },
    { label: 'Groups Joined', value: stats.groupCount.toString(), emoji: '👥' },
    ...(stats.topCategory
      ? [{ label: 'Top Category', value: stats.topCategory.replace(/_/g, ' '), emoji: '🏷️' }]
      : []),
  ];

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">🙏</div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Your {year} in Prayer
        </h1>
        <p className="text-muted-foreground">
          A look back at your year of faith and intercession.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {statItems.map((item) => (
          <Card key={item.label} className="text-center">
            <CardContent className="pt-6 pb-4">
              <div className="text-3xl mb-2">{item.emoji}</div>
              <div className="text-2xl font-bold mb-1">{item.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                {item.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border rounded-lg p-6 text-center space-y-4 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Share your year in prayer with others.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <a
              href={`https://twitter.com/intent/tweet?text=My+${year}+Year+in+Prayer+on+%40PrayerJar+%F0%9F%99%8F&url=${encodeURIComponent(`https://prayerjar.org${ogUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share on X / Twitter
            </a>
          </Button>
          <Button variant="outline" asChild size="lg">
            <a href={ogUrl} target="_blank" rel="noopener noreferrer">
              Download Image
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your share image: <code className="text-xs bg-muted px-1 rounded">{ogUrl}</code>
        </p>
      </div>
    </main>
  );
}
