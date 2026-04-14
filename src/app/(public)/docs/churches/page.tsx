import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Church Admin Guide | PrayerJar Docs' };

const SECTIONS = [
  {
    id: 'setup',
    title: 'Setting Up Your Church',
    icon: '⛪',
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
        body: 'Roles: Admin (full access), Pastor (can view pastoral dashboard and flagged prayers, add notes, make assignments), Member (can post to the private wall and see other members\' requests).',
      },
    ],
  },
  {
    id: 'private-wall',
    title: 'Private Prayer Wall',
    icon: '🔒',
    steps: [
      {
        heading: 'What it is',
        body: 'Your church\'s private prayer wall is visible only to members. Members submit requests directly to it — separate from the public community feed.',
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
    title: 'Pastoral Dashboard',
    icon: '📋',
    steps: [
      {
        heading: 'Overview',
        body: 'The pastoral dashboard (Pro plan) gives admins and pastors a bird\'s-eye view of church prayer activity: active requests, recent prayer volume, member engagement, and flagged items.',
      },
      {
        heading: 'AI-flagged care alerts',
        body: 'Requests containing crisis language — self-harm indicators, acute grief, mental health language — are automatically flagged for pastoral review. They appear in the Flagged tab.',
      },
      {
        heading: 'Reviewing flagged requests',
        body: 'Open a flagged request to see the full content and the reason it was flagged. From here you can: add a private pastoral note, assign it to a pastor for follow-up, or dismiss the flag.',
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
    title: 'Church Groups',
    icon: '👥',
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
    title: 'Live Event Prayer Wall',
    icon: '🎤',
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
    title: 'Analytics & Reports',
    icon: '📊',
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
    title: 'Church Directory Listing',
    icon: '🗺️',
    steps: [
      {
        heading: 'Getting listed',
        body: 'PrayerJar\'s Find a Church directory uses Google Places data. If your church is on Google Maps, it can be found in the directory. Claim your listing to manage it.',
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
    title: 'Billing & Plans',
    icon: '💳',
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

export default function ChurchAdminGuidePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-14">

      <div className="mb-12">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Docs</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4 mb-3">Church Admin Guide</h1>
        <p className="text-muted-foreground">
          Everything pastors and administrators need to set up and run a church community on PrayerJar.
        </p>
      </div>

      {/* Plan callout */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 mb-12 space-y-2">
        <p className="text-sm font-semibold">Which plan do I need?</p>
        <p className="text-sm text-muted-foreground">
          The free plan supports up to 25 members with basic features. The{' '}
          <Link href="/docs/paid" className="text-primary underline underline-offset-4">Starter ($19/mo)</Link>{' '}
          and{' '}
          <Link href="/docs/paid" className="text-primary underline underline-offset-4">Pro ($49/mo)</Link>{' '}
          plans unlock pastoral tools, AI-flagged care alerts, analytics, and event walls.
          See the <Link href="/docs/paid" className="text-primary underline underline-offset-4">Paid Features guide</Link> for a full comparison.
        </p>
      </div>

      {/* Quick nav */}
      <nav className="rounded-xl border bg-muted/30 p-4 mb-12" aria-label="Guide sections">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Sections</p>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent/50 transition-colors"
            >
              {s.icon} {s.title}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-14">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-6">
              <span>{section.icon}</span>
              {section.title}
            </h2>
            <ol className="space-y-5">
              {section.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.heading}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-14 pt-8 border-t space-y-4">
        <p className="text-sm text-muted-foreground">
          Have a question not covered here? Email{' '}
          <a href="mailto:hello@prayerjar.org" className="text-primary underline underline-offset-4">hello@prayerjar.org</a>
          {' '}and we'll respond within one business day.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/for-churches', title: 'For Churches', desc: 'Plans and pricing overview' },
            { href: '/docs/paid', title: 'Paid Features', desc: 'Full plan comparison' },
            { href: '/docs/guide', title: 'User Guide', desc: 'Guide for individual members' },
          ].map(({ href, title, desc }) => (
            <Link key={href} href={href} className="rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}
