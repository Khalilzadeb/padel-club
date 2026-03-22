"use client";
import { useEffect, useState } from "react";
import { Swords, Check, X, Clock, ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Challenge, Player, Court } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const statusBadge: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-700" },
  declined: { label: "Declined", className: "bg-red-50 text-red-500" },
  expired: { label: "Cancelled", className: "bg-gray-100 text-gray-500" },
};

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/challenges").then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/courts").then((r) => r.json()),
    ]).then(([challengesData, playersData, courtsData]) => {
      setChallenges(Array.isArray(challengesData) ? challengesData : []);
      setPlayers(Array.isArray(playersData) ? playersData.map((d: { player: Player }) => d.player) : []);
      setCourts(Array.isArray(courtsData) ? courtsData : []);
      setLoading(false);
    });
  }, []);

  const handleAction = async (id: string, action: "accept" | "decline" | "cancel") => {
    setActionLoading(id + action);
    const res = await fetch(`/api/challenges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setChallenges((prev) => prev.map((c) =>
        c.id === id ? { ...c, status: action === "accept" ? "accepted" : action === "decline" ? "declined" : "expired" } : c
      ));
    }
    setActionLoading(null);
  };

  const incoming = challenges.filter((c) => c.challengedId === user?.playerId);
  const outgoing = challenges.filter((c) => c.challengerId === user?.playerId);
  const displayed = tab === "incoming" ? incoming : outgoing;

  const incomingPending = incoming.filter((c) => c.status === "pending").length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Swords className="w-6 h-6 text-padel-green" />
        <h1 className="text-2xl font-black text-gray-900">Challenges</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["incoming", "outgoing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors relative ${
              tab === t ? "bg-padel-green text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t === "incoming" ? "Incoming" : "Outgoing"}
            {t === "incoming" && incomingPending > 0 && (
              <span className="ml-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full inline-flex items-center justify-center">
                {incomingPending}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <Card className="p-12 text-center">
          <Swords className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">{tab === "incoming" ? "No challenges received yet" : "You haven't challenged anyone yet"}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayed.map((c) => {
            const otherPlayerId = tab === "incoming" ? c.challengerId : c.challengedId;
            const other = players.find((p) => p.id === otherPlayerId);
            const court = courts.find((co) => co.id === c.courtId);
            const badge = statusBadge[c.status];
            const isPending = c.status === "pending";

            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={other?.name ?? "?"} imageUrl={other?.avatarUrl ?? null} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{other?.name ?? "Unknown"}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                      <span className="text-xs text-gray-400 capitalize">{c.matchType}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {court?.name ?? c.courtId} · {c.proposedDate} at {c.proposedTime.slice(0, 5)}
                    </p>
                    {c.message && (
                      <p className="text-xs text-gray-400 mt-1 italic">"{c.message}"</p>
                    )}
                    <p className="text-[11px] text-gray-300 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(c.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  {isPending && tab === "incoming" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(c.id, "accept")}
                        disabled={!!actionLoading}
                        className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(c.id, "decline")}
                        disabled={!!actionLoading}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {isPending && tab === "outgoing" && (
                    <button
                      onClick={() => handleAction(c.id, "cancel")}
                      disabled={!!actionLoading}
                      className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  {!isPending && (
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
