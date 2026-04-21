import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notifyAdminsNewTicket } from '@/lib/email'

// User schaltet Support-Chat in Human-Mode: mode='human', status='new', System-Marker einf\u00fcgen.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId } = await req.json() as { conversationId?: string }
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

  // Conversation muss dem User geh\u00f6ren UND agent_id='help' sein
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('id, user_id, agent_id, mode')
    .eq('id', conversationId)
    .single()

  if (convErr || !conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conv.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (conv.agent_id !== 'help') return NextResponse.json({ error: 'Only help chats' }, { status: 400 })

  if (conv.mode === 'human') {
    return NextResponse.json({ success: true, alreadyHuman: true })
  }

  // Mode wechseln
  const { error: updErr } = await supabase
    .from('conversations')
    .update({ mode: 'human', status: 'new', updated_at: new Date().toISOString() })
    .eq('id', conversationId)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  // System-Marker im Chat
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'system',
    content: 'Chat wurde an das Support-Team weitergeleitet.',
  })

  // E-Mail-Benachrichtigung an Admins (optional — l\u00e4uft im Hintergrund)
  notifyAdminsNewTicket({ conversationId, userEmail: user.email ?? '' }).catch(() => {})

  return NextResponse.json({ success: true })
}
