"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Users, Trophy, Zap, CalendarDays } from "lucide-react";
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
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

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
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-28 -translate-x-28" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/3 rounded-full -translate-y-1/2" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          {/* Brand — always visible */}
          <p className="text-green-300/80 text-xs font-bold tracking-[0.2em] mb-3">
            PadelOn
          </p>

          {isPersonalized ? (
            <>
              <p className="text-green-200 text-sm font-medium mb-1">{greeting},</p>
              <h1 className="text-3xl md:text-4xl font-black mb-6">{user.name.split(" ")[0]} 👋</h1>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-5xl font-black mb-3">Find your game.</h1>
              <p className="text-green-100 text-base mb-6 max-w-md">
                Join open games, track your matches, and compete in tournaments.
              </p>
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <Link href="/open-games">
              <Button className="bg-white !text-padel-green hover:bg-green-50 shadow-md" size="lg">
                <Users className="w-5 h-5" /> Find a Game
              </Button>
            </Link>
            <Link href="/players">
              <Button variant="ghost" className="!text-white hover:!bg-white/20" size="lg">
                <Trophy className="w-5 h-5" /> Rankings
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button variant="ghost" className="!text-white hover:!bg-white/20" size="lg">
                <CalendarDays className="w-5 h-5" /> Tournaments
              </Button>
            </Link>
          </div>
        </div>

        {isPersonalized && player && (
          <div className="flex gap-3 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 text-center min-w-[80px]">
              <p className="text-green-200 text-xs font-medium mb-1">ELO</p>
              <p className="text-3xl font-black">{player.stats.eloRating}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 text-center min-w-[80px]">
              <p className="text-green-200 text-xs font-medium mb-1 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" /> Level
              </p>
              <p className="text-3xl font-black">{eloToDisplayLevel(player.stats.eloRating)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 text-center min-w-[80px]">
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
