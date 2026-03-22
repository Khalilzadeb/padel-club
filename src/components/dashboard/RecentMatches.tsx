import Link from "next/link";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { getMatches } from "@/lib/data/matches";
import { getPlayers } from "@/lib/data/players";
import { getCourts } from "@/lib/data/courts";
import { ArrowRight } from "lucide-react";

export default async function RecentMatches() {
  const [recent, players, courts] = await Promise.all([
    getMatches(),
    getPlayers(),
    getCourts(),
  ]);
  const top5 = recent.slice(0, 5);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Recent Matches</h2>
        <Link href="/matches" className="text-sm text-padel-green hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {top5.map((match) => {
          const t1 = match.team1.playerIds.map((id) => players.find((p) => p.id === id));
          const t2 = match.team2.playerIds.map((id) => players.find((p) => p.id === id));
          const court = courts.find((c) => c.id === match.courtId);
          const score = match.sets.map((s) => `${s.team1Games}-${s.team2Games}`).join(", ");

          return (
            <Link key={match.id} href={`/matches/${match.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex -space-x-2">
                  {t1.slice(0, 2).map((p) => p && <Avatar key={p.id} name={p.name} size="sm" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {t1.map((p) => p?.name.split(" ")[0]).join(" & ")}
                    {" vs "}
                    {t2.map((p) => p?.name.split(" ")[0]).join(" & ")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{court?.name} · {match.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{score}</p>
                  <Badge variant={match.type === "tournament" ? "purple" : match.type === "ranked" ? "blue" : "gray"}>{match.type}</Badge>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
