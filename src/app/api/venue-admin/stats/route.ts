import { NextRequest, NextResponse } from "next/server";
import { getVenueSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getVenueSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "month"; // "week" | "month" | "year"

  const now = new Date();
  const fromDate = new Date(now);
  if (period === "week") fromDate.setDate(now.getDate() - 7);
  else if (period === "month") fromDate.setMonth(now.getMonth() - 1);
  else fromDate.setFullYear(now.getFullYear() - 1);
  const fromStr = fromDate.toISOString().slice(0, 10);
  const toStr = now.toISOString().slice(0, 10);

  // Get courts for this venue
  const { data: courts } = await supabase
    .from("courts")
    .select("id, name, price_per_hour")
    .eq("location", session.location);

  if (!courts || courts.length === 0) {
    return NextResponse.json({ courts: [], bookings: [], openGames: [], stats: {} });
  }

  const courtIds = courts.map((c) => c.id);
  const courtMap = Object.fromEntries(courts.map((c) => [c.id, c]));

  // Get bookings in period
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .in("court_id", courtIds)
    .gte("date", fromStr)
    .lte("date", toStr)
    .order("date");

  // Get open games in period
  const { data: openGames } = await supabase
    .from("open_games")
    .select("*")
    .in("court_id", courtIds)
    .gte("date", fromStr)
    .lte("date", toStr);

  const allBookings = bookings ?? [];
  const allGames = openGames ?? [];

  // ── Stats ──────────────────────────────────────────────────

  // 1. Total bookings & revenue
  const totalBookings = allBookings.length;
  const totalRevenue = allBookings.reduce((sum, b) => {
    const court = courtMap[b.court_id];
    return sum + (court ? Math.round((b.duration_minutes / 60) * court.price_per_hour) : 0);
  }, 0);

  // 2. Bookings per court
  const bookingsPerCourt = courts.map((c) => ({
    name: c.name,
    bookings: allBookings.filter((b) => b.court_id === c.id).length,
    revenue: allBookings
      .filter((b) => b.court_id === c.id)
      .reduce((s, b) => s + Math.round((b.duration_minutes / 60) * c.price_per_hour), 0),
  })).sort((a, b) => b.bookings - a.bookings);

  // 3. Utilization per court (booked hours / available hours)
  const dayCount = Math.max(1, Math.round((now.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
  const availableHoursPerCourt = dayCount * 14; // 08:00–22:00 = 14h
  const utilizationPerCourt = courts.map((c) => {
    const bookedMins = allBookings
      .filter((b) => b.court_id === c.id)
      .reduce((s, b) => s + (b.duration_minutes ?? 0), 0);
    return {
      name: c.name,
      utilization: Math.min(100, Math.round((bookedMins / 60 / availableHoursPerCourt) * 100)),
    };
  });

  // 4. Peak hours (bookings per hour)
  const peakHours: Record<number, number> = {};
  for (let h = 8; h <= 22; h++) peakHours[h] = 0;
  allBookings.forEach((b) => {
    const [h] = b.start_time.split(":").map(Number);
    if (h >= 8 && h <= 22) peakHours[h] = (peakHours[h] ?? 0) + 1;
  });
  const peakHoursArr = Object.entries(peakHours).map(([hour, count]) => ({
    hour: `${hour}:00`,
    count,
  }));

  // 5. Top players from open games
  const playerCount: Record<string, number> = {};
  allGames.forEach((g) => {
    (g.player_ids ?? []).forEach((pid: string) => {
      playerCount[pid] = (playerCount[pid] ?? 0) + 1;
    });
  });
  const topPlayerIds = Object.entries(playerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  let topPlayers: { id: string; name: string; games: number; avatarUrl?: string }[] = [];
  if (topPlayerIds.length > 0) {
    const { data: players } = await supabase
      .from("players")
      .select("id, name, avatar_url")
      .in("id", topPlayerIds);
    topPlayers = (players ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      games: playerCount[p.id] ?? 0,
      avatarUrl: p.avatar_url,
    })).sort((a, b) => b.games - a.games);
  }

  // 6. Daily bookings trend
  const dailyMap: Record<string, number> = {};
  allBookings.forEach((b) => {
    dailyMap[b.date] = (dailyMap[b.date] ?? 0) + 1;
  });
  // Fill all days
  const dailyTrend: { date: string; bookings: number }[] = [];
  const cur = new Date(fromDate);
  while (cur <= now) {
    const ds = cur.toISOString().slice(0, 10);
    dailyTrend.push({ date: ds, bookings: dailyMap[ds] ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }

  return NextResponse.json({
    period,
    fromDate: fromStr,
    toDate: toStr,
    summary: {
      totalBookings,
      totalRevenue,
      totalOpenGames: allGames.length,
      totalPlayers: Object.keys(playerCount).length,
    },
    bookingsPerCourt,
    utilizationPerCourt,
    peakHours: peakHoursArr,
    topPlayers,
    dailyTrend,
    // Raw data for CSV
    rawBookings: allBookings.map((b) => ({
      id: b.id,
      court: courtMap[b.court_id]?.name ?? b.court_id,
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      duration_minutes: b.duration_minutes,
      booker_name: b.booker_name ?? "",
      booker_phone: b.booker_phone ?? "",
      revenue: Math.round(((b.duration_minutes ?? 0) / 60) * (courtMap[b.court_id]?.price_per_hour ?? 0)),
    })),
  });
}
