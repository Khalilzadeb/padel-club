import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getTournaments, createTournament } from "@/lib/data/tournaments";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("padel_session")?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const tournaments = await getTournaments();
  return NextResponse.json(tournaments);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const tournament = await createTournament(body);
    return NextResponse.json(tournament);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
