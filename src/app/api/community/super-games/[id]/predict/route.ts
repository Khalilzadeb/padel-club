import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSuperGame, upsertPrediction } from "@/lib/data/super-games";
import type { SuperGameSet } from "@/lib/types";

// POST /api/community/super-games/[id]/predict
// body: { sets: [{a,b}, ...] } — any logged-in user submits/updates their prediction.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const game = await getSuperGame(id);
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.status !== "open") {
    return NextResponse.json({ error: "Predictions are closed" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const raw = body?.sets;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > game.maxSets) {
    return NextResponse.json({ error: "Invalid prediction" }, { status: 400 });
  }
  const sets: SuperGameSet[] = [];
  for (const s of raw) {
    const a = Number((s as { a: unknown })?.a);
    const b = Number((s as { b: unknown })?.b);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 99 || b > 99) {
      return NextResponse.json({ error: "Invalid prediction" }, { status: 400 });
    }
    sets.push({ a, b });
  }

  const prediction = await upsertPrediction(id, session.userId, session.name, sets);
  return NextResponse.json({ prediction });
}
