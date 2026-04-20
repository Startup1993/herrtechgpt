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

// GET — list resources for a video
export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const videoId = url.searchParams.get('videoId')
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('module_video_resources')
    .select('*')
    .eq('video_id', videoId)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ resources: data ?? [] })
}

// POST — create
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.video_id || !body.title || !body.url) {
    return NextResponse.json({ error: 'video_id, title, url required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('module_video_resources')
    .insert({
      video_id: body.video_id,
      title: body.title,
      url: body.url,
      resource_type: body.resource_type ?? inferType(body.url),
      sort_order: body.sort_order ?? 999,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resource: data })
}

// PATCH — update
export async function PATCH(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const updates: Record<string, unknown> = {}
  for (const key of ['title', 'url', 'resource_type', 'sort_order']) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await admin
    .from('module_video_resources')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resource: data })
}

// DELETE
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('module_video_resources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

function inferType(url: string): string {
  const u = url.toLowerCase()
  if (u.endsWith('.pdf') || u.includes('.pdf?')) return 'pdf'
  if (/\.(jpe?g|png|gif|webp|svg)(\?|$)/.test(u)) return 'image'
  if (/\.(mp4|mov|webm)(\?|$)/.test(u)) return 'video'
  return 'link'
}
