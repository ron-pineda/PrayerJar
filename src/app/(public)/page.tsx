import Link from 'next/link';
import { Heart, Users, Sparkles, Church } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrayerDialog } from '@/components/prayer-dialog';
import { OnboardingOverlay } from '@/components/onboarding-overlay';
import { PrayerJar } from '@/components/prayer-jar';
import { ScrollReveal } from '@/components/scroll-reveal';
import { getDailyVerse } from '@/lib/daily-verse';
import { db } from '@/db';
import { prayers, prayerInteractions, users } from '@/db/schema';
import { eq, and, gt, ne, or, isNull, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { getHomepageData } from '@/services/homepage.service';

async function getStats(viewerUserId?: string | null) {
  // Mirror /pray's getRandomPrayer filters so "prayers waiting" reflects what
  // the viewer can actually intercede for: active, non-group, not their own.
  const activeConditions = [
    eq(prayers.status, 'active'),
    gt(prayers.expiresAt, new Date()),
    isNull(prayers.groupId),
  ];
  // authorId is nullable (anonymous prayers) — `NULL != x` is NULL not TRUE
  // in SQL, so we must explicitly allow NULL-authored prayers through.
  if (viewerUserId) {
    activeConditions.push(
      or(isNull(prayers.authorId), ne(prayers.authorId, viewerUserId))!,
    );
  }

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prayers)
    .where(and(...activeConditions));

  const [answeredRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prayers)
    .where(eq(prayers.status, 'answered'));

  const [interactionsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prayerInteractions);

  return {
    active: Number(totalRow?.count ?? 0),
    answered: Number(answeredRow?.count ?? 0),
    prayedFor: Number(interactionsRow?.count ?? 0),
  };
}

