// Pairing logic for community tournaments.
//
// AMERICANO:
//   - If players === courts × 4 (no sit-outs): use hardcoded Whist schedules
//     for N=4 and N=8 (every pair partners exactly once), generic fallback otherwise.
//     Round count = N - 1.
//   - If players  > courts × 4 (with sit-outs): rotate sit-outs fairly across rounds,
//     pair remaining players minimizing partner repeats. Round count is configurable.
//
// MEXICANO:
//   - Round 1 by seed.
//   - Round 2+ by current standings, paired (best+worst) vs (2nd+3rd) within 4-buckets.
//   - With sit-outs (N > C*4): bench the players who've sat out least so far, then
//     sort the remaining playing players by standings and form 4-buckets.

import type { CommunityTournamentPlayer } from "@/lib/types";

export type Pairing = { team1: string[]; team2: string[]; courtLabel?: string | null };

// 0-indexed match: team1/team2 are arrays of 2 player INDICES into the supplied player list.
type ScheduleMatch = { team1: [number, number]; team2: [number, number] };

export type AmericanoRound = {
  matches: ScheduleMatch[];
  sitouts: number[]; // 0-based indices of players sitting out this round
};

// ─── Hardcoded Whist schedules (no sit-outs case) ─────────────────────────────

const AMERICANO_4: ScheduleMatch[][] = [
  [{ team1: [0, 1], team2: [2, 3] }],
  [{ team1: [0, 2], team2: [1, 3] }],
  [{ team1: [0, 3], team2: [1, 2] }],
];

// Verified: each pair of 8 players partners exactly once across the 7 rounds.
const AMERICANO_8: ScheduleMatch[][] = [
  [{ team1: [0, 1], team2: [2, 3] }, { team1: [4, 5], team2: [6, 7] }],
  [{ team1: [0, 4], team2: [1, 5] }, { team1: [2, 6], team2: [3, 7] }],
  [{ team1: [0, 6], team2: [1, 7] }, { team1: [2, 4], team2: [3, 5] }],
  [{ team1: [0, 3], team2: [5, 6] }, { team1: [1, 2], team2: [4, 7] }],
  [{ team1: [0, 5], team2: [2, 7] }, { team1: [1, 4], team2: [3, 6] }],
  [{ team1: [0, 7], team2: [1, 6] }, { team1: [2, 5], team2: [3, 4] }],
  [{ team1: [0, 2], team2: [4, 6] }, { team1: [1, 3], team2: [5, 7] }],
];

