import HeroSection from "@/components/dashboard/HeroSection";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentMatches from "@/components/dashboard/RecentMatches";
import UpcomingBookings from "@/components/dashboard/UpcomingBookings";
import ActiveTournaments from "@/components/dashboard/ActiveTournaments";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <HeroSection />
      <QuickStats />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentMatches />
        </div>
        <div className="space-y-6">
          <UpcomingBookings />
          <ActiveTournaments />
        </div>
      </div>
    </div>
  );
}
