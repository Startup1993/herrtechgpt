'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, CheckCircle2, Send, RefreshCw } from 'lucide-react'

type SkoolStatus = 'active' | 'alumni' | 'cancelled'

type MemberRow = {
  id: string
  email: string
  name: string | null
  skool_status: SkoolStatus
  skool_access_expires_at: string | null
  last_purchase_at: string | null
  purchase_count: number
  invitation_sent_count: number
  last_invited_at: string | null
  claimed_at: string | null
  created_at: string
}

const STATUS_META: Record<SkoolStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Aktiv', dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  alumni: { label: 'Alumni', dot: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-400' },
  cancelled: { label: 'Gekündigt', dot: 'bg-gray-400', text: 'text-muted' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function CommunityTable({ members }: { members: MemberRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | SkoolStatus | 'invitable' | 'claimed'>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncDays, setSyncDays] = useState(90)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const filtered = members
    .filter((m) => {
      const q = search.toLowerCase()
      return (
        m.email.toLowerCase().includes(q) ||
        (m.name ?? '').toLowerCase().includes(q)
      )
    })
    .filter((m) => {
      if (filter === 'all') return true
      if (filter === 'invitable') return m.skool_status === 'active' && !m.claimed_at
      if (filter === 'claimed') return !!m.claimed_at
      return m.skool_status === filter
    })

  const invitableIds = members
    .filter((m) => m.skool_status === 'active' && !m.claimed_at)
    .map((m) => m.id)

  async function runSync() {
    if (
      !confirm(
        `Sync der letzten ${syncDays} Tage starten?\n\nLädt aus Stripe alle KI-Marketing-Club-Käufe, aktualisiert die Mitgliederliste und setzt abgelaufene Mitglieder auf Alumni.`
      )
    )
      return
    setSyncBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/community/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: syncDays }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ type: 'err', text: data?.error ?? 'Sync fehlgeschlagen' })
      } else {
        const parts = [
          `${data.scanned} Stripe-Sessions geprüft`,
          `${data.matched} davon waren Skool-Käufe`,
          `${data.upserted} Mitglieder synchronisiert`,
        ]
        if (data.expired) parts.push(`${data.expired} auf Alumni gesetzt`)
        if (data.errors?.length) parts.push(`${data.errors.length} Fehler`)
        const hint =
          data.matched === 0 && data.scanned > 0
            ? ' · Hinweis: keine Skool-Products getroffen — Product-IDs in Stripe checken oder weitere unter „Stripe-Produkte pflegen" hinzufügen.'
            : ''
        setMessage({ type: 'ok', text: parts.join(' · ') + hint })
        router.refresh()
      }
    } catch {
      setMessage({ type: 'err', text: 'Netzwerk-Fehler' })
    } finally {
      setSyncBusy(false)
    }
  }

  async function inviteMany(ids: string[], confirmText?: string) {
    if (ids.length === 0) return
    if (confirmText && !confirm(confirmText)) return
    setBulkBusy(ids.length > 1)
    if (ids.length === 1) setLoading(ids[0])
    setMessage(null)
    try {
      const res = await fetch('/api/admin/community/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ type: 'err', text: data?.error ?? 'Einladung fehlgeschlagen' })
      } else {
        const parts: string[] = []
        if (data.invited) parts.push(`${data.invited} verschickt`)
        if (data.skipped) parts.push(`${data.skipped} übersprungen`)
        if (data.failed) parts.push(`${data.failed} Fehler`)
        setMessage({ type: 'ok', text: parts.join(' · ') || 'Fertig' })
        router.refresh()
      }
    } catch {
      setMessage({ type: 'err', text: 'Netzwerk-Fehler' })
    } finally {
      setBulkBusy(false)
      setLoading(null)
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
            placeholder="E-Mail oder Name suchen…"
            className="flex-1 px-4 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Alle</option>
            <option value="active">Aktive Mitglieder</option>
            <option value="alumni">Alumni</option>
            <option value="cancelled">Gekündigt</option>
            <option value="invitable">Einladbar (aktiv, nicht registriert)</option>
            <option value="claimed">Registriert</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={syncDays}
            onChange={(e) => setSyncDays(parseInt(e.target.value, 10))}
            disabled={syncBusy}
            className="px-2 py-2 rounded-lg bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            title="Wie weit zurück soll Stripe geprüft werden?"
          >
            <option value={30}>30 Tage</option>
            <option value={90}>90 Tage</option>
            <option value={180}>180 Tage</option>
            <option value={365}>1 Jahr</option>
            <option value={730}>2 Jahre</option>
          </select>
          <button
            onClick={runSync}
            disabled={syncBusy}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-surface-hover text-foreground font-medium text-sm transition disabled:opacity-50"
            title="Pullt Stripe-Käufe und cleant abgelaufene Mitglieder"
          >
            {syncBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync
          </button>
          <button
            onClick={() =>
              inviteMany(
                invitableIds,
                `${invitableIds.length} Einladungen verschicken?`
              )
            }
            disabled={invitableIds.length === 0 || bulkBusy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Alle einladbaren ({invitableIds.length})
          </button>
        </div>
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
                <th className="px-4 py-3 font-medium">Name / E-Mail</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Zugang bis</th>
                <th className="px-4 py-3 font-medium">Käufe</th>
                <th className="px-4 py-3 font-medium">Eingeladen</th>
                <th className="px-4 py-3 font-medium">Registriert</th>
                <th className="px-4 py-3 font-medium text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    Keine Einträge.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const meta = STATUS_META[m.skool_status]
                  const canInvite = m.skool_status === 'active' && !m.claimed_at
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-border last:border-0 hover:bg-surface-hover"
                    >
                      <td className="px-4 py-3">
                        <div className="text-foreground font-medium">
                          {m.name ?? '—'}
                        </div>
                        <div className="text-xs text-muted">{m.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 ${meta.text}`}>
                          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(m.skool_access_expires_at)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {m.purchase_count}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {m.invitation_sent_count > 0
                          ? `${m.invitation_sent_count}× · ${formatDate(m.last_invited_at)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {m.claimed_at ? (
                          <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {formatDate(m.claimed_at)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canInvite ? (
                          <button
                            onClick={() => inviteMany([m.id])}
                            disabled={loading === m.id || bulkBusy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50"
                          >
                            {loading === m.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Mail className="w-3.5 h-3.5" />
                            )}
                            {m.invitation_sent_count > 0 ? 'Nochmal' : 'Einladen'}
                          </button>
                        ) : m.claimed_at ? (
                          <span className="text-xs text-muted">Aktiv</span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
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
