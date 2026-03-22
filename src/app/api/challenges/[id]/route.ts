import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getChallenge, updateChallengeStatus } from "@/lib/data/challenges";
import { getPlayer } from "@/lib/data/players";
import { createNotification } from "@/lib/data/notifications";
import { createOpenGame } from "@/lib/data/open-games";

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

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

    // Create an open game with both players pre-joined, 2 spots open
    const startTime = challenge.proposedTime.slice(0, 5);
    const game = await createOpenGame({
      id: `og${crypto.randomUUID().slice(0, 8)}`,
      courtId: challenge.courtId,
      date: challenge.proposedDate,
      startTime,
      endTime: addMinutes(startTime, 90),
      durationMinutes: 90,
      createdBy: challenge.challengerId,
      playerIds: [challenge.challengerId, challenge.challengedId],
      maxPlayers: 4,
      notes: `Challenge: ${challenge.matchType} match`,
      status: "open",
      courtBookingStatus: "not_booked",
      teams: { team1: [challenge.challengerId], team2: [challenge.challengedId] },
    });

    await createNotification({
      playerId: challenge.challengerId,
      type: "challenge_accepted",
      title: `${responder?.name ?? "Your opponent"} accepted your challenge!`,
      body: `${challenge.matchType} match on ${challenge.proposedDate} at ${startTime} · Open game created`,
      link: `/open-games`,
    });
    return NextResponse.json({ ok: true, gameId: game.id });
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
