import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, isCommunityAdmin } from "@/lib/data/communities";
import { createTournament, listTournaments } from "@/lib/data/community-tournaments";
import { americanoTotalRounds } from "@/lib/tournament-pairing";

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
  const courtCount = Number(body.courtCount ?? 1);
  const prizePositions = Number(body.prizePositions ?? 1);
  const playerIds = (body.playerIds as string[] | undefined) ?? [];

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!format) return NextResponse.json({ error: "format required" }, { status: 400 });
  if (![16, 24, 32].includes(pointsPerRound)) {
    return NextResponse.json({ error: "pointsPerRound must be 16, 24, or 32" }, { status: 400 });
  }
  if (![1, 2, 3].includes(prizePositions)) {
    return NextResponse.json({ error: "prizePositions must be 1, 2, or 3" }, { status: 400 });
  }
  if (!Number.isFinite(courtCount) || courtCount < 1) {
    return NextResponse.json({ error: "courtCount must be at least 1" }, { status: 400 });
  }
  if (playerIds.length < 4) {
    return NextResponse.json({ error: "at least 4 players required" }, { status: 400 });
  }
  if (format === "americano" && playerIds.length % 4 !== 0) {
    return NextResponse.json(
      { error: "Americano requires a multiple of 4 players" },
      { status: 400 }
    );
  }
  if (format === "americano" && playerIds.length !== courtCount * 4) {
    return NextResponse.json(
      { error: `Americano needs exactly courts × 4 players (${courtCount * 4} for ${courtCount} courts)` },
      { status: 400 }
    );
  }

  // Americano round count is fixed (N-1). Other formats use the admin-provided value.
  const roundsCount =
    format === "americano"
      ? americanoTotalRounds(playerIds.length)
      : body.roundsCount ?? null;

  try {
    const tournament = await createTournament({
      communityId: community.id,
      name,
      description: body.description ?? null,
      format: format as never,
      pointsPerRound,
      roundsCount,
      courtCount,
      prizePositions,
      startDate: body.startDate ?? null,
      createdBy: session.userId,
      playerIds,
    });
    return NextResponse.json(tournament);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
