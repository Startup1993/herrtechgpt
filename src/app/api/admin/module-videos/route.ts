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

// GET — list videos by moduleId
export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const moduleId = url.searchParams.get('moduleId')
  const admin = createAdminClient()

  let query = admin.from('module_videos').select('*').order('sort_order', { ascending: true })
  if (moduleId) query = query.eq('module_id', moduleId)

  const { data: videos } = await query
  return NextResponse.json({ videos: videos ?? [] })
}

// POST — create new video
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.module_id || !body.wistia_hashed_id || !body.title) {
    return NextResponse.json({ error: 'module_id, wistia_hashed_id, title required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('module_videos')
    .insert({
      module_id: body.module_id,
      wistia_hashed_id: body.wistia_hashed_id,
      title: body.title,
      description: body.description ?? '',
      sort_order: body.sort_order ?? 999,
      duration_seconds: body.duration_seconds ?? null,
      is_published: body.is_published ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ video: data })
}

// PATCH — update video
export async function PATCH(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const updates: Record<string, unknown> = {}
  for (const key of ['title', 'description', 'sort_order', 'is_published', 'wistia_hashed_id', 'module_id', 'duration_seconds']) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await admin
    .from('module_videos')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ video: data })
}

// DELETE
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('module_videos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
