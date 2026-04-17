import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/chat-interface'
import { helpAgent } from '@/lib/agents'
import Link from 'next/link'

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find or create a help conversation for this user
  let { data: helpConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id)
    .eq('agent_id', 'help')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!helpConv) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        agent_id: 'help',
        title: 'Hilfe & Support',
      })
      .select('id')
      .single()
    helpConv = newConv
  }

  if (!helpConv) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted">Fehler beim Erstellen des Hilfe-Chats.</p>
      </div>
    )
  }

  // Load existing messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', helpConv.id)
    .order('created_at', { ascending: true })

  const initialMessages = (messages ?? []).map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg">💬</span>
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm sm:text-base">Hilfe & Kontakt</h1>
            <p className="text-xs text-muted hidden sm:block">
              Frag mich alles — bei Bedarf verbinde ich dich mit dem Support-Team.
            </p>
          </div>
        </div>
        <Link
          href="mailto:support@herr.tech"
          className="text-xs text-muted hover:text-foreground border border-border px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-surface-hover transition-colors hidden sm:inline-flex"
        >
          Direkt E-Mail senden
        </Link>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatInterface
          agent={helpAgent}
          conversationId={helpConv.id}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  )
}