async function getUserOnboardingState(userId: string) {
  const row = await db
    .select({ onboardingCompleted: users.onboardingCompleted })
    .from(users)
    .where(eq(users.id, userId))
    .then((r) => r[0]);
  return row?.onboardingCompleted ?? true;
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const verse = getDailyVerse();

  const [stats, homepageData, onboardingCompleted] = await Promise.all([
    getStats(userId),
    userId ? getHomepageData(userId) : Promise.resolve(null),
    userId ? getUserOnboardingState(userId) : Promise.resolve(true),
  ]);

  const needsOnboarding = userId ? !onboardingCompleted : false;

  return (
    <main className="min-h-screen">
      <OnboardingOverlay showOnboarding={needsOnboarding} />

      {/* ── Signed-in greeting ─────────────────────────────────── */}
      {session?.user && homepageData ? (
        <>
          <div className="text-center space-y-2 py-8 px-4">
            <div className="flex justify-center mb-4">
              <PrayerJar count={stats.active} />
            </div>
            <h1 className="text-3xl font-bold">
              Good {getTimeOfDay()},{' '}
              <span className="text-amber-600 dark:text-amber-400">
                {session.user.name?.split(' ')[0] ?? 'friend'}
              </span>
            </h1>
            {homepageData.prayedForMeCount > 0 && (
              <p className="text-muted-foreground text-sm">
                {homepageData.prayedForMeCount}{' '}
                {homepageData.prayedForMeCount === 1 ? 'person' : 'people'} prayed for your requests this week
              </p>
            )}
            {homepageData.expiringCount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {homepageData.expiringCount}{' '}
                {homepageData.expiringCount === 1 ? 'prayer needs' : 'prayers need'} renewal
              </p>
            )}
            <div className="mt-4">
              <PrayerDialog />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto px-4 mt-6">
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <h3 className="font-semibold">Someone needs prayer</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {homepageData.communityPrayer?.content ?? 'There are prayers waiting for your intercession.'}
              </p>
              <a href="/pray" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                Pray for Them →
              </a>
            </div>
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <h3 className="font-semibold">Your prayers</h3>
              <p className="text-sm text-muted-foreground">
                {homepageData.activePrayerCount} active
                {homepageData.expiringCount > 0 ? ` · ${homepageData.expiringCount} expiring soon` : ' · all current'}
              </p>
              <a href="/my-prayers" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                View My Prayers →
              </a>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Signed-out hero ────────────────────────────────────── */}
      {!session?.user && (
        <section className="py-20 px-4 text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <PrayerJar
              count={stats.active}
              size="lg"
              countLabel={`${stats.active.toLocaleString()} prayers held · ${stats.answered.toLocaleString()} answered`}
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Where every prayer finds a witness.
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            A global community that prays together. Share what you're carrying — someone here will intercede.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PrayerDialog />
            <Button size="lg" variant="outline" render={<Link href="/pray" />}>
              Pray for Someone
            </Button>
          </div>
        </section>
      )}

      {/* ── Daily verse ────────────────────────────────────────── */}
      <div className="border-t border-b py-4 mb-8 max-w-md mx-auto px-4">
        <p className="text-sm italic text-muted-foreground leading-relaxed text-center">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="text-xs text-primary mt-2 text-center">{verse.reference}</p>
      </div>

      {/* ── How it works — signed-out only ─────────────────────── */}
      {!session?.user && (
        <ScrollReveal>
          <section className="pb-12 px-4">
            <div className="max-w-2xl mx-auto">
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
                How It Works
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {[
                  { Icon: Heart, title: 'Share Your Heart', body: 'Write a prayer request — as specific or as simple as you need. You choose who sees it.' },
                  { Icon: Users, title: 'The Community Intercedes', body: 'Others around the world pray for your request. You receive a notification each time someone intercedes.' },
                  { Icon: Sparkles, title: 'Release a Light', body: 'When your prayer is answered, mark it as a testimony. A light joins the Lights Released wall for all to celebrate.' },
                ].map(({ Icon, title, body }) => (
                  <div key={title} className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ── Personal stats — signed-in only ────────────────────── */}
      {session?.user && homepageData && (
        <ScrollReveal>
          <section className="pb-12 px-4">
            <div className="max-w-lg mx-auto rounded-xl border border-amber-900/20 bg-amber-950/10 dark:bg-amber-950/20 py-8 px-6 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
                Your Prayer Journey
              </p>
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
                    {homepageData.activePrayerCount}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Active</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
                    {homepageData.myIntercessionsCount}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Intercessions</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
                    {homepageData.myAnsweredCount}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Answered</span>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ── Secondary CTAs ─────────────────────────────────────── */}
      <ScrollReveal delay={120}>
        <section className="pb-20 px-4">
          <div className="border-t max-w-xs mx-auto mb-10" />
          {session?.user && homepageData ? (
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <Link
                href="/pray"
                className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">Pray for Someone</p>
                <p className="text-xs text-muted-foreground mt-1">Intercede for the community</p>
              </Link>
              <Link
                href="/praise-wall"
                className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">Praise Wall</p>
                <p className="text-xs text-muted-foreground mt-1">Celebrate answered prayers</p>
              </Link>
              {homepageData.church ? (
                <Link
                  href={`/church/${homepageData.church.slug}`}
                  className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
                >
                  <div className="flex justify-center mb-2">
                    <Church className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">{homepageData.church.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Your church community</p>
                </Link>
              ) : (
                <Link
                  href="/find-a-church"
                  className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
                >
                  <div className="flex justify-center mb-2">
                    <Church className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">Find a Church</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect with a local community</p>
                </Link>
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <Link
                href="/know-jesus"
                className="group rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm text-primary">Know Jesus</p>
                <p className="text-xs text-muted-foreground mt-1">Start your faith journey</p>
              </Link>
              <Link
                href="/praise-wall"
                className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">Answered Prayers</p>
                <p className="text-xs text-muted-foreground mt-1">Celebrate answered prayers</p>
              </Link>
              <Link
                href="/find-a-church"
                className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Church className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">Find a Church</p>
                <p className="text-xs text-muted-foreground mt-1">Connect with a local community</p>
              </Link>
            </div>
          )}
        </section>
      </ScrollReveal>
    </main>
  );
}
