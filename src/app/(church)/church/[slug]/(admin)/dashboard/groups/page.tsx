import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers, getChurchTier } from '@/services/church-platform.service';
import { hasPastoralDashboard, PASTORAL_DASHBOARD_TIER_NAME } from '@/lib/plans';
import { db } from '@/db';
import { chmsGroups, chmsGroupMembers } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ChmsGroupsPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/dashboard/groups`);
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
        <Link href={`/church/${slug}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {church.name}
        </Link>
      </div>
    );
  }

  // Plan-tier gate — requires starter or above (same as pastoral dashboard).
  const tier = await getChurchTier(church.id);
  if (!hasPastoralDashboard(tier)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-3">Synced Groups</h1>
        <p className="text-muted-foreground mb-4">
          Synced Groups are included on the {PASTORAL_DASHBOARD_TIER_NAME} plan and above.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/billing" className="text-sm text-primary hover:underline">
            View plans
          </Link>
          <Link
            href={`/church/${slug}/dashboard`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Load synced groups with member counts.
  const groupRows = await db
    .select({
      id: chmsGroups.id,
      name: chmsGroups.name,
      description: chmsGroups.description,
      provider: chmsGroups.provider,
      isActive: chmsGroups.isActive,
      syncedAt: chmsGroups.syncedAt,
    })
    .from(chmsGroups)
    .where(eq(chmsGroups.churchId, church.id))
    .orderBy(chmsGroups.name);

  // Fetch member counts per group in one query using a subquery aggregation.
  const memberCountRows = await db
    .select({
      groupId: chmsGroupMembers.groupId,
      memberCount: count(),
    })
    .from(chmsGroupMembers)
    .groupBy(chmsGroupMembers.groupId);

  const countsByGroupId = new Map(
    memberCountRows.map((r) => [r.groupId, Number(r.memberCount)])
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}/dashboard`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">{church.name} — Synced Groups</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read-only view of groups imported from your connected Church Management System.
          Member counts reflect records synced to PrayerJar.
        </p>
      </div>

      {groupRows.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No groups have been synced yet. Groups are imported automatically during the next
            scheduled sync. Make sure your ChMS integration is connected under{' '}
            <Link
              href={`/church/${slug}/settings/integrations`}
              className="text-primary hover:underline"
            >
              Settings → Integrations
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground mb-1">
            {groupRows.length} group{groupRows.length === 1 ? '' : 's'} synced
          </p>
          {groupRows.map((group) => (
            <div
              key={group.id}
              className="rounded-lg border bg-card p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{group.name}</span>
                  {!group.isActive && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {group.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right text-sm">
                <div className="font-medium tabular-nums">
                  {countsByGroupId.get(group.id) ?? 0} member
                  {(countsByGroupId.get(group.id) ?? 0) === 1 ? '' : 's'}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Synced{' '}
                  {new Date(group.syncedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
