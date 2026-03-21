"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import OpenGameScoreForm from "@/components/open-games/OpenGameScoreForm";
import { OpenGame, Player, Court } from "@/lib/types";
import { Clock, MapPin, Users, ChevronRight, Timer, CheckCircle, AlertTriangle, Trophy, X } from "lucide-react";
import Link from "next/link";

interface Props {
  game: OpenGame;
  players: Player[];
  courts: Court[];
  currentPlayerId?: string;
  onJoin: (id: string, teamNumber?: 1 | 2) => void;
  onLeave: (id: string) => void;
  onCancel: (id: string) => void;
  onSubmitScore: (id: string, data: { team1PlayerIds: [string, string]; team2PlayerIds: [string, string]; sets: { setNumber: number; team1Games: number; team2Games: number }[] }) => void;
  onConfirmScore: (id: string) => void;
  onDisputeScore: (id: string) => void;
  loading?: boolean;
}

const statusBadge = (status: OpenGame["status"]) => {
  if (status === "full") return <Badge variant="red">Full</Badge>;
  if (status === "pending_result") return <Badge variant="yellow">Pending result</Badge>;
  if (status === "completed") return <Badge variant="gray">Completed</Badge>;
  if (status === "cancelled") return <Badge variant="gray">Cancelled</Badge>;
  return null;
};

