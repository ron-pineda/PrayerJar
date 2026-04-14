import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Feature Guide | PrayerJar Docs' };

const FEATURES = [
  {
    category: 'Prayer Requests',
    icon: '🫙',
    items: [
      { name: 'Submit a prayer request', desc: 'Write a request in any length. Add category, urgency flag, and optional tags.' },
      { name: 'Anonymous submissions', desc: 'Post without revealing your name — the community prays without knowing who asked.' },
      { name: 'Privacy levels', desc: 'Choose Public (community-wide), Church Only (your congregation), or Private (pastoral staff only).' },
      { name: 'Prayer categories', desc: 'Health, Family, Work, Relationships, Faith, Grief, Finance, Community, and more.' },
      { name: 'Urgent flag', desc: 'Mark a request as urgent to surface it higher in the feed.' },
      { name: 'Audio prayers', desc: 'Record a voice prayer request for a more personal touch.' },
      { name: 'Video prayers', desc: 'Submit a short video prayer request.' },
      { name: 'Auto-expiry', desc: 'Requests expire after a set window — keeping the feed current and reducing clutter.' },
      { name: 'Request renewal', desc: 'Extend an active request before it expires.' },
      { name: 'Mark as answered', desc: 'When your prayer is answered, mark it and optionally share a testimony.' },
      { name: 'Testimony stories', desc: "Tell your story of how God answered — shown on the Lights Released wall." },
    ],
  },
  {
    category: 'Praying for Others',
    icon: '🙏',
    items: [
      { name: '"I prayed for this" button', desc: 'One tap to log intercession. The requester gets notified that someone prayed.' },
      { name: 'Prayer counter', desc: 'Each request shows how many times it has been prayed for.' },
      { name: 'Encouragement messages', desc: 'Leave an optional uplifting message alongside your prayer.' },
      { name: 'Anonymous prayer', desc: 'Pray and leave messages without revealing your identity.' },
      { name: 'Prayer Journal', desc: 'A personal log of every request you have interceded for.' },
      { name: 'Prayer adoption', desc: 'Commit to praying for a specific request regularly — it appears in your journal.' },
      { name: 'Streak tracking', desc: 'Your consecutive-day streak of praying for others. Earn a fire badge at 7 days.' },
    ],
  },
  {
    category: 'Community & Discovery',
    icon: '🌍',
    items: [
      { name: 'Community prayer feed', desc: 'Browse active requests from around the world — no account required.' },
      { name: 'Category filter', desc: 'Filter the feed by prayer category.' },
      { name: 'Pray by category page', desc: 'Dedicated pages for each category with focused browsing.' },
      { name: 'Lights Released wall', desc: 'A public wall of answered prayers and testimonies to celebrate together.' },
      { name: 'World Prayer map', desc: 'See prayers plotted on a globe by geographic origin.' },
      { name: 'Praise Wall', desc: 'Animated visualization of recent lights released.' },
      { name: 'Prayer Jar animation', desc: 'The homepage jar fills up as more prayers are submitted — visual community signal.' },
      { name: 'Live praying-now counter', desc: 'Shows how many people are actively praying right now.' },
    ],
  },
  {
    category: 'Prayer Partner',
    icon: '🤝',
    items: [
      { name: 'Matched prayer partnership', desc: 'Opt in to be matched with one other person for consistent mutual intercession.' },
      { name: 'Partner prayer reminders', desc: 'Gentle notifications reminding you to pray for your partner.' },
      { name: 'Partnership extension', desc: 'Request to extend a partnership beyond the default term.' },
      { name: 'Partnership history', desc: 'See past prayer partners in your profile.' },
    ],
  },
  {
    category: 'Notifications',
    icon: '🔔',
    items: [
      { name: 'Prayed-for notification', desc: 'Get notified when someone prays for your request.' },
      { name: 'Message notification', desc: 'Get notified when someone leaves you an encouraging message.' },
      { name: 'Badge notification', desc: 'Get notified when you earn a new badge.' },
      { name: 'Weekly digest', desc: 'Optional weekly summary of your prayer activity.' },
      { name: 'Email frequency control', desc: 'Choose real-time, daily digest, weekly digest, or off.' },
      { name: 'Quiet Hours', desc: 'Suppress notifications during a custom time window (e.g. 10 PM–7 AM) in your timezone.' },
      { name: 'Per-event toggles', desc: 'Individually enable/disable each notification type from Settings.' },
      { name: 'In-app notification center', desc: 'Bell icon in the header shows unread notification count and history.' },
    ],
  },
  {
    category: 'Gamification & Badges',
    icon: '🏅',
    items: [
      { name: 'Badge system', desc: 'Earn badges for milestones: first prayer, 10 prayers, 7-day streak, 100 prayers prayed for, and more.' },
      { name: 'Day streak', desc: 'Consecutive-day streak counter shown on your profile and badge page.' },
      { name: 'Badge display', desc: 'View all earned badges and progress toward next milestones on your Badges page.' },
      { name: 'Badges preview on profile', desc: 'The 4 most recent badges shown on your Profile page.' },
    ],
  },
  {
    category: 'Profile & Account',
    icon: '👤',
    items: [
      { name: 'Profile page', desc: 'Shows your stats, recent badges, streak, and links to all your activity.' },
      { name: 'Profile avatar', desc: 'Displays your Google/GitHub profile picture when signed in via OAuth.' },
      { name: 'Stats dashboard', desc: 'Prayers submitted, times prayed for others, and current streak — all on profile.' },
      { name: 'Sign in with Google', desc: 'One-click OAuth sign-in via Google.' },
      { name: 'Sign in with GitHub', desc: 'One-click OAuth sign-in via GitHub.' },
      { name: 'Settings page', desc: 'Manage email preferences, notification types, and quiet hours — all with live save feedback.' },
      { name: 'Self-service account deletion', desc: 'Delete your account and all data instantly from Settings → Danger Zone.' },
      { name: 'Onboarding flow', desc: 'First-time users see a guided overlay to orient them to the app.' },
    ],
  },
  {
    category: 'Faith Resources',
    icon: '✝️',
    items: [
      { name: 'Daily verse', desc: 'A rotating Scripture verse shown on the homepage each day.' },
      { name: 'Know Jesus page', desc: 'An introduction to Christian faith for seekers, with prayer of salvation.' },
      { name: 'Salvation campaigns', desc: 'Focused prayer campaigns for evangelistic initiatives.' },
      { name: 'Prayer prompts', desc: 'Suggested Scripture-based prompts to guide intercession.' },
    ],
  },
  {
    category: 'Church Features',
    icon: '⛪',
    items: [
      { name: 'Church creation & setup', desc: 'Wizard to create a church profile with name, description, and welcome message.' },
      { name: 'Church prayer wall', desc: "A private wall visible only to church members — separate from the public feed." },
      { name: 'Member management', desc: 'Invite members, assign roles (admin, pastor, member), remove members.' },
      { name: 'Church groups', desc: 'Sub-groups within a congregation (e.g. Women\'s Ministry, Youth) each with their own prayer context.' },
      { name: 'Pastoral dashboard', desc: 'Overview of church prayer activity, member engagement, and flagged care needs.' },
      { name: 'AI-flagged care alerts', desc: 'Requests containing crisis language (self-harm, grief, mental health) are flagged for pastoral review.' },
      { name: 'Pastoral notes', desc: 'Pastors can add private notes to flagged requests for follow-up tracking.' },
      { name: 'Assignments', desc: 'Assign a prayer request to a specific pastor or leader for follow-up.' },
      { name: 'Custom branding', desc: 'Upload a church logo and set accent colors for the private wall.' },
      { name: 'Analytics & reports', desc: 'Prayer volume, member engagement, response rates — downloadable as PDF.' },
      { name: 'Live event prayer wall', desc: 'A projected, moderated real-time prayer wall for services, conferences, and retreats.' },
      { name: 'Event moderation', desc: 'Approve or reject prayers before they appear on the live event wall.' },
      { name: 'Event display mode', desc: 'Full-screen, branded display for the live event wall.' },
      { name: 'Event reports', desc: 'CSV export of all prayers submitted during an event.' },
      { name: 'Find a Church directory', desc: 'Public directory for churches to be discovered by people searching nearby.' },
      { name: 'Church claim & verification', desc: 'Claim an existing listing and verify ownership to manage it.' },
      { name: 'Church recommendations', desc: 'Users can recommend a church to others.' },
      { name: 'Saved churches', desc: 'Bookmark churches you visit or want to revisit.' },
    ],
  },
  {
    category: 'Safety & Trust',
    icon: '🛡️',
    items: [
      { name: 'AI safety screening', desc: 'All submissions are screened for crisis language, self-harm indicators, and sensitive content.' },
      { name: 'Content reporting', desc: 'Any user can report a prayer request for review.' },
      { name: 'Moderation queue', desc: 'Flagged content is reviewed by the PrayerJar team and church pastors.' },
      { name: 'Trust & Safety page', desc: 'Public documentation of our data practices and safety commitments.' },
      { name: 'Privacy controls', desc: 'Choose who sees each request. Anonymous option available.' },
      { name: 'No ads, no data selling', desc: 'Zero advertising. Data is never sold or shared with third parties.' },
      { name: 'Grief anniversary reminders', desc: 'Optional compassionate follow-up on anniversaries of loss-related prayers.' },
    ],
  },
  {
    category: 'Progressive Web App',
    icon: '📱',
    items: [
      { name: 'Installable on mobile', desc: 'Add to home screen on iOS and Android — works like a native app.' },
      { name: 'Offline support', desc: 'Service worker caches key assets for basic offline resilience.' },
      { name: 'Push notifications', desc: 'Web push notifications for prayers, messages, and badges (where browser supports).' },
      { name: 'Mobile navigation', desc: 'Fixed bottom navigation bar optimized for one-thumb use.' },
    ],
  },
];

