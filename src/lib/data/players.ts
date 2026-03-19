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
