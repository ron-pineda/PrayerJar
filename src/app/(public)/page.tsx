import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PrayerDialog } from '@/components/prayer-dialog';
import { OnboardingOverlay } from '@/components/onboarding-overlay';
import { PrayerJar } from '@/components/prayer-jar';
import { AnimatedCounter } from '@/components/animated-counter';
import { ScrollReveal } from '@/components/scroll-reveal';
import { PrayingNowCounter } from '@/components/praying-now-counter';
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
      {/* Personalized greeting — signed-in users only */}
      {session?.user && homepageData ? (
        <>
          <div className="text-center space-y-2 py-8 px-4">
            <div className="flex justify-center mb-4">
              <PrayerJar count={stats.active} />
            </div>
            <h1 className="text-2xl font-bold">
              Good {getTimeOfDay()}, {session.user.name?.split(' ')[0] ?? 'friend'} 🙏
            </h1>
            <p className="text-muted-foreground text-sm">
              {homepageData.prayedForMeCount > 0
                ? `${homepageData.prayedForMeCount} ${homepageData.prayedForMeCount === 1 ? 'person' : 'people'} prayed for your requests this week`
                : 'Your prayers are with the community'}
              {homepageData.expiringCount > 0 && ` · ${homepageData.expiringCount} ${homepageData.expiringCount === 1 ? 'prayer needs' : 'prayers need'} renewal`}
            </p>
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
                {homepageData.expiringCount > 0 ? ` · ${homepageData.expiringCount} expiring soon` : ' · all healthy'}
              </p>
              <a href="/my-prayers" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                View My Prayers →
              </a>
            </div>
          </div>
        </>
      ) : null}

      {/* Hero — signed-out users only */}
      {!session?.user && (
        <section className="py-20 px-4 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            The Prayer Jar
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            A global place to share your heart and intercede for others.
            Every prayer matters. Every name is known by God.
          </p>

          <div className="flex justify-center mb-6">
            <PrayerJar count={stats.active} />
          </div>

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.active}</p>
              <p className="text-xs text-muted-foreground mt-0.5">prayers waiting</p>
            </div>
            <div className="w-px bg-border" aria-hidden="true" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{stats.answered}</p>
              <p className="text-xs text-muted-foreground mt-0.5">lights released <span aria-hidden="true">✨</span></p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PrayerDialog />
            <Button size="lg" variant="outline" render={<Link href="/pray" />}>Pray for Someone</Button>
          </div>
        </section>
      )}

      {/* Daily verse — visible to all users */}
      <div className="border-t border-b py-4 mb-8 max-w-md mx-auto">
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="text-xs text-primary mt-2">{verse.reference}</p>
      </div>

      {/* How it works — signed-out users only */}
      {!session?.user && (
        <ScrollReveal>
          <section className="pb-12 px-4">
            <div className="max-w-2xl mx-auto">
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
                How It Works
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    🫙
                  </div>
                  <h3 className="font-semibold text-sm">Share Your Heart</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Write a prayer request — as specific or as simple as you need. You choose who sees it.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    🙏
                  </div>
                  <h3 className="font-semibold text-sm">The Community Intercedes</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Others around the world pray for your request. You receive a notification each time someone intercedes.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    ✨
                  </div>
                  <h3 className="font-semibold text-sm">Release a Light</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When your prayer is answered, mark it as a testimony. A light joins the Lights Released wall for all to celebrate.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Stats */}
      <ScrollReveal>
        <section className="pb-12 px-4">
          <div className="max-w-lg mx-auto rounded-xl border border-amber-900/20 bg-amber-950/10 dark:bg-amber-950/20 py-8 px-6">
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
              A Community in Prayer
            </p>
            <div className="grid grid-cols-3 divide-x divide-border">
              <AnimatedCounter value={stats.active + stats.answered} label="Prayers Submitted" />
              <AnimatedCounter value={stats.prayedFor} label="Times Prayed" />
              <AnimatedCounter value={stats.answered} label="Answered" />
            </div>
            <div className="mt-6 flex justify-center">
              <PrayingNowCounter />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Secondary CTAs */}
      <ScrollReveal delay={120}>
        <section className="pb-20 px-4">
          <div className="border-t max-w-xs mx-auto mb-10" />
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <Link
              href="/know-jesus"
              className="group rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 px-5 py-5 transition-colors"
            >
              <p className="text-lg mb-1">✝️</p>
              <p className="font-semibold text-sm text-primary">Know Jesus</p>
              <p className="text-xs text-muted-foreground mt-1">Start your faith journey</p>
            </Link>
            <Link
              href="/praise-wall"
              className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
            >
              <p className="text-lg mb-1">✨</p>
              <p className="font-semibold text-sm">Answered Prayers</p>
              <p className="text-xs text-muted-foreground mt-1">Celebrate answered prayers</p>
            </Link>
            <Link
              href="/find-a-church"
              className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
            >
              <p className="text-lg mb-1">⛪</p>
              <p className="font-semibold text-sm">Find a Church</p>
              <p className="text-xs text-muted-foreground mt-1">Connect with a local community</p>
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}