export default function FeaturesPage() {
  const totalFeatures = FEATURES.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">

      <div className="mb-12">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Docs</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4 mb-3">Full Feature Guide</h1>
        <p className="text-muted-foreground">
          Every feature available in PrayerJar V2 — {totalFeatures} features across {FEATURES.length} categories.
        </p>
      </div>

      {/* Quick nav */}
      <nav className="rounded-xl border bg-muted/30 p-4 mb-12" aria-label="Feature categories">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Jump to category</p>
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((cat) => (
            <a
              key={cat.category}
              href={`#${cat.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
              className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent/50 transition-colors"
            >
              {cat.icon} {cat.category}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-12">
        {FEATURES.map((cat) => (
          <section
            key={cat.category}
            id={cat.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
          >
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-5">
              <span>{cat.icon}</span>
              {cat.category}
              <span className="ml-auto text-xs font-normal text-muted-foreground">{cat.items.length} features</span>
            </h2>
            <div className="rounded-xl border divide-y">
              {cat.items.map((item) => (
                <div key={item.name} className="px-4 py-3 flex gap-4">
                  <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t text-center space-y-3">
        <p className="text-sm text-muted-foreground">Ready to explore?</p>
        <div className="flex justify-center gap-3">
          <Link href="/pray" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
            Start Praying
          </Link>
          <Link href="/docs" className="inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent/50 transition-colors">
            Back to Docs
          </Link>
        </div>
      </div>

    </main>
  );
}
