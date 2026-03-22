const K = 32;

export const ELO_MIN = 300;
export const ELO_MAX = 2000;
export const ELO_ONBOARDING_MIN = 600;
export const ELO_ONBOARDING_MAX = 1400;

/** Returns display level as "1.0"–"7.0" (rounded to nearest 0.5) */
export function eloToDisplayLevel(elo: number): string {
  const clamped = Math.min(Math.max(elo, ELO_MIN), ELO_MAX);
  const raw = 1.0 + ((clamped - ELO_MIN) / (ELO_MAX - ELO_MIN)) * 6;
  return (Math.round(raw * 2) / 2).toFixed(1);
}

/** Returns badge color variant based on ELO */
export function eloToLevelVariant(elo: number): "green" | "blue" | "purple" | "gray" {
  if (elo >= 1538) return "purple";
  if (elo >= 1250) return "blue";
  if (elo >= 962)  return "green";
  return "gray";
}

export function calculateEloChanges(
  team1Elos: [number, number],
  team2Elos: [number, number],
  winnerId: "team1" | "team2"
): { team1Change: number; team2Change: number } {
  const avg1 = (team1Elos[0] + team1Elos[1]) / 2;
  const avg2 = (team2Elos[0] + team2Elos[1]) / 2;

  const expected1 = 1 / (1 + Math.pow(10, (avg2 - avg1) / 400));

  const actual1 = winnerId === "team1" ? 1 : 0;
  const change = Math.round(K * (actual1 - expected1));

  return { team1Change: change, team2Change: -change };
}
