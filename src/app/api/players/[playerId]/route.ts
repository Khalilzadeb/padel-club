import { NextRequest, NextResponse } from "next/server";
import { getPlayer } from "@/lib/data/players";
import { getMatches } from "@/lib/data/matches";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const player = await getPlayer(playerId);
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const matches = await getMatches({ playerId });
  return NextResponse.json({ player, matches });
}
