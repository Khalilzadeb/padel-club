// Championship format: group stage + crossover knockout bracket.
//
// 16 teams (or 8) split into groups of 4. Within each group, every team plays
// every other team once (6 matches per 4-team group).
//
// After the group stage, all teams advance using "crossover seeding":
//   Group A 1st vs Group B 4th, A2 vs B3, A3 vs B2, A4 vs B1, etc.
// Each pair from groups (A,B) and (C,D) cross with the adjacent group.

import type { CommunityTournamentMatch, CommunityTournamentPlayer, MatchSetScore } from "@/lib/types";

export interface TeamRef {
  teamId: string;
  playerIds: string[];
  groupLabel: string;
  teamName: string;
}

// Round-robin pairings for a single group of 4 teams (returns 6 match templates,
// each identifying two teams by index 0..3 within the group).
export function groupRoundRobinPairings(): { team1Idx: number; team2Idx: number }[] {
  return [
    { team1Idx: 0, team2Idx: 1 },
    { team1Idx: 2, team2Idx: 3 },
    { team1Idx: 0, team2Idx: 2 },
    { team1Idx: 1, team2Idx: 3 },
    { team1Idx: 0, team2Idx: 3 },
    { team1Idx: 1, team2Idx: 2 },
  ];
}

export interface GroupStandingRow {
  teamId: string;
  teamName: string;
  groupLabel: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number; // 2 per win, 1 per loss (or just match wins — configurable later)
}

function setsWonBy(sets: MatchSetScore[], side: "team1" | "team2"): number {
  let count = 0;
  for (const s of sets) {
    if (side === "team1" && s.team1Games > s.team2Games) count++;
    if (side === "team2" && s.team2Games > s.team1Games) count++;
  }
  return count;
}

// Compute standings for a group from completed group-stage matches.
// teams: list of teams that belong to this group.
// matches: ALL tournament matches, filtered to this group inside this function.
export function computeGroupStandings(
  teams: TeamRef[],
  matches: CommunityTournamentMatch[],
  groupLabel: string
): GroupStandingRow[] {
  const groupTeams = teams.filter((t) => t.groupLabel === groupLabel);
  const groupMatches = matches.filter((m) => m.stage === "group" && m.groupLabel === groupLabel);

  const stats: Record<string, GroupStandingRow> = {};
  for (const t of groupTeams) {
    stats[t.teamId] = {
      teamId: t.teamId,
      teamName: t.teamName,
      groupLabel,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    };
  }

  // Map player_id -> team_id within this group.
  const playerToTeam = new Map<string, string>();
  for (const t of groupTeams) {
    for (const pid of t.playerIds) playerToTeam.set(pid, t.teamId);
  }

  for (const m of groupMatches) {
    if (m.status !== "completed" || !m.sets) continue;
    const team1Id = playerToTeam.get(m.team1PlayerIds[0]);
    const team2Id = playerToTeam.get(m.team2PlayerIds[0]);
    if (!team1Id || !team2Id) continue;

    const t1Sets = setsWonBy(m.sets, "team1");
    const t2Sets = setsWonBy(m.sets, "team2");
    const t1Games = m.sets.reduce((s, x) => s + x.team1Games, 0);
    const t2Games = m.sets.reduce((s, x) => s + x.team2Games, 0);

    stats[team1Id].matchesPlayed++;
    stats[team2Id].matchesPlayed++;
    stats[team1Id].setsWon += t1Sets;
    stats[team1Id].setsLost += t2Sets;
    stats[team2Id].setsWon += t2Sets;
    stats[team2Id].setsLost += t1Sets;
    stats[team1Id].gamesWon += t1Games;
    stats[team1Id].gamesLost += t2Games;
    stats[team2Id].gamesWon += t2Games;
    stats[team2Id].gamesLost += t1Games;

    if (t1Sets > t2Sets) {
      stats[team1Id].matchesWon++;
      stats[team2Id].matchesLost++;
      stats[team1Id].points += 2;
      stats[team2Id].points += 1;
    } else if (t2Sets > t1Sets) {
      stats[team2Id].matchesWon++;
      stats[team1Id].matchesLost++;
      stats[team2Id].points += 2;
      stats[team1Id].points += 1;
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aSetDiff = a.setsWon - a.setsLost;
    const bSetDiff = b.setsWon - b.setsLost;
    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
    const aGameDiff = a.gamesWon - a.gamesLost;
    const bGameDiff = b.gamesWon - b.gamesLost;
    return bGameDiff - aGameDiff;
  });
}

