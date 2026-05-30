"use client";
import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import Card from "@/components/ui/Card";
import type { CommunityTournamentMatch } from "@/lib/types";

interface BracketViewProps {
  matches: CommunityTournamentMatch[];
  playerName: (id: string) => string;
  isAdmin: boolean;
  tournamentId: string;
  bracketSetsPerMatch: number;
  onScored: () => void;
}

function findByPos(stage: string, position: number, matches: CommunityTournamentMatch[]): CommunityTournamentMatch | undefined {
  return matches.find((m) => m.stage === stage && m.bracketPosition === position);
}

export default function BracketView({
  matches,
  playerName,
  isAdmin,
  tournamentId,
  bracketSetsPerMatch,
  onScored,
}: BracketViewProps) {
  const r16 = matches.filter((m) => m.stage === "round-of-16");
  if (r16.length === 0) return null;

  const final = matches.find((m) => m.stage === "final");
  const bronze = matches.find((m) => m.stage === "bronze");

  // R16 positions 1-4 = left, 5-8 = right
  const r16Left = [1, 2, 3, 4].map((p) => findByPos("round-of-16", p, matches));
  const r16Right = [5, 6, 7, 8].map((p) => findByPos("round-of-16", p, matches));
  // QF positions 1-2 from R16 (1,2)→QF1, (3,4)→QF2; (5,6)→QF3, (7,8)→QF4
  const qfLeft = [1, 2].map((p) => findByPos("quarterfinal", p, matches));
  const qfRight = [3, 4].map((p) => findByPos("quarterfinal", p, matches));
  const sfLeft = findByPos("semifinal", 1, matches);
  const sfRight = findByPos("semifinal", 2, matches);

  return (
    <Card className="p-4 overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1.4fr 1fr 1fr" }}>
          {/* R16 Left column */}
          <div className="flex flex-col justify-around gap-3">
            {r16Left.map((m, i) => (
              <BracketMatchCard
                key={`r16l-${i}`}
                match={m}
                label={`R16-${i + 1}`}
                playerName={playerName}
                isAdmin={isAdmin}
                tournamentId={tournamentId}
                setsPerMatch={bracketSetsPerMatch}
                onScored={onScored}
              />
            ))}
          </div>

          {/* QF Left column */}
          <div className="flex flex-col justify-around gap-3">
            {qfLeft.map((m, i) => (
              <BracketMatchCard
                key={`qfl-${i}`}
                match={m}
                label={`QF-${i + 1}`}
                playerName={playerName}
                isAdmin={isAdmin}
                tournamentId={tournamentId}
                setsPerMatch={bracketSetsPerMatch}
                onScored={onScored}
              />
            ))}
          </div>

          {/* Middle column: SF-1, Final, Bronze, SF-2 */}
          <div className="flex flex-col justify-around gap-3">
            <BracketMatchCard
              match={sfLeft}
              label="SF-1"
              playerName={playerName}
              isAdmin={isAdmin}
              tournamentId={tournamentId}
              setsPerMatch={bracketSetsPerMatch}
              onScored={onScored}
            />
            <div className="space-y-2">
              <BracketMatchCard
                match={final}
                label="FINAL"
                accent="amber"
                playerName={playerName}
                isAdmin={isAdmin}
                tournamentId={tournamentId}
                setsPerMatch={bracketSetsPerMatch}
                onScored={onScored}
              />
              {bronze && (
                <BracketMatchCard
                  match={bronze}
                  label="3rd place"
                  accent="orange"
                  playerName={playerName}
                  isAdmin={isAdmin}
                  tournamentId={tournamentId}
                  setsPerMatch={bracketSetsPerMatch}
                  onScored={onScored}
                />
              )}
            </div>
            <BracketMatchCard
              match={sfRight}
              label="SF-2"
              playerName={playerName}
              isAdmin={isAdmin}
              tournamentId={tournamentId}
              setsPerMatch={bracketSetsPerMatch}
              onScored={onScored}
            />
          </div>

          {/* QF Right column */}
          <div className="flex flex-col justify-around gap-3">
            {qfRight.map((m, i) => (
              <BracketMatchCard
                key={`qfr-${i}`}
                match={m}
                label={`QF-${i + 3}`}
                playerName={playerName}
                isAdmin={isAdmin}
                tournamentId={tournamentId}
                setsPerMatch={bracketSetsPerMatch}
                onScored={onScored}
              />
            ))}
          </div>

          {/* R16 Right column */}
          <div className="flex flex-col justify-around gap-3">
            {r16Right.map((m, i) => (
              <BracketMatchCard
                key={`r16r-${i}`}
                match={m}
                label={`R16-${i + 5}`}
                playerName={playerName}
                isAdmin={isAdmin}
                tournamentId={tournamentId}
                setsPerMatch={bracketSetsPerMatch}
                onScored={onScored}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function setsWon(match: CommunityTournamentMatch | undefined): { t1: number; t2: number } {
  if (!match?.sets) return { t1: 0, t2: 0 };
  let t1 = 0,
    t2 = 0;
  for (const s of match.sets) {
    if (s.team1Games > s.team2Games) t1++;
    else if (s.team2Games > s.team1Games) t2++;
  }
  return { t1, t2 };
}

function BracketMatchCard({
  match,
  label,
  accent,
  playerName,
  isAdmin,
  tournamentId,
  setsPerMatch,
  onScored,
}: {
  match: CommunityTournamentMatch | undefined;
  label: string;
  accent?: "amber" | "orange";
  playerName: (id: string) => string;
  isAdmin: boolean;
  tournamentId: string;
  setsPerMatch: number;
  onScored: () => void;
}) {
  type SetRow = { t1: string; t2: string };

  const [sets, setSets] = useState<SetRow[]>(() => {
    const base: SetRow[] = (match?.sets ?? []).map((s) => ({
      t1: String(s.team1Games),
      t2: String(s.team2Games),
    }));
    while (base.length < setsPerMatch) base.push({ t1: "", t2: "" });
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const lastSavedRef = useRef<SetRow[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next: SetRow[] = (match?.sets ?? []).map((s) => ({
      t1: String(s.team1Games),
      t2: String(s.team2Games),
    }));
    while (next.length < setsPerMatch) next.push({ t1: "", t2: "" });
    setSets(next);
    lastSavedRef.current = next.map((s) => ({ ...s }));
  }, [match?.sets, setsPerMatch]);

  if (!match) {
    return (
      <div className={`border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800/50 min-h-[68px]`}>
        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">{label}</p>
        <p className="text-xs text-gray-400 italic">Waiting</p>
      </div>
    );
  }

  const updateSet = (idx: number, field: "t1" | "t2", v: string) => {
    const next = sets.map((s, i) => (i === idx ? { ...s, [field]: v } : s));
    setSets(next);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const changed = next.some(
        (s, i) => s.t1 !== lastSavedRef.current[i]?.t1 || s.t2 !== lastSavedRef.current[i]?.t2
      );
      if (!changed) return;
      const completedSets = next
        .filter((s) => s.t1 !== "" && s.t2 !== "")
        .map((s) => ({ team1Games: Number(s.t1), team2Games: Number(s.t2) }))
        .filter((s) => Number.isFinite(s.team1Games) && Number.isFinite(s.team2Games));
      const winsNeeded = Math.ceil(setsPerMatch / 2);
      if (completedSets.length < winsNeeded) return;
      const t1 = completedSets.filter((s) => s.team1Games > s.team2Games).length;
      const t2 = completedSets.filter((s) => s.team2Games > s.team1Games).length;
      if (t1 < winsNeeded && t2 < winsNeeded) return;

      setSaving(true);
      const res = await fetch(`/api/community/tournaments/${tournamentId}/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sets: completedSets }),
      });
      setSaving(false);
      if (res.ok) {
        lastSavedRef.current = next.map((s) => ({ ...s }));
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1200);
        onScored();
      }
    }, 800);
  };

  const won = setsWon(match);
  const team1Won = match.status === "completed" && won.t1 > won.t2;
  const team2Won = match.status === "completed" && won.t2 > won.t1;

  const accentClass =
    accent === "amber"
      ? "border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-900/10"
      : accent === "orange"
      ? "border-orange-300 dark:border-orange-700 bg-orange-50/40 dark:bg-orange-900/10"
      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";

  return (
    <div className={`border ${accentClass} rounded-lg p-2.5 text-xs`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">{label}</p>
        {saving && <span className="text-gray-400 text-[10px]">…</span>}
        {!saving && justSaved && <Check className="w-3 h-3 text-padel-green" />}
      </div>
      {[0, 1].map((teamIdx) => {
        const ids = teamIdx === 0 ? match.team1PlayerIds : match.team2PlayerIds;
        const isWinner = teamIdx === 0 ? team1Won : team2Won;
        return (
          <div key={teamIdx} className="flex items-center gap-1 py-0.5">
            <span className={`flex-1 truncate ${isWinner ? "font-semibold text-padel-green" : "text-gray-700 dark:text-gray-300"}`}>
              {ids.map(playerName).join(" + ") || "—"}
            </span>
            <div className="flex gap-0.5">
              {sets.map((s, i) =>
                isAdmin ? (
                  <input
                    key={i}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="9"
                    value={teamIdx === 0 ? s.t1 : s.t2}
                    onChange={(e) => updateSet(i, teamIdx === 0 ? "t1" : "t2", e.target.value)}
                    className="w-7 px-0.5 py-0 text-center border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-padel-green"
                  />
                ) : (
                  <span
                    key={i}
                    className={`w-6 text-center font-bold ${isWinner ? "text-padel-green" : "text-gray-400"}`}
                  >
                    {(teamIdx === 0 ? s.t1 : s.t2) || "–"}
                  </span>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
