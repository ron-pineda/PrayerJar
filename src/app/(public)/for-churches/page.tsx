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
import { FaqAccordion } from '@/components/faq-accordion';
import { ForChurchesViewTracker } from '@/components/for-churches-view-tracker';
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
 * `notYet` marks a card whose claim a church cannot reach today. It renders as
 * an explicit strip on the card. Copy convention matches pj-s26-01: name the gap
 * in the description, do not bury it in a footnote.
 *
 * Sprint 27 (pj-s27-02): every card also carried a `tierLabel` naming the plan
 * and price it belonged to. Paid tiers were withdrawn from the product, so all
 * nine labels are gone and the field no longer exists.
 */
const FEATURES = [
  {
    icon: MessageSquare,
    title: 'A public wall today. A private church wall next.',
    description:
      'Any member can post to the public wall and receive prayer from the broader PrayerJar community. That part works today. The private wall — the one only your congregation sees — is built, but prayers are not yet attached to a church when they are submitted, so it stays empty.',
    notYet: 'Private church wall is not available yet.',
  },
  {
    icon: LayoutDashboard,
    title: 'Pastoral notes, kept where your care team can read them.',
    description:
      'Your team records private observations against a prayer or a member — notes the member never sees — and everyone with pastoral access reads the same history. The dashboard beside it shows your member count and your open follow-ups, both real. It used to show two more counts that always read zero; those tiles are gone until they can count something.',
    notYet: 'Open prayers and flagged prayers are not counted yet.',
  },
  {
    icon: Inbox,
    title: 'One place for the follow-ups your team has recorded.',
    description:
      'The pastoral care inbox holds the notes your team writes as it follows up — who was spoken to, and what was said. Today every entry is added by hand. It does not yet gather unanswered requests on its own.',
    notYet: 'An automatic queue of unreached requests is not available yet.',
  },
  {
    icon: UserCheck,
    title: 'Route follow-up to the right person, not just anyone.',
    description:
      'Assign a request to an individual member of your care team. Each assignee sees only what is theirs; leaders see the whole board. Assignments work end to end — they are recorded against your church directly, so the empty church link elsewhere on this page does not affect them. The rough edge is picking the prayer: there is no chooser yet, so someone has to paste the request’s ID in by hand.',
    notYet: 'You have to paste a prayer ID by hand — there is no picker yet.',
  },
  {
    icon: CheckSquare,
    title: 'Answered prayers do not stop for review yet.',
    description:
      'When a member marks a prayer answered and writes a testimony, it publishes straight to the public praise wall today. It does not wait for you. The approval screen is hidden for now, because nothing ever arrives in it.',
    notYet: 'Testimony review is not available yet. Testimonies publish unreviewed.',
  },
  {
    icon: Users,
    title: 'Prayer circles for every part of your church.',
    description:
      'Any member can start a prayer group and invite people into it, and requests posted there stay inside that group. Tying those groups to your church — so a women\'s Bible study appears on your church page and stays inside your congregation — is not wired up yet, so your church groups list is empty.',
    notYet: 'Church-owned groups are not available yet.',
  },
  {
    icon: Monitor,
    title: 'Real-time prayer during services and retreats.',
    description:
      'The submission wall, the moderation console and the projected display are all built and tested. There is no way to create an event yet — your dashboard has no create button, and the API refuses the request — so none of it can be reached. This is first on the list to fix.',
    notYet: 'Not available yet. Events cannot be created.',
  },
  {
    icon: BarChart2,
    title: 'Analytics are switched off until they can tell the truth.',
    description:
      'Four of the five charts — prayer volume, engagement, category breakdown and answered rate — read from a church link that is not yet written, so every one of them drew a flat zero. A chart claiming your congregation prayed nothing is worse than no chart, so the whole page is off until the underlying link exists. Only member growth ever reported a real figure. There is no analytics export of any kind, and the Monday digest cannot count prayers for the same reason.',
    notYet: 'The analytics page is not available at the moment.',
  },
  {
    icon: Link2,
    title: 'Connects to Planning Center.',
    description:
      'Your Planning Center member list becomes your PrayerJar member list — no CSV imports, no double entry. The sync runs on a nightly schedule, so your member picture stays current. No church has connected one in production yet.',
  },
] satisfies ReadonlyArray<{
  icon: typeof MessageSquare;
  title: string;
  description: string;
  notYet?: string;
}>;

// Sprint 27 (pj-s27-02): five of the eight questions here were billing questions
// — trials, member caps, annual billing, moving up a plan, cancelling. There is
// nothing to bill for now, so they are gone rather than reworded.
const FAQ_ITEMS = [
  {
    q: 'What does PrayerJar cost our church?',
    a: 'Nothing. There is no paid plan to choose, no card to enter and no trial to run out. Everything described on this page is what you get.',
  },
  {
    q: 'How many people can we invite?',
    a: 'As many as your congregation has. There is no cap on members and no cap on groups.',
  },
  {
    q: 'Do you charge for prayer itself?',
    a: 'No, and we do not intend to. Any member can submit a request and pray for someone else at no cost.',
  },
  {
    q: 'Can we migrate from another tool?',
    a: 'PrayerJar does not currently offer an automated import from other prayer or ChMS tools. Your members can join by invitation link. Prayer history from another system would need to be re-entered manually. If your situation is more complex, contact us before you set up and we can talk through it.',
  },
  {
    q: 'We are a multi-site church or a denomination. Can you help?',
    a: 'Possibly, but not with anything built for it yet — PrayerJar handles one church at a time today. Write to hello@prayerjar.org and tell us how your network is structured. It helps us know what to build.',
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
// Floors below which "PrayerJar by the numbers" is not honestly earned, so
// neither the strip nor the hero count renders. Ron set these 2026-07-25;
// the earlier 5/25/50 hid the strip well past the point it was deserved.
const TRUST_MIN_CHURCHES = 3;
const TRUST_MIN_PRAYERS = 10;
const TRUST_MIN_MEMBERS = 20;

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
            Start your church
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
          Free to use. No credit card required.
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
          read it here than find it after you have set everything up.
        </p>
        <p className="text-center text-sm text-muted-foreground mb-12">
          All of it is free, and there is no setup fee.
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
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/*
        Sprint 27 (pj-s27-02): the pricing calculator and the tier cards used to
        sit here. Both are deleted, not hidden.
      */}

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
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

      {/*
        Sprint 27 (pj-s27-02): the Network / enterprise contact block sat here.
        It hardcoded "starting at $199 / mo" and pointed at /for-churches/demo,
        which is deleted. Multi-site churches are answered in the FAQ instead.
      */}

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="pb-20 px-4 text-center">
        <div className="max-w-md mx-auto rounded-xl border bg-amber-950/10 border-amber-900/20 p-8 space-y-4">
          <p className="text-lg font-semibold">Ready to start?</p>
          <p className="text-sm text-muted-foreground">
            Setting up your church costs nothing, and there is nothing to buy
            afterwards.
          </p>
          <Button size="lg" render={<Link href="/church/create" />}>
            Start your church
          </Button>
          <p className="text-xs text-muted-foreground">
            No credit card required.
          </p>
        </div>
      </section>
    </main>
  );
}
