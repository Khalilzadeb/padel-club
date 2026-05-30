import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import { completeTournament, getStandings, getTournament } from "@/lib/data/community-tournaments";

const COMMUNITY_SLUG = "padelsmash";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const isAdmin = await isCommunityAdmin(community.id, session.userId);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const standings = await getStandings(id);
  // Take top N from standings, where N = prize_positions configured at creation.
  // For team formats each "place" is a pair, so multiply by 2.
  const isTeamFormat =
    tournament.format === "team-americano" ||
    tournament.format === "team-mexicano" ||
    tournament.format === "championship";
  const slots = tournament.prizePositions * (isTeamFormat ? 2 : 1);
  const winners = standings.slice(0, slots).map((s) => s.player.id);

  try {
    await completeTournament(id, winners);
    return NextResponse.json({ ok: true, winners });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
