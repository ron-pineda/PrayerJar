import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Crown,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = { title: 'Church Admin Guide | PrayerJar Docs' };

/* ------------------------------------------------------------------ */
/*  Section data                                                       */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  {
    id: 'setup',
    emoji: '🏗️',
    title: 'Setting Up Your Church',
    subtitle: 'Get your church live in under 10 minutes.',
    border: 'border-blue-500/30',
    numBg: 'bg-blue-500',
    numText: 'text-blue-500',
    headerBg: 'from-blue-500/10 to-blue-500/5',
    plan: null,
    steps: [
      {
        heading: 'Create your church profile',
        body: 'Sign in, then go to /church/create. Walk through the setup wizard: enter your church name, denomination (optional), and a welcome message that members see when they join.',
      },
      {
        heading: 'Your church URL',
        body: 'Your church gets a unique slug (e.g. /church/grace-community). Share this link with your congregation to let them join.',
      },
      {
        heading: 'Invite members',
        body: "From your church dashboard → Team, generate an invite link or add members by email. Members can also discover your church via the Find a Church directory.",
      },
      {
        heading: 'Assign roles',
        body: 'Roles: Admin (full access), Pastor (can view pastoral dashboard and flagged prayers, add notes, make assignments), Member (joins the church and appears on your roster; posting to a private church wall is not available yet).',
      },
    ],
  },
  {
    id: 'private-wall',
    emoji: '🔒',
    title: 'Private Prayer Wall (coming soon)',
    subtitle: 'Built, but nothing can reach it yet.',
    border: 'border-emerald-500/30',
    numBg: 'bg-emerald-500',
    numText: 'text-emerald-500',
    headerBg: 'from-emerald-500/10 to-emerald-500/5',
    plan: 'Starter',
    steps: [
      {
        heading: 'Not available yet',
        body: 'The wall page is built and visible only to members, but a prayer is not attached to a church when it is submitted — so nothing ever lands on it. It shows an empty state on every plan. We are fixing the submission path before we count this as shipped.',
      },
      {
        heading: 'What it will be',
        body: "Your church's private prayer wall, visible only to members, who submit requests directly to it — separate from the public community feed.",
      },
      {
        heading: 'Where it lives',
        body: 'Members navigate to /church/[your-slug]/wall. It is also linked from their profile once they join your church.',
      },
      {
        heading: 'Custom branding (Pro plan)',
        body: 'Upload your church logo and set accent colors in Settings → Branding. The private wall will display your branding instead of the default PrayerJar look once the wall itself is reachable.',
      },
    ],
  },
  {
    id: 'pastoral-dashboard',
    emoji: '📋',
    title: 'Pastoral Dashboard',
    subtitle: 'Pastoral notes and assignments, kept where your care team can read them.',
    border: 'border-violet-500/30',
    numBg: 'bg-violet-500',
    numText: 'text-violet-500',
    headerBg: 'from-violet-500/10 to-violet-500/5',
    plan: 'Pro',
    steps: [
      {
        heading: 'Overview',
        body: 'The pastoral dashboard is where admins and pastors keep notes and assignments. Its prayer-activity counters — active requests and recent volume — read from a church link that is not written yet, so they show zero rather than your congregation.',
      },
      {
        heading: 'Pastoral notes',
        body: 'Notes are visible only to admins and pastors — never to the member who submitted the request. Use them for internal follow-up context.',
      },
      {
        heading: 'Assignments',
        body: 'Assign a request to a specific pastor or leader. They receive a notification and the request appears in their assignment queue.',
      },
    ],
  },
  {
    id: 'groups',
    emoji: '👥',
    title: 'Church Groups (coming soon)',
    subtitle: 'Members can start groups today. Attaching them to your church is not built yet.',
    border: 'border-amber-500/30',
    numBg: 'bg-amber-500',
    numText: 'text-amber-500',
    headerBg: 'from-amber-500/10 to-amber-500/5',
    plan: null,
    steps: [
      {
        heading: 'Not available yet',
        body: 'A group is not attached to a church when it is created, so your church Groups page is empty on every plan and the group caps in the plan table do not yet apply to anything.',
      },
      {
        heading: 'What works today',
        body: "Any member can start a prayer group and share its invite code, and requests posted to that group stay inside it. Those groups just are not owned by your church — you cannot see or administer them from the church dashboard.",
      },
      {
        heading: 'What it will be',
        body: "Groups you organize around sub-communities of your congregation — Women's Ministry, Youth Group, Small Group 4 — created from the church dashboard and visible to your admins.",
      },
    ],
  },
  {
    id: 'events',
    emoji: '📡',
    title: 'Live Event Prayer Wall (coming soon)',
    subtitle: 'Every part is built except the one that starts an event.',
    border: 'border-rose-500/30',
    numBg: 'bg-rose-500',
    numText: 'text-rose-500',
    headerBg: 'from-rose-500/10 to-rose-500/5',
    plan: 'Starter',
    steps: [
      {
        heading: 'Not available yet',
        body: 'There is no screen for creating an event. Do not follow older instructions telling you to click Create Event on the events page — that link points at a page that does not exist. Until an event can be created, nothing in the rest of this section can be reached.',
      },
      {
        heading: 'What it will be',
        body: 'A real-time, projected prayer wall for worship services, conferences, retreats, or prayer meetings. Attendees submit prayers from their phones; a moderator approves them before they appear on screen.',
      },
      {
        heading: 'Sharing the submission link',
        body: 'Attendees visit a short URL (shown in the event setup) on their phones to submit prayers. No PrayerJar account required.',
      },
      {
        heading: 'Moderating submissions',
        body: 'Open the moderation view on a separate device. New submissions appear in real-time. Approve to display them on the wall, or dismiss inappropriate content.',
      },
      {
        heading: 'The display screen',
        body: 'Open the display mode (/church/[slug]/events/[id]/wall) on the projected screen. Approved prayers scroll automatically. Your branding is applied.',
      },
      {
        heading: 'After the event',
        body: 'Download a CSV report of all prayers submitted. The report is useful for follow-up pastoral care.',
      },
    ],
  },
  {
    id: 'analytics',
    emoji: '📊',
    title: 'Analytics',
    subtitle: 'Member growth reports real numbers. The prayer charts do not yet.',
    border: 'border-cyan-500/30',
    numBg: 'bg-cyan-500',
    numText: 'text-cyan-500',
    headerBg: 'from-cyan-500/10 to-cyan-500/5',
    plan: 'Pro',
    steps: [
      {
        heading: 'Accessing analytics',
        body: 'Church dashboard → Analytics. Available on Pro and Enterprise plans.',
      },
      {
        heading: 'What reports real numbers today',
        body: 'Member growth over time. That chart reads church membership, which is recorded correctly.',
      },
      {
        heading: 'What shows zero (coming soon)',
        body: 'Prayer volume over time, engagement, category breakdown and answered prayer rate all read from a church link that is not written when a prayer is submitted. Until that is fixed, these four charts show zero for every church on every plan.',
      },
      {
        heading: 'Downloadable reports (coming soon)',
        body: 'Analytics are on screen only for now. Downloadable reports for elder board updates and annual reports are coming — they are not available yet.',
      },
    ],
  },
  {
    id: 'directory',
    emoji: '📍',
    title: 'Church Directory Listing',
    subtitle: 'Get discovered by people looking for a church near them.',
    border: 'border-orange-500/30',
    numBg: 'bg-orange-500',
    numText: 'text-orange-500',
    headerBg: 'from-orange-500/10 to-orange-500/5',
    plan: null,
    steps: [
      {
        heading: 'Getting listed',
        body: "PrayerJar's Find a Church directory uses Google Places data. If your church is on Google Maps, it can be found in the directory. Claim your listing to manage it.",
      },
      {
        heading: 'Claiming your listing',
        body: 'Search for your church in the directory, click "Claim this church," and follow the verification steps. Once verified, you can edit your description and contact info.',
      },
      {
        heading: 'Why it matters',
        body: 'People using the Know Jesus pathway or searching for a local church in PrayerJar will find you. A claimed listing shows you are active on the platform.',
      },
    ],
  },
  {
    id: 'billing',
    emoji: '💳',
    title: 'Billing & Plans',
    subtitle: 'Manage your subscription, upgrade, or cancel anytime.',
    border: 'border-slate-500/30',
    numBg: 'bg-slate-500',
    numText: 'text-slate-500',
    headerBg: 'from-slate-500/10 to-slate-500/5',
    plan: null,
    steps: [
      {
        heading: 'Accessing billing',
        body: 'Go to Profile → Billing (visible only to church admins and pastors), or navigate to /billing.',
      },
      {
        heading: 'Changing your plan',
        body: 'From the Billing page, choose a new plan and follow the Stripe checkout flow. Changes take effect immediately.',
      },
      {
        heading: 'Cancelling',
        body: 'Cancel any time from the Billing page. You retain access until the end of the current billing period.',
      },
      {
        heading: 'Event licenses',
        body: 'Large one-off events can be purchased as licenses rather than a full plan upgrade. Contact hello@prayerjar.org for pricing.',
      },
    ],
  },
];

