/**
 * CreditStatusBar — Hinweis-Leiste für Tool-Pages, sichtbar nur wenn das
 * aktuelle Guthaben für die nächste Aktion nicht reicht.
 *
 * Wenn `requiredCredits` gesetzt ist und `credits >= requiredCredits`, rendert
 * die Component nichts — der User soll nicht abgelenkt werden, wenn er einfach
 * weiterarbeiten kann. Die laufende Credit-Anzeige übernimmt der Header-Badge.
 */

import Link from 'next/link'
import { Coins, Calendar } from 'lucide-react'

interface Props {
  credits: number
  nextCreditRefreshAt: string | null
  isCommunity: boolean
  /** Credits, die für eine einzelne Aktion in diesem Tool fällig werden. */
  requiredCredits?: number
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
  })
}

export function CreditStatusBar({
  credits,
  nextCreditRefreshAt,
  isCommunity,
  requiredCredits,
}: Props) {
  // Bar zeigen wenn das Guthaben knapp wird — Puffer = 2× eine Aktion.
  // So sieht der User die Warnung BEVOR er beim nächsten Klick blockiert wird.
  // Ohne bekannte Cost: erst bei leerem Wallet anzeigen.
  const threshold = requiredCredits && requiredCredits > 0 ? requiredCredits * 2 : 1
  if (credits >= threshold) return null

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-foreground mb-4">
      <div className="flex items-center gap-1.5">
        <Coins size={14} className="text-primary" />
        <span className="font-semibold">
          {credits.toLocaleString('de-DE')} Credits
        </span>
      </div>

      {isCommunity && nextCreditRefreshAt && (
        <>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-muted">
            <Calendar size={12} />
            <span>
              Auto-Refresh am{' '}
              <strong className="text-foreground">{formatDate(nextCreditRefreshAt)}</strong>
            </span>
          </div>
        </>
      )}

      <div className="flex-1" />

      <Link
        href="/dashboard/credits"
        className="text-primary hover:text-primary-hover font-medium underline"
      >
        Credits nachkaufen
      </Link>
    </div>
  )
}
