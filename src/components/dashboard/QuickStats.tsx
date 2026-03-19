import StatCard from "@/components/ui/StatCard";
import { Users, LayoutGrid, Swords, Trophy } from "lucide-react";
import { players } from "@/lib/data/players";
import { courts } from "@/lib/data/courts";
import { matchesStore } from "@/lib/data/matches";
import { tournaments } from "@/lib/data/tournaments";

export default function QuickStats() {
  const today = new Date().toISOString().split("T")[0];
  const matchesThisWeek = matchesStore.filter((m) => {
    const d = new Date(m.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && m.status === "completed";
  }).length;

  const activeTournaments = tournaments.filter((t) => t.status === "active" || t.status === "registration").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Members"
        value={players.length}
        icon={<Users className="w-5 h-5" />}
        color="green"
        trend={{ value: "2 this month", up: true }}
      />
      <StatCard
        label="Active Courts"
        value={courts.filter((c) => c.isActive).length}
        icon={<LayoutGrid className="w-5 h-5" />}
        color="blue"
      />
      <StatCard
        label="Matches This Week"
        value={matchesThisWeek}
        icon={<Swords className="w-5 h-5" />}
        color="purple"
        trend={{ value: "vs last week", up: true }}
      />
      <StatCard
        label="Active Tournaments"
        value={activeTournaments}
        icon={<Trophy className="w-5 h-5" />}
        color="orange"
      />
    </div>
  );
}
