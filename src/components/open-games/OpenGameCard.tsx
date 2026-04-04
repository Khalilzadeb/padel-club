"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import OpenGameScoreForm from "@/components/open-games/OpenGameScoreForm";
import { OpenGame, Player, Court } from "@/lib/types";
import { Clock, MapPin, Users, ChevronRight, CheckCircle, AlertTriangle, Trophy, X, Copy, UserPlus, Share2 } from "lucide-react";
import Link from "next/link";
import { eloToDisplayLevel } from "@/lib/elo";
import { useLocale } from "@/contexts/LocaleContext";

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
  onJoinWaitlist: (id: string) => void;
  onLeaveWaitlist: (id: string) => void;
  loading?: boolean;
}

export default function OpenGameCard({ game, players, courts, currentPlayerId, onJoin, onLeave, onCancel, onSubmitScore, onConfirmScore, onDisputeScore, onUpdateBookingStatus, onInvitePlayer, onJoinWaitlist, onLeaveWaitlist, loading }: Props) {
  const { t } = useLocale();
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [showTeamPick, setShowTeamPick] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showBookFailedConfirm, setShowBookFailedConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleShare = () => {
    const base = "https://www.padelon.az";
    const url = game.isPrivate && isCreator && game.joinCode
      ? `${base}/open-games/${game.id}?code=${game.joinCode}`
      : `${base}/open-games/${game.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "PadelOn · Open Game", url });
    } else {
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };
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
        {/* Share + Badges */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <button
            onClick={handleShare}
            title="Share game"
            className="text-gray-400 hover:text-padel-green dark:hover:text-green-400 transition-colors mb-0.5"
          >
            {shareCopied ? <CheckCircle className="w-4 h-4 text-padel-green" /> : <Share2 className="w-4 h-4" />}
          </button>
          {isPending || isCompleted || game.status === "cancelled"
            ? (
              game.status === "pending_result"
                ? <Badge variant="yellow">{t.games.pendingResult}</Badge>
                : game.status === "completed"
                  ? <Badge variant="gray">{t.matches.confirmed}</Badge>
                  : <Badge variant="gray">{t.matches.filterAll}</Badge>
              )
            : isFull
              ? <Badge variant="red">{t.games.full}</Badge>
              : <Badge variant="green">{t.games.spotsLeft.replace("{count}", String(spotsLeft))}</Badge>
          }
          {game.gameType === "friendly"
            ? <Badge variant="gray">{t.games.friendly}</Badge>
            : <Badge variant="blue">{t.games.ranked}</Badge>
          }
          {game.isPrivate && <Badge variant="purple">{t.games.private}</Badge>}
          {game.status !== "cancelled" && !isCompleted && (
            game.courtBookingStatus === "booked"
              ? <Badge variant="green">{t.games.booked} ✓</Badge>
              : game.courtBookingStatus === "failed"
                ? <Badge variant="red">{t.games.bookFailed}</Badge>
                : <Badge variant="yellow">{t.games.notBooked}</Badge>
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
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name.split(" ")[0]}</span>
                        {p.id === game.createdBy && <span className="text-[10px] text-padel-green font-semibold">{t.games.host}</span>}
                      </div>
                      <span className="text-[10px] text-gray-400">Lv {eloToDisplayLevel(p.stats.eloRating)} · {p.stats.eloRating}</span>
                    </div>
                  </div>
                );
              })}
              {Array.from({ length: 2 - game.teams.team1.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-blue-200 dark:border-blue-700 flex items-center justify-center">
                    <span className="text-blue-300 dark:text-blue-500 text-sm">+</span>
                  </div>
                  <span className="text-sm text-blue-300 dark:text-blue-500">{t.games.open}</span>
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
                    <div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate block">{p.name.split(" ")[0]}</span>
                      <span className="text-[10px] text-gray-400">Lv {eloToDisplayLevel(p.stats.eloRating)} · {p.stats.eloRating}</span>
                    </div>
                  </div>
                );
              })}
              {Array.from({ length: 2 - game.teams.team2.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-orange-200 dark:border-orange-700 flex items-center justify-center">
                    <span className="text-orange-300 dark:text-orange-500 text-sm">+</span>
                  </div>
                  <span className="text-sm text-orange-300 dark:text-orange-500">{t.games.open}</span>
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
                {p.id === game.createdBy && <span className="text-[10px] text-padel-green font-medium">({t.games.host})</span>}
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
              <UserPlus className="w-3.5 h-3.5" /> {t.games.invitePlayer}
            </Button>
          )}

          {/* Host booking status update */}
          {isCreator && game.courtBookingStatus === "not_booked" && (
            <div className="flex gap-2 w-full pb-2 border-b border-gray-100 dark:border-gray-700 mb-1 flex-wrap">
              <span className="text-xs text-yellow-600 w-full">{t.games.confirmBooking}</span>
              <Button size="sm" onClick={() => onUpdateBookingStatus(game.id, "booked")} disabled={loading}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-3.5 h-3.5" /> {t.games.markBooked}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowBookFailedConfirm(true)} disabled={loading}
                className="flex items-center gap-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <AlertTriangle className="w-3.5 h-3.5" /> {t.games.markBookFailed}
              </Button>
            </div>
          )}

          {/* Confirm / Dispute */}
          {canConfirm && (
            <>
              <Button size="sm" onClick={() => onConfirmScore(game.id)} disabled={loading}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-3.5 h-3.5" /> {t.games.confirmScore}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDisputeScore(game.id)} disabled={loading}
                className="flex items-center gap-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <AlertTriangle className="w-3.5 h-3.5" /> {t.games.disputeScore}
              </Button>
            </>
          )}

          {/* Waiting for confirmation */}
          {isPending && isSubmitter && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 py-1">
              <Clock className="w-3.5 h-3.5" /> {t.games.pendingResult}
            </p>
          )}

          {/* Enter result */}
          {canEnterResult && !isPending && (
            <Button size="sm" onClick={() => setShowScoreForm(true)} disabled={loading}
              className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> {t.games.submitScore}
            </Button>
          )}

          {/* Leave / Cancel / Join (only when open or full, not pending) */}
          {!isPending && (isFull || game.status === "open") && (
            isCreator ? (
              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto" onClick={() => setShowCancelConfirm(true)} disabled={loading}>
                {t.games.cancelGame}
              </Button>
            ) : isJoined ? (
              <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 ml-auto" onClick={() => setShowLeaveConfirm(true)} disabled={loading}>
                {t.games.leaveGame}
              </Button>
            ) : isFull ? (
              game.myWaitlistPosition ? (
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {t.games.waitlistPosition.replace("#{pos}", String(game.myWaitlistPosition))}
                    {(game.waitlistCount ?? 0) > 1 && ` · ${t.games.waitlistCount.replace("{count}", String(game.waitlistCount))}`}
                  </span>
                  <Button size="sm" variant="ghost" className="text-gray-500 dark:text-gray-400" onClick={() => onLeaveWaitlist(game.id)} disabled={loading}>
                    {t.games.leaveWaitlist}
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 ml-auto" onClick={() => onJoinWaitlist(game.id)} disabled={loading}>
                  <Clock className="w-3.5 h-3.5" />
                  {t.games.joinWaitlist}
                  {(game.waitlistCount ?? 0) > 0 && <span className="ml-1 text-xs opacity-70">({game.waitlistCount})</span>}
                </Button>
              )
            ) : (
              showTeamPick ? (
                <div className="flex items-center gap-2 flex-wrap w-full">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Choose team:</span>
                  <Button
                    size="sm"
                    onClick={() => { onJoin(game.id, 1); setShowTeamPick(false); }}
                    disabled={loading || (game.teams ? game.teams.team1.length >= 2 : false)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t.games.joinTeam1} {game.teams ? `(${game.teams.team1.length}/2)` : ""}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { onJoin(game.id, 2); setShowTeamPick(false); }}
                    disabled={loading || (game.teams ? game.teams.team2.length >= 2 : false)}
                    className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {t.games.joinTeam2} {game.teams ? `(${game.teams.team2.length}/2)` : ""}
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
                  {t.games.joinGame} <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )
            )
          )}
        </div>
      )}

      <Modal isOpen={showScoreForm} onClose={() => setShowScoreForm(false)} title={t.games.submitScore} size="md">
        <OpenGameScoreForm
          players={joinedPlayers}
          currentPlayerId={currentPlayerId!}
          onSubmit={(data) => onSubmitScore(game.id, data)}
          onClose={() => setShowScoreForm(false)}
        />
      </Modal>

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title={t.games.invitePlayer} size="sm">
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
                      {t.games.invitePlayer}
                    </Button>
                  )}
                </div>
              );
            })}
        </div>
      </Modal>

      <Modal isOpen={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} title={t.games.leaveGame} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t.games.confirmLeave}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowLeaveConfirm(false)}>{t.common.no}</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => { onLeave(game.id); setShowLeaveConfirm(false); }} disabled={loading}>
              {t.common.yes}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} title={t.games.cancelGame} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t.games.confirmCancel}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowCancelConfirm(false)}>{t.common.no}</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => { onCancel(game.id); setShowCancelConfirm(false); }} disabled={loading}>
              {t.common.yes}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showBookFailedConfirm} onClose={() => setShowBookFailedConfirm(false)} title={t.games.bookFailed} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t.games.confirmBookFailed}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowBookFailedConfirm(false)}>{t.common.no}</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => { onUpdateBookingStatus(game.id, "failed"); setShowBookFailedConfirm(false); }} disabled={loading}>
              {t.common.yes}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
