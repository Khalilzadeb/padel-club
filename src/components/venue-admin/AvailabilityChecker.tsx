"use client";
import { useState } from "react";
import { Search, X, CheckCircle, User, Phone, Repeat } from "lucide-react";

interface Booking {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  booker_name?: string | null;
  booker_phone?: string | null;
  player_ids?: string[];
}

interface RecurringBooking {
  id: string;
  courtId: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  label: string | null;
}

interface Court {
  id: string;
  name: string;
  type: string;
  price_per_hour: number;
}

interface Props {
  courts: Court[];
  bookings: Booking[];
  recurringBookings: RecurringBooking[];
  onAddBooking: (courtId: string, date: string, startTime: string, durationMinutes: number, bookerName: string, bookerPhone: string) => void;
}

function timeToMins(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h < 8 ? h + 24 : h) * 60 + m;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pad(n: number) { return String(n).padStart(2, "0"); }

// 08:00–02:00 next day. 24=00:00, 25=01:00, 26=02:00
const ALL_HOURS = Array.from({ length: 19 }, (_, i) => i + 8);
function hourLabel(h: number) { const a = h >= 24 ? h - 24 : h; return `${pad(a)}:00`; }

// Returns the booking date string, adding 1 day if hour >= 24
function bookingDate(baseDate: string, hour: number): string {
  if (hour < 24) return baseDate;
  const d = new Date(baseDate);
  d.setDate(d.getDate() + 1);
  return toDateStr(d);
}

type CellStatus =
  | { type: "free" }
  | { type: "booked"; label: string; phone?: string | null; time: string; isPlayer: boolean; bookingId: string }
  | { type: "recurring"; label: string; time: string; recurringId: string };

