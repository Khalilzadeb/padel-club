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
  if (user.playerId) {
    const player = await getPlayer(user.playerId);
    avatarUrl = player?.avatarUrl ?? null;
    onboardingDone = player?.onboardingDone ?? true;
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, playerId: user.playerId, avatarUrl, role: user.role, onboardingDone },
  });
}
