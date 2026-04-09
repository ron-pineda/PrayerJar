import { getAnsweredPrayers } from '@/services/prayer.service';
import { PraiseCard } from '@/components/praise-card';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CategoryValue } from '@/db/schema';

export const metadata = { title: 'Praise Wall | The Prayer Jar' };

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

  const prayers = await getAnsweredPrayers(activeCategory);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Praise Wall</h1>
        <p className="text-muted-foreground">
          Celebrating answered prayers and testimonies from our community.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
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

      {prayers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No answered prayers yet in this category.</p>
          <p className="text-muted-foreground mb-6">
            Be the first to share when God answers your prayer!
          </p>
          <Button render={<Link href="/" />}>Submit a Prayer Request</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 scroll-reveal-stagger">
          {prayers.map((prayer) => (
            <div key={prayer.id} className="animate-fade-slide-up" style={{ opacity: 0 }}>
              <PraiseCard prayer={prayer} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
