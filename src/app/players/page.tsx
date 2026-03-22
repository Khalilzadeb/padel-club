"use client";
import { useState, useEffect } from "react";
import LeaderboardTable from "@/components/players/LeaderboardTable";
import PlayerCard from "@/components/players/PlayerCard";
import Card from "@/components/ui/Card";
import { Player, PlayerLevel, PlayerPosition } from "@/lib/types";
import { Search, X, SlidersHorizontal } from "lucide-react";

const levels: PlayerLevel[] = ["pro", "advanced", "intermediate", "beginner"];
const positions: PlayerPosition[] = ["drive", "revés", "flexible"];

type SortKey = "elo" | "winRate" | "matches" | "name";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "elo", label: "ELO" },
  { key: "winRate", label: "Win Rate" },
  { key: "matches", label: "Matches" },
  { key: "name", label: "Name" },
];

export default function PlayersPage() {
  const [tab, setTab] = useState<"leaderboard" | "all">("leaderboard");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<PlayerLevel | "all">("all");
  const [positionFilter, setPositionFilter] = useState<PlayerPosition | "all">("all");
  const [eloMin, setEloMin] = useState("");
  const [eloMax, setEloMax] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("elo");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data: { player: Player }[]) => {
        setPlayers(data.map((d) => d.player));
        setLoading(false);
      });
  }, []);

  const hasActiveFilters = search || levelFilter !== "all" || positionFilter !== "all" || eloMin || eloMax;

  const clearFilters = () => {
    setSearch("");
    setLevelFilter("all");
    setPositionFilter("all");
    setEloMin("");
    setEloMax("");
  };

  const filtered = players
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => levelFilter === "all" || p.level === levelFilter)
    .filter((p) => positionFilter === "all" || p.position === positionFilter)
    .filter((p) => !eloMin || p.stats.eloRating >= parseInt(eloMin))
    .filter((p) => !eloMax || p.stats.eloRating <= parseInt(eloMax))
    .sort((a, b) => {
      if (sortBy === "elo") return b.stats.eloRating - a.stats.eloRating;
      if (sortBy === "winRate") {
        const aRate = a.stats.matchesPlayed ? a.stats.matchesWon / a.stats.matchesPlayed : 0;
        const bRate = b.stats.matchesPlayed ? b.stats.matchesWon / b.stats.matchesPlayed : 0;
        return bRate - aRate;
      }
      if (sortBy === "matches") return b.stats.matchesPlayed - a.stats.matchesPlayed;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Players</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{players.length} members · Rankings updated after every match</p>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-padel-green text-white border-padel-green"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && !showFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-4 space-y-4">
          {/* Level */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Level</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLevelFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${levelFilter === "all" ? "bg-padel-green text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
              >
                All
              </button>
              {levels.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${levelFilter === l ? "bg-padel-green text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Position</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPositionFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${positionFilter === "all" ? "bg-padel-green text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
              >
                All
              </button>
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${positionFilter === pos ? "bg-padel-green text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* ELO range */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">ELO Range</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={eloMin}
                onChange={(e) => setEloMin(e.target.value)}
                className="w-24 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="number"
                placeholder="Max"
                value={eloMax}
                onChange={(e) => setEloMax(e.target.value)}
                className="w-24 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          {(["leaderboard", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-padel-green text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {t === "leaderboard" ? "Leaderboard" : "All Players"}
            </button>
          ))}
        </div>

        {/* Sort (only for All Players tab) */}
        {tab === "all" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
            >
              {sortOptions.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Result count */}
      {!loading && (search || levelFilter !== "all" || positionFilter !== "all" || eloMin || eloMax) && (
        <p className="text-xs text-gray-400 mb-4">
          {filtered.length} player{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === "leaderboard" ? (
        <Card>
          <LeaderboardTable players={filtered} />
        </Card>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No players found</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-2 text-sm text-padel-green hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => <PlayerCard key={p.id} player={p} />)}
        </div>
      )}
    </div>
  );
}
