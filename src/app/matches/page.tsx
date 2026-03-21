"use client";
import { useState, useEffect } from "react";
import MatchCard from "@/components/matches/MatchCard";
import MatchForm from "@/components/matches/MatchForm";
import OpenGameScoreForm from "@/components/open-games/OpenGameScoreForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Plus, Search, Trophy } from "lucide-react";
import { Match, Player, Court, SetScore, OpenGame } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "casual" | "ranked" | "tournament">("all");
  const [loading, setLoading] = useState(true);
  const [pendingGames, setPendingGames] = useState<OpenGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<OpenGame | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    if (!user?.playerId) return;
    Promise.all([
      fetch("/api/open-games?status=full").then((r) => r.json()),
      fetch("/api/open-games?status=pending_result").then((r) => r.json()),
    ]).then(([full, pending]) => {
      const all = [...full, ...pending] as OpenGame[];
      setPendingGames(all.filter((g) => g.playerIds.includes(user.playerId!) && !g.matchId));
    });
  }, [user?.playerId]);

  const refreshMatches = () => {
    fetch("/api/matches").then((r) => r.json()).then(setMatches);
  };

  const handleSubmitOpenGameScore = async (data: {
    team1PlayerIds: [string, string];
    team2PlayerIds: [string, string];
    sets: { setNumber: number; team1Games: number; team2Games: number }[];
  }) => {
    if (!selectedGame) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/open-games/${selectedGame.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_score", ...data }),
      });
      if (res.ok) {
        setSelectedGame(null);
        setPendingGames((prev) => prev.filter((g) => g.id !== selectedGame.id));
        refreshMatches();
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to submit score");
      }
    } finally {
      setActionLoading(false);
    }
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

      {pendingGames.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Open games ready for result entry
          </p>
          <div className="space-y-2">
            {pendingGames.map((g) => {
              const court = courts.find((c) => c.id === g.courtId);
              const gamePlayers = g.playerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];
              return (
                <div key={g.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-yellow-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {gamePlayers.map((p) => p.name.split(" ")[0]).join(", ")}
                    </p>
                    <p className="text-xs text-gray-500">{court?.name ?? g.courtId} · {g.date} at {g.startTime}</p>
                  </div>
                  <Button size="sm" onClick={() => setSelectedGame(g)} className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Enter Result
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      <Modal isOpen={!!selectedGame} onClose={() => setSelectedGame(null)} title="Enter Open Game Result" size="md">
        {selectedGame && user?.playerId && (
          <OpenGameScoreForm
            players={players.filter((p) => selectedGame.playerIds.includes(p.id))}
            currentPlayerId={user.playerId}
            onSubmit={handleSubmitOpenGameScore}
            onClose={() => setSelectedGame(null)}
          />
        )}
        {actionLoading && (
          <div className="flex justify-center py-4">
            <span className="w-6 h-6 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Modal>
    </div>
  );
}
