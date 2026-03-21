import { supabase } from '@/lib/supabase'
import type { OpenGame } from '@/lib/types/index'

function toModel(row: Record<string, unknown>): OpenGame {
  return {
    id: row.id as string,
    courtId: row.court_id as string,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    durationMinutes: row.duration_minutes as number,
    createdBy: row.created_by as string,
    eloMin: row.elo_min as number | undefined,
    eloMax: row.elo_max as number | undefined,
    playerIds: row.player_ids as string[],
    maxPlayers: row.max_players as number,
    notes: row.notes as string | undefined,
    status: row.status as OpenGame['status'],
    courtBookingStatus: (row.court_booking_status as OpenGame['courtBookingStatus']) ?? 'not_booked',
    teams: row.teams as OpenGame['teams'] ?? undefined,
    pendingScore: row.pending_score as OpenGame['pendingScore'],
    submittedBy: row.submitted_by as string | undefined,
    matchId: row.match_id as string | undefined,
    createdAt: row.created_at as string,
  }
}

export async function getOpenGames(filters?: { status?: string; date?: string }): Promise<OpenGame[]> {
  let query = supabase.from('open_games').select('*').order('date', { ascending: false }).order('start_time', { ascending: false })
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.date) query = query.eq('date', filters.date)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(toModel)
}

export async function getOpenGame(id: string): Promise<OpenGame | null> {
  const { data } = await supabase.from('open_games').select('*').eq('id', id).single()
  return data ? toModel(data) : null
}

export async function createOpenGame(game: Omit<OpenGame, 'createdAt'>): Promise<OpenGame> {
  const { data, error } = await supabase.from('open_games').insert({
    id: game.id,
    court_id: game.courtId,
    date: game.date,
    start_time: game.startTime,
    end_time: game.endTime,
    duration_minutes: game.durationMinutes,
    created_by: game.createdBy,
    elo_min: game.eloMin ?? null,
    elo_max: game.eloMax ?? null,
    player_ids: game.playerIds,
    max_players: game.maxPlayers,
    notes: game.notes ?? null,
    status: game.status,
    court_booking_status: game.courtBookingStatus ?? 'not_booked',
    teams: game.teams ?? null,
  }).select().single()
  if (error) throw error
  return toModel(data)
}

export async function joinOpenGame(id: string, playerId: string, teamNumber: 1 | 2 = 1): Promise<{ game: OpenGame | null; error?: string }> {
  const { data: row } = await supabase.from('open_games').select('*').eq('id', id).single()
  if (!row) return { game: null, error: 'Game not found' }

  const current = row as Record<string, unknown>
  const playerIds = current.player_ids as string[]
  const maxPlayers = current.max_players as number

  if (playerIds.includes(playerId)) return { game: toModel(current) }
  if (playerIds.length >= maxPlayers) return { game: null, error: 'Game is full' }
  if (current.status !== 'open') return { game: null, error: 'Game is not open' }

  // Check ELO range if set
  const eloMin = current.elo_min as number | null
  const eloMax = current.elo_max as number | null
  if (eloMin !== null || eloMax !== null) {
    const { data: playerRow } = await supabase.from('players').select('elo_rating').eq('id', playerId).single()
    const elo = (playerRow as Record<string, unknown>)?.elo_rating as number ?? 1000
    if (eloMin !== null && elo < eloMin) return { game: null, error: `Your ELO (${elo}) is below the minimum required (${eloMin})` }
    if (eloMax !== null && elo > eloMax) return { game: null, error: `Your ELO (${elo}) is above the maximum allowed (${eloMax})` }
  }

  // Handle team assignment
  const existingTeams = current.teams as { team1: string[]; team2: string[] } | null
  let newTeams: { team1: string[]; team2: string[] } | null = null
  if (existingTeams) {
    const targetKey = teamNumber === 1 ? 'team1' : 'team2'
    if (existingTeams[targetKey].length >= 2) return { game: null, error: 'That team is already full' }
    newTeams = {
      team1: [...existingTeams.team1],
      team2: [...existingTeams.team2],
    }
    newTeams[targetKey] = [...newTeams[targetKey], playerId]
  }

  const newPlayerIds = [...playerIds, playerId]
  const newStatus = newPlayerIds.length >= maxPlayers ? 'full' : 'open'
  const updateData: Record<string, unknown> = { player_ids: newPlayerIds, status: newStatus }
  if (newTeams) updateData.teams = newTeams

  const { data, error } = await supabase
    .from('open_games')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { game: toModel(data) }
}

export async function leaveOpenGame(id: string, playerId: string): Promise<OpenGame | null> {
  const { data: row } = await supabase.from('open_games').select('*').eq('id', id).single()
  if (!row) return null

  const current = row as Record<string, unknown>
  const playerIds = (current.player_ids as string[]).filter(p => p !== playerId)

  const updateData: Record<string, unknown> = { player_ids: playerIds, status: 'open' }
  const existingTeams = current.teams as { team1: string[]; team2: string[] } | null
  if (existingTeams) {
    updateData.teams = {
      team1: existingTeams.team1.filter(p => p !== playerId),
      team2: existingTeams.team2.filter(p => p !== playerId),
    }
  }

  const { data, error } = await supabase
    .from('open_games')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toModel(data)
}

export async function cancelOpenGame(id: string): Promise<void> {
  await supabase.from('open_games').update({ status: 'cancelled' }).eq('id', id)
}
