"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, LogOut, Calendar } from "lucide-react";
import WeeklyCalendar from "@/components/venue-admin/WeeklyCalendar";

interface Court {
  id: string;
  name: string;
  type: string;
  surface: string;
  price_per_hour: number;
}

interface Booking {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes?: string | null;
  player_ids?: string[];
}

interface RecurringBooking {
  id: string;
  courtId: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  label: string | null;
}

interface Admin {
  id: string;
  name: string;
  email: string;
  location: string;
}

export default function VenueAdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recurring, setRecurring] = useState<RecurringBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 14);
    const to = new Date(now);
    to.setDate(now.getDate() + 60);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    const res = await fetch(`/api/venue-admin/bookings?from=${fromStr}&to=${toStr}`);
    if (res.ok) setBookings(await res.json());
  }, []);

  const fetchRecurring = useCallback(async () => {
    const res = await fetch("/api/venue-admin/recurring-bookings");
    if (res.ok) setRecurring(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/venue-admin/courts").then((r) => r.json()),
      fetch("/api/venue-admin/recurring-bookings").then((r) => r.json()),
    ]).then(([courtsData, recurringData]) => {
      setCourts(Array.isArray(courtsData) ? courtsData : []);
      setRecurring(Array.isArray(recurringData) ? recurringData : []);
    });

    // Get admin info from cookie via a simple approach
    fetch("/api/venue-admin/courts")
      .then((r) => {
        if (r.status === 401) router.push("/venue-admin/login");
      });

    fetchBookings().finally(() => setLoading(false));
  }, [fetchBookings, router]);

  // Listen for recurring booking events from calendar
  useEffect(() => {
    const handler = async (e: Event) => {
      const { courtId, dayOfWeek, startTime, durationMinutes, label } = (e as CustomEvent).detail;
      await fetch("/api/venue-admin/recurring-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courtId, dayOfWeek, startTime, durationMinutes, label }),
      });
      fetchRecurring();
    };
    window.addEventListener("addRecurring", handler);
    return () => window.removeEventListener("addRecurring", handler);
  }, [fetchRecurring]);

  const handleAddBooking = async (
    courtId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
    label: string
  ) => {
    await fetch("/api/venue-admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courtId, date, startTime, durationMinutes, label }),
    });
    fetchBookings();
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    await fetch(`/api/venue-admin/bookings?id=${id}`, { method: "DELETE" });
    fetchBookings();
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm("Delete this recurring booking?")) return;
    await fetch(`/api/venue-admin/recurring-bookings?id=${id}`, { method: "DELETE" });
    fetchRecurring();
  };

  const handleLogout = async () => {
    await fetch("/api/venue-admin/auth/logout", { method: "POST" });
    router.push("/venue-admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-padel-green" />
          <span className="text-sm font-semibold">Venue Admin</span>
        </div>
        {admin && (
          <span className="text-xs text-gray-400 ml-1">— {admin.location}</span>
        )}
        <button
          onClick={handleLogout}
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Çıxış
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-padel-green" />
          <h1 className="text-xl font-black text-gray-900">Booking Calendar</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No courts found for your venue.</div>
        ) : (
          <WeeklyCalendar
            courts={courts}
            bookings={bookings}
            recurringBookings={recurring}
            onAddBooking={handleAddBooking}
            onDeleteBooking={handleDeleteBooking}
            onDeleteRecurring={handleDeleteRecurring}
          />
        )}
      </div>
    </div>
  );
}
