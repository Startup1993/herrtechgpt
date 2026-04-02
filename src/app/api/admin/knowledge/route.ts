import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only admins
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { video_id, is_active, agents } = body

  if (is_active !== undefined) {
    await supabase
      .from('knowledge_base')
      .update({ is_active })
      .eq('video_id', video_id)
  }

  if (agents !== undefined) {
    // Rebuild source field: 'wistia' + optional agent IDs
    const source = agents.length > 0 ? `wistia,${agents.join(',')}` : 'wistia'
    await supabase
      .from('knowledge_base')
      .update({ source })
      .eq('video_id', video_id)
  }

  return NextResponse.json({ ok: true })
}
