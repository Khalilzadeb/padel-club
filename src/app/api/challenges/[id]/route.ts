import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getChallenge, updateChallengeStatus } from "@/lib/data/challenges";
import { getPlayer } from "@/lib/data/players";
import { createNotification } from "@/lib/data/notifications";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const token = req.cookies.get("padel_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await findUserById(payload.userId);
  if (!user?.playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const challenge = await getChallenge(id);
  if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (challenge.status !== "pending") return NextResponse.json({ error: "Challenge already resolved" }, { status: 400 });

  const { action } = await req.json();

  if (action === "accept") {
    if (challenge.challengedId !== user.playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await updateChallengeStatus(id, "accepted");
    const responder = await getPlayer(user.playerId);
    await createNotification({
      playerId: challenge.challengerId,
      type: "challenge_accepted",
      title: `${responder?.name ?? "Your opponent"} accepted your challenge!`,
      body: `${challenge.matchType} match on ${challenge.proposedDate} at ${challenge.proposedTime}`,
      link: "/challenges",
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "decline") {
    if (challenge.challengedId !== user.playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await updateChallengeStatus(id, "declined");
    const responder = await getPlayer(user.playerId);
    await createNotification({
      playerId: challenge.challengerId,
      type: "challenge_declined",
      title: `${responder?.name ?? "Your opponent"} declined your challenge`,
      body: `${challenge.matchType} match on ${challenge.proposedDate} at ${challenge.proposedTime}`,
      link: "/challenges",
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "cancel") {
    if (challenge.challengerId !== user.playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await updateChallengeStatus(id, "expired");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
