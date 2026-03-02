import { NextResponse } from "next/server";
import { getDomainCounts } from "@/lib/db/queries";
import { DOMAINS } from "@/lib/constants";

export async function GET() {
  const counts = await getDomainCounts();

  // Merge static domain metadata with live counts from DB
  const domains = DOMAINS.map((d) => {
    const match = counts.find((c) => c.domain === d.name);
    return {
      id: d.id,
      name: d.name,
      label: d.label,
      count: match?.count ?? 0,
    };
  });

  return NextResponse.json(domains);
}
