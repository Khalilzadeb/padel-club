import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/data/community-announcements";

const COMMUNITY_SLUG = "padelsmash";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return { error: NextResponse.json({ error: "Community not found" }, { status: 404 }) };
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { communityId: community.id };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  try {
    await updateAnnouncement(id, {
      title: json.title,
      body: json.body,
      imageUrl: json.imageUrl,
      pinned: json.pinned,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await deleteAnnouncement(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
