import { NextRequest, NextResponse } from "next/server";
import { bookingsStore, addBooking } from "@/lib/data/bookings";
import { courts } from "@/lib/data/courts";
import { Booking } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courtId = searchParams.get("courtId");
  const date = searchParams.get("date");

  let results = bookingsStore;
  if (courtId) results = results.filter((b) => b.courtId === courtId);
  if (date) results = results.filter((b) => b.date === date);

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courtId, playerIds, date, startTime, durationMinutes, notes } = body;

  if (!courtId || !playerIds || !date || !startTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const court = courts.find((c) => c.id === courtId);
  if (!court) return NextResponse.json({ error: "Court not found" }, { status: 404 });

  const endHour = parseInt(startTime.split(":")[0]) + Math.floor((durationMinutes ?? 60) / 60);
  const endTime = `${endHour.toString().padStart(2, "0")}:00`;

  // Check for conflicts
  const conflict = bookingsStore.some(
    (b) =>
      b.courtId === courtId &&
      b.date === date &&
      b.status !== "cancelled" &&
      b.startTime < endTime &&
      b.endTime > startTime
  );
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

  addBooking(booking);
  return NextResponse.json(booking, { status: 201 });
}
