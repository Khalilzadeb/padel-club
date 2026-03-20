import { NextRequest, NextResponse } from "next/server";
import { getOpenGame, joinOpenGame, leaveOpenGame, cancelOpenGame } from "@/lib/data/open-games";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { createNotification } from "@/lib/data/notifications";
import { getPlayer } from "@/lib/data/players";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getOpenGame(id);
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(game);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("padel_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await findUserById(payload.userId);
  if (!user?.playerId) return NextResponse.json({ error: "No player profile" }, { status: 400 });

  const body = await req.json();
  const { action } = body;

  if (action === "join") {
    const { game, error } = await joinOpenGame(id, user.playerId);
    if (!game) return NextResponse.json({ error: error ?? "Cannot join this game" }, { status: 400 });

    const joiner = await getPlayer(user.playerId);
    const joinerName = joiner?.name ?? "Someone";

    // Notify creator
    if (game.createdBy !== user.playerId) {
      await createNotification({
        playerId: game.createdBy,
        type: "game_join",
        title: `${joinerName} joined your game`,
        body: `${game.date} at ${game.startTime}`,
        link: `/open-games`,
      });
    }

    // If game is now full, notify all players
    if (game.status === "full") {
      await Promise.all(
        game.playerIds
          .filter((pid) => pid !== user.playerId)
          .map((pid) =>
            createNotification({
              playerId: pid,
              type: "game_full",
              title: "Your game is full!",
              body: `${game.date} at ${game.startTime} — all 4 players are in`,
              link: `/open-games`,
            })
          )
      );
    }

    return NextResponse.json(game);
  }

  if (action === "leave") {
    const game = await getOpenGame(id);
    if (game?.createdBy === user.playerId) {
      // Notify all joined players that the game is cancelled
      await Promise.all(
        game.playerIds
          .filter((pid) => pid !== user.playerId)
          .map((pid) =>
            createNotification({
              playerId: pid,
              type: "game_cancel",
              title: "A game you joined was cancelled",
              body: `${game.date} at ${game.startTime} was cancelled by the host`,
              link: `/open-games`,
            })
          )
      );
      await cancelOpenGame(id);
      return NextResponse.json({ status: "cancelled" });
    }
    const updated = await leaveOpenGame(id, user.playerId);
    return NextResponse.json(updated);
  }

  if (action === "cancel") {
    const game = await getOpenGame(id);
    if (game?.createdBy !== user.playerId) {
      return NextResponse.json({ error: "Only the creator can cancel" }, { status: 403 });
    }
    // Notify all joined players
    await Promise.all(
      game.playerIds
        .filter((pid) => pid !== user.playerId)
        .map((pid) =>
          createNotification({
            playerId: pid,
            type: "game_cancel",
            title: "A game you joined was cancelled",
            body: `${game.date} at ${game.startTime} was cancelled by the host`,
            link: `/open-games`,
          })
        )
    );
    await cancelOpenGame(id);
    return NextResponse.json({ status: "cancelled" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
