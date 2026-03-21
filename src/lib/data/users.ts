import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
  playerId?: string
  googleId?: string
  avatarUrl?: string
  role: string
}

function toModel(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    passwordHash: (row.password_hash as string) ?? '',
    createdAt: row.created_at as string,
    playerId: row.player_id as string | undefined,
    googleId: row.google_id as string | undefined,
    avatarUrl: row.avatar_url as string | undefined,
    role: (row.role as string) ?? 'user',
  }
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const { data } = await supabase.from('users').select('*').ilike('email', email).maybeSingle()
  return data ? toModel(data) : undefined
}

export async function findUserById(id: string): Promise<User | undefined> {
  const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
  return data ? toModel(data) : undefined
}

export async function findUserByGoogleId(googleId: string): Promise<User | undefined> {
  const { data } = await supabase.from('users').select('*').eq('google_id', googleId).maybeSingle()
  return data ? toModel(data) : undefined
}

export async function createUser(email: string, name: string, password: string): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 10)
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: `u${Date.now()}`,
      email,
      name,
      password_hash: passwordHash,
    })
    .select()
    .single()
  if (error) throw error
  return toModel(data)
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash)
}

export async function createGoogleUser(email: string, name: string, googleId: string, avatarUrl?: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: `u${Date.now()}`,
      email,
      name,
      password_hash: '',
      google_id: googleId,
      avatar_url: avatarUrl,
    })
    .select()
    .single()
  if (error) throw error
  return toModel(data)
}

export async function linkGoogleId(userId: string, googleId: string, avatarUrl?: string): Promise<void> {
  const update: Record<string, string> = { google_id: googleId }
  if (avatarUrl) update.avatar_url = avatarUrl
  await supabase.from('users').update(update).eq('id', userId)
}
