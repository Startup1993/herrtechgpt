'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileText, AlertTriangle, Loader2, Coins, XCircle, Clock } from 'lucide-react'
import type { Subscription, CreditWallet } from '@/lib/monetization'

interface Transaction {
  id: string
  amount: number
  reason: string
  feature: string | null
  created_at: string
  note: string | null
}

interface Props {
  subscription: Subscription | null
  wallet: CreditWallet | null
  planName: string | null
  planTier: 'S' | 'M' | 'L' | null
  transactions: Transaction[]
  checkoutStatus: string | null
  hasStripeCustomer: boolean
  scheduledPlanName: string | null
  scheduledChangeAt: string | null
  scheduledCycle: 'monthly' | 'yearly' | null
  /** Master-Switch — versteckt Plan-CTAs wenn Abos global deaktiviert sind. */
  subscriptionsEnabled: boolean
  /** Wo "Community beitreten" hinführt (Skool-URL). */
  communityUrl: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const REASON_LABELS: Record<string, string> = {
  monthly_grant: 'Monatliche Credits',
  monthly_reset: 'Monats-Reset',
  topup: 'Credits nachgekauft',
  usage: 'Verbrauch',
  refund: 'Rückbuchung',
  admin_adjust: 'Admin-Anpassung',
}

export default function BillingClient({
  subscription,
  wallet,
  planName,
  planTier,
  transactions,
  checkoutStatus,
  hasStripeCustomer,
  scheduledPlanName,
  scheduledChangeAt,
  scheduledCycle,
  subscriptionsEnabled,
  communityUrl,
}: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState<'cancel' | 'reactivate' | 'portal' | 'cancel_scheduled' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const monthly = wallet?.monthly_balance ?? 0
  const purchased = wallet?.purchased_balance ?? 0
  const total = monthly + purchased
  const allowance = wallet?.monthly_allowance ?? 0

  async function safeJson(res: Response): Promise<{ url?: string; error?: string }> {
    const text = await res.text()
    if (!text) return {}
    try {
      return JSON.parse(text)
    } catch {
      return { error: `Server-Fehler (${res.status}). Nochmal probieren.` }
    }
  }

  async function openPortal() {
    setLoading('portal')
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await safeJson(res)
      if (!res.ok || !data.url) throw new Error(data.error || 'Portal konnte nicht geöffnet werden')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setLoading(null)
    }
  }

  async function cancelSubscription() {
    setLoading('cancel')
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Kündigung fehlgeschlagen')
      router.refresh()
      setConfirming(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  async function reactivate() {
    setLoading('reactivate')
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/reactivate', { method: 'POST' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Reaktivierung fehlgeschlagen')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  async function cancelScheduledChange() {
    if (!subscription) return
    setLoading('cancel_scheduled')
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: subscription.plan_id,
          cycle: subscription.billing_cycle,
        }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Aufheben fehlgeschlagen')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Abrechnung & Abo</h1>
        <p className="text-sm text-muted mt-1">
          Dein aktueller Plan, Credits-Stand und Rechnungen.
        </p>
      </div>

      {/* Checkout-Success Banner */}
      {checkoutStatus === 'success' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
          <CheckCircle2 className="text-green-600 shrink-0" size={20} />
          <div>
            <div className="font-semibold text-foreground">Bezahlung erfolgreich!</div>
            <div className="text-sm text-muted">
              Dein Plan wird im Hintergrund aktiviert — das dauert meist nur wenige Sekunden.
              Lade die Seite in 10 Sekunden nochmal, falls du ihn unten noch nicht siehst.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <XCircle className="text-red-600 shrink-0" size={20} />
          <div className="text-sm text-foreground">{error}</div>
        </div>
      )}

      {/* Geplanter Plan-Wechsel (Downgrade zum Periodenende) */}
      {scheduledPlanName && scheduledChangeAt && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground">
              Geplanter Wechsel am {formatDate(scheduledChangeAt)}
            </div>
            <div className="text-sm text-muted mt-1">
              Ab dem{' '}
              <strong>{formatDate(scheduledChangeAt)}</strong> wechselt dein Abo
              automatisch zu <strong>{scheduledPlanName}</strong>
              {scheduledCycle ? ` (${scheduledCycle === 'yearly' ? 'jährlich' : 'monatlich'})` : ''}
              . Bis dahin behältst du deinen aktuellen Plan und alle Credits.
            </div>
            <button
              onClick={cancelScheduledChange}
              disabled={loading === 'cancel_scheduled'}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 border border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              {loading === 'cancel_scheduled' && <Loader2 size={12} className="animate-spin" />}
              Wechsel aufheben
            </button>
          </div>
        </div>
      )}

