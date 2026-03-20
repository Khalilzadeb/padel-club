"use client";
import { useState } from "react";
import { Player, SetScore } from "@/lib/types";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { Plus, Minus } from "lucide-react";

interface Props {
  players: Player[]; // exactly 4 players in the game
  currentPlayerId: string;
  onSubmit: (data: { team1PlayerIds: [string, string]; team2PlayerIds: [string, string]; sets: SetScore[] }) => void;
  onClose: () => void;
}

export default function OpenGameScoreForm({ players, currentPlayerId, onSubmit, onClose }: Props) {
  // Current player is always on team1 by default
  const others = players.filter((p) => p.id !== currentPlayerId);
  const [team1Partner, setTeam1Partner] = useState(others[0]?.id ?? "");
  const [sets, setSets] = useState<SetScore[]>([{ setNumber: 1, team1Games: 6, team2Games: 3 }]);

  const team2Players = players.filter((p) => p.id !== currentPlayerId && p.id !== team1Partner);

  const addSet = () => {
    if (sets.length >= 3) return;
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
    if (!team1Partner || team2Players.length < 2) return;
    onSubmit({
      team1PlayerIds: [currentPlayerId, team1Partner] as [string, string],
      team2PlayerIds: [team2Players[0].id, team2Players[1].id] as [string, string],
      sets,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Team assignment */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Your Team (Team 1)</p>
          <div className="space-y-2">
            {/* Current player — fixed */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg">
              <Avatar name={players.find(p => p.id === currentPlayerId)?.name ?? ""} size="sm" />
              <span className="text-xs font-medium text-gray-700 truncate">
                {players.find(p => p.id === currentPlayerId)?.name}
              </span>
            </div>
            {/* Partner select */}
            <select
              value={team1Partner}
              onChange={(e) => setTeam1Partner(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {others.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">Team 2</p>
          <div className="space-y-2">
            {team2Players.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg">
                <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                <span className="text-xs text-gray-700 truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sets (Team 1 — Team 2)</p>
          <Button type="button" variant="ghost" size="sm" onClick={addSet} disabled={sets.length >= 3}>
            <Plus className="w-3.5 h-3.5" /> Add Set
          </Button>
        </div>
        <div className="space-y-2">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500 w-10">Set {s.setNumber}</span>
              <input type="number" min="0" max="7" value={s.team1Games}
                onChange={(e) => updateSet(i, "team1Games", +e.target.value)}
                className="w-14 text-center border border-gray-200 rounded px-2 py-1 text-sm" />
              <span className="text-gray-400">–</span>
              <input type="number" min="0" max="7" value={s.team2Games}
                onChange={(e) => updateSet(i, "team2Games", +e.target.value)}
                className="w-14 text-center border border-gray-200 rounded px-2 py-1 text-sm" />
              {sets.length > 1 && (
                <button type="button" onClick={() => removeSet(i)} className="text-red-400 hover:text-red-600 ml-auto">
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1">Submit Result</Button>
      </div>
    </form>
  );
}
