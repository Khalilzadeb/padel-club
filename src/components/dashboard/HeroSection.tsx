import Link from "next/link";
import Button from "@/components/ui/Button";
import { Users, Trophy, CalendarDays } from "lucide-react";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getPlayer } from "@/lib/data/players";
import { eloToDisplayLevel } from "@/lib/elo";
import GreetingLine from "./GreetingLine";
import { cookies } from "next/headers";
import { getTranslations, getLocaleFromCookieString, LOCALE_COOKIE } from "@/lib/i18n";

export default async function HeroSection() {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value ?? 'az';
  const t = getTranslations(locale);

  const session = await getSession();
  let playerStats: { eloRating: number; matchesPlayed: number; matchesWon: number } | null = null;
  let firstName: string | null = null;

  if (session?.userId) {
    const user = await findUserById(session.userId);
    if (user) {
      firstName = user.name.split(" ")[0];
      if (user.playerId) {
        const player = await getPlayer(user.playerId);
        if (player) {
          playerStats = {
            eloRating: player.stats.eloRating,
            matchesPlayed: player.stats.matchesPlayed,
            matchesWon: player.stats.matchesWon,
          };
        }
      }
    }
  }

  const winRate =
    playerStats && playerStats.matchesPlayed > 0
      ? `${Math.round((playerStats.matchesWon / playerStats.matchesPlayed) * 100)}%`
      : "—";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-padel-green-dark via-padel-green to-padel-green-light text-white p-8 md:p-10">
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-28 -translate-x-28" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">PadelOn</h1>

          {/* Greeting — client component (needs browser clock for timezone) */}
          <p className="text-green-100 text-base mb-6 min-h-[1.5rem]">
            {firstName
              ? <GreetingLine firstName={firstName} />
              : t.hero.tagline}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/open-games">
              <Button className="bg-white !text-padel-green hover:bg-green-50 shadow-md" size="lg">
                <Users className="w-5 h-5" /> {t.hero.findGame}
              </Button>
            </Link>
            <Link href="/players">
              <Button variant="ghost" className="!text-white hover:!bg-white/20" size="lg">
                <Trophy className="w-5 h-5" /> {t.hero.rankings}
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button variant="ghost" className="!text-white hover:!bg-white/20" size="lg">
                <CalendarDays className="w-5 h-5" /> {t.hero.tournaments}
              </Button>
            </Link>
          </div>
        </div>

        {playerStats && (
          <div className="grid grid-cols-3 gap-2 md:gap-3 flex-shrink-0 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-2 md:px-5 py-3 md:py-4 text-center">
              <p className="text-green-200 text-[10px] md:text-xs font-medium mb-1 leading-tight">{t.profile.eloRating}</p>
              <p className="text-3xl font-black">{playerStats.eloRating}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-2 md:px-5 py-3 md:py-4 text-center">
              <p className="text-green-200 text-[10px] md:text-xs font-medium mb-1 leading-tight">{t.profile.level}</p>
              <p className="text-3xl font-black">{eloToDisplayLevel(playerStats.eloRating)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-2 md:px-5 py-3 md:py-4 text-center">
              <p className="text-green-200 text-[10px] md:text-xs font-medium mb-1 leading-tight">{t.profile.winRate}</p>
              <p className="text-3xl font-black">{winRate}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
