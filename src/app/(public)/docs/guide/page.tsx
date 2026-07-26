import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Church,
  CircleCheck,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  Compass,
  PenLine,
  HeartHandshake,
  NotebookPen,
  Sparkles,
  Bell,
  Award,
  Handshake,
  Settings,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export const metadata: Metadata = { title: 'User Guide | PrayerJar Docs' };

interface Section {
  id: string;
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  accentBorder: string;
  accentNum: string;
  accentNumText: string;
  steps: { heading: string; body: string }[];
}

const SECTIONS: Section[] = [
  {
    id: 'getting-started',
    Icon: Compass,
    title: 'Getting Started',
    subtitle: 'You can start right now — no account needed.',
    accentBorder: 'border-sky-500/30',
    accentNum: 'bg-sky-500',
    accentNumText: 'text-sky-500',
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
    Icon: PenLine,
    title: 'Submitting a Prayer Request',
    subtitle: 'Share your need with the community in under a minute.',
    accentBorder: 'border-blue-500/30',
    accentNum: 'bg-blue-500',
    accentNumText: 'text-blue-500',
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
    Icon: HeartHandshake,
    title: 'Praying for Others',
    subtitle: 'One tap logs your intercession — a notification goes to the requester.',
    accentBorder: 'border-rose-500/30',
    accentNum: 'bg-rose-500',
    accentNumText: 'text-rose-500',
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
    Icon: NotebookPen,
    title: 'Your Prayer Journal',
    subtitle: 'Every prayer you offer is automatically logged here.',
    accentBorder: 'border-violet-500/30',
    accentNum: 'bg-violet-500',
    accentNumText: 'text-violet-500',
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
    Icon: Sparkles,
    title: 'When a Prayer is Answered',
    subtitle: 'Mark it, share your testimony, release a light.',
    accentBorder: 'border-amber-500/30',
    accentNum: 'bg-amber-500',
    accentNumText: 'text-amber-500',
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
    Icon: Bell,
    title: 'Notifications & Settings',
    subtitle: 'Stay informed without being overwhelmed.',
    accentBorder: 'border-emerald-500/30',
    accentNum: 'bg-emerald-500',
    accentNumText: 'text-emerald-500',
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
    Icon: Award,
    title: 'Badges & Streaks',
    subtitle: 'Milestones that celebrate your faithfulness.',
    accentBorder: 'border-orange-500/30',
    accentNum: 'bg-orange-500',
    accentNumText: 'text-orange-500',
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
    Icon: Handshake,
    title: 'Prayer Partner',
    subtitle: 'One-on-one matched intercession — mutual and consistent.',
    accentBorder: 'border-pink-500/30',
    accentNum: 'bg-pink-500',
    accentNumText: 'text-pink-500',
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
    Icon: Settings,
    title: 'Account & Privacy',
    subtitle: 'Your data, your control.',
    accentBorder: 'border-slate-500/30',
    accentNum: 'bg-slate-500',
    accentNumText: 'text-slate-500',
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
          <BookOpen className="h-8 w-8 text-primary mx-auto" aria-hidden="true" />
          <h1 className="text-4xl font-bold tracking-tight">User Guide</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            A step-by-step visual guide to using The Prayer Jar — from your first visit to advanced features.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          QUICK-START OVERVIEW CARDS (top-level flow)
      ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border bg-card p-6 mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5 text-center">The Journey at a Glance</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="group rounded-xl border bg-card hover:bg-accent/50 transition-all p-4 flex flex-col items-center text-center gap-2"
            >
              <s.Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black ${s.accentNumText} opacity-60`}>{i + 1}</span>
                <span className="text-xs font-semibold leading-tight">{s.title}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTIONS — numbered step cards
      ═══════════════════════════════════════════════════════ */}
      <div className="space-y-14">
        {SECTIONS.map((section, sectionIdx) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-8"
          >
            {/* Section header */}
            <div className="flex items-start gap-5 mb-6">
              <section.Icon className="h-10 w-10 text-primary flex-shrink-0" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-black opacity-40 ${section.accentNumText}`}>
                    SECTION {sectionIdx + 1}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>
              </div>
            </div>

            {/* Step cards */}
            <div className="space-y-3 pl-0">
              {section.steps.map((step, i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-card hover:bg-accent/20 transition-colors p-5 flex gap-5"
                >
                  {/* Big step number */}
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-black flex-shrink-0">
                    {i + 1}
                  </div>
                  {/* Content */}
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
          OTHER GUIDES FOOTER
      ═══════════════════════════════════════════════════════ */}
      <div className="mt-16 pt-8 border-t">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">Other Guides</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/docs/churches', title: 'Church Admin Guide', desc: 'For pastors and administrators', icon: Church },
            { href: '/docs/features', title: 'Full Feature List', desc: 'Everything in the product', icon: CircleCheck },
            { href: '/help', title: 'FAQ', desc: 'Quick answers', icon: HelpCircle },
          ].map(({ href, icon: Icon, title, desc }) => (
            <Link key={href} href={href} className="group rounded-xl border bg-card hover:bg-accent/50 transition-colors p-5 flex items-center gap-4">
              <Icon className="h-6 w-6 text-primary flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-sm flex items-center gap-1">
                  {title}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
