import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/types'

function toModel(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    courtId: row.court_id as string,
    playerIds: (row.player_ids as string[]) ?? [],
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    durationMinutes: row.duration_minutes as number,
    status: row.status as Booking['status'],
    createdAt: row.created_at as string,
    totalPrice: row.total_price as number,
    notes: row.notes as string | undefined,
  }
}

export async function getBookings(courtId?: string, date?: string): Promise<Booking[]> {
  let query = supabase.from('bookings').select('*').order('date').order('start_time')
  if (courtId) query = query.eq('court_id', courtId)
  if (date) query = query.eq('date', date)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(toModel)
}

export async function checkConflict(courtId: string, date: string, startTime: string, endTime: string): Promise<boolean> {
  const { data } = await supabase
    .from('bookings')
    .select('id')
    .eq('court_id', courtId)
    .eq('date', date)
    .neq('status', 'cancelled')
    .lt('start_time', endTime)
    .gt('end_time', startTime)
  return (data?.length ?? 0) > 0
}

export async function addBooking(booking: Booking): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      id: booking.id,
      court_id: booking.courtId,
      player_ids: booking.playerIds,
      date: booking.date,
      start_time: booking.startTime,
      end_time: booking.endTime,
      duration_minutes: booking.durationMinutes,
      status: booking.status,
      total_price: booking.totalPrice,
      notes: booking.notes,
    })
    .select()
    .single()
  if (error) throw error
  return toModel(data)
}

export async function cancelBooking(id: string): Promise<void> {
  await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
}
