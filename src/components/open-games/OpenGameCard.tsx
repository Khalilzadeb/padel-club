"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import OpenGameScoreForm from "@/components/open-games/OpenGameScoreForm";
import { OpenGame, Player, Court } from "@/lib/types";
import { Clock, MapPin, Users, ChevronRight, CheckCircle, AlertTriangle, Trophy, X, Copy, UserPlus } from "lucide-react";
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
  onUpdateBookingStatus: (id: string, status: "booked" | "failed") => void;
  onInvitePlayer: (id: string, playerId: string) => void;
  loading?: boolean;
}

const statusBadge = (status: OpenGame["status"]) => {
  if (status === "full") return <Badge variant="red">Full</Badge>;
  if (status === "pending_result") return <Badge variant="yellow">Pending result</Badge>;
  if (status === "completed") return <Badge variant="gray">Completed</Badge>;
  if (status === "cancelled") return <Badge variant="gray">Cancelled</Badge>;
  return null;
};

export default function OpenGameCard({ game, players, courts, currentPlayerId, onJoin, onLeave, onCancel, onSubmitScore, onConfirmScore, onDisputeScore, onUpdateBookingStatus, onInvitePlayer, loading }: Props) {
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [showTeamPick, setShowTeamPick] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
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
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          {/* Location + Court */}
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-padel-green flex-shrink-0" />
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {court ? (court.location ? `${court.location}` : court.name) : game.courtId}
            </p>
            {court?.location && (
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">· {court.name}</span>
            )}
          </div>
          {/* Date + Time */}
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {new Date(game.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              <span className="text-gray-400 font-normal"> · </span>
              {game.startTime} – {game.endTime}
            </p>
          </div>
          {/* Price + ELO */}
          <div className="flex items-center gap-2 flex-wrap">
            {court?.pricePerHour != null && court.pricePerHour > 0 && (
              <span className="text-xs font-semibold text-padel-green bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                ₼{court.pricePerHour}/hr
              </span>
            )}
            {(game.eloMin || game.eloMax) && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                {game.eloMax ?? "?"} – {game.eloMin ?? "?"} ELO
              </span>
            )}
          </div>
        </div>
        {/* Badges */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isPending || isCompleted || game.status === "cancelled"
            ? statusBadge(game.status)
            : isFull
              ? <Badge variant="red">Full</Badge>
              : <Badge variant="green">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</Badge>
          }
          {game.gameType === "friendly"
            ? <Badge variant="gray">Friendly</Badge>
            : <Badge variant="blue">Ranked</Badge>
          }
          {game.isPrivate && <Badge variant="purple">Private</Badge>}
          {game.status !== "cancelled" && !isCompleted && (
            game.courtBookingStatus === "booked"
              ? <Badge variant="green">Booked ✓</Badge>
              : game.courtBookingStatus === "failed"
                ? <Badge variant="red">Book alınmadı</Badge>
                : <Badge variant="yellow">Book edilməyib</Badge>
          )}
        </div>
      </div>

      {/* Players */}
      {game.teams ? (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Team 1 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Team 1</p>
            <div className="space-y-1.5">
              {game.teams.team1.map((id) => {
                const p = players.find((pl) => pl.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex items-center gap-2">
                    <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name.split(" ")[0]}</span>
                    {p.id === game.createdBy && <span className="text-[10px] text-padel-green font-semibold">host</span>}
                  </div>
                );
              })}
              {Array.from({ length: 2 - game.teams.team1.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-blue-200 dark:border-blue-700 flex items-center justify-center">
                    <span className="text-blue-300 dark:text-blue-500 text-sm">+</span>
                  </div>
                  <span className="text-sm text-blue-300 dark:text-blue-500">open</span>
                </div>
              ))}
            </div>
          </div>
          {/* Team 2 */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">Team 2</p>
            <div className="space-y-1.5">
              {game.teams.team2.map((id) => {
                const p = players.find((pl) => pl.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex items-center gap-2">
                    <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name.split(" ")[0]}</span>
                  </div>
                );
              })}
              {Array.from({ length: 2 - game.teams.team2.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-orange-200 dark:border-orange-700 flex items-center justify-center">
                    <span className="text-orange-300 dark:text-orange-500 text-sm">+</span>
                  </div>
                  <span className="text-sm text-orange-300 dark:text-orange-500">open</span>
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
                <span className="text-xs text-gray-700 dark:text-gray-300">{p.name.split(" ")[0]}</span>
                {p.id === game.createdBy && <span className="text-[10px] text-padel-green font-medium">(host)</span>}
              </div>
            ))}
            {Array.from({ length: spotsLeft }).map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center">
                <span className="text-gray-300 dark:text-gray-500 text-xs">+</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join code — visible to host only */}
      {isCreator && game.isPrivate && game.joinCode && (
        <div className="mb-3 flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Join code:</span>
          <span className="font-mono font-bold text-purple-800 dark:text-purple-300 tracking-widest">{game.joinCode}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(game.joinCode!); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
            className="ml-auto text-purple-500 hover:text-purple-700 dark:hover:text-purple-300"
          >
            {codeCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {game.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3 border-l-2 border-gray-200 dark:border-gray-600 pl-2">{game.notes}</p>
      )}

      {/* Pending score preview */}
      {isPending && game.pendingScore && (
        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1.5">Submitted result:</p>
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium text-blue-700 dark:text-blue-400">
              {game.pendingScore.team1PlayerIds.map(id => players.find(p => p.id === id)?.name.split(" ")[0]).join(" & ")}
            </span>
            <div className="flex gap-1">
              {game.pendingScore.sets.map((s, i) => (
                <span key={i} className="font-mono font-bold text-gray-700 dark:text-gray-300">{s.team1Games}-{s.team2Games}</span>
              ))}
            </div>
            <span className="font-medium text-orange-700 dark:text-orange-400">
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
        <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-gray-700 flex-wrap">
          {/* Host: invite more players */}
          {isCreator && !isPending && !isCompleted && (
            <Button size="sm" variant="ghost" onClick={() => setShowInvite(true)} disabled={loading}
              className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20">
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </Button>
          )}

          {/* Host booking status update */}
          {isCreator && game.courtBookingStatus === "not_booked" && (
            <div className="flex gap-2 w-full pb-2 border-b border-gray-100 dark:border-gray-700 mb-1 flex-wrap">
              <span className="text-xs text-yellow-600 w-full">Kortu book etdinmi?</span>
              <Button size="sm" onClick={() => onUpdateBookingStatus(game.id, "booked")} disabled={loading}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-3.5 h-3.5" /> Book edildi
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onUpdateBookingStatus(game.id, "failed")} disabled={loading}
                className="flex items-center gap-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <AlertTriangle className="w-3.5 h-3.5" /> Alınmadı
              </Button>
            </div>
          )}

          {/* Confirm / Dispute */}
          {canConfirm && (
            <>
              <Button size="sm" onClick={() => onConfirmScore(game.id)} disabled={loading}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-3.5 h-3.5" /> Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDisputeScore(game.id)} disabled={loading}
                className="flex items-center gap-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <AlertTriangle className="w-3.5 h-3.5" /> Dispute
              </Button>
            </>
          )}

          {/* Waiting for confirmation */}
          {isPending && isSubmitter && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 py-1">
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
              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto" onClick={() => onCancel(game.id)} disabled={loading}>
                Cancel Game
              </Button>
            ) : isJoined ? (
              <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 ml-auto" onClick={() => onLeave(game.id)} disabled={loading}>
                Leave
              </Button>
            ) : !isFull ? (
              showTeamPick ? (
                <div className="flex items-center gap-2 flex-wrap w-full">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Choose team:</span>
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
                  <button type="button" onClick={() => setShowTeamPick(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite a Player" size="sm">
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {players
            .filter((p) => !game.playerIds.includes(p.id) && p.id !== currentPlayerId)
            .map((p) => {
              const alreadyInvited = (game.invitedPlayerIds ?? []).includes(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.stats.eloRating} ELO</p>
                  </div>
                  {alreadyInvited ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Invited</span>
                  ) : (
                    <Button size="sm" onClick={() => { onInvitePlayer(game.id, p.id); setShowInvite(false); }} disabled={loading}>
                      Invite
                    </Button>
                  )}
                </div>
              );
            })}
        </div>
      </Modal>
    </Card>
  );
}
