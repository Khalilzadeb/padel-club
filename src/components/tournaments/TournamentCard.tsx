import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Tournament } from "@/lib/types";
import { Calendar, Users, Trophy } from "lucide-react";

const statusVariant: Record<string, "green" | "yellow" | "blue" | "gray"> = {
  active: "green",
  registration: "yellow",
  upcoming: "blue",
  completed: "gray",
};

const statusLabel: Record<string, string> = {
  active: "In Progress",
  registration: "Registration Open",
  upcoming: "Upcoming",
  completed: "Completed",
};

interface TournamentCardProps { tournament: Tournament; }

export default function TournamentCard({ tournament: t }: TournamentCardProps) {
  const ctaLabel = { active: "View Bracket", registration: "Register", upcoming: "Details", completed: "Results" }[t.status];

  return (
    <Card hover className="overflow-hidden">
      {/* Banner */}
      <div className="h-28 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center relative">
        <Trophy className="w-12 h-12 text-white/40" />
        <div className="absolute top-3 right-3">
          <Badge variant={statusVariant[t.status]}>{statusLabel[t.status]}</Badge>
        </div>
        {t.status === "active" && (
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 text-xs text-white">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{t.description}</p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            {t.startDate} – {t.endDate}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            {t.registeredTeams.length}/{t.maxTeams} teams · {t.format}
          </div>
          {t.prizes[0] && (
            <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
              <Trophy className="w-3.5 h-3.5" />
              1st: {t.prizes[0].description}
            </div>
          )}
        </div>

        {/* Team progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Teams registered</span>
            <span>{t.registeredTeams.length}/{t.maxTeams}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-padel-green h-1.5 rounded-full transition-all"
              style={{ width: `${(t.registeredTeams.length / t.maxTeams) * 100}%` }}
            />
          </div>
        </div>

        <Link href={`/tournaments/${t.id}`}>
          <Button size="sm" className="w-full">{ctaLabel}</Button>
        </Link>
      </div>
    </Card>
  );
}
