import type { Metadata } from "next";
import { Suspense } from "react";
import { searchPrayers } from "@/services/prayer.service";
import { PRAYER_CATEGORIES } from "@/lib/utils";
import type { CategoryValue } from "@/db/schema";
import { PrayerSearchBar } from "@/components/prayer-search-bar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookMarked } from "lucide-react";
import { getPublishedCollections, getCategoryCounts } from "@/services/collections.service";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Browse Prayers | The Prayer Jar" };

export const dynamic = 'force-dynamic';

const CATEGORY_EMOJIS: Record<string, string> = {
  health: "🩺",
  family: "👨‍👩‍👧",
  financial: "💰",
  grief: "🕊️",
  gratitude: "🙏",
  guidance: "🧭",
  relationships: "❤️",
  work_career: "💼",
  spiritual_growth: "✨",
  other: "⭐",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; urgent?: string }>;
}) {
  const { q, category, urgent } = await searchParams;
  const validCategories = PRAYER_CATEGORIES.map((c) => c.value) as string[];
  const activeCategory =
    category && validCategories.includes(category)
      ? (category as CategoryValue)
      : "any";
  const urgentOnly = urgent === "1";
  const session = await auth();

  const [results, collections, categoryCounts] = await Promise.all([
    searchPrayers({
      query: q,
      category: activeCategory,
      urgentOnly,
      limit: 20,
      excludeUserId: session?.user?.id,
    }),
    getPublishedCollections(),
    getCategoryCounts(),
  ]);

  // Build count map for category grid display
  const countMap = new Map(categoryCounts.map((c) => [c.category, c.count]));

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Browse Prayers</h1>
        <p className="text-muted-foreground">
          Search and filter active prayer requests from the community.
        </p>
      </div>

      <Suspense>
        <PrayerSearchBar />
      </Suspense>

      {/* Collections section — only show when not filtering */}
      {!q && !category && collections.length > 0 && (
        <section className="mt-10 mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookMarked className="h-5 w-5" />
            Collections
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/browse/collections/${col.slug}`}
                className="rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{col.coverEmoji ?? "📚"}</span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{col.title}</p>
                    {col.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {col.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {col.prayerCount} {col.prayerCount === 1 ? "prayer" : "prayers"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category grid — only show when not filtering */}
      {!q && !category && categoryCounts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PRAYER_CATEGORIES.map((cat) => {
              const count = countMap.get(cat.value) ?? 0;
              if (count === 0) return null;
              return (
                <Link
                  key={cat.value}
                  href={`/browse?category=${cat.value}`}
                  className="rounded-xl border bg-card p-3 text-center hover:bg-accent/50 transition-colors"
                >
                  <div className="text-2xl mb-1">{CATEGORY_EMOJIS[cat.value] ?? "🙏"}</div>
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{count}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Prayer results */}
      <div className="mt-2">
        {(q || category) && (
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-muted-foreground">
              {q
                ? `${results.length === 20 ? "20+" : results.length} results for "${q.slice(0, 60)}"`
                : `${results.length} ${results.length === 1 ? "prayer" : "prayers"} in ${category}`}
            </p>
            <Button variant="outline" size="sm" render={<Link href="/browse" />}>
              Clear
            </Button>
          </div>
        )}

        {results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {q ? `No prayers found for "${q.slice(0, 100)}".` : "No prayers found with these filters."}
            </p>
            <Button variant="outline" render={<Link href="/browse" />}>Clear filters</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {!q && !category && (
              <p className="text-sm font-medium text-muted-foreground mb-2">Recent Prayers</p>
            )}
            {results.map((prayer) => (
              <div
                key={prayer.id}
                className="rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                      {prayer.category.replace("_", " ")}
                    </span>
                    {prayer.isUrgent && (
                      <Badge variant="destructive" className="text-xs">Urgent</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {prayer.prayerCount} {prayer.prayerCount === 1 ? "prayer" : "prayers"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed line-clamp-3">{prayer.content}</p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    render={<Link href={`/pray/${prayer.category}`} />}
                  >
                    Pray for someone like this →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
