import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/chat-interface'
import { helpAgent } from '@/lib/agents'
import Link from 'next/link'

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string }>
}) {
  const { chat: chatId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load all help conversations for this user
  const { data: helpConvs } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('user_id', user.id)
    .eq('agent_id', 'help')
    .order('updated_at', { ascending: false })
    .limit(20)

  // Determine active conversation
  let activeConvId = chatId

  // If no chat selected and conversations exist, use the latest
  if (!activeConvId && helpConvs && helpConvs.length > 0) {
    activeConvId = helpConvs[0].id
  }

  // If still no conversation, create one
  if (!activeConvId) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        agent_id: 'help',
        title: 'Hilfe & Support',
      })
      .select('id')
      .single()
    activeConvId = newConv?.id
  }

  if (!activeConvId) {
    return <div className="p-8 text-center text-muted">Fehler beim Laden des Hilfe-Chats.</div>
  }

  // Load messages for active conversation
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', activeConvId)
    .order('created_at', { ascending: true })

  const initialMessages = (messages ?? []).map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Header with chat history */}
      <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg">💬</span>
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm sm:text-base">Hilfe & Kontakt</h1>
            <p className="text-xs text-muted hidden sm:block">
              Frag mich alles — bei Bedarf verbinde ich dich mit dem Support.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Chat history dropdown */}
          {helpConvs && helpConvs.length > 1 && (
            <div className="hidden sm:flex items-center gap-1">
              {helpConvs.slice(0, 3).map((conv) => (
                <Link
                  key={conv.id}
                  href={`/dashboard/help?chat=${conv.id}`}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    conv.id === activeConvId
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {conv.title?.substring(0, 20) ?? 'Chat'}
                </Link>
              ))}
            </div>
          )}
          {/* New chat button */}
          <NewHelpChatButton />
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatInterface
          agent={helpAgent}
          conversationId={activeConvId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  )
}

function NewHelpChatButton() {
  return (
    <form action={async () => {
      'use server'
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: conv } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, agent_id: 'help', title: 'Neue Anfrage' })
        .select('id')
        .single()
      if (conv) redirect(`/dashboard/help?chat=${conv.id}`)
    }}>
      <button
        type="submit"
        className="text-xs text-primary hover:text-primary-hover border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
      >
        + Neuer Chat
      </button>
    </form>
  )
}
