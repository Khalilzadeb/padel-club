import { NextRequest, NextResponse } from "next/server";
import { getOpenGame, joinOpenGame, leaveOpenGame, cancelOpenGame } from "@/lib/data/open-games";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { createNotification } from "@/lib/data/notifications";
import { getPlayer } from "@/lib/data/players";
import { supabase } from "@/lib/supabase";
import { calculateEloChanges } from "@/lib/elo";
import { updatePlayerElo } from "@/lib/data/players";
import { addMatch } from "@/lib/data/matches";
import type { Match, SetScore } from "@/lib/types";

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

  // ── JOIN ─────────────────────────────────────────────────────────────────
  if (action === "join") {
    const teamNumber = (body.teamNumber as 1 | 2) ?? 1;
    const { game, error } = await joinOpenGame(id, user.playerId, teamNumber);
    if (!game) return NextResponse.json({ error: error ?? "Cannot join this game" }, { status: 400 });
    const joiner = await getPlayer(user.playerId);
    if (game.createdBy !== user.playerId) {
      await createNotification({
        playerId: game.createdBy,
        type: "game_join",
        title: `${joiner?.name ?? "Someone"} joined your game`,
        body: `${game.date} at ${game.startTime}`,
        link: `/open-games`,
      });
    }
    if (game.status === "full") {
      await Promise.all(
        game.playerIds.filter((pid) => pid !== user.playerId).map((pid) =>
          createNotification({ playerId: pid, type: "game_full", title: "Your game is full!", body: `${game.date} at ${game.startTime} — all 4 players are in`, link: `/open-games` })
        )
      );
    }
    return NextResponse.json(game);
  }

  // ── LEAVE / CANCEL ───────────────────────────────────────────────────────
  if (action === "leave") {
    const game = await getOpenGame(id);
    if (game?.createdBy === user.playerId) {
      await Promise.all(
        (game.playerIds ?? []).filter((pid) => pid !== user.playerId).map((pid) =>
          createNotification({ playerId: pid, type: "game_cancel", title: "A game you joined was cancelled", body: `${game.date} at ${game.startTime} was cancelled by the host`, link: `/open-games` })
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
    if (game?.createdBy !== user.playerId) return NextResponse.json({ error: "Only the creator can cancel" }, { status: 403 });
    await Promise.all(
      (game.playerIds ?? []).filter((pid) => pid !== user.playerId).map((pid) =>
        createNotification({ playerId: pid, type: "game_cancel", title: "A game you joined was cancelled", body: `${game.date} at ${game.startTime} was cancelled by the host`, link: `/open-games` })
      )
    );
    await cancelOpenGame(id);
    return NextResponse.json({ status: "cancelled" });
  }

  // ── SUBMIT SCORE ─────────────────────────────────────────────────────────
  if (action === "submit_score") {
    const game = await getOpenGame(id);
    if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!game.playerIds.includes(user.playerId)) return NextResponse.json({ error: "You are not in this game" }, { status: 403 });
    if (game.matchId) return NextResponse.json({ error: "Score already confirmed" }, { status: 400 });

    const { team1PlayerIds, team2PlayerIds, sets } = body;
    if (!team1PlayerIds || !team2PlayerIds || !sets?.length) return NextResponse.json({ error: "Missing score data" }, { status: 400 });

    await supabase.from("open_games").update({
      pending_score: { team1PlayerIds, team2PlayerIds, sets },
      submitted_by: user.playerId,
      status: "pending_result",
    }).eq("id", id);

    // Notify the other team
    const otherTeamIds = game.playerIds.filter((pid) => pid !== user.playerId && !team1PlayerIds.includes(pid) || (team1PlayerIds.includes(pid) && pid !== user.playerId));
    const submitter = await getPlayer(user.playerId);
    await Promise.all(
      game.playerIds.filter((pid) => pid !== user.playerId).map((pid) =>
        createNotification({
          playerId: pid,
          type: "score_pending",
          title: `${submitter?.name ?? "A player"} submitted the result`,
          body: `Please confirm or dispute the result for your game on ${game.date}`,
          link: `/open-games`,
        })
      )
    );
    void otherTeamIds;

    return NextResponse.json({ ok: true });
  }

  // ── CONFIRM SCORE ────────────────────────────────────────────────────────
  if (action === "confirm_score") {
    const game = await getOpenGame(id);
    if (!game?.pendingScore) return NextResponse.json({ error: "No pending score" }, { status: 400 });
    if (!game.playerIds.includes(user.playerId)) return NextResponse.json({ error: "You are not in this game" }, { status: 403 });
    if (game.submittedBy === user.playerId) return NextResponse.json({ error: "You cannot confirm your own submission" }, { status: 403 });

    const { team1PlayerIds, team2PlayerIds, sets } = game.pendingScore;

    // Determine winner
    const t1Sets = sets.filter((s: SetScore) => s.team1Games > s.team2Games).length;
    const t2Sets = sets.filter((s: SetScore) => s.team2Games > s.team1Games).length;
    const winnerId: "team1" | "team2" = t1Sets > t2Sets ? "team1" : "team2";

    const isFriendly = game.gameType === "friendly";

    // Calculate ELO (only for ranked games)
    let eloChanges: Record<string, number> = {};
    let team1Change = 0;
    let team2Change = 0;
    if (!isFriendly) {
      const [p1, p2, p3, p4] = await Promise.all([
        getPlayer(team1PlayerIds[0]), getPlayer(team1PlayerIds[1]),
        getPlayer(team2PlayerIds[0]), getPlayer(team2PlayerIds[1]),
      ]);
      const team1Elos: [number, number] = [p1?.stats.eloRating ?? 1000, p2?.stats.eloRating ?? 1000];
      const team2Elos: [number, number] = [p3?.stats.eloRating ?? 1000, p4?.stats.eloRating ?? 1000];
      ({ team1Change, team2Change } = calculateEloChanges(team1Elos, team2Elos, winnerId));
      eloChanges = {
        [team1PlayerIds[0]]: team1Change, [team1PlayerIds[1]]: team1Change,
        [team2PlayerIds[0]]: team2Change, [team2PlayerIds[1]]: team2Change,
      };
    }

    // Create match
    const match: Match = {
      id: `m${crypto.randomUUID().slice(0, 8)}`,
      courtId: game.courtId,
      type: isFriendly ? "casual" : "ranked",
      format: "best-of-3",
      status: "completed",
      team1: { playerIds: team1PlayerIds },
      team2: { playerIds: team2PlayerIds },
      sets,
      winnerId,
      date: game.date,
      startTime: game.startTime,
      durationMinutes: game.durationMinutes,
      eloChanges: isFriendly ? undefined : eloChanges,
    };
    const saved = await addMatch(match);

    // Update ELO for all 4 players (ranked only)
    if (!isFriendly) {
      await Promise.all([
        updatePlayerElo(team1PlayerIds[0], team1Change, winnerId === "team1"),
        updatePlayerElo(team1PlayerIds[1], team1Change, winnerId === "team1"),
        updatePlayerElo(team2PlayerIds[0], team2Change, winnerId === "team2"),
        updatePlayerElo(team2PlayerIds[1], team2Change, winnerId === "team2"),
      ]);
    }

    // Mark open game as completed
    await supabase.from("open_games").update({ status: "completed", match_id: saved.id }).eq("id", id);

    // Notify all players
    await Promise.all(
      game.playerIds.map((pid) => {
        const change = eloChanges[pid];
        return createNotification({
          playerId: pid,
          type: "score_confirmed",
          title: "Match result confirmed!",
          body: isFriendly ? "Friendly game recorded" : `ELO change: ${change > 0 ? "+" : ""}${change}`,
          link: `/matches/${saved.id}`,
        });
      })
    );

    return NextResponse.json({ matchId: saved.id });
  }

  // ── DISPUTE SCORE ────────────────────────────────────────────────────────
  if (action === "dispute_score") {
    const game = await getOpenGame(id);
    if (!game?.pendingScore) return NextResponse.json({ error: "No pending score" }, { status: 400 });
    if (!game.playerIds.includes(user.playerId)) return NextResponse.json({ error: "You are not in this game" }, { status: 403 });

    await supabase.from("open_games").update({ pending_score: null, submitted_by: null, status: "full" }).eq("id", id);

    const disputer = await getPlayer(user.playerId);
    await Promise.all(
      game.playerIds.filter((pid) => pid !== user.playerId).map((pid) =>
        createNotification({
          playerId: pid,
          type: "score_disputed",
          title: `${disputer?.name ?? "A player"} disputed the result`,
          body: `The submitted result was disputed. Please re-enter the correct score.`,
          link: `/open-games`,
        })
      )
    );

    return NextResponse.json({ ok: true });
  }

  // ── UPDATE BOOKING STATUS ─────────────────────────────────────────────────
  if (action === "update_booking_status") {
    const game = await getOpenGame(id);
    if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (game.createdBy !== user.playerId) return NextResponse.json({ error: "Only the creator can update booking status" }, { status: 403 });

    const { status: bookingStatus } = body;
    if (bookingStatus === "failed") {
      await supabase.from("open_games").update({ court_booking_status: "failed", status: "cancelled" }).eq("id", id);
      const host = await getPlayer(user.playerId);
      await Promise.all(
        game.playerIds.filter((pid) => pid !== user.playerId).map((pid) =>
          createNotification({
            playerId: pid,
            type: "game_cancel",
            title: "Oyun ləğv olundu",
            body: `Təəssüf ki, ${host?.name ?? "Host"} ${game.date} tarixli ${game.startTime} saatında kort book edə bilmədi. Oyun ləğv olundu.`,
            link: "/open-games",
          })
        )
      );
    } else if (bookingStatus === "booked") {
      await supabase.from("open_games").update({ court_booking_status: "booked" }).eq("id", id);
      await Promise.all(
        game.playerIds.filter((pid) => pid !== user.playerId).map((pid) =>
          createNotification({
            playerId: pid,
            type: "game_join",
            title: "Kort book edildi ✓",
            body: `${game.date} tarixli ${game.startTime} saatında olan oyununuz üçün kort təsdiqləndi!`,
            link: "/open-games",
          })
        )
      );
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