const KNOWN_NO_SITOUT_SCHEDULES: Record<number, ScheduleMatch[][]> = {
  4: AMERICANO_4,
  8: AMERICANO_8,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// Given a set of "playing" player indices, find pairings into matches of 4
// that minimize repeat partnerships. Returns the matches (using ORIGINAL indices).
function findRoundPairings(
  playingIdx: number[],
  partner: number[][],
  seed: number
): ScheduleMatch[] | null {
  if (playingIdx.length % 4 !== 0) return null;
  for (let attempt = 0; attempt < 300; attempt++) {
    const order = seededShuffle(playingIdx, seed * 1000 + attempt);
    const matches: ScheduleMatch[] = [];
    for (let i = 0; i < order.length; i += 4) {
      const group = order.slice(i, i + 4);
      // Pick the partnership within this 4-bucket that minimizes repeats.
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
    }
    if (matches.length === order.length / 4) return matches;
  }
  return null;
}

// ─── Schedule generation ──────────────────────────────────────────────────────

// No-sit-out case: build the full schedule of N-1 rounds where everyone plays every round.
function generateNoSitoutSchedule(N: number): AmericanoRound[] {
  if (N < 4 || N % 4 !== 0) return [];
  if (KNOWN_NO_SITOUT_SCHEDULES[N]) {
    return KNOWN_NO_SITOUT_SCHEDULES[N].map((matches) => ({ matches, sitouts: [] }));
  }
  // Generic fallback: greedy with backtracking.
  const partner = Array.from({ length: N }, () => new Array(N).fill(0));
  const all = Array.from({ length: N }, (_, i) => i);
  const rounds: AmericanoRound[] = [];
  for (let r = 0; r < N - 1; r++) {
    const matches = findRoundPairings(all, partner, r);
    if (!matches) return rounds;
    for (const m of matches) {
      partner[m.team1[0]][m.team1[1]]++;
      partner[m.team1[1]][m.team1[0]]++;
      partner[m.team2[0]][m.team2[1]]++;
      partner[m.team2[1]][m.team2[0]]++;
    }
    rounds.push({ matches, sitouts: [] });
  }
  return rounds;
}

// Sit-out case: rotate sit-outs by lowest count, pair remaining minimizing partnerships.
function generateSitoutSchedule(N: number, courtCount: number, totalRounds: number): AmericanoRound[] {
  const playingPerRound = courtCount * 4;
  if (N <= playingPerRound) return [];
  const sitoutsPerRound = N - playingPerRound;

  const partner = Array.from({ length: N }, () => new Array(N).fill(0));
  const sitoutCount = new Array(N).fill(0);
  const rounds: AmericanoRound[] = [];

  for (let r = 0; r < totalRounds; r++) {
    // Rank players by sit-out count ascending → those benched least often sit out next.
    // Wait — we want fairness, so players who've sat out LEAST should PLAY, those who've
    // sat out MOST should also play (so they catch up). The ones who've sat out FEWEST
    // are the ones to bench next... no wait.
    //
    // Correct fairness: keep everyone's sit-out count as equal as possible.
    // So the players to BENCH next are those with the LOWEST sit-out count
    // (they've sat out less than others, time to catch up).
    const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => {
      if (sitoutCount[a] !== sitoutCount[b]) return sitoutCount[a] - sitoutCount[b];
      // Tiebreak: deterministic pseudo-random by round + index
      return ((r * 31 + a) % 97) - ((r * 31 + b) % 97);
    });
    const sitouts = order.slice(0, sitoutsPerRound).sort((a, b) => a - b);
    const playing = order.slice(sitoutsPerRound);

    for (const p of sitouts) sitoutCount[p]++;

    const matches = findRoundPairings(playing, partner, r * 31 + 7);
    if (!matches) {
      // Shouldn't happen unless playing isn't a multiple of 4.
      return rounds;
    }
    for (const m of matches) {
      partner[m.team1[0]][m.team1[1]]++;
      partner[m.team1[1]][m.team1[0]]++;
      partner[m.team2[0]][m.team2[1]]++;
      partner[m.team2[1]][m.team2[0]]++;
    }

    rounds.push({ matches, sitouts });
  }
  return rounds;
}

// Public API: returns the full Americano schedule for N players on C courts.
// If N === C*4 → no sit-outs (default rounds = N-1).
// If N >  C*4 → with sit-outs (admin-specified or suggested rounds).
export function generateAmericanoSchedule(
  N: number,
  courtCount: number,
  totalRounds?: number
): AmericanoRound[] {
  const playingPerRound = courtCount * 4;
  if (N < 4 || N % 4 !== 0) return [];

  if (N === playingPerRound) {
    return generateNoSitoutSchedule(N);
  }
  if (N > playingPerRound) {
    const rounds = totalRounds ?? suggestedAmericanoRounds(N, courtCount);
    return generateSitoutSchedule(N, courtCount, rounds);
  }
  // N < playingPerRound — fewer players than court slots, doesn't make sense.
  return [];
}

// Default round count when sit-outs are involved.
// Tries to balance fairness with tournament length.
export function suggestedAmericanoRounds(playerCount: number, courtCount: number): number {
  const playing = courtCount * 4;
  if (playing === 0 || playerCount < 4 || playerCount % 4 !== 0) return 0;
  if (playerCount === playing) return playerCount - 1;
  // With sit-outs: default to N-1 so each player ends up playing several games.
  return playerCount - 1;
}

