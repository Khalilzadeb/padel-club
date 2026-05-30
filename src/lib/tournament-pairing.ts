// Pairing algorithms for community tournaments.
// For Americano (individual) — partner rotation each round.
// For Mexicano (individual) — pair by current standings (best with worst within a 4-bucket).

import type { CommunityTournamentPlayer } from "@/lib/types";

export type Pairing = { team1: string[]; team2: string[]; courtLabel?: string | null };

// Seeded shuffle so re-running the same round gives the same result.
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

// Americano: deterministic shuffle per round, then pair sequentially.
export function americanoRoundPairings(
  playerIds: string[],
  roundNumber: number
): Pairing[] {
  if (playerIds.length < 4) return [];
  const shuffled = seededShuffle(playerIds, roundNumber * 7919 + 13);

  const pairings: Pairing[] = [];
  for (let i = 0; i + 3 < shuffled.length; i += 4) {
    pairings.push({
      team1: [shuffled[i], shuffled[i + 1]],
      team2: [shuffled[i + 2], shuffled[i + 3]],
    });
  }
  return pairings;
}

// Mexicano: sort by current standings, pair within 4-buckets as (1,4) vs (2,3).
// Round 1 uses initial seed; subsequent rounds use accumulated points.
export function mexicanoRoundPairings(
  tournamentPlayers: CommunityTournamentPlayer[],
  roundNumber: number
): Pairing[] {
  if (tournamentPlayers.length < 4) return [];

  const sorted = [...tournamentPlayers].sort((a, b) => {
    if (roundNumber === 1) {
      return (a.seed ?? 999) - (b.seed ?? 999);
    }
    // After round 1, sort by current points then wins
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

// Returns suggested rounds count for full partner rotation (Americano).
// For N players, every-partners-once requires (N-1)/3 rounds if N % 4 === 0.
export function suggestedRoundsForAmericano(playerCount: number): number {
  if (playerCount < 4) return 0;
  if (playerCount % 4 !== 0) return 0;
  return Math.max(3, Math.floor((playerCount - 1) / 3));
}
