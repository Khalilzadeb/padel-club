import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-padel-green rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">P</span>
              </div>
              <span className="text-white font-bold">PadelClub</span>
            </div>
            <p className="text-sm">Your premium padel experience. Book courts, track matches, and compete in tournaments.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/bookings" className="hover:text-white transition-colors">Book a Court</Link></li>
              <li><Link href="/players" className="hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link href="/matches" className="hover:text-white transition-colors">Match Results</Link></li>
              <li><Link href="/tournaments" className="hover:text-white transition-colors">Tournaments</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Club Info</h4>
            <ul className="space-y-2 text-sm">
              <li>5 Professional Courts</li>
              <li>Open 8:00 – 22:00 daily</li>
              <li>info@padelclub.com</li>
              <li>+34 900 123 456</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-center">
          © {new Date().getFullYear()} PadelClub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
