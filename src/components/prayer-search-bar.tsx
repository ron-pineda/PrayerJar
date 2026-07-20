"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import { PRAYER_CATEGORIES } from "@/lib/utils";

export function PrayerSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      // Reset offset on any filter change
      params.delete("offset");
      return params.toString();
    },
    [searchParams]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`${pathname}?${createQueryString({ q: q || null })}`);
  }

  const activeCategory = searchParams.get("category") ?? "any";
  const urgentOnly = searchParams.get("urgent") === "1";

  return (
    <div className="space-y-4">
      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prayer requests..."
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
        {(q || activeCategory !== "any" || urgentOnly) && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQ("");
              router.push(pathname);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => router.push(`${pathname}?${createQueryString({ category: null })}`)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            activeCategory === "any"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {PRAYER_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() =>
              router.push(`${pathname}?${createQueryString({ category: cat.value })}`)
            }
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Urgent toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            router.push(
              `${pathname}?${createQueryString({ urgent: urgentOnly ? null : "1" })}`
            )
          }
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            urgentOnly
              ? "bg-red-500 text-white border-red-500"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Urgent only
        </button>
      </div>
    </div>
  );
}
