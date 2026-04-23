'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import type { Plan } from '@/lib/types'
import type { AccessTier } from '@/lib/access'

type PriceBand = 'basic' | 'community'
type Cycle = 'monthly' | 'yearly'

interface Props {
  plans: Plan[]
  defaultPriceBand: PriceBand
  isCommunity: boolean
  accessTier: AccessTier
  currentPlanId: string | null
  currentCycle: Cycle | null
  subscriptionActive: boolean
}

function formatEuro(cents: number | null | undefined): string {
  if (cents == null) return '—'
  const euro = cents / 100
  return euro % 1 === 0 ? `${euro}` : euro.toFixed(2).replace('.', ',')
}

export default function PricingClient({
  plans,
  defaultPriceBand,
  isCommunity,
  accessTier,
  currentPlanId,
  currentCycle,
  subscriptionActive,
}: Props) {
  const router = useRouter()
  const [cycle, setCycle] = useState<Cycle>('monthly')
  // Preisband nur toggelbar wenn Community-User (die sehen den Vergleich).
  // Basic-User sehen nur Basic-Preise (kein Toggle).
  const [priceBand, setPriceBand] = useState<PriceBand>(defaultPriceBand)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout(planId: string) {
    setLoadingPlan(planId)
    setError(null)
    try {
      const res = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, cycle }),
      })
      // Safe JSON-Parse — Body ist bei Framework-500ern leer und würde
      // "Unexpected end of JSON input" werfen
      const text = await res.text()
      let data: { url?: string; error?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(
          `Server hat keine gültige Antwort geschickt (Status ${res.status}). Nochmal probieren.`
        )
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Checkout konnte nicht gestartet werden')
      }
      window.location.href = data.url as string
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setLoadingPlan(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Wähle deinen Plan
        </h1>
        <p className="text-muted max-w-2xl mx-auto">
          Voller Zugriff auf Herr Tech GPT + KI Toolbox. Credits für jede Aktion,
          monatlich oder jährlich — jederzeit kündbar.
        </p>
      </div>

      {/* Community-Badge wenn User Community ist */}
      {isCommunity && (
        <div className="max-w-2xl mx-auto mb-6 flex items-center gap-2 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5">
          <Sparkles size={18} className="text-primary shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">KI Marketing Club Mitglied:</span>{' '}
            Du zahlst die günstigeren Community-Preise. Plan S ist für dich kostenlos
            enthalten.
          </p>
        </div>
      )}

      {/* Toggles */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
        {/* Monthly/Yearly Toggle */}
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

        {/* Basic/Community Toggle — nur für Community-User */}
        {isCommunity && (
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-secondary border border-border">
            <button
              onClick={() => setPriceBand('basic')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                priceBand === 'basic'
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
              title="Als ob du kein Community-Mitglied wärst (zum Vergleich)"
            >
              Basic-Preise
            </button>
            <button
              onClick={() => setPriceBand('community')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                priceBand === 'community'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Community-Preise
            </button>
          </div>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {plans.map((plan, idx) => {
          const isCurrent = currentPlanId === plan.id && currentCycle === cycle
          const basicCents =
            cycle === 'yearly' ? plan.price_yearly_basic_cents : plan.price_basic_cents
          const communityCents =
            cycle === 'yearly'
              ? plan.price_yearly_community_cents
              : plan.price_community_cents
          const displayCents = priceBand === 'community' ? communityCents : basicCents
          const showStrikethrough =
            priceBand === 'community' &&
            basicCents != null &&
            communityCents != null &&
            basicCents > communityCents
          const yearlyMissing = cycle === 'yearly' && displayCents == null
          const isFree = displayCents === 0
          const featured = idx === 1 // Mittlerer Plan hervorheben (M)

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col ${
                featured
                  ? 'border-2 border-primary bg-surface shadow-lg'
                  : 'border border-border bg-surface'
              }`}
            >
              {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Beliebteste Wahl
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold">
                    {plan.tier}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted leading-relaxed">{plan.description}</p>
                )}
              </div>

              <div className="mb-5">
                {yearlyMissing ? (
                  <div className="text-sm text-muted italic">Jährlich nicht verfügbar</div>
                ) : isFree ? (
                  <div>
                    <div className="text-3xl font-bold text-primary">Kostenlos</div>
                    <div className="text-xs text-muted">
                      als Community-Mitglied inklusive
                    </div>
                  </div>
                ) : (
                  <div>
                    {showStrikethrough && (
                      <div className="text-sm text-muted line-through">
                        {formatEuro(basicCents)} € {cycle === 'yearly' ? '/ Jahr' : '/ Monat'}
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {formatEuro(displayCents)}
                      </span>
                      <span className="text-sm text-muted">€</span>
                      <span className="text-sm text-muted ml-1">
                        / {cycle === 'yearly' ? 'Jahr' : 'Monat'}
                      </span>
                    </div>
                    {cycle === 'yearly' && (
                      <div className="text-xs text-muted mt-0.5">
                        Entspricht {formatEuro(Math.round((displayCents ?? 0) / 12))} € / Monat
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-5 pb-5 border-b border-border">
                <div className="text-xs uppercase tracking-wider text-muted mb-1">Credits</div>
                <div className="text-xl font-semibold text-foreground">
                  {plan.credits_per_month.toLocaleString('de-DE')}{' '}
                  <span className="text-sm font-normal text-muted">/ Monat</span>
                </div>
              </div>

              {plan.features.length > 0 && (
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f: string) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check size={16} className="text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA */}
              {isCurrent ? (
                <div className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted text-center">
                  ✓ Aktueller Plan
                </div>
              ) : subscriptionActive ? (
                <Link
                  href="/dashboard/account/billing"
                  className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-border text-foreground text-center hover:border-primary hover:text-primary transition-colors"
                >
                  Plan wechseln
                </Link>
              ) : yearlyMissing ? (
                <button
                  disabled
                  className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-muted/20 text-muted cursor-not-allowed"
                >
                  Nicht verfügbar
                </button>
              ) : (
                <button
                  onClick={() => startCheckout(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
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
        <div className="max-w-xl mx-auto mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Community-Upsell für Basic/Alumni */}
      {!isCommunity && (
        <div className="max-w-3xl mx-auto rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Noch günstiger mit KI Marketing Club
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Community-Mitglieder sparen bis zu 30 % — und mehr
          </h2>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Als KI Marketing Club Mitglied bekommst du Plan S kostenlos, alle anderen
            Abos deutlich günstiger, plus:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {[
              'Live-Calls mit Herr Tech',
              'Alle Lernmaterialien freigeschaltet',
              'Community-Zugang (Fragen & Feedback)',
              'Frühzeitiger Zugriff auf neue Features',
            ].map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                <Check size={14} className="text-primary shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-sm transition-colors"
          >
            KI Marketing Club entdecken →
          </Link>
          <div className="text-xs text-muted mt-3">
            {accessTier === 'alumni'
              ? 'Als Alumni hast du lebenslangen Classroom-Zugang — mit Club-Mitgliedschaft wieder alle Tools + Live-Calls.'
              : 'Ideal wenn du nicht nur Tools, sondern auch das komplette Know-how + persönlichen Austausch willst.'}
          </div>
        </div>
      )}

      {/* FAQ / Info */}
      <div className="max-w-3xl mx-auto text-center text-xs text-muted space-y-1">
        <p>
          Alle Preise inkl. USt. Abos laufen monatlich oder jährlich und können jederzeit
          zum Periodenende gekündigt werden.
        </p>
        <p>
          Credits im Monatsabo verfallen am Reset-Tag. Gekaufte Zusatz-Credits sind 12
          Monate gültig.
        </p>
      </div>
    </div>
  )
}
