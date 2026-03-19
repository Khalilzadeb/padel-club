import StatCard from "@/components/ui/StatCard";
import { Users, LayoutGrid, Swords, Trophy } from "lucide-react";
import { getPlayers } from "@/lib/data/players";
import { getCourts } from "@/lib/data/courts";
import { getMatches } from "@/lib/data/matches";
import { getTournaments } from "@/lib/data/tournaments";

export default async function QuickStats() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fromDate = sevenDaysAgo.toISOString().split("T")[0];

  const [players, courts, weekMatches, tournaments] = await Promise.all([
    getPlayers(),
    getCourts(),
    getMatches({ from: fromDate }),
    getTournaments(),
  ]);

  const activeTournaments = tournaments.filter((t) => t.status === "active" || t.status === "registration").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Members" value={players.length} icon={<Users className="w-5 h-5" />} color="green" trend={{ value: "2 this month", up: true }} />
      <StatCard label="Active Courts" value={courts.filter((c) => c.isActive).length} icon={<LayoutGrid className="w-5 h-5" />} color="blue" />
      <StatCard label="Matches This Week" value={weekMatches.length} icon={<Swords className="w-5 h-5" />} color="purple" trend={{ value: "vs last week", up: true }} />
      <StatCard label="Active Tournaments" value={activeTournaments} icon={<Trophy className="w-5 h-5" />} color="orange" />
    </div>
  );
}
