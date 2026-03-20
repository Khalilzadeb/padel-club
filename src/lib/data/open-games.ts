import { supabase } from '@/lib/supabase'
import type { OpenGame } from '@/lib/types/index'

function toModel(row: Record<string, unknown>): OpenGame {
  return {
    id: row.id as string,
    courtId: row.court_id as string,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    createdBy: row.created_by as string,
    requiredLevel: row.required_level as OpenGame['requiredLevel'],
    playerIds: row.player_ids as string[],
    maxPlayers: row.max_players as number,
    notes: row.notes as string | undefined,
    status: row.status as OpenGame['status'],
    createdAt: row.created_at as string,
  }
}

export async function getOpenGames(filters?: { status?: string; date?: string }): Promise<OpenGame[]> {
  let query = supabase.from('open_games').select('*').order('date', { ascending: true }).order('start_time', { ascending: true })
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
    created_by: game.createdBy,
    required_level: game.requiredLevel ?? null,
    player_ids: game.playerIds,
    max_players: game.maxPlayers,
    notes: game.notes ?? null,
    status: game.status,
  }).select().single()
  if (error) throw error
  return toModel(data)
}

export async function joinOpenGame(id: string, playerId: string): Promise<OpenGame | null> {
  const { data: row } = await supabase.from('open_games').select('*').eq('id', id).single()
  if (!row) return null

  const current = row as Record<string, unknown>
  const playerIds = current.player_ids as string[]
  const maxPlayers = current.max_players as number

  if (playerIds.includes(playerId)) return toModel(current)
  if (playerIds.length >= maxPlayers) return null
  if (current.status !== 'open') return null

  const newPlayerIds = [...playerIds, playerId]
  const newStatus = newPlayerIds.length >= maxPlayers ? 'full' : 'open'

  const { data, error } = await supabase
    .from('open_games')
    .update({ player_ids: newPlayerIds, status: newStatus })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toModel(data)
}

export async function leaveOpenGame(id: string, playerId: string): Promise<OpenGame | null> {
  const { data: row } = await supabase.from('open_games').select('*').eq('id', id).single()
  if (!row) return null

  const current = row as Record<string, unknown>
  const playerIds = (current.player_ids as string[]).filter(p => p !== playerId)

  const { data, error } = await supabase
    .from('open_games')
    .update({ player_ids: playerIds, status: 'open' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toModel(data)
}

export async function cancelOpenGame(id: string): Promise<void> {
  await supabase.from('open_games').update({ status: 'cancelled' }).eq('id', id)
}
