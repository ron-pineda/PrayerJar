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
        body: "Roles: Admin (full access), Pastor (can view pastoral dashboard and flagged prayers, add notes, make assignments), Member (can post to the private wall and see other members' requests).",
      },
    ],
  },
  {
    id: 'private-wall',
    emoji: '🔒',
    title: 'Private Prayer Wall',
    subtitle: 'A safe space for your congregation — visible to members only.',
    border: 'border-emerald-500/30',
    numBg: 'bg-emerald-500',
    numText: 'text-emerald-500',
    headerBg: 'from-emerald-500/10 to-emerald-500/5',
    plan: 'Starter',
    steps: [
      {
        heading: 'What it is',
        body: "Your church's private prayer wall is visible only to members. Members submit requests directly to it — separate from the public community feed.",
      },
      {
        heading: 'Accessing it',
        body: 'Members navigate to /church/[your-slug]/wall. It is also linked from their profile once they join your church.',
      },
      {
        heading: 'Member submissions',
        body: 'Members can post as themselves or anonymously. They choose Public (to the full church), Group Only (a sub-group), or Private (pastoral staff only).',
      },
      {
        heading: 'Custom branding (Pro plan)',
        body: 'Upload your church logo and set accent colors in Settings → Branding. The private wall displays your branding instead of the default PrayerJar look.',
      },
    ],
  },
  {
    id: 'pastoral-dashboard',
    emoji: '📋',
    title: 'Pastoral Dashboard',
    subtitle: 'Real-time view of church activity, pastoral notes, and assignments.',
    border: 'border-violet-500/30',
    numBg: 'bg-violet-500',
    numText: 'text-violet-500',
    headerBg: 'from-violet-500/10 to-violet-500/5',
    plan: 'Pro',
    steps: [
      {
        heading: 'Overview',
        body: "The pastoral dashboard (Pro plan) gives admins and pastors a bird's-eye view of church prayer activity: active requests, recent prayer volume, and member engagement.",
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
    title: 'Church Groups',
    subtitle: 'Organize prayer across ministries, small groups, and teams.',
    border: 'border-amber-500/30',
    numBg: 'bg-amber-500',
    numText: 'text-amber-500',
    headerBg: 'from-amber-500/10 to-amber-500/5',
    plan: null,
    steps: [
      {
        heading: 'What groups are for',
        body: "Groups let you organize prayer within sub-communities of your congregation — Women's Ministry, Youth Group, Small Group 4, etc.",
      },
      {
        heading: 'Creating a group',
        body: 'From your church dashboard, go to Groups → New Group. Give it a name and optional description.',
      },
      {
        heading: 'Adding members to groups',
        body: 'Members can join groups themselves, or admins can add them. Group membership is independent of overall church membership.',
      },
      {
        heading: 'Group prayer wall',
        body: "Requests posted to a group are visible only to that group's members — not the full church.",
      },
    ],
  },
  {
    id: 'events',
    emoji: '📡',
    title: 'Live Event Prayer Wall',
    subtitle: 'Real-time projected prayer walls for services, retreats, and conferences.',
    border: 'border-rose-500/30',
    numBg: 'bg-rose-500',
    numText: 'text-rose-500',
    headerBg: 'from-rose-500/10 to-rose-500/5',
    plan: 'Starter',
    steps: [
      {
        heading: 'What it is',
        body: 'A real-time, projected prayer wall for worship services, conferences, retreats, or prayer meetings. Attendees submit prayers from their phones; a moderator approves them before they appear on screen.',
      },
      {
        heading: 'Creating an event',
        body: 'Go to church dashboard → Events → New Event. Set the event name, date, and an optional capacity limit.',
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
    title: 'Analytics & Reports',
    subtitle: 'Track engagement, trends, and answered prayer rates.',
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
        heading: 'What you can see',
        body: 'Prayer volume over time, most active members, response rates (how often prayers get responses vs. none), category breakdown, and answered prayer rate.',
      },
      {
        heading: 'PDF reports',
        body: 'Download a formatted PDF report for any time period. Useful for elder board updates or annual reports.',
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
              plans unlock pastoral tools, pastoral notes & assignments, analytics, and event walls.
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
              {' '}and we'll respond within one business day.
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
