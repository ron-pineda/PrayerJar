import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { campaigns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'Campaign | The Prayer Jar' };

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.slug, slug),
  });

  if (!campaign) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      {/* Ended banner */}
      {!campaign.isActive && (
        <div className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-600 dark:text-amber-400">
          This campaign has ended. You can still pray for this intention.
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-12">
        {campaign.coverEmoji && (
          <div className="text-6xl mb-4">{campaign.coverEmoji}</div>
        )}
        <h1 className="text-3xl font-bold tracking-tight mb-4">{campaign.title}</h1>
        {campaign.description && (
          <p className="text-muted-foreground leading-relaxed">{campaign.description}</p>
        )}
      </div>

      {/* Join the Prayer */}
      <div className="border rounded-lg p-8 text-center space-y-4 bg-muted/30">
        <h2 className="text-xl font-semibold">Join the Prayer</h2>
        <p className="text-sm text-muted-foreground">
          Add your voice to this prayer movement. Every prayer counts.
        </p>
        <Button size="lg" render={<Link href={`/pray?context=${encodeURIComponent(slug)}`} />}>
          🙏 Pray Now
        </Button>
      </div>

      {/* Back link */}
      <div className="mt-12 text-center">
        <Link
          href="/pray"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to the prayer feed
        </Link>
      </div>
    </main>
  );
}
