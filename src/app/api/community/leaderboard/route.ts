import { NextRequest, NextResponse } from "next/server";
import { getCommunityBySlug } from "@/lib/data/communities";
import { getCommunityLeaderboard } from "@/lib/data/community-tournaments";

const COMMUNITY_SLUG = "padelsmash";

export async function GET(_req: NextRequest) {
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const entries = await getCommunityLeaderboard(community.id);
  return NextResponse.json(entries);
}
