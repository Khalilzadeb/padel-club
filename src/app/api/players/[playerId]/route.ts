import { NextRequest, NextResponse } from "next/server";
import { getPlayer } from "@/lib/data/players";
import { getMatches } from "@/lib/data/matches";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { supabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const player = await getPlayer(playerId);
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const matches = await getMatches({ playerId });
  return NextResponse.json({ player, matches });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;

  const token = req.cookies.get("padel_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await findUserById(payload.userId);
  if (user?.playerId !== playerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const allowed = ["hand", "position", "gender"];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase.from("players").update(updates).eq("id", playerId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
