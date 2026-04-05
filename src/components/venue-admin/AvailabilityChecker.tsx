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

export default function AvailabilityChecker({ courts, bookings, recurringBookings, onAddBooking }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(toDateStr(new Date()));
  const [hour, setHour] = useState(new Date().getHours() < 22 ? new Date().getHours() + 1 : 19);
  const [searched, setSearched] = useState(false);

  // Quick booking state
  const [bookingCourtId, setBookingCourtId] = useState<string | null>(null);
  const [bookerName, setBookerName] = useState("");
  const [bookerPhone, setBookerPhone] = useState("");
  const [duration, setDuration] = useState(60);

  const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

  function getCourtStatus(court: Court) {
    const slotMins = hour * 60;

    // Check regular bookings
    const booking = bookings.find((b) => {
      if (b.court_id !== court.id || b.date !== date) return false;
      const start = timeToMins(b.start_time);
      const end = start + b.duration_minutes;
      return slotMins >= start && slotMins < end;
    });
    if (booking) {
      return {
        status: "booked" as const,
        booking,
        label: booking.player_ids && booking.player_ids.length > 0
          ? "Oyunçu booking"
          : booking.booker_name ?? "Booked",
        phone: booking.booker_phone,
        time: `${booking.start_time} – ${booking.end_time}`,
      };
    }

    // Check recurring bookings
    const dateObj = new Date(date);
    const jsDay = dateObj.getDay();
    const recurring = recurringBookings.find((r) => {
      if (r.courtId !== court.id || r.dayOfWeek !== jsDay) return false;
      const start = timeToMins(r.startTime);
      const end = start + r.durationMinutes;
      return slotMins >= start && slotMins < end;
    });
    if (recurring) {
      const endMins = timeToMins(recurring.startTime) + recurring.durationMinutes;
      const endH = String(Math.floor(endMins / 60)).padStart(2, "0");
      const endM = String(endMins % 60).padStart(2, "0");
      return {
        status: "recurring" as const,
        label: recurring.label ?? "Recurring booking",
        time: `${recurring.startTime} – ${endH}:${endM}`,
      };
    }

    return { status: "free" as const };
  }

  const results = searched ? courts.map((c) => ({ court: c, ...getCourtStatus(c) })) : [];
  const freeCount = results.filter((r) => r.status === "free").length;

  const handleAddBooking = () => {
    if (!bookingCourtId) return;
    onAddBooking(
      bookingCourtId,
      date,
      `${String(hour).padStart(2, "0")}:00`,
      duration,
      bookerName,
      bookerPhone
    );
    setBookingCourtId(null);
    setBookerName("");
    setBookerPhone("");
    // Re-trigger search to refresh results
    setSearched(false);
    setTimeout(() => setSearched(true), 100);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setSearched(false); }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:border-padel-green hover:text-padel-green transition-colors shadow-sm"
      >
        <Search className="w-4 h-4" />
        Boş kort tap
      </button>

      {/* Modal */}
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
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tarix</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setSearched(false); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Saat</label>
                  <select
                    value={hour}
                    onChange={(e) => { setHour(Number(e.target.value)); setSearched(false); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => { setSearched(true); setBookingCourtId(null); }}
                  className="px-4 py-2 bg-padel-green text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Axtar
                </button>
              </div>
            </div>

            {/* Results */}
            {searched && (
              <div className="px-5 py-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  <span className="font-semibold text-gray-700">{date} · {String(hour).padStart(2, "0")}:00</span>
                  {" "}— {freeCount} boş, {results.length - freeCount} dolu kort
                </p>

                {results.map(({ court, status, ...info }) => (
                  <div key={court.id}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                        status === "free"
                          ? "bg-green-50 border-green-200"
                          : status === "booked"
                          ? "bg-red-50 border-red-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      {status === "free" ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : status === "recurring" ? (
                        <Repeat className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{court.name}</p>
                        {status === "free" && (
                          <p className="text-xs text-green-600">Boşdur · ₼{court.price_per_hour}/saat</p>
                        )}
                        {status === "booked" && "label" in info && (
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <User className="w-3 h-3" /> {info.label as string}
                            </span>
                            {"phone" in info && info.phone && (
                              <a href={`tel:${info.phone}`} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                                <Phone className="w-3 h-3" /> {info.phone as string}
                              </a>
                            )}
                            {"time" in info && <span className="text-xs text-gray-400">{info.time as string}</span>}
                          </div>
                        )}
                        {status === "recurring" && "label" in info && (
                          <p className="text-xs text-blue-600">
                            ↻ {info.label as string}{"time" in info && ` · ${info.time}`}
                          </p>
                        )}
                      </div>

                      {status === "free" && (
                        <button
                          onClick={() => { setBookingCourtId(court.id); setBookerName(""); setBookerPhone(""); setDuration(60); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-padel-green text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Book et
                        </button>
                      )}
                    </div>

                    {/* Inline quick booking form */}
                    {bookingCourtId === court.id && (
                      <div className="mx-2 mt-1 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                        <p className="text-xs font-medium text-gray-600">{court.name} · {date} · {String(hour).padStart(2, "0")}:00</p>
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
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Müddət</label>
                          <div className="flex gap-2">
                            {[60, 120].map((d) => (
                              <button
                                key={d}
                                onClick={() => setDuration(d)}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                  duration === d ? "bg-padel-green text-white border-padel-green" : "bg-white text-gray-600 border-gray-200"
                                }`}
                              >
                                {d} dəq
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setBookingCourtId(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-100">
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
                Tarix və saat seçib "Axtar" düyməsinə bas
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
