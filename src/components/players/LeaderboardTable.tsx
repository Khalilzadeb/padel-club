import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { Player } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";

interface LeaderboardTableProps {
  players: Player[];
}

const levelVariant: Record<string, "green" | "blue" | "purple" | "gray"> = {
  pro: "purple",
  advanced: "blue",
  intermediate: "green",
  beginner: "gray",
};

function winRate(p: Player) {
  if (p.stats.matchesPlayed === 0) return 0;
  return Math.round((p.stats.matchesWon / p.stats.matchesPlayed) * 100);
}

export default function LeaderboardTable({ players }: LeaderboardTableProps) {
  const sorted = [...players].sort((a, b) => b.stats.eloRating - a.stats.eloRating);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Player</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Level</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ELO</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Win Rate</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Points</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Streak</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player, idx) => {
            const rank = idx + 1;
            const wr = winRate(player);
            const streak = player.stats.currentStreak;

            return (
              <tr key={player.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {rank <= 3 ? (
                      <Trophy className={`w-4 h-4 ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : "text-amber-600"}`} />
                    ) : (
                      <span className="text-sm font-medium text-gray-500 w-4 text-center">{rank}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Link href={`/players/${player.id}`} className="flex items-center gap-3 hover:text-padel-green">
                    <Avatar name={player.name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{player.name}</p>
                      <p className="text-xs text-gray-400">{player.stats.matchesPlayed} matches</p>
                    </div>
                  </Link>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <Badge variant={levelVariant[player.level]}>{player.level}</Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-bold text-gray-900">{player.stats.eloRating}</span>
                </td>
                <td className="py-3 px-4 text-right hidden md:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-padel-green h-1.5 rounded-full" style={{ width: `${wr}%` }} />
                    </div>
                    <span className="text-sm text-gray-700 w-10 text-right">{wr}%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right hidden lg:table-cell">
                  <span className="text-sm text-gray-700">{player.stats.rankingPoints}</span>
                </td>
                <td className="py-3 px-4 text-right hidden lg:table-cell">
                  <div className="flex items-center justify-end gap-1">
                    {streak > 0 ? (
                      <><TrendingUp className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600 font-medium">{streak}W</span></>
                    ) : streak < 0 ? (
                      <><TrendingDown className="w-3.5 h-3.5 text-red-500" /><span className="text-xs text-red-500 font-medium">{Math.abs(streak)}L</span></>
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
