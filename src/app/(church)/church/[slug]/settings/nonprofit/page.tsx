import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { churches, churchMembers, nonprofitVerifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NonprofitUploadForm } from './NonprofitUploadForm';

interface Props {
  params: Promise<{ slug: string }>;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending review',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  verified: {
    label: 'Verified',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
  unverified: {
    label: 'Not submitted',
    className: 'bg-muted text-muted-foreground',
  },
};

export default async function NonprofitVerificationPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/settings/nonprofit`);
  }

  // Fetch church + membership in one join
  const [row] = await db
    .select({
      id: churches.id,
      name: churches.name,
      role: churchMembers.role,
    })
    .from(churches)
    .innerJoin(churchMembers, eq(churchMembers.churchId, churches.id))
    .where(
      and(
        eq(churches.slug, slug),
        eq(churchMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!row) notFound();

  const canAccess = row.role === 'admin' || row.role === 'pastor';
  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          Only church administrators and pastors can manage 501(c)(3) verification.
        </p>
        <Link href={`/church/${slug}`} className="text-sm text-primary hover:underline">
          ← Back to {row.name}
        </Link>
      </div>
    );
  }

  // Latest verification record
  const [latestVerification] = await db
    .select()
    .from(nonprofitVerifications)
    .where(eq(nonprofitVerifications.churchId, row.id))
    .orderBy(desc(nonprofitVerifications.submittedAt))
    .limit(1);

  const statusInfo = latestVerification
    ? STATUS_LABELS[latestVerification.status] ?? STATUS_LABELS.unverified
    : STATUS_LABELS.unverified;

  const showForm = !latestVerification || latestVerification.status === 'rejected';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href={`/church/${slug}/settings`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
      >
        ← Back to Settings
      </Link>
      <h1 className="text-2xl font-bold mb-1">501(c)(3) Verification</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Submit your IRS determination letter to verify your nonprofit status. Verified
        churches are eligible for nonprofit discounts on eligible plans.
      </p>

      {/* Current status */}
      {latestVerification && (
        <div className="rounded-lg border bg-card p-5 mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Current status:</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>
          {latestVerification.legalName && (
            <p className="text-sm text-muted-foreground">
              Legal name: {latestVerification.legalName}
            </p>
          )}
          {latestVerification.ein && (
            <p className="text-sm text-muted-foreground">EIN: {latestVerification.ein}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Submitted: {latestVerification.submittedAt.toLocaleDateString()}
          </p>
          {latestVerification.reviewNotes && (
            <p className="text-sm">
              <span className="font-medium">Review notes:</span>{' '}
              {latestVerification.reviewNotes}
            </p>
          )}
        </div>
      )}

      {/* Upload form — shown when no submission exists or previous was rejected */}
      {showForm && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">
            {latestVerification?.status === 'rejected'
              ? 'Resubmit determination letter'
              : 'Submit determination letter'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload your IRS 501(c)(3) determination letter. Only PDF files are accepted.
            Your file will be stored securely and reviewed by a PrayerJar administrator.
          </p>
          <NonprofitUploadForm churchId={row.id} churchName={row.name} />
        </div>
      )}

      {latestVerification?.status === 'pending' && (
        <p className="text-sm text-muted-foreground mt-4">
          Your submission is under review. You will be notified when a decision is made.
        </p>
      )}

      {latestVerification?.status === 'verified' && (
        <p className="text-sm text-muted-foreground mt-4">
          Your 501(c)(3) status has been verified. Contact{' '}
          <a href="mailto:legal@prayerjar.org" className="text-primary underline underline-offset-4">
            legal@prayerjar.org
          </a>{' '}
          if you need to resubmit.
        </p>
      )}
    </div>
  );
}
