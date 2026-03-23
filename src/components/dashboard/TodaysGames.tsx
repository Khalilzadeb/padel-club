"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { OpenGame, Court } from "@/lib/types";
import { Clock, MapPin, Users, ChevronRight } from "lucide-react";
import { eloToDisplayLevel } from "@/lib/elo";

export default function TodaysGames() {
  const [games, setGames] = useState<OpenGame[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      fetch(`/api/open-games?status=open`).then((r) => r.json()),
      fetch("/api/courts").then((r) => r.json()),
    ]).then(([gamesData, courtsData]) => {
      const todayGames: OpenGame[] = (Array.isArray(gamesData) ? gamesData : [])
        .filter((g: OpenGame) => g.date === today && (g.status === "open" || g.status === "full"))
        .sort((a: OpenGame, b: OpenGame) => a.startTime.localeCompare(b.startTime));
      setGames(todayGames.slice(0, 4));
      setCourts(courtsData ?? []);
      setLoaded(true);
    });
  }, []);

  if (!loaded || games.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          Today&apos;s Games
        </p>
        <Link href="/open-games" className="text-xs text-padel-green hover:underline flex items-center gap-0.5">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {games.map((game) => {
          const court = courts.find((c) => c.id === game.courtId);
          const spotsLeft = game.maxPlayers - game.playerIds.length;
          const isFull = spotsLeft === 0;
          return (
            <Link key={game.id} href={`/open-games?game=${game.id}`}>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                <div className={`w-2 h-10 rounded-full flex-shrink-0 ${isFull ? "bg-red-400" : "bg-padel-green"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {court ? (court.location ? `${court.location} · ${court.name}` : court.name) : game.courtId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" /> {game.startTime} – {game.endTime}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Users className="w-3 h-3" /> {game.playerIds.length}/{game.maxPlayers}
                    </div>
                    {game.eloMin != null && game.eloMax != null && (
                      <span className="text-xs text-blue-500">Lv {eloToDisplayLevel(game.eloMin)}–{eloToDisplayLevel(game.eloMax)}</span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                  isFull
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }`}>
                  {isFull ? "Full" : `${spotsLeft} left`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
