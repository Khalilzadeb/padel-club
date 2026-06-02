"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Gift, Pencil, Lock, CalendarDays, Crown, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { useLocale } from "@/contexts/LocaleContext";
import type { CommunityPlayer, SuperGamePlayerRef, SuperGameSet, SuperGameView } from "@/lib/types";

const inputCls =
  "w-12 px-2 py-1.5 text-center border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white";

function fmtSets(sets: SuperGameSet[]): string {
  return sets.map((s) => `${s.a}-${s.b}`).join("  ");
}

export default function SuperGamesTab({ isAdmin: adminHint }: { isAdmin: boolean }) {
  const { t } = useLocale();
  const [games, setGames] = useState<SuperGameView[]>([]);
  const [isAdmin, setIsAdmin] = useState(adminHint);
  const [loggedIn, setLoggedIn] = useState(false);
  const [roster, setRoster] = useState<CommunityPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [finishTarget, setFinishTarget] = useState<SuperGameView | null>(null);

  const load = () =>
    Promise.all([
      fetch("/api/community/super-games").then((r) =>
        r.ok ? r.json() : { games: [], isAdmin: false, loggedIn: false }
      ),
      fetch("/api/community/players").then((r) => (r.ok ? r.json() : [])),
    ]).then(([g, r]: [{ games: SuperGameView[]; isAdmin: boolean; loggedIn: boolean }, CommunityPlayer[]]) => {
      setGames(g.games);
      setIsAdmin(g.isAdmin);
      setLoggedIn(g.loggedIn);
      setRoster(r);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const removeGame = async (g: SuperGameView) => {
    if (!confirm(t.superGames.confirmDelete)) return;
    const res = await fetch(`/api/community/super-games/${g.id}`, { method: "DELETE" });
    if (!res.ok) return alert("Failed");
    load();
  };

  const reopen = async (g: SuperGameView) => {
    const res = await fetch(`/api/community/super-games/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen" }),
    });
    if (!res.ok) return alert("Failed");
    load();
  };

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-padel-green" />
            {t.superGames.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.superGames.subtitle}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t.superGames.newGame}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : games.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">{t.superGames.noGames}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {games.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              isAdmin={isAdmin}
              loggedIn={loggedIn}
              onChanged={load}
              onFinish={() => setFinishTarget(g)}
              onReopen={() => reopen(g)}
              onDelete={() => removeGame(g)}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateModal
          roster={roster}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {finishTarget && (
        <FinishModal
          game={finishTarget}
          onClose={() => setFinishTarget(null)}
          onFinished={() => {
            setFinishTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function TeamView({ players }: { players: SuperGamePlayerRef[] }) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <div className="flex -space-x-2">
        {players.length > 0 ? (
          players.map((p) => (
            <Avatar
              key={p.id}
              name={p.name}
              imageUrl={p.avatarUrl}
              size="md"
              className="ring-2 ring-white dark:ring-gray-800"
            />
          ))
        ) : (
          <Avatar name="?" size="md" />
        )}
      </div>
      <p className="text-sm font-semibold text-center text-gray-900 dark:text-white truncate max-w-full">
        {players.map((p) => p.name).join(" + ") || "—"}
      </p>
    </div>
  );
}

function GameCard({
  game,
  isAdmin,
  loggedIn,
  onChanged,
  onFinish,
  onReopen,
  onDelete,
}: {
  game: SuperGameView;
  isAdmin: boolean;
  loggedIn: boolean;
  onChanged: () => void;
  onFinish: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  const { t } = useLocale();
  const finished = game.status === "finished";

  return (
    <Card className="p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {game.title || t.superGames.dailyGame}
            </h3>
            <Badge variant={finished ? "blue" : "green"}>
              {finished ? t.superGames.finished : t.superGames.open}
            </Badge>
          </div>
          {game.gameDate && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> {game.gameDate}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            {!finished ? (
              <Button size="sm" variant="secondary" onClick={onFinish}>
                <Crown className="w-4 h-4 mr-1" />
                {t.superGames.enterResult}
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={onReopen}>
                <Pencil className="w-4 h-4 mr-1" />
                {t.superGames.reopen}
              </Button>
            )}
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
              title={t.superGames.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Matchup */}
      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
        <TeamView players={game.teamA} />
        <div className="shrink-0 text-center">
          {finished && game.actualSets ? (
            <div>
              <p className="text-base font-black text-gray-900 dark:text-white">{fmtSets(game.actualSets)}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">{t.superGames.result}</p>
            </div>
          ) : (
            <span className="text-xs font-bold text-gray-400 bg-white dark:bg-gray-800 rounded-full px-2.5 py-1">
              {t.superGames.vs}
            </span>
          )}
        </div>
        <TeamView players={game.teamB} />
      </div>

      {/* Prize */}
      {game.prize && (
        <div className="mt-3 flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg px-3 py-2">
          <Gift className="w-4 h-4 shrink-0" />
          <span className="font-medium">{t.superGames.prize}:</span> {game.prize}
        </div>
      )}

      {/* Prediction form */}
      {!finished && (
        loggedIn ? (
          <PredictionForm game={game} onSaved={onChanged} />
        ) : (
          <p className="mt-4 text-sm text-gray-400 flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> {t.superGames.loginToPredict}
          </p>
        )
      )}

      {/* Predictions list */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          {t.superGames.predictions} ({game.predictions.length})
        </p>
        {game.predictions.length === 0 ? (
          <p className="text-sm text-gray-400">{t.superGames.noPredictions}</p>
        ) : (
          <div className="space-y-1">
            {game.predictions.map((p) => {
              const mine = game.myPrediction?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    finished && p.isWinner
                      ? "bg-green-50 dark:bg-green-900/20 ring-1 ring-green-300 dark:ring-green-800"
                      : mine
                      ? "bg-padel-green/5"
                      : ""
                  }`}
                >
                  <span className="text-gray-700 dark:text-gray-200 truncate flex items-center gap-1.5">
                    {finished && p.isWinner && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    {p.userName ?? "—"}
                    {mine && <span className="text-[10px] text-padel-green">({t.superGames.you})</span>}
                  </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white shrink-0">
                    {fmtSets(p.sets)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function PredictionForm({ game, onSaved }: { game: SuperGameView; onSaved: () => void }) {
  const { t } = useLocale();
  const [rows, setRows] = useState<{ a: string; b: string }[]>(() =>
    Array.from({ length: game.maxSets }, (_, i) => ({
      a: game.myPrediction?.sets[i]?.a?.toString() ?? "",
      b: game.myPrediction?.sets[i]?.b?.toString() ?? "",
    }))
  );
  const [saving, setSaving] = useState(false);

  const setCell = (i: number, key: "a" | "b", value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const submit = async () => {
    const filled = rows.map((r) => ({ a: r.a.trim(), b: r.b.trim() }));
    while (filled.length && filled[filled.length - 1].a === "" && filled[filled.length - 1].b === "") {
      filled.pop();
    }
    if (filled.length === 0) return alert(t.superGames.fillScore);
    if (filled.some((r) => r.a === "" || r.b === "")) return alert(t.superGames.fillBothScores);
    const sets = filled.map((r) => ({ a: Number(r.a), b: Number(r.b) }));

    setSaving(true);
    const res = await fetch(`/api/community/super-games/${game.id}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sets }),
    });
    setSaving(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return alert(e.error ?? "Failed");
    }
    onSaved();
  };

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
        {t.superGames.yourPrediction}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400">
              {t.superGames.set} {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={r.a}
                onChange={(e) => setCell(i, "a", e.target.value)}
                className={inputCls}
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={r.b}
                onChange={(e) => setCell(i, "b", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        ))}
        <Button onClick={submit} disabled={saving} size="sm">
          {saving
            ? t.superGames.saving
            : game.myPrediction
            ? t.superGames.updatePrediction
            : t.superGames.submitPrediction}
        </Button>
      </div>
    </div>
  );
}

function CreateModal({
  roster,
  onClose,
  onCreated,
}: {
  roster: CommunityPlayer[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState("");
  const [gameDate, setGameDate] = useState("");
  const [maxSets, setMaxSets] = useState(3);
  const [prize, setPrize] = useState("");
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [b1, setB1] = useState("");
  const [b2, setB2] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PlayerSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
    >
      <option value="">{t.superGames.selectPlayer}</option>
      {roster.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );

  const submit = async () => {
    setError(null);
    if (!a1 || !a2 || !b1 || !b2) {
      setError(t.superGames.allPlayersRequired);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/community/super-games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || null,
        gameDate: gameDate || null,
        maxSets,
        prize: prize.trim() || null,
        teamAPlayer1: a1,
        teamAPlayer2: a2,
        teamBPlayer1: b1,
        teamBPlayer2: b2,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "Failed");
      return;
    }
    onCreated();
  };

  return (
    <Modal isOpen onClose={onClose} title={t.superGames.newGame} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.superGames.teamA}
            </label>
            <div className="space-y-2">
              <PlayerSelect value={a1} onChange={setA1} />
              <PlayerSelect value={a2} onChange={setA2} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.superGames.teamB}
            </label>
            <div className="space-y-2">
              <PlayerSelect value={b1} onChange={setB1} />
              <PlayerSelect value={b2} onChange={setB2} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.superGames.gameDate}
            </label>
            <input
              type="date"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.superGames.maxSets}
            </label>
            <select
              value={maxSets}
              onChange={(e) => setMaxSets(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.superGames.titleOptional}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.superGames.titlePlaceholder}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.superGames.prizeOptional}
          </label>
          <input
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder={t.superGames.prizePlaceholder}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t.superGames.cancel}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? t.superGames.saving : t.superGames.create}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FinishModal({
  game,
  onClose,
  onFinished,
}: {
  game: SuperGameView;
  onClose: () => void;
  onFinished: () => void;
}) {
  const { t } = useLocale();
  const [rows, setRows] = useState<{ a: string; b: string }[]>(() =>
    Array.from({ length: game.maxSets }, (_, i) => ({
      a: game.actualSets?.[i]?.a?.toString() ?? "",
      b: game.actualSets?.[i]?.b?.toString() ?? "",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCell = (i: number, key: "a" | "b", value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const submit = async () => {
    setError(null);
    const filled = rows.map((r) => ({ a: r.a.trim(), b: r.b.trim() }));
    while (filled.length && filled[filled.length - 1].a === "" && filled[filled.length - 1].b === "") {
      filled.pop();
    }
    if (filled.length === 0 || filled.some((r) => r.a === "" || r.b === "")) {
      setError(t.superGames.fillBothScores);
      return;
    }
    const actualSets = filled.map((r) => ({ a: Number(r.a), b: Number(r.b) }));
    setSaving(true);
    const res = await fetch(`/api/community/super-games/${game.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finish", actualSets }),
    });
    setSaving(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "Failed");
      return;
    }
    onFinished();
  };

  return (
    <Modal isOpen onClose={onClose} title={t.superGames.enterResult} size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.superGames.enterResultHint}</p>
        <div className="flex flex-wrap items-end gap-3">
          {rows.map((r, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400">
                {t.superGames.set} {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={r.a}
                  onChange={(e) => setCell(i, "a", e.target.value)}
                  className={inputCls}
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={r.b}
                  onChange={(e) => setCell(i, "b", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t.superGames.cancel}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? t.superGames.saving : t.superGames.saveResult}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
