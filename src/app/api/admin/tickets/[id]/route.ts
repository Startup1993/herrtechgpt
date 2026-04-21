import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

// PATCH: status oder mode \u00e4ndern (z.B. "Als erledigt markieren", "KI \u00fcbernehmen")
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const body = await req.json() as { status?: string; mode?: string }

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }
  if (body.status !== undefined) {
    if (!['new','answered','resolved'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = body.status
  }
  if (body.mode !== undefined) {
    if (!['ai','human'].includes(body.mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }
    updates.mode = body.mode
  }

  const adminDb = createAdminClient()
  const { error } = await adminDb.from('conversations').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // System-Marker bei Mode-Wechsel
  if (body.mode === 'ai') {
    await adminDb.from('messages').insert({
      conversation_id: id,
      role: 'system',
      content: 'Chat wurde wieder an die KI \u00fcbergeben.',
    })
  }

  return NextResponse.json({ success: true })
}
