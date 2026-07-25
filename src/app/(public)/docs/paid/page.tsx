import type { Metadata } from 'next';
import Link from 'next/link';
import { PLANS, isComingSoonFeature } from '@/lib/plans';
import {
  ClipboardList,
  Radio,
  Palette,
  BarChart3,
  Check,
  Clock,
  X,
  Crown,
  Sparkles,
  ArrowLeft,
  Church,
  Mail,
  Heart,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { FaqItem } from './faq-item';

export const metadata: Metadata = { title: 'Paid Features | PrayerJar Docs' };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

type CellValue = boolean | string;

/* ------------------------------------------------------------------ */
/*  Plan tier styling                                                  */
/* ------------------------------------------------------------------ */

const TIER_STYLES: Record<string, { color: string; bg: string; border: string; badge: string; gradient: string }> = {
  free: {
    color: 'text-slate-500',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    gradient: 'from-slate-500/5 to-transparent',
  },
  starter: {
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500/5 to-transparent',
  },
  pro: {
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-500/5 to-transparent',
  },
  enterprise: {
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500/5 to-transparent',
  },
};

/* ------------------------------------------------------------------ */
/*  Feature comparison data                                            */
/* ------------------------------------------------------------------ */

const FEATURE_COMPARISON = [
  { feature: 'Public prayer feed (browse & pray)', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Submit prayer requests', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Notifications & email digest', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Badges, streaks & journal', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Prayer Partner matching', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Know Jesus pathway', free: true, starter: true, pro: true, enterprise: true },
  { feature: 'Max church members', free: '25', starter: '150', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Church groups (coming soon)', free: '1', starter: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Church admins', free: '1', starter: '3', pro: '10', enterprise: 'Unlimited' },
  { feature: 'Custom welcome message', free: false, starter: true, pro: true, enterprise: true },
  { feature: 'Email digest for pastors', free: false, starter: true, pro: true, enterprise: true },
  { feature: 'Member growth analytics', free: false, starter: true, pro: true, enterprise: true },
  { feature: 'Pastoral dashboard', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'Pastoral notes & assignments', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'Custom branding', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'Priority support', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'Private church prayer wall (coming soon)', free: false, starter: 'Roadmap', pro: 'Roadmap', enterprise: 'Roadmap' },
  { feature: 'Live event prayer walls (coming soon)', free: false, starter: 'Roadmap', pro: 'Roadmap', enterprise: 'Roadmap' },
  { feature: 'Testimony approval queue (coming soon)', free: false, starter: false, pro: 'Roadmap', enterprise: 'Roadmap' },
  { feature: 'Prayer volume & engagement analytics (coming soon)', free: false, starter: 'Roadmap', pro: 'Roadmap', enterprise: 'Roadmap' },
  { feature: 'Downloadable analytics reports (coming soon)', free: false, starter: false, pro: 'Roadmap', enterprise: 'Roadmap' },
  { feature: 'Custom subdomain (coming soon)', free: false, starter: false, pro: false, enterprise: 'Roadmap' },
  { feature: 'SSO / SAML (coming soon)', free: false, starter: false, pro: false, enterprise: 'Roadmap' },
  { feature: 'Custom agreement available', free: false, starter: false, pro: false, enterprise: true },
];

/* ------------------------------------------------------------------ */
/*  Pro feature deep-dive data                                         */
/* ------------------------------------------------------------------ */

const FEATURE_DEEP_DIVES = [
  {
    icon: ClipboardList,
    title: 'Pastoral Dashboard',
    plan: 'Pro',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    body: 'The pastoral dashboard is where admins and pastors keep private notes against a prayer or a member, and where the care team reads the same follow-up history. The prayer-activity counters on the same screen read from a church link that is not written yet, so they show zero \u2014 they are not a reflection of your congregation.',
  },
  {
    icon: Radio,
    title: 'Live Event Prayer Wall (coming soon)',
    plan: 'Starter',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    body: 'The submission wall, the pastor-facing moderation console, the projected display and the post-event CSV report are all built. None of them can be reached yet, because there is no way to create an event — the create button in the church dashboard points at a page that does not exist. Nothing in this card is available today.',
    planDetail: 'Not available yet. Planned caps: Starter (2/yr), Pro (12/yr), Enterprise (unlimited)',
  },
  {
    icon: Palette,
    title: 'Custom Branding',
    plan: 'Pro',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    body: "Upload your church logo and choose accent colors. Your church page and welcome message display your branding instead of the default PrayerJar look. The private wall and event wall will carry it too, once those two are reachable.",
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    plan: 'Pro',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    body: 'Member growth reports real numbers on screen in the church dashboard. Prayer volume, member engagement, answered prayer rates and category breakdowns all read from a church link that is not written yet, so each of those four charts shows zero \u2014 they are not available yet. Downloadable reports for elder board updates, annual reports, and grant applications are also still to come.',
  },
];

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes. Start on the Free plan with no credit card required. Upgrade when your congregation grows or when you need pastoral tools.',
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes. Cancel from Billing (Profile \u2192 Billing). You retain access until the end of your billing period.',
  },
  {
    q: 'What happens to our data if we cancel?',
    a: 'Your church data, member prayers, and history are retained for 90 days after cancellation in case you reactivate. After 90 days, data is permanently deleted.',
  },
  {
    q: 'Do individual members need to pay?',
    a: 'Never. Individual users \u2014 even members of a paid church \u2014 always use PrayerJar for free.',
  },
  {
    q: 'Do you offer discounts for non-profits or small congregations?',
    a: 'Email hello@prayerjar.org to discuss your situation. We want churches of every size to be able to use these tools.',
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CellIcon({ value }: { value: CellValue }) {
  if (value === true) return <Check className="h-4 w-4 text-primary mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-xs font-medium">{value}</span>;
}

function PlanBadge({ plan }: { plan: string }) {
  const tier = plan.toLowerCase().replace('+', '') as keyof typeof TIER_STYLES;
  const style = TIER_STYLES[tier] ?? TIER_STYLES.pro;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
      <Crown className="h-3 w-3" />
      {plan}+
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PaidFeaturesPage() {
  const plans = [PLANS.free, PLANS.starter, PLANS.pro, PLANS.enterprise];

  return (
    <main className="max-w-5xl mx-auto px-4 py-14">
      {/* ---- Back link ---- */}
      <Link
        href="/docs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Docs
      </Link>

      {/* ---- Hero ---- */}
      <div className="rounded-2xl border bg-card p-8 sm:p-12 mb-12">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Paid Features Guide
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
              What church plan subscribers get -- and how to make the most of every feature.
            </p>
          </div>
        </div>
      </div>

      {/* ---- Ministry note ---- */}
      <div className="rounded-xl border bg-card p-6 mb-14 flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Heart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm mb-1">Prayer is always free.</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            There is no paywall on submitting a prayer request or praying for others. Church plans exist to support congregations that need pastoral tools and oversight features. Individual users never need to pay anything. Rows marked &ldquo;coming soon&rdquo; below are not available today — please do not choose a plan for them yet.
          </p>
        </div>
      </div>

      {/* ---- Plan cards ---- */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Plans at a glance</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const style = TIER_STYLES[plan.tier];
            const isPopular = plan.tier === 'pro';
            return (
              <div
                key={plan.tier}
                className={`relative rounded-xl border-2 p-6 space-y-5 transition-shadow hover:shadow-lg ${
                  isPopular
                    ? 'border-primary ring-2 ring-primary/10 bg-card'
                    : 'border bg-card'
                }`}
              >
                {/* pj-s26-09: a "Most Popular" badge sat here. No church has
                    ever subscribed — every row has a null subscription_id and
                    null first_paid_at — so there is no popularity data behind
                    it. Same defect as the trust strip: fabricated social proof
                    derived from nothing. Replaced with the fit statement,
                    which is a judgement we can actually stand behind (and
                    matches /for-churches, where brand guide §7 #12 bans the
                    badge outright). */}
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-primary text-primary-foreground">
                    <Zap className="h-3 w-3" />
                    Best for 150–500 members
                  </span>
                )}

                {/* Plan icon + name */}
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${style.bg} flex items-center justify-center`}>
                    <Crown className={`h-5 w-5 ${style.color}`} />
                  </div>
                  <p className="font-semibold text-base">{plan.name}</p>
                </div>

                {/* Price */}
                <div>
                  <p className="text-3xl font-bold">
                    {plan.tier === 'enterprise' ? (
                      <span className="text-base font-semibold">Contact sales</span>
                    ) : plan.monthlyPriceCents === 0 ? (
                      'Free'
                    ) : (
                      <>
                        {formatCents(plan.monthlyPriceCents)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </>
                    )}
                  </p>
                  {plan.yearlyPriceCents > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      or {formatCents(plan.yearlyPriceCents)}/yr (save ~20%)
                    </p>
                  )}
                </div>

                {/* Feature list */}
                <ul className="space-y-2 pt-2 border-t">
                  {plan.features.map((f) => {
                    // A checkmark beside "(coming soon)" still reads as included.
                    const comingSoon = isComingSoonFeature(f);
                    return (
                      <li
                        key={f}
                        className={`text-sm flex items-start gap-2.5 ${
                          comingSoon
                            ? 'text-muted-foreground/70 italic'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {comingSoon ? (
                          <Clock className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                        )}
                        <span>{f}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          Ready to upgrade?{' '}
          <Link href="/for-churches" className="text-primary underline underline-offset-4">
            View the For Churches page
          </Link>{' '}
          to get started.
        </p>
      </section>

      {/* ---- Full comparison table ---- */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-cyan-500" />
          </div>
          <h2 className="text-xl font-semibold">Full comparison</h2>
        </div>

        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3.5 font-medium w-[40%]">Feature</th>
                {plans.map((p) => {
                  const style = TIER_STYLES[p.tier];
                  return (
                    <th key={p.tier} className="text-center px-3 py-3.5 font-medium">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
                        {p.name}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON.map((row, i) => (
                <tr key={row.feature} className={`border-b last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                  <td className="px-4 py-3 text-muted-foreground">{row.feature}</td>
                  <td className="text-center px-3 py-3"><CellIcon value={row.free} /></td>
                  <td className="text-center px-3 py-3"><CellIcon value={row.starter} /></td>
                  <td className="text-center px-3 py-3"><CellIcon value={row.pro} /></td>
                  <td className="text-center px-3 py-3"><CellIcon value={row.enterprise} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Feature deep dives ---- */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>
          <h2 className="text-xl font-semibold">Pro feature details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURE_DEEP_DIVES.map(({ icon: Icon, title, plan, color, bg, border, body, planDetail }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-6 space-y-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base mb-1">{title}</p>
                  <PlanBadge plan={plan} />
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>

              {/* Plan detail note */}
              {planDetail && (
                <p className="text-xs text-muted-foreground border-t pt-3">
                  <span className="font-medium">Availability:</span> {planDetail}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold">Common questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </section>

      {/* ---- CTA Footer ---- */}
      <div className="rounded-2xl border bg-card p-8 sm:p-10 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Church className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">Ready to equip your church?</h3>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6">
          Start free, upgrade when you need pastoral tools. Every plan comes with a community that prays.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/for-churches"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" />
            View Church Plans
          </Link>
          <Link
            href="/docs/churches"
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            Church Admin Guide
          </Link>
          <a
            href="mailto:hello@prayerjar.org"
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Contact Sales
          </a>
        </div>
      </div>
    </main>
  );
}
