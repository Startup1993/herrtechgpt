'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Check, X } from 'lucide-react'

type ProductRow = {
  stripe_product_id: string
  label: string
  access_days: number
  active: boolean
  notes: string | null
  created_at: string
}

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Neues Produkt
  const [newId, setNewId] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newDays, setNewDays] = useState(365)

  async function addProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!newId.trim() || !newLabel.trim()) return
    setBusy('new')
    setMessage(null)
    try {
      const res = await fetch('/api/admin/community/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_product_id: newId.trim(),
          label: newLabel.trim(),
          access_days: newDays,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ type: 'err', text: data?.error ?? 'Fehler' })
      } else {
        setMessage({ type: 'ok', text: 'Produkt hinzugefügt' })
        setNewId('')
        setNewLabel('')
        setNewDays(365)
        router.refresh()
      }
    } finally {
      setBusy(null)
    }
  }

  async function toggleActive(productId: string, active: boolean) {
    setBusy(productId)
    try {
      const res = await fetch('/api/admin/community/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripe_product_id: productId, active }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ type: 'err', text: data?.error ?? 'Fehler' })
      } else {
        router.refresh()
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={addProduct}
        className="bg-surface border border-border rounded-xl p-5 space-y-4"
      >
        <h2 className="font-semibold text-foreground">Neues Produkt hinzufügen</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted mb-1 block">Stripe Product-ID</label>
            <input
              type="text"
              placeholder="prod_xxx"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Label (intern)</label>
            <input
              type="text"
              placeholder="KI Marketing Club (€2.990)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Zugang (Tage)</label>
            <input
              type="number"
              value={newDays}
              onChange={(e) => setNewDays(parseInt(e.target.value, 10) || 365)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy === 'new' || !newId.trim() || !newLabel.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition disabled:opacity-50"
        >
          {busy === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Hinzufügen
        </button>
      </form>

      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg ${
            message.type === 'ok'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary border-b border-border">
            <tr className="text-left text-muted">
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Product-ID</th>
              <th className="px-4 py-3 font-medium">Tage</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Noch keine Produkte eingetragen.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.stripe_product_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground font-medium">{p.label}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">
                    {p.stripe_product_id}
                  </td>
                  <td className="px-4 py-3 text-muted">{p.access_days}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 text-xs ${
                        p.active
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${p.active ? 'bg-green-500' : 'bg-gray-400'}`}
                      />
                      {p.active ? 'Aktiv' : 'Deaktiviert'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleActive(p.stripe_product_id, !p.active)}
                      disabled={busy === p.stripe_product_id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border hover:bg-surface-hover transition disabled:opacity-50"
                    >
                      {busy === p.stripe_product_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : p.active ? (
                        <X className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {p.active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
