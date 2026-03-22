import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { Player } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { eloToDisplayLevel, eloToLevelVariant } from "@/lib/elo";

interface LeaderboardTableProps {
  players: Player[];
}

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
          <tr className="border-b border-gray-100 dark:border-gray-700">
            <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
            <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Player</th>
            <th className="text-right py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ELO</th>
            <th className="text-right py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player, idx) => {
            const rank = idx + 1;
            const wr = winRate(player);
            const streak = player.stats.currentStreak;

            return (
              <tr key={player.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="py-3 px-2 sm:px-4">
                  <div className="flex items-center gap-1">
                    {rank <= 3 ? (
                      <Trophy className={`w-4 h-4 ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : "text-amber-600"}`} />
                    ) : (
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-4 text-center">{rank}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 sm:px-4">
                  <Link href={`/players/${player.id}`} className="flex items-center gap-2 sm:gap-3 hover:text-padel-green">
                    <Avatar name={player.name} imageUrl={player.avatarUrl} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{player.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge variant={eloToLevelVariant(player.stats.eloRating)} className="text-xs">Lv {eloToDisplayLevel(player.stats.eloRating)}</Badge>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{player.stats.matchesPlayed}m</span>
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-3 px-2 sm:px-4 text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{player.stats.eloRating}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{wr}%</span>
                    {streak > 0 ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{streak}W</span>
                    ) : streak < 0 ? (
                      <span className="text-xs text-red-500 font-medium flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{Math.abs(streak)}L</span>
                    ) : (
                      <Minus className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 sm:px-4 text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-padel-green h-1.5 rounded-full" style={{ width: `${wr}%` }} />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-10 text-right">{wr}%</span>
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
