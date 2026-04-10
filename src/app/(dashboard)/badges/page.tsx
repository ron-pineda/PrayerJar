import type { Metadata } from 'next';
import { auth } from '@/lib/auth';

export const metadata: Metadata = { title: 'My Badges | The Prayer Jar' };
import { getBadgesForUser } from '@/services/badge.service';
import { BadgeDisplay } from '@/components/badge-display';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function BadgesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const [earned, user] = await Promise.all([
    getBadgesForUser(session.user.id),
    db.select().from(users).where(eq(users.id, session.user.id)).then((r) => r[0]),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">My Badges</h1>
      {user && (
        <p className="text-muted-foreground mb-8">
          Current streak: <strong>{user.currentStreak} {user.currentStreak === 1 ? 'day' : 'days'}</strong> •{' '}
          {earned.length} badges earned
        </p>
      )}
      <BadgeDisplay earnedBadges={earned} />
    </main>
  );
}
