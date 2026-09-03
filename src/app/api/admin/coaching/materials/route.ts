import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/coaching/auth'
import { COACHING_BUCKET, logEvent, signedUrl } from '@/lib/coaching/queries'
import type { Material, MaterialKind } from '@/lib/coaching/types'

const KINDS: MaterialKind[] = ['skill', 'script', 'document', 'analysis', 'recording', 'other']
const EDITABLE = ['milestone_id', 'kind', 'title', 'description', 'version', 'external_url', 'storage_path', 'file_name', 'instructions', 'visibility', 'sort_order'] as const

function invalidate(enrollmentId: string) {
  revalidatePath('/dashboard/coaching')
  revalidatePath('/dashboard/coaching/sessions')
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
  if ('kind' in updates && !KINDS.includes(updates.kind as MaterialKind)) delete updates.kind
  if ('visibility' in updates && updates.visibility !== 'internal' && updates.visibility !== 'client') delete updates.visibility
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
  const { data, error } = await admin.from('coaching_materials').insert({
    enrollment_id: body.enrollment_id,
    kind: 'document',
    visibility: 'internal',
    ...updates,
    title: body.title.trim(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const m = data as Material
  await logEvent(admin, {
    enrollment_id: m.enrollment_id, kind: 'material_added', body: m.title, payload: { material_id: m.id, kind: m.kind },
    client_visible: m.visibility === 'client', author_profile_id: ctx.user.id, author_name: ctx.name,
  })
  invalidate(m.enrollment_id)
  return NextResponse.json({ ...m, signed_url: await signedUrl(admin, m.storage_path) })
}

export async function PATCH(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.id !== 'string') return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
  const admin = createAdminClient()
  const { data: before } = await admin.from('coaching_materials').select('*').eq('id', body.id).maybeSingle()
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const prev = before as Material
  const updates = clean(body)
  // Datei getauscht: alte Datei im Bucket löschen, "neu"-Markierung zurücksetzen.
  if ('storage_path' in updates && updates.storage_path !== prev.storage_path) {
    if (prev.storage_path) await admin.storage.from(COACHING_BUCKET).remove([prev.storage_path])
    updates.first_opened_at = null
  }
  const { data, error } = await admin.from('coaching_materials').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const next = data as Material
  if (prev.visibility !== 'client' && next.visibility === 'client') {
    await logEvent(admin, { enrollment_id: next.enrollment_id, kind: 'material_added', body: `${next.title} freigegeben`, payload: { material_id: next.id }, client_visible: true, author_profile_id: ctx.user.id, author_name: ctx.name })
  }
  invalidate(next.enrollment_id)
  return NextResponse.json({ ...next, signed_url: await signedUrl(admin, next.storage_path) })
}

export async function DELETE(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
  const admin = createAdminClient()
  const { data: row } = await admin.from('coaching_materials').select('enrollment_id, storage_path').eq('id', id).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (row.storage_path) await admin.storage.from(COACHING_BUCKET).remove([row.storage_path as string])
  const { error } = await admin.from('coaching_materials').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  invalidate(row.enrollment_id as string)
  return NextResponse.json({ success: true })
}
