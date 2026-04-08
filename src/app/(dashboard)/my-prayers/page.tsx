import { auth } from '@/lib/auth';
import { getPrayersByAuthor } from '@/services/prayer.service';
import { PrayerCard } from '@/components/prayer-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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
        <Button asChild>
          <Link href="/">+ New Request</Link>
        </Button>
      </div>

      {prayers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">You haven&apos;t submitted any prayer requests yet.</p>
          <p className="text-muted-foreground mb-6">
            Share what&apos;s on your heart — the community is here to pray.
          </p>
          <Button asChild>
            <Link href="/">Submit a Prayer Request</Link>
          </Button>
        </div>
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
