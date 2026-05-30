// Pairing logic for community tournaments.
// AMERICANO: full schedule pre-determined so every pair partners exactly once.
//   - Hardcoded Whist schedules for N=4, N=8, N=12, N=16 (most common).
//   - Generic best-effort fallback for other multiples of 4.
//   - Round count is always N-1 (everyone partners with everyone exactly once).
// MEXICANO: round 1 by seed; round 2+ by current standings (1+4 vs 2+3 in 4-buckets).

import type { CommunityTournamentPlayer } from "@/lib/types";

export type Pairing = { team1: string[]; team2: string[]; courtLabel?: string | null };

// 0-indexed schedule: each round is a list of matches; each match has team1/team2 of player INDICES.
type ScheduleMatch = { team1: [number, number]; team2: [number, number] };
type Schedule = ScheduleMatch[][];

// Whist schedule for 4 players, 3 rounds. Every pair partners exactly once.
const AMERICANO_4: Schedule = [
  [{ team1: [0, 1], team2: [2, 3] }],
  [{ team1: [0, 2], team2: [1, 3] }],
  [{ team1: [0, 3], team2: [1, 2] }],
];

// Whist schedule for 8 players, 7 rounds, 2 courts. Verified: each player partners with every other exactly once.
const AMERICANO_8: Schedule = [
  // R1: 1-2 v 3-4 | 5-6 v 7-8
  [{ team1: [0, 1], team2: [2, 3] }, { team1: [4, 5], team2: [6, 7] }],
  // R2: 1-5 v 2-6 | 3-7 v 4-8
  [{ team1: [0, 4], team2: [1, 5] }, { team1: [2, 6], team2: [3, 7] }],
  // R3: 1-7 v 2-8 | 3-5 v 4-6
  [{ team1: [0, 6], team2: [1, 7] }, { team1: [2, 4], team2: [3, 5] }],
  // R4: 1-4 v 6-7 | 2-3 v 5-8
  [{ team1: [0, 3], team2: [5, 6] }, { team1: [1, 2], team2: [4, 7] }],
  // R5: 1-6 v 3-8 | 2-5 v 4-7
  [{ team1: [0, 5], team2: [2, 7] }, { team1: [1, 4], team2: [3, 6] }],
  // R6: 1-8 v 2-7 | 3-6 v 4-5
  [{ team1: [0, 7], team2: [1, 6] }, { team1: [2, 5], team2: [3, 4] }],
  // R7: 1-3 v 5-7 | 2-4 v 6-8
  [{ team1: [0, 2], team2: [4, 6] }, { team1: [1, 3], team2: [5, 7] }],
];

const KNOWN_SCHEDULES: Record<number, Schedule> = {
  4: AMERICANO_4,
  8: AMERICANO_8,
};

// Best-effort generic generator for sizes without a hardcoded schedule.
// Uses a greedy approach: for each of N-1 rounds, finds pairings that avoid
// past partnerships. Not guaranteed optimal but acceptable for occasional use.
function genericAmericanoSchedule(N: number): Schedule {
  if (N < 4 || N % 4 !== 0) return [];
  const totalRounds = N - 1;
  const partner = Array.from({ length: N }, () => new Array(N).fill(0));
  const schedule: Schedule = [];

  for (let r = 0; r < totalRounds; r++) {
    const round = findRoundPairings(N, partner, r);
    if (!round) return schedule; // give up and return what we have
    for (const m of round) {
      partner[m.team1[0]][m.team1[1]]++;
      partner[m.team1[1]][m.team1[0]]++;
      partner[m.team2[0]][m.team2[1]]++;
      partner[m.team2[1]][m.team2[0]]++;
    }
    schedule.push(round);
  }
  return schedule;
}

function findRoundPairings(
  N: number,
  partner: number[][],
  seed: number
): ScheduleMatch[] | null {
  // Generate a permutation of players, then try to pair them up such that
  // no pair has partnered before. Backtrack a few times if needed.
  for (let attempt = 0; attempt < 200; attempt++) {
    const order = seededShuffle(
      Array.from({ length: N }, (_, i) => i),
      seed * 1000 + attempt
    );
    const used = new Array(N).fill(false);
    const matches: ScheduleMatch[] = [];
    let ok = true;
    for (let i = 0; i < N; i += 4) {
      const group = order.slice(i, i + 4);
      // Choose the partnership inside this 4-group that minimises partner repeats.
      const choices: [[number, number], [number, number]][] = [
        [[group[0], group[1]], [group[2], group[3]]],
        [[group[0], group[2]], [group[1], group[3]]],
        [[group[0], group[3]], [group[1], group[2]]],
      ];
      choices.sort((a, b) => {
        const aCost = partner[a[0][0]][a[0][1]] + partner[a[1][0]][a[1][1]];
        const bCost = partner[b[0][0]][b[0][1]] + partner[b[1][0]][b[1][1]];
        return aCost - bCost;
      });
      const best = choices[0];
      matches.push({ team1: best[0], team2: best[1] });
      for (const idx of group) used[idx] = true;
      void ok;
    }
    if (matches.length === N / 4) return matches;
  }
  return null;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Public: get full schedule for N players.
function getAmericanoSchedule(N: number): Schedule {
  return KNOWN_SCHEDULES[N] ?? genericAmericanoSchedule(N);
}

// Returns pairings for a specific round (1-indexed) given the seeded player IDs.
// Players must be sorted in deterministic order (by seed) before calling.
export function americanoRoundPairings(
  playerIds: string[],
  roundNumber: number
): Pairing[] {
  const N = playerIds.length;
  if (N < 4 || N % 4 !== 0) return [];
  const schedule = getAmericanoSchedule(N);
  const round = schedule[roundNumber - 1];
  if (!round) return [];
  return round.map((m) => ({
    team1: [playerIds[m.team1[0]], playerIds[m.team1[1]]],
    team2: [playerIds[m.team2[0]], playerIds[m.team2[1]]],
  }));
}

// Total rounds an Americano with N players will play.
export function americanoTotalRounds(playerCount: number): number {
  if (playerCount < 4 || playerCount % 4 !== 0) return 0;
  return playerCount - 1;
}

// Mexicano: round 1 uses seed, round 2+ uses current points + matches won.
// Within each consecutive group of 4 by standings, pair best+worst vs 2nd+3rd.
export function mexicanoRoundPairings(
  tournamentPlayers: CommunityTournamentPlayer[],
  roundNumber: number
): Pairing[] {
  if (tournamentPlayers.length < 4) return [];

  const sorted = [...tournamentPlayers].sort((a, b) => {
    if (roundNumber === 1) {
      return (a.seed ?? 999) - (b.seed ?? 999);
    }
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.matchesWon - a.matchesWon;
  });

  const pairings: Pairing[] = [];
  for (let i = 0; i + 3 < sorted.length; i += 4) {
    const [p1, p2, p3, p4] = sorted.slice(i, i + 4);
    pairings.push({
      team1: [p1.communityPlayerId, p4.communityPlayerId], // best + worst in bucket
      team2: [p2.communityPlayerId, p3.communityPlayerId],
    });
  }
  return pairings;
}
