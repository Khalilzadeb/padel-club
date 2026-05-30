import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";

const COMMUNITY_SLUG = "padelsmash";

// Returns { isAdmin: boolean } for the current session within PadelSmash.
export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ isAdmin: false });
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ isAdmin: false });
  const isAdmin = await isCommunityAdmin(community.id, session.userId);
  return NextResponse.json({ isAdmin });
}
