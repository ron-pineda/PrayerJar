import { getAnsweredPrayersFiltered } from '@/services/prayer.service';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { getDailyVerse } from '@/lib/daily-verse';
import { PrayerJar } from '@/components/prayer-jar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LightsReleasedClient } from '@/components/lights-released-client';
import type { CategoryValue } from '@/db/schema';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

// Title matches the nav label ("Answered Prayers") and the words someone would
// actually search. "Lights Released" is the in-product name for the wall and is
// kept as the on-page H1 — it is not a phrase anyone types into Google.
export const metadata = {
  title: 'Answered Prayers | The Prayer Jar',
  description:
    'The wall where answered prayers are marked and remembered. Read what people say God has done, and add your own when a prayer is answered.',
};

async function getAnsweredCount() {
  const [row] = await db
    .select({ count: count() })
    .from(prayers)
    .where(eq(prayers.status, 'answered'));
  return Number(row?.count ?? 0);
}

export default async function PraiseWallPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const validCategories = PRAYER_CATEGORIES.map((c) => c.value) as string[];
  const activeCategory =
    category && validCategories.includes(category)
      ? (category as CategoryValue)
      : undefined;

  const [answeredPrayers, verse, answeredCount] = await Promise.all([
    getAnsweredPrayersFiltered('month', activeCategory),
    Promise.resolve(getDailyVerse()),
    getAnsweredCount(),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <PrayerJar
          count={answeredCount}
          size="md"
          mode="lights"
          countLabel={`${answeredCount.toLocaleString()} lights released`}
        />
        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">
          Lights Released
        </h1>
        <p className="text-muted-foreground">
          Every light was once a prayer. God answered.
        </p>
      </div>

      {/* Daily verse */}
      <div className="border-t border-b py-4 mb-8 max-w-md mx-auto text-center">
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="text-xs text-primary mt-2">{verse.reference}</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={!activeCategory ? 'default' : 'outline'}
          size="sm"
          render={<Link href="/praise-wall" />}
        >
          All
        </Button>
        {PRAYER_CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={activeCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            render={<Link href={`/praise-wall?category=${cat.value}`} />}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <LightsReleasedClient initialPrayers={answeredPrayers} category={activeCategory} />
    </main>
  );
}
