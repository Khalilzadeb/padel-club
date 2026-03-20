"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Court } from "@/lib/types";

interface Props {
  courts: Court[];
  playerElo: number;
  onSubmit: (data: {
    courtId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    eloRange: string;
    notes?: string;
  }) => void;
  onClose: () => void;
}

const DURATIONS = [
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "120 min", value: 120 },
];

// Generate :00 and :30 time slots from 07:00 to 23:00
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 23; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 23) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export default function OpenGameForm({ courts, playerElo, onSubmit, onClose }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState(90);
  const [eloRange, setEloRange] = useState("150");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ courtId, date, startTime, durationMinutes: duration, eloRange, notes: notes.trim() || undefined });
    onClose();
  };

  const eloRangeLabel = eloRange === "any"
    ? "Any ELO"
    : `${Math.max(100, playerElo - Number(eloRange))} – ${playerElo + Number(eloRange)} ELO`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Court</label>
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
          >
            {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
          >
            {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="col-span-2">
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

        <div className="col-span-2">
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
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
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
  );
}
