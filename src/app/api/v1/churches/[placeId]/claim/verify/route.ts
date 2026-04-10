import { NextRequest, NextResponse } from "next/server";
import { verifyClaim } from "@/services/church.service";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const success = await verifyClaim(token);
  if (!success) {
    return NextResponse.redirect(new URL("/find-a-church?verified=expired", req.url));
  }
  return NextResponse.redirect(new URL("/find-a-church?verified=true", req.url));
}
