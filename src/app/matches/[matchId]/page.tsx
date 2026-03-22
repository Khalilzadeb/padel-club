import { notFound } from "next/navigation";
import Link from "next/link";
import { getMatch } from "@/lib/data/matches";
import { getPlayers } from "@/lib/data/players";
import { getCourts } from "@/lib/data/courts";
import { getTournament } from "@/lib/data/tournaments";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { MapPin, Clock, TrendingUp, TrendingDown, Trophy } from "lucide-react";

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const [match, players, courts] = await Promise.all([
    getMatch(matchId),
    getPlayers(),
    getCourts(),
  ]);

  if (!match) return notFound();

  const court = courts.find((c) => c.id === match.courtId);
  const t1 = match.team1.playerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const t2 = match.team2.playerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const tournament = match.tournamentId ? await getTournament(match.tournamentId) : null;

  const typeVariant: Record<string, "purple" | "blue" | "gray"> = {
    tournament: "purple", ranked: "blue", casual: "gray",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={typeVariant[match.type]}>{match.type}</Badge>
          {match.tournamentRound && <Badge variant="purple">{match.tournamentRound}</Badge>}
          {tournament && (
            <Link href={`/tournaments/${tournament.id}`} className="text-xs text-purple-600 hover:underline ml-1">
              {tournament.name}
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 my-6">
          <div className={`flex-1 text-center ${match.winnerId === "team1" ? "" : "opacity-50"}`}>
            <div className="flex justify-center -space-x-3 mb-2">
              {t1.map((p) => p && <Avatar key={p.id} name={p.name} size="lg" />)}
            </div>
            <p className="font-bold text-gray-900 dark:text-white">{t1.map((p) => p?.name.split(" ")[0]).join(" & ")}</p>
            {match.winnerId === "team1" && (
              <span className="inline-block mt-1 text-xs font-bold text-padel-green bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">WINNER</span>
            )}
            {match.eloChanges && (
              <div className="mt-2 flex justify-center gap-2">
                {match.team1.playerIds.map((id) => {
                  const change = match.eloChanges![id];
                  if (change === undefined) return null;
                  return (
                    <span key={id} className={`text-xs font-semibold flex items-center gap-0.5 ${change > 0 ? "text-green-600" : "text-red-500"}`}>
                      {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {change > 0 ? "+" : ""}{change}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 text-center">
            <div className="flex gap-3 justify-center">
              {match.sets.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{s.team1Games}</p>
                  {s.tiebreak && <p className="text-xs text-gray-400">{s.tiebreak.team1Points}</p>}
                  <p className="text-xs text-gray-400 my-0.5">Set {s.setNumber}</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{s.team2Games}</p>
                  {s.tiebreak && <p className="text-xs text-gray-400">{s.tiebreak.team2Points}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className={`flex-1 text-center ${match.winnerId === "team2" ? "" : "opacity-50"}`}>
            <div className="flex justify-center -space-x-3 mb-2">
              {t2.map((p) => p && <Avatar key={p.id} name={p.name} size="lg" />)}
            </div>
            <p className="font-bold text-gray-900 dark:text-white">{t2.map((p) => p?.name.split(" ")[0]).join(" & ")}</p>
            {match.winnerId === "team2" && (
              <span className="inline-block mt-1 text-xs font-bold text-padel-green bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">WINNER</span>
            )}
            {match.eloChanges && (
              <div className="mt-2 flex justify-center gap-2">
                {match.team2.playerIds.map((id) => {
                  const change = match.eloChanges![id];
                  if (change === undefined) return null;
                  return (
                    <span key={id} className={`text-xs font-semibold flex items-center gap-0.5 ${change > 0 ? "text-green-600" : "text-red-500"}`}>
                      {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {change > 0 ? "+" : ""}{change}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-50 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {court?.name}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {match.date} at {match.startTime}</span>
          {match.durationMinutes && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {match.durationMinutes} min</span>}
          {match.format && <span className="flex items-center gap-1.5">Format: {match.format}</span>}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[{ team: t1, label: "Team 1", id: "team1" }, { team: t2, label: "Team 2", id: "team2" }].map(({ team, label, id }) => (
          <Card key={id} className="p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">{label}</p>
            <div className="space-y-3">
              {team.map((p) => {
                if (!p) return null;
                const eloChange = match.eloChanges?.[p.id];
                return (
                  <Link key={p.id} href={`/players/${p.id}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg">
                    <Avatar name={p.name} imageUrl={p.avatarUrl} size="md" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">ELO: {p.stats.eloRating}</p>
                    </div>
                    {eloChange !== undefined && (
                      <span className={`text-sm font-bold ${eloChange > 0 ? "text-green-600" : "text-red-500"}`}>
                        {eloChange > 0 ? "+" : ""}{eloChange}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {tournament && (
        <div className="mt-4">
          <Link href={`/tournaments/${tournament.id}`}>
            <Card hover className="p-4 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{tournament.name}</p>
                <p className="text-xs text-gray-400">View tournament bracket</p>
              </div>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
