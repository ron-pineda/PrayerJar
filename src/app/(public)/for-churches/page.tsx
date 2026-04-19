import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MessageSquare,
  LayoutDashboard,
  Inbox,
  UserCheck,
  CheckSquare,
  Users,
  Monitor,
  BarChart2,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrayerJar } from '@/components/prayer-jar';
import { ScrollReveal } from '@/components/scroll-reveal';
import { PricingCalculator } from '@/components/pricing-calculator';
import { TierCardsSection } from '@/components/tier-cards-section';
import { FaqAccordion } from '@/components/faq-accordion';
import { ForChurchesViewTracker } from '@/components/for-churches-view-tracker';
import {
  PLANS,
  PASTORAL_DASHBOARD_TIER_NAME,
  PASTORAL_CARE_INBOX_TIER,
  PRAYER_TEAM_ASSIGNMENTS_TIER,
  TESTIMONY_APPROVAL_QUEUE_TIER,
} from '@/lib/plans';
import { db } from '@/db';
import { prayers, churchMembers } from '@/db/schema';
import { or, eq, sql, count } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'PrayerJar for Churches & Ministries',
  description:
    'PrayerJar is the private prayer wall your congregation already wanted — safe, named, and built around care. Your pastoral team sees who is carrying what. Your members know they are prayed for.',
};

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Two walls, one place — public and private.',
    description:
      'Any member can post to the public wall and receive prayer from the broader PrayerJar community. Small Church plans add a private wall that only your congregation sees — a safe room for the requests people carry but do not want to share publicly.',
    tierLabel: `Free (public); ${PLANS.starter.name} and above (private)`,
  },
  {
    icon: LayoutDashboard,
    title: 'See every open prayer before the week is over.',
    description:
      'The pastoral dashboard shows you active prayers, who has been followed up with, and what is still open — all in one view. It is where pastoral notes live, too: private observations your care team records but the member never sees.',
    tierLabel: `${PASTORAL_DASHBOARD_TIER_NAME} ($${PLANS.starter.monthlyPriceCents / 100}/mo) and above`,
  },
  {
    icon: Inbox,
    title: 'Someone left a request on Sunday. Know by Monday.',
    description:
      'The pastoral care inbox surfaces prayer requests your care team has not yet reached — no ranking, no algorithmic sorting, just a list of people waiting. You decide who follows up and when.',
    tierLabel: `${PLANS[PASTORAL_CARE_INBOX_TIER].name} ($${PLANS.starter.monthlyPriceCents / 100}/mo) and above`,
  },
  {
    icon: UserCheck,
    title: 'Route follow-up to the right person, not just anyone.',
    description:
      'Assign specific requests to individual members of your care team. Each assignee sees only what is theirs. Leaders see the full board. Nothing falls through because nobody owned it.',
    tierLabel: `${PLANS[PRAYER_TEAM_ASSIGNMENTS_TIER].name} ($${PLANS.pro.monthlyPriceCents / 100}/mo) and above`,
  },
  {
    icon: CheckSquare,
    title: 'Answered prayers, published carefully.',
    description:
      'When a member marks a prayer answered and writes a testimony, it waits in your approval queue before going live. You read it, decide what belongs on the wall, and post it with one click.',
    tierLabel: `${PLANS[TESTIMONY_APPROVAL_QUEUE_TIER].name} ($${PLANS.pro.monthlyPriceCents / 100}/mo) and above`,
  },
  {
    icon: Users,
    title: 'Prayer circles for every part of your church.',
    description:
      'Small groups keep requests inside the people who belong to them — a women\'s Bible study sees its own wall, not the whole church\'s. Small Church supports up to five groups. Growing Church removes the cap.',
    tierLabel: `${PLANS.starter.name} (up to ${PLANS.starter.limits.groups} groups); ${PLANS.pro.name} (unlimited)`,
  },
  {
    icon: Monitor,
    title: 'Real-time prayer during services and retreats.',
    description:
      'Display prayer submissions on a screen as they come in — during a Sunday service, a conference, or a silent retreat. A moderation console lets you approve what shows before it appears publicly.',
    tierLabel: `${PLANS.pro.name} ($${PLANS.pro.monthlyPriceCents / 100}/mo) and above`,
  },
  {
    icon: BarChart2,
    title: 'Know what your congregation is carrying, week by week.',
    description:
      'Weekly digests show which prayers are active, which have been answered, and where engagement is rising or falling. Growing Church adds advanced analytics and CSV exports for leadership meetings.',
    tierLabel: `Basic analytics — ${PLANS.starter.name} and above; Advanced analytics + CSV exports — ${PLANS.pro.name} and above`,
  },
  {
    icon: Link2,
    title: 'Integrates with Planning Center.',
    description:
      'Your Planning Center member list becomes your PrayerJar prayer community automatically — no CSV imports, no double entry. New members show up the next day, so your pastoral picture stays current.',
    tierLabel: `${PLANS.pro.name} ($${PLANS.pro.monthlyPriceCents / 100}/mo) and above`,
  },
];

