"use client";
import Card from "@/components/ui/Card";
import { useLocale } from "@/contexts/LocaleContext";
import { buildTeams, computeGroupStandings } from "@/lib/championship-bracket";
import type { CommunityTournamentMatch, CommunityTournamentPlayer } from "@/lib/types";

interface Props {
  players: CommunityTournamentPlayer[];
  matches: CommunityTournamentMatch[];
  playerName: (id: string) => string;
}

export default function GroupStandingsView({ players, matches, playerName }: Props) {
  const { t } = useLocale();
  const teams = buildTeams(players);
  const groupLabels = Array.from(new Set(teams.map((tm) => tm.groupLabel))).filter(Boolean).sort();

  if (groupLabels.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-gray-400">{t.communityTournaments.noStandings}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groupLabels.map((label) => {
        const rows = computeGroupStandings(teams, matches, label);
        return (
          <Card key={label} className="p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-padel-green mb-2">
              {t.communityTournaments.group} {label}
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 text-[10px]">
                  <th className="text-left font-medium pb-1">#</th>
                  <th className="text-left font-medium pb-1">{t.communityTournaments.team}</th>
                  <th className="text-center font-medium pb-1">P</th>
                  <th className="text-center font-medium pb-1">W</th>
                  <th className="text-center font-medium pb-1">S</th>
                  <th className="text-right font-medium pb-1">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const team = teams.find((tm) => tm.teamId === row.teamId);
                  const names = team ? team.playerIds.map(playerName).join(" & ") : row.teamName;
                  return (
                    <tr
                      key={row.teamId}
                      className={`border-t border-gray-100 dark:border-gray-700 ${
                        idx === 0 ? "bg-amber-50/40 dark:bg-amber-900/10" : ""
                      }`}
                    >
                      <td className="py-1 pr-2 font-bold text-padel-green w-6">{idx + 1}</td>
                      <td className="py-1 pr-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{row.teamName}</p>
                        <p className="text-[10px] text-gray-400 truncate">{names}</p>
                      </td>
                      <td className="py-1 text-center text-gray-700 dark:text-gray-300">{row.matchesPlayed}</td>
                      <td className="py-1 text-center text-gray-700 dark:text-gray-300">{row.matchesWon}</td>
                      <td className="py-1 text-center text-gray-700 dark:text-gray-300">
                        {row.setsWon}-{row.setsLost}
                      </td>
                      <td className="py-1 text-right font-bold text-gray-900 dark:text-white">{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        );
      })}
    </div>
  );
}
