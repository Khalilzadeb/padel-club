import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("padel_session")?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { playerId } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.eloRating !== undefined) updates.elo_rating = body.eloRating;
  if (body.level !== undefined) updates.level = body.level;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase.from("players").update(updates).eq("id", playerId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
