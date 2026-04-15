import { requireAdmin } from '@/lib/admin-auth';
import { listModerationLogs } from '@/services/moderation-log.service';
import type { ModerationLog } from '@/db/schema';
import { Card, CardContent } from '@/components/ui/card';
import { ModerationFilters } from '@/components/admin/moderation-filters';
import { AcknowledgeLogButton } from '@/components/admin/acknowledge-log-button';

export const metadata = { title: 'Moderation Log | Admin' };

function formatDate(d: Date) {
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function CategoryBadge({ category }: { category: ModerationLog['category'] }) {
  const styles: Record<ModerationLog['category'], string> = {
    selfHarm: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    harassment: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400',
    hate: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
    sexual: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-400',
    spam: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
    other: 'bg-muted text-muted-foreground',
  };
  const labels: Record<ModerationLog['category'], string> = {
    selfHarm: 'Self-harm',
    harassment: 'Harassment',
    hate: 'Hate',
    sexual: 'Sexual',
    spam: 'Spam',
    other: 'Other',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[category]}`}>
      {labels[category]}
    </span>
  );
}

type PageProps = {
  searchParams: Promise<{ category?: string; status?: string }>;
};

export default async function ModerationPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const categoryParam = params.category;
  const statusParam = params.status;

  const validCategories = ['selfHarm', 'spam', 'harassment', 'hate', 'sexual', 'other'] as const;
  type ValidCategory = typeof validCategories[number];

  const category = validCategories.includes(categoryParam as ValidCategory)
    ? (categoryParam as ValidCategory)
    : undefined;

  const resolved =
    statusParam === 'resolved' ? true :
    statusParam === 'unresolved' ? false :
    undefined;

  const logs = await listModerationLogs({ category, resolved, limit: 100 });

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moderation Log</h1>
        <p className="text-muted-foreground text-sm mt-1">AI rejections and content flags</p>
      </div>

      <ModerationFilters />

      {logs.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No results for the current filters.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Snippet</th>
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 align-top">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {log.contentType}
                      </td>
                      <td className="px-4 py-3">
                        <CategoryBadge category={log.category} />
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {log.contentSnippet ? (
                          <span className="text-muted-foreground line-clamp-2">
                            {log.contentSnippet.slice(0, 150)}
                            {log.contentSnippet.length > 150 ? '…' : ''}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Content removed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {log.userId ? (
                          <span title={log.userId}>{log.userId.slice(0, 8)}…</span>
                        ) : (
                          <span className="italic">anonymous</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.resolvedAt ? (
                          <span className="text-xs text-muted-foreground">
                            Resolved {formatDate(log.resolvedAt)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-destructive">Unresolved</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!log.resolvedAt && (
                          <AcknowledgeLogButton id={log.id} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
