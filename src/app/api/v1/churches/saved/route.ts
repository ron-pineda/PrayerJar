import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSavedChurches } from "@/services/church.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const churches = await getSavedChurches(session.user.id);
  return NextResponse.json(churches);
}
