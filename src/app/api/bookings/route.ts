import { NextRequest, NextResponse } from "next/server";
import { getBookings, addBooking, checkConflict } from "@/lib/data/bookings";
import { getCourt } from "@/lib/data/courts";
import { Booking } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courtId = searchParams.get("courtId") ?? undefined;
  const date = searchParams.get("date") ?? undefined;
  const results = await getBookings(courtId, date);
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courtId, playerIds, date, startTime, durationMinutes, notes } = body;

  if (!courtId || !playerIds || !date || !startTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const court = await getCourt(courtId);
  if (!court) return NextResponse.json({ error: "Court not found" }, { status: 404 });

  const endHour = parseInt(startTime.split(":")[0]) + Math.floor((durationMinutes ?? 60) / 60);
  const endTime = `${endHour.toString().padStart(2, "0")}:00`;

  const conflict = await checkConflict(courtId, date, startTime, endTime);
  if (conflict) {
    return NextResponse.json({ error: "Time slot already booked" }, { status: 409 });
  }

  const booking: Booking = {
    id: `b${crypto.randomUUID().slice(0, 8)}`,
    courtId,
    playerIds,
    date,
    startTime,
    endTime,
    durationMinutes: durationMinutes ?? 60,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    notes,
    totalPrice: Math.round((court.pricePerHour * (durationMinutes ?? 60)) / 60),
  };

  const saved = await addBooking(booking);
  return NextResponse.json(saved, { status: 201 });
}
