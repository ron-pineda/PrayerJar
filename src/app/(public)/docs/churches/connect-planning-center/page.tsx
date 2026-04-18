import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Shield, Users, BookOpen, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Connect Planning Center | PrayerJar for Churches',
  description:
    'Step-by-step guide to connecting your Planning Center organization to PrayerJar for automatic member sync and group integration.',
};

export default function ConnectPlanningCenterPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-14">

      {/* ── Back link ─────────────────────────────────────────── */}
      <Link
        href="/docs/churches"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Church Admin Guide
      </Link>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Connect Planning Center to PrayerJar
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Bring your church family&rsquo;s existing data into your prayer community — automatically.
        </p>
      </div>

      {/* ── What this integration does ─────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">What this integration does</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          When you connect Planning Center, PrayerJar imports your member roster so your congregation
          can join your church community without a separate sign-up process. If your Planning Center
          organization uses the Groups module, PrayerJar will also sync your small-group structure so
          members can pray within their existing groups. Optionally, you can enable a weekly summary
          note that writes a brief prayer activity report back into Planning Center.
        </p>
      </section>

      {/* ── What we access ─────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">What we access</h2>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="divide-y">
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">People scope</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Member names, email addresses, and membership status.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Groups scope</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Small-group names and membership. Only requested if your church has the Planning
                    Center Groups module.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 bg-muted/30">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">We do not access</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Giving data, check-in history, service rosters, calendar, Forms, or anything
                    outside People and Groups.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Step-by-step setup ─────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-5">Step-by-step setup</h2>

        {/* Before you start */}
        <div className="rounded-xl border bg-card p-5 mb-6">
          <h3 className="font-semibold text-sm mb-3">Before you start</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">·</span>
              You must be a church Admin or Pastor in PrayerJar.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">·</span>
              You must be an Admin in your Planning Center organization.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">·</span>
              Your Planning Center organization must have the People module (most do).
            </li>
          </ul>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {[
            {
              heading: 'Go to your church dashboard',
              body: 'Sign in to PrayerJar and navigate to your church page.',
            },
            {
              heading: 'Click Settings → Integrations',
              body: 'Find Integrations in your church settings menu.',
            },
            {
              heading: 'Click "Connect Planning Center"',
              body: 'You\'ll see a button labeled "Connect Planning Center" on the Integrations page.',
            },
            {
              heading: 'PrayerJar will open Planning Center\'s authorization page',
              body: "Your browser will be redirected to Planning Center so you can approve the connection.",
            },
            {
              heading: 'Sign in to Planning Center if prompted, then click Authorize',
              body: 'Review the requested permissions, then click Authorize to confirm.',
            },
            {
              heading: 'PrayerJar imports your member roster automatically',
              body: 'The sync runs in the background. Large churches may take a few minutes. You can check the status on the Integrations page.',
            },
          ].map((step, i) => (
            <div key={i} className="rounded-xl border bg-card hover:bg-accent/20 transition-colors p-5 flex gap-5">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black flex-shrink-0">
                {i + 1}
              </div>
              <div className="pt-1">
                <p className="font-semibold text-sm mb-1">{step.heading}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Data privacy ───────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">Your data stays private</h2>
        <div className="rounded-xl border border-amber-900/20 bg-amber-950/5 p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Member data from Planning Center is visible only to your church&rsquo;s members on
            PrayerJar. We do not share it with other churches or use it for advertising. Prayer
            content is never written back to Planning Center except as an optional weekly summary
            note — and only if you choose to turn that feature on.
          </p>
        </div>
      </section>

      {/* ── How to disconnect ──────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">How to disconnect</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Go to <strong>Settings → Integrations → Disconnect Planning Center</strong>. Your member
          data will remain in PrayerJar — members stay as registered users — but no new syncs will
          happen.
        </p>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Frequently asked questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Can we limit which members sync?',
              a: 'Not in the current version. All active members in Planning Center will be invited to PrayerJar. Members who don\'t want to participate can choose not to activate their account.',
            },
            {
              q: "We don't have Planning Center Groups — will this still work?",
              a: "Yes. PrayerJar will sync your member roster using the People module. Group sync is simply skipped, and you'll see a note in your Integrations settings explaining this.",
            },
            {
              q: 'What happens to our data if we cancel PrayerJar?',
              a: 'Per our Data Processing Addendum, we delete or return all church data within 30 days of termination.',
            },
            {
              q: 'Who authorized this connection?',
              a: "You did, when you clicked \"Authorize\" on Planning Center's authorization page. Only church Admins and Pastors can initiate or revoke this connection.",
            },
            {
              q: 'Is this safe?',
              a: 'PrayerJar stores Planning Center credentials in our database encrypted with AES-256-GCM. We do not log or share credentials.',
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <p className="font-semibold text-sm mb-2">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
                {i === 4 && (
                  <>
                    {' '}See our{' '}
                    <Link
                      href="/legal/subprocessors"
                      className="text-primary underline underline-offset-4 font-medium"
                    >
                      sub-processor list
                    </Link>
                    {' '}and{' '}
                    <Link
                      href="/legal/dpa"
                      className="text-primary underline underline-offset-4 font-medium"
                    >
                      Data Processing Addendum
                    </Link>
                    {' '}for details.
                  </>
                )}
                {i === 2 && (
                  <>
                    {' '}See our{' '}
                    <Link
                      href="/legal/dpa"
                      className="text-primary underline underline-offset-4 font-medium"
                    >
                      Data Processing Addendum
                    </Link>
                    {' '}for the full terms.
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer nav ─────────────────────────────────────────── */}
      <div className="pt-8 border-t">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              href: '/docs/churches',
              title: 'Church Admin Guide',
              desc: 'Everything else about running your church on PrayerJar',
            },
            {
              href: '/legal/dpa',
              title: 'Data Processing Addendum',
              desc: 'How we handle your church\'s data',
            },
          ].map(({ href, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border bg-card hover:bg-accent/30 transition-all p-5 flex items-center gap-4"
            >
              <div className="flex-1">
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
