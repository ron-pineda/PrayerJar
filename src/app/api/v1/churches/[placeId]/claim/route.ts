import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initiateClaim } from "@/services/church.service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;

  if (!/^[\w\-]+$/.test(placeId)) {
    return NextResponse.json({ error: "Invalid place ID" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { churchEmail, claimerName, role } = await req.json();
  if (!churchEmail || !claimerName || !role) {
    return NextResponse.json({ error: "churchEmail, claimerName, and role are required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(churchEmail)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit("church_claim", ip);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  await initiateClaim({
    userId: session.user.id,
    googlePlaceId: placeId,
    churchEmail,
    claimerName,
    role,
  });
  return NextResponse.json({ pending: true });
}
