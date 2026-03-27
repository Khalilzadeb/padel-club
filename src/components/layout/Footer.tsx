import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, LOCALE_COOKIE } from "@/lib/i18n";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

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
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span>© {new Date().getFullYear()} PadelOn. {t.footer.rights}</span>
          <a
            href="https://www.instagram.com/padelon.az"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
          >
            <InstagramIcon />
            @padelon.az
          </a>
        </div>
      </div>
    </footer>
  );
}
