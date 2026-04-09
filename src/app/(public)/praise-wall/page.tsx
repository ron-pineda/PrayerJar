import { getAnsweredPrayersFiltered } from '@/services/prayer.service';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { getDailyVerse } from '@/lib/daily-verse';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LightsReleasedClient } from '@/components/lights-released-client';
import type { CategoryValue } from '@/db/schema';

export const metadata = { title: 'Lights Released | The Prayer Jar' };

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

  // Default period is 'month'
  const prayers = await getAnsweredPrayersFiltered('month', activeCategory);
  const verse = getDailyVerse();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Lights Released ✨</h1>
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

      <LightsReleasedClient initialPrayers={prayers} category={activeCategory} />
    </main>
  );
}
