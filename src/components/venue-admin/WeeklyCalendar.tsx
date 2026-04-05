"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Repeat, Trash2, User, Phone, X } from "lucide-react";

interface Booking {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes?: string | null;
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
}

interface Props {
  courts: Court[];
  bookings: Booking[];
  recurringBookings: RecurringBooking[];
  onAddBooking: (courtId: string, date: string, startTime: string, durationMinutes: number, bookerName: string, bookerPhone: string) => void;
  onDeleteBooking: (id: string) => void;
  onDeleteRecurring: (id: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 – 22:00
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_AZ = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şnb", "Baz"];

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function timeToMins(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function WeeklyCalendar({
  courts,
  bookings,
  recurringBookings,
  onAddBooking,
  onDeleteBooking,
  onDeleteRecurring,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState(courts[0]?.id ?? "");
  const [addModal, setAddModal] = useState<{ date: string; startTime: string } | null>(null);
  const [bookerName, setBookerName] = useState("");
  const [bookerPhone, setBookerPhone] = useState("");
  const [addDuration, setAddDuration] = useState(90);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [rDay, setRDay] = useState(1);
  const [rTime, setRTime] = useState("19:00");
  const [rDuration, setRDuration] = useState(90);
  const [rLabel, setRLabel] = useState("");

  const weekDates = getWeekDates(weekOffset);
  const court = courts.find((c) => c.id === selectedCourt);

  const courtBookings = bookings.filter((b) => b.court_id === selectedCourt);
  const courtRecurring = recurringBookings.filter((r) => r.courtId === selectedCourt);

  type SlotInfo =
    | { type: "booking"; id: string; label: string; booking: Booking }
    | { type: "recurring"; id: string; label: string };

  function getSlot(date: Date, hour: number): SlotInfo | null {
    const dateStr = toDateStr(date);
    const slotMins = hour * 60;

    const booking = courtBookings.find((b) => {
      if (b.date !== dateStr) return false;
      const start = timeToMins(b.start_time);
      const end = start + b.duration_minutes;
      return slotMins >= start && slotMins < end;
    });
    if (booking) {
      const isPlayerBooking = booking.player_ids && booking.player_ids.length > 0;
      let label = "Booked";
      if (isPlayerBooking) {
        label = "Oyunçu booking";
      } else if (booking.booker_name && booking.booker_phone) {
        label = `${booking.booker_name} · ${booking.booker_phone}`;
      } else if (booking.booker_name) {
        label = booking.booker_name;
      } else if (booking.booker_phone) {
        label = booking.booker_phone;
      }
      return { type: "booking", id: booking.id, label, booking };
    }

    const jsDay = date.getDay();
    const recurring = courtRecurring.find((r) => {
      if (r.dayOfWeek !== jsDay) return false;
      const start = timeToMins(r.startTime);
      const end = start + r.durationMinutes;
      return slotMins >= start && slotMins < end;
    });
    if (recurring) {
      return { type: "recurring", id: recurring.id, label: recurring.label ?? "Recurring" };
    }

    return null;
  }

  const handleSlotClick = (date: Date, hour: number) => {
    const slot = getSlot(date, hour);
    if (slot?.type === "booking") {
      // Show detail modal with booker info
      setDetailBooking(slot.booking);
      return;
    }
    if (slot?.type === "recurring") {
      onDeleteRecurring(slot.id);
      return;
    }
    setAddModal({ date: toDateStr(date), startTime: `${String(hour).padStart(2, "0")}:00` });
    setBookerName("");
    setBookerPhone("");
    setAddDuration(90);
  };

  const handleAddConfirm = () => {
    if (!addModal) return;
    onAddBooking(selectedCourt, addModal.date, addModal.startTime, addDuration, bookerName, bookerPhone);
    setAddModal(null);
  };

  return (
    <div className="space-y-4">
      {/* Court tabs */}
      <div className="flex gap-2 flex-wrap">
        {courts.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCourt(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              selectedCourt === c.id
                ? "bg-padel-green text-white border-padel-green"
                : "bg-white text-gray-600 border-gray-200 hover:border-padel-green"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">
            {weekDates[0].toLocaleDateString("az-AZ", { day: "numeric", month: "short" })} –{" "}
            {weekDates[6].toLocaleDateString("az-AZ", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-padel-green hover:underline mt-0.5">
              Bu həftəyə qayıt
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="w-12 px-2 py-2 text-gray-400 font-medium border-b border-r border-gray-100 bg-gray-50"></th>
              {weekDates.map((d, i) => {
                const isToday = toDateStr(d) === toDateStr(new Date());
                return (
                  <th key={i} className={`px-1 py-2 text-center font-medium border-b border-gray-100 ${isToday ? "bg-green-50 text-padel-green" : "bg-gray-50 text-gray-600"}`}>
                    <div>{DAY_LABELS_AZ[i]}</div>
                    <div className={`text-base font-bold ${isToday ? "text-padel-green" : "text-gray-800"}`}>{d.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="px-2 py-0 text-gray-400 text-right border-r border-gray-100 align-top pt-1 w-12">
                  {String(hour).padStart(2, "0")}:00
                </td>
                {weekDates.map((date, di) => {
                  const slot = getSlot(date, hour);
                  const isPast = toDateStr(date) < toDateStr(new Date()) ||
                    (toDateStr(date) === toDateStr(new Date()) && hour < new Date().getHours());
                  return (
                    <td
                      key={di}
                      onClick={() => handleSlotClick(date, hour)}
                      className={`border border-gray-100 h-10 cursor-pointer transition-colors text-center relative ${
                        slot?.type === "booking"
                          ? "bg-red-100 hover:bg-red-200"
                          : slot?.type === "recurring"
                          ? "bg-blue-100 hover:bg-blue-200"
                          : isPast
                          ? "bg-gray-50 cursor-default"
                          : "hover:bg-green-50"
                      }`}
                    >
                      {slot && (
                        <span className={`text-xs font-medium truncate px-1 ${slot.type === "recurring" ? "text-blue-700" : "text-red-700"}`}>
                          {slot.type === "recurring" && "↻ "}
                          {slot.label}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend + recurring button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" /> Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" /> Recurring</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" /> Available</span>
        </div>
        <button
          onClick={() => setShowRecurringModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <Repeat className="w-4 h-4" />
          Recurring booking əlavə et
        </button>
      </div>

      {/* Recurring bookings list */}
      {courtRecurring.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide flex items-center gap-1">
            <Repeat className="w-3.5 h-3.5" /> Recurring bookings — {court?.name}
          </p>
          <div className="space-y-2">
            {courtRecurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-100">
                <div>
                  <span className="text-sm font-medium text-gray-800">{DAYS[r.dayOfWeek === 0 ? 6 : r.dayOfWeek - 1]}</span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="text-sm text-gray-600">{r.startTime} · {r.durationMinutes} min</span>
                  {r.label && <><span className="text-gray-400 mx-1.5">·</span><span className="text-xs text-gray-500">{r.label}</span></>}
                </div>
                <button onClick={() => onDeleteRecurring(r.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking detail modal */}
      {detailBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Booking məlumatı</h3>
              <button onClick={() => setDetailBooking(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3 mb-5">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-0.5">Kort · Tarix · Saat</p>
                <p className="text-sm font-medium text-gray-800">
                  {court?.name} · {detailBooking.date} · {detailBooking.start_time} ({detailBooking.duration_minutes} min)
                </p>
              </div>
              {detailBooking.booker_name && (
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Ad Soyad</p>
                    <p className="text-sm font-medium text-gray-800">{detailBooking.booker_name}</p>
                  </div>
                </div>
              )}
              {detailBooking.booker_phone && (
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Telefon</p>
                    <a href={`tel:${detailBooking.booker_phone}`} className="text-sm font-medium text-padel-green hover:underline">
                      {detailBooking.booker_phone}
                    </a>
                  </div>
                </div>
              )}
              {!detailBooking.booker_name && !detailBooking.booker_phone && (
                <p className="text-sm text-gray-400 text-center py-2">Məlumat yoxdur</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { onDeleteBooking(detailBooking.id); setDetailBooking(null); }}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Sil
              </button>
              <button onClick={() => setDetailBooking(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add booking modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Booking əlavə et</h3>
              <button onClick={() => setAddModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {court?.name} · {addModal.date} · {addModal.startTime}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  placeholder="Məsələn: Rəşad Əliyev"
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Müddət</label>
                <div className="flex gap-2">
                  {[60, 90, 120].map((d) => (
                    <button
                      key={d}
                      onClick={() => setAddDuration(d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        addDuration === d ? "bg-padel-green text-white border-padel-green" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {d} dəq
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setAddModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Ləğv et
              </button>
              <button onClick={handleAddConfirm} className="flex-1 py-2.5 rounded-xl bg-padel-green text-white text-sm font-medium hover:bg-green-700">
                Əlavə et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add recurring modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-blue-600" /> Recurring Booking
              </h3>
              <button onClick={() => setShowRecurringModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{court?.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Həftənin günü</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d, i) => {
                    const jsDay = i === 6 ? 0 : i + 1;
                    return (
                      <button
                        key={d}
                        onClick={() => setRDay(jsDay)}
                        className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          rDay === jsDay ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Başlama saatı</label>
                <input
                  type="time"
                  value={rTime}
                  onChange={(e) => setRTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Müddət</label>
                <div className="flex gap-2">
                  {[60, 90, 120].map((d) => (
                    <button
                      key={d}
                      onClick={() => setRDuration(d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        rDuration === d ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {d} dəq
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ad (istəyə bağlı)</label>
                <input
                  type="text"
                  value={rLabel}
                  onChange={(e) => setRLabel(e.target.value)}
                  placeholder="Məsələn: Elçin qrupu"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowRecurringModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Ləğv et
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("addRecurring", {
                    detail: { courtId: selectedCourt, dayOfWeek: rDay, startTime: rTime, durationMinutes: rDuration, label: rLabel || null },
                  }));
                  setShowRecurringModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Əlavə et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
