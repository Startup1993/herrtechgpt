/**
 * Daily Cron: Skool-Mitgliedschafts-Ablauf
 *
 * Läuft 1× pro Tag. Findet community_members mit:
 *   skool_status = 'active' AND skool_access_expires_at < now
 *
 * Für jeden: expireSkoolMembership() → setzt alumni, beendet skool_community-Sub,
 * setzt access_tier auf 'alumni' (nur wenn keine andere aktive Sub da).
 *
 * Auth: Vercel-Cron via Authorization-Header, manuell via ?secret=
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { expireSkoolMembership, isSkoolSyncEnabled } from '@/lib/skool-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = req.nextUrl.searchParams.get('secret')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = secret && secret === process.env.CRON_SECRET
  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isSkoolSyncEnabled()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'SKOOL_SYNC_ENABLED=false',
    })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: expired, error } = await admin
    .from('community_members')
    .select('id, email')
    .eq('skool_status', 'active')
    .lt('skool_access_expires_at', now)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let processed = 0
  const failures: Array<{ id: string; error: string }> = []

  for (const member of expired ?? []) {
    try {
      await expireSkoolMembership(admin, member.id)
      processed += 1
    } catch (err) {
      failures.push({
        id: member.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({
    ok: true,
    found: expired?.length ?? 0,
    processed,
    failures,
  })
}
