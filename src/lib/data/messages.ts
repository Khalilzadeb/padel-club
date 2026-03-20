import { supabase } from '@/lib/supabase'

export interface Message {
  id: string
  fromPlayerId: string
  toPlayerId: string
  content: string
  read: boolean
  createdAt: string
}

export interface Conversation {
  otherPlayerId: string
  lastMessage: Message
  unreadCount: number
}

function toModel(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    fromPlayerId: row.from_player_id as string,
    toPlayerId: row.to_player_id as string,
    content: row.content as string,
    read: row.read as boolean,
    createdAt: row.created_at as string,
  }
}

export async function getConversation(playerId: string, otherPlayerId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(from_player_id.eq.${playerId},to_player_id.eq.${otherPlayerId}),and(from_player_id.eq.${otherPlayerId},to_player_id.eq.${playerId})`)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toModel)
}

export async function sendMessage(fromPlayerId: string, toPlayerId: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: `msg${crypto.randomUUID().slice(0, 8)}`,
      from_player_id: fromPlayerId,
      to_player_id: toPlayerId,
      content,
      read: false,
    })
    .select()
    .single()
  if (error) throw error
  return toModel(data)
}

export async function markConversationRead(playerId: string, otherPlayerId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('to_player_id', playerId)
    .eq('from_player_id', otherPlayerId)
    .eq('read', false)
}

export async function getConversations(playerId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`from_player_id.eq.${playerId},to_player_id.eq.${playerId}`)
    .order('created_at', { ascending: false })
  if (error) throw error

  const msgs = (data ?? []).map(toModel)
  const convMap = new Map<string, Conversation>()

  msgs.forEach((msg) => {
    const otherId = msg.fromPlayerId === playerId ? msg.toPlayerId : msg.fromPlayerId
    if (!convMap.has(otherId)) {
      convMap.set(otherId, { otherPlayerId: otherId, lastMessage: msg, unreadCount: 0 })
    }
    if (msg.toPlayerId === playerId && !msg.read) {
      convMap.get(otherId)!.unreadCount++
    }
  })

  return Array.from(convMap.values())
}

export async function getUnreadCount(playerId: string): Promise<number> {
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('to_player_id', playerId)
    .eq('read', false)
  return count ?? 0
}
