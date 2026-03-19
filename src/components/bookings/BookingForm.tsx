"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Player, Court } from "@/lib/types";

interface BookingFormProps {
  court: Court;
  date: string;
  startTime: string;
  players: Player[];
  onConfirm: (playerIds: string[], notes: string) => void;
  onCancel: () => void;
}

export default function BookingForm({ court, date, startTime, players, onConfirm, onCancel }: BookingFormProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const endTime = `${(parseInt(startTime.split(":")[0]) + 1).toString().padStart(2, "0")}:00`;
  const price = court.pricePerHour / 100;

  const toggle = (id: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{court.name}</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Date: <span className="font-medium text-gray-900">{date}</span></p>
          <p>Time: <span className="font-medium text-gray-900">{startTime} – {endTime}</span></p>
          <p>Price: <span className="font-bold text-padel-green">${price}/hour</span></p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Select Players (up to 4)</p>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`text-left p-2.5 rounded-lg border text-sm transition-all ${
                selectedPlayers.includes(p.id)
                  ? "border-padel-green bg-green-50 text-padel-green font-medium"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">{selectedPlayers.length}/4 selected</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Training session, bring extra balls..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button
          onClick={() => onConfirm(selectedPlayers, notes)}
          disabled={selectedPlayers.length === 0}
          className="flex-1"
        >
          Confirm Booking
        </Button>
      </div>
    </div>
  );
}
