"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { Tournament, Player, TournamentPrize } from "@/lib/types";
import { TournamentBracketSlot } from "@/lib/types";
import { Trophy, Save, ArrowLeft, Plus, X, Users, Gift, Zap, RefreshCw } from "lucide-react";

const statusVariant: Record<string, "green" | "yellow" | "blue" | "gray"> = {
  active: "green", registration: "yellow", upcoming: "blue", completed: "gray",
};

type Tab = "info" | "teams" | "bracket" | "prizes";

function generateBracket(teams: string[][]): TournamentBracketSlot[] {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const numRounds = Math.ceil(Math.log2(Math.max(shuffled.length, 2)));
  const round1Matches = Math.pow(2, numRounds - 1);
  const slots: TournamentBracketSlot[] = [];

  for (let i = 0; i < round1Matches; i++) {
    const team1 = shuffled[i * 2] as [string, string] | undefined;
    const team2 = shuffled[i * 2 + 1] as [string, string] | undefined;
    slots.push({
      round: 1,
      position: i + 1,
      team1PlayerIds: team1?.length === 2 ? team1 : undefined,
      team2PlayerIds: team2?.length === 2 ? team2 : undefined,
    });
  }

  for (let round = 2; round <= numRounds; round++) {
    const numMatches = Math.pow(2, numRounds - round);
    for (let pos = 1; pos <= numMatches; pos++) {
      slots.push({ round, position: pos });
    }
  }

  return slots;
}

