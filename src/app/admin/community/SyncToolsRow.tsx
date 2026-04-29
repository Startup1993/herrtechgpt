'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Stethoscope } from 'lucide-react'

type Snapshot = { count: number; has_more: boolean }
type SyncResponse = {
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
  deduped?: number
  auto_linked?: number
}
type DiagResponse = {
  mode?: string
  days?: number
  stripe?: {
    sessions_in_range: Snapshot
    invoices_paid_in_range: Snapshot
    subscriptions_active: Snapshot
    subscriptions_all: Snapshot
  }
  hint?: string | null
  errors?: string[]
  error?: string
}

/**
 * Stripe-Sync-Tools (90-Tage-Selector + Diagnose + Sync) für den
 * /admin/community Page-Header.
 *
 * Zeigt eigene Status-Box direkt unter den Buttons. Nach erfolgreichem
 * Sync wird die Page neu geladen, sodass die Tabelle frische Daten zeigt.
 */
export function SyncToolsRow() {
  const router = useRouter()
  const [syncDays, setSyncDays] = useState(90)
  const [diagBusy, setDiagBusy] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function runDiagnose() {
    setDiagBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/community/diagnose?days=${syncDays}`)
      const txt = await res.text()
      let data: DiagResponse | null = null
      try {
        data = JSON.parse(txt)
      } catch {
        // ignore
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
      const more = (snap: Snapshot) => (snap.has_more ? `${snap.count}+` : `${snap.count}`)
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
        `Sync der letzten ${syncDays} Tage starten?\n\nDurchsucht Stripe nach KMC-Käufen (Checkout-Sessions + Subscriptions + bezahlte Rechnungen), aktualisiert die Mitgliederliste, räumt Duplikate auf und verknüpft mit existierenden Konten.`
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
      let data: SyncResponse | null = null
      try {
        data = JSON.parse(txt)
      } catch {
        // ignore
      }
      if (!res.ok) {
        const detail =
          data?.error ??
          (res.status === 504
            ? 'Vercel-Timeout — versuch kürzeren Lookback oder mehrmals nacheinander.'
            : txt.slice(0, 300))
        setMessage({ type: 'err', text: `HTTP ${res.status}: ${detail}` })
      } else if (data) {
        const summary = [
          `${data.scanned ?? 0} Stripe-Items geprüft`,
          `${data.matched ?? 0} Skool-Käufe`,
          `${data.upserted ?? 0} Mitglieder synchronisiert`,
        ]
        if (data.expired) summary.push(`${data.expired} → Alumni`)
        if (data.refunds?.cleaned_up) summary.push(`${data.refunds.cleaned_up} Refunds bereinigt`)
        if (data.deduped) summary.push(`${data.deduped} Duplikate entfernt`)
        if (data.auto_linked) summary.push(`${data.auto_linked} mit Konten verknüpft`)
        if (data.errors?.length) summary.push(`${data.errors.length} Fehler`)

        const phase = data.by_phase
        const phaseLines: string[] = []
        if (phase) {
          const fmt = (label: string, p: { scanned: number; matched: number; capped: boolean }) =>
            `${label}: ${p.scanned} geprüft / ${p.matched} matched${p.capped ? ' (Cap erreicht)' : ''}`
          phaseLines.push(fmt('Sessions', phase.sessions))
          phaseLines.push(fmt('Subscriptions', phase.subscriptions))
          phaseLines.push(fmt('Invoices', phase.invoices))
        }

        const cap =
          phase &&
          (phase.sessions.capped || phase.subscriptions.capped || phase.invoices.capped)
            ? '\nEine Phase hat das Pagination-Cap erreicht — nochmal Sync drücken um den Rest zu importieren.'
            : ''

        setMessage({
          type: 'ok',
          text:
            summary.join(' · ') +
            (phaseLines.length ? '\n\n' + phaseLines.join('\n') : '') +
            cap,
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

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
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
          {diagBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
          Diagnose
        </button>
        <button
          onClick={runSync}
          disabled={syncBusy || diagBusy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-surface-hover text-foreground font-medium text-sm transition disabled:opacity-50"
          title="Pullt Stripe-Käufe (Sessions + Subs + Invoices), räumt Duplikate auf und verknüpft mit Konten"
        >
          {syncBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync
        </button>
      </div>

      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg whitespace-pre-line w-full ${
            message.type === 'ok'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </>
  )
}
