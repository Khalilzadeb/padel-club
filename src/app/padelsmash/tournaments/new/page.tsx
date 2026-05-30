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
import { americanoTotalRounds } from "@/lib/tournament-pairing";

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
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const [allPlayers, setAllPlayers] = useState<CommunityPlayer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

    const res = await fetch("/api/community/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        format,
        pointsPerRound,
        roundsCount: roundsCount ? Number(roundsCount) : null,
        startDate,
        playerIds: orderedIds,
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

  const americanoRounds = format === "americano" ? americanoTotalRounds(selected.size) : 0;
  const americanoInvalid = format === "americano" && selected.size > 0 && selected.size % 4 !== 0;

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

          {format === "americano" ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-900 dark:text-blue-200">
              {t.communityTournaments.americanoRoundsNote}
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

      {step === 3 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t.communityTournaments.step3Title}</h2>
            <Badge variant={selected.size >= 4 ? "green" : "gray"}>
              <Users className="w-3 h-3 mr-1 inline" />
              {selected.size}
            </Badge>
          </div>

          {format === "americano" && americanoRounds > 0 && !americanoInvalid && (
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              {t.communityTournaments.americanoRoundsCount
                .replace("{players}", String(selected.size))
                .replace("{rounds}", String(americanoRounds))
                .replace("{courts}", String(selected.size / 4))}
            </p>
          )}
          {americanoInvalid && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {t.communityTournaments.americanoMustBeMultipleOf4}
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
            <Button onClick={submit} disabled={saving || selected.size < 4 || americanoInvalid}>
              {saving ? t.communityTournaments.creating : t.communityTournaments.create}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
