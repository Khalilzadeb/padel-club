import Link from "next/link";
import Button from "@/components/ui/Button";
import { Users, Trophy, TrendingUp } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-padel-green-dark via-padel-green to-padel-green-light text-white p-8 md:p-12">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

      <div className="relative">
        <p className="text-green-200 text-sm font-medium uppercase tracking-wider mb-2">Welcome to</p>
        <h1 className="text-3xl md:text-5xl font-black mb-3">PadelClub</h1>
        <p className="text-green-100 text-lg mb-8 max-w-md">
          Find a game, track your matches, and compete in tournaments.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/open-games">
            <Button className="bg-white !text-padel-green hover:bg-green-50" size="lg">
              <Users className="w-5 h-5" />
              Find a Game
            </Button>
          </Link>
          <Link href="/matches">
            <Button variant="ghost" className="!text-white hover:!bg-white/20" size="lg">
              <TrendingUp className="w-5 h-5" />
              Enter Score
            </Button>
          </Link>
          <Link href="/players">
            <Button variant="ghost" className="!text-white hover:!bg-white/20" size="lg">
              <Trophy className="w-5 h-5" />
              Rankings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
