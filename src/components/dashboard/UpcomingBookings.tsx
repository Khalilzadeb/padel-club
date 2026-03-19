import Link from "next/link";
import Card from "@/components/ui/Card";
import { bookingsStore } from "@/lib/data/bookings";
import { courts } from "@/lib/data/courts";
import { players } from "@/lib/data/players";
import { Calendar, ArrowRight } from "lucide-react";

function getCourt(id: string) { return courts.find((c) => c.id === id); }
function getPlayer(id: string) { return players.find((p) => p.id === id); }

export default function UpcomingBookings() {
  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookingsStore
    .filter((b) => b.date >= today && b.status === "confirmed")
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 4);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 text-lg">Upcoming Bookings</h2>
        <Link href="/bookings" className="text-sm text-padel-green hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">No upcoming bookings</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((b) => {
            const court = getCourt(b.courtId);
            const playerNames = b.playerIds
              .map((id) => getPlayer(id)?.name.split(" ")[0])
              .filter(Boolean)
              .join(", ");
            return (
              <div key={b.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="p-2 bg-padel-green rounded-lg flex-shrink-0">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{court?.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {b.date} · {b.startTime}–{b.endTime}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{playerNames}</p>
                </div>
                <span className="text-xs font-semibold text-padel-green">
                  ${(b.totalPrice / 100).toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
