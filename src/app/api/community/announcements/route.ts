import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import { createAnnouncement, listAnnouncements } from "@/lib/data/community-announcements";
import { supabase } from "@/lib/supabase";

const COMMUNITY_SLUG = "padelsmash";
const BUCKET = "community-images";

export async function GET(_req: NextRequest) {
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const list = await listAnnouncements(community.id);
  return NextResponse.json(list);
}

// POST accepts either JSON ({ title, body, imageUrl?, pinned? }) or
// multipart/form-data with title/body/pinned + optional `image` file.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";
  let title = "";
  let body = "";
  let imageUrl: string | null = null;
  let pinned = false;

  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    title = ((fd.get("title") as string | null) ?? "").trim();
    body = ((fd.get("body") as string | null) ?? "").trim();
    pinned = fd.get("pinned") === "true";
    const file = fd.get("image");
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
      }
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Must be an image" }, { status: 400 });
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${community.id}/announcements/${Date.now()}.${ext}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: file.type, upsert: true });
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });
      imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
  } else {
    const json = await req.json().catch(() => ({}));
    title = (json.title ?? "").trim();
    body = (json.body ?? "").trim();
    imageUrl = json.imageUrl ?? null;
    pinned = !!json.pinned;
  }

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!body) return NextResponse.json({ error: "body required" }, { status: 400 });

  try {
    const created = await createAnnouncement({
      communityId: community.id,
      authorUserId: session.userId,
      title,
      body,
      imageUrl,
      pinned,
    });
    return NextResponse.json(created);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