const FAQ_ITEMS = [
  {
    q: 'Is prayer free for our congregation?',
    a: 'Yes, always. Any member can submit and pray for requests at no cost. Plans cover pastoral tools and church admin features — not the act of praying.',
  },
  {
    q: 'Is there a trial period?',
    a: `No timed trial. The Free tier is your on-ramp: up to ${PLANS.free.limits.members} members and ${PLANS.free.limits.groups} groups, with no credit card and no expiration. Upgrade when you need more people, more groups, or pastoral tools.`,
  },
  {
    q: 'What happens when we reach our member cap?',
    a: 'You will see a notice in your admin panel when you are approaching the limit. New members cannot join until you upgrade or remove inactive accounts. No one currently in your church loses access — only new signups are paused.',
  },
  {
    q: 'How does annual billing work?',
    a: `Annual plans are billed once per year at 15% off the monthly rate. Small Church is $193.80/yr ($16.15/mo). Growing Church is $499.80/yr ($41.65/mo). You can switch between monthly and annual from your billing settings at any time; changes take effect at the next renewal.`,
  },
  {
    q: 'What if our church grows into a larger plan?',
    a: 'Upgrade anytime from your billing settings. You are charged a prorated amount for the rest of the current billing period and move to the new plan immediately. Your data, members, and groups all carry over.',
  },
  {
    q: 'Can we migrate from another tool?',
    a: 'PrayerJar does not currently offer an automated import from other prayer or ChMS tools. Your members can join by invitation link. Prayer history from another system would need to be re-entered manually. If your situation is more complex, contact us before signing up and we can talk through it.',
  },
  {
    q: 'Can we cancel anytime?',
    a: 'Yes. Cancel from your billing settings. You keep access until the end of the billing period you have already paid for. We do not charge cancellation fees and we do not lock you in.',
  },
  {
    q: 'Do you offer a 501(c)(3) discount?',
    a: 'Not at this time. Nonprofit pricing is on our roadmap but is not available yet. If this is a deciding factor for your church, reach out at hello@prayerjar.org and flag it — it helps us prioritize.',
  },
];

