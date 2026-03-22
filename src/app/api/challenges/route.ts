import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { createChallenge, getChallenges } from "@/lib/data/challenges";
import { getPlayer } from "@/lib/data/players";
import { createNotification } from "@/lib/data/notifications";

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
  const challenges = await getChallenges(playerId);
  return NextResponse.json(challenges);
}

export async function POST(req: NextRequest) {
  const playerId = await getPlayerId(req);
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { challengedId, courtId, proposedDate, proposedTime, matchType, message } = body;

  if (!challengedId || !courtId || !proposedDate || !proposedTime || !matchType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (challengedId === playerId) {
    return NextResponse.json({ error: "Cannot challenge yourself" }, { status: 400 });
  }

  const challenger = await getPlayer(playerId);
  if (!challenger) return NextResponse.json({ error: "Player not found" }, { status: 400 });

  const challenge = await createChallenge({
    challengerId: playerId,
    challengedId,
    courtId,
    proposedDate,
    proposedTime,
    matchType: matchType as "casual" | "ranked",
    message: message || undefined,
    status: "pending",
  });

  await createNotification({
    playerId: challengedId,
    type: "challenge",
    title: `${challenger.name} challenged you!`,
    body: `${matchType} match on ${proposedDate} at ${proposedTime}${message ? ` · "${message}"` : ""}`,
    link: "/challenges",
  });

  return NextResponse.json(challenge, { status: 201 });
}
