import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import {
  getPrayerTrend,
  getInteractionTrend,
  getCategoryBreakdown,
  getAnsweredRate,
  getMemberGrowth,
} from '@/services/church-analytics.service';
import AnalyticsCharts from './AnalyticsCharts';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ChurchAnalyticsPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/dashboard/analytics`);
  }

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);
  const canAccess =
    currentMember?.member.role === 'admin' ||
    currentMember?.member.role === 'pastor';

  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          Access restricted to church administrators and pastors.
        </p>
        <Link href={`/church/${slug}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {church.name}
        </Link>
      </div>
    );
  }

  const [prayerTrend, interactionTrend, categoryBreakdown, answeredRate, memberGrowth] =
    await Promise.all([
      getPrayerTrend(church.id),
      getInteractionTrend(church.id),
      getCategoryBreakdown(church.id),
      getAnsweredRate(church.id),
      getMemberGrowth(church.id),
    ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}/dashboard`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold">{church.name} — Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Last 30 days of activity for your church community.
        </p>
      </div>

      <AnalyticsCharts
        prayerTrend={prayerTrend}
        interactionTrend={interactionTrend}
        categoryBreakdown={categoryBreakdown}
        memberGrowth={memberGrowth}
        answeredRate={answeredRate}
      />
    </div>
  );
}
