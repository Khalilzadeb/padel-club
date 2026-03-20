import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getConversation, sendMessage, markConversationRead } from "@/lib/data/messages";
import { createNotification } from "@/lib/data/notifications";
import { getPlayer } from "@/lib/data/players";

async function getMe(req: NextRequest) {
  const token = req.cookies.get("padel_session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.userId) return null;
  const user = await findUserById(payload.userId);
  return user?.playerId ? user : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId: otherPlayerId } = await params;
  const user = await getMe(req);
  if (!user?.playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await getConversation(user.playerId, otherPlayerId);
  await markConversationRead(user.playerId, otherPlayerId);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId: toPlayerId } = await params;
  const user = await getMe(req);
  if (!user?.playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  const msg = await sendMessage(user.playerId, toPlayerId, content.trim());

  // Notify recipient
  const sender = await getPlayer(user.playerId);
  await createNotification({
    playerId: toPlayerId,
    type: "message",
    title: `New message from ${sender?.name ?? "Someone"}`,
    body: content.trim().slice(0, 80),
    link: `/messages/${user.playerId}`,
  });

  return NextResponse.json(msg, { status: 201 });
}