export default function AdminTournamentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tab, setTab] = useState<Tab>("info");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Info form state
  const [info, setInfo] = useState({
    name: "", description: "", status: "upcoming" as Tournament["status"],
    format: "knockout" as Tournament["format"], startDate: "", endDate: "",
    registrationDeadline: "", maxTeams: 8,
  });

  // Teams state
  const [teams, setTeams] = useState<string[][]>([]);
  const [player1Search, setPlayer1Search] = useState("");
  const [player2Search, setPlayer2Search] = useState("");
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  // Prizes state
  const [prizes, setPrizes] = useState<TournamentPrize[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/tournaments`).then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
    ]).then(([tournamentsData, playersData]) => {
      const t: Tournament | undefined = Array.isArray(tournamentsData)
        ? tournamentsData.find((x: Tournament) => x.id === id)
        : undefined;
      if (t) {
        setTournament(t);
        setInfo({
          name: t.name,
          description: t.description,
          status: t.status,
          format: t.format,
          startDate: t.startDate,
          endDate: t.endDate,
          registrationDeadline: t.registrationDeadline,
          maxTeams: t.maxTeams,
        });
        setTeams(t.registeredTeams ?? []);
        setPrizes(t.prizes ?? []);
      }
      const allPlayers: Player[] = Array.isArray(playersData)
        ? playersData.map((d: { player: Player }) => d.player)
        : [];
      setPlayers(allPlayers);
      setLoading(false);
    });
  }, [id]);

  const save = async (updates: Record<string, unknown>) => {
    setSaving(true);
    const res = await fetch(`/api/admin/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setTournament(updated);
    }
  };

  const saveInfo = () => save({
    name: info.name,
    description: info.description,
    status: info.status,
    format: info.format,
    startDate: info.startDate,
    endDate: info.endDate,
    registrationDeadline: info.registrationDeadline,
    maxTeams: info.maxTeams,
  });

  const registeredPlayerIds = teams.flat();

  const addTeam = async () => {
    if (!player1Id || !player2Id || player1Id === player2Id) return;
    if (registeredPlayerIds.includes(player1Id) || registeredPlayerIds.includes(player2Id)) return;
    const newTeams = [...teams, [player1Id, player2Id]];
    await save({ registeredTeams: newTeams });
    setTeams(newTeams);
    setPlayer1Id("");
    setPlayer2Id("");
    setPlayer1Search("");
    setPlayer2Search("");
  };

  const removeTeam = async (idx: number) => {
    const newTeams = teams.filter((_, i) => i !== idx);
    await save({ registeredTeams: newTeams });
    setTeams(newTeams);
  };

  const savePrizes = () => save({ prizes });

  const filteredPlayers1 = players.filter(
    (p) => p.name.toLowerCase().includes(player1Search.toLowerCase()) && p.id !== player2Id && !registeredPlayerIds.includes(p.id)
  );
  const filteredPlayers2 = players.filter(
    (p) => p.name.toLowerCase().includes(player2Search.toLowerCase()) && p.id !== player1Id && !registeredPlayerIds.includes(p.id)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return <p className="text-gray-500">Tournament not found.</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-gray-900 dark:text-white truncate">{tournament.name}</h1>
            <Badge variant={statusVariant[tournament.status]}>{tournament.status}</Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tournament.registeredTeams.length}/{tournament.maxTeams} teams registered</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["info", "teams", "bracket", "prizes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-padel-green text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        <Card className="p-5">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Name</label>
              <input
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Description</label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                value={info.description}
                onChange={(e) => setInfo({ ...info, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Status</label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={info.status}
                  onChange={(e) => setInfo({ ...info, status: e.target.value as Tournament["status"] })}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="registration">Registration Open</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Format</label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={info.format}
                  onChange={(e) => setInfo({ ...info, format: e.target.value as Tournament["format"] })}
                >
                  <option value="knockout">Knockout</option>
                  <option value="round-robin">Round Robin</option>
                  <option value="group-then-knockout">Group + Knockout</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={info.startDate}
                  onChange={(e) => setInfo({ ...info, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={info.endDate}
                  onChange={(e) => setInfo({ ...info, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Registration Deadline</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={info.registrationDeadline}
                  onChange={(e) => setInfo({ ...info, registrationDeadline: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Max Teams</label>
                <input
                  type="number"
                  min={2}
                  max={64}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={info.maxTeams}
                  onChange={(e) => setInfo({ ...info, maxTeams: parseInt(e.target.value) || 8 })}
                />
              </div>
            </div>
            <Button onClick={saveInfo} disabled={saving} className="w-full flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>
      )}

      {/* Teams Tab */}
      {tab === "teams" && (
        <div className="space-y-4">
          {/* Add team */}
          <Card className="p-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Team
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Player 1</label>
                <input
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green mb-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                  placeholder="Search player..."
                  value={player1Search}
                  onChange={(e) => { setPlayer1Search(e.target.value); setPlayer1Id(""); }}
                />
                {player1Search && !player1Id && (
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-40 overflow-y-auto shadow-sm bg-white dark:bg-gray-800">
                    {filteredPlayers1.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setPlayer1Id(p.id); setPlayer1Search(p.name); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-gray-900 dark:text-white"
                      >
                        <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                        {p.name}
                      </button>
                    ))}
                    {filteredPlayers1.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">No players found</p>
                    )}
                  </div>
                )}
                {player1Id && (
                  <p className="text-xs text-padel-green font-medium">✓ Selected</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Player 2</label>
                <input
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green mb-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                  placeholder="Search player..."
                  value={player2Search}
                  onChange={(e) => { setPlayer2Search(e.target.value); setPlayer2Id(""); }}
                />
                {player2Search && !player2Id && (
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-40 overflow-y-auto shadow-sm bg-white dark:bg-gray-800">
                    {filteredPlayers2.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setPlayer2Id(p.id); setPlayer2Search(p.name); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-gray-900 dark:text-white"
                      >
                        <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                        {p.name}
                      </button>
                    ))}
                    {filteredPlayers2.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">No players found</p>
                    )}
                  </div>
                )}
                {player2Id && (
                  <p className="text-xs text-padel-green font-medium">✓ Selected</p>
                )}
              </div>
            </div>
            <Button
              onClick={addTeam}
              disabled={saving || !player1Id || !player2Id || player1Id === player2Id}
              className="w-full"
            >
              {saving ? "Adding..." : "Add Team"}
            </Button>
          </Card>

          {/* Registered teams */}
          <Card className="p-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Registered Teams ({teams.length}/{tournament.maxTeams})
            </p>
            {teams.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No teams registered yet</p>
            ) : (
              <div className="space-y-2">
                {teams.map((team, idx) => {
                  const p1 = players.find((p) => p.id === team[0]);
                  const p2 = players.find((p) => p.id === team[1]);
                  return (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-5 text-center">{idx + 1}</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        {p1 && <Avatar name={p1.name} imageUrl={p1.avatarUrl} size="sm" />}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{p1?.name ?? team[0]}</span>
                        <span className="text-gray-300 dark:text-gray-600 text-sm">&</span>
                        {p2 && <Avatar name={p2.name} imageUrl={p2.avatarUrl} size="sm" />}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{p2?.name ?? team[1]}</span>
                      </div>
                      <button
                        onClick={() => removeTeam(idx)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Bracket Tab */}
      {tab === "bracket" && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Bracket
            </p>
            <Button
              size="sm"
              onClick={async () => {
                if (teams.length < 2) return;
                const bracket = generateBracket(teams);
                await save({ bracket, status: "active" });
              }}
              disabled={saving || teams.length < 2}
              className="flex items-center gap-1.5"
            >
              {tournament.bracket?.length ? (
                <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>
              ) : (
                <><Zap className="w-3.5 h-3.5" /> Generate Bracket</>
              )}
            </Button>
          </div>

          {teams.length < 2 && (
            <p className="text-sm text-gray-400 text-center py-6">
              Add at least 2 teams in the Teams tab first.
            </p>
          )}

          {teams.length >= 2 && !tournament.bracket?.length && (
            <div className="text-center py-6">
              <Zap className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No bracket yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                {teams.length} teams registered · Click "Generate Bracket" to create a random knockout draw.
              </p>
            </div>
          )}

          {tournament.bracket?.length ? (() => {
            const rounds = Array.from(new Set(tournament.bracket!.map((s) => s.round))).sort((a, b) => a - b);
            return (
              <div className="space-y-4 overflow-x-auto">
                {rounds.map((round) => {
                  const slots = tournament.bracket!.filter((s) => s.round === round).sort((a, b) => a.position - b.position);
                  const isLast = round === Math.max(...rounds);
                  return (
                    <div key={round}>
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                        {isLast ? "Final" : round === Math.max(...rounds) - 1 && rounds.length > 2 ? "Semi-Final" : `Round ${round}`}
                      </p>
                      <div className="space-y-2">
                        {slots.map((slot) => {
                          const t1 = slot.team1PlayerIds?.map((pid) => players.find((p) => p.id === pid));
                          const t2 = slot.team2PlayerIds?.map((pid) => players.find((p) => p.id === pid));
                          return (
                            <div key={`${round}-${slot.position}`} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm">
                              <span className="text-xs text-gray-400 dark:text-gray-500 w-4">{slot.position}</span>
                              <div className="flex-1 grid grid-cols-2 gap-1">
                                <div className={`flex items-center gap-1.5 p-1.5 rounded-lg ${slot.winnerId === "team1" ? "bg-green-100 dark:bg-green-900/30" : "bg-white dark:bg-gray-800"}`}>
                                  {t1?.map((p) => p && <Avatar key={p.id} name={p.name} imageUrl={p.avatarUrl} size="sm" />)}
                                  <span className="text-xs font-medium truncate text-gray-900 dark:text-white">
                                    {t1?.map((p) => p?.name.split(" ")[0]).join(" & ") || "TBD"}
                                  </span>
                                </div>
                                <div className={`flex items-center gap-1.5 p-1.5 rounded-lg ${slot.winnerId === "team2" ? "bg-green-100 dark:bg-green-900/30" : "bg-white dark:bg-gray-800"}`}>
                                  {t2?.map((p) => p && <Avatar key={p.id} name={p.name} imageUrl={p.avatarUrl} size="sm" />)}
                                  <span className="text-xs font-medium truncate text-gray-900 dark:text-white">
                                    {t2?.map((p) => p?.name.split(" ")[0]).join(" & ") || (slot.team1PlayerIds ? "TBD" : "–")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })() : null}
        </Card>
      )}

      {/* Prizes Tab */}
      {tab === "prizes" && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Gift className="w-4 h-4" /> Prize Structure
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPrizes([...prizes, { place: prizes.length + 1, description: "", value: undefined }])}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-3 mb-4">
            {prizes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No prizes added yet</p>
            )}
            {prizes.map((prize, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 ${
                  prize.place === 1 ? "bg-yellow-400" : prize.place === 2 ? "bg-gray-300" : "bg-amber-600"
                }`}>
                  {prize.place}
                </div>
                <input
                  className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                  placeholder="Prize description"
                  value={prize.description}
                  onChange={(e) => {
                    const updated = [...prizes];
                    updated[idx] = { ...updated[idx], description: e.target.value };
                    setPrizes(updated);
                  }}
                />
                <input
                  type="number"
                  className="w-24 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                  placeholder="Value (₼)"
                  value={prize.value ? prize.value / 100 : ""}
                  onChange={(e) => {
                    const updated = [...prizes];
                    const val = parseFloat(e.target.value);
                    updated[idx] = { ...updated[idx], value: isNaN(val) ? undefined : val * 100 };
                    setPrizes(updated);
                  }}
                />
                <button
                  onClick={() => setPrizes(prizes.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <Button onClick={savePrizes} disabled={saving} className="w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Prizes"}
          </Button>
        </Card>
      )}
    </div>
  );
}
