import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, LOCALE_COOKIE } from "@/lib/i18n";

export default async function Footer({ className }: { className?: string }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value ?? "az";
  const t = getTranslations(locale);

  return (
    <footer className={`bg-gray-900 text-gray-400 mt-auto ${className ?? ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-padel-green rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">P</span>
              </div>
              <span className="text-white font-bold">PadelOn</span>
            </div>
            <p className="text-sm">{t.footer.tagline}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">{t.footer.quickLinks}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/bookings" className="hover:text-white transition-colors">{t.footer.bookCourt}</Link></li>
              <li><Link href="/players" className="hover:text-white transition-colors">{t.footer.leaderboard}</Link></li>
              <li><Link href="/matches" className="hover:text-white transition-colors">{t.footer.matchResults}</Link></li>
              <li><Link href="/tournaments" className="hover:text-white transition-colors">{t.tournaments.title}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">{t.footer.clubInfo}</h4>
            <ul className="space-y-2 text-sm">
              <li>5 {t.footer.courts}</li>
              <li>{t.footer.openHours}</li>
              <li>info@padelclub.com</li>
              <li>+34 900 123 456</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-center">
          © {new Date().getFullYear()} PadelOn. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
