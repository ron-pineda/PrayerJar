import { randomBytes } from "crypto";
import { db } from "@/db";
import {
  churchSearchCache,
  churchClaims,
  churchRecommendations,
  savedChurches,
} from "@/db/schema";
import { and, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import { moderateContent } from "@/services/ai.service";
import { sendClaimVerificationEmail } from "@/services/email.service";

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
  const radiusMeters = Math.min(Math.round(radiusMiles * MILES_TO_METERS), 50000);
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
        rankPreference: "DISTANCE",
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
      .where(inArray(churchClaims.googlePlaceId, placeIds)),
    db
      .select()
      .from(churchRecommendations)
      .where(inArray(churchRecommendations.googlePlaceId, placeIds)),
    userId
      ? db
          .select()
          .from(savedChurches)
          .where(
            and(
              eq(savedChurches.userId, userId),
              inArray(savedChurches.googlePlaceId, placeIds)
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

// ──────────────────────────────────────────────
// saveChurch / unsaveChurch / getSavedChurches
// ──────────────────────────────────────────────

export async function saveChurch({
  userId,
  googlePlaceId,
  name,
  address,
}: {
  userId: string;
  googlePlaceId: string;
  name: string;
  address: string;
}): Promise<void> {
  await db.insert(savedChurches).values({ userId, googlePlaceId, name, address }).onConflictDoNothing();
}

export async function unsaveChurch({
  userId,
  googlePlaceId,
}: {
  userId: string;
  googlePlaceId: string;
}): Promise<void> {
  await db
    .delete(savedChurches)
    .where(and(eq(savedChurches.userId, userId), eq(savedChurches.googlePlaceId, googlePlaceId)));
}

export async function getSavedChurches(
  userId: string
): Promise<(typeof savedChurches.$inferSelect)[]> {
  return db.select().from(savedChurches).where(eq(savedChurches.userId, userId));
}

// ──────────────────────────────────────────────
// submitRecommendation
// ──────────────────────────────────────────────

export async function submitRecommendation({
  userId,
  googlePlaceId,
  denomination,
  worshipStyle,
  note,
  newcomerFriendly,
}: {
  userId: string;
  googlePlaceId: string;
  denomination: string | null;
  worshipStyle: string | null;
  note: string;
  newcomerFriendly: boolean;
}): Promise<void> {
  const result = await moderateContent(note);
  if (!result.safe) throw new Error("flagged");

  await db
    .insert(churchRecommendations)
    .values({ userId, googlePlaceId, denomination, worshipStyle, note, newcomerFriendly })
    .onConflictDoUpdate({
      target: [churchRecommendations.userId, churchRecommendations.googlePlaceId],
      set: { denomination, worshipStyle, note, newcomerFriendly },
    });
}

// ──────────────────────────────────────────────
// initiateClaim / verifyClaim
// ──────────────────────────────────────────────

export async function initiateClaim({
  userId,
  googlePlaceId,
  churchEmail,
  claimerName,
  role,
}: {
  userId: string;
  googlePlaceId: string;
  churchEmail: string;
  claimerName: string;
  role: string;
}): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  await db
    .insert(churchClaims)
    .values({
      googlePlaceId,
      claimedByUserId: userId,
      churchEmail,
      verified: false,
      verifyToken: token,
      verifyTokenExpiresAt: expiresAt,
    })
    .onConflictDoUpdate({
      target: churchClaims.googlePlaceId,
      set: { claimedByUserId: userId, churchEmail, verified: false, verifyToken: token, verifyTokenExpiresAt: expiresAt, updatedAt: new Date() },
    });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/v1/churches/${googlePlaceId}/claim/verify?token=${token}`;
  await sendClaimVerificationEmail(churchEmail, { claimerName, role, verifyUrl });
}

// ──────────────────────────────────────────────
// getChurchDetail
// ──────────────────────────────────────────────

export async function getChurchDetail(
  googlePlaceId: string,
  userId: string | null
): Promise<ChurchResult | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${googlePlaceId}`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,location,nationalPhoneNumber,websiteUri,currentOpeningHours",
      },
    }
  );
  if (!res.ok) return null;
  const p = await res.json();

  const place: GooglePlace = {
    placeId: p.id,
    name: p.displayName?.text ?? "Unknown Church",
    address: p.formattedAddress ?? "",
    lat: p.location.latitude,
    lng: p.location.longitude,
    phone: p.nationalPhoneNumber,
    website: p.websiteUri,
    openNow: p.currentOpeningHours?.openNow,
    distanceMiles: 0,
  };

  const merged = await mergeWithCurationData([place], userId);
  return merged[0] ?? null;
}

export async function verifyClaim(token: string): Promise<boolean> {
  const claim = await db
    .select()
    .from(churchClaims)
    .where(
      and(
        eq(churchClaims.verifyToken, token),
        isNotNull(churchClaims.verifyTokenExpiresAt),
        gt(churchClaims.verifyTokenExpiresAt, new Date())
      )
    );

  if (!claim.length) return false;

  await db
    .update(churchClaims)
    .set({ verified: true, verifyToken: null, verifyTokenExpiresAt: null, updatedAt: new Date() })
    .where(eq(churchClaims.id, claim[0].id));

  return true;
}
