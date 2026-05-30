"use client";
import { useState, useEffect } from "react";
import { Shuffle, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useLocale } from "@/contexts/LocaleContext";
import type { CommunityTournamentPlayer } from "@/lib/types";

interface DrawPanelProps {
  tournamentId: string;
  players: CommunityTournamentPlayer[];
  playerName: (id: string) => string;
  isAdmin: boolean;
  onProgress: () => void;
}

interface Team {
  teamId: string;
  teamName: string;
  groupLabel: string | null;
  playerIds: string[];
  seed: number;
}

function buildTeams(players: CommunityTournamentPlayer[]): Team[] {
  const map = new Map<string, Team>();
  for (const p of players) {
    if (!p.teamId) continue;
    if (!map.has(p.teamId)) {
      map.set(p.teamId, {
        teamId: p.teamId,
        teamName: p.teamName ?? p.teamId,
        groupLabel: p.groupLabel,
        playerIds: [],
        seed: p.seed ?? 0,
      });
    }
    map.get(p.teamId)!.playerIds.push(p.communityPlayerId);
  }
  return Array.from(map.values()).sort((a, b) => a.seed - b.seed);
}

export default function DrawPanel({
  tournamentId,
  players,
  playerName,
  isAdmin,
  onProgress,
}: DrawPanelProps) {
  const { t } = useLocale();
  const teams = buildTeams(players);
  const groupCount = Math.max(1, Math.ceil(teams.length / 4));
  const groupLabels = ["A", "B", "C", "D"].slice(0, groupCount);

  const undrawn = teams.filter((tm) => !tm.groupLabel);
  const drawnByGroup: Record<string, Team[]> = {};
  for (const label of groupLabels) drawnByGroup[label] = [];
  for (const tm of teams) {
    if (tm.groupLabel && drawnByGroup[tm.groupLabel]) drawnByGroup[tm.groupLabel].push(tm);
  }
  for (const label of groupLabels) {
    drawnByGroup[label].sort((a, b) => a.teamName.localeCompare(b.teamName));
  }

  const drawnCount = teams.length - undrawn.length;
  const nextGroup = drawnCount < teams.length ? groupLabels[drawnCount % groupCount] : null;
  const nextSlot = drawnCount < teams.length ? Math.floor(drawnCount / groupCount) + 1 : null;

  const [drawing, setDrawing] = useState(false);
  const [reveal, setReveal] = useState<{
    playerNames: string;
    groupLabel: string;
    newName: string;
  } | null>(null);
  const [shuffleId, setShuffleId] = useState<string | null>(null);

  // Shuffling animation: cycle through undrawn team names every 80ms.
  // Snapshot the list when the draw starts so re-renders of the parent
  // don't re-create the array reference and reset the interval.
  useEffect(() => {
    if (!drawing) return;
    const list = undrawn.map((tm) => tm.teamId);
    if (list.length === 0) return;
    let i = 0;
    const interval = setInterval(() => {
      setShuffleId(list[i % list.length]);
      i++;
    }, 80);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing]);

  const drawNext = async () => {
    if (drawing) return;
    setDrawing(true);
    // Hide previous reveal as the new draw begins.
    setReveal(null);
    // Visual shuffle for ~1.2s before showing the result.
    await new Promise((r) => setTimeout(r, 1200));
    const res = await fetch(`/api/community/tournaments/${tournamentId}/draw`, { method: "POST" });
    if (!res.ok) {
      setDrawing(false);
      const e = await res.json().catch(() => ({}));
      alert(e.error ?? "Failed");
      return;
    }
    const data = await res.json();
    // Find the picked team's players to show their names.
    const picked = teams.find((tm) => tm.teamId === data.picked.teamId);
    const playerNames = picked ? picked.playerIds.map(playerName).join(" + ") : data.picked.previousName;
    setReveal({
      playerNames,
      groupLabel: data.picked.groupLabel,
      newName: data.picked.newName,
    });
    setShuffleId(null);
    setDrawing(false);
    // Refresh parent data so the team appears in its group box.
    // The reveal stays visible until the next draw is started.
    onProgress();
  };

  const teamLine = (team: Team) => {
    const names = team.playerIds.map(playerName);
    return names.join(" + ");
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Shuffle className="w-5 h-5 text-padel-green" />
          {t.communityTournaments.drawTitle}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {drawnCount} / {teams.length}
        </span>
      </div>

      {/* Reveal overlay — stays visible until the next draw starts. */}
      {reveal && (
        <div className="bg-gradient-to-br from-padel-green via-emerald-500 to-teal-600 text-white rounded-xl p-6 mb-4 text-center animate-in fade-in zoom-in duration-300">
          <Sparkles className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs uppercase tracking-wide opacity-80">{t.communityTournaments.drawnTo}</p>
          <p className="text-2xl font-black mt-2">{reveal.playerNames}</p>
          <p className="text-lg font-semibold opacity-90 mt-1">
            {t.communityTournaments.group} {reveal.groupLabel} — {reveal.newName}
          </p>
        </div>
      )}

      {/* 4 group columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {groupLabels.map((label) => (
          <div
            key={label}
            className={`border rounded-lg p-3 ${
              nextGroup === label && !reveal
                ? "border-padel-green bg-green-50 dark:bg-green-900/20"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <p className="text-xs font-bold text-padel-green uppercase tracking-wide mb-2">
              {t.communityTournaments.group} {label}
            </p>
            <div className="space-y-1">
              {[1, 2, 3, 4].map((slot) => {
                const team = drawnByGroup[label].find((tm) => tm.teamName === `${label}${slot}`);
                return (
                  <div
                    key={slot}
                    className={`text-xs px-2 py-1 rounded ${
                      team
                        ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        : "text-gray-400 italic"
                    }`}
                  >
                    <span className="font-bold mr-1">{label}{slot}</span>
                    {team ? teamLine(team) : t.communityTournaments.emptySlot}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Undrawn teams pile */}
      {undrawn.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {t.communityTournaments.undrawnTeams} ({undrawn.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {undrawn.map((tm) => (
              <span
                key={tm.teamId}
                className={`inline-flex px-2.5 py-1 rounded-full text-xs transition-all ${
                  shuffleId === tm.teamId
                    ? "bg-padel-green text-white scale-110"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {teamLine(tm)}
              </span>
            ))}
          </div>
        </div>
      )}

      {isAdmin && undrawn.length > 0 && (
        <div className="flex justify-center">
          <Button onClick={drawNext} disabled={drawing} className="min-w-[200px]">
            {drawing ? (
              <>
                <Shuffle className="w-4 h-4 mr-1 animate-spin" />
                {t.communityTournaments.drawing}
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4 mr-1" />
                {nextGroup && nextSlot
                  ? t.communityTournaments.drawNextTo
                      .replace("{group}", nextGroup)
                      .replace("{slot}", String(nextSlot))
                  : t.communityTournaments.drawNext}
              </>
            )}
          </Button>
        </div>
      )}

      {undrawn.length === 0 && (
        <p className="text-center text-sm text-padel-green font-medium">
          {t.communityTournaments.drawComplete}
        </p>
      )}
    </Card>
  );
}
