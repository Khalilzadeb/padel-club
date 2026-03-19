"use client";
import { useState } from "react";
import { matchesStore, addMatch } from "@/lib/data/matches";
import { players } from "@/lib/data/players";
import { courts } from "@/lib/data/courts";
import MatchCard from "@/components/matches/MatchCard";
import MatchForm from "@/components/matches/MatchForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Plus, Search } from "lucide-react";
import { Match, SetScore } from "@/lib/types";

export default function MatchesPage() {
  const [matches, setMatches] = useState(matchesStore);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "casual" | "ranked" | "tournament">("all");

  const filtered = [...matches]
    .filter((m) => m.status === "completed")
    .filter((m) => typeFilter === "all" || m.type === typeFilter)
    .filter((m) => {
      if (!search) return true;
      const all = [...m.team1.playerIds, ...m.team2.playerIds]
        .map((id) => players.find((p) => p.id === id)?.name.toLowerCase() ?? "");
      return all.some((name) => name.includes(search.toLowerCase()));
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleSubmit = (data: {
    courtId: string;
    type: "casual" | "ranked";
    team1PlayerIds: [string, string];
    team2PlayerIds: [string, string];
    sets: SetScore[];
    date: string;
    startTime: string;
  }) => {
    // Determine winner by sets won
    const t1Sets = data.sets.filter((s) => s.team1Games > s.team2Games).length;
    const t2Sets = data.sets.filter((s) => s.team2Games > s.team1Games).length;
    const winnerId = t1Sets > t2Sets ? "team1" : "team2";

    const newMatch: Match = {
      id: `m${Date.now()}`,
      courtId: data.courtId,
      type: data.type,
      format: "best-of-3",
      status: "completed",
      team1: { playerIds: data.team1PlayerIds },
      team2: { playerIds: data.team2PlayerIds },
      sets: data.sets,
      winnerId,
      date: data.date,
      startTime: data.startTime,
      durationMinutes: 75,
    };
    addMatch(newMatch);
    setMatches([...matchesStore]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Match Results</h1>
          <p className="text-gray-500 mt-1">{matches.filter((m) => m.status === "completed").length} matches played</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Enter Score
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "casual", "ranked", "tournament"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                typeFilter === t ? "bg-padel-green text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No matches found</p>
          <p className="text-gray-300 text-sm mt-1">Try adjusting your filters or enter a new score</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Enter Score
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} players={players} courts={courts} />
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Enter Match Result" size="lg">
        <MatchForm players={players} courts={courts} onSubmit={handleSubmit} onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
