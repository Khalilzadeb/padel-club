import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getCommunityBySlug,
  isCommunityAdmin,
  removeCommunityPlayer,
  updateCommunityPlayer,
} from "@/lib/data/communities";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { playerId } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await updateCommunityPlayer(playerId, {
      name: body.name,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      avatarUrl: body.avatarUrl,
      linkedUserId: body.linkedUserId,
      linkedPlayerId: body.linkedPlayerId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { playerId } = await params;
  try {
    await removeCommunityPlayer(playerId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
