import { NextResponse } from "next/server";
import { runCrawl } from "@/lib/crawlers";

export const maxDuration = 300;

export async function POST() {
  const results = await runCrawl(7);

  return NextResponse.json({ status: "crawl started", results });
}
