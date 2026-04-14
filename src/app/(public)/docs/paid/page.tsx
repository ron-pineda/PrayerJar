import type { Metadata } from 'next';
import Link from 'next/link';
import { PLANS } from '@/lib/plans';

export const metadata: Metadata = { title: 'Paid Features | PrayerJar Docs' };

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

const FEATURE_COMPARISON = [
  { feature: 'Public prayer feed (browse & pray)', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Submit prayer requests', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Notifications & email digest', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Badges, streaks & journal', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Prayer Partner matching', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Know Jesus pathway', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Max church members', free: '25', starter: '150', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Church groups', free: '1', starter: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Church admins', free: '1', starter: '3', pro: '10', enterprise: 'Unlimited' },
  { feature: 'Private church prayer wall', free: false, starter: true, pro: true, enterprise: true },
  { feature: 'Custom welcome message', free: false, starter: true, pro: true, enterprise: true },
  { feature: 'Email digest for pastors', free: false, starter: true, pro: true, enterprise: true },
  { feature: 'Basic analytics', free: false, starter: true, pro: true, enterprise: true },
  { feature: 'Live event prayer walls', free: false, starter: '2/yr', pro: '12/yr', enterprise: 'Unlimited' },
  { feature: 'Pastoral dashboard', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'AI-flagged care alerts', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'Pastoral notes & assignments', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'Custom branding', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'Advanced analytics & PDF reports', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'Priority support', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'Custom subdomain', free: false, starter: false, pro: false, enterprise: true },
  { feature: 'SSO / SAML', free: false, starter: false, pro: false, enterprise: true },
  { feature: 'SLA', free: false, starter: false, pro: false, enterprise: true },
  { feature: 'Dedicated account manager', free: false, starter: false, pro: false, enterprise: true },
];

type CellValue = boolean | string;

function Cell({ value }: { value: CellValue }) {
  if (value === true) return <span className="text-primary text-lg">✓</span>;
  if (value === false) return <span className="text-muted-foreground/40">—</span>;
  return <span className="text-xs font-medium">{value}</span>;
}

