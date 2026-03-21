import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getTournament, updateTournament } from "@/lib/data/tournaments";
import { getPlayer } from "@/lib/data/players";
import { findUserById } from "@/lib/data/users";
import { createNotification } from "@/lib/data/notifications";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get("padel_session")?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.action === "register") {
    const { partnerId } = body;
    const user = await findUserById(session.userId);
    if (!user?.playerId) return NextResponse.json({ error: "You need a player profile to register" }, { status: 400 });

    const tournament = await getTournament(id);
    if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    if (tournament.status !== "registration") return NextResponse.json({ error: "Registration is not open" }, { status: 400 });
    if (tournament.registeredTeams.length >= tournament.maxTeams) return NextResponse.json({ error: "Tournament is full" }, { status: 400 });

    const myPlayerId = user.playerId;
    const allRegistered = tournament.registeredTeams.flat();
    if (allRegistered.includes(myPlayerId)) return NextResponse.json({ error: "You are already registered" }, { status: 400 });
    if (partnerId && allRegistered.includes(partnerId)) return NextResponse.json({ error: "Your partner is already registered" }, { status: 400 });

    const team = partnerId ? [myPlayerId, partnerId] : [myPlayerId];
    const newTeams = [...tournament.registeredTeams, team];
    const updated = await updateTournament(id, { registeredTeams: newTeams });

    // Notify partner
    if (partnerId) {
      const myPlayer = await getPlayer(myPlayerId);
      await createNotification({
        playerId: partnerId,
        type: "tournament_register",
        title: "Tournament Registration",
        body: `${myPlayer?.name ?? "Someone"} registered you as a partner for "${tournament.name}"`,
        link: `/tournaments/${id}`,
      });
    }

    return NextResponse.json(updated);
  }

  if (body.action === "unregister") {
    const user = await findUserById(session.userId);
    if (!user?.playerId) return NextResponse.json({ error: "No player profile" }, { status: 400 });

    const tournament = await getTournament(id);
    if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (tournament.status !== "registration") return NextResponse.json({ error: "Registration is closed" }, { status: 400 });

    const myPlayerId = user.playerId;
    const newTeams = tournament.registeredTeams.filter((team) => !team.includes(myPlayerId));
    if (newTeams.length === tournament.registeredTeams.length) {
      return NextResponse.json({ error: "You are not registered" }, { status: 400 });
    }
    const updated = await updateTournament(id, { registeredTeams: newTeams });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
