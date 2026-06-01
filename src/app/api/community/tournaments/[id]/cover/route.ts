import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import { getTournament } from "@/lib/data/community-tournaments";
import { supabase } from "@/lib/supabase";

const COMMUNITY_SLUG = "padelsmash";
const BUCKET = "tournament-covers";

// POST /api/community/tournaments/[id]/cover
// Accepts multipart/form-data with a `file` field. Uploads to Supabase Storage
// and updates the tournament's cover_url.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  // Basic guardrails: cap at 5 MB, only images.
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Must be an image" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${id}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const coverUrl = pub.publicUrl;

  const { error: updErr } = await supabase
    .from("community_tournaments")
    .update({ cover_url: coverUrl })
    .eq("id", id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  return NextResponse.json({ coverUrl });
}

// PATCH /api/community/tournaments/[id]/cover
// body: { position: number } — updates the cover's vertical focal point (0-100).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const position = Number(body?.position);
  if (!Number.isFinite(position)) {
    return NextResponse.json({ error: "position must be a number" }, { status: 400 });
  }
  const clamped = Math.min(100, Math.max(0, Math.round(position)));

  const { error } = await supabase
    .from("community_tournaments")
    .update({ cover_position: clamped })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ position: clamped });
}
