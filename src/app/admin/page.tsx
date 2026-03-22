"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { Trophy, Users, Swords, Gamepad2, ChevronRight } from "lucide-react";

interface Stats {
  players: number;
  matches: number;
  tournaments: number;
  openGames: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/matches").then((r) => r.json()),
      fetch("/api/admin/tournaments").then((r) => r.json()),
      fetch("/api/open-games").then((r) => r.json()),
    ]).then(([players, matches, tournaments, games]) => {
      setStats({
        players: Array.isArray(players) ? players.length : 0,
        matches: Array.isArray(matches) ? matches.length : 0,
        tournaments: Array.isArray(tournaments) ? tournaments.length : 0,
        openGames: Array.isArray(games) ? games.length : 0,
      });
    });
  }, []);

  const cards = [
    { label: "Players", value: stats?.players, icon: Users, href: "/admin/players", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" },
    { label: "Matches", value: stats?.matches, icon: Swords, href: "/matches", color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20" },
    { label: "Tournaments", value: stats?.tournaments, icon: Trophy, href: "/admin/tournaments", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20" },
    { label: "Open Games", value: stats?.openGames, icon: Gamepad2, href: "/open-games", color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {value ?? <span className="text-gray-300 dark:text-gray-600 animate-pulse">—</span>}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/tournaments">
          <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Manage Tournaments</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Create, edit, register teams</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Card>
        </Link>

        <Link href="/admin/players">
          <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Manage Players</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View and edit player ELO</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
