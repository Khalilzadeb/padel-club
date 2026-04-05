import { NextResponse } from "next/server";
import { getVenueSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getVenueSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: courts } = await supabase
    .from("courts")
    .select("id, name")
    .eq("location", session.location);

  if (!courts || courts.length === 0) return NextResponse.json([]);
  const courtIds = courts.map((c) => c.id);

  const { data, error } = await supabase
    .from("open_games")
    .select("*")
    .in("court_id", courtIds)
    .neq("status", "cancelled")
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date")
    .order("start_time");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const courtMap = Object.fromEntries(courts.map((c) => [c.id, c.name]));
  const result = (data ?? []).map((g) => ({ ...g, courtName: courtMap[g.court_id] ?? g.court_id }));
  return NextResponse.json(result);
}
