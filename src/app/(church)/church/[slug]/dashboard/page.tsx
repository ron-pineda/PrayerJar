import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
  getChurchTier,
} from '@/services/church-platform.service';
import { getPastoralStats } from '@/services/pastoral.service';
import { hasPastoralDashboard, PASTORAL_DASHBOARD_TIER_NAME } from '@/lib/plans';
import { db } from '@/db';
import { nonprofitVerifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PastoralDashboardPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">You must be signed in to access the dashboard.</p>
        <Link href="/sign-in" className="text-sm text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const members = await getChurchMembers(church.id);
  const member = members.find((m) => m.user.id === session.user!.id);
  const canAccess = member?.member.role === 'admin' || member?.member.role === 'pastor';

  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          Access restricted to church administrators and pastors.
        </p>
        <Link href={`/church/${slug}`} className="text-sm text-primary hover:underline">
          ← Back to {church.name}
        </Link>
      </div>
    );
  }

  // Plan-tier gate. Source of truth is src/lib/plans.ts
  // (PASTORAL_DASHBOARD_TIER). Keep this predicate — do NOT hard-code
  // a tier string here, or the marketing copy and the gate can drift
  // again (Legal / FTC §5 risk).
  const tier = await getChurchTier(church.id);
  if (!hasPastoralDashboard(tier)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-3">Pastoral Dashboard</h1>
        <p className="text-muted-foreground mb-4">
          The Pastoral Dashboard is available on the {PASTORAL_DASHBOARD_TIER_NAME} plan and
          above. Upgrade to unlock it.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/billing" className="text-sm text-primary hover:underline">
            View plans
          </Link>
          <Link
            href={`/church/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to {church.name}
          </Link>
        </div>
      </div>
    );
  }

  const [stats, [latestVerification]] = await Promise.all([
    getPastoralStats(church.id),
    db
      .select({ status: nonprofitVerifications.status })
      .from(nonprofitVerifications)
      .where(eq(nonprofitVerifications.churchId, church.id))
      .orderBy(desc(nonprofitVerifications.submittedAt))
      .limit(1),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          ← Back to {church.name}
        </Link>
        <h1 className="text-2xl font-bold">{church.name} — Pastoral Dashboard</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Active Prayers</span>
          <span className="text-3xl font-bold">{stats.activePrayers}</span>
        </div>
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Pending Flags</span>
          <span className="text-3xl font-bold">{stats.pendingFlags}</span>
        </div>
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Open Assignments</span>
          <span className="text-3xl font-bold">{stats.openAssignments}</span>
        </div>
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Members</span>
          <span className="text-3xl font-bold">{stats.memberCount}</span>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold mb-1">Quick Navigation</h2>
        <Link
          href={`/church/${slug}/dashboard/flagged`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium">Flagged Prayers ({stats.pendingFlags})</span>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>
        <Link
          href={`/church/${slug}/dashboard/care`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium">Care Inbox</span>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>
        <Link
          href={`/church/${slug}/dashboard/team`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium">Prayer Team</span>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>
        <Link
          href={`/church/${slug}/dashboard/groups`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium">Synced Groups</span>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>
        <Link
          href={`/church/${slug}/settings/nonprofit`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium">
            501(c)(3) Verification
            {latestVerification && (
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  latestVerification.status === 'verified'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    : latestVerification.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                }`}
              >
                {latestVerification.status.charAt(0).toUpperCase() +
                  latestVerification.status.slice(1)}
              </span>
            )}
          </span>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>
      </div>
    </div>
  );
}
