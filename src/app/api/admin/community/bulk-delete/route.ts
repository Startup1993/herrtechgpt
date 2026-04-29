/**
 * Bulk-Delete: löscht mehrere community_members in einem Schwung.
 *
 * POST /api/admin/community/bulk-delete  { ids: string[] }
 *
 * Pro Member wird cancelSkoolMembership-Logik ausgeführt (Plan-S
 * beenden / access_tier korrigieren), bevor gelöscht wird.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminProfile } from '@/lib/skool-sync'

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

export async function POST(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as { ids?: string[] } | null
  const ids = Array.isArray(body?.ids)
    ? body!.ids.filter((x): x is string => typeof x === 'string')
    : []
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }
  if (ids.length > 5000) {
    return NextResponse.json({ error: 'Max 5000 IDs pro Request' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Bei claimed members müssen wir Plan S beenden + access_tier korrigieren
  // BEVOR der community_members-Eintrag weg ist (sonst können wir nicht
  // mehr eindeutig zuordnen). Dafür betroffene laden:
  const { data: claimed } = await admin
    .from('community_members')
    .select('id, profile_id')
    .in('id', ids)
    .not('profile_id', 'is', null)

  let skippedAdmins = 0
  for (const m of claimed ?? []) {
    if (!m.profile_id) continue
    // Admin-Schutz: profiles + subscriptions des Admins NIE anfassen.
    // community_members-Eintrag selbst wird unten weiterhin gelöscht.
    if (await isAdminProfile(admin, m.profile_id)) {
      skippedAdmins += 1
      continue
    }
    // Plan-S-Sub beenden
    const { data: skoolSub } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', m.profile_id)
      .eq('plan_source', 'skool_community')
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle()
    if (skoolSub) {
      await admin
        .from('subscriptions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', skoolSub.id)
    }
    // access_tier auf 'basic' falls aktuell premium und keine andere Sub
    const { data: otherActive } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', m.profile_id)
      .in('status', ['active', 'trialing', 'past_due'])
      .limit(1)
      .maybeSingle()
    if (!otherActive) {
      await admin
        .from('profiles')
        .update({ access_tier: 'basic' })
        .eq('id', m.profile_id)
        .eq('access_tier', 'premium')
    }
  }

  // Bulk-Delete in 100er-Batches
  let deleted = 0
  const errors: string[] = []
  const BATCH = 100
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH)
    const { error: delErr, count } = await admin
      .from('community_members')
      .delete({ count: 'exact' })
      .in('id', batch)
    if (delErr) {
      errors.push(delErr.message)
    } else {
      deleted += count ?? batch.length
    }
  }

  return NextResponse.json({
    requested: ids.length,
    deleted,
    skipped_admins: skippedAdmins,
    errors: errors.length > 0 ? errors : undefined,
  })
}
