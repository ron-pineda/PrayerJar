import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { nonprofitVerifications, churches, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ReviewForm } from './ReviewForm';

export const metadata = { title: 'Legal Verifications | Admin | The Prayer Jar' };

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  verified: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  unverified: 'bg-muted text-muted-foreground',
};

export default async function LegalVerificationsPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: nonprofitVerifications.id,
      churchId: nonprofitVerifications.churchId,
      churchName: churches.name,
      churchSlug: churches.slug,
      submittedByEmail: users.email,
      ein: nonprofitVerifications.ein,
      legalName: nonprofitVerifications.legalName,
      determinationLetterUrl: nonprofitVerifications.determinationLetterUrl,
      status: nonprofitVerifications.status,
      submittedAt: nonprofitVerifications.submittedAt,
      reviewedAt: nonprofitVerifications.reviewedAt,
      reviewedBy: nonprofitVerifications.reviewedBy,
      reviewNotes: nonprofitVerifications.reviewNotes,
    })
    .from(nonprofitVerifications)
    .leftJoin(churches, eq(churches.id, nonprofitVerifications.churchId))
    .leftJoin(users, eq(users.id, nonprofitVerifications.submittedByUserId))
    .orderBy(desc(nonprofitVerifications.submittedAt));

  const pending = rows.filter((r) => r.status === 'pending');
  const others = rows.filter((r) => r.status !== 'pending');

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Legal Verifications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          501(c)(3) determination letter submissions.{' '}
          {pending.length > 0 ? (
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              {pending.length} pending
            </span>
          ) : (
            'No pending submissions.'
          )}
        </p>
      </div>

      {rows.length === 0 && (
        <p className="text-muted-foreground text-sm">No submissions yet.</p>
      )}

      {[...pending, ...others].map((row) => (
        <div key={row.id} className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">
                {row.churchName ?? row.churchId}
                {row.churchSlug && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    /church/{row.churchSlug}
                  </span>
                )}
              </p>
              {row.legalName && (
                <p className="text-xs text-muted-foreground">Legal name: {row.legalName}</p>
              )}
              {row.ein && (
                <p className="text-xs text-muted-foreground">EIN: {row.ein}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted by: {row.submittedByEmail ?? 'unknown'} on{' '}
                {row.submittedAt.toLocaleDateString()}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${
                STATUS_BADGE[row.status] ?? STATUS_BADGE.unverified
              }`}
            >
              {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
            </span>
          </div>

          <div>
            <a
              href={row.determinationLetterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-4"
            >
              View determination letter (PDF)
            </a>
          </div>

          {row.reviewedAt && (
            <p className="text-xs text-muted-foreground">
              Reviewed by {row.reviewedBy} on {row.reviewedAt.toLocaleDateString()}
              {row.reviewNotes && ` — ${row.reviewNotes}`}
            </p>
          )}

          {row.status === 'pending' && (
            <ReviewForm
              verificationId={row.id}
              churchName={row.churchName ?? row.churchId}
            />
          )}
        </div>
      ))}
    </main>
  );
}
