import type { Booking } from "@/lib/types";

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export let bookingsStore: Booking[] = [
  {
    id: "b1",
    courtId: "c1",
    playerIds: ["p1", "p3", "p5", "p9"],
    date: fmt(today),
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    status: "confirmed",
    createdAt: addDays(today, -2).toISOString(),
    totalPrice: 6000,
  },
  {
    id: "b2",
    courtId: "c2",
    playerIds: ["p2", "p4"],
    date: fmt(today),
    startTime: "11:00",
    endTime: "12:00",
    durationMinutes: 60,
    status: "confirmed",
    createdAt: addDays(today, -1).toISOString(),
    totalPrice: 6000,
  },
  {
    id: "b3",
    courtId: "c3",
    playerIds: ["p6", "p7", "p8", "p12"],
    date: fmt(addDays(today, 1)),
    startTime: "16:00",
    endTime: "17:30",
    durationMinutes: 90,
    status: "confirmed",
    createdAt: today.toISOString(),
    totalPrice: 6000,
  },
  {
    id: "b4",
    courtId: "c1",
    playerIds: ["p1", "p2", "p3", "p4"],
    date: fmt(addDays(today, 2)),
    startTime: "10:00",
    endTime: "11:30",
    durationMinutes: 90,
    status: "confirmed",
    createdAt: today.toISOString(),
    totalPrice: 9000,
  },
  {
    id: "b5",
    courtId: "c5",
    playerIds: ["p1", "p2", "p5", "p9"],
    date: fmt(addDays(today, 3)),
    startTime: "18:00",
    endTime: "19:00",
    durationMinutes: 60,
    status: "confirmed",
    createdAt: today.toISOString(),
    totalPrice: 8000,
    notes: "Tournament warm-up",
  },
  {
    id: "b6",
    courtId: "c4",
    playerIds: ["p10", "p11"],
    date: fmt(addDays(today, 1)),
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    status: "confirmed",
    createdAt: today.toISOString(),
    totalPrice: 3500,
  },
  {
    id: "b7",
    courtId: "c2",
    playerIds: ["p5", "p9", "p6", "p8"],
    date: fmt(addDays(today, -1)),
    startTime: "14:00",
    endTime: "15:00",
    durationMinutes: 60,
    status: "confirmed",
    createdAt: addDays(today, -3).toISOString(),
    totalPrice: 6000,
  },
];

export const addBooking = (b: Booking) => { bookingsStore.push(b); };

export const cancelBooking = (id: string) => {
  const idx = bookingsStore.findIndex((b) => b.id === id);
  if (idx !== -1) bookingsStore[idx].status = "cancelled";
};
