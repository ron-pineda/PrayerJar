import { requireAdmin } from '@/lib/admin-auth';
import { listModerationLogs } from '@/services/moderation-log.service';
import { listContactSubmissions } from '@/services/contact.service';
import { db } from '@/db';
import { reports, nonprofitVerifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

async function getNavCounts() {
  const [unresolvedModLogs, unreadContact, pendingReports, pendingVerifications] =
    await Promise.all([
      listModerationLogs({ resolved: false, limit: 200 }),
      listContactSubmissions({ read: false, limit: 200 }),
      db.select().from(reports).where(eq(reports.status, 'pending')),
      db
        .select({ id: nonprofitVerifications.id })
        .from(nonprofitVerifications)
        .where(eq(nonprofitVerifications.status, 'pending')),
    ]);

  return {
    reports: pendingReports.length,
    moderation: unresolvedModLogs.length,
    feedback: unreadContact.length,
    legalVerifications: pendingVerifications.length,
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const counts = await getNavCounts();

  const navLinks = [
    { href: '/admin', label: 'Overview', count: null, critical: false },
    { href: '/admin/queue', label: 'Reports', count: counts.reports, critical: counts.reports > 0 },
    { href: '/admin/moderation', label: 'Moderation', count: counts.moderation, critical: counts.moderation > 0 },
    { href: '/admin/feedback', label: 'Feedback', count: counts.feedback, critical: false },
    {
      href: '/admin/legal-verifications',
      label: 'Legal',
      count: counts.legalVerifications,
      critical: false,
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left rail nav */}
      <aside className="w-52 shrink-0 border-r bg-muted/30 px-3 py-8 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-3">
          Platform Admin
        </p>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <span>{link.label}</span>
            {link.count !== null && link.count > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-5 h-5 rounded-full px-1.5 text-xs font-semibold ${
                  link.critical
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted-foreground/20 text-muted-foreground'
                }`}
              >
                {link.count > 99 ? '99+' : link.count}
              </span>
            )}
          </Link>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
