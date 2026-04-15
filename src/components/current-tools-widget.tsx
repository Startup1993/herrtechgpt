'use client'

import { useState } from 'react'
import { deprecationsForAgent } from '@/lib/deprecations'

/**
 * Zeigt pro Agent die aktuell empfohlenen Tools vs. die veralteten Alternativen.
 * Standardmäßig eingeklappt — damit die Landing-Page nicht überladen wirkt.
 */
export function CurrentToolsWidget({ agentId }: { agentId: string }) {
  const [open, setOpen] = useState(false)
  const items = deprecationsForAgent(agentId)
  if (items.length === 0) return null

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-colors text-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">✨</span>
          <span className="font-medium text-foreground">
            Was ist aktuell? ({items.length} Tool{items.length === 1 ? '' : 's'})
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-border bg-surface overflow-hidden">
          <ul className="divide-y divide-border">
            {items.map((d, i) => (
              <li key={i} className="p-3">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="line-through text-muted">{d.deprecated}</span>
                  <span className="text-muted">→</span>
                  <span className="font-semibold text-foreground">{d.current}</span>
                </div>
                <p className="text-xs text-muted mt-1 leading-relaxed">{d.reason}</p>
              </li>
            ))}
          </ul>
          <div className="px-3 py-2 bg-surface-secondary/40 border-t border-border">
            <p className="text-xs text-muted">
              Diese Liste wird monatlich aktualisiert und fließt automatisch in alle Agent-Empfehlungen ein.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
