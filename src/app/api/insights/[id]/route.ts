import { NextRequest, NextResponse } from "next/server";
import { getInsightById } from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const insight = await getInsightById(Number(id));

  if (!insight) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  }

  return NextResponse.json(insight);
}
