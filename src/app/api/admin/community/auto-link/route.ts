/**
 * Backfill-Endpoint: alle community_members ohne profile_id durchgehen
 * und mit existierenden auth.users verknüpfen (per Email-Match).
 *
 * Nützlich nach Initial-Sync / CSV-Import wenn schon Self-Signup-User
 * existieren, die parallel im Skool sind. Verhindert Doppel-Listings.
 *
 * profiles.role bleibt unangetastet (Admin bleibt Admin).
 *
 * POST /api/admin/community/auto-link
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  autoLinkProfileIfExists,
  buildAuthUserEmailMap,
} from '@/lib/skool-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

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

export async function POST() {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = createAdminClient()

  // 1. Alle auth.users in eine Email→ID Map laden (Bulk-Cache)
  let userMap: Map<string, string>
  try {
    userMap = await buildAuthUserEmailMap(admin)
  } catch (err) {
    return NextResponse.json(
      { error: `auth-users laden: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }

  // 2. Alle nicht-claimed members in Pages laden
  type Row = {
    id: string
    email: string
    name: string | null
    skool_status: 'active' | 'alumni' | 'cancelled'
    skool_access_expires_at: string | null
    profile_id: string | null
  }
  const allMembers: Row[] = []
  const PAGE = 1000
  let offset = 0
  while (offset < 50000) {
    const { data } = await admin
      .from('community_members')
      .select('id, email, name, skool_status, skool_access_expires_at, profile_id')
      .is('profile_id', null)
      .range(offset, offset + PAGE - 1)
    if (!data || data.length === 0) break
    allMembers.push(...(data as Row[]))
    if (data.length < PAGE) break
    offset += PAGE
  }

  // 3. Pro Member: linken (nutzt Cache → keine N×listUsers-Calls)
  let linked = 0
  let skipped = 0
  const errors: Array<{ email: string; error: string }> = []
  for (const m of allMembers) {
    try {
      const res = await autoLinkProfileIfExists(admin, m, userMap)
      if (res.linked) linked += 1
      else skipped += 1
    } catch (err) {
      errors.push({
        email: m.email,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({
    scanned: allMembers.length,
    linked,
    skipped,
    auth_users_total: userMap.size,
    errors: errors.length > 0 ? errors : undefined,
  })
}
