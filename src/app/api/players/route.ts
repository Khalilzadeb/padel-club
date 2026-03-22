import { NextRequest, NextResponse } from "next/server";
import { getPlayers } from "@/lib/data/players";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const sort = searchParams.get("sort") ?? "elo";

  let result = await getPlayers();
  if (level) result = result.filter((p) => p.level === level);

  result.sort((a, b) => {
    if (sort === "wins") return b.stats.matchesWon - a.stats.matchesWon;
    return b.stats.eloRating - a.stats.eloRating;
  });

  const withRank = result.map((p, idx) => ({
    rank: idx + 1,
    player: p,
    winRate: p.stats.matchesPlayed > 0 ? Math.round((p.stats.matchesWon / p.stats.matchesPlayed) * 100) : 0,
  }));

  return NextResponse.json(withRank);
}
