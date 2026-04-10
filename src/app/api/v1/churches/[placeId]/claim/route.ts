import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initiateClaim } from "@/services/church.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { churchEmail, claimerName, role } = await req.json();
  if (!churchEmail || !claimerName || !role) {
    return NextResponse.json({ error: "churchEmail, claimerName, and role are required" }, { status: 400 });
  }

  await initiateClaim({
    userId: session.user.id,
    googlePlaceId: placeId,
    churchEmail,
    claimerName,
    role,
  });
  return NextResponse.json({ pending: true });
}
