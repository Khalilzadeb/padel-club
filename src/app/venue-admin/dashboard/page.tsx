"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, LogOut, Calendar, Gamepad2, Users, Clock, BarChart2 } from "lucide-react";
import WeeklyCalendar from "@/components/venue-admin/WeeklyCalendar";
import StatsDashboard from "@/components/venue-admin/StatsDashboard";

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

interface OpenGame {
  id: string;
  court_id: string;
  courtName: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  player_ids: string[];
  max_players: number;
  game_type: string;
  is_private: boolean;
}

interface Admin {
  name: string;
  email: string;
  location: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  full: "bg-orange-100 text-orange-700",
  completed: "bg-gray-100 text-gray-500",
};

export default function VenueAdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recurring, setRecurring] = useState<RecurringBooking[]>([]);
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"calendar" | "games" | "stats">("calendar");

  const fetchBookings = useCallback(async () => {
    const now = new Date();
    const from = new Date(now); from.setDate(now.getDate() - 14);
    const to = new Date(now); to.setDate(now.getDate() + 60);
    const res = await fetch(`/api/venue-admin/bookings?from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`);
    if (res.ok) setBookings(await res.json());
  }, []);

  const fetchRecurring = useCallback(async () => {
    const res = await fetch("/api/venue-admin/recurring-bookings");
    if (res.ok) setRecurring(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/venue-admin/me").then((r) => r.ok ? r.json() : null),
      fetch("/api/venue-admin/courts").then((r) => r.ok ? r.json() : []),
      fetch("/api/venue-admin/recurring-bookings").then((r) => r.ok ? r.json() : []),
      fetch("/api/venue-admin/open-games").then((r) => r.ok ? r.json() : []),
    ]).then(([adminData, courtsData, recurringData, gamesData]) => {
      if (!adminData) { router.push("/venue-admin/login"); return; }
      setAdmin(adminData);
      setCourts(Array.isArray(courtsData) ? courtsData : []);
      setRecurring(Array.isArray(recurringData) ? recurringData : []);
      setOpenGames(Array.isArray(gamesData) ? gamesData : []);
    });
    fetchBookings().finally(() => setLoading(false));
  }, [fetchBookings, router]);

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

  const handleAddBooking = async (courtId: string, date: string, startTime: string, durationMinutes: number, bookerName: string, bookerPhone: string) => {
    await fetch("/api/venue-admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courtId, date, startTime, durationMinutes, bookerName, bookerPhone }),
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
        <MapPin className="w-4 h-4 text-padel-green flex-shrink-0" />
        <div>
          <span className="text-sm font-semibold">{admin?.location ?? "Venue Admin"}</span>
          {admin && <span className="text-xs text-gray-400 ml-2">— {admin.name}</span>}
        </div>
        <button
          onClick={handleLogout}
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Çıxış
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === "calendar"
                ? "bg-padel-green text-white border-padel-green"
                : "bg-white text-gray-600 border-gray-200 hover:border-padel-green"
            }`}
          >
            <Calendar className="w-4 h-4" /> Booking Calendar
          </button>
          <button
            onClick={() => setTab("games")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === "games"
                ? "bg-padel-green text-white border-padel-green"
                : "bg-white text-gray-600 border-gray-200 hover:border-padel-green"
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> Open Games
            {openGames.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "games" ? "bg-white/20 text-white" : "bg-green-100 text-padel-green"}`}>
                {openGames.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === "stats"
                ? "bg-padel-green text-white border-padel-green"
                : "bg-white text-gray-600 border-gray-200 hover:border-padel-green"
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Statistika
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "stats" ? (
          <StatsDashboard location={admin?.location ?? ""} />
        ) : tab === "calendar" ? (
          courts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No courts found.</div>
          ) : (
            <WeeklyCalendar
              courts={courts}
              bookings={bookings}
              recurringBookings={recurring}
              onAddBooking={handleAddBooking}
              onDeleteBooking={handleDeleteBooking}
              onDeleteRecurring={handleDeleteRecurring}
            />
          )
        ) : (
          <div>
            {openGames.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No upcoming open games.</div>
            ) : (
              <div className="space-y-3">
                {openGames.map((g) => (
                  <div key={g.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-4 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{g.courtName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[g.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {g.status}
                        </span>
                        {g.is_private && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Private</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {g.date} · {g.start_time} · {g.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {g.player_ids.length}/{g.max_players}
                        </span>
                        <span className="capitalize">{g.game_type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
