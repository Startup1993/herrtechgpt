/**
 * CreditStatusBar — kleine Anzeige für Tool-Pages, die zeigt wieviele
 * Credits der User hat und wann der nächste Refresh kommt.
 *
 * Benutzt von Karussell, Video-Editor, Video-Creator etc. — überall wo
 * Credits verbraucht werden.
 *
 * Verhalten:
 *   - Premium-User: zeigt "X Credits · Auto-Refresh am DD.MM."
 *   - Alumni: zeigt nur "X Credits · Credits nachkaufen →"
 *   - Basic: Component sollte gar nicht gerendert werden (siehe Caller)
 */

import Link from 'next/link'
import { Coins, Calendar } from 'lucide-react'

interface Props {
  credits: number
  nextCreditRefreshAt: string | null
  isCommunity: boolean
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
}: Props) {
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
