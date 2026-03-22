"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { OpenGame, Tournament, Player, Court } from "@/lib/types";
import { Calendar, MapPin, Trophy, ChevronRight, Users } from "lucide-react";

export default function MyActivity() {
  const { user, loading: authLoading } = useAuth();
  const [myGames, setMyGames] = useState<OpenGame[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading || !user?.playerId) return;

    Promise.all([
      fetch("/api/open-games").then((r) => r.json()),
      fetch("/api/tournaments").then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/courts").then((r) => r.json()),
    ]).then(([gamesData, tournamentsData, playersData, courtsData]) => {
      const today = new Date().toISOString().split("T")[0];

      const games: OpenGame[] = Array.isArray(gamesData) ? gamesData : [];
      const mine = games.filter(
        (g) =>
          g.playerIds.includes(user.playerId!) &&
          (g.status === "open" || g.status === "full") &&
          g.date >= today
      ).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      setMyGames(mine.slice(0, 3));

      const tournaments: Tournament[] = Array.isArray(tournamentsData) ? tournamentsData : [];
      const myT = tournaments.filter(
        (t) =>
          t.registeredTeams.some((team) => team.includes(user.playerId!)) &&
          t.status !== "completed"
      );
      setMyTournaments(myT.slice(0, 2));

      setPlayers((playersData ?? []).map((d: { player: Player }) => d.player));
      setCourts(courtsData ?? []);
      setLoaded(true);
    });
  }, [user, authLoading]);

  if (authLoading || !user?.playerId || !loaded) return null;
  if (myGames.length === 0 && myTournaments.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Activity</h2>

      {myGames.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-padel-green" /> Upcoming Games
            </p>
            <Link href="/open-games" className="text-xs text-padel-green hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {myGames.map((game) => {
              const court = courts.find((c) => c.id === game.courtId);
              const gamePlayers = game.playerIds
                .filter((id) => id !== user.playerId)
                .map((id) => players.find((p) => p.id === id))
                .filter(Boolean) as Player[];
              const spotsLeft = game.maxPlayers - game.playerIds.length;

              return (
                <Link key={game.id} href="/open-games">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-padel-green/10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-padel-green uppercase">
                        {new Date(game.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-sm font-black text-padel-green leading-none">
                        {new Date(game.date + "T00:00:00").getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {court ? (court.location ?? court.name) : game.courtId}
                        </p>
                        {game.status === "full"
                          ? <Badge variant="red">Full</Badge>
                          : <Badge variant="green">{spotsLeft} left</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{game.startTime} – {game.endTime}</p>
                        {gamePlayers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                            <div className="flex -space-x-1">
                              {gamePlayers.slice(0, 3).map((p) => (
                                <Avatar key={p.id} name={p.name} imageUrl={p.avatarUrl} size="sm" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {myTournaments.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> My Tournaments
            </p>
            <Link href="/tournaments" className="text-xs text-padel-green hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {myTournaments.map((t) => {
              const myTeam = t.registeredTeams.find((team) => team.includes(user.playerId!));
              const partner = myTeam
                ? players.find((p) => p.id !== user.playerId && myTeam.includes(p.id))
                : null;

              return (
                <Link key={t.id} href={`/tournaments/${t.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.startDate}
                        {partner && ` · with ${partner.name.split(" ")[0]}`}
                      </p>
                    </div>
                    <Badge variant={t.status === "active" ? "green" : t.status === "registration" ? "yellow" : "blue"}>
                      {t.status}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
