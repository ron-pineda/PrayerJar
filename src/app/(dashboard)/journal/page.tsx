import type { Metadata } from 'next';
import { auth } from '@/lib/auth';

export const metadata: Metadata = { title: 'Prayer Journal | The Prayer Jar' };
import { getInteractionsByUser } from '@/services/interaction.service';
import { getPrayerById } from '@/services/prayer.service';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const interactions = await getInteractionsByUser(session.user.id);

  const interactionsWithPrayers = await Promise.all(
    interactions.map(async (i) => ({
      interaction: i,
      prayer: await getPrayerById(i.prayerId),
    }))
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Prayer Journal</h1>
      <p className="text-muted-foreground mb-8">Prayers you&apos;ve interceded for.</p>

      {interactionsWithPrayers.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          You haven&apos;t prayed for anyone yet.{' '}
          <a href="/pray" className="underline">Start praying</a>
        </p>
      ) : (
        <div className="space-y-4">
          {interactionsWithPrayers.map(({ interaction, prayer }) => {
            if (!prayer) return null;
            const catLabel = PRAYER_CATEGORIES.find((c) => c.value === prayer.category)?.label;
            return (
              <Card key={interaction.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{catLabel}</span>
                    <span>{new Date(interaction.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic mb-2">
                    {prayer.isAnonymous ? '[Anonymous prayer]' : `"${prayer.content.slice(0, 120)}..."`}
                  </p>
                  {interaction.message && (
                    <p className="text-sm">
                      Your message: &ldquo;{interaction.message}&rdquo;
                    </p>
                  )}
                  {prayer.status === 'answered' && (
                    <span className="text-xs text-green-600 font-medium">✓ Answered</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
