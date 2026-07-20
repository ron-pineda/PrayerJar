import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPrayersUserPrayedFor } from '@/services/interaction.service';
import { PrayerCard } from '@/components/prayer-card';
import { EmptyState } from '@/components/empty-state';
import { HandHeart } from 'lucide-react';

export const metadata: Metadata = { title: 'Prayers I\'ve Prayed For | The Prayer Jar' };

export default async function PrayedForPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const prayers = await getPrayersUserPrayedFor(session.user.id, 50);

  const answered = prayers.filter((p) => p.status === 'answered');
  const active = prayers.filter((p) => p.status !== 'answered');

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Prayers I&apos;ve Prayed For</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {prayers.length === 0
            ? "Prayers you pray for will appear here."
            : `${prayers.length} ${prayers.length === 1 ? 'prayer' : 'prayers'} — see which have been answered.`}
        </p>
      </div>

      {prayers.length === 0 ? (
        <EmptyState
          icon={<HandHeart className="h-10 w-10" />}
          title="No prayers yet"
          description="Once you pray for someone else's request, it'll show up here so you can follow along."
        />
      ) : (
        <div className="space-y-8">
          {answered.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-amber-700 dark:text-amber-400">
                Answered ({answered.length})
              </h2>
              <div className="grid gap-4">
                {answered.map((prayer) => (
                  <PrayerCard key={prayer.id} prayer={prayer} />
                ))}
              </div>
            </section>
          )}

          {active.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">
                Still Praying ({active.length})
              </h2>
              <div className="grid gap-4">
                {active.map((prayer) => (
                  <PrayerCard key={prayer.id} prayer={prayer} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
