import { auth } from '@/lib/auth';
import { getPendingReports } from '@/services/moderation.service';
import { getPrayerById } from '@/services/prayer.service';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { approveReportAction, rejectContentAction, dismissReportAction } from '@/app/actions/admin.actions';

export default async function AdminQueuePage() {
  const session = await auth();
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());
  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    redirect('/');
  }

  const reports = await getPendingReports();

  const reportsWithContent = await Promise.all(
    reports.map(async (report) => ({
      report,
      prayer: report.prayerId ? await getPrayerById(report.prayerId) : null,
    }))
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Moderation Queue</h1>
      <p className="text-muted-foreground mb-8">{reports.length} pending reports</p>

      {reportsWithContent.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Queue is clear!</p>
      ) : (
        <div className="space-y-4">
          {reportsWithContent.map(({ report, prayer }) => (
            <Card key={report.id}>
              <CardHeader>
                <p className="text-sm font-medium">Reason: {report.reason}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {prayer && (
                  <p className="text-sm bg-muted p-3 rounded">{prayer.content}</p>
                )}
                <div className="flex gap-2">
                  <form action={approveReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <Button size="sm" variant="outline" type="submit">Dismiss Report (Keep Content)</Button>
                  </form>
                  <form action={rejectContentAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <Button size="sm" variant="destructive" type="submit">Remove Content</Button>
                  </form>
                  <form action={dismissReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <Button size="sm" variant="ghost" type="submit">Dismiss</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
