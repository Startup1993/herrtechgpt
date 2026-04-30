/**
 * PATCH /api/admin/community/expiry
 *
 * Setzt skool_access_expires_at auf einem community_members-Eintrag.
 * Wird von der Nutzerverwaltung (Inline-Edit "Zugang bis") und vom
 * /admin/community-Tab genutzt.
 *
 * Body: { memberId: string, expiresAt: string | null (ISO-Date) }
 *
 * NULL = unbefristet (z.B. nach Admin-Override).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function PATCH(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: { memberId?: string; expiresAt?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const memberId = body.memberId
  if (!memberId || typeof memberId !== 'string') {
    return NextResponse.json({ error: 'memberId required' }, { status: 400 })
  }

  // expiresAt darf null sein (= unbefristet)
  let expiresIso: string | null = null
  if (body.expiresAt !== null && body.expiresAt !== undefined) {
    if (typeof body.expiresAt !== 'string') {
      return NextResponse.json({ error: 'expiresAt must be string or null' }, { status: 400 })
    }
    const d = new Date(body.expiresAt)
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'expiresAt is not a valid date' }, { status: 400 })
    }
    expiresIso = d.toISOString()
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('community_members')
    .update({ skool_access_expires_at: expiresIso })
    .eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
