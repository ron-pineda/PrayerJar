import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PrayerDialog } from '@/components/prayer-dialog';
import { OnboardingOverlay } from '@/components/onboarding-overlay';
import { PrayerJar } from '@/components/prayer-jar';
import { getDailyVerse } from '@/lib/daily-verse';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';

async function getStats() {
  const [totalRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prayers)
    .where(and(eq(prayers.status, 'active'), gt(prayers.expiresAt, new Date())));

  const [answeredRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prayers)
    .where(eq(prayers.status, 'answered'));

  return {
    active: Number(totalRow?.count ?? 0),
    answered: Number(answeredRow?.count ?? 0),
  };
}

export default async function HomePage() {
  const stats = await getStats();
  const verse = getDailyVerse();

  return (
    <main className="min-h-screen">
      <OnboardingOverlay />
      {/* Hero */}
      <section className="py-20 px-4 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          The Prayer Jar
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          A global place to share your heart and intercede for others.
          Every prayer matters. Every name is known by God.
        </p>

        <div className="flex justify-center mb-6">
          <PrayerJar count={stats.active} />
        </div>

        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.active}</p>
            <p className="text-xs text-muted-foreground mt-0.5">prayers waiting</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{stats.answered}</p>
            <p className="text-xs text-muted-foreground mt-0.5">lights released ✨</p>
          </div>
        </div>

        {/* Daily verse */}
        <div className="border-t border-b py-4 mb-8 max-w-md mx-auto">
          <p className="text-sm italic text-muted-foreground leading-relaxed">
            &ldquo;{verse.text}&rdquo;
          </p>
          <p className="text-xs text-primary mt-2">{verse.reference}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <PrayerDialog />
          <Button size="lg" variant="outline" render={<Link href="/pray" />}>Pray for Someone</Button>
        </div>
      </section>

      {/* Secondary CTAs */}
      <section className="pb-20 px-4 text-center">
        <div className="border-t max-w-xs mx-auto mb-8" />
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="ghost" render={<Link href="/praise-wall" />}>✨ View Lights Released</Button>
          <Button variant="ghost" render={<Link href="/find-a-church" />}>⛪ Find a Church</Button>
          <Button variant="ghost" render={<Link href="/know-jesus" />}>✝️ Know Jesus</Button>
        </div>
      </section>
    </main>
  );
}
