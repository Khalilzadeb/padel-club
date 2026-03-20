import { NextRequest, NextResponse } from "next/server";
import { getOpenGame, joinOpenGame, leaveOpenGame, cancelOpenGame } from "@/lib/data/open-games";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const game = await getOpenGame(params.id);
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(game);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get("padel_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await findUserById(payload.userId);
  if (!user?.playerId) return NextResponse.json({ error: "No player profile" }, { status: 400 });

  const body = await req.json();
  const { action } = body; // "join" | "leave" | "cancel"

  if (action === "join") {
    const updated = await joinOpenGame(params.id, user.playerId);
    if (!updated) return NextResponse.json({ error: "Cannot join this game" }, { status: 400 });
    return NextResponse.json(updated);
  }

  if (action === "leave") {
    const game = await getOpenGame(params.id);
    if (game?.createdBy === user.playerId) {
      await cancelOpenGame(params.id);
      return NextResponse.json({ status: "cancelled" });
    }
    const updated = await leaveOpenGame(params.id, user.playerId);
    return NextResponse.json(updated);
  }

  if (action === "cancel") {
    const game = await getOpenGame(params.id);
    if (game?.createdBy !== user.playerId) {
      return NextResponse.json({ error: "Only the creator can cancel" }, { status: 403 });
    }
    await cancelOpenGame(params.id);
    return NextResponse.json({ status: "cancelled" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
