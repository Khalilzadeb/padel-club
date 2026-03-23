import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOpenGame } from "@/lib/data/open-games";
import { supabase } from "@/lib/supabase";
import { headers } from "next/headers";
import Link from "next/link";
import { MapPin, Clock, Users } from "lucide-react";
import { eloToDisplayLevel } from "@/lib/elo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const game = await getOpenGame(id);
  if (!game) return { title: "Game not found" };

  const { data: court } = await supabase.from("courts").select("name, location").eq("id", game.courtId).single();
  const { data: hostPlayer } = await supabase.from("players").select("name").eq("id", game.createdBy).single();
  const courtName = court?.location ? `${court.location} · ${court.name}` : (court?.name ?? "Court");
  const spotsLeft = game.maxPlayers - game.playerIds.length;
  const title = `Open Game · ${courtName}`;
  const eloText = game.eloMin != null && game.eloMax != null ? ` · ELO ${game.eloMin}-${game.eloMax}` : "";
  const hostText = hostPlayer?.name ? ` · Hosted by ${hostPlayer.name.split(" ")[0]}` : "";
  const description = `Tap to join${eloText}${hostText}`;

  // Build absolute image URL from request headers (works in all environments)
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const ogParams = new URLSearchParams({
    court: courtName,
    date: game.date,
    time: game.startTime,
    end: game.endTime,
    spots: String(spotsLeft),
    type: game.gameType,
    ...(game.eloMin != null && game.eloMax != null ? { elo: `${game.eloMin}-${game.eloMax}` } : {}),
  });
  const imageUrl = `${proto}://${host}/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function OpenGameSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { id } = await params;
  const { code } = await searchParams;
  const game = await getOpenGame(id);
  if (!game) notFound();

  const { data: court } = await supabase.from("courts").select("name, location").eq("id", game.courtId).single();
  const { data: playerRows } = await supabase.from("players").select("name, avatar_url, elo_rating").in("id", game.playerIds);
  const courtName = court?.location ? `${court.location} · ${court.name}` : (court?.name ?? game.courtId);
  const spotsLeft = game.maxPlayers - game.playerIds.length;

  const joinHref = code
    ? `/open-games?game=${id}&joinCode=${code}`
    : `/open-games?game=${id}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Green header */}
        <div className="bg-gradient-to-br from-green-700 to-padel-green px-6 py-8 text-white">
          <p className="text-green-200 text-xs font-semibold uppercase tracking-widest mb-2">PadelOn · Open Game</p>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-green-300 flex-shrink-0" />
            <h1 className="text-xl font-black">{courtName}</h1>
          </div>
          <div className="flex items-center gap-2 text-green-100">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{game.date} · {game.startTime} – {game.endTime}</p>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {game.playerIds.length}/{game.maxPlayers} players
              </span>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                spotsLeft > 0
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}>
                {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left` : "Full"}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                game.gameType === "ranked"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}>
                {game.gameType === "ranked" ? "🏆 Ranked" : "🤝 Friendly"}
              </span>
            </div>
          </div>

          {/* Players / Teams */}
          {game.teams ? (
            <div className="grid grid-cols-2 gap-2">
              {(["team1", "team2"] as const).map((teamKey, ti) => (
                <div key={teamKey} className={`rounded-xl p-3 ${ti === 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-orange-50 dark:bg-orange-900/20"}`}>
                  <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${ti === 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>Team {ti + 1}</p>
                  <div className="space-y-1.5">
                    {game.teams![teamKey].map((pid) => {
                      const p = (playerRows ?? []).find((r: { name: string; avatar_url: string | null; elo_rating: number }) => {
                        const idx = game.playerIds.indexOf(pid);
                        return idx !== -1 && (playerRows ?? [])[idx]?.name === r.name;
                      }) ?? (playerRows ?? [])[game.playerIds.indexOf(pid)];
                      if (!p) return null;
                      return (
                        <div key={pid} className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-padel-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{p.name.charAt(0)}</div>
                          <div>
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{p.name.split(" ")[0]}</p>
                            <p className="text-[10px] text-gray-400">Lv {eloToDisplayLevel(p.elo_rating)} · {p.elo_rating}</p>
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({ length: 2 - game.teams![teamKey].length }).map((_, i) => (
                      <div key={i} className={`text-xs ${ti === 0 ? "text-blue-300" : "text-orange-300"}`}>— open</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (playerRows ?? []).length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Players joined</p>
              <div className="flex gap-2 flex-wrap">
                {(playerRows ?? []).map((p: { name: string; avatar_url: string | null; elo_rating: number }, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 rounded-xl px-2 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-padel-green text-white flex items-center justify-center text-xs font-bold">{p.name.charAt(0)}</div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.name.split(" ")[0]}</p>
                      <p className="text-[10px] text-gray-400">Lv {eloToDisplayLevel(p.elo_rating)} · {p.elo_rating}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {game.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-200 dark:border-gray-600 pl-2">{game.notes}</p>
          )}

          {/* Join buttons */}
          {spotsLeft > 0 && game.teams ? (
            <div className="grid grid-cols-2 gap-2">
              <Link href={code ? `/open-games?game=${id}&team=1&joinCode=${code}` : `/open-games?game=${id}&team=1`}
                className="text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
                Join Team 1
              </Link>
              <Link href={code ? `/open-games?game=${id}&team=2&joinCode=${code}` : `/open-games?game=${id}&team=2`}
                className="text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
                Join Team 2
              </Link>
            </div>
          ) : (
            <Link href={joinHref}
              className="block w-full text-center bg-padel-green hover:bg-green-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
              {spotsLeft > 0 ? "Join This Game" : "View Game"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
