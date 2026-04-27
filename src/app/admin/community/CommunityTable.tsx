'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Mail,
  CheckCircle2,
  Send,
  RefreshCw,
  Stethoscope,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash2,
  Pencil,
} from 'lucide-react'
import { EditMemberModal, type EditMember } from './EditMemberModal'

type SkoolStatus = 'active' | 'alumni' | 'cancelled'
type MemberSource = 'stripe' | 'manual' | 'csv' | 'skool' | null

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
  source: MemberSource
}

const SOURCE_META: Record<
  Exclude<MemberSource, null> | 'unknown',
  { label: string; className: string; title: string }
> = {
  stripe: {
    label: 'Stripe',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    title: 'Automatisch über Stripe-Sync importiert',
  },
  manual: {
    label: 'Manuell',
    className:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
    title: 'Vom Admin manuell hinzugefügt',
  },
  csv: {
    label: 'CSV',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    title: 'Aus CSV-Datei importiert',
  },
  skool: {
    label: 'Skool',
    className: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    title: 'Direkt aus Skool importiert',
  },
  unknown: {
    label: '—',
    className: 'bg-surface-secondary text-muted',
    title: 'Quelle unbekannt',
  },
}

const STATUS_META: Record<SkoolStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Aktiv', dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  alumni: { label: 'Alumni', dot: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-400' },
  cancelled: {
    label: 'Refunded',
    dot: 'bg-red-400',
    text: 'text-red-600 dark:text-red-400',
  },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

type SortKey =
  | 'name'
  | 'email'
  | 'skool_status'
  | 'skool_access_expires_at'
  | 'purchase_count'
  | 'invitation_sent_count'
  | 'claimed_at'
type SortDir = 'asc' | 'desc'

function compare<T>(a: T, b: T): number {
  if (a == null && b == null) return 0
  if (a == null) return 1 // null/undefined ans Ende
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'de')
}

const PAGE_SIZE = 50

