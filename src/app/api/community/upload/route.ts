import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import { supabase } from "@/lib/supabase";

const COMMUNITY_SLUG = "padelsmash";
const BUCKET = "community-images";

// POST /api/community/upload
// formData: file (image), kind ('cover' | 'logo')
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (kind !== "cover" && kind !== "logo") {
    return NextResponse.json({ error: "kind must be cover or logo" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Must be an image" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${community.id}/${kind}-${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.publicUrl;

  const column = kind === "cover" ? "cover_url" : "logo_url";
  const { error: updErr } = await supabase
    .from("communities")
    .update({ [column]: url })
    .eq("id", community.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  return NextResponse.json({ url });
}
