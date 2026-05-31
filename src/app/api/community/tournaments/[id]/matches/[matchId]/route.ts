import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import {
  completeRound,
  createRoundWithMatches,
  getRoundMatches,
  getRounds,
  getTournament,
  getTournamentMatches,
  getTournamentPlayers,
  recordMatchScore,
  recordMatchSets,
} from "@/lib/data/community-tournaments";
import { mexicanoRoundPairings } from "@/lib/tournament-pairing";
import {
  buildTeams,
  computeGroupStandings,
  generateQuarterfinalFromTwoGroups,
  generateRoundOf16,
} from "@/lib/championship-bracket";
import { supabase } from "@/lib/supabase";
import type { ChampionshipStage, CommunityTournamentMatch } from "@/lib/types";

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

  const { matchId, id } = await params;
  const body = await req.json().catch(() => ({}));

  // Championship match: scores come as sets.
  if (Array.isArray(body.sets)) {
    const sets = body.sets as { team1Games: number; team2Games: number; tiebreak?: { team1Points: number; team2Points: number } }[];
    for (const s of sets) {
      if (!Number.isFinite(s.team1Games) || !Number.isFinite(s.team2Games)) {
        return NextResponse.json({ error: "set games must be numbers" }, { status: 400 });
      }
    }
    try {
      await recordMatchSets(matchId, sets);
      await maybeProgressChampionship(id);
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  // Points-based scoring (Americano / Mexicano).
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

    const { data: matchRow } = await supabase
      .from("community_tournament_matches")
      .select("round_id, tournament_id")
      .eq("id", matchId)
      .single();
    if (!matchRow) return NextResponse.json({ ok: true });

    const matches = await getRoundMatches(matchRow.round_id as string);
    const allDone = matches.every((m) => m.status === "completed");
    if (!allDone) return NextResponse.json({ ok: true });

    await completeRound(matchRow.round_id as string);

    const tournament = await getTournament(id);
    if (!tournament) return NextResponse.json({ ok: true });

    const rounds = await getRounds(id);

    if (tournament.format === "americano") {
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
      const nextRoundNumber = rounds.length + 1;
      if (nextRoundNumber <= tournament.roundsCount) {
        const tournamentPlayers = await getTournamentPlayers(id);

        const pastMatches = await getTournamentMatches(id);
        const matchesByRound = new Map<string, typeof pastMatches>();
        for (const m of pastMatches) {
          if (!matchesByRound.has(m.roundId)) matchesByRound.set(m.roundId, []);
          matchesByRound.get(m.roundId)!.push(m);
        }
        const sitoutCounts = new Map<string, number>();
        for (const round of rounds) {
          const roundMatches = matchesByRound.get(round.id) ?? [];
          const playing = new Set<string>();
          for (const m of roundMatches) {
            m.team1PlayerIds.forEach((p) => playing.add(p));
            m.team2PlayerIds.forEach((p) => playing.add(p));
          }
          for (const tp of tournamentPlayers) {
            if (!playing.has(tp.communityPlayerId)) {
              sitoutCounts.set(
                tp.communityPlayerId,
                (sitoutCounts.get(tp.communityPlayerId) ?? 0) + 1
              );
            }
          }
        }

        const { pairings } = mexicanoRoundPairings(
          tournamentPlayers,
          nextRoundNumber,
          tournament.courtCount,
          sitoutCounts
        );
        if (pairings.length > 0) {
          const courtNames =
            tournament.courtNames.length > 0
              ? tournament.courtNames
              : Array.from({ length: tournament.courtCount }, (_, i) => `Court ${i + 1}`);
          const withCourts = pairings.map((p, i) => ({ ...p, courtLabel: courtNames[i] ?? `Court ${i + 1}` }));
          await createRoundWithMatches(id, nextRoundNumber, withCourts);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// Championship progression:
//  - When all group-stage matches are complete → create the first bracket stage.
//  - During bracket: each completed match immediately advances its winner into the
//    next stage's appropriate slot (creating the next match if needed).
async function maybeProgressChampionship(tournamentId: string) {
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.format !== "championship") return;
  if (tournament.status === "completed") return;

  const allMatches = await getTournamentMatches(tournamentId);
  const groupMatches = allMatches.filter((m) => m.stage === "group");
  const groupsDone = groupMatches.length > 0 && groupMatches.every((m) => m.status === "completed");

  const players = await getTournamentPlayers(tournamentId);
  const teams = buildTeams(players);

  // ── Group → first bracket stage (Round of 16 or QF) ──
  if (groupsDone) {
    const groupLabels = Array.from(new Set(teams.map((t) => t.groupLabel))).filter(Boolean).sort();
    const standingsByGroup: Record<string, ReturnType<typeof computeGroupStandings>> = {};
    for (const label of groupLabels) {
      standingsByGroup[label] = computeGroupStandings(teams, allMatches, label);
    }

    if (groupLabels.length === 4 && !allMatches.some((m) => m.stage === "round-of-16")) {
      const r16 = generateRoundOf16(standingsByGroup);
      await createBracketStage(tournamentId, "round-of-16", r16, teams);
    } else if (groupLabels.length === 2 && !allMatches.some((m) => m.stage === "quarterfinal")) {
      const qf = generateQuarterfinalFromTwoGroups(standingsByGroup);
      await createBracketStage(tournamentId, "quarterfinal", qf, teams);
    }
  }

  // ── Bracket → granular advancement ──
  // For each completed bracket match, seed the winner into the next stage's slot.
  const refreshed = await getTournamentMatches(tournamentId);
  const playerToTeam = new Map<string, string>();
  for (const t of teams) for (const pid of t.playerIds) playerToTeam.set(pid, t.teamId);

  const STAGE_FLOW: { from: ChampionshipStage; to: ChampionshipStage }[] = [
    { from: "round-of-16", to: "quarterfinal" },
    { from: "quarterfinal", to: "semifinal" },
    { from: "semifinal", to: "final" },
  ];

  for (const { from, to } of STAGE_FLOW) {
    const fromMatches = refreshed
      .filter((m) => m.stage === from && m.status === "completed")
      .sort((a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0));
    for (const m of fromMatches) {
      const winner = winningPlayerIds(m);
      if (!winner) continue;
      const pos = m.bracketPosition ?? 0;
      if (pos < 1) continue;
      const nextPos = Math.ceil(pos / 2);
      const slot: "team1" | "team2" = pos % 2 === 1 ? "team1" : "team2";
      await seedTeamIntoNextSlot(tournamentId, to, nextPos, slot, winner, teams, refreshed);
    }

    // SF completion → also create / fill Bronze (3rd place) with the losers.
    if (from === "semifinal") {
      for (const m of fromMatches) {
        const loser = losingPlayerIds(m);
        if (!loser) continue;
        const pos = m.bracketPosition ?? 0;
        const slot: "team1" | "team2" = pos === 1 ? "team1" : "team2";
        await seedTeamIntoNextSlot(tournamentId, "bronze", 1, slot, loser, teams, refreshed);
      }
    }
  }

  // 3. Final + Bronze completed → mark tournament completed and collect podium.
  const finalMatches = allMatches.filter((m) => m.stage === "final");
  const bronzeMatches = allMatches.filter((m) => m.stage === "bronze");
  const finalDone = finalMatches.length > 0 && finalMatches.every((m) => m.status === "completed");
  const bronzeDone = bronzeMatches.length === 0 || bronzeMatches.every((m) => m.status === "completed");
  if (finalDone && bronzeDone) {
    const final = finalMatches[0];
    const finalWinner = winningPlayerIds(final);
    const finalLoser = losingPlayerIds(final);
    const bronze = bronzeMatches[0];
    const bronzeWinner = bronze ? winningPlayerIds(bronze) : null;

    // Podium order: 1st, 2nd, 3rd. UI slices by tournament.prize_positions.
    const podium: string[] = [];
    if (finalWinner) podium.push(...finalWinner);
    if (finalLoser) podium.push(...finalLoser);
    if (bronzeWinner) podium.push(...bronzeWinner);
    // Save only as many team-pairs as the admin wanted on the podium.
    const sliced = podium.slice(0, tournament.prizePositions * 2);

    await supabase
      .from("community_tournaments")
      .update({
        status: "completed",
        winner_player_ids: sliced,
        end_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", tournamentId);
  }
}

function winningPlayerIds(match: { sets: CommunityTournamentMatch["sets"]; team1PlayerIds: string[]; team2PlayerIds: string[] }): string[] | null {
  if (!match.sets) return null;
  const t1Sets = match.sets.filter((s) => s.team1Games > s.team2Games).length;
  const t2Sets = match.sets.filter((s) => s.team2Games > s.team1Games).length;
  if (t1Sets > t2Sets) return match.team1PlayerIds;
  if (t2Sets > t1Sets) return match.team2PlayerIds;
  return null;
}

function losingPlayerIds(match: { sets: CommunityTournamentMatch["sets"]; team1PlayerIds: string[]; team2PlayerIds: string[] }): string[] | null {
  if (!match.sets) return null;
  const t1Sets = match.sets.filter((s) => s.team1Games > s.team2Games).length;
  const t2Sets = match.sets.filter((s) => s.team2Games > s.team1Games).length;
  if (t1Sets > t2Sets) return match.team2PlayerIds;
  if (t2Sets > t1Sets) return match.team1PlayerIds;
  return null;
}

// Seed a team's player IDs into a specific bracket-stage match slot.
// - If the round for `stage` doesn't exist, create it.
// - If the match at `position` doesn't exist, create it with the OTHER slot empty.
// - If the slot is already filled (idempotent), do nothing.
async function seedTeamIntoNextSlot(
  tournamentId: string,
  stage: ChampionshipStage,
  position: number,
  slot: "team1" | "team2",
  playerIds: string[],
  teams: { teamId: string; playerIds: string[] }[],
  _cached: CommunityTournamentMatch[]
): Promise<void> {
  void teams;
  void _cached;
  const roundId = `r_${tournamentId}_${stage}`;

  // Ensure the stage round exists.
  const { data: existingRound } = await supabase
    .from("community_tournament_rounds")
    .select("id")
    .eq("id", roundId)
    .maybeSingle();
  if (!existingRound) {
    const { data: lastRound } = await supabase
      .from("community_tournament_rounds")
      .select("round_number")
      .eq("tournament_id", tournamentId)
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextRoundNumber = ((lastRound?.round_number as number | null) ?? 0) + 1;
    await supabase.from("community_tournament_rounds").insert({
      id: roundId,
      tournament_id: tournamentId,
      round_number: nextRoundNumber,
      status: "active",
      started_at: new Date().toISOString(),
    });
  }

  // Re-fetch the target match (avoid stale cached state from prior calls).
  const { data: existing } = await supabase
    .from("community_tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("stage", stage)
    .eq("bracket_position", position)
    .maybeSingle();

  if (existing) {
    const alreadyFilled =
      slot === "team1"
        ? ((existing.team1_player_ids as string[] | null)?.length ?? 0) > 0
        : ((existing.team2_player_ids as string[] | null)?.length ?? 0) > 0;
    if (alreadyFilled) return;
    const update =
      slot === "team1"
        ? { team1_player_ids: playerIds }
        : { team2_player_ids: playerIds };
    await supabase
      .from("community_tournament_matches")
      .update(update)
      .eq("id", existing.id as string);
    return;
  }

  // Match doesn't exist yet — create with one team filled, the other empty.
  const tournament = await getTournament(tournamentId);
  const courtNames =
    tournament && tournament.courtNames.length > 0
      ? tournament.courtNames
      : Array.from({ length: tournament?.courtCount ?? 1 }, (_, i) => `Court ${i + 1}`);
  const courtLabel = courtNames[(position - 1) % courtNames.length];

  await supabase.from("community_tournament_matches").insert({
    id: `m_${roundId}_${position}`,
    round_id: roundId,
    tournament_id: tournamentId,
    court_label: courtLabel,
    team1_player_ids: slot === "team1" ? playerIds : [],
    team2_player_ids: slot === "team2" ? playerIds : [],
    stage,
    bracket_position: position,
  });
}

async function createBracketStage(
  tournamentId: string,
  stage: ChampionshipStage,
  pairings: { team1Id: string; team2Id: string; bracketPosition: number }[],
  teams: { teamId: string; playerIds: string[] }[]
) {
  const teamById = new Map(teams.map((t) => [t.teamId, t]));
  const tournament = await getTournament(tournamentId);
  const courtNames =
    tournament && tournament.courtNames.length > 0
      ? tournament.courtNames
      : Array.from({ length: tournament?.courtCount ?? 1 }, (_, i) => `Court ${i + 1}`);

  const { data: lastRound } = await supabase
    .from("community_tournament_rounds")
    .select("round_number")
    .eq("tournament_id", tournamentId)
    .order("round_number", { ascending: false })
    .limit(1)
    .single();
  const nextRoundNumber = (lastRound?.round_number as number | undefined ?? 0) + 1;
  const roundId = `r_${tournamentId}_${stage}`;
  await supabase.from("community_tournament_rounds").insert({
    id: roundId,
    tournament_id: tournamentId,
    round_number: nextRoundNumber,
    status: "active",
    started_at: new Date().toISOString(),
  });

  const matchRows = pairings.map((p, i) => {
    const t1 = teamById.get(p.team1Id);
    const t2 = teamById.get(p.team2Id);
    return {
      id: `m_${roundId}_${p.bracketPosition}`,
      round_id: roundId,
      tournament_id: tournamentId,
      court_label: courtNames[i % courtNames.length],
      team1_player_ids: t1?.playerIds ?? [],
      team2_player_ids: t2?.playerIds ?? [],
      stage,
      bracket_position: p.bracketPosition,
    };
  });
  if (matchRows.length > 0) {
    await supabase.from("community_tournament_matches").insert(matchRows);
  }
  void stageLabel;
}

function stageLabel(stage: ChampionshipStage, position: number): string {
  if (stage === "round-of-16") return `R16 · Match ${position}`;
  if (stage === "quarterfinal") return `Quarter-final ${position}`;
  if (stage === "semifinal") return `Semi-final ${position}`;
  if (stage === "final") return "Final";
  if (stage === "bronze") return "3rd place";
  return stage;
}
