'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type AccessTier = 'basic' | 'alumni' | 'premium'

interface UserRow {
  id: string
  email: string
  role: 'user' | 'admin'
  access_tier: AccessTier
  created_at: string
  last_active: string | null
  conversation_count: number
}

type TierFilterValue = 'all' | AccessTier

const TIER_META: Record<AccessTier, { label: string; className: string }> = {
  premium: {
    label: '✓ Community',
    className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  },
  alumni: {
    label: 'Alumni',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  },
  basic: {
    label: 'Basic',
    className: 'bg-surface-secondary text-muted',
  },
}

export default function UsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterTier, setFilterTier] = useState<TierFilterValue>('all')

  const filtered = users
    .filter((u) => u.email.toLowerCase().includes(search.toLowerCase()))
    .filter((u) => filterTier === 'all' || u.access_tier === filterTier)

  const premiumCount = users.filter((u) => u.access_tier === 'premium').length
  const alumniCount = users.filter((u) => u.access_tier === 'alumni').length
  const basicCount = users.filter((u) => u.access_tier === 'basic').length

  async function deleteUser(userId: string) {
    setLoading(userId + '_delete')
    await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
    setLoading(null)
    setDeleteConfirm(null)
    router.refresh()
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function timeAgo(iso: string | null) {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Heute'
    if (days === 1) return 'Gestern'
    if (days < 7) return `vor ${days} Tagen`
    if (days < 30) return `vor ${Math.floor(days / 7)} Wo.`
    return formatDate(iso)
  }

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Nutzer suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <TierFilter label={`Alle (${users.length})`} active={filterTier === 'all'} onClick={() => setFilterTier('all')} />
          <TierFilter label={`Community (${premiumCount})`} active={filterTier === 'premium'} onClick={() => setFilterTier('premium')} />
          <TierFilter label={`Alumni (${alumniCount})`} active={filterTier === 'alumni'} onClick={() => setFilterTier('alumni')} />
          <TierFilter label={`Basic (${basicCount})`} active={filterTier === 'basic'} onClick={() => setFilterTier('basic')} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">E-Mail</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Zugang</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Registriert</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Letzte Aktivität</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Chats</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Rolle</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted">
                  Keine Nutzer gefunden.
                </td>
              </tr>
            )}
            {filtered.map((u) => {
              const tier = TIER_META[u.access_tier]
              return (
                <tr
                  key={u.id}
                  className="hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-foreground underline decoration-transparent hover:decoration-primary transition-colors">{u.email}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tier.className}`}>
                      {tier.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3.5 text-xs text-muted">{timeAgo(u.last_active)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-sm font-medium text-foreground">{u.conversation_count}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-secondary text-muted'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Nutzer'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="text-xs text-muted hover:text-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors whitespace-nowrap"
                      >
                        Details
                      </button>

                      {deleteConfirm === u.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={!!loading}
                            className="text-xs bg-red-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {loading === u.id + '_delete' ? '...' : 'Bestätigen'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-muted hover:text-foreground px-2 py-1.5"
                          >
                            Abbruch
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          disabled={!!loading}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{filtered.length} von {users.length} Nutzern</p>
    </div>
  )
}

function TierFilter({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-primary text-white'
          : 'bg-surface border border-border text-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}
