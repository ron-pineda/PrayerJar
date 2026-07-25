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
  Clock,
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
  // Kept under ~160 chars so the honest half is not what Google truncates.
  // Follows the pj-s26-04 convention: written against the n=6 reality, no
  // volume claims (docs/sprint26/seo-audit.md §4).
  description:
    'PrayerJar for churches: pastoral notes, a care inbox and member rosters work today. The private church prayer wall, groups and live events are not built yet.',
};

/**
 * `notYet` marks a card whose claim a paying church cannot reach today. It
 * renders as an explicit strip on the card. Copy convention matches
 * pj-s26-01: name the gap in the description, do not bury it in a footnote.
 */
const FEATURES = [
  {
    icon: MessageSquare,
    title: 'A public wall today. A private church wall next.',
    description:
      'Any member can post to the public wall and receive prayer from the broader PrayerJar community. That part works today. The private wall — the one only your congregation sees — is built, but prayers are not yet attached to a church when they are submitted, so it stays empty no matter what you pay.',
    tierLabel: 'Free (public wall)',
    notYet: 'Private church wall is not available yet.',
  },
  {
    icon: LayoutDashboard,
    title: 'Pastoral notes, kept where your care team can read them.',
    description:
      'Your team records private observations against a prayer or a member — notes the member never sees — and everyone with pastoral access reads the same history. The open-prayer view on the same dashboard counts church prayers, and no prayer is attached to a church yet, so it reads zero.',
    tierLabel: `${PASTORAL_DASHBOARD_TIER_NAME} ($${PLANS.starter.monthlyPriceCents / 100}/mo) and above`,
    notYet: 'The open-prayer view is empty until prayers are church-linked.',
  },
  {
    icon: Inbox,
    title: 'One place for the follow-ups your team has recorded.',
    description:
      'The pastoral care inbox holds the notes your team writes as it follows up — who was spoken to, and what was said. Today every entry is added by hand. It does not yet gather unanswered requests on its own.',
    tierLabel: `${PLANS[PASTORAL_CARE_INBOX_TIER].name} ($${PLANS.starter.monthlyPriceCents / 100}/mo) and above`,
    notYet: 'An automatic queue of unreached requests is not available yet.',
  },
  {
    icon: UserCheck,
    title: 'Route follow-up to the right person, not just anyone.',
    description:
      'Assign a request to an individual member of your care team. Each assignee sees only what is theirs; leaders see the whole board. The assignment screen works, but there is nothing to put on it — no prayer is attached to a church yet.',
    tierLabel: `${PLANS[PRAYER_TEAM_ASSIGNMENTS_TIER].name} ($${PLANS.pro.monthlyPriceCents / 100}/mo) and above`,
    notYet: 'Nothing can be assigned until prayers are church-linked.',
  },
  {
    icon: CheckSquare,
    title: 'Answered prayers do not stop for review yet.',
    description:
      'When a member marks a prayer answered and writes a testimony, it publishes straight to the public praise wall today. It does not wait for you. The approval screen exists, but nothing arrives in it — so please do not pick a plan on the strength of this one.',
    tierLabel: `${PLANS[TESTIMONY_APPROVAL_QUEUE_TIER].name} ($${PLANS.pro.monthlyPriceCents / 100}/mo) and above`,
    notYet: 'Testimony review is not available yet. Testimonies publish unreviewed.',
  },
  {
    icon: Users,
    title: 'Prayer circles for every part of your church.',
    description:
      'Any member can start a prayer group and invite people into it, and requests posted there stay inside that group. Tying those groups to your church — so a women\'s Bible study appears on your church page and stays inside your congregation — is not wired up yet, so your church groups list is empty on every plan.',
    tierLabel: `${PLANS.starter.name} (up to ${PLANS.starter.limits.groups} groups); ${PLANS.pro.name} (unlimited)`,
    notYet: 'Church-owned groups are not available yet.',
  },
  {
    icon: Monitor,
    title: 'Real-time prayer during services and retreats.',
    description:
      'The submission wall, the moderation console and the projected display are all built and tested. There is no way to create an event yet — the button in your dashboard points at a page that does not exist — so none of it can be reached. This is first on the list to fix.',
    tierLabel: `${PLANS.pro.name} ($${PLANS.pro.monthlyPriceCents / 100}/mo) and above`,
    notYet: 'Not available yet. Events cannot be created.',
  },
  {
    icon: BarChart2,
    title: 'Member growth is the one number we can show you today.',
    description:
      'The member growth chart reports real figures. Prayer volume, engagement, category breakdown and answered rate all read from the church link that is not yet written, so each of them shows zero. There is no analytics export of any kind, and the Monday digest cannot count prayers for the same reason.',
    tierLabel: `Member growth — ${PLANS.starter.name} and above; deeper analytics — ${PLANS.pro.name} and above, once they report real numbers`,
    notYet: 'Prayer analytics and analytics exports are not available yet.',
  },
  {
    icon: Link2,
    title: 'Connects to Planning Center.',
    description:
      'Your Planning Center member list becomes your PrayerJar member list — no CSV imports, no double entry. The sync runs on a nightly schedule, so your member picture stays current. No church has connected one in production yet.',
    tierLabel: `${PLANS.pro.name} ($${PLANS.pro.monthlyPriceCents / 100}/mo) and above`,
  },
] satisfies ReadonlyArray<{
  icon: typeof MessageSquare;
  title: string;
  description: string;
  tierLabel: string;
  notYet?: string;
}>;

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

