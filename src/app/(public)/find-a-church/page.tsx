// src/app/(public)/find-a-church/page.tsx
"use client";

import { useState, lazy, Suspense, useMemo, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChurchSearchBar, type SearchParams } from "@/components/church/church-search-bar";
import { ChurchCard } from "@/components/church/church-card";
import { useRouter, useSearchParams } from "next/navigation";
import type { ChurchResult } from "@/services/church.service";

const ChurchMap = lazy(() =>
  import("@/components/church/church-map").then((m) => ({ default: m.ChurchMap }))
);

type SortOption = "distance" | "verified";

export default function FindAChurchPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<ChurchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("distance");
  const [denomination, setDenomination] = useState("all");
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  const fetchResults = useCallback(async (lat: number, lng: number, radiusMiles: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/churches/search?lat=${lat}&lng=${lng}&radius=${radiusMiles}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data: ChurchResult[] = await res.json();
      setResults(data);
      setDenomination("all");
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore search from URL params (e.g. after navigating back from a church detail)
  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");
    const address = searchParams.get("address");
    if (lat && lng && radius) {
      setSearchCoords({ lat: Number(lat), lng: Number(lng) });
      setSearchAddress(address ?? "");
      fetchResults(Number(lat), Number(lng), Number(radius));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  async function handleSearch({ lat, lng, radiusMiles, formattedAddress }: SearchParams) {
    setSearchCoords({ lat, lng });
    setSearchAddress(formattedAddress);
    // Encode search in URL so back-navigation restores results
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radiusMiles),
      address: formattedAddress,
    });
    router.replace(`/find-a-church?${params.toString()}`);
    await fetchResults(lat, lng, radiusMiles);
  }

  const sorted = useMemo(
    () =>
      [...results].sort((a, b) => {
        if (sort === "verified") {
          const aScore = (a.claim?.verified ? 2 : 0) + (a.recommendations.length > 0 ? 1 : 0);
          const bScore = (b.claim?.verified ? 2 : 0) + (b.recommendations.length > 0 ? 1 : 0);
          if (bScore !== aScore) return bScore - aScore;
        }
        return a.distanceMiles - b.distanceMiles;
      }),
    [results, sort]
  );

  const denominations = useMemo(
    () =>
      Array.from(
        new Set(
          results.flatMap((c) =>
            c.recommendations.map((r) => r.denomination).filter(Boolean)
          )
        )
      ).sort() as string[],
    [results]
  );

  const filtered = useMemo(
    () =>
      denomination === "all"
        ? sorted
        : sorted.filter((c) =>
            c.recommendations.some((r) => r.denomination === denomination)
          ),
    [sorted, denomination]
  );

  const paginated = filtered.slice(0, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ChurchSearchBar
        onSearch={handleSearch}
        loading={loading}
        compact={searched}
        currentAddress={searchAddress}
      />

      {/* Sort + count bar */}
      {searched && (
        <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border text-xs text-muted-foreground">
          <span>{filtered.length} churches found</span>
          <div className="flex items-center gap-2">
            {denominations.length > 0 && (
              <select
                value={denomination}
                onChange={(e) => { setDenomination(e.target.value); setPage(0); }}
                className="bg-muted border border-border rounded px-2 py-1 text-foreground"
              >
                <option value="all">Denomination: All</option>
                {denominations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-muted border border-border rounded px-2 py-1 text-foreground"
            >
              <option value="distance">Sort: Distance</option>
              <option value="verified">Sort: Community Verified First</option>
            </select>
          </div>
        </div>
      )}

      {/* Mobile tab toggle */}
      {searched && (
        <div className="flex border-b border-border md:hidden">
          {(["list", "map"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm capitalize ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              {tab === "list" ? `List (${filtered.length})` : "Map"}
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg mx-4 mt-2">
          {error}
        </div>
      )}

      {/* Results area */}
      {!searched ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Search for churches above to get started.
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Card list */}
          <div
            className={`w-full md:w-[45%] overflow-y-auto p-3 space-y-2 ${
              activeTab === "map" ? "hidden md:block" : ""
            }`}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-xl h-28 animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <p className="mb-3">No churches found in this area.</p>
                <button
                  onClick={() => fetchResults(searchCoords!.lat, searchCoords!.lng, 30)}
                  className="text-primary hover:underline"
                >
                  Try expanding to 30 miles
                </button>
              </div>
            ) : (
              <>
                {paginated.map((church) => (
                  <ChurchCard
                    key={church.placeId}
                    church={church}
                    isHighlighted={highlightedPlaceId === church.placeId}
                    onHover={setHighlightedPlaceId}
                    onCardClick={(id) => router.push(`/find-a-church/${id}`)}
                    isLoggedIn={!!session?.user}
                  />
                ))}
                {paginated.length < filtered.length && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="w-full py-3 text-sm text-primary hover:text-primary/80 border border-border rounded-xl"
                  >
                    Show more ({filtered.length - paginated.length} remaining)
                  </button>
                )}
              </>
            )}
          </div>

          {/* Map — isolated stacking context prevents Leaflet z-indices from
              bleeding above the site header/nav dropdown */}
          <div
            className={`flex-1 md:block ${activeTab === "list" ? "hidden md:block" : ""}`}
            style={{ isolation: "isolate" }}
          >
            {searchCoords && (
              <Suspense fallback={<div className="h-full bg-muted animate-pulse" />}>
                <ChurchMap
                  churches={filtered}
                  userLat={searchCoords.lat}
                  userLng={searchCoords.lng}
                  highlightedPlaceId={highlightedPlaceId}
                  onPinHover={setHighlightedPlaceId}
                />
              </Suspense>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
