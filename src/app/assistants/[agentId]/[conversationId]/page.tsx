import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getAgent } from '@/lib/agents'
import { ChatInterface } from '@/components/chat-interface'
import Link from 'next/link'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ agentId: string; conversationId: string }>
}) {
  const { agentId, conversationId } = await params
  const agent = getAgent(agentId)

  if (!agent) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify conversation exists and belongs to user
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
    redirect(`/assistants/${agentId}`)
  }

  // Load messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const initialMessages = (messages ?? []).map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center shrink-0 bg-surface">
        <div className="flex items-center gap-3">
          <span className="text-lg">{agent.emoji}</span>
          <div>
            <h1 className="font-semibold text-foreground">{agent.name}</h1>
            <p className="text-xs text-muted">{agent.description}</p>
          </div>
        </div>
      </div>

      {/* Chat */}
      <ChatInterface
        agent={agent}
        conversationId={conversationId}
        initialMessages={initialMessages}
      />
    </div>
  )
}
