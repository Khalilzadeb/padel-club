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
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Users, Trophy, Gift, UserPlus, X, CheckCircle } from "lucide-react";

const statusVariant: Record<string, "green" | "yellow" | "blue" | "gray"> = {
  active: "green", registration: "yellow", upcoming: "blue", completed: "gray",
};

type Tab = "bracket" | "groups" | "schedule" | "prizes";

export default function TournamentDetailPage({ params }: { params: Promise<{ tournamentId: string }> }) {
  const { tournamentId } = use(params);
  const { user } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [tab, setTab] = useState<Tab>("bracket");
  const [loading, setLoading] = useState(true);
  const [notFound404, setNotFound404] = useState(false);

  // Registration state
  const [showRegister, setShowRegister] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

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

  const allRegisteredIds = tournament.registeredTeams.flat();
  const isRegistered = user?.playerId ? allRegisteredIds.includes(user.playerId) : false;
  const isRegistrationOpen = tournament.status === "registration" && tournament.registeredTeams.length < tournament.maxTeams;
  const myTeam = isRegistered && user?.playerId
    ? tournament.registeredTeams.find((t) => t.includes(user.playerId!))
    : null;

  const filteredPartners = players.filter(
    (p) =>
      p.name.toLowerCase().includes(partnerSearch.toLowerCase()) &&
      p.id !== user?.playerId &&
      !allRegisteredIds.includes(p.id)
  );

  const handleRegister = async () => {
    setRegisterError("");
    setRegisterLoading(true);
    const res = await fetch(`/api/tournaments/${tournamentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", partnerId: partnerId || undefined }),
    });
    const data = await res.json();
    setRegisterLoading(false);
    if (!res.ok) {
      setRegisterError(data.error ?? "Registration failed");
      return;
    }
    setTournament(data);
    setRegisterSuccess(true);
    setTimeout(() => {
      setShowRegister(false);
      setRegisterSuccess(false);
      setPartnerSearch("");
      setPartnerId("");
    }, 1500);
  };

  const handleUnregister = async () => {
    const res = await fetch(`/api/tournaments/${tournamentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unregister" }),
    });
    if (res.ok) {
      const data = await res.json();
      setTournament(data);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tournament header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white p-6 sm:p-8 mb-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Badge variant={statusVariant[tournament.status]} className="mb-3">
                {tournament.status === "active" ? "In Progress" : tournament.status}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">{tournament.name}</h1>
              <p className="text-orange-100 max-w-lg text-sm">{tournament.description}</p>
            </div>
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-white/20 flex-shrink-0" />
          </div>

          <div className="flex flex-wrap gap-4 mt-6 text-sm">
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

          {/* Registration actions */}
          {user?.playerId && (
            <div className="mt-5">
              {isRegistered ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Registered
                    {myTeam && myTeam.length === 2 && (() => {
                      const partner = players.find((p) => p.id !== user.playerId && myTeam.includes(p.id));
                      return partner ? <span className="text-orange-100"> · with {partner.name.split(" ")[0]}</span> : null;
                    })()}
                  </div>
                  {tournament.status === "registration" && (
                    <button
                      onClick={handleUnregister}
                      className="text-xs text-white/60 hover:text-white underline"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              ) : isRegistrationOpen ? (
                <Button
                  onClick={() => setShowRegister(true)}
                  className="bg-white text-orange-600 hover:bg-orange-50 font-bold flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Register Now
                </Button>
              ) : tournament.status === "registration" ? (
                <p className="text-sm text-orange-200 bg-white/10 rounded-xl px-3 py-2 inline-block">
                  Tournament is full
                </p>
              ) : null}
            </div>
          )}
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
                      ₼{(prize.value / 100).toLocaleString()} prize money
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
                const isMyTeam = user?.playerId && team.includes(user.playerId);
                return (
                  <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-lg ${isMyTeam ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                    <div className="flex -space-x-1">
                      {teamPlayers.map((p) => p && <Avatar key={p.id} name={p.name} imageUrl={p.avatarUrl} size="sm" />)}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {teamPlayers.map((p) => p?.name.split(" ")[0]).join(" & ")}
                    </span>
                    {isMyTeam && <span className="text-xs text-amber-600 font-semibold ml-auto">You</span>}
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

      {/* Register Modal */}
      <Modal isOpen={showRegister} onClose={() => { setShowRegister(false); setRegisterError(""); setPartnerSearch(""); setPartnerId(""); }} title="Register for Tournament" size="sm">
        {registerSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle className="w-12 h-12 text-padel-green" />
            <p className="font-semibold text-gray-900">Registered!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
              You will register as a team. Select a partner or register solo.
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Partner (optional)</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                placeholder="Search player..."
                value={partnerSearch}
                onChange={(e) => { setPartnerSearch(e.target.value); setPartnerId(""); }}
              />
              {partnerSearch && !partnerId && (
                <div className="border border-gray-100 rounded-xl overflow-hidden mt-1 max-h-44 overflow-y-auto shadow-sm">
                  {filteredPartners.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setPartnerId(p.id); setPartnerSearch(p.name); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                      <span>{p.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{p.stats.eloRating} ELO</span>
                    </button>
                  ))}
                  {filteredPartners.length === 0 && (
                    <p className="text-xs text-gray-400 px-3 py-2">No available players found</p>
                  )}
                </div>
              )}
              {partnerId && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-padel-green font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {partnerSearch} selected
                  </span>
                  <button onClick={() => { setPartnerId(""); setPartnerSearch(""); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {registerError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{registerError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setShowRegister(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleRegister} disabled={registerLoading}>
                {registerLoading ? "Registering..." : partnerId ? "Register with Partner" : "Register Solo"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
