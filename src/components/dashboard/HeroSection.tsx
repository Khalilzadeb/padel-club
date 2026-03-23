"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Users, Trophy, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { eloToDisplayLevel } from "@/lib/elo";
import { Player } from "@/lib/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HeroSection() {
  const { user, loading } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (!user?.playerId) return;
    fetch(`/api/players/${user.playerId}`)
      .then((r) => r.json())
      .then((data) => setPlayer(data.player ?? null))
      .catch(() => {});
  }, [user?.playerId]);

  const isPersonalized = !loading && user && player;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-padel-green-dark via-padel-green to-padel-green-light text-white p-8 md:p-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          {isPersonalized ? (
            <>
              <p className="text-green-200 text-sm font-medium mb-1">{getGreeting()},</p>
              <h1 className="text-3xl md:text-4xl font-black mb-6">{user.name.split(" ")[0]} 👋</h1>
            </>
          ) : (
            <>
              <p className="text-green-200 text-sm font-medium uppercase tracking-wider mb-2">Welcome to</p>
              <h1 className="text-3xl md:text-5xl font-black mb-3">PadelOn</h1>
              <p className="text-green-100 text-lg mb-6 max-w-md">
                Find a game, track your matches, and compete in tournaments.
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/open-games">
              <Button className="bg-white !text-padel-green hover:bg-green-50" size="lg">
                <Users className="w-5 h-5" /> Find a Game
              </Button>
            </Link>
            <Link href="/matches">
              <Button variant="ghost" className="!text-white hover:!bg-white/20" size="lg">
                <TrendingUp className="w-5 h-5" /> Enter Score
              </Button>
            </Link>
            <Link href="/players">
              <Button variant="ghost" className="!text-white hover:!bg-white/20" size="lg">
                <Trophy className="w-5 h-5" /> Rankings
              </Button>
            </Link>
          </div>
        </div>

        {isPersonalized && player && (
          <div className="flex gap-3 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 text-center">
              <p className="text-green-200 text-xs font-medium mb-1">ELO</p>
              <p className="text-3xl font-black">{player.stats.eloRating}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 text-center">
              <p className="text-green-200 text-xs font-medium mb-1 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" /> Level
              </p>
              <p className="text-3xl font-black">{eloToDisplayLevel(player.stats.eloRating)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 text-center">
              <p className="text-green-200 text-xs font-medium mb-1">Win Rate</p>
              <p className="text-3xl font-black">
                {player.stats.matchesPlayed > 0
                  ? `${Math.round((player.stats.matchesWon / player.stats.matchesPlayed) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
