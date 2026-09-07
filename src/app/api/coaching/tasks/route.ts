import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/coaching/queries'
import type { Enrollment, Task } from '@/lib/coaching/types'

/** Kunde hakt eine eigene Aufgabe ab oder öffnet sie wieder. */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { taskId?: string; status?: string; proofUrl?: string } | null
  if (!body?.taskId || (body.status !== 'done' && body.status !== 'open')) {
    return NextResponse.json({ error: 'taskId und status (done|open) erforderlich' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: task } = await admin.from('coaching_tasks').select('*').eq('id', body.taskId).maybeSingle()
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const t = task as Task
  if (t.assignee !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: enrollment } = await admin.from('coaching_enrollments').select('*').eq('id', t.enrollment_id).maybeSingle()
  const e = enrollment as Enrollment | null
  if (!e || e.profile_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const done = body.status === 'done'
  const { data: updated, error } = await admin
    .from('coaching_tasks')
    .update({
      status: body.status,
      completed_at: done ? new Date().toISOString() : null,
      proof_url: typeof body.proofUrl === 'string' && body.proofUrl.length ? body.proofUrl : t.proof_url,
    })
    .eq('id', t.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logEvent(admin, {
    enrollment_id: e.id,
    kind: done ? 'task_done' : 'task_reopened',
    body: t.title,
    payload: { task_id: t.id },
    author_profile_id: user.id,
    author_name: e.client_name,
    client_visible: true,
  })

  return NextResponse.json(updated)
}
