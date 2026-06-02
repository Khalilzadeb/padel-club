import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import {
  getRounds,
  getStandings,
  getTournament,
  getTournamentMatches,
  getTournamentPlayers,
  updateTournament,
} from "@/lib/data/community-tournaments";
import type { CommunityTournamentMatch } from "@/lib/types";
import { supabase } from "@/lib/supabase";

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

  const [players, rounds, standings, allMatches] = await Promise.all([
    getTournamentPlayers(id),
    getRounds(id),
    getStandings(id),
    getTournamentMatches(id),
  ]);

  // Group matches by round (single query instead of N).
  const matchesByRound: Record<string, CommunityTournamentMatch[]> = {};
  for (const m of allMatches) {
    if (!matchesByRound[m.roundId]) matchesByRound[m.roundId] = [];
    matchesByRound[m.roundId].push(m);
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

// PATCH /api/community/tournaments/[id]
// body: { name?: string, description?: string | null } — edit basic tournament fields.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const updates: { name?: string; description?: string | null } = {};

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    updates.name = name;
  }
  if (body?.description !== undefined) {
    const desc = body.description === null ? null : String(body.description).trim();
    updates.description = desc || null;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await updateTournament(id, updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { error } = await supabase.from("community_tournaments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
