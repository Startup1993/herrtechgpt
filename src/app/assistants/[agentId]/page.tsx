import { notFound, redirect } from 'next/navigation'
import { getAgent } from '@/lib/agents'
import { createClient } from '@/lib/supabase/server'
import AgentLanding from './AgentLanding'

export default async function AgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params

  if (agentId === 'general') {
    redirect('/assistants/chat')
  }

  const agent = getAgent(agentId)
  if (!agent) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <AgentLanding agent={agent} />
}
