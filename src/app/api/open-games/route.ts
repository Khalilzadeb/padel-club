import { NextRequest, NextResponse } from "next/server";
import { getOpenGames, createOpenGame } from "@/lib/data/open-games";
import { verifyToken } from "@/lib/auth";
import { getPlayer, getPlayers } from "@/lib/data/players";
import { createNotification } from "@/lib/data/notifications";
import crypto from "crypto";

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
  const code = searchParams.get("code") ?? undefined;
  const games = await getOpenGames({ status, date });

  // Join-by-code lookup: return the single matching game (bypasses private filter)
  if (code) {
    const match = games.find((g) => g.joinCode === code.toUpperCase() && g.status !== "cancelled" && g.status !== "completed");
    if (!match) return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 });
    return NextResponse.json(match);
  }

  // Determine current user's playerId (if authenticated)
  let currentPlayerId: string | null = null;
  const token = req.cookies.get("padel_session")?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.userId) {
      const { findUserById } = await import("@/lib/data/users");
      const user = await findUserById(payload.userId);
      currentPlayerId = user?.playerId ?? null;
    }
  }

  const now = new Date();
  const upcoming = games.filter((g) => {
    if (new Date(`${g.date}T${g.startTime}:00+04:00`) <= now) return false;
    if (g.isPrivate) {
      if (currentPlayerId === null) return false;
      return g.playerIds.includes(currentPlayerId) || (g.invitedPlayerIds ?? []).includes(currentPlayerId);
    }
    return true;
  });

  return NextResponse.json(upcoming);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("padel_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { courtId, date, startTime, durationMinutes, eloRange, notes, courtBookingStatus, invitePlayerIds, gameType, isPrivate } = body;

  if (Array.isArray(invitePlayerIds) && invitePlayerIds.length > 5) {
    return NextResponse.json({ error: "Maximum 5 players can be invited" }, { status: 400 });
  }

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
    gameType: (gameType as "friendly" | "ranked") ?? "ranked",
    isPrivate: isPrivate === true,
    joinCode: isPrivate === true ? crypto.randomBytes(3).toString("hex").toUpperCase() : undefined,
    invitedPlayerIds: Array.isArray(invitePlayerIds) ? invitePlayerIds : [],
    teams: { team1: [user.playerId], team2: [] },
  });

  // Send broadcast notifications to all ELO-eligible players
  // Send personal invite notifications to specifically invited players (max 5)
  try {
    const allPlayers = await getPlayers();
    const eloLabel = eloMin !== undefined && eloMax !== undefined
      ? ` · ELO ${eloMin}–${eloMax}`
      : "";

    const inviteSet = new Set<string>(Array.isArray(invitePlayerIds) ? invitePlayerIds : []);

    const eligible = allPlayers.filter((p) => {
      if (p.id === user.playerId) return false;
      const elo = p.stats.eloRating;
      if (eloMin !== undefined && elo < eloMin) return false;
      if (eloMax !== undefined && elo > eloMax) return false;
      return true;
    });

    await Promise.all(eligible.map((p) => {
      if (inviteSet.has(p.id)) {
        // Personal invite notification
        return createNotification({
          playerId: p.id,
          type: "game_invite",
          title: `${player.name} invited you to a game!`,
          body: `${date} at ${startTime}${eloLabel}`,
          link: `/open-games?game=${game.id}`,
        });
      }
      // Skip broadcast for private games
      if (isPrivate === true) return Promise.resolve();
      // General broadcast
      return createNotification({
        playerId: p.id,
        type: "open_game",
        title: "New open game available",
        body: `${player.name} opened a game on ${date} at ${startTime}${eloLabel}`,
        link: "/open-games",
      });
    }));
  } catch {
    // Notifications are non-critical; don't fail the request
  }

  return NextResponse.json(game, { status: 201 });
}
