"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Court, PlayerLevel } from "@/lib/types";

interface Props {
  courts: Court[];
  onSubmit: (data: {
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    requiredLevel?: PlayerLevel;
    notes?: string;
  }) => void;
  onClose: () => void;
}

const levels: PlayerLevel[] = ["beginner", "intermediate", "advanced", "pro"];

export default function OpenGameForm({ courts, onSubmit, onClose }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [requiredLevel, setRequiredLevel] = useState<PlayerLevel | "">("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      courtId,
      date,
      startTime,
      endTime,
      requiredLevel: requiredLevel || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

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
          <label className="block text-xs font-medium text-gray-600 mb-1">Level (optional)</label>
          <select
            value={requiredLevel}
            onChange={(e) => setRequiredLevel(e.target.value as PlayerLevel | "")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
          >
            <option value="">Any level</option>
            {levels.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
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
