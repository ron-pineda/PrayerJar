import { db } from "@/db";
import {
  churchSearchCache,
  churchClaims,
  churchRecommendations,
  savedChurches,
} from "@/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

export type GooglePlace = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  openNow?: boolean;
  distanceMiles: number;
};

export type ChurchResult = GooglePlace & {
  claim: typeof churchClaims.$inferSelect | null;
  recommendations: (typeof churchRecommendations.$inferSelect)[];
  savedByUser: boolean;
  newcomerFriendly: boolean; // true when 2+ recommendations have newcomerFriendly=true
};

// ──────────────────────────────────────────────
// geocodeAddress
// ──────────────────────────────────────────────

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK" || !data.results.length) return null;
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng, formattedAddress: data.results[0].formatted_address };
}

// ──────────────────────────────────────────────
// searchChurches
// ──────────────────────────────────────────────

const CACHE_THRESHOLD_DEG = 0.05; // ~3.5 miles — close enough to reuse cache
const MILES_TO_METERS = 1609.34;

export async function searchChurches({
  lat,
  lng,
  radiusMiles,
  userId,
}: {
  lat: number;
  lng: number;
  radiusMiles: number;
  userId: string | null;
}): Promise<ChurchResult[]> {
  // 1. Check cache
  const cached = await db
    .select()
    .from(churchSearchCache)
    .where(
      and(
        gt(churchSearchCache.expiresAt, new Date()),
        eq(churchSearchCache.radiusMiles, radiusMiles),
        sql`ABS(${churchSearchCache.lat} - ${lat}) < ${CACHE_THRESHOLD_DEG}`,
        sql`ABS(${churchSearchCache.lng} - ${lng}) < ${CACHE_THRESHOLD_DEG}`
      )
    );

  let places: GooglePlace[];

  if (cached.length > 0) {
    places = cached[0].results as GooglePlace[];
  } else {
    // 2. Call Google Places API
    places = await fetchGooglePlaces(lat, lng, radiusMiles);

    // 3. Store in cache (24h TTL)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db
      .insert(churchSearchCache)
      .values({ lat, lng, radiusMiles, results: places, expiresAt });
  }

  // 4. Merge with curation data
  return mergeWithCurationData(places, userId);
}

// ──────────────────────────────────────────────
// fetchGooglePlaces — Google Places API (New)
// ──────────────────────────────────────────────

async function fetchGooglePlaces(
  lat: number,
  lng: number,
  radiusMiles: number
): Promise<GooglePlace[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  const radiusMeters = Math.round(radiusMiles * MILES_TO_METERS);
  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.currentOpeningHours",
      },
      body: JSON.stringify({
        includedTypes: ["church"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
      }),
    }
  );

  const data = await res.json();
  if (!data.places) return [];

  return data.places.map((p: any): GooglePlace => {
    const placeLat = p.location.latitude;
    const placeLng = p.location.longitude;
    return {
      placeId: p.id,
      name: p.displayName?.text ?? "Unknown Church",
      address: p.formattedAddress ?? "",
      lat: placeLat,
      lng: placeLng,
      phone: p.nationalPhoneNumber,
      website: p.websiteUri,
      openNow: p.currentOpeningHours?.openNow,
      distanceMiles: haversineDistance(lat, lng, placeLat, placeLng),
    };
  });
}

// ──────────────────────────────────────────────
// haversineDistance — returns distance in miles
// ──────────────────────────────────────────────

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ──────────────────────────────────────────────
// mergeWithCurationData
// ──────────────────────────────────────────────

async function mergeWithCurationData(
  places: GooglePlace[],
  userId: string | null
): Promise<ChurchResult[]> {
  const placeIds = places.map((p) => p.placeId);
  if (placeIds.length === 0) return [];

  const [claims, recommendations, saves] = await Promise.all([
    db
      .select()
      .from(churchClaims)
      .where(sql`${churchClaims.googlePlaceId} = ANY(${placeIds})`),
    db
      .select()
      .from(churchRecommendations)
      .where(sql`${churchRecommendations.googlePlaceId} = ANY(${placeIds})`),
    userId
      ? db
          .select()
          .from(savedChurches)
          .where(
            and(
              eq(savedChurches.userId, userId),
              sql`${savedChurches.googlePlaceId} = ANY(${placeIds})`
            )
          )
      : Promise.resolve([]),
  ]);

  const claimMap = new Map(claims.map((c) => [c.googlePlaceId, c]));
  const recMap = new Map<
    string,
    (typeof churchRecommendations.$inferSelect)[]
  >();
  for (const rec of recommendations) {
    const existing = recMap.get(rec.googlePlaceId) ?? [];
    recMap.set(rec.googlePlaceId, [...existing, rec]);
  }
  const savedSet = new Set(saves.map((s) => s.googlePlaceId));

  return places.map((place) => {
    const recs = recMap.get(place.placeId) ?? [];
    const newcomerFriendlyCount = recs.filter((r) => r.newcomerFriendly).length;
    return {
      ...place,
      claim: claimMap.get(place.placeId) ?? null,
      recommendations: recs,
      savedByUser: savedSet.has(place.placeId),
      newcomerFriendly: newcomerFriendlyCount >= 2,
    };
  });
}
