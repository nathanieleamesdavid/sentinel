import { NextRequest, NextResponse } from "next/server";
import { getInsights } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const daysBack = parseInt(searchParams.get("days_back") ?? "90", 10);
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);
  const domain = searchParams.get("domain") ?? undefined;
  const pathRaw = searchParams.get("path");
  const path = pathRaw ? parseInt(pathRaw, 10) : undefined;

  const insights = await getInsights({ daysBack, limit, domain, path });

  return NextResponse.json(insights);
}
