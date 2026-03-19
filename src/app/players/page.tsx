"use client";
import { useState, useEffect } from "react";
import LeaderboardTable from "@/components/players/LeaderboardTable";
import PlayerCard from "@/components/players/PlayerCard";
import Card from "@/components/ui/Card";
import { Player, PlayerLevel } from "@/lib/types";

const levels: PlayerLevel[] = ["pro", "advanced", "intermediate", "beginner"];

export default function PlayersPage() {
  const [tab, setTab] = useState<"leaderboard" | "all">("leaderboard");
  const [levelFilter, setLevelFilter] = useState<PlayerLevel | "all">("all");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data: { player: Player }[]) => {
        setPlayers(data.map((d) => d.player));
        setLoading(false);
      });
  }, []);

  const filtered = levelFilter === "all" ? players : players.filter((p) => p.level === levelFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Players</h1>
        <p className="text-gray-500 mt-1">{players.length} members · Rankings updated after every match</p>
      </div>

      <div className="flex gap-2 mb-6">
        {["leaderboard", "all"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-padel-green text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t === "leaderboard" ? "Leaderboard" : "All Players"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === "leaderboard" ? (
        <Card>
          <LeaderboardTable players={players} />
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setLevelFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                levelFilter === "all" ? "bg-padel-green text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              All Levels
            </button>
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                  levelFilter === l ? "bg-padel-green text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => <PlayerCard key={p.id} player={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
