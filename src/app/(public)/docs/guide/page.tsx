import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'User Guide | PrayerJar Docs' };

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '👋',
    steps: [
      {
        heading: 'No account? No problem.',
        body: 'You can browse and pray for public requests without signing in. Visit /pray or tap "Pray" in the navigation to see the current prayer feed.',
      },
      {
        heading: 'Create a free account',
        body: 'Sign in with Google or GitHub at /sign-in. This takes under 30 seconds. An account lets you submit your own requests, track who prayed for you, earn badges, and set notification preferences.',
      },
      {
        heading: 'Complete onboarding',
        body: "The first time you sign in, a quick orientation overlay introduces the main features. You can dismiss it immediately or follow along — it takes about 60 seconds.",
      },
    ],
  },
  {
    id: 'submitting-a-prayer',
    title: 'Submitting a Prayer Request',
    icon: '🫙',
    steps: [
      {
        heading: 'Tap "Submit a Request"',
        body: 'From the homepage or /pray page, press the main prayer button. A dialog will open.',
      },
      {
        heading: 'Write your request',
        body: 'Be as specific or as general as you need. You can write a sentence or several paragraphs. The community prays for whatever you share.',
      },
      {
        heading: 'Choose a category',
        body: 'Select the category that best fits: Health, Family, Work, Relationships, Faith, Grief, Finance, Community, or Other.',
      },
      {
        heading: 'Set privacy',
        body: 'Public — visible to the full community. Church Only — visible only to your church members. Private — only you and any assigned pastoral staff.',
      },
      {
        heading: 'Optional: stay anonymous',
        body: 'Toggle "Post anonymously" to hide your name. The community will pray without seeing who asked.',
      },
      {
        heading: 'Optional: mark as urgent',
        body: 'If you need prayer right now, flag it as urgent. Urgent requests surface higher in the feed.',
      },
      {
        heading: 'Submit',
        body: 'Your request goes live immediately (public requests are screened for safety). You will receive a notification each time someone prays for it.',
      },
    ],
  },
  {
    id: 'praying-for-others',
    title: 'Praying for Others',
    icon: '🙏',
    steps: [
      {
        heading: 'Open the prayer feed',
        body: 'Visit /pray to see active requests. You can filter by category or browse the full feed.',
      },
      {
        heading: 'Read a request',
        body: 'Tap any request card to open the full detail view.',
      },
      {
        heading: 'Press "I prayed for this"',
        body: 'One tap logs your intercession. The person who submitted the request gets a notification that someone prayed — even if you post anonymously.',
      },
      {
        heading: 'Leave an optional message',
        body: "After praying, you can type a brief encouraging message. Keep it uplifting and focused on the person's need. Messages are optional.",
      },
      {
        heading: 'Adopt a request',
        body: "Want to commit to praying for someone consistently? Tap \"Adopt\" to add it to your Prayer Journal for ongoing intercession.",
      },
    ],
  },
  {
    id: 'your-journal',
    title: 'Your Prayer Journal',
    icon: '📖',
    steps: [
      {
        heading: 'What the journal tracks',
        body: 'Every request you pray for — with or without a message — is logged in your journal automatically. Adopted requests are pinned.',
      },
      {
        heading: 'Accessing the journal',
        body: 'Go to Profile → Prayer Journal, or navigate directly to /journal.',
      },
      {
        heading: 'Filtering and reviewing',
        body: 'The journal shows when you prayed and any messages you left. You can see whether the request was later answered.',
      },
    ],
  },
  {
    id: 'answered-prayers',
    title: 'When a Prayer is Answered',
    icon: '✨',
    steps: [
      {
        heading: 'Mark it as answered',
        body: 'Go to My Prayers (/my-prayers), find the request, and tap "Mark as Answered."',
      },
      {
        heading: 'Share your testimony (optional)',
        body: "Write a short story of what happened. This becomes a testimony card that others can read on the Lights Released wall.",
      },
      {
        heading: 'A light is released',
        body: "Your prayer joins the Lights Released wall — a public celebration of God's faithfulness. The community rejoices with you.",
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications & Settings',
    icon: '🔔',
    steps: [
      {
        heading: 'Access Settings',
        body: 'Go to Profile → Settings, or navigate to /settings.',
      },
      {
        heading: 'Email frequency',
        body: 'Choose how often you receive email updates: Real-time (max 1 per 15 min), Daily digest, Weekly digest, or Off.',
      },
      {
        heading: 'Notification types',
        body: 'Toggle each event type individually: someone prays for you, someone leaves a message, you earn a badge, weekly digest.',
      },
      {
        heading: 'Quiet Hours',
        body: 'Set a daily window when notifications are suppressed (e.g. 10 PM to 7 AM). Choose your timezone so the window is accurate.',
      },
      {
        heading: 'In-app notifications',
        body: 'The bell icon in the top navigation shows your unread count. Tap it to see your full notification history.',
      },
    ],
  },
  {
    id: 'badges-streaks',
    title: 'Badges & Streaks',
    icon: '🏅',
    steps: [
      {
        heading: 'Earning badges',
        body: 'Badges are awarded automatically when you hit milestones: submitting your first prayer, praying for others 10 times, maintaining a 7-day streak, and more.',
      },
      {
        heading: 'Day streak',
        body: 'Your streak increments each day you pray for at least one request. The streak resets if you miss a day. A fire emoji appears at 7+ days.',
      },
      {
        heading: 'Viewing your badges',
        body: 'Go to Profile → Badges & Streak, or navigate to /badges. The full badge grid shows earned and unearned milestones.',
      },
    ],
  },
  {
    id: 'prayer-partner',
    title: 'Prayer Partner',
    icon: '🤝',
    steps: [
      {
        heading: 'What it is',
        body: 'Prayer Partners matches you one-on-one with another person for mutual, consistent intercession. You pray for each other regularly.',
      },
      {
        heading: 'Opt in',
        body: 'Go to Profile → Prayer Partner (/partner) and follow the opt-in flow. Matching happens automatically.',
      },
      {
        heading: 'Reminders',
        body: "You'll receive gentle reminders to pray for your partner. Your partner receives the same.",
      },
      {
        heading: 'Extending or ending',
        body: 'You can request to extend a partnership or end it at any time from the Partner page.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Privacy',
    icon: '⚙️',
    steps: [
      {
        heading: 'Editing your profile',
        body: 'Your name and profile photo come from your Google/GitHub account. Update them in your OAuth provider settings.',
      },
      {
        heading: 'Deleting your account',
        body: 'Go to Settings → Danger Zone. Type DELETE to confirm. Your account and all associated data are removed immediately. This cannot be undone.',
      },
      {
        heading: 'Data and privacy',
        body: 'We store your name, email, and submitted content. We never sell your data or run ads. See our Privacy Policy and Trust & Safety pages for full details.',
      },
    ],
  },
];

export default function UserGuidePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-14">

      <div className="mb-12">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Docs</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4 mb-3">User Guide</h1>
        <p className="text-muted-foreground">
          A step-by-step guide to using The Prayer Jar as an individual — from your first visit to advanced features.
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

      <div className="mt-14 pt-8 border-t">
        <p className="text-sm font-medium mb-4">Other guides</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/docs/churches', title: 'Church Admin Guide', desc: 'For pastors and administrators' },
            { href: '/docs/paid', title: 'Paid Features', desc: 'Church subscription plans' },
            { href: '/help', title: 'FAQ', desc: 'Quick answers' },
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
