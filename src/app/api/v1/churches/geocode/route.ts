import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/services/church.service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit("church_geocode", ip);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address is required" }, { status: 400 });

  const result = await geocodeAddress(address);
  if (!result) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  return NextResponse.json(result);
}
