'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Coins, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import type { CreditPack } from '@/lib/types'

type PriceBand = 'basic' | 'community'

interface Props {
  packs: CreditPack[]
  priceBand: PriceBand
  isCommunity: boolean
  currentBalance: number
  hasSubscription: boolean
  checkoutStatus: string | null
}

function formatEuro(cents: number): string {
  const euro = cents / 100
  return euro % 1 === 0 ? `${euro}` : euro.toFixed(2).replace('.', ',')
}

export default function CreditsClient({
  packs,
  priceBand,
  isCommunity,
  currentBalance,
  hasSubscription,
  checkoutStatus,
}: Props) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout(packId: string) {
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
        throw new Error(`Server-Fehler (${res.status}). Nochmal probieren.`)
      }
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout nicht möglich')
      window.location.href = data.url as string
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setLoadingPack(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/dashboard/account/billing"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} /> Zurück zur Abrechnung
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Credits nachkaufen</h1>
        <p className="text-sm text-muted">
          Monatliche Credits verbraucht? Hier kannst du zusätzliche Credits buchen —
          sie rollieren unbegrenzt und bleiben erhalten bis du sie nutzt.
        </p>
      </div>

      {checkoutStatus === 'success' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-6">
          <CheckCircle2 className="text-green-600 shrink-0" size={20} />
          <div>
            <div className="font-semibold text-foreground">Kauf erfolgreich!</div>
            <div className="text-sm text-muted">
              Deine Credits werden in wenigen Sekunden gutgeschrieben. Lade die Seite
              dann nochmal.
            </div>
          </div>
        </div>
      )}

      {/* Aktueller Stand */}
      <div className="rounded-2xl border border-border bg-surface p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins size={20} className="text-primary" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Aktueller Stand</div>
            <div className="text-2xl font-bold text-foreground">
              {currentBalance.toLocaleString('de-DE')}{' '}
              <span className="text-sm font-normal text-muted">Credits</span>
            </div>
          </div>
        </div>
      </div>

      {!hasSubscription && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6 text-sm">
          <strong className="text-foreground">Hinweis:</strong>{' '}
          <span className="text-muted">
            Du kannst Credits auch ohne Abo kaufen, aber um Herr Tech GPT + KI Toolbox zu
            nutzen brauchst du mindestens den <Link href="/dashboard/pricing" className="text-primary hover:underline">Starter-Plan</Link>.
          </span>
        </div>
      )}

      {/* Pack-Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {packs.map((pack, idx) => {
          const basicCents = pack.price_basic_cents
          const communityCents = pack.price_community_cents
          const displayCents = priceBand === 'community' ? communityCents : basicCents
          const pricePerCredit = pack.credits > 0 ? displayCents / pack.credits : 0
          const showStrike = priceBand === 'community' && basicCents > communityCents
          const featured = idx === 1 // mittleres Pack

          return (
            <div
              key={pack.id}
              className={`rounded-2xl p-5 flex flex-col ${
                featured
                  ? 'border-2 border-primary bg-surface'
                  : 'border border-border bg-surface'
              }`}
            >
              <div className="mb-3">
                <div className="text-xl font-bold text-foreground">
                  {pack.credits.toLocaleString('de-DE')}
                  <span className="text-sm font-normal text-muted ml-1">Credits</span>
                </div>
                <div className="text-xs text-muted mt-0.5">
                  rolliert unbegrenzt
                </div>
              </div>

              <div className="mb-5">
                {showStrike && (
                  <div className="text-xs text-muted line-through">
                    {formatEuro(basicCents)} €
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">
                    {formatEuro(displayCents)}
                  </span>
                  <span className="text-sm text-muted">€</span>
                </div>
                <div className="text-xs text-muted mt-0.5">
                  ≈ {pricePerCredit.toFixed(1)} ct / Credit
                </div>
              </div>

              <button
                onClick={() => startCheckout(pack.id)}
                disabled={loadingPack === pack.id}
                className={`w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 mt-auto ${
                  featured
                    ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                    : 'border border-border text-foreground hover:border-primary hover:text-primary'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingPack === pack.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Lade…
                  </>
                ) : (
                  'Kaufen'
                )}
              </button>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 mb-6">
          {error}
        </div>
      )}

      {!isCommunity && (
        <div className="text-center text-xs text-muted">
          <Link href="/dashboard/upgrade" className="text-primary hover:underline">
            Community-Mitglied werden
          </Link>{' '}
          und alle Pakete dauerhaft günstiger bekommen.
        </div>
      )}
    </div>
  )
}
