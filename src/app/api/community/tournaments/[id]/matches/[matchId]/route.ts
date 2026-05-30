import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import {
  completeRound,
  getRoundMatches,
  recordMatchScore,
} from "@/lib/data/community-tournaments";
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

  try {
    await recordMatchScore(matchId, team1Points, team2Points);

    // Check if the round is now complete (all matches have scores)
    const { data: matchRow } = await supabase
      .from("community_tournament_matches")
      .select("round_id")
      .eq("id", matchId)
      .single();
    if (matchRow) {
      const matches = await getRoundMatches(matchRow.round_id as string);
      const allDone = matches.every((m) => m.status === "completed");
      if (allDone) {
        await completeRound(matchRow.round_id as string);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
