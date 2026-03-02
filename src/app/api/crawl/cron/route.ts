import { NextRequest, NextResponse } from "next/server";
import { runCrawl } from "@/lib/crawlers";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runCrawl(7);

  return NextResponse.json(results);
}