const PLAN_COLORS: Record<string, { badge: string }> = {
  Free:       { badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  Starter:    { badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  Pro:        { badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  Enterprise: { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
};

function PlanBadge({ plan }: { plan: string }) {
  const style = PLAN_COLORS[plan] ?? PLAN_COLORS.Pro;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${style.badge}`}>
      <Crown className="h-3 w-3" />
      {plan}+ plan
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ChurchAdminGuidePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-14">

      {/* ═══════════════════════════════════════════════════════
          BACK LINK
      ═══════════════════════════════════════════════════════ */}
      <Link
        href="/docs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Docs
      </Link>

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border bg-card p-8 sm:p-12 mb-12 text-center">
        <div className="space-y-4">
          <div className="text-3xl leading-none">⛪</div>
          <h1 className="text-4xl font-bold tracking-tight">Church Admin Guide</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything pastors and administrators need to set up and run a church community on PrayerJar.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          PLAN CALLOUT
      ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border bg-card p-6 mb-14">
        <div className="flex items-start gap-4">
          <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-2">Which plan do I need?</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              The free plan supports up to 25 members with basic features. The{' '}
              <Link href="/docs/paid" className="text-primary underline underline-offset-4 font-medium">Starter ($19/mo)</Link>{' '}
              and{' '}
              <Link href="/docs/paid" className="text-primary underline underline-offset-4 font-medium">Pro ($49/mo)</Link>{' '}
              paid plans include pastoral tools, pastoral notes &amp; assignments, and member growth analytics. Prayer analytics and event walls are not available yet.
              See the <Link href="/docs/paid" className="text-primary underline underline-offset-4 font-medium">Paid Features guide</Link> for a full comparison.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Free', 'Starter', 'Pro', 'Enterprise'].map((p) => (
                <span key={p} className={`text-[11px] font-semibold px-3 py-1 rounded-full ${PLAN_COLORS[p].badge}`}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SETUP FLOW — 4-step visual overview
      ═══════════════════════════════════════════════════════ */}
      <div className="mb-14">
        <div className="text-center space-y-2 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How to Set Up Your Church</p>
          <p className="text-muted-foreground text-sm">4 steps to launch your congregation on PrayerJar</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { num: 1, emoji: '🔑', title: 'Create Profile', desc: 'Sign in and run the setup wizard at /church/create' },
            { num: 2, emoji: '🔗', title: 'Get Your URL', desc: 'Share your unique /church/[slug] link with members' },
            { num: 3, emoji: '📧', title: 'Invite Members', desc: 'Send invite links or add emails from the Team tab' },
            { num: 4, emoji: '🎭', title: 'Assign Roles', desc: 'Set Admin, Pastor, and Member permissions' },
          ].map(({ num, emoji, title, desc }) => (
            <div key={num} className="rounded-lg border bg-card p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-black flex-shrink-0">
                  {num}
                </div>
                <span className="text-3xl leading-none">{emoji}</span>
              </div>
              <p className="font-bold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION NAVIGATION
      ═══════════════════════════════════════════════════════ */}
      <nav className="mb-14" aria-label="Guide sections">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 text-center">All Sections</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="group relative rounded-xl border bg-card hover:bg-accent/30 transition-all p-4 flex flex-col items-center text-center gap-2.5"
            >
              <span className="text-3xl leading-none">{s.emoji}</span>
              <span className="text-xs font-semibold leading-tight">{s.title}</span>
              {s.plan && (
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${PLAN_COLORS[s.plan].badge}`}>
                  {s.plan}+
                </span>
              )}
            </a>
          ))}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          SECTION CONTENT — numbered step cards
      ═══════════════════════════════════════════════════════ */}
      <div className="space-y-16">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-8">

            {/* Section header */}
            <div className="rounded-2xl border bg-card p-6 mb-6 flex items-start gap-5">
              <div className="text-5xl leading-none flex-shrink-0">{section.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-xl font-bold">{section.title}</h2>
                  {section.plan && <PlanBadge plan={section.plan} />}
                </div>
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              </div>
            </div>

            {/* Step cards */}
            <div className="space-y-3">
              {section.steps.map((step, i) => (
                <div key={i} className="rounded-xl border bg-card hover:bg-accent/20 transition-colors p-5 flex gap-5">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-black flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="pt-1.5">
                    <p className="font-semibold text-sm mb-1">{step.heading}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <div className="mt-16 pt-8 border-t space-y-6">

        <div className="rounded-2xl border bg-card p-6 flex items-start gap-4">
          <div className="text-3xl leading-none flex-shrink-0">✉️</div>
          <div>
            <p className="font-semibold text-sm mb-1">Have a question not covered here?</p>
            <p className="text-sm text-muted-foreground">
              Email{' '}
              <a href="mailto:hello@prayerjar.org" className="text-primary underline underline-offset-4 font-medium">hello@prayerjar.org</a>
              {' '}and we&rsquo;ll respond within one business day.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/for-churches', emoji: '⛪', title: 'For Churches', desc: 'Plans and pricing overview' },
            { href: '/docs/paid', emoji: '👑', title: 'Paid Features', desc: 'Full plan comparison' },
            { href: '/docs/guide', emoji: '📖', title: 'User Guide', desc: 'Guide for individual members' },
          ].map(({ href, emoji, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border bg-card hover:bg-accent/30 transition-all p-5 flex items-center gap-4"
            >
              <div className="text-2xl leading-none flex-shrink-0">{emoji}</div>
              <div>
                <p className="font-semibold text-sm flex items-center gap-1">
                  {title}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}
