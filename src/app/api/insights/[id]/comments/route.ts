import { NextRequest, NextResponse } from "next/server";
import { getComments, insertComment } from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comments = await getComments(Number(id));

  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { author, text } = await request.json();

  await insertComment(Number(id), author, text);

  const comments = await getComments(Number(id));

  return NextResponse.json(comments);
}
