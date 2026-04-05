"use client";
import { useState } from "react";
import { Search, X, CheckCircle, XCircle, Repeat, User, Phone, Plus } from "lucide-react";

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
  return h * 60 + m;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08–22

export default function AvailabilityChecker({ courts, bookings, recurringBookings, onAddBooking }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(toDateStr(new Date()));
  const nowH = new Date().getHours();
  const [fromHour, setFromHour] = useState(nowH < 22 ? nowH + 1 : 19);
  const [toHour, setToHour] = useState(nowH < 21 ? nowH + 2 : 20);
  const [searched, setSearched] = useState(false);

  const [bookingCourtId, setBookingCourtId] = useState<string | null>(null);
  const [bookerName, setBookerName] = useState("");
  const [bookerPhone, setBookerPhone] = useState("");
  const [bookFromHour, setBookFromHour] = useState(fromHour);
  const [bookToHour, setBookToHour] = useState(fromHour + 1);
  const [bookingError, setBookingError] = useState("");

  // Auto-fix: toHour must be > fromHour
  const effectiveToHour = toHour > fromHour ? toHour : fromHour + 1;
  const durationMins = (effectiveToHour - fromHour) * 60;

  type ConflictInfo = {
    label: string;
    phone?: string | null;
    time: string;
    type: "booked" | "recurring";
  };

  function getCourtStatus(court: Court): { status: "free" } | { status: "partial" | "blocked"; conflicts: ConflictInfo[] } {
    const rangeStart = fromHour * 60;
    const rangeEnd = effectiveToHour * 60;
    const conflicts: ConflictInfo[] = [];

    // Regular bookings overlapping the range
    bookings.forEach((b) => {
      if (b.court_id !== court.id || b.date !== date) return;
      const start = timeToMins(b.start_time);
      const end = start + b.duration_minutes;
      if (start < rangeEnd && end > rangeStart) {
        const isPlayer = b.player_ids && b.player_ids.length > 0;
        conflicts.push({
          type: "booked",
          label: isPlayer ? "Oyunçu booking" : (b.booker_name ?? "Booked"),
          phone: b.booker_phone,
          time: `${b.start_time} – ${b.end_time}`,
        });
      }
    });

    // Recurring bookings overlapping the range
    const jsDay = new Date(date).getDay();
    recurringBookings.forEach((r) => {
      if (r.courtId !== court.id || r.dayOfWeek !== jsDay) return;
      const start = timeToMins(r.startTime);
      const end = start + r.durationMinutes;
      if (start < rangeEnd && end > rangeStart) {
        const endMins = start + r.durationMinutes;
        const endStr = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
        conflicts.push({
          type: "recurring",
          label: r.label ?? "Recurring booking",
          time: `${r.startTime} – ${endStr}`,
        });
      }
    });

    if (conflicts.length === 0) return { status: "free" };
    // Check if entire range is blocked or just part of it
    const totalBlockedMins = conflicts.reduce((sum, _) => sum + 60, 0); // rough
    return { status: totalBlockedMins >= durationMins ? "blocked" : "partial", conflicts };
  }

  const results = searched ? courts.map((c) => ({ court: c, ...getCourtStatus(c) })) : [];
  const freeCount = results.filter((r) => r.status === "free").length;

  const handleSearch = () => {
    if (effectiveToHour <= fromHour) return;
    setSearched(true);
    setBookingCourtId(null);
  };

  function checkConflict(courtId: string, bFrom: number, bTo: number): string | null {
    const rangeStart = bFrom * 60;
    const rangeEnd = bTo * 60;

    const conflictBooking = bookings.find((b) => {
      if (b.court_id !== courtId || b.date !== date) return false;
      const start = timeToMins(b.start_time);
      const end = start + b.duration_minutes;
      return start < rangeEnd && end > rangeStart;
    });
    if (conflictBooking) {
      const who = conflictBooking.booker_name ?? "Oyunçu";
      return `${conflictBooking.start_time}–${conflictBooking.end_time} arası artıq "${who}" tərəfindən bron edilib`;
    }

    const jsDay = new Date(date).getDay();
    const conflictRecurring = recurringBookings.find((r) => {
      if (r.courtId !== courtId || r.dayOfWeek !== jsDay) return false;
      const start = timeToMins(r.startTime);
      const end = start + r.durationMinutes;
      return start < rangeEnd && end > rangeStart;
    });
    if (conflictRecurring) {
      return `Bu saatda recurring booking var: "${conflictRecurring.label ?? "Recurring"}"`;
    }

    return null;
  }

  const handleAddBooking = () => {
    if (!bookingCourtId) return;
    if (bookToHour <= bookFromHour) {
      setBookingError("Bitmə saatı başlama saatından böyük olmalıdır");
      return;
    }
    const conflict = checkConflict(bookingCourtId, bookFromHour, bookToHour);
    if (conflict) {
      setBookingError(conflict);
      return;
    }
    const bookDuration = (bookToHour - bookFromHour) * 60;
    onAddBooking(
      bookingCourtId,
      date,
      `${String(bookFromHour).padStart(2, "0")}:00`,
      bookDuration,
      bookerName,
      bookerPhone
    );
    setBookingCourtId(null);
    setBookerName("");
    setBookerPhone("");
    setBookingError("");
    setTimeout(() => setSearched(true), 150);
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSearched(false); setBookingCourtId(null); }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:border-padel-green hover:text-padel-green transition-colors shadow-sm"
      >
        <Search className="w-4 h-4" />
        Boş kort tap
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 px-4 pt-16 pb-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
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
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tarix</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setSearched(false); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Başlama</label>
                  <select
                    value={fromHour}
                    onChange={(e) => { setFromHour(Number(e.target.value)); setSearched(false); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  >
                    {HOURS.slice(0, -1).map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bitmə</label>
                  <select
                    value={effectiveToHour}
                    onChange={(e) => { setToHour(Number(e.target.value)); setSearched(false); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  >
                    {HOURS.filter((h) => h > fromHour).map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="mt-3 w-full py-2.5 bg-padel-green text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Axtar — {durationMins} dəqiqə ({durationMins / 60} saat)
              </button>
            </div>

            {/* Results */}
            {searched && (
              <div className="px-5 py-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  <span className="font-semibold text-gray-700">
                    {date} · {String(fromHour).padStart(2, "0")}:00 – {String(effectiveToHour).padStart(2, "0")}:00
                  </span>
                  {" "}— <span className="text-green-600 font-medium">{freeCount} boş</span>, <span className="text-red-500 font-medium">{results.length - freeCount} dolu</span>
                </p>

                {results.map(({ court, status, ...info }) => (
                  <div key={court.id}>
                    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${
                      status === "free"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}>
                      {status === "free"
                        ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      }

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{court.name}</p>
                        {status === "free" && (
                          <p className="text-xs text-green-600">Boşdur · ₼{(court.price_per_hour * durationMins / 60).toFixed(0)} ({durationMins / 60} saat)</p>
                        )}
                        {"conflicts" in info && info.conflicts.map((c: ConflictInfo, i: number) => (
                          <div key={i} className="mt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {c.type === "recurring"
                                ? <Repeat className="w-3 h-3 text-blue-500" />
                                : <User className="w-3 h-3 text-red-400" />
                              }
                              <span className="text-xs text-red-700 font-medium">{c.label}</span>
                              {c.phone && (
                                <a href={`tel:${c.phone}`} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                                  <Phone className="w-3 h-3" />{c.phone}
                                </a>
                              )}
                              <span className="text-xs text-gray-400">{c.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {status === "free" && (
                        <button
                          onClick={() => { setBookingCourtId(court.id); setBookerName(""); setBookerPhone(""); setBookingError(""); setBookFromHour(fromHour); setBookToHour(effectiveToHour); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-padel-green text-white rounded-lg text-xs font-medium hover:bg-green-700 flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Book et
                        </button>
                      )}
                    </div>

                    {bookingCourtId === court.id && (
                      <div className="mx-2 mt-1 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                        <p className="text-xs font-semibold text-gray-700">{court.name} · {date}</p>

                        {/* Time range for booking */}
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Başlama</label>
                            <select
                              value={bookFromHour}
                              onChange={(e) => { setBookFromHour(Number(e.target.value)); setBookingError(""); }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white"
                            >
                              {HOURS.slice(0, -1).map((h) => (
                                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Bitmə</label>
                            <select
                              value={bookToHour}
                              onChange={(e) => { setBookToHour(Number(e.target.value)); setBookingError(""); }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white"
                            >
                              {HOURS.filter((h) => h > bookFromHour).map((h) => (
                                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Error */}
                        {bookingError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                            ⚠️ {bookingError}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Ad Soyad</label>
                            <input
                              type="text"
                              value={bookerName}
                              onChange={(e) => setBookerName(e.target.value)}
                              placeholder="Rəşad Əliyev"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Telefon</label>
                            <input
                              type="tel"
                              value={bookerPhone}
                              onChange={(e) => setBookerPhone(e.target.value)}
                              placeholder="+994 50 000 00 00"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setBookingCourtId(null); setBookingError(""); }} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-100">
                            Ləğv et
                          </button>
                          <button onClick={handleAddBooking} className="flex-1 py-2 rounded-lg bg-padel-green text-white text-sm font-medium hover:bg-green-700">
                            Təsdiqlə
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!searched && (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                Tarix və saat aralığı seçib "Axtar" düyməsinə bas
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
