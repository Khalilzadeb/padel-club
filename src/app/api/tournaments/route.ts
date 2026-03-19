import { NextRequest, NextResponse } from "next/server";
import { tournaments } from "@/lib/data/tournaments";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let result = tournaments;
  if (status) result = result.filter((t) => t.status === status);

  return NextResponse.json(result);
}