export default function AvailabilityChecker({ courts, bookings, recurringBookings, onAddBooking }: Props) {
  const [open, setOpen] = useState(false);
  const nowH = new Date().getHours();
  const [date, setDate] = useState(toDateStr(new Date()));
  const [fromHour, setFromHour] = useState(Math.min(Math.max(nowH < 26 ? nowH + 1 : 8, 8), 25));
  const [toHour, setToHour] = useState(Math.min(Math.max(nowH < 24 ? nowH + 3 : 11, 9), 26));
  const [searched, setSearched] = useState(false);

  // Booking modal
  const [bookModal, setBookModal] = useState<{ courtId: string; courtName: string; hour: number } | null>(null);
  const [bookFromHour, setBookFromHour] = useState(8);
  const [bookToHour, setBookToHour] = useState(9);
  const [bookerName, setBookerName] = useState("");
  const [bookerPhone, setBookerPhone] = useState("");
  const [bookError, setBookError] = useState("");

  const effectiveTo = toHour > fromHour ? toHour : fromHour + 1;
  const rangeHours = Array.from({ length: effectiveTo - fromHour }, (_, i) => fromHour + i);

  function getCellStatus(courtId: string, hour: number): CellStatus {
    const slotStart = hour * 60;
    const slotEnd = slotStart + 60;

    const booking = bookings.find((b) => {
      if (b.court_id !== courtId || b.date !== date) return false;
      const s = timeToMins(b.start_time);
      const e = s + b.duration_minutes;
      return s < slotEnd && e > slotStart;
    });
    if (booking) {
      const isPlayer = !!(booking.player_ids && booking.player_ids.length > 0);
      return {
        type: "booked",
        label: isPlayer ? "Oyunçu" : (booking.booker_name ?? "Bron"),
        phone: booking.booker_phone,
        time: `${booking.start_time}–${booking.end_time}`,
        isPlayer,
        bookingId: booking.id,
      };
    }

    const jsDay = new Date(date).getDay();
    const rec = recurringBookings.find((r) => {
      if (r.courtId !== courtId || r.dayOfWeek !== jsDay) return false;
      const s = timeToMins(r.startTime);
      const e = s + r.durationMinutes;
      return s < slotEnd && e > slotStart;
    });
    if (rec) {
      const endM = timeToMins(rec.startTime) + rec.durationMinutes;
      return {
        type: "recurring",
        label: rec.label ?? "Recurring",
        time: `${rec.startTime}–${pad(Math.floor(endM / 60))}:${pad(endM % 60)}`,
        recurringId: rec.id,
      };
    }

    return { type: "free" };
  }

  function checkConflict(courtId: string, bFrom: number, bTo: number): string | null {
    const rangeStart = bFrom * 60;
    const rangeEnd = bTo * 60;
    const b = bookings.find((b) => {
      if (b.court_id !== courtId || b.date !== date) return false;
      const s = timeToMins(b.start_time);
      const e = s + b.duration_minutes;
      return s < rangeEnd && e > rangeStart;
    });
    if (b) return `${b.start_time}–${b.end_time} arası artıq "${b.booker_name ?? "oyunçu"}" tərəfindən bron edilib`;
    const jsDay = new Date(date).getDay();
    const r = recurringBookings.find((r) => {
      if (r.courtId !== courtId || r.dayOfWeek !== jsDay) return false;
      const s = timeToMins(r.startTime);
      const e = s + r.durationMinutes;
      return s < rangeEnd && e > rangeStart;
    });
    if (r) return `Bu saatda recurring booking var: "${r.label ?? "Recurring"}"`;
    return null;
  }

  const openBookModal = (courtId: string, courtName: string, hour: number) => {
    setBookModal({ courtId, courtName, hour });
    setBookFromHour(hour);
    setBookToHour(Math.min(hour + 1, 26));
    setBookerName("");
    setBookerPhone("");
    setBookError("");
  };

  const handleConfirmBooking = () => {
    if (!bookModal) return;
    if (bookToHour <= bookFromHour) { setBookError("Bitmə saatı başlama saatından böyük olmalıdır"); return; }
    const conflict = checkConflict(bookModal.courtId, bookFromHour, bookToHour);
    if (conflict) { setBookError(conflict); return; }
    const actualDate = bookingDate(date, bookFromHour);
    const startTime = hourLabel(bookFromHour);
    onAddBooking(bookModal.courtId, actualDate, startTime, (bookToHour - bookFromHour) * 60, bookerName, bookerPhone);
    setBookModal(null);
    setTimeout(() => setSearched(true), 150);
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSearched(false); }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:border-padel-green hover:text-padel-green transition-colors shadow-sm"
      >
        <Search className="w-4 h-4" /> Boş kort tap
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 px-2 pt-12 pb-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-padel-green" /> Boş kort tap
              </h3>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Search form */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tarix</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setSearched(false); }}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Başlama</label>
                  <select
                    value={fromHour}
                    onChange={(e) => { setFromHour(Number(e.target.value)); setSearched(false); }}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  >
                    {ALL_HOURS.slice(0, -1).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bitmə</label>
                  <select
                    value={effectiveTo}
                    onChange={(e) => { setToHour(Number(e.target.value)); setSearched(false); }}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  >
                    {ALL_HOURS.filter((h) => h > fromHour).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => setSearched(true)}
                  className="px-5 py-2 bg-padel-green text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Axtar
                </button>
              </div>
            </div>

            {/* Grid */}
            {searched && (
              <div className="p-5 overflow-x-auto">
                <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> Boş — klikləyin</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" /> Bron edilib</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" /> Recurring</span>
                </div>

                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 bg-gray-50 rounded-tl-xl border border-gray-100 text-gray-500 font-medium w-28">Kort</th>
                      {rangeHours.map((h) => (
                        <th key={h} className="px-2 py-2 bg-gray-50 border border-gray-100 text-center text-gray-600 font-semibold min-w-[80px]">
                          {hourLabel(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courts.map((court) => {
                      const skipped = new Set<number>();
                      return (
                        <tr key={court.id}>
                          <td className="px-3 py-2 border border-gray-100 bg-gray-50 font-medium text-gray-700 whitespace-nowrap">
                            {court.name}
                          </td>
                          {rangeHours.map((h) => {
                            if (skipped.has(h)) return null;
                            const cell = getCellStatus(court.id, h);

                            // Compute colSpan for non-free cells
                            let colSpan = 1;
                            if (cell.type !== "free") {
                              const cellId = cell.type === "booked" ? cell.bookingId : cell.recurringId;
                              for (let i = 1; i < rangeHours.length; i++) {
                                const nextH = h + i;
                                if (!rangeHours.includes(nextH)) break;
                                const next = getCellStatus(court.id, nextH);
                                const nextId = next.type === "booked" ? next.bookingId : next.type === "recurring" ? next.recurringId : null;
                                if (nextId === cellId) {
                                  colSpan++;
                                  skipped.add(nextH);
                                } else {
                                  break;
                                }
                              }
                            }

                            return (
                              <td
                                key={h}
                                colSpan={colSpan}
                                onClick={() => cell.type === "free" && openBookModal(court.id, court.name, h)}
                                className={`border border-gray-100 px-2 py-2 text-center align-middle transition-colors ${
                                  cell.type === "free"
                                    ? "bg-green-50 hover:bg-green-100 cursor-pointer"
                                    : cell.type === "recurring"
                                    ? "bg-blue-50"
                                    : "bg-red-50"
                                }`}
                              >
                                {cell.type === "free" && (
                                  <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                                )}
                                {cell.type === "booked" && (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center justify-center gap-1 text-red-700 font-medium">
                                      <User className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate max-w-[70px]">{cell.label}</span>
                                    </div>
                                    {cell.phone && !cell.isPlayer && (
                                      <div className="flex items-center justify-center gap-1 text-red-500">
                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate max-w-[70px]">{cell.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {cell.type === "recurring" && (
                                  <div className="flex items-center justify-center gap-1 text-blue-700">
                                    <Repeat className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[70px]">{cell.label}</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!searched && (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                Tarix və saat aralığı seçib "Axtar" düyməsinə bas
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking modal */}
      {bookModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Bron et</h3>
              <button onClick={() => setBookModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{bookModal.courtName} · {date}</p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Başlama</label>
                  <select
                    value={bookFromHour}
                    onChange={(e) => { setBookFromHour(Number(e.target.value)); setBookError(""); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  >
                    {ALL_HOURS.slice(0, -1).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bitmə</label>
                  <select
                    value={bookToHour}
                    onChange={(e) => { setBookToHour(Number(e.target.value)); setBookError(""); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  >
                    {ALL_HOURS.filter((h) => h > bookFromHour).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                  </select>
                </div>
              </div>

              {bookError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                  ⚠️ {bookError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  placeholder="Rəşad Əliyev"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={bookerPhone}
                  onChange={(e) => setBookerPhone(e.target.value)}
                  placeholder="+994 50 000 00 00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setBookModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Ləğv et
              </button>
              <button onClick={handleConfirmBooking} className="flex-1 py-2.5 rounded-xl bg-padel-green text-white text-sm font-medium hover:bg-green-700">
                Bron et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
