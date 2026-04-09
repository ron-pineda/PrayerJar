import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrayerDialog } from '@/components/prayer-dialog';
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

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 px-4 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          The Prayer Jar
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          A global place to share your heart and intercede for others.
          Every prayer matters. Every name is known by God.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <PrayerDialog />

          <Button size="lg" variant="outline" render={<Link href="/pray" />}>Pray for Someone</Button>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16 px-4">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-center">{stats.active}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Active prayer requests
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-center">{stats.answered}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Prayers answered
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Praise Wall CTA */}
      <section className="pb-20 px-4 text-center">
        <p className="text-muted-foreground mb-3">See what God has been doing</p>
        <Button variant="ghost" render={<Link href="/praise-wall" />}>View the Praise Wall →</Button>
      </section>
    </main>
  );
}
