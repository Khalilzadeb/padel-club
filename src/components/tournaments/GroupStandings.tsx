import { TournamentGroup, Player } from "@/lib/types";

interface GroupStandingsProps {
  groups: TournamentGroup[];
  players: Player[];
}

function getPlayer(players: Player[], id: string) {
  return players.find((p) => p.id === id);
}

export default function GroupStandings({ groups, players }: GroupStandingsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {groups.map((group) => (
        <div key={group.groupName}>
          <h3 className="font-semibold text-gray-900 mb-3">{group.groupName}</h3>
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Team</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500">P</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500">W</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500">L</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500">Sets</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500 text-padel-green">Pts</th>
                </tr>
              </thead>
              <tbody>
                {[...group.standings]
                  .sort((a, b) => b.points - a.points)
                  .map((standing, idx) => {
                    const names = standing.teamPlayerIds
                      .map((id) => getPlayer(players, id)?.name.split(" ")[0])
                      .join(" & ");
                    const qualifies = idx < 2;
                    return (
                      <tr key={idx} className={`border-b border-gray-50 last:border-0 ${qualifies ? "bg-green-50/50" : ""}`}>
                        <td className="py-2.5 px-3 font-medium text-gray-900">
                          {qualifies && <span className="inline-block w-1.5 h-1.5 bg-padel-green rounded-full mr-2" />}
                          {names}
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-600">{standing.matchesPlayed}</td>
                        <td className="py-2.5 px-2 text-center text-green-600 font-medium">{standing.won}</td>
                        <td className="py-2.5 px-2 text-center text-red-400">{standing.lost}</td>
                        <td className="py-2.5 px-2 text-center text-gray-600">{standing.setsWon}-{standing.setsLost}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-padel-green">{standing.points}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Top 2 teams qualify to knockout round</p>
        </div>
      ))}
    </div>
  );
}
