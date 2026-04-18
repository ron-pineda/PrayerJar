'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ChmsConfig } from '@/lib/chms/ChmsAdapter';
import { disconnectChmsAction, triggerFullSyncAction } from '@/app/actions/chms.actions';

interface LatestJob {
  status: string;
  jobType: string;
  completedAt: Date | null;
  error: string | null;
  createdAt: Date;
}

interface Props {
  churchId: string;
  churchSlug: string;
  connected: boolean;
  config: ChmsConfig | null;
  memberCount: number;
  latestJob: LatestJob | null;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function relativeTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return 'Never';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SyncStatusBadge({ job }: { job: LatestJob | null }) {
  if (!job) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        Never synced
      </span>
    );
  }

  switch (job.status) {
    case 'running':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          <svg
            className="h-3 w-3 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          Syncing…
        </span>
      );

    case 'done':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          ● Synced {relativeTime(job.completedAt)}
        </span>
      );

    case 'dead':
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          ✕ Failed: {job.error ?? 'Unknown error'}
        </span>
      );

    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
          ○ Sync queued
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {job.status}
        </span>
      );
  }
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function ChmsConnectCard({
  churchId,
  churchSlug,
  connected,
  config,
  memberCount,
  latestJob,
}: Props) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleSyncNow() {
    setIsSyncing(true);
    setSyncDone(false);
    setActionError(null);
    try {
      const result = await triggerFullSyncAction(churchId);
      if ('error' in result) {
        setActionError(result.error);
      } else {
        setSyncDone(true);
        router.refresh();
      }
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDisconnect() {
    const confirmed = window.confirm(
      'Are you sure? This will remove the Planning Center connection for your church.'
    );
    if (!confirmed) return;

    setIsDisconnecting(true);
    setActionError(null);
    try {
      const result = await disconnectChmsAction(churchId);
      if ('error' in result) {
        setActionError(result.error);
        setIsDisconnecting(false);
      } else {
        router.push(`/church/${churchSlug}/settings`);
      }
    } catch {
      setActionError('Something went wrong. Please try again.');
      setIsDisconnecting(false);
    }
  }

  // ── Disconnected state ────────────────────────────────────────
  if (!connected) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold">Planning Center</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sync your member roster and small groups.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <a
            href={`/api/auth/chms/connect/planning-center?churchId=${churchId}`}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Connect Planning Center →
          </a>
        </div>
      </section>
    );
  }

  // ── Connected state ───────────────────────────────────────────
  return (
    <section className="rounded-lg border bg-card p-6">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h2 className="text-base font-semibold">Planning Center</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          ● Connected
        </span>
      </div>

      {/* Stats */}
      <dl className="space-y-1.5 text-sm text-muted-foreground mb-4">
        <div className="flex gap-2">
          <dt className="min-w-[120px]">Members synced</dt>
          <dd className="font-medium text-foreground">{memberCount}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="min-w-[120px]">Connected</dt>
          <dd>{relativeTime(config?.connectedAt)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="min-w-[120px]">Last sync</dt>
          <dd>{config?.lastSyncedAt ? relativeTime(config.lastSyncedAt) : 'Never'}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="min-w-[120px]">Status</dt>
          <dd>
            <SyncStatusBadge job={latestJob} />
          </dd>
        </div>
      </dl>

      {/* Groups warning */}
      {config?.groupsAvailable === false && (
        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          ⚠ Groups are not available for your Planning Center plan or organization.
        </div>
      )}

      {/* Inline feedback */}
      {syncDone && !isSyncing && (
        <p className="mb-3 text-sm text-green-700">
          Sync queued — this may take a few minutes.
        </p>
      )}
      {actionError && (
        <p className="mb-3 text-sm text-red-600">{actionError}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-2">
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={isSyncing || isDisconnecting}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSyncing ? (
            <>
              <svg
                className="h-3.5 w-3.5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Queueing…
            </>
          ) : (
            'Sync Now'
          )}
        </button>

        <button
          type="button"
          onClick={handleDisconnect}
          disabled={isSyncing || isDisconnecting}
          className="inline-flex items-center rounded-md border border-destructive/40 bg-background px-4 py-2 text-sm font-medium text-destructive shadow-sm hover:bg-destructive/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>
    </section>
  );
}
