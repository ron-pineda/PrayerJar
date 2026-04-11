import { auth } from '@/lib/auth';
import { getPrayersByAuthor } from '@/services/prayer.service';
import { PrayerCard } from '@/components/prayer-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/empty-state';
import { Heart } from 'lucide-react';

export const metadata = { title: 'My Prayers | The Prayer Jar' };

export default async function MyPrayersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const prayers = await getPrayersByAuthor(session.user.id);

  const active = prayers.filter((p) => p.status === 'active');
  const answered = prayers.filter((p) => p.status === 'answered');
  const expired = prayers.filter((p) => p.status === 'expired');

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">My Prayers</h1>
          <p className="text-muted-foreground">
            Manage your prayer requests and share testimonies.
          </p>
        </div>
        <Button render={<Link href="/" />}>+ New Request</Button>
      </div>

      {prayers.length === 0 ? (
        <EmptyState
          icon={<Heart size={24} />}
          title="No prayers yet"
          description="When you submit a prayer, it will appear here."
          action={{ label: "Submit a Prayer", href: "/" }}
        />
      ) : (
        <div className="space-y-10">
          {active.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">
                Active ({active.length})
              </h2>
              <div className="grid gap-4">
                {active.map((prayer) => (
                  <PrayerCard key={prayer.id} prayer={prayer} />
                ))}
              </div>
            </section>
          )}

          {answered.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-amber-700 dark:text-amber-400">
                Answered ✨ ({answered.length})
              </h2>
              <div className="grid gap-4">
                {answered.map((prayer) => (
                  <PrayerCard key={prayer.id} prayer={prayer} />
                ))}
              </div>
            </section>
          )}

          {expired.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                Expired ({expired.length})
              </h2>
              <div className="grid gap-4">
                {expired.map((prayer) => (
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
