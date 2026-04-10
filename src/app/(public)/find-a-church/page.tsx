// src/app/(public)/find-a-church/page.tsx
"use client";

import { useState, lazy, Suspense, useMemo } from "react";
import { useSession } from "next-auth/react";
import { ChurchSearchBar, type SearchParams } from "@/components/church/church-search-bar";
import { ChurchCard } from "@/components/church/church-card";
import { useRouter } from "next/navigation";
import type { ChurchResult } from "@/services/church.service";

const ChurchMap = lazy(() =>
  import("@/components/church/church-map").then((m) => ({ default: m.ChurchMap }))
);

type SortOption = "distance" | "verified";

export default function FindAChurchPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<ChurchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("distance");
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  async function handleSearch({ lat, lng, radiusMiles, formattedAddress }: SearchParams) {
    setLoading(true);
    setError(null);
    setSearchCoords({ lat, lng });
    setSearchAddress(formattedAddress);
    try {
      const res = await fetch(`/api/v1/churches/search?lat=${lat}&lng=${lng}&radius=${radiusMiles}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data: ChurchResult[] = await res.json();
      setResults(data);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
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

  const paginated = sorted.slice(0, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <ChurchSearchBar
        onSearch={handleSearch}
        loading={loading}
        compact={searched}
        currentAddress={searchAddress}
      />

      {/* Sort + count bar */}
      {searched && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
          <span>{results.length} churches found</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300"
          >
            <option value="distance">Sort: Distance</option>
            <option value="verified">Sort: Community Verified First</option>
          </select>
        </div>
      )}

      {/* Mobile tab toggle */}
      {searched && (
        <div className="flex border-b border-slate-800 md:hidden">
          {(["list", "map"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm capitalize ${
                activeTab === tab
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-500"
              }`}
            >
              {tab === "list" ? `List (${results.length})` : "Map"}
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-3 text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg mx-4 mt-2">
          {error}
        </div>
      )}

      {/* Results area */}
      {!searched ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
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
                <div key={i} className="bg-slate-800 rounded-xl h-28 animate-pulse" />
              ))
            ) : sorted.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <p className="mb-3">No churches found in this area.</p>
                <button
                  onClick={() => handleSearch({ lat: searchCoords!.lat, lng: searchCoords!.lng, radiusMiles: 50, formattedAddress: searchAddress })}
                  className="text-blue-400 hover:underline"
                >
                  Try expanding to 50 miles
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
                {paginated.length < sorted.length && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="w-full py-3 text-sm text-blue-400 hover:text-blue-300 border border-slate-700 rounded-xl"
                  >
                    Show more ({sorted.length - paginated.length} remaining)
                  </button>
                )}
              </>
            )}
          </div>

          {/* Map */}
          <div
            className={`flex-1 md:block ${activeTab === "list" ? "hidden md:block" : ""}`}
          >
            {searchCoords && (
              <Suspense fallback={<div className="h-full bg-slate-800 animate-pulse" />}>
                <ChurchMap
                  churches={sorted}
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
