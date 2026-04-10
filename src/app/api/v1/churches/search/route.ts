import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchChurches } from "@/services/church.service";
import { checkRateLimit, checkGlobalChurchSearchLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radiusMiles = parseInt(searchParams.get("radius") ?? "25");

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit("church_search", ip);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }
  if (![5, 10, 25, 50].includes(radiusMiles)) {
    return NextResponse.json({ error: "radius must be 5, 10, 25, or 50" }, { status: 400 });
  }

  const globalAllowed = await checkGlobalChurchSearchLimit();
  if (!globalAllowed) {
    console.warn("[church_search] Global daily limit reached");
    return NextResponse.json({ error: "Search unavailable — daily limit reached. Try again tomorrow." }, { status: 429 });
  }

  try {
    const session = await auth();
    const results = await searchChurches({ lat, lng, radiusMiles, userId: session?.user?.id ?? null });
    return NextResponse.json(results);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[church_search] searchChurches failed:", err);
    return NextResponse.json({ error: "Search failed. Please try again.", _debug: msg }, { status: 500 });
  }
}
