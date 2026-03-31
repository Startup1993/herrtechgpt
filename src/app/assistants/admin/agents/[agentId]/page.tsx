import { agents } from '@/lib/agents'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AgentEditForm from './AgentEditForm'
import type { AgentConfig } from '@/lib/types'

export default async function AgentEditPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const agent = agents.find((a) => a.id === agentId)
  if (!agent) notFound()

  const supabase = await createClient()
  const { data: config } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('agent_id', agentId)
    .single()

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/assistants/admin/agents" className="hover:text-foreground transition-colors">Assistenten</Link>
        <span>/</span>
        <span className="text-foreground">{config?.name ?? agent.name}</span>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">{config?.emoji ?? agent.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{config?.name ?? agent.name}</h1>
          <p className="text-sm text-muted mt-0.5">ID: {agent.id} · Modus: {agent.mode}</p>
        </div>
      </div>

      <AgentEditForm agent={agent} config={config as AgentConfig | null} />
    </div>
  )
}
