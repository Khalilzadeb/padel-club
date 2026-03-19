import { TournamentBracketSlot, Player } from "@/lib/types";

interface BracketViewProps {
  bracket: TournamentBracketSlot[];
  players: Player[];
}

function getPlayer(players: Player[], id: string) {
  return players.find((p) => p.id === id);
}

function TeamDisplay({ ids, players, isWinner }: { ids?: [string, string]; players: Player[]; isWinner?: boolean }) {
  if (!ids) return <div className="text-xs text-gray-400 italic">TBD</div>;
  return (
    <div className={`text-xs font-medium ${isWinner ? "text-padel-green" : "text-gray-700"}`}>
      {ids.map((id) => getPlayer(players, id)?.name.split(" ")[0]).join(" & ")}
      {isWinner && <span className="ml-1 text-green-500">✓</span>}
    </div>
  );
}

export default function BracketView({ bracket, players }: BracketViewProps) {
  const rounds = [...new Set(bracket.map((s) => s.round))].sort((a, b) => b - a);

  const roundLabels: Record<number, string> = {
    4: "Quarter-finals",
    2: "Semi-finals",
    1: "Final",
    8: "Round of 16",
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {rounds.map((round) => {
          const slots = bracket.filter((s) => s.round === round).sort((a, b) => a.position - b.position);
          return (
            <div key={round} className="flex flex-col">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-center">
                {roundLabels[round] ?? `Round of ${round * 2}`}
              </p>
              <div className="flex flex-col justify-around h-full gap-6">
                {slots.map((slot) => (
                  <div key={slot.position} className="w-48">
                    <div className={`border rounded-lg overflow-hidden ${slot.winnerId ? "border-padel-green" : "border-gray-200"}`}>
                      <div className={`p-2.5 border-b ${slot.winnerId === "team1" ? "bg-green-50" : "bg-white"}`}>
                        <TeamDisplay ids={slot.team1PlayerIds} players={players} isWinner={slot.winnerId === "team1"} />
                      </div>
                      <div className={`p-2.5 ${slot.winnerId === "team2" ? "bg-green-50" : "bg-white"}`}>
                        <TeamDisplay ids={slot.team2PlayerIds} players={players} isWinner={slot.winnerId === "team2"} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
