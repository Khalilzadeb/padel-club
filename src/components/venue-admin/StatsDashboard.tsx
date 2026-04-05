"use client";
import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { Download, TrendingUp, CalendarDays, Users, Banknote, Trophy } from "lucide-react";

interface Stats {
  period: string;
  fromDate: string;
  toDate: string;
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalOpenGames: number;
    totalPlayers: number;
  };
  bookingsPerCourt: { name: string; bookings: number; revenue: number }[];
  utilizationPerCourt: { name: string; utilization: number }[];
  peakHours: { hour: string; count: number }[];
  topPlayers: { id: string; name: string; games: number }[];
  dailyTrend: { date: string; bookings: number }[];
  rawBookings: {
    id: string; court: string; date: string; start_time: string;
    end_time: string; duration_minutes: number;
    booker_name: string; booker_phone: string; revenue: number;
  }[];
}

const PERIODS = [
  { label: "Bu həftə", value: "week" },
  { label: "Bu ay", value: "month" },
  { label: "Bu il", value: "year" },
];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function downloadCSV(rawBookings: Stats["rawBookings"], location: string) {
  const headers = ["Kort", "Tarix", "Başlama", "Bitmə", "Müddət (dəq)", "Ad Soyad", "Telefon", "Gəlir (₼)"];
  const rows = rawBookings.map((b) => [
    b.court, b.date, b.start_time, b.end_time,
    b.duration_minutes, b.booker_name, b.booker_phone, b.revenue,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${location}_bookings_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StatsDashboard({ location }: { location: string }) {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (p: string) => {
    setLoading(true);
    const res = await fetch(`/api/venue-admin/stats?period=${p}`);
    if (res.ok) setStats(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(period); }, [period, fetchStats]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return <div className="text-center py-20 text-gray-400">Məlumat yükləmək alınmadı.</div>;

  return (
    <div className="space-y-6">
      {/* Period selector + CSV */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                period === p.value
                  ? "bg-padel-green text-white border-padel-green"
                  : "bg-white text-gray-600 border-gray-200 hover:border-padel-green"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => downloadCSV(stats.rawBookings, location)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" /> CSV yüklə
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Ümumi booking" value={stats.summary.totalBookings} icon={CalendarDays} color="bg-blue-50 text-blue-600" />
        <StatCard label="Gəlir" value={`₼${stats.summary.totalRevenue}`} icon={Banknote} color="bg-green-50 text-padel-green" />
        <StatCard label="Open games" value={stats.summary.totalOpenGames} icon={Trophy} color="bg-amber-50 text-amber-600" />
        <StatCard label="Aktiv oyunçular" value={stats.summary.totalPlayers} icon={Users} color="bg-purple-50 text-purple-600" />
      </div>

      {/* Daily trend */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-padel-green" /> Gündəlik booking trendi
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={stats.dailyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip labelFormatter={(v) => `Tarix: ${v}`} formatter={(v) => [v, "Booking"]} />
            <Line type="monotone" dataKey="bookings" stroke="#16a34a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bookings per court */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Kortlar üzrə booking</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.bookingsPerCourt} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, "Booking"]} />
              <Bar dataKey="bookings" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak hours */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Ən yoğun saatlar</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.peakHours} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, "Booking"]} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Utilization per court */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Kort doluluk faizi</h3>
        <div className="space-y-3">
          {stats.utilizationPerCourt.map((c) => (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">{c.name}</span>
                <span className="text-sm font-semibold text-gray-900">{c.utilization}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-padel-green transition-all"
                  style={{ width: `${c.utilization}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top players */}
      {stats.topPlayers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Ən çox oynayan oyunçular
          </h3>
          <div className="space-y-2">
            {stats.topPlayers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0 ? "bg-amber-400 text-white" :
                  i === 1 ? "bg-gray-300 text-gray-700" :
                  i === 2 ? "bg-orange-300 text-white" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                <span className="text-sm text-gray-500">{p.games} oyun</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue per court */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Kortlar üzrə gəlir</h3>
        <div className="space-y-2">
          {stats.bookingsPerCourt.map((c) => (
            <div key={c.name} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50">
              <span className="text-sm text-gray-700">{c.name}</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">₼{c.revenue}</span>
                <span className="text-xs text-gray-400 ml-2">({c.bookings} booking)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
