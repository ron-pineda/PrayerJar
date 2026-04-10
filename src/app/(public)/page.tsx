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

        <p className="text-2xl font-bold text-primary mb-1">{stats.active}</p>
        <p className="text-sm text-muted-foreground mb-6">prayers in the jar</p>

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

      {/* Lights Released CTA */}
      <section className="pb-20 px-4 text-center">
        <p className="text-muted-foreground mb-3">See what God has been doing</p>
        <Button variant="ghost" render={<Link href="/praise-wall" />}>View Lights Released →</Button>
        <div className="mt-3">
          <Button variant="ghost" render={<Link href="/know-jesus" />}>Know Jesus →</Button>
        </div>
      </section>
    </main>
  );
}
