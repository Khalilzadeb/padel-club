"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { Player } from "@/lib/types";
import { Save, X } from "lucide-react";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eloValue, setEloValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        const all: Player[] = Array.isArray(data)
          ? data.map((d: { player: Player }) => d.player)
          : [];
        setPlayers(all.sort((a, b) => b.stats.eloRating - a.stats.eloRating));
        setLoading(false);
      });
  }, []);

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEloValue(String(player.stats.eloRating));
  };

  const saveElo = async (playerId: string) => {
    const elo = parseInt(eloValue);
    if (isNaN(elo) || elo < 0) return;
    setSaving(true);
    const res = await fetch(`/api/admin/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eloRating: elo }),
    });
    setSaving(false);
    if (res.ok) {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? { ...p, stats: { ...p.stats, eloRating: elo } }
            : p
        )
      );
      setEditingId(null);
    }
  };

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Players</h1>
        <p className="text-sm text-gray-500">{players.length} total</p>
      </div>

      <input
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green mb-4"
        placeholder="Search players..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((player, idx) => (
            <Card key={player.id} className="p-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-5 text-center flex-shrink-0">
                  {idx + 1}
                </span>
                <Avatar name={player.name} imageUrl={player.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{player.name}</p>
                  <p className="text-xs text-gray-500">{player.level} · {player.stats.matchesPlayed} matches</p>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === player.id ? (
                    <>
                      <input
                        type="number"
                        className="w-20 border border-padel-green rounded-lg px-2 py-1 text-sm text-center focus:outline-none"
                        value={eloValue}
                        onChange={(e) => setEloValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveElo(player.id); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus
                      />
                      <button onClick={() => saveElo(player.id)} disabled={saving} className="text-padel-green hover:text-green-700">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(player)}
                      className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      {player.stats.eloRating} ELO
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
