"use client";
import { useState, useEffect } from "react";
import MatchCard from "@/components/matches/MatchCard";
import MatchForm from "@/components/matches/MatchForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Plus, Search } from "lucide-react";
import { Match, Player, Court, SetScore } from "@/lib/types";

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "casual" | "ranked" | "tournament">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/matches").then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/courts").then((r) => r.json()),
    ]).then(([matchesData, playersData, courtsData]) => {
      setMatches(matchesData);
      setPlayers(playersData.map((d: { player: Player }) => d.player));
      setCourts(courtsData);
      setLoading(false);
    });
  }, []);

  const refreshMatches = () => {
    fetch("/api/matches").then((r) => r.json()).then(setMatches);
  };

  const filtered = [...matches]
    .filter((m) => typeFilter === "all" || m.type === typeFilter)
    .filter((m) => {
      if (!search) return true;
      const all = [...m.team1.playerIds, ...m.team2.playerIds]
        .map((id) => players.find((p) => p.id === id)?.name.toLowerCase() ?? "");
      return all.some((name) => name.includes(search.toLowerCase()));
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleSubmit = async (data: {
    courtId: string;
    type: "casual" | "ranked";
    team1PlayerIds: [string, string];
    team2PlayerIds: [string, string];
    sets: SetScore[];
    date: string;
    startTime: string;
  }) => {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courtId: data.courtId,
        type: data.type,
        team1PlayerIds: data.team1PlayerIds,
        team2PlayerIds: data.team2PlayerIds,
        sets: data.sets,
        date: data.date,
        startTime: data.startTime,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      refreshMatches();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Match Results</h1>
          <p className="text-gray-500 mt-1">{matches.length} matches played</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Enter Score
        </Button>
      </div>

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

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
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
