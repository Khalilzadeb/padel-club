import { supabase } from '@/lib/supabase'
import type { Tournament } from '@/lib/types'

function toModel(row: Record<string, unknown>): Tournament {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    status: row.status as Tournament['status'],
    format: row.format as Tournament['format'],
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    registrationDeadline: row.registration_deadline as string | undefined,
    maxTeams: row.max_teams as number,
    registeredTeams: (row.registered_teams as string[][]) ?? [],
    courtIds: (row.court_ids as string[]) ?? [],
    prizes: (row.prizes as Tournament['prizes']) ?? [],
    bracket: row.bracket as Tournament['bracket'],
    groups: row.groups as Tournament['groups'],
    matchIds: (row.match_ids as string[]) ?? [],
    winnerId: row.winner_id as string[] | undefined,
    imageUrl: row.image_url as string | undefined,
  }
}

export async function getTournaments(status?: string): Promise<Tournament[]> {
  let query = supabase.from('tournaments').select('*').order('start_date', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(toModel)
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const { data } = await supabase.from('tournaments').select('*').eq('id', id).single()
  return data ? toModel(data) : null
}
