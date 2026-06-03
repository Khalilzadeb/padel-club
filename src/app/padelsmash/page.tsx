"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Trophy, MessageSquare, BarChart3, Sparkles, Search, X, Phone, Mail, Plus, ImagePlus, Camera, Move, Check, Shield } from "lucide-react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useLocale } from "@/contexts/LocaleContext";
import { useCoverDrag } from "@/lib/hooks/useCoverDrag";
import type { CommunityPlayer, CommunitySummary } from "@/lib/types";
import AddPlayerModal from "@/components/community/AddPlayerModal";
import AnnouncementsTab from "@/components/community/AnnouncementsTab";
import SuperGamesTab from "@/components/community/SuperGamesTab";
import ManageAdminsModal from "@/components/community/ManageAdminsModal";

function ntrpVariant(ntrp: number | null): "blue" | "sky" | "green" | "yellow" | "orange" | "red" | "gray" {
  if (ntrp === null) return "gray";
  if (ntrp >= 4.0) return "red";
  if (ntrp >= 3.5) return "orange";
  if (ntrp >= 3.0) return "yellow";
  if (ntrp >= 2.5) return "green";
  if (ntrp >= 2.0) return "sky";
  return "blue";
}

type Tab = "members" | "superGames" | "events" | "announcements" | "stats";

