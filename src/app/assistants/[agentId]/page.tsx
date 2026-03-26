import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getAgent } from '@/lib/agents'

export default async function AgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params

  // Redirect general chat to /assistants/chat
  if (agentId === 'general') {
    redirect('/assistants/chat')
  }

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

  // Create a new conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      agent_id: agentId,
      title: 'Neue Unterhaltung',
    })
    .select('id')
    .single()

  if (!conversation) {
    redirect('/assistants')
  }

  redirect(`/assistants/${agentId}/${conversation.id}`)
}
