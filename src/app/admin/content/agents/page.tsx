import { agents } from '@/lib/agents'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { AgentConfig } from '@/lib/types'

export default async function AdminAgentsPage() {
  const supabase = await createClient()
  const { data: configs } = await supabase
    .from('agent_configs')
    .select('*')
    .order('order_index', { ascending: true })

  const configMap: Record<string, AgentConfig> = {}
  configs?.forEach((c: AgentConfig) => { configMap[c.agent_id] = c })

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">Assistenten verwalten</h1>
      <p className="text-muted mb-8">
        Bearbeite Namen, Beschreibung und System-Prompt der Assistenten. Änderungen wirken sofort.
      </p>

      <div className="space-y-3">
        {agents.map((agent) => {
          const config = configMap[agent.id]
          const name = config?.name ?? agent.name
          const description = config?.description ?? agent.description
          const isActive = config?.is_active ?? true

          return (
            <div key={agent.id} className={`bg-surface border border-border rounded-xl p-5 flex items-center gap-4 ${!isActive ? 'opacity-50' : ''}`}>
              <span className="text-2xl shrink-0">{config?.emoji ?? agent.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{name}</h3>
                  {!isActive && (
                    <span className="text-xs bg-surface-secondary text-muted px-2 py-0.5 rounded-full">Deaktiviert</span>
                  )}
                  {config && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Angepasst</span>
                  )}
                </div>
                <p className="text-sm text-muted mt-0.5 truncate">{description}</p>
              </div>
              <Link
                href={`/admin/content/agents/${agent.id}`}
                className="shrink-0 px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-secondary transition-colors text-foreground"
              >
                Bearbeiten
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
