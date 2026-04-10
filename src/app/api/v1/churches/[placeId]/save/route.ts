import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveChurch, unsaveChurch } from "@/services/church.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, address } = await req.json();
  await saveChurch({ userId: session.user.id, googlePlaceId: placeId, name, address });
  return NextResponse.json({ saved: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await unsaveChurch({ userId: session.user.id, googlePlaceId: placeId });
  return NextResponse.json({ saved: false });
}
