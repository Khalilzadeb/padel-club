"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Plus, Calendar, Users, ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/contexts/LocaleContext";
import type { CommunityTournament } from "@/lib/types";

function statusVariant(status: CommunityTournament["status"]): "green" | "blue" | "gray" | "red" {
  if (status === "active") return "green";
  if (status === "completed") return "blue";
  if (status === "cancelled") return "red";
  return "gray";
}

function formatLabel(format: CommunityTournament["format"], t: ReturnType<typeof useLocale>["t"]) {
  switch (format) {
    case "americano": return t.communityTournaments.formats.americano;
    case "mexicano": return t.communityTournaments.formats.mexicano;
    case "team-americano": return t.communityTournaments.formats.teamAmericano;
    case "team-mexicano": return t.communityTournaments.formats.teamMexicano;
    case "championship": return t.communityTournaments.formats.championship;
  }
}

export default function TournamentsListPage() {
  const { t } = useLocale();
  const [tournaments, setTournaments] = useState<CommunityTournament[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/community/tournaments").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/community/me").then((r) => (r.ok ? r.json() : { isAdmin: false })),
    ]).then(([list, me]) => {
      setTournaments(list);
      setIsAdmin(!!me.isAdmin);
      setLoading(false);
    });
  }, []);

  const active = tournaments.filter((t) => t.status === "active" || t.status === "draft");
  const past = tournaments.filter((t) => t.status === "completed" || t.status === "cancelled");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-padel-green" />
            {t.communityTournaments.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t.communityTournaments.subtitle}</p>
        </div>
        {isAdmin && (
          <Link href="/padelsmash/tournaments/new">
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              {t.communityTournaments.newTournament}
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tournaments.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">{t.communityTournaments.empty}</p>
          {isAdmin && (
            <Link href="/padelsmash/tournaments/new">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-1" />
                {t.communityTournaments.createFirst}
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {t.communityTournaments.active}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {t.communityTournaments.past}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {past.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TournamentCard({ tournament }: { tournament: CommunityTournament }) {
  const { t } = useLocale();
  return (
    <Link href={`/padelsmash/tournaments/${tournament.id}`}>
      <Card hover className="overflow-hidden h-full">
        {tournament.coverUrl && (
          <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tournament.coverUrl}
              alt={tournament.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${tournament.coverPosition}%` }}
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">{tournament.name}</h3>
            <Badge variant={statusVariant(tournament.status)}>
              {t.communityTournaments.statuses[tournament.status]}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{formatLabel(tournament.format, t)}</p>
          {tournament.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">{tournament.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {tournament.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {tournament.startDate}
              </span>
            )}
            <span className="ml-auto inline-flex items-center text-padel-green">
              {t.communityTournaments.viewDetails} <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
