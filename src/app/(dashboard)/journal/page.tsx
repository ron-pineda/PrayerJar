import type { Metadata } from 'next';
import { auth } from '@/lib/auth';

export const metadata: Metadata = { title: 'Prayer Journal | The Prayer Jar' };
import { getInteractionsByUser } from '@/services/interaction.service';
import { getPrayerById } from '@/services/prayer.service';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/empty-state';
import { BookOpen, Check } from 'lucide-react';

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
        <EmptyState
          icon={<BookOpen size={24} />}
          title="Your journal is empty"
          description="Prayers you've prayed for others will be saved here."
          action={{ label: "Pray for Someone", href: "/pray" }}
        />
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
                    {prayer.isAnonymous ? (
                      'An anonymous request'
                    ) : (
                      <>
                        &ldquo;{prayer.content.slice(0, 120)}
                        {prayer.content.length > 120 ? '…' : ''}&rdquo;
                      </>
                    )}
                  </p>
                  {interaction.message && (
                    <p className="text-sm">
                      Your message: &ldquo;{interaction.message}&rdquo;
                    </p>
                  )}
                  {prayer.status === 'answered' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <Check className="h-3 w-3" aria-hidden="true" /> Answered
                    </span>
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
