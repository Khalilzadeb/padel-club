import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { updatePlayerProfile } from "@/lib/data/players";

interface SurveyAnswers {
  selfLevel: "initiation" | "intermediate" | "advanced" | "professional";
  experience: "never" | "lt1" | "1to3" | "3to5" | "gt5";
  training: "no" | "past" | "currently";
  age: "18to30" | "31to40" | "41to50" | "over50";
  competition: "friends" | "friendly" | "amateur" | "federated";
  volley: 0 | 1 | 2 | 3 | 4;
  rebounds: 0 | 1 | 2 | 3 | 4;
}

function calculateElo(a: SurveyAnswers): { elo: number; level: string } {
  let points = 0;

  points += { initiation: 0, intermediate: 100, advanced: 250, professional: 400 }[a.selfLevel];
  points += { never: 0, lt1: 30, "1to3": 80, "3to5": 130, gt5: 180 }[a.experience];
  points += { no: 0, past: 40, currently: 80 }[a.training];
  points += { "18to30": 20, "31to40": 10, "41to50": 0, over50: -10 }[a.age];
  points += { friends: 0, friendly: 40, amateur: 100, federated: 200 }[a.competition];
  points += [0, 25, 60, 90, 120][a.volley];
  points += [0, 25, 60, 90, 120][a.rebounds];

  const elo = Math.max(700, Math.min(1800, 700 + points));

  const level =
    elo < 900 ? "beginner" :
    elo < 1150 ? "intermediate" :
    elo < 1450 ? "advanced" : "pro";

  return { elo, level };
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("padel_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await findUserById(payload.userId);
  if (!user?.playerId) return NextResponse.json({ error: "No player profile" }, { status: 400 });

  const answers: SurveyAnswers = await req.json();
  const { elo, level } = calculateElo(answers);

  await updatePlayerProfile(user.playerId, { elo_rating: elo, level });

  return NextResponse.json({ elo, level });
}