async function getTrustStats() {
  const [churchCountRow, prayerRows, memberRows] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(DISTINCT ${churchMembers.churchId})` })
      .from(churchMembers),
    db
      .select({ count: count() })
      .from(prayers)
      .where(or(eq(prayers.status, 'active'), eq(prayers.status, 'answered'))),
    db
      .select({ count: count() })
      .from(churchMembers),
  ]);

  return {
    churches: Number(churchCountRow[0]?.count ?? 0),
    prayers: Number(prayerRows[0]?.count ?? 0),
    members: Number(memberRows[0]?.count ?? 0),
  };
}

export default async function ForChurchesPage() {
  const trust = await getTrustStats();
  return (
    <main className="min-h-screen">
      {/* Funnel instrumentation — fires for_churches_view on mount */}
      <ForChurchesViewTracker />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          For churches &amp; ministries
        </p>

        {/* Jar motif — once per page, in the hero */}
        <div className="flex justify-center mb-8">
          <PrayerJar
            count={trust.prayers}
            size="lg"
            countLabel={`${trust.prayers.toLocaleString()} prayers held across ${trust.churches} churches`}
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">
          No one falls through the cracks between Sundays.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
          PrayerJar is the private prayer wall your congregation already wanted
          — safe, named, and built around care. Your pastoral team sees who is
          carrying what. Your members know they are prayed for.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" render={<Link href="/church/create" />}>
            Start your church free
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<a href="mailto:hello@prayerjar.org" />}
          >
            Talk to us
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Free tier available. No credit card required.
        </p>
      </section>

      {/* ── Verse / Mission Strip ────────────────────────────────────── */}
      <div className="border-t border-b border-amber-900/20 bg-amber-950/10 py-4 mb-12 max-w-lg mx-auto px-4 text-center">
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          &ldquo;Bear one another&apos;s burdens, and so fulfill the law of
          Christ.&rdquo;
        </p>
        <p className="text-xs text-primary mt-2">Galatians 6:2</p>
      </div>

      {/* ── Features Grid ────────────────────────────────────────────── */}
      <section className="pb-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-2">
          What your pastoral team gets
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-12">
          Every feature below is available now — no waitlist, no setup fees.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div className="rounded-xl border bg-card p-6 space-y-3 h-full">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-base leading-snug">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium pt-1">
                    {f.tierLabel}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ── Pricing Calculator ───────────────────────────────────────── */}
      <section className="pb-20 px-4 max-w-2xl mx-auto">
        <ScrollReveal>
          <h2 className="text-2xl font-bold tracking-tight text-center mb-3">
            Find the right plan
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Move the slider to see which plan fits your church.
          </p>
          <PricingCalculator />
        </ScrollReveal>
      </section>

      {/* ── Tier Cards ───────────────────────────────────────────────── */}
      <section className="pb-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-3">
          Plans
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-10">
          Prayer is always free. Pastoral tools start at $
          {PLANS.starter.monthlyPriceCents / 100} a month.
        </p>
        <TierCardsSection />
      </section>

      {/* ── Pricing FAQ ──────────────────────────────────────────────── */}
      <section className="pb-20 px-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold tracking-tight mb-8 text-center">
          Common questions
        </h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      {/* ── Trust Strip ─────────────────────────────────────── */}
      {trust.churches > 0 && (
        <section className="pb-20 px-4 max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="rounded-xl border border-amber-900/20 bg-amber-950/10 dark:bg-amber-950/20 py-10 px-6 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">
                PrayerJar by the numbers
              </p>
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
                    {trust.churches}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Churches</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
                    {trust.prayers.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Prayers Held</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
                    {trust.members.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Members Prayed For</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ── Enterprise / Network Contact Section ─────────────────────── */}
      <section className="pb-20 px-4 max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <div className="rounded-xl border bg-card p-8 space-y-4">
            <h2 className="text-xl font-bold tracking-tight">
              Network plans — starting at $199 / mo
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For multi-site churches, denominations, and networks that have
              outgrown a single-church account.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A Network plan is a bespoke agreement. You get unlimited
              everything, volume pricing, and a contract that fits how your
              denomination actually operates. Custom subdomain and SSO are on
              the roadmap — we can discuss timeline when we talk.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not put Network through self-serve checkout. We want to
              understand your situation first.
            </p>
            <Button
              size="lg"
              render={<a href="/for-churches/demo" />}
            >
              Book a call
            </Button>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="pb-20 px-4 text-center">
        <div className="max-w-md mx-auto rounded-xl border bg-amber-950/10 border-amber-900/20 p-8 space-y-4">
          <p className="text-lg font-semibold">Ready to start?</p>
          <p className="text-sm text-muted-foreground">
            Prayer is always free. Pastoral tools start at $
            {PLANS.starter.monthlyPriceCents / 100} a month.
          </p>
          <Button size="lg" render={<Link href="/church/create" />}>
            Start your church free
          </Button>
          <p className="text-xs text-muted-foreground">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>
    </main>
  );
}