      {/* Past-Due Banner — Zahlung fehlgeschlagen */}
      {subscription?.status === 'past_due' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/40">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground">
              Zahlung konnte nicht verarbeitet werden
            </div>
            <div className="text-sm text-muted mt-1">
              Deine letzte Abrechnung ist fehlgeschlagen. Das passiert meist, wenn die
              Kreditkarte abgelaufen ist oder das Limit erreicht wurde. Stripe versucht
              es automatisch erneut — du kannst aber auch jetzt schon die Zahlungsmethode
              aktualisieren, damit dein Zugriff nicht unterbrochen wird.
            </div>
            {hasStripeCustomer && (
              <button
                onClick={openPortal}
                disabled={loading === 'portal'}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {loading === 'portal' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                Karte aktualisieren
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plan-Karte */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted mb-1">
              Aktueller Plan
            </div>
            {subscription ? (
              <>
                <div className="flex items-center gap-2">
                  {planTier && (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold">
                      {planTier}
                    </span>
                  )}
                  <div className="text-lg font-semibold text-foreground">
                    {planName ?? subscription.plan_id}
                  </div>
                </div>
                <div className="text-sm text-muted mt-1">
                  {subscription.price_band === 'community' ? 'Community-Preis' : 'Basic-Preis'} ·{' '}
                  {subscription.billing_cycle === 'yearly' ? 'jährlich' : 'monatlich'}
                </div>
              </>
            ) : (
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {subscriptionsEnabled ? 'Noch kein Abo' : 'Kein aktives Abo'}
                </div>
                <div className="text-sm text-muted mt-1">
                  {subscriptionsEnabled
                    ? 'Schließe einen Plan ab, um Herr Tech GPT + KI Toolbox zu nutzen.'
                    : 'Werde Community-Mitglied für vollen Zugriff auf Herr Tech GPT, Classroom + monatliche Credits.'}
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            {subscription ? (
              <StatusBadge subscription={subscription} />
            ) : subscriptionsEnabled ? (
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-sm transition-colors"
              >
                Plan wählen →
              </Link>
            ) : (
              <a
                href={communityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-sm transition-colors"
              >
                Community beitreten →
              </a>
            )}
          </div>
        </div>

        {subscription && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted mb-1">
                {subscription.cancel_at_period_end ? 'Endet am' : 'Nächste Abrechnung'}
              </div>
              <div className="text-sm font-medium text-foreground">
                {formatDate(subscription.current_period_end)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted mb-1">Aktiv seit</div>
              <div className="text-sm font-medium text-foreground">
                {formatDate(subscription.current_period_start)}
              </div>
            </div>
          </div>
        )}

        {subscription && (
          <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-6 border-t border-border">
            {/* "Plan wechseln" nur anzeigen wenn das Abo-System aktiv ist —
                sonst landet der User auf PricingDisabledView, was verwirrt. */}
            {subscriptionsEnabled && (
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border hover:border-primary hover:text-primary text-foreground font-medium rounded-xl text-sm transition-colors"
              >
                Plan wechseln
              </Link>
            )}
            {hasStripeCustomer && (
              <button
                onClick={openPortal}
                disabled={loading === 'portal'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border hover:border-primary hover:text-primary text-foreground font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {loading === 'portal' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                Rechnungen &amp; Zahlungsdaten
              </button>
            )}
            {subscription.cancel_at_period_end ? (
              <button
                onClick={reactivate}
                disabled={loading === 'reactivate'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {loading === 'reactivate' && <Loader2 size={14} className="animate-spin" />}
                Doch nicht kündigen
              </button>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border hover:border-red-500/40 hover:text-red-500 text-muted font-medium rounded-xl text-sm transition-colors sm:ml-auto"
              >
                Abo kündigen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Credits-Karte */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins size={18} className="text-primary" />
              <div className="text-xs uppercase tracking-wider text-muted">
                Credit-Stand
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {total.toLocaleString('de-DE')}{' '}
              <span className="text-sm font-normal text-muted">Credits</span>
            </div>
          </div>
          <Link
            href="/dashboard/credits"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-primary hover:text-primary text-foreground font-medium rounded-xl text-sm transition-colors"
          >
            Credits nachkaufen
          </Link>
        </div>

        {wallet && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-border">
            <div>
              <div className="text-xs text-muted">Monatlich (verfällt)</div>
              <div className="text-lg font-semibold text-foreground">
                {monthly.toLocaleString('de-DE')}{' '}
                <span className="text-xs text-muted">
                  von {allowance.toLocaleString('de-DE')}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Gekauft (rolliert unbegrenzt)</div>
              <div className="text-lg font-semibold text-foreground">
                {purchased.toLocaleString('de-DE')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Letzte Transaktionen */}
      {transactions.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Letzte Aktivität</h2>
          <div className="divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">
                    {REASON_LABELS[tx.reason] ?? tx.reason}
                    {tx.feature && <span className="text-muted"> · {tx.feature}</span>}
                  </div>
                  <div className="text-xs text-muted">{formatDate(tx.created_at)}</div>
                </div>
                <div
                  className={`font-semibold ${
                    tx.amount > 0 ? 'text-green-600' : 'text-foreground'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount.toLocaleString('de-DE')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kündigungs-Bestätigungsmodal */}
      {confirming && subscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-amber-500 shrink-0" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Abo kündigen?</h3>
                <p className="text-sm text-muted mt-1">
                  Dein Zugriff auf Herr Tech GPT + KI Toolbox läuft bis zum{' '}
                  <strong>{formatDate(subscription.current_period_end)}</strong>. Danach ist der
                  Account auf den Free-Zustand zurück. Gekaufte Zusatz-Credits bleiben erhalten.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-2 border border-border text-foreground rounded-xl text-sm hover:border-primary transition-colors"
              >
                Doch behalten
              </button>
              <button
                onClick={cancelSubscription}
                disabled={loading === 'cancel'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading === 'cancel' && <Loader2 size={14} className="animate-spin" />}
                Ja, kündigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ subscription }: { subscription: Subscription }) {
  if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Aktiv
      </span>
    )
  }
  if (subscription.cancel_at_period_end) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Läuft aus
      </span>
    )
  }
  if (subscription.status === 'past_due') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Zahlung offen
      </span>
    )
  }
  if (subscription.status === 'trialing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Test-Phase
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/20 text-muted text-xs font-medium">
      {subscription.status}
    </span>
  )
}
