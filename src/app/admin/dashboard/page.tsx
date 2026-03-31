import { createClient } from '@/lib/supabase/server'
import { agents } from '@/lib/agents'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch KPI data in parallel
  const [
    { count: totalUsers },
    { count: totalConversations },
    { count: totalMessages },
    { data: recentConversations },
    { data: agentStats },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase
      .from('conversations')
      .select('id, title, agent_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('conversations')
      .select('agent_id'),
  ])

  // Calculate agent usage
  const agentUsage: Record<string, number> = {}
  agentStats?.forEach(({ agent_id }) => {
    agentUsage[agent_id] = (agentUsage[agent_id] || 0) + 1
  })
  const topAgents = Object.entries(agentUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, count]) => ({
      id,
      name: agents.find(a => a.id === id)?.name ?? id,
      emoji: agents.find(a => a.id === id)?.emoji ?? '🤖',
      count,
    }))

  const kpis = [
    { label: 'Registrierte Nutzer', value: totalUsers ?? 0, icon: '👥' },
    { label: 'Unterhaltungen', value: totalConversations ?? 0, icon: '💬' },
    { label: 'Nachrichten', value: totalMessages ?? 0, icon: '📨' },
    { label: 'Aktive Assistenten', value: agents.length, icon: '🤖' },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard</h1>
      <p className="text-muted mb-8">Übersicht über alle Aktivitäten in HerrTechGPT</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface border border-border rounded-xl p-5">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div className="text-3xl font-bold text-foreground">{kpi.value.toLocaleString()}</div>
            <div className="text-sm text-muted mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agents */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Meistgenutzte Assistenten</h2>
          {topAgents.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Daten vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {topAgents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{agent.name}</span>
                      <span className="text-sm text-muted ml-2">{agent.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.round((agent.count / (topAgents[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Letzte Unterhaltungen</h2>
          {!recentConversations?.length ? (
            <p className="text-sm text-muted">Noch keine Unterhaltungen.</p>
          ) : (
            <div className="space-y-2">
              {recentConversations.map((conv) => {
                const agent = agents.find(a => a.id === conv.agent_id)
                return (
                  <div key={conv.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <span className="text-base shrink-0">{agent?.emoji ?? '💬'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{conv.title}</p>
                      <p className="text-xs text-muted">{new Date(conv.created_at).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
