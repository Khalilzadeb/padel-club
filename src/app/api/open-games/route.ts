import { NextRequest, NextResponse } from "next/server";
import { getOpenGames, createOpenGame } from "@/lib/data/open-games";
import { verifyToken } from "@/lib/auth";
import { getPlayer } from "@/lib/data/players";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const date = searchParams.get("date") ?? undefined;
  const games = await getOpenGames({ status, date });
  return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("padel_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { courtId, date, startTime, endTime, requiredLevel, notes } = body;

  if (!courtId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find the player profile linked to this user
  const { findUserById } = await import("@/lib/data/users");
  const user = await findUserById(payload.userId);
  if (!user?.playerId) {
    return NextResponse.json({ error: "No player profile linked to your account" }, { status: 400 });
  }

  const player = await getPlayer(user.playerId);
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 400 });

  const game = await createOpenGame({
    id: `og${crypto.randomUUID().slice(0, 8)}`,
    courtId,
    date,
    startTime,
    endTime,
    createdBy: user.playerId,
    requiredLevel: requiredLevel || undefined,
    playerIds: [user.playerId],
    maxPlayers: 4,
    notes: notes || undefined,
    status: "open",
  });

  return NextResponse.json(game, { status: 201 });
}
