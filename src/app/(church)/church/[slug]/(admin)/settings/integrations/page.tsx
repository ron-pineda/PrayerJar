import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { churches, churchMembers, chmsSyncJobs } from '@/db/schema';
import { eq, and, isNotNull, desc, count } from 'drizzle-orm';
import { decrypt } from '@/lib/encrypt';
import type { ChmsConfig } from '@/lib/chms/ChmsAdapter';
import { ChmsConnectCard } from './ChmsConnectCard';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ChurchIntegrationsPage({ params }: Props) {
  const { slug } = await params;

  // ── Auth ──────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/church/${slug}/settings`);
  }

  // ── Load church ───────────────────────────────────────────────
  const [church] = await db
    .select({
      id: churches.id,
      name: churches.name,
      chmsProvider: churches.chmsProvider,
      chmsConfig: churches.chmsConfig,
    })
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);

  if (!church) notFound();

  // ── Role gate: admin/pastor only ──────────────────────────────
  const [membership] = await db
    .select({ role: churchMembers.role })
    .from(churchMembers)
    .where(
      and(
        eq(churchMembers.churchId, church.id),
        eq(churchMembers.userId, session.user.id)
      )
    )
    .limit(1);

  const canEdit =
    membership?.role === 'admin' || membership?.role === 'pastor';

  if (!canEdit) {
    redirect(`/church/${slug}/settings`);
  }

  // ── Decrypt ChMS config ───────────────────────────────────────
  let chmsConfig: ChmsConfig | null = null;
  if (church.chmsConfig) {
    try {
      chmsConfig = JSON.parse(decrypt(church.chmsConfig)) as ChmsConfig;
    } catch (err) {
      console.error('[integrations/page] Failed to decrypt chmsConfig:', err);
      chmsConfig = null;
    }
  }

  // ── Member count (synced via ChMS) ────────────────────────────
  const [memberCountRow] = await db
    .select({ value: count() })
    .from(churchMembers)
    .where(
      and(
        eq(churchMembers.churchId, church.id),
        isNotNull(churchMembers.chmsProvider)
      )
    );
  const memberCount = Number(memberCountRow?.value ?? 0);

  // ── Latest sync job ───────────────────────────────────────────
  const [latestJob] = await db
    .select({
      status: chmsSyncJobs.status,
      jobType: chmsSyncJobs.jobType,
      completedAt: chmsSyncJobs.completedAt,
      error: chmsSyncJobs.error,
      createdAt: chmsSyncJobs.createdAt,
    })
    .from(chmsSyncJobs)
    .where(eq(chmsSyncJobs.churchId, church.id))
    .orderBy(desc(chmsSyncJobs.createdAt))
    .limit(1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href={`/church/${slug}/settings`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Settings
      </Link>
      <h1 className="text-2xl font-bold mb-2">{church.name} — Integrations</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Connect your Church Management System to sync your member roster.
      </p>

      <ChmsConnectCard
        churchId={church.id}
        churchSlug={slug}
        connected={!!church.chmsProvider}
        config={chmsConfig}
        memberCount={memberCount}
        latestJob={latestJob ?? null}
      />
    </div>
  );
}
