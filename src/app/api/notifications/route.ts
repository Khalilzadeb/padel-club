import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getNotifications, markAllRead } from "@/lib/data/notifications";

async function getPlayerId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("padel_session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.userId) return null;
  const user = await findUserById(payload.userId);
  return user?.playerId ?? null;
}

export async function GET(req: NextRequest) {
  const playerId = await getPlayerId(req);
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await getNotifications(playerId);
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const playerId = await getPlayerId(req);
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllRead(playerId);
  return NextResponse.json({ ok: true });
}
