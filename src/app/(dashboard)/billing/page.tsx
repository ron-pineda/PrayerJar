import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { subscriptions, donations, eventLicenses, churchMembers } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { PLANS, isComingSoonFeature } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CancelSubscriptionButton, UpgradeButton } from './BillingActions';

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

  // Billing is for church admins/pastors only — regular users never see plan tiers
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

  let subscription: Awaited<ReturnType<typeof db.query.subscriptions.findFirst>> | undefined;
  let donationHistory: (typeof donations.$inferSelect)[] = [];
  let licenses: (typeof eventLicenses.$inferSelect)[] = [];

  try {
    [subscription, donationHistory, licenses] = await Promise.all([
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
  } catch {
    // Tables may not exist if migrations haven't been fully applied — show empty state
  }

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
                    ? `Cancellation scheduled — access until ${formatDate(subscription.currentPeriodEnd)}`
                    : `Renews on ${formatDate(subscription.currentPeriodEnd)}`
                  }
                </p>
              </div>
              {subscription.cancelAtPeriodEnd ? null : (
                <CancelSubscriptionButton />
              )}
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
                  Church features — private prayer walls and pastoral tools — are included on paid plans.
                </p>
              </div>
              <UpgradeButton tier="starter" billing="monthly" label="View church plans" />
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
                    {plan.features.map((feature) => {
                      // pj-s26-09: a checkmark beside "(coming soon)" reads as
                      // included — and this list sits directly above the
                      // upgrade button, so it must not overstate.
                      const comingSoon = isComingSoonFeature(feature);
                      return (
                        <li
                          key={feature}
                          className={`text-sm flex gap-2 ${
                            comingSoon
                              ? 'text-muted-foreground/70 italic'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <span
                            className={comingSoon ? 'text-muted-foreground/60 mt-0.5' : 'text-primary mt-0.5'}
                            aria-hidden="true"
                          >
                            {comingSoon ? '◌' : '✓'}
                          </span>
                          {feature}
                        </li>
                      );
                    })}
                  </ul>
                  {plan.features.some(isComingSoonFeature) && (
                    <p className="text-xs text-muted-foreground border-t pt-3">
                      Items marked &ldquo;coming soon&rdquo; are not available
                      yet. You are not being charged for them, and they are not
                      part of what this plan delivers today.
                    </p>
                  )}
                  {isCurrent ? null : isFree ? null : isEnterprise ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      render={<Link href="/contact" />}
                    >
                      Contact Sales
                    </Button>
                  ) : (
                    <UpgradeButton tier={plan.tier} billing="monthly" className="w-full" />
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
