/**
 * Community-Member löschen.
 *
 * DELETE /api/admin/community/[id]
 *
 * - Wenn der Member geclaimt war und eine Plan-S-Sub aus skool_community
 *   aktiv ist → Sub beenden, access_tier auf 'alumni' setzen
 *   (gleiche Logik wie expireSkoolMembership).
 * - Dann community_members-Eintrag hart löschen.
 *
 * Das User-Profil (auth.users + profiles) bleibt unangetastet — der User
 * ist nur nicht mehr als Skool-Mitglied gelistet.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { expireSkoolMembership } from '@/lib/skool-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createAdminClient()

  // Erst auf alumni setzen → beendet Plan-S-Sub + setzt access_tier korrekt,
  // wenn der Member geclaimt war. Bei nicht-claimed members: no-op.
  try {
    await expireSkoolMembership(admin, id)
  } catch (err) {
    // Wir loggen nur und löschen trotzdem — Sub-Cleanup kann später manuell
    console.warn('[delete-member] expire fehlgeschlagen:', err)
  }

  const { error } = await admin.from('community_members').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
