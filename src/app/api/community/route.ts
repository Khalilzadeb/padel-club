import { NextRequest, NextResponse } from "next/server";
import { getCommunityBySlug } from "@/lib/data/communities";

const COMMUNITY_SLUG = "padelsmash";

export async function GET(_req: NextRequest) {
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  return NextResponse.json(community);
}
