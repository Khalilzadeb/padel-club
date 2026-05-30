import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import {
  completeRound,
  createRoundWithMatches,
  getRoundMatches,
  getRounds,
  getTournament,
  getTournamentPlayers,
  recordMatchScore,
} from "@/lib/data/community-tournaments";
import { mexicanoRoundPairings } from "@/lib/tournament-pairing";
import { supabase } from "@/lib/supabase";

const COMMUNITY_SLUG = "padelsmash";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const isAdmin = await isCommunityAdmin(community.id, session.userId);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { matchId } = await params;
  const body = await req.json().catch(() => ({}));
  const team1Points = Number(body.team1Points);
  const team2Points = Number(body.team2Points);

  if (!Number.isFinite(team1Points) || !Number.isFinite(team2Points)) {
    return NextResponse.json({ error: "team1Points and team2Points must be numbers" }, { status: 400 });
  }
  if (team1Points < 0 || team2Points < 0) {
    return NextResponse.json({ error: "Scores cannot be negative" }, { status: 400 });
  }

  const { id } = await params;
  try {
    await recordMatchScore(matchId, team1Points, team2Points);

    const { data: matchRow } = await supabase
      .from("community_tournament_matches")
      .select("round_id, tournament_id")
      .eq("id", matchId)
      .single();
    if (!matchRow) return NextResponse.json({ ok: true });

    const matches = await getRoundMatches(matchRow.round_id as string);
    const allDone = matches.every((m) => m.status === "completed");
    if (!allDone) return NextResponse.json({ ok: true });

    // Round just finished — mark complete, then auto-advance to next round.
    await completeRound(matchRow.round_id as string);

    const tournament = await getTournament(id);
    if (!tournament) return NextResponse.json({ ok: true });

    const rounds = await getRounds(id);

    if (tournament.format === "americano") {
      // Pre-created rounds: activate the next pending round if there is one.
      const next = rounds
        .filter((r) => r.status === "pending")
        .sort((a, b) => a.roundNumber - b.roundNumber)[0];
      if (next) {
        await supabase
          .from("community_tournament_rounds")
          .update({ status: "active", started_at: new Date().toISOString() })
          .eq("id", next.id);
      }
    } else if (tournament.format === "mexicano" && tournament.roundsCount) {
      // Only auto-generate when admin set a fixed round count.
      // In manual mode (no rounds_count), the admin clicks "Start next round" themselves.
      const nextRoundNumber = rounds.length + 1;
      if (nextRoundNumber <= tournament.roundsCount) {
        const tournamentPlayers = await getTournamentPlayers(id);
        const pairings = mexicanoRoundPairings(tournamentPlayers, nextRoundNumber);
        if (pairings.length > 0) {
          const withCourts = pairings.map((p, i) => ({ ...p, courtLabel: `Court ${i + 1}` }));
          await createRoundWithMatches(id, nextRoundNumber, withCourts);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
