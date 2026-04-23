'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Check, Sparkles, Loader2 } from 'lucide-react'
import type { Plan } from '@/lib/types'

type PriceBand = 'basic' | 'community'
type Cycle = 'monthly' | 'yearly'

interface Props {
  open: boolean
  onClose: () => void
  /** Wird server-seitig geladen und als Prop reingereicht */
  plans: Plan[]
  /** 'basic' | 'community' — aus profile.access_tier abgeleitet */
  defaultPriceBand: PriceBand
  /** true wenn access_tier = 'premium' (KI Marketing Club) */
  isCommunity: boolean
  /** ID des aktuell laufenden Plans (plan_s/plan_m/plan_l) — für "Aktueller Plan"-Markierung */
  currentPlanId?: string | null
  currentCycle?: Cycle | null
  /** true wenn User schon ein aktives Abo hat */
  hasActiveSubscription?: boolean
}

function formatEuro(cents: number | null | undefined): string {
  if (cents == null) return '—'
  const euro = cents / 100
  return euro % 1 === 0 ? `${euro}` : euro.toFixed(2).replace('.', ',')
}

export function PricingModal({
  open,
  onClose,
  plans,
  defaultPriceBand,
  isCommunity,
  currentPlanId,
  currentCycle,
  hasActiveSubscription,
}: Props) {
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [priceBand, setPriceBand] = useState<PriceBand>(defaultPriceBand)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ESC schließt Modal
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  // Body-Scroll lock wenn offen
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const startCheckout = useCallback(
    async (planId: string) => {
      setLoadingPlan(planId)
      setError(null)
      try {
        const res = await fetch('/api/checkout/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, cycle }),
        })
        // Safe JSON-Parse — Body könnte leer sein bei Framework-Errors
        const text = await res.text()
        let data: { url?: string; error?: string } = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          throw new Error(
            `Server hat keine gültige Antwort geschickt (Status ${res.status}). Reload und nochmal.`
          )
        }
        if (!res.ok || !data.url) {
          throw new Error(data.error || 'Checkout konnte nicht gestartet werden')
        }
        window.location.href = data.url
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setLoadingPlan(null)
      }
    },
    [cycle]
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-background border border-border rounded-2xl w-full max-w-5xl my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-surface hover:bg-surface-secondary border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors"
          aria-label="Schließen"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Wähle deinen Plan
            </h2>
            <p className="text-sm text-muted max-w-xl mx-auto">
              Voller Zugriff auf Herr Tech GPT + KI Toolbox. Credits für jede Aktion,
              jederzeit kündbar.
            </p>
          </div>

          {isCommunity && (
            <div className="max-w-2xl mx-auto mb-5 flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-primary/5">
              <Sparkles size={16} className="text-primary shrink-0" />
              <p className="text-sm text-foreground">
                <strong>Community-Mitglied:</strong> Plan S ist für dich inklusive.
              </p>
            </div>
          )}

          {/* Toggles */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-secondary border border-border">
              <button
                onClick={() => setCycle('monthly')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  cycle === 'monthly'
                    ? 'bg-surface text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Monatlich
              </button>
              <button
                onClick={() => setCycle('yearly')}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  cycle === 'yearly'
                    ? 'bg-surface text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Jährlich
                <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  1 Monat gratis
                </span>
              </button>
            </div>

            {isCommunity && (
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-secondary border border-border">
                <button
                  onClick={() => setPriceBand('basic')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    priceBand === 'basic'
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="Vergleichspreise ohne Community"
                >
                  Basic
                </button>
                <button
                  onClick={() => setPriceBand('community')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    priceBand === 'community'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Community
                </button>
              </div>
            )}
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, idx) => {
              const isCurrent = currentPlanId === plan.id && currentCycle === cycle
              const basicCents =
                cycle === 'yearly' ? plan.price_yearly_basic_cents : plan.price_basic_cents
              const communityCents =
                cycle === 'yearly'
                  ? plan.price_yearly_community_cents
                  : plan.price_community_cents
              const displayCents = priceBand === 'community' ? communityCents : basicCents
              const showStrike =
                priceBand === 'community' &&
                basicCents != null &&
                communityCents != null &&
                basicCents > communityCents
              const yearlyMissing = cycle === 'yearly' && displayCents == null
              const isFree = displayCents === 0
              const featured = idx === 1

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-5 flex flex-col ${
                    featured
                      ? 'border-2 border-primary bg-surface shadow-md'
                      : 'border border-border bg-surface'
                  }`}
                >
                  {featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Beliebteste Wahl
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold">
                        {plan.tier}
                      </span>
                      <h3 className="font-bold text-foreground">{plan.name}</h3>
                    </div>
                  </div>

                  <div className="mb-4">
                    {yearlyMissing ? (
                      <div className="text-sm text-muted italic">Nur monatlich</div>
                    ) : isFree ? (
                      <div>
                        <div className="text-2xl font-bold text-primary">Kostenlos</div>
                        <div className="text-xs text-muted">Community-inklusive</div>
                      </div>
                    ) : (
                      <div>
                        {showStrike && (
                          <div className="text-xs text-muted line-through">
                            {formatEuro(basicCents)} €
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-foreground">
                            {formatEuro(displayCents)}
                          </span>
                          <span className="text-xs text-muted">€</span>
                          <span className="text-xs text-muted ml-1">
                            / {cycle === 'yearly' ? 'Jahr' : 'Monat'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-3 pb-3 border-b border-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      Credits
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {plan.credits_per_month.toLocaleString('de-DE')}
                      <span className="text-xs font-normal text-muted"> / Monat</span>
                    </div>
                  </div>

                  {plan.features.length > 0 && (
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {plan.features.map((f: string) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-xs text-foreground"
                        >
                          <Check size={13} className="text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isCurrent ? (
                    <div className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-border text-muted text-center">
                      ✓ Aktueller Plan
                    </div>
                  ) : yearlyMissing ? (
                    <button
                      disabled
                      className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-muted/20 text-muted cursor-not-allowed"
                    >
                      Nicht verfügbar
                    </button>
                  ) : (
                    <button
                      onClick={() => startCheckout(plan.id)}
                      disabled={loadingPlan === plan.id}
                      className={`w-full px-3 py-2 text-sm font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 ${
                        featured
                          ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                          : 'border border-border text-foreground hover:border-primary hover:text-primary'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loadingPlan === plan.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Lade…
                        </>
                      ) : isFree ? (
                        'Aktivieren'
                      ) : hasActiveSubscription ? (
                        'Zu diesem Plan wechseln'
                      ) : (
                        'Auswählen'
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="mt-5 max-w-xl mx-auto p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Footer-Hinweis */}
          <div className="mt-6 text-center text-[11px] text-muted space-y-0.5">
            <p>Alle Preise inkl. USt · Kündbar zum Periodenende</p>
            <p>
              Monatliche Credits verfallen am Reset · Gekaufte Top-up-Credits 12 Monate
              gültig
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
