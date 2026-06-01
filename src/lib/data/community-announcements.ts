import { supabase } from '@/lib/supabase'
import type { CommunityAnnouncement } from '@/lib/types'

function toAnnouncement(row: Record<string, unknown>, authorName: string | null = null): CommunityAnnouncement {
  return {
    id: row.id as string,
    communityId: row.community_id as string,
    authorUserId: row.author_user_id as string | null,
    authorName,
    title: row.title as string,
    body: row.body as string,
    imageUrl: row.image_url as string | null,
    pinned: (row.pinned as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function listAnnouncements(communityId: string): Promise<CommunityAnnouncement[]> {
  const { data, error } = await supabase
    .from('community_announcements')
    .select('*')
    .eq('community_id', communityId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
  if (error || !data) return []

  // Resolve author names in a single round-trip.
  const authorIds = Array.from(
    new Set(data.map((r) => r.author_user_id as string | null).filter(Boolean) as string[])
  )
  const nameByUserId = new Map<string, string>()
  if (authorIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name').in('id', authorIds)
    for (const u of users ?? []) nameByUserId.set(u.id as string, u.name as string)
  }

  return data.map((row) => toAnnouncement(row, nameByUserId.get(row.author_user_id as string) ?? null))
}

export interface CreateAnnouncementInput {
  communityId: string
  authorUserId: string
  title: string
  body: string
  imageUrl?: string | null
  pinned?: boolean
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<CommunityAnnouncement> {
  const id = `an_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const { data, error } = await supabase
    .from('community_announcements')
    .insert({
      id,
      community_id: input.communityId,
      author_user_id: input.authorUserId,
      title: input.title,
      body: input.body,
      image_url: input.imageUrl ?? null,
      pinned: input.pinned ?? false,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create announcement')
  return toAnnouncement(data)
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<Pick<CreateAnnouncementInput, 'title' | 'body' | 'imageUrl' | 'pinned'>>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.body !== undefined) dbUpdates.body = updates.body
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl
  if (updates.pinned !== undefined) dbUpdates.pinned = updates.pinned
  const { error } = await supabase.from('community_announcements').update(dbUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('community_announcements').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
