const K = 32;

export const ELO_MIN = 300;
export const ELO_MAX = 2000;
export const ELO_ONBOARDING_MIN = 442;
export const ELO_ONBOARDING_MAX = 1400;

/** Returns display level as "1.0"–"7.0" (rounded to nearest 0.5) */
export function eloToDisplayLevel(elo: number): string {
  const clamped = Math.min(Math.max(elo, ELO_MIN), ELO_MAX);
  const raw = 1.0 + ((clamped - ELO_MIN) / (ELO_MAX - ELO_MIN)) * 6;
  return (Math.round(raw * 2) / 2).toFixed(1);
}

/** Returns badge color variant based on ELO (blue → sky → green → yellow → orange → red) */
export function eloToLevelVariant(elo: number): "blue" | "sky" | "green" | "yellow" | "orange" | "red" {
  if (elo >= 1717) return "red";
  if (elo >= 1433) return "orange";
  if (elo >= 1150) return "yellow";
  if (elo >= 867)  return "green";
  if (elo >= 567)  return "sky";
  return "blue";
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
