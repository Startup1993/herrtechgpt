import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/chat-interface'

const generalAgent = {
  id: 'general',
  name: 'Allgemeiner Chat',
  description: 'Stellen Sie jede Frage rund um Immobilien',
  emoji: '💬',
  color: 'bg-primary',
  textColor: 'text-primary',
  mode: 'free-chat' as const,
  placeholder: 'Stellen Sie Ihre Frage...',
  systemPrompt: `Du bist ein hilfreicher AI-Assistent für Immobilienprofis im deutschsprachigen Raum (DACH). Du kannst bei allen Themen rund um Immobilien helfen — von Marktfragen über Marketing bis hin zu rechtlichen Grundlagen. Antworte professionell, praxisnah und auf Deutsch.`,
}

export default async function GeneralChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: conversation } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      agent_id: 'general',
      title: 'Neue Unterhaltung',
    })
    .select('id')
    .single()

  if (!conversation) redirect('/assistants')

  return (
    <ChatInterface
      agent={generalAgent}
      conversationId={conversation.id}
      initialMessages={[]}
    />
  )
}
