import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/coaching/auth'
import { logEvent } from '@/lib/coaching/queries'
import { createCoachCadenceTasks, milestoneDefaults } from '@/lib/coaching/template'
import { fmtDate } from '@/lib/coaching/derive'
import type { Milestone, MilestoneKind, Program } from '@/lib/coaching/types'

const KINDS: MilestoneKind[] = ['kickoff', 'call', 'checkin', 'month']
const STATUSES = ['planned', 'scheduled', 'done', 'cancelled']
const EDITABLE = [
  'kind', 'number', 'title', 'goal', 'success_criterion', 'scheduled_at', 'status', 'summary', 'decisions',
  'done_items', 'open_items', 'bring_along', 'recording_url', 'recap_url', 'recap_storage_path', 'meeting_url', 'sort_order',
] as const

function invalidate(enrollmentId: string) {
  revalidatePath('/dashboard/coaching')
  revalidatePath('/dashboard/coaching/sessions')
  revalidatePath('/admin/coaching')
  revalidatePath(`/admin/coaching/${enrollmentId}`)
}

export async function POST(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.enrollment_id !== 'string') return NextResponse.json({ error: 'enrollment_id erforderlich' }, { status: 400 })

  const kind = KINDS.includes(body.kind as MilestoneKind) ? (body.kind as MilestoneKind) : 'call'
  const number = Number.isInteger(Number(body.number)) ? Number(body.number) : 1
  const defaults = milestoneDefaults(kind, number)

  const admin = createAdminClient()
  const { data: enrollment } = await admin.from('coaching_enrollments').select('id, program_key, starts_at, ends_at').eq('id', body.enrollment_id).maybeSingle()
  if (!enrollment) return NextResponse.json({ error: 'Teilnahme nicht gefunden' }, { status: 404 })

  // 12-Monats-Weg: Monate 2 bis 12 auf einmal, monatlich ab dem Monat nach dem letzten Call.
  if (body.bulk_months === true) {
    const { data: existing } = await admin.from('coaching_milestones').select('kind, number, scheduled_at').eq('enrollment_id', body.enrollment_id)
    const rows = (existing ?? []) as Array<{ kind: string; number: number; scheduled_at: string | null }>
    const haveMonths = new Set(rows.filter((r) => r.kind === 'month').map((r) => r.number))
    const lastCall = rows.filter((r) => r.kind === 'call' && r.scheduled_at).map((r) => new Date(r.scheduled_at!).getTime()).sort((a, b) => b - a)[0]
    const anchor = lastCall ? new Date(lastCall) : enrollment.starts_at ? new Date(enrollment.starts_at as string) : new Date()
    const inserts: Array<Record<string, unknown>> = []
    for (let n = 2; n <= 12; n++) {
      if (haveMonths.has(n)) continue
      const d = new Date(anchor.getFullYear(), anchor.getMonth() + (n - 1), 1, 9, 0, 0)
      inserts.push({
        enrollment_id: body.enrollment_id,
        kind: 'month',
        number: n,
        title: `Monat ${n} · dran bleiben`,
        goal: n === 2 ? 'Deine 3 Workflows laufen ohne uns. Was hakt, kommt in den Check-in.' : n % 3 === 0 ? 'Quartals-Blick: Was läuft, was fliegt raus, was kommt dazu?' : 'Ein neuer Workflow oder ein bestehender vertieft. Community-Live-Calls nutzen.',
        scheduled_at: d.toISOString(),
        status: 'planned',
        sort_order: 2000 + n,
      })
    }
    if (inserts.length) {
      const { error } = await admin.from('coaching_milestones').insert(inserts)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    invalidate(body.enrollment_id)
    return NextResponse.json({ created: inserts.length })
  }

  const { data: maxRow } = await admin.from('coaching_milestones').select('sort_order').eq('enrollment_id', body.enrollment_id).order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const scheduledAt = typeof body.scheduled_at === 'string' && body.scheduled_at ? new Date(body.scheduled_at).toISOString() : null

  const { data, error } = await admin.from('coaching_milestones').insert({
    enrollment_id: body.enrollment_id,
    kind,
    number,
    title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : defaults.title,
    goal: typeof body.goal === 'string' && body.goal.trim() ? body.goal.trim() : defaults.goal || null,
    scheduled_at: scheduledAt,
    status: scheduledAt ? 'scheduled' : 'planned',
    meeting_url: typeof body.meeting_url === 'string' ? body.meeting_url || null : null,
    sort_order: typeof body.sort_order === 'number' ? body.sort_order : (maxRow?.sort_order ?? 0) + 10,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const milestone = data as Milestone

  if (body.with_cadence !== false) {
    const { data: program } = await admin.from('coaching_programs').select('*').eq('key', enrollment.program_key).maybeSingle()
    await createCoachCadenceTasks(admin, (program as Program | null) ?? null, milestone)
  }

  invalidate(body.enrollment_id)
  return NextResponse.json(milestone)
}

export async function PATCH(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.id !== 'string') return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

  const admin = createAdminClient()
  const { data: before } = await admin.from('coaching_milestones').select('*').eq('id', body.id).maybeSingle()
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const prev = before as Milestone

  const updates: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in body) {
      const v = body[key]
      updates[key] = typeof v === 'string' && v.trim() === '' ? null : v
    }
  }
  if ('kind' in updates && !KINDS.includes(updates.kind as MilestoneKind)) return NextResponse.json({ error: 'Ungültiger Typ' }, { status: 400 })
  if ('status' in updates && !STATUSES.includes(String(updates.status))) return NextResponse.json({ error: 'Ungültiger Status' }, { status: 400 })
  if ('scheduled_at' in updates && updates.scheduled_at) updates.scheduled_at = new Date(String(updates.scheduled_at)).toISOString()
  // Termin gesetzt, Status noch "geplant" → automatisch "terminiert".
  if (updates.scheduled_at && prev.status === 'planned' && !('status' in updates)) updates.status = 'scheduled'

  const { data, error } = await admin.from('coaching_milestones').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const next = data as Milestone

  const author = { author_profile_id: ctx.user.id, author_name: ctx.name }
  if (prev.scheduled_at !== next.scheduled_at && (prev.scheduled_at || next.scheduled_at)) {
    const reason = typeof body.change_reason === 'string' && body.change_reason.trim() ? ` · Grund: ${body.change_reason.trim()}` : ''
    await logEvent(admin, {
      enrollment_id: next.enrollment_id, kind: 'schedule_change', client_visible: true, ...author,
      body: `${next.title}: ${prev.scheduled_at ? fmtDate(prev.scheduled_at, 'datetime') : 'offen'} → ${next.scheduled_at ? fmtDate(next.scheduled_at, 'datetime') : 'offen'}${reason}`,
      payload: { milestone_id: next.id, from: prev.scheduled_at, to: next.scheduled_at },
    })
    // Coach-Cadence an den neuen Termin hängen: alte offene Cadence-Aufgaben weg, neue anlegen.
    if (body.reschedule_cadence !== false) {
      await admin.from('coaching_tasks').delete().eq('milestone_id', next.id).eq('assignee', 'coach').eq('kind', 'cadence').eq('status', 'open')
      const { data: enrollment } = await admin.from('coaching_enrollments').select('program_key').eq('id', next.enrollment_id).maybeSingle()
      if (enrollment) {
        const { data: program } = await admin.from('coaching_programs').select('*').eq('key', enrollment.program_key).maybeSingle()
        await createCoachCadenceTasks(admin, (program as Program | null) ?? null, next)
      }
    }
  }
  if (prev.status !== 'done' && next.status === 'done') {
    await logEvent(admin, { enrollment_id: next.enrollment_id, kind: 'milestone_done', body: next.title, payload: { milestone_id: next.id }, client_visible: true, ...author })
  }
  if (prev.status !== 'cancelled' && next.status === 'cancelled') {
    await logEvent(admin, { enrollment_id: next.enrollment_id, kind: 'plan_change', body: `${next.title} entfällt`, payload: { milestone_id: next.id }, client_visible: true, ...author })
  }

  invalidate(next.enrollment_id)
  return NextResponse.json(next)
}

export async function DELETE(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
  const admin = createAdminClient()
  const { data: row } = await admin.from('coaching_milestones').select('enrollment_id, recap_storage_path').eq('id', id).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (row.recap_storage_path) await admin.storage.from('coaching-files').remove([row.recap_storage_path as string])
  const { error } = await admin.from('coaching_milestones').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  invalidate(row.enrollment_id as string)
  return NextResponse.json({ success: true })
}
