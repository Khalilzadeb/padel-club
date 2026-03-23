import { Suspense } from "react";
import HeroSection from "@/components/dashboard/HeroSection";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentMatches from "@/components/dashboard/RecentMatches";
import ActiveTournaments from "@/components/dashboard/ActiveTournaments";
import MyActivity from "@/components/dashboard/MyActivity";
import TodaysGames from "@/components/dashboard/TodaysGames";

function HeroSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-padel-green-dark via-padel-green to-padel-green-light p-8 md:p-10 animate-pulse">
      <div className="h-12 w-48 bg-white/20 rounded-xl mb-3" />
      <div className="h-5 w-64 bg-white/10 rounded-lg mb-6" />
      <div className="flex gap-3">
        <div className="h-11 w-36 bg-white/20 rounded-xl" />
        <div className="h-11 w-28 bg-white/10 rounded-xl" />
        <div className="h-11 w-32 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>
      <TodaysGames />
      <MyActivity />
      <QuickStats />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentMatches />
        </div>
        <div className="space-y-6">
          <ActiveTournaments />
        </div>
      </div>
    </div>
  );
}
