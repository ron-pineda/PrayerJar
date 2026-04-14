'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Private Prayer Wall',
    description:
      'A dedicated space where only your church members can post and pray. Separate from the public feed.',
  },
  {
    icon: '🧭',
    title: 'Pastoral Dashboard',
    description:
      'See active prayers, pending flags, open assignments, and member activity — all in one place.',
  },
  {
    icon: '🤖',
    title: 'AI-Flagged Care',
    description:
      'Prayers that signal crisis or grief are automatically surfaced to your pastoral care team before anyone falls through the cracks.',
  },
  {
    icon: '📺',
    title: 'Live Event Prayer Wall',
    description:
      'Display real-time prayer submissions on a screen during services, conferences, or retreats. Moderation console included.',
  },
  {
    icon: '🎨',
    title: 'Custom Branding',
    description:
      'Your church logo, colors, and subdomain. PrayerJar becomes your tool, not a third-party platform.',
  },
  {
    icon: '📊',
    title: 'Analytics & Reports',
    description:
      'Weekly prayer digests for pastors, engagement metrics, and downloadable PDF reports for leadership.',
  },
];

const TIERS: PlanTier[] = ['free', 'starter', 'pro', 'enterprise'];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function ForChurchesPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 px-4 text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          For churches &amp; ministries
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Bring your church&apos;s prayer life online
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
          PrayerJar gives your congregation a safe, private place to share prayer
          requests — and gives your pastoral team the tools to care for every person in it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" render={<Link href="/church/create" />}>
            Get Started Free
          </Button>
          <Button size="lg" variant="outline" render={<a href="mailto:hello@prayerjar.org" />}>
            Talk to Us
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Free tier available. No credit card required.
        </p>
      </section>

      {/* Features */}
      <section className="pb-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-12">
          Everything your church needs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 space-y-3">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-semibold text-base">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-3">Plans</h2>
        <p className="text-center text-muted-foreground mb-8 text-sm">
          Prayer is always free. Plans are for churches that want pastoral tools.
        </p>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-lg border p-1 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                billing === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                billing === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs text-green-600 dark:text-green-400 font-semibold">
                Save ~20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((tier) => {
            const plan = PLANS[tier];
            const isFree = tier === 'free';
            const isEnterprise = tier === 'enterprise';
            const price =
              billing === 'yearly' ? plan.yearlyPriceCents / 12 : plan.monthlyPriceCents;

            return (
              <div
                key={tier}
                className={`rounded-xl border bg-card p-6 flex flex-col gap-4 ${
                  tier === 'pro' ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                <div>
                  {tier === 'pro' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground mb-2 inline-block">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-base font-semibold">{plan.name}</h3>
                  <p className="text-2xl font-bold mt-1">
                    {isEnterprise ? (
                      <span className="text-base font-semibold">Custom</span>
                    ) : isFree ? (
                      'Free'
                    ) : (
                      <>
                        {formatCents(price)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        {billing === 'yearly' && (
                          <span className="block text-xs text-muted-foreground font-normal">
                            billed yearly
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                <ul className="space-y-1.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {isEnterprise ? (
                  <Button variant="outline" render={<a href="mailto:hello@prayerjar.org" />}>
                    Contact Us
                  </Button>
                ) : isFree ? (
                  <Button variant="outline" render={<Link href="/church/create" />}>
                    Get Started
                  </Button>
                ) : (
                  <Button render={<Link href="/church/create" />}>
                    Get Started
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 px-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold tracking-tight mb-8 text-center">
          Common questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: 'Is prayer still free for our congregation?',
              a: 'Yes, always. Any member of your church can submit prayer requests and pray for others at no cost. Plans cover pastoral tools and church admin features only.',
            },
            {
              q: 'Can we try before committing to a paid plan?',
              a: 'The free tier is fully functional — private wall, member management, and basic notifications. No credit card required to get started.',
            },
            {
              q: 'How does the pastoral dashboard work?',
              a: 'Admins and pastors on Starter and Pro get a dedicated dashboard showing active prayers, AI-flagged care items, and prayer team assignments. Members never see the administrative side.',
            },
            {
              q: 'What happens at live events?',
              a: 'Pro plan includes a live prayer wall you can display on a screen during services or conferences. Submissions appear in real time and a moderation console lets you approve what shows publicly.',
            },
            {
              q: 'Can we cancel anytime?',
              a: "Yes. Cancel from your billing settings at any time. You keep access until the end of your billing period. We don't lock you in.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b pb-6 last:border-0">
              <p className="font-medium text-sm mb-2">{q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 px-4 text-center">
        <div className="max-w-md mx-auto rounded-xl border bg-card p-8 space-y-4">
          <p className="text-lg font-semibold">Ready to get started?</p>
          <p className="text-sm text-muted-foreground">
            Set up your church in minutes. Free tier, no card required.
          </p>
          <Button size="lg" render={<Link href="/church/create" />}>
            Create Your Church
          </Button>
        </div>
      </section>
    </main>
  );
}
