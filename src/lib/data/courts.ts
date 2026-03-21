import { supabase } from '@/lib/supabase'
import type { Court } from '@/lib/types'

function toModel(row: Record<string, unknown>): Court {
  return {
    id: row.id as string,
    name: row.name as string,
    surface: row.surface as Court['surface'],
    type: row.type as Court['type'],
    isActive: row.is_active as boolean,
    pricePerHour: row.price_per_hour as number,
    imageUrl: row.image_url as string | null,
    features: (row.features as string[]) ?? [],
    location: row.location as string | undefined,
  }
}

export async function getCourts(): Promise<Court[]> {
  const { data, error } = await supabase.from('courts').select('*').order('id')
  if (error) throw error
  return (data ?? []).map(toModel)
}

export async function getCourt(id: string): Promise<Court | null> {
  const { data } = await supabase.from('courts').select('*').eq('id', id).single()
  return data ? toModel(data) : null
}
