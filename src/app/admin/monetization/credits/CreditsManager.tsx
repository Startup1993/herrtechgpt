'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CreditPack, FeatureCreditCost } from '@/lib/types'

interface Props {
  initialPacks: CreditPack[]
  initialCosts: FeatureCreditCost[]
}

function centsToEuro(cents: number | null | undefined): string {
  if (cents == null) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}

function euroToCents(input: string): number {
  const normalized = input.replace(',', '.').trim()
  const num = parseFloat(normalized)
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

const UNIT_OPTIONS = [
  { value: 'action', label: 'pro Aktion' },
  { value: 'second', label: 'pro Sekunde' },
  { value: 'minute', label: 'pro Minute' },
  { value: '1000chars', label: 'pro 1.000 Zeichen' },
  { value: '30seconds', label: 'pro 30 Sekunden' },
]

const CATEGORY_OPTIONS = [
  { value: 'chat', label: 'Chat' },
  { value: 'toolbox', label: 'Toolbox' },
  { value: 'video', label: 'Video / Bild' },
]

export default function CreditsManager({ initialPacks, initialCosts }: Props) {
  const [tab, setTab] = useState<'costs' | 'packs'>('costs')

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6">
        <TabButton active={tab === 'costs'} onClick={() => setTab('costs')}>
          Credit-Kosten pro Aktion
        </TabButton>
        <TabButton active={tab === 'packs'} onClick={() => setTab('packs')}>
          Top-up-Pakete
        </TabButton>
      </div>

      {tab === 'costs' && <FeatureCostsSection initial={initialCosts} />}
      {tab === 'packs' && <PacksSection initial={initialPacks} />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'text-primary border-primary'
          : 'text-muted border-transparent hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Feature Costs ─────────────────────────────────────────────

function FeatureCostsSection({ initial }: { initial: FeatureCreditCost[] }) {
  const router = useRouter()
  const [costs, setCosts] = useState(initial)
  const [editing, setEditing] = useState<FeatureCreditCost | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(c: FeatureCreditCost) {
    setEditing({ ...c })
    setError(null)
  }

  function startNew() {
    setEditing({
      feature: '',
      label: '',
      credits_per_unit: 1,
      unit: 'action',
      category: 'toolbox',
      description: '',
      active: true,
      updated_at: '',
    })
    setError(null)
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/admin/feature-costs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    })

    setSaving(false)

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Speichern fehlgeschlagen')
      return
    }

    const updated: FeatureCreditCost = await res.json()
    setCosts((prev) => {
      const exists = prev.find((c) => c.feature === updated.feature)
      if (exists) return prev.map((c) => (c.feature === updated.feature ? updated : c))
      return [...prev, updated]
    })
    setEditing(null)
    router.refresh()
  }

  async function remove(feature: string) {
    if (!confirm(`Feature-Kosten für "${feature}" wirklich löschen?`)) return
    const res = await fetch(`/api/admin/feature-costs?feature=${encodeURIComponent(feature)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      alert('Löschen fehlgeschlagen')
      return
    }
    setCosts((prev) => prev.filter((c) => c.feature !== feature))
    router.refresh()
  }

  const grouped = costs.reduce<Record<string, FeatureCreditCost[]>>((acc, c) => {
    const cat = c.category || 'Sonstige'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Diese Werte entscheiden, wie viele Credits eine Aktion kostet. Änderungen wirken sofort
          — keine Deploys nötig.
        </p>
        <button
          onClick={startNew}
          className="text-sm px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover"
        >
          + Feature hinzufügen
        </button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-xs uppercase tracking-wider text-muted mb-2">{cat}</h3>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="text-left px-4 py-2 font-medium">Aktion</th>
                  <th className="text-left px-4 py-2 font-medium">Feature-Key</th>
                  <th className="text-right px-4 py-2 font-medium">Credits</th>
                  <th className="text-left px-4 py-2 font-medium">Einheit</th>
                  <th className="text-right px-4 py-2 font-medium w-32">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.feature} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <div className="text-foreground font-medium">{c.label}</div>
                      {c.description && (
                        <div className="text-xs text-muted">{c.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <code className="text-xs bg-surface-secondary px-2 py-0.5 rounded">
                        {c.feature}
                      </code>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-foreground">
                      {c.credits_per_unit}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {UNIT_OPTIONS.find((u) => u.value === c.unit)?.label ?? c.unit}
                    </td>
                    <td className="px-4 py-2 text-right space-x-1">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-xs px-2 py-1 rounded border border-border hover:border-primary hover:text-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(c.feature)}
                        className="text-xs px-2 py-1 rounded border border-border hover:border-red-500/40 hover:text-red-500"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {editing && (
        <EditModal
          title={initial.find((c) => c.feature === editing.feature) ? 'Kosten bearbeiten' : 'Feature anlegen'}
          onClose={() => setEditing(null)}
          onSave={save}
          saving={saving}
          error={error}
        >
          <Field
            label="Feature-Key (intern, z.B. 'carousel')"
            value={editing.feature}
            onChange={(v) => setEditing({ ...editing, feature: v.trim() })}
            disabled={!!initial.find((c) => c.feature === editing.feature)}
          />
          <Field
            label="Anzeigename (z.B. 'Carousel (7 Slides)')"
            value={editing.label}
            onChange={(v) => setEditing({ ...editing, label: v })}
          />
          <Field
            label="Beschreibung"
            value={editing.description ?? ''}
            onChange={(v) => setEditing({ ...editing, description: v })}
          />
          <Row>
            <NumberField
              label="Credits pro Einheit"
              value={editing.credits_per_unit}
              onChange={(n) => setEditing({ ...editing, credits_per_unit: n })}
            />
            <SelectField
              label="Einheit"
              value={editing.unit}
              onChange={(v) => setEditing({ ...editing, unit: v })}
              options={UNIT_OPTIONS}
            />
          </Row>
          <SelectField
            label="Kategorie"
            value={editing.category ?? 'toolbox'}
            onChange={(v) => setEditing({ ...editing, category: v })}
            options={CATEGORY_OPTIONS}
          />
          <CheckField
            label="Aktiv"
            value={editing.active}
            onChange={(v) => setEditing({ ...editing, active: v })}
          />
        </EditModal>
      )}
    </div>
  )
}

// ─── Credit Packs ─────────────────────────────────────────────

function PacksSection({ initial }: { initial: CreditPack[] }) {
  const router = useRouter()
  const [packs, setPacks] = useState(initial)
  const [editing, setEditing] = useState<CreditPack | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(p: CreditPack) {
    setEditing({ ...p })
    setError(null)
  }

  function startNew() {
    setEditing({
      id: '',
      name: '',
      credits: 0,
      price_basic_cents: 0,
      price_community_cents: 0,
      ablefy_product_basic: null,
      ablefy_product_community: null,
      expiry_months: 12,
      sort_order: (packs[packs.length - 1]?.sort_order ?? 0) + 1,
      active: true,
      created_at: '',
      updated_at: '',
    })
    setError(null)
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/admin/credit-packs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    })

    setSaving(false)

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Speichern fehlgeschlagen')
      return
    }

    const updated: CreditPack = await res.json()
    setPacks((prev) => {
      const exists = prev.find((p) => p.id === updated.id)
      if (exists) return prev.map((p) => (p.id === updated.id ? updated : p))
      return [...prev, updated].sort((a, b) => a.sort_order - b.sort_order)
    })
    setEditing(null)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm(`Pack "${id}" wirklich löschen?`)) return
    const res = await fetch(`/api/admin/credit-packs?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      alert('Löschen fehlgeschlagen')
      return
    }
    setPacks((prev) => prev.filter((p) => p.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Top-up-Pakete, die User auf /dashboard/credits kaufen können wenn ihr Monatskontingent
          leer ist. Gekaufte Credits rollieren {packs[0]?.expiry_months ?? 12} Monate.
        </p>
        <button
          onClick={startNew}
          className="text-sm px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover"
        >
          + Paket hinzufügen
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="text-left px-4 py-2 font-medium">Paket</th>
              <th className="text-right px-4 py-2 font-medium">Credits</th>
              <th className="text-right px-4 py-2 font-medium">Basic</th>
              <th className="text-right px-4 py-2 font-medium">Community</th>
              <th className="text-right px-4 py-2 font-medium">ct / Credit</th>
              <th className="text-left px-4 py-2 font-medium">Ablefy</th>
              <th className="text-right px-4 py-2 font-medium w-32">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {packs.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <div className="text-foreground font-medium">{p.name}</div>
                  <code className="text-xs text-muted">{p.id}</code>
                </td>
                <td className="px-4 py-2 text-right font-semibold">
                  {p.credits.toLocaleString('de-DE')}
                </td>
                <td className="px-4 py-2 text-right">{centsToEuro(p.price_basic_cents)} €</td>
                <td className="px-4 py-2 text-right">{centsToEuro(p.price_community_cents)} €</td>
                <td className="px-4 py-2 text-right text-xs text-muted">
                  {p.credits > 0
                    ? `${(p.price_basic_cents / p.credits).toFixed(1)} / ${(p.price_community_cents / p.credits).toFixed(1)}`
                    : '—'}
                </td>
                <td className="px-4 py-2 text-xs">
                  {p.ablefy_product_basic && p.ablefy_product_community ? (
                    <span className="text-green-600">✓ verknüpft</span>
                  ) : (
                    <span className="text-amber-600">⚠ fehlt</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right space-x-1">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs px-2 py-1 rounded border border-border hover:border-primary hover:text-primary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-xs px-2 py-1 rounded border border-border hover:border-red-500/40 hover:text-red-500"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {packs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Noch keine Top-up-Pakete angelegt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal
          title={initial.find((p) => p.id === editing.id) ? 'Pack bearbeiten' : 'Pack anlegen'}
          onClose={() => setEditing(null)}
          onSave={save}
          saving={saving}
          error={error}
        >
          <Row>
            <Field
              label="Pack-ID (z.B. 'pack_500')"
              value={editing.id}
              onChange={(v) => setEditing({ ...editing, id: v.trim() })}
              disabled={!!initial.find((p) => p.id === editing.id)}
            />
            <Field
              label="Name (z.B. '+500 Credits')"
              value={editing.name}
              onChange={(v) => setEditing({ ...editing, name: v })}
            />
          </Row>
          <Row>
            <NumberField
              label="Credits"
              value={editing.credits}
              onChange={(n) => setEditing({ ...editing, credits: n })}
            />
            <NumberField
              label="Gültigkeit (Monate)"
              value={editing.expiry_months}
              onChange={(n) => setEditing({ ...editing, expiry_months: n })}
            />
          </Row>
          <Row>
            <EuroField
              label="Preis Basic (€)"
              cents={editing.price_basic_cents}
              onChange={(c) => setEditing({ ...editing, price_basic_cents: c })}
            />
            <EuroField
              label="Preis Community (€)"
              cents={editing.price_community_cents}
              onChange={(c) => setEditing({ ...editing, price_community_cents: c })}
            />
          </Row>
          <Row>
            <Field
              label="Ablefy-Produkt Basic"
              value={editing.ablefy_product_basic ?? ''}
              onChange={(v) => setEditing({ ...editing, ablefy_product_basic: v || null })}
            />
            <Field
              label="Ablefy-Produkt Community"
              value={editing.ablefy_product_community ?? ''}
              onChange={(v) => setEditing({ ...editing, ablefy_product_community: v || null })}
            />
          </Row>
          <Row>
            <NumberField
              label="Sort-Order"
              value={editing.sort_order}
              onChange={(n) => setEditing({ ...editing, sort_order: n })}
            />
            <CheckField
              label="Aktiv"
              value={editing.active}
              onChange={(v) => setEditing({ ...editing, active: v })}
            />
          </Row>
        </EditModal>
      )}
    </div>
  )
}

// ─── Modal + Fields ─────────────────────────────────────────────

function EditModal({
  title,
  children,
  onClose,
  onSave,
  saving,
  error,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  onSave: () => void
  saving: boolean
  error: string | null
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background border border-border rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-3">{children}</div>
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? 'Speichere...' : 'Speichern'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  )
}

function EuroField({
  label,
  cents,
  onChange,
}: {
  label: string
  cents: number
  onChange: (c: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={centsToEuro(cents)}
        onChange={(e) => onChange(euroToCents(e.target.value))}
        className="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function CheckField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 self-end pb-2">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  )
}
