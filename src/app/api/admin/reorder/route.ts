import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type Table = 'module_videos' | 'module_chapters' | 'module_video_resources' | 'course_modules'
const ALLOWED: Table[] = ['module_videos', 'module_chapters', 'module_video_resources', 'course_modules']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

// POST: { table: 'module_videos', items: [{id, sort_order}, ...] }
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { table, items } = (await req.json()) as { table: Table; items: { id: string; sort_order: number }[] }
  if (!ALLOWED.includes(table)) return NextResponse.json({ error: 'invalid table' }, { status: 400 })
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'no items' }, { status: 400 })

  const admin = createAdminClient()
  // Parallel updates — each row is small, RLS is bypassed via service role
  const results = await Promise.all(
    items.map((it) =>
      admin.from(table).update({ sort_order: it.sort_order }).eq('id', it.id),
    ),
  )
  const firstError = results.find((r) => r.error)?.error
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 })

  return NextResponse.json({ success: true, updated: items.length })
}
