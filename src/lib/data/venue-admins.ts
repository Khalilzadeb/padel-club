import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export interface VenueAdmin {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  location: string;
  createdAt: string;
}

function toModel(row: Record<string, unknown>): VenueAdmin {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    passwordHash: row.password_hash as string,
    location: row.location as string,
    createdAt: row.created_at as string,
  };
}

export async function findVenueAdminByEmail(email: string): Promise<VenueAdmin | undefined> {
  const { data } = await supabase
    .from("venue_admins")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  return data ? toModel(data) : undefined;
}

export async function verifyVenueAdminPassword(admin: VenueAdmin, password: string): Promise<boolean> {
  return bcrypt.compare(password, admin.passwordHash);
}

export interface RecurringBooking {
  id: string;
  courtId: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  label: string | null;
  createdBy: string;
  createdAt: string;
}

function toRecurringModel(row: Record<string, unknown>): RecurringBooking {
  return {
    id: row.id as string,
    courtId: row.court_id as string,
    dayOfWeek: row.day_of_week as number,
    startTime: row.start_time as string,
    durationMinutes: row.duration_minutes as number,
    label: row.label as string | null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
  };
}

export async function getRecurringBookingsByLocation(location: string): Promise<RecurringBooking[]> {
  const { data: courts } = await supabase
    .from("courts")
    .select("id")
    .eq("location", location);
  if (!courts || courts.length === 0) return [];
  const courtIds = courts.map((c) => c.id);
  const { data } = await supabase
    .from("recurring_bookings")
    .select("*")
    .in("court_id", courtIds)
    .order("day_of_week")
    .order("start_time");
  return (data ?? []).map(toRecurringModel);
}

export async function createRecurringBooking(
  courtId: string,
  dayOfWeek: number,
  startTime: string,
  durationMinutes: number,
  label: string | null,
  createdBy: string
): Promise<RecurringBooking> {
  const { data, error } = await supabase
    .from("recurring_bookings")
    .insert({
      id: `rb_${Date.now()}`,
      court_id: courtId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      duration_minutes: durationMinutes,
      label,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return toRecurringModel(data);
}

export async function deleteRecurringBooking(id: string): Promise<void> {
  await supabase.from("recurring_bookings").delete().eq("id", id);
}
