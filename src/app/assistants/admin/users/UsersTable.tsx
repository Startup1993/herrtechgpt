'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserRow {
  id: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export default function UsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleRole(userId: string, currentRole: 'user' | 'admin') {
    setLoading(userId)
    const newRole = currentRole === 'admin' ? 'user' : 'admin'

    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })

    setLoading(null)
    router.refresh()
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-secondary">
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Nutzer</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Registriert</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Rolle</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-surface-secondary transition-colors">
              <td className="px-5 py-3.5">
                <span className="text-foreground font-medium">{u.email}</span>
              </td>
              <td className="px-5 py-3.5 text-muted">
                {new Date(u.created_at).toLocaleDateString('de-DE')}
              </td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  u.role === 'admin'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-secondary text-muted'
                }`}>
                  {u.role === 'admin' ? 'Admin' : 'Nutzer'}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => toggleRole(u.id, u.role)}
                  disabled={loading === u.id}
                  className="text-xs text-muted hover:text-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
                >
                  {loading === u.id
                    ? '...'
                    : u.role === 'admin'
                    ? 'Zum Nutzer machen'
                    : 'Zum Admin machen'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
