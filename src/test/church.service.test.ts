import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the db module — hoisted so it runs before imports
vi.mock("@/db", () => ({ db: { select: vi.fn(), insert: vi.fn(), delete: vi.fn(), update: vi.fn() } }));

// Mock ai.service
vi.mock("@/services/ai.service", () => ({
  moderateContent: vi.fn().mockResolvedValue({ safe: true }),
}));

// Mock email.service
vi.mock("@/services/email.service", () => ({
  sendClaimVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

import { geocodeAddress, searchChurches } from "@/services/church.service";
import type { GooglePlace } from "@/services/church.service";
import { savedChurches, churchRecommendations, churchClaims } from "@/db/schema";

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

// ──────────────────────────────────────────────
// searchChurches — cache miss
// ──────────────────────────────────────────────
describe("searchChurches — cache miss", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = "test-key";
  });

  it("calls Google Places API and writes result to cache when DB returns no cached results", async () => {
    const googlePlace = {
      id: "place456",
      displayName: { text: "Hope Church" },
      formattedAddress: "2 Church Ave, Springfield, IL",
      location: { latitude: 39.79, longitude: -89.66 },
      nationalPhoneNumber: undefined,
      websiteUri: undefined,
      currentOpeningHours: undefined,
    };

    // fetchGooglePlaces fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ places: [googlePlace] }),
    });

    const { db } = await import("@/db");

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
        // Cache miss — return empty array
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        };
      }

      return emptyChain;
    });

    const mockInsertValues = vi.fn().mockResolvedValue([]);
    (db as any).insert = vi.fn().mockReturnValue({ values: mockInsertValues });

    const results = await searchChurches({
      lat: 39.79,
      lng: -89.66,
      radiusMiles: 25,
      userId: null,
    });

    // fetch was called with the Google Places URL
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://places.googleapis.com/v1/places:searchNearby"
    );

    // result was written to cache
    expect((db as any).insert).toHaveBeenCalledOnce();
    expect(mockInsertValues).toHaveBeenCalledOnce();
    const insertedValues = mockInsertValues.mock.calls[0][0];
    expect(insertedValues.lat).toBe(39.79);
    expect(insertedValues.lng).toBe(-89.66);
    expect(insertedValues.radiusMiles).toBe(25);
    expect(insertedValues.results).toHaveLength(1);
    expect(insertedValues.results[0].placeId).toBe("place456");

    // returned result is shaped correctly
    expect(results).toHaveLength(1);
    expect(results[0].placeId).toBe("place456");
    expect(results[0].name).toBe("Hope Church");
    expect(results[0].claim).toBeNull();
    expect(results[0].recommendations).toEqual([]);
    expect(results[0].savedByUser).toBe(false);
  });
});

// ──────────────────────────────────────────────
// saveChurch
// ──────────────────────────────────────────────
import { saveChurch, unsaveChurch } from "@/services/church.service";

describe("saveChurch", () => {
  it("inserts a saved_churches row", async () => {
    const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }) });
    (await import("@/db")).db.insert = mockInsert;

    await saveChurch({
      userId: "user-1",
      googlePlaceId: "place-abc",
      name: "Grace Church",
      address: "1 Main St",
    });

    expect(mockInsert).toHaveBeenCalledWith(savedChurches);
  });
});

describe("unsaveChurch", () => {
  it("deletes the saved_churches row", async () => {
    const mockDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    (await import("@/db")).db.delete = mockDelete;

    await unsaveChurch({ userId: "user-1", googlePlaceId: "place-abc" });

    expect(mockDelete).toHaveBeenCalledWith(savedChurches);
  });
});

// ──────────────────────────────────────────────
// submitRecommendation
// ──────────────────────────────────────────────
import { submitRecommendation } from "@/services/church.service";

