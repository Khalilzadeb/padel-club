import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  playerId: string
  type: string
  title: string
  body: string
  link?: string
  read: boolean
  createdAt: string
}

function toModel(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    type: row.type as string,
    title: row.title as string,
    body: row.body as string,
    link: row.link as string | undefined,
    read: row.read as boolean,
    createdAt: row.created_at as string,
  }
}

export async function createNotification(n: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<void> {
  await supabase.from('notifications').insert({
    id: `n${crypto.randomUUID().slice(0, 8)}`,
    player_id: n.playerId,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link ?? null,
    read: false,
  })
}

export async function getNotifications(playerId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []).map(toModel)
}

export async function markAllRead(playerId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('player_id', playerId).eq('read', false)
}

export async function markOneRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id)
}

export async function getUnreadCount(playerId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', playerId)
    .eq('read', false)
  return count ?? 0
}
