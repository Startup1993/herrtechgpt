'use client'

import { Users, MessageSquare, Mail, Bot, Crown, UserCheck, TrendingUp, Activity } from 'lucide-react'

interface KPIs {
  totalUsers: number
  totalConversations: number
  totalMessages: number
  activeAgents: number
  premiumUsers: number
  freeUsers: number
  adminUsers: number
  activeConversations7d: number
}

interface TopAgent {
  id: string
  name: string
  emoji: string
  count: number
}

interface RecentConv {
  id: string
  title: string
  agent_id: string
  created_at: string
}

interface SignupWeek {
  week: string
  count: number
}

export function AdminDashboardClient({
  kpis,
  topAgents,
  recentConversations,
  signupsByWeek,
  agentNames,
}: {
  kpis: KPIs
  topAgents: TopAgent[]
  recentConversations: RecentConv[]
  signupsByWeek: SignupWeek[]
  agentNames: { id: string; name: string; emoji: string }[]
}) {
  const maxSignups = Math.max(...signupsByWeek.map(w => w.count), 1)

  const kpiCards = [
    { label: 'Nutzer gesamt', value: kpis.totalUsers, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Premium', value: kpis.premiumUsers, icon: Crown, color: 'text-primary bg-primary/10' },
    { label: 'Free', value: kpis.freeUsers, icon: UserCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Unterhaltungen', value: kpis.totalConversations, icon: MessageSquare, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Nachrichten', value: kpis.totalMessages, icon: Mail, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Aktiv (7 Tage)', value: kpis.activeConversations7d, icon: Activity, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
    { label: 'Assistenten', value: kpis.activeAgents, icon: Bot, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30' },
    { label: 'Admins', value: kpis.adminUsers, icon: TrendingUp, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
  ]

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Admin Dashboard</h1>
        <p className="text-sm text-muted">Übersicht über alle Aktivitäten auf der Plattform</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="card-static p-4 sm:p-5">
            <div className={`w-9 h-9 rounded-[var(--radius-lg)] ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon size={18} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{kpi.value.toLocaleString('de-DE')}</div>
            <div className="text-xs text-muted mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Signup Chart */}
        <div className="card-static p-5">
          <h2 className="font-semibold text-foreground mb-4">Neue Nutzer pro Woche</h2>
          <div className="flex items-end gap-1.5 h-32">
            {signupsByWeek.map((week, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/80 rounded-t-sm min-h-[2px] transition-all hover:bg-primary"
                  style={{ height: `${Math.max((week.count / maxSignups) * 100, 2)}%` }}
                  title={`${week.week}: ${week.count} Nutzer`}
                />
                <span className="text-[9px] text-muted -rotate-45 origin-left whitespace-nowrap">
                  {week.week}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Tier Breakdown */}
        <div className="card-static p-5">
          <h2 className="font-semibold text-foreground mb-4">Nutzer-Verteilung</h2>
          <div className="space-y-4">
            <TierBar label="Premium" count={kpis.premiumUsers} total={kpis.totalUsers} color="bg-primary" />
            <TierBar label="Free" count={kpis.freeUsers} total={kpis.totalUsers} color="bg-emerald-400" />
            <TierBar label="Admins" count={kpis.adminUsers} total={kpis.totalUsers} color="bg-amber-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Conversion Rate</span>
              <span className="font-semibold text-foreground">
                {kpis.totalUsers > 0 ? Math.round((kpis.premiumUsers / kpis.totalUsers) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Agents */}
        <div className="card-static p-5">
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
                        className="h-full bg-primary rounded-full transition-all"
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
        <div className="card-static p-5">
          <h2 className="font-semibold text-foreground mb-4">Letzte Unterhaltungen</h2>
          {!recentConversations?.length ? (
            <p className="text-sm text-muted">Noch keine Unterhaltungen.</p>
          ) : (
            <div className="space-y-2">
              {recentConversations.map((conv) => {
                const agent = agentNames.find(a => a.id === conv.agent_id)
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

function TierBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm text-muted">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
