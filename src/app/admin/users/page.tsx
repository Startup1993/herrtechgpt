import { createAdminClient } from '@/lib/supabase/admin'
import UsersTable from './UsersTable'

export default async function AdminUsersPage() {
  const admin = createAdminClient()

  const [
    { data: profiles },
    { data: { users: authUsers } },
    { data: convStats },
    { data: subs },
    { data: plans },
  ] = await Promise.all([
    admin.from('profiles').select('id, role, access_tier, full_name, created_at, invitation_sent_count').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('conversations').select('user_id, updated_at'),
    admin
      .from('subscriptions')
      .select('user_id, plan_id, status, billing_cycle, cancel_at_period_end, current_period_end, created_at')
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false }),
    admin.from('plans').select('id, tier, name'),
  ])

  const emailMap: Record<string, string> = {}
  const lastLoginMap: Record<string, string> = {}
  const hasLoggedInMap: Record<string, boolean> = {}
  authUsers?.forEach((u) => {
    emailMap[u.id] = u.email ?? ''
    if (u.last_sign_in_at) {
      lastLoginMap[u.id] = u.last_sign_in_at
      hasLoggedInMap[u.id] = true
    }
  })

  const convCountMap: Record<string, number> = {}
  const lastActiveMap: Record<string, string> = {}
  convStats?.forEach(({ user_id, updated_at }) => {
    convCountMap[user_id] = (convCountMap[user_id] ?? 0) + 1
    if (!lastActiveMap[user_id] || updated_at > lastActiveMap[user_id]) {
      lastActiveMap[user_id] = updated_at
    }
  })

  const planMap: Record<string, { tier: 'S' | 'M' | 'L'; name: string }> = {}
  plans?.forEach((p) => {
    planMap[p.id] = { tier: p.tier as 'S' | 'M' | 'L', name: p.name as string }
  })

  // subs ist bereits nach created_at DESC sortiert → erster Treffer pro User = aktuellstes Abo
  type SubInfo = {
    plan_id: string
    plan_tier: 'S' | 'M' | 'L'
    plan_name: string
    status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'ended'
    billing_cycle: 'monthly' | 'yearly'
    cancel_at_period_end: boolean
    current_period_end: string | null
  }
  const subMap: Record<string, SubInfo> = {}
  subs?.forEach((s) => {
    if (subMap[s.user_id]) return
    const plan = planMap[s.plan_id]
    if (!plan) return
    subMap[s.user_id] = {
      plan_id: s.plan_id,
      plan_tier: plan.tier,
      plan_name: plan.name,
      status: s.status as 'active' | 'trialing' | 'past_due' | 'cancelled' | 'ended',
      billing_cycle: s.billing_cycle as 'monthly' | 'yearly',
      cancel_at_period_end: !!s.cancel_at_period_end,
      current_period_end: s.current_period_end as string | null,
    }
  })

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailMap[p.id] ?? '—',
    full_name: (p as { full_name?: string | null }).full_name ?? null,
    role: p.role as 'user' | 'admin',
    access_tier: (p.access_tier ?? 'basic') as 'basic' | 'alumni' | 'premium',
    created_at: p.created_at,
    last_active: lastActiveMap[p.id] ?? lastLoginMap[p.id] ?? null,
    conversation_count: convCountMap[p.id] ?? 0,
    has_logged_in: !!hasLoggedInMap[p.id],
    invitation_sent_count: (p as { invitation_sent_count?: number }).invitation_sent_count ?? 0,
    subscription: subMap[p.id] ?? null,
  }))

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nutzerverwaltung</h1>
          <p className="text-sm text-muted mt-1">{users.length} registrierte Nutzer</p>
        </div>
      </div>
      <UsersTable users={users} />
    </div>
  )
}