export default function PadelSmashPage() {
  const { t } = useLocale();
  const [community, setCommunity] = useState<CommunitySummary | null>(null);
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [adminsOpen, setAdminsOpen] = useState(false);

  const load = () => {
    return Promise.all([
      fetch("/api/community").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/community/players").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/community/me").then((r) => (r.ok ? r.json() : { isAdmin: false })),
    ]).then(([c, p, me]) => {
      setCommunity(c);
      setPlayers(p);
      setIsAdmin(!!me.isAdmin);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = players.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const uploadImage = async (kind: "cover" | "logo", file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch("/api/community/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e.error ?? "Failed");
      return;
    }
    load();
  };

  // Persist the cover's vertical focal point, and reflect it locally right away.
  const saveCoverPosition = async (position: number) => {
    setCommunity((c) => (c ? { ...c, coverPosition: position } : c));
    await fetch("/api/community/upload", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position }),
    });
  };

  const cover = useCoverDrag(community?.coverPosition ?? 50, saveCoverPosition);

  const tabs: { key: Tab; label: string; icon: typeof Users; comingSoon?: boolean; href?: string }[] = [
    { key: "members", label: t.community.tabs.members, icon: Users },
    { key: "events", label: t.community.tabs.events, icon: Trophy, href: "/padelsmash/tournaments" },
    { key: "superGames", label: t.superGames.title, icon: Sparkles },
    { key: "announcements", label: t.community.tabs.announcements, icon: MessageSquare },
    { key: "stats", label: t.community.tabs.stats, icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t.community.notFound}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero / banner — cover_url overrides the gradient, with a dark overlay for text contrast. */}
      <div
        ref={cover.frameRef}
        className={`relative overflow-hidden rounded-2xl p-8 sm:p-12 mb-8 text-white shadow-lg ${
          community.coverUrl ? "" : "bg-gradient-to-br from-padel-green via-emerald-500 to-teal-600"
        }`}
      >
        {community.coverUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${community.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: `center ${cover.position}%`,
            }}
          />
        )}
        {community.coverUrl && <div className="absolute inset-0 bg-black/45" />}
        {!community.coverUrl && (
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <Sparkles className="absolute top-6 right-6 w-32 h-32" />
          </div>
        )}

        {/* Admin: drag overlay to reposition the cover vertically */}
        {isAdmin && community.coverUrl && cover.repositioning && (
          <div
            {...cover.overlayProps}
            className="absolute inset-0 z-20 cursor-move touch-none select-none"
          >
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
              <Move className="w-3.5 h-3.5" />
              {t.community.dragToReposition}
            </div>
          </div>
        )}

        {/* Admin: edit cover + reposition controls */}
        {isAdmin && (
          <div className="absolute top-3 right-3 z-30 flex gap-2">
            {community.coverUrl && (
              <button
                type="button"
                onClick={() => cover.setRepositioning((v) => !v)}
                className="cursor-pointer bg-black/40 hover:bg-black/60 backdrop-blur rounded-full p-2 transition-colors"
                title={cover.repositioning ? t.community.doneRepositioning : t.community.repositionCover}
              >
                {cover.repositioning ? <Check className="w-4 h-4" /> : <Move className="w-4 h-4" />}
              </button>
            )}
            <label className="cursor-pointer bg-black/40 hover:bg-black/60 backdrop-blur rounded-full p-2 transition-colors" title={t.community.uploadCover}>
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage("cover", f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        )}

        <div className="relative flex items-start gap-4 sm:gap-6">
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 overflow-hidden">
            {community.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={community.logoUrl} alt={community.name} className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="w-10 h-10 sm:w-14 sm:h-14" />
            )}
            {isAdmin && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 cursor-pointer transition-colors group" title={t.community.uploadLogo}>
                <ImagePlus className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage("logo", f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{community.name}</h1>
            <p className="text-white/90 mt-2 text-sm sm:text-base max-w-2xl">{community.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {t.community.playerCount.replace("{count}", String(community.playerCount))}
              </span>
              {isAdmin && (
                <Badge variant="yellow">{t.community.youAreAdmin}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(({ key, label, icon: Icon, comingSoon, href }) => {
          const className = `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            tab === key
              ? "bg-padel-green text-white"
              : comingSoon
              ? "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`;
          const content = (
            <>
              <Icon className="w-4 h-4" />
              {label}
              {comingSoon && (
                <span className="text-[10px] uppercase tracking-wide bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                  {t.community.comingSoon}
                </span>
              )}
            </>
          );
          if (href) {
            return (
              <Link key={key} href={href} className={className}>
                {content}
              </Link>
            );
          }
          return (
            <button
              key={key}
              onClick={() => !comingSoon && setTab(key)}
              disabled={comingSoon}
              className={className}
            >
              {content}
            </button>
          );
        })}
      </div>

      {tab === "members" && (
        <>
          {/* Search + Add */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.community.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {isAdmin && (
              <>
                <Button variant="secondary" onClick={() => setAdminsOpen(true)} size="sm">
                  <Shield className="w-4 h-4 mr-1" />
                  {t.community.manageAdmins}
                </Button>
                <Button onClick={() => setAddOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  {t.community.addPlayer}
                </Button>
              </>
            )}
          </div>

          {/* Players grid */}
          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-400">{t.community.noPlayers}</p>
              {isAdmin && players.length === 0 && (
                <Button onClick={() => setAddOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-1" />
                  {t.community.addFirstPlayer}
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((p, idx) => (
                <Card key={p.id} hover className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative shrink-0">
                      <Avatar name={p.name} imageUrl={p.avatarUrl} size="lg" />
                      <span
                        className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-sm ring-2 ring-white dark:ring-gray-800 ${
                          idx === 0
                            ? "bg-amber-400 text-amber-950"
                            : idx === 1
                            ? "bg-gray-300 text-gray-700"
                            : idx === 2
                            ? "bg-orange-400 text-orange-950"
                            : "bg-gray-900 dark:bg-gray-600 text-white"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate leading-tight">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.ntrp !== null && (
                          <Badge variant={ntrpVariant(p.ntrp)}>
                            NTRP {p.ntrp.toFixed(1)}
                          </Badge>
                        )}
                        {p.contactPhone && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 inline-flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 shrink-0" /> {p.contactPhone}
                          </span>
                        )}
                        {p.linkedPlayerId && (
                          <Link
                            href={`/players/${p.linkedPlayerId}`}
                            className="text-xs text-padel-green hover:underline inline-flex items-center gap-1"
                          >
                            {t.community.viewPadelonProfile} →
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                      {[
                        { value: p.matchesPlayed, label: t.community.matches },
                        { value: p.matchesWon, label: t.community.wins },
                        { value: p.tournamentsWon, label: t.community.trophies },
                      ].map((s, i) => (
                        <div key={i} className="text-center w-9 sm:w-11">
                          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-none">{s.value}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "superGames" && <SuperGamesTab isAdmin={isAdmin} />}

      {tab === "stats" && <LeaderboardTab />}

      {tab === "announcements" && <AnnouncementsTab isAdmin={isAdmin} />}

      {addOpen && (
        <AddPlayerModal
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            load();
          }}
        />
      )}

      {adminsOpen && <ManageAdminsModal onClose={() => setAdminsOpen(false)} />}
    </div>
  );
}

interface LeaderboardEntryDTO {
  player: CommunityPlayer;
  golds: number;
  silvers: number;
  bronzes: number;
  total: number;
}

function LeaderboardTab() {
  const { t } = useLocale();
  const [entries, setEntries] = useState<LeaderboardEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/community/leaderboard")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setEntries(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">{t.community.leaderboardEmpty}</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-padel-green" />
        {t.community.leaderboardTitle}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="text-left font-medium pb-2 w-12">#</th>
              <th className="text-left font-medium pb-2">{t.community.player}</th>
              <th className="text-center font-medium pb-2 w-16">🥇</th>
              <th className="text-center font-medium pb-2 w-16">🥈</th>
              <th className="text-center font-medium pb-2 w-16">🥉</th>
              <th className="text-right font-medium pb-2 w-20">{t.community.total}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, idx) => (
              <tr
                key={e.player.id}
                className={`border-b border-gray-50 dark:border-gray-700/50 ${
                  idx === 0
                    ? "bg-amber-50/40 dark:bg-amber-900/10"
                    : idx === 1
                    ? "bg-gray-50 dark:bg-gray-800/40"
                    : idx === 2
                    ? "bg-orange-50/40 dark:bg-orange-900/10"
                    : ""
                }`}
              >
                <td className="py-2 font-bold text-padel-green">{idx + 1}</td>
                <td className="py-2">
                  <Link
                    href={
                      e.player.linkedPlayerId
                        ? `/players/${e.player.linkedPlayerId}`
                        : `/padelsmash`
                    }
                    className="flex items-center gap-2"
                  >
                    <Avatar name={e.player.name} imageUrl={e.player.avatarUrl} size="sm" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {e.player.name}
                    </span>
                  </Link>
                </td>
                <td className="py-2 text-center font-semibold text-gray-900 dark:text-white">
                  {e.golds || ""}
                </td>
                <td className="py-2 text-center font-semibold text-gray-900 dark:text-white">
                  {e.silvers || ""}
                </td>
                <td className="py-2 text-center font-semibold text-gray-900 dark:text-white">
                  {e.bronzes || ""}
                </td>
                <td className="py-2 text-right font-bold text-padel-green">{e.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
