import { NextRequest, NextResponse } from "next/server";
import { verifyClaim } from "@/services/church.service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;

  if (!/^[\w\-]+$/.test(placeId)) {
    return NextResponse.json({ error: "Invalid place ID" }, { status: 400 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit("church_claim_verify", ip);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const success = await verifyClaim(token);
  if (!success) {
    return NextResponse.redirect(new URL("/find-a-church?verified=expired", req.url));
  }
  return NextResponse.redirect(new URL("/find-a-church?verified=true", req.url));
}
