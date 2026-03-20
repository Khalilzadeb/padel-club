import { supabase } from '@/lib/supabase'
import type { Player } from '@/lib/types'

function toModel(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    avatarUrl: row.avatar_url as string | null,
    level: row.level as Player['level'],
    hand: row.hand as Player['hand'],
    position: row.position as Player['position'],
    memberSince: row.member_since as string,
    stats: {
      matchesPlayed: row.matches_played as number,
      matchesWon: row.matches_won as number,
      matchesLost: row.matches_lost as number,
      setsWon: row.sets_won as number,
      setsLost: row.sets_lost as number,
      gamesWon: row.games_won as number,
      gamesLost: row.games_lost as number,
      eloRating: row.elo_rating as number,
      rankingPoints: row.ranking_points as number,
      currentStreak: row.current_streak as number,
      tournamentsWon: row.tournaments_won as number,
    },
    contact: {
      email: row.contact_email as string,
      phone: row.contact_phone as string | undefined,
    },
  }
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from('players').select('*').order('elo_rating', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toModel)
}

export async function getPlayer(id: string): Promise<Player | null> {
  const { data } = await supabase.from('players').select('*').eq('id', id).single()
  return data ? toModel(data) : null
}

export async function createPlayer(id: string, name: string, email: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  await supabase.from('players').insert({
    id,
    name,
    level: 'beginner',
    hand: 'right',
    position: 'flexible',
    member_since: today,
    matches_played: 0,
    matches_won: 0,
    matches_lost: 0,
    sets_won: 0,
    sets_lost: 0,
    games_won: 0,
    games_lost: 0,
    elo_rating: 1000,
    ranking_points: 0,
    current_streak: 0,
    tournaments_won: 0,
    contact_email: email,
  })
}

export async function updatePlayerProfile(id: string, updates: { elo_rating?: number; level?: string }): Promise<void> {
  await supabase.from('players').update(updates).eq('id', id)
}

export async function updatePlayerElo(id: string, eloDelta: number, won: boolean): Promise<void> {
  const { data } = await supabase
    .from('players')
    .select('elo_rating, matches_played, matches_won, matches_lost, current_streak')
    .eq('id', id)
    .single()
  if (!data) return

  const currentStreak = data.current_streak as number
  const newStreak = won
    ? (currentStreak >= 0 ? currentStreak + 1 : 1)
    : (currentStreak <= 0 ? currentStreak - 1 : -1)

  await supabase.from('players').update({
    elo_rating: Math.max(100, (data.elo_rating as number) + eloDelta),
    matches_played: (data.matches_played as number) + 1,
    matches_won: (data.matches_won as number) + (won ? 1 : 0),
    matches_lost: (data.matches_lost as number) + (won ? 0 : 1),
    current_streak: newStreak,
  }).eq('id', id)
}
