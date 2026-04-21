import { createAdminClient } from '@/lib/supabase/admin'
import { TicketsClient } from './TicketsClient'

export default async function AdminTicketsPage() {
  const admin = createAdminClient()

  // Nur "richtige" Tickets: Conversations die irgendwann Human-Mode waren ODER Status != 'new' haben
  // (= User hat Team kontaktiert, oder es gab eine Admin-Antwort, oder es wurde erledigt)
  const { data: helpConvs } = await admin
    .from('conversations')
    .select('id, user_id, title, created_at, updated_at, mode, status')
    .eq('agent_id', 'help')
    .or('mode.eq.human,status.in.(answered,resolved)')
    .order('updated_at', { ascending: false })
    .limit(100)

  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  authUsers?.forEach((u) => { emailMap[u.id] = u.email ?? '' })

  const convIds = (helpConvs ?? []).map((c) => c.id)
  const { data: allMessages } = convIds.length > 0
    ? await admin
        .from('messages')
        .select('conversation_id, role, content, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const tickets = (helpConvs ?? []).map((conv) => {
    const msgs = (allMessages ?? []).filter((m) => m.conversation_id === conv.id)
    const lastNonSystem = msgs.find((m) => m.role !== 'system')
    return {
      id: conv.id,
      userId: conv.user_id,
      userEmail: emailMap[conv.user_id] ?? '—',
      title: conv.title ?? 'Hilfe-Anfrage',
      messageCount: msgs.filter((m) => m.role !== 'system').length,
      lastMessage: lastNonSystem?.content?.substring(0, 120) ?? '',
      lastMessageRole: lastNonSystem?.role ?? null,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      mode: (conv.mode ?? 'ai') as 'ai' | 'human',
      status: (conv.status ?? 'new') as 'new' | 'answered' | 'resolved',
    }
  })

  return <TicketsClient tickets={tickets} />
}
