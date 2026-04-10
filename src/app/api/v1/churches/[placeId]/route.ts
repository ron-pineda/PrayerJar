import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChurchDetail } from "@/services/church.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const session = await auth();
  const detail = await getChurchDetail(placeId, session?.user?.id ?? null);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}
