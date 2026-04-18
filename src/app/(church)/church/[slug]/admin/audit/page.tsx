import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers, getChurchTier } from '@/services/church-platform.service';
import { auditRetentionDays } from '@/lib/plans';
import { db } from '@/db';
import { auditEvents, users } from '@/db/schema';
import { eq, gte, desc } from 'drizzle-orm';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AuditLogPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">You must be signed in to access this page.</p>
        <Link href="/sign-in" className="text-sm text-primary hover:underline">Sign in</Link>
      </div>
    );
  }

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);
  const canAccess =
    currentMember?.member.role === 'admin' || currentMember?.member.role === 'pastor';

  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          Access restricted to church administrators and pastors.
        </p>
        <Link href={`/church/${slug}`} className="text-sm text-primary hover:underline">
          Back to {church.name}
        </Link>
      </div>
    );
  }

  const tier = await getChurchTier(church.id);
  const retentionDays = auditRetentionDays(tier);
  const retentionCutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: auditEvents.id,
      action: auditEvents.action,
      targetType: auditEvents.targetType,
      targetId: auditEvents.targetId,
      metadata: auditEvents.metadata,
      createdAt: auditEvents.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditEvents)
    .leftJoin(users, eq(users.id, auditEvents.actorUserId))
    .where(eq(auditEvents.churchId, church.id))
    .orderBy(desc(auditEvents.createdAt))
    .limit(200);

  // Apply retention filter in JS (we do it in the query above via index,
  // but include the cutoff as an additional guard).
  const filtered = rows.filter((r) => r.createdAt >= retentionCutoff);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}/dashboard`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{church.name} — Audit Log</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Showing events from the last {retentionDays} days
              ({retentionDays === 90 ? '3 months' : retentionDays === 365 ? '1 year' : '3 years'})
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground capitalize">
            {tier} plan
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No audit events recorded in the retention window.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Target</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.actorName ?? row.actorEmail ?? (
                      <span className="italic text-muted-foreground">System</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary font-mono">
                      {row.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {row.targetType ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono max-w-xs truncate">
                    {row.metadata && Object.keys(row.metadata).length > 0
                      ? JSON.stringify(row.metadata)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
