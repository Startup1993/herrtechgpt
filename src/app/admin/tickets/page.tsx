import { createAdminClient } from '@/lib/supabase/admin'
import { TicketsClient } from './TicketsClient'

export default async function AdminTicketsPage() {
  const admin = createAdminClient()

  // Load all help conversations (agent_id = 'help') as "tickets"
  const { data: helpConvs } = await admin
    .from('conversations')
    .select('id, user_id, title, created_at, updated_at')
    .eq('agent_id', 'help')
    .order('updated_at', { ascending: false })
    .limit(50)

  // Get user emails
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  authUsers?.forEach(u => { emailMap[u.id] = u.email ?? '' })

  // Get message counts + latest message per conversation
  const convIds = (helpConvs ?? []).map(c => c.id)
  const { data: allMessages } = convIds.length > 0
    ? await admin
        .from('messages')
        .select('conversation_id, role, content, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const tickets = (helpConvs ?? []).map(conv => {
    const msgs = (allMessages ?? []).filter(m => m.conversation_id === conv.id)
    const lastUserMsg = msgs.find(m => m.role === 'user')
    return {
      id: conv.id,
      userId: conv.user_id,
      userEmail: emailMap[conv.user_id] ?? '—',
      title: conv.title ?? 'Hilfe-Anfrage',
      messageCount: msgs.length,
      lastMessage: lastUserMsg?.content?.substring(0, 100) ?? '',
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      hasUnread: msgs.length > 0 && msgs[0].role === 'user',
    }
  })

  return <TicketsClient tickets={tickets} />
}
