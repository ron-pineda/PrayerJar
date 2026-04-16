import { auth } from '@/lib/auth';
import { getPrayersByAuthor } from '@/services/prayer.service';
import { PrayerCard } from '@/components/prayer-card';
import { redirect } from 'next/navigation';
import { PrayerDialog } from '@/components/prayer-dialog';
import { Heart } from 'lucide-react';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const metadata = { title: 'My Prayers | The Prayer Jar' };

export default async function MyPrayersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const [prayers, userRecord] = await Promise.all([
    getPrayersByAuthor(session.user.id),
    db.select({ activityLevel: users.activityLevel }).from(users).where(eq(users.id, session.user.id)).then((r) => r[0]),
  ]);

  const active = prayers.filter((p) => p.status === 'active');
  const answered = prayers.filter((p) => p.status === 'answered');
  const expired = prayers.filter((p) => p.status === 'expired');

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">My Prayers</h1>
            {userRecord?.activityLevel === 'power' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Faithful Intercessor
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Your prayer requests and testimonies.
          </p>
        </div>
        <PrayerDialog />
      </div>

      {prayers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Heart size={24} />
          </div>
          <h3 className="mb-1 text-base font-semibold">No prayers yet</h3>
          <p className="mb-5 max-w-xs text-sm text-muted-foreground">When you submit a prayer, it will appear here.</p>
          <PrayerDialog />
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
                  <PrayerCard key={prayer.id} prayer={prayer} showDelete isOwnPrayer />
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
                  <PrayerCard key={prayer.id} prayer={prayer} isOwnPrayer />
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
                  <PrayerCard key={prayer.id} prayer={prayer} showDelete isOwnPrayer />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
