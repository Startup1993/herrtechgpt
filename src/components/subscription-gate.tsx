'use client'

/**
 * SubscriptionGate — wickelt Aktions-Auslöser ein (Send-Button, Generate-Button)
 * und entscheidet beim Klick ob die Aktion durchläuft oder ein Pricing-Popup
 * erscheint.
 *
 * Zwei Fälle die abgefangen werden:
 *
 *   1. Kein aktives Abo → PricingModal öffnet sich (Plan wählen)
 *   2. Abo vorhanden, aber zu wenig Credits → CreditTopupModal
 *      mit Top-up-Kauf + Upgrade-Option
 *
 * Wenn beide Checks grün sind → onAction() wird gerufen = echter Submit.
 *
 * Benutzung:
 *
 *   <SubscriptionGate state={gateState} onAction={() => sendMessage()}>
 *     {(triggerAction) => (
 *       <button onClick={triggerAction}>Senden</button>
 *     )}
 *   </SubscriptionGate>
 */

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { X, Coins, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import type { Plan, CreditPack } from '@/lib/types'

const PricingModal = dynamic(
  () => import('./pricing-modal').then((m) => m.PricingModal),
  { ssr: false }
)

type PriceBand = 'basic' | 'community'

export interface SubscriptionGateState {
  hasActiveSubscription: boolean
  currentPlanId: string | null
  currentPlanTier: 'S' | 'M' | 'L' | null
  currentCycle: 'monthly' | 'yearly' | null
  /** Ende der aktuellen Abrechnungsperiode — für "Wechsel zum TT.MM."-Label */
  currentPeriodEnd: string | null
  /** Geplanter Plan-Wechsel (Downgrade) zum Periodenende */
  scheduledPlanId: string | null
  scheduledCycle: 'monthly' | 'yearly' | null
  scheduledChangeAt: string | null
  priceBand: PriceBand
  isCommunity: boolean
  credits: number
  plans: Plan[]
  packs: CreditPack[]
}

interface Props {
  state: SubscriptionGateState
  /** Ungefährer Credit-Bedarf der Aktion. Wenn 0, nur Abo-Check. */
  creditCost?: number
  /** Wird gerufen wenn alles OK — hier den echten Submit triggern */
  onAction: () => void | Promise<void>
  /** Child als Render-Prop — bekommt den Gate-getriggerten Handler */
  children: (triggerGuarded: () => void) => React.ReactNode
}

export function SubscriptionGate({ state, creditCost = 0, onAction, children }: Props) {
  const [pricingOpen, setPricingOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)

  function triggerGuarded() {
    if (!state.hasActiveSubscription) {
      setPricingOpen(true)
      return
    }
    if (creditCost > 0 && state.credits < creditCost) {
      setCreditsOpen(true)
      return
    }
    // Alles grün → echte Aktion ausführen
    void onAction()
  }

  return (
    <>
      {children(triggerGuarded)}
      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        plans={state.plans}
        defaultPriceBand={state.priceBand}
        isCommunity={state.isCommunity}
        currentPlanId={state.currentPlanId}
        currentCycle={state.currentCycle}
        currentPeriodEnd={state.currentPeriodEnd}
        hasActiveSubscription={state.hasActiveSubscription}
        scheduledPlanId={state.scheduledPlanId}
        scheduledCycle={state.scheduledCycle}
        scheduledChangeAt={state.scheduledChangeAt}
      />
      <CreditTopupModal
        open={creditsOpen}
        onClose={() => setCreditsOpen(false)}
        needed={creditCost}
        available={state.credits}
        packs={state.packs}
        priceBand={state.priceBand}
        currentPlanTier={state.currentPlanTier}
        onOpenPricing={() => {
          setCreditsOpen(false)
          setPricingOpen(true)
        }}
      />
    </>
  )
}

// ─── Credit Top-up / Upgrade Modal ────────────────────────────────────────

function CreditTopupModal({
  open,
  onClose,
  needed,
  available,
  packs,
  priceBand,
  currentPlanTier,
  onOpenPricing,
}: {
  open: boolean
  onClose: () => void
  needed: number
  available: number
  packs: CreditPack[]
  priceBand: PriceBand
  currentPlanTier: 'S' | 'M' | 'L' | null
  onOpenPricing: () => void
}) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function buyPack(packId: string) {
    setLoadingPack(packId)
    setError(null)
    try {
      const res = await fetch('/api/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const text = await res.text()
      let data: { url?: string; error?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(`Server-Fehler (${res.status})`)
      }
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout nicht möglich')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setLoadingPack(null)
    }
  }

  const formatEuro = (cents: number) => {
    const euro = cents / 100
    return euro % 1 === 0 ? `${euro}` : euro.toFixed(2).replace('.', ',')
  }

  const canUpgradePlan = currentPlanTier === 'S' || currentPlanTier === 'M'
  const upgradeTarget = currentPlanTier === 'S' ? 'M' : 'L'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-background border border-border rounded-2xl max-w-2xl w-full my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-surface hover:bg-surface-secondary border border-border flex items-center justify-center text-muted hover:text-foreground"
          aria-label="Schließen"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Credits reichen nicht</h2>
              <p className="text-sm text-muted">
                Diese Aktion kostet <strong>{needed.toLocaleString('de-DE')} Credits</strong> · Du
                hast {available.toLocaleString('de-DE')}.
              </p>
            </div>
          </div>

          {canUpgradePlan && (
            <div className="mb-5 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/5 to-primary/10 p-4 flex items-start sm:items-center flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Sparkles size={18} className="text-primary shrink-0" />
                <div>
                  <div className="font-semibold text-foreground">
                    Besser: Plan {upgradeTarget}
                  </div>
                  <div className="text-xs text-muted">
                    Mehr Credits jeden Monat, ohne laufend Top-ups zu kaufen.
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenPricing}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-sm"
              >
                Auf {upgradeTarget} upgraden
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Oder Credits einmalig nachkaufen
            </h3>
            <p className="text-xs text-muted mb-3">
              Gekaufte Credits rollieren unbegrenzt — bleiben erhalten bis du sie nutzt.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {packs.map((pack) => {
                const cents =
                  priceBand === 'community' ? pack.price_community_cents : pack.price_basic_cents
                const basicCents = pack.price_basic_cents
                const showStrike =
                  priceBand === 'community' && basicCents > cents
                return (
                  <button
                    key={pack.id}
                    onClick={() => buyPack(pack.id)}
                    disabled={loadingPack === pack.id}
                    className="p-3 rounded-xl border border-border bg-surface hover:border-primary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-sm font-semibold text-foreground">
                      +{pack.credits.toLocaleString('de-DE')} Credits
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      {showStrike && (
                        <span className="text-[10px] text-muted line-through">
                          {formatEuro(basicCents)} €
                        </span>
                      )}
                      <span className="text-base font-bold text-primary">
                        {formatEuro(cents)} €
                      </span>
                    </div>
                    {loadingPack === pack.id && (
                      <Loader2 size={12} className="animate-spin text-muted mt-1" />
                    )}
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600">
                {error}
              </div>
            )}

            <Link
              href="/dashboard/credits"
              className="block mt-3 text-xs text-muted hover:text-foreground text-center"
            >
              Alle Top-up-Optionen ansehen →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Ready-to-use PaywallBanner (inline auf Seiten) ───────────────────────

/**
 * Alternative zum Gate als Wrapper: ein Info-Banner, der oberhalb der
 * Aktion gerendert wird (z.B. über dem Chat-Input), mit Button der das
 * Pricing-Modal öffnet. Praktisch für Cases wo der Send-Button nicht
 * einfach umwickelbar ist.
 */
export function PaywallBanner({
  state,
  message = 'Zum Senden brauchst du ein aktives Abo.',
  onOpenPricing,
}: {
  state: SubscriptionGateState
  message?: string
  onOpenPricing: () => void
}) {
  if (state.hasActiveSubscription) return null

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Sparkles size={16} className="text-primary" />
      </div>
      <div className="flex-1 text-sm text-foreground">{message}</div>
      <button
        onClick={onOpenPricing}
        className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-lg text-xs"
      >
        Abo abschließen
        <ArrowRight size={12} />
      </button>
    </div>
  )
}
