import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendInvitationEmail, recordInvitationSent } from '@/lib/invitations'

const VALID_TIERS = ['basic', 'alumni', 'premium'] as const
type AccessTier = typeof VALID_TIERS[number]

interface ImportRow {
  email: string
  created_at?: string // ISO-String, optional
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json().catch(() => null) as {
    rows?: unknown
    access_tier?: unknown
    send_invites?: unknown
  } | null
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { rows, access_tier, send_invites } = body
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'rows[] required' }, { status: 400 })
  }
  if (typeof access_tier !== 'string' || !VALID_TIERS.includes(access_tier as AccessTier)) {
    return NextResponse.json({ error: 'Invalid access_tier' }, { status: 400 })
  }
  const tier = access_tier as AccessTier
  const doInvite = send_invites === true

  // Clean + dedupe rows
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const seen = new Set<string>()
  const cleanRows: ImportRow[] = []
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as { email?: unknown; created_at?: unknown }
    if (typeof r.email !== 'string') continue
    const email = r.email.trim().toLowerCase()
    if (!emailRegex.test(email) || seen.has(email)) continue
    seen.add(email)

    const row: ImportRow = { email }
    if (typeof r.created_at === 'string') {
      const d = new Date(r.created_at)
      if (!isNaN(d.getTime())) row.created_at = d.toISOString()
    }
    cleanRows.push(row)
  }
  if (cleanRows.length === 0) {
    return NextResponse.json({ error: 'No valid rows' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Bestehende Auth-User nachschlagen (damit wir updaten statt dupliziert anlegen).
  const { data: authPage } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existingByEmail = new Map<string, string>()
  authPage?.users?.forEach((u) => {
    if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id)
  })

  let created = 0
  let updated = 0
  let invitesSent = 0
  const errors: Array<{ email: string; error: string }> = []
  const nowIso = new Date().toISOString()

  for (const row of cleanRows) {
    try {
      let userId = existingByEmail.get(row.email)
      let isNew = false

      if (!userId) {
        const { data, error } = await admin.auth.admin.createUser({
          email: row.email,
          email_confirm: true,
        })
        if (error || !data.user) {
          errors.push({ email: row.email, error: error?.message ?? 'createUser failed' })
          continue
        }
        userId = data.user.id
        isNew = true
        created += 1
      } else {
        updated += 1
      }

      const profileUpdate: Record<string, string> = {
        access_tier: tier,
        updated_at: nowIso,
      }
      if (row.created_at) profileUpdate.created_at = row.created_at

      const { error: profileError } = await admin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)
      if (profileError) {
        errors.push({ email: row.email, error: `Profil-Update: ${profileError.message}` })
      }

      if (doInvite && isNew) {
        const res = await sendInvitationEmail(admin, row.email)
        if (res.ok) {
          await recordInvitationSent(admin, userId)
          invitesSent += 1
        } else {
          errors.push({ email: row.email, error: `Einladung: ${res.error}` })
        }
      }
    } catch (e) {
      errors.push({ email: row.email, error: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  return NextResponse.json({
    total: cleanRows.length,
    created,
    updated,
    invites_sent: invitesSent,
    errors,
    tier,
  })
}
