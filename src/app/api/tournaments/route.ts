import { NextRequest, NextResponse } from "next/server";
import { getTournaments } from "@/lib/data/tournaments";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const result = await getTournaments(status);
  return NextResponse.json(result);
}
