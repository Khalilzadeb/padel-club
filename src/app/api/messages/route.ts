import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getConversations } from "@/lib/data/messages";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("padel_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await findUserById(payload.userId);
  if (!user?.playerId) return NextResponse.json([]);
  const convs = await getConversations(user.playerId);
  return NextResponse.json(convs);
}
