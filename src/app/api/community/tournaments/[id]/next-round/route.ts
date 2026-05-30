import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import {
  createRoundWithMatches,
  getRounds,
  getTournament,
  getTournamentPlayers,
} from "@/lib/data/community-tournaments";
import { mexicanoRoundPairings } from "@/lib/tournament-pairing";
import { supabase } from "@/lib/supabase";

const COMMUNITY_SLUG = "padelsmash";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const isAdmin = await isCommunityAdmin(community.id, session.userId);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rounds = await getRounds(id);

  // Verify previous active round (if any) is completed.
  const activeRound = rounds.find((r) => r.status === "active");
  if (activeRound) {
    return NextResponse.json(
      { error: "Previous round is still active. Complete all its matches first." },
      { status: 400 }
    );
  }

  if (tournament.status === "draft") {
    await supabase.from("community_tournaments").update({ status: "active" }).eq("id", id);
  }

  // Americano: rounds are pre-created. Just activate the next pending one.
  if (tournament.format === "americano") {
    const next = rounds
      .filter((r) => r.status === "pending")
      .sort((a, b) => a.roundNumber - b.roundNumber)[0];
    if (!next) {
      return NextResponse.json({ error: "All rounds are completed" }, { status: 400 });
    }
    await supabase
      .from("community_tournament_rounds")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", next.id);
    return NextResponse.json({ ...next, status: "active" });
  }

  // Mexicano: generate pairings on demand based on current standings.
  const nextRoundNumber = rounds.length + 1;
  if (tournament.roundsCount && nextRoundNumber > tournament.roundsCount) {
    return NextResponse.json({ error: "Tournament has reached planned rounds count" }, { status: 400 });
  }
  const tournamentPlayers = await getTournamentPlayers(id);

  let pairings;
  if (tournament.format === "mexicano") {
    pairings = mexicanoRoundPairings(tournamentPlayers, nextRoundNumber);
  } else {
    return NextResponse.json(
      { error: `Auto-pairing not yet supported for format: ${tournament.format}` },
      { status: 400 }
    );
  }

  if (pairings.length === 0) {
    return NextResponse.json(
      { error: "Could not generate pairings — need a multiple of 4 players" },
      { status: 400 }
    );
  }

  // Assign court labels in order.
  const pairingsWithCourts = pairings.map((p, i) => ({ ...p, courtLabel: `Court ${i + 1}` }));
  const round = await createRoundWithMatches(id, nextRoundNumber, pairingsWithCourts);
  return NextResponse.json(round);
}
