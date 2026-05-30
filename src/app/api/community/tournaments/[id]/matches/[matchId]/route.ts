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
  nextStageFromWinners,
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

// Championship progression:
//  - When all group-stage matches are complete → create Round of 16 from standings.
//  - When all R16 done → create QF. When QF done → SF. When SF done → Final.
async function maybeProgressChampionship(tournamentId: string) {
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.format !== "championship") return;
  if (tournament.status === "completed") return;

  const allMatches = await getTournamentMatches(tournamentId);
  const groupMatches = allMatches.filter((m) => m.stage === "group");
  const groupsDone = groupMatches.length > 0 && groupMatches.every((m) => m.status === "completed");

  if (!groupsDone) return;

  const players = await getTournamentPlayers(tournamentId);
  const teams = buildTeams(players);

  // Discover the group labels actually used (A, B for 8-team; A-D for 16-team).
  const groupLabels = Array.from(new Set(teams.map((t) => t.groupLabel))).filter(Boolean).sort();
  const groupCount = groupLabels.length;

  // 1. First bracket stage — created once after all groups finish.
  //    4 groups (16 teams) → Round of 16.
  //    2 groups (8 teams)  → Quarterfinals directly.
  const standingsByGroup: Record<string, ReturnType<typeof computeGroupStandings>> = {};
  for (const label of groupLabels) {
    standingsByGroup[label] = computeGroupStandings(teams, allMatches, label);
  }

  if (groupCount === 4) {
    const existingR16 = allMatches.filter((m) => m.stage === "round-of-16");
    if (existingR16.length === 0) {
      const r16 = generateRoundOf16(standingsByGroup);
      await createBracketStage(tournamentId, "round-of-16", r16, teams);
      return;
    }
  } else if (groupCount === 2) {
    const existingQf = allMatches.filter((m) => m.stage === "quarterfinal");
    if (existingQf.length === 0) {
      const qf = generateQuarterfinalFromTwoGroups(standingsByGroup);
      await createBracketStage(tournamentId, "quarterfinal", qf, teams);
      return;
    }
  } else {
    // 12 teams or other counts: not auto-handled yet.
    return;
  }

  // 2. Subsequent stages — check completion of the most recently created stage.
  const stages: ChampionshipStage[] = ["round-of-16", "quarterfinal", "semifinal", "final"];
  for (let i = 0; i < stages.length - 1; i++) {
    const stage = stages[i];
    const next = stages[i + 1];
    const stageMatches = allMatches.filter((m) => m.stage === stage);
    if (stageMatches.length === 0) continue;
    const stageDone = stageMatches.every((m) => m.status === "completed");
    if (!stageDone) return;

    const nextExisting = allMatches.filter((m) => m.stage === next);
    if (nextExisting.length > 0) continue; // already created

    const pairings = nextStageFromWinners(stageMatches, teams);
    if (pairings.length === 0) return;
    await createBracketStage(tournamentId, next, pairings, teams);

    // When SF just completed: also create the Bronze (3rd-place) match between SF losers.
    if (stage === "semifinal") {
      const bronzeExisting = allMatches.filter((m) => m.stage === "bronze");
      if (bronzeExisting.length === 0) {
        const losers = losersFromStage(stageMatches, teams);
        if (losers.length === 2) {
          await createBracketStage(
            tournamentId,
            "bronze",
            [{ team1Id: losers[0], team2Id: losers[1], bracketPosition: 1 }],
            teams
          );
        }
      }
    }
    return;
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

    await supabase
      .from("community_tournaments")
      .update({
        status: "completed",
        winner_player_ids: podium,
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

function losersFromStage(stageMatches: CommunityTournamentMatch[], teams: { teamId: string; playerIds: string[] }[]): string[] {
  const sorted = [...stageMatches].sort((a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0));
  const playerToTeam = new Map<string, string>();
  for (const t of teams) for (const pid of t.playerIds) playerToTeam.set(pid, t.teamId);
  const losers: string[] = [];
  for (const m of sorted) {
    const loserPlayers = losingPlayerIds(m);
    if (!loserPlayers) return [];
    const tid = playerToTeam.get(loserPlayers[0]);
    if (!tid) return [];
    losers.push(tid);
  }
  return losers;
}

async function createBracketStage(
  tournamentId: string,
  stage: ChampionshipStage,
  pairings: { team1Id: string; team2Id: string; bracketPosition: number }[],
  teams: { teamId: string; playerIds: string[] }[]
) {
  const teamById = new Map(teams.map((t) => [t.teamId, t]));
  // Create a round to hold the bracket stage.
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

  const matchRows = pairings.map((p) => {
    const t1 = teamById.get(p.team1Id);
    const t2 = teamById.get(p.team2Id);
    return {
      id: `m_${roundId}_${p.bracketPosition}`,
      round_id: roundId,
      tournament_id: tournamentId,
      court_label: stageLabel(stage, p.bracketPosition),
      team1_player_ids: t1?.playerIds ?? [],
      team2_player_ids: t2?.playerIds ?? [],
      stage,
      bracket_position: p.bracketPosition,
    };
  });
  if (matchRows.length > 0) {
    await supabase.from("community_tournament_matches").insert(matchRows);
  }
}

function stageLabel(stage: ChampionshipStage, position: number): string {
  if (stage === "round-of-16") return `R16 · Match ${position}`;
  if (stage === "quarterfinal") return `Quarter-final ${position}`;
  if (stage === "semifinal") return `Semi-final ${position}`;
  if (stage === "final") return "Final";
  if (stage === "bronze") return "3rd place";
  return stage;
}
