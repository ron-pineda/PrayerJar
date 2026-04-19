import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/db';
import { prayers, users, prayerInteractions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import {
  Ban,
  Book,
  BookOpen,
  Bot,
  ChevronRight,
  Church,
  CircleCheck,
  CircleQuestionMark,
  Crown,
  EyeOff,
  Globe,
  HandHeart,
  HandHelping,
  Handshake,
  Heart,
  Lock,
  Mail,
  PenLine,
  Shield,
  Sparkles,
  Sprout,
  Sun,
  Trash2,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';

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
    <main className="max-w-4xl mx-auto px-4 py-14 space-y-20">

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <header className="text-center space-y-6">
        <div className="flex justify-center">
          <HandHelping className="h-10 w-10 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">The Prayer Jar</h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A free global community where people submit prayer requests and others around the world intercede — 24/7, no church membership required.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/pray" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-7 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
            <HandHeart className="h-5 w-5" aria-hidden="true" />
            Start Praying
          </Link>
          <Link href="/sign-in" className="inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-3 text-sm font-semibold hover:bg-accent/50 transition-colors">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            Create Account
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          LIVE STATS
      ═══════════════════════════════════════════════════════ */}
      <section>
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Community Stats</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { value: fmt(stats.prayers), label: 'Prayers Submitted', Icon: PenLine, accent: 'text-amber-600 dark:text-amber-400' },
            { value: fmt(stats.interactions), label: 'Times Prayed For Others', Icon: Handshake, accent: 'text-amber-600 dark:text-amber-400' },
            { value: fmt(stats.users), label: 'Community Members', Icon: Users, accent: 'text-amber-600 dark:text-amber-400' },
          ].map(({ value, label, Icon, accent }) => (
            <div key={label} className="rounded-2xl border bg-card p-8 text-center space-y-3">
              <div className="flex justify-center">
                <Icon className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <p className={`text-4xl font-bold ${accent}`}>{value}</p>
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS — Big numbered flow
      ═══════════════════════════════════════════════════════ */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Zap className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps — pray, be prayed for, celebrate.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {[
            {
              step: 1,
              Icon: PenLine,
              title: 'Share Your Heart',
              body: 'Submit a prayer request in seconds. Choose who sees it — public community, your church only, or private.',
              numBg: 'bg-primary',
            },
            {
              step: 2,
              Icon: HandHeart,
              title: 'The Community Intercedes',
              body: 'Others around the world pray for your request. You get notified each time someone intercedes — even anonymously.',
              numBg: 'bg-primary',
            },
            {
              step: 3,
              Icon: Sun,
              title: 'Release a Light',
              body: 'When your prayer is answered, mark it as testimony. A light joins the Lights Released wall for the whole community to celebrate.',
              numBg: 'bg-primary',
            },
          ].map(({ step, Icon, title, body, numBg }, idx, arr) => (
            <div key={step} className="relative flex flex-col">
              <div className="flex-1 rounded-2xl border bg-card p-7 space-y-4">
                {/* Big number */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${numBg} text-white flex items-center justify-center text-lg font-black flex-shrink-0`}>
                    {step}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="hidden md:flex flex-1 items-center justify-end absolute -right-3 top-10 z-10">
                      <div className="w-6 h-6 rounded-full bg-background border flex items-center justify-center">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                {/* Icon */}
                <Icon className="h-10 w-10 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                {/* Text */}
                <div className="space-y-2">
                  <p className="font-bold text-base">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHO IT'S FOR
      ═══════════════════════════════════════════════════════ */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Heart className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold">Who It&apos;s For</h2>
          <p className="text-muted-foreground">Everyone is welcome here.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              Icon: UserRound,
              title: 'Individuals',
              body: 'Anyone who needs prayer, wants to pray for others, or is exploring faith. No account required to start.',
            },
            {
              Icon: Church,
              title: 'Churches',
              body: 'Congregations that want a private prayer wall, pastoral oversight tools, and community engagement features.',
            },
            {
              Icon: Sprout,
              title: 'Seekers',
              body: "People who don't yet have a faith community. The Know Jesus pathway and church finder help connect them.",
            },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card p-7 space-y-4">
              <Icon className="h-10 w-10 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <p className="font-bold text-base">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHAT IS IT — callout
      ═══════════════════════════════════════════════════════ */}
      <section className="rounded-2xl border bg-card p-8 sm:p-10 space-y-4">
        <Sparkles className="h-10 w-10 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <h2 className="text-xl font-bold">What is The Prayer Jar?</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Prayer Jar is a place for people to be prayed for, built on a simple idea: everyone deserves to have someone intercede for them. You write a request — as specific or as brief as you need — and the community prays. When your prayer is answered, you release a light to celebrate with others.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Prayer is free — always. There are no ads, no data brokers, and no paywall on asking for prayer or praying for others. Churches can subscribe for pastoral features like a private prayer wall, pastoral notes, and a care dashboard — but the core is free for everyone.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════
          OUR COMMITMENTS — icon grid
      ═══════════════════════════════════════════════════════ */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold">Our Commitments</h2>
          <p className="text-muted-foreground">What we promise to every person who uses PrayerJar.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { Icon: Ban, text: 'No ads — ever' },
            { Icon: Lock, text: 'No data selling or third-party sharing' },
            { Icon: Heart, text: 'Prayer submission is always free' },
            { Icon: EyeOff, text: 'Anonymous prayer option for sensitive requests' },
            { Icon: Bot, text: 'AI safety screening for crisis and self-harm language' },
            { Icon: Trash2, text: 'Self-service account deletion in Settings' },
            { Icon: Globe, text: 'End-to-end HTTPS; no plaintext storage of sensitive data' },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-4 rounded-xl border bg-card p-4">
              <div className="w-10 flex justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          DOCS NAV
      ═══════════════════════════════════════════════════════ */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BookOpen className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold">Documentation</h2>
          <p className="text-muted-foreground">Everything you need to get the most out of PrayerJar.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { href: '/docs/guide', Icon: Book, title: 'User Guide', desc: 'Step-by-step guide for individuals' },
            { href: '/docs/churches', Icon: Church, title: 'Church Admin Guide', desc: 'Setting up and managing a church community' },
            { href: '/docs/paid', Icon: Crown, title: 'Paid Features', desc: 'What church plan subscribers get' },
            { href: '/docs/features', Icon: CircleCheck, title: 'Full Feature List', desc: 'Every feature available in V2' },
            { href: '/help', Icon: CircleQuestionMark, title: 'FAQ', desc: 'Common questions answered' },
            { href: '/contact', Icon: Mail, title: 'Contact', desc: 'Reach our team directly' },
          ].map(({ href, Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border bg-card hover:bg-accent/50 transition-all p-5 flex items-center gap-4"
            >
              <div className="w-12 flex justify-center flex-shrink-0">
                <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm flex items-center gap-1">
                  {title}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
