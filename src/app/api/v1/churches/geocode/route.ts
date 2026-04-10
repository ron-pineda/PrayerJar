import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/services/church.service";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address is required" }, { status: 400 });

  const result = await geocodeAddress(address);
  if (!result) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  return NextResponse.json(result);
}
