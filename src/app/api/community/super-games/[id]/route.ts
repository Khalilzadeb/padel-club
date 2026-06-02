import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import {
  deleteSuperGame,
  finishSuperGame,
  getSuperGame,
  reopenSuperGame,
  updateSuperGame,
} from "@/lib/data/super-games";
import type { SuperGameSet } from "@/lib/types";

const COMMUNITY_SLUG = "padelsmash";

function parseSets(raw: unknown): SuperGameSet[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 5) return null;
  const sets: SuperGameSet[] = [];
  for (const s of raw) {
    const a = Number((s as { a: unknown })?.a);
    const b = Number((s as { b: unknown })?.b);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 99 || b > 99) {
      return null;
    }
    sets.push({ a, b });
  }
  return sets;
}

async function requireAdmin(userId: string) {
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return { error: "Community not found", status: 404 as const };
  const admin = await isCommunityAdmin(community.id, userId);
  if (!admin) return { error: "Forbidden", status: 403 as const };
  return { ok: true as const };
}

// PATCH /api/community/super-games/[id]
//   { action: "finish", actualSets } | { action: "reopen" } | { title?, gameDate?, prize? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const guard = await requireAdmin(session.userId);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await params;
  const game = await getSuperGame(id);
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  if (body.action === "finish") {
    const sets = parseSets(body.actualSets);
    if (!sets) return NextResponse.json({ error: "Invalid result" }, { status: 400 });
    await finishSuperGame(id, sets);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reopen") {
    await reopenSuperGame(id);
    return NextResponse.json({ ok: true });
  }

  await updateSuperGame(id, {
    title: body.title !== undefined ? body.title?.trim() || null : undefined,
    gameDate: body.gameDate !== undefined ? body.gameDate || null : undefined,
    prize: body.prize !== undefined ? body.prize?.trim() || null : undefined,
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/community/super-games/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const guard = await requireAdmin(session.userId);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await params;
  await deleteSuperGame(id);
  return NextResponse.json({ ok: true });
}
