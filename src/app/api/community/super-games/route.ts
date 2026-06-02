import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug, getCommunityPlayers, isCommunityAdmin } from "@/lib/data/communities";
import { createSuperGame, getPredictions, listSuperGames } from "@/lib/data/super-games";
import type { SuperGamePlayerRef, SuperGameView } from "@/lib/types";

const COMMUNITY_SLUG = "padelsmash";

// GET /api/community/super-games — list games enriched with player names + predictions.
export async function GET() {
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

  const session = await getSession();
  const isAdmin = session ? await isCommunityAdmin(community.id, session.userId) : false;

  const [games, roster] = await Promise.all([
    listSuperGames(community.id),
    getCommunityPlayers(community.id),
  ]);

  const byId = new Map<string, SuperGamePlayerRef>();
  for (const p of roster) byId.set(p.id, { id: p.id, name: p.name, avatarUrl: p.avatarUrl });
  const resolve = (...ids: (string | null)[]): SuperGamePlayerRef[] =>
    ids.map((id) => (id ? byId.get(id) : null)).filter((x): x is SuperGamePlayerRef => !!x);

  const views: SuperGameView[] = await Promise.all(
    games.map(async (g) => {
      const predictions = await getPredictions(g.id);
      return {
        ...g,
        teamA: resolve(g.teamAPlayer1, g.teamAPlayer2),
        teamB: resolve(g.teamBPlayer1, g.teamBPlayer2),
        predictions,
        myPrediction: session ? predictions.find((p) => p.userId === session.userId) ?? null : null,
      };
    })
  );

  return NextResponse.json({ games: views, isAdmin, loggedIn: !!session });
}

// POST /api/community/super-games — admin creates a game.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const slots = [body.teamAPlayer1, body.teamAPlayer2, body.teamBPlayer1, body.teamBPlayer2];
  if (slots.some((s) => !s || typeof s !== "string")) {
    return NextResponse.json({ error: "All four players are required" }, { status: 400 });
  }

  const maxSets = Number(body.maxSets);
  const game = await createSuperGame({
    communityId: community.id,
    title: body.title?.trim() || null,
    gameDate: body.gameDate || null,
    teamAPlayer1: body.teamAPlayer1,
    teamAPlayer2: body.teamAPlayer2,
    teamBPlayer1: body.teamBPlayer1,
    teamBPlayer2: body.teamBPlayer2,
    maxSets: [1, 3, 5].includes(maxSets) ? maxSets : 3,
    prize: body.prize?.trim() || null,
    createdBy: session.userId,
  });

  return NextResponse.json({ game });
}
