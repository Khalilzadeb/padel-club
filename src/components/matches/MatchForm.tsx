"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Player, Court, SetScore } from "@/lib/types";
import { Plus, Minus } from "lucide-react";

interface MatchFormProps {
  players: Player[];
  courts: Court[];
  onSubmit: (data: {
    courtId: string;
    type: "casual" | "ranked";
    team1PlayerIds: [string, string];
    team2PlayerIds: [string, string];
    sets: SetScore[];
    date: string;
    startTime: string;
  }) => void;
  onClose: () => void;
}

export default function MatchForm({ players, courts, onSubmit, onClose }: MatchFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [type, setType] = useState<"casual" | "ranked">("ranked");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [t1p1, setT1p1] = useState(players[0]?.id ?? "");
  const [t1p2, setT1p2] = useState(players[2]?.id ?? "");
  const [t2p1, setT2p1] = useState(players[4]?.id ?? "");
  const [t2p2, setT2p2] = useState(players[6]?.id ?? "");
  const [sets, setSets] = useState<SetScore[]>([{ setNumber: 1, team1Games: 6, team2Games: 3 }]);

  const addSet = () => {
    setSets([...sets, { setNumber: sets.length + 1, team1Games: 6, team2Games: 3 }]);
  };

  const removeSet = (i: number) => {
    if (sets.length === 1) return;
    setSets(sets.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, setNumber: idx + 1 })));
  };

  const updateSet = (i: number, key: "team1Games" | "team2Games", val: number) => {
    setSets(sets.map((s, idx) => idx === i ? { ...s, [key]: Math.max(0, Math.min(7, val)) } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ courtId, type, team1PlayerIds: [t1p1, t1p2], team2PlayerIds: [t2p1, t2p2], sets, date, startTime });
    onClose();
  };

  const playerSelect = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
    >
      {players.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "casual" | "ranked")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
          >
            <option value="ranked">Ranked</option>
            <option value="casual">Casual</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Team 1</p>
          <div className="space-y-2">
            {playerSelect(t1p1, setT1p1)}
            {playerSelect(t1p2, setT1p2)}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">Team 2</p>
          <div className="space-y-2">
            {playerSelect(t2p1, setT2p1)}
            {playerSelect(t2p2, setT2p2)}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sets</p>
          <Button type="button" variant="ghost" size="sm" onClick={addSet} disabled={sets.length >= 3}>
            <Plus className="w-3.5 h-3.5" /> Add Set
          </Button>
        </div>
        <div className="space-y-2">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500 w-12">Set {s.setNumber}</span>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="7" value={s.team1Games}
                  onChange={(e) => updateSet(i, "team1Games", +e.target.value)}
                  className="w-14 text-center border border-gray-200 rounded px-2 py-1 text-sm" />
                <span className="text-gray-400">–</span>
                <input type="number" min="0" max="7" value={s.team2Games}
                  onChange={(e) => updateSet(i, "team2Games", +e.target.value)}
                  className="w-14 text-center border border-gray-200 rounded px-2 py-1 text-sm" />
              </div>
              {sets.length > 1 && (
                <button type="button" onClick={() => removeSet(i)} className="text-red-400 hover:text-red-600 ml-auto">
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">Save Match</Button>
      </div>
    </form>
  );
}
