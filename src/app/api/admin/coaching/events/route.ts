import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/coaching/auth'
import type { EventKind, Enrollment } from '@/lib/coaching/types'
import { sendCoachReplyEmail } from '@/lib/coaching/emails'
import { getAppSettings } from '@/lib/app-settings'

const COACH_KINDS: EventKind[] = ['whatsapp_in', 'whatsapp_out', 'note', 'schedule_change', 'plan_change', 'mood', 'coach_reply']

/** Quick-Log im Cockpit: WhatsApp rein/raus, Notiz, Planänderung, Stimmung. */
export async function POST(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.enrollment_id !== 'string') return NextResponse.json({ error: 'enrollment_id erforderlich' }, { status: 400 })
  const kind = COACH_KINDS.includes(body.kind as EventKind) ? (body.kind as EventKind) : 'note'
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  const mood = body.mood_score != null && body.mood_score !== '' ? Number(body.mood_score) : null
  if (!text && mood === null) return NextResponse.json({ error: 'Text oder Stimmung erforderlich' }, { status: 400 })
  if (mood !== null && (!Number.isInteger(mood) || mood < 1 || mood > 5)) return NextResponse.json({ error: 'Stimmung 1 bis 5' }, { status: 400 })

  const isReply = kind === 'coach_reply'
  if (isReply && !text) return NextResponse.json({ error: 'Antwort ohne Text' }, { status: 400 })

  const admin = createAdminClient()
  const payload: Record<string, unknown> = typeof body.payload === 'object' && body.payload ? { ...(body.payload as Record<string, unknown>) } : {}
  if (isReply && typeof body.reply_to === 'string') payload.reply_to = body.reply_to

  const { data, error } = await admin.from('coaching_events').insert({
    enrollment_id: body.enrollment_id,
    kind: mood !== null && !text && kind === 'note' ? 'mood' : kind,
    body: text || null,
    payload,
    mood_score: mood,
    // Antworten an den Kunden sind immer sichtbar, Stimmung nie.
    client_visible: isReply ? true : body.client_visible === true && kind !== 'mood',
    author_profile_id: ctx.user.id,
    author_name: ctx.name,
    created_at: typeof body.created_at === 'string' && body.created_at ? new Date(body.created_at).toISOString() : new Date().toISOString(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Antwort an den Kunden: Mail raus (wenn gewünscht) und wa.me-Link zurück.
  let mailSent = false
  let mailError: string | null = null
  let waUrl: string | null = null
  if (isReply) {
    const { data: enr } = await admin.from('coaching_enrollments').select('*').eq('id', body.enrollment_id).maybeSingle()
    const enrollment = enr as Enrollment | null
    if (enrollment) {
      if (enrollment.whatsapp_url) {
        const base = enrollment.whatsapp_url.split('?')[0]
        waUrl = `${base}?text=${encodeURIComponent(text)}`
      }
      const settings = await getAppSettings()
      if (body.notify !== false && enrollment.client_email && !settings.coachingClientAccess) {
        mailError = 'Kunden-Zugang ist aus, keine Mail an den Kunden. Antwort steht im Verlauf.'
      } else if (body.notify !== false && enrollment.client_email) {
        let replyTo: string | null = null
        if (typeof body.reply_to === 'string') {
          const { data: orig } = await admin.from('coaching_events').select('body').eq('id', body.reply_to).maybeSingle()
          replyTo = (orig?.body as string | null) ?? null
        }
        const res = await sendCoachReplyEmail(admin, {
          to: enrollment.client_email,
          firstName: enrollment.client_name.split(' ')[0],
          coachName: enrollment.coach_name ?? ctx.name,
          message: text,
          replyTo,
        })
        if (res.ok) mailSent = true
        else mailError = res.error
      }
    }
  }

  revalidatePath('/admin/coaching')
  revalidatePath(`/admin/coaching/${body.enrollment_id}`)
  revalidatePath('/dashboard/coaching')
  return NextResponse.json({ ...(data as Record<string, unknown>), mail_sent: mailSent, mail_error: mailError, wa_url: waUrl })
}

export async function DELETE(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
  const admin = createAdminClient()
  const { data: row } = await admin.from('coaching_events').select('enrollment_id').eq('id', id).maybeSingle()
  const { error } = await admin.from('coaching_events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (row) revalidatePath(`/admin/coaching/${row.enrollment_id}`)
  return NextResponse.json({ success: true })
}
