import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireClientEnrollment } from '@/lib/coaching/auth'
import { logEvent } from '@/lib/coaching/queries'
import { sendBlockerAlert } from '@/lib/coaching/emails'

/** Kunde trägt "Das läuft" oder "Hier hänge ich" ein. Blocker alarmiert den Coach per Mail. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { enrollmentId?: string; kind?: string; body?: string } | null
  if (!body?.enrollmentId || (body.kind !== 'client_win' && body.kind !== 'client_blocker') || !body.body?.trim()) {
    return NextResponse.json({ error: 'enrollmentId, kind (client_win|client_blocker) und body erforderlich' }, { status: 400 })
  }
  const ctx = await requireClientEnrollment(body.enrollmentId)
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const text = body.body.trim().slice(0, 2000)
  const admin = createAdminClient()
  await logEvent(admin, {
    enrollment_id: ctx.enrollment.id,
    kind: body.kind,
    body: text,
    author_profile_id: ctx.userId,
    author_name: ctx.enrollment.client_name,
    client_visible: true,
  })

  if (body.kind === 'client_blocker') {
    let coachEmail: string | null = null
    if (ctx.enrollment.coach_profile_id) {
      const { data } = await admin.auth.admin.getUserById(ctx.enrollment.coach_profile_id)
      coachEmail = data?.user?.email ?? null
    }
    await sendBlockerAlert(admin, {
      clientName: ctx.enrollment.client_name,
      message: text,
      enrollmentId: ctx.enrollment.id,
      coachEmail,
    })
  }

  return NextResponse.json({ success: true })
}
