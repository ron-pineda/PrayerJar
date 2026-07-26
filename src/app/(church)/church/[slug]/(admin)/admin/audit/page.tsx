import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers, getChurchTier } from '@/services/church-platform.service';
import { auditRetentionDays } from '@/lib/plans';
import { db } from '@/db';
import { auditEvents, users } from '@/db/schema';
import { eq, gte, lte, desc, and, lt, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'member.add', label: 'member.add' },
  { value: 'member.remove', label: 'member.remove' },
  { value: 'role.change', label: 'role.change' },
  { value: 'prayer.delete', label: 'prayer.delete' },
  { value: 'plan.change', label: 'plan.change' },
];

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuditLogPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  // Parse filter query params — empty string / missing both mean "no filter"
  const actionFilter = typeof sp.action === 'string' && sp.action !== 'all' && sp.action !== '' ? sp.action : null;
  const fromParam   = typeof sp.from  === 'string' && sp.from  !== '' ? sp.from  : null;
  const toParam     = typeof sp.to    === 'string' && sp.to    !== '' ? sp.to    : null;
  const pageNum     = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/admin/audit`);
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

  // Build shared WHERE conditions
  const conditions: SQL[] = [
    eq(auditEvents.churchId, church.id),
    gte(auditEvents.createdAt, retentionCutoff),
  ];

  if (actionFilter) {
    conditions.push(eq(auditEvents.action, actionFilter));
  }

  if (fromParam) {
    const fromDate = new Date(fromParam);
    if (!isNaN(fromDate.getTime())) {
      fromDate.setUTCHours(0, 0, 0, 0);
      conditions.push(gte(auditEvents.createdAt, fromDate));
    }
  }

  if (toParam) {
    const toDate = new Date(toParam);
    if (!isNaN(toDate.getTime())) {
      toDate.setUTCHours(23, 59, 59, 999);
      conditions.push(lte(auditEvents.createdAt, toDate));
    }
  }

  const whereClause = and(...conditions)!;

  // Total count for pagination header
  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(auditEvents)
    .where(whereClause);

  const total = countRow?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(pageNum, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + PAGE_SIZE, total);

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
    .where(whereClause)
    .orderBy(desc(auditEvents.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  // Build prev/next URLs preserving existing filters
  function buildPageUrl(page: number): string {
    const qs = new URLSearchParams();
    if (actionFilter) qs.set('action', actionFilter);
    if (fromParam) qs.set('from', fromParam);
    if (toParam) qs.set('to', toParam);
    qs.set('page', String(page));
    return `/church/${slug}/admin/audit?${qs.toString()}`;
  }

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
          {/*
            Sprint 27 (pj-s27-02): a "{tier} plan" pill rendered here. It was the
            last tier name on any authenticated screen. `auditRetentionDays(tier)`
            is kept and still drives the retention figure above — every church
            resolves to `free` today, so that reads 90 days.
          */}
        </div>
      </div>

      {/* Filter form — no JS needed, GET submission */}
      <form method="GET" action={`/church/${slug}/admin/audit`} className="mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="action" className="text-xs font-medium text-muted-foreground">Action</label>
          <select
            id="action"
            name="action"
            defaultValue={actionFilter ?? ''}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs font-medium text-muted-foreground">From</label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={fromParam ?? ''}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs font-medium text-muted-foreground">To</label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={toParam ?? ''}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Filter
        </button>

        {(actionFilter || fromParam || toParam) && (
          <Link
            href={`/church/${slug}/admin/audit`}
            className="h-9 inline-flex items-center rounded-md border px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Pagination header */}
      <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
        <span>
          Page {currentPage} — {rangeStart}–{rangeEnd} of {total} total
        </span>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Link href={buildPageUrl(currentPage - 1)} className="rounded border px-3 py-1 text-xs hover:bg-muted transition-colors">
              Prev
            </Link>
          ) : (
            <span className="rounded border px-3 py-1 text-xs text-muted-foreground/40 cursor-not-allowed">Prev</span>
          )}
          {currentPage < totalPages ? (
            <Link href={buildPageUrl(currentPage + 1)} className="rounded border px-3 py-1 text-xs hover:bg-muted transition-colors">
              Next
            </Link>
          ) : (
            <span className="rounded border px-3 py-1 text-xs text-muted-foreground/40 cursor-not-allowed">Next</span>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No audit events found for the selected filters.
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
              {rows.map((row) => (
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

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4 text-sm">
          {currentPage > 1 ? (
            <Link href={buildPageUrl(currentPage - 1)} className="rounded border px-3 py-1 text-xs hover:bg-muted transition-colors">
              Prev
            </Link>
          ) : (
            <span className="rounded border px-3 py-1 text-xs text-muted-foreground/40 cursor-not-allowed">Prev</span>
          )}
          <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages ? (
            <Link href={buildPageUrl(currentPage + 1)} className="rounded border px-3 py-1 text-xs hover:bg-muted transition-colors">
              Next
            </Link>
          ) : (
            <span className="rounded border px-3 py-1 text-xs text-muted-foreground/40 cursor-not-allowed">Next</span>
          )}
        </div>
      )}
    </div>
  );
}
