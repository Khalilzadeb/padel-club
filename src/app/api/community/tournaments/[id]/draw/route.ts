import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import {
  createGroupStageMatches,
  getTournament,
  getTournamentPlayers,
} from "@/lib/data/community-tournaments";
import { supabase } from "@/lib/supabase";

const COMMUNITY_SLUG = "padelsmash";

// POST /api/community/tournaments/[id]/draw
// Picks a random undrawn team and places it in the next group slot in rotation
// (A1, B1, C1, D1, A2, B2, ...). When the 16th (or 8th for 2 groups) team lands,
// the group-stage matches are created and the tournament becomes active.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (tournament.format !== "championship") {
    return NextResponse.json({ error: "Only championship tournaments use a draw" }, { status: 400 });
  }

  const players = await getTournamentPlayers(id);

  // Group players into teams.
  const teamMap = new Map<string, { teamId: string; teamName: string; groupLabel: string | null }>();
  for (const p of players) {
    if (!p.teamId) continue;
    if (!teamMap.has(p.teamId)) {
      teamMap.set(p.teamId, {
        teamId: p.teamId,
        teamName: p.teamName ?? p.teamId,
        groupLabel: p.groupLabel,
      });
    }
  }
  const teams = Array.from(teamMap.values());
  const totalTeams = teams.length;
  const groupCount = Math.max(1, Math.ceil(totalTeams / 4));

  // Count how many teams are already in each group, to decide next slot.
  const placedByGroup: Record<string, number> = {};
  for (const t of teams) {
    if (t.groupLabel) placedByGroup[t.groupLabel] = (placedByGroup[t.groupLabel] ?? 0) + 1;
  }

  const undrawn = teams.filter((t) => !t.groupLabel);
  if (undrawn.length === 0) {
    return NextResponse.json({ error: "All teams already drawn" }, { status: 400 });
  }

  // Determine the next group to assign to: rotate A → B → C → D → A → ...
  // Slot k (k from 0): group = labels[k % groupCount], position = floor(k / groupCount) + 1
  const drawnCount = totalTeams - undrawn.length;
  const groupLabels = ["A", "B", "C", "D"].slice(0, groupCount);
  const nextGroup = groupLabels[drawnCount % groupCount];
  const nextSlot = Math.floor(drawnCount / groupCount) + 1;

  // Random pick from undrawn.
  const pickedTeam = undrawn[Math.floor(Math.random() * undrawn.length)];

  // Update both player rows of the picked team.
  const newTeamName = `${nextGroup}${nextSlot}`;
  const { error: updErr } = await supabase
    .from("community_tournament_players")
    .update({ group_label: nextGroup, team_name: newTeamName })
    .eq("tournament_id", id)
    .eq("team_id", pickedTeam.teamId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  const remaining = undrawn.length - 1;

  // If draw is complete, generate group stage matches.
  if (remaining === 0) {
    try {
      await createGroupStageMatches(id);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  return NextResponse.json({
    picked: {
      teamId: pickedTeam.teamId,
      previousName: pickedTeam.teamName,
      groupLabel: nextGroup,
      slot: nextSlot,
      newName: newTeamName,
    },
    remaining,
    drawComplete: remaining === 0,
  });
}
