import type { Metadata } from 'next';
import Link from 'next/link';
import {
  HandHeart,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export const metadata: Metadata = { title: 'Feature Guide | PrayerJar Docs' };

interface FeatureCategory {
  category: string;
  emoji: string;
  subtitle: string;
  borderColor: string;
  numBg: string;
  numText: string;
  itemEmoji: string;
  items: { name: string; desc: string }[];
}

const FEATURES: FeatureCategory[] = [
  {
    category: 'Prayer Requests',
    emoji: '✍️',
    subtitle: 'Submit, manage, and mark prayers as answered.',
    borderColor: 'border-blue-500/30',
    numBg: 'bg-blue-500/10',
    numText: 'text-blue-500',
    itemEmoji: '🔵',
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
    emoji: '🤲',
    subtitle: 'Intercede, encourage, and commit to consistent prayer.',
    borderColor: 'border-rose-500/30',
    numBg: 'bg-rose-500/10',
    numText: 'text-rose-500',
    itemEmoji: '🔴',
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
    emoji: '🌍',
    subtitle: 'Browse, filter, and celebrate answered prayers together.',
    borderColor: 'border-emerald-500/30',
    numBg: 'bg-emerald-500/10',
    numText: 'text-emerald-500',
    itemEmoji: '🟢',
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
    emoji: '🤝',
    subtitle: 'One-on-one matched intercession — mutual and consistent.',
    borderColor: 'border-pink-500/30',
    numBg: 'bg-pink-500/10',
    numText: 'text-pink-500',
    itemEmoji: '🩷',
    items: [
      { name: 'Matched prayer partnership', desc: 'Opt in to be matched with one other person for consistent mutual intercession.' },
      { name: 'Partner prayer reminders', desc: 'Gentle notifications reminding you to pray for your partner.' },
      { name: 'Partnership extension', desc: 'Request to extend a partnership beyond the default term.' },
      { name: 'Partnership history', desc: 'See past prayer partners in your profile.' },
    ],
  },
  {
    category: 'Notifications',
    emoji: '🔔',
    subtitle: 'Stay informed without being overwhelmed.',
    borderColor: 'border-amber-500/30',
    numBg: 'bg-amber-500/10',
    numText: 'text-amber-500',
    itemEmoji: '🟡',
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
    emoji: '🏅',
    subtitle: 'Milestones that celebrate your faithfulness.',
    borderColor: 'border-orange-500/30',
    numBg: 'bg-orange-500/10',
    numText: 'text-orange-500',
    itemEmoji: '🟠',
    items: [
      { name: 'Badge system', desc: 'Earn badges for milestones: first prayer, 10 prayers, 7-day streak, 100 prayers prayed for, and more.' },
      { name: 'Day streak', desc: 'Consecutive-day streak counter shown on your profile and badge page.' },
      { name: 'Badge display', desc: 'View all earned badges and progress toward next milestones on your Badges page.' },
      { name: 'Badges preview on profile', desc: 'The 4 most recent badges shown on your Profile page.' },
    ],
  },
  {
    category: 'Profile & Account',
    emoji: '👤',
    subtitle: 'Your stats, settings, and privacy controls.',
    borderColor: 'border-slate-500/30',
    numBg: 'bg-slate-500/10',
    numText: 'text-slate-500',
    itemEmoji: '⚪',
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
    emoji: '✝️',
    subtitle: 'Scripture, pathways, and tools for spiritual growth.',
    borderColor: 'border-violet-500/30',
    numBg: 'bg-violet-500/10',
    numText: 'text-violet-500',
    itemEmoji: '🟣',
    items: [
      { name: 'Daily verse', desc: 'A rotating Scripture verse shown on the homepage each day.' },
      { name: 'Know Jesus page', desc: 'An introduction to Christian faith for seekers, with prayer of salvation.' },
      { name: 'Salvation campaigns', desc: 'Focused prayer campaigns for evangelistic initiatives.' },
      { name: 'Prayer prompts', desc: 'Suggested Scripture-based prompts to guide intercession.' },
    ],
  },
  {
    category: 'Church Features',
    emoji: '⛪',
    subtitle: 'Private walls, groups, events, and pastoral tools.',
    borderColor: 'border-indigo-500/30',
    numBg: 'bg-indigo-500/10',
    numText: 'text-indigo-500',
    itemEmoji: '🔷',
    items: [
      { name: 'Church creation & setup', desc: 'Wizard to create a church profile with name, description, and welcome message.' },
      { name: 'Church prayer wall', desc: "A private wall visible only to church members — separate from the public feed." },
      { name: 'Member management', desc: 'Invite members, assign roles (admin, pastor, member), remove members.' },
      { name: 'Church groups', desc: "Sub-groups within a congregation (e.g. Women's Ministry, Youth) each with their own prayer context." },
      { name: 'Pastoral dashboard', desc: 'Overview of church prayer activity, member engagement, and active requests.' },
      { name: 'Pastoral notes', desc: 'Pastors can add private notes to prayer requests for follow-up tracking.' },
      { name: 'Assignments', desc: 'Assign a prayer request to a specific pastor or leader for follow-up.' },
      { name: 'Custom branding', desc: 'Upload a church logo and set accent colors for the private wall.' },
      { name: 'Analytics', desc: 'Prayer volume, member engagement, response rates, and category breakdown — on screen in the church dashboard.' },
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
    emoji: '🛡️',
    subtitle: 'AI screening, privacy controls, and zero ads.',
    borderColor: 'border-teal-500/30',
    numBg: 'bg-teal-500/10',
    numText: 'text-teal-500',
    itemEmoji: '🩵',
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
    emoji: '📱',
    subtitle: 'Install on mobile, work offline, get push notifications.',
    borderColor: 'border-cyan-500/30',
    numBg: 'bg-cyan-500/10',
    numText: 'text-cyan-500',
    itemEmoji: '🔵',
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
    <main className="max-w-4xl mx-auto px-4 py-14">

      {/* ═══════════════════════════════════════════════════════
          BACK + HERO
      ═══════════════════════════════════════════════════════ */}
      <div className="mb-12">
        <Link href="/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Docs
        </Link>

        <div className="mt-8 text-center space-y-4">
          <div className="text-3xl leading-none">✅</div>
          <h1 className="text-4xl font-bold tracking-tight">Full Feature Guide</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Every feature available in PrayerJar V2 —{' '}
            <span className="font-bold text-foreground">{totalFeatures} features</span>{' '}
            across{' '}
            <span className="font-bold text-foreground">{FEATURES.length} categories</span>.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY QUICK-NAV
      ═══════════════════════════════════════════════════════ */}
      <nav className="rounded-2xl border bg-card p-5 mb-14" aria-label="Feature categories">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 text-center">Jump to Category</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {FEATURES.map((cat) => (
            <a
              key={cat.category}
              href={`#${cat.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
              className="flex items-center gap-2.5 rounded-xl border bg-card hover:bg-accent/50 transition-colors px-3 py-2.5"
            >
              <span className="text-xl leading-none flex-shrink-0">{cat.emoji}</span>
              <div className="min-w-0">
                <span className="text-xs font-semibold truncate block leading-tight">{cat.category}</span>
                <span className="text-[10px] text-muted-foreground">{cat.items.length} features</span>
              </div>
            </a>
          ))}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          FEATURE CATEGORIES
      ═══════════════════════════════════════════════════════ */}
      <div className="space-y-12">
        {FEATURES.map((cat) => (
          <section
            key={cat.category}
            id={cat.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
            className="scroll-mt-8"
          >
            {/* Category header */}
            <div className="rounded-2xl border bg-card p-6 mb-5 flex items-start gap-5">
              <div className="text-5xl leading-none flex-shrink-0">{cat.emoji}</div>
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-lg font-bold">{cat.category}</h2>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${cat.numBg} ${cat.numText}`}>
                    {cat.items.length} features
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{cat.subtitle}</p>
              </div>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border bg-card hover:bg-accent/20 transition-colors p-4 flex gap-3"
                >
                  <div className={`w-7 h-7 rounded-full ${cat.numBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className={`text-xs font-black ${cat.numText}`}>✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug">{item.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          FOOTER CTA
      ═══════════════════════════════════════════════════════ */}
      <div className="mt-16 pt-8 border-t">
        <div className="rounded-2xl border bg-card p-8 text-center space-y-5">
          <div className="text-5xl leading-none">🚀</div>
          <p className="text-xl font-bold">Ready to explore?</p>
          <p className="text-sm text-muted-foreground">Start praying for others or dive deeper into the docs.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/pray" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors">
              <HandHeart className="w-4 h-4" />
              Start Praying
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-1 justify-center rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-accent/50 transition-colors">
              Back to Docs
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

    </main>
  );
}
