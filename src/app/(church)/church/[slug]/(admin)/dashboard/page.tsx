import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Inbox,
  RefreshCw,
  Users,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
} from '@/services/church-platform.service';
import { getPastoralStats } from '@/services/pastoral.service';
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
    redirect(`/sign-in?callbackUrl=/church/${slug}/dashboard`);
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
        <Link href={`/church/${slug}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {church.name}
        </Link>
      </div>
    );
  }

  // Sprint 27 (pj-s27-02): the plan-tier gate is gone. Access is role-gated only.
  // This page is the hub that links to the Care Inbox, Prayer Team and Synced
  // Groups — all three work — so gating it would have orphaned working features.
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
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {church.name}
        </Link>
        <h1 className="text-2xl font-bold">{church.name} — Pastoral Dashboard</h1>
      </div>

      {/*
        Stats grid — two tiles, not four. `activePrayers` and `pendingFlags` both
        counted rows that nothing writes yet (prayers.church_id is never set, and
        prayer flags have no caller outside tests), so they always read 0. Showing
        a permanent zero is a claim that nothing is happening. Restore both with
        pj-s26-10.
      */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Open Assignments</span>
          <span className="text-3xl font-bold">{stats.openAssignments}</span>
        </div>
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Members</span>
          <span className="text-3xl font-bold">{stats.memberCount}</span>
        </div>
      </div>

      {/* Quick nav — Flagged Prayers is not listed; the page is hidden until its
          write path exists (pj-s26-10). */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold mb-1">Quick Navigation</h2>
        <Link
          href={`/church/${slug}/dashboard/care`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium inline-flex items-center gap-2">
            <Inbox className="h-5 w-5 text-amber-600" aria-hidden="true" />
            Care Inbox
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Link>
        <Link
          href={`/church/${slug}/dashboard/team`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium inline-flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" aria-hidden="true" />
            Prayer Team
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Link>
        <Link
          href={`/church/${slug}/dashboard/groups`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium inline-flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-600" aria-hidden="true" />
            Synced Groups
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Link>
        <Link
          href={`/church/${slug}/settings/nonprofit`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium inline-flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-amber-600" aria-hidden="true" />
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
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
