import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/coaching/auth'
import { logEvent } from '@/lib/coaching/queries'
import type { Task } from '@/lib/coaching/types'

const EDITABLE = ['milestone_id', 'title', 'description', 'instructions', 'copy_prompt', 'link_url', 'due_at', 'assignee', 'kind', 'status', 'proof_url', 'sort_order'] as const

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
  if ('due_at' in updates && updates.due_at) updates.due_at = new Date(String(updates.due_at)).toISOString()
  if ('assignee' in updates && updates.assignee !== 'client' && updates.assignee !== 'coach') delete updates.assignee
  if ('kind' in updates && !['homework', 'promise', 'cadence'].includes(String(updates.kind))) delete updates.kind
  if ('status' in updates && !['open', 'done', 'skipped'].includes(String(updates.status))) delete updates.status
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
  const updates = clean(body)
  const { data: maxRow } = await admin.from('coaching_tasks').select('sort_order').eq('enrollment_id', body.enrollment_id).order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const { data, error } = await admin.from('coaching_tasks').insert({
    enrollment_id: body.enrollment_id,
    assignee: 'client',
    kind: 'homework',
    status: 'open',
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
  const { data: before } = await admin.from('coaching_tasks').select('*').eq('id', body.id).maybeSingle()
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const prev = before as Task
  const updates = clean(body)
  if ('status' in updates) {
    updates.completed_at = updates.status === 'done' ? new Date().toISOString() : null
  }
  const { data, error } = await admin.from('coaching_tasks').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const next = data as Task
  if (prev.status !== 'done' && next.status === 'done' && next.assignee === 'client') {
    await logEvent(admin, { enrollment_id: next.enrollment_id, kind: 'task_done', body: `${next.title} (vom Coach abgehakt)`, payload: { task_id: next.id }, client_visible: true, author_profile_id: ctx.user.id, author_name: ctx.name })
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
  const { data: row } = await admin.from('coaching_tasks').select('enrollment_id').eq('id', id).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { error } = await admin.from('coaching_tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  invalidate(row.enrollment_id as string)
  return NextResponse.json({ success: true })
}
