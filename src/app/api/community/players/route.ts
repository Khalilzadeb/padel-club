import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addCommunityPlayer,
  getCommunityBySlug,
  getCommunityPlayers,
  isCommunityAdmin,
} from "@/lib/data/communities";

const COMMUNITY_SLUG = "padelsmash";

export async function GET(_req: NextRequest) {
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const players = await getCommunityPlayers(community.id);
  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name as string | undefined)?.trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  try {
    const player = await addCommunityPlayer({
      communityId: community.id,
      name,
      contactPhone: body.contactPhone ?? null,
      contactEmail: body.contactEmail ?? null,
      avatarUrl: body.avatarUrl ?? null,
      linkedUserId: body.linkedUserId ?? null,
      linkedPlayerId: body.linkedPlayerId ?? null,
    });
    return NextResponse.json(player);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
