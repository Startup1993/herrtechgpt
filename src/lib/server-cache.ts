import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

// React cache() dedupliziert Aufrufe innerhalb eines Requests.
// Layout + Page + verschachtelte Components teilen sich so EINE Auth+Profile-Query
// statt die gleichen 2 Supabase-Calls pro Render-Tree zu wiederholen.

export const getAuthedUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export type CachedProfile = {
  id: string
  role: string | null
  access_tier: string | null
  background: string | null
  market: string | null
  target_audience: string | null
  offer: string | null
  stripe_customer_id: string | null
  learning_path: unknown
  learning_path_generated_at: string | null
  primary_goal: string | null
  experience_level: string | null
} | null

// Selektiert den Superset aller Spalten, die Layouts/Pages routinemäßig lesen.
// Profile-Tabelle ist schmal — ein breites Select ist billiger als N kleine.
export const getProfileCached = cache(async (): Promise<CachedProfile> => {
  const user = await getAuthedUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select(
      'id, role, access_tier, background, market, target_audience, offer, stripe_customer_id, learning_path, learning_path_generated_at, primary_goal, experience_level'
    )
    .eq('id', user.id)
    .single()
  return (data as CachedProfile) ?? null
})
