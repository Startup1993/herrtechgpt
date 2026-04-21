import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { agents } from '@/lib/agents'
import { AdminDashboardClient } from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Fetch all KPI data in parallel
  const [
    { count: totalUsers },
    { count: totalConversations },
    { count: totalMessages },
    { data: recentConversations },
    { data: agentStats },
    { data: profiles },
    { data: allConversations },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase
      .from('conversations')
      .select('id, title, agent_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('conversations').select('agent_id'),
    supabase.from('profiles').select('access_tier, created_at, role'),
    supabase.from('conversations').select('created_at'),
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

  // User tier breakdown (3-Tier: Community/Alumni/Basic)
  const communityUsers = profiles?.filter(p => p.access_tier === 'premium').length ?? 0
  const alumniUsers = profiles?.filter(p => p.access_tier === 'alumni').length ?? 0
  const basicUsers = profiles?.filter(p => p.access_tier === 'basic' || !p.access_tier).length ?? 0
  const adminUsers = profiles?.filter(p => p.role === 'admin').length ?? 0

  // Signups per week (last 12 weeks)
  const signupsByWeek: { week: string; count: number }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i * 7 + now.getDay()))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = profiles?.filter(p => {
      const d = new Date(p.created_at)
      return d >= weekStart && d < weekEnd
    }).length ?? 0

    signupsByWeek.push({
      week: weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      count,
    })
  }

  // Activity last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const activeConversations7d = allConversations?.filter(c => c.created_at >= sevenDaysAgo).length ?? 0

  const kpis = {
    totalUsers: totalUsers ?? 0,
    totalConversations: totalConversations ?? 0,
    totalMessages: totalMessages ?? 0,
    activeAgents: agents.length,
    communityUsers,
    alumniUsers,
    basicUsers,
    adminUsers,
    activeConversations7d,
  }

  return (
    <AdminDashboardClient
      kpis={kpis}
      topAgents={topAgents}
      recentConversations={recentConversations ?? []}
      signupsByWeek={signupsByWeek}
      agentNames={agents.map(a => ({ id: a.id, name: a.name, emoji: a.emoji }))}
    />
  )
}
