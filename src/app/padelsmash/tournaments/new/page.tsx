"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Users } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { useLocale } from "@/contexts/LocaleContext";
import type { CommunityPlayer, CommunityTournamentFormat } from "@/lib/types";
import { americanoTotalRounds, suggestedAmericanoRounds } from "@/lib/tournament-pairing";

type Step = 1 | 2 | 3;

export default function NewTournamentPage() {
  const { t } = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<CommunityTournamentFormat>("americano");
  const [pointsPerRound, setPointsPerRound] = useState<16 | 24 | 32>(24);
  const [roundsCount, setRoundsCount] = useState<string>("");
  const [courtCount, setCourtCount] = useState<number>(2);
  const [prizePositions, setPrizePositions] = useState<1 | 2 | 3>(1);
  const [groupSetsPerMatch, setGroupSetsPerMatch] = useState<1 | 3 | 5>(1);
  const [bracketSetsPerMatch, setBracketSetsPerMatch] = useState<1 | 3 | 5>(3);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const [allPlayers, setAllPlayers] = useState<CommunityPlayer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Step-4 (championship only): pair selected players into 16 teams.
  const [teamPairs, setTeamPairs] = useState<[string, string][]>([]);
  const [pendingFirst, setPendingFirst] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/community/players").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/community/me").then((r) => (r.ok ? r.json() : { isAdmin: false })),
    ]).then(([players, me]) => {
      if (!me.isAdmin) {
        router.replace("/padelsmash/tournaments");
        return;
      }
      setAllPlayers(players);
      setLoading(false);
    });
  }, [router]);

  const formats: { value: CommunityTournamentFormat; label: string; desc: string }[] = [
    { value: "americano", label: t.communityTournaments.formats.americano, desc: t.communityTournaments.formatDesc.americano },
    { value: "mexicano", label: t.communityTournaments.formats.mexicano, desc: t.communityTournaments.formatDesc.mexicano },
    { value: "team-americano", label: t.communityTournaments.formats.teamAmericano, desc: t.communityTournaments.formatDesc.teamAmericano },
    { value: "team-mexicano", label: t.communityTournaments.formats.teamMexicano, desc: t.communityTournaments.formatDesc.teamMexicano },
    { value: "championship", label: t.communityTournaments.formats.championship, desc: t.communityTournaments.formatDesc.championship },
  ];

  const togglePlayer = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredPlayers = allPlayers.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError(t.communityTournaments.errors.nameRequired);
      return;
    }
    if (selected.size < 4) {
      setError(t.communityTournaments.errors.minPlayers);
      return;
    }
    setSaving(true);

    const orderedIds = allPlayers.filter((p) => selected.has(p.id)).map((p) => p.id);

    // Championship: use the explicit team pairings the admin built in step 4.
    const teams =
      format === "championship"
        ? teamPairs.map(([p1, p2]) => ({ playerIds: [p1, p2] }))
        : undefined;

    const res = await fetch("/api/community/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        format,
        pointsPerRound,
        roundsCount: roundsCount ? Number(roundsCount) : null,
        courtCount,
        prizePositions,
        groupSetsPerMatch,
        bracketSetsPerMatch,
        startDate,
        playerIds: orderedIds,
        teams,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed");
      return;
    }
    const tournament = await res.json();
    router.push(`/padelsmash/tournaments/${tournament.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const playingPerRound = courtCount * 4;
  const sitoutsPerRound = format === "americano" ? Math.max(0, selected.size - playingPerRound) : 0;
  const americanoExactRounds = americanoTotalRounds(selected.size);
  const americanoSuggestedSitoutRounds = suggestedAmericanoRounds(selected.size, courtCount);
  const americanoTooFewPlayers = format === "americano" && selected.size > 0 && selected.size < playingPerRound;
  const americanoMultipleInvalid = format === "americano" && selected.size > 0 && selected.size % 4 !== 0;
  const championshipTeamsNeeded = 16; // default; 8 also accepted
  const championshipTargetPlayers = championshipTeamsNeeded * 2; // 32
  const championshipInvalid =
    format === "championship" && selected.size > 0 && selected.size !== 16 && selected.size !== 32;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/padelsmash/tournaments"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-padel-green mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> {t.communityTournaments.backToList}
      </Link>

      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t.communityTournaments.newTitle}</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 mt-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s
                  ? "bg-padel-green text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-1 rounded-full ${
                  step > s ? "bg-padel-green" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t.communityTournaments.step1Title}</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.communityTournaments.nameLabel} *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.communityTournaments.namePlaceholder}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.communityTournaments.descLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.communityTournaments.formatLabel}
            </label>
            <div className="space-y-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    format === f.value
                      ? "border-padel-green bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{f.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!name.trim()}>
              {t.communityTournaments.next}
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t.communityTournaments.step2Title}</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.communityTournaments.courtCountLabel}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setCourtCount(v)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                    courtCount === v
                      ? "border-padel-green bg-padel-green text-white"
                      : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {t.communityTournaments.courtCountHint.replace("{players}", String(playingPerRound))}
            </p>
          </div>

          {format !== "championship" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t.communityTournaments.pointsLabel}
              </label>
              <div className="flex gap-2">
                {[16, 24, 32].map((v) => (
                  <button
                    key={v}
                    onClick={() => setPointsPerRound(v as 16 | 24 | 32)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                      pointsPerRound === v
                        ? "border-padel-green bg-padel-green text-white"
                        : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.communityTournaments.groupSetsLabel}
                </label>
                <div className="flex gap-2">
                  {[1, 3, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setGroupSetsPerMatch(v as 1 | 3 | 5)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                        groupSetsPerMatch === v
                          ? "border-padel-green bg-padel-green text-white"
                          : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {v === 1 ? t.communityTournaments.oneSet : v === 3 ? t.communityTournaments.bestOf3 : t.communityTournaments.bestOf5}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.communityTournaments.bracketSetsLabel}
                </label>
                <div className="flex gap-2">
                  {[1, 3, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setBracketSetsPerMatch(v as 1 | 3 | 5)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                        bracketSetsPerMatch === v
                          ? "border-padel-green bg-padel-green text-white"
                          : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {v === 1 ? t.communityTournaments.oneSet : v === 3 ? t.communityTournaments.bestOf3 : t.communityTournaments.bestOf5}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.communityTournaments.prizePositionsLabel}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((v) => (
                <button
                  key={v}
                  onClick={() => setPrizePositions(v as 1 | 2 | 3)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                    prizePositions === v
                      ? "border-padel-green bg-padel-green text-white"
                      : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {v === 1 ? t.communityTournaments.prize1 : v === 2 ? t.communityTournaments.prize2 : t.communityTournaments.prize3}
                </button>
              ))}
            </div>
          </div>

          {format === "americano" ? (
            <div className="space-y-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-900 dark:text-blue-200">
                {t.communityTournaments.americanoRoundsNote}
              </div>
              {/* If admin will create with sit-outs, expose rounds count input */}
              {selected.size > 0 && selected.size > playingPerRound && selected.size % 4 === 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.communityTournaments.roundsLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={roundsCount}
                    onChange={(e) => setRoundsCount(e.target.value)}
                    placeholder={String(americanoSuggestedSitoutRounds)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          ) : format !== "championship" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t.communityTournaments.roundsLabel}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={roundsCount}
                onChange={(e) => setRoundsCount(e.target.value)}
                placeholder={t.communityTournaments.roundsPlaceholder}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.communityTournaments.startDateLabel}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              {t.communityTournaments.back}
            </Button>
            <Button onClick={() => setStep(3)}>{t.communityTournaments.next}</Button>
          </div>
        </Card>
      )}

      {step === 3 && format === "championship" && (
        <ChampionshipTeamBuilder
          allPlayers={allPlayers}
          teamPairs={teamPairs}
          setTeamPairs={setTeamPairs}
          pendingFirst={pendingFirst}
          setPendingFirst={setPendingFirst}
          onBack={() => setStep(2)}
          onSubmit={submit}
          saving={saving}
          error={error}
        />
      )}

      {step === 3 && format !== "championship" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t.communityTournaments.step3Title}</h2>
            <Badge variant={selected.size >= 4 ? "green" : "gray"}>
              <Users className="w-3 h-3 mr-1 inline" />
              {selected.size}
            </Badge>
          </div>

          {format === "americano" && selected.size > 0 && selected.size === playingPerRound && (
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              {t.communityTournaments.americanoRoundsCount
                .replace("{players}", String(selected.size))
                .replace("{rounds}", String(americanoExactRounds))
                .replace("{courts}", String(courtCount))}
            </p>
          )}
          {format === "americano" && sitoutsPerRound > 0 && selected.size % 4 === 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              {t.communityTournaments.americanoSitoutInfo
                .replace("{players}", String(selected.size))
                .replace("{courts}", String(courtCount))
                .replace("{sitouts}", String(sitoutsPerRound))
                .replace("{rounds}", String(roundsCount ? Number(roundsCount) : americanoSuggestedSitoutRounds))}
            </p>
          )}
          {americanoMultipleInvalid && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {t.communityTournaments.americanoMustBeMultipleOf4}
            </p>
          )}
          {americanoTooFewPlayers && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {t.communityTournaments.americanoTooFewPlayers
                .replace("{courts}", String(courtCount))
                .replace("{needed}", String(playingPerRound))
                .replace("{actual}", String(selected.size))}
            </p>
          )}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.communityTournaments.searchPlayers}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <div className="max-h-96 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
            {filteredPlayers.map((p) => {
              const isSelected = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlayer(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-padel-green border-padel-green" : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    {p.ntrp !== null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">NTRP {p.ntrp.toFixed(1)}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} disabled={saving}>
              {t.communityTournaments.back}
            </Button>
            <Button
              onClick={submit}
              disabled={
                saving ||
                selected.size < 4 ||
                americanoMultipleInvalid ||
                americanoTooFewPlayers
              }
            >
              {saving ? t.communityTournaments.creating : t.communityTournaments.create}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ChampionshipTeamBuilder({
  allPlayers,
  teamPairs,
  setTeamPairs,
  pendingFirst,
  setPendingFirst,
  onBack,
  onSubmit,
  saving,
  error,
}: {
  allPlayers: CommunityPlayer[];
  teamPairs: [string, string][];
  setTeamPairs: (pairs: [string, string][]) => void;
  pendingFirst: string | null;
  setPendingFirst: (id: string | null) => void;
  onBack: () => void;
  onSubmit: () => void;
  saving: boolean;
  error: string | null;
}) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const playerById = new Map(allPlayers.map((p) => [p.id, p]));
  const paired = new Set(teamPairs.flat());
  // Available = any community player not yet on a team.
  const available = allPlayers.filter((p) => !paired.has(p.id));
  const filteredAvailable = available.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );
  const targetTeams = 16; // championship default — could be 8 in future

  const handlePlayerTap = (id: string) => {
    if (pendingFirst === id) {
      setPendingFirst(null);
      return;
    }
    if (pendingFirst) {
      setTeamPairs([...teamPairs, [pendingFirst, id]]);
      setPendingFirst(null);
    } else {
      setPendingFirst(id);
    }
  };

  const removeTeam = (idx: number) => {
    setTeamPairs(teamPairs.filter((_, i) => i !== idx));
  };

  const autoPair = () => {
    const newPairs = [...teamPairs];
    const remaining = available.map((p) => p.id);
    while (newPairs.length < targetTeams && remaining.length >= 2) {
      newPairs.push([remaining.shift()!, remaining.shift()!]);
    }
    setTeamPairs(newPairs);
    setPendingFirst(null);
  };

  const clearAll = () => {
    setTeamPairs([]);
    setPendingFirst(null);
  };

  const allTeamsFormed = teamPairs.length === targetTeams;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white">{t.communityTournaments.buildTeamsTitle}</h2>
        <Badge variant={allTeamsFormed ? "green" : "gray"}>
          {teamPairs.length} / {targetTeams}
        </Badge>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        {t.communityTournaments.buildTeamsHint}
      </p>

      {/* Available players */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t.communityTournaments.availablePlayers} ({filteredAvailable.length})
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.communityTournaments.searchPlayers}
          className="w-full px-3 py-2 mb-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
          {filteredAvailable.map((p) => {
            const isPending = pendingFirst === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePlayerTap(p.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isPending
                    ? "bg-padel-green text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                <span>{p.name}</span>
                {p.ntrp !== null && (
                  <span className="text-[10px] opacity-70">{p.ntrp.toFixed(1)}</span>
                )}
              </button>
            );
          })}
          {filteredAvailable.length === 0 && (
            <p className="text-sm text-gray-400 italic">{t.communityTournaments.allPaired}</p>
          )}
        </div>
        {available.length > 0 && teamPairs.length < targetTeams && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="ghost" onClick={autoPair}>
              {t.communityTournaments.autoPairRemaining}
            </Button>
            {teamPairs.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clearAll}>
                {t.communityTournaments.clearAllTeams}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Formed teams — flat list. Group assignment happens via draw after creation. */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
          {t.communityTournaments.formedTeams}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: targetTeams }).map((_, slot) => {
            const team = teamPairs[slot];
            const teamPosLabel = `${slot + 1}`;
            if (!team) {
              return (
                <div
                  key={slot}
                  className="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-400 italic"
                >
                  #{teamPosLabel} — {t.communityTournaments.emptySlot}
                </div>
              );
            }
            const [p1Id, p2Id] = team;
            const p1 = playerById.get(p1Id);
            const p2 = playerById.get(p2Id);
            return (
              <div
                key={slot}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-green-50 dark:bg-green-900/10 flex items-center gap-2"
              >
                <span className="text-xs font-bold text-padel-green w-8">#{teamPosLabel}</span>
                <span className="text-sm text-gray-900 dark:text-white flex-1 truncate">
                  {p1?.name} + {p2?.name}
                </span>
                <button
                  onClick={() => removeTeam(slot)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium"
                  title={t.communityTournaments.removeTeam}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          {t.communityTournaments.back}
        </Button>
        <Button onClick={onSubmit} disabled={saving || !allTeamsFormed}>
          {saving ? t.communityTournaments.creating : t.communityTournaments.create}
        </Button>
      </div>
    </Card>
  );
}
