import Link from "next/link";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { Player } from "@/lib/types";

const levelVariant: Record<string, "green" | "blue" | "purple" | "gray"> = {
  pro: "purple",
  advanced: "blue",
  intermediate: "green",
  beginner: "gray",
};

interface PlayerCardProps { player: Player; }

export default function PlayerCard({ player }: PlayerCardProps) {
  const wr = player.stats.matchesPlayed
    ? Math.round((player.stats.matchesWon / player.stats.matchesPlayed) * 100)
    : 0;

  return (
    <Link href={`/players/${player.id}`}>
      <Card hover className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={player.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{player.name}</h3>
              <Badge variant={levelVariant[player.level]}>{player.level}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{player.position} · {player.hand}-handed</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{player.stats.eloRating}</p>
            <p className="text-xs text-gray-500">ELO</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{wr}%</p>
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{player.stats.matchesPlayed}</p>
            <p className="text-xs text-gray-500">Matches</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
