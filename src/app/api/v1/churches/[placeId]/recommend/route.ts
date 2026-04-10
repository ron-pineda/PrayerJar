import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitRecommendation } from "@/services/church.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { denomination, worshipStyle, note, newcomerFriendly } = await req.json();
  if (!note || note.length > 200) {
    return NextResponse.json({ error: "note is required and must be 200 chars or fewer" }, { status: 400 });
  }

  try {
    await submitRecommendation({
      userId: session.user.id,
      googlePlaceId: placeId,
      denomination: denomination ?? null,
      worshipStyle: worshipStyle ?? null,
      note,
      newcomerFriendly: !!newcomerFriendly,
    });
    return NextResponse.json({ submitted: true });
  } catch (e: any) {
    if (e.message === "flagged") {
      return NextResponse.json({ submitted: false, status: "under_review" });
    }
    throw e;
  }
}
