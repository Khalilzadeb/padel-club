import { supabase } from '@/lib/supabase'
import type { SuperGame, SuperGamePrediction, SuperGameSet } from '@/lib/types'

function toSuperGame(row: Record<string, unknown>): SuperGame {
  return {
    id: row.id as string,
    communityId: row.community_id as string,
    title: (row.title as string | null) ?? null,
    gameDate: (row.game_date as string | null) ?? null,
    teamAPlayer1: (row.team_a_player1 as string | null) ?? null,
    teamAPlayer2: (row.team_a_player2 as string | null) ?? null,
    teamBPlayer1: (row.team_b_player1 as string | null) ?? null,
    teamBPlayer2: (row.team_b_player2 as string | null) ?? null,
    maxSets: (row.max_sets as number) ?? 3,
    prize: (row.prize as string | null) ?? null,
    status: (row.status as SuperGame['status']) ?? 'open',
    actualSets: (row.actual_sets as SuperGameSet[] | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
  }
}

function toPrediction(row: Record<string, unknown>): SuperGamePrediction {
  return {
    id: row.id as string,
    superGameId: row.super_game_id as string,
    userId: row.user_id as string,
    userName: (row.user_name as string | null) ?? null,
    sets: (row.sets as SuperGameSet[]) ?? [],
    isWinner: (row.is_winner as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// Two predictions/results match when they have the same number of sets and
// every set's games are identical.
export function setsEqual(a: SuperGameSet[], b: SuperGameSet[]): boolean {
  if (a.length !== b.length || a.length === 0) return false
  return a.every((s, i) => s.a === b[i].a && s.b === b[i].b)
}

export async function listSuperGames(communityId: string): Promise<SuperGame[]> {
  const { data, error } = await supabase
    .from('super_games')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(toSuperGame)
}

export async function getSuperGame(id: string): Promise<SuperGame | null> {
  const { data, error } = await supabase.from('super_games').select('*').eq('id', id).single()
  if (error || !data) return null
  return toSuperGame(data)
}

export interface CreateSuperGameInput {
  communityId: string
  title?: string | null
  gameDate?: string | null
  teamAPlayer1?: string | null
  teamAPlayer2?: string | null
  teamBPlayer1?: string | null
  teamBPlayer2?: string | null
  maxSets?: number
  prize?: string | null
  createdBy?: string | null
}

export async function createSuperGame(input: CreateSuperGameInput): Promise<SuperGame> {
  const id = `sg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const { data, error } = await supabase
    .from('super_games')
    .insert({
      id,
      community_id: input.communityId,
      title: input.title ?? null,
      game_date: input.gameDate ?? null,
      team_a_player1: input.teamAPlayer1 ?? null,
      team_a_player2: input.teamAPlayer2 ?? null,
      team_b_player1: input.teamBPlayer1 ?? null,
      team_b_player2: input.teamBPlayer2 ?? null,
      max_sets: input.maxSets ?? 3,
      prize: input.prize ?? null,
      status: 'open',
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create super game')
  return toSuperGame(data)
}

export async function updateSuperGame(
  id: string,
  updates: Partial<Pick<CreateSuperGameInput, 'title' | 'gameDate' | 'prize'>>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {}
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.gameDate !== undefined) dbUpdates.game_date = updates.gameDate
  if (updates.prize !== undefined) dbUpdates.prize = updates.prize
  if (Object.keys(dbUpdates).length === 0) return
  const { error } = await supabase.from('super_games').update(dbUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSuperGame(id: string): Promise<void> {
  const { error } = await supabase.from('super_games').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// Records the real result, marks the game finished, and flags every prediction
// that matches the result exactly as a winner.
export async function finishSuperGame(id: string, actualSets: SuperGameSet[]): Promise<void> {
  const { error: gErr } = await supabase
    .from('super_games')
    .update({ status: 'finished', actual_sets: actualSets })
    .eq('id', id)
  if (gErr) throw new Error(gErr.message)

  const predictions = await getPredictions(id)
  await Promise.all(
    predictions.map((p) =>
      supabase
        .from('super_game_predictions')
        .update({ is_winner: setsEqual(p.sets, actualSets) })
        .eq('id', p.id)
    )
  )
}

// Reopen a finished game for editing/predictions: clears result + winner flags.
export async function reopenSuperGame(id: string): Promise<void> {
  const { error } = await supabase
    .from('super_games')
    .update({ status: 'open', actual_sets: null })
    .eq('id', id)
  if (error) throw new Error(error.message)
  await supabase.from('super_game_predictions').update({ is_winner: false }).eq('super_game_id', id)
}

export async function getPredictions(superGameId: string): Promise<SuperGamePrediction[]> {
  const { data, error } = await supabase
    .from('super_game_predictions')
    .select('*')
    .eq('super_game_id', superGameId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map(toPrediction)
}

// One prediction per user — insert or update theirs.
export async function upsertPrediction(
  superGameId: string,
  userId: string,
  userName: string,
  sets: SuperGameSet[]
): Promise<SuperGamePrediction> {
  const existing = await supabase
    .from('super_game_predictions')
    .select('id')
    .eq('super_game_id', superGameId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing.data?.id) {
    const { data, error } = await supabase
      .from('super_game_predictions')
      .update({ sets, user_name: userName, updated_at: new Date().toISOString() })
      .eq('id', existing.data.id as string)
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Failed to save prediction')
    return toPrediction(data)
  }

  const id = `sgp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const { data, error } = await supabase
    .from('super_game_predictions')
    .insert({ id, super_game_id: superGameId, user_id: userId, user_name: userName, sets })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to save prediction')
  return toPrediction(data)
}
