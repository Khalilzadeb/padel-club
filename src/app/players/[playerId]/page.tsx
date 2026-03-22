import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayer, getPlayers } from "@/lib/data/players";
import { getMatches } from "@/lib/data/matches";
import { getCourts } from "@/lib/data/courts";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Trophy, Calendar, Target, MessageCircle } from "lucide-react";
import EditProfileButton from "@/components/players/EditProfileButton";
import ChallengeButton from "@/components/players/ChallengeButton";
import EloChart from "@/components/players/EloChart";
import { eloToDisplayLevel, eloToLevelVariant } from "@/lib/elo";

export default async function PlayerProfilePage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const [player, allPlayers, myMatches, courts] = await Promise.all([
    getPlayer(playerId),
    getPlayers(),
    getMatches({ playerId }),
    getCourts(),
  ]);

  if (!player) return notFound();

  const s = player.stats;
  const winRate = s.matchesPlayed ? Math.round((s.matchesWon / s.matchesPlayed) * 100) : 0;
  const setsWinRate = (s.setsWon + s.setsLost) > 0 ? Math.round((s.setsWon / (s.setsWon + s.setsLost)) * 100) : 0;
  void setsWinRate;

  const recentMatches = myMatches.slice(0, 8);

  // Build ELO history from matches (oldest first)
  const matchesWithElo = myMatches
    .filter((m) => m.eloChanges?.[playerId] !== undefined)
    .slice()
    .reverse(); // oldest first
  const totalEloChange = matchesWithElo.reduce((sum, m) => sum + (m.eloChanges?.[playerId] ?? 0), 0);
  let runningElo = s.eloRating - totalEloChange;
  const eloHistory = matchesWithElo.map((m) => {
    const change = m.eloChanges![playerId]!;
    runningElo += change;
    return { date: m.date, elo: runningElo, change };
  });
  if (eloHistory.length > 0) {
    eloHistory.unshift({ date: matchesWithElo[0].date, elo: s.eloRating - totalEloChange, change: 0 });
  }

  // If too many points, aggregate by month (last ELO value per month)
  const chartHistory = eloHistory.length > 20
    ? Object.values(
        eloHistory.reduce((acc, point) => {
          const month = point.date.slice(0, 7); // "YYYY-MM"
          acc[month] = point; // overwrite → keeps last match of each month
          return acc;
        }, {} as Record<string, typeof eloHistory[0]>)
      )
    : eloHistory;

  const partnerCount: Record<string, number> = {};
  recentMatches.forEach((m) => {
    const myTeam = m.team1.playerIds.includes(playerId) ? m.team1.playerIds : m.team2.playerIds;
    myTeam.filter((id) => id !== playerId).forEach((id) => {
      partnerCount[id] = (partnerCount[id] ?? 0) + 1;
    });
  });

  // Head-to-head stats against each opponent
  const h2h: Record<string, { wins: number; losses: number }> = {};
  myMatches.forEach((m) => {
    const onTeam1 = m.team1.playerIds.includes(playerId);
    const oppIds = onTeam1 ? m.team2.playerIds : m.team1.playerIds;
    const won = (onTeam1 && m.winnerId === "team1") || (!onTeam1 && m.winnerId === "team2");
    oppIds.forEach((oppId) => {
      if (!h2h[oppId]) h2h[oppId] = { wins: 0, losses: 0 };
      if (won) h2h[oppId].wins++;
      else h2h[oppId].losses++;
    });
  });
  const h2hEntries = Object.entries(h2h)
    .map(([pid, stat]) => ({ pid, ...stat, total: stat.wins + stat.losses }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar name={player.name} imageUrl={player.avatarUrl} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-gray-900">{player.name}</h1>
              <Badge variant={eloToLevelVariant(s.eloRating)} className="text-sm px-3 py-1">Lv {eloToDisplayLevel(s.eloRating)}</Badge>
            </div>
            <p className="text-gray-500 mt-1 capitalize">
              {player.position} · {player.hand}-handed{player.gender ? ` · ${player.gender}` : ""}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Member since {player.memberSince}</p>
            <div className="flex items-center gap-2 flex-wrap">
            <EditProfileButton player={player} />
            <ChallengeButton player={player} courts={courts} />
            <Link href={`/messages/${playerId}`}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 font-medium transition-colors">
              <MessageCircle className="w-4 h-4" /> Message
            </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              {[
                { label: "ELO Rating", value: s.eloRating, icon: <Target className="w-4 h-4" /> },
                { label: "Win Rate", value: `${winRate}%`, icon: <TrendingUp className="w-4 h-4" /> },
                { label: "Matches", value: s.matchesPlayed, icon: <Calendar className="w-4 h-4" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center text-padel-green mb-1">{icon}</div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-4">
              {[
                { label: "Matches Won", value: s.matchesWon, total: s.matchesPlayed, color: "bg-padel-green" },
                { label: "Sets Win Rate", value: s.setsWon, total: s.setsWon + s.setsLost, color: "bg-blue-500" },
              ].map(({ label, value, total, color }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold text-gray-900">{value}/{total} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Games Won</span><p className="font-semibold">{s.gamesWon}</p></div>
                <div><span className="text-gray-500">Games Lost</span><p className="font-semibold">{s.gamesLost}</p></div>
                <div><span className="text-gray-500">Tournaments Won</span><p className="font-semibold">{s.tournamentsWon}</p></div>
                <div>
                  <span className="text-gray-500">Current Streak</span>
                  <p className={`font-semibold flex items-center gap-1 ${s.currentStreak > 0 ? "text-green-600" : s.currentStreak < 0 ? "text-red-500" : "text-gray-500"}`}>
                    {s.currentStreak > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : s.currentStreak < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                    {s.currentStreak > 0 ? `${s.currentStreak}W` : s.currentStreak < 0 ? `${Math.abs(s.currentStreak)}L` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-3">ELO History</h2>
            <EloChart history={chartHistory} currentElo={s.eloRating} />
          </Card>

          {Object.keys(partnerCount).length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Frequent Partners</h2>
              <div className="space-y-2">
                {Object.entries(partnerCount)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([pid, count]) => {
                    const partner = allPlayers.find((p) => p.id === pid);
                    if (!partner) return null;
                    return (
                      <Link key={pid} href={`/players/${pid}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg">
                        <Avatar name={partner.name} imageUrl={partner.avatarUrl} size="sm" />
                        <span className="text-sm text-gray-700 flex-1">{partner.name}</span>
                        <span className="text-xs text-gray-400">{count} matches</span>
                      </Link>
                    );
                  })}
              </div>
            </Card>
          )}
          {h2hEntries.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Head-to-Head</h2>
              <div className="space-y-2">
                {h2hEntries.map(({ pid, wins, losses, total }) => {
                  const opp = allPlayers.find((p) => p.id === pid);
                  if (!opp) return null;
                  const winPct = Math.round((wins / total) * 100);
                  return (
                    <Link key={pid} href={`/players/${pid}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <Avatar name={opp.name} imageUrl={opp.avatarUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{opp.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-padel-green rounded-full" style={{ width: `${winPct}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-green-600">{wins}W</span>
                        <span className="text-sm text-gray-300 mx-0.5">–</span>
                        <span className="text-sm font-bold text-red-400">{losses}L</span>
                        <p className="text-xs text-gray-400">{total} played</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Match History</h2>
            {recentMatches.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No matches yet</p>
            ) : (
              <div className="space-y-2">
                {recentMatches.map((match) => {
                  const onTeam1 = match.team1.playerIds.includes(playerId);
                  const myTeam = onTeam1 ? match.team1 : match.team2;
                  const oppTeam = onTeam1 ? match.team2 : match.team1;
                  const won = (onTeam1 && match.winnerId === "team1") || (!onTeam1 && match.winnerId === "team2");
                  const court = courts.find((c) => c.id === match.courtId);
                  const partners = myTeam.playerIds.filter((id) => id !== playerId).map((id) => allPlayers.find((p) => p.id === id)?.name.split(" ")[0]).join(" & ");
                  const opponents = oppTeam.playerIds.map((id) => allPlayers.find((p) => p.id === id)?.name.split(" ")[0]).join(" & ");
                  const score = match.sets.map((s) => onTeam1 ? `${s.team1Games}-${s.team2Games}` : `${s.team2Games}-${s.team1Games}`).join(", ");
                  const eloChange = match.eloChanges?.[playerId];

                  return (
                    <Link key={match.id} href={`/matches/${match.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${won ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"}`}>
                          {won ? "W" : "L"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {partners ? `w/ ${partners} ` : ""}vs {opponents}
                          </p>
                          <p className="text-xs text-gray-400">{court?.name} · {match.date}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-mono font-semibold text-gray-900">{score}</p>
                          {eloChange !== undefined && (
                            <p className={`text-xs font-medium ${eloChange > 0 ? "text-green-600" : "text-red-500"}`}>
                              {eloChange > 0 ? "+" : ""}{eloChange} ELO
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
