'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Video, Sparkles, ArrowRight } from 'lucide-react'
import { PricingModal } from '@/components/pricing-modal'
import type { SubscriptionGateState } from '@/components/subscription-gate'

/**
 * Pre-Gate für den Video-Creator. Weil der Video-Creator als externer Worker
 * (SSO-Redirect) läuft, können wir dort keinen In-UI-Paywall machen — wir müssen
 * schon vor dem SSO-Handshake stoppen und den User zum Abo-Abschluss schicken.
 */
export default function VideoCreatorGate({
  gateState,
}: {
  gateState: SubscriptionGateState
}) {
  const [pricingOpen, setPricingOpen] = useState(false)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/ki-toolbox"
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">KI Video Creator</h1>
      </div>

      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Video size={22} className="text-primary" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Abo nötig
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Video-Creator braucht ein aktives Abo
            </h2>
          </div>
        </div>

        <p className="text-sm text-muted leading-relaxed mb-5">
          Der KI Video Creator generiert komplette Videos aus Prompt, URL oder Upload —
          inklusive Szenen, Bilder, Voiceover und Export. Wegen der hohen Generierungs-
          kosten pro Video läuft er nur mit aktivem Plan.
        </p>

        <ul className="space-y-2 mb-6">
          {[
            'KI-generierte Szenen aus Text oder URL',
            'Bild- & Voiceover-Generation automatisch',
            'Credits pro generiertem Asset (Bild, Video-Sekunde, Voice)',
            'Export als MP4, Slide-Deck und mehr',
          ].map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-foreground">
              <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setPricingOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-sm"
          >
            Plan wählen
            <ArrowRight size={14} />
          </button>
          <Link
            href="/dashboard/ki-toolbox"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border text-foreground hover:border-primary hover:text-primary font-medium rounded-xl text-sm"
          >
            Zurück zur Toolbox
          </Link>
        </div>
      </div>

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        plans={gateState.plans}
        defaultPriceBand={gateState.priceBand}
        isCommunity={gateState.isCommunity}
        currentPlanId={gateState.currentPlanId}
        currentCycle={gateState.currentCycle}
        hasActiveSubscription={gateState.hasActiveSubscription}
      />
    </div>
  )
}