export default function PaidFeaturesPage() {
  const plans = [PLANS.free, PLANS.starter, PLANS.pro, PLANS.enterprise];

  return (
    <main className="max-w-4xl mx-auto px-4 py-14">

      <div className="mb-12">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Docs</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4 mb-3">Paid Features Guide</h1>
        <p className="text-muted-foreground">
          What church plan subscribers get — and how to make the most of every feature.
        </p>
      </div>

      {/* Ministry note */}
      <div className="rounded-xl border bg-muted/30 p-5 mb-12">
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">Prayer is always free.</span> There is no paywall on submitting a prayer request or praying for others. Church plans exist to support congregations that need pastoral tools, private prayer walls, and oversight features. Individual users never need to pay anything.
        </p>
      </div>

      {/* Plan cards */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6">Plans at a glance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-xl border p-5 space-y-4 ${plan.tier === 'pro' ? 'border-primary ring-2 ring-primary/20' : ''}`}
            >
              {plan.tier === 'pro' && (
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  Most Popular
                </span>
              )}
              <div>
                <p className="font-semibold">{plan.name}</p>
                <p className="text-2xl font-bold mt-1">
                  {plan.tier === 'enterprise' ? (
                    <span className="text-base font-semibold">Contact sales</span>
                  ) : plan.monthlyPriceCents === 0 ? (
                    'Free'
                  ) : (
                    <>{formatCents(plan.monthlyPriceCents)}<span className="text-sm font-normal text-muted-foreground">/mo</span></>
                  )}
                </p>
                {plan.yearlyPriceCents > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    or {formatCents(plan.yearlyPriceCents)}/yr (save ~20%)
                  </p>
                )}
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-sm text-center mt-5 text-muted-foreground">
          Ready to upgrade?{' '}
          <Link href="/for-churches" className="text-primary underline underline-offset-4">View the For Churches page</Link>
          {' '}to get started.
        </p>
      </section>

      {/* Comparison table */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6">Full comparison</h2>
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium w-1/2">Feature</th>
                {plans.map((p) => (
                  <th key={p.tier} className={`text-center px-3 py-3 font-medium ${p.tier === 'pro' ? 'text-primary' : ''}`}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON.map((row, i) => (
                <tr key={row.feature} className={`border-b last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.feature}</td>
                  <td className="text-center px-3 py-2.5"><Cell value={row.free} /></td>
                  <td className="text-center px-3 py-2.5"><Cell value={row.starter} /></td>
                  <td className="text-center px-3 py-2.5"><Cell value={row.pro} /></td>
                  <td className="text-center px-3 py-2.5"><Cell value={row.enterprise} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature deep dives */}
      <section className="space-y-12 mb-16">
        <h2 className="text-xl font-semibold">Pro feature details</h2>

        {[
          {
            icon: '📋',
            title: 'Pastoral Dashboard',
            plan: 'Pro+',
            body: 'The pastoral dashboard gives admins and pastors a real-time overview of church prayer activity. See active requests, recent volume trends, member engagement, and a queue of requests flagged for pastoral care. All in one screen — no digging through individual submissions.',
          },
          {
            icon: '🤖',
            title: 'AI-Flagged Care Alerts',
            plan: 'Pro+',
            body: "Every prayer submitted to your private wall is screened for language indicating crisis, self-harm, acute grief, or mental health distress. Flagged requests are surfaced in the pastoral dashboard immediately. Pastors can add private notes and assign follow-up — so no one falls through the cracks.",
          },
          {
            icon: '🎤',
            title: 'Live Event Prayer Wall',
            plan: 'Starter (2/yr), Pro (12/yr), Enterprise (unlimited)',
            body: 'Run a real-time prayer wall at services, conferences, retreats, or prayer meetings. Attendees submit from their phones. A pastor moderates submissions on one screen while the wall displays on the projector. All submissions are logged and exportable as CSV after the event.',
          },
          {
            icon: '🎨',
            title: 'Custom Branding',
            plan: 'Pro+',
            body: "Upload your church logo and choose accent colors. The private wall, event wall, and welcome messages will display your branding instead of the default PrayerJar look. Members feel like they're in a space that belongs to your congregation.",
          },
          {
            icon: '📊',
            title: 'Analytics & PDF Reports',
            plan: 'Pro+',
            body: 'Track prayer volume over time, member engagement, answered prayer rates, and category breakdowns. Export a formatted PDF report for any time period — useful for elder board updates, annual reports, or grant applications.',
          },
        ].map(({ icon, title, plan, body }) => (
          <div key={title} className="flex gap-4">
            <div className="text-2xl flex-shrink-0">{icon}</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-semibold text-sm">{title}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{plan}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="space-y-5 mb-16">
        <h2 className="text-xl font-semibold">Common questions</h2>
        {[
          {
            q: 'Is there a free trial?',
            a: 'Yes. Start on the Free plan with no credit card required. Upgrade when your congregation grows or when you need pastoral tools.',
          },
          {
            q: 'Can I cancel at any time?',
            a: 'Yes. Cancel from Billing (Profile → Billing). You retain access until the end of your billing period.',
          },
          {
            q: 'What happens to our data if we cancel?',
            a: 'Your church data, member prayers, and history are retained for 90 days after cancellation in case you reactivate. After 90 days, data is permanently deleted.',
          },
          {
            q: 'Do individual members need to pay?',
            a: 'Never. Individual users — even members of a paid church — always use PrayerJar for free.',
          },
          {
            q: 'Do you offer discounts for non-profits or small congregations?',
            a: 'Email hello@prayerjar.org to discuss your situation. We want churches of every size to be able to use these tools.',
          },
        ].map(({ q, a }) => (
          <div key={q} className="rounded-xl border p-5 space-y-2">
            <p className="font-medium text-sm">{q}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
          </div>
        ))}
      </section>

      <div className="pt-8 border-t flex flex-col sm:flex-row gap-3">
        <Link href="/for-churches" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
          View Church Plans
        </Link>
        <Link href="/docs/churches" className="inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent/50 transition-colors">
          Church Admin Guide
        </Link>
        <a href="mailto:hello@prayerjar.org" className="inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent/50 transition-colors">
          Contact Sales
        </a>
      </div>

    </main>
  );
}
