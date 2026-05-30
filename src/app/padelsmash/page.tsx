"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Trophy, MessageSquare, BarChart3, Sparkles, Search, X, Phone, Mail, Plus } from "lucide-react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useLocale } from "@/contexts/LocaleContext";
import type { CommunityPlayer, CommunitySummary } from "@/lib/types";
import AddPlayerModal from "@/components/community/AddPlayerModal";

function ntrpVariant(ntrp: number | null): "blue" | "sky" | "green" | "yellow" | "orange" | "red" | "gray" {
  if (ntrp === null) return "gray";
  if (ntrp >= 4.0) return "red";
  if (ntrp >= 3.5) return "orange";
  if (ntrp >= 3.0) return "yellow";
  if (ntrp >= 2.5) return "green";
  if (ntrp >= 2.0) return "sky";
  return "blue";
}

type Tab = "members" | "events" | "announcements" | "stats";

export default function PadelSmashPage() {
  const { t } = useLocale();
  const [community, setCommunity] = useState<CommunitySummary | null>(null);
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

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

  const tabs: { key: Tab; label: string; icon: typeof Users; comingSoon?: boolean }[] = [
    { key: "members", label: t.community.tabs.members, icon: Users },
    { key: "events", label: t.community.tabs.events, icon: Trophy, comingSoon: true },
    { key: "announcements", label: t.community.tabs.announcements, icon: MessageSquare, comingSoon: true },
    { key: "stats", label: t.community.tabs.stats, icon: BarChart3, comingSoon: true },
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
      {/* Hero / banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-padel-green via-emerald-500 to-teal-600 p-8 sm:p-12 mb-8 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Sparkles className="absolute top-6 right-6 w-32 h-32" />
        </div>
        <div className="relative flex items-start gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            {community.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={community.logoUrl} alt={community.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Sparkles className="w-10 h-10 sm:w-14 sm:h-14" />
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
        {tabs.map(({ key, label, icon: Icon, comingSoon }) => (
          <button
            key={key}
            onClick={() => !comingSoon && setTab(key)}
            disabled={comingSoon}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === key
                ? "bg-padel-green text-white"
                : comingSoon
                ? "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {comingSoon && (
              <span className="text-[10px] uppercase tracking-wide bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                {t.community.comingSoon}
              </span>
            )}
          </button>
        ))}
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
              <Button onClick={() => setAddOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {t.community.addPlayer}
              </Button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p, idx) => (
                <Card key={p.id} hover className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <Avatar name={p.name} imageUrl={p.avatarUrl} size="lg" />
                      <span className="absolute -top-1 -left-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</h3>
                        {p.ntrp !== null && (
                          <Badge variant={ntrpVariant(p.ntrp)}>
                            NTRP {p.ntrp.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        #{idx + 1}
                      </p>
                      <div className="mt-2 space-y-0.5">
                        {p.contactPhone && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {p.contactPhone}
                          </p>
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
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{p.matchesPlayed}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.community.matches}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{p.matchesWon}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.community.wins}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{p.tournamentsWon}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.community.trophies}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {addOpen && (
        <AddPlayerModal
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