export default function OpenGameCard({ game, players, courts, currentPlayerId, onJoin, onLeave, onCancel, onSubmitScore, onConfirmScore, onDisputeScore, loading }: Props) {
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [showTeamPick, setShowTeamPick] = useState(false);
  const court = courts.find((c) => c.id === game.courtId);
  const joinedPlayers = game.playerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];
  const spotsLeft = game.maxPlayers - game.playerIds.length;
  const isJoined = currentPlayerId ? game.playerIds.includes(currentPlayerId) : false;
  const isCreator = currentPlayerId === game.createdBy;
  const isFull = game.status === "full";
  const isPending = game.status === "pending_result";
  const isCompleted = game.status === "completed";
  const isSubmitter = currentPlayerId === game.submittedBy;
  const canEnterResult = isJoined && (isFull || isPending) && !isCompleted && !game.matchId;
  const canConfirm = isPending && isJoined && !isSubmitter;

  return (
    <Card className={`p-4 ${isCompleted ? "opacity-75" : ""}`}>
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
          {isPending || isCompleted || game.status === "cancelled"
            ? statusBadge(game.status)
            : isFull
              ? <Badge variant="red">Full</Badge>
              : <Badge variant="green">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</Badge>
          }
        </div>
      </div>

      {/* Players */}
      {game.teams ? (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Team 1 */}
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1.5">Team 1</p>
            <div className="space-y-1">
              {game.teams.team1.map((id) => {
                const p = players.find((pl) => pl.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex items-center gap-1">
                    <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                    <span className="text-xs text-gray-700 truncate">{p.name.split(" ")[0]}</span>
                    {p.id === game.createdBy && <span className="text-[10px] text-padel-green font-medium">(host)</span>}
                  </div>
                );
              })}
              {Array.from({ length: 2 - game.teams.team1.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-blue-200 flex items-center justify-center">
                    <span className="text-blue-300 text-xs">+</span>
                  </div>
                  <span className="text-xs text-blue-300">open</span>
                </div>
              ))}
            </div>
          </div>
          {/* Team 2 */}
          <div className="bg-orange-50 rounded-lg p-2">
            <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide mb-1.5">Team 2</p>
            <div className="space-y-1">
              {game.teams.team2.map((id) => {
                const p = players.find((pl) => pl.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex items-center gap-1">
                    <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                    <span className="text-xs text-gray-700 truncate">{p.name.split(" ")[0]}</span>
                  </div>
                );
              })}
              {Array.from({ length: 2 - game.teams.team2.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-orange-200 flex items-center justify-center">
                    <span className="text-orange-300 text-xs">+</span>
                  </div>
                  <span className="text-xs text-orange-300">open</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {joinedPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                <span className="text-xs text-gray-700">{p.name.split(" ")[0]}</span>
                {p.id === game.createdBy && <span className="text-[10px] text-padel-green font-medium">(host)</span>}
              </div>
            ))}
            {Array.from({ length: spotsLeft }).map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
                <span className="text-gray-300 text-xs">+</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {game.notes && (
        <p className="text-xs text-gray-500 italic mb-3 border-l-2 border-gray-200 pl-2">{game.notes}</p>
      )}

      {/* Pending score preview */}
      {isPending && game.pendingScore && (
        <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <p className="text-xs font-semibold text-yellow-700 mb-1.5">Submitted result:</p>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="font-medium text-blue-700">
              {game.pendingScore.team1PlayerIds.map(id => players.find(p => p.id === id)?.name.split(" ")[0]).join(" & ")}
            </span>
            <div className="flex gap-1">
              {game.pendingScore.sets.map((s, i) => (
                <span key={i} className="font-mono font-bold text-gray-700">{s.team1Games}-{s.team2Games}</span>
              ))}
            </div>
            <span className="font-medium text-orange-700">
              {game.pendingScore.team2PlayerIds.map(id => players.find(p => p.id === id)?.name.split(" ")[0]).join(" & ")}
            </span>
          </div>
        </div>
      )}

      {/* Completed — link to match */}
      {isCompleted && game.matchId && (
        <Link href={`/matches/${game.matchId}`}
          className="flex items-center gap-1.5 mb-3 text-xs text-padel-green font-medium hover:underline">
          <Trophy className="w-3.5 h-3.5" /> View match result
        </Link>
      )}

      {/* Actions */}
      {currentPlayerId && !isCompleted && game.status !== "cancelled" && (
        <div className="flex gap-2 pt-2 border-t border-gray-50 flex-wrap">
          {/* Confirm / Dispute */}
          {canConfirm && (
            <>
              <Button size="sm" onClick={() => onConfirmScore(game.id)} disabled={loading}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-3.5 h-3.5" /> Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDisputeScore(game.id)} disabled={loading}
                className="flex items-center gap-1 text-red-500 hover:bg-red-50">
                <AlertTriangle className="w-3.5 h-3.5" /> Dispute
              </Button>
            </>
          )}

          {/* Waiting for confirmation */}
          {isPending && isSubmitter && (
            <p className="text-xs text-yellow-600 flex items-center gap-1 py-1">
              <Clock className="w-3.5 h-3.5" /> Waiting for the other team to confirm...
            </p>
          )}

          {/* Enter result */}
          {canEnterResult && !isPending && (
            <Button size="sm" onClick={() => setShowScoreForm(true)} disabled={loading}
              className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Enter Result
            </Button>
          )}

          {/* Leave / Cancel / Join (only when open or full, not pending) */}
          {!isPending && (isFull || game.status === "open") && (
            isCreator ? (
              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 ml-auto" onClick={() => onCancel(game.id)} disabled={loading}>
                Cancel Game
              </Button>
            ) : isJoined ? (
              <Button variant="ghost" size="sm" className="text-gray-500 ml-auto" onClick={() => onLeave(game.id)} disabled={loading}>
                Leave
              </Button>
            ) : !isFull ? (
              showTeamPick ? (
                <div className="flex items-center gap-2 flex-wrap w-full">
                  <span className="text-xs text-gray-500">Choose team:</span>
                  <Button
                    size="sm"
                    onClick={() => { onJoin(game.id, 1); setShowTeamPick(false); }}
                    disabled={loading || (game.teams ? game.teams.team1.length >= 2 : false)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Team 1 {game.teams ? `(${game.teams.team1.length}/2)` : ""}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { onJoin(game.id, 2); setShowTeamPick(false); }}
                    disabled={loading || (game.teams ? game.teams.team2.length >= 2 : false)}
                    className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Team 2 {game.teams ? `(${game.teams.team2.length}/2)` : ""}
                  </Button>
                  <button type="button" onClick={() => setShowTeamPick(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => game.teams ? setShowTeamPick(true) : onJoin(game.id)}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  Join Game <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )
            ) : null
          )}
        </div>
      )}

      <Modal isOpen={showScoreForm} onClose={() => setShowScoreForm(false)} title="Enter Match Result" size="md">
        <OpenGameScoreForm
          players={joinedPlayers}
          currentPlayerId={currentPlayerId!}
          onSubmit={(data) => onSubmitScore(game.id, data)}
          onClose={() => setShowScoreForm(false)}
        />
      </Modal>
    </Card>
  );
}
