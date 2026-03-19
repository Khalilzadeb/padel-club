import type { MatchType } from "@/lib/types";

const K_FACTORS: Record<MatchType, number> = {
  casual: 16,
  ranked: 32,
  tournament: 48,
};

export function calculateEloChange(
  winnerElo: number,
  loserElo: number,
  matchType: MatchType
): { winnerDelta: number; loserDelta: number } {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const k = K_FACTORS[matchType];
  const winnerDelta = Math.round(k * (1 - expected));
  const loserDelta = -Math.round(k * expected);
  return { winnerDelta, loserDelta };
}

export function calculateTeamElo(p1Elo: number, p2Elo: number): number {
  return Math.round((p1Elo + p2Elo) / 2);
}
