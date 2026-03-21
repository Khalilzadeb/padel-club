"use client";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import BookingCalendar from "@/components/bookings/BookingCalendar";
import { Court, Booking, OpenGame } from "@/lib/types";
import { MapPin, ChevronRight } from "lucide-react";

interface Props {
  courts: Court[];
  playerElo: number;
  existingGames: OpenGame[];
  onSubmit: (data: {
    courtId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    eloRange: string;
    courtBookingStatus: "booked" | "not_booked";
    notes?: string;
  }) => void;
  onClose: () => void;
}

const DURATIONS = [
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "120 min", value: 120 },
];

export default function OpenGameForm({ courts, playerElo, existingGames, onSubmit, onClose }: Props) {
  // Step 1 — location + court
  const locations = [...new Set(courts.map((c) => c.location).filter(Boolean) as string[])];
  const [location, setLocation] = useState<string>(locations[0] ?? "");
  const [courtId, setCourtId] = useState("");

  // Step 2 — calendar
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Step 3 — details
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(90);
  const [eloRange, setEloRange] = useState("150");
  const [courtBookingStatus, setCourtBookingStatus] = useState<"booked" | "not_booked">("not_booked");
  const [notes, setNotes] = useState("");

  const locationCourts = courts.filter((c) => (location ? c.location === location : true));

  useEffect(() => {
    if (!courtId) return;
    setBookingsLoading(true);
    setSelectedDate("");
    setSelectedTime("");
    fetch(`/api/bookings?courtId=${courtId}`)
      .then((r) => r.json())
      .then((data) => {
        setBookings(data);
        setBookingsLoading(false);
      });
  }, [courtId]);

  // Convert existing open games to booking-like objects for calendar overlay
  const gameBookings: Booking[] = existingGames
    .filter((g) => g.courtId === courtId && g.status !== "cancelled" && g.status !== "completed" && g.courtBookingStatus === "booked")
    .map((g) => ({
      id: g.id,
      courtId: g.courtId,
      playerIds: g.playerIds,
      date: g.date,
      startTime: g.startTime,
      endTime: g.endTime,
      durationMinutes: g.durationMinutes,
      status: "confirmed" as const,
      createdAt: g.createdAt,
      totalPrice: 0,
    }));

  const allBookings = [...bookings, ...gameBookings];

  const selectedCourt = courts.find((c) => c.id === courtId);
  const eloRangeLabel =
    eloRange === "any"
      ? "Any ELO"
      : `${Math.max(100, playerElo - Number(eloRange))} – ${playerElo + Number(eloRange)} ELO`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ courtId, date: selectedDate, startTime: selectedTime, durationMinutes: duration, eloRange, courtBookingStatus, notes: notes.trim() || undefined });
    onClose();
  };

  const canShowCalendar = !!courtId;
  const canShowDetails = !!selectedDate && !!selectedTime;

  return (
    <div className="space-y-5">
      {/* Step 1 — Location */}
      {locations.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            <MapPin className="w-3.5 h-3.5 inline mr-1" />Location
          </label>
          <div className="flex gap-2 flex-wrap">
            {locations.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => { setLocation(loc); setCourtId(""); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  location === loc
                    ? "bg-padel-green text-white border-padel-green"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Court selection */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Select Court</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {locationCourts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCourtId(c.id)}
              className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all text-center ${
                courtId === c.id
                  ? "bg-padel-green text-white border-padel-green shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:border-padel-green hover:bg-green-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Calendar */}
      {canShowCalendar && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-600 mb-3 flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-padel-green" />
            Select a time slot for <span className="font-semibold text-gray-800">{selectedCourt?.name}</span>
          </p>
          {bookingsLoading ? (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <BookingCalendar
              courtId={courtId}
              bookings={allBookings}
              onSlotSelect={(date, time) => { setSelectedDate(date); setSelectedTime(time); }}
            />
          )}
        </div>
      )}

      {/* Step 3 — Details */}
      {canShowDetails && (
        <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 space-y-4">
          <div className="bg-green-50 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-padel-green font-bold text-lg">✓</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{selectedCourt?.name}</p>
              <p className="text-xs text-gray-500">
                {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at {selectedTime}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedDate(""); setSelectedTime(""); }}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Change
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDuration(value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    duration === value
                      ? "bg-padel-green text-white border-padel-green"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ELO Range <span className="text-gray-400 font-normal">— your ELO: {playerElo}</span>
            </label>
            <select
              value={eloRange}
              onChange={(e) => setEloRange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
            >
              <option value="any">Any ELO (open to all)</option>
              <option value="100">±100 ELO</option>
              <option value="150">±150 ELO</option>
              <option value="200">±200 ELO</option>
              <option value="300">±300 ELO</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">{eloRangeLabel}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Court Booking</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCourtBookingStatus("not_booked")}
                className={`py-3 px-3 rounded-xl text-sm border transition-all text-left ${
                  courtBookingStatus === "not_booked"
                    ? "bg-yellow-50 border-yellow-400 text-yellow-800 font-medium"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <p className="font-medium">⏳ Not booked yet</p>
                <p className="text-xs mt-0.5 opacity-70">Will book when 4 players join</p>
              </button>
              <button
                type="button"
                onClick={() => setCourtBookingStatus("booked")}
                className={`py-3 px-3 rounded-xl text-sm border transition-all text-left ${
                  courtBookingStatus === "booked"
                    ? "bg-green-50 border-green-400 text-green-800 font-medium"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <p className="font-medium">✅ Already booked</p>
                <p className="text-xs mt-0.5 opacity-70">Court is confirmed</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Friendly game, beginners welcome..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-padel-green"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Post Game</Button>
          </div>
        </form>
      )}

      {/* Cancel button when details not yet shown */}
      {!canShowDetails && (
        <div className="flex justify-end pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
