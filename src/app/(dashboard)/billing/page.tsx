import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { subscriptions, donations, eventLicenses } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { PLANS } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Billing | The Prayer Jar' };

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const [subscription, donationHistory, licenses] = await Promise.all([
    db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')),
      orderBy: [desc(subscriptions.createdAt)],
    }),
    db
      .select()
      .from(donations)
      .where(and(eq(donations.userId, userId), eq(donations.status, 'succeeded')))
      .orderBy(desc(donations.createdAt))
      .limit(5),
    db
      .select()
      .from(eventLicenses)
      .where(eq(eventLicenses.userId, userId))
      .orderBy(desc(eventLicenses.createdAt))
      .limit(10),
  ]);

  const activeTier = subscription?.tier ?? 'free';
  const activePlan = PLANS[activeTier];

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-3xl font-bold tracking-tight">Billing</h1>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription and billing details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-sm font-semibold text-primary">
                    {activePlan.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.cancelAtPeriodEnd
                    ? `Access until ${formatDate(subscription.currentPeriodEnd)}`
                    : `Renews on ${formatDate(subscription.currentPeriodEnd)}`
                  }
                </p>
              </div>
              <Button variant="outline" render={<Link href="/for-churches" />}>
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-0.5 text-sm font-semibold text-muted-foreground">
                    Free Plan
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock church features like private prayer walls and pastoral tools.
                </p>
              </div>
              <Button render={<Link href="/for-churches" />}>Upgrade to unlock church features</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.values(PLANS) as (typeof PLANS)[keyof typeof PLANS][]).map((plan) => {
            const isCurrent = plan.tier === activeTier;
            const isFree = plan.tier === 'free';
            const isEnterprise = plan.tier === 'enterprise';

            return (
              <Card
                key={plan.tier}
                className={isCurrent ? 'border-primary ring-2 ring-primary/20' : undefined}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {isCurrent && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {isEnterprise ? (
                      <span className="text-base font-semibold">Contact sales</span>
                    ) : isFree ? (
                      'Free'
                    ) : (
                      <>
                        {formatCents(plan.monthlyPriceCents)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </>
                    )}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? null : isFree ? null : (
                    <Button
                      className="w-full"
                      variant={isEnterprise ? 'outline' : 'default'}
                      render={<Link href="/for-churches" />}
                    >
                      {isEnterprise ? 'Contact Sales' : 'Get Started'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Event Licenses */}
      {licenses.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Event Licenses</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium">Event</th>
                      <th className="text-left px-4 py-3 font-medium">Capacity</th>
                      <th className="text-left px-4 py-3 font-medium">Valid From</th>
                      <th className="text-left px-4 py-3 font-medium">Valid Until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((license) => (
                      <tr key={license.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{license.eventName}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {license.attendeeCapacity.toLocaleString()} attendees
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(license.validFrom)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(license.validUntil)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Donation History */}
      {donationHistory.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Donation History</h2>
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
      )}
    </main>
  );
}
