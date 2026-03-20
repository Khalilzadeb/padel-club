import Link from "next/link";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { Match, Player, Court } from "@/lib/types";
import { Clock, MapPin } from "lucide-react";

interface MatchCardProps {
  match: Match;
  players: Player[];
  courts: Court[];
}

function getPlayer(players: Player[], id: string) {
  return players.find((p) => p.id === id);
}

export default function MatchCard({ match, players, courts }: MatchCardProps) {
  const court = courts.find((c) => c.id === match.courtId);
  const t1 = match.team1.playerIds.map((id) => getPlayer(players, id)).filter(Boolean) as Player[];
  const t2 = match.team2.playerIds.map((id) => getPlayer(players, id)).filter(Boolean) as Player[];

  const typeVariant: Record<string, "purple" | "blue" | "gray"> = {
    tournament: "purple",
    ranked: "blue",
    casual: "gray",
  };

  return (
    <Link href={`/matches/${match.id}`}>
      <Card hover className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            {court?.name}
            <Clock className="w-3.5 h-3.5 ml-1" />
            {match.date} {match.startTime}
          </div>
          <Badge variant={typeVariant[match.type]}>{match.type}</Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Team 1 */}
          <div className={`flex-1 ${match.winnerId === "team1" ? "opacity-100" : "opacity-60"}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex -space-x-2">
                {t1.map((p) => <Avatar key={p.id} name={p.name} imageUrl={p.avatarUrl} size="sm" />)}
              </div>
              {match.winnerId === "team1" && (
                <span className="text-xs font-bold text-padel-green">W</span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {t1.map((p) => p.name.split(" ")[0]).join(" & ")}
            </p>
          </div>

          {/* Score */}
          <div className="text-center flex-shrink-0">
            <div className="flex gap-2">
              {match.sets.map((s, i) => (
                <div key={i} className="text-center">
                  <div className={`text-sm font-bold ${match.winnerId === "team1" ? "text-padel-green" : "text-gray-400"}`}>
                    {s.team1Games}
                  </div>
                  <div className="text-xs text-gray-300">—</div>
                  <div className={`text-sm font-bold ${match.winnerId === "team2" ? "text-padel-green" : "text-gray-400"}`}>
                    {s.team2Games}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team 2 */}
          <div className={`flex-1 text-right ${match.winnerId === "team2" ? "opacity-100" : "opacity-60"}`}>
            <div className="flex items-center justify-end gap-2 mb-1">
              {match.winnerId === "team2" && (
                <span className="text-xs font-bold text-padel-green">W</span>
              )}
              <div className="flex -space-x-2">
                {t2.map((p) => <Avatar key={p.id} name={p.name} imageUrl={p.avatarUrl} size="sm" />)}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {t2.map((p) => p.name.split(" ")[0]).join(" & ")}
            </p>
          </div>
        </div>

        {match.tournamentRound && (
          <p className="text-xs text-purple-600 font-medium mt-2 text-center">
            {match.tournamentRound}
          </p>
        )}
      </Card>
    </Link>
  );
}
