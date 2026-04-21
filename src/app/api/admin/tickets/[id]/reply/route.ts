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

// POST: Admin sendet Message mit role='admin', setzt status='answered', mode='human'
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const { content } = await req.json() as { content?: string }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 })
  }

  const adminDb = createAdminClient()

  const { error: msgErr } = await adminDb.from('messages').insert({
    conversation_id: id,
    role: 'admin',
    content: content.trim(),
  })
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 })

  const { error: updErr } = await adminDb
    .from('conversations')
    .update({
      mode: 'human',
      status: 'answered',
      user_has_unread: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
