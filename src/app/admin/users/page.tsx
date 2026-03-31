import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import UsersTable from './UsersTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Get all profiles with role info
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, role, created_at')
    .order('created_at', { ascending: false })

  // Get auth users for emails
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers()

  const emailMap: Record<string, string> = {}
  authUsers?.forEach((u) => { emailMap[u.id] = u.email ?? '' })

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailMap[p.id] ?? '—',
    role: p.role as 'user' | 'admin',
    created_at: p.created_at,
  }))

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">Nutzerverwaltung</h1>
      <p className="text-muted mb-8">
        {users.length} {users.length === 1 ? 'Nutzer' : 'Nutzer'} registriert · Weise Rollen zu, um Admin-Zugang zu gewähren.
      </p>

      {users.length === 0 ? (
        <p className="text-sm text-muted">Noch keine Nutzer registriert.</p>
      ) : (
        <UsersTable users={users} />
      )}
    </div>
  )
}
