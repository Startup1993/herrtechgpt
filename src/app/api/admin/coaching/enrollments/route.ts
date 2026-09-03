import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/coaching/auth'
import { logEvent } from '@/lib/coaching/queries'
import { sendCoachingInviteEmail } from '@/lib/coaching/emails'
import type { Enrollment } from '@/lib/coaching/types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EDITABLE = [
  'client_name', 'client_email', 'company', 'coach_name', 'coach_profile_id', 'status', 'world_mode',
  'starts_at', 'ends_at', 'track', 'persona', 'north_star', 'success_quote', 'intro_text', 'nps',
  'upsell_status', 'case_study', 'notion_url', 'drive_url', 'whatsapp_url', 'community_url', 'program_key',
] as const

function invalidate(id?: string) {
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/coaching')
  revalidatePath('/admin/coaching')
  if (id) revalidatePath(`/admin/coaching/${id}`)
}

/**
 * Findet oder erzeugt den World-Account zu einer E-Mail.
 * Rückgabe: profile_id oder null, wenn keine E-Mail vorliegt.
 */
async function ensureProfileForEmail(admin: ReturnType<typeof createAdminClient>, email: string, fullName: string) {
  const { data: page } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = page?.users?.find((u) => u.email?.toLowerCase() === email)
  if (existing) {
    await admin.from('profiles').update({ full_name: fullName }).eq('id', existing.id).is('full_name', null)
    return existing.id
  }
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error || !created.user) throw new Error(error?.message ?? 'Account konnte nicht angelegt werden')
  await admin.from('profiles').update({ full_name: fullName, access_tier: 'basic' }).eq('id', created.user.id)
  return created.user.id
}

export async function POST(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const clientName = typeof body.client_name === 'string' ? body.client_name.trim() : ''
  if (!clientName) return NextResponse.json({ error: 'Name des Kunden fehlt' }, { status: 400 })
  const email = typeof body.client_email === 'string' ? body.client_email.trim().toLowerCase() : ''
  if (email && !EMAIL_REGEX.test(email)) return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
  const createAccount = body.create_account === true && !!email
  const sendInvite = body.send_invite === true && createAccount

  const admin = createAdminClient()
  let profileId: string | null = null
  if (createAccount) {
    try {
      profileId = await ensureProfileForEmail(admin, email, clientName)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Account-Fehler' }, { status: 500 })
    }
    const { data: dupe } = await admin.from('coaching_enrollments').select('id').eq('profile_id', profileId).eq('status', 'active').maybeSingle()
    if (dupe) return NextResponse.json({ error: 'Dieser Kunde hat schon eine aktive Teilnahme' }, { status: 409 })
  }

  const insert: Record<string, unknown> = {
    program_key: typeof body.program_key === 'string' && body.program_key ? body.program_key : 'coaching_1zu1',
    profile_id: profileId,
    client_name: clientName,
    client_email: email || null,
    company: typeof body.company === 'string' ? body.company.trim() || null : null,
    coach_name: typeof body.coach_name === 'string' ? body.coach_name || null : null,
    coach_profile_id: ctx.user.id,
    status: body.status === 'completed' || body.status === 'paused' ? body.status : 'active',
    world_mode: body.world_mode === 'program_plus_toolbox' || body.world_mode === 'full' ? body.world_mode : 'program_only',
    track: typeof body.track === 'string' ? body.track || null : null,
    starts_at: typeof body.starts_at === 'string' && body.starts_at ? body.starts_at : null,
    ends_at: typeof body.ends_at === 'string' && body.ends_at ? body.ends_at : null,
    north_star: typeof body.north_star === 'string' ? body.north_star || null : null,
    success_quote: typeof body.success_quote === 'string' ? body.success_quote || null : null,
  }
  if (!insert.ends_at && insert.starts_at) {
    const d = new Date(insert.starts_at as string); d.setFullYear(d.getFullYear() + 1)
    insert.ends_at = d.toISOString().slice(0, 10)
  }

  const { data, error } = await admin.from('coaching_enrollments').insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const enrollment = data as Enrollment

  await logEvent(admin, { enrollment_id: enrollment.id, kind: 'note', body: 'Teilnahme angelegt', author_profile_id: ctx.user.id, author_name: ctx.name })

  let inviteError: string | null = null
  if (sendInvite && email) {
    const res = await sendCoachingInviteEmail(admin, email, { firstName: clientName.split(' ')[0], coachName: enrollment.coach_name })
    if (res.ok) {
      await admin.from('coaching_enrollments').update({ invited_at: new Date().toISOString() }).eq('id', enrollment.id)
      await logEvent(admin, { enrollment_id: enrollment.id, kind: 'invite_sent', body: email, author_profile_id: ctx.user.id, author_name: ctx.name })
    } else {
      inviteError = res.error
    }
  }

  invalidate(enrollment.id)
  return NextResponse.json({ enrollment, invite_error: inviteError })
}

export async function PATCH(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.id !== 'string') return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

  const admin = createAdminClient()
  const { data: before } = await admin.from('coaching_enrollments').select('*').eq('id', body.id).maybeSingle()
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const prev = before as Enrollment

  const updates: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in body) {
      const v = body[key]
      updates[key] = typeof v === 'string' && v.trim() === '' ? null : v
    }
  }
  if ('client_email' in updates && updates.client_email && !EMAIL_REGEX.test(String(updates.client_email))) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
  }
  if ('nps' in updates && updates.nps !== null) {
    const n = Number(updates.nps)
    if (!Number.isInteger(n) || n < 0 || n > 10) return NextResponse.json({ error: 'NPS muss 0 bis 10 sein' }, { status: 400 })
    updates.nps = n
  }

  const { data, error } = await admin.from('coaching_enrollments').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const next = data as Enrollment

  if (prev.status !== next.status) {
    await logEvent(admin, { enrollment_id: next.id, kind: 'plan_change', body: `Status: ${prev.status} → ${next.status}`, author_profile_id: ctx.user.id, author_name: ctx.name, client_visible: false })
  }
  if (prev.world_mode !== next.world_mode) {
    await logEvent(admin, { enrollment_id: next.id, kind: 'plan_change', body: `World-Zugang: ${prev.world_mode} → ${next.world_mode}`, author_profile_id: ctx.user.id, author_name: ctx.name })
  }

  invalidate(next.id)
  return NextResponse.json(next)
}

export async function DELETE(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
  const admin = createAdminClient()
  const { data: files } = await admin.storage.from('coaching-files').list(`enrollments/${id}`, { limit: 1000 })
  if (files?.length) {
    await admin.storage.from('coaching-files').remove(files.map((f) => `enrollments/${id}/${f.name}`))
  }
  const { error } = await admin.from('coaching_enrollments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  invalidate()
  return NextResponse.json({ success: true })
}
