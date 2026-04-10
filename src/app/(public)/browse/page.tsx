import type { Metadata } from "next";
import { Suspense } from "react";
import { searchPrayers } from "@/services/prayer.service";
import { PRAYER_CATEGORIES } from "@/lib/utils";
import type { CategoryValue } from "@/db/schema";
import { PrayerSearchBar } from "@/components/prayer-search-bar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Browse Prayers | The Prayer Jar" };

export const dynamic = 'force-dynamic';

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

  const results = await searchPrayers({
    query: q,
    category: activeCategory,
    urgentOnly,
    limit: 20,
  });

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

      <div className="mt-8">
        {results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {q ? `No prayers found for "${q.slice(0, 100)}".` : "No prayers found with these filters."}
            </p>
            <Button variant="outline" render={<Link href="/browse" />}>Clear filters</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {results.length === 20
                ? "Showing 20 results"
                : `${results.length} ${results.length === 1 ? "prayer" : "prayers"} found`}
            </p>
            <div className="space-y-3">
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
                        <span className="text-xs bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                          🚨 Urgent
                        </span>
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
          </>
        )}
      </div>
    </main>
  );
}
