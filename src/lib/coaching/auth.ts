import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Enrollment } from './types'

/** Admin-Check für alle /api/admin/coaching-Routen. */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  const name = (profile.full_name as string | null) ?? (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? 'Coach'
  return { user, name }
}

/**
 * Kunden-Check: liefert den eingeloggten User und die Teilnahme, zu der die
 * Zeile gehört. Nur wenn die Teilnahme dem User gehört.
 */
export async function requireClientEnrollment(enrollmentId: string): Promise<{ userId: string; enrollment: Enrollment } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('coaching_enrollments').select('*').eq('id', enrollmentId).maybeSingle()
  if (!data || (data as Enrollment).profile_id !== user.id) return null
  return { userId: user.id, enrollment: data as Enrollment }
}
