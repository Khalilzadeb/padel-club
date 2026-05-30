"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Play, CheckCircle2, Edit3, Crown, Trash2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { useLocale } from "@/contexts/LocaleContext";
import type {
  CommunityPlayer,
  CommunityTournament,
  CommunityTournamentMatch,
  CommunityTournamentPlayer,
  CommunityTournamentRound,
  TournamentStandingRow,
} from "@/lib/types";

interface TournamentData {
  tournament: CommunityTournament;
  players: CommunityTournamentPlayer[];
  rounds: CommunityTournamentRound[];
  matchesByRound: Record<string, CommunityTournamentMatch[]>;
  standings: TournamentStandingRow[];
  isAdmin: boolean;
}

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLocale();
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState<TournamentData | null>(null);
  const [communityPlayers, setCommunityPlayers] = useState<Record<string, CommunityPlayer>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = () =>
    Promise.all([
      fetch(`/api/community/tournaments/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/community/players").then((r) => (r.ok ? r.json() : [])),
    ]).then(([td, cp]: [TournamentData | null, CommunityPlayer[]]) => {
      setData(td);
      const map: Record<string, CommunityPlayer> = {};
      cp.forEach((p) => (map[p.id] = p));
      setCommunityPlayers(map);
      setLoading(false);
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">{t.communityTournaments.notFound}</p>
      </div>
    );
  }

  const { tournament, rounds, matchesByRound, standings, isAdmin } = data;
  const currentRound = rounds.find((r) => r.status === "active") ?? rounds[rounds.length - 1];
  const hasActiveRound = rounds.some((r) => r.status === "active");
  const hasPendingRound = rounds.some((r) => r.status === "pending");
  const canStartNext =
    !!isAdmin &&
    !hasActiveRound &&
    tournament.status !== "completed" &&
    (hasPendingRound ||
      (tournament.format === "mexicano" &&
        (!tournament.roundsCount || rounds.length < tournament.roundsCount)));
  const canFinish =
    !!isAdmin &&
    !hasActiveRound &&
    !hasPendingRound &&
    rounds.length > 0 &&
    tournament.status !== "completed";

  const startNextRound = async () => {
    setWorking(true);
    const res = await fetch(`/api/community/tournaments/${id}/next-round`, { method: "POST" });
    setWorking(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e.error ?? "Failed");
      return;
    }
    load();
  };

  const completeTournament = async () => {
    if (!confirm(t.communityTournaments.confirmComplete)) return;
    setWorking(true);
    const res = await fetch(`/api/community/tournaments/${id}/complete`, { method: "POST" });
    setWorking(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e.error ?? "Failed");
      return;
    }
    load();
  };

  const deleteTournament = async () => {
    if (!confirm(t.communityTournaments.confirmDelete)) return;
    setWorking(true);
    const res = await fetch(`/api/community/tournaments/${id}`, { method: "DELETE" });
    setWorking(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e.error ?? "Failed");
      return;
    }
    router.push("/padelsmash/tournaments");
  };

  const playerName = (id: string) => communityPlayers[id]?.name ?? id;

  // Sit-outs per round = tournament players not appearing in any of that round's matches.
  const sitoutsByRound: Record<string, string[]> = {};
  for (const round of rounds) {
    const matches = matchesByRound[round.id] ?? [];
    const playing = new Set<string>();
    for (const m of matches) {
      m.team1PlayerIds.forEach((p) => playing.add(p));
      m.team2PlayerIds.forEach((p) => playing.add(p));
    }
    sitoutsByRound[round.id] = data.players
      .map((p) => p.communityPlayerId)
      .filter((id) => !playing.has(id));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/padelsmash/tournaments"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-padel-green mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> {t.communityTournaments.backToList}
      </Link>

      {/* Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{tournament.name}</h1>
              <Badge variant={tournament.status === "active" ? "green" : tournament.status === "completed" ? "blue" : "gray"}>
                {t.communityTournaments.statuses[tournament.status]}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t.communityTournaments.formats[
                ({
                  americano: "americano",
                  mexicano: "mexicano",
                  "team-americano": "teamAmericano",
                  "team-mexicano": "teamMexicano",
                  championship: "championship",
                } as const)[tournament.format]
              ]}
              {" · "}
              {tournament.pointsPerRound} {t.communityTournaments.points}
              {tournament.startDate && ` · ${tournament.startDate}`}
            </p>
            {tournament.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{tournament.description}</p>
            )}
          </div>
          {tournament.status === "completed" && tournament.winnerPlayerIds && tournament.winnerPlayerIds.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800 min-w-[200px]">
              <p className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold mb-2 flex items-center gap-1">
                <Crown className="w-4 h-4" />
                {t.communityTournaments.podium}
              </p>
              <div className="space-y-1">
                {tournament.winnerPlayerIds.map((pid, idx) => {
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "•";
                  return (
                    <p key={pid} className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                      <span>{medal}</span>
                      <span>{playerName(pid)}</span>
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {canStartNext && (
              <Button onClick={startNextRound} disabled={working}>
                <Play className="w-4 h-4 mr-1" />
                {rounds.filter((r) => r.status === "completed").length === 0
                  ? t.communityTournaments.startTournament
                  : t.communityTournaments.startNextRound}
              </Button>
            )}
            {canFinish && (
              <Button variant="secondary" onClick={completeTournament} disabled={working}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {t.communityTournaments.finishTournament}
              </Button>
            )}
            <Button variant="danger" onClick={deleteTournament} disabled={working} className="ml-auto">
              <Trash2 className="w-4 h-4 mr-1" />
              {t.communityTournaments.deleteTournament}
            </Button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rounds + matches column */}
        <div className="lg:col-span-2 space-y-4">
          {rounds.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">{t.communityTournaments.noRoundsYet}</p>
              {isAdmin && (
                <Button onClick={startNextRound} disabled={working} className="mt-4">
                  <Play className="w-4 h-4 mr-1" />
                  {t.communityTournaments.startTournament}
                </Button>
              )}
            </Card>
          ) : (
            rounds
              .slice()
              .reverse()
              .map((round) => (
                <RoundCard
                  key={round.id}
                  round={round}
                  matches={matchesByRound[round.id] ?? []}
                  sitouts={sitoutsByRound[round.id] ?? []}
                  playerName={playerName}
                  isAdmin={isAdmin}
                  pointsPerRound={tournament.pointsPerRound}
                  tournamentId={tournament.id}
                  onScored={load}
                  isCurrent={currentRound?.id === round.id}
                />
              ))
          )}
        </div>

        {/* Standings column */}
        <div className="lg:col-span-1">
          <Card className="p-5 sticky top-20">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-padel-green" />
              {t.communityTournaments.standings}
            </h2>
            {standings.length === 0 ? (
              <p className="text-sm text-gray-400">{t.communityTournaments.noStandings}</p>
            ) : (
              <div className="space-y-1">
                {standings.map((row) => (
                  <div
                    key={row.player.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                      row.rank === 1
                        ? "bg-amber-50 dark:bg-amber-900/20"
                        : row.rank === 2
                        ? "bg-gray-100 dark:bg-gray-700/50"
                        : row.rank === 3
                        ? "bg-orange-50 dark:bg-orange-900/20"
                        : ""
                    }`}
                  >
                    <span
                      className={`text-xs font-bold w-5 text-center ${
                        row.rank <= 3 ? "text-padel-green" : "text-gray-400"
                      }`}
                    >
                      {row.rank}
                    </span>
                    <Avatar name={row.player.name} imageUrl={row.player.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {row.player.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {row.tournamentPlayer.matchesWon}W · {row.tournamentPlayer.matchesPlayed} {t.communityTournaments.matches}
                        {row.tournamentPlayer.matchesPlayed > 0 && (
                          <>
                            {" · "}
                            <span className={
                              row.tournamentPlayer.totalPoints > row.tournamentPlayer.pointsAgainst
                                ? "text-green-600"
                                : row.tournamentPlayer.totalPoints < row.tournamentPlayer.pointsAgainst
                                ? "text-red-500"
                                : ""
                            }>
                              {row.tournamentPlayer.totalPoints - row.tournamentPlayer.pointsAgainst > 0 ? "+" : ""}
                              {row.tournamentPlayer.totalPoints - row.tournamentPlayer.pointsAgainst}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {row.tournamentPlayer.totalPoints}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function RoundCard({
  round,
  matches,
  sitouts,
  playerName,
  isAdmin,
  pointsPerRound,
  tournamentId,
  onScored,
  isCurrent,
}: {
  round: CommunityTournamentRound;
  matches: CommunityTournamentMatch[];
  sitouts: string[];
  playerName: (id: string) => string;
  isAdmin: boolean;
  pointsPerRound: number;
  tournamentId: string;
  onScored: () => void;
  isCurrent: boolean;
}) {
  const { t } = useLocale();

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t.communityTournaments.round} {round.roundNumber}
          {isCurrent && round.status === "active" && (
            <Badge variant="green" className="ml-2">
              {t.communityTournaments.live}
            </Badge>
          )}
        </h3>
        <Badge variant={round.status === "completed" ? "blue" : "green"}>
          {t.communityTournaments.roundStatuses[round.status]}
        </Badge>
      </div>

      <div className="space-y-2">
        {matches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            playerName={playerName}
            isAdmin={isAdmin}
            pointsPerRound={pointsPerRound}
            tournamentId={tournamentId}
            onScored={onScored}
          />
        ))}
      </div>

      {sitouts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
            {t.communityTournaments.sitoutLabel}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sitouts.map((id) => (
              <span
                key={id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {playerName(id)}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function MatchRow({
  match,
  playerName,
  isAdmin,
  pointsPerRound,
  tournamentId,
  onScored,
}: {
  match: CommunityTournamentMatch;
  playerName: (id: string) => string;
  isAdmin: boolean;
  pointsPerRound: number;
  tournamentId: string;
  onScored: () => void;
}) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [t1, setT1] = useState(String(match.team1Points ?? ""));
  const [t2, setT2] = useState(String(match.team2Points ?? ""));
  const [saving, setSaving] = useState(false);

  const handleT1Change = (v: string) => {
    setT1(v);
    if (v === "") {
      setT2("");
      return;
    }
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0 && n <= pointsPerRound) {
      setT2(String(pointsPerRound - n));
    }
  };

  const handleT2Change = (v: string) => {
    setT2(v);
    if (v === "") {
      setT1("");
      return;
    }
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0 && n <= pointsPerRound) {
      setT1(String(pointsPerRound - n));
    }
  };

  const save = async () => {
    const team1Points = Number(t1);
    const team2Points = Number(t2);
    if (!Number.isFinite(team1Points) || !Number.isFinite(team2Points)) {
      alert("Invalid scores");
      return;
    }
    if (team1Points + team2Points !== pointsPerRound) {
      if (!confirm(t.communityTournaments.confirmScoreMismatch.replace("{target}", String(pointsPerRound)))) return;
    }
    setSaving(true);
    const res = await fetch(`/api/community/tournaments/${tournamentId}/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team1Points, team2Points }),
    });
    setSaving(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e.error ?? "Failed");
      return;
    }
    setEditing(false);
    onScored();
  };

  const team1Won = match.team1Points !== null && match.team2Points !== null && match.team1Points > match.team2Points;
  const team2Won = match.team1Points !== null && match.team2Points !== null && match.team2Points > match.team1Points;

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="px-3 py-1 bg-gray-50 dark:bg-gray-700/50 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
        {match.courtLabel}
      </div>
      <div className="p-3 flex items-center gap-2">
        <div className={`flex-1 ${team1Won ? "font-semibold" : ""}`}>
          <p className="text-sm text-gray-900 dark:text-white">{match.team1PlayerIds.map(playerName).join(" + ")}</p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <input
                type="number"
                min="0"
                max={pointsPerRound}
                value={t1}
                onChange={(e) => handleT1Change(e.target.value)}
                className="w-14 px-2 py-1 text-center border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                min="0"
                max={pointsPerRound}
                value={t2}
                onChange={(e) => handleT2Change(e.target.value)}
                className="w-14 px-2 py-1 text-center border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </>
          ) : (
            <>
              <span className={`text-lg font-bold w-8 text-center ${team1Won ? "text-padel-green" : "text-gray-400"}`}>
                {match.team1Points ?? "–"}
              </span>
              <span className="text-gray-300">–</span>
              <span className={`text-lg font-bold w-8 text-center ${team2Won ? "text-padel-green" : "text-gray-400"}`}>
                {match.team2Points ?? "–"}
              </span>
            </>
          )}
        </div>
        <div className={`flex-1 text-right ${team2Won ? "font-semibold" : ""}`}>
          <p className="text-sm text-gray-900 dark:text-white">{match.team2PlayerIds.map(playerName).join(" + ")}</p>
        </div>
      </div>
      {isAdmin && (
        <div className="px-3 pb-3 flex justify-end gap-2">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                {t.communityTournaments.cancel}
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? t.communityTournaments.saving : t.communityTournaments.saveScore}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Edit3 className="w-3 h-3 mr-1" />
              {match.status === "completed" ? t.communityTournaments.editScore : t.communityTournaments.enterScore}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
