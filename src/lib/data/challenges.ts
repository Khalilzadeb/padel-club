import { supabase } from '@/lib/supabase'
import type { Challenge, ChallengeStatus } from '@/lib/types'

function toModel(row: Record<string, unknown>): Challenge {
  return {
    id: row.id as string,
    challengerId: row.challenger_id as string,
    challengedId: row.challenged_id as string,
    courtId: row.court_id as string,
    proposedDate: row.proposed_date as string,
    proposedTime: row.proposed_time as string,
    matchType: row.match_type as Challenge['matchType'],
    message: row.message as string | undefined,
    status: row.status as ChallengeStatus,
    createdAt: row.created_at as string,
  }
}

export async function createChallenge(c: Omit<Challenge, 'id' | 'createdAt'>): Promise<Challenge> {
  const { data, error } = await supabase.from('challenges').insert({
    id: `ch${crypto.randomUUID().slice(0, 8)}`,
    challenger_id: c.challengerId,
    challenged_id: c.challengedId,
    court_id: c.courtId,
    proposed_date: c.proposedDate,
    proposed_time: c.proposedTime,
    match_type: c.matchType,
    message: c.message ?? null,
    status: 'pending',
  }).select().single()
  if (error) throw error
  return toModel(data)
}

export async function getChallenges(playerId: string): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .or(`challenger_id.eq.${playerId},challenged_id.eq.${playerId}`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map(toModel)
}

export async function getChallenge(id: string): Promise<Challenge | null> {
  const { data } = await supabase.from('challenges').select('*').eq('id', id).single()
  return data ? toModel(data) : null
}

export async function updateChallengeStatus(id: string, status: ChallengeStatus): Promise<void> {
  await supabase.from('challenges').update({ status }).eq('id', id)
}
