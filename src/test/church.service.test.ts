import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the db module — hoisted so it runs before imports
vi.mock("@/db", () => ({ db: { select: vi.fn(), insert: vi.fn() } }));

import { geocodeAddress, searchChurches } from "@/services/church.service";
import type { GooglePlace } from "@/services/church.service";

// ──────────────────────────────────────────────
// geocodeAddress
// ──────────────────────────────────────────────
describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = "test-key";
  });

  it("returns lat/lng for a valid address", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "OK",
        results: [
          {
            geometry: { location: { lat: 39.7817, lng: -89.6501 } },
            formatted_address: "Springfield, IL, USA",
          },
        ],
      }),
    });

    const result = await geocodeAddress("Springfield, IL");
    expect(result).toEqual({
      lat: 39.7817,
      lng: -89.6501,
      formattedAddress: "Springfield, IL, USA",
    });
  });

  it("returns null for an unresolvable address", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ZERO_RESULTS", results: [] }),
    });

    const result = await geocodeAddress("xyzzy nowhere");
    expect(result).toBeNull();
  });
});

// ──────────────────────────────────────────────
// searchChurches — cache hit
// ──────────────────────────────────────────────
describe("searchChurches — cache hit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = "test-key";
  });

  it("returns cached results without calling Google", async () => {
    const cachedResults: GooglePlace[] = [
      {
        placeId: "abc123",
        name: "Grace Church",
        address: "1 Main St",
        lat: 39.78,
        lng: -89.65,
        distanceMiles: 1.2,
      },
    ];

    const { db } = await import("@/db");

    // Each call to db.select() returns a builder for that specific query.
    // Call order:
    //   1st  → cache lookup  → returns a cached row
    //   2nd  → churchClaims  → returns []
    //   3rd  → churchRecommendations → returns []
    //   4th  → savedChurches → returns []
    let selectCallCount = 0;
    (db as any).select = vi.fn().mockImplementation(() => {
      selectCallCount++;
      const callIndex = selectCallCount;

      const emptyChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      };

      if (callIndex === 1) {
        // Cache hit
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                results: cachedResults,
                expiresAt: new Date(Date.now() + 3_600_000),
              },
            ]),
          }),
        };
      }

      return emptyChain;
    });

    mockFetch.mockClear();

    const results = await searchChurches({
      lat: 39.78,
      lng: -89.65,
      radiusMiles: 25,
      userId: null,
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(results[0].placeId).toBe("abc123");
    expect(results[0].claim).toBeNull();
    expect(results[0].recommendations).toEqual([]);
    expect(results[0].savedByUser).toBe(false);
    expect(results[0].newcomerFriendly).toBe(false);
  });
});
