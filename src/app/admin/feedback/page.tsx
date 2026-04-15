import { requireAdmin } from '@/lib/admin-auth';
import { listContactSubmissions } from '@/services/contact.service';
import { Card, CardContent } from '@/components/ui/card';
import { MarkReadButton } from '@/components/admin/mark-read-button';

export const metadata = { title: 'Feedback Inbox | Admin' };

function formatDate(d: Date) {
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default async function FeedbackPage() {
  await requireAdmin();

  const submissions = await listContactSubmissions({ limit: 100 });

  // Sort: unread first, then by date desc (already sorted by date desc from service)
  const sorted = [
    ...submissions.filter((s) => !s.readAt),
    ...submissions.filter((s) => !!s.readAt),
  ];

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback Inbox</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Contact form submissions — {sorted.filter((s) => !s.readAt).length} unread
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((sub) => {
            const isUnread = !sub.readAt;
            return (
              <Card
                key={sub.id}
                className={isUnread ? 'border-primary/40 bg-primary/5' : undefined}
              >
                <CardContent className="px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUnread && (
                          <span className="inline-block w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                        <span className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                          {sub.name}
                        </span>
                        <span className="text-xs text-muted-foreground">&lt;{sub.email}&gt;</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {sub.subject}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(sub.createdAt)}</p>
                    </div>
                    <div className="shrink-0">
                      {isUnread ? (
                        <MarkReadButton id={sub.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground">Read</span>
                      )}
                    </div>
                  </div>
                  <ExpandableMessage message={sub.message} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

function ExpandableMessage({ message }: { message: string }) {
  const truncated = message.slice(0, 150);
  const isTruncated = message.length > 150;

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {truncated}
        {isTruncated && (
          <>
            …{' '}
            <details className="inline">
              <summary className="inline cursor-pointer text-xs underline">Show more</summary>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{message}</p>
            </details>
          </>
        )}
      </p>
    </div>
  );
}
