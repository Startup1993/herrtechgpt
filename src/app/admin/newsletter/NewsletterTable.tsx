'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, CheckCircle2, Send } from 'lucide-react'

type SignupStatus = 'pending' | 'invited' | 'registered'

type SignupRow = {
  id: string
  email: string
  status: SignupStatus
  source: string
  created_at: string
  invited_at: string | null
  registered_at: string | null
}

const STATUS_META: Record<SignupStatus, { label: string; dot: string; text: string }> = {
  pending: { label: 'Wartend', dot: 'bg-gray-400', text: 'text-muted' },
  invited: { label: 'Eingeladen', dot: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-400' },
  registered: { label: 'Registriert', dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NewsletterTable({ signups }: { signups: SignupRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | SignupStatus>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const filtered = signups
    .filter((s) => s.email.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => filter === 'all' || s.status === filter)

  const pendingIds = signups.filter((s) => s.status === 'pending').map((s) => s.id)

  async function inviteOne(id: string) {
    setLoading(id)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/newsletter/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ type: 'err', text: data?.error ?? 'Einladung fehlgeschlagen' })
      } else {
        setMessage({ type: 'ok', text: 'Einladung verschickt' })
        router.refresh()
      }
    } catch {
      setMessage({ type: 'err', text: 'Netzwerk-Fehler' })
    } finally {
      setLoading(null)
    }
  }

  async function inviteAllPending() {
    if (pendingIds.length === 0) return
    if (!confirm(`${pendingIds.length} Einladungen verschicken?`)) return
    setBulkBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/newsletter/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: pendingIds }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ type: 'err', text: data?.error ?? 'Bulk-Einladung fehlgeschlagen' })
      } else {
        setMessage({
          type: 'ok',
          text: `${data.invited ?? 0} verschickt${data.failed ? ` · ${data.failed} Fehler` : ''}`,
        })
        router.refresh()
      }
    } catch {
      setMessage({ type: 'err', text: 'Netzwerk-Fehler' })
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="E-Mail suchen…"
            className="flex-1 px-4 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | SignupStatus)}
            className="px-4 py-2 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Alle Status</option>
            <option value="pending">Wartend</option>
            <option value="invited">Eingeladen</option>
            <option value="registered">Registriert</option>
          </select>
        </div>
        <button
          onClick={inviteAllPending}
          disabled={pendingIds.length === 0 || bulkBusy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Alle wartenden einladen ({pendingIds.length})
        </button>
      </div>

      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg ${
            message.type === 'ok'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary border-b border-border">
              <tr className="text-left text-muted">
                <th className="px-4 py-3 font-medium">E-Mail</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Quelle</th>
                <th className="px-4 py-3 font-medium">Eingetragen</th>
                <th className="px-4 py-3 font-medium">Eingeladen</th>
                <th className="px-4 py-3 font-medium text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    Keine Einträge.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const meta = STATUS_META[s.status]
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                      <td className="px-4 py-3 text-foreground">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 ${meta.text}`}>
                          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{s.source}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(s.invited_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {s.status === 'registered' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fertig
                          </span>
                        ) : (
                          <button
                            onClick={() => inviteOne(s.id)}
                            disabled={loading === s.id || bulkBusy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50"
                          >
                            {loading === s.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Mail className="w-3.5 h-3.5" />
                            )}
                            {s.status === 'invited' ? 'Nochmal einladen' : 'Einladen'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