// Round count for the no-sit-out case (kept for backwards compat).
export function americanoTotalRounds(playerCount: number): number {
  if (playerCount < 4 || playerCount % 4 !== 0) return 0;
  return playerCount - 1;
}

// ─── Pairings for a single round (used at runtime) ────────────────────────────

// Returns pairings (player ID strings) for a specific Americano round.
// playerIds must be in deterministic seed order (matching how the schedule was generated).
export function americanoRoundPairings(
  playerIds: string[],
  roundNumber: number,
  courtCount?: number
): Pairing[] {
  const N = playerIds.length;
  if (N < 4 || N % 4 !== 0) return [];
  const C = courtCount ?? N / 4;
  const schedule = generateAmericanoSchedule(N, C);
  const round = schedule[roundNumber - 1];
  if (!round) return [];
  return round.matches.map((m) => ({
    team1: [playerIds[m.team1[0]], playerIds[m.team1[1]]],
    team2: [playerIds[m.team2[0]], playerIds[m.team2[1]]],
  }));
}

// ─── Mexicano ─────────────────────────────────────────────────────────────────

// Generates round pairings for Mexicano.
// `sitoutCounts` maps community_player_id → how many rounds they've already sat out.
// `roundNumber`:
//   - 1: order by initial seed
//   - 2+: order by current totalPoints (desc), tiebreak by matchesWon (desc)
//
// If players > courtCount × 4, the players with the lowest sit-out count are benched
// (so sit-outs rotate fairly). Among playing players, we group by 4-bucket from standings
// and pair (best+worst) vs (2nd+3rd) within each bucket.
export function mexicanoRoundPairings(
  tournamentPlayers: CommunityTournamentPlayer[],
  roundNumber: number,
  courtCount?: number,
  sitoutCounts?: Map<string, number>
): { pairings: Pairing[]; sitoutPlayerIds: string[] } {
  const N = tournamentPlayers.length;
  if (N < 4) return { pairings: [], sitoutPlayerIds: [] };

  const C = courtCount ?? Math.floor(N / 4);
  const playingPerRound = C * 4;

  // Sort players by standings (or seed for round 1).
  const standingsOrdered = [...tournamentPlayers].sort((a, b) => {
    if (roundNumber === 1) return (a.seed ?? 999) - (b.seed ?? 999);
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.matchesWon - a.matchesWon;
  });

  let playing: CommunityTournamentPlayer[];
  let sitouts: CommunityTournamentPlayer[];

  if (N <= playingPerRound) {
    playing = standingsOrdered;
    sitouts = [];
  } else {
    // Decide who sits out: lowest sit-out count first, tiebreak by lowest standings
    // (so weaker players sit out more often only as a tiebreak, not as a rule).
    const sitoutSorted = [...standingsOrdered].sort((a, b) => {
      const aCount = sitoutCounts?.get(a.communityPlayerId) ?? 0;
      const bCount = sitoutCounts?.get(b.communityPlayerId) ?? 0;
      if (aCount !== bCount) return aCount - bCount;
      // tiebreak by lower standing (so top players keep playing when possible)
      const aIdx = standingsOrdered.indexOf(a);
      const bIdx = standingsOrdered.indexOf(b);
      return bIdx - aIdx;
    });
    sitouts = sitoutSorted.slice(0, N - playingPerRound);
    const sitoutSet = new Set(sitouts.map((p) => p.communityPlayerId));
    playing = standingsOrdered.filter((p) => !sitoutSet.has(p.communityPlayerId));
  }

  const pairings: Pairing[] = [];
  for (let i = 0; i + 3 < playing.length; i += 4) {
    const [p1, p2, p3, p4] = playing.slice(i, i + 4);
    pairings.push({
      team1: [p1.communityPlayerId, p4.communityPlayerId],
      team2: [p2.communityPlayerId, p3.communityPlayerId],
    });
  }

  return { pairings, sitoutPlayerIds: sitouts.map((p) => p.communityPlayerId) };
}
