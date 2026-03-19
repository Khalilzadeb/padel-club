import { NextRequest, NextResponse } from "next/server";
import { matchesStore, addMatch } from "@/lib/data/matches";
import { Match } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let result = matchesStore.filter((m) => m.status === "completed");
  if (playerId) result = result.filter((m) => [...m.team1.playerIds, ...m.team2.playerIds].includes(playerId));
  if (type) result = result.filter((m) => m.type === type);
  if (from) result = result.filter((m) => m.date >= from);
  if (to) result = result.filter((m) => m.date <= to);

  result.sort((a, b) => b.date.localeCompare(a.date));
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

  const match: Match = {
    id: `m${crypto.randomUUID().slice(0, 8)}`,
    courtId,
    type: type ?? "ranked",
    format: "best-of-3",
    status: "completed",
    team1: { playerIds: team1PlayerIds },
    team2: { playerIds: team2PlayerIds },
    sets,
    winnerId: t1Sets > t2Sets ? "team1" : "team2",
    date,
    startTime,
    durationMinutes: 75,
  };

  addMatch(match);
  return NextResponse.json(match, { status: 201 });
}
