import { NextRequest, NextResponse } from "next/server";
import { getOpenGames, createOpenGame } from "@/lib/data/open-games";
import { verifyToken } from "@/lib/auth";
import { getPlayer, getPlayers } from "@/lib/data/players";
import { createNotification } from "@/lib/data/notifications";

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

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
  const { courtId, date, startTime, durationMinutes, eloRange, notes, courtBookingStatus } = body;

  if (!courtId || !date || !startTime || !durationMinutes) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { findUserById } = await import("@/lib/data/users");
  const user = await findUserById(payload.userId);
  if (!user?.playerId) {
    return NextResponse.json({ error: "No player profile linked to your account" }, { status: 400 });
  }

  const player = await getPlayer(user.playerId);
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 400 });

  const endTime = addMinutes(startTime, durationMinutes);
  const playerElo = player.stats.eloRating;

  let eloMin: number | undefined;
  let eloMax: number | undefined;
  if (eloRange && eloRange !== "any") {
    const delta = Number(eloRange);
    eloMin = Math.max(100, playerElo - delta);
    eloMax = playerElo + delta;
  }

  const game = await createOpenGame({
    id: `og${crypto.randomUUID().slice(0, 8)}`,
    courtId,
    date,
    startTime,
    endTime,
    durationMinutes,
    createdBy: user.playerId,
    eloMin,
    eloMax,
    playerIds: [user.playerId],
    maxPlayers: 4,
    notes: notes || undefined,
    status: "open",
    courtBookingStatus: (courtBookingStatus as "booked" | "not_booked") ?? "not_booked",
    teams: { team1: [user.playerId], team2: [] },
  });

  // Send notifications to eligible players (ELO in range, excluding creator)
  try {
    const allPlayers = await getPlayers();
    const eligible = allPlayers.filter((p) => {
      if (p.id === user.playerId) return false;
      const elo = p.stats.eloRating;
      if (eloMin !== undefined && elo < eloMin) return false;
      if (eloMax !== undefined && elo > eloMax) return false;
      return true;
    });

    const eloLabel = eloMin !== undefined && eloMax !== undefined
      ? ` · ELO ${eloMin}–${eloMax}`
      : "";

    await Promise.all(eligible.map((p) =>
      createNotification({
        playerId: p.id,
        type: "open_game",
        title: "New open game available",
        body: `${player.name} opened a game on ${date} at ${startTime}${eloLabel}`,
        link: "/open-games",
      })
    ));
  } catch {
    // Notifications are non-critical; don't fail the request
  }

  return NextResponse.json(game, { status: 201 });
}
