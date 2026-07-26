import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { donations, churchMembers } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Giving | The Prayer Jar' };

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Giving history.
 *
 * Sprint 27 (pj-s27-02): this page used to be Billing. It rendered a current-plan
 * card, a four-tier plan grid with prices and upgrade buttons, and a list of
 * purchased event licenses. All of that is gone with the paid tiers. What is left
 * is the one thing on the page that was always real: a record of the donations a
 * person has actually made through /give.
 *
 * The route is still /billing on purpose — renaming it would mean redirects and
 * link edits for no user-visible gain.
 */
export default async function GivingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  // NOTE (pj-s27-02): this admin/pastor check was written to stop ordinary users
  // seeing church plan tiers. Those no longer exist, so the check now does
  // nothing but hide a donor's own giving history from them — a regular user who
  // donated through /give has no way to see it. That is logged as §F.1 of the
  // removal plan and is deliberately out of scope for this sprint; it is a
  // behaviour change, not a paid-surface removal. Left as-is, flagged for PM.
  let churchRole: { role: string } | undefined;
  try {
    churchRole = await db
      .select({ role: churchMembers.role })
      .from(churchMembers)
      .where(eq(churchMembers.userId, userId))
      .limit(1)
      .then((r) => r[0]);
  } catch {
    // Table may not exist if migrations haven't been applied
    redirect('/profile');
  }

  const isChurchAdmin = churchRole?.role === 'admin' || churchRole?.role === 'pastor';
  if (!isChurchAdmin) redirect('/profile');

  let donationHistory: (typeof donations.$inferSelect)[] = [];

  try {
    donationHistory = await db
      .select()
      .from(donations)
      .where(and(eq(donations.userId, userId), eq(donations.status, 'succeeded')))
      .orderBy(desc(donations.createdAt))
      .limit(20);
  } catch {
    // Table may not exist if migrations haven't been fully applied — show empty state
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Giving</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PrayerJar is free to use. Nothing here is a bill — gifts are voluntary
          and they keep the lights on.
        </p>
      </div>

      {donationHistory.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Your gifts</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {donationHistory.map((donation) => (
                  <li key={donation.id} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium">
                      {formatCents(donation.amountCents)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(donation.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              You haven&apos;t given yet, and you are under no obligation to.
              PrayerJar costs your church nothing either way.
            </p>
            <Button render={<Link href="/give" />}>Give to PrayerJar</Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
