import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { updateTournament, deleteTournament } from "@/lib/data/tournaments";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("padel_session")?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    const body = await req.json();
    const tournament = await updateTournament(id, body);
    return NextResponse.json(tournament);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    await deleteTournament(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete tournament" }, { status: 500 });
  }
}
