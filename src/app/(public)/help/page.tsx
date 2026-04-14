'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

// metadata can't be exported from a 'use client' component — see generateMetadata pattern
// For now this is a client component for accordion interactivity

const SECTIONS = [
  {
    title: 'Getting Started',
    icon: '🙏',
    faqs: [
      {
        q: 'What is The Prayer Jar?',
        a: 'The Prayer Jar is a free community where people submit prayer requests and others intercede for them. Anyone can ask for prayer or pray for others — no account required to browse.',
      },
      {
        q: 'Do I need to create an account?',
        a: "You can read and pray for public requests without signing in. To submit your own prayer request, track who prayed for you, or receive email updates, you'll need a free account.",
      },
      {
        q: 'Is it really free?',
        a: 'Yes — completely. There are no ads, no paywalls on prayer, and no data brokers. We offer paid plans for churches that want pastoral tools, but asking for prayer and praying for others is always free.',
      },
      {
        q: 'How do I submit a prayer request?',
        a: 'Tap "Pray" in the navigation, then choose "Submit a Request." You can share publicly with the community or keep it private between you and any church you belong to.',
      },
    ],
  },
  {
    title: 'Praying for Others',
    icon: '✝️',
    faqs: [
      {
        q: 'How do I pray for someone?',
        a: 'Browse the prayer feed on the main page or visit /pray. Tap any request and press the "I prayed for this" button. The person who submitted it will receive a notification that someone interceded on their behalf.',
      },
      {
        q: 'Will the person know who prayed for them?',
        a: 'They will receive a notification that someone prayed, but your identity is kept anonymous by default. This keeps the focus on the prayer, not the person praying.',
      },
      {
        q: "What if I don't know what to pray?",
        a: 'Just read the request and speak from your heart — or simply tap "I prayed for this" as an act of solidarity. Every tap matters to the person who asked.',
      },
      {
        q: 'Can I leave a message for someone?',
        a: 'Yes. On any prayer request you can leave an encouraging message. The request author will be notified. Keep messages uplifting and focused on the person\'s need.',
      },
    ],
  },
  {
    title: 'Community & Safety',
    icon: '🛡️',
    faqs: [
      {
        q: 'How is content moderated?',
        a: 'Requests go through an AI screening step that flags content that may need pastoral care — things like crisis language, self-harm indicators, or sensitive situations. Flagged requests are reviewed before going fully public.',
      },
      {
        q: 'What if I see something inappropriate?',
        a: "Use the report button on any request. Our moderation team reviews reports within 24 hours. You can also email hello@prayerjar.org for urgent concerns.",
      },
      {
        q: 'Can I keep my request private?',
        a: 'Yes. When submitting you can choose "Community" (public), "Church Only" (visible to your church members), or "Private" (only you and any assigned pastoral staff).',
      },
      {
        q: 'What is the Prayer Partner feature?',
        a: 'Prayer Partners matches you with one other person for mutual, consistent intercession. Both partners receive gentle reminders to pray for each other. You can opt in from your Profile page.',
      },
    ],
  },
  {
    title: 'Account & Settings',
    icon: '⚙️',
    faqs: [
      {
        q: 'How do I change my email notification settings?',
        a: 'Go to Settings from your Profile. You can choose the frequency (real-time, daily digest, weekly digest, or off) and which events notify you — prayers, messages, badges, or digests.',
      },
      {
        q: 'What are Quiet Hours?',
        a: 'Quiet Hours suppresses all notifications during a time window you set — useful for sleeping hours. Configure them in Settings → Quiet Hours, including your local timezone.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Danger Zone and follow the account deletion steps. Your data will be permanently removed within 30 days. This action cannot be undone.',
      },
      {
        q: 'What data does The Prayer Jar store about me?',
        a: 'We store your name, email, and the content you submit. We do not sell your data, run ads, or share it with third parties. Read our full Privacy Policy for details.',
      },
    ],
  },
  {
    title: 'For Churches',
    icon: '⛪',
    faqs: [
      {
        q: "What church features are available?",
        a: 'Church plans include a private prayer wall visible only to members, a pastoral dashboard for tracking care needs, AI-flagged alerts for crisis situations, live event prayer walls, and custom branding.',
      },
      {
        q: 'How do I set up my church?',
        a: 'After signing in, go to "Create a Church" from your profile. You\'ll walk through a setup wizard to name your church, invite members, and configure your prayer wall.',
      },
      {
        q: 'Is there a free tier for churches?',
        a: "Yes. Small congregations can use the free tier with core features. Paid plans unlock higher member limits, pastoral tools, analytics, and event walls. See our For Churches page for details.",
      },
      {
        q: 'Who do I contact for a demo or enterprise pricing?',
        a: 'Reach out to hello@prayerjar.org and we\'ll schedule a walkthrough. Enterprise plans are available for larger organizations with custom needs.',
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        className="w-full flex items-center justify-between py-4 text-left text-sm font-medium hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 ml-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Help & FAQ</h1>
        <p className="text-muted-foreground">
          Common questions about The Prayer Jar. Still need help?{' '}
          <Link href="/contact" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Contact us
          </Link>
          .
        </p>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-2">
              <span>{section.icon}</span>
              {section.title}
            </h2>
            <div className="rounded-xl border bg-card px-4">
              {section.faqs.map((faq) => (
                <AccordionItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border bg-muted/50 p-6 text-center">
        <p className="text-sm font-medium mb-1">Didn't find your answer?</p>
        <p className="text-sm text-muted-foreground mb-4">
          We typically respond within one business day.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </main>
  );
}
