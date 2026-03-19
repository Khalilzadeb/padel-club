import CourtCard from "@/components/bookings/CourtCard";
import { courts } from "@/lib/data/courts";
import { bookingsStore } from "@/lib/data/bookings";
import Card from "@/components/ui/Card";
import { Calendar, CheckCircle } from "lucide-react";

export default function BookingsPage() {
  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookingsStore.filter((b) => b.date === today && b.status === "confirmed");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Book a Court</h1>
        <p className="text-gray-500 mt-1">Choose from our {courts.length} professional courts and book your slot.</p>
      </div>

      {/* Today summary */}
      <Card className="p-5 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-padel-green rounded-xl">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Today's Availability</p>
            <p className="text-sm text-gray-600">
              {todayBookings.length} of {courts.length} courts booked today ·{" "}
              {courts.length - todayBookings.length} available right now
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-padel-green font-semibold text-sm">
            <CheckCircle className="w-4 h-4" />
            Open 08:00 – 22:00
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.filter((c) => c.isActive).map((court) => (
          <CourtCard key={court.id} court={court} />
        ))}
      </div>
    </div>
  );
}
