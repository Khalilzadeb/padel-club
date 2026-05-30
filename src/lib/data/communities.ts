import { supabase } from '@/lib/supabase'
import type { Community, CommunityAdmin, CommunityPlayer, CommunitySummary } from '@/lib/types'

function toCommunity(row: Record<string, unknown>): Community {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string | null,
    logoUrl: row.logo_url as string | null,
    coverUrl: row.cover_url as string | null,
    createdAt: row.created_at as string,
  }
}

function toCommunityPlayer(row: Record<string, unknown>): CommunityPlayer {
  return {
    id: row.id as string,
    communityId: row.community_id as string,
    name: row.name as string,
    avatarUrl: row.avatar_url as string | null,
    contactPhone: row.contact_phone as string | null,
    contactEmail: row.contact_email as string | null,
    linkedUserId: row.linked_user_id as string | null,
    linkedPlayerId: row.linked_player_id as string | null,
    ntrp: row.ntrp === null || row.ntrp === undefined ? null : Number(row.ntrp),
    eloRating: (row.elo_rating as number) ?? 1000,
    matchesPlayed: (row.matches_played as number) ?? 0,
    matchesWon: (row.matches_won as number) ?? 0,
    tournamentsWon: (row.tournaments_won as number) ?? 0,
    createdAt: row.created_at as string,
  }
}

export async function getCommunityBySlug(slug: string): Promise<CommunitySummary | null> {
  const { data, error } = await supabase.from('communities').select('*').eq('slug', slug).single()
  if (error || !data) return null
  const community = toCommunity(data)
  const { count } = await supabase
    .from('community_players')
    .select('id', { count: 'exact', head: true })
    .eq('community_id', community.id)
  return { ...community, playerCount: count ?? 0 }
}

export async function getCommunityPlayers(communityId: string): Promise<CommunityPlayer[]> {
  const { data, error } = await supabase
    .from('community_players')
    .select('*')
    .eq('community_id', communityId)
    .order('elo_rating', { ascending: false })
  if (error || !data) return []
  return data.map(toCommunityPlayer)
}

export async function getCommunityAdmins(communityId: string): Promise<CommunityAdmin[]> {
  const { data, error } = await supabase
    .from('community_admins')
    .select('*')
    .eq('community_id', communityId)
  if (error || !data) return []
  return data.map((row) => ({
    communityId: row.community_id as string,
    userId: row.user_id as string,
    createdAt: row.created_at as string,
  }))
}

export async function isCommunityAdmin(communityId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('community_admins')
    .select('user_id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

export async function getCommunitiesForLinkedPlayer(playerId: string): Promise<CommunitySummary[]> {
  const { data: links } = await supabase
    .from('community_players')
    .select('community_id')
    .eq('linked_player_id', playerId)
  if (!links || links.length === 0) return []
  const ids = Array.from(new Set(links.map((r) => r.community_id as string)))
  const { data: communities } = await supabase.from('communities').select('*').in('id', ids)
  if (!communities) return []
  return Promise.all(
    communities.map(async (row) => {
      const community = toCommunity(row)
      const { count } = await supabase
        .from('community_players')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', community.id)
      return { ...community, playerCount: count ?? 0 }
    })
  )
}

export async function getCommunitiesForUser(userId: string): Promise<CommunitySummary[]> {
  // A user "belongs to" a community if they are admin OR are linked as a community player.
  const [adminRows, playerRows] = await Promise.all([
    supabase.from('community_admins').select('community_id').eq('user_id', userId),
    supabase.from('community_players').select('community_id').eq('linked_user_id', userId),
  ])
  const ids = new Set<string>()
  ;(adminRows.data ?? []).forEach((r) => ids.add(r.community_id as string))
  ;(playerRows.data ?? []).forEach((r) => ids.add(r.community_id as string))
  if (ids.size === 0) return []

  const { data: communities } = await supabase.from('communities').select('*').in('id', Array.from(ids))
  if (!communities) return []

  return Promise.all(
    communities.map(async (row) => {
      const community = toCommunity(row)
      const { count } = await supabase
        .from('community_players')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', community.id)
      return { ...community, playerCount: count ?? 0 }
    })
  )
}

export interface CreateCommunityPlayerInput {
  communityId: string
  name: string
  contactPhone?: string | null
  contactEmail?: string | null
  avatarUrl?: string | null
  linkedUserId?: string | null
  linkedPlayerId?: string | null
  ntrp?: number | null
  eloRating?: number
}

export async function addCommunityPlayer(input: CreateCommunityPlayerInput): Promise<CommunityPlayer> {
  const id = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const { data, error } = await supabase
    .from('community_players')
    .insert({
      id,
      community_id: input.communityId,
      name: input.name,
      avatar_url: input.avatarUrl ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_email: input.contactEmail ?? null,
      linked_user_id: input.linkedUserId ?? null,
      linked_player_id: input.linkedPlayerId ?? null,
      ntrp: input.ntrp ?? null,
      elo_rating: input.eloRating ?? 1000,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to add community player')
  return toCommunityPlayer(data)
}

export async function updateCommunityPlayer(
  id: string,
  updates: Partial<Pick<CreateCommunityPlayerInput, 'name' | 'contactPhone' | 'contactEmail' | 'avatarUrl' | 'linkedUserId' | 'linkedPlayerId' | 'ntrp'>>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone
  if (updates.contactEmail !== undefined) dbUpdates.contact_email = updates.contactEmail
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
  if (updates.linkedUserId !== undefined) dbUpdates.linked_user_id = updates.linkedUserId
  if (updates.linkedPlayerId !== undefined) dbUpdates.linked_player_id = updates.linkedPlayerId
  if (updates.ntrp !== undefined) dbUpdates.ntrp = updates.ntrp
  const { error } = await supabase.from('community_players').update(dbUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function removeCommunityPlayer(id: string): Promise<void> {
  const { error } = await supabase.from('community_players').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addCommunityAdmin(communityId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('community_admins')
    .upsert({ community_id: communityId, user_id: userId }, { onConflict: 'community_id,user_id' })
  if (error) throw new Error(error.message)
}

export async function removeCommunityAdmin(communityId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('community_admins')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}
