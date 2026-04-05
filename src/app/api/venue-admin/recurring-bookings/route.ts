import { NextRequest, NextResponse } from "next/server";
import { getVenueSession } from "@/lib/auth";
import {
  getRecurringBookingsByLocation,
  createRecurringBooking,
  deleteRecurringBooking,
} from "@/lib/data/venue-admins";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getVenueSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getRecurringBookingsByLocation(session.location);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getVenueSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courtId, dayOfWeek, startTime, durationMinutes, label } = await req.json();
  if (!courtId || dayOfWeek === undefined || !startTime || !durationMinutes) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: court } = await supabase
    .from("courts")
    .select("id")
    .eq("id", courtId)
    .eq("location", session.location)
    .maybeSingle();

  if (!court) return NextResponse.json({ error: "Court not found" }, { status: 404 });

  const booking = await createRecurringBooking(
    courtId,
    dayOfWeek,
    startTime,
    durationMinutes,
    label ?? null,
    session.adminId
  );
  return NextResponse.json(booking);
}

export async function DELETE(req: NextRequest) {
  const session = await getVenueSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await deleteRecurringBooking(id);
  return NextResponse.json({ ok: true });
}
