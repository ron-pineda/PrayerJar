import { auth } from '@/lib/auth';
import { getAdoptedPrayers } from '@/services/adoption.service';
import { PrayerCard } from '@/components/prayer-card';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/empty-state';
import { Heart } from 'lucide-react';

export const metadata = { title: 'Adopted Prayers | The Prayer Jar' };

export default async function AdoptedPrayersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const rows = await getAdoptedPrayers(session.user.id);
  const prayers = rows.map((r) => r.prayer);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Adopted Prayers</h1>
        <p className="text-muted-foreground">
          Prayers you have committed to pray for daily.
        </p>
      </div>

      {prayers.length === 0 ? (
        <EmptyState
          icon={<Heart size={24} />}
          title="No adopted prayers yet"
          description="You haven't adopted any prayers yet. Adopting a prayer means committing to pray for it daily."
          action={{ label: 'Find prayers to adopt', href: '/pray' }}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {prayers.length} {prayers.length === 1 ? 'prayer' : 'prayers'} — keep them lifted up daily.
          </p>
          <div className="grid gap-4">
            {prayers.map((prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