// Crossover seeding for two paired groups (e.g., A and B → Round of 16):
// A1 vs B4, A2 vs B3, A3 vs B2, A4 vs B1
export function crossoverPairings(
  groupA: GroupStandingRow[],
  groupB: GroupStandingRow[]
): { team1Id: string; team2Id: string }[] {
  const pairings: { team1Id: string; team2Id: string }[] = [];
  for (let i = 0; i < 4; i++) {
    pairings.push({
      team1Id: groupA[i].teamId,
      team2Id: groupB[3 - i].teamId,
    });
  }
  return pairings;
}

// Generate Round-of-16 bracket from all 4 group standings.
// Standard layout: AB winners stay on the left half, CD winners on the right.
// Positions 1-4 = left (AB crossover), 5-8 = right (CD crossover).
// QF pairs (1,2) and (3,4) on the left, (5,6) and (7,8) on the right.
// SF pairs the two QF winners per side; AB and CD finalists only meet in Final.
export function generateRoundOf16(
  standingsByGroup: Record<string, GroupStandingRow[]>
): { team1Id: string; team2Id: string; bracketPosition: number }[] {
  const ab = crossoverPairings(standingsByGroup["A"], standingsByGroup["B"]);
  const cd = crossoverPairings(standingsByGroup["C"], standingsByGroup["D"]);
  return [
    { ...ab[0], bracketPosition: 1 },
    { ...ab[1], bracketPosition: 2 },
    { ...ab[2], bracketPosition: 3 },
    { ...ab[3], bracketPosition: 4 },
    { ...cd[0], bracketPosition: 5 },
    { ...cd[1], bracketPosition: 6 },
    { ...cd[2], bracketPosition: 7 },
    { ...cd[3], bracketPosition: 8 },
  ];
}

// Determine the winner of a match (by sets won).
export function matchWinner(match: CommunityTournamentMatch): "team1" | "team2" | null {
  if (match.status !== "completed" || !match.sets) return null;
  const t1 = setsWonBy(match.sets, "team1");
  const t2 = setsWonBy(match.sets, "team2");
  if (t1 > t2) return "team1";
  if (t2 > t1) return "team2";
  return null;
}

// Given completed bracket matches at one stage, build the next stage's pairings.
// Inputs are ordered by bracket_position; winners of consecutive matches meet.
export function nextStageFromWinners(
  stageMatches: CommunityTournamentMatch[],
  teams: TeamRef[]
): { team1Id: string; team2Id: string; bracketPosition: number }[] {
  const sorted = [...stageMatches].sort(
    (a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0)
  );
  const playerToTeam = new Map<string, string>();
  for (const t of teams) for (const pid of t.playerIds) playerToTeam.set(pid, t.teamId);

  const winners: string[] = [];
  for (const m of sorted) {
    const w = matchWinner(m);
    if (!w) return [];
    const ids = w === "team1" ? m.team1PlayerIds : m.team2PlayerIds;
    const teamId = playerToTeam.get(ids[0]);
    if (!teamId) return [];
    winners.push(teamId);
  }

  const next: { team1Id: string; team2Id: string; bracketPosition: number }[] = [];
  for (let i = 0; i + 1 < winners.length; i += 2) {
    next.push({
      team1Id: winners[i],
      team2Id: winners[i + 1],
      bracketPosition: Math.floor(i / 2) + 1,
    });
  }
  return next;
}

// Build TeamRef[] from tournament players (groups players by team_id).
export function buildTeams(players: CommunityTournamentPlayer[]): TeamRef[] {
  const byTeam = new Map<string, TeamRef>();
  for (const p of players) {
    if (!p.teamId) continue;
    if (!byTeam.has(p.teamId)) {
      byTeam.set(p.teamId, {
        teamId: p.teamId,
        playerIds: [],
        groupLabel: p.groupLabel ?? "",
        teamName: p.teamName ?? p.teamId,
      });
    }
    byTeam.get(p.teamId)!.playerIds.push(p.communityPlayerId);
  }
  return Array.from(byTeam.values());
}
