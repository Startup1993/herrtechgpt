import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

// GET ?moduleId=... — list chapters in a module
export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const moduleId = url.searchParams.get('moduleId')
  const admin = createAdminClient()

  let q = admin.from('module_chapters').select('*').order('sort_order', { ascending: true })
  if (moduleId) q = q.eq('module_id', moduleId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ chapters: data ?? [] })
}

// POST — create chapter
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.module_id || !body.title) {
    return NextResponse.json({ error: 'module_id and title required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('module_chapters')
    .insert({
      module_id: body.module_id,
      title: body.title,
      description: body.description ?? '',
      sort_order: body.sort_order ?? 999,
      is_published: body.is_published ?? true,
      skool_chapter_id: body.skool_chapter_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ chapter: data })
}

// PATCH — update chapter
export async function PATCH(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const updates: Record<string, unknown> = {}
  for (const key of ['title', 'description', 'sort_order', 'is_published', 'module_id', 'skool_chapter_id']) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await admin
    .from('module_chapters')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ chapter: data })
}

// DELETE ?id=...
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('module_chapters').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
