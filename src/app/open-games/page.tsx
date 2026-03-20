"use client";
import { useState, useEffect } from "react";
import OpenGameCard from "@/components/open-games/OpenGameCard";
import OpenGameForm from "@/components/open-games/OpenGameForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Plus, Users } from "lucide-react";
import { OpenGame, Player, Court } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export default function OpenGamesPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<OpenGame[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"open" | "all">("open");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const currentPlayer = players.find((p) => user?.playerId ? p.id === user.playerId : false);

  useEffect(() => {
    Promise.all([
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/courts").then((r) => r.json()),
    ]).then(([playersData, courtsData]) => {
      setPlayers(playersData.map((d: { player: Player }) => d.player));
      setCourts(courtsData);
      setLoading(false);
    });
  }, []);

  const loadGames = () => {
    const url = statusFilter === "open" ? "/api/open-games?status=open" : "/api/open-games";
    fetch(url).then((r) => r.json()).then(setGames);
  };

  useEffect(() => {
    loadGames();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCreate = async (data: {
    courtId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    eloRange: string;
    notes?: string;
  }) => {
    const res = await fetch("/api/open-games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      loadGames();
    } else {
      const err = await res.json();
      const msg = err.error === "No player profile linked to your account"
        ? "Your account is not linked to a player profile. Ask the admin to link your account."
        : (err.error ?? "Failed to create game");
      alert(msg);
    }
  };

  const handleAction = async (id: string, action: "join" | "leave" | "cancel") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/open-games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Action failed");
      }
      loadGames();
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = statusFilter === "open"
    ? games.filter((g) => g.status === "open" || g.status === "full")
    : games;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Find a Game</h1>
          <p className="text-gray-500 mt-1">Join an open game or post your own</p>
        </div>
        {user && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Post Game
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(["open", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-padel-green text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s === "open" ? "Active Games" : "All Games"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">No open games right now</p>
          {user ? (
            <>
              <p className="text-gray-300 text-sm mt-1">Be the first — post a game and find players</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> Post Game
              </Button>
            </>
          ) : (
            <p className="text-gray-300 text-sm mt-1">Sign in to post a game</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <OpenGameCard
              key={g.id}
              game={g}
              players={players}
              courts={courts}
              currentPlayerId={currentPlayer?.id}
              onJoin={(id) => handleAction(id, "join")}
              onLeave={(id) => handleAction(id, "leave")}
              onCancel={(id) => handleAction(id, "cancel")}
              loading={actionLoading}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Post an Open Game" size="md">
        <OpenGameForm
          courts={courts}
          playerElo={currentPlayer?.stats.eloRating ?? 1000}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
