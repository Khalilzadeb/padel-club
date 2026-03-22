import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOpenGame } from "@/lib/data/open-games";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { MapPin, Clock, Users } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const game = await getOpenGame(id);
  if (!game) return { title: "Game not found" };

  const { data: court } = await supabase.from("courts").select("name, location").eq("id", game.courtId).single();
  const courtName = court?.location ? `${court.location} · ${court.name}` : (court?.name ?? "Court");
  const spotsLeft = game.maxPlayers - game.playerIds.length;
  const title = `Open Game · ${courtName}`;
  const description = `${game.date} at ${game.startTime} · ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left · ${game.gameType === "friendly" ? "Friendly 🤝" : "Ranked 🏆"}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
  const { data: playerRows } = await supabase.from("players").select("name, avatar_url").in("id", game.playerIds);
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
          <p className="text-green-200 text-xs font-semibold uppercase tracking-widest mb-2">PadelClub · Open Game</p>
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

          {/* Players */}
          {(playerRows ?? []).length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Players joined</p>
              <div className="flex gap-2 flex-wrap">
                {(playerRows ?? []).map((p: { name: string; avatar_url: string | null }, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 rounded-full pl-1 pr-3 py-1">
                    <div className="w-6 h-6 rounded-full bg-padel-green text-white flex items-center justify-center text-xs font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{p.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {game.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-200 dark:border-gray-600 pl-2">{game.notes}</p>
          )}

          <Link
            href={joinHref}
            className="block w-full text-center bg-padel-green hover:bg-green-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {spotsLeft > 0 ? "Join This Game" : "View Game"}
          </Link>
        </div>
      </div>
    </div>
  );
}
