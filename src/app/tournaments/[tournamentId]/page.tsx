"use client";
import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Tournament, Player, Match, Court } from "@/lib/types";
import BracketView from "@/components/tournaments/BracketView";
import GroupStandings from "@/components/tournaments/GroupStandings";
import MatchCard from "@/components/matches/MatchCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import { Calendar, Users, Trophy, Gift } from "lucide-react";

const statusVariant: Record<string, "green" | "yellow" | "blue" | "gray"> = {
  active: "green", registration: "yellow", upcoming: "blue", completed: "gray",
};

type Tab = "bracket" | "groups" | "schedule" | "prizes";

export default function TournamentDetailPage({ params }: { params: Promise<{ tournamentId: string }> }) {
  const { tournamentId } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [tab, setTab] = useState<Tab>("bracket");
  const [loading, setLoading] = useState(true);
  const [notFound404, setNotFound404] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/tournaments").then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
      fetch(`/api/matches?tournamentId=${tournamentId}`).then((r) => r.json()),
      fetch("/api/courts").then((r) => r.json()),
    ]).then(([tournamentsData, playersData, matchesData, courtsData]) => {
      const found: Tournament | undefined = tournamentsData.find((t: Tournament) => t.id === tournamentId);
      if (!found) {
        setNotFound404(true);
        setLoading(false);
        return;
      }
      setTournament(found);
      setTab(found.groups ? "groups" : "bracket");
      setPlayers(playersData.map((d: { player: Player }) => d.player));
      setMatches(matchesData);
      setCourts(courtsData);
      setLoading(false);
    });
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound404 || !tournament) return notFound();

  const winner = tournament.winnerId
    ? tournament.winnerId.map((id) => players.find((p) => p.id === id)).filter(Boolean)
    : [];

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "bracket", label: "Bracket", show: !!(tournament.bracket?.length) },
    { id: "groups", label: "Groups", show: !!(tournament.groups?.length) },
    { id: "schedule", label: "Schedule", show: true },
    { id: "prizes", label: "Prizes", show: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tournament header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white p-8 mb-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant={statusVariant[tournament.status]} className="mb-3">
                {tournament.status === "active" ? "In Progress" : tournament.status}
              </Badge>
              <h1 className="text-3xl font-black mb-2">{tournament.name}</h1>
              <p className="text-orange-100 max-w-lg">{tournament.description}</p>
            </div>
            <Trophy className="w-16 h-16 text-white/20 flex-shrink-0" />
          </div>

          <div className="flex flex-wrap gap-5 mt-6 text-sm">
            <span className="flex items-center gap-2 text-orange-100">
              <Calendar className="w-4 h-4" /> {tournament.startDate} – {tournament.endDate}
            </span>
            <span className="flex items-center gap-2 text-orange-100">
              <Users className="w-4 h-4" /> {tournament.registeredTeams.length}/{tournament.maxTeams} teams
            </span>
            <span className="flex items-center gap-2 text-orange-100">
              Format: {tournament.format}
            </span>
          </div>
        </div>
      </div>

      {/* Winner banner */}
      {winner.length > 0 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <p className="font-semibold text-gray-900">Champions</p>
            <div className="flex items-center gap-2 ml-2">
              {winner.map((p) => p && (
                <Link key={p.id} href={`/players/${p.id}`} className="flex items-center gap-1.5 hover:underline">
                  <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                  <span className="text-sm font-medium">{p.name.split(" ")[0]}</span>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.filter((t) => t.show).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? "bg-padel-green text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "bracket" && tournament.bracket && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Tournament Bracket</h2>
          <BracketView bracket={tournament.bracket} players={players} />
        </Card>
      )}

      {tab === "groups" && tournament.groups && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Group Standings</h2>
          <GroupStandings groups={tournament.groups} players={players} />
        </Card>
      )}

      {tab === "schedule" && (
        <div>
          {matches.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-400">No matches played yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} players={players} courts={courts} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "prizes" && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Prize Structure</h2>
          <div className="space-y-3">
            {tournament.prizes.map((prize) => (
              <div key={prize.place} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white flex-shrink-0 ${
                  prize.place === 1 ? "bg-yellow-400" : prize.place === 2 ? "bg-gray-300" : "bg-amber-600"
                }`}>
                  {prize.place}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{prize.description}</p>
                  {prize.value && (
                    <p className="text-sm text-padel-green font-medium">
                      ${(prize.value / 100).toLocaleString()} prize money
                    </p>
                  )}
                </div>
                {prize.place === 1 && <Gift className="w-5 h-5 text-yellow-500 ml-auto" />}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Registered Teams</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tournament.registeredTeams.map((team, idx) => {
                const teamPlayers = team.map((id) => players.find((p) => p.id === id)).filter(Boolean);
                return (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex -space-x-1">
                      {teamPlayers.map((p) => p && <Avatar key={p.id} name={p.name} size="sm" />)}
                    </div>
                    <span className="text-sm text-gray-700">
                      {teamPlayers.map((p) => p?.name.split(" ")[0]).join(" & ")}
                    </span>
                  </div>
                );
              })}
            </div>
            {tournament.registeredTeams.length < tournament.maxTeams && tournament.status === "registration" && (
              <p className="text-sm text-amber-600 mt-3 font-medium">
                {tournament.maxTeams - tournament.registeredTeams.length} spots remaining · Registration closes {tournament.registrationDeadline}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
