"use client";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { OpenGame, Player, Court } from "@/lib/types";
import { Clock, MapPin, Users, ChevronRight, Timer } from "lucide-react";

interface Props {
  game: OpenGame;
  players: Player[];
  courts: Court[];
  currentPlayerId?: string;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onCancel: (id: string) => void;
  loading?: boolean;
}

export default function OpenGameCard({ game, players, courts, currentPlayerId, onJoin, onLeave, onCancel, loading }: Props) {
  const court = courts.find((c) => c.id === game.courtId);
  const joinedPlayers = game.playerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];
  const spotsLeft = game.maxPlayers - game.playerIds.length;
  const isJoined = currentPlayerId ? game.playerIds.includes(currentPlayerId) : false;
  const isCreator = currentPlayerId === game.createdBy;
  const isFull = game.status === "full";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            <span>{court?.name ?? game.courtId}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{game.date} · {game.startTime} – {game.endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Timer className="w-3.5 h-3.5" />
            <span>{game.durationMinutes} min</span>
            {(game.eloMin || game.eloMax) && (
              <span className="text-blue-500 font-medium">· {game.eloMin ?? "?"} – {game.eloMax ?? "?"} ELO</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isFull ? (
            <Badge variant="red">Full</Badge>
          ) : (
            <Badge variant="green">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</Badge>
          )}
        </div>
      </div>

      {/* Players */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <div className="flex items-center gap-1.5 flex-wrap">
          {joinedPlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
              <span className="text-xs text-gray-700">{p.name.split(" ")[0]}</span>
              {p.id === game.createdBy && (
                <span className="text-[10px] text-padel-green font-medium">(host)</span>
              )}
            </div>
          ))}
          {Array.from({ length: spotsLeft }).map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
              <span className="text-gray-300 text-xs">+</span>
            </div>
          ))}
        </div>
      </div>

      {game.notes && (
        <p className="text-xs text-gray-500 italic mb-3 border-l-2 border-gray-200 pl-2">{game.notes}</p>
      )}

      {/* Actions */}
      {currentPlayerId && (
        <div className="flex gap-2 pt-2 border-t border-gray-50">
          {isCreator ? (
            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onCancel(game.id)} disabled={loading}>
              Cancel Game
            </Button>
          ) : isJoined ? (
            <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => onLeave(game.id)} disabled={loading}>
              Leave
            </Button>
          ) : (
            <Button size="sm" onClick={() => onJoin(game.id)} disabled={loading || isFull} className="flex items-center gap-1">
              Join Game <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
