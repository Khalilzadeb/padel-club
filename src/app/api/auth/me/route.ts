import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getPlayer } from "@/lib/data/players";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let avatarUrl: string | null = null;
  let onboardingDone = true;
  let eloRating: number | null = null;
  let matchesPlayed: number | null = null;
  let matchesWon: number | null = null;

  if (user.playerId) {
    const player = await getPlayer(user.playerId);
    avatarUrl = player?.avatarUrl ?? null;
    onboardingDone = player?.onboardingDone ?? true;
    eloRating = player?.stats.eloRating ?? null;
    matchesPlayed = player?.stats.matchesPlayed ?? null;
    matchesWon = player?.stats.matchesWon ?? null;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      playerId: user.playerId,
      avatarUrl,
      role: user.role,
      onboardingDone,
      eloRating,
      matchesPlayed,
      matchesWon,
    },
  });
}
