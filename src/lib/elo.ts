const K = 32;

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
