import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import {
  getRoundMatches,
  getRounds,
  getStandings,
  getTournament,
  getTournamentPlayers,
} from "@/lib/data/community-tournaments";

const COMMUNITY_SLUG = "padelsmash";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  const session = await getSession();
  const isAdmin = session && community
    ? await isCommunityAdmin(community.id, session.userId)
    : false;

  const [players, rounds, standings] = await Promise.all([
    getTournamentPlayers(id),
    getRounds(id),
    getStandings(id),
  ]);

  // Load matches for all rounds
  const matchesByRound: Record<string, Awaited<ReturnType<typeof getRoundMatches>>> = {};
  for (const round of rounds) {
    matchesByRound[round.id] = await getRoundMatches(round.id);
  }

  return NextResponse.json({
    tournament,
    players,
    rounds,
    matchesByRound,
    standings,
    isAdmin,
  });
}
