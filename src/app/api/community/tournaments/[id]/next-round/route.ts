import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import {
  createRoundWithMatches,
  getRounds,
  getTournament,
  getTournamentPlayers,
} from "@/lib/data/community-tournaments";
import { americanoRoundPairings, mexicanoRoundPairings } from "@/lib/tournament-pairing";
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
  const nextRoundNumber = rounds.length + 1;

  // Verify previous round is completed
  if (rounds.length > 0) {
    const prev = rounds[rounds.length - 1];
    if (prev.status !== "completed") {
      return NextResponse.json(
        { error: "Previous round is still active. Complete all its matches first." },
        { status: 400 }
      );
    }
  }

  if (tournament.roundsCount && nextRoundNumber > tournament.roundsCount) {
    return NextResponse.json({ error: "Tournament has reached planned rounds count" }, { status: 400 });
  }

  const tournamentPlayers = await getTournamentPlayers(id);

  let pairings;
  if (tournament.format === "americano") {
    pairings = americanoRoundPairings(
      tournamentPlayers.map((p) => p.communityPlayerId),
      nextRoundNumber
    );
  } else if (tournament.format === "mexicano") {
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

  if (tournament.status === "draft") {
    await supabase.from("community_tournaments").update({ status: "active" }).eq("id", id);
  }

  const round = await createRoundWithMatches(id, nextRoundNumber, pairings);
  return NextResponse.json(round);
}