describe("submitRecommendation", () => {
  it("inserts recommendation when content is safe", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
      })
    });
    (await import("@/db")).db.insert = mockInsert;

    await submitRecommendation({
      userId: "user-1",
      googlePlaceId: "place-abc",
      denomination: "Baptist",
      worshipStyle: "Contemporary",
      note: "Great church, very welcoming!",
      newcomerFriendly: true,
    });

    expect(mockInsert).toHaveBeenCalledWith(churchRecommendations);
  });

  it("throws when content is flagged", async () => {
    const moderation = await import("@/services/ai.service");
    (moderation.moderateContent as any).mockResolvedValueOnce({ safe: false, reason: "spam" });

    await expect(
      submitRecommendation({
        userId: "user-1",
        googlePlaceId: "place-abc",
        denomination: null,
        worshipStyle: null,
        note: "buy this product!!!",
        newcomerFriendly: false,
      })
    ).rejects.toThrow("flagged");
  });
});

// ──────────────────────────────────────────────
// initiateClaim
// ──────────────────────────────────────────────
import { initiateClaim } from "@/services/church.service";

describe("initiateClaim", () => {
  it("inserts a pending claim and sends verification email", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoUpdate: vi.fn().mockResolvedValue(undefined) }),
    });
    (await import("@/db")).db.insert = mockInsert;

    const emailService = await vi.importMock<typeof import("@/services/email.service")>("@/services/email.service");

    await initiateClaim({
      userId: "user-1",
      googlePlaceId: "place-abc",
      churchEmail: "pastor@gracechurch.org",
      claimerName: "John Smith",
      role: "Pastor",
    });

    expect(mockInsert).toHaveBeenCalledWith(churchClaims);
    expect(emailService.sendClaimVerificationEmail).toHaveBeenCalledOnce();
  });
});

// ──────────────────────────────────────────────
// verifyClaim
// ──────────────────────────────────────────────
import { verifyClaim } from "@/services/church.service";

describe("verifyClaim", () => {
  it("returns true and calls db.update when token is valid and unexpired", async () => {
    const { db } = await import("@/db");

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "claim-1" }]),
      }),
    });
    (db as any).select = mockSelect;

    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
    (db as any).update = mockUpdate;

    const result = await verifyClaim("valid-token");

    expect(result).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(churchClaims);
  });

  it("returns false and does NOT call db.update when token is expired or missing", async () => {
    const { db } = await import("@/db");

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    (db as any).select = mockSelect;

    const mockUpdate = vi.fn();
    (db as any).update = mockUpdate;

    const result = await verifyClaim("expired-token");

    expect(result).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────
// getChurchDetail
// ──────────────────────────────────────────────
import { getChurchDetail } from "@/services/church.service";

describe("getChurchDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = "test-key";
  });

  it("fetches place detail and returns a ChurchResult with the expected placeId", async () => {
    const googlePlaceId = "place-detail-123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: googlePlaceId,
        displayName: { text: "Faith Community Church" },
        formattedAddress: "100 Faith Ave, Springfield, IL",
        location: { latitude: 39.80, longitude: -89.67 },
      }),
    });

    const { db } = await import("@/db");

    // mergeWithCurationData does 3 db.select calls:
    //   1st → churchClaims
    //   2nd → churchRecommendations
    //   3rd → savedChurches
    (db as any).select = vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }));

    const result = await getChurchDetail(googlePlaceId, null);

    expect(result).not.toBeNull();
    expect(result!.placeId).toBe(googlePlaceId);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch.mock.calls[0][0]).toContain(googlePlaceId);
  });
});

// ──────────────────────────────────────────────
// getSavedChurches
// ──────────────────────────────────────────────
import { getSavedChurches } from "@/services/church.service";

describe("getSavedChurches", () => {
  it("returns db.select results for the given userId", async () => {
    const { db } = await import("@/db");

    const savedRows = [
      { id: "1", userId: "user-1", googlePlaceId: "place-abc", name: "Grace Church", address: "1 Main St" },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(savedRows),
      }),
    });
    (db as any).select = mockSelect;

    const result = await getSavedChurches("user-1");

    expect(result).toEqual(savedRows);
    expect(mockSelect).toHaveBeenCalled();
  });
});
