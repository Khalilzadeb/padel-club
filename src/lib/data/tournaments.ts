import { supabase } from '@/lib/supabase'
import type { Tournament } from '@/lib/types'

function toModel(row: Record<string, unknown>): Tournament {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    status: row.status as Tournament['status'],
    format: row.format as Tournament['format'],
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    registrationDeadline: (row.registration_deadline as string) ?? '',
    maxTeams: row.max_teams as number,
    registeredTeams: (row.registered_teams as string[][]) ?? [],
    courtIds: (row.court_ids as string[]) ?? [],
    prizes: (row.prizes as Tournament['prizes']) ?? [],
    bracket: row.bracket as Tournament['bracket'],
    groups: row.groups as Tournament['groups'],
    matchIds: (row.match_ids as string[]) ?? [],
    winnerId: row.winner_id as [string, string] | undefined,
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

export async function createTournament(t: Omit<Tournament, 'id'>): Promise<Tournament> {
  const { data, error } = await supabase.from('tournaments').insert({
    id: `t${Date.now()}`,
    name: t.name,
    description: t.description,
    status: t.status,
    format: t.format,
    start_date: t.startDate,
    end_date: t.endDate,
    registration_deadline: t.registrationDeadline,
    max_teams: t.maxTeams,
    registered_teams: t.registeredTeams ?? [],
    court_ids: t.courtIds ?? [],
    prizes: t.prizes ?? [],
    match_ids: [],
    bracket: t.bracket ?? null,
    groups: t.groups ?? null,
    winner_id: t.winnerId ?? null,
    image_url: t.imageUrl ?? null,
  }).select().single()
  if (error) throw error
  return toModel(data)
}

export async function updateTournament(id: string, t: Partial<{
  name: string
  description: string
  status: Tournament['status']
  format: Tournament['format']
  startDate: string
  endDate: string
  registrationDeadline: string
  maxTeams: number
  registeredTeams: string[][]
  courtIds: string[]
  prizes: Tournament['prizes']
  bracket: Tournament['bracket']
  groups: Tournament['groups']
  winnerId: [string, string]
  imageUrl: string
}>): Promise<Tournament> {
  const update: Record<string, unknown> = {}
  if (t.name !== undefined) update.name = t.name
  if (t.description !== undefined) update.description = t.description
  if (t.status !== undefined) update.status = t.status
  if (t.format !== undefined) update.format = t.format
  if (t.startDate !== undefined) update.start_date = t.startDate
  if (t.endDate !== undefined) update.end_date = t.endDate
  if (t.registrationDeadline !== undefined) update.registration_deadline = t.registrationDeadline
  if (t.maxTeams !== undefined) update.max_teams = t.maxTeams
  if (t.registeredTeams !== undefined) update.registered_teams = t.registeredTeams
  if (t.courtIds !== undefined) update.court_ids = t.courtIds
  if (t.prizes !== undefined) update.prizes = t.prizes
  if (t.bracket !== undefined) update.bracket = t.bracket
  if (t.groups !== undefined) update.groups = t.groups
  if (t.winnerId !== undefined) update.winner_id = t.winnerId
  if (t.imageUrl !== undefined) update.image_url = t.imageUrl

  const { data, error } = await supabase.from('tournaments').update(update).eq('id', id).select().single()
  if (error) throw error
  return toModel(data)
}

export async function deleteTournament(id: string): Promise<void> {
  await supabase.from('tournaments').delete().eq('id', id)
}
