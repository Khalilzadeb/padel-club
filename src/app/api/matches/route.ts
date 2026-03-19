import { NextRequest, NextResponse } from "next/server";
import { getMatches, addMatch } from "@/lib/data/matches";
import { getPlayer, updatePlayerElo } from "@/lib/data/players";
import { calculateEloChanges } from "@/lib/elo";
import { Match } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const tournamentId = searchParams.get("tournamentId") ?? undefined;

  const result = await getMatches({ playerId, type, from, to, tournamentId });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courtId, type, team1PlayerIds, team2PlayerIds, sets, date, startTime } = body;

  if (!courtId || !team1PlayerIds || !team2PlayerIds || !sets?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const t1Sets = sets.filter((s: { team1Games: number; team2Games: number }) => s.team1Games > s.team2Games).length;
  const t2Sets = sets.filter((s: { team1Games: number; team2Games: number }) => s.team2Games > s.team1Games).length;
  const winnerId: "team1" | "team2" = t1Sets > t2Sets ? "team1" : "team2";

  // Fetch current ELO ratings
  const [p1, p2, p3, p4] = await Promise.all([
    getPlayer(team1PlayerIds[0]),
    getPlayer(team1PlayerIds[1]),
    getPlayer(team2PlayerIds[0]),
    getPlayer(team2PlayerIds[1]),
  ]);

  const team1Elos: [number, number] = [
    p1?.stats.eloRating ?? 1000,
    p2?.stats.eloRating ?? 1000,
  ];
  const team2Elos: [number, number] = [
    p3?.stats.eloRating ?? 1000,
    p4?.stats.eloRating ?? 1000,
  ];

  const { team1Change, team2Change } = calculateEloChanges(team1Elos, team2Elos, winnerId);

  const eloChanges: Record<string, number> = {
    [team1PlayerIds[0]]: team1Change,
    [team1PlayerIds[1]]: team1Change,
    [team2PlayerIds[0]]: team2Change,
    [team2PlayerIds[1]]: team2Change,
  };

  const match: Match = {
    id: `m${crypto.randomUUID().slice(0, 8)}`,
    courtId,
    type: type ?? "ranked",
    format: "best-of-3",
    status: "completed",
    team1: { playerIds: team1PlayerIds },
    team2: { playerIds: team2PlayerIds },
    sets,
    winnerId,
    date,
    startTime,
    durationMinutes: 75,
    eloChanges,
  };

  const saved = await addMatch(match);

  // Update ELO ratings for all 4 players
  await Promise.all([
    updatePlayerElo(team1PlayerIds[0], team1Change, winnerId === "team1"),
    updatePlayerElo(team1PlayerIds[1], team1Change, winnerId === "team1"),
    updatePlayerElo(team2PlayerIds[0], team2Change, winnerId === "team2"),
    updatePlayerElo(team2PlayerIds[1], team2Change, winnerId === "team2"),
  ]);

  return NextResponse.json(saved, { status: 201 });
}