/**
 * Floors below which "PrayerJar by the numbers" is not social proof.
 *
 * Production held exactly one church row — a test record with no
 * subscription and no payment — and zero active prayers, so the strip
 * rendered "Churches 1 / Prayers Held 0" and the hero jar read
 * "0 prayers held across 1 churches". A single unpaid record is not
 * evidence, and a zero is not either.
 *
 * Both the hero count label and the strip read this one predicate, so
 * deleting the test church (pj-s26-12) cannot change what the page
 * asserts: at (0, 0, 0) and at (1, 0, 1) alike, neither renders.
 */
const TRUST_MIN_CHURCHES = 5;
const TRUST_MIN_PRAYERS = 25;
const TRUST_MIN_MEMBERS = 50;

type TrustStats = { churches: number; prayers: number; members: number };

function isPublishableTrust(t: TrustStats): boolean {
  return (
    t.churches >= TRUST_MIN_CHURCHES &&
    t.prayers >= TRUST_MIN_PRAYERS &&
    t.members >= TRUST_MIN_MEMBERS
  );
}

function pluralize(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

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
  const showTrust = isPublishableTrust(trust);
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
            countLabel={
              showTrust
                ? `${trust.prayers.toLocaleString()} ${pluralize(trust.prayers, 'prayer', 'prayers')} held across ${trust.churches.toLocaleString()} ${pluralize(trust.churches, 'church', 'churches')}`
                : undefined
            }
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">
          A quiet place for what your congregation is carrying.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-xl mx-auto">
          Real prayers, held by people who know the person who wrote them —
          named or anonymous, and never for likes.
        </p>
        <div className="mb-8 max-w-xl mx-auto rounded-lg border border-amber-900/30 bg-amber-950/10 px-4 py-3 text-left">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">
              Where the church side stands today.
            </span>{' '}
            Your member roster, pastoral notes, the care inbox and custom
            branding work now. The private congregation wall, church-owned
            groups, live events, testimony review and the prayer analytics do
            not — they are built but nothing can reach them yet. Every card
            below says which it is.
          </p>
        </div>
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
        <p className="text-center text-sm text-muted-foreground mb-4 max-w-xl mx-auto leading-relaxed">
          Some of what follows is not finished. Where a church cannot reach
          something yet, the card says so and explains why. We would rather you
          read it here than find it after you have paid.
        </p>
        <p className="text-center text-sm text-muted-foreground mb-12">
          No setup fees, and no charge for prayer itself on any plan.
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
                  {'notYet' in f && f.notYet && (
                    <p className="flex items-start gap-1.5 text-xs font-medium text-muted-foreground border-t pt-3">
                      <Clock
                        className="h-3.5 w-3.5 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{f.notYet}</span>
                    </p>
                  )}
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
      {showTrust && (
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
              denomination actually operates. A custom subdomain for your
              network, enterprise login and custom analytics reports are coming
              — none of the three is available yet. We can talk through what
              your network needs when we connect.
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
