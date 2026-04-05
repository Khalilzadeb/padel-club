import { NextRequest, NextResponse } from "next/server";
import { getVenueSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/venue-admin/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getVenueSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const { data: courts } = await supabase
    .from("courts")
    .select("id")
    .eq("location", session.location);

  if (!courts || courts.length === 0) return NextResponse.json([]);
  const courtIds = courts.map((c) => c.id);

  let query = supabase.from("bookings").select("*").in("court_id", courtIds).order("date").order("start_time");
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/venue-admin/bookings
export async function POST(req: NextRequest) {
  const session = await getVenueSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { courtId, date, startTime, durationMinutes, bookerName, bookerPhone } = body;

  if (!courtId || !date || !startTime || !durationMinutes) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify court belongs to this venue
  const { data: court } = await supabase
    .from("courts")
    .select("id")
    .eq("id", courtId)
    .eq("location", session.location)
    .maybeSingle();

  if (!court) return NextResponse.json({ error: "Court not found" }, { status: 404 });

  const [h, m] = startTime.split(":").map(Number);
  const totalMins = h * 60 + m + durationMinutes;
  const endTime = `${String(Math.floor(totalMins / 60)).padStart(2, "0")}:${String(totalMins % 60).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      id: `vb_${Date.now()}`,
      court_id: courtId,
      player_ids: [],
      date,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      status: "confirmed",
      notes: "Venue booking",
      booker_name: bookerName ?? null,
      booker_phone: bookerPhone ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/venue-admin/bookings?id=...
export async function DELETE(req: NextRequest) {
  const session = await getVenueSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await supabase.from("bookings").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
