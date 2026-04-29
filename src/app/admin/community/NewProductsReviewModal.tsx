'use client'

import { useState } from 'react'
import { Loader2, X, Plus, SkipForward } from 'lucide-react'

export type NewProduct = {
  id: string
  name: string
  created: number
  description: string | null
  price: {
    id: string | null
    amount: number | null
    currency: string
    recurring: 'month' | 'year' | 'week' | 'day' | null
  } | null
}

function formatPrice(p: NewProduct['price']): string {
  if (!p || p.amount == null) return '—'
  const amount = (p.amount / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  const currency = p.currency?.toUpperCase() === 'EUR' ? '€' : p.currency?.toUpperCase() + ' '
  const interval =
    p.recurring === 'month'
      ? '/Monat'
      : p.recurring === 'year'
      ? '/Jahr'
      : p.recurring === 'week'
      ? '/Woche'
      : ''
  return `${currency}${amount}${interval}`
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Pre-Sync-Modal: zeigt neue Stripe-Products, die noch nicht in der
 * skool_stripe_products-Whitelist stehen. User kann anhaken welche
 * mit-syncen sollen.
 *
 * - "Hinzufügen + Sync starten" — fügt ausgewählte hinzu, startet Sync
 * - "Ohne Hinzufügen syncen" — überspringt, startet Sync nur mit
 *   bestehenden Products
 * - "Abbrechen" — Sync wird komplett abgebrochen
 */
export function NewProductsReviewModal({
  products,
  onClose,
  onConfirm,
}: {
  products: NewProduct[]
  onClose: () => void
  onConfirm: (selectedProductIds: string[]) => Promise<void>
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(products.map((p) => p.id))
  ) // Default: alle ausgewählt
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === products.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map((p) => p.id)))
    }
  }

  async function handleConfirm(includeSelected: boolean) {
    setBusy(true)
    setError(null)
    try {
      await onConfirm(includeSelected ? [...selected] : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {products.length} neue Stripe-Produkte gefunden
            </h2>
            <p className="text-xs text-muted mt-1">
              Diese Produkte stehen noch nicht in der KMC-Whitelist. Wähle aus,
              welche beim Sync mit-importiert werden sollen.
            </p>
          </div>
          <button
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="p-1 rounded-md hover:bg-surface-hover text-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface-secondary">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-surface-hover transition"
          >
            {selected.size === products.length ? 'Keinen auswählen' : 'Alle auswählen'}
          </button>
          <div className="text-xs text-muted">
            {selected.size} von {products.length} ausgewählt
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {products.map((p) => {
            const isSelected = selected.has(p.id)
            return (
              <label
                key={p.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                  isSelected ? 'bg-primary/5' : 'hover:bg-surface-hover'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(p.id)}
                  className="mt-1 w-4 h-4 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-foreground truncate">
                      {p.name}
                    </div>
                    <div className="text-sm font-medium text-primary whitespace-nowrap">
                      {formatPrice(p.price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs text-muted font-mono">{p.id}</code>
                    <span className="text-xs text-muted">
                      Erstellt: {formatDate(p.created)}
                    </span>
                  </div>
                  {p.description && (
                    <div className="text-xs text-muted mt-1 line-clamp-1">
                      {p.description}
                    </div>
                  )}
                </div>
              </label>
            )
          })}
        </div>

        {error && (
          <div className="px-6 py-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-t border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 p-4 border-t border-border bg-surface-secondary">
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="px-4 py-2 rounded-lg border border-border hover:bg-surface-hover text-sm transition disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => handleConfirm(false)}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface-hover text-sm transition disabled:opacity-50"
            title="Sync starten ohne diese Produkte hinzuzufügen"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
            Ohne Hinzufügen syncen
          </button>
          <button
            type="button"
            onClick={() => handleConfirm(true)}
            disabled={busy || selected.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {selected.size} hinzufügen + Sync
          </button>
        </div>
      </div>
    </div>
  )
}
