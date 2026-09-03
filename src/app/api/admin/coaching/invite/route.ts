import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/coaching/auth'
import { logEvent } from '@/lib/coaching/queries'
import { sendCoachingInviteEmail } from '@/lib/coaching/emails'
import type { Enrollment } from '@/lib/coaching/types'

/**
 * Coaching-Einladung verschicken. Legt bei Bedarf den World-Account an
 * (Magic-Link, kein Passwort) und verknüpft ihn mit der Teilnahme.
 */
export async function POST(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null) as { enrollment_id?: string } | null
  if (!body?.enrollment_id) return NextResponse.json({ error: 'enrollment_id erforderlich' }, { status: 400 })

  const admin = createAdminClient()
  const { data } = await admin.from('coaching_enrollments').select('*').eq('id', body.enrollment_id).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const e = data as Enrollment
  const email = e.client_email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Der Kunde hat noch keine E-Mail-Adresse' }, { status: 400 })

  let profileId = e.profile_id
  if (!profileId) {
    const { data: page } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const existing = page?.users?.find((u) => u.email?.toLowerCase() === email)
    if (existing) {
      profileId = existing.id
    } else {
      const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: e.client_name } })
      if (error || !created.user) return NextResponse.json({ error: error?.message ?? 'Account konnte nicht angelegt werden' }, { status: 500 })
      profileId = created.user.id
      await admin.from('profiles').update({ full_name: e.client_name, access_tier: 'basic' }).eq('id', profileId)
    }
    await admin.from('coaching_enrollments').update({ profile_id: profileId }).eq('id', e.id)
  }

  const res = await sendCoachingInviteEmail(admin, email, { firstName: e.client_name.split(' ')[0], coachName: e.coach_name })
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 })

  await admin.from('coaching_enrollments').update({ invited_at: new Date().toISOString() }).eq('id', e.id)
  await logEvent(admin, { enrollment_id: e.id, kind: 'invite_sent', body: email, author_profile_id: ctx.user.id, author_name: ctx.name })
  revalidatePath('/admin/coaching')
  revalidatePath(`/admin/coaching/${e.id}`)
  return NextResponse.json({ success: true, profile_id: profileId })
}
