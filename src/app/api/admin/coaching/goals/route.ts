import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/coaching/auth'
import { logEvent } from '@/lib/coaching/queries'
import { GOAL_STATUS_META, type Goal, type GoalStatus } from '@/lib/coaching/types'

const STATUSES: GoalStatus[] = ['planned', 'in_progress', 'running', 'stuck']
const EDITABLE = ['milestone_id', 'title', 'description', 'status', 'status_note', 'baseline', 'result', 'sort_order'] as const

function invalidate(enrollmentId: string) {
  revalidatePath('/dashboard/coaching')
  revalidatePath('/admin/coaching')
  revalidatePath(`/admin/coaching/${enrollmentId}`)
}

function clean(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in body) {
      const v = body[key]
      updates[key] = typeof v === 'string' && v.trim() === '' ? null : v
    }
  }
  if ('status' in updates && !STATUSES.includes(updates.status as GoalStatus)) delete updates.status
  return updates
}

export async function POST(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.enrollment_id !== 'string' || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'enrollment_id und title erforderlich' }, { status: 400 })
  }
  const admin = createAdminClient()
  const { data: maxRow } = await admin.from('coaching_goals').select('sort_order').eq('enrollment_id', body.enrollment_id).order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const updates = clean(body)
  const { data, error } = await admin.from('coaching_goals').insert({
    enrollment_id: body.enrollment_id,
    status: 'planned',
    ...updates,
    title: body.title.trim(),
    sort_order: typeof updates.sort_order === 'number' ? updates.sort_order : (maxRow?.sort_order ?? 0) + 10,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  invalidate(body.enrollment_id)
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.id !== 'string') return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
  const admin = createAdminClient()
  const { data: before } = await admin.from('coaching_goals').select('*').eq('id', body.id).maybeSingle()
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const prev = before as Goal
  const updates = clean(body)
  if ('status' in updates) {
    updates.stuck_since = updates.status === 'stuck' ? (prev.stuck_since ?? new Date().toISOString()) : null
  }
  const { data, error } = await admin.from('coaching_goals').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const next = data as Goal
  if (prev.status !== next.status) {
    await logEvent(admin, {
      enrollment_id: next.enrollment_id, kind: 'plan_change', client_visible: true,
      body: `Workflow „${next.title}“: ${GOAL_STATUS_META[prev.status].label} → ${GOAL_STATUS_META[next.status].label}`,
      payload: { goal_id: next.id, from: prev.status, to: next.status },
      author_profile_id: ctx.user.id, author_name: ctx.name,
    })
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
  const { data: row } = await admin.from('coaching_goals').select('enrollment_id').eq('id', id).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { error } = await admin.from('coaching_goals').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  invalidate(row.enrollment_id as string)
  return NextResponse.json({ success: true })
}
