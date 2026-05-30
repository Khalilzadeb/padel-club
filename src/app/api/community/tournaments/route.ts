import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import { createTournament, listTournaments } from "@/lib/data/community-tournaments";

const COMMUNITY_SLUG = "padelsmash";

export async function GET(_req: NextRequest) {
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const tournaments = await listTournaments(community.id);
  return NextResponse.json(tournaments);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

  const isAdmin = await isCommunityAdmin(community.id, session.userId);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name as string | undefined)?.trim();
  const format = body.format as string | undefined;
  const pointsPerRound = Number(body.pointsPerRound ?? 24);
  const playerIds = (body.playerIds as string[] | undefined) ?? [];

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!format) return NextResponse.json({ error: "format required" }, { status: 400 });
  if (![16, 24, 32].includes(pointsPerRound)) {
    return NextResponse.json({ error: "pointsPerRound must be 16, 24, or 32" }, { status: 400 });
  }
  if (playerIds.length < 4) {
    return NextResponse.json({ error: "at least 4 players required" }, { status: 400 });
  }

  try {
    const tournament = await createTournament({
      communityId: community.id,
      name,
      description: body.description ?? null,
      format: format as never,
      pointsPerRound,
      roundsCount: body.roundsCount ?? null,
      startDate: body.startDate ?? null,
      createdBy: session.userId,
      playerIds,
    });
    return NextResponse.json(tournament);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
