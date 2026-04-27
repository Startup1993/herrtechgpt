/**
 * Manueller Skool-Sync (Admin-getriggert).
 *
 * Pullt Stripe-Checkout-Sessions der letzten N Tage, upsertet community_members,
 * und cleant anschließend abgelaufene Members auf alumni.
 *
 * POST /api/admin/community/sync  { days?: number }
 *
 * Antwort: { scanned, matched, upserted, expired, errors }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncSkoolMembersFromStripe } from '@/lib/skool-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

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

export async function POST(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { days?: number } | null
  const days = typeof body?.days === 'number' && body.days > 0 ? body.days : 90

  try {
    const admin = createAdminClient()
    const result = await syncSkoolMembersFromStripe(admin, { days })
    return NextResponse.json({ ok: true, days, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
