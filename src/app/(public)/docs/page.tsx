import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/db';
import { prayers, users, prayerInteractions } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const metadata: Metadata = { title: 'About PrayerJar | Docs' };

async function getStats() {
  const [prayerRow, userRow, interactionRow] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(prayers).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(users).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(prayerInteractions).then((r) => Number(r[0]?.count ?? 0)),
  ]);
  return { prayers: prayerRow, users: userRow, interactions: interactionRow };
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K+`;
  return n > 0 ? String(n) : '—';
}

export default async function DocsOverviewPage() {
  const stats = await getStats();

  return (
    <main className="max-w-3xl mx-auto px-4 py-14 space-y-14">

      {/* Header */}
      <header className="text-center space-y-4">
        <span className="text-5xl" aria-hidden="true">🫙</span>
        <h1 className="text-4xl font-bold tracking-tight">The Prayer Jar</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          A free global community where people submit prayer requests and others around the world intercede for them — 24/7, no church membership required.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/pray" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
            Start Praying
          </Link>
          <Link href="/sign-in" className="inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent/50 transition-colors">
            Create Account
          </Link>
        </div>
      </header>

      {/* Live stats */}
      <section>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { value: fmt(stats.prayers), label: 'Prayers submitted' },
            { value: fmt(stats.interactions), label: 'Times prayed for others' },
            { value: fmt(stats.users), label: 'Community members' },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <p className="text-3xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What it is */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What is The Prayer Jar?</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Prayer Jar is a community prayer platform built on a simple idea: everyone deserves to have someone pray for them. You write a request — as specific or as brief as you need — and the community intercedes. When your prayer is answered, you release a light to celebrate with others.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Prayer is free — always. There are no ads, no data brokers, and no paywall on asking for prayer or praying for others. We offer paid plans for churches that want pastoral tools and private prayer walls, but the core experience is free for everyone.
        </p>
      </section>

      {/* Who it's for */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold">Who it's for</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '🙏',
              title: 'Individuals',
              body: 'Anyone who needs prayer, wants to pray for others, or is exploring faith. No account required to start.',
            },
            {
              icon: '⛪',
              title: 'Churches',
              body: 'Congregations that want a private prayer wall, pastoral oversight tools, and community engagement features.',
            },
            {
              icon: '✝️',
              title: 'Seekers',
              body: "People who don't yet have a faith community. The Know Jesus pathway and church finder help connect them.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-5 space-y-2">
              <p className="text-2xl">{icon}</p>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="space-y-4">
          {[
            { step: '1', title: 'Share your heart', body: 'Submit a prayer request in seconds. Choose who sees it — public community, your church only, or private.' },
            { step: '2', title: 'The community intercedes', body: "Others pray for your request. You get notified each time someone intercedes — even if they don't leave a message." },
            { step: '3', title: 'Release a light', body: "When your prayer is answered, mark it as testimony. A light joins the Lights Released wall for the whole community to celebrate." },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                {step}
              </div>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Key values */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Our commitments</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            'No ads — ever',
            'No data selling or third-party sharing',
            'Prayer submission is always free',
            'Anonymous prayer option for sensitive requests',
            'AI safety screening for crisis and self-harm language',
            'Self-service account deletion in Settings',
            'End-to-end HTTPS; no plaintext storage of sensitive data',
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-primary mt-0.5">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Docs nav */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Documentation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: '/docs/guide', title: 'User Guide', desc: 'Step-by-step guide for individuals' },
            { href: '/docs/churches', title: 'Church Admin Guide', desc: 'Setting up and managing a church community' },
            { href: '/docs/paid', title: 'Paid Features', desc: 'What church plan subscribers get' },
            { href: '/docs/features', title: 'Full Feature List', desc: 'Every feature available in V2' },
            { href: '/help', title: 'FAQ', desc: 'Common questions answered' },
            { href: '/contact', title: 'Contact', desc: 'Reach our team directly' },
          ].map(({ href, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4 flex flex-col gap-1"
            >
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
