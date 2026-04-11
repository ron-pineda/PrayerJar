import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getActivePartnership } from '@/services/partner.service';
import { getPrayersByAuthor } from '@/services/prayer.service';
import { differenceInDays } from 'date-fns';
import { MessageThread } from '@/components/partner/message-thread';
import { ExtendBanner } from '@/components/partner/extend-banner';
import { EndPartnershipButton } from '@/components/partner/end-partnership-button';
import { EmptyState } from '@/components/empty-state';
import { HandHeart } from 'lucide-react';

export const metadata: Metadata = { title: 'Prayer Partner | The Prayer Jar' };

export default async function PartnerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const currentUserId = session.user.id;
  const partnership = await getActivePartnership(currentUserId);

  // ── No partner ───────────────────────────────────────────────────────────
  if (!partnership) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Prayer Partner</h1>
        <EmptyState
          icon={<HandHeart size={24} />}
          title="You don't have a prayer partner yet"
          description="We match partners daily based on shared prayer categories. Check back tomorrow!"
        />
      </main>
    );
  }

  // ── Active partner ────────────────────────────────────────────────────────
  const partnerId =
    partnership.userId === currentUserId ? partnership.partnerId : partnership.userId;

  const [partnerRecord, partnerPrayers] = await Promise.all([
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, partnerId)).then((r) => r[0] ?? null),
    getPrayersByAuthor(partnerId),
  ]);

  const partnerName = partnerRecord?.name ?? 'Your Partner';
  const partnerInitial = partnerName.trim().charAt(0).toUpperCase();

  const now = new Date();
  const daysLeft = Math.max(0, differenceInDays(new Date(partnership.expiresAt), now));
  const showExtendBanner = daysLeft <= 7;

  // Last 3 active prayers for the partner
  const recentPrayers = partnerPrayers
    .filter((p) => p.status === 'active')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Prayer Partner</h1>
      </div>

      {/* Extend banner — only when ≤7 days left */}
      {showExtendBanner && (
        <ExtendBanner
          partnershipId={partnership.id}
          daysLeft={daysLeft}
          extendRequestedBy={partnership.extendRequestedBy ?? null}
          currentUserId={currentUserId}
          partnerId={partnerId}
        />
      )}

      {/* Partner card */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        {/* Partner identity */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl font-bold text-amber-700 dark:text-amber-300 shrink-0">
            {partnerInitial}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{partnerName}</h2>
            <p className="text-sm text-muted-foreground">
              {daysLeft > 0
                ? `Partnership expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                : 'Partnership expires today'}
            </p>
          </div>
        </div>

        {/* Partner's recent prayers */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            {partnerName.split(' ')[0]}'s Recent Prayers
          </h3>

          {recentPrayers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {partnerName.split(' ')[0]} hasn't shared any prayers yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentPrayers.map((prayer) => (
                <li key={prayer.id} className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <p className="text-sm line-clamp-2 leading-relaxed">{prayer.content}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(prayer.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {prayer.category && (
                      <> · <span className="capitalize">{prayer.category.replace('_', ' ')}</span></>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* End partnership link */}
        <div className="pt-1 border-t flex justify-end">
          <EndPartnershipButton partnershipId={partnership.id} />
        </div>
      </div>

      {/* Message thread */}
      <MessageThread
        partnershipId={partnership.id}
        currentUserId={currentUserId}
        partnerName={partnerName}
      />
    </main>
  );
}