export function CommunityTable({ members }: { members: MemberRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | SkoolStatus | 'invitable' | 'claimed'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | Exclude<MemberSource, null>>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [diagBusy, setDiagBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null)
  const [syncDays, setSyncDays] = useState(90)
  const [editing, setEditing] = useState<EditMember | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [sortKey, setSortKey] = useState<SortKey>('skool_access_expires_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  // Filter zurücksetzen → zurück zur ersten Seite
  useEffect(() => {
    setPage(1)
  }, [search, filter, sourceFilter, sortKey, sortDir])

  const filtered = useMemo(
    () =>
      members
        .filter((m) => {
          const q = search.toLowerCase().trim()
          if (!q) return true
          return (
            m.email.toLowerCase().includes(q) ||
            (m.name ?? '').toLowerCase().includes(q)
          )
        })
        .filter((m) => {
          if (filter === 'all') return true
          if (filter === 'invitable')
            return (
              (m.skool_status === 'active' || m.skool_status === 'alumni') &&
              !m.claimed_at
            )
          if (filter === 'claimed') return !!m.claimed_at
          return m.skool_status === filter
        })
        .filter((m) => {
          if (sourceFilter === 'all') return true
          return (m.source ?? 'stripe') === sourceFilter
        }),
    [members, search, filter, sourceFilter]
  )

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as unknown
      const bv = b[sortKey] as unknown
      return compare(av, bv) * dir
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = sorted.slice(pageStart, pageStart + PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortHeader({
    column,
    label,
    align = 'left',
  }: {
    column: SortKey
    label: string
    align?: 'left' | 'right'
  }) {
    const active = sortKey === column
    const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ChevronUp : ChevronDown
    return (
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className={`flex items-center gap-1 font-medium text-muted hover:text-foreground transition ${
          align === 'right' ? 'ml-auto' : ''
        } ${active ? 'text-foreground' : ''}`}
      >
        {label}
        <Icon className="w-3.5 h-3.5" />
      </button>
    )
  }

  const invitableIds = members
    .filter(
      (m) =>
        (m.skool_status === 'active' || m.skool_status === 'alumni') &&
        !m.claimed_at
    )
    .map((m) => m.id)

  async function runDiagnose() {
    setDiagBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/community/diagnose?days=${syncDays}`)
      const txt = await res.text()
      let data: {
        mode?: string
        days?: number
        stripe?: {
          sessions_in_range: { count: number; has_more: boolean }
          invoices_paid_in_range: { count: number; has_more: boolean }
          subscriptions_active: { count: number; has_more: boolean }
          subscriptions_all: { count: number; has_more: boolean }
        }
        hint?: string | null
        errors?: string[]
        error?: string
      } | null = null
      try {
        data = JSON.parse(txt)
      } catch {
        // ignore — we'll show the raw text below
      }
      if (!res.ok) {
        const detail = data?.error ?? txt.slice(0, 300)
        setMessage({ type: 'err', text: `HTTP ${res.status}: ${detail}` })
        return
      }
      if (!data?.stripe) {
        setMessage({ type: 'err', text: data?.error ?? 'Diagnose-Antwort unvollständig' })
        return
      }
      const s = data.stripe
      const more = (snap: { count: number; has_more: boolean }) =>
        snap.has_more ? `${snap.count}+` : `${snap.count}`
      const lines = [
        `Stripe-Mode: ${(data.mode ?? '?').toUpperCase()}`,
        `Sessions (${data.days}d): ${more(s.sessions_in_range)}`,
        `Paid Invoices (${data.days}d): ${more(s.invoices_paid_in_range)}`,
        `Active Subs: ${more(s.subscriptions_active)}`,
        `All Subs: ${more(s.subscriptions_all)}`,
      ]
      const hint = data.hint ? `\n${data.hint}` : ''
      const errs = data.errors?.length ? `\nFehler: ${data.errors.join('; ')}` : ''
      setMessage({
        type: data.mode === 'live' && !data.errors?.length ? 'ok' : 'err',
        text: lines.join(' · ') + hint + errs,
      })
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Netzwerk-Fehler',
      })
    } finally {
      setDiagBusy(false)
    }
  }

  async function runSync() {
    if (
      !confirm(
        `Sync der letzten ${syncDays} Tage starten?\n\nDurchsucht Stripe nach KMC-Käufen (Checkout-Sessions + Subscriptions + bezahlte Rechnungen), aktualisiert die Mitgliederliste und setzt abgelaufene Mitglieder auf Alumni.`
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
      const txt = await res.text()
      let data:
        | {
            scanned?: number
            matched?: number
            upserted?: number
            expired?: number
            errors?: { error: string }[]
            error?: string
            by_phase?: {
              sessions: { scanned: number; matched: number; capped: boolean }
              subscriptions: { scanned: number; matched: number; capped: boolean }
              invoices: { scanned: number; matched: number; capped: boolean }
            }
            refunds?: { detected: number; cleaned_up: number }
          }
        | null = null
      try {
        data = JSON.parse(txt)
      } catch {
        // Body war kein JSON (z.B. Vercel-504-HTML-Fehlerseite)
      }
      if (!res.ok) {
        const detail =
          data?.error ??
          (res.status === 504
            ? 'Vercel-Timeout (5 Min) — versuch es nochmal mit kürzerem Lookback (z.B. 1 Jahr) oder mehrmals nacheinander.'
            : txt.slice(0, 300))
        setMessage({ type: 'err', text: `HTTP ${res.status}: ${detail}` })
      } else if (data) {
        const summary = [
          `${data.scanned ?? 0} Stripe-Items geprüft`,
          `${data.matched ?? 0} davon waren Skool-Käufe`,
          `${data.upserted ?? 0} Mitglieder synchronisiert`,
        ]
        if (data.expired) summary.push(`${data.expired} auf Alumni gesetzt`)
        if (data.refunds?.cleaned_up) {
          summary.push(`${data.refunds.cleaned_up} Refunds bereinigt`)
        }
        if (data.errors?.length) summary.push(`${data.errors.length} Fehler`)

        const phase = data.by_phase
        const phaseLines: string[] = []
        if (phase) {
          const fmt = (label: string, p: { scanned: number; matched: number; capped: boolean }) =>
            `${label}: ${p.scanned} geprüft / ${p.matched} matched${p.capped ? ' (Cap erreicht — nochmal Sync drücken!)' : ''}`
          phaseLines.push(fmt('Sessions', phase.sessions))
          phaseLines.push(fmt('Subscriptions', phase.subscriptions))
          phaseLines.push(fmt('Invoices', phase.invoices))
        }

        const hint =
          (data.matched ?? 0) === 0 && (data.scanned ?? 0) > 0
            ? '\nHinweis: keine Skool-Products getroffen — Product-IDs in Stripe checken oder weitere unter „Stripe-Produkte pflegen" hinzufügen.'
            : phase &&
              (phase.sessions.capped || phase.subscriptions.capped || phase.invoices.capped)
            ? '\nEine oder mehrere Phasen haben das Pagination-Cap erreicht. Sync nochmal drücken um den Rest zu importieren.'
            : ''

        setMessage({
          type: 'ok',
          text: summary.join(' · ') + (phaseLines.length ? '\n\n' + phaseLines.join('\n') : '') + hint,
        })
        router.refresh()
      } else {
        setMessage({ type: 'err', text: 'Sync-Antwort konnte nicht gelesen werden' })
      }
    } catch {
      setMessage({ type: 'err', text: 'Netzwerk-Fehler' })
    } finally {
      setSyncBusy(false)
    }
  }

  async function deleteMember(id: string, label: string) {
    if (
      !confirm(
        `"${label}" wirklich löschen?\n\nDer Eintrag wird aus der Liste entfernt. Falls die Person registriert war, wird Plan S beendet (das User-Profil bleibt erhalten).`
      )
    )
      return
    setDeleteBusy(id)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/community/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ type: 'err', text: data?.error ?? 'Löschen fehlgeschlagen' })
      } else {
        setMessage({ type: 'ok', text: `"${label}" gelöscht` })
        router.refresh()
      }
    } catch {
      setMessage({ type: 'err', text: 'Netzwerk-Fehler' })
    } finally {
      setDeleteBusy(null)
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
      {/* Zeile 1: Stripe-Sync-Tools — gehören thematisch zu den Admin-Tools im Page-Header */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={syncDays}
          onChange={(e) => setSyncDays(parseInt(e.target.value, 10))}
          disabled={syncBusy}
          className="px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          title="Wie weit zurück soll Stripe geprüft werden?"
        >
          <option value={30}>30 Tage</option>
          <option value={90}>90 Tage</option>
          <option value={180}>180 Tage</option>
          <option value={365}>1 Jahr</option>
          <option value={730}>2 Jahre</option>
        </select>
        <button
          onClick={runDiagnose}
          disabled={diagBusy || syncBusy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-surface-hover text-foreground font-medium text-sm transition disabled:opacity-50"
          title="Zählt Stripe-Sessions/Invoices/Subscriptions im Live-Account"
        >
          {diagBusy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Stethoscope className="w-4 h-4" />
          )}
          Diagnose
        </button>
        <button
          onClick={runSync}
          disabled={syncBusy || diagBusy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-surface-hover text-foreground font-medium text-sm transition disabled:opacity-50"
          title="Pullt Stripe-Käufe (Sessions + Subs + Invoices) und cleant abgelaufene Mitglieder"
        >
          {syncBusy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sync
        </button>
      </div>

      {/* Zeile 2: Filter + Bulk-Invite */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="E-Mail oder Name suchen…"
            className="flex-1 min-w-[180px] px-4 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Alle</option>
            <option value="active">Aktive Mitglieder</option>
            <option value="alumni">Alumni</option>
            <option value="cancelled">Refunded</option>
            <option value="invitable">Einladbar (aktiv, nicht registriert)</option>
            <option value="claimed">Registriert</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) =>
              setSourceFilter(e.target.value as typeof sourceFilter)
            }
            className="px-4 py-2 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            title="Filtern nach Herkunft"
          >
            <option value="all">Alle Quellen</option>
            <option value="stripe">Stripe-Sync</option>
            <option value="manual">Manuell</option>
            <option value="csv">CSV-Import</option>
            <option value="skool">Skool</option>
          </select>
        </div>
        <button
          onClick={() => {
            const count = invitableIds.length
            const warning =
              count > 100
                ? `\n\n⚠️ Das sind ${count} Mails — das könnte einige Minuten dauern und kann Resend-Rate-Limits triggern.`
                : ''
            inviteMany(
              invitableIds,
              `${count} Einladungen verschicken?${warning}`
            )
          }}
          disabled={invitableIds.length === 0 || bulkBusy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Alle einladbaren ({invitableIds.length})
        </button>
      </div>

      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg whitespace-pre-line ${
            message.type === 'ok'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="text-xs text-muted">
        {sorted.length === 0
          ? 'Keine Einträge'
          : `${sorted.length} ${sorted.length === 1 ? 'Eintrag' : 'Einträge'}` +
            (sorted.length > PAGE_SIZE
              ? ` · Zeige ${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, sorted.length)}`
              : '')}
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary border-b border-border">
              <tr className="text-left">
                <th className="px-4 py-3">
                  <SortHeader column="name" label="Name / E-Mail" />
                </th>
                <th className="px-4 py-3">
                  <SortHeader column="skool_status" label="Status" />
                </th>
                <th className="px-4 py-3">
                  <SortHeader column="skool_access_expires_at" label="Zugang bis" />
                </th>
                <th className="px-4 py-3">
                  <SortHeader column="purchase_count" label="Käufe" />
                </th>
                <th className="px-4 py-3">
                  <SortHeader column="invitation_sent_count" label="Eingeladen" />
                </th>
                <th className="px-4 py-3">
                  <SortHeader column="claimed_at" label="Registriert" />
                </th>
                <th className="px-4 py-3 font-medium text-muted">Quelle</th>
                <th className="px-4 py-3 font-medium text-right text-muted">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    Keine Einträge.
                  </td>
                </tr>
              ) : (
                pageRows.map((m) => {
                  const meta = STATUS_META[m.skool_status]
                  const canInvite =
                    (m.skool_status === 'active' || m.skool_status === 'alumni') &&
                    !m.claimed_at
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
                      <td className="px-4 py-3">
                        {(() => {
                          const meta =
                            SOURCE_META[m.source ?? 'unknown'] ?? SOURCE_META.unknown
                          return (
                            <span
                              title={meta.title}
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${meta.className}`}
                            >
                              {meta.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
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
                          <button
                            onClick={() =>
                              setEditing({
                                id: m.id,
                                email: m.email,
                                name: m.name,
                                skool_status: m.skool_status,
                                skool_access_expires_at: m.skool_access_expires_at,
                              })
                            }
                            title="Status/Zugang bearbeiten"
                            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              deleteMember(m.id, m.name || m.email)
                            }
                            disabled={deleteBusy === m.id}
                            title="Mitglied löschen"
                            className="p-1.5 rounded-md text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
                          >
                            {deleteBusy === m.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="text-muted">
            Seite {currentPage} von {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Vor
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <EditMemberModal member={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
