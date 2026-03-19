import { supabase } from '@/lib/supabase'
import type { Match } from '@/lib/types'

function toModel(row: Record<string, unknown>): Match {
  return {
    id: row.id as string,
    courtId: row.court_id as string,
    type: row.type as Match['type'],
    format: row.format as Match['format'],
    status: row.status as Match['status'],
    team1: { playerIds: row.team1_player_ids as [string, string] },
    team2: { playerIds: row.team2_player_ids as [string, string] },
    sets: (row.sets as Match['sets']) ?? [],
    winnerId: row.winner_id as 'team1' | 'team2' | undefined,
    date: row.date as string,
    startTime: row.start_time as string,
    durationMinutes: row.duration_minutes as number | undefined,
    tournamentId: row.tournament_id as string | undefined,
    tournamentRound: row.tournament_round as string | undefined,
    eloChanges: row.elo_changes as Match['eloChanges'],
  }
}

export async function getMatches(filters?: {
  playerId?: string
  type?: string
  from?: string
  to?: string
  tournamentId?: string
}): Promise<Match[]> {
  let query = supabase.from('matches').select('*').eq('status', 'completed').order('date', { ascending: false })
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.from) query = query.gte('date', filters.from)
  if (filters?.to) query = query.lte('date', filters.to)
  if (filters?.tournamentId) query = query.eq('tournament_id', filters.tournamentId)
  const { data, error } = await query
  if (error) throw error
  let result = (data ?? []).map(toModel)
  if (filters?.playerId) {
    result = result.filter((m) =>
      [...m.team1.playerIds, ...m.team2.playerIds].includes(filters.playerId!)
    )
  }
  return result
}

export async function getMatch(id: string): Promise<Match | null> {
  const { data } = await supabase.from('matches').select('*').eq('id', id).single()
  return data ? toModel(data) : null
}

export async function addMatch(match: Match): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      id: match.id,
      court_id: match.courtId,
      type: match.type,
      format: match.format,
      status: match.status,
      team1_player_ids: match.team1.playerIds,
      team2_player_ids: match.team2.playerIds,
      sets: match.sets,
      winner_id: match.winnerId,
      date: match.date,
      start_time: match.startTime,
      duration_minutes: match.durationMinutes,
      tournament_id: match.tournamentId,
      tournament_round: match.tournamentRound,
      elo_changes: match.eloChanges,
    })
    .select()
    .single()
  if (error) throw error
  return toModel(data)
}
