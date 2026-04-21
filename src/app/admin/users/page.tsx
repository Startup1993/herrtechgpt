import { createAdminClient } from '@/lib/supabase/admin'
import UsersTable from './UsersTable'

export default async function AdminUsersPage() {
  const admin = createAdminClient()

  const [
    { data: profiles },
    { data: { users: authUsers } },
    { data: convStats },
  ] = await Promise.all([
    admin.from('profiles').select('id, role, access_tier, created_at').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('conversations').select('user_id, updated_at'),
  ])

  const emailMap: Record<string, string> = {}
  const lastLoginMap: Record<string, string> = {}
  authUsers?.forEach((u) => {
    emailMap[u.id] = u.email ?? ''
    if (u.last_sign_in_at) lastLoginMap[u.id] = u.last_sign_in_at
  })

  const convCountMap: Record<string, number> = {}
  const lastActiveMap: Record<string, string> = {}
  convStats?.forEach(({ user_id, updated_at }) => {
    convCountMap[user_id] = (convCountMap[user_id] ?? 0) + 1
    if (!lastActiveMap[user_id] || updated_at > lastActiveMap[user_id]) {
      lastActiveMap[user_id] = updated_at
    }
  })

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailMap[p.id] ?? '—',
    role: p.role as 'user' | 'admin',
    access_tier: (p.access_tier ?? 'basic') as 'basic' | 'alumni' | 'premium',
    created_at: p.created_at,
    last_active: lastActiveMap[p.id] ?? lastLoginMap[p.id] ?? null,
    conversation_count: convCountMap[p.id] ?? 0,
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
