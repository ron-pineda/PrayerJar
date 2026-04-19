// src/app/(public)/find-a-church/page.tsx
"use client";

import { useState, lazy, Suspense, useMemo, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChurchSearchBar, type SearchParams } from "@/components/church/church-search-bar";
import { ChurchCard } from "@/components/church/church-card";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChurchResult } from "@/services/church.service";
import { MapPin, SearchX, AlertCircle, ChevronDown, List, Map as MapIcon } from "lucide-react";

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
  const [lastRadius, setLastRadius] = useState<number>(25);
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("distance");
  const [denomination, setDenomination] = useState("all");
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  const fetchResults = useCallback(async (lat: number, lng: number, radiusMiles: number) => {
    setLoading(true);
    setError(null);
    setLastRadius(radiusMiles);
    try {
      const res = await fetch(`/api/v1/churches/search?lat=${lat}&lng=${lng}&radius=${radiusMiles}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data: ChurchResult[] = await res.json();
      setResults(data);
      setDenomination("all");
      setSearched(true);
    } catch (e) {
      console.error("Church search failed:", e);
      setError("We couldn't complete that search. Check your connection and try again.");
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
          <span>{filtered.length} churches nearby</span>
          <div className="flex items-center gap-2">
            {denominations.length > 0 && (
              <Select value={denomination} onValueChange={(v) => { setDenomination(v ?? "all"); setPage(0); }}>
                <SelectTrigger className="h-7 text-xs px-2" aria-label="Denomination">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All denominations</SelectItem>
                  {denominations.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={sort} onValueChange={(v) => setSort((v ?? "distance") as SortOption)}>
              <SelectTrigger className="h-7 text-xs px-2" aria-label="Sort by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="verified">Community verified first</SelectItem>
              </SelectContent>
            </Select>
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
              className={`flex-1 py-2.5 text-sm inline-flex items-center justify-center gap-1.5 ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              {tab === "list" ? (
                <>
                  <List className="h-4 w-4" />
                  <span>List ({filtered.length})</span>
                </>
              ) : (
                <>
                  <MapIcon className="h-4 w-4" />
                  <span>Map</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg mx-4 mt-2 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-none" />
          <span>{error}</span>
        </div>
      )}

      {/* Results area */}
      {!searched ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm text-center px-6 py-12">
          <MapPin className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="max-w-md">
            Enter a city, zip, or address above. We&rsquo;ll show churches near you and how they serve their community.
          </p>
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
              <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center">
                <SearchX className="h-8 w-8 text-muted-foreground mb-3" />
                {lastRadius >= 30 ? (
                  <>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      No churches found near there.
                    </h3>
                    <p className="max-w-xs">Try a different city.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      No churches in that radius yet.
                    </h3>
                    <p className="mb-4 max-w-xs">
                      Try expanding the search to 30 miles, or search another city.
                    </p>
                    <button
                      onClick={() => fetchResults(searchCoords!.lat, searchCoords!.lng, 30)}
                      className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg"
                    >
                      Expand to 30 miles
                    </button>
                  </>
                )}
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
                    className="w-full py-3 text-sm text-primary hover:text-primary/80 border border-border rounded-xl inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Show more ({filtered.length - paginated.length} remaining)</span>
                    <ChevronDown className="h-4 w-4" />
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
